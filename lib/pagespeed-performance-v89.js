'use strict';

// APG PageSpeed Performance v89.
// Evidence-led mobile remediation against the 23 Aug 2026 PSI run (81 mobile / 97 desktop).
// The fresh report identified 610 ms of render-blocking work. This layer reduces the
// homepage critical request chain without changing layout, content, recommendations,
// analytics, affiliate behaviour, SEO or agentic-discovery contracts.
const downstream=require('./pagespeed-performance-v88');

const ORIGIN='https://australianproductguide.au';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev')
  .replace(/[^a-zA-Z0-9_-]/g,'').slice(0,16)||'dev';
const PAGESPEED_PERFORMANCE_VERSION='89.0';
const HOME_CRITICAL_CSS_PATH='/assets/home-critical-v89.css';

const HOME_CRITICAL_CSS=[
  '/assets/privacy-experience.css','/assets/illustrative-experience.css','/assets/consumer-v13.css','/assets/assistant.css',
  '/assets/membership-proof-v19.css','/assets/mobile-account-proof-v20.css','/assets/mobile-menu-polish-v21.css',
  '/assets/premium-brand-v30.css','/assets/premium-theme-v31.css','/assets/brand-fidelity-v32.css',
  '/assets/interaction-reliability-v37.css','/assets/brand-system-v46.css','/assets/brand-system-v46-final.css',
  '/assets/homepage-situation-images-v70.css','/assets/mobile-header-wordmark-v75.css',
  '/assets/premium-search-v76.css','/assets/premium-search-mobile-v761.css'
];
const HOME_CRITICAL_SET=new Set(HOME_CRITICAL_CSS);
let cachedCriticalCss=null;
function requestUrl(req){try{return new URL(req?.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function pathOf(raw){try{return new URL(raw,ORIGIN).pathname}catch{return String(raw||'').split('?')[0]}}
function fakeReq(path){return {url:path,method:'GET',headers:{host:'australianproductguide.au','x-forwarded-host':'australianproductguide.au'}}}
function captureAsset(path){
  let body='';const headers=new Map();
  const res={statusCode:200,setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this},getHeader(name){return headers.get(String(name).toLowerCase())},removeHeader(name){headers.delete(String(name).toLowerCase())},end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return body}};
  downstream(fakeReq(path),res);if(res.statusCode!==200)throw new Error(`Unable to capture ${path}: ${res.statusCode}`);return body;
}
function homeCriticalCss(){if(cachedCriticalCss!==null)return cachedCriticalCss;cachedCriticalCss=HOME_CRITICAL_CSS.map(path=>`/* ${path} */\n${captureAsset(path)}`).join('\n');return cachedCriticalCss}
function sendCriticalCss(req,res){const body=homeCriticalCss();res.statusCode=200;res.setHeader('Content-Type','text/css; charset=utf-8');res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body)}
function consolidateHomepageCss(html){
  let out=String(html||''),found=false;
  out=out.replace(/<link rel="stylesheet" href="([^"]+)">/g,(full,href)=>{if(!HOME_CRITICAL_SET.has(pathOf(href)))return full;found=true;return ''});
  if(!found||out.includes(HOME_CRITICAL_CSS_PATH))return out;
  const href=`${HOME_CRITICAL_CSS_PATH}?v=${encodeURIComponent(BUILD_ID)}`;const tag=`<link rel="stylesheet" href="${href}" data-apg-critical-css="v${PAGESPEED_PERFORMANCE_VERSION}">`;
  const core=/<link rel="stylesheet" href="\/assets\/site-optimised\.css[^"]*">/;if(core.test(out))return out.replace(core,m=>m+tag);return out.replace('</head>',tag+'</head>');
}
function versionMutableAssets(html){return String(html||'').replace(/\b(src|href)="(\/assets\/(?:privacy-experience|illustrative-experience)\.(?:js|css))"/g,(m,attr,url)=>`${attr}="${url}?v=${encodeURIComponent(BUILD_ID)}"`)}
function transformHtml(html,path){let out=String(html||'');if(path==='/')out=consolidateHomepageCss(out);out=versionMutableAssets(out);if(!out.includes('name="apg-pagespeed-performance-v89"'))out=out.replace('</head>',`<meta name="apg-pagespeed-performance-v89" content="v${PAGESPEED_PERFORMANCE_VERSION}"></head>`);return out}
function handler(req,res){
  const url=requestUrl(req);if(url.pathname===HOME_CRITICAL_CSS_PATH){res.setHeader('X-APG-PageSpeed-Performance','v'+PAGESPEED_PERFORMANCE_VERSION);return sendCriticalCss(req,res)}
  const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body,next=transformHtml(original,url.pathname);if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}}if(url.pathname.startsWith('/assets/')&&url.searchParams.get('v')===BUILD_ID)res.setHeader('Cache-Control','public, max-age=31536000, immutable');return end(body,...args)};
  res.setHeader('X-APG-PageSpeed-Performance','v'+PAGESPEED_PERFORMANCE_VERSION);return downstream(req,res);
}
Object.assign(handler,downstream,{PAGESPEED_PERFORMANCE_VERSION,HOME_CRITICAL_CSS_PATH,HOME_CRITICAL_CSS,pathOf,captureAsset,homeCriticalCss,consolidateHomepageCss,versionMutableAssets,transformHtml});
module.exports=handler;
