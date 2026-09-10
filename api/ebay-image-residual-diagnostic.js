'use strict';

// APG residual eBay image diagnostic v1.0.
// Read-only, no-store and noindex. This endpoint can inspect only a tiny maintained allowlist of
// exact item IDs surfaced by governed discovery for unresolved product-image rows. It performs no
// database mutation and does not change product recommendation weighting or image eligibility.
const {products}=require('../data');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='1.0';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const TARGETS=Object.freeze({
  'samsung-qn90f-65-inch-neo-qled-4k-vision-ai-tv':'v1|147562462120|0',
  'delonghi-rivelia-auto-milk-exam44055b':'v1|137580667717|0',
  'esr-qi2-3-in-1-travel-wireless-charging-set':'v1|256916528863|0',
  'bluetti-ac70':'v1|137517295327|0',
  'catlink-scooper-pro-x':'v1|226533198599|0',
  'marshall-monitor-iii-anc':'v1|800633315542|0'
});
function clean(value){return String(value==null?'':value).trim();}
function host(value){try{return new URL(clean(value)).hostname;}catch{return '';}}
function safeSlug(req){try{const slug=clean(new URL(req.url,'https://australianproductguide.au').searchParams.get('slug'));return TARGETS[slug]&&PRODUCT_MAP.has(slug)?slug:'';}catch{return '';}}
function publicAspects(detail){return (Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[]).slice(0,140).map(row=>({name:clean(row&&row.name),value:clean(row&&row.value)})).filter(row=>row.name||row.value);}
function detailsText(detail){return `${clean(detail&&detail.title)} ${(Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[]).map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' ')}`.trim();}
function candidate(product,itemId,detail){
  const catalogImage=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl);
  const listingImage=clean(detail&&detail.image&&detail.image.imageUrl);
  const imageUrl=enrichment.preferredEbayImage(catalogImage,listingImage);
  const parts=clean(itemId).split('|');
  const modelEvidence=enrichment.detailedModelEvidence(detail);
  return {
    itemId:clean(detail&&detail.itemId)||itemId,
    legacyItemId:clean(detail&&detail.legacyItemId)||(parts.length>1?parts[1]:''),
    title:clean(detail&&detail.title),condition:clean(detail&&detail.condition),
    price:detail&&detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:null,
    imageUrl,imageSource:imageUrl===catalogImage?'ebay-product-catalog':'ebay-listing',
    itemWebUrl:clean(detail&&detail.itemWebUrl),itemAffiliateWebUrl:clean(detail&&detail.itemAffiliateWebUrl)||null,
    itemEndDate:clean(detail&&detail.itemEndDate)||null,
    score:null,reasons:['bounded-residual-diagnostic'],flags:[],exactModel:true,detailVerified:true,
    verificationLevel:modelEvidence.length?'detail-model-evidence':'detail-title-model',
    verificationEvidence:{brands:enrichment.detailedBrandEvidence(detail),model:modelEvidence,categoryPath:clean(detail&&detail.categoryPath)||null},
    recommendationWeight:0
  };
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,status:'method-not-allowed',version:VERSION});}
  const slug=safeSlug(req);if(!slug)return res.status(400).json({ok:false,status:'invalid-slug',version:VERSION});
  const product=PRODUCT_MAP.get(slug),itemId=TARGETS[slug];
  try{
    const detail=await ebay.getItem(itemId,{referenceId:`apg:${slug}:residual-diagnostic-v10`,timeoutMs:10000});
    const accepted=candidate(product,itemId,detail);
    const staged={status:'accept',accepted,review:null,candidates:[accepted],recommendationWeight:0};
    const family=familyGuard.applyToEnrichment(product,staged);
    const familyResult=family&&family.familyGuard?family.familyGuard:{version:familyGuard.VERSION,rejectedItemId:null,reason:null,suffix:null,marker:null};
    const exact=family&&family.status==='accept'&&family.accepted?exactGuard.evaluate(product,family,products,{now:Date.now()}):{eligible:false,reason:familyResult.reason||'family-variant-guard'};
    const text=detailsText(detail);
    return res.status(200).json({ok:true,version:VERSION,zeroMutation:true,slug,itemId,
      product:{brand:product.brand||null,name:product.name||null,model:product.model||null,category:product.category||null,modelTokens:enrichment.modelTokens(product),specModelValues:enrichment.specModelValues(product)},
      detail:{title:accepted.title,condition:accepted.condition,categoryPath:accepted.verificationEvidence.categoryPath,brands:accepted.verificationEvidence.brands,models:accepted.verificationEvidence.model,aspects:publicAspects(detail)},
      media:{imageUrl:accepted.imageUrl||null,imageHost:host(accepted.imageUrl)||null,imageSource:accepted.imageSource,itemWebUrl:accepted.itemWebUrl||null,itemWebHost:host(accepted.itemWebUrl)||null,itemEndDate:accepted.itemEndDate,price:accepted.price},
      checks:{listingAccessory:enrichment.listingLooksAccessory(accepted.title,product),listingUsed:enrichment.listingLooksUsed(accepted.title,accepted.condition),categoryRisk:enrichment.detailedCategoryRisk(detail),voltage:enrichment.regionalVoltageConflict(text),materialVariant:enrichment.materialVariantConflict(product,text),materialSuffix:enrichment.materialSuffixConflict(product,accepted.title),materialIdentity:enrichment.materialIdentityConflict(product,text),familyGuard:familyResult,exactGuard:exact}
    });
  }catch(error){return res.status(500).json({ok:false,status:'diagnostic-failed',version:VERSION,slug,itemId,code:clean(error&&error.code)||'EBAY_RESIDUAL_DIAGNOSTIC_ERROR'});}
};
module.exports.VERSION=VERSION;
module.exports.TARGETS=TARGETS;
