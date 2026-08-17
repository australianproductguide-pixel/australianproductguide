const assert=require('node:assert/strict');
const {applyAssociatesStandard,REQUIRED_STATEMENT}=require('../lib/amazon-associates');
const {catalogueJson,catalogueCsv}=require('../lib/catalogue-export');
const {products}=require('../data');
const {images}=require('../data/product-images');

const sample='<section class="retailer-panel"><div class="section-head compact-head"><span class="independence-badge">Retailer status does not affect ranking</span></div><a href="https://www.amazon.com.au/example/dp/B000000000?tag=auproductguid-22" rel="sponsored nofollow noopener">Affiliate paid link · Exact individual product page verified</a><p class="fine-inline">Paid retailer links are labelled. Prices, sellers, variants and availability can change after you leave Australian Product Guide.</p></section>';
const transformed=applyAssociatesStandard(sample);
assert.ok(transformed.includes(REQUIRED_STATEMENT),'required Amazon Associate statement missing');
assert.ok(transformed.includes('data-affiliate-link'),'Amazon paid link missing analytics marker');
assert.ok(transformed.includes('Paid link · Amazon Associate ·'),'point-of-action paid-link label missing');
assert.ok(transformed.includes('APG-maintained price context is not a live Amazon price'),'Amazon live-price clarification missing');

const imageProduct=products.find(p=>p.slug==='bose-quietcomfort-ultra-headphones');
assert.ok(imageProduct,'Amazon image-link QA fixture product missing');
const amazonRetailer=(imageProduct.retailers||[]).find(r=>r.retailer==='Amazon Australia'&&r.asin);
assert.ok(amazonRetailer,'Amazon image-link QA fixture retailer missing');
images[imageProduct.slug]={
  asin:amazonRetailer.asin,
  amazon_affiliate_url:amazonRetailer.affiliateUrl,
  image_url:'https://images.example.test/amazon-associates-approved-fixture.jpg',
  image_source:'Synthetic QA fixture — represents approved Amazon Associates Program Content',
  image_source_type:'amazon_associates_approved',
  image_rights_basis:'Synthetic QA fixture only; production records require documented Amazon Associates-approved acquisition.',
  image_verified:true,
  image_verified_at:'2026-08-17',
  image_product_match:'exact',
  image_alt:`${imageProduct.brand} ${imageProduct.name}`,
  image_status:'verified',
  image_link_url:amazonRetailer.affiliateUrl
};
const imageHtml=`<figure class="product-photo"><img src="https://images.example.test/amazon-associates-approved-fixture.jpg" alt="${imageProduct.brand} ${imageProduct.name}"><figcaption class="image-provenance">Approved fixture</figcaption></figure>`;
const linkedImage=applyAssociatesStandard(imageHtml);
assert.ok(linkedImage.includes(`href="${amazonRetailer.affiliateUrl}"`),'Amazon Program Content image does not link to matching affiliate destination');
assert.ok(linkedImage.includes('data-affiliate-link'),'Amazon Program Content image is not marked as an affiliate link');
assert.ok(linkedImage.includes('data-affiliate-placement="product_image"'),'Amazon Program Content image placement is not identified');
delete images[imageProduct.slug];

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

console.log(`Amazon Associates QA passed for ${products.length} products, including Amazon Program Content image-link behaviour.`);
