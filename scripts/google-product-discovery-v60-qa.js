'use strict';

const assert=require('node:assert/strict');
const discovery=require('../lib/google-product-discovery-v60');
const {products,categories}=require('../data');

assert.equal(discovery.GOOGLE_PRODUCT_DISCOVERY_VERSION,'60.0');
assert.equal(products.length,482,'Google discovery must cover the complete maintained catalogue');
assert.equal(Object.keys(categories).length,90,'Google discovery must preserve all maintained categories');

const sample=products.find(p=>p.slug==='eufy-robot-vacuum-omni-e28');
assert(sample,'expected product fixture missing');
const graph=discovery.graphForProduct(sample);
const productNode=graph['@graph'].find(x=>x['@type']==='Product');
const breadcrumb=graph['@graph'].find(x=>x['@type']==='BreadcrumbList');
assert(productNode,'product schema missing');
assert(breadcrumb,'breadcrumb schema missing');
assert.equal(productNode.name,'eufy Robot Vacuum Omni E28');
assert.equal(productNode.url,'https://australianproductguide.au/products/eufy-robot-vacuum-omni-e28/');
assert.equal(productNode.brand.name,'Eufy');
assert.equal(productNode.review['@type'],'Review');
assert.equal(productNode.review.author.name,'Australian Product Guide');
assert(productNode.review.positiveNotes?.itemListElement?.length>0,'editorial pros must be structured when maintained');
assert(productNode.review.negativeNotes?.itemListElement?.length>0,'editorial trade-off must be structured when maintained');
assert.equal(breadcrumb.itemListElement.length,3);
assert.equal(breadcrumb.itemListElement[1].item,'https://australianproductguide.au/categories/robot-vacuums/');

const prohibited=/"(?:offers|aggregateRating|reviewRating|price|priceCurrency|availability)"\s*:/i;
for(const product of products){
  const productGraph=discovery.graphForProduct(product);
  const encoded=JSON.stringify(productGraph);
  assert(!prohibited.test(encoded),`${product.slug}: merchant/unsupported commerce structured data leaked into editorial markup`);
  const node=productGraph['@graph'].find(x=>x['@type']==='Product');
  assert(node,`${product.slug}: Product node missing`);
  assert.equal(node.url,`https://australianproductguide.au/products/${product.slug}/`);
  assert.equal(node.review?.author?.name,'Australian Product Guide',`${product.slug}: editorial review author missing`);
  assert(node.description,`${product.slug}: product description missing`);
  assert(node.brand?.name,`${product.slug}: brand missing`);
  if(node.image){
    const verified=discovery.productImage(product);
    assert(verified,`${product.slug}: schema image emitted without verified exact-product image`);
    assert.deepEqual(node.image,[verified],`${product.slug}: schema image must equal verified product image`);
  }
}

const shell='<!doctype html><html><head><title>APG</title></head><body><main>Product content</main></body></html>';
const injected=discovery.inject(shell,'/products/eufy-robot-vacuum-omni-e28/');
assert(injected.includes('data-apg-google-product-discovery="v60.0"'),'product page must receive v60 JSON-LD');
assert(injected.includes('"@type":"Product"'),'product page must expose Product entity');
assert(injected.includes('"@type":"Review"'),'product page must expose editorial Review entity');
assert(injected.includes('"positiveNotes"'),'product page must expose Google-supported editorial pros');
assert(injected.includes('"negativeNotes"'),'product page must expose Google-supported editorial cons/trade-offs');
assert(injected.includes('"@type":"BreadcrumbList"'),'product page must expose breadcrumb entity');
assert(!prohibited.test(injected),'injected schema must not pretend APG is the merchant or invent commerce/rating data');
assert.equal(discovery.inject(injected,'/products/eufy-robot-vacuum-omni-e28/'),injected,'injection must be idempotent');
assert(!discovery.inject(shell,'/categories/robot-vacuums/').includes('data-apg-google-product-discovery='),'category pages must retain their established CollectionPage schema rather than product markup');

console.log('APG GOOGLE PRODUCT DISCOVERY v60 QA PASSED: 482 editorial Product/Review graphs, breadcrumb coverage, rights-gated imagery and zero merchant/price/rating fabrication.');
