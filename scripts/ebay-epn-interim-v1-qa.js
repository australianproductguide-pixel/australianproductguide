'use strict';
const assert=require('node:assert/strict');
const ebay=require('../data/ebay-epn-interim-v1');
const retailers=require('../data/retailers-v6');
const commerce=require('../data/commerce-eligibility-v114');
const {products}=require('../data');
const surface=require('../lib/ebay-epn-surface-v1-runtime');

assert.equal(ebay.CAMPAIGN_ID,'5339198634','Owner-supplied EPN campaign ID must remain intact');
assert.equal(Object.keys(ebay.COLLECTIONS).length,6,'All six approved EPN collection/promotion destinations must remain governed');
assert.equal(commerce.eligibilitySummary().entityOpenCases,0,'Final Action 4 v98 must retain zero unresolved entity cases');
assert.equal(Object.keys(commerce.ENTITY_EXCLUSIONS).length,11,'All non-current/non-AU catalogue entities must remain excluded from current Australian commerce');
assert.equal(commerce.eligibilitySummary().historicalExclusions,6,'Six maintained historical records must remain commerce-suppressed');
assert.equal(commerce.eligibilitySummary().regionalOrCurrentMarketExclusions,5,'Five non-AU/regional records must remain commerce-suppressed');
assert.equal(Object.keys(commerce.SAFETY_EXCLUSIONS).length,1,'Known no-safe-purchase-path recall must remain explicitly suppressed');
assert.equal(Object.keys(ebay.EXCEPTIONS).length,12,'eBay exceptions must share the catalogue-wide entity/market/lifecycle and safety gate');
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

let searchCount=0,entityExceptionCount=0,safetyExceptionCount=0;
const missing=[];
for(const product of products){
  const exception=ebay.exceptionFor(product);
  const row=ebay.ebayRetailerFor(product);
  if(exception){
    if(exception.type==='ENTITY_MARKET_EXCLUDED')entityExceptionCount++;
    if(exception.type==='SAFETY_SUPPRESSED')safetyExceptionCount++;
    assert.equal(row,null,`${product.slug} commerce exception must suppress eBay retailer row`);
    assert.equal(ebay.affiliateSearchUrl(product),null,`${product.slug} commerce exception must suppress generated affiliate URL`);
    assert.equal(product.commerceSuppressed,true,`${product.slug} must remain visibly commerce-suppressed in canonical catalogue state`);
    assert.deepEqual(product.retailers,[],`${product.slug} must have no retailer rows after all enrichment passes`);
    assert.deepEqual(retailers.retailersFor(product),[],`${product.slug} canonical retailer composer must fail closed`);
    continue;
  }
  const term=ebay.productSearchTerm(product);
  if(!term||!row){missing.push(product.slug);continue;}
  searchCount++;
  assert.equal(product.commerceSuppressed,false,`${product.slug} should remain commerce eligible`);
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
  for(let i=1;i<scores.length;i++)assert.ok(scores[i-1]>=scores[i],`${product.slug} canonical retailer composer must follow pathway specificity`);
  assert.ok(composed.every(r=>Number(r.recommendationWeight||0)===0),`${product.slug} retailer participation must add zero recommendation points`);

  const stored=Array.isArray(product.retailers)?product.retailers:[];
  const storedScores=stored.map(retailers.pathwayScore);
  for(let i=1;i<storedScores.length;i++)assert.ok(storedScores[i-1]>=storedScores[i],`${product.slug} stored retailer rows must preserve deterministic ordering within that store`);
  assert.ok(stored.every(r=>Number(r.recommendationWeight||0)===0),`${product.slug} stored retailer rows must remain commercially neutral`);
}
assert.deepEqual(missing,[],'Every commerce-eligible maintained product requires a governed eBay model-search pathway');
assert.equal(entityExceptionCount,Object.keys(commerce.ENTITY_EXCLUSIONS).length);
assert.equal(safetyExceptionCount,Object.keys(commerce.SAFETY_EXCLUSIONS).length);
assert.equal(searchCount,products.length-entityExceptionCount-safetyExceptionCount,'Every eligible maintained product must receive a model-specific eBay Australia search pathway');
assert.equal(searchCount,470,'Current catalogue should expose 470 governed eBay product-search pathways, eleven entity/market/lifecycle exclusions and one safety exception');

const exactAmazonProduct=products.find(product=>!ebay.exceptionFor(product)&&retailers.amazonRetailerFor(product)?.amazonMatchStatus==='EXACT_VERIFIED');
if(exactAmazonProduct){
  const rows=retailers.retailersFor(exactAmazonProduct);
  const amazonIndex=rows.findIndex(r=>r.retailer==='Amazon Australia');
  const ebayIndex=rows.findIndex(r=>r.retailer==='eBay Australia');
  assert.ok(amazonIndex>=0&&ebayIndex>=0);
  assert.ok(amazonIndex<ebayIndex,'A verified exact retailer destination must outrank a product-search pathway regardless of affiliate programme');
}

// Sony is the concrete Production benchmark that exposed a renderer-only ordering defect:
// JB Hi-Fi is appended through the verified-offer path rather than product.retailers. The final
// surface must therefore order the merged retailer + offer set, not only the base retailer array.
const sony=products.find(product=>product.slug==='sony-wh-1000xm6');
assert(sony,'Sony WH-1000XM6 must remain in maintained catalogue');
const sonyMerged=surface.canonicalRetailerRows(sony);
const sonyJb=sonyMerged.findIndex(r=>r.retailer==='JB Hi-Fi');
const sonyAmazon=sonyMerged.findIndex(r=>r.retailer==='Amazon Australia');
const sonyEbay=sonyMerged.findIndex(r=>r.retailer==='eBay Australia');
assert.ok(sonyJb>=0&&sonyAmazon>=0&&sonyEbay>=0,'Sony merged renderer benchmark requires JB Hi-Fi, Amazon and eBay rows');
assert.ok(sonyJb<sonyAmazon&&sonyAmazon<sonyEbay,'Sony merged retailer order must be exact JB Hi-Fi > verified Amazon variant > eBay product search');
assert.equal(retailers.classifyPathway(sonyMerged[sonyJb]),'exact-product');
assert.equal(retailers.classifyPathway(sonyMerged[sonyAmazon]),'verified-variant');
assert.equal(retailers.classifyPathway(sonyMerged[sonyEbay]),'product-search');

const syntheticExact={retailer:'Australian Retailer',kind:'retailer-direct',exactUrl:'https://retailer.example/product',url:'https://retailer.example/product',verifiedAt:'2026-08-28',recommendationWeight:0};
const syntheticSearch=ebay.ebayRetailerFor({brand:'Sony',name:'WH-1000XM6',slug:'synthetic-sony'});
const ordered=retailers.orderRetailers([syntheticSearch,syntheticExact]);
assert.equal(ordered[0].retailer,'Australian Retailer','Retailer-neutral ordering must allow a stronger non-Amazon exact pathway to outrank an affiliate search');

const summary=commerce.eligibilitySummary();
console.log(`EBAY_EPN_CATALOGUE_V12_GREEN campaign=${ebay.CAMPAIGN_ID} products=${products.length} productSearch=${searchCount} entityExclusions=${entityExceptionCount} entityOpen=${summary.entityOpenCases} historicalExclusions=${summary.historicalExclusions} regionalExclusions=${summary.regionalOrCurrentMarketExclusions} safetyExceptions=${safetyExceptionCount} governedPromotions=${Object.keys(ebay.COLLECTIONS).length} exactListingClaims=0 recommendationWeight=0 ordering=merged-evidence-bound surface=v${surface.VERSION}`);
require('./ebay-epn-render-v1-qa');