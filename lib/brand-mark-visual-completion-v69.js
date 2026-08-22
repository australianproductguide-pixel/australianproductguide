'use strict';

// APG Brand Mark Visual Completion v69.5
//
// Final visual-quality and rights-safety layer for the 178-brand catalogue.
// v69.2 attempts a full first-party logo/wordmark before falling back to official-domain
// icons. This layer then prefers an exact-title, pinned, reviewed vector reproduction
// over a weak favicon/app icon when that is both available and not subject to a recorded
// logo-use restriction.
//
// The vector repository is not represented as the brand owner. Official domains remain
// the identity references. Where current published brand terms expressly require prior
// written permission for logo/trade-mark use, APG deliberately renders its neutral
// canonical brand-name SVG instead of using the graphical mark.
const downstream=require('./brand-mark-official-completion-v69');

const BRAND_MARK_VISUAL_COMPLETION_VERSION='69.5';
const BRAND_MARK_ASSET_VERSION='69.5';

const ADDITIONAL_LOGO_USE_RESTRICTIONS=Object.freeze({
  'canon':Object.freeze({
    reason:'brand-terms-require-express-written-permission-for-trade-mark-use',
    termsUrl:'https://www.canon.com.au/terms-of-use'
  }),
  'jbl':Object.freeze({
    reason:'brand-terms-require-prior-written-permission-for-logo-trade-mark-use',
    termsUrl:'https://www.jbl.com.au/terms-of-use.html'
  }),
  'logitech':Object.freeze({
    reason:'brand-guidelines-require-express-written-trade-mark-licence-for-corporate-logo-design-marks',
    termsUrl:'https://futureisnow.logitech.com/en-gb/tos/trademark-guidelines.html'
  })
});

function canonicalNameFallback(slug,restriction){
  const svg=typeof downstream.fallbackBrandSvg==='function'
    ? downstream.fallbackBrandSvg(slug)
    : `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96"><rect width="320" height="96" fill="white"/><text x="160" y="52" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700">${String(slug||'Brand').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text></svg>`;
  return {
    buffer:Buffer.from(svg,'utf8'),
    type:'image/svg+xml',
    resolverSource:'brand-name-policy-fallback',
    assetKind:'canonical-brand-name',
    quality:'text-fallback-svg',
    officialReference:(downstream.officialDomains&&downstream.officialDomains[slug])?`https://${downstream.officialDomains[slug]}/`:null,
    policyReason:restriction.reason,
    policyReference:restriction.termsUrl,
    intentionalPolicyFallback:true,
    terminalFallback:true
  };
}
function isRestrictedFallback(image){
  return Boolean(image&&(image.intentionalPolicyFallback||image.resolverSource==='brand-name-policy-fallback'||image.policyReason));
}
function isWeakSiteIdentity(image){
  if(!image||isRestrictedFallback(image))return false;
  const source=String(image.resolverSource||'').toLowerCase();
  const kind=String(image.assetKind||'').toLowerCase();
  return kind.includes('favicon')||kind.includes('icon')||source.includes('favicon')||source.includes('declared-identity');
}
function isTerminalFallback(image){
  return !image||Boolean(image.terminalFallback)||image.resolverSource==='canonical-brand-name-fallback'||image.assetKind==='canonical-brand-name';
}
async function resolveVisualBrandMark(slug){
  const restriction=ADDITIONAL_LOGO_USE_RESTRICTIONS[slug];
  if(restriction)return canonicalNameFallback(slug,restriction);
  const base=await downstream.resolveCompleteBrandMark(slug);
  if(isRestrictedFallback(base))return base;
  if((isWeakSiteIdentity(base)||isTerminalFallback(base))&&typeof downstream.resolvePinnedVector==='function'){
    const vector=await downstream.resolvePinnedVector(slug);
    if(vector)return {
      ...vector,
      resolverSource:'reviewed-pinned-vector-identity',
      assetKind:'reviewed-vector-identity',
      officialReference:(downstream.officialDomains&&downstream.officialDomains[slug])?`https://${downstream.officialDomains[slug]}/`:vector.officialReference,
      terminalFallback:false
    };
  }
  return base;
}
function serveImage(req,res,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/png');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Visual-Completion','v'+BRAND_MARK_VISUAL_COMPLETION_VERSION);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'governed-brand-identity');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.provenanceReference)res.setHeader('X-APG-Brand-Mark-Provenance-Reference',image.provenanceReference);
  if(image.presentation)res.setHeader('X-APG-Brand-Mark-Presentation',image.presentation);
  if(image.policyReason)res.setHeader('X-APG-Brand-Mark-Policy-Reason',image.policyReason);
  if(image.policyReference)res.setHeader('X-APG-Brand-Mark-Policy-Reference',image.policyReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();
  return res.end(image.buffer);
}
function versionBrandMarkUrls(html){
  return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);
}
function injectMeta(html){
  const text=String(html||'');
  if(text.includes('name="apg-brand-mark-visual-completion"'))return text;
  return text.replace('</head>',`<meta name="apg-brand-mark-visual-completion" content="v${BRAND_MARK_VISUAL_COMPLETION_VERSION}"></head>`);
}
async function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Visual-Completion','v'+BRAND_MARK_VISUAL_COMPLETION_VERSION);
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{}
    const image=await resolveVisualBrandMark(slug);
    if(image)return serveImage(req,res,image);
    return downstream(req,res);
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const was=Buffer.isBuffer(body),original=was?body.toString('utf8'):body;
      const next=injectMeta(versionBrandMarkUrls(original));
      if(next!==original){body=was?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_MARK_VISUAL_COMPLETION_VERSION,
  BRAND_MARK_ASSET_VERSION,
  ADDITIONAL_LOGO_USE_RESTRICTIONS,
  canonicalNameFallback,
  isRestrictedFallback,
  isWeakSiteIdentity,
  isTerminalFallback,
  resolveVisualBrandMark,
  versionBrandMarkUrls
});
module.exports=handler;
