'use strict';

const fs=require('node:fs');
const pathModule=require('node:path');

// APG PageSpeed Static Delivery v127.0.
// Build-time/static transport optimisation only. It consolidates the established homepage
// critical CSS cascade, defers two below-the-fold visual stylesheets, makes the desktop-only
// header repair non-blocking on mobile, and requests card-sized eBay imagery. It does not
// change content, recommendation logic, product eligibility, retailer ordering, analytics,
// structured data, canonicals, crawler policy or agentic browsing semantics.
const ORIGIN='https://australianproductguide.au';
const VERSION='127.0';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev')
  .replace(/[^a-zA-Z0-9_-]/g,'').slice(0,20)||'dev';
const HOME_BUNDLE_PATH='/assets/pagespeed-home-v127.css';
const HOME_BUNDLE_FILE=pathModule.resolve(process.cwd(),'public/assets/pagespeed-home-v127.css');
const MIN_BUNDLE_BYTES=2048;
const DESKTOP_HEADER_CSS='/assets/desktop-home-header-v126.css';
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';

// Order is deliberate and mirrors the established homepage cascade. site-optimised.css remains
// separate and first so the stable shell can render before this consolidated enhancement bundle.
const HOME_CRITICAL_CSS=Object.freeze([
  '/assets/privacy-experience.css',
  '/assets/illustrative-experience.css',
  '/assets/consumer-v13.css',
  '/assets/assistant.css',
  '/assets/membership-proof-v19.css',
  '/assets/mobile-account-proof-v20.css',
  '/assets/mobile-menu-polish-v21.css',
  '/assets/premium-brand-v30.css',
  '/assets/premium-theme-v31.css',
  '/assets/brand-fidelity-v32.css',
  '/assets/interaction-reliability-v37.css',
  '/assets/brand-system-v46.css',
  '/assets/brand-system-v46-final.css',
  '/assets/mobile-header-wordmark-v75.css',
  '/assets/premium-search-v76.css',
  '/assets/premium-search-mobile-v761.css'
]);
const HOME_CRITICAL_SET=new Set(HOME_CRITICAL_CSS);
const HOME_NONCRITICAL_CSS=new Set([
  '/assets/homepage-situation-images-v70.css',
  '/assets/ebay-official-creatives-v121.css'
]);

function requestUrl(req){
  try{return new URL(req?.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}
}
function attr(tag,name){
  const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?match[2]:'';
}
function pathOf(raw){
  try{return new URL(raw,ORIGIN).pathname}catch{return String(raw||'').split('?')[0]}
}
function escAttr(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function readHomeBundle(){
  try{
    const body=fs.readFileSync(HOME_BUNDLE_FILE,'utf8');
    return Buffer.byteLength(body,'utf8')>=MIN_BUNDLE_BYTES?body:'';
  }catch{return ''}
}
function maskedNoscript(source){
  return String(source||'').replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,block=>' '.repeat(block.length));
}
function criticalLinkRanges(html){
  const source=String(html||''),masked=maskedNoscript(source),ranges=[];
  for(const match of masked.matchAll(/<link\b[^>]*>/gi)){
    const index=match.index||0,tag=source.slice(index,index+match[0].length);
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/),href=attr(tag,'href');
    const stylesheet=rel.includes('stylesheet');
    const stylePreload=rel.includes('preload')&&attr(tag,'as').toLowerCase()==='style';
    if((!stylesheet&&!stylePreload)||!HOME_CRITICAL_SET.has(pathOf(href)))continue;
    const media=attr(tag,'media').trim().toLowerCase();
    if(stylesheet&&media&&media!=='all'&&media!=='screen')continue;
    ranges.push({index,length:tag.length,href:pathOf(href),kind:stylesheet?'stylesheet':'preload'});
  }
  return ranges;
}
function removeRanges(source,ranges){
  let out=String(source||'');
  for(const range of [...ranges].sort((a,b)=>b.index-a.index))out=out.slice(0,range.index)+out.slice(range.index+range.length);
  return out;
}
function bundleTag(){
  return `<link rel="stylesheet" href="${HOME_BUNDLE_PATH}?v=${encodeURIComponent(BUILD_ID)}" data-apg-static-critical-css="v${VERSION}">`;
}
function consolidateHomepageCss(html){
  const source=String(html||'');
  if(!source||source.includes('data-apg-static-critical-css=')||!readHomeBundle())return source;
  const ranges=criticalLinkRanges(source);
  if(!ranges.length)return source;
  let out=removeRanges(source,ranges),tag=bundleTag();
  const core=/<link\b[^>]*href=["']\/assets\/site-optimised\.css[^"']*["'][^>]*>/i;
  if(core.test(out))out=out.replace(core,match=>match+tag);
  else out=out.replace('</head>',tag+'</head>');
  return out;
}
function makeNoncriticalStylesNonBlocking(html){
  const source=String(html||''),masked=maskedNoscript(source),replacements=[];
  for(const match of masked.matchAll(/<link\b[^>]*>/gi)){
    const index=match.index||0,tag=source.slice(index,index+match[0].length);
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/),href=attr(tag,'href');
    if(!rel.includes('stylesheet')||!HOME_NONCRITICAL_CSS.has(pathOf(href)))continue;
    const media=attr(tag,'media').trim().toLowerCase();
    if(media&&media!=='all'&&media!=='screen')continue;
    const safe=escAttr(href);
    const next=`<link rel="stylesheet" href="${safe}" media="print" fetchpriority="low" onload="this.onload=null;this.media='all'" data-apg-static-noncritical="v${VERSION}"><noscript><link rel="stylesheet" href="${safe}"></noscript>`;
    replacements.push({index,length:tag.length,next});
  }
  let out=source;
  for(const item of replacements.sort((a,b)=>b.index-a.index))out=out.slice(0,item.index)+item.next+out.slice(item.index+item.length);
  return out;
}
function scopeDesktopHeaderCss(html){
  return String(html||'').replace(/<link\b[^>]*>/gi,tag=>{
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/),href=attr(tag,'href');
    if(!rel.includes('stylesheet')||pathOf(href)!==DESKTOP_HEADER_CSS||attr(tag,'media'))return tag;
    return tag.replace(/>$/,` media="(min-width:981px)" fetchpriority="low" data-apg-desktop-media="v${VERSION}">`);
  });
}
function ebaySizedUrl(raw,size){
  try{
    const u=new URL(raw,ORIGIN);
    if(u.origin!==EBAY_IMAGE_ORIGIN)return '';
    const next=u.pathname.replace(/\/s-l\d+\.(jpe?g|png|webp)$/i,`/s-l${size}.$1`);
    if(next===u.pathname)return '';
    u.pathname=next;
    return u.toString();
  }catch{return ''}
}
function setOrAddAttr(tag,name,value){
  const safe=escAttr(value),re=new RegExp(`\\s${name}\\s*=\\s*(["']).*?\\1`,'i');
  if(re.test(tag))return tag.replace(re,` ${name}="${safe}"`);
  return tag.replace(/\s*\/?>(\s*)$/,match=>` ${name}="${safe}"${match}`);
}
function responsiveEbayImageTag(tag){
  let out=String(tag||'');
  const src=attr(out,'src');
  if(!src||!/^https:\/\/i\.ebayimg\.com\//i.test(src)||!attr(out,'loading').toLowerCase().includes('lazy'))return out;
  const small=ebaySizedUrl(src,500),medium=ebaySizedUrl(src,800);
  if(!small||!medium)return out;
  out=setOrAddAttr(out,'src',medium);
  if(!attr(out,'srcset'))out=setOrAddAttr(out,'srcset',`${small} 500w, ${medium} 800w`);
  if(!attr(out,'sizes'))out=setOrAddAttr(out,'sizes','(max-width:720px) calc(100vw - 32px), (max-width:1180px) calc(50vw - 40px), 390px');
  if(!attr(out,'fetchpriority'))out=setOrAddAttr(out,'fetchpriority','low');
  if(!attr(out,'data-apg-responsive-ebay'))out=setOrAddAttr(out,'data-apg-responsive-ebay',`v${VERSION}`);
  if(attr(out,'data-apg-fallback-src')&&attr(out,'onerror')&&!attr(out,'onerror').includes("removeAttribute('srcset')")){
    const current=attr(out,'onerror');
    const repaired=current.replace('this.onerror=null;',"this.onerror=null;this.removeAttribute('srcset');this.removeAttribute('sizes');");
    out=setOrAddAttr(out,'onerror',repaired);
  }
  return out;
}
function optimiseHomepageImages(html){
  return String(html||'').replace(/<img\b[^>]*>/gi,responsiveEbayImageTag);
}
function addCertificationMeta(html){
  let out=String(html||'');
  const marker=`<meta name="apg-pagespeed-static-delivery" content="v${VERSION}">`;
  if(out.includes('name="apg-pagespeed-static-delivery"'))return out;
  return out.replace('</head>',marker+'</head>');
}
function transformHtml(html,pathname){
  let out=String(html||'');
  if(pathname==='/'){
    out=consolidateHomepageCss(out);
    out=makeNoncriticalStylesNonBlocking(out);
    out=optimiseHomepageImages(out);
  }
  out=scopeDesktopHeaderCss(out);
  return addCertificationMeta(out);
}
function sendBundle(req,res){
  const body=readHomeBundle();
  if(!body){
    res.statusCode=503;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    return res.end(req.method==='HEAD'?'':'APG static homepage CSS bundle unavailable');
  }
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('PageSpeed static delivery requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),pathname=u.pathname;
    if(pathname===HOME_BUNDLE_PATH)return sendBundle(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body;
        const next=transformHtml(source,pathname);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      if(pathname.startsWith('/assets/')&&u.searchParams.has('v'))res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      res.setHeader('X-APG-PageSpeed-Static-Delivery','v'+VERSION);
      res.setHeader('X-APG-PageSpeed-Static-Build',BUILD_ID);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    PAGESPEED_STATIC_DELIVERY_VERSION:VERSION,
    PAGESPEED_STATIC_HOME_BUNDLE_PATH:HOME_BUNDLE_PATH,
    PAGESPEED_STATIC_HOME_CRITICAL_CSS:HOME_CRITICAL_CSS
  });
  return handler;
}

module.exports={
  ORIGIN,VERSION,BUILD_ID,HOME_BUNDLE_PATH,HOME_BUNDLE_FILE,MIN_BUNDLE_BYTES,DESKTOP_HEADER_CSS,EBAY_IMAGE_ORIGIN,
  HOME_CRITICAL_CSS,HOME_CRITICAL_SET,HOME_NONCRITICAL_CSS,requestUrl,attr,pathOf,escAttr,readHomeBundle,
  criticalLinkRanges,consolidateHomepageCss,makeNoncriticalStylesNonBlocking,scopeDesktopHeaderCss,ebaySizedUrl,
  responsiveEbayImageTag,optimiseHomepageImages,addCertificationMeta,transformHtml,sendBundle,wrap
};
