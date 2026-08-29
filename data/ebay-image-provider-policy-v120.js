'use strict';

// eBay product imagery provider policy v120.
// This is readiness infrastructure only. It does not fetch, scrape, cache or publish
// any eBay image while APG production Buy API access is pending.
const VERSION='120.0';
const REVIEWED_AT='2026-08-29';
const PROVIDER='ebay_api_approved';
const MARKETPLACE='EBAY_AU';
const ENABLED=false;

const requirements=Object.freeze({
  apiAccess:'approved production eBay Buy/Browse API access',
  marketplace:MARKETPLACE,
  productMatch:['exact','same_model_immaterial_variant'],
  requiredFields:['ebayItemId','ebayItemUrl','ebayAffiliateUrl','imageUrl','imageSource','imageRightsBasis','imageVerifiedAt'],
  imageLinkRule:'The displayed API-delivered image links to its matching EPN affiliate destination.',
  freshnessRule:'Revalidate item identity, availability and API-delivered image before publication and on the configured refresh cycle.',
  prohibited:['scraped listing images','reverse-engineered image URLs','manual copying of seller photography','unverified variants','recalled or commerce-suppressed products']
});

function canPublish(record={}){
  if(!ENABLED)return {ok:false,reason:'eBay production API imagery provider is not enabled.'};
  for(const field of requirements.requiredFields)if(!record[field])return {ok:false,reason:`Missing ${field}.`};
  if(!requirements.productMatch.includes(record.imageProductMatch))return {ok:false,reason:'Product identity is not exact/same-model verified.'};
  if(record.imageLinkUrl!==record.ebayAffiliateUrl)return {ok:false,reason:'Image destination is not the matching EPN affiliate destination.'};
  return {ok:true,reason:'Eligible for governed eBay API imagery publication.'};
}

module.exports={VERSION,REVIEWED_AT,PROVIDER,MARKETPLACE,ENABLED,requirements,canPublish};
