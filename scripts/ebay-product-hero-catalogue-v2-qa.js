'use strict';

const assert=require('assert');
const hero=require('../lib/ebay-product-hero-catalogue-v2-runtime');
const registry=require('../data/ebay-verified-catalogue-v2');

const NOW=Date.parse('2026-08-31T00:00:00Z');
function mapping(product,title,{model=[],categoryPath='Home Appliances|Small Kitchen Appliances|Kettles',verificationLevel=model.length?'detail-model-evidence':'detail-title-model',legacyItemId='256066338034',observedAt=new Date(NOW).toISOString()}={}){
  return {
    slug:product.slug,productId:product.id||`qa-${product.slug}`,brand:product.brand,productName:product.name,category:product.category,
    status:'verified',detailVerified:true,exactModel:true,verificationLevel,
    itemId:`v1|${legacyItemId}|0`,legacyItemId,title,condition:'Brand New',price:{value:'149.00',currency:'AUD'},
    imageUrl:'https://i.ebayimg.com/images/g/example/s-l1600.jpg',imageSource:'ebay-listing',
    itemWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}`,
    itemAffiliateWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}?campid=5339198634`,
    matchScore:106,priceRatio:1,verificationEvidence:{brands:[product.brand],model,categoryPath},
    matchReasons:['brand-match'],matchFlags:[],marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',observedAt,recommendationWeight:0
  };
}
function rawDetail(row,overrides={}){
  return {
    itemId:row.itemId,legacyItemId:row.legacyItemId,title:row.title,condition:row.condition,price:row.price,
    image:{imageUrl:row.imageUrl},additionalImages:[],itemWebUrl:row.itemWebUrl,itemAffiliateWebUrl:row.itemAffiliateWebUrl,
    buyingOptions:['FIXED_PRICE'],itemEndDate:'2099-01-01T00:00:00.000Z',...overrides
  };
}
function sampleHtml(slug){
  const canonical=`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`;
  const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>';
  return `<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section><section><article><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Alternative logo</span></div></article></section></main></body></html>`;
}

assert.strictEqual(hero.VERSION,'2.1');
assert.strictEqual(registry.VERSION,'2.0');
assert(hero.PRODUCT_MAP.size>=480,'catalogue hero runtime must see the maintained catalogue');
assert(hero.PILOT_SLUGS.has('breville-barista-express-impress-bes876'));
assert.strictEqual(hero.slugForPath('/products/breville-the-smart-kettle-bke825/'),'breville-the-smart-kettle-bke825');
assert.strictEqual(hero.slugForPath('/products/breville-the-smart-kettle-bke825'),null,'only canonical trailing-slash route activates');
assert.strictEqual(hero.slugForPath('/products/not-a-product/'),null);

(async()=>{
  const slug='breville-the-smart-kettle-bke825';
  const product=hero.productForSlug(slug);
  assert(product,'BKE825 product must exist');
  const row=mapping(product,'Breville Smart Kettle, Brushed Stainless Steel BKE825BSS, Silver');
  assert.strictEqual(registry.complete(row),true,'QA mapping must satisfy governed registry schema');
  assert(registry.toEnrichmentRow(row),'governed mapping must project to accepted enrichment evidence');
  const source=sampleHtml(slug);

  // Critical quota invariant: products with no governed mapping remain logo-only and make no eBay call.
  delete registry.offers[slug];
  hero.cache.clear();
  let unregisteredGetCalls=0;
  const unregistered=await hero.inject(source,`/products/${slug}/`,{now:()=>NOW,getItem:async()=>{unregisteredGetCalls+=1;throw new Error('must not call')}});
  assert.strictEqual(unregistered.usedEbayImage,false,'unregistered product must remain on APG logo');
  assert.strictEqual(unregistered.html,source,'unregistered product HTML must remain byte-identical');
  assert.strictEqual(unregisteredGetCalls,0,'unregistered product must make zero eBay API calls');
  assert.strictEqual(unregistered.reason,'no-governed-ebay-registry-mapping');

  // A governed mapping refreshes only its exact item and then receives the retailer-scoped hero.
  registry.offers[slug]=row;
  hero.cache.clear();
  let getCalls=0;
  const options={now:()=>NOW,getItem:async(itemId)=>{getCalls+=1;assert.strictEqual(itemId,row.itemId);return rawDetail(row);}};
  const result=await hero.inject(source,`/products/${slug}/`,options);
  assert.strictEqual(result.usedEbayImage,true,'registered clean exact product must receive eBay hero');
  assert(result.html.includes('data-apg-ebay-product-hero="v2.1"'),'v2.1 hero marker missing');
  assert(result.html.includes('Product image supplied by eBay Australia · exact model verified'),'source label missing');
  assert(result.html.includes('src="https://i.ebayimg.com/images/g/example/s-l1600.jpg"'),'eBay image missing');
  assert(result.html.includes('alt="Breville the Smart Kettle BKE825"'),'product alt text missing');
  assert(result.html.includes(hero.STYLE_HREF),'shared hero stylesheet missing');
  assert.strictEqual((result.html.match(/data-apg-ebay-product-hero=/g)||[]).length,1,'only top hero may be replaced');
  assert.strictEqual((result.html.match(/apg-product-brand-placeholder/g)||[]).length,1,'lower card placeholder must remain');
  assert(result.html.includes(`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`),'canonical must remain untouched');
  assert(result.html.includes('<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>'),'Product JSON-LD must remain untouched');
  assert.strictEqual(getCalls,1,'registered page should make exactly one current-item refresh on cache miss');

  // A second request in the 45-minute cache window reuses the same current exact result.
  const cached=await hero.resolveExactProduct(slug,options);
  assert(cached);assert.strictEqual(getCalls,1);

  // Existing five-product pilot remains delegated to v1 so its already-verified mappings do not change.
  let pilotCalled=false;
  const pilotSlug='breville-barista-express-impress-bes876';
  const pilot=await hero.inject(sampleHtml(pilotSlug),`/products/${pilotSlug}/`,{getItem:async()=>{pilotCalled=true;throw new Error('must not run')}});
  assert.strictEqual(pilot.usedEbayImage,false);assert.strictEqual(pilotCalled,false);

  // Known P110 -> P110M false match cannot enter the live hero even if accidentally present in the staged file.
  hero.cache.clear();
  const wrongSlug='tp-link-tapo-p110';
  const wrongProduct=hero.productForSlug(wrongSlug);
  const wrongRow=mapping(wrongProduct,'TP-Link Tapo P110M Smart Wifi Power Socket Plug Monitor Google Alexa Smart Home',{model:['P110M','Tapo P110M (AU)'],categoryPath:'Electronics|Smart Home & Surveillance|Smart Plugs',legacyItemId:'377252921299'});
  registry.offers[wrongSlug]=wrongRow;
  const wrongSource=sampleHtml(wrongSlug);
  let wrongGetCalls=0;
  const wrong=await hero.inject(wrongSource,`/products/${wrongSlug}/`,{now:()=>NOW,getItem:async()=>{wrongGetCalls+=1;return rawDetail(wrongRow);}});
  assert.strictEqual(wrong.usedEbayImage,false,'P110M must not populate P110 page');
  assert.strictEqual(wrong.html,wrongSource,'failed exact verification must preserve original page');
  assert.strictEqual(wrongGetCalls,0,'registry preflight must reject known mismatch before spending an eBay call');

  // A newly generated mapping may bridge a temporary API error only inside the conservative five-hour window.
  hero.cache.clear();
  const fallback=await hero.inject(source,`/products/${slug}/`,{now:()=>NOW+(60*60*1000),getItem:async()=>{const e=new Error('rate limited');e.code='EBAY_BROWSE_RATE_LIMITED';throw e;}});
  assert.strictEqual(fallback.usedEbayImage,true,'fresh Production registry evidence may bridge temporary eBay failure');
  assert.strictEqual(fallback.freshRegistryFallback,true);

  // Once that registry evidence is older than five hours, an API failure must fail closed.
  hero.cache.clear();
  const stale=await hero.inject(source,`/products/${slug}/`,{now:()=>NOW+hero.REGISTRY_FALLBACK_MAX_AGE_MS+1,getItem:async()=>{throw new Error('offline');}});
  assert.strictEqual(stale.usedEbayImage,false,'stale registry evidence must not be displayed');
  assert.strictEqual(stale.html,source);

  const csp="default-src 'self'; img-src 'self' data: https://m.media-amazon.com; connect-src 'self';";
  const patched=hero.withEbayImageCsp(csp);
  assert(patched.includes("img-src 'self' data: https://m.media-amazon.com https://i.ebayimg.com"));
  assert(patched.includes("connect-src 'self'"));
  assert.strictEqual((hero.withEbayImageCsp(patched).match(/https:\/\/i\.ebayimg\.com/g)||[]).length,1);

  delete registry.offers[slug];
  delete registry.offers[wrongSlug];
  hero.cache.clear();
  console.log('EBAY_PRODUCT_HERO_CATALOGUE_V21=PASS registry-first=1 unregistered-api-calls=0 exact-refresh=1 pilot-preserved=5 false-match-failclosed=P110-P110M cache=45m registry-fallback-max=5h recommendationWeight=0');
})().catch(error=>{console.error(error);process.exit(1);});
