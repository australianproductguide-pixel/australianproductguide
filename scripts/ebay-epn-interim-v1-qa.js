'use strict';
const assert=require('node:assert/strict');
const ebay=require('../data/ebay-epn-interim-v1');
const retailers=require('../data/retailers-v6');

assert.equal(ebay.CAMPAIGN_ID,'5339198634','Owner-supplied EPN campaign ID must remain intact');
assert.equal(Object.keys(ebay.COLLECTIONS).length,6,'All six approved interim EPN destinations must remain governed');

for(const record of Object.values(ebay.COLLECTIONS)){
  const u=new URL(record.url);
  assert.equal(u.protocol,'https:');
  assert.equal(u.hostname,'www.ebay.com.au','Interim EPN destinations must stay on eBay Australia');
  assert.equal(u.searchParams.get('mkcid'),'1');
  assert.equal(u.searchParams.get('mkrid'),ebay.MARKETPLACE_ROTATION_ID);
  assert.equal(u.searchParams.get('siteid'),ebay.SITE_ID);
  assert.equal(u.searchParams.get('campid'),ebay.CAMPAIGN_ID);
  assert.equal(u.searchParams.get('toolid'),ebay.TOOL_ID);
  assert.equal(u.searchParams.get('mkevt'),'1');
  assert.equal(u.searchParams.get('customid'),'','Custom ID remains intentionally blank until APG placement taxonomy is EPN-verified');
}

assert.equal(ebay.COLLECTIONS.samsungRefurbishedSeasonal.volatile,true);
assert.equal(ebay.COLLECTIONS.dysonRefurbishedSeasonal.volatile,true);
assert.equal(ebay.COLLECTIONS.sonyRefurbished.volatile,false);
assert.equal(ebay.COLLECTIONS.refurbishedLaptops.volatile,false);

const cases=[
  [{brand:'Sony',name:'Test',slug:'sony-test',category:'wireless-headphones',categoryLabel:'Wireless headphones'},'sonyRefurbished'],
  [{brand:'Samsung',name:'Test',slug:'samsung-test',category:'tablets',categoryLabel:'Tablets'},'samsungRefurbishedSeasonal'],
  [{brand:'HP',name:'Test',slug:'hp-test',category:'laptops',categoryLabel:'Laptops'},'hpRefurbished'],
  [{brand:'Dyson',name:'Test',slug:'dyson-test',category:'stick-vacuums',categoryLabel:'Stick vacuums'},'dysonRefurbishedSeasonal'],
  [{brand:'ASUS',name:'Test',slug:'asus-test',category:'laptops',categoryLabel:'Laptops'},'refurbishedLaptops'],
  [{brand:'Apple',name:'Test',slug:'ipad-test',category:'tablets',categoryLabel:'Tablets'},'refurbishedTablets']
];
for(const [product,key] of cases){
  const selected=ebay.selectCollection(product);
  assert.equal(selected?.key,key,`Expected ${key} for ${product.brand} ${product.category}`);
  const row=ebay.ebayRetailerFor(product);
  assert.equal(row.retailer,'eBay Australia');
  assert.equal(row.exactModel,false,'Collection links must never imply exact product identity');
  assert.equal(row.price,null,'APG must not invent or cache an interim eBay price');
  assert.equal(row.recommendationWeight,0,'Commercial participation must contribute zero recommendation points');
  assert.equal(row.campaignId,ebay.CAMPAIGN_ID);
  assert.ok(row.note.includes('has not verified an exact listing'));
}

assert.equal(ebay.ebayRetailerFor({brand:'Breville',category:'coffee-machines',categoryLabel:'Coffee machines'}),null,'Unrelated products must not receive an eBay collection CTA');

const composed=retailers.retailersFor({brand:'Sony',name:'WH-1000XM6',slug:'sony-wh-1000xm6',category:'wireless-headphones',categoryLabel:'Wireless headphones'});
assert.equal(composed[0].retailer,'Amazon Australia','Existing Amazon retailer authority must retain first position');
assert.equal(composed[1].retailer,'eBay Australia','Relevant eBay collection should be additive, not a replacement');
assert.equal(composed[1].destinationKey,'sonyRefurbished');

console.log(`EBAY_EPN_INTERIM_V1_GREEN campaign=${ebay.CAMPAIGN_ID} destinations=${Object.keys(ebay.COLLECTIONS).length} exactClaims=0 recommendationWeight=0`);
