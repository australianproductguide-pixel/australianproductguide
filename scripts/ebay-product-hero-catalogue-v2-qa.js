'use strict';

const assert=require('assert');
const hero=require('../lib/ebay-product-hero-catalogue-v2-runtime');
const registry=require('../data/ebay-verified-catalogue-v2');

const NOW=Date.parse('2026-08-31T00:00:00Z');
const OBSERVED=NOW-(60*60*1000);
function mapping(product,title,{model=[],categoryPath='Home Appliances|Small Kitchen Appliances|Kettles',verificationLevel=model.length?'detail-model-evidence':'detail-title-model',legacyItemId='256066338034',observedAt=new Date(OBSERVED).toISOString()}={}){
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
function sampleHtml(slug){
  const canonical=`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`;
  const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>';
  return `<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section><section><article><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Alternative logo</span></div></article></section></main></body></html>`;
}

assert.strictEqual(hero.VERSION,'2.2');
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
  assert.strictEqual(hero.mappingAge(row,NOW),60*60*1000,'registry age must be anchored to Production observation time');
  assert.strictEqual(hero.mappingFresh(row,NOW),true,'one-hour-old registry evidence must be fresh');
  const source=sampleHtml(slug);

  // Critical quota invariant: products with no governed mapping remain logo-only and make no eBay call.
  delete registry.offers[slug];
  hero.cache.clear();
  let networkCalls=0;
  const unregistered=await hero.inject(source,`/products/${slug}/`,{
    now:()=>NOW,
    getItem:async()=>{networkCalls+=1;throw new Error('public runtime must not call eBay');},
    enrich:async()=>{networkCalls+=1;throw new Error('public runtime must not discover listings');}
  });
  assert.strictEqual(unregistered.usedEbayImage,false,'unregistered product must remain on APG logo');
  assert.strictEqual(unregistered.html,source,'unregistered product HTML must remain byte-identical');
  assert.strictEqual(networkCalls,0,'unregistered product must make zero eBay API calls');
  assert.strictEqual(unregistered.reason,'no-governed-ebay-registry-mapping');

  // A fresh governed mapping is independently re-checked and rendered without any eBay request.
  registry.offers[slug]=row;
  hero.cache.clear();
  const result=await hero.inject(source,`/products/${slug}/`,{
    now:()=>NOW,
    getItem:async()=>{networkCalls+=1;throw new Error('public runtime must not call eBay');},
    enrich:async()=>{networkCalls+=1;throw new Error('public runtime must not discover listings');}
  });
  assert.strictEqual(result.usedEbayImage,true,'fresh registered clean exact product must receive eBay hero');
  assert(result.html.includes('data-apg-ebay-product-hero="v2.2"'),'v2.2 hero marker missing');
  assert(result.html.includes('Product image supplied by eBay Australia · exact model verified within freshness window'),'freshness-qualified source label missing');
  assert(!result.html.includes('verified at render time'),'public copy must not imply request-time eBay verification');
  assert(result.html.includes('src="https://i.ebayimg.com/images/g/example/s-l1600.jpg"'),'eBay image missing');
  assert(result.html.includes('alt="Breville the Smart Kettle BKE825"'),'product alt text missing');
  assert(result.html.includes(hero.STYLE_HREF),'shared hero stylesheet missing');
  assert.strictEqual((result.html.match(/data-apg-ebay-product-hero=/g)||[]).length,1,'only top hero may be replaced');
  assert.strictEqual((result.html.match(/apg-product-brand-placeholder/g)||[]).length,1,'lower card placeholder must remain');
  assert(result.html.includes(`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`),'canonical must remain untouched');
  assert(result.html.includes('<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>'),'Product JSON-LD must remain untouched');
  assert.strictEqual(networkCalls,0,'fresh registered page must still make zero public eBay API calls');
  assert.strictEqual(result.resolvedAt,OBSERVED,'rendered freshness must remain anchored to original Production observation time');

  const resolved=await hero.resolveExactProduct(slug,{now:()=>NOW,getItem:async()=>{networkCalls+=1;}});
  assert(resolved,'fresh exact registry row should resolve');
  assert.strictEqual(resolved.resolvedAt,OBSERVED);
  assert.strictEqual(networkCalls,0,'direct runtime resolution must remain zero-network');

  // Existing five-product pilot remains delegated to v1 so catalogue runtime never touches it.
  let pilotCalled=false;
  const pilotSlug='breville-barista-express-impress-bes876';
  const pilot=await hero.inject(sampleHtml(pilotSlug),`/products/${pilotSlug}/`,{getItem:async()=>{pilotCalled=true;throw new Error('must not run');}});
  assert.strictEqual(pilot.usedEbayImage,false);assert.strictEqual(pilotCalled,false);

  // Known P110 -> P110M false match cannot enter the live hero even if accidentally present in the registry.
  hero.cache.clear();
  const wrongSlug='tp-link-tapo-p110';
  const wrongProduct=hero.productForSlug(wrongSlug);
  const wrongRow=mapping(wrongProduct,'TP-Link Tapo P110M Smart Wifi Power Socket Plug Monitor Google Alexa Smart Home',{model:['P110M','Tapo P110M (AU)'],categoryPath:'Electronics|Smart Home & Surveillance|Smart Plugs',legacyItemId:'377252921299'});
  registry.offers[wrongSlug]=wrongRow;
  const wrongSource=sampleHtml(wrongSlug);
  let wrongNetworkCalls=0;
  const wrong=await hero.inject(wrongSource,`/products/${wrongSlug}/`,{now:()=>NOW,getItem:async()=>{wrongNetworkCalls+=1;}});
  assert.strictEqual(wrong.usedEbayImage,false,'P110M must not populate P110 page');
  assert.strictEqual(wrong.html,wrongSource,'failed exact verification must preserve original page');
  assert.strictEqual(wrongNetworkCalls,0,'known mismatch must fail closed without spending an eBay call');

  // Once registry evidence is older than five hours, public display fails closed with no network fallback.
  hero.cache.clear();
  const staleRow=mapping(product,'Breville Smart Kettle, Brushed Stainless Steel BKE825BSS, Silver',{observedAt:new Date(NOW-hero.MAX_REGISTRY_AGE_MS-1).toISOString()});
  registry.offers[slug]=staleRow;
  let staleNetworkCalls=0;
  const stale=await hero.inject(source,`/products/${slug}/`,{now:()=>NOW,getItem:async()=>{staleNetworkCalls+=1;},enrich:async()=>{staleNetworkCalls+=1;}});
  assert.strictEqual(stale.usedEbayImage,false,'stale registry evidence must not be displayed');
  assert.strictEqual(stale.html,source,'stale registry evidence must preserve APG logo state');
  assert.strictEqual(staleNetworkCalls,0,'stale evidence must never trigger public-request eBay fallback calls');
  assert.strictEqual(hero.mappingFresh(staleRow,NOW),false,'stale row must exceed APG five-hour window');

  const csp="default-src 'self'; img-src 'self' data: https://m.media-amazon.com; connect-src 'self';";
  const patched=hero.withEbayImageCsp(csp);
  assert(patched.includes("img-src 'self' data: https://m.media-amazon.com https://i.ebayimg.com"));
  assert(patched.includes("connect-src 'self'"));
  assert.strictEqual((hero.withEbayImageCsp(patched).match(/https:\/\/i\.ebayimg\.com/g)||[]).length,1);

  delete registry.offers[slug];
  delete registry.offers[wrongSlug];
  hero.cache.clear();
  console.log('EBAY_PRODUCT_HERO_CATALOGUE_V22=PASS registry-only=1 public-network-calls=0 pilot-preserved=5 false-match-failclosed=P110-P110M registry-max=5h recommendationWeight=0');
})().catch(error=>{console.error(error);process.exit(1);});
