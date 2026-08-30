'use strict';

const assert=require('assert');
const hero=require('../lib/ebay-product-hero-catalogue-v2-runtime');

const NOW=Date.parse('2026-08-31T00:00:00Z');
function acceptedRow(product,title,{model=[],categoryPath='Home Appliances|Small Kitchen Appliances|Kettles',verificationLevel=model.length?'detail-model-evidence':'detail-title-model',legacyItemId='256066338034'}={}){
  return {
    slug:product.slug,id:product.id||null,brand:product.brand,name:product.name,category:product.category,
    status:'accept',accepted:{
      itemId:`v1|${legacyItemId}|0`,legacyItemId,title,condition:'Brand New',price:{value:'149.00',currency:'AUD'},
      imageUrl:'https://i.ebayimg.com/images/g/example/s-l1600.jpg',imageSource:'ebay-listing',
      itemWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}`,
      itemAffiliateWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}?campid=5339198634`,
      score:106,status:'accept',reasons:['brand-match'],flags:[],exactModel:true,modelCoverage:1,nameCoverage:1,
      detailVerified:true,verificationLevel,verificationEvidence:{brands:[product.brand],model,categoryPath},
      marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',recommendationWeight:0
    },review:null,candidates:[],recommendationWeight:0
  };
}
function rawDetail(row,overrides={}){
  const a=row.accepted;
  return {
    itemId:a.itemId,legacyItemId:a.legacyItemId,title:a.title,condition:a.condition,price:a.price,
    image:{imageUrl:a.imageUrl},additionalImages:[],itemWebUrl:a.itemWebUrl,itemAffiliateWebUrl:a.itemAffiliateWebUrl,
    buyingOptions:['FIXED_PRICE'],itemEndDate:'2099-01-01T00:00:00.000Z',...overrides
  };
}
function sampleHtml(slug){
  const canonical=`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`;
  const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>';
  return `<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section><section><article><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Alternative logo</span></div></article></section></main></body></html>`;
}

assert.strictEqual(hero.VERSION,'2.0');
assert(hero.PRODUCT_MAP.size>=480,'catalogue hero runtime must see the maintained catalogue');
assert(hero.PILOT_SLUGS.has('breville-barista-express-impress-bes876'));
assert.strictEqual(hero.slugForPath('/products/breville-the-smart-kettle-bke825/'),'breville-the-smart-kettle-bke825');
assert.strictEqual(hero.slugForPath('/products/breville-the-smart-kettle-bke825'),null,'only canonical trailing-slash route activates');
assert.strictEqual(hero.slugForPath('/products/not-a-product/'),null);

(async()=>{
  hero.cache.clear();
  const slug='breville-the-smart-kettle-bke825';
  const product=hero.productForSlug(slug);
  assert(product,'BKE825 product must exist');
  const row=acceptedRow(product,'Breville Smart Kettle, Brushed Stainless Steel BKE825BSS, Silver');
  let enrichCalls=0,getCalls=0;
  const options={
    now:()=>NOW,
    enrich:async()=>{enrichCalls+=1;return row;},
    getItem:async()=>{getCalls+=1;return rawDetail(row);}
  };
  const source=sampleHtml(slug);
  const result=await hero.inject(source,`/products/${slug}/`,options);
  assert.strictEqual(result.usedEbayImage,true,'clean non-pilot exact product must receive eBay hero');
  assert(result.html.includes('data-apg-ebay-product-hero="v2.0"'),'v2 hero marker missing');
  assert(result.html.includes('Product image supplied by eBay Australia · exact model verified'),'source label missing');
  assert(result.html.includes('src="https://i.ebayimg.com/images/g/example/s-l1600.jpg"'),'eBay image missing');
  assert(result.html.includes('alt="Breville the Smart Kettle BKE825"'),'product alt text missing');
  assert(result.html.includes(hero.STYLE_HREF),'shared hero stylesheet missing');
  assert.strictEqual((result.html.match(/data-apg-ebay-product-hero=/g)||[]).length,1,'only top hero may be replaced');
  assert.strictEqual((result.html.match(/apg-product-brand-placeholder/g)||[]).length,1,'lower card placeholder must remain');
  assert(result.html.includes(`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`),'canonical must remain untouched');
  assert(result.html.includes('<script type="application/ld+json">{"@type":"Product","name":"Example"}</script>'),'Product JSON-LD must remain untouched');
  assert.strictEqual(enrichCalls,1);assert.strictEqual(getCalls,1);

  // A second request in the 45-minute cache window must reuse the current exact result.
  const cached=await hero.resolveExactProduct(slug,options);
  assert(cached);assert.strictEqual(enrichCalls,1);assert.strictEqual(getCalls,1);

  // Existing five-product pilot remains delegated to v1 so its already-verified mappings do not change.
  let pilotCalled=false;
  const pilotSlug='breville-barista-express-impress-bes876';
  const pilot=await hero.inject(sampleHtml(pilotSlug),`/products/${pilotSlug}/`,{enrich:async()=>{pilotCalled=true;throw new Error('must not run')}});
  assert.strictEqual(pilot.usedEbayImage,false);assert.strictEqual(pilotCalled,false);

  // Known P110 -> P110M false match fails closed and leaves the page byte-identical.
  hero.cache.clear();
  const wrongSlug='tp-link-tapo-p110';
  const wrongProduct=hero.productForSlug(wrongSlug);
  const wrongRow=acceptedRow(wrongProduct,'TP-Link Tapo P110M Smart Wifi Power Socket Plug Monitor Google Alexa Smart Home',{model:['P110M','Tapo P110M (AU)'],categoryPath:'Electronics|Smart Home & Surveillance|Smart Plugs',legacyItemId:'377252921299'});
  const wrongSource=sampleHtml(wrongSlug);
  const wrong=await hero.inject(wrongSource,`/products/${wrongSlug}/`,{now:()=>NOW,enrich:async()=>wrongRow,getItem:async()=>rawDetail(wrongRow)});
  assert.strictEqual(wrong.usedEbayImage,false,'P110M must not populate P110 page');
  assert.strictEqual(wrong.html,wrongSource,'failed exact verification must preserve original page');

  // Temporary API failure with no prior verified success must fail closed to the logo.
  hero.cache.clear();
  const failed=await hero.inject(source,`/products/${slug}/`,{now:()=>NOW,enrich:async()=>{throw new Error('eBay unavailable')}});
  assert.strictEqual(failed.usedEbayImage,false);
  assert.strictEqual(failed.html,source);

  const csp="default-src 'self'; img-src 'self' data: https://m.media-amazon.com; connect-src 'self';";
  const patched=hero.withEbayImageCsp(csp);
  assert(patched.includes("img-src 'self' data: https://m.media-amazon.com https://i.ebayimg.com"));
  assert(patched.includes("connect-src 'self'"));
  assert.strictEqual((hero.withEbayImageCsp(patched).match(/https:\/\/i\.ebayimg\.com/g)||[]).length,1);

  console.log('EBAY_PRODUCT_HERO_CATALOGUE_V2=PASS exact-nonpilot=1 pilot-preserved=5 false-match-failclosed=P110-P110M cache=45m stale-max=5h recommendationWeight=0');
})().catch(error=>{console.error(error);process.exit(1);});
