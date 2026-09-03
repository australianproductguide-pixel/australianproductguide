'use strict';

// APG Google Discoverability + Safe Performance Delivery v128.2.
// A deliberately narrow outer delivery layer. It does not alter product evidence,
// recommendations, retailer weighting, privacy choices, structured data, canonicals,
// robots, crawler permissions or agentic-browsing controls.
//
// Homepage CSS consolidation is build-time only. Runtime delivery reads a tiny source-controlled
// manifest, not the generated CSS file or the full CSS asset tree. The public Home uses the static
// bundle only when the manifest's stylesheet-link signature exactly matches final HTML. A missing
// or stale manifest fails closed to the established stylesheet cascade; no live request recursively
// invokes the application or assembles, reads or hashes CSS.
const crypto=require('node:crypto');
const HOME_BUNDLE_MANIFEST=require('../data/home-css-v128-manifest');

const VERSION='128.2';
const HEADER_NAME='X-APG-Google-Discoverability-Performance';
const MARKER='<meta name="apg-google-discoverability-performance" content="v128.2">';
const ORIGIN='https://australianproductguide.au';
const HOME_BUNDLE_PATH='/assets/home-v128-bundle.css';
const HOME_BUNDLE_FILENAME='public/assets/home-v128-bundle.css';
const HOME_BUNDLE_MARKER='APG_HOME_CSS_LINK_SIGNATURE:';
const HOME_BUNDLE_MANIFEST_HEADER='X-APG-Home-CSS-Manifest';
const MY_APG_PATH='/my-apg/';
const MY_APG_ACCESSIBILITY_VERSION='129.0';
const MY_APG_ACCESSIBILITY_PATH='/assets/my-apg-accessibility-v129.css';
const MY_APG_ACCESSIBILITY_HEADER='X-APG-My-APG-Accessibility';
const MY_APG_ACCESSIBILITY_MARKER=`<link rel="stylesheet" href="${MY_APG_ACCESSIBILITY_PATH}?v=${MY_APG_ACCESSIBILITY_VERSION}" data-apg-my-apg-accessibility="v${MY_APG_ACCESSIBILITY_VERSION}">`;

const LEGACY_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-80/';
const CANONICAL_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-20/';
const LEGACY_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-80/';
const CANONICAL_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-20/';

// These replacements are intentionally exact and fail closed. Each referenced stylesheet is
// already wholly guarded by the same viewport media query in its own source. Adding the media
// hint prevents irrelevant CSS from blocking the opposite viewport without changing the
// applicable cascade. A future asset-version change simply stops matching until re-certified.
const STYLE_REPLACEMENTS=Object.freeze([
  Object.freeze([
    '<link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2">',
    '<link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2" media="(min-width:981px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/desktop-about-trust-contrast-v127.css?v=127.0">',
    '<link rel="stylesheet" href="/assets/desktop-about-trust-contrast-v127.css?v=127.0" media="(min-width:921px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/mobile-header-wordmark-v75.css?v=75.0">',
    '<link rel="stylesheet" href="/assets/mobile-header-wordmark-v75.css?v=75.0" media="(max-width:920px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21">',
    '<link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21" media="(max-width:920px)">'
  ])
]);

let cachedBundleInfo;

function requestUrl(raw){
  try{return new URL(String(raw||'/'),ORIGIN);}
  catch{return new URL(ORIGIN+'/');}
}
function attr(tag,name){
  const match=String(tag||'').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`,'i'));
  return match?match[2]:'';
}
function internalCssHref(href){
  try{
    const url=new URL(String(href||''),ORIGIN);
    return url.origin===ORIGIN&&url.pathname.startsWith('/assets/')&&url.pathname.endsWith('.css');
  }catch{return false;}
}
function activeHead(html){
  const match=String(html||'').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  return match?match[1]:'';
}
function stylesheetDescriptors(html){
  const head=activeHead(html).replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,'');
  const links=[];
  for(const match of head.matchAll(/<link\b[^>]*>/gi)){
    const tag=match[0];
    const rel=attr(tag,'rel').toLowerCase().split(/\s+/).filter(Boolean);
    const href=attr(tag,'href');
    if(!rel.includes('stylesheet')||!internalCssHref(href))continue;
    const onload=attr(tag,'onload');
    const declaredMedia=attr(tag,'media').trim();
    const media=/this\.media\s*=\s*['"](?:all|screen)['"]/i.test(onload)?'':declaredMedia;
    links.push({href,media});
  }
  return links;
}
function stylesheetSignature(html){
  return crypto.createHash('sha256').update(JSON.stringify(stylesheetDescriptors(html))).digest('hex');
}
function redirectTarget(pathname){
  if(pathname===LEGACY_PRODUCT)return CANONICAL_PRODUCT;
  if(pathname===LEGACY_COMPARISON)return CANONICAL_COMPARISON;
  return '';
}
function sendPermanentRedirect(req,res,target){
  res.statusCode=308;
  res.setHeader('Location',target);
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=31536000');
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader(HEADER_NAME,'v'+VERSION);
  return res.end(req&&req.method==='HEAD'?'':'Permanent redirect');
}
function scopeCertifiedViewportStyles(html){
  let out=String(html||'');
  for(const [before,after] of STYLE_REPLACEMENTS)out=out.split(before).join(after);
  return out;
}
function repairAccessibleBrandNames(html){
  let out=String(html||'').replace(/<a\b[^>]*>/gi,tag=>{
    const classes=attr(tag,'class').split(/\s+/);
    if(!classes.includes('brand')&&!classes.includes('footer-v11-wordmark'))return tag;
    if(attr(tag,'aria-label')!=='Australian Product Guide home')return tag;
    return tag.replace(/\saria-label=(["'])Australian Product Guide home\1/i,'');
  });
  // Keep the programmatic label consistent with the visible mobile account copy.
  out=out.replace(/aria-label=(["'])Open My APG\1/gi,'aria-label="Sign in to My APG"');
  // This string can exist in both initial HTML and a progressive-enhancement script. Replacing
  // the exact phrase keeps the final accessible name aligned with the launcher text after load.
  out=out.split('Ask Scout - your APG decision guide').join('Ask Scout - Your Australian Product Guide decision guide');
  out=out.split('Ask Scout — your APG decision guide').join('Ask Scout — Your Australian Product Guide decision guide');
  return out;
}
function injectMarker(html){
  const out=String(html||'');
  if(!out||out.includes(MARKER))return out;
  return out.replace('</head>',MARKER+'</head>');
}
function injectMyApgAccessibilityCss(html,pathname='/'){
  const source=String(html||'');
  if(pathname!==MY_APG_PATH||!source||source.includes('data-apg-my-apg-accessibility='))return source;
  return source.replace('</head>',MY_APG_ACCESSIBILITY_MARKER+'</head>');
}
function validManifest(manifest=HOME_BUNDLE_MANIFEST){
  return Boolean(
    manifest&&manifest.version===VERSION&&
    Number.isInteger(manifest.sourceStylesheets)&&manifest.sourceStylesheets>=40&&
    Number.isInteger(manifest.bytes)&&manifest.bytes>=250000&&
    /^[a-f0-9]{64}$/.test(String(manifest.linkSignature||''))&&
    /^[a-f0-9]{64}$/.test(String(manifest.sha256||''))
  );
}
function bundleInfo(){
  if(process.env.APG_HOME_CSS_BUILD==='1')return null;
  if(cachedBundleInfo!==undefined)return cachedBundleInfo;
  if(!validManifest()){
    cachedBundleInfo=null;
    return cachedBundleInfo;
  }
  const hash=HOME_BUNDLE_MANIFEST.sha256.slice(0,20);
  cachedBundleInfo=Object.freeze({
    signature:HOME_BUNDLE_MANIFEST.linkSignature,
    hash,
    href:`${HOME_BUNDLE_PATH}?v=${hash}`
  });
  return cachedBundleInfo;
}
function protectNoscript(head){
  const blocks=[];
  const masked=String(head||'').replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,block=>{
    const token=`<!--APG_NOSCRIPT_${blocks.length}-->`;
    blocks.push(block);
    return token;
  });
  return {masked,restore(value){return String(value||'').replace(/<!--APG_NOSCRIPT_(\d+)-->/g,(all,index)=>blocks[Number(index)]||all);}};
}
function removableCssTag(tag){
  const href=attr(tag,'href');
  if(!internalCssHref(href))return false;
  const rel=attr(tag,'rel').toLowerCase().split(/\s+/).filter(Boolean);
  if(rel.includes('stylesheet'))return true;
  return rel.includes('preload')&&attr(tag,'as').toLowerCase()==='style';
}
function consolidateHomepageCss(html,{pathname='/',info=bundleInfo()}={}){
  const source=String(html||'');
  if(pathname!=='/'||!info||info.signature!==stylesheetSignature(source))return source;
  const match=source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if(!match)return source;
  const protectedHead=protectNoscript(match[1]);
  let inserted=false;
  let next=protectedHead.masked.replace(/<link\b[^>]*>/gi,tag=>{
    if(!removableCssTag(tag))return tag;
    if(inserted)return '';
    inserted=true;
    return `<link rel="stylesheet" href="${info.href}" data-apg-home-css-bundle="v${VERSION}">`;
  });
  if(!inserted)return source;
  next=protectedHead.restore(next);
  return source.replace(match[1],next);
}
function transformHtml(html,pathname='/'){
  let out=scopeCertifiedViewportStyles(html);
  out=repairAccessibleBrandNames(out);
  out=injectMarker(out);
  out=injectMyApgAccessibilityCss(out,pathname);
  out=consolidateHomepageCss(out,{pathname});
  return out;
}
function isVersionedAsset(raw){
  const url=requestUrl(raw);
  return url.pathname.startsWith('/assets/')&&Boolean(url.searchParams.get('v'));
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Google discoverability delivery requires a downstream handler');
  function handler(req,res){
    const url=requestUrl(req&&req.url);
    const target=redirectTarget(url.pathname);
    if(target)return sendPermanentRedirect(req,res,target);

    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const status=Number(res.statusCode||200);
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      if(status>=200&&status<400&&isVersionedAsset(req&&req.url)){
        res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      }
      if(req&&req.method!=='HEAD'&&status>=200&&status<400&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body);
        const source=wasBuffer?body.toString('utf8'):body;
        const next=transformHtml(source,url.pathname);
        if(next!==source){
          body=wasBuffer?Buffer.from(next,'utf8'):next;
          try{res.removeHeader('Content-Length');}catch{}
        }
      }
      res.setHeader(HEADER_NAME,'v'+VERSION);
      if(url.pathname===MY_APG_PATH)res.setHeader(MY_APG_ACCESSIBILITY_HEADER,'v'+MY_APG_ACCESSIBILITY_VERSION);
      if(url.pathname==='/'&&String(body||'').includes('data-apg-home-css-bundle=')){
        res.setHeader('X-APG-Home-CSS-Bundle','v'+VERSION);
        res.setHeader(HOME_BUNDLE_MANIFEST_HEADER,HOME_BUNDLE_MANIFEST.sha256.slice(0,20));
      }
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION:VERSION,
    MY_APG_ACCESSIBILITY_VERSION,
    HOME_CSS_MANIFEST_SHA256:HOME_BUNDLE_MANIFEST.sha256,
    GOOGLE_DISCOVERABILITY_PERFORMANCE_REDIRECTS:Object.freeze({
      [LEGACY_PRODUCT]:CANONICAL_PRODUCT,
      [LEGACY_COMPARISON]:CANONICAL_COMPARISON
    })
  });
  return handler;
}

module.exports={
  VERSION,HEADER_NAME,MARKER,HOME_BUNDLE_PATH,HOME_BUNDLE_FILENAME,HOME_BUNDLE_MARKER,
  HOME_BUNDLE_MANIFEST,HOME_BUNDLE_MANIFEST_HEADER,
  MY_APG_PATH,MY_APG_ACCESSIBILITY_VERSION,MY_APG_ACCESSIBILITY_PATH,
  MY_APG_ACCESSIBILITY_HEADER,MY_APG_ACCESSIBILITY_MARKER,
  LEGACY_PRODUCT,CANONICAL_PRODUCT,LEGACY_COMPARISON,CANONICAL_COMPARISON,
  STYLE_REPLACEMENTS,requestUrl,attr,internalCssHref,activeHead,stylesheetDescriptors,stylesheetSignature,
  redirectTarget,sendPermanentRedirect,scopeCertifiedViewportStyles,repairAccessibleBrandNames,
  injectMarker,injectMyApgAccessibilityCss,validManifest,bundleInfo,protectNoscript,removableCssTag,
  consolidateHomepageCss,transformHtml,isVersionedAsset,wrap
};
