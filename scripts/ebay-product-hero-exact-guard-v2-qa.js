'use strict';

const assert=require('assert');
const guard=require('../lib/ebay-product-hero-exact-guard-v2');

const FUTURE='2099-01-01T00:00:00.000Z';
function row(title,{model=[],categoryPath='Home Appliances',verificationLevel=model.length?'detail-model-evidence':'detail-title-model',legacyItemId='123456789012',condition='Brand New',itemEndDate=FUTURE}={}){
  return {
    status:'accept',
    accepted:{
      itemId:`v1|${legacyItemId}|0`,legacyItemId,title,condition,
      price:{value:'499.00',currency:'AUD'},
      imageUrl:'https://i.ebayimg.com/images/g/example/s-l1600.jpg',
      itemWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}`,
      itemAffiliateWebUrl:`https://www.ebay.com.au/itm/${legacyItemId}?campid=5339198634`,
      detailVerified:true,exactModel:true,verificationLevel,
      verificationEvidence:{brands:[],model,categoryPath},
      itemEndDate,recommendationWeight:0
    }
  };
}
function eligible(product,accepted,allProducts=[product]){return guard.evaluate(product,accepted,allProducts,{now:Date.parse('2026-08-31T00:00:00Z')});}

assert.strictEqual(guard.VERSION,'2.2');

// Known false accepts from the live 482-product enrichment sweep must remain logo placeholders.
const ryobi={slug:'ryobi-one-hp-18v-drill-driver',brand:'Ryobi',name:'ONE+ HP 18V Drill Driver'};
assert.strictEqual(eligible(ryobi,row('Ryobi 18V ONE+ Hammer Drill R18PD3 (Latest Australian Stock)')).eligible,false,'generic 18V token must not prove a different Ryobi drill');

const kenwood={slug:'kenwood-titanium-chef-baker-xl-kvl85',brand:'Kenwood',name:'Titanium Chef Baker XL KVL85'};
assert.strictEqual(eligible(kenwood,row('Kenwood Slow Speed Outlet Cover [AS00002287] for Titanium Chef Baker KVL65 KVL85',{model:['AS00002287','KVL85, KVL65'],categoryPath:'Home Appliances|Small Kitchen Appliances|Small Kitchen Appliance Accessories'})).reason,'accessory-title');

const ninja={slug:'ninja-foodi-max-15-in-1-smartlid',brand:'Ninja',name:'Foodi MAX 15-in-1 SmartLid'};
assert.strictEqual(eligible(ninja,row('BYKITCHEN Air Fryer Silicone Liner for Ninja Foodi MAX 15 in 1 Multi-Cooker')).reason,'accessory-title');

const dyson={slug:'dyson-corrale-hs07',brand:'Dyson',name:'Corrale HS07'};
assert.strictEqual(eligible(dyson,row('OEM Genuine Dyson Corrale Straightener HS07 Magnetic Power Port / Charging Port')).reason,'accessory-title');

const sunbeam={slug:'sunbeam-secretchef-electronic-sear-and-slow-cooker-hp8555',brand:'Sunbeam',name:'SecretChef Electronic Sear and Slow Cooker HP8555'};
assert.strictEqual(eligible(sunbeam,row('Sunbeam SecretChef Electronic Sear & Slow Cooker HP8555 Cooker Rubber 2x Handles',{model:['HP855502','Sunbeam SecretChef Electronic Sear and Slow Cooker'],categoryPath:'Home Appliances|Small Kitchen Appliances|Small Kitchen Appliance Accessories'})).reason,'accessory-title');

const shark={slug:'shark-speedstyle-5-in-1-hair-dryer',brand:'Shark',name:'SpeedStyle 5-in-1 Hair Dryer'};
assert.strictEqual(eligible(shark,row('Shark FlexStyle HD430 5 in 1 Hair Dryer Curler Styler Negative Ion Air Styler')).eligible,false,'generic 5-in-1 wording must not prove SpeedStyle');

const p110={slug:'tp-link-tapo-p110',brand:'TP-Link',name:'Tapo P110'};
const p110m={slug:'tp-link-tapo-p110m',brand:'TP-Link',name:'Tapo P110M'};
const p110Wrong=eligible(p110,row('TP-Link Tapo P110M Smart Wifi Power Socket Plug Monitor Google Alexa Smart Home',{model:['P110M','Tapo P110M (AU)'],categoryPath:'Electronics|Smart Home & Surveillance|Smart Plugs'}),[p110,p110m]);
assert.strictEqual(p110Wrong.eligible,false,'P110M must never populate the P110 hero');
assert(['structured-model-evidence-mismatch','sibling-model-collision'].includes(p110Wrong.reason));

const smartTag={slug:'samsung-galaxy-smarttag2',brand:'Samsung',name:'Galaxy SmartTag2'};
assert.strictEqual(eligible(smartTag,row('Samsung Galaxy SmartTag2 (4 Pack) Bluetooth Tracker, Compass View, AR Find Lost')).reason,'unexpected-pack-count');

const ring={slug:'ring-battery-video-doorbell-2nd-gen',brand:'Ring',name:'Battery Video Doorbell (2nd Gen)'};
assert.strictEqual(eligible(ring,row('Ring Video Doorbell (2nd Gen) & Chime Pro (2nd Gen) Satin Nickel')).reason,'unexpected-bundle-accessory');

// Live regression from 31 Aug 2026: Anker sells materially different C300 and C300 DC variants.
// The base C300 token alone must not let the DC sibling inherit the C300 product hero.
const c300={slug:'anker-solix-c300',brand:'Anker',name:'SOLIX C300 Portable Power Station'};
const c300Dc=eligible(c300,row('Anker Solix C300 Power Station DC Portable Power Bank 300W Solar - HUGE Capacity',{model:['C300'],categoryPath:'Home & Garden|Tools & Workshop Equipment|Power Tools|Generators'}));
assert.strictEqual(c300Dc.eligible,false,'SOLIX C300 DC sibling must never populate the regular C300 hero');
assert.strictEqual(c300Dc.reason,'product-variant-exclusion');
assert.strictEqual(c300Dc.detail.code,'C300_DC_SIBLING');

// Clean exact products should qualify, including current eBay listings where the exact model
// is only in the listing title and listings with legitimate Australian/full-SKU suffixes.
const bes876={slug:'breville-barista-express-impress-bes876',brand:'Breville',name:'Barista Express Impress BES876'};
assert.strictEqual(eligible(bes876,row('Breville the Barista Express Impress Stainless Steel BES876BSS',{model:['BES876BSS4IAN1','not specified'],categoryPath:'Home Appliances|Coffee & Tea Makers|Bean-to-Cup Coffee Machines'})).eligible,true);

const opera={slug:'delonghi-la-specialista-opera-ec9555m',brand:"De'Longhi",name:'La Specialista Opera EC9555.M'};
const operaResult=eligible(opera,row("De'Longhi La Specialista Opera Manual Espresso Coffee Machine EC9555.M, Smart..."));
assert.strictEqual(operaResult.eligible,true,'strong exact EC9555.M title evidence should qualify without a model aspect');
assert.strictEqual(operaResult.model.reason,'specific-model-title-evidence');

const bke825={slug:'breville-the-smart-kettle-bke825',brand:'Breville',name:'the Smart Kettle BKE825'};
assert.strictEqual(eligible(bke825,row('Breville Smart Kettle, Brushed Stainless Steel BKE825BSS, Silver')).eligible,true,'legitimate BKE825BSS suffix should qualify');

const ax55={slug:'tp-link-archer-ax55',brand:'TP-Link',name:'Archer AX55'};
assert.strictEqual(eligible(ax55,row('TP-Link Archer AX55 AX3000 Dual Band Gigabit WiFi 6 Wireless Router Replace AX50',{model:['ARCHER AX55','Archer AX55'],categoryPath:'Computers/Tablets & Networking|Home Networking & Connectivity|Wireless Routers'})).eligible,true);

const makita={slug:'makita-dhp485-18v-brushless-hammer-driver-drill',brand:'Makita',name:'DHP485 18V Brushless Hammer Driver Drill'};
assert.strictEqual(eligible(makita,row('GENUINE MAKITA Australian Model DHP485 18V Brushless Hammer Drill Driver',{model:['DHP485'],categoryPath:'Home & Garden|Tools & Workshop Equipment|Power Tools|Corded Drills'})).eligible,true);

const canon={slug:'canon-selphy-cp1500',brand:'Canon',name:'SELPHY CP1500'};
assert.strictEqual(eligible(canon,row('CANON SELPHY CP1500 Compact Photo Printer, White (CP1500WH)',{model:['CP1500WH'],categoryPath:'Computers/Tablets & Networking|Printers, Scanners & Supplies|Printers'})).eligible,true);

assert.strictEqual(eligible(c300,row('Anker SOLIX C300 Portable Power Station 288Wh 300W',{model:['C300'],categoryPath:'Home & Garden|Tools & Workshop Equipment|Power Tools|Generators'})).eligible,true,'regular SOLIX C300 exact listing should remain eligible');
assert.strictEqual(eligible(c300,row('Anker SOLIX C300 Portable Power Station A1722 288Wh 300W AC DC Outputs',{model:['C300','A1722'],categoryPath:'Home & Garden|Tools & Workshop Equipment|Power Tools|Generators'})).eligible,true,'manufacturer SKU A1722 should prove regular C300 even when DC outputs are mentioned');

const ended=eligible(canon,row('CANON SELPHY CP1500 Compact Photo Printer, White (CP1500WH)',{model:['CP1500WH'],itemEndDate:'2020-01-01T00:00:00.000Z'}));
assert.strictEqual(ended.reason,'ended-listing');

console.log('EBAY_PRODUCT_HERO_EXACT_GUARD_V22=PASS false-positive-regressions=10 exact-positive-regressions=8 recommendationWeight=0');
