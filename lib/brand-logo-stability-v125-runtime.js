'use strict';

// APG Brand Logo Stability v125.0
//
// Purpose: keep the governed brand-identity system attached to the CURRENT APG runtime.
// Later presentation/commerce wrappers must never be able to bypass /assets/brand-marks/*.
//
// Trust order is inherited from the existing governed brand stack:
//   1. missing-only reviewed completion for previously observed blank/broken marks;
//   2. complete official-domain resolver (curated vector -> official mark -> declared identity -> governed favicon);
//   3. canonical brand-name SVG terminal fallback.
//
// This wrapper is intentionally route-scoped. It does not alter recommendation logic,
// retailer weighting, catalogue evidence, search relevance or Decision Lab state.
const complete=require('./brand-mark-complete-v67');
const missing=require('./brand-mark-missing-only-v73');
const {brands,slugify}=require('./routes');

const VERSION='125.0';
const ASSET_PATH='/assets/brand-logo-stability-v125.js';
const canonicalBySlug=new Map(brands.map(name=>[slugify(name),name]));

function brandPath(pathname){
  return pathname==='/brands'||pathname==='/brands/'||/^\/brands\/[a-z0-9][a-z0-9-]*\/?$/i.test(pathname);
}

function imageUsable(image){
  if(!image||!image.buffer||!image.buffer.length)return false;
  const type=String(image.type||'').toLowerCase();
  return type.startsWith('image/')||type.includes('svg');
}

async function resolveStableBrandMark(slug){
  if(!canonicalBySlug.has(slug))return null;
  if(missing.TARGETS&&missing.TARGETS.has(slug)&&typeof missing.resolveMissingOnly==='function'){
    try{
      const targeted=await missing.resolveMissingOnly(slug);
      if(imageUsable(targeted)&&!targeted.terminalFallback)return targeted;
    }catch{}
  }
  try{
    const resolved=await complete.resolveCompleteBrandMark(slug);
    if(imageUsable(resolved))return resolved;
  }catch{}
  // resolveCompleteBrandMark is designed to be terminal for canonical brands, but keep
  // one deterministic local fallback here so a future resolver regression cannot emit 404.
  if(typeof complete.canonicalFallbackImage==='function')return complete.canonicalFallbackImage(slug);
  return null;
}

function serveImage(req,res,slug,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/svg+xml');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Logo-Stability','v'+VERSION);
  res.setHeader('X-APG-Brand-Mark-Canonical',canonicalBySlug.get(slug)||slug);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'governed-brand-identity');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.provenanceReference)res.setHeader('X-APG-Brand-Mark-Provenance-Reference',image.provenanceReference);
  if(image.terminalFallback)res.setHeader('X-APG-Brand-Mark-Terminal-Fallback','1');
  res.setHeader('Content-Length',String(image.buffer.length));
  return req.method==='HEAD'?res.end():res.end(image.buffer);
}

const clientJs=`(()=>{
  'use strict';
  const SELECTOR='img[src^="/assets/brand-marks/"]';
  function shell(img){return img.closest('[data-brand-logo-shell]')||img.parentElement;}
  function loaded(img){img.hidden=false;const s=shell(img);if(s)s.dataset.apgBrandLogoState='loaded';}
  function failed(img){img.hidden=true;const s=shell(img);if(s)s.dataset.apgBrandLogoState='fallback';}
  function bind(img){
    if(img.dataset.apgBrandLogoStable==='1')return;
    img.dataset.apgBrandLogoStable='1';
    img.addEventListener('load',()=>img.naturalWidth>0&&img.naturalHeight>0?loaded(img):failed(img));
    img.addEventListener('error',()=>failed(img));
    if(img.complete){img.naturalWidth>0&&img.naturalHeight>0?loaded(img):failed(img);}
  }
  function scan(root=document){root.querySelectorAll&&root.querySelectorAll(SELECTOR).forEach(bind);}
  scan();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>scan(),{once:true});
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType!==1)return;
    if(node.matches&&node.matches(SELECTOR))bind(node);
    scan(node);
  }))).observe(document.documentElement,{childList:true,subtree:true});
})();`;

function versionBrandImageTag(tag){
  if(!/\bsrc=["']\/assets\/brand-marks\//i.test(tag))return tag;
  let next=tag.replace(/(\bsrc=["']\/assets\/brand-marks\/[^?"']+)(?:\?[^"']*)?(["'])/i,`$1?v=${VERSION}$2`);
  if(!/\bdata-apg-brand-logo-stable=/i.test(next))next=next.replace(/^<img\b/i,`<img data-apg-brand-logo-stable="v${VERSION}"`);
  return next;
}

function patchBrandHtml(html,pathname){
  if(!brandPath(pathname))return String(html||'');
  let out=String(html||'').replace(/<img\b[^>]*\bsrc=["']\/assets\/brand-marks\/[^"']+["'][^>]*>/gi,versionBrandImageTag);
  if(!out.includes('name="apg-brand-logo-stability"'))out=out.replace('</head>',`<meta name="apg-brand-logo-stability" content="v${VERSION}"></head>`);
  if(!out.includes(ASSET_PATH))out=out.replace('</body>',`<script src="${ASSET_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}

function sendClient(req,res){
  const body=Buffer.from(clientJs,'utf8');
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Logo-Stability','v'+VERSION);
  if(req.method==='HEAD')return res.end();
  res.setHeader('Content-Length',String(body.length));
  return res.end(body);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('brand logo stability requires downstream handler');
  async function handler(req,res){
    let pathname='/';
    try{pathname=new URL(req&&req.url||'/','https://australianproductguide.au').pathname;}catch{}

    if((req.method==='GET'||req.method==='HEAD')&&pathname===ASSET_PATH)return sendClient(req,res);

    const match=pathname.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
    if(match&&(req.method==='GET'||req.method==='HEAD')){
      let slug='';
      try{slug=decodeURIComponent(match[1]).toLowerCase();}catch{}
      if(canonicalBySlug.has(slug)){
        const image=await resolveStableBrandMark(slug);
        if(image)return serveImage(req,res,slug,image);
      }
    }

    if(brandPath(pathname)){
      const end=res.end.bind(res);
      res.end=(body,...args)=>{
        const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
        if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
          const wasBuffer=Buffer.isBuffer(body);
          const original=wasBuffer?body.toString('utf8'):body;
          const next=patchBrandHtml(original,pathname);
          if(next!==original){
            body=wasBuffer?Buffer.from(next,'utf8'):next;
            try{res.removeHeader('Content-Length');}catch{}
          }
        }
        return end(body,...args);
      };
    }

    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    BRAND_LOGO_STABILITY_VERSION:VERSION,
    BRAND_LOGO_STABILITY_ASSET_PATH:ASSET_PATH,
    canonicalBySlug,
    brandPath,
    imageUsable,
    resolveStableBrandMark,
    patchBrandHtml,
    versionBrandImageTag
  });
  return handler;
}

module.exports={VERSION,ASSET_PATH,canonicalBySlug,brandPath,imageUsable,resolveStableBrandMark,patchBrandHtml,versionBrandImageTag,wrap};
