'use strict';

// APG verified eBay product hero v1.2.
// Presentation-only five-product pilot. Public product-page requests are registry-only and must
// not spend eBay Browse API quota. Retailer participation and affiliate status contribute zero
// recommendation points. The original APG brand placeholder remains the fail-closed state.
const registry=require('../data/ebay-verified-offers-v1');
const ebay=require('./ebay-browse-api-v1');

const VERSION='1.2';
const STYLE_HREF='/assets/ebay-verified-product-hero-v1.css';
const CACHE_TTL_MS=45*60*1000;
const MAX_CACHE_AGE_MS=5*60*60*1000;
const REGISTRY_FALLBACK_MAX_AGE_MS=5*60*60*1000;
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';

const PRODUCTS=Object.freeze({
  'breville-barista-express-impress-bes876':Object.freeze({name:'Breville Barista Express Impress BES876',tokens:['BES876']}),
  'sunbeam-barista-max-em5300s':Object.freeze({name:'Sunbeam Barista Max EM5300S',tokens:['EM5300S']}),
  'tp-link-tapo-c500':Object.freeze({name:'TP-Link Tapo C500',tokens:['C500']}),
  'tp-link-deco-be65':Object.freeze({name:'TP-Link Deco BE65',tokens:['BE65']}),
  'asus-proart-display-pa279crv':Object.freeze({name:'ASUS ProArt Display PA279CRV',tokens:['PA279CRV']})
});

const cache=new Map();

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));}
function clean(value){return String(value==null?'':value).trim();}
function canonicalPath(slug){return `/products/${slug}/`;}
function slugForPath(pathname){
  const path=clean(pathname);
  for(const slug of Object.keys(PRODUCTS))if(path===canonicalPath(slug))return slug;
  return null;
}
function exactEbayItemUrl(value,legacyItemId){
  try{
    const url=new URL(clean(value));
    if(url.protocol!=='https:'||url.hostname!=='www.ebay.com.au')return false;
    return new RegExp(`^/itm/(?:[^/]+/)?${String(legacyItemId).replace(/[^0-9]/g,'')}(?:$|[/?])`,'i').test(url.pathname+url.search);
  }catch{return false;}
}
function exactEbayImage(value){
  try{const url=new URL(clean(value));return url.protocol==='https:'&&url.hostname==='i.ebayimg.com';}catch{return false;}
}
function titleMatches(slug,title){
  const product=PRODUCTS[slug];
  const hay=clean(title).toUpperCase();
  return Boolean(product&&hay&&product.tokens.some(token=>hay.includes(token.toUpperCase())));
}
function validateDetail(slug,row,raw,{now=Date.now()}={}){
  if(!row||!raw||typeof raw!=='object')return null;
  const item=ebay.safeItemProjection(raw);
  if(!item)return null;
  const exactId=item.itemId===row.itemId||item.legacyItemId===row.legacyItemId;
  if(!exactId||item.legacyItemId!==row.legacyItemId)return null;
  if(!titleMatches(slug,item.title))return null;
  if(!item.price||item.price.currency!=='AUD')return null;
  if(!exactEbayImage(item.imageUrl))return null;
  if(!exactEbayItemUrl(item.itemWebUrl,row.legacyItemId))return null;
  if(item.itemEndDate){
    const end=Date.parse(item.itemEndDate);
    if(Number.isFinite(end)&&end<=Number(now))return null;
  }
  return Object.freeze({...item,resolvedAt:Number(now)});
}
function detailAge(detail,now=Date.now()){
  const resolved=Number(detail&&detail.resolvedAt);
  const t=Number(now);
  if(!Number.isFinite(resolved)||!Number.isFinite(t))return Infinity;
  return Math.max(0,t-resolved);
}
function registryFallbackDetail(slug,row,{now=Date.now()}={}){
  const t=Number(now);
  const observed=Date.parse(clean(row&&row.observedAt));
  if(!Number.isFinite(t)||!Number.isFinite(observed)||t<observed||t-observed>REGISTRY_FALLBACK_MAX_AGE_MS)return null;
  const raw={
    itemId:row.itemId,
    legacyItemId:row.legacyItemId,
    title:row.title,
    condition:row.condition,
    price:{value:row.price,currency:'AUD'},
    image:{imageUrl:row.image},
    additionalImages:[],
    itemWebUrl:row.itemWebUrl,
    itemAffiliateWebUrl:row.url,
    buyingOptions:['FIXED_PRICE'],
    itemEndDate:null
  };
  const validated=validateDetail(slug,row,raw,{now:t});
  if(!validated)return null;
  return Object.freeze({...validated,resolvedAt:observed,observedAt:new Date(observed).toISOString(),freshRegistryFallback:true});
}
async function currentDetail(slug,row,{now=Date.now}={}){
  const t=Number(now());
  const prior=cache.get(slug);
  if(prior&&t-prior.at<CACHE_TTL_MS&&detailAge(prior.detail,t)<MAX_CACHE_AGE_MS)return prior.detail;
  const detail=registryFallbackDetail(slug,row,{now:t});
  if(!detail){
    const error=new Error('eBay pilot registry row is stale or invalid');
    error.code='EBAY_HERO_REGISTRY_STALE';
    throw error;
  }
  cache.set(slug,{at:t,detail});
  return detail;
}
function ensureStyle(html){
  const out=String(html||'');
  if(out.includes(STYLE_HREF))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
}
function heroMarkup(product,detail){
  return `<figure class="apg-ebay-verified-product-hero-v1" data-apg-ebay-product-hero="v${VERSION}" data-apg-ebay-item-id="${esc(detail.legacyItemId)}"><div class="apg-ebay-verified-product-hero-v1__media"><img class="apg-ebay-verified-product-hero-v1__image" src="${esc(detail.imageUrl)}" alt="${esc(product.name)}" width="900" height="900" fetchpriority="high" decoding="async"></div><figcaption class="apg-ebay-verified-product-hero-v1__source">Product image supplied by eBay Australia · exact model verified within freshness window</figcaption></figure>`;
}
function replaceHeroPlaceholder(html,slug,detail){
  let out=String(html||'');
  const start=out.search(/<section\b[^>]*class="[^"]*\bproduct-hero\b[^"]*"[^>]*>/i);
  if(start<0)return null;
  const close=out.indexOf('</section>',start);
  if(close<0)return null;
  const end=close+'</section>'.length;
  let hero=out.slice(start,end);
  const placeholder=/<div\b[^>]*class="[^"]*\bapg-product-brand-placeholder\b[^"]*"[^>]*>[\s\S]*?<\/div>/i;
  if(!placeholder.test(hero))return null;
  hero=hero.replace(placeholder,heroMarkup(PRODUCTS[slug],detail));
  hero=hero.replace(/(<div\b[^>]*class="[^"]*\bproduct-visual\b[^"]*\blarge\b[^"]*"[^>]*?)\srole="img"/i,'$1 role="group"');
  out=out.slice(0,start)+hero+out.slice(end);
  return out;
}
function reconcileImageCopy(html){
  return String(html||'')
    .replace('Brand identity placeholder via APG governed brand resolver','Recent eBay Australia listing image · exact model verified within freshness window')
    .replace('Product photography: awaiting an authorised exact-product source','Product photography: recently verified exact-model image supplied by eBay Australia')
    .replace('Approved exact-product image not yet available','Recently verified exact-model retailer image via eBay Australia')
    .replace('Genuine product photography awaiting an authorised exact-product source','Retailer-supplied image may change with the live eBay listing');
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
  if(!slug||!original||!/<html|<!doctype/i.test(original))return {html:original,usedEbayImage:false,slug:null};
  const row=registry.forSlug(slug);
  if(!row)return {html:original,usedEbayImage:false,slug};
  try{
    const detail=await currentDetail(slug,row,options);
    const replaced=replaceHeroPlaceholder(original,slug,detail);
    if(!replaced)return {html:original,usedEbayImage:false,slug};
    const next=ensureStyle(reconcileImageCopy(replaced));
    return {html:next,usedEbayImage:true,slug,itemId:detail.legacyItemId,imageUrl:detail.imageUrl,resolvedAt:detail.resolvedAt,freshRegistryFallback:true};
  }catch{return {html:original,usedEbayImage:false,slug};}
}
function patchResponseCsp(res){
  if(!res||typeof res.getHeader!=='function'||typeof res.setHeader!=='function')return;
  const current=res.getHeader('Content-Security-Policy');
  if(Array.isArray(current))return;
  const next=withEbayImageCsp(current);
  if(next&&next!==current)res.setHeader('Content-Security-Policy',next);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Verified eBay product hero wrapper requires downstream handler');
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
  Object.assign(handler,downstream,{EBAY_VERIFIED_PRODUCT_HERO_VERSION:VERSION,transformEbayVerifiedProductHero:inject});
  return handler;
}
function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('Verified eBay product hero install requires a wrapper module');
  if(target.__APG_EBAY_VERIFIED_PRODUCT_HERO_V1_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return wrap(original(downstream));};
  target.__APG_EBAY_VERIFIED_PRODUCT_HERO_V1_INSTALLED=true;
  return target;
}

module.exports={
  VERSION,STYLE_HREF,CACHE_TTL_MS,MAX_CACHE_AGE_MS,REGISTRY_FALLBACK_MAX_AGE_MS,EBAY_IMAGE_ORIGIN,PRODUCTS,cache,
  slugForPath,titleMatches,validateDetail,detailAge,registryFallbackDetail,currentDetail,ensureStyle,heroMarkup,replaceHeroPlaceholder,
  reconcileImageCopy,withEbayImageCsp,inject,wrap,install
};
