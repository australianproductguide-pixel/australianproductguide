'use strict';

// APG category featured product imagery v1.5
// Single-image collection contract:
//  - each collection/category keeps its existing editorial image as a recoverable fallback source;
//  - when a governed exact-model product image exists, preload and validate it, then swap the
//    existing <img> source in place so only one image is visible;
//  - if the product image cannot load, restore the original editorial source;
//  - each department also uses one existing <img> only. Department representative selection follows
//    the deliberate on-page category priority and uses the first category with a governed product image,
//    restoring the representative product imagery used before v1.4 while avoiding duplicate layers.
// The 90-category directory uses one cacheable coverage request. Shopper browsing makes no live
// eBay Browse calls. Affiliate relationships and retailer economics never enter image selection.
const {categories}=require('../data');
const governed=require('./governed-product-card-imagery-v1-runtime');

const VERSION='1.5';
const ORIGIN='https://australianproductguide.au';
const APP_PATH='/assets/app.js';
const CSS_PATH='/assets/premium-search-v76.css';
const LOOKUP_PATH='/api/category-featured-image-v1';
const COVERAGE_SCOPE='all';
const BATCH_SIZE=100;
const EBAY_IMAGE_ORIGIN=governed.EBAY_IMAGE_ORIGIN||'https://i.ebayimg.com';
const CATEGORY_MAP=new Map(Object.entries(categories).filter(([,c])=>c&&Array.isArray(c.products)&&c.products.length));

function clean(value){return String(value==null?'':value).trim();}
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN);}catch{return new URL(ORIGIN+'/');}}
function safeCategory(url){const slug=clean(url.searchParams.get('slug')).toLowerCase();return /^[a-z0-9][a-z0-9-]{1,160}$/.test(slug)&&CATEGORY_MAP.has(slug)?slug:'';}
function eligibleCspPath(pathname){const path=clean(pathname);return path==='/categories/'||path==='/categories';}
function withEbayImageCsp(value){return typeof governed.withEbayImageCsp==='function'?governed.withEbayImageCsp(value):clean(value);}
function chunk(values,size=BATCH_SIZE){const rows=Array.isArray(values)?values:[],limit=Math.max(1,Math.min(BATCH_SIZE,Number(size)||BATCH_SIZE)),out=[];for(let i=0;i<rows.length;i+=limit)out.push(rows.slice(i,i+limit));return out;}
function verificationRank(row){const level=clean(row&&row.verificationLevel);return level==='detail-model-evidence'?2:level==='detail-title-model'?1:0;}
function finiteScore(value){const n=Number(value);return Number.isFinite(n)?n:-1;}
function observedRank(value){const n=Date.parse(clean(value));return Number.isFinite(n)?n:0;}
function compareMappings(a,b){
  if(!a&&!b)return 0;if(a&&!b)return 1;if(!a&&b)return -1;
  const cleanA=a.recoveryRequired===true?0:1,cleanB=b.recoveryRequired===true?0:1;if(cleanA!==cleanB)return cleanA-cleanB;
  const evidenceA=verificationRank(a),evidenceB=verificationRank(b);if(evidenceA!==evidenceB)return evidenceA-evidenceB;
  const scoreA=finiteScore(a.matchScore),scoreB=finiteScore(b.matchScore);if(scoreA!==scoreB)return scoreA-scoreB;
  const observedA=observedRank(a.observedAt),observedB=observedRank(b.observedAt);if(observedA!==observedB)return observedA-observedB;
  return 0;
}
function selectFeatured(slug,category,mappings){
  const products=category&&Array.isArray(category.products)?category.products.filter(Boolean):[];let selected=null,selectedProduct=null;
  for(const product of products){const row=mappings&&typeof mappings.get==='function'?mappings.get(product.slug):null;if(!row||!row.imageUrl)continue;if(!selected||compareMappings(row,selected)>0){selected=row;selectedProduct=product;}}
  if(!selected||!selectedProduct)return null;
  return {
    categorySlug:slug,
    categoryLabel:category.label||slug,
    productSlug:selectedProduct.slug,
    productLabel:selectedProduct.brand?`${selectedProduct.brand} ${selectedProduct.name}`:selectedProduct.name,
    imageUrl:selected.imageUrl,
    verificationLevel:clean(selected.verificationLevel),
    matchScore:finiteScore(selected.matchScore),
    observedAt:clean(selected.observedAt),
    recoveryRequired:selected.recoveryRequired===true
  };
}
async function featuredPayload(slug,options={}){
  const category=CATEGORY_MAP.get(slug);if(!category)return {ok:true,version:VERSION,category:null};
  const slugs=category.products.filter(Boolean).map(p=>p.slug).filter(Boolean).slice(0,BATCH_SIZE);
  const fetchMappings=typeof options.fetchMappings==='function'?options.fetchMappings:governed.governedMappings;
  let mappings=new Map();try{const result=await fetchMappings(slugs);if(result&&typeof result.get==='function')mappings=result;}catch{}
  return {ok:true,version:VERSION,category:selectFeatured(slug,category,mappings)};
}
async function coveragePayload(options={}){
  const fetchMappings=typeof options.fetchMappings==='function'?options.fetchMappings:governed.governedMappings;
  const allSlugs=[...new Set([...CATEGORY_MAP.values()].flatMap(category=>category.products.filter(Boolean).map(product=>product.slug).filter(Boolean)))];
  const batches=chunk(allSlugs,BATCH_SIZE);
  const maps=await Promise.all(batches.map(async slugs=>{try{const result=await fetchMappings(slugs);return result&&typeof result.get==='function'?result:new Map();}catch{return new Map();}}));
  const merged=new Map();for(const map of maps)for(const [slug,row] of map.entries())merged.set(slug,row);
  const selections={};let productImageCategories=0;
  for(const [slug,category] of CATEGORY_MAP){const selected=selectFeatured(slug,category,merged);selections[slug]=selected;if(selected)productImageCategories++;}
  return {ok:true,version:VERSION,count:CATEGORY_MAP.size,productImageCategories,fallbackCategories:CATEGORY_MAP.size-productImageCategories,registryProducts:allSlugs.length,registryBatches:batches.length,categories:selections};
}
function sendLookup(req,res,url){
  const coverage=clean(url.searchParams.get('scope')).toLowerCase()===COVERAGE_SCOPE,slug=coverage?'':safeCategory(url);
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=600, stale-while-revalidate=1800');res.setHeader('X-APG-Category-Featured-Imagery','v'+VERSION);res.setHeader('X-APG-Category-Featured-Imagery-Mode',coverage?'coverage':'single');
  if(req.method==='HEAD')return res.end('');
  if(coverage)return coveragePayload().then(payload=>res.end(JSON.stringify(payload))).catch(()=>res.end(JSON.stringify({ok:true,version:VERSION,count:CATEGORY_MAP.size,productImageCategories:0,fallbackCategories:CATEGORY_MAP.size,registryProducts:0,registryBatches:0,categories:{}})));
  if(!slug)return res.end(JSON.stringify({ok:true,version:VERSION,category:null}));
  return featuredPayload(slug).then(payload=>res.end(JSON.stringify(payload))).catch(()=>res.end(JSON.stringify({ok:true,version:VERSION,category:null})));
}

const CLIENT_JS=String.raw`
;(()=>{
'use strict';
if(window.__APG_CATEGORY_FEATURED_IMAGERY_V1__==='1.5')return;
window.__APG_CATEGORY_FEATURED_IMAGERY_V1__='1.5';
const path=location.pathname;if(path==='/'||/^\/products\//.test(path))return;
const directory=path==='/categories/'||path==='/categories',cache=new Map(),pending=new Map(),busy=new WeakSet();let coveragePromise=null;
const categorySlug=a=>{try{const m=new URL(a.getAttribute('href')||'',location.origin).pathname.match(/^\/categories\/([a-z0-9][a-z0-9-]{1,160})\/$/);return m?m[1]:''}catch{return ''}};
const verificationRank=row=>row&&row.verificationLevel==='detail-model-evidence'?2:row&&row.verificationLevel==='detail-title-model'?1:0;
const finiteScore=value=>{const n=Number(value);return Number.isFinite(n)?n:-1};
const observedRank=value=>{const n=Date.parse(String(value||''));return Number.isFinite(n)?n:0};
function compareRows(a,b){if(!a&&!b)return 0;if(a&&!b)return 1;if(!a&&b)return -1;const cleanA=a.recoveryRequired===true?0:1,cleanB=b.recoveryRequired===true?0:1;if(cleanA!==cleanB)return cleanA-cleanB;const evidenceA=verificationRank(a),evidenceB=verificationRank(b);if(evidenceA!==evidenceB)return evidenceA-evidenceB;const scoreA=finiteScore(a.matchScore),scoreB=finiteScore(b.matchScore);if(scoreA!==scoreB)return scoreA-scoreB;return observedRank(a.observedAt)-observedRank(b.observedAt)}
function strongest(rows){let best=null;for(const row of rows||[])if(row&&row.imageUrl&&(!best||compareRows(row,best)>0))best=row;return best}
async function coverage(){if(!directory)return new Map();if(coveragePromise)return coveragePromise;coveragePromise=fetch('/api/category-featured-image-v1?scope=all',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{const map=new Map(),rows=d&&d.categories&&typeof d.categories==='object'?d.categories:{};for(const [slug,row] of Object.entries(rows)){map.set(slug,row||null);cache.set(slug,row||null)}return map}).catch(()=>new Map());return coveragePromise}
async function resolve(slug){if(cache.has(slug))return cache.get(slug);if(directory){const rows=await coverage();const row=rows.get(slug)||null;cache.set(slug,row);return row}if(pending.has(slug))return pending.get(slug);const work=fetch('/api/category-featured-image-v1?slug='+encodeURIComponent(slug),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{const row=d&&d.category||null;cache.set(slug,row);return row}).catch(()=>{cache.set(slug,null);return null}).finally(()=>pending.delete(slug));pending.set(slug,work);return work}
function scopeFor(link){return link.closest('article,.category-card,.collection-card,.browse-card,.decision-card,.apg-v12-card,.card,li')}
function imageFor(scope){if(!scope)return null;if(scope.matches('.apg-category-department-card'))return scope.querySelector('.apg-category-department-title > img');return scope.querySelector('.category-index-media img,.category-visual img,.collection-visual img,.card-visual img,.apg-v12-art img,.category-image img,.collection-image img,.hero-media img,.visual img')||scope.querySelector('img')}
function hasVisual(scope){return !!imageFor(scope)}
function recoverLegacy(scope){
  if(!scope)return;
  for(const stage of scope.querySelectorAll('.apg-category-product-stage-v1'))stage.remove();
  for(const slot of scope.querySelectorAll('.apg-category-product-slot-v12')){const img=slot.querySelector('img');if(img)slot.insertAdjacentElement('beforebegin',img);slot.remove()}
  for(const node of scope.querySelectorAll('.apg-category-product-visual-pending-v12,.apg-category-product-visual-v1'))node.classList.remove('apg-category-product-visual-pending-v12','apg-category-product-visual-v1');
  for(const img of scope.querySelectorAll('img')){if(img.style.opacity==='0')img.style.removeProperty('opacity');if(img.style.pointerEvents==='none')img.style.removeProperty('pointer-events')}
  if(scope.dataset.apgCategoryFeaturedImage&&scope.dataset.apgCategoryFeaturedImage!=='v1.5')scope.removeAttribute('data-apg-category-featured-image');
}
function captureEditorial(img){if(!img||img.dataset.apgEditorialSrc)return;img.dataset.apgEditorialSrc=img.getAttribute('src')||'';img.dataset.apgEditorialAlt=img.getAttribute('alt')||'';if(img.hasAttribute('srcset')){img.dataset.apgEditorialSrcset=img.getAttribute('srcset')||'';img.dataset.apgEditorialHadSrcset='true'}if(img.hasAttribute('sizes')){img.dataset.apgEditorialSizes=img.getAttribute('sizes')||'';img.dataset.apgEditorialHadSizes='true'}}
function restoreEditorial(scope,img){if(!img)return;const src=img.dataset.apgEditorialSrc||'';if(src)img.setAttribute('src',src);if(img.dataset.apgEditorialHadSrcset==='true')img.setAttribute('srcset',img.dataset.apgEditorialSrcset||'');else img.removeAttribute('srcset');if(img.dataset.apgEditorialHadSizes==='true')img.setAttribute('sizes',img.dataset.apgEditorialSizes||'');else img.removeAttribute('sizes');if(img.dataset.apgEditorialAlt!=null)img.setAttribute('alt',img.dataset.apgEditorialAlt);img.removeAttribute('data-apg-featured-product');img.dataset.apgImageSource='editorial';if(scope){scope.dataset.apgCategoryFeaturedImageFallback='editorial';scope.removeAttribute('data-apg-category-featured-image')}}
function probe(url){return new Promise(done=>{const test=new Image();let settled=false;const finish=ok=>{if(settled)return;settled=true;done(ok)};test.onload=()=>finish(test.naturalWidth>=80&&test.naturalHeight>=80);test.onerror=()=>finish(false);test.decoding='async';test.src=url;if(test.complete)setTimeout(()=>finish(test.naturalWidth>=80&&test.naturalHeight>=80),0)})}
async function swapSingle(scope,row){
  const img=imageFor(scope);if(!img||!row||!row.imageUrl)return false;captureEditorial(img);
  if(!(await probe(row.imageUrl))){restoreEditorial(scope,img);return false}
  return new Promise(done=>{let settled=false,timer=0;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);img.removeEventListener('load',onload);img.removeEventListener('error',onerror);if(!ok){restoreEditorial(scope,img);done(false);return}img.dataset.apgFeaturedProduct=row.productSlug||'';img.dataset.apgImageSource='product';scope.dataset.apgCategoryFeaturedImage='v1.5';scope.dataset.apgCategoryImageMode='single-product';scope.removeAttribute('data-apg-category-featured-image-fallback');done(true)};const onload=()=>finish(img.naturalWidth>=80&&img.naturalHeight>=80),onerror=()=>finish(false);img.addEventListener('load',onload);img.addEventListener('error',onerror);img.removeAttribute('srcset');img.removeAttribute('sizes');img.setAttribute('src',row.imageUrl);timer=setTimeout(()=>finish(false),6000);if(img.complete)setTimeout(onload,0)})
}
async function choose(scope,links){
  const slugs=[...new Set((links||[]).map(categorySlug).filter(Boolean))];if(!slugs.length)return null;
  const rows=await Promise.all(slugs.map(resolve));
  if(scope.matches('.apg-category-department-card')){for(const row of rows)if(row&&row.imageUrl)return row;return null}
  return strongest(rows.filter(Boolean));
}
async function enhanceScope(scope,links){if(!scope||busy.has(scope)||scope.dataset.apgCategoryFeaturedImage==='v1.5')return;busy.add(scope);try{const row=await choose(scope,links);if(!row){const img=imageFor(scope);if(img){captureEditorial(img);restoreEditorial(scope,img)}return}await swapSingle(scope,row)}finally{busy.delete(scope)}}
function boot(){
  const links=[...document.querySelectorAll('main a[href^="/categories/"]')],groups=new Map();
  for(const link of links){const scope=scopeFor(link);if(!scope)continue;recoverLegacy(scope);if(!hasVisual(scope))continue;if(!groups.has(scope))groups.set(scope,[]);groups.get(scope).push(link)}
  if(!groups.size)return;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);enhanceScope(entry.target,groups.get(entry.target)||[])})},{rootMargin:'500px 0px'});
  groups.forEach((unused,scope)=>observer.observe(scope));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

// v1.5 deliberately adds no imagery CSS. The existing SSR image element owns layout and dimensions.
// This avoids the stale immutable-CSS/overlay failure class that produced blank or double thumbnails.
const CLIENT_CSS='';

function augmentAppAsset(downstream,req,res){
  const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null,chunks=[];
  if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true};
  res.end=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(!chunks.length)return originalEnd(chunk,encoding,cb);let body=Buffer.concat(chunks).toString('utf8');body+=CLIENT_JS;if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');if(typeof res.setHeader==='function')res.setHeader('X-APG-Category-Featured-Imagery','v'+VERSION);return originalEnd(body,'utf8',cb)};
  return downstream(req,res);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('category featured imagery wrapper requires downstream handler');
  function handler(req,res){
    const url=requestUrl(req),path=url.pathname;
    if(path===LOOKUP_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendLookup(req,res,url);
    if(eligibleCspPath(path)&&res&&typeof res.setHeader==='function'){
      const originalSetHeader=res.setHeader.bind(res);
      res.setHeader=function(name,value){if(String(name||'').toLowerCase()==='content-security-policy'&&!Array.isArray(value))value=withEbayImageCsp(value);return originalSetHeader(name,value)};
      originalSetHeader('X-APG-Category-Featured-Imagery','v'+VERSION);
    }
    if(path===APP_PATH)return augmentAppAsset(downstream,req,res);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CATEGORY_FEATURED_IMAGERY_VERSION:VERSION,CATEGORY_FEATURED_IMAGERY_LOOKUP_PATH:LOOKUP_PATH});return handler;
}
module.exports={VERSION,APP_PATH,CSS_PATH,LOOKUP_PATH,COVERAGE_SCOPE,BATCH_SIZE,EBAY_IMAGE_ORIGIN,CATEGORY_MAP,safeCategory,eligibleCspPath,withEbayImageCsp,chunk,verificationRank,finiteScore,observedRank,compareMappings,selectFeatured,featuredPayload,coveragePayload,CLIENT_JS,CLIENT_CSS,wrap};