'use strict';

// APG Brand Mark Official Completion v69.2
//
// Brand identity policy for the complete 178-brand catalogue.
//
// Trust order:
//   1. reviewed curated/pinned vector identity already accepted downstream;
//   2. explicit first-party logo/wordmark published on the governed official domain;
//   3. other governed official-domain identity/icon already accepted downstream;
//   4. neutral canonical brand-name SVG.
//
// This version deliberately lets a full first-party logo/wordmark supersede a favicon or
// generic site icon. It also recognises modern first-party delivery patterns including
// inline SVG, <picture>/<source>, lazy image attributes and logo CSS background URLs.
// Product photography, hero imagery and generic brand-token images are never eligible.
const downstream=require('./brand-mark-completion-v68');
const officialDomains=require('../data/brand-official-domains-v62');
const {brands,slugify}=require('./routes');

const BRAND_MARK_OFFICIAL_COMPLETION_VERSION='69.2';
const BRAND_MARK_ASSET_VERSION='69.2';
const MAX_IMAGE_BYTES=1024*1024;
const MAX_HTML_BYTES=900*1024;
const PAGE_TIMEOUT_MS=4200;
const IMAGE_TIMEOUT_MS=2800;
const CACHE_TTL_MS=14*24*60*60*1000;
const NEGATIVE_TTL_MS=45*60*1000;
const cache=new Map();
const brandBySlug=new Map(brands.map(name=>[slugify(name),name]));

const BRAND_LOGO_USE_RESTRICTIONS=Object.freeze({
  'baratza':Object.freeze({reason:'brand-terms-require-prior-written-permission',termsUrl:'https://www.baratza.com/en-au/legal/terms-of-use-and-sale'}),
  'cloud-nine':Object.freeze({reason:'brand-terms-require-prior-specific-written-consent',termsUrl:'https://www.cloudninehair.com.au/pages/terms-and-conditions'})
});

function cacheGet(key){const hit=cache.get(key);if(!hit||hit.expiresAt<Date.now()){if(hit)cache.delete(key);return undefined;}return hit.value;}
function cacheSet(key,value,ttl=value?CACHE_TTL_MS:NEGATIVE_TTL_MS){cache.set(key,{value,expiresAt:Date.now()+ttl});}
function isTerminal(image){return !image||Boolean(image.terminalFallback)||image.resolverSource==='canonical-brand-name-fallback'||image.resolverSource==='brand-name-policy-fallback'||image.assetKind==='canonical-brand-name';}
function isHighTrustGraphic(image){
  if(!image||isTerminal(image))return false;
  const source=String(image.resolverSource||'').toLowerCase(),kind=String(image.assetKind||'').toLowerCase(),quality=String(image.quality||'').toLowerCase();
  if(source==='curated-reviewed-vector-override'||source==='reviewed-pinned-vector-identity'||source==='reviewed-residual-brand-mark')return true;
  if(kind.includes('curated-reviewed-vector')||kind.includes('reviewed-vector'))return true;
  if(kind.includes('wordmark')||kind.includes('official-explicit-logo'))return true;
  if(quality==='premium-vector'&&!kind.includes('favicon')&&!kind.includes('icon'))return true;
  return false;
}
function shouldSeekExplicit(image){
  if(isTerminal(image))return true;
  if(isHighTrustGraphic(image))return false;
  const source=String(image&&image.resolverSource||'').toLowerCase(),kind=String(image&&image.assetKind||'').toLowerCase();
  return kind.includes('favicon')||kind.includes('icon')||source.includes('favicon')||source.includes('declared-identity');
}
function cleanUrl(value,base){if(!value)return null;const raw=String(value).replace(/&amp;/g,'&').trim();if(!raw||raw.startsWith('data:')||raw.startsWith('javascript:'))return null;try{const u=new URL(raw,base);return (u.protocol==='https:'||u.protocol==='http:')?u.href:null;}catch{return null;}}
function attr(tag,name){return ((String(tag).match(new RegExp('\\b'+name+'=["\\\']([^"\\\']+)["\\\']','i'))||[])[1]||'').trim();}
function srcsetUrls(value,base){return String(value||'').split(',').map(item=>item.trim().split(/\s+/)[0]).map(url=>cleanUrl(url,base)).filter(Boolean);}
function addCandidate(list,seen,value,base,kind,score){
  const url=cleanUrl(value,base);if(!url||seen.has(url))return;
  const lower=url.toLowerCase();
  if(/(?:product|pdp|hero|banner|collection|recipe|article|blog|lifestyle|gallery|carousel)/.test(lower)&&!/(?:logo|wordmark|brand[-_]?mark)/.test(lower))return;
  seen.add(url);list.push({url,kind,score:Number(score||0)});
}
function addPictureCandidates(text,base,list,seen){
  for(const block of text.match(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi)||[]){
    const descriptor=block.slice(0,1200).toLowerCase();
    if(!/(?:wordmark|\blogo\b|brand[-_ ]?logo|site[-_ ]?logo|header[-_ ]?logo)/.test(descriptor))continue;
    for(const tag of block.match(/<(?:source|img)\b[^>]*>/gi)||[]){
      for(const name of ['src','data-src','data-lazy-src','data-original'])addCandidate(list,seen,attr(tag,name),base,'picture-logo',148);
      for(const name of ['srcset','data-srcset'])for(const url of srcsetUrls(attr(tag,name),base))addCandidate(list,seen,url,base,'picture-logo',148);
    }
  }
}
function addCssLogoCandidates(text,base,list,seen){
  const re=/([^{}]{0,180}(?:wordmark|logo|brand[-_ ]?mark)[^{}]{0,180})\{([^{}]{0,1200})\}/gi;
  for(const match of text.matchAll(re)){
    const css=match[2]||'';
    for(const u of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi))addCandidate(list,seen,u[1],base,'css-logo',132);
  }
}
function normaliseInlineSvg(svg){
  let out=String(svg||'').trim();
  if(!/^<svg\b/i.test(out)||!/<\/svg>\s*$/i.test(out))return null;
  if(/<script\b|<foreignObject\b|\bon(?:load|error|click|mouseover)\s*=/i.test(out))return null;
  if(/<(?:image|use)\b[^>]*(?:href|xlink:href)\s*=\s*["'](?!data:|#)/i.test(out))return null;
  if(/<use\b[^>]*(?:href|xlink:href)\s*=\s*["']#/i.test(out)&&!/<symbol\b|<defs\b/i.test(out))return null;
  if(typeof downstream.visibleSvgBody==='function'&&!downstream.visibleSvgBody(Buffer.from(out,'utf8')))return null;
  if(!/xmlns=/.test(out))out=out.replace(/^<svg\b/i,'<svg xmlns="http://www.w3.org/2000/svg"');
  return Buffer.from(out,'utf8');
}
function inlineLogoCandidates(text){
  const list=[];
  const svgRe=/<svg\b[^>]*>[\s\S]*?<\/svg>/gi;
  let match;
  while((match=svgRe.exec(text))){
    if(list.length>=8)break;
    const svg=match[0],open=(svg.match(/^<svg\b[^>]*>/i)||[])[0]||'';
    const before=text.slice(Math.max(0,match.index-420),match.index).toLowerCase();
    const descriptor=[open, before.slice(-420)].join(' ').toLowerCase();
    if(!/(?:wordmark|\blogo\b|brand[-_ ]?logo|site[-_ ]?logo|header[-_ ]?logo|navbar[-_ ]?brand)/.test(descriptor))continue;
    const buffer=normaliseInlineSvg(svg);if(!buffer)continue;
    const score=/wordmark/.test(descriptor)?190:/header|site|navbar/.test(descriptor)?178:170;
    list.push({buffer,type:'image/svg+xml',kind:'inline-official-logo',score});
  }
  return list.sort((a,b)=>b.score-a.score);
}
function explicitLogoCandidates(html,base){
  const text=String(html||''),list=[],seen=new Set();
  for(const m of text.matchAll(/"logo"\s*:\s*"([^"]+)"/gi))addCandidate(list,seen,m[1],base,'jsonld-logo',180);
  for(const m of text.matchAll(/"logo"\s*:\s*\{[^}]*"(?:url|contentUrl)"\s*:\s*"([^"]+)"/gi))addCandidate(list,seen,m[1],base,'jsonld-logo',180);
  for(const tag of text.match(/<meta\b[^>]*>/gi)||[]){const key=(attr(tag,'property')||attr(tag,'name')).toLowerCase();if(/(?:^|:|-)logo(?:$|:|-)|brand:logo/.test(key))addCandidate(list,seen,attr(tag,'content'),base,'meta-logo',172);}
  for(const tag of text.match(/<img\b[^>]*>/gi)||[]){
    const descriptor=[attr(tag,'alt'),attr(tag,'class'),attr(tag,'id'),attr(tag,'title'),attr(tag,'itemprop')].join(' ').toLowerCase();
    if(!/(?:wordmark|\blogo\b|brand[-_ ]?logo|site[-_ ]?logo|header[-_ ]?logo)/.test(descriptor))continue;
    const kind=/wordmark/.test(descriptor)?'wordmark':'logo-img',score=/wordmark/.test(descriptor)?168:158;
    for(const name of ['src','data-src','data-lazy-src','data-original','data-image'])addCandidate(list,seen,attr(tag,name),base,kind,score);
    for(const name of ['srcset','data-srcset'])for(const url of srcsetUrls(attr(tag,name),base))addCandidate(list,seen,url,base,kind,score);
  }
  addPictureCandidates(text,base,list,seen);
  addCssLogoCandidates(text,base,list,seen);
  for(const p of ['/logo.svg','/assets/logo.svg','/images/logo.svg','/assets/images/logo.svg','/static/logo.svg','/static/media/logo.svg','/assets/img/logo.svg','/img/logo.svg','/images/logos/logo.svg','/logo.png','/assets/logo.png','/images/logo.png'])addCandidate(list,seen,p,base,'common-logo',/\.svg$/i.test(p)?120:88);
  return list.sort((a,b)=>b.score-a.score).slice(0,28);
}
async function fetchOfficialHtml(domain){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),PAGE_TIMEOUT_MS);
  try{
    const response=await fetch(`https://${domain}/`,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'text/html,application/xhtml+xml'}});
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').toLowerCase();if(!type.includes('text/html')&&!type.includes('application/xhtml'))return null;
    const text=await response.text();return {text:text.length>MAX_HTML_BYTES?text.slice(0,MAX_HTML_BYTES):text,url:response.url||`https://${domain}/`};
  }catch{return null;}finally{clearTimeout(timer);}
}
async function fetchImage(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),IMAGE_TIMEOUT_MS);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/svg+xml,image/png,image/webp,image/jpeg,image/*,*/*;q=0.2'}});
    if(!response.ok)return null;const len=Number(response.headers.get('content-length')||0);if(len>MAX_IMAGE_BYTES)return null;
    const buffer=Buffer.from(await response.arrayBuffer());if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return null;
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();if(!type.startsWith('image/')&&!/<svg\b/i.test(buffer.toString('utf8',0,4096)))return null;
    return {buffer,type:type||'image/svg+xml',source:response.url||url};
  }catch{return null;}finally{clearTimeout(timer);}
}
function assessExplicitLogo(raw,kind){
  if(!raw||!raw.buffer)return null;
  const isSvg=raw.type.includes('svg')||/<svg\b/i.test(raw.buffer.toString('utf8',0,4096));
  if(isSvg){
    if(typeof downstream.visibleSvgBody==='function'&&!downstream.visibleSvgBody(raw.buffer))return null;
    let buffer=raw.buffer,presentation=null;
    if(typeof downstream.svgAppearsWhiteOnly==='function'&&downstream.svgAppearsWhiteOnly(buffer)&&typeof downstream.contrastAdaptWhiteSvg==='function'){buffer=downstream.contrastAdaptWhiteSvg(buffer);presentation='contrast-safe-dark-backing';if(!buffer)return null;}
    const meta=typeof downstream.dimensions==='function'?(downstream.dimensions(buffer,'image/svg+xml')||{}):{};
    return {buffer,type:'image/svg+xml',source:raw.source||null,width:meta.width||null,height:meta.height||null,quality:'premium-vector',assetKind:kind==='wordmark'?'official-explicit-wordmark':'official-explicit-logo',presentation};
  }
  const meta=typeof downstream.dimensions==='function'?(downstream.dimensions(raw.buffer,raw.type)||{}):{},width=Number(meta.width||0),height=Number(meta.height||0),long=Math.max(width,height),short=Math.min(width,height);
  if(!width||!height||long<96||short<20)return null;
  return {buffer:raw.buffer,type:raw.type,source:raw.source,width,height,quality:long>=200&&short>=36?'high-raster':'official-raster',assetKind:kind==='wordmark'?'official-explicit-wordmark':'official-explicit-logo',presentation:null};
}
async function resolveExplicitOfficialLogo(slug){
  if(BRAND_LOGO_USE_RESTRICTIONS[slug])return null;
  const key='explicit:'+slug,cached=cacheGet(key);if(cached!==undefined)return cached;
  const domain=officialDomains[slug];if(!domain){cacheSet(key,null);return null;}
  const page=await fetchOfficialHtml(domain);if(!page){cacheSet(key,null);return null;}
  const inline=inlineLogoCandidates(page.text);
  if(inline[0]){
    const assessed=assessExplicitLogo({buffer:inline[0].buffer,type:'image/svg+xml',source:page.url},inline[0].kind);
    if(assessed){const value={...assessed,officialReference:`https://${domain}/`,resolverSource:'official-domain-inline-logo',terminalFallback:false};cacheSet(key,value);return value;}
  }
  const candidates=explicitLogoCandidates(page.text,page.url);
  for(let i=0;i<candidates.length;i+=4){
    const wave=candidates.slice(i,i+4),results=await Promise.all(wave.map(async candidate=>{const assessed=assessExplicitLogo(await fetchImage(candidate.url),candidate.kind);return assessed?{...assessed,_score:candidate.score}:null;}));
    const good=results.filter(Boolean).sort((a,b)=>{const qa=a.quality==='premium-vector'?4:a.assetKind==='official-explicit-wordmark'?3:a.quality==='high-raster'?2:1,qb=b.quality==='premium-vector'?4:b.assetKind==='official-explicit-wordmark'?3:b.quality==='high-raster'?2:1;return (qb-qa)||(b._score-a._score);});
    if(good[0]){const {_score,...chosen}=good[0];const value={...chosen,officialReference:`https://${domain}/`,resolverSource:'official-domain-explicit-logo',terminalFallback:false};cacheSet(key,value);return value;}
  }
  cacheSet(key,null);return null;
}
function policyFallback(slug){
  const restriction=BRAND_LOGO_USE_RESTRICTIONS[slug];if(!restriction)return null;
  const svg=typeof downstream.fallbackBrandSvg==='function'?downstream.fallbackBrandSvg(slug):`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96"><rect width="320" height="96" fill="white"/><text x="160" y="52" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700">${String(brandBySlug.get(slug)||slug).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text></svg>`;
  return {buffer:Buffer.from(svg,'utf8'),type:'image/svg+xml',source:null,resolverSource:'brand-name-policy-fallback',assetKind:'canonical-brand-name',quality:'text-fallback-svg',officialReference:`https://${officialDomains[slug]}/`,policyReason:restriction.reason,policyReference:restriction.termsUrl,intentionalPolicyFallback:true,terminalFallback:true};
}
async function resolveCompleteBrandMark(slug){
  const restricted=policyFallback(slug);if(restricted)return restricted;
  const base=await downstream.resolveCompleteBrandMark(slug);
  if(shouldSeekExplicit(base)){const explicit=await resolveExplicitOfficialLogo(slug);if(explicit)return explicit;}
  return base;
}
function serveImage(req,res,image){
  res.statusCode=200;res.setHeader('Content-Type',image.type||'image/png');res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Official-Completion','v'+BRAND_MARK_OFFICIAL_COMPLETION_VERSION);res.setHeader('X-APG-Brand-Mark-Source',image.resolverSource||'governed-brand-identity');res.setHeader('X-APG-Brand-Mark-Quality',image.quality||'governed');res.setHeader('X-APG-Brand-Mark-Asset-Kind',image.assetKind||'governed-brand-identity');
  if(image.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',image.officialReference);if(image.presentation)res.setHeader('X-APG-Brand-Mark-Presentation',image.presentation);if(image.policyReason)res.setHeader('X-APG-Brand-Mark-Policy-Reason',image.policyReason);if(image.policyReference)res.setHeader('X-APG-Brand-Mark-Policy-Reference',image.policyReference);if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));if(req.method==='HEAD')return res.end();return res.end(image.buffer);
}
function versionBrandMarkUrls(html){return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);}
function injectMeta(html){const text=String(html||'');if(text.includes('name="apg-brand-mark-official-completion"'))return text;return text.replace('</head>',`<meta name="apg-brand-mark-official-completion" content="v${BRAND_MARK_OFFICIAL_COMPLETION_VERSION}"></head>`);}
async function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  res.setHeader('X-APG-Brand-Mark-Official-Completion','v'+BRAND_MARK_OFFICIAL_COMPLETION_VERSION);
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);
  if(match&&(req.method==='GET'||req.method==='HEAD')){
    let slug='';try{slug=decodeURIComponent(match[1]).toLowerCase()}catch{}
    const image=await resolveCompleteBrandMark(slug);if(image)return serveImage(req,res,image);
    return downstream(req,res);
  }
  const end=res.end.bind(res);res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const was=Buffer.isBuffer(body),original=was?body.toString('utf8'):body;let next=injectMeta(versionBrandMarkUrls(original));
      if(next!==original){body=was?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}
Object.assign(handler,downstream,{BRAND_MARK_OFFICIAL_COMPLETION_VERSION,BRAND_MARK_ASSET_VERSION,BRAND_LOGO_USE_RESTRICTIONS,officialDomains,brandBySlug,explicitLogoCandidates,inlineLogoCandidates,resolveExplicitOfficialLogo,resolveCompleteBrandMark,versionBrandMarkUrls,isHighTrustGraphic,shouldSeekExplicit});
module.exports=handler;
