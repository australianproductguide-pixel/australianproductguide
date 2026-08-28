'use strict';

// APG eBay Partner Network integration v1.1.
// Product pages use model-specific eBay Australia search-result affiliate pathways generated
// from APG's canonical product identity. Search-result deep links are an approved EPN link
// destination type, but they are not exact listing evidence. The six owner-supplied refurbished
// collection/promotion destinations remain governed discovery surfaces. Nothing in this module
// asserts live eBay price, stock, seller, condition, warranty or exact listing identity, and every
// commercial pathway contributes zero recommendation weight.
const CAMPAIGN_ID='5339198634';
const MARKETPLACE='www.ebay.com.au';
const MARKETPLACE_ROTATION_ID='705-53470-19255-0';
const SITE_ID='15';
const TOOL_ID='20014';
const REVIEWED='2026-08-28';
const POLICY_STATUS='EPN search-results linking reviewed 2026-08-28';
const SEARCH_BASE='https://www.ebay.com.au/sch/i.html';

const COLLECTIONS={
  sonyRefurbished:{
    key:'sonyRefurbished',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-sony?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Sony options on eBay Australia',
    title:'Sony refurbished',
    description:'Browse eBay Australia’s current Sony refurbished collection. Exact models, sellers, condition grades, prices and availability can change.',
    brands:['sony'],
    kind:'affiliate-collection',
    pathwayType:'collection',
    confidence:'retailer-collection',
    volatile:false
  },
  samsungRefurbishedSeasonal:{
    key:'samsungRefurbishedSeasonal',
    url:'https://www.ebay.com.au/e/_sales/refurbished-samsung-seasonal?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Samsung options on eBay Australia',
    title:'Samsung refurbished',
    description:'Browse eBay Australia’s current Samsung refurbished promotion. Promotional availability is volatile and should be checked on eBay.',
    brands:['samsung'],
    kind:'affiliate-promotion',
    pathwayType:'collection',
    confidence:'promotional-campaign',
    volatile:true
  },
  hpRefurbished:{
    key:'hpRefurbished',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-hp?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished HP options on eBay Australia',
    title:'HP refurbished',
    description:'Browse eBay Australia’s current HP refurbished collection. Confirm the exact model, seller, condition, warranty and price before purchase.',
    brands:['hp'],
    kind:'affiliate-collection',
    pathwayType:'collection',
    confidence:'retailer-collection',
    volatile:false
  },
  dysonRefurbishedSeasonal:{
    key:'dysonRefurbishedSeasonal',
    url:'https://www.ebay.com.au/e/_sales/refurbished-dyson-seasonal?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Dyson options on eBay Australia',
    title:'Dyson refurbished',
    description:'Browse eBay Australia’s current Dyson refurbished promotion. Promotional availability is volatile and should be checked on eBay.',
    brands:['dyson'],
    kind:'affiliate-promotion',
    pathwayType:'collection',
    confidence:'promotional-campaign',
    volatile:true
  },
  refurbishedLaptops:{
    key:'refurbishedLaptops',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-laptops-netbooks-24?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished laptops on eBay Australia',
    title:'Refurbished laptops',
    description:'Browse eBay Australia’s refurbished laptop and notebook collection, then verify the exact model and configuration before buying.',
    categoryTerms:['laptop'],
    kind:'affiliate-collection',
    pathwayType:'collection',
    confidence:'retailer-collection',
    volatile:false
  },
  refurbishedTablets:{
    key:'refurbishedTablets',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-tablets-ebook-readers-24?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished tablets on eBay Australia',
    title:'Refurbished tablets',
    description:'Browse eBay Australia’s refurbished tablet and e-reader collection, then verify the exact model, storage and condition before buying.',
    categoryTerms:['tablet'],
    kind:'affiliate-collection',
    pathwayType:'collection',
    confidence:'retailer-collection',
    volatile:false
  }
};

function normalise(value){return String(value||'').trim().replace(/\s+/g,' ');}
function lower(value){return normalise(value).toLowerCase();}
function categoryText(product){return `${lower(product?.category)} ${lower(product?.categoryLabel)}`;}
function selectCollection(product){
  const brand=lower(product?.brand);
  const rows=Object.values(COLLECTIONS);
  const brandMatch=rows.find(row=>(row.brands||[]).includes(brand));
  if(brandMatch)return brandMatch;
  const category=categoryText(product);
  return rows.find(row=>(row.categoryTerms||[]).some(term=>category.includes(term)))||null;
}

function productSearchTerm(product){
  const brand=normalise(product?.brand);
  const name=normalise(product?.name);
  if(!name)return brand;
  if(!brand)return name;
  return lower(name).startsWith(`${lower(brand)} `)||lower(name)===lower(brand)?name:`${brand} ${name}`;
}
function affiliateSearchUrl(product){
  const term=productSearchTerm(product);
  if(!term)return null;
  return `${SEARCH_BASE}?_nkw=${encodeURIComponent(term)}&mkcid=1&mkrid=${MARKETPLACE_ROTATION_ID}&siteid=${SITE_ID}&campid=${CAMPAIGN_ID}&toolid=${TOOL_ID}&customid=&mkevt=1`;
}

function collectionRetailerFor(product){
  const record=selectCollection(product);
  if(!record)return null;
  return {
    retailer:'eBay Australia',productIdentifier:null,kind:record.kind,pathwayType:'collection',exactUrl:null,
    affiliateUrl:record.url,url:record.url,price:null,currency:'AUD',availability:'check-retailer',checkedAt:REVIEWED,
    verifiedAt:REVIEWED,reviewDue:record.volatile?'2026-08-30':'2026-09-11',freshnessStatus:record.volatile?'volatile-promotion':'review-current',
    exactModel:false,affiliate:true,affiliateProgramme:'eBay Partner Network',campaignId:CAMPAIGN_ID,
    campaignIdSource:'owner-supplied EPN link',marketplace:MARKETPLACE,marketplaceRotationId:MARKETPLACE_ROTATION_ID,
    siteId:SITE_ID,toolId:TOOL_ID,customId:null,destinationKey:record.key,destinationConfidence:record.confidence,
    volatile:record.volatile,conditionScope:'refurbished-collection',availabilityConfidence:record.confidence,
    recommendationWeight:0,ctaLabel:record.label,imageUrl:null,imageVerified:false,policyStatus:POLICY_STATUS,
    note:`Collection-level eBay Australia affiliate destination only; APG has not verified an exact listing, price, stock, seller, condition grade or warranty for this product${record.volatile?' and this promotional destination is volatile':''}. Confirm the exact model/variant, condition, seller, warranty, delivery and current price on eBay before purchase.`
  };
}

function ebayRetailerFor(product){
  const term=productSearchTerm(product);
  const url=affiliateSearchUrl(product);
  if(!term||!url)return collectionRetailerFor(product);
  return {
    retailer:'eBay Australia',
    productIdentifier:null,
    kind:'affiliate-search',
    pathwayType:'product-search',
    identityScope:'model-specific-search',
    identityQuery:term,
    exactUrl:null,
    affiliateUrl:url,
    url,
    price:null,
    currency:'AUD',
    availability:'unverified-search-results',
    checkedAt:REVIEWED,
    verifiedAt:REVIEWED,
    reviewDue:'2026-09-11',
    freshnessStatus:'generated-from-current-canonical-identity',
    exactModel:false,
    affiliate:true,
    affiliateProgramme:'eBay Partner Network',
    campaignId:CAMPAIGN_ID,
    campaignIdSource:'APG governed EPN search-result generator',
    marketplace:MARKETPLACE,
    marketplaceRotationId:MARKETPLACE_ROTATION_ID,
    siteId:SITE_ID,
    toolId:TOOL_ID,
    customId:null,
    destinationKey:'modelSearch',
    destinationConfidence:'model-specific-search',
    volatile:true,
    conditionScope:'search-results-mixed',
    availabilityConfidence:'unverified-search-results',
    recommendationWeight:0,
    ctaLabel:`Search eBay Australia for ${term}`,
    imageUrl:null,
    imageVerified:false,
    policyStatus:POLICY_STATUS,
    note:'Model-specific eBay Australia search-result affiliate pathway generated from APG canonical product identity. APG has not verified an individual eBay listing, seller, condition, warranty, live price or availability. Check the exact model/variant and all current listing details on eBay before purchase.'
  };
}

function promotionRows(){return Object.values(COLLECTIONS).map(record=>({
  ...record,
  retailer:'eBay Australia',
  affiliate:true,
  affiliateProgramme:'eBay Partner Network',
  campaignId:CAMPAIGN_ID,
  marketplace:MARKETPLACE,
  recommendationWeight:0,
  exactModel:false,
  verifiedAt:REVIEWED,
  freshnessStatus:record.volatile?'volatile-promotion':'review-current'
}));}

module.exports={
  CAMPAIGN_ID,MARKETPLACE,MARKETPLACE_ROTATION_ID,SITE_ID,TOOL_ID,REVIEWED,POLICY_STATUS,SEARCH_BASE,COLLECTIONS,
  selectCollection,productSearchTerm,affiliateSearchUrl,collectionRetailerFor,ebayRetailerFor,promotionRows
};
