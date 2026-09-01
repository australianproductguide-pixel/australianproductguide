'use strict';

// APG search product imagery v1.1
// Adds governed exact-model thumbnails to the existing autocomplete UI without touching page HTML.
// Safety boundary: only the existing app/search CSS asset responses and a read-only image lookup
// endpoint are intercepted. Ordinary HTML/API responses are passed through untouched.
const governed=require('./governed-product-card-imagery-v1-runtime');
const {products}=require('../data');

const VERSION='1.1';
const ORIGIN='https://australianproductguide.au';
const APP_PATH='/assets/app.js';
const SEARCH_CSS_PATH='/assets/premium-search-v76.css';
const LOOKUP_PATH='/api/product-images-v1';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));

function clean(value){return String(value==null?'':value).trim();}
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN);}catch{return new URL(ORIGIN+'/');}}
function safeSlugs(url){
  const raw=clean(url.searchParams.get('slugs'));const seen=new Set();const out=[];
  for(const value of raw.split(',')){const slug=clean(value).toLowerCase();if(!/^[a-z0-9][a-z0-9-]{1,160}$/.test(slug)||!PRODUCT_MAP.has(slug)||seen.has(slug))continue;seen.add(slug);out.push(slug);if(out.length>=10)break;}return out;
}
async function lookupPayload(slugs){
  const mappings=await governed.governedMappings(slugs);const images={};
  for(const slug of slugs){const row=mappings.get(slug);const product=PRODUCT_MAP.get(slug);if(!row||!product)continue;images[slug]={imageUrl:row.imageUrl,label:product.brand?`${product.brand} ${product.name}`:product.name};}
  return {ok:true,version:VERSION,images};
}
function sendLookup(req,res,url){
  const slugs=safeSlugs(url);res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=60, stale-while-revalidate=120');res.setHeader('X-APG-Search-Product-Imagery','v'+VERSION);
  if(req.method==='HEAD')return res.end('');return lookupPayload(slugs).then(payload=>res.end(JSON.stringify(payload))).catch(()=>res.end(JSON.stringify({ok:true,version:VERSION,images:{}})));
}
const SEARCH_JS=String.raw`\n;(()=>{\n'use strict';if(window.__APG_SEARCH_PRODUCT_IMAGERY_V1__)return;window.__APG_SEARCH_PRODUCT_IMAGERY_V1__='1.1';const cache=new Map(),pending=new Map();\nconst slugFrom=href=>{try{const m=new URL(href,location.origin).pathname.match(/^\\/products\\/([a-z0-9][a-z0-9-]{1,160})\\/$/);return m?m[1]:''}catch{return ''}};\nfunction apply(link,record){if(!link||!record||!record.imageUrl)return;const thumb=link.querySelector('.suggest-thumb.type-product');if(!thumb)return;const current=thumb.querySelector('img[data-apg-search-product-image]');if(current&&current.dataset.apgSearchProductImage===record.imageUrl)return;thumb.textContent='';thumb.classList.add('apg-search-product-thumb-v1');const img=document.createElement('img');img.src=record.imageUrl;img.alt='';img.width=48;img.height=48;img.loading='lazy';img.decoding='async';img.dataset.apgSearchProductImage=record.imageUrl;img.addEventListener('error',()=>{thumb.classList.remove('apg-search-product-thumb-v1');thumb.textContent='P'},{once:true});thumb.appendChild(img)}\nasync function resolve(slugs){const needed=[...new Set(slugs)].filter(Boolean).filter(slug=>!cache.has(slug)).slice(0,10);if(!needed.length)return;const key=needed.sort().join(',');if(pending.has(key))return pending.get(key);const work=fetch('/api/product-images-v1?slugs='+encodeURIComponent(key),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(data=>{const images=data&&data.images&&typeof data.images==='object'?data.images:{};needed.forEach(slug=>cache.set(slug,images[slug]||null))}).catch(()=>needed.forEach(slug=>cache.set(slug,null))).finally(()=>pending.delete(key));pending.set(key,work);return work}\nasync function enhance(box){if(!box||box.hidden)return;const links=[...box.querySelectorAll('a.suggest-item[href^="/products/"]')];if(!links.length)return;const pairs=links.map(link=>[link,slugFrom(link.getAttribute('href'))]).filter(([,slug])=>slug);pairs.forEach(([link,slug])=>{const record=cache.get(slug);if(record)apply(link,record)});const missing=pairs.map(([,slug])=>slug).filter(slug=>!cache.has(slug));if(missing.length){await resolve(missing);pairs.forEach(([link,slug])=>{const record=cache.get(slug);if(record)apply(link,record)})}}\nfunction watch(box){if(!box||box.dataset.apgSearchProductImagery==='v1')return;box.dataset.apgSearchProductImagery='v1';let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>enhance(box),35)};new MutationObserver(schedule).observe(box,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});schedule()}const boot=()=>document.querySelectorAll('[data-search-suggestions]').forEach(watch);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();\n})();`;
const SEARCH_CSS=String.raw`\n/* APG search product imagery v1.1 */\n.search-suggestions .suggest-thumb.type-product.apg-search-product-thumb-v1{background:#fff!important;overflow:hidden!important;padding:3px!important;border:1px solid rgba(15,23,42,.10)!important;box-sizing:border-box!important}\n.search-suggestions .suggest-thumb.type-product.apg-search-product-thumb-v1 img{display:block!important;width:100%!important;height:100%!important;max-width:48px!important;max-height:48px!important;object-fit:contain!important;object-position:center!important;background:#fff!important}\n`;
function augmentAsset(downstream,req,res,kind){
  const originalEnd=res.end.bind(res);const originalWrite=typeof res.write==='function'?res.write.bind(res):null;const chunks=[];
  if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
  res.end=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(!chunks.length)return originalEnd(chunk,encoding,cb);let body=Buffer.concat(chunks).toString('utf8');body+=kind==='js'?SEARCH_JS:SEARCH_CSS;if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');if(typeof res.setHeader==='function')res.setHeader('X-APG-Search-Product-Imagery','v'+VERSION);return originalEnd(body,'utf8',cb);};return downstream(req,res);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('search product imagery wrapper requires downstream handler');
  function handler(req,res){const url=requestUrl(req);const path=url.pathname;if(path===LOOKUP_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendLookup(req,res,url);if(path===APP_PATH)return augmentAsset(downstream,req,res,'js');if(path===SEARCH_CSS_PATH)return augmentAsset(downstream,req,res,'css');return downstream(req,res);}
  Object.assign(handler,downstream,{SEARCH_PRODUCT_IMAGERY_VERSION:VERSION,SEARCH_PRODUCT_IMAGERY_LOOKUP_PATH:LOOKUP_PATH});return handler;
}
module.exports={VERSION,APP_PATH,SEARCH_CSS_PATH,LOOKUP_PATH,PRODUCT_MAP,safeSlugs,lookupPayload,SEARCH_JS,SEARCH_CSS,wrap};