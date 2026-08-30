'use strict';

const assert=require('assert');
const matcher=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');

function listing(title,price='499'){
  return {
    title,
    condition:'New',
    price:{value:String(price),currency:'AUD'},
    image:{imageUrl:'https://i.ebayimg.com/images/g/example/s-l1600.jpg'},
    itemAffiliateWebUrl:'https://www.ebay.com.au/itm/example'
  };
}

const s70d={
  brand:'Samsung',
  name:'Samsung ViewFinity S70D 27-inch',
  slug:'samsung-viewfinity-s70d-27-inch',
  category:'monitors',
  price:399
};
const x50={
  brand:'TP-Link',
  name:'TP-Link Deco X50',
  slug:'tp-link-deco-x50',
  category:'mesh-wifi-systems',
  price:349
};
const bes876={
  brand:'Breville',
  name:'Breville Barista Express Impress BES876',
  slug:'breville-barista-express-impress-bes876',
  category:'coffee-machines',
  price:999
};
const wf1000xm6={
  brand:'Sony',
  name:'Sony WF-1000XM6',
  slug:'sony-wf-1000xm6',
  category:'wireless-earbuds',
  price:449
};

assert.strictEqual(matcher.VERSION,'1.3');
assert.strictEqual(familyGuard.VERSION,'1.3.1');
assert.deepStrictEqual(matcher.modelTokens(s70d),['S70D']);
assert.deepStrictEqual(matcher.modelTokens(x50),['X50']);
assert.deepStrictEqual(matcher.modelTokens(wf1000xm6),['WF-1000XM6']);

const wrongSize=matcher.materialIdentityConflict(s70d,'Samsung 32" S7 (S70D) 4K UHD High Resolution Monitor');
assert.strictEqual(wrongSize.conflict,true);
assert.strictEqual(wrongSize.reason,'material-variant-mismatch:screenInches');
assert.strictEqual(matcher.scoreCandidate(s70d,listing('Samsung 32" S7 (S70D) 4K UHD High Resolution Monitor')).status,'reject');

const correctSize=matcher.materialIdentityConflict(s70d,'Samsung ViewFinity S70D 27" 4K UHD Monitor');
assert.strictEqual(correctSize.conflict,false);
assert.strictEqual(matcher.scoreCandidate(s70d,listing('Samsung ViewFinity S70D 27" 4K UHD Monitor')).status,'accept');

const dsl=matcher.materialIdentityConflict(x50,'TP-Link Deco X50-DSL AX3000 Whole Home Mesh Wi-Fi 6 Modem Router');
assert.strictEqual(dsl.conflict,true);
assert.strictEqual(dsl.reason,'material-model-suffix-mismatch:dsl');
assert.strictEqual(matcher.scoreCandidate(x50,listing('TP-Link Deco X50-DSL AX3000 Whole Home Mesh Wi-Fi 6 Modem Router')).status,'reject');

const exactX50='TP-Link Deco X50 AX3000 Whole Home Mesh Wi-Fi 6 System';
assert.strictEqual(matcher.scoreCandidate(x50,listing(exactX50,'349')).status,'accept');
assert.strictEqual(familyGuard.familyVariantConflict(x50,exactX50).conflict,false);

for(const [suffix,title] of [
  ['outdoor','NEW TP-Link Deco X50-Outdoor AX3000 Outdoor Indoor Whole Home Mesh WiFi 6 POE/AC'],
  ['poe','TP-Link Deco X50-PoE AX3000 Whole Home Mesh WiFi 6 Access Point'],
  ['5g','TP-Link Deco X50-5G AX3000 Whole Home Mesh WiFi 6 Gateway']
]){
  const conflict=familyGuard.familyVariantConflict(x50,title);
  assert.strictEqual(conflict.conflict,true,`${suffix} must be a material family variant`);
  assert.strictEqual(conflict.reason,`family-model-variant-mismatch:${suffix}`);
  const guarded=familyGuard.applyToEnrichment(x50,{
    slug:x50.slug,
    status:'accept',
    accepted:{itemId:`item-${suffix}`,title,status:'accept',detailVerified:true,flags:[]},
    review:null,
    candidates:[]
  });
  assert.notStrictEqual(guarded.status,'accept');
  assert.strictEqual(guarded.accepted,null);
  assert.strictEqual(guarded.familyGuard.reason,`family-model-variant-mismatch:${suffix}`);
}

const colourSuffix=matcher.materialIdentityConflict(bes876,'Breville Barista Express Impress BES876BTR Black Truffle');
assert.strictEqual(colourSuffix.conflict,false);
assert.strictEqual(familyGuard.familyVariantConflict(bes876,'Breville Barista Express Impress BES876BTR Black Truffle').conflict,false);

const wrongSony=matcher.scoreCandidate(wf1000xm6,listing('Sony WH-1000XM6 Wireless Noise Cancelling Headphones'));
assert.notStrictEqual(wrongSony.status,'accept');
assert.strictEqual(wrongSony.exactModel,false);

const exactSony=matcher.scoreCandidate(wf1000xm6,listing('Sony WF-1000XM6 Truly Wireless Noise Cancelling Earbuds'));
assert.strictEqual(exactSony.exactModel,true);
assert.notStrictEqual(exactSony.status,'reject');
assert.strictEqual(exactSony.status,'review');

console.log('EBAY_CATALOGUE_ENRICHMENT_V131=PASS material-variants=screen-size|model-suffix family-variants=X50-DSL|X50-Outdoor|X50-PoE|X50-5G compound-models=WF-1000XM6|S70D|X50 sparse-exact-model=review recommendationWeight=0');
