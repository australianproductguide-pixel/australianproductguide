'use strict';

const fs=require('node:fs');
const pathModule=require('node:path');

// APG PageSpeed + Agentic Delivery Certification v113.2
// Transport-only optimisation around the final Whole-Site v109 response. It does not
// score, rank, persist shopper state or alter recommendation/retailer logic. It:
// - collapses only genuinely render-blocking homepage styles into one immutable asset;
// - preserves preload/print/noscript noncritical delivery and the existing CSS cascade;
// - reads source-controlled static CSS from the bundled Vercel function and falls back to
//   the established runtime handler for generated CSS;
// - gives versioned generated assets immutable cache lifetimes;
// - removes a redundant aria-hidden write from Scout's natively hidden dialog so
//   Lighthouse's agent accessibility tree does not expose hidden focusable descendants.

const ORIGIN='https://australianproductguide.au';
const VERSION='113.2';
const CSS_PATH='/assets/pagespeed-home-v113.css';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev')
  .replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||'dev';
const PREMIUM_JS_PATH='/assets/premium-experience-v107.js';
const REDUNDANT_SCOUT_ARIA="setAria(panel,'aria-hidden',panel.hidden);";
const SAFE_SCOUT_ARIA="panel.removeAttribute('aria-hidden');";

let installed=false;
let cachedHomeCss=null;
let cachedHomeCssSignature='';

function requestUrl(req){
  try{return new URL(req?.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}
}
function attr(tag,name){
  const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?match[2]:'';
}
function stylesheetLinks(html){
  const out=[];
  for(const match of String(html||'').matchAll(/<link\b[^>]*>/gi)){
    const tag=match[0],rel=attr(tag,'rel').toLowerCase().split(/\s+/),href=attr(tag,'href');
    if(rel.includes('stylesheet')&&href)out.push({tag,href,index:match.index});
  }
  return out;
}
function internalCssHref(href){
  try{
    const u=new URL(href,ORIGIN);
    return u.origin===ORIGIN&&u.pathname.startsWith('/assets/')&&u.pathname.endsWith('.css');
  }catch{return false}
}
function blockingStylesheetLinks(html){
  const source=String(html||'');
  const masked=source.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,block=>' '.repeat(block.length));
  const out=[];
  for(const match of masked.matchAll(/<link\b[^>]*>/gi)){
    const index=match.index||0,tag=source.slice(index,index+match[0].length),rel=attr(tag,'rel').toLowerCase().split(/\s+/),href=attr(tag,'href');
    if(!rel.includes('stylesheet')||!href||!internalCssHref(href))continue;
    const media=attr(tag,'media').trim().toLowerCase();
    if(media&&media!=='all'&&media!=='screen')continue;
    out.push({tag,href,index});
  }
  return out;
}
function bundledStaticCss(url){
  let u;
  try{u=new URL(url,ORIGIN)}catch{return null}
  if(u.origin!==ORIGIN||!u.pathname.startsWith('/assets/')||!u.pathname.endsWith('.css'))return null;
  const relative=u.pathname.replace(/^\/+/, '');
  const publicRoot=pathModule.resolve(process.cwd(),'public');
  const filename=pathModule.resolve(publicRoot,relative);
  if(filename!==publicRoot&&!filename.startsWith(publicRoot+pathModule.sep))return null;
  try{
    const body=fs.readFileSync(filename,'utf8');
    if(!body.trim())return null;
    return {statusCode:200,headers:new Map([['content-type','text/css; charset=utf-8']]),body};
  }catch{return null}
}
function fakeRequest(url){
  return {url,method:'GET',headers:{host:'australianproductguide.au','x-forwarded-host':'australianproductguide.au'}};
}
function capture(handler,url,depth=0){
  if(depth>5)throw new Error(`too many internal redirects while capturing ${url}`);
  const bundled=bundledStaticCss(url);
  if(bundled)return bundled;
  let body='',ended=false;
  const headers=new Map();
  const res={
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this},
    getHeader(name){return headers.get(String(name).toLowerCase())},
    removeHeader(name){headers.delete(String(name).toLowerCase())},
    write(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return true},
    end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);ended=true;return body}
  };
  const result=handler(fakeRequest(url),res);
  if(result&&typeof result.then==='function'&&!ended)throw new Error(`capture requires asynchronous completion for ${url}`);
  if(!ended)throw new Error(`capture did not complete synchronously for ${url}`);
  if(res.statusCode>=300&&res.statusCode<400){
    const location=headers.get('location');
    if(!location)throw new Error(`redirect without location while capturing ${url}`);
    const next=new URL(String(location),new URL(url,ORIGIN));
    if(next.origin!==ORIGIN)throw new Error(`cross-origin redirect while capturing ${url}`);
    return capture(handler,next.pathname+next.search,depth+1);
  }
  return {statusCode:res.statusCode,headers,body};
}
function absoluteCssUrls(css,href){
  const base=new URL(href,ORIGIN);
  return String(css||'').replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(full,quote,value)=>{
    const raw=String(value||'').trim();
    if(!raw||raw.startsWith('/')||raw.startsWith('#')||/^(?:data:|https?:|blob:|var\()/i.test(raw))return full;
    try{
      const next=new URL(raw,base);
      if(next.origin!==ORIGIN)return full;
      const resolved=next.pathname+next.search+next.hash;
      return `url(${quote||''}${resolved}${quote||''})`;
    }catch{return full}
  });
}
function buildCombinedCss(downstream,links){
  const unique=[];
  const seen=new Set();
  for(const {href} of links){
    if(!internalCssHref(href)||seen.has(href))continue;
    seen.add(href);unique.push(href);
  }
  if(!unique.length)throw new Error('homepage has no render-blocking internal stylesheets to consolidate');
  const signature=unique.join('|');
  if(cachedHomeCss&&cachedHomeCssSignature===signature)return cachedHomeCss;
  const chunks=[];
  for(const href of unique){
    const asset=capture(downstream,href);
    const type=String(asset.headers.get('content-type')||'').toLowerCase();
    if(asset.statusCode!==200||!type.startsWith('text/css')||!asset.body.trim()){
      throw new Error(`unable to consolidate stylesheet ${href}: status=${asset.statusCode} type=${type||'none'}`);
    }
    chunks.push(`/* ${href} */\n${absoluteCssUrls(asset.body,href)}`);
  }
  cachedHomeCss=chunks.join('\n');
  cachedHomeCssSignature=signature;
  return cachedHomeCss;
}
function discoverAndBuildCombinedCss(downstream){
  const home=capture(downstream,'/');
  const type=String(home.headers.get('content-type')||'').toLowerCase();
  if(home.statusCode!==200||!type.startsWith('text/html'))throw new Error(`unable to capture homepage for CSS discovery: ${home.statusCode}`);
  return buildCombinedCss(downstream,blockingStylesheetLinks(home.body));
}
function consolidateHomepageCss(html,downstream){
  const source=String(html||'');
  const blocking=blockingStylesheetLinks(source);
  if(blocking.length<2)return source;
  buildCombinedCss(downstream,blocking);
  const indexes=new Set(blocking.map(item=>item.index));
  let inserted=false;
  return source.replace(/<link\b[^>]*>/gi,(tag,offset)=>{
    if(!indexes.has(offset))return tag;
    if(inserted)return '';
    inserted=true;
    return `<link rel="stylesheet" href="${CSS_PATH}?v=${encodeURIComponent(BUILD_ID)}" data-apg-pagespeed-css="v${VERSION}">`;
  });
}
function repairScoutAriaJs(body){
  const source=String(body||'');
  if(!source.includes(REDUNDANT_SCOUT_ARIA))return source;
  return source.replace(REDUNDANT_SCOUT_ARIA,SAFE_SCOUT_ARIA);
}
function repairStaticScoutAria(html){
  return String(html||'').replace(/<aside\b[^>]*id=["']apgAssistantPanel["'][^>]*>/i,tag=>tag.replace(/\saria-hidden=["'](?:true|false)["']/i,''));
}
function addCertificationMeta(html){
  let out=String(html||'');
  if(!out.includes('name="apg-pagespeed-agentic-certification"'))out=out.replace('</head>',`<meta name="apg-pagespeed-agentic-certification" content="v${VERSION}"></head>`);
  return out;
}
function transformHtml(html,path,downstream){
  let out=repairStaticScoutAria(html);
  if(path==='/'){
    try{out=consolidateHomepageCss(out,downstream)}catch(error){console.warn(`APG PageSpeed v${VERSION} homepage CSS consolidation skipped: ${error.message}`)}
  }
  return addCertificationMeta(out);
}
function sendCombinedCss(req,res,downstream){
  let body;
  try{body=discoverAndBuildCombinedCss(downstream)}catch(error){
    res.statusCode=503;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-APG-PageSpeed-Agentic-Certification','v'+VERSION);
    res.setHeader('X-APG-PageSpeed-Build',BUILD_ID);
    return res.end(req.method==='HEAD'?'':`APG PageSpeed CSS unavailable: ${error.message}`);
  }
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-PageSpeed-Agentic-Certification','v'+VERSION);
  res.setHeader('X-APG-PageSpeed-Build',BUILD_ID);
  return res.end(req.method==='HEAD'?'':body);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('PageSpeed + agentic certification requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),path=u.pathname;
    if(path===CSS_PATH)return sendCombinedCss(req,res,downstream);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(textual&&req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body;
        let next=source;
        if(type.startsWith('text/html'))next=transformHtml(source,path,downstream);
        else if(path===PREMIUM_JS_PATH&&type.includes('javascript'))next=repairScoutAriaJs(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      if(path.startsWith('/assets/')&&u.searchParams.has('v'))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      res.setHeader('X-APG-PageSpeed-Agentic-Certification','v'+VERSION);
      res.setHeader('X-APG-PageSpeed-Build',BUILD_ID);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{PAGESPEED_AGENTIC_CERTIFICATION_VERSION:VERSION,PAGESPEED_AGENTIC_CSS_PATH:CSS_PATH});
  return handler;
}
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('Whole-Site wrapper is required');
  if(wholeSiteExperience.__apgPagespeedAgenticV113Installed)return wholeSiteExperience;
  const originalWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function certifiedWholeSiteWrap(downstream){return wrap(originalWrap(downstream));};
  Object.defineProperty(wholeSiteExperience,'__apgPagespeedAgenticV113Installed',{value:true,enumerable:false});
  installed=true;
  return wholeSiteExperience;
}

module.exports={
  VERSION,CSS_PATH,BUILD_ID,PREMIUM_JS_PATH,REDUNDANT_SCOUT_ARIA,SAFE_SCOUT_ARIA,
  requestUrl,stylesheetLinks,blockingStylesheetLinks,internalCssHref,bundledStaticCss,absoluteCssUrls,capture,buildCombinedCss,
  discoverAndBuildCombinedCss,consolidateHomepageCss,repairScoutAriaJs,repairStaticScoutAria,
  transformHtml,sendCombinedCss,wrap,install,get installed(){return installed;}
};
