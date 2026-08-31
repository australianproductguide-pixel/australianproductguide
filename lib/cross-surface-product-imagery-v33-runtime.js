'use strict';

// APG Cross-Surface Product Imagery v33.0.
// A verified exact-product image is a shared presentation asset, not a product-page-only asset.
// This layer reuses the governed image-state contract already protected by the eBay exact-model
// guard and continuity ceiling. It never changes ranking, retailer eligibility or structured
// Product.image data. Brand identity remains the fail-closed fallback when no eligible photo exists.

const {products}=require('../data');
const search=require('./search');
const supabase=require('./apg-supabase-public-v1');
const continuity=require('./ebay-product-image-continuity-v3-runtime');

const VERSION='33.0';
const CSS_PATH='/assets/cross-surface-product-imagery-v33.css';
const JS_PATH='/assets/cross-surface-product-imagery-v33.js';
const API_PATH='/api/product-presentation-images-v33';
const MAX_PAGE_SLUGS=80;
const MAX_API_SLUGS=30;
const MAX_API_QUERIES=12;
const PRODUCT_MAP=continuity.PRODUCT_MAP;

function clean(value){return String(value==null?'':value).trim();}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function validSlug(value){const slug=clean(value);return PRODUCT_MAP.has(slug)&&/^[a-z0-9][a-z0-9-]{1,160}$/.test(slug);}
function uniqueSlugs(values,limit=MAX_PAGE_SLUGS){return [...new Set((Array.isArray(values)?values:[]).map(clean).filter(validSlug))].slice(0,limit);}
function decodeHtml(value){return String(value||'').replace(/&amp;/gi,'&').replace(/&#39;|&#x27;/gi,"'").replace(/&quot;/gi,'"').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');}
function plainText(value){return decodeHtml(String(value||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim().toLowerCase();}
function productLabel(slug){const p=PRODUCT_MAP.get(slug);return p?clean(`${p.brand||''} ${p.name||''}`):slug;}

function collectProductSlugs(html,limit=MAX_PAGE_SLUGS){
  const out=[],seen=new Set(),source=String(html||'');
  const patterns=[/href=["']\/products\/([a-z0-9][a-z0-9-]{1,160})\/["'?#]/gi,/data-product-slug=["']([a-z0-9][a-z0-9-]{1,160})["']/gi,/data-compare-product=["']([a-z0-9][a-z0-9-]{1,160})["']/gi];
  for(const re of patterns){let m;while((m=re.exec(source))){const slug=m[1];if(validSlug(slug)&&!seen.has(slug)){seen.add(slug);out.push(slug);if(out.length>=limit)return out;}}}
  return out;
}

async function currentMappings(slugs,{now=Date.now,fetchStates=supabase.imageStates}={}){
  const values=uniqueSlugs(slugs);const result=new Map();if(!values.length)return result;
  const t=Number(now());const pending=[];
  for(const slug of values){
    const cached=continuity.stateCache.get(slug);
    if(cached&&t-cached.cachedAt<=continuity.STATE_CACHE_TTL_MS&&continuity.guardEligible(slug,cached.row,t))result.set(slug,cached.row);
    else pending.push(slug);
  }
  if(!pending.length)return result;
  let states=null;
  try{states=await fetchStates(pending,{timeoutMs:1100});}catch{states=null;}
  if(Array.isArray(states)){
    const bySlug=new Map(states.filter(Boolean).map(row=>[clean(row.slug),row]));
    for(const slug of pending){
      if(bySlug.has(slug)){
        const row=continuity.stateToMapping(bySlug.get(slug));
        if(continuity.guardEligible(slug,row,t)){continuity.stateCache.set(slug,{cachedAt:t,row});result.set(slug,row);}
        else continuity.stateCache.delete(slug);
        continue;
      }
      const pilot=continuity.pilotFallbackMapping(slug);
      if(continuity.guardEligible(slug,pilot,t))result.set(slug,pilot);
    }
    return result;
  }
  // Transient state-service failure follows the same continuity rule as product pages: a still-safe
  // cached mapping may remain visible, otherwise only the bounded original pilot fallback is tried.
  for(const slug of pending){
    const cached=continuity.stateCache.get(slug);
    if(cached&&continuity.guardEligible(slug,cached.row,t)){result.set(slug,cached.row);continue;}
    const pilot=continuity.pilotFallbackMapping(slug);
    if(continuity.guardEligible(slug,pilot,t))result.set(slug,pilot);
  }
  return result;
}

function photoMarkup(slug,row,{compact=false,linked=false}={}){
  const product=PRODUCT_MAP.get(slug);if(!product||!row)return '';
  const img=`<img class="apg-product-presentation-image-v33__img" src="${esc(row.imageUrl)}" alt="${esc(productLabel(slug))}" width="640" height="640" loading="lazy" decoding="async">`;
  const media=linked?`<a class="apg-product-presentation-image-v33__link" href="/products/${esc(slug)}/" tabindex="-1" aria-hidden="true">${img}</a>`:img;
  return `<figure class="apg-product-presentation-image-v33${compact?' is-compact':''}" data-apg-product-presentation-image="v${VERSION}" data-product-slug="${esc(slug)}">${media}</figure>`;
}
function suggestionThumb(slug,row){return `<span class="apg-product-suggestion-thumb-v33" aria-hidden="true"><img src="${esc(row.imageUrl)}" alt="" width="44" height="44" loading="lazy" decoding="async"></span>`;}

function slugOccurrences(html){
  const source=String(html||''),out=[];let m;
  const re=/(?:href=["']\/products\/|data-product-slug=["']|data-compare-product=["'])([a-z0-9][a-z0-9-]{1,160})(?:\/)?["'?#]/gi;
  while((m=re.exec(source))){if(validSlug(m[1]))out.push({slug:m[1],index:m.index});}
  return out;
}
function choosePlaceholderSlug(source,start,end,mappings,occurrences){
  const nearby=occurrences.filter(x=>mappings.has(x.slug)&&x.index>=start-5000&&x.index<=end+5000);
  if(!nearby.length)return null;
  nearby.sort((a,b)=>Math.min(Math.abs(a.index-start),Math.abs(a.index-end))-Math.min(Math.abs(b.index-start),Math.abs(b.index-end)));
  for(const candidate of nearby){
    const p=PRODUCT_MAP.get(candidate.slug);if(!p)continue;
    const local=plainText(source.slice(Math.max(0,start-2200),Math.min(source.length,end+2200)));
    const name=clean(p.name).toLowerCase(),full=productLabel(candidate.slug).toLowerCase();
    if((name&&local.includes(name))||(full&&local.includes(full)))return candidate.slug;
  }
  return null;
}

function replaceBrandPlaceholders(html,mappings){
  const source=String(html||'');if(!source.includes('apg-product-brand-placeholder')||!mappings?.size)return source;
  const occurrences=slugOccurrences(source);let cursor=0,out='';
  const re=/<div\b[^>]*class=["'][^"']*\bapg-product-brand-placeholder\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;let m;
  while((m=re.exec(source))){
    out+=source.slice(cursor,m.index);
    const slug=choosePlaceholderSlug(source,m.index,re.lastIndex,mappings,occurrences);
    out+=slug?photoMarkup(slug,mappings.get(slug)):m[0];cursor=re.lastIndex;
  }
  return out+source.slice(cursor);
}

function articleSlug(article,mappings){
  const candidates=collectProductSlugs(article,6).filter(slug=>mappings.has(slug));if(candidates.length!==1)return null;
  const slug=candidates[0],p=PRODUCT_MAP.get(slug),text=plainText(article);if(!p)return null;
  return text.includes(clean(p.name).toLowerCase())?slug:null;
}
function enrichProductArticles(html,mappings){
  if(!mappings?.size)return String(html||'');
  return String(html||'').replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,article=>{
    if(article.includes('data-apg-product-presentation-image=')||article.includes('apg-product-brand-placeholder'))return article;
    const slug=articleSlug(article,mappings);if(!slug)return article;
    const media=photoMarkup(slug,mappings.get(slug),{compact:true,linked:true});
    return article.replace(/^(<article\b[^>]*>)/i,`$1${media}`);
  });
}
function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-cross-surface-product-imagery"'))out=out.replace('</head>',`<meta name="apg-cross-surface-product-imagery" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"><script src="${JS_PATH}?v=${VERSION}" defer></script></head>`);
  return out;
}
function decorateHtml(html,mappings){return injectAssets(enrichProductArticles(replaceBrandPlaceholders(html,mappings),mappings));}

function exactQuerySlug(query){
  const q=clean(query);if(!q)return null;
  try{const r=search.searchSite(q),u=r.queryUnderstanding||{},rows=Array.isArray(r.products)?r.products:[];return rows.length===1&&Number(u.modelMatchCount)===1&&!u.modelAmbiguous&&validSlug(rows[0].slug)?rows[0].slug:null;}catch{return null;}
}
function publicImage(slug,row){return {slug,url:row.imageUrl,alt:productLabel(slug),verifiedAt:row.observedAt,source:'governed-exact-retailer-image',recommendationWeight:0};}
async function apiPayload(url,options={}){
  const slugs=uniqueSlugs(url.searchParams.getAll('slug'),MAX_API_SLUGS);
  const queries=[...new Set(url.searchParams.getAll('q').map(clean).filter(Boolean))].slice(0,MAX_API_QUERIES);
  const querySlugs=new Map();for(const q of queries){const slug=exactQuerySlug(q);if(slug)querySlugs.set(q,slug);}
  const mappings=await currentMappings([...slugs,...querySlugs.values()],options);
  const images=[...mappings].map(([slug,row])=>publicImage(slug,row));
  const queryImages={};for(const [q,slug] of querySlugs){if(mappings.has(slug))queryImages[q]=slug;}
  return {version:VERSION,commercialRecommendationWeight:0,images,queryImages};
}

function decorateSearchPayload(payload,mappings){
  if(!payload||typeof payload!=='object'||!mappings?.size)return payload;
  for(const key of ['products','closestProducts'])if(Array.isArray(payload[key]))payload[key]=payload[key].map(p=>p&&mappings.has(p.slug)?{...p,presentationImage:publicImage(p.slug,mappings.get(p.slug))}:p);
  if(payload.directCompare){for(const key of ['a','b']){const p=payload.directCompare[key];if(p&&mappings.has(p.slug))payload.directCompare[key]={...p,presentationImage:publicImage(p.slug,mappings.get(p.slug))};}}
  if(typeof payload.bodyHtml==='string')payload.bodyHtml=decorateHtml(payload.bodyHtml,mappings);
  payload.crossSurfaceProductImagery={version:VERSION,commercialRecommendationWeight:0};
  return payload;
}

const CSS=String.raw`
/* APG Cross-Surface Product Imagery v33 */
.apg-product-presentation-image-v33{box-sizing:border-box;margin:0;width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);border-radius:inherit}
.apg-product-presentation-image-v33__link{display:flex;width:100%;height:100%;align-items:center;justify-content:center;text-decoration:none}
.apg-product-presentation-image-v33__img{display:block;width:100%;height:100%;max-width:100%;object-fit:contain;object-position:center;background:#fff}
.product-visual>.apg-product-presentation-image-v33{min-height:220px;height:100%}
.product-visual>.apg-product-presentation-image-v33 .apg-product-presentation-image-v33__img{padding:14px}
article>.apg-product-presentation-image-v33.is-compact{height:150px;margin:0 0 16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}
article>.apg-product-presentation-image-v33.is-compact .apg-product-presentation-image-v33__img{padding:10px}
.apg-product-suggestion-thumb-v33{box-sizing:border-box;display:inline-flex;flex:0 0 44px;width:44px;height:44px;margin-right:10px;align-items:center;justify-content:center;overflow:hidden;border:1px solid #e2e8f0;border-radius:9px;background:#fff;vertical-align:middle}
.apg-product-suggestion-thumb-v33 img{display:block;width:100%;height:100%;padding:3px;box-sizing:border-box;object-fit:contain;background:#fff}
.search-suggestions a:has(.apg-product-suggestion-thumb-v33),[role="listbox"] a:has(.apg-product-suggestion-thumb-v33){display:flex!important;align-items:center!important;gap:0!important}
@media(max-width:700px){.product-visual>.apg-product-presentation-image-v33{min-height:190px}article>.apg-product-presentation-image-v33.is-compact{height:132px}.apg-product-suggestion-thumb-v33{width:42px;height:42px;flex-basis:42px}}
`;

const JS=String.raw`
;(()=>{
if(window.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V33__)return;
window.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V33__='${VERSION}';
const API='${API_PATH}',cache=new Map(),queryCache=new Map(),pending=new Set(),pendingQueries=new Set();let timer=0;
const clean=v=>String(v??'').trim();
function slugFromAnchor(a){if(!(a instanceof HTMLAnchorElement))return '';let u;try{u=new URL(a.href,location.href)}catch{return ''}const m=u.origin===location.origin&&u.pathname.match(/^\/products\/([a-z0-9][a-z0-9-]{1,160})\/$/);return m?m[1]:''}
function queryFromAnchor(a){if(!(a instanceof HTMLAnchorElement))return '';let u;try{u=new URL(a.href,location.href)}catch{return ''}if(u.origin!==location.origin||u.pathname!=='/search/')return '';return clean(u.searchParams.get('q')||'')}
function photo(image,compact=false){const figure=document.createElement('figure');figure.className='apg-product-presentation-image-v33'+(compact?' is-compact':'');figure.dataset.apgProductPresentationImage='v${VERSION}';figure.dataset.productSlug=image.slug;const img=document.createElement('img');img.className='apg-product-presentation-image-v33__img';img.src=image.url;img.alt=image.alt||'';img.width=640;img.height=640;img.loading='lazy';img.decoding='async';figure.appendChild(img);return figure}
function thumb(image){const span=document.createElement('span');span.className='apg-product-suggestion-thumb-v33';span.setAttribute('aria-hidden','true');const img=document.createElement('img');img.src=image.url;img.alt='';img.width=44;img.height=44;img.loading='lazy';img.decoding='async';span.appendChild(img);return span}
function suggestion(a){return !!a.closest('[data-search-suggestions],.search-suggestions,[role="listbox"],.apg-recent-option,[data-apg-recent-group]')}
function replaceNearAnchor(a,image){
 if(suggestion(a)){if(!a.querySelector('.apg-product-suggestion-thumb-v33'))a.insertBefore(thumb(image),a.firstChild);return true}
 let node=a;for(let depth=0;node&&depth<7;depth++,node=node.parentElement){const placeholder=node.querySelector?.('.apg-product-brand-placeholder');if(placeholder){placeholder.replaceWith(photo(image,false));return true}}
 const article=a.closest('article');if(article&&!article.querySelector('[data-apg-product-presentation-image],.apg-product-brand-placeholder')){article.insertBefore(photo(image,true),article.firstChild);return true}
 return false;
}
function applySlug(slug,image,root=document){if(!slug||!image)return;const safe=CSS.escape(slug);root.querySelectorAll?.(`a[href="/products/${safe}/"],a[href^="/products/${safe}/?"],[data-product-slug="${safe}"],[data-compare-product="${safe}"]`).forEach(el=>{const a=el instanceof HTMLAnchorElement?el:el.querySelector?.(`a[href^="/products/${safe}/"]`);if(a)replaceNearAnchor(a,image)})}
function scan(root=document){
 const anchors=root.querySelectorAll?.('a[href]')||[];for(const a of anchors){const slug=slugFromAnchor(a);if(slug){if(cache.has(slug))replaceNearAnchor(a,cache.get(slug));else pending.add(slug);continue}if(suggestion(a)){const q=queryFromAnchor(a);if(q){const slugForQuery=queryCache.get(q);if(slugForQuery&&cache.has(slugForQuery))replaceNearAnchor(a,cache.get(slugForQuery));else pendingQueries.add(q)}}}
 schedule();
}
function schedule(){if(timer||(!pending.size&&!pendingQueries.size))return;timer=setTimeout(load,120)}
async function load(){timer=0;const slugs=[...pending].slice(0,30),queries=[...pendingQueries].slice(0,12);slugs.forEach(x=>pending.delete(x));queries.forEach(x=>pendingQueries.delete(x));if(!slugs.length&&!queries.length)return;const u=new URL(API,location.origin);slugs.forEach(x=>u.searchParams.append('slug',x));queries.forEach(x=>u.searchParams.append('q',x));try{const r=await fetch(u.href,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)return;const payload=await r.json();if(payload.version!=='${VERSION}'||payload.commercialRecommendationWeight!==0)return;for(const image of payload.images||[]){if(image?.slug&&image?.url)cache.set(image.slug,image)}for(const [q,slug] of Object.entries(payload.queryImages||{}))queryCache.set(q,slug);for(const [slug,image] of cache)applySlug(slug,image);for(const a of document.querySelectorAll('a[href]')){if(!suggestion(a))continue;const q=queryFromAnchor(a),slug=queryCache.get(q);if(slug&&cache.has(slug))replaceNearAnchor(a,cache.get(slug))}}catch{}if(pending.size||pendingQueries.size)schedule()}
const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)scan(n)});
function start(){scan(document);if(document.body)observer.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('apg:search-rendered',()=>scan(document),true);
})();
`;

function sendAsset(req,res,path){
  const js=path===JS_PATH,body=js?JS:CSS;res.statusCode=200;res.setHeader('Content-Type',js?'application/javascript; charset=utf-8':'text/css; charset=utf-8');res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);return res.end(req.method==='HEAD'?'':body);
}
async function sendApi(req,res,url){
  if(!['GET','HEAD'].includes(req.method||'GET')){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
  try{const payload=await apiPayload(url);res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);const body=JSON.stringify(payload);return res.end(req.method==='HEAD'?'':body);}catch{res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(req.method==='HEAD'?'':JSON.stringify({version:VERSION,commercialRecommendationWeight:0,images:[],queryImages:{},status:'temporarily-unavailable'}));}
}
function patchResponseCsp(res){if(!res||typeof res.getHeader!=='function'||typeof res.setHeader!=='function')return;const current=res.getHeader('Content-Security-Policy');if(Array.isArray(current))return;const next=continuity.withEbayImageCsp(current);if(next&&next!==current)res.setHeader('Content-Security-Policy',next);}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Cross-surface product imagery v33 requires downstream handler');
  function handler(req,res){
    let url;try{url=new URL(req.url||'/','https://australianproductguide.au')}catch{url=new URL('/','https://australianproductguide.au')}
    if(url.pathname===CSS_PATH||url.pathname===JS_PATH)return sendAsset(req,res,url.pathname);
    if(url.pathname===API_PATH)return sendApi(req,res,url);
    const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null,chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8'),type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'').toLowerCase();
      const finish=next=>{if(next!==body&&typeof res.removeHeader==='function')res.removeHeader('Content-Length');res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);return originalEnd(next,'utf8',cb);};
      if(req.method==='HEAD')return finish(body);
      if(type.startsWith('application/json')&&url.pathname==='/search/'){
        let payload;try{payload=JSON.parse(body)}catch{return finish(body)}
        const slugs=uniqueSlugs([...(payload.products||[]).map(p=>p?.slug),...(payload.closestProducts||[]).map(p=>p?.slug),payload.directCompare?.a?.slug,payload.directCompare?.b?.slug]);
        currentMappings(slugs).then(mappings=>finish(JSON.stringify(decorateSearchPayload(payload,mappings)))).catch(()=>finish(body));return res;
      }
      const isHtml=type.startsWith('text/html')||/<html|<!doctype/i.test(body);if(!isHtml)return finish(body);
      const slugs=collectProductSlugs(body);currentMappings(slugs).then(mappings=>{patchResponseCsp(res);finish(decorateHtml(body,mappings));}).catch(()=>{patchResponseCsp(res);finish(injectAssets(body));});return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CROSS_SURFACE_PRODUCT_IMAGERY_VERSION:VERSION});return handler;
}
function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('Cross-surface product imagery install requires a wrapper module');
  if(target.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V33_INSTALLED)return target;
  const original=target.wrap.bind(target);target.wrap=function(downstream){return wrap(original(downstream));};target.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V33_INSTALLED=true;return target;
}

module.exports={VERSION,CSS_PATH,JS_PATH,API_PATH,MAX_PAGE_SLUGS,MAX_API_SLUGS,MAX_API_QUERIES,PRODUCT_MAP,CSS,JS,
  clean,validSlug,uniqueSlugs,collectProductSlugs,currentMappings,photoMarkup,suggestionThumb,slugOccurrences,choosePlaceholderSlug,
  replaceBrandPlaceholders,articleSlug,enrichProductArticles,injectAssets,decorateHtml,exactQuerySlug,publicImage,apiPayload,decorateSearchPayload,
  patchResponseCsp,wrap,install};
