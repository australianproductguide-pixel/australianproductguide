'use strict';

// APG Brand Mark Device Parity + Integrity v66.2
//
// One governed brand-mark URL must produce the same current identity on desktop and
// mobile. The layer also prevents the directory/product-placeholder surface from
// exposing broken images, invisible SVG loaders, or generic product/lifestyle images
// that happened to contain a brand token.
//
// Trust order remains:
//   curated reviewed mark -> v65 high-quality official mark -> canonical name fallback.
// The fallback is deliberately a neutral APG-rendered brand-name graphic, NOT an
// assertion that APG possesses an official corporate logo for that brand.
const downstream=require('./brand-mark-curated-v66');
const {brands,slugify}=require('./routes');

const BRAND_MARK_DEVICE_PARITY_VERSION='66.2';
const BRAND_MARK_ASSET_VERSION='66.2';
const BRAND_MARK_INTEGRITY_VERSION='66.2';
const brandNameBySlug=new Map(brands.map(name=>[slugify(name),name]));

function xmlEscape(value){
  return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function fallbackFontSize(name){
  const length=String(name||'').length;
  if(length<=5)return 44;
  if(length<=9)return 38;
  if(length<=14)return 31;
  if(length<=20)return 25;
  return 20;
}
function canonicalBrandName(slug){
  return brandNameBySlug.get(slug)||String(slug||'').split('-').filter(Boolean).map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ')||'Brand';
}
function fallbackBrandSvg(slug){
  const name=canonicalBrandName(slug);
  const safe=xmlEscape(name);
  const size=fallbackFontSize(name);
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96" role="img" aria-labelledby="brandTitle"><title id="brandTitle">${safe} brand name</title><rect width="320" height="96" rx="12" fill="#FFFFFF"/><text x="160" y="50" text-anchor="middle" dominant-baseline="middle" fill="#0F172A" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-0.7">${safe}</text></svg>`;
}
function brandSlugFromPath(path){
  const match=String(path||'').match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(!match)return null;
  try{return decodeURIComponent(match[1]).toLowerCase();}catch{return String(match[1]||'').toLowerCase();}
}
function visibleSvgBody(body){
  const text=Buffer.isBuffer(body)?body.toString('utf8'):String(body||'');
  if(!/<svg\b/i.test(text))return false;
  const root=(text.match(/<svg\b[^>]*>/i)||[])[0]||'';
  if(/\bdisplay\s*=\s*["']none["']/i.test(root)||/\bvisibility\s*=\s*["']hidden["']/i.test(root)||/\bopacity\s*=\s*["']0(?:\.0+)?["']/i.test(root))return false;
  const rootStyle=(root.match(/\bstyle\s*=\s*["']([^"']*)["']/i)||[])[1]||'';
  if(/(?:^|;)\s*display\s*:\s*none(?:;|$)/i.test(rootStyle)||/(?:^|;)\s*visibility\s*:\s*hidden(?:;|$)/i.test(rootStyle)||/(?:^|;)\s*opacity\s*:\s*0(?:\.0+)?(?:;|$)/i.test(rootStyle))return false;
  const visible=text
    .replace(/<defs\b[\s\S]*?<\/defs>/gi,'')
    .replace(/<metadata\b[\s\S]*?<\/metadata>/gi,'')
    .replace(/<title\b[\s\S]*?<\/title>/gi,'')
    .replace(/<desc\b[\s\S]*?<\/desc>/gi,'')
    .replace(/<style\b[\s\S]*?<\/style>/gi,'');
  return /<(?:path|text|image|polygon|polyline|rect|circle|ellipse|line|use)\b/i.test(visible);
}
function fallbackReason(res,body,slug){
  if(!slug)return null;
  if(Number(res.statusCode||200)>=400)return 'resolver-unavailable';
  const kind=String(res.getHeader('X-APG-Brand-Mark-Asset-Kind')||'').toLowerCase();
  if(kind==='brand_img')return 'generic-brand-image-rejected';
  // The automatic Amazon resolver has selected Amazon sub-brand promotional marks
  // (for example Amazon Haul) instead of the canonical Amazon identity. Until a
  // separately reviewed canonical vector is registered, neutral text is safer.
  if(slug==='amazon'&&String(res.getHeader('X-APG-Brand-Mark-Source')||'')!=='curated-reviewed-vector-override')return 'noncanonical-amazon-mark-rejected';
  const type=String(res.getHeader('Content-Type')||'').toLowerCase();
  if(type.includes('svg')&&!visibleSvgBody(body))return 'empty-or-hidden-svg-rejected';
  if(type.startsWith('image/')&&(!body||(Buffer.isBuffer(body)&&body.length===0)))return 'empty-image-rejected';
  return null;
}
function applyFallbackHeaders(res,slug,reason){
  res.statusCode=200;
  try{res.removeHeader('Content-Length')}catch{}
  try{res.removeHeader('ETag')}catch{}
  res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('X-APG-Brand-Mark-Source','canonical-brand-name-fallback');
  res.setHeader('X-APG-Brand-Mark-Quality','text-fallback-svg');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind','canonical-brand-name');
  res.setHeader('X-APG-Brand-Mark-Fallback','canonical-name');
  res.setHeader('X-APG-Brand-Mark-Fallback-Reason',reason||'resolver-unavailable');
  res.setHeader('X-APG-Brand-Mark-Canonical-Name',canonicalBrandName(slug));
  res.setHeader('X-APG-Brand-Mark-Integrity','v'+BRAND_MARK_INTEGRITY_VERSION);
}
function versionBrandMarkUrls(html){
  return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);
}
function injectParityMeta(html){
  let out=String(html||'');
  if(!out.includes('name="apg-brand-mark-device-parity"'))out=out.replace('</head>',`<meta name="apg-brand-mark-device-parity" content="v${BRAND_MARK_DEVICE_PARITY_VERSION}"></head>`);
  if(!out.includes('name="apg-brand-mark-integrity"'))out=out.replace('</head>',`<meta name="apg-brand-mark-integrity" content="v${BRAND_MARK_INTEGRITY_VERSION}"></head>`);
  return out;
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const brandSlug=brandSlugFromPath(path);
  res.setHeader('X-APG-Brand-Mark-Device-Parity','v'+BRAND_MARK_DEVICE_PARITY_VERSION);
  res.setHeader('X-APG-Brand-Mark-Integrity','v'+BRAND_MARK_INTEGRITY_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    if(req.method!=='HEAD'&&brandSlug&&(typeof body==='string'||Buffer.isBuffer(body))){
      const reason=fallbackReason(res,body,brandSlug);
      if(reason){
        applyFallbackHeaders(res,brandSlug,reason);
        body=Buffer.from(fallbackBrandSvg(brandSlug),'utf8');
      }
    }
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      let next=versionBrandMarkUrls(original);
      // Keep each existing onerror="this.hidden=true" browser safety net. The
      // canonical text fallback sits behind the image, so a transient network failure
      // still cannot expose a broken-image icon.
      next=injectParityMeta(next);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_MARK_DEVICE_PARITY_VERSION,
  BRAND_MARK_ASSET_VERSION,
  BRAND_MARK_INTEGRITY_VERSION,
  versionBrandMarkUrls,
  injectBrandMarkDeviceParityMeta:injectParityMeta,
  fallbackBrandSvg,
  brandSlugFromPath,
  visibleSvgBody,
  fallbackReason,
  canonicalBrandName
});
module.exports=handler;
