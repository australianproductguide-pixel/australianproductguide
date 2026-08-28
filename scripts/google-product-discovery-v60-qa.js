'use strict';

const assert=require('node:assert/strict');
const discovery=require('../lib/google-product-discovery-v60');
const {products,categories}=require('../data');

assert.equal(discovery.GOOGLE_PRODUCT_DISCOVERY_VERSION,'60.1');
assert.equal(products.length,482,'Google discovery must cover the complete maintained catalogue');
assert.equal(Object.keys(categories).length,90,'Google discovery must preserve all maintained categories');

const sample=products.find(p=>p.slug==='eufy-robot-vacuum-omni-e28');
assert(sample,'expected product fixture missing');
const sampleReview=discovery.reviewSchema(sample);
assert.equal(sampleReview['@type'],'Review');
assert.equal(sampleReview.author['@type'],'Organization','Review author must use a Schema.org type accepted by Google Review structured data');
assert.equal(sampleReview.author['@id'],'https://australianproductguide.au/#organization');
assert.equal(sampleReview.author.name,'Australian Product Guide');
assert(sampleReview.positiveNotes?.itemListElement?.length>0,'editorial pros must be structured when maintained');
assert(sampleReview.negativeNotes?.itemListElement?.length>0,'editorial trade-off must be structured when maintained');

const prohibited=/"(?:offers|aggregateRating|reviewRating|price|priceCurrency|availability)"\s*:/i;
for(const product of products){
  const canonical=`https://australianproductguide.au/products/${product.slug}/`;
  const base={
    '@context':'https://schema.org','@type':'Product','@id':canonical+'#product',
    name:product.name,brand:{'@type':'Brand',name:product.brand},description:product.summary,url:canonical,
    mainEntityOfPage:canonical,sku:product.id,category:product.categoryLabel,sameAs:product.source
  };
  const node=discovery.enrichProductSchema(base,product);
  const encoded=JSON.stringify(node);
  assert(!prohibited.test(encoded),`${product.slug}: merchant/unsupported commerce structured data leaked into editorial markup`);
  assert.equal(node['@id'],base['@id'],`${product.slug}: canonical Product entity id changed`);
  assert.equal(node.sku,base.sku,`${product.slug}: existing maintained identity field lost`);
  assert.equal(node.category,base.category,`${product.slug}: existing category field lost`);
  assert.equal(node.sameAs,base.sameAs,`${product.slug}: existing primary-source identity field lost`);
  assert.equal(node.review?.author?.['@type'],'Organization',`${product.slug}: Google-compatible editorial reviewer type missing`);
  assert.equal(node.review?.author?.['@id'],'https://australianproductguide.au/#organization',`${product.slug}: canonical APG Organization id missing`);
  assert.equal(node.review?.author?.name,'Australian Product Guide',`${product.slug}: editorial review author missing`);
  const statementCount=(node.review?.positiveNotes?.itemListElement?.length||0)+(node.review?.negativeNotes?.itemListElement?.length||0);
  assert(statementCount>=2,`${product.slug}: Google pros/cons treatment requires at least two maintained statements`);
  assert(node.description,`${product.slug}: product description missing`);
  assert(node.brand?.name,`${product.slug}: brand missing`);
  if(node.image){
    const verified=discovery.productImage(product);
    assert(verified,`${product.slug}: schema image emitted without verified exact-product image`);
    assert.deepEqual(node.image,[verified],`${product.slug}: schema image must equal verified product image`);
  }
}

function schemasFrom(html){
  return [...String(html).matchAll(/<script type="application\/ld\+json"(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
}
const canonical='https://australianproductguide.au/products/eufy-robot-vacuum-omni-e28/';
const existingProduct={'@context':'https://schema.org','@type':'Product','@id':canonical+'#product',name:sample.name,brand:{'@type':'Brand',name:sample.brand},description:sample.summary,url:canonical,mainEntityOfPage:canonical,sku:sample.id,category:sample.categoryLabel,sameAs:sample.source};
const existingBreadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://australianproductguide.au/'},{'@type':'ListItem',position:2,name:'Robot vacuums',item:'https://australianproductguide.au/categories/robot-vacuums/'},{'@type':'ListItem',position:3,name:sample.name,item:canonical}]};
const shell=`<!doctype html><html><head><title>APG</title><script type="application/ld+json">${JSON.stringify(existingBreadcrumb)}</script><script type="application/ld+json">${JSON.stringify(existingProduct)}</script></head><body><main>Product content</main></body></html>`;
const injected=discovery.inject(shell,'/products/eufy-robot-vacuum-omni-e28/');
const schemas=schemasFrom(injected);
const productSchemas=schemas.filter(x=>x['@type']==='Product');
const breadcrumbs=schemas.filter(x=>x['@type']==='BreadcrumbList');
assert.equal(productSchemas.length,1,'v60 must enrich the existing canonical Product entity, not create a duplicate');
assert.equal(breadcrumbs.length,1,'v60 must preserve the established BreadcrumbList without duplication');
assert(injected.includes('data-apg-google-product-discovery="v60.1"'),'existing Product schema must be marked as v60.1-enriched');
assert(injected.includes('name="apg-google-product-discovery" content="v60.1"'),'product page must expose v60.1 discovery marker');
assert.equal(productSchemas[0].sku,sample.id,'v60 must preserve entity-discovery identity enrichment');
assert.equal(productSchemas[0].sameAs,sample.source,'v60 must preserve primary-source identity enrichment');
assert.equal(productSchemas[0].review.author['@type'],'Organization');
assert.equal(productSchemas[0].review.author['@id'],'https://australianproductguide.au/#organization');
assert(productSchemas[0].review.positiveNotes,'product page must expose Google-supported editorial pros');
assert(productSchemas[0].review.negativeNotes,'product page must expose Google-supported editorial cons/trade-offs');
assert(!prohibited.test(JSON.stringify(productSchemas[0])),'enriched Product schema must not pretend APG is the merchant or invent commerce/rating data');
assert.equal(discovery.inject(injected,'/products/eufy-robot-vacuum-omni-e28/'),injected,'injection must be idempotent');

const categorySchema={'@context':'https://schema.org','@type':'CollectionPage',name:'Robot Vacuums Australia'};
const categoryShell=`<!doctype html><html><head><script type="application/ld+json">${JSON.stringify(categorySchema)}</script></head><body></body></html>`;
const untouchedCategory=discovery.inject(categoryShell,'/categories/robot-vacuums/');
assert.equal(untouchedCategory,categoryShell,'category pages must retain their established CollectionPage architecture');
assert(!untouchedCategory.includes('data-apg-google-product-discovery='),'v60 must not fabricate Product markup where no canonical Product entity exists');

const graphResult=discovery.enrichSchemaValue({'@context':'https://schema.org','@graph':[existingBreadcrumb,existingProduct]},sample);
assert.equal(graphResult.changed,true,'graph-contained Product entities must remain enrichable');
assert.equal(graphResult.value['@graph'].filter(x=>x['@type']==='Product').length,1);
assert(graphResult.value['@graph'].find(x=>x['@type']==='Product').review,'graph Product enrichment missing');

console.log('APG GOOGLE PRODUCT DISCOVERY v60.1 QA PASSED: 482 canonical Product entities enriched with editorial Review/pros-cons using the canonical APG Organization author, existing breadcrumbs and provenance preserved, rights-gated imagery only, zero duplicate Product entities and zero merchant/price/rating fabrication.');
