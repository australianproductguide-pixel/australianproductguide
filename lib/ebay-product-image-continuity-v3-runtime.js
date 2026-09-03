'use strict';

// APG eBay product-image continuity v3.7.
// Public rendering remains zero-eBay-network. Exact retailer imagery is read only from APG's
// governed Supabase image-state registry. Public eligibility uses the same independent
// exact-product guard as the second-pass image worker. SSR still attempts a short bounded registry
// read, but product-page delivery no longer depends on that read succeeding: if SSR falls back, a
// same-origin APG endpoint progressively enhances the existing placeholder after page delivery.
// The browser never calls the eBay Browse API. A client-side image is swapped only after the APG
// endpoint returns a currently verified/guard-eligible row and the image itself successfully loads.
// Any registry, endpoint or image failure leaves the original APG fallback intact.

const {products}=require('../data');
const supabase=require('./apg-supabase-public-v1');
const pilotRegistry=require('../data/ebay-verified-offers-v1');
const exactGuard=require('./ebay-product-image-exact-guard-v23');

const VERSION='3.7';
const STYLE_HREF='/assets/ebay-verified-product-hero-v1.css';
const PUBLIC_LOOKUP_PATH='/api/ebay-product-image-public';
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';
const REFRESH_TARGET_MS=null;
const MAX_DISPLAY_AGE_MS=Infinity;
const STATE_CACHE_TTL_MS=30*1000;
const PRODUCT_LOOKUP_TIMEOUT_MS=1200;
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const stateCache=new Map();

function clean(value){return String(value==null?'':value).trim();}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function canonicalPath(slug){return `/products/${slug}/`;}
function slugForPath(pathname){const match=clean(pathname).match(/^\/products\/([a-z0-9][a-z0-9-]{1,160})\/$/);return match&&PRODUCT_MAP.has(match[1])?match[1]:null;}
function productForSlug(slug){return PRODUCT_MAP.get(clean(slug))||null;}
function exactEbayImage(value){try{const url=new URL(clean(value));return url.protocol==='https:'&&url.hostname==='i.ebayimg.com';}catch{return false;}}
function exactEbayItemUrl(value,legacyItemId){try{const url=new URL(clean(value));const id=clean(legacyItemId).replace(/[^0-9]/g,'');if(!id||url.protocol!=='https:'||url.hostname!=='www.ebay.com.au')return false;return new RegExp(`^/itm/(?:[^/]+/)?${id}(?:$|[/?])`,'i').test(url.pathname+url.search);}catch{return false;}}
function ageMs(verifiedAt,now=Date.now()){const observed=Date.parse(clean(verifiedAt));const t=Number(now);if(!Number.isFinite(observed)||!Number.isFinite(t)||t<observed)return Infinity;return t-observed;}
function displayFresh(row){return Boolean(row&&row.observedAt);}
function stateToMapping(state){
  if(!state||typeof state!=='object')return null;
  const price=clean(state.price_value)&&clean(state.price_currency)?{value:clean(state.price_value),currency:clean(state.price_currency)}:null;
  return {slug:clean(state.slug),productName:clean(state.product_name),status:clean(state.status),detailVerified:state.detail_verified===true,exactModel:state.exact_model===true,verificationLevel:clean(state.verification_level),verificationEvidence:state.verification_evidence||{},itemId:clean(state.item_id),legacyItemId:clean(state.legacy_item_id),title:clean(state.title),condition:clean(state.condition),price,imageUrl:clean(state.image_url),imageSource:clean(state.image_source)||'ebay-listing',itemWebUrl:clean(state.item_web_url),itemAffiliateWebUrl:clean(state.item_affiliate_web_url)||null,matchScore:state.match_score==null?null:Number(state.match_score),matchReasons:Array.isArray(state.match_reasons)?state.match_reasons:[],matchFlags:Array.isArray(state.match_flags)?state.match_flags:[],marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',observedAt:clean(state.last_verified_at),recommendationWeight:Number(state.recommendation_weight),recoveryRequired:state.recovery_required===true,consecutiveFailures:Number(state.consecutive_failures)||0,nextRefreshAt:clean(state.next_refresh_at)||null};
}
function pilotFallbackMapping(slug){const row=pilotRegistry.forSlug(slug);if(!row)return null;return {slug:row.slug,productName:row.productName,status:'verified',detailVerified:true,exactModel:true,verificationLevel:'detail-title-model',verificationEvidence:{},itemId:row.itemId,legacyItemId:row.legacyItemId,title:row.title,condition:row.condition,price:{value:row.price,currency:row.currency},imageUrl:row.image,imageSource:'ebay-listing',itemWebUrl:row.itemWebUrl,itemAffiliateWebUrl:row.url,matchScore:null,matchReasons:['original-pilot-detail-verification'],matchFlags:[],marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',observedAt:row.observedAt,recommendationWeight:0,recoveryRequired:false,consecutiveFailures:0,nextRefreshAt:null};}
function completeMapping(row,slug){
  if(!row||row.slug!==slug||row.status!=='verified'||row.detailVerified!==true||row.exactModel!==true)return false;
  if(row.marketplaceId!=='EBAY_AU'||row.source!=='eBay Buy Browse API'||row.recommendationWeight!==0)return false;
  if(!['detail-model-evidence','detail-title-model'].includes(row.verificationLevel))return false;
  if(!row.itemId||!row.legacyItemId||!row.title||!row.condition||!row.price||row.price.currency!=='AUD')return false;
  if(!exactEbayImage(row.imageUrl)||!exactEbayItemUrl(row.itemWebUrl,row.legacyItemId))return false;
  return Boolean(row.observedAt);
}
function toGuardRow(row){return {status:'accept',accepted:{itemId:row.itemId,legacyItemId:row.legacyItemId,title:row.title,condition:row.condition,price:row.price,imageUrl:row.imageUrl,imageSource:row.imageSource,itemWebUrl:row.itemWebUrl,itemAffiliateWebUrl:row.itemAffiliateWebUrl,score:row.matchScore,reasons:row.matchReasons,flags:row.matchFlags,exactModel:true,detailVerified:true,verificationLevel:row.verificationLevel,verificationEvidence:row.verificationEvidence,recommendationWeight:0},review:null,candidates:[]};}
function guardEligible(slug,row,now=Date.now()){const product=productForSlug(slug);if(!product||!completeMapping(row,slug))return false;return exactGuard.evaluate(product,toGuardRow(row),products,{now}).eligible===true;}
async function currentMapping(slug,{now=Date.now,fetchState=supabase.imageState}={}){
  const t=Number(now());const cached=stateCache.get(slug);
  if(cached&&t-cached.cachedAt<=STATE_CACHE_TTL_MS&&guardEligible(slug,cached.row,t))return cached.row;
  let governedStatePresent=false;
  try{const state=await fetchState(slug,{timeoutMs:PRODUCT_LOOKUP_TIMEOUT_MS});governedStatePresent=Boolean(state&&typeof state==='object');const row=stateToMapping(state);if(guardEligible(slug,row,t)){stateCache.set(slug,{cachedAt:t,row});return row;}if(governedStatePresent){stateCache.delete(slug);return null;}}catch{}
  if(cached&&guardEligible(slug,cached.row,t))return cached.row;
  const pilot=pilotFallbackMapping(slug);return guardEligible(slug,pilot,t)?pilot:null;
}
function ensureStyle(html){const out=String(html||'');if(out.includes(STYLE_HREF))return out;return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);}
function heroMarkup(product,row){return `<figure class="apg-ebay-verified-product-hero-v1 apg-ebay-product-image-continuity-v3" data-apg-ebay-product-hero="v${VERSION}" data-apg-ebay-image-continuity="v${VERSION}" data-apg-ebay-item-id="${esc(row.legacyItemId)}"><div class="apg-ebay-verified-product-hero-v1__media"><img class="apg-ebay-verified-product-hero-v1__image" src="${esc(row.imageUrl)}" alt="${esc(product.brand?`${product.brand} ${product.name}`:product.name)}" width="900" height="900" fetchpriority="high" decoding="async"></div><figcaption class="apg-ebay-verified-product-hero-v1__source">Product image supplied by eBay Australia · exact product verified by APG</figcaption></figure>`;}
function replaceHeroPlaceholder(html,slug,row){let out=String(html||'');if(/data-apg-ebay-product-hero=/i.test(out))return out;const start=out.search(/<section\b[^>]*class="[^"]*\bproduct-hero\b[^"]*"[^>]*>/i);if(start<0)return null;const close=out.indexOf('</section>',start);if(close<0)return null;const end=close+'</section>'.length;let hero=out.slice(start,end);const placeholder=/<div\b[^>]*class="[^"]*\bapg-product-brand-placeholder\b[^"]*"[^>]*>[\s\S]*?<\/div>/i;if(!placeholder.test(hero))return null;hero=hero.replace(placeholder,heroMarkup(productForSlug(slug),row));hero=hero.replace(/(<div\b[^>]*class="[^"]*\bproduct-visual\b[^"]*\blarge\b[^"]*"[^>]*?)\srole="img"/i,'$1 role="group"');return out.slice(0,start)+hero+out.slice(end);}
function reconcileImageCopy(html){return String(html||'').replace('Brand identity placeholder via APG governed brand resolver','Current eBay Australia listing image · exact product verified by APG').replace('Product photography: awaiting an authorised exact-product source','Product photography: verified exact-product retailer image').replace('Approved exact-product image not yet available','Verified exact-product retailer image via eBay Australia').replace('Genuine product photography awaiting an authorised exact-product source','Retailer-supplied image remains until APG explicitly refreshes, replaces or revokes it');}
function withEbayImageCsp(value){const csp=clean(value);if(!csp||csp.includes(EBAY_IMAGE_ORIGIN))return csp;if(!/(^|;)\s*img-src\s+/i.test(csp))return csp;return csp.replace(/((?:^|;)\s*img-src\s+)([^;]*)/i,(all,prefix,sources)=>`${prefix}${sources.trim()} ${EBAY_IMAGE_ORIGIN}`);}
function progressiveEnhancementScript(slug){
  const safe=JSON.stringify(clean(slug));
  return `<script data-apg-ebay-product-hero-progressive="v1.0">;(()=>{'use strict';if(window.__APG_EBAY_PRODUCT_HERO_PROGRESSIVE_V1__)return;window.__APG_EBAY_PRODUCT_HERO_PROGRESSIVE_V1__='1.0';const slug=${safe};if(!slug||document.querySelector('[data-apg-ebay-product-hero]'))return;const root=document.querySelector('.product-hero .product-visual.large');const placeholder=root&&root.querySelector('.apg-product-brand-placeholder');if(!root||!placeholder)return;const reconcile=()=>{const replacements=new Map([['Brand identity placeholder via APG governed brand resolver','Current eBay Australia listing image · exact product verified by APG'],['Product photography: awaiting an authorised exact-product source','Product photography: verified exact-product retailer image'],['Approved exact-product image not yet available','Verified exact-product retailer image via eBay Australia'],['Genuine product photography awaiting an authorised exact-product source','Retailer-supplied image remains until APG explicitly refreshes, replaces or revokes it']]);const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){let value=node.nodeValue||'',next=value;for(const [from,to] of replacements)if(next.includes(from))next=next.split(from).join(to);if(next!==value)node.nodeValue=next}};const ensureStyle=()=>{if(document.querySelector('link[href="${STYLE_HREF}"]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='${STYLE_HREF}';document.head.appendChild(link)};fetch('${PUBLIC_LOOKUP_PATH}?slug='+encodeURIComponent(slug),{credentials:'same-origin',headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).then(data=>{const row=data&&data.image;if(!row||typeof row.url!=='string'||!/^https:\/\/i[.]ebayimg[.]com\//i.test(row.url))return;const probe=new Image();let settled=false;const finish=ok=>{if(settled)return;settled=true;if(!ok||document.querySelector('[data-apg-ebay-product-hero]'))return;ensureStyle();const figure=document.createElement('figure');figure.className='apg-ebay-verified-product-hero-v1 apg-ebay-product-image-continuity-v3';figure.dataset.apgEbayProductHero='v${VERSION}';figure.dataset.apgEbayImageContinuity='v${VERSION}';const media=document.createElement('div');media.className='apg-ebay-verified-product-hero-v1__media';const img=document.createElement('img');img.className='apg-ebay-verified-product-hero-v1__image';img.src=row.url;img.alt=String(row.alt||'Product image');img.width=900;img.height=900;img.decoding='async';media.appendChild(img);const caption=document.createElement('figcaption');caption.className='apg-ebay-verified-product-hero-v1__source';caption.textContent='Product image supplied by eBay Australia · exact product verified by APG';figure.append(media,caption);placeholder.replaceWith(figure);root.setAttribute('role','group');root.dataset.apgEbayProductHeroEnhanced='v1.0';reconcile()};probe.onload=()=>finish(probe.naturalWidth>=80&&probe.naturalHeight>=80);probe.onerror=()=>finish(false);probe.decoding='async';probe.src=row.url;if(probe.complete)setTimeout(()=>finish(probe.naturalWidth>=80&&probe.naturalHeight>=80),0)}).catch(()=>{});})();</script>`;
}
function ensureProgressiveEnhancement(html,slug){const out=String(html||'');if(!slug||out.includes('data-apg-ebay-product-hero-progressive='))return out;const script=progressiveEnhancementScript(slug);return /<\/body>/i.test(out)?out.replace(/<\/body>/i,script+'</body>'):out+script;}
async function inject(html,pathname,options={}){
  const original=String(html||'');const slug=slugForPath(pathname);
  if(!slug||!original||!/<html|<!doctype/i.test(original))return {html:original,usedEbayImage:false,slug:null,reason:'inactive-route'};
  if(/data-apg-ebay-product-hero=/i.test(original))return {html:ensureProgressiveEnhancement(original,slug),usedEbayImage:true,slug,reason:'existing-current-ebay-hero'};
  const row=await currentMapping(slug,options);
  if(!row)return {html:ensureProgressiveEnhancement(original,slug),usedEbayImage:false,slug,reason:'no-current-governed-image-state'};
  const replaced=replaceHeroPlaceholder(original,slug,row);
  if(!replaced)return {html:ensureProgressiveEnhancement(original,slug),usedEbayImage:false,slug,reason:'hero-placeholder-not-found'};
  return {html:ensureProgressiveEnhancement(ensureStyle(reconcileImageCopy(replaced)),slug),usedEbayImage:true,slug,itemId:row.legacyItemId,imageUrl:row.imageUrl,verifiedAt:row.observedAt,recoveryRequired:row.recoveryRequired===true,reason:'persistent-governed-image-state'};
}
function patchResponseCsp(res){if(!res||typeof res.getHeader!=='function'||typeof res.setHeader!=='function')return;const current=res.getHeader('Content-Security-Policy');if(Array.isArray(current))return;const next=withEbayImageCsp(current);if(next&&next!==current)res.setHeader('Content-Security-Policy',next);}
function safeResultHeader(value){return clean(value).toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,80)||'unknown';}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay product image continuity wrapper requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    const productRoute=Boolean(slugForPath(path));
    const originalEnd=res.end.bind(res);const originalWrite=typeof res.write==='function'?res.write.bind(res):null;const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length){if(productRoute&&typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Product-Image-Result','empty-response');return originalEnd(chunk,encoding,cb);}
      const body=Buffer.concat(chunks).toString('utf8');const type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');const isHtml=/text\/html/i.test(type)||/<html|<!doctype/i.test(body);
      if(!isHtml){if(productRoute&&typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Product-Image-Result','non-html');return originalEnd(body,'utf8',cb);}
      inject(body,path).then(result=>{
        if(productRoute){patchResponseCsp(res);if(typeof res.setHeader==='function'){res.setHeader('X-APG-eBay-Product-Image-Result',safeResultHeader(result&&result.reason));res.setHeader('X-APG-eBay-Product-Image-Progressive','v1.0');}}
        if(result.usedEbayImage){if(typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Product-Image-Continuity','v'+VERSION);if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');}
        originalEnd(result.html,'utf8',cb);
      }).catch(()=>{
        if(productRoute&&typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Product-Image-Result','inject-error');
        originalEnd(body,'utf8',cb);
      });
      return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION:VERSION,transformEbayProductImageContinuity:inject});return handler;
}
function install(target){if(!target||typeof target.wrap!=='function')throw new TypeError('eBay product image continuity install requires a wrapper module');if(target.__APG_EBAY_PRODUCT_IMAGE_CONTINUITY_V3_INSTALLED)return target;const original=target.wrap.bind(target);target.wrap=function(downstream){return wrap(original(downstream));};target.__APG_EBAY_PRODUCT_IMAGE_CONTINUITY_V3_INSTALLED=true;return target;}

module.exports={VERSION,STYLE_HREF,PUBLIC_LOOKUP_PATH,EBAY_IMAGE_ORIGIN,REFRESH_TARGET_MS,MAX_DISPLAY_AGE_MS,STATE_CACHE_TTL_MS,PRODUCT_LOOKUP_TIMEOUT_MS,PRODUCT_MAP,stateCache,slugForPath,productForSlug,ageMs,displayFresh,stateToMapping,pilotFallbackMapping,completeMapping,toGuardRow,guardEligible,currentMapping,ensureStyle,heroMarkup,replaceHeroPlaceholder,reconcileImageCopy,withEbayImageCsp,progressiveEnhancementScript,ensureProgressiveEnhancement,safeResultHeader,inject,wrap,install};
