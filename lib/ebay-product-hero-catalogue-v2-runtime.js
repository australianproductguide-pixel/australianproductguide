'use strict';

// APG catalogue-wide eBay product hero v2.2.
//
// Public product pages are registry-only. Shopper requests NEVER perform eBay Browse search or
// item-detail calls. A non-pilot product can use eBay imagery only after its exact listing has
// been discovered and accepted by the governed Production enrichment batch, written to the
// reviewed catalogue registry, and independently re-checked by the strict hero guard here.
// Anything absent, stale, malformed or uncertain fails closed to the APG brand placeholder.
//
// Retailer participation and affiliate status contribute zero recommendation points. eBay imagery
// remains retailer-scoped and is not written into canonical Product.image structured data or
// APG-owned image provenance.

const {products}=require('../data');
const exactGuard=require('./ebay-product-hero-exact-guard-v2');
const pilotRegistry=require('../data/ebay-verified-offers-v1');
const catalogueRegistry=require('../data/ebay-verified-catalogue-v2');

const VERSION='2.2';
const STYLE_HREF='/assets/ebay-verified-product-hero-v1.css';
const CACHE_TTL_MS=45*60*1000;
const NEGATIVE_CACHE_TTL_MS=15*60*1000;
// eBay listing information displayed by APG must remain current. APG keeps the stricter existing
// five-hour display window rather than using the full six-hour maximum permitted by the API terms.
const MAX_CACHE_AGE_MS=5*60*60*1000;
const REGISTRY_FALLBACK_MAX_AGE_MS=5*60*60*1000;
const MAX_REGISTRY_AGE_MS=REGISTRY_FALLBACK_MAX_AGE_MS;
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';

const PRODUCT_MAP=new Map();
for(const product of products){
  if(product&&product.slug&&!PRODUCT_MAP.has(product.slug))PRODUCT_MAP.set(product.slug,product);
}
const PILOT_SLUGS=new Set(Object.keys(pilotRegistry.offers||{}));
const REGISTERED_SLUGS=new Set(Object.keys(catalogueRegistry.offers||{}));
const cache=new Map();

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function clean(value){return String(value==null?'':value).trim();}
function norm(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function displayName(product){
  const brand=clean(product&&product.brand);const name=clean(product&&product.name);
  if(!brand)return name;if(!name)return brand;
  return norm(name).startsWith(norm(brand))?name:`${brand} ${name}`;
}
function canonicalPath(slug){return `/products/${slug}/`;}
function slugForPath(pathname){
  const path=clean(pathname);
  const match=path.match(/^\/products\/([a-z0-9][a-z0-9-]*)\/$/i);
  if(!match)return null;
  const slug=match[1];
  return PRODUCT_MAP.has(slug)?slug:null;
}
function productForSlug(slug){return PRODUCT_MAP.get(clean(slug))||null;}
function mappingForSlug(slug){return catalogueRegistry.forSlug(clean(slug));}
function topHeroRange(html){
  const out=String(html||'');
  const start=out.search(/<section\b[^>]*class="[^"]*\bproduct-hero\b[^"]*"[^>]*>/i);
  if(start<0)return null;
  const close=out.indexOf('</section>',start);
  if(close<0)return null;
  return {start,end:close+'</section>'.length};
}
function topHeroHasPlaceholder(html){
  const range=topHeroRange(html);if(!range)return false;
  return /<div\b[^>]*class="[^"]*\bapg-product-brand-placeholder\b/i.test(String(html||'').slice(range.start,range.end));
}
function exactIdentity(item,accepted){
  if(!item||!accepted)return false;
  return (item.itemId===accepted.itemId||item.legacyItemId===accepted.legacyItemId)&&item.legacyItemId===accepted.legacyItemId;
}
// Pure compatibility helper retained for controlled refresh tooling and regression tests. Public
// runtime does not call eBay or use this helper to merge live responses.
function refreshedRow(row,current){
  const accepted=row&&row.accepted;
  if(!accepted||!current)return null;
  return {
    ...row,
    status:'accept',
    accepted:{
      ...accepted,
      itemId:current.itemId||accepted.itemId,
      legacyItemId:current.legacyItemId||accepted.legacyItemId,
      title:current.title||accepted.title,
      condition:current.condition||accepted.condition,
      price:current.price||accepted.price,
      imageUrl:current.imageUrl||accepted.imageUrl,
      itemWebUrl:current.itemWebUrl||accepted.itemWebUrl,
      itemAffiliateWebUrl:current.itemAffiliateWebUrl||accepted.itemAffiliateWebUrl,
      itemEndDate:current.itemEndDate||accepted.itemEndDate||null,
      detailVerified:true,
      exactModel:true,
      recommendationWeight:0
    }
  };
}
function mappingObservedAt(mapping){
  const observed=Date.parse(clean(mapping&&mapping.observedAt));
  return Number.isFinite(observed)?observed:null;
}
function mappingAge(mapping,now=Date.now()){
  const observed=mappingObservedAt(mapping);const t=Number(now);
  if(observed==null||!Number.isFinite(t)||t<observed)return Infinity;
  return t-observed;
}
function mappingFresh(mapping,now=Date.now()){
  return mappingAge(mapping,now)<=MAX_REGISTRY_AGE_MS;
}
function projectedDetail(product,staged,mapping,resolvedAt){
  const accepted=staged&&staged.accepted||{};
  return Object.freeze({
    slug:product.slug,
    name:displayName(product),
    itemId:accepted.itemId,
    legacyItemId:accepted.legacyItemId,
    title:accepted.title,
    imageUrl:accepted.imageUrl,
    itemWebUrl:accepted.itemWebUrl,
    itemAffiliateWebUrl:accepted.itemAffiliateWebUrl,
    itemEndDate:accepted.itemEndDate||null,
    resolvedAt:Number(resolvedAt),
    observedAt:clean(mapping&&mapping.observedAt)||null,
    marketplaceId:'EBAY_AU',
    source:'eBay Buy Browse API',
    recommendationWeight:0,
    verificationLevel:accepted.verificationLevel||null,
    freshRegistryFallback:true
  });
}
function registryFallback(product,mapping,staged,now){
  const observed=mappingObservedAt(mapping);const t=Number(now);
  if(observed==null||!mappingFresh(mapping,t))return null;
  const accepted=staged&&staged.accepted;
  if(!accepted)return null;
  const check=exactGuard.evaluate(product,staged,products,{now:t});
  if(!check.eligible)return null;
  return projectedDetail(product,staged,mapping,observed);
}
async function resolveExactProduct(slug,{now=Date.now}={}){
  const product=productForSlug(slug);
  if(!product||PILOT_SLUGS.has(slug))return null;
  const mapping=mappingForSlug(slug);
  // Critical quota invariant: no governed mapping means zero eBay API calls and an honest logo fallback.
  if(!mapping)return null;
  const staged=catalogueRegistry.toEnrichmentRow(mapping);
  if(!staged)return null;
  const t=Number(now());
  if(!mappingFresh(mapping,t)){
    cache.set(slug,{at:t,detail:null,reason:'registry-stale'});
    return null;
  }
  const check=exactGuard.evaluate(product,staged,products,{now:t});
  if(!check.eligible){
    cache.set(slug,{at:t,detail:null,reason:check.reason});
    return null;
  }
  const detail=registryFallback(product,mapping,staged,t);
  if(!detail){
    cache.set(slug,{at:t,detail:null,reason:'registry-invalid'});
    return null;
  }
  cache.set(slug,{at:t,detail,reason:'fresh-governed-registry'});
  return detail;
}
function ensureStyle(html){
  const out=String(html||'');
  if(out.includes(STYLE_HREF))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
}
function heroMarkup(product,detail){
  return `<figure class="apg-ebay-verified-product-hero-v1" data-apg-ebay-product-hero="v${VERSION}" data-apg-ebay-item-id="${esc(detail.legacyItemId)}"><div class="apg-ebay-verified-product-hero-v1__media"><img class="apg-ebay-verified-product-hero-v1__image" src="${esc(detail.imageUrl)}" alt="${esc(displayName(product))}" width="900" height="900" fetchpriority="high" decoding="async"></div><figcaption class="apg-ebay-verified-product-hero-v1__source">Product image supplied by eBay Australia · exact model verified within freshness window</figcaption></figure>`;
}
function replaceHeroPlaceholder(html,product,detail){
  const out=String(html||'');
  const range=topHeroRange(out);if(!range)return null;
  let hero=out.slice(range.start,range.end);
  const placeholder=/<div\b[^>]*class="[^"]*\bapg-product-brand-placeholder\b[^"]*"[^>]*>[\s\S]*?<\/div>/i;
  if(!placeholder.test(hero))return null;
  hero=hero.replace(placeholder,heroMarkup(product,detail));
  hero=hero.replace(/(<div\b[^>]*class="[^"]*\bproduct-visual\b[^"]*\blarge\b[^"]*"[^>]*?)\srole="img"/i,'$1 role="group"');
  return out.slice(0,range.start)+hero+out.slice(range.end);
}
function reconcileImageCopy(html){
  return String(html||'')
    .replace(/Brand identity placeholder via APG governed brand resolver/g,'Recent eBay Australia listing image · exact model verified within freshness window')
    .replace(/Product photography: awaiting an authorised exact-product source/g,'Product photography: recently verified exact-model image supplied by eBay Australia')
    .replace(/Genuine product photography awaiting an authorised exact-product source/g,'Retailer-supplied image may change with the live eBay listing')
    .replace(/Approved exact-product image not yet available/g,'Recently verified exact-model retailer image via eBay Australia')
    .replace(/Exact product verified; approved product image not yet available/g,'Recently verified exact-model retailer image via eBay Australia');
}
function withEbayImageCsp(value){
  const csp=clean(value);
  if(!csp||csp.includes(EBAY_IMAGE_ORIGIN))return csp;
  if(!/(^|;)\s*img-src\s+/i.test(csp))return csp;
  return csp.replace(/((?:^|;)\s*img-src\s+)([^;]*)/i,(all,prefix,sources)=>`${prefix}${sources.trim()} ${EBAY_IMAGE_ORIGIN}`);
}
async function inject(html,pathname,options={}){
  const original=String(html||'');
  const slug=slugForPath(pathname);
  if(!slug||PILOT_SLUGS.has(slug)||!original||!/<html|<!doctype/i.test(original))return {html:original,usedEbayImage:false,slug:slug||null};
  if(!topHeroHasPlaceholder(original))return {html:original,usedEbayImage:false,slug,reason:'no-top-hero-placeholder'};
  if(!mappingForSlug(slug))return {html:original,usedEbayImage:false,slug,reason:'no-governed-ebay-registry-mapping'};
  const product=productForSlug(slug);
  const detail=await resolveExactProduct(slug,options);
  if(!detail)return {html:original,usedEbayImage:false,slug,reason:'no-fresh-verified-ebay-registry-row'};
  const replaced=replaceHeroPlaceholder(original,product,detail);
  if(!replaced)return {html:original,usedEbayImage:false,slug,reason:'hero-not-replaceable'};
  return {html:ensureStyle(reconcileImageCopy(replaced)),usedEbayImage:true,slug,itemId:detail.legacyItemId,imageUrl:detail.imageUrl,resolvedAt:detail.resolvedAt,freshRegistryFallback:true};
}
function patchResponseCsp(res){
  if(!res||typeof res.getHeader!=='function'||typeof res.setHeader!=='function')return;
  const current=res.getHeader('Content-Security-Policy');
  if(Array.isArray(current))return;
  const next=withEbayImageCsp(current);
  if(next&&next!==current)res.setHeader('Content-Security-Policy',next);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Catalogue eBay product hero wrapper requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    const originalEnd=res.end.bind(res);
    const originalWrite=typeof res.write==='function'?res.write.bind(res):null;
    const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8');
      const type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');
      const isHtml=/text\/html/i.test(type)||/<html|<!doctype/i.test(body);
      if(!isHtml)return originalEnd(body,'utf8',cb);
      inject(body,path).then(result=>{
        if(result.usedEbayImage){
          patchResponseCsp(res);
          if(typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Verified-Product-Hero','v'+VERSION);
          if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');
        }
        originalEnd(result.html,'utf8',cb);
      }).catch(()=>originalEnd(body,'utf8',cb));
      return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{EBAY_PRODUCT_HERO_CATALOGUE_VERSION:VERSION,transformEbayProductHeroCatalogue:inject});
  return handler;
}
function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('Catalogue eBay product hero install requires a wrapper module');
  if(target.__APG_EBAY_PRODUCT_HERO_CATALOGUE_V2_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return wrap(original(downstream));};
  target.__APG_EBAY_PRODUCT_HERO_CATALOGUE_V2_INSTALLED=true;
  return target;
}

module.exports={
  VERSION,STYLE_HREF,CACHE_TTL_MS,NEGATIVE_CACHE_TTL_MS,MAX_CACHE_AGE_MS,REGISTRY_FALLBACK_MAX_AGE_MS,MAX_REGISTRY_AGE_MS,
  EBAY_IMAGE_ORIGIN,PRODUCT_MAP,PILOT_SLUGS,REGISTERED_SLUGS,cache,displayName,canonicalPath,slugForPath,productForSlug,mappingForSlug,
  topHeroRange,topHeroHasPlaceholder,exactIdentity,refreshedRow,mappingObservedAt,mappingAge,mappingFresh,projectedDetail,registryFallback,
  resolveExactProduct,ensureStyle,heroMarkup,replaceHeroPlaceholder,reconcileImageCopy,withEbayImageCsp,inject,wrap,install
};
