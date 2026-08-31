'use strict';

const fs=require('node:fs');
const pathModule=require('node:path');

// APG PageSpeed + Agentic Delivery Certification v113.5
// P0 serverless-safety containment, 1 Sep 2026.
//
// v113.4 synchronously re-entered the full downstream application from inside the homepage
// res.end transform in order to discover and concatenate late CSS. Under the current Vercel
// Node.js 24 serverless runtime that can leave asynchronous downstream work outside the lifetime
// of the original invocation and has been observed as FUNCTION_INVOCATION_FAILED on Home.
//
// v113.5 keeps the transport-only, synchronous safety work that does not alter recommendation,
// retailer or shopper state: versioned asset caching, the Scout ARIA repairs and certification
// markers. Runtime CSS discovery/consolidation is deliberately fail-closed. The homepage keeps its
// existing stylesheet cascade until the one-file bundle is rebuilt as a build-time/static asset.
// No public request may recursively invoke the application handler from inside another response.

const ORIGIN='https://australianproductguide.au';
const VERSION='113.5';
const CSS_PATH='/assets/pagespeed-home-v113.css';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev')
  .replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||'dev';
const PREMIUM_JS_PATH='/assets/premium-experience-v107.js';
const REDUNDANT_SCOUT_ARIA="setAria(panel,'aria-hidden',panel.hidden);";
const SAFE_SCOUT_ARIA="panel.removeAttribute('aria-hidden');";
const RUNTIME_CSS_CONSOLIDATION='P0_DISABLED_RECURSIVE_CAPTURE';

let installed=false;

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
function uniqueCssHrefs(links){
  const unique=[];
  const seen=new Set();
  for(const {href} of Array.isArray(links)?links:[]){
    if(!internalCssHref(href)||seen.has(href))continue;
    seen.add(href);unique.push(href);
  }
  return unique;
}
function unsafeCaptureError(url){
  const error=new Error(`runtime recursive response capture disabled for ${url||'unknown asset'}`);
  error.code='APG_PAGESPEED_RUNTIME_CAPTURE_DISABLED';
  return error;
}
function capture(_handler,url){throw unsafeCaptureError(url)}
async function captureAsync(_handler,url){throw unsafeCaptureError(url)}
function buildCombinedCss(_downstream,links){
  const unique=uniqueCssHrefs(links);
  if(!unique.length)throw new Error('homepage has no render-blocking internal stylesheets to consolidate');
  const chunks=[];
  for(const href of unique){
    const asset=bundledStaticCss(href);
    if(!asset||asset.statusCode!==200||!asset.body.trim())throw unsafeCaptureError(href);
    chunks.push(`/* ${href} */\n${absoluteCssUrls(asset.body,href)}`);
  }
  return chunks.join('\n');
}
async function buildCombinedCssAsync(downstream,links){return buildCombinedCss(downstream,links)}
function discoverAndBuildCombinedCss(){throw unsafeCaptureError('/')}
async function discoverAndBuildCombinedCssAsync(){throw unsafeCaptureError('/')}
function consolidateHomepageCss(html){
  // Availability-first P0 state. Leave the established cascade untouched. The previous one-file
  // bundle must be rebuilt during deployment, not by recursively running the live application.
  return String(html||'');
}
function repairScoutAriaJs(body){
  const source=String(body||'');
  if(!source.includes(REDUNDANT_SCOUT_ARIA))return source;
  return source.replace(REDUNDANT_SCOUT_ARIA,SAFE_SCOUT_ARIA);
}
function repairStaticScoutAria(html){
  return String(html||'').replace(/<aside\b[^>]*id=["']apgAssistantPanel["'][^>]*>/i,tag=>tag
    .replace(/\saria-hidden=["'](?:true|false)["']/i,'')
    .replace(/\srole=["']dialog["']/i,'')
    .replace(/\saria-modal=["'](?:true|false)["']/i,''));
}
function addCertificationMeta(html){
  let out=String(html||'');
  const marker=`<meta name="apg-pagespeed-agentic-certification" content="v${VERSION}"><meta name="apg-pagespeed-runtime-css" content="${RUNTIME_CSS_CONSOLIDATION}">`;
  if(/<meta\s+name=["']apg-pagespeed-agentic-certification["'][^>]*>/i.test(out)){
    out=out.replace(/<meta\s+name=["']apg-pagespeed-agentic-certification["'][^>]*>/i,marker);
  }else out=out.replace('</head>',`${marker}</head>`);
  return out;
}
function transformHtml(html,_path,_downstream){
  return addCertificationMeta(repairStaticScoutAria(html));
}
function sendCombinedCssError(req,res,error){
  res.statusCode=503;
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-PageSpeed-Agentic-Certification','v'+VERSION);
  res.setHeader('X-APG-PageSpeed-Build',BUILD_ID);
  res.setHeader('X-APG-PageSpeed-Runtime-CSS',RUNTIME_CSS_CONSOLIDATION);
  return res.end(req.method==='HEAD'?'':`APG PageSpeed CSS unavailable: ${error.message}`);
}
function sendCombinedCss(req,res){
  return sendCombinedCssError(req,res,unsafeCaptureError(CSS_PATH));
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('PageSpeed + agentic certification requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),path=u.pathname;
    if(path===CSS_PATH)return sendCombinedCss(req,res);
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
      res.setHeader('X-APG-PageSpeed-Runtime-CSS',RUNTIME_CSS_CONSOLIDATION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{PAGESPEED_AGENTIC_CERTIFICATION_VERSION:VERSION,PAGESPEED_AGENTIC_CSS_PATH:CSS_PATH,PAGESPEED_AGENTIC_RUNTIME_CSS:RUNTIME_CSS_CONSOLIDATION});
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
  VERSION,CSS_PATH,BUILD_ID,PREMIUM_JS_PATH,REDUNDANT_SCOUT_ARIA,SAFE_SCOUT_ARIA,RUNTIME_CSS_CONSOLIDATION,
  requestUrl,stylesheetLinks,blockingStylesheetLinks,internalCssHref,bundledStaticCss,absoluteCssUrls,capture,captureAsync,
  buildCombinedCss,buildCombinedCssAsync,discoverAndBuildCombinedCss,discoverAndBuildCombinedCssAsync,
  consolidateHomepageCss,repairScoutAriaJs,repairStaticScoutAria,transformHtml,sendCombinedCss,wrap,install,
  get installed(){return installed;}
};