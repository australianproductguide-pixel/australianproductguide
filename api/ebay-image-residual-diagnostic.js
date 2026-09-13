'use strict';

// APG residual eBay image diagnostic v1.3.
// Read-only, no-store and noindex. This endpoint can inspect only a maintained allowlist of exact
// item IDs surfaced by governed discovery or independent exact-item research for unresolved
// product-image rows. It performs no database mutation and does not change recommendation weighting
// or image eligibility. v1.3 allows a bounded candidate index for slugs with several pre-approved
// exact item IDs, avoiding repeated deployments while still preventing arbitrary item inspection.
const {products}=require('../data');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='1.3';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const TARGETS=Object.freeze({
  'samsung-qn90f-65-inch-neo-qled-4k-vision-ai-tv':'v1|147562462120|0',
  'delonghi-rivelia-auto-milk-exam44055b':'v1|137580667717|0',
  'esr-qi2-3-in-1-travel-wireless-charging-set':'v1|256916528863|0',
  'bluetti-ac70':'v1|137517295327|0',
  'catlink-scooper-pro-x':'v1|226533198599|0',
  'marshall-monitor-iii-anc':'v1|800633315542|0',
  'delonghi-pinguino-pac-em82k':'v1|176564089771|0',
  'honor-magic8-pro':'v1|188479780546|695946250782',
  'scansnap-ix1600-document-scanner':Object.freeze([
    'v1|362541917972|0',
    'v1|305181225294|0',
    'v1|364881410716|0',
    'v1|305553300838|0',
    'v1|306396201743|0'
  ]),
  'sihoo-doro-c300-pro-v2':'v1|318466896282|0',
  'westinghouse-619l-french-door-fridge':'v1|275318365547|0',
  'amazon-eero-max-7':'v1|186261946765|0',
  'anker-power-bank-20000mah-22-5w':'v1|404694881374|0',
  'brita-style-xl-water-filter-jug':'v1|204366451719|0',
  'chipolo-one-point':'v1|126538884179|0',
  'concept2-rowerg':'v1|316520905403|0',
  'meross-mini-smart-wi-fi-plug':'v1|257502647102|0',
  'meross-smart-wi-fi-plug-4-pack':'v1|318833457137|0',
  'secretlab-magnus-pro':'v1|398356707985|666610103624',
  'samsonite-c-lite-spinner-55cm':'v1|325743907402|0',
  'braun-series-7':'v1|198634307272|0',
  'steelcase-series-2':'v1|398386409465|0',
  'brother-mfc-j4440dw':'v1|136768624557|0'
});
function clean(value){return String(value==null?'':value).trim();}
function host(value){try{return new URL(clean(value)).hostname;}catch{return '';}}
function requestTarget(req){
  try{
    const url=new URL(req.url,'https://australianproductguide.au'),slug=clean(url.searchParams.get('slug'));
    if(!PRODUCT_MAP.has(slug)||!TARGETS[slug])return null;
    const candidates=Array.isArray(TARGETS[slug])?TARGETS[slug]:[TARGETS[slug]];
    const raw=clean(url.searchParams.get('candidate')),index=raw?Number(raw):0;
    if(!Number.isInteger(index)||index<0||index>=candidates.length)return null;
    return {slug,itemId:candidates[index],candidate:index,candidateCount:candidates.length};
  }catch{return null;}
}
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
  const target=requestTarget(req);if(!target)return res.status(400).json({ok:false,status:'invalid-target',version:VERSION});
  const {slug,itemId,candidate:targetIndex,candidateCount}=target,product=PRODUCT_MAP.get(slug);
  try{
    const detail=await ebay.getItem(itemId,{referenceId:`apg:${slug}:residual-diagnostic-v13-${targetIndex}`,timeoutMs:10000});
    const accepted=candidate(product,itemId,detail);
    const staged={status:'accept',accepted,review:null,candidates:[accepted],recommendationWeight:0};
    const family=familyGuard.applyToEnrichment(product,staged);
    const familyResult=family&&family.familyGuard?family.familyGuard:{version:familyGuard.VERSION,rejectedItemId:null,reason:null,suffix:null,marker:null};
    const exact=family&&family.status==='accept'&&family.accepted?exactGuard.evaluate(product,family,products,{now:Date.now()}):{eligible:false,reason:familyResult.reason||'family-variant-guard'};
    const text=detailsText(detail);
    return res.status(200).json({ok:true,version:VERSION,zeroMutation:true,slug,itemId,candidate:targetIndex,candidateCount,
      product:{brand:product.brand||null,name:product.name||null,model:product.model||null,category:product.category||null,modelTokens:enrichment.modelTokens(product),specModelValues:enrichment.specModelValues(product)},
      detail:{title:accepted.title,condition:accepted.condition,categoryPath:accepted.verificationEvidence.categoryPath,brands:accepted.verificationEvidence.brands,models:accepted.verificationEvidence.model,aspects:publicAspects(detail)},
      media:{imageUrl:accepted.imageUrl||null,imageHost:host(accepted.imageUrl)||null,imageSource:accepted.imageSource,itemWebUrl:accepted.itemWebUrl||null,itemWebHost:host(accepted.itemWebUrl)||null,itemEndDate:accepted.itemEndDate,price:accepted.price},
      checks:{listingAccessory:enrichment.listingLooksAccessory(accepted.title,product),listingUsed:enrichment.listingLooksUsed(accepted.title,accepted.condition),categoryRisk:enrichment.detailedCategoryRisk(detail),voltage:enrichment.regionalVoltageConflict(text),materialVariant:enrichment.materialVariantConflict(product,text),materialSuffix:enrichment.materialSuffixConflict(product,accepted.title),materialIdentity:enrichment.materialIdentityConflict(product,text),familyGuard:familyResult,exactGuard:exact}
    });
  }catch(error){return res.status(500).json({ok:false,status:'diagnostic-failed',version:VERSION,slug,itemId,candidate:targetIndex,candidateCount,code:clean(error&&error.code)||'EBAY_RESIDUAL_DIAGNOSTIC_ERROR'});}
};
module.exports.VERSION=VERSION;
module.exports.TARGETS=TARGETS;
