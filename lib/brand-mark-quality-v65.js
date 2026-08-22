'use strict';

// APG Brand Mark Quality v65
// Outermost brand-mark delivery layer. It preserves the v64 product placeholder and
// v63/v62 brand-directory stack, but intercepts /assets/brand-marks/<slug> so APG only
// displays crisp official-domain identity assets. Tiny raster favicons and third-party
// favicon resolvers are deliberately not used; a clean text brand fallback is better
// than a blurry or misleading mark.
const downstream=require('./product-brand-placeholder-v64');
const {products}=require('../data');
const {brands,slugify}=require('./routes');
const officialDomains=require('../data/brand-official-domains-v62');

const BRAND_MARK_QUALITY_VERSION='65.0';
const ORIGIN='https://australianproductguide.au';
const MAX_IMAGE_BYTES=1536*1024;
const MAX_HTML_BYTES=512*1024;
const TOTAL_RESOLVE_MS=3600;
const FETCH_TIMEOUT_MS=2200;
const CACHE_TTL_MS=24*60*60*1000;
const NEGATIVE_CACHE_TTL_MS=30*60*1000;

const RETAILER_HOSTS=[
  /(^|\.)amazon\./i,/(^|\.)jbhifi\.com\.au$/i,/(^|\.)officeworks\.com\.au$/i,
  /(^|\.)thegoodguys\.com\.au$/i,/(^|\.)harveynorman\.com\.au$/i,/(^|\.)binglee\.com\.au$/i,
  /(^|\.)kogan\.com$/i,/(^|\.)catch\.com\.au$/i,/(^|\.)bigw\.com\.au$/i,
  /(^|\.)target\.com\.au$/i,/(^|\.)kmart\.com\.au$/i,/(^|\.)myer\.com\.au$/i,
  /(^|\.)davidjones\.com$/i,/(^|\.)bunnings\.com\.au$/i,/(^|\.)ebay\./i,
  /(^|\.)woolworths\.com\.au$/i,/(^|\.)coles\.com\.au$/i
];

const brandBySlug=new Map(brands.map(brand=>[slugify(brand),brand]));
const sourceOriginByBrandSlug=new Map();
for(const product of products){
  const slug=slugify(product.brand||'');
  if(!slug||sourceOriginByBrandSlug.has(slug))continue;
  try{
    const u=new URL(String(product.source||''));
    const host=u.hostname.toLowerCase();
    if((u.protocol==='https:'||u.protocol==='http:')&&host&&!RETAILER_HOSTS.some(re=>re.test(host)))sourceOriginByBrandSlug.set(slug,u.origin);
  }catch{}
}

const markCache=new Map();

function cacheGet(slug){
  const hit=markCache.get(slug);
  if(!hit||hit.expiresAt<Date.now()){if(hit)markCache.delete(slug);return undefined;}
  return hit.value;
}
function cacheSet(slug,value,ttl=value?CACHE_TTL_MS:NEGATIVE_CACHE_TTL_MS){markCache.set(slug,{value,expiresAt:Date.now()+ttl});}

function cleanUrl(value,base){
  if(!value)return null;
  const raw=String(value).replace(/&amp;/g,'&').trim();
  if(!raw||raw.startsWith('data:')||raw.startsWith('javascript:'))return null;
  try{const u=new URL(raw,base);return (u.protocol==='https:'||u.protocol==='http:')?u.href:null;}catch{return null;}
}
function attr(tag,name){return ((String(tag).match(new RegExp('\\b'+name+'=["\\\']([^"\\\']+)["\\\']','i'))||[])[1]||'').trim();}
function srcsetUrls(value,base){
  return String(value||'').split(',').map(item=>item.trim()).filter(Boolean).map(item=>{
    const bits=item.split(/\s+/);const url=cleanUrl(bits[0],base);const d=bits[1]||'';let weight=0;
    if(/\d+w$/i.test(d))weight=parseInt(d,10)||0;else if(/[\d.]+x$/i.test(d))weight=Math.round((parseFloat(d)||0)*1000);
    return url?{url,weight}:null;
  }).filter(Boolean).sort((a,b)=>b.weight-a.weight).map(x=>x.url);
}
function candidateScore(url,kind){
  const s=String(url||'').toLowerCase();
  let score={jsonld:140,meta:130,wordmark:125,logo_img:118,brand_img:105,common_logo:100,apple_touch:72,svg_icon:65,site_icon:45}[kind]||60;
  if(/\.svg(?:$|[?#])/i.test(s))score+=40;
  else if(/\.(?:png|webp|avif)(?:$|[?#])/i.test(s))score+=20;
  else if(/\.jpe?g(?:$|[?#])/i.test(s))score+=5;
  if(/wordmark|brand[-_ ]?logo|logo[-_ ]?(?:color|colour|primary|main)/i.test(s))score+=22;
  if(/(?:^|[-_/])(color|colour)(?:[-_.?/]|$)/i.test(s))score+=8;
  if(/favicon|mask-icon|monochrome|mono|greyscale|grayscale|grey|gray|white[-_.]/i.test(s))score-=45;
  if(/\.ico(?:$|[?#])/i.test(s))score-=80;
  return score;
}
function addCandidate(list,seen,value,base,kind){
  const url=cleanUrl(value,base);if(!url||seen.has(url))return;
  seen.add(url);list.push({url,kind,score:candidateScore(url,kind)});
}
function declaredCandidates(html,base,brandName=''){
  const text=String(html||''),list=[],seen=new Set();
  for(const m of text.matchAll(/"logo"\s*:\s*"([^"]+)"/gi))addCandidate(list,seen,m[1],base,'jsonld');
  for(const m of text.matchAll(/"logo"\s*:\s*\{[^}]*"(?:url|contentUrl)"\s*:\s*"([^"]+)"/gi))addCandidate(list,seen,m[1],base,'jsonld');
  for(const tag of text.match(/<meta\b[^>]*>/gi)||[]){
    const key=(attr(tag,'property')||attr(tag,'name')).toLowerCase();
    if(/logo|brand:image/.test(key))addCandidate(list,seen,attr(tag,'content'),base,'meta');
  }
  const tokens=String(brandName||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
  for(const tag of text.match(/<img\b[^>]*>/gi)||[]){
    const descriptor=[attr(tag,'alt'),attr(tag,'class'),attr(tag,'id'),attr(tag,'title')].join(' ').toLowerCase();
    let kind=null;
    if(/wordmark/.test(descriptor))kind='wordmark';
    else if(/logo|brand/.test(descriptor))kind='logo_img';
    else if(tokens.some(t=>t.length>2&&descriptor.includes(t)))kind='brand_img';
    if(!kind)continue;
    for(const name of ['src','data-src','data-lazy-src','data-original'])addCandidate(list,seen,attr(tag,name),base,kind);
    for(const name of ['srcset','data-srcset'])for(const url of srcsetUrls(attr(tag,name),base))addCandidate(list,seen,url,base,kind);
  }
  for(const tag of text.match(/<link\b[^>]*>/gi)||[]){
    const rel=attr(tag,'rel').toLowerCase();
    if(rel.includes('apple-touch-icon'))addCandidate(list,seen,attr(tag,'href'),base,'apple_touch');
    else if(/(^|\s)icon(\s|$)/.test(rel)&&/\.svg(?:$|[?#])/i.test(attr(tag,'href')))addCandidate(list,seen,attr(tag,'href'),base,'svg_icon');
  }
  for(const p of ['/logo.svg','/assets/logo.svg','/images/logo.svg','/assets/images/logo.svg','/static/logo.svg','/favicon.svg','/apple-touch-icon.png']){
    addCandidate(list,seen,p,base,p.includes('logo.svg')?'common_logo':p.includes('favicon.svg')?'svg_icon':'apple_touch');
  }
  return list.sort((a,b)=>b.score-a.score).slice(0,14);
}

function pngDimensions(buffer){if(buffer.length>=24&&buffer.toString('ascii',1,4)==='PNG')return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};return null;}
function gifDimensions(buffer){if(buffer.length>=10&&/^GIF8[79]a/.test(buffer.toString('ascii',0,6)))return {width:buffer.readUInt16LE(6),height:buffer.readUInt16LE(8)};return null;}
function icoDimensions(buffer){if(buffer.length>=8&&buffer.readUInt16LE(0)===0&&buffer.readUInt16LE(2)===1){const w=buffer[6]||256,h=buffer[7]||256;return {width:w,height:h};}return null;}
function jpegDimensions(buffer){
  if(buffer.length<4||buffer[0]!==0xff||buffer[1]!==0xd8)return null;
  let i=2;while(i+9<buffer.length){if(buffer[i]!==0xff){i++;continue;}const marker=buffer[i+1];i+=2;if(marker===0xd8||marker===0xd9)continue;if(i+2>buffer.length)break;const len=buffer.readUInt16BE(i);if(len<2||i+len>buffer.length)break;if((marker>=0xc0&&marker<=0xc3)||(marker>=0xc5&&marker<=0xc7)||(marker>=0xc9&&marker<=0xcb)||(marker>=0xcd&&marker<=0xcf)){return {height:buffer.readUInt16BE(i+3),width:buffer.readUInt16BE(i+5)};}i+=len;}
  return null;
}
function webpDimensions(buffer){
  if(buffer.length<30||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')return null;
  const kind=buffer.toString('ascii',12,16);
  if(kind==='VP8X'&&buffer.length>=30){return {width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};}
  if(kind==='VP8 '&&buffer.length>=30&&buffer[23]===0x9d&&buffer[24]===0x01&&buffer[25]===0x2a){return {width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};}
  return null;
}
function svgDimensions(buffer){
  const text=buffer.toString('utf8',0,Math.min(buffer.length,128*1024));if(!/<svg\b/i.test(text))return null;
  const vb=(text.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i)||[]);
  if(vb[1]&&vb[2])return {width:Math.round(Number(vb[1])),height:Math.round(Number(vb[2])),vector:true,text};
  const w=parseFloat((text.match(/\bwidth=["']([\d.]+)/i)||[])[1]),h=parseFloat((text.match(/\bheight=["']([\d.]+)/i)||[])[1]);
  return {width:Number.isFinite(w)?Math.round(w):null,height:Number.isFinite(h)?Math.round(h):null,vector:true,text};
}
function dimensions(buffer,type){
  if(type==='image/svg+xml'||/svg/i.test(type))return svgDimensions(buffer);
  if(type==='image/png')return pngDimensions(buffer);
  if(type==='image/gif')return gifDimensions(buffer);
  if(type==='image/jpeg'||type==='image/jpg')return jpegDimensions(buffer);
  if(type==='image/webp')return webpDimensions(buffer);
  if(type==='image/x-icon'||type==='image/vnd.microsoft.icon')return icoDimensions(buffer);
  return pngDimensions(buffer)||gifDimensions(buffer)||jpegDimensions(buffer)||webpDimensions(buffer)||icoDimensions(buffer);
}
function svgLooksUsable(meta){
  const text=meta&&meta.text||'';if(!text||text.length<180)return false;
  const colours=[...text.matchAll(/(?:fill|stroke)=["']([^"']+)["']/gi)].map(m=>m[1].toLowerCase()).filter(x=>x!=='none'&&x!=='transparent');
  if(colours.length&&colours.every(x=>/^#(?:fff|ffffff)$/i.test(x)||/^white$/i.test(x)))return false;
  return true;
}
function assessImage(image,kind){
  const meta=dimensions(image.buffer,image.type)||{};
  if(image.type==='image/svg+xml'||/svg/i.test(image.type)){
    if(!svgLooksUsable(meta))return null;
    return {...image,width:meta.width||null,height:meta.height||null,quality:'premium-vector',assetKind:kind};
  }
  if(/icon|ico/i.test(image.type)||kind==='site_icon')return null;
  const w=Number(meta.width||0),h=Number(meta.height||0),long=Math.max(w,h),short=Math.min(w,h);
  if(!w||!h)return null;
  const isLogoKind=['jsonld','meta','wordmark','logo_img','brand_img','common_logo'].includes(kind);
  if(isLogoKind&&long>=160&&short>=32)return {...image,width:w,height:h,quality:long>=300?'premium-raster':'high-raster',assetKind:kind};
  if(kind==='apple_touch'&&w>=120&&h>=120)return {...image,width:w,height:h,quality:'high-icon',assetKind:kind};
  return null;
}

async function fetchHtml(url,deadline){
  const left=Math.max(250,Math.min(FETCH_TIMEOUT_MS,deadline-Date.now()));if(left<=250)return null;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),left);
  try{
    const r=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'text/html,application/xhtml+xml'}});
    if(!r.ok)return null;const type=String(r.headers.get('content-type')||'').toLowerCase();if(!type.includes('text/html')&&!type.includes('application/xhtml'))return null;
    const text=await r.text();return {text:text.length>MAX_HTML_BYTES?text.slice(0,MAX_HTML_BYTES):text,url:r.url||url};
  }catch{return null;}finally{clearTimeout(timer);}
}
async function fetchImage(candidate,deadline){
  const left=Math.max(250,Math.min(FETCH_TIMEOUT_MS,deadline-Date.now()));if(left<=250)return null;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),left);
  try{
    const r=await fetch(candidate.url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/svg+xml,image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.4'}});
    if(!r.ok)return null;const type=String(r.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(!type.startsWith('image/'))return null;
    const length=Number(r.headers.get('content-length')||0);if(length>MAX_IMAGE_BYTES)return null;const buffer=Buffer.from(await r.arrayBuffer());if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return null;
    return assessImage({buffer,type,source:r.url||candidate.url},candidate.kind);
  }catch{return null;}finally{clearTimeout(timer);}
}
async function resolveFromOrigin(origin,brandName,deadline){
  if(!origin||Date.now()>=deadline)return null;
  const page=await fetchHtml(origin+'/',deadline);if(!page)return null;
  const candidates=declaredCandidates(page.text,page.url,brandName);
  for(const candidate of candidates){if(Date.now()>=deadline)break;const image=await fetchImage(candidate,deadline);if(image)return image;}
  return null;
}
async function resolveBrandMark(slug){
  const cached=cacheGet(slug);if(cached!==undefined)return cached;
  const brandName=brandBySlug.get(slug);if(!brandName)return null;
  const deadline=Date.now()+TOTAL_RESOLVE_MS;
  const origins=[];const domain=officialDomains[slug];if(domain)origins.push(`https://${domain}`);
  const sourceOrigin=sourceOriginByBrandSlug.get(slug);if(sourceOrigin&&!origins.includes(sourceOrigin))origins.push(sourceOrigin);
  for(const origin of origins){const image=await resolveFromOrigin(origin,brandName,deadline);if(image){cacheSet(slug,image);return image;}}
  cacheSet(slug,null);return null;
}

function sendUnavailable(res){res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','public, max-age=300, s-maxage=1800');res.setHeader('X-APG-Brand-Mark-Quality','text-fallback');return res.end('High-quality official brand mark unavailable; use brand-name fallback');}
async function serveBrandMark(req,res,slug){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
  if(!brandBySlug.has(slug))return sendUnavailable(res);
  const image=await resolveBrandMark(slug);if(!image)return sendUnavailable(res);
  res.statusCode=200;res.setHeader('Content-Type',image.type);res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Brand-Mark-Source','official-domain-quality-resolver');res.setHeader('X-APG-Brand-Mark-Quality',image.quality);res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind);if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();return res.end(image.buffer);
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)$/i);
  if(match){let slug='';try{slug=decodeURIComponent(match[1])}catch{}res.setHeader('X-APG-Brand-Mark-Quality-Layer','v'+BRAND_MARK_QUALITY_VERSION);return serveBrandMark(req,res,slug);}
  res.setHeader('X-APG-Brand-Mark-Quality-Layer','v'+BRAND_MARK_QUALITY_VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{BRAND_MARK_QUALITY_VERSION,brandBySlug,sourceOriginByBrandSlug,officialDomains,declaredCandidates,dimensions,assessImage,resolveBrandMark,serveBrandMark});
module.exports=handler;
