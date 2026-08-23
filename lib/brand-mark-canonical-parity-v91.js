'use strict';

// APG Brand Mark Canonical Parity v91.0
//
// Final, deliberately narrow identity guard for brand marks whose automatic resolver
// history has produced device/cache divergence or unsuitable assets.
//
// - Breville: always prefer APG's already-reviewed vector override. A low-resolution
//   first-party raster must not supersede the reviewed vector simply because it is
//   currently discoverable on the brand site.
// - Amazon: never serve a discovered product image, favicon, Smile or stand-alone Amazon
//   graphical mark from the brand directory. Under the current Amazon.com.au Associates
//   Trademark Guidelines, Amazon Marks may be used only for the authorised purpose of
//   advertising product availability on Amazon with a corresponding Special Link. The
//   APG brand-directory tile is an internal taxonomy link, so a neutral canonical brand-
//   name rendering is the safer compliant identity until specific approval is recorded.
//
// This layer is intentionally outermost so older deep/missing-logo completion layers
// cannot bypass these final decisions. The v91 query version also invalidates historical
// browser caches that may contain different bytes for the same v70/v73 URL.
const crypto=require('crypto');
const downstream=require('./action3-search-commerce-v90');
const curated=require('./brand-mark-curated-v66');
const parity=require('./brand-mark-device-parity-v66');

const VERSION='91.0';
const TARGETS=new Set(['amazon','breville']);
const AMAZON_POLICY_REFERENCE='https://affiliate-program.amazon.com.au/help/operating/policies?ac-ms-src=ac-nav';

function slugFromPath(path){
  const m=String(path||'').match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(!m)return null;
  try{return decodeURIComponent(m[1]).toLowerCase();}catch{return String(m[1]||'').toLowerCase();}
}

function canonicalNameImage(slug,{source='canonical-brand-name-v91',policyReason=null,policyReference=null}={}){
  const svg=typeof parity.fallbackBrandSvg==='function'
    ? parity.fallbackBrandSvg(slug)
    : `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96"><rect width="320" height="96" rx="12" fill="#fff"/><text x="160" y="50" text-anchor="middle" dominant-baseline="middle" fill="#0f172a" font-family="Arial,Helvetica,sans-serif" font-size="38" font-weight="700">${String(slug||'Brand')}</text></svg>`;
  return {
    buffer:Buffer.from(svg,'utf8'),type:'image/svg+xml; charset=utf-8',
    resolverSource:source,quality:'policy-safe-vector',assetKind:'canonical-brand-name',
    width:320,height:96,terminalFallback:true,intentionalPolicyFallback:Boolean(policyReason),
    policyReason,policyReference
  };
}

function amazonIdentity(){
  return canonicalNameImage('amazon',{
    source:'amazon-associates-brand-name-fallback',
    policyReason:'amazon-associates-trademark-guidelines-restrict-brand-directory-logo-use',
    policyReference:AMAZON_POLICY_REFERENCE
  });
}

async function brevilleIdentity(){
  try{
    const image=await curated.fetchCurated('breville');
    if(image&&image.buffer&&String(image.type||'').toLowerCase().includes('svg')){
      const metadata=image.metadata||{};
      return {
        ...image,
        resolverSource:'curated-reviewed-vector-override',
        quality:'premium-vector',
        assetKind:'curated-reviewed-vector',
        officialReference:metadata.officialReference||'https://www.breville.com/en-au',
        provenanceReference:metadata.sourcePage||'https://commons.wikimedia.org/wiki/File:Breville_logo.svg',
        terminalFallback:false
      };
    }
  }catch{}
  // Never fall back to the known low-resolution automatic raster for this target.
  return canonicalNameImage('breville',{source:'breville-reviewed-vector-unavailable-fallback'});
}

async function resolveTarget(slug){
  if(slug==='amazon')return amazonIdentity();
  if(slug==='breville')return brevilleIdentity();
  return null;
}

function etag(buffer){return `"apg-brand-v91-${crypto.createHash('sha256').update(buffer).digest('hex').slice(0,24)}"`;}
function serve(req,res,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Canonical-Parity','v'+VERSION);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'canonical-parity-v91');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.provenanceReference)res.setHeader('X-APG-Brand-Mark-Provenance-Reference',image.provenanceReference);
  if(image.policyReason)res.setHeader('X-APG-Brand-Mark-Policy-Reason',image.policyReason);
  if(image.policyReference)res.setHeader('X-APG-Brand-Mark-Policy-Reference',image.policyReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('ETag',etag(image.buffer));
  res.setHeader('Content-Length',String(image.buffer.length));
  return req.method==='HEAD'?res.end():res.end(image.buffer);
}

function versionTargetUrls(html){
  return String(html||'').replace(/(\/assets\/brand-marks\/(?:amazon|breville))(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${VERSION}`);
}
function injectMeta(html){
  const text=String(html||'');
  if(text.includes('name="apg-brand-mark-canonical-parity"'))return text;
  return text.replace('</head>',`<meta name="apg-brand-mark-canonical-parity" content="v${VERSION}"></head>`);
}

async function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Canonical-Parity','v'+VERSION);
  const slug=slugFromPath(path);
  if(slug&&TARGETS.has(slug)&&(req.method==='GET'||req.method==='HEAD')){
    const image=await resolveTarget(slug);
    if(image)return serve(req,res,image);
  }

  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=injectMeta(versionTargetUrls(original));
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    res.setHeader('X-APG-Brand-Mark-Canonical-Parity','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_MARK_CANONICAL_PARITY_VERSION:VERSION,
  BRAND_MARK_CANONICAL_PARITY_TARGETS:TARGETS,
  AMAZON_POLICY_REFERENCE,
  amazonIdentity,brevilleIdentity,resolveTarget,versionTargetUrls,canonicalNameImage,slugFromPath
});
module.exports=handler;
