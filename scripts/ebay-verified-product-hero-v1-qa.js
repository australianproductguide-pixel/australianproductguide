'use strict';

const assert=require('assert');
const registry=require('../data/ebay-verified-offers-v1');
const hero=require('../lib/ebay-verified-product-hero-v1-runtime');
const ebay=require('../lib/ebay-browse-api-v1');

const slugs=Object.keys(hero.PRODUCTS);
assert.strictEqual(hero.VERSION,'1.2');
assert.strictEqual(ebay.VERSION,'1.2');
assert.strictEqual(slugs.length,5,'pilot must remain exactly five products');
assert.strictEqual(Object.keys(registry.offers).length,5,'registry must remain exactly five products');
for(const slug of slugs){
  const row=registry.forSlug(slug);
  assert(row,`missing verified registry row for ${slug}`);
  assert.strictEqual(row.recommendationWeight,0,`${slug} retailer data must contribute zero recommendation points`);
  assert.strictEqual(row.marketplaceId,'EBAY_AU',`${slug} must be eBay Australia`);
  assert(/^https:\/\/i\.ebayimg\.com\//.test(row.image),`${slug} must use an eBay image host`);
  assert.strictEqual(hero.slugForPath(`/products/${slug}/`),slug,`${slug} exact route should activate`);
  assert.strictEqual(hero.slugForPath(`/products/${slug}`),null,`${slug} non-canonical route must not activate`);
  assert.strictEqual(hero.slugForPath(`/products/${slug}-wrong/`),null,`${slug} near route must not activate`);
}
assert.strictEqual(hero.slugForPath('/products/not-in-pilot/'),null,'non-pilot route must not activate');

function detailFor(slug,overrides={}){
  const row=registry.forSlug(slug);
  return {
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
    itemEndDate:'2099-01-01T00:00:00.000Z',
    ...overrides
  };
}

for(const slug of slugs){
  const row=registry.forSlug(slug);
  assert(hero.validateDetail(slug,row,detailFor(slug),{now:Date.parse('2026-08-31T00:00:00Z')}),`${slug} valid detail should pass`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{legacyItemId:'999999999999'})),null,`${slug} wrong item id must fail closed`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{title:'Unrelated accessory'})),null,`${slug} wrong model title must fail closed`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{price:{value:'1.00',currency:'USD'}})),null,`${slug} non-AUD detail must fail closed`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{image:{imageUrl:'https://example.com/not-ebay.jpg'}})),null,`${slug} non-eBay image must fail closed`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{itemWebUrl:'https://example.com/itm/123'})),null,`${slug} non-eBay item URL must fail closed`);
  assert.strictEqual(hero.validateDetail(slug,row,detailFor(slug,{itemEndDate:'2020-01-01T00:00:00.000Z'}),{now:Date.parse('2026-08-31T00:00:00Z')}),null,`${slug} ended listing must fail closed`);
}

const sampleSlug=slugs[0];
const sampleRow=registry.forSlug(sampleSlug);
const sampleDetail=hero.validateDetail(sampleSlug,sampleRow,detailFor(sampleSlug),{now:Date.parse('2026-08-31T00:00:00Z')});
const canonical='<link rel="canonical" href="https://australianproductguide.au/products/'+sampleSlug+'/">';
const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Test product"}</script>';
const sample=`<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section><section><article><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Alternative logo</span></div></article></section></main></body></html>`;
const transformed=hero.replaceHeroPlaceholder(sample,sampleSlug,sampleDetail);
assert(transformed,'top hero placeholder should be replaceable');
assert(transformed.includes('data-apg-ebay-product-hero="v1.2"'),'verified hero marker missing');
assert(transformed.includes(`src="${sampleRow.image}"`),'exact image missing');
assert(transformed.includes(`alt="${hero.PRODUCTS[sampleSlug].name}"`),'exact product alt missing');
assert(transformed.includes('fetchpriority="high"'),'hero image must be prioritised');
assert(transformed.includes('decoding="async"'),'hero image decoding hint missing');
assert(!/apg-ebay-verified-product-hero-v1__image[^>]*loading=/i.test(transformed),'above-fold hero must not lazy load');
assert.strictEqual((transformed.match(/data-apg-ebay-product-hero=/g)||[]).length,1,'only one hero image may be inserted');
assert.strictEqual((transformed.match(/apg-product-brand-placeholder/g)||[]).length,1,'lower product-card placeholder must remain untouched');
assert(transformed.includes(canonical),'canonical must remain unchanged');
assert(transformed.includes(jsonLd),'Product JSON-LD must remain unchanged');

const styled=hero.ensureStyle(transformed);
assert(styled.includes(hero.STYLE_HREF),'scoped hero stylesheet missing');
assert.strictEqual((hero.ensureStyle(styled).match(new RegExp(hero.STYLE_HREF.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,'stylesheet must be injected once');

const csp="default-src 'self'; img-src 'self' data: https://m.media-amazon.com; connect-src 'self';";
const cspPatched=hero.withEbayImageCsp(csp);
assert(cspPatched.includes('img-src \'self\' data: https://m.media-amazon.com https://i.ebayimg.com'),'eBay image host must be added only to img-src');
assert(cspPatched.includes("connect-src 'self'"),'other CSP directives must be preserved');
assert.strictEqual((hero.withEbayImageCsp(cspPatched).match(/https:\/\/i\.ebayimg\.com/g)||[]).length,1,'eBay CSP host must not duplicate');

// Rate-limit helpers remain covered even though product-page runtime no longer makes Browse calls.
const mockHeaders={get:key=>String(key).toLowerCase()==='retry-after'?'120':null};
assert.strictEqual(ebay.retryAfterDelay({headers:mockHeaders},0),120000,'Retry-After seconds must be honoured');
ebay.clearRateLimitBackoff();
const noted=ebay.noteRateLimit({headers:mockHeaders},1000);
assert.strictEqual(noted,121000,'rate-limit circuit should record retry time');
assert.strictEqual(ebay.activeRateLimitBackoff(2000),121000,'rate-limit circuit should remain active inside window');
ebay.clearRateLimitBackoff();
assert.strictEqual(ebay.activeRateLimitBackoff(2000),0,'rate-limit circuit should be clearable');

(async()=>{
  const observed=Date.parse(sampleRow.observedAt);
  const freshNow=observed+(60*60*1000);
  let networkCalls=0;
  hero.cache.clear();
  const result=await hero.inject(sample,`/products/${sampleSlug}/`,{
    now:()=>freshNow,
    getItem:async()=>{networkCalls+=1;throw new Error('public hero must never call eBay');}
  });
  assert.strictEqual(result.usedEbayImage,true,'fresh verified registry row should produce hero image');
  assert.strictEqual(networkCalls,0,'public pilot hero must perform zero eBay network calls');
  assert(result.html.includes(hero.STYLE_HREF),'valid registry injection should include stylesheet');
  assert(result.html.includes('verified within freshness window'),'public copy must not claim render-time verification');

  const fresh=await hero.currentDetail(sampleSlug,sampleRow,{now:()=>freshNow});
  assert.strictEqual(fresh.freshRegistryFallback,true,'pilot image must be explicitly registry-backed');
  assert.strictEqual(fresh.resolvedAt,observed,'freshness must be anchored to original eBay observation time');
  assert.strictEqual(hero.detailAge(fresh,freshNow),60*60*1000,'registry age should track original observation');

  hero.cache.clear();
  let expiredRejected=false;
  try{await hero.currentDetail(sampleSlug,sampleRow,{now:()=>observed+hero.REGISTRY_FALLBACK_MAX_AGE_MS+1});}catch(error){expiredRejected=error&&error.code==='EBAY_HERO_REGISTRY_STALE';}
  assert.strictEqual(expiredRejected,true,'pilot registry must fail closed after five hours');

  hero.cache.clear();
  const stale=await hero.inject(sample,`/products/${sampleSlug}/`,{now:()=>observed+hero.REGISTRY_FALLBACK_MAX_AGE_MS+1});
  assert.strictEqual(stale.usedEbayImage,false,'stale pilot must revert to APG placeholder');
  assert.strictEqual(stale.html,sample,'stale pilot must preserve original HTML');

  const nonPilot=await hero.inject(sample,'/products/not-in-pilot/',{getItem:async()=>{networkCalls+=1;throw new Error('should not fetch');}});
  assert.strictEqual(nonPilot.usedEbayImage,false,'non-pilot must remain inactive');
  assert.strictEqual(nonPilot.html,sample,'non-pilot HTML must be byte-identical');
  assert.strictEqual(networkCalls,0,'no public pilot path should consume Browse quota');
  console.log('PASS ebay verified product hero v1.2 QA static-registry network-calls=0 stale-max=5h recommendationWeight=0');
})().catch(error=>{console.error(error);process.exit(1);});

// The deploy gate also certifies catalogue-wide exact-match behaviour.
require('./ebay-product-hero-exact-guard-v2-qa');
require('./ebay-product-hero-catalogue-v2-qa');
