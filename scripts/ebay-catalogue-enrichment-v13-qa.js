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
function acceptedRow(itemId,title,modelEvidence=[]){
  return {
    status:'accept',
    accepted:{itemId,title,status:'accept',detailVerified:true,flags:[],verificationEvidence:{model:modelEvidence}},
    review:null,
    candidates:[]
  };
}

const s70d={brand:'Samsung',name:'Samsung ViewFinity S70D 27-inch',slug:'samsung-viewfinity-s70d-27-inch',category:'monitors',price:399};
const x50={brand:'TP-Link',name:'TP-Link Deco X50',slug:'tp-link-deco-x50',category:'mesh-wifi-systems',price:349};
const bes876={brand:'Breville',name:'Breville Barista Express Impress BES876',slug:'breville-barista-express-impress-bes876',category:'coffee-machines',price:999};
const wf1000xm6={brand:'Sony',name:'Sony WF-1000XM6',slug:'sony-wf-1000xm6',category:'wireless-earbuds',price:449};
const sihooC300ProV2={brand:'SIHOO',name:'Doro C300 Pro V2',slug:'sihoo-doro-c300-pro-v2',category:'office-chairs',price:699};
const winix360={brand:'Winix',name:'ZERO+ 360 5-Stage Air Purifier',slug:'winix-zero-360-5-stage-air-purifier',category:'air-purifiers',price:599};
const winixPro={brand:'Winix',name:'ZERO+ PRO 5-Stage Air Purifier',slug:'winix-zero-pro-5-stage-air-purifier',category:'air-purifiers',price:599};
const keychronK2Pro={brand:'Keychron',name:'K2 Pro',model:'K2 Pro',slug:'keychron-k2-pro',category:'mechanical-keyboards',price:189};
const zojirushi={brand:'Zojirushi',name:'NS-ZCC10 Rice Cooker',model:'NS-ZCC10',slug:'zojirushi-ns-zcc10-rice-cooker',category:'rice-cookers',price:399};

assert.strictEqual(matcher.VERSION,'1.6');
assert.strictEqual(familyGuard.VERSION,'1.3.2');
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
  const guarded=familyGuard.applyToEnrichment(x50,acceptedRow(`item-${suffix}`,title));
  assert.notStrictEqual(guarded.status,'accept');
  assert.strictEqual(guarded.accepted,null);
  assert.strictEqual(guarded.familyGuard.reason,`family-model-variant-mismatch:${suffix}`);
}

// Live 3 Sep 2026 regression: the maintained Keychron keyboard must never accept a palm/wrist-rest accessory,
// even when the accessory title and structured item specifics contain the exact K2 Pro family token.
const keychronPalmRest='Keychron Silicone Palm Rest for K2 / K2 Pro/ K2 Max / K2 HE / K6 / K6 Pro Black';
assert.strictEqual(matcher.listingLooksAccessory(keychronPalmRest,keychronK2Pro),true);
assert.strictEqual(matcher.scoreCandidate(keychronK2Pro,listing(keychronPalmRest,'39')).status,'reject');

// Live 3 Sep 2026 regression: an exact NS-ZCC10 identity is still unsafe for Australian shoppers when
// the listing explicitly advertises a low-voltage import. Universal 100-240V input must remain eligible.
const lowVoltage='Zojirushi NS-ZCC10-WZ New Neuro Fuzzy Rice Cooker Warmer 5.5-Cup 120V White';
const lowVoltageConflict=matcher.materialIdentityConflict(zojirushi,lowVoltage);
assert.strictEqual(lowVoltageConflict.conflict,true);
assert.strictEqual(lowVoltageConflict.reason,'regional-voltage-mismatch');
assert.strictEqual(matcher.scoreCandidate(zojirushi,listing(lowVoltage,'429')).status,'reject');
assert.strictEqual(matcher.regionalVoltageConflict('Zojirushi NS-ZCC10 Rice Cooker 100-240V universal input').conflict,false,'universal 100-240V must not be treated as a low-voltage-only import');
assert.strictEqual(matcher.regionalVoltageConflict('Zojirushi NS-ZCC10 Rice Cooker 230V Australian model').conflict,false,'230V Australian listing must remain eligible on voltage grounds');

// Live sweep regression: C300 Pro V2 must not collapse to the older/base C300.
const wrongSihoo=familyGuard.applyToEnrichment(sihooC300ProV2,acceptedRow(
  'sihoo-c300-base',
  'SIHOO A3 Doro C300 Ergonomic Gaming Office Chair 6D Arm Dynamic Lumbar & Swivel',
  ['C300-B101-JT','SIHOO Doro C300']
));
assert.notStrictEqual(wrongSihoo.status,'accept');
assert.strictEqual(wrongSihoo.familyGuard.reason,'required-family-marker-missing:c300-pro');
const exactSihooEvidence='SIHOO Doro C300 Pro V2 Ergonomic Office Chair C300 Pro V2';
assert.strictEqual(familyGuard.requiredFamilyMarkerConflict(sihooC300ProV2,exactSihooEvidence).conflict,false);

// Live sweep regression: ZERO+ 360 and ZERO+ PRO are separate maintained products.
const wrongWinix360=familyGuard.applyToEnrichment(winix360,acceptedRow(
  'winix-pro',
  'Winix Zero+ PRO 5-Stage Hospital Grade True HEPA Air Purifier AUS-1250AZPU'
));
assert.notStrictEqual(wrongWinix360.status,'accept');
assert.strictEqual(wrongWinix360.familyGuard.reason,'required-family-marker-missing:zero-360');
const wrongWinixPro=familyGuard.applyToEnrichment(winixPro,acceptedRow(
  'winix-360',
  'Winix ZERO+ 360 5-Stage Air Purifier'
));
assert.notStrictEqual(wrongWinixPro.status,'accept');
assert.strictEqual(wrongWinixPro.familyGuard.reason,'required-family-marker-missing:zero-pro');
assert.strictEqual(familyGuard.requiredFamilyMarkerConflict(winix360,'Winix ZERO+ 360 5-Stage Air Purifier').conflict,false);
assert.strictEqual(familyGuard.requiredFamilyMarkerConflict(winixPro,'Winix ZERO+ PRO 5-Stage Air Purifier').conflict,false);

const colourSuffix=matcher.materialIdentityConflict(bes876,'Breville Barista Express Impress BES876BTR Black Truffle');
assert.strictEqual(colourSuffix.conflict,false);
assert.strictEqual(familyGuard.familyVariantConflict(bes876,'Breville Barista Express Impress BES876BTR Black Truffle').conflict,false);
assert.strictEqual(familyGuard.requiredFamilyMarkerConflict(bes876,'Breville Barista Express Impress BES876BTR Black Truffle').conflict,false);

const wrongSony=matcher.scoreCandidate(wf1000xm6,listing('Sony WH-1000XM6 Wireless Noise Cancelling Headphones'));
assert.notStrictEqual(wrongSony.status,'accept');
assert.strictEqual(wrongSony.exactModel,false);

const exactSony=matcher.scoreCandidate(wf1000xm6,listing('Sony WF-1000XM6 Truly Wireless Noise Cancelling Earbuds'));
assert.strictEqual(exactSony.exactModel,true);
assert.notStrictEqual(exactSony.status,'reject');
assert.strictEqual(exactSony.status,'review');

console.log('EBAY_CATALOGUE_ENRICHMENT_V16=PASS material-variants=screen-size|model-suffix|regional-voltage accessory-regressions=palm-rest|wrist-rest family-variants=X50-DSL|X50-Outdoor|X50-PoE|X50-5G required-family=SIHOO-C300-Pro-V2|Winix-ZERO360|Winix-ZERO-PRO compound-models=WF-1000XM6|S70D|X50 recommendationWeight=0');
