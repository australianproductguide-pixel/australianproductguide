'use strict';

// APG Missing Brand Logo Completion v73
//
// Narrow remediation layer derived from the 22 Aug 2026 /brands/ capture.
// IMPORTANT: this layer is intentionally NOT a general logo refresh. It only targets
// brands whose logo tile was blank or broken in that capture. Existing successful
// brand marks are passed through unchanged.
//
// For targeted brands:
//   - preserve any already-renderable graphical mark;
//   - reject invisible/empty SVGs and broken payloads;
//   - retry the existing first-party / reviewed completion functions in trust order;
//   - preserve explicit logo-use policy fallbacks;
//   - mark only those directory images for CSP-safe retry/print hydration.
const downstream=require('./earbuds-category-image-v72');

const BRAND_MARK_MISSING_ONLY_VERSION='73.0';
const ASSET_VERSION='73.0';

const MISSING_ONLY_SLUGS=Object.freeze([
  '8bitdo','american-tourister','breville','samsung','philips','delonghi','dyson',
  'electrolux','foodsaver','fujifilm','gerni','ghd','google','gooloo','gopro','gozney',
  'hisense','honor','hulkman','hyperice','hyperx','inkbird','insta360','instant-pot',
  'july','karcher','kenwood','keychron','kitchenaid','kobo','kodak','kuvings','lenovo','lifx',
  'marshall','meross','microsoft','miele','milwaukee','miofive','nanit','neakasa','nextbase',
  'nintendo','noco','nutribullet','nvidia','olimpia-splendid','ooni','oppo','oral-b','panasonic',
  'parlux','petlibro','petsafe','philips-hue','philips-sonicare','polaroid','razer','remington',
  'renpho','reolink','ring','russell-hobbs','ryobi','samsonite','sandisk','scansnap','schwinn',
  'secretlab','shark','sharp','shure','steamery','steelcase','sunbeam','tcl','tefal','therabody',
  'tiger','tile','ugreen','uperfect','vantrue','viewsonic','viofo','vitamix','vtech','wahl',
  'waterpik','westinghouse','whisker','whoop','winix','withings','xgimi','xiaomi','zerowater',
  'zojirushi'
]);
const TARGETS=new Set(MISSING_ONLY_SLUGS);

function restricted(image){
  return Boolean(image&&(image.intentionalPolicyFallback||image.policyReason||image.resolverSource==='brand-name-policy-fallback'));
}
function terminal(image){
  return !image||Boolean(image.terminalFallback)||image.resolverSource==='canonical-brand-name-fallback'||image.assetKind==='canonical-brand-name';
}
function svgRenderable(buffer){
  if(!buffer)return false;
  const text=Buffer.isBuffer(buffer)?buffer.toString('utf8',0,Math.min(buffer.length,192*1024)):String(buffer||'');
  if(!/<svg\b/i.test(text))return false;
  const root=(text.match(/<svg\b[^>]*>/i)||[])[0]||'';
  if(/\bopacity\s*=\s*["']0(?:\.0+)?["']/i.test(root)||/\bdisplay\s*=\s*["']none["']/i.test(root)||/\bvisibility\s*=\s*["']hidden["']/i.test(root))return false;
  const style=(root.match(/\bstyle\s*=\s*["']([^"']*)["']/i)||[])[1]||'';
  if(/(?:^|;)\s*opacity\s*:\s*0(?:\.0+)?(?:;|$)/i.test(style)||/(?:^|;)\s*display\s*:\s*none(?:;|$)/i.test(style)||/(?:^|;)\s*visibility\s*:\s*hidden(?:;|$)/i.test(style))return false;
  if(typeof downstream.visibleSvgBody==='function'&&!downstream.visibleSvgBody(Buffer.isBuffer(buffer)?buffer:Buffer.from(text,'utf8')))return false;
  const visible=text
    .replace(/<defs\b[\s\S]*?<\/defs>/gi,'')
    .replace(/<metadata\b[\s\S]*?<\/metadata>/gi,'')
    .replace(/<title\b[\s\S]*?<\/title>/gi,'')
    .replace(/<desc\b[\s\S]*?<\/desc>/gi,'')
    .replace(/<style\b[\s\S]*?<\/style>/gi,'');
  return /<(?:path|text|image|polygon|polyline|rect|circle|ellipse|line|use)\b/i.test(visible);
}
function graphical(image){
  if(!image||restricted(image)||terminal(image)||!image.buffer)return false;
  const type=String(image.type||'').toLowerCase();
  if(type.includes('svg')||/<svg\b/i.test(image.buffer.toString('utf8',0,4096)))return svgRenderable(image.buffer);
  if(!type.startsWith('image/'))return false;
  if(!image.buffer.length)return false;
  if(typeof downstream.dimensions==='function'){
    const d=downstream.dimensions(image.buffer,type)||{};
    if(d.width===0||d.height===0)return false;
  }
  return true;
}
async function tryResolver(fn,slug){
  if(typeof fn!=='function')return null;
  try{
    const result=await fn(slug);
    return graphical(result)?result:null;
  }catch{return null;}
}
async function resolveMissingOnly(slug){
  const base=typeof downstream.resolveDeepOfficialBrandMark==='function'
    ? await downstream.resolveDeepOfficialBrandMark(slug)
    : null;
  if(restricted(base)||graphical(base))return base;

  // Only a genuinely blank/broken/terminal target reaches here. Re-run the existing
  // governed resolvers in quality order rather than altering successful identities.
  const candidates=[
    downstream.discoverDeepOfficialLogo,
    downstream.resolveExplicitOfficialLogo,
    downstream.resolvePinnedVector,
    downstream.resolveResidualOverride,
    downstream.resolveDeclaredOfficialIcon,
    downstream.resolveRelaxedOfficialFavicon,
    downstream.resolveLegacyDomainIcon
  ];
  for(const fn of candidates){
    const image=await tryResolver(fn,slug);
    if(image)return {...image,terminalFallback:false};
  }
  return base;
}
function serve(req,res,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/png');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Missing-Only','v'+BRAND_MARK_MISSING_ONLY_VERSION);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'governed-brand-identity');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.provenanceReference)res.setHeader('X-APG-Brand-Mark-Provenance-Reference',image.provenanceReference);
  if(image.policyReason)res.setHeader('X-APG-Brand-Mark-Policy-Reason',image.policyReason);
  if(image.policyReference)res.setHeader('X-APG-Brand-Mark-Policy-Reference',image.policyReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));
  return req.method==='HEAD'?res.end():res.end(image.buffer);
}
function targetBrandImageTag(tag){
  const match=String(tag||'').match(/\bsrc=["']\/assets\/brand-marks\/([^?"']+)(?:\?[^"']*)?["']/i);
  if(!match)return null;
  let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{return null;}
  return TARGETS.has(slug)?slug:null;
}
function patchTargetedDirectoryHtml(html,path){
  if(path!=='/brands/'&&path!=='/brands')return String(html||'');
  let out=String(html||'');
  out=out.replace(/<img\b[^>]*\bsrc=["']\/assets\/brand-marks\/[^"']+["'][^>]*>/gi,tag=>{
    const slug=targetBrandImageTag(tag);if(!slug)return tag;
    let next=tag.replace(/(\bsrc=["']\/assets\/brand-marks\/[^?"']+)(?:\?[^"']*)?(["'])/i,`$1?v=${ASSET_VERSION}$2`);
    if(!/\bdata-apg-missing-logo-target=/i.test(next))next=next.replace(/^<img\b/i,`<img data-apg-missing-logo-target="${slug}"`);
    return next;
  });
  if(!out.includes('/assets/brand-missing-logo-loader-v73.js')){
    out=out.replace('</body>',`<script src="/assets/brand-missing-logo-loader-v73.js?v=${ASSET_VERSION}" defer></script></body>`);
  }
  if(!out.includes('name="apg-brand-mark-missing-only"')){
    out=out.replace('</head>',`<meta name="apg-brand-mark-missing-only" content="v${BRAND_MARK_MISSING_ONLY_VERSION}"></head>`);
  }
  return out;
}
async function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Missing-Only','v'+BRAND_MARK_MISSING_ONLY_VERSION);
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{}
    if(TARGETS.has(slug)){
      const image=await resolveMissingOnly(slug);
      if(image)return serve(req,res,image);
    }
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=patchTargetedDirectoryHtml(original,path);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}
Object.assign(handler,downstream,{BRAND_MARK_MISSING_ONLY_VERSION,ASSET_VERSION,MISSING_ONLY_SLUGS,TARGETS,svgRenderable,graphical,resolveMissingOnly,patchTargetedDirectoryHtml});
module.exports=handler;
