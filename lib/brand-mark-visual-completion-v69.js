'use strict';

// APG Brand Mark Visual Completion v69.3
//
// Final visual-quality layer for the 178-brand catalogue. v69.2 already attempts a
// full first-party logo/wordmark before falling back to official-domain icons. This
// layer closes the remaining visual gap: when the best first-party result is only a
// favicon/app/site icon, prefer an exact-title, pinned, reviewed vector identity from
// the governed v68 Simple Icons snapshot when one exists.
//
// This does NOT describe the vector repository as the brand owner. The official domain
// remains the identity reference and APG uses the vector only as a reviewed reproduction
// of the same nominative brand mark. Curated first-party/reviewed marks and explicit
// first-party logos always remain ahead of this layer. Brands with recorded logo-use
// restrictions remain neutral text fallbacks and are never overridden here.
const downstream=require('./brand-mark-official-completion-v69');

const BRAND_MARK_VISUAL_COMPLETION_VERSION='69.3';
const BRAND_MARK_ASSET_VERSION='69.3';

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
  isRestrictedFallback,
  isWeakSiteIdentity,
  isTerminalFallback,
  resolveVisualBrandMark,
  versionBrandMarkUrls
});
module.exports=handler;
