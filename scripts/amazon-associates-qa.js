const assert=require('node:assert/strict');
const {applyAssociatesStandard,REQUIRED_STATEMENT}=require('../lib/amazon-associates');
const {catalogueJson,catalogueCsv}=require('../lib/catalogue-export');
const {products}=require('../data');

const sample='<section class="retailer-panel"><div class="section-head compact-head"><span class="independence-badge">Retailer status does not affect ranking</span></div><a href="https://www.amazon.com.au/example/dp/B000000000?tag=auproductguid-22" rel="sponsored nofollow noopener">Affiliate paid link · Exact individual product page verified</a><p class="fine-inline">Paid retailer links are labelled. Prices, sellers, variants and availability can change after you leave APG.</p></section>';
const transformed=applyAssociatesStandard(sample);
assert.ok(transformed.includes(REQUIRED_STATEMENT),'required Amazon Associate statement missing');
assert.ok(transformed.includes('data-affiliate-link'),'Amazon paid link missing analytics marker');
assert.ok(transformed.includes('Paid link · Amazon Associate ·'),'point-of-action paid-link label missing');

const json=catalogueJson();
assert.equal(json.affiliateUrlsExported,false,'catalogue must explicitly report affiliate URLs are excluded');
const csv=catalogueCsv();
assert.ok(!csv.includes('Affiliate URL'),'public CSV must not contain Affiliate URL column');
assert.ok(!csv.includes('Exact Amazon URL'),'public CSV must not contain Exact Amazon URL column');

for(const product of products){
  for(const retailer of product.retailers||[]){
    if(retailer.retailer!=='Amazon Australia')continue;
    const url=retailer.affiliateUrl||retailer.url||'';
    assert.ok(url.includes('tag=auproductguid-22'),`${product.slug}: Amazon link missing Associates tag`);
    if(retailer.kind==='affiliate-direct'){
      assert.ok(retailer.asin,`${product.slug}: direct Amazon link missing ASIN`);
      assert.ok(url.includes('/dp/'),`${product.slug}: direct Amazon link is not a product detail URL`);
    }
    if(retailer.kind==='affiliate-search')assert.ok(url.includes('/s?'),`${product.slug}: search fallback is not an Amazon search URL`);
  }
}

console.log(`Amazon Associates QA passed for ${products.length} products.`);
