'use strict';

// APG eBay Partner Network interim integration v1.
// Owner-supplied Australian EPN destinations are deliberately treated as collection/promotion
// pathways only until eBay developer API access can provide listing-level identity, condition,
// seller, availability and price evidence. These rows contribute zero recommendation weight.
const CAMPAIGN_ID='5339198634';
const MARKETPLACE='www.ebay.com.au';
const MARKETPLACE_ROTATION_ID='705-53470-19255-0';
const SITE_ID='15';
const TOOL_ID='20014';
const REVIEWED='2026-08-28';

const COLLECTIONS={
  sonyRefurbished:{
    key:'sonyRefurbished',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-sony?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Sony options on eBay Australia',
    brands:['sony'],
    kind:'affiliate-collection',
    confidence:'retailer-collection',
    volatile:false
  },
  samsungRefurbishedSeasonal:{
    key:'samsungRefurbishedSeasonal',
    url:'https://www.ebay.com.au/e/_sales/refurbished-samsung-seasonal?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Samsung options on eBay Australia',
    brands:['samsung'],
    kind:'affiliate-promotion',
    confidence:'promotional-campaign',
    volatile:true
  },
  hpRefurbished:{
    key:'hpRefurbished',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-hp?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished HP options on eBay Australia',
    brands:['hp'],
    kind:'affiliate-collection',
    confidence:'retailer-collection',
    volatile:false
  },
  dysonRefurbishedSeasonal:{
    key:'dysonRefurbishedSeasonal',
    url:'https://www.ebay.com.au/e/_sales/refurbished-dyson-seasonal?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished Dyson options on eBay Australia',
    brands:['dyson'],
    kind:'affiliate-promotion',
    confidence:'promotional-campaign',
    volatile:true
  },
  refurbishedLaptops:{
    key:'refurbishedLaptops',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-laptops-netbooks-24?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished laptops on eBay Australia',
    categoryTerms:['laptop'],
    kind:'affiliate-collection',
    confidence:'retailer-collection',
    volatile:false
  },
  refurbishedTablets:{
    key:'refurbishedTablets',
    url:'https://www.ebay.com.au/e/_electronics/c-refurbished-tablets-ebook-readers-24?mkcid=1&mkrid=705-53470-19255-0&siteid=15&campid=5339198634&toolid=20014&customid=&mkevt=1',
    label:'Browse refurbished tablets on eBay Australia',
    categoryTerms:['tablet'],
    kind:'affiliate-collection',
    confidence:'retailer-collection',
    volatile:false
  }
};

function normalise(value){return String(value||'').trim().toLowerCase();}
function categoryText(product){return `${normalise(product?.category)} ${normalise(product?.categoryLabel)}`;}
function selectCollection(product){
  const brand=normalise(product?.brand);
  const rows=Object.values(COLLECTIONS);
  const brandMatch=rows.find(row=>(row.brands||[]).includes(brand));
  if(brandMatch)return brandMatch;
  const category=categoryText(product);
  return rows.find(row=>(row.categoryTerms||[]).some(term=>category.includes(term)))||null;
}

function ebayRetailerFor(product){
  const record=selectCollection(product);
  if(!record)return null;
  return {
    retailer:'eBay Australia',
    productIdentifier:null,
    kind:record.kind,
    exactUrl:null,
    affiliateUrl:record.url,
    url:record.url,
    price:null,
    currency:'AUD',
    availability:'check-retailer',
    checkedAt:REVIEWED,
    reviewDue:record.volatile?'2026-08-30':'2026-09-11',
    exactModel:false,
    affiliate:true,
    affiliateProgramme:'eBay Partner Network',
    campaignId:CAMPAIGN_ID,
    campaignIdSource:'owner-supplied EPN link',
    marketplace:MARKETPLACE,
    marketplaceRotationId:MARKETPLACE_ROTATION_ID,
    siteId:SITE_ID,
    toolId:TOOL_ID,
    customId:null,
    destinationKey:record.key,
    destinationConfidence:record.confidence,
    volatile:record.volatile,
    conditionScope:'refurbished-collection',
    availabilityConfidence:record.confidence,
    recommendationWeight:0,
    ctaLabel:record.label,
    imageUrl:null,
    imageVerified:false,
    note:`Collection-level eBay Australia affiliate destination only; APG has not verified an exact listing, price, stock, seller, condition grade or warranty for this product${record.volatile?' and this promotional destination is volatile':''}. Confirm the exact model/variant, condition, seller, warranty, delivery and current price on eBay before purchase.`
  };
}

module.exports={
  CAMPAIGN_ID,MARKETPLACE,MARKETPLACE_ROTATION_ID,SITE_ID,TOOL_ID,REVIEWED,COLLECTIONS,
  selectCollection,ebayRetailerFor
};
