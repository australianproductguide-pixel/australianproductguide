'use strict';

// Build-time homepage CSS consolidation for APG v128.2.
//
// This script runs outside the public request path. It starts the exact source runtime with the
// bundle disabled, renders Home once, retrieves each applied first-party stylesheet in final
// cascade order, preserves link-level media conditions, resolves relative asset URLs and writes
// one deterministic static CSS asset. It never recursively invokes the application from a live
// response and it never changes recommendation, evidence, retailer or shopper state.
//
// The exact loopback release harness also receives deterministic Brotli and gzip sidecars. Those
// files let Lighthouse exercise CDN-like precompressed delivery without spending page-load time
// compressing a static 500+ KiB asset. Vercel continues to own compression in Production.

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const {spawn}=require('node:child_process');
const pagespeed=require('../lib/pagespeed-agentic-certification-v113-runtime');

const ROOT=path.resolve(__dirname,'..');
const OUTPUT=path.join(ROOT,'public','assets','home-v128-bundle.css');
const BROTLI_OUTPUT=OUTPUT+'.br';
const GZIP_OUTPUT=OUTPUT+'.gz';
const HOST='127.0.0.1';
const PORT=Number(process.env.APG_HOME_CSS_BUILD_PORT||4387);
const BASE=`http://${HOST}:${PORT}`;
const MIN_STYLESHEETS=40;
const MIN_BYTES=250000;
const BROTLI_QUALITY=11;

function attr(tag,name){
  const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?match[2]:'';
}
function internalCss(href){
  try{
    const url=new URL(href,'https://australianproductguide.au');
    return url.origin==='https://australianproductguide.au'&&url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.css');
  }catch{return false;}
}
function stylesheetLinks(html){
  const head=(String(html||'').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)||[])[1]||'';
  const active=head.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,'');
  if(/<style\b/i.test(active))throw new Error('Home contains an inline style block; exact cascade consolidation requires explicit review');
  const links=[];
  for(const match of active.matchAll(/<link\b[^>]*>/gi)){
    const tag=match[0];
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/).filter(Boolean);
    const href=attr(tag,'href');
    if(!rel.includes('stylesheet')||!internalCss(href))continue;
    const onload=attr(tag,'onload');
    const declaredMedia=attr(tag,'media').trim();
    const media=/this\.media\s*=\s*['"](?:all|screen)['"]/i.test(onload)?'':declaredMedia;
    links.push({href,media});
  }
  return links;
}
function stripUnsafePreamble(css){
  return String(css||'')
    .replace(/^\uFEFF/,'')
    .replace(/@charset\s+["'][^"']+["']\s*;?/gi,'')
    .replace(/\/\*#\s*sourceMappingURL=[\s\S]*?\*\//gi,'');
}
function wrapMedia(css,media){
  const value=String(media||'').trim();
  if(!value||/^(?:all|screen)$/i.test(value))return css;
  return `@media ${value}{\n${css}\n}`;
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitForRuntime(child){
  let output='';
  child.stdout.on('data',chunk=>{output+=String(chunk);});
  child.stderr.on('data',chunk=>{output+=String(chunk);});
  for(let attempt=0;attempt<80;attempt+=1){
    if(child.exitCode!=null)throw new Error(`bundle source runtime exited early (${child.exitCode})\n${output}`);
    try{
      const response=await fetch(BASE+'/',{headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(2500)});
      if(response.ok)return {response,html:await response.text(),output};
    }catch{}
    await wait(250);
  }
  throw new Error(`bundle source runtime did not become ready\n${output}`);
}
async function fetchCss(row){
  const response=await fetch(BASE+row.href,{headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(15000)});
  if(response.status!==200)throw new Error(`${row.href} returned HTTP ${response.status}`);
  const type=String(response.headers.get('content-type')||'').toLowerCase();
  if(!type.includes('text/css'))throw new Error(`${row.href} returned ${type||'unknown content type'}`);
  const raw=stripUnsafePreamble(await response.text());
  if(!raw.trim())throw new Error(`${row.href} returned empty CSS`);
  if(/@import\s/i.test(raw))throw new Error(`${row.href} contains @import and cannot be safely consolidated`);
  const resolved=pagespeed.absoluteCssUrls(raw,row.href);
  return `/* APG source: ${row.href}${row.media?` | media: ${row.media}`:''} */\n${wrapMedia(resolved,row.media)}`;
}
function removeOutputs(){
  for(const filename of [OUTPUT,BROTLI_OUTPUT,GZIP_OUTPUT,OUTPUT+'.tmp',BROTLI_OUTPUT+'.tmp',GZIP_OUTPUT+'.tmp']){
    try{fs.rmSync(filename,{force:true});}catch{}
  }
}
function atomicWrite(filename,bytes){
  const temporary=filename+'.tmp';
  fs.writeFileSync(temporary,bytes);
  fs.renameSync(temporary,filename);
}
function compressedSidecars(buffer){
  const br=zlib.brotliCompressSync(buffer,{params:{
    [zlib.constants.BROTLI_PARAM_QUALITY]:BROTLI_QUALITY,
    [zlib.constants.BROTLI_PARAM_MODE]:zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]:buffer.length
  }});
  const gzip=zlib.gzipSync(buffer,{level:9});
  return {br,gzip};
}
async function build(){
  fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});
  removeOutputs();

  const child=spawn(process.execPath,[path.join(ROOT,'scripts','pr-runtime-server-v109.js')],{
    cwd:ROOT,
    env:{...process.env,HOST,PORT:String(PORT),APG_HOME_CSS_BUILD:'1'},
    stdio:['ignore','pipe','pipe']
  });

  try{
    const ready=await waitForRuntime(child);
    const links=stylesheetLinks(ready.html);
    if(links.length<MIN_STYLESHEETS)throw new Error(`expected at least ${MIN_STYLESHEETS} applied Home stylesheets, found ${links.length}`);

    const chunks=[];
    for(const row of links)chunks.push(await fetchCss(row));
    const signature=crypto.createHash('sha256').update(JSON.stringify(links)).digest('hex');
    const banner=`/* Australian Product Guide — deterministic build-time Home CSS bundle v128.2. Source order and media semantics preserved. */\n/* APG_HOME_CSS_LINK_SIGNATURE:${signature} */\n`;
    const body=banner+chunks.join('\n\n')+'\n';
    const buffer=Buffer.from(body,'utf8');
    if(buffer.length<MIN_BYTES)throw new Error(`bundle unexpectedly small: ${buffer.length} bytes`);
    for(const token of ['.site-header','.apg-home-hero-v9','.apg-ebay-official-v121-card','#apgAssistantLauncher']){
      if(!body.includes(token))throw new Error(`bundle missing required presentation token ${token}`);
    }
    const compressed=compressedSidecars(buffer);
    if(compressed.br.length>=buffer.length||compressed.gzip.length>=buffer.length)throw new Error('compressed Home bundle sidecar is not smaller than source');
    atomicWrite(OUTPUT,buffer);
    atomicWrite(BROTLI_OUTPUT,compressed.br);
    atomicWrite(GZIP_OUTPUT,compressed.gzip);
    const hash=crypto.createHash('sha256').update(buffer).digest('hex');
    console.log(`APG_HOME_CSS_BUNDLE_V128=PASS styles=${links.length} bytes=${buffer.length} br=${compressed.br.length} gzip=${compressed.gzip.length} linkSignature=${signature} sha256=${hash}`);
  }finally{
    if(child.exitCode==null)child.kill('SIGTERM');
  }
}

build().catch(error=>{
  removeOutputs();
  console.error(error&&error.stack||error);
  process.exit(1);
});
