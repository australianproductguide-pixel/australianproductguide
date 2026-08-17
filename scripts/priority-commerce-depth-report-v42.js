#!/usr/bin/env node
const assert=require('node:assert/strict');
const {categories,products}=require('../data');
const {imageStatus}=require('../data/image-provenance');
const {images,validationErrors}=require('../data/product-images');
const commerce=require('../lib/priority-commerce-depth-v42');

const PRIORITY=['televisions','laptops','robot-vacuums','washing-machines','coffee-machines','wireless-headphones','smartphones','earbuds'];
const MINIMUMS={televisions:10,laptops:7,'robot-vacuums':9,'washing-machines':8,'coffee-machines':10,'wireless-headphones':10,smartphones:9,earbuds:5};
const rows=[];
let invalidImages=0;
let invalidOffers=0;

assert.ok(products.length>=482,`catalogue unexpectedly below v42 floor: ${products.length}`);

for(const slug of PRIORITY){
  const c=categories[slug];
  assert.ok(c,`missing priority category ${slug}`);
  assert.ok(c.products.length>=MINIMUMS[slug],`${slug} depth ${c.products.length} below floor ${MINIMUMS[slug]}`);
  let verifiedPhotos=0,exactAmazon=0,exactOther=0,withExactRetailer=0;
  for(const p of c.products){
    const im=imageStatus(p);
    if(im.productPhotography)verifiedPhotos++;
    const registry=images[p.slug];
    if(registry){
      const errs=validationErrors(p,registry);
      invalidImages+=errs.length;
      assert.equal(errs.length,0,`${p.slug} invalid image record: ${errs.join(', ')}`);
    }
    const amazon=(p.retailers||[]).some(r=>r.kind==='affiliate-direct'&&r.asin&&r.url);
    const other=(p.offers||[]).filter(o=>o&&o.exactModel===true&&o.url);
    if(amazon)exactAmazon++;
    if(other.length)exactOther++;
    if(amazon||other.length)withExactRetailer++;
    for(const o of other){
      const errs=[];
      if(!o.retailer)errs.push('retailer');
      if(!o.checkedAt)errs.push('checkedAt');
      if(!/^https:\/\//.test(o.url))errs.push('https url');
      if(commerce.hasPrice(o.price)&&o.currency!=='AUD')errs.push('AUD currency');
      invalidOffers+=errs.length;
      assert.equal(errs.length,0,`${p.slug} invalid exact offer: ${errs.join(', ')}`);
    }
  }
  rows.push({category:slug,maintained:c.products.length,verifiedPhotos,exactAmazon,exactOther,withExactRetailer,imageGap:c.products.length-verifiedPhotos,retailerGap:c.products.length-withExactRetailer});
}

const marker='<span class="independence-badge">Retailer status does not affect ranking</span></div>';
const sample=products.find(p=>p.slug==='apple-iphone-17-pro');
assert.ok(sample,'v42 iPhone 17 Pro record missing');
const transformed=commerce.transform(`<section class="retailer-panel">${marker}</section>`,'/products/apple-iphone-17-pro/');
assert.ok(transformed.includes('Verified exact-model retailer destination'), 'v42 exact retailer row failed to render');
assert.ok(transformed.includes('A$1,999'), 'v42 observed price failed to render');

const noPrice=products.find(p=>p.slug==='samsung-galaxy-z-flip7');
assert.ok(noPrice,'v42 Galaxy Z Flip7 record missing');
const noPriceHtml=commerce.transform(`<section class="retailer-panel">${marker}</section>`,'/products/samsung-galaxy-z-flip7/');
assert.ok(noPriceHtml.includes('Samsung Australia'),'v42 exact no-price retailer destination failed to render');
assert.ok(!noPriceHtml.includes('A$0'),'blank retailer price incorrectly rendered as A$0');

console.log(JSON.stringify({
  version:'v42',
  checkedAt:new Date().toISOString(),
  catalogueProducts:products.length,
  priorityCategories:rows,
  invalidImages,
  invalidOffers,
  imageryPolicy:'Only validated exact/same-model licensed product photography may render. Unverified products keep APG-owned visuals.',
  retailerPolicy:'Exact-model retailer destinations are date-stamped. Observed prices are not whole-of-market lowest-price claims.'
},null,2));
