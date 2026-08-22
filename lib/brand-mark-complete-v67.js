'use strict';

// APG Brand Mark Complete v67
//
// Purpose: restore a recognisable, governed brand identity for every canonical APG
// brand without re-opening the low-quality / misleading-image failure modes that v65
// and v66 closed.
//
// Trust order for /assets/brand-marks/<slug>:
//   1. reviewed curated vector overrides (v66)
//   2. v65 high-quality official-domain logo / wordmark
//   3. high-resolution icon explicitly declared by the brand's official domain
//   4. high-resolution cached favicon for that same governed official domain
//   5. v66.2 canonical brand-name SVG as the final fail-closed state
//
// Steps 3-4 are deliberately limited to the 178 governed official domains. They are
// brand/site identity fallbacks, not product photography and not evidence of any
// partnership, endorsement or commercial relationship. Generic product/lifestyle
// images remain rejected.
const downstream=require('./brand-mark-device-parity-v66');
const officialDomains=require('../data/brand-official-domains-v62');
const {brands,slugify}=require('./routes');

const BRAND_MARK_COMPLETE_VERSION='67.1';
const BRAND_MARK_ASSET_VERSION='67.1';
const ORIGIN='https://australianproductguide.au';
const MAX_IMAGE_BYTES=1024*1024;
const MAX_HTML_BYTES=640*1024;
const MAX_MANIFEST_BYTES=160*1024;
const PAGE_TIMEOUT_MS=4200;
const IMAGE_TIMEOUT_MS=2600;
const TOTAL_RESOLVE_MS=5200;
const CACHE_TTL_MS=7*24*60*60*1000;
const NEGATIVE_CACHE_TTL_MS=30*60*1000;
const cache=new Map();
const brandBySlug=new Map(brands.map(name=>[slugify(name),name]));

function cacheGet(key){
  const hit=cache.get(key);
  if(!hit||hit.expiresAt<Date.now()){if(hit)cache.delete(key);return undefined;}
  return hit.value;
}
function cacheSet(key,value,ttl=value?CACHE_TTL_MS:NEGATIVE_CACHE_TTL_MS){cache.set(key,{value,expiresAt:Date.now()+ttl});}
function cleanUrl(value,base){
  if(!value)return null;
  const raw=String(value).replace(/&amp;/g,'&').trim();
  if(!raw||raw.startsWith('data:')||raw.startsWith('javascript:'))return null;
  try{const u=new URL(raw,base);return (u.protocol==='https:'||u.protocol==='http:')?u.href:null;}catch{return null;}
}
function attr(tag,name){
  return ((String(tag).match(new RegExp('\\b'+name+'=["\\\']([^"\\\']+)["\\\']','i'))||[])[1]||'').trim();
}
function sizesScore(value){
  let best=0;
  for(const token of String(value||'').split(/\s+/)){
    const m=token.match(/^(\d+)x(\d+)$/i);if(m)best=Math.max(best,Math.min(Number(m[1]),Number(m[2])));
    if(token.toLowerCase()==='any')best=Math.max(best,512);
  }
  return best;
}
function candidateScore(candidate){
  let score=Number(candidate.declaredSize||0);
  if(candidate.kind==='manifest-icon')score+=500;
  if(candidate.kind==='apple-touch-icon')score+=460;
  if(candidate.kind==='svg-icon')score+=430;
  if(candidate.kind==='declared-icon')score+=400;
  if(candidate.kind==='common-icon')score+=180;
  if(/\.svg(?:$|[?#])/i.test(candidate.url))score+=250;
  if(/(?:logo|brand|wordmark)/i.test(candidate.url))score+=120;
  if(/(?:192|256|384|512)/.test(candidate.url))score+=35;
  return score;
}
function addCandidate(list,seen,url,base,kind,declaredSize=0){
  const clean=cleanUrl(url,base);if(!clean||seen.has(clean))return;
  seen.add(clean);list.push({url:clean,kind,declaredSize:Number(declaredSize||0)});
}
function declaredIconCandidates(html,base){
  const list=[],seen=new Set(),text=String(html||'');
  let manifestUrl=null;
  for(const tag of text.match(/<link\b[^>]*>/gi)||[]){
    const rel=attr(tag,'rel').toLowerCase();
    const href=attr(tag,'href');
    if(!href)continue;
    if(rel.split(/\s+/).includes('manifest')){manifestUrl=cleanUrl(href,base);continue;}
    const size=sizesScore(attr(tag,'sizes'));
    if(rel.includes('apple-touch-icon'))addCandidate(list,seen,href,base,'apple-touch-icon',size||180);
    else if(/(^|\s)(shortcut\s+)?icon(\s|$)/.test(rel))addCandidate(list,seen,href,base,/\.svg(?:$|[?#])/i.test(href)?'svg-icon':'declared-icon',size);
    else if(rel.includes('mask-icon')&&/\.svg(?:$|[?#])/i.test(href))addCandidate(list,seen,href,base,'svg-icon',512);
  }
  for(const p of ['/apple-touch-icon.png','/android-chrome-512x512.png','/android-chrome-192x192.png','/favicon-512x512.png','/favicon-192x192.png','/favicon.svg']){
    addCandidate(list,seen,p,base,p.endsWith('.svg')?'svg-icon':'common-icon',p.includes('512')?512:p.includes('192')?192:p.includes('apple')?180:0);
  }
  return {manifestUrl,candidates:list.sort((a,b)=>candidateScore(b)-candidateScore(a)).slice(0,12)};
}
function manifestCandidates(manifest,base){
  const list=[],seen=new Set();
  for(const icon of Array.isArray(manifest&&manifest.icons)?manifest.icons:[]){
    if(!icon||!icon.src)continue;
    const type=String(icon.type||'').toLowerCase();
    if(type&&!(type.startsWith('image/')||type.includes('svg')))continue;
    addCandidate(list,seen,icon.src,base,'manifest-icon',sizesScore(icon.sizes));
  }
  return list.sort((a,b)=>candidateScore(b)-candidateScore(a)).slice(0,8);
}
function svgAppearsWhiteOnly(buffer){
  if(!buffer)return false;
  const text=Buffer.isBuffer(buffer)?buffer.toString('utf8',0,Math.min(buffer.length,192*1024)):String(buffer||'');
  if(!/<svg\b/i.test(text)||/<image\b/i.test(text))return false;
  const paints=[];
  for(const match of text.matchAll(/(?:fill|stroke)\s*(?::|=)\s*["']?\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\)|[a-z]+)/gi)){
    const value=String(match[1]||'').trim().toLowerCase();
    if(!value||['none','transparent','inherit','currentcolor'].includes(value))continue;
    paints.push(value);
  }
  if(!paints.length)return false;
  const white=value=>{
    const compact=value.replace(/\s+/g,'');
    return compact==='white'||/^#(?:fff|ffffff|ffffffff)$/i.test(compact)||/^rgba?\(255,255,255(?:,1(?:\.0+)?)?\)$/i.test(compact);
  };
  return paints.every(white);
}
async function fetchWithTimeout(url,{accept,timeout=IMAGE_TIMEOUT_MS,maxBytes=MAX_IMAGE_BYTES}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{
      'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)',
      'Accept':accept||'image/svg+xml,image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.3'
    }});
    if(!response.ok)return null;
    const length=Number(response.headers.get('content-length')||0);if(length>maxBytes)return null;
    const buffer=Buffer.from(await response.arrayBuffer());if(!buffer.length||buffer.length>maxBytes)return null;
    return {buffer,type:String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase(),url:response.url||url};
  }catch{return null;}finally{clearTimeout(timer);}
}
async function fetchOfficialPage(domain){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),PAGE_TIMEOUT_MS);
  const url=`https://${domain}/`;
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{
      'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)',
      'Accept':'text/html,application/xhtml+xml'
    }});
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html')&&!type.includes('application/xhtml'))return null;
    const text=await response.text();
    return {text:text.length>MAX_HTML_BYTES?text.slice(0,MAX_HTML_BYTES):text,url:response.url||url};
  }catch{return null;}finally{clearTimeout(timer);}
}
async function fetchManifest(url){
  if(!url)return null;
  const raw=await fetchWithTimeout(url,{accept:'application/manifest+json,application/json,text/plain,*/*;q=0.2',timeout:IMAGE_TIMEOUT_MS,maxBytes:MAX_MANIFEST_BYTES});
  if(!raw)return null;
  try{return {data:JSON.parse(raw.buffer.toString('utf8')),url:raw.url};}catch{return null;}
}
function assessOfficialIcon(raw,candidate){
  if(!raw||!raw.buffer)return null;
  const type=raw.type||'';
  const meta=(typeof downstream.dimensions==='function'?downstream.dimensions(raw.buffer,type):null)||{};
  const isSvg=type.includes('svg')||/<svg\b/i.test(raw.buffer.toString('utf8',0,Math.min(raw.buffer.length,4096)));
  if(isSvg){
    const visible=typeof downstream.visibleSvgBody==='function'?downstream.visibleSvgBody(raw.buffer):true;
    if(!visible||svgAppearsWhiteOnly(raw.buffer))return null;
    return {buffer:raw.buffer,type:'image/svg+xml',source:raw.url,width:meta.width||null,height:meta.height||null,quality:'premium-vector',assetKind:'official-declared-icon'};
  }
  if(!type.startsWith('image/'))return null;
  const width=Number(meta.width||0),height=Number(meta.height||0),short=Math.min(width,height),long=Math.max(width,height);
  // APG renders these marks at <=70 CSS px. Requiring a genuine >=64px source
  // keeps normal use crisp while allowing legitimate official site/app icons.
  if(!width||!height||short<64||long<64)return null;
  return {buffer:raw.buffer,type,source:raw.url,width,height,quality:short>=128?'high-icon':'acceptable-icon',assetKind:'official-declared-icon'};
}
async function resolveDeclaredOfficialIcon(slug){
  const key='declared:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const domain=officialDomains[slug];if(!domain){cacheSet(key,null);return null;}
  const page=await fetchOfficialPage(domain);if(!page){cacheSet(key,null);return null;}
  const parsed=declaredIconCandidates(page.text,page.url);
  const manifest=await fetchManifest(parsed.manifestUrl);
  const candidates=[...(manifest?manifestCandidates(manifest.data,manifest.url):[]),...parsed.candidates]
    .sort((a,b)=>candidateScore(b)-candidateScore(a)).slice(0,12);
  const deadline=Date.now()+TOTAL_RESOLVE_MS;
  // Try in small parallel waves so one dead icon URL cannot block the brand mark.
  for(let i=0;i<candidates.length&&Date.now()<deadline;i+=4){
    const wave=candidates.slice(i,i+4);
    const results=await Promise.all(wave.map(async candidate=>{
      const left=Math.max(450,Math.min(IMAGE_TIMEOUT_MS,deadline-Date.now()));
      if(left<=450)return null;
      const raw=await fetchWithTimeout(candidate.url,{timeout:left});
      const image=assessOfficialIcon(raw,candidate);
      return image?{...image,officialReference:`https://${domain}/`,resolverKind:candidate.kind}:null;
    }));
    const good=results.filter(Boolean).sort((a,b)=>{
      const qa=a.quality==='premium-vector'?3:a.quality==='high-icon'?2:1;
      const qb=b.quality==='premium-vector'?3:b.quality==='high-icon'?2:1;
      return qb-qa;
    });
    if(good[0]){cacheSet(key,good[0]);return good[0];}
  }
  cacheSet(key,null);return null;
}
async function resolveOfficialDomainFavicon(slug){
  const key='favicon:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const domain=officialDomains[slug];if(!domain){cacheSet(key,null);return null;}
  // Chromium's favicon service requests the site's own crawled favicon and can be
  // instructed to drop the generic default icon. APG asks for >=48px source material
  // and a 128px rendition, appropriate for the 48-70px UI surfaces used here.
  const page=`https://${domain}/`;
  const url='https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&drop_404_icon=true&check_seen=true&size=128&min_size=48&max_size=256&fallback_opts=TYPE,SIZE,URL&url='+encodeURIComponent(page);
  const raw=await fetchWithTimeout(url,{timeout:IMAGE_TIMEOUT_MS});
  if(!raw){cacheSet(key,null);return null;}
  const meta=(typeof downstream.dimensions==='function'?downstream.dimensions(raw.buffer,raw.type):null)||{};
  const width=Number(meta.width||0),height=Number(meta.height||0),short=Math.min(width,height);
  if(!raw.type.startsWith('image/')||!width||!height||short<48){cacheSet(key,null);return null;}
  const value={buffer:raw.buffer,type:raw.type,source:raw.url,width,height,quality:short>=96?'high-domain-icon':'acceptable-domain-icon',assetKind:'official-domain-favicon',officialReference:page};
  cacheSet(key,value);return value;
}
function v65ImageAcceptable(slug,image){
  if(!image||!image.buffer)return false;
  if(slug==='amazon')return false; // retain v66.2 protection against Amazon sub-brand art
  if(String(image.type||'').toLowerCase().includes('svg')&&svgAppearsWhiteOnly(image.buffer))return false;
  return String(image.assetKind||'').toLowerCase()!=='brand_img';
}
async function resolveCompleteBrandMark(slug){
  if(!brandBySlug.has(slug))return null;
  // Curated v66 vectors are already specifically reviewed and remain authoritative.
  if(downstream.curatedBrandMarkOverrides&&downstream.curatedBrandMarkOverrides[slug])return {delegate:true};
  const [qualityResult,declaredResult,faviconResult]=await Promise.all([
    typeof downstream.resolveBrandMark==='function'?downstream.resolveBrandMark(slug):Promise.resolve(null),
    resolveDeclaredOfficialIcon(slug),
    resolveOfficialDomainFavicon(slug)
  ]);
  if(v65ImageAcceptable(slug,qualityResult))return {...qualityResult,officialReference:`https://${officialDomains[slug]}/`,resolverSource:'official-domain-quality-resolver'};
  if(declaredResult)return {...declaredResult,resolverSource:'official-domain-declared-identity'};
  if(faviconResult)return {...faviconResult,resolverSource:'official-domain-favicon-cache'};
  return null;
}
function serveImage(req,res,slug,image){
  res.statusCode=200;
  res.setHeader('Content-Type',image.type||'image/png');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Complete','v'+BRAND_MARK_COMPLETE_VERSION);
  res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'official-brand-identity');
  res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'high-icon');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'official-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();
  return res.end(image.buffer);
}
function versionBrandMarkUrls(html){
  return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);
}
function injectCompleteMeta(html){
  const text=String(html||'');
  if(text.includes('name="apg-brand-mark-complete"'))return text;
  return text.replace('</head>',`<meta name="apg-brand-mark-complete" content="v${BRAND_MARK_COMPLETE_VERSION}"></head>`);
}

async function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Complete','v'+BRAND_MARK_COMPLETE_VERSION);
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{}
    const image=await resolveCompleteBrandMark(slug);
    if(image&&!image.delegate)return serveImage(req,res,slug,image);
    return downstream(req,res);
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      let next=versionBrandMarkUrls(original);next=injectCompleteMeta(next);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_MARK_COMPLETE_VERSION,BRAND_MARK_ASSET_VERSION,brandBySlug,officialDomains,
  declaredIconCandidates,manifestCandidates,svgAppearsWhiteOnly,assessOfficialIcon,resolveDeclaredOfficialIcon,
  resolveOfficialDomainFavicon,resolveCompleteBrandMark,versionBrandMarkUrls,injectCompleteMeta
});
module.exports=handler;
