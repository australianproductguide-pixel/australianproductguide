'use strict';
const assert=require('node:assert/strict');
const {products}=require('../data');
const observability=require('../lib/intelligence-observability-v27');
const pass6=require('../data/catalogue-v27-retailers-pass6');

const EXPECTED={
  'steelcase-series-2':'Steelcase Australia',
  'ergotune-joobie':'ErgoTune Australia',
  'secretlab-magnus-pro':'Secretlab Australia',
  'r-de-nt-usb':'JB Hi-Fi',
  'asus-zenscreen-mb16acv':'Scorptec'
};

let checks=0;
function check(name,fn){try{fn();checks++;console.log('PASS',name);}catch(err){console.error('FAIL',name,'-',err.message);process.exitCode=1;}}

check('pass 6 defines five identity-controlled Australian destinations',()=>{
  assert.equal(Object.keys(pass6.OFFERS).length,5);
  assert.equal(pass6.VERIFIED,'2026-08-20');
  assert.equal(pass6.OFFER_REVIEW_DUE,'2026-08-27');
});

check('all five pass 6 products are maintained and receive one exact non-affiliate destination',()=>{
  for(const [slug,retailer] of Object.entries(EXPECTED)){
    const product=products.find(p=>p.slug===slug);
    assert.ok(product,`${slug} must be maintained`);
    const row=(product.offers||[]).find(x=>x.retailer===retailer&&x.checkedAt==='2026-08-20');
    assert.ok(row,`${slug} missing ${retailer} pass 6 destination`);
    assert.equal(row.exactModel,true);
    assert.equal(row.affiliate,false);
    assert.equal(row.price,null);
    assert.equal(row.availability,'listing-verified');
    assert.ok(['independent-retailer-au','manufacturer-direct-au'].includes(row.sourceType));
    assert.match(row.url,/^https:\/\//);
  }
});

check('new destinations open four previously uncovered maintained categories',()=>{
  const byCategory=new Map();
  for(const slug of Object.keys(EXPECTED)){
    const product=products.find(p=>p.slug===slug);
    byCategory.set(product.category,(byCategory.get(product.category)||0)+1);
  }
  assert.equal(byCategory.get('office-chairs'),2);
  assert.equal(byCategory.get('standing-desks'),1);
  assert.equal(byCategory.get('microphones'),1);
  assert.equal(byCategory.get('portable-monitors'),1);
});

check('catalogue retailer depth increases to the pass 6 production floor',()=>{
  const x=observability.retailerSnapshot();
  assert.ok(x.exactOfferCount>=57,`expected >=57 exact destinations, got ${x.exactOfferCount}`);
  assert.ok(x.productsWithExactOffers>=51,`expected >=51 products with exact destinations, got ${x.productsWithExactOffers}`);
  assert.ok(x.verifiedRetailers>=23,`expected >=23 verified retailer/manufacturer sources, got ${x.verifiedRetailers}`);
  assert.equal(x.byCategory['office-chairs'].productsWithExactOffers,2);
  assert.equal(x.byCategory['standing-desks'].productsWithExactOffers,1);
  assert.equal(x.byCategory.microphones.productsWithExactOffers,1);
  assert.equal(x.byCategory['portable-monitors'].productsWithExactOffers,1);
});

check('retailer expansion remains commercially neutral',()=>{
  const rows=products.flatMap(p=>(p.offers||[]).map(x=>({...x,slug:p.slug})));
  for(const slug of Object.keys(EXPECTED)){
    const rowsForProduct=rows.filter(x=>x.slug===slug&&x.checkedAt==='2026-08-20');
    assert.ok(rowsForProduct.length>=1);
    assert.ok(rowsForProduct.every(x=>x.affiliate===false));
  }
});

if(process.exitCode)process.exit(process.exitCode);
console.log(`RETAILER_DEPTH_PASS6_QA=${checks}_CHECKS_PASS`);
