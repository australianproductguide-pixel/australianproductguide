'use strict';

// APG Brand Mark Completion v68
//
// Outer completion layer for the 178-brand catalogue. It never replaces an identity
// already accepted by v67.2. It intervenes only when v67.2 would show APG's text
// fallback and tries, in order:
//   1) a pinned reviewed vector reproduction whose embedded title exactly matches the
//      canonical APG brand;
//   2) the cached favicon of that brand's governed official domain, accepting native
//      official-site marks down to 16 px where no better first-party asset exists;
//   3) Google's legacy domain favicon cache, but only when it differs from Google's
//      generic unknown-domain icon.
// If none succeeds, v67.2 remains fail-closed on the canonical brand-name SVG.
//
// No product/lifestyle image is eligible here. All browser-facing assets remain on the
// same APG endpoint so desktop/mobile/brand pages/product placeholders stay identical.
const downstream=require('./brand-mark-complete-v67');
const {brands,slugify}=require('./routes');

const BRAND_MARK_COMPLETION_VERSION='68.0';
const BRAND_MARK_ASSET_VERSION='68.0';
const SIMPLE_ICONS_COMMIT='34c22501f9ac9f22b12f825677ccbab1fb22e14b';
const MAX_BYTES=256*1024;
const TIMEOUT_MS=2600;
const CACHE_TTL_MS=14*24*60*60*1000;
const NEGATIVE_TTL_MS=60*60*1000;
const cache=new Map();
const brandNameBySlug=new Map(brands.map(name=>[slugify(name),name]));
const specialSimpleSlugs={
  'audio-technica':'audiotechnica',
  'tp-link':'tplink',
  'oral-b':'oralb',
  'instant-pot':'instantpot',
  'cloud-nine':'cloudnine',
  'brass-monkey':'brassmonkey',
  'bosch-professional':'bosch',
  'crock-pot':'crockpot'
};

function cacheGet(key){const x=cache.get(key);if(!x||x.expiresAt<Date.now()){if(x)cache.delete(key);return undefined;}return x.value;}
function cacheSet(key,value,ttl=value?CACHE_TTL_MS:NEGATIVE_TTL_MS){cache.set(key,{value,expiresAt:Date.now()+ttl});}
function normalise(value){return String(value||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');}
function isTerminal(image){return !image||Boolean(image.terminalFallback)||image.resolverSource==='canonical-brand-name-fallback'||image.assetKind==='canonical-brand-name';}
function simpleSlugFor(slug){return specialSimpleSlugs[slug]||String(slug||'').replace(/[^a-z0-9]/g,'');}
async function fetchBytes(url,accept){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{
      'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)',
      'Accept':accept||'image/svg+xml,image/png,image/webp,image/jpeg,image/*,*/*;q=0.2'
    }});
    if(!response.ok)return null;
    const len=Number(response.headers.get('content-length')||0);if(len>MAX_BYTES)return null;
    const buffer=Buffer.from(await response.arrayBuffer());if(!buffer.length||buffer.length>MAX_BYTES)return null;
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    return {buffer,type,url:response.url||url,status:response.status};
  }catch{return null;}finally{clearTimeout(timer);}
}
function vectorTitle(buffer){return ((String(buffer||'').match(/<title>([^<]+)<\/title>/i)||[])[1]||'').trim();}
function vectorMatchesBrand(buffer,brand){
  const title=vectorTitle(buffer),a=normalise(title),b=normalise(brand);
  if(!a||!b)return false;
  if(a===b)return true;
  // Narrow known corporate naming equivalences only; do not accept fuzzy matches.
  const equivalents={ghd:['goodhairday'],eufy:['eufy'],xgimi:['xgimi']};
  return (equivalents[b]||[]).includes(a);
}
async function resolvePinnedVector(slug){
  const key='vector:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const brand=brandNameBySlug.get(slug);if(!brand){cacheSet(key,null);return null;}
  const icon=simpleSlugFor(slug);if(!icon){cacheSet(key,null);return null;}
  const url=`https://raw.githubusercontent.com/simple-icons/simple-icons/${SIMPLE_ICONS_COMMIT}/icons/${encodeURIComponent(icon)}.svg`;
  const raw=await fetchBytes(url,'image/svg+xml,text/plain;q=0.8,*/*;q=0.1');
  if(!raw||!/<svg\b/i.test(raw.buffer.toString('utf8',0,4096))||!vectorMatchesBrand(raw.buffer,brand)){cacheSet(key,null);return null;}
  const value={
    buffer:raw.buffer,type:'image/svg+xml',source:url,resolverSource:'reviewed-pinned-vector-identity',
    quality:'premium-vector',assetKind:'reviewed-vector-identity',officialReference:`https://${downstream.officialDomains[slug]}/`,
    provenanceReference:`https://github.com/simple-icons/simple-icons/tree/${SIMPLE_ICONS_COMMIT}/icons`,terminalFallback:false
  };
  cacheSet(key,value);return value;
}
async function resolveRelaxedOfficialFavicon(slug){
  const key='relaxed:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const domain=downstream.officialDomains&&downstream.officialDomains[slug];if(!domain){cacheSet(key,null);return null;}
  const page=`https://${domain}/`;
  const url='https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&drop_404_icon=true&check_seen=true&size=128&min_size=16&max_size=256&fallback_opts=TYPE,SIZE,URL&url='+encodeURIComponent(page);
  const raw=await fetchBytes(url);if(!raw||!raw.type.startsWith('image/')){cacheSet(key,null);return null;}
  const meta=typeof downstream.dimensions==='function'?(downstream.dimensions(raw.buffer,raw.type)||{}):{};
  const width=Number(meta.width||0),height=Number(meta.height||0),short=Math.min(width,height);
  if(!width||!height||short<16){cacheSet(key,null);return null;}
  const value={buffer:raw.buffer,type:raw.type,source:raw.url,width,height,
    resolverSource:'official-domain-favicon-native',quality:short>=96?'high-domain-icon':short>=48?'acceptable-domain-icon':'native-domain-icon',
    assetKind:'official-domain-favicon',officialReference:page,terminalFallback:false};
  cacheSet(key,value);return value;
}
async function genericLegacyIcon(){
  const key='legacy:generic',cached=cacheGet(key);if(cached!==undefined)return cached;
  const raw=await fetchBytes('https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Fapg-brand-identity-does-not-exist.invalid%2F&sz=128');
  cacheSet(key,raw||null,24*60*60*1000);return raw||null;
}
async function resolveLegacyDomainIcon(slug){
  const key='legacy:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const domain=downstream.officialDomains&&downstream.officialDomains[slug];if(!domain){cacheSet(key,null);return null;}
  const [raw,generic]=await Promise.all([
    fetchBytes('https://www.google.com/s2/favicons?domain_url='+encodeURIComponent(`https://${domain}/`)+'&sz=128'),
    genericLegacyIcon()
  ]);
  if(!raw||!raw.type.startsWith('image/')||(generic&&Buffer.compare(raw.buffer,generic.buffer)===0)){cacheSet(key,null);return null;}
  const meta=typeof downstream.dimensions==='function'?(downstream.dimensions(raw.buffer,raw.type)||{}):{};
  const width=Number(meta.width||0),height=Number(meta.height||0),short=Math.min(width,height);
  if(!width||!height||short<16){cacheSet(key,null);return null;}
  const value={buffer:raw.buffer,type:raw.type,source:raw.url,width,height,
    resolverSource:'official-domain-favicon-legacy-cache',quality:short>=96?'high-domain-icon':short>=48?'acceptable-domain-icon':'native-domain-icon',
    assetKind:'official-domain-favicon',officialReference:`https://${domain}/`,terminalFallback:false};
  cacheSet(key,value);return value;
}
async function resolveCompleteBrandMark(slug){
  const base=await downstream.resolveCompleteBrandMark(slug);
  if(!isTerminal(base))return base;
  const vector=await resolvePinnedVector(slug);if(vector)return vector;
  const relaxed=await resolveRelaxedOfficialFavicon(slug);if(relaxed)return relaxed;
  const legacy=await resolveLegacyDomainIcon(slug);if(legacy)return legacy;
  return base;
}
function serveImage(req,res,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/png');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Completion','v'+BRAND_MARK_COMPLETION_VERSION);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'governed-brand-identity');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.provenanceReference)res.setHeader('X-APG-Brand-Mark-Provenance-Reference',image.provenanceReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();return res.end(image.buffer);
}
function versionBrandMarkUrls(html){return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);}
function injectMeta(html){const text=String(html||'');if(text.includes('name="apg-brand-mark-completion"'))return text;return text.replace('</head>',`<meta name="apg-brand-mark-completion" content="v${BRAND_MARK_COMPLETION_VERSION}"></head>`);}
async function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Completion','v'+BRAND_MARK_COMPLETION_VERSION);
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{}
    const base=await downstream.resolveCompleteBrandMark(slug);
    if(isTerminal(base)){
      const image=(await resolvePinnedVector(slug))||(await resolveRelaxedOfficialFavicon(slug))||(await resolveLegacyDomainIcon(slug));
      if(image)return serveImage(req,res,image);
    }
    return downstream(req,res);
  }
  const end=res.end.bind(res);res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const was=Buffer.isBuffer(body),original=was?body.toString('utf8'):body;let next=injectMeta(versionBrandMarkUrls(original));
      if(next!==original){body=was?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };return downstream(req,res);
}
Object.assign(handler,downstream,{BRAND_MARK_COMPLETION_VERSION,BRAND_MARK_ASSET_VERSION,SIMPLE_ICONS_COMMIT,resolvePinnedVector,resolveRelaxedOfficialFavicon,resolveLegacyDomainIcon,resolveCompleteBrandMark,versionBrandMarkUrls});
module.exports=handler;
