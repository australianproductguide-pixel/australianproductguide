'use strict';

// APG category featured product imagery v1.0
// Progressive, non-blocking collection imagery for the maintained category catalogue.
// Each category resolves to the first currently governed exact-model product image belonging
// to that category. A failed lookup leaves the existing editorial/category image untouched.
// No category/product HTML response waits on Supabase or eBay.
const {categories}=require('../data');
const governed=require('./governed-product-card-imagery-v1-runtime');

const VERSION='1.0';
const ORIGIN='https://australianproductguide.au';
const APP_PATH='/assets/app.js';
const CSS_PATH='/assets/premium-search-v76.css';
const LOOKUP_PATH='/api/category-featured-image-v1';
const CATEGORY_MAP=new Map(Object.entries(categories).filter(([,c])=>c&&Array.isArray(c.products)&&c.products.length));

function clean(value){return String(value==null?'':value).trim();}
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN);}catch{return new URL(ORIGIN+'/');}}
function safeCategory(url){const slug=clean(url.searchParams.get('slug')).toLowerCase();return /^[a-z0-9][a-z0-9-]{1,160}$/.test(slug)&&CATEGORY_MAP.has(slug)?slug:'';}
async function featuredPayload(slug){
  const category=CATEGORY_MAP.get(slug);if(!category)return {ok:true,version:VERSION,category:null};
  const products=category.products.filter(Boolean);const slugs=products.map(p=>p.slug).filter(Boolean).slice(0,100);
  const mappings=await governed.governedMappings(slugs);let selected=null;
  for(const product of products){const row=mappings.get(product.slug);if(!row)continue;selected={categorySlug:slug,categoryLabel:category.label||slug,productSlug:product.slug,productLabel:product.brand?`${product.brand} ${product.name}`:product.name,imageUrl:row.imageUrl};break;}
  return {ok:true,version:VERSION,category:selected};
}
function sendLookup(req,res,url){const slug=safeCategory(url);res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=600, stale-while-revalidate=1800');res.setHeader('X-APG-Category-Featured-Imagery','v'+VERSION);if(req.method==='HEAD')return res.end('');if(!slug)return res.end(JSON.stringify({ok:true,version:VERSION,category:null}));return featuredPayload(slug).then(payload=>res.end(JSON.stringify(payload))).catch(()=>res.end(JSON.stringify({ok:true,version:VERSION,category:null})));}

const CLIENT_JS=String.raw`
;(()=>{
'use strict';if(window.__APG_CATEGORY_FEATURED_IMAGERY_V1__)return;window.__APG_CATEGORY_FEATURED_IMAGERY_V1__='1.0';
const path=location.pathname;if(path==='/'||/^\/products\//.test(path))return;
const cache=new Map(),pending=new Map();
const categorySlug=a=>{try{const m=new URL(a.getAttribute('href')||'',location.origin).pathname.match(/^\/categories\/([a-z0-9][a-z0-9-]{1,160})\/$/);return m?m[1]:''}catch{return ''}};
async function resolve(slug){if(cache.has(slug))return cache.get(slug);if(pending.has(slug))return pending.get(slug);const work=fetch('/api/category-featured-image-v1?slug='+encodeURIComponent(slug),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(d=>{const row=d&&d.category||null;cache.set(slug,row);return row}).catch(()=>{cache.set(slug,null);return null}).finally(()=>pending.delete(slug));pending.set(slug,work);return work}
function scopeFor(link){return link.closest('article,.category-card,.collection-card,.browse-card,.decision-card,.apg-v12-card,.card,li')||link.parentElement}
function visualFor(scope){if(!scope)return null;return scope.querySelector('.category-visual,.collection-visual,.card-visual,.apg-v12-art,.category-image,.collection-image,.hero-media,.visual')||scope.querySelector('img')?.parentElement||null}
function apply(scope,row){if(!scope||!row||!row.imageUrl||scope.dataset.apgCategoryFeaturedImage==='v1')return;const visual=visualFor(scope);if(!visual)return;const original=visual.querySelector('img');const stage=document.createElement('span');stage.className='apg-category-product-stage-v1';stage.dataset.apgCategoryProduct= row.productSlug||'';const img=document.createElement('img');img.src=row.imageUrl;img.alt='';img.loading='lazy';img.decoding='async';img.width=420;img.height=260;img.addEventListener('error',()=>stage.remove(),{once:true});stage.appendChild(img);if(original){original.style.opacity='0';original.style.pointerEvents='none';original.insertAdjacentElement('afterend',stage)}else visual.insertBefore(stage,visual.firstChild);visual.classList.add('apg-category-product-visual-v1');scope.dataset.apgCategoryFeaturedImage='v1'}
async function enhance(link){const slug=categorySlug(link);if(!slug)return;const scope=scopeFor(link);if(!scope||scope.dataset.apgCategoryFeaturedImage==='v1')return;const row=await resolve(slug);if(row)apply(scope,row)}
let observer=null;function boot(){const links=[...document.querySelectorAll('main a[href^="/categories/"]')];if(!links.length)return;observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);enhance(entry.target)})},{rootMargin:'500px 0px'});links.forEach(link=>observer.observe(link))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

const CLIENT_CSS=String.raw`
/* APG category featured product imagery v1.0 */
.apg-category-product-visual-v1{position:relative!important;overflow:hidden!important;isolation:isolate!important;background:radial-gradient(circle at 64% 42%,#fff 0 30%,#f5f8fc 60%,#eef3f8 100%)!important}
.apg-category-product-stage-v1{position:absolute!important;inset:3% 4% 7%!important;z-index:1!important;display:flex!important;align-items:center!important;justify-content:center!important;pointer-events:none!important;filter:drop-shadow(0 10px 13px rgba(15,23,42,.10))!important}
.apg-category-product-stage-v1 img{display:block!important;width:100%!important;height:100%!important;max-width:92%!important;max-height:92%!important;object-fit:contain!important;object-position:center!important;background:transparent!important;transform:scale(1.12)!important}
.apg-category-product-visual-v1>.apg-v12-icon,.apg-category-product-visual-v1>small,.apg-category-product-visual-v1 .category-icon,.apg-category-product-visual-v1 .collection-label{position:relative!important;z-index:3!important}
@media(max-width:720px){.apg-category-product-stage-v1{inset:2% 3% 8%!important}.apg-category-product-stage-v1 img{max-width:96%!important;max-height:96%!important;transform:scale(1.18)!important}}
`;

function augmentAsset(downstream,req,res,kind){const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null,chunks=[];if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true};res.end=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(!chunks.length)return originalEnd(chunk,encoding,cb);let body=Buffer.concat(chunks).toString('utf8');body+=kind==='js'?CLIENT_JS:CLIENT_CSS;if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');if(typeof res.setHeader==='function')res.setHeader('X-APG-Category-Featured-Imagery','v'+VERSION);return originalEnd(body,'utf8',cb)};return downstream(req,res)}
function wrap(downstream){if(typeof downstream!=='function')throw new TypeError('category featured imagery wrapper requires downstream handler');function handler(req,res){const url=requestUrl(req),path=url.pathname;if(path===LOOKUP_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendLookup(req,res,url);if(path===APP_PATH)return augmentAsset(downstream,req,res,'js');if(path===CSS_PATH)return augmentAsset(downstream,req,res,'css');return downstream(req,res)}Object.assign(handler,downstream,{CATEGORY_FEATURED_IMAGERY_VERSION:VERSION,CATEGORY_FEATURED_IMAGERY_LOOKUP_PATH:LOOKUP_PATH});return handler}
module.exports={VERSION,APP_PATH,CSS_PATH,LOOKUP_PATH,CATEGORY_MAP,safeCategory,featuredPayload,CLIENT_JS,CLIENT_CSS,wrap};
