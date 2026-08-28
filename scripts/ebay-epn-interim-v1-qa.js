'use strict';
const assert=require('node:assert/strict');
const ebay=require('../data/ebay-epn-interim-v1');
const retailers=require('../data/retailers-v6');
const {products}=require('../data');

assert.equal(ebay.CAMPAIGN_ID,'5339198634','Owner-supplied EPN campaign ID must remain intact');
assert.equal(Object.keys(ebay.COLLECTIONS).length,6,'All six approved EPN collection/promotion destinations must remain governed');
assert.equal(Object.keys(ebay.EXCEPTIONS).length,1,'Known no-safe-purchase-path recall must remain an explicit eBay exception');
assert.equal(products.length,482,'eBay catalogue coverage QA must run against the complete maintained 482-product catalogue');

function assertTracking(url,label){
  const u=new URL(url);
  assert.equal(u.protocol,'https:',`${label} must use HTTPS`);
  assert.equal(u.hostname,'www.ebay.com.au',`${label} must stay on eBay Australia`);
  assert.equal(u.searchParams.get('mkcid'),'1');
  assert.equal(u.searchParams.get('mkrid'),ebay.MARKETPLACE_ROTATION_ID);
  assert.equal(u.searchParams.get('siteid'),ebay.SITE_ID);
  assert.equal(u.searchParams.get('campid'),ebay.CAMPAIGN_ID);
  assert.equal(u.searchParams.get('toolid'),ebay.TOOL_ID);
  assert.equal(u.searchParams.get('mkevt'),'1');
  assert.equal(u.searchParams.get('customid'),'','Custom ID remains intentionally blank until APG placement taxonomy is EPN-verified');
  return u;
}

for(const record of Object.values(ebay.COLLECTIONS))assertTracking(record.url,record.key);
assert.equal(ebay.COLLECTIONS.samsungRefurbishedSeasonal.volatile,true);
assert.equal(ebay.COLLECTIONS.dysonRefurbishedSeasonal.volatile,true);
assert.equal(ebay.COLLECTIONS.sonyRefurbished.volatile,false);
assert.equal(ebay.COLLECTIONS.refurbishedLaptops.volatile,false);

const collectionCases=[
  [{brand:'Sony',name:'Test',slug:'sony-test',category:'wireless-headphones',categoryLabel:'Wireless headphones'},'sonyRefurbished'],
  [{brand:'Samsung',name:'Test',slug:'samsung-test',category:'tablets',categoryLabel:'Tablets'},'samsungRefurbishedSeasonal'],
  [{brand:'HP',name:'Test',slug:'hp-test',category:'laptops',categoryLabel:'Laptops'},'hpRefurbished'],
  [{brand:'Dyson',name:'Test',slug:'dyson-test',category:'stick-vacuums',categoryLabel:'Stick vacuums'},'dysonRefurbishedSeasonal'],
  [{brand:'ASUS',name:'Test',slug:'asus-test',category:'laptops',categoryLabel:'Laptops'},'refurbishedLaptops'],
  [{brand:'Apple',name:'Test',slug:'ipad-test',category:'tablets',categoryLabel:'Tablets'},'refurbishedTablets']
];
for(const [product,key] of collectionCases){
  assert.equal(ebay.selectCollection(product)?.key,key,`Expected governed promotion ${key}`);
  const row=ebay.collectionRetailerFor(product);
  assert.equal(row.destinationKey,key);
  assert.equal(row.pathwayType,'collection');
  assert.equal(row.exactModel,false);
  assert.equal(row.price,null);
  assert.equal(row.recommendationWeight,0);
  assert.ok(row.note.includes('has not verified an exact listing'));
}

let searchCount=0,exceptionCount=0;
const missing=[];
for(const product of products){
  const exception=ebay.exceptionFor(product);
  const row=ebay.ebayRetailerFor(product);
  if(exception){
    exceptionCount++;
    assert.equal(exception.status,'NO_SAFE_PURCHASE_PATH_RECALL');
    assert.equal(row,null,`${product.slug} safety exception must suppress eBay retailer row`);
    assert.equal(ebay.affiliateSearchUrl(product),null,`${product.slug} safety exception must suppress generated affiliate URL`);
    assert.ok(!retailers.retailersFor(product).some(r=>r.retailer==='eBay Australia'),`${product.slug} composed retailers must not reopen eBay commerce`);
    continue;
  }
  const term=ebay.productSearchTerm(product);
  if(!term||!row){missing.push(product.slug);continue;}
  searchCount++;
  assert.equal(row.retailer,'eBay Australia',`${product.slug} retailer label`);
  assert.equal(row.pathwayType,'product-search',`${product.slug} must use the stronger model-specific search pathway`);
  assert.equal(row.kind,'affiliate-search');
  assert.equal(row.identityQuery,term);
  assert.equal(row.exactModel,false,'Search results must never imply exact listing identity');
  assert.equal(row.price,null,'APG must not invent or cache eBay prices');
  assert.equal(row.recommendationWeight,0,'Commercial participation must contribute zero recommendation points');
  assert.equal(row.availability,'unverified-search-results');
  assert.equal(row.destinationConfidence,'model-specific-search');
  assert.match(row.note,/has not verified an individual eBay listing/i);
  const u=assertTracking(row.url,product.slug);
  assert.equal(u.pathname,'/sch/i.html');
  assert.equal(u.searchParams.get('_nkw'),term,`${product.slug} search query must be generated from canonical identity`);
  assert.ok(term.toLowerCase().includes(String(product.name||'').trim().toLowerCase()),`${product.slug} eBay query must preserve product name/model identity`);

  const composed=retailers.retailersFor(product);
  const ebayRows=composed.filter(r=>r.retailer==='eBay Australia');
  assert.equal(ebayRows.length,1,`${product.slug} must expose exactly one primary eBay retailer row`);
  assert.equal(ebayRows[0].pathwayLabel,'Product search');
  assert.equal(ebayRows[0].recommendationWeight,0);
  const scores=composed.map(retailers.pathwayScore);
  for(let i=1;i<scores.length;i++)assert.ok(scores[i-1]>=scores[i],`${product.slug} retailer ordering must follow pathway specificity`);
  assert.ok(composed.every(r=>Number(r.recommendationWeight||0)===0),`${product.slug} retailer participation must add zero recommendation points`);
}
assert.deepEqual(missing,[],'Every non-exception maintained product requires a governed eBay model-search pathway');
assert.equal(exceptionCount,Object.keys(ebay.EXCEPTIONS).length);
assert.equal(searchCount,products.length-exceptionCount,'Every eligible maintained product must receive a model-specific eBay Australia search pathway');
assert.equal(searchCount,481,'Current catalogue should expose 481 governed eBay product-search pathways and one safety exception');

const exactAmazonProduct=products.find(product=>!ebay.exceptionFor(product)&&retailers.amazonRetailerFor(product).amazonMatchStatus==='EXACT_VERIFIED');
if(exactAmazonProduct){
  const rows=retailers.retailersFor(exactAmazonProduct);
  const amazonIndex=rows.findIndex(r=>r.retailer==='Amazon Australia');
  const ebayIndex=rows.findIndex(r=>r.retailer==='eBay Australia');
  assert.ok(amazonIndex>=0&&ebayIndex>=0);
  assert.ok(amazonIndex<ebayIndex,'A verified exact retailer destination must outrank a product-search pathway regardless of affiliate programme');
}

const syntheticExact={retailer:'Australian Retailer',kind:'retailer-direct',exactUrl:'https://retailer.example/product',url:'https://retailer.example/product',verifiedAt:'2026-08-28',recommendationWeight:0};
const syntheticSearch=ebay.ebayRetailerFor({brand:'Sony',name:'WH-1000XM6',slug:'synthetic-sony'});
const ordered=retailers.orderRetailers([syntheticSearch,syntheticExact]);
assert.equal(ordered[0].retailer,'Australian Retailer','Retailer-neutral ordering must allow a stronger non-Amazon exact pathway to outrank an affiliate search');

console.log(`EBAY_EPN_CATALOGUE_V11_GREEN campaign=${ebay.CAMPAIGN_ID} products=${products.length} productSearch=${searchCount} safetyExceptions=${exceptionCount} governedPromotions=${Object.keys(ebay.COLLECTIONS).length} exactListingClaims=0 recommendationWeight=0 ordering=evidence-bound`);
require('./ebay-epn-render-v1-qa');
