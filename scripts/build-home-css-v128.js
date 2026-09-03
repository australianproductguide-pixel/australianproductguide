'use strict';

// Build-time homepage CSS consolidation for APG v128.3.
//
// This script runs outside the public request path. It starts the exact source runtime with the
// bundle disabled, renders Home once, retrieves each applied first-party stylesheet in final
// cascade order, preserves link-level media conditions, resolves relative asset URLs and writes
// one deterministic static CSS asset. It never recursively invokes the application from a live
// response and it never changes recommendation, evidence, retailer or shopper state.

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const pagespeed=require('../lib/pagespeed-agentic-certification-v113-runtime');

const ROOT=path.resolve(__dirname,'..');
const OUTPUT=path.join(ROOT,'public','assets','home-v128-bundle.css');
const HOST='127.0.0.1';
const PORT=Number(process.env.APG_HOME_CSS_BUILD_PORT||4387);
const BASE=`http://${HOST}:${PORT}`;
const MIN_STYLESHEETS=40;
const MIN_BYTES=250000;

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
async function build(){
  fs.mkdirSync(path.dirname(OUTPUT),{recursive:true});
  try{fs.rmSync(OUTPUT,{force:true});}catch{}

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
    const banner='/* Australian Product Guide — deterministic build-time Home CSS bundle v128.3. Source order and media semantics preserved. */\n';
    const body=banner+chunks.join('\n\n')+'\n';
    if(Buffer.byteLength(body)<MIN_BYTES)throw new Error(`bundle unexpectedly small: ${Buffer.byteLength(body)} bytes`);
    for(const token of ['.site-header','.apg-home-hero-v9','.apg-ebay-official-v121-card','#apgAssistantLauncher']){
      if(!body.includes(token))throw new Error(`bundle missing required presentation token ${token}`);
    }
    const temporary=OUTPUT+'.tmp';
    fs.writeFileSync(temporary,body,'utf8');
    fs.renameSync(temporary,OUTPUT);
    const hash=crypto.createHash('sha256').update(body).digest('hex');
    console.log(`APG_HOME_CSS_BUNDLE_V128=PASS styles=${links.length} bytes=${Buffer.byteLength(body)} sha256=${hash}`);
  }finally{
    if(child.exitCode==null)child.kill('SIGTERM');
  }
}

build().catch(error=>{
  try{fs.rmSync(OUTPUT,{force:true});}catch{}
  console.error(error&&error.stack||error);
  process.exit(1);
});
