'use strict';

// Build-time homepage CSS consolidation for APG v128.2.
//
// This script runs outside every public request. It renders the exact local application handler
// with a fixed, synthetic Production request, then reads each first-party stylesheet from the
// repository or its deterministic local asset route. It performs no network requests, preserves
// final cascade order and link-level media conditions, resolves relative asset URLs, applies a
// conservative syntax-aware compaction pass and writes one static CSS asset plus deterministic
// Brotli/gzip sidecars. A stale or incomplete bundle fails the runtime signature check and the
// public site falls back to the established stylesheet cascade.

process.env.APG_HOME_CSS_BUILD='1';

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
const pagespeed=require('../lib/pagespeed-agentic-certification-v113-runtime');
const cssCompact=require('../lib/css-safe-compact-v128');
const app=require('../api/index');

const ROOT=path.resolve(__dirname,'..');
const PUBLIC_ROOT=path.join(ROOT,'public');
const OUTPUT=path.join(PUBLIC_ROOT,'assets','home-v128-bundle.css');
const BROTLI_OUTPUT=OUTPUT+'.br';
const GZIP_OUTPUT=OUTPUT+'.gz';
const ORIGIN='https://australianproductguide.au';
const MIN_STYLESHEETS=40;
const MIN_BYTES=250000;
const MAX_COMPACT_RATIO=0.99;
const BROTLI_QUALITY=11;
const RENDER_TIMEOUT_MS=20000;

function attr(tag,name){
  const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?match[2]:'';
}
function internalCss(href){
  try{
    const url=new URL(href,ORIGIN);
    return url.origin===ORIGIN&&url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.css');
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
function publicFileFor(href){
  let url;
  try{url=new URL(String(href||''),ORIGIN);}catch{return null;}
  if(url.origin!==ORIGIN||!url.pathname.startsWith('/assets/')||!url.pathname.endsWith('.css'))return null;
  let pathname;
  try{pathname=decodeURIComponent(url.pathname).replace(/(\.[a-z0-9]{1,12})\/$/i,'$1');}catch{return null;}
  const candidate=path.resolve(PUBLIC_ROOT,'.'+pathname);
  if(candidate!==PUBLIC_ROOT&&!candidate.startsWith(PUBLIC_ROOT+path.sep))return null;
  try{return fs.statSync(candidate).isFile()?candidate:null;}catch{return null;}
}
function localResponse(resolve,reject,timer){
  const headers=new Map();
  const chunks=[];
  let ended=false;
  return {
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);},
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){headers.delete(String(name).toLowerCase());},
    write(chunk='',encoding,callback){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      return true;
    },
    end(chunk='',encoding,callback){
      if(ended)return this;
      ended=true;
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      clearTimeout(timer);
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      resolve({status:this.statusCode,headers,body:Buffer.concat(chunks).toString('utf8')});
      return this;
    },
    status(code){this.statusCode=Number(code)||500;return this;},
    json(value){this.setHeader('Content-Type','application/json; charset=utf-8');return this.end(JSON.stringify(value));}
  };
}
function renderLocal(url){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error(`local render timed out for ${url}`)),RENDER_TIMEOUT_MS);
    const req={
      method:'GET',url:String(url||'/'),
      headers:{host:'australianproductguide.au','x-forwarded-host':'australianproductguide.au','x-forwarded-proto':'https'},
      on(){return this;},destroy(){}
    };
    const res=localResponse(resolve,reject,timer);
    try{
      const result=app(req,res);
      if(result&&typeof result.then==='function')result.catch(error=>{clearTimeout(timer);reject(error);});
    }catch(error){clearTimeout(timer);reject(error);}
  });
}
async function cssSource(row){
  const filename=publicFileFor(row.href);
  let raw;
  if(filename){
    raw=fs.readFileSync(filename,'utf8');
  }else{
    const rendered=await renderLocal(row.href);
    if(rendered.status!==200)throw new Error(`${row.href} returned HTTP ${rendered.status}`);
    const type=String(rendered.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/css'))throw new Error(`${row.href} returned ${type||'unknown content type'}`);
    raw=rendered.body;
  }
  const clean=stripUnsafePreamble(raw);
  if(!clean.trim())throw new Error(`${row.href} returned empty CSS`);
  if(/@import\s/i.test(clean))throw new Error(`${row.href} contains @import and cannot be safely consolidated`);
  const resolved=pagespeed.absoluteCssUrls(clean,row.href);
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
  const home=await renderLocal('/');
  if(home.status!==200)throw new Error(`Home returned HTTP ${home.status}`);
  const links=stylesheetLinks(home.body);
  if(links.length<MIN_STYLESHEETS)throw new Error(`expected at least ${MIN_STYLESHEETS} applied Home stylesheets, found ${links.length}`);

  const chunks=[];
  for(const row of links)chunks.push(await cssSource(row));
  const signature=crypto.createHash('sha256').update(JSON.stringify(links)).digest('hex');
  const banner=`/* Australian Product Guide - deterministic build-time Home CSS bundle v128.2. Source order and media semantics preserved. */\n/* APG_HOME_CSS_LINK_SIGNATURE:${signature} */\n`;
  const expandedCss=chunks.join('\n\n');
  const compactedCss=cssCompact.compactCss(expandedCss);
  const expandedBytes=Buffer.byteLength(banner+expandedCss+'\n','utf8');
  const body=banner+compactedCss+'\n';
  const buffer=Buffer.from(body,'utf8');
  if(buffer.length<MIN_BYTES)throw new Error(`bundle unexpectedly small: ${buffer.length} bytes`);
  if(buffer.length>=expandedBytes*MAX_COMPACT_RATIO)throw new Error(`bundle compaction below one percent: expanded=${expandedBytes} compact=${buffer.length}`);
  for(const token of ['.site-header','.apg-home-hero-v9','.apg-ebay-official-v121-card','#apgAssistantLauncher']){
    if(!body.includes(token))throw new Error(`bundle missing required presentation token ${token}`);
  }
  const compressed=compressedSidecars(buffer);
  if(compressed.br.length>=buffer.length||compressed.gzip.length>=buffer.length)throw new Error('compressed Home bundle sidecar is not smaller than source');
  atomicWrite(OUTPUT,buffer);
  atomicWrite(BROTLI_OUTPUT,compressed.br);
  atomicWrite(GZIP_OUTPUT,compressed.gzip);
  const hash=crypto.createHash('sha256').update(buffer).digest('hex');
  const compactRatio=(buffer.length/expandedBytes).toFixed(4);
  console.log(`APG_HOME_CSS_BUNDLE_V128=PASS styles=${links.length} expandedBytes=${expandedBytes} bytes=${buffer.length} compactRatio=${compactRatio} br=${compressed.br.length} gzip=${compressed.gzip.length} linkSignature=${signature} sha256=${hash}`);
}

build().catch(error=>{
  removeOutputs();
  console.error(error&&error.stack||error);
  process.exit(1);
});
