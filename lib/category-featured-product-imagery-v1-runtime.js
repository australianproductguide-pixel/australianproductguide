'use strict';

// APG category featured product imagery v1.3
// Progressive, non-blocking collection imagery for the maintained category catalogue.
// The existing governed editorial/category image is the permanent visual baseline. A governed
// exact-model product image may be layered above it only after the replacement has loaded.
// The baseline is never hidden or removed, so missing, blocked, transparent, slow or failed
// product imagery cannot leave a category or department tile blank.
// The 90-category directory resolves its complete image map through one cacheable APG endpoint;
// the server batches registry reads in groups of at most 100 products. Affiliate relationships
// and retailer economics never enter image selection. Shopper browsing makes no live eBay calls.
const {categories}=require('../data');
const governed=require('./governed-product-card-imagery-v1-runtime');

const VERSION='1.3';
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
  return {categorySlug:slug,categoryLabel:category.label||slug,productSlug:selectedProduct.slug,productLabel:selectedProduct.brand?`${selectedProduct.brand} ${selectedProduct.name}`:selectedProduct.name,imageUrl:selected.imageUrl};
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
if(window.__APG_CATEGORY_FEATURED_IMAGERY_V1__==='1.3')return;
window.__APG_CATEGORY_FEATURED_IMAGERY_V1__='1.3';
const path=location.pathname;if(path==='/'||/^\/products\//.test(path))return;
const directory=path==='/categories/'||path==='/categories',cache=new Map(),pending=new Map(),busy=new WeakSet();let coveragePromise=null;
const categorySlug=a=>{try{const m=new URL(a.getAttribute('href')||'',location.origin).pathname.match(/^\/categories\/([a-z0-9][a-z0-9-]{1,160})\/$/);return m?m[1]:''}catch{return ''}};
async function coverage(){if(!directory)return new Map();if(coveragePromise)return coveragePromise;coveragePromise=fetch('/api/category-featured-image-v1?scope=all',{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{const map=new Map(),rows=d&&d.categories&&typeof d.categories==='object'?d.categories:{};for(const [slug,row] of Object.entries(rows)){map.set(slug,row||null);cache.set(slug,row||null)}return map}).catch(()=>new Map());return coveragePromise}
async function resolve(slug){if(cache.has(slug))return cache.get(slug);if(directory){const rows=await coverage();const row=rows.get(slug)||null;cache.set(slug,row);return row}if(pending.has(slug))return pending.get(slug);const work=fetch('/api/category-featured-image-v1?slug='+encodeURIComponent(slug),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{const row=d&&d.category||null;cache.set(slug,row);return row}).catch(()=>{cache.set(slug,null);return null}).finally(()=>pending.delete(slug));pending.set(slug,work);return work}
function scopeFor(link){return link.closest('article,.category-card,.collection-card,.browse-card,.decision-card,.apg-v12-card,.card,li')}
function hasVisual(scope){return !!(scope&&scope.querySelector('img,.category-visual,.collection-visual,.card-visual,.apg-v12-art,.category-image,.collection-image,.hero-media,.visual'))}
function departmentSlot(scope){
  if(!scope||!scope.matches('.apg-category-department-card'))return null;
  const title=scope.querySelector('.apg-category-department-title');if(!title)return null;
  let slot=title.querySelector(':scope > .apg-category-product-slot-v12');if(slot)return slot;
  const original=title.querySelector(':scope > img');if(!original)return null;
  slot=document.createElement('span');slot.className='apg-category-product-slot-v12';original.insertAdjacentElement('beforebegin',slot);slot.appendChild(original);return slot;
}
function visualFor(scope){
  if(!scope)return null;
  const department=departmentSlot(scope);if(department)return department;
  return scope.querySelector('.category-index-media>a,.category-visual,.collection-visual,.card-visual,.apg-v12-art,.category-image,.collection-image,.hero-media,.visual')||scope.querySelector('img')?.parentElement||null;
}
function originalImage(visual){if(!visual)return null;for(const node of visual.querySelectorAll('img')){if(!node.closest('.apg-category-product-stage-v1'))return node}return null}
function recoverLegacyV12(scope){
  if(!scope)return;
  const legacy=scope.dataset.apgCategoryFeaturedImage==='v1.2'||!!scope.querySelector('.apg-category-product-stage-v1');if(!legacy)return;
  for(const stage of scope.querySelectorAll('.apg-category-product-stage-v1'))stage.remove();
  const visual=visualFor(scope);if(visual)visual.classList.remove('apg-category-product-visual-pending-v12','apg-category-product-visual-v1');
  for(const img of scope.querySelectorAll('img')){if(img.style.opacity==='0')img.style.removeProperty('opacity');if(img.style.pointerEvents==='none')img.style.removeProperty('pointer-events')}
  if(scope.dataset.apgCategoryFeaturedImage==='v1.2')scope.removeAttribute('data-apg-category-featured-image');
}
function apply(scope,row){
  return new Promise(done=>{
    if(!scope||!row||!row.imageUrl||scope.dataset.apgCategoryFeaturedImage==='v1.3')return done(false);
    const visual=visualFor(scope);if(!visual)return done(false);
    const original=originalImage(visual);if(!original)return done(false);
    const stage=document.createElement('span');stage.className='apg-category-product-stage-v1';stage.dataset.apgCategoryProduct=row.productSlug||'';stage.dataset.apgImageReady='false';
    const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';img.width=420;img.height=260;
    let settled=false;
    const finish=(ok)=>{if(settled)return;settled=true;if(ok){original.style.removeProperty('opacity');original.style.removeProperty('pointer-events');stage.dataset.apgImageReady='true';visual.classList.remove('apg-category-product-visual-pending-v12');visual.classList.add('apg-category-product-visual-v1');scope.dataset.apgCategoryFeaturedImage='v1.3';scope.dataset.apgCategoryEditorialBaseline='preserved';scope.removeAttribute('data-apg-category-featured-image-fallback');done(true);return}stage.remove();visual.classList.remove('apg-category-product-visual-pending-v12');scope.dataset.apgCategoryFeaturedImageFallback='editorial';scope.dataset.apgCategoryEditorialBaseline='preserved';done(false)};
    img.addEventListener('load',()=>finish(true),{once:true});img.addEventListener('error',()=>finish(false),{once:true});stage.appendChild(img);
    original.style.removeProperty('opacity');original.style.removeProperty('pointer-events');visual.classList.add('apg-category-product-visual-pending-v12');original.insertAdjacentElement('afterend',stage);img.src=row.imageUrl;
  });
}
async function enhanceScope(scope,links){
  if(!scope||busy.has(scope)||scope.dataset.apgCategoryFeaturedImage==='v1.3')return;busy.add(scope);const seen=new Set();
  try{for(const link of links){const slug=categorySlug(link);if(!slug||seen.has(slug))continue;seen.add(slug);const row=await resolve(slug);if(!row)continue;if(await apply(scope,row))return}scope.dataset.apgCategoryFeaturedImageFallback='editorial';scope.dataset.apgCategoryEditorialBaseline='preserved'}finally{busy.delete(scope)}
}
function boot(){
  const links=[...document.querySelectorAll('main a[href^="/categories/"]')],groups=new Map();
  for(const link of links){const scope=scopeFor(link);if(!scope||!hasVisual(scope))continue;recoverLegacyV12(scope);if(!groups.has(scope))groups.set(scope,[]);groups.get(scope).push(link)}
  if(!groups.size)return;
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);enhanceScope(entry.target,groups.get(entry.target)||[])})},{rootMargin:'500px 0px'});
  groups.forEach((unused,scope)=>observer.observe(scope));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

const CLIENT_CSS=String.raw`
/* APG category featured product imagery v1.3 */
.apg-category-product-visual-pending-v12,.apg-category-product-visual-v1{position:relative!important;overflow:hidden!important;isolation:isolate!important}
.apg-category-product-visual-v1{background:radial-gradient(circle at 64% 42%,#fff 0 30%,#f5f8fc 60%,#eef3f8 100%)!important}
.apg-category-product-visual-pending-v12>img,.apg-category-product-visual-v1>img{opacity:1!important;visibility:visible!important}
.apg-category-product-stage-v1{position:absolute!important;inset:3% 4% 7%!important;z-index:2!important;display:flex!important;align-items:center!important;justify-content:center!important;pointer-events:none!important;opacity:0!important;filter:drop-shadow(0 10px 13px rgba(15,23,42,.10))!important}
.apg-category-product-stage-v1[data-apg-image-ready="true"]{opacity:1!important}
.apg-category-product-stage-v1 img{display:block!important;width:100%!important;height:100%!important;max-width:92%!important;max-height:92%!important;object-fit:contain!important;object-position:center!important;background:transparent!important;transform:scale(1.12)!important}
.apg-category-product-visual-v1>.apg-v12-icon,.apg-category-product-visual-v1>small,.apg-category-product-visual-v1 .category-icon,.apg-category-product-visual-v1 .collection-label{position:relative!important;z-index:3!important}
.apg-category-product-slot-v12{position:relative!important;display:block!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;overflow:hidden!important;border-radius:8px!important}
.apg-category-product-slot-v12>.apg-category-product-stage-v1{inset:2px!important;border-radius:7px!important}
.apg-category-product-slot-v12>.apg-category-product-stage-v1 img{max-width:100%!important;max-height:100%!important;transform:scale(1.05)!important}
@media(max-width:720px){.apg-category-product-stage-v1{inset:2% 3% 8%!important}.apg-category-product-stage-v1 img{max-width:96%!important;max-height:96%!important;transform:scale(1.18)!important}.apg-category-product-slot-v12>.apg-category-product-stage-v1{inset:2px!important}.apg-category-product-slot-v12>.apg-category-product-stage-v1 img{transform:scale(1.05)!important}}
`;

function augmentAsset(downstream,req,res,kind){
  const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null,chunks=[];
  if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true};
  res.end=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(!chunks.length)return originalEnd(chunk,encoding,cb);let body=Buffer.concat(chunks).toString('utf8');body+=kind==='js'?CLIENT_JS:CLIENT_CSS;if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');if(typeof res.setHeader==='function')res.setHeader('X-APG-Category-Featured-Imagery','v'+VERSION);return originalEnd(body,'utf8',cb)};
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
    if(path===APP_PATH)return augmentAsset(downstream,req,res,'js');
    if(path===CSS_PATH)return augmentAsset(downstream,req,res,'css');
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CATEGORY_FEATURED_IMAGERY_VERSION:VERSION,CATEGORY_FEATURED_IMAGERY_LOOKUP_PATH:LOOKUP_PATH});return handler;
}
module.exports={VERSION,APP_PATH,CSS_PATH,LOOKUP_PATH,COVERAGE_SCOPE,BATCH_SIZE,EBAY_IMAGE_ORIGIN,CATEGORY_MAP,safeCategory,eligibleCspPath,withEbayImageCsp,chunk,verificationRank,finiteScore,observedRank,compareMappings,selectFeatured,featuredPayload,coveragePayload,CLIENT_JS,CLIENT_CSS,wrap};