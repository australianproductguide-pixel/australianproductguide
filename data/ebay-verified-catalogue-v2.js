'use strict';

// APG governed catalogue-wide eBay AU exact-product registry v2.
//
// This file contains ONLY non-pilot product mappings that have survived the Production eBay
// enrichment pipeline, detailed item verification, family/variant controls and the stricter
// product-hero exact guard. The five original pilot products remain owned by
// ebay-verified-offers-v1.js and are deliberately not duplicated here.
//
// A row in this registry is identity evidence, not permission to display stale eBay content.
// Runtime must refresh the mapped item through the eBay Browse API before public display, or
// fail closed. Retailer/affiliate participation contributes zero recommendation points and
// these rows must not be written into APG canonical Product.image structured data.

const VERSION='2.0';
const MARKETPLACE='EBAY_AU';
const SOURCE='eBay Buy Browse API';

// Populated only by reviewed, exact-model Production enrichment batches.
const offers={};

function clean(value){return String(value==null?'':value).trim();}
function complete(row){
  if(!row||row.status!=='verified'||row.detailVerified!==true||row.exactModel!==true)return false;
  if(row.marketplaceId!==MARKETPLACE||row.source!==SOURCE||row.recommendationWeight!==0)return false;
  if(!row.slug||!row.productName||!row.itemId||!row.legacyItemId||!row.title||!row.condition)return false;
  if(!row.price||clean(row.price.currency)!=='AUD'||!clean(row.price.value))return false;
  if(!/^https:\/\/i\.ebayimg\.com\//i.test(clean(row.imageUrl)))return false;
  if(!/^https:\/\/www\.ebay\.com\.au\/itm\//i.test(clean(row.itemWebUrl)))return false;
  if(!clean(row.observedAt)||!Number.isFinite(Date.parse(row.observedAt)))return false;
  if(!['detail-model-evidence','detail-title-model'].includes(row.verificationLevel))return false;
  return true;
}
function forSlug(slug){
  const row=offers[clean(slug)]||null;
  return complete(row)?row:null;
}
function toEnrichmentRow(row){
  if(!complete(row))return null;
  return {
    status:'accept',
    accepted:{
      itemId:row.itemId,
      legacyItemId:row.legacyItemId,
      title:row.title,
      condition:row.condition,
      price:row.price,
      imageUrl:row.imageUrl,
      imageSource:row.imageSource||null,
      itemWebUrl:row.itemWebUrl,
      itemAffiliateWebUrl:row.itemAffiliateWebUrl||null,
      score:row.matchScore==null?null:row.matchScore,
      reasons:Array.isArray(row.matchReasons)?row.matchReasons:[],
      flags:Array.isArray(row.matchFlags)?row.matchFlags:[],
      exactModel:true,
      detailVerified:true,
      verificationLevel:row.verificationLevel,
      verificationEvidence:row.verificationEvidence||null,
      recommendationWeight:0
    },
    review:null,
    candidates:[]
  };
}

module.exports={VERSION,MARKETPLACE,SOURCE,offers,complete,forSlug,toEnrichmentRow};
