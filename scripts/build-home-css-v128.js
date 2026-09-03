'use strict';

// APG v128.2 build-time Home CSS consolidation.
// This script performs no live internet requests. It renders the maintained SSR Home page,
// reads static CSS from source and generated CSS through APG's own handler, preserves exact
// cascade order and link-level media conditions, rewrites relative asset URLs, then writes one
// deterministic static bundle. Recommendation, evidence, retailer and shopper state are untouched.
process.env.APG_V128_BUILDING_HOME_BUNDLE='1';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const app=require('../api/index');

const ORIGIN='https://australianproductguide.au';
const VERSION='128.2.1';
const ROOT=path.join(__dirname,'..');
const OUTPUT_PATH=path.join(ROOT,'public','assets','apg-home-v128.css');
const MANIFEST_PATH=path.join(ROOT,'artifacts','google-discoverability-v128-build','home-css-manifest.json');
const MIN_STYLES=24;
const MIN_BYTES=50*1024;

function clean(value){return String(value==null?'':value).trim();}
function attr(tag,name){
  const match=String(tag).match(new RegExp('\\b'+name+'\\s*=\\s*(["\\\'])([\\s\\S]*?)\\1','i'));
  return match?match[2].replace(/&amp;/g,'&'):'';
}
function render(url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers=new Map();
    const chunks=[];
    let settled=false;
    const req={url,method,headers:{host:'australianproductguide.au'},on(){return this;},destroy(){}};
    const res={
      statusCode:200,
      setHeader(name,value){headers.set(String(name).toLowerCase(),value);},
      getHeader(name){return headers.get(String(name).toLowerCase());},
      removeHeader(name){headers.delete(String(name).toLowerCase());},
      writeHead(status,values){this.statusCode=status;if(values)for(const [key,value] of Object.entries(values))this.setHeader(key,value);return this;},
      write(body){if(body)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));return true;},
      end(body=''){if(settled)return this;settled=true;if(body)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));resolve({status:Number(this.statusCode||200),headers,body:Buffer.concat(chunks).toString('utf8')});return this;},
      status(status){this.statusCode=status;return this;},
      send(body){return this.end(body);},
      json(value){this.setHeader('Content-Type','application/json; charset=utf-8');return this.end(JSON.stringify(value));}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject);}catch(error){reject(error);}
    const timer=setTimeout(()=>{if(!settled)reject(new Error(`Timed out rendering ${url}`));},20000);
    if(typeof timer.unref==='function')timer.unref();
  });
}
function stylesheetLinks(html){
  const head=(String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)||[])[1]||'';
  const rows=[];
  for(const match of head.matchAll(/<link\b[^>]*>/gi)){
    const tag=match[0];
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/);
    if(!rel.includes('stylesheet'))continue;
    const href=attr(tag,'href');
    if(!href)continue;
    let url;
    try{url=new URL(href,ORIGIN);}catch{continue;}
    if(url.origin!==ORIGIN||!url.pathname.startsWith('/assets/')||url.pathname==='/assets/apg-home-v128.css')continue;
    rows.push({href:url.pathname+url.search,pathname:url.pathname,media:attr(tag,'media')});
  }
  return rows;
}
function rewriteUrls(css,href){
  const base=new URL(href,ORIGIN);
  return String(css).replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(all,quote,raw)=>{
    const value=clean(raw);
    if(!value||value.startsWith('#')||value.startsWith('data:')||value.startsWith('blob:')||/^https?:/i.test(value)||value.startsWith('//'))return all;
    let resolved;
    try{resolved=new URL(value,base);}catch{return all;}
    if(resolved.origin!==ORIGIN)return all;
    return `url("${resolved.pathname}${resolved.search}${resolved.hash}")`;
  });
}
function stripCharset(css){return String(css).replace(/^\s*@charset\s+["'][^"']+["'];?\s*/i,'');}
function hash(value){return crypto.createHash('sha256').update(value).digest('hex');}
async function cssSource(row){
  const staticPath=path.join(ROOT,'public',row.pathname.replace(/^\/+/,''));
  if(fs.existsSync(staticPath)&&fs.statSync(staticPath).isFile())return {body:fs.readFileSync(staticPath,'utf8'),source:'source-file'};
  const response=await render(row.href);
  const type=clean(response.headers.get('content-type')).toLowerCase();
  if(response.status!==200)throw new Error(`${row.href} returned HTTP ${response.status}`);
  if(!type.includes('text/css'))throw new Error(`${row.href} returned ${type||'unknown content type'}`);
  return {body:response.body,source:'generated-handler'};
}

async function main(){
  const home=await render('/');
  if(home.status!==200)throw new Error(`Home render returned HTTP ${home.status}`);
  const links=stylesheetLinks(home.body);
  if(links.length<MIN_STYLES)throw new Error(`Expected at least ${MIN_STYLES} Home stylesheets, found ${links.length}`);

  const parts=[`/* Australian Product Guide Home CSS bundle v${VERSION}.\n * Generated deterministically from maintained same-origin stylesheets.\n * Do not edit directly; run scripts/build-home-css-v128.js.\n */\n`];
  const manifest=[];
  for(const row of links){
    const source=await cssSource(row);
    if(!source.body.trim())throw new Error(`${row.href} returned empty CSS`);
    if(/@import\s/i.test(source.body))throw new Error(`${row.href} contains unsupported @import`);
    let css=stripCharset(rewriteUrls(source.body,row.href));
    if(row.media&&row.media.toLowerCase()!=='all')css=`@media ${row.media}{\n${css}\n}`;
    parts.push(`\n/* source: ${row.href}${row.media?` media=${row.media}`:''} */\n${css}\n`);
    manifest.push({href:row.href,pathname:row.pathname,media:row.media||null,source:source.source,bytes:Buffer.byteLength(source.body),sha256:hash(source.body)});
  }

  // Measured mobile Lighthouse contrast correction: 4.45:1 to comfortably above WCAG AA.
  parts.push('\n/* v128.2.1 measured WCAG contrast correction */\n.apg-home-category-index-v109__list a{color:#475569}\n');
  const output=parts.join('');
  if(Buffer.byteLength(output)<MIN_BYTES)throw new Error(`Generated bundle unexpectedly small: ${Buffer.byteLength(output)} bytes`);

  fs.mkdirSync(path.dirname(OUTPUT_PATH),{recursive:true});
  fs.mkdirSync(path.dirname(MANIFEST_PATH),{recursive:true});
  fs.writeFileSync(OUTPUT_PATH,output);
  fs.writeFileSync(MANIFEST_PATH,JSON.stringify({
    version:VERSION,
    generatedAt:new Date().toISOString(),
    source:'maintained SSR Home and same-origin APG CSS',
    internetRequests:0,
    stylesheetCount:manifest.length,
    exactCascadeOrder:true,
    output:{path:path.relative(ROOT,OUTPUT_PATH),bytes:Buffer.byteLength(output),sha256:hash(output)},
    stylesheets:manifest
  },null,2)+'\n');
  console.log(`APG_HOME_CSS_BUNDLE_V128=PASS version=${VERSION} styles=${manifest.length} bytes=${Buffer.byteLength(output)} sha256=${hash(output).slice(0,16)} externalNetwork=0 exactCascade=1`);
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
