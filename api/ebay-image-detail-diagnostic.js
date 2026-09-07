'use strict';

// Read-only APG eBay image identity diagnostic v3.3.
// Re-fetches a bounded current recovery candidate from eBay and explains the product-identity checks.
// It accepts only maintained APG slugs, exposes no credentials, mutates no state, is noindex/no-store
// and is intended for operational diagnosis of review/recovery rows. Public RLS intentionally hides
// review/retired rows, so the allowlist below is deliberately item-bound; arbitrary item IDs cannot be
// supplied by callers. v3.3 switches Capsule 3 from the Laser D2426 sibling to a D2425 candidate and
// reports the same family-variant guard used by discovery before the exact-product guard.
const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');

const VERSION='3.3';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const REVIEW_ITEM_ALLOWLIST=Object.freeze({
  '8bitdo-ultimate-bluetooth-controller':'v1|306572868674|0',
  'amazon-echo-show-5-3rd-gen':'v1|147441885504|0',
  'amazon-eero-max-7':'v1|186261946765|0',
  'amazon-fire-tv-stick-4k-max':'v1|227490139598|0',
  'amazon-kindle-2024':'v1|406559263567|676848287658',
  'amazon-kindle-paperwhite-signature-edition-32gb':'v1|405405953301|0',
  'anker-nebula-capsule-3':'v1|405135099297|0',
  'apple-airtag-4-pack':'v1|225878033228|0',
  'apple-ipad-a16-128gb':'v1|198078800527|0',
  'asus-tuf-gaming-vg27aql3a':'v1|198472406133|0',
  'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad':'v1|357409305623|0',
  'bluetti-ac70':'v1|197052524484|0',
  'bluetti-b300k-expansion-battery':'v1|197285491272|0',
  'brita-style-xl-water-filter-jug':'v1|167417675280|0',
  'brother-mfc-j4440dw':'v1|304362314780|0',
  'corsair-k70-core-tkl':'v1|237000834483|0',
  'delonghi-pinguino-pac-el112-cst-wifi':'v1|186095657655|0',
  'delonghi-pinguino-pac-em82k':'v1|176564089771|0',
  'dometic-cfx3-35-portable-fridge-freezer':'v1|133927138348|0',
  'dyson-purifier-cool-pc1':'v1|157410032476|0',
  'dyson-v11-advanced':'v1|206499671442|0',
  'dyson-v15s-detect-submarine-complete':'v1|397193821428|0',
  'ecovacs-deebot-n20-plus':'v1|297862987247|0',
  'ecovacs-deebot-x11-pro-omni':'v1|800585642324|0',
  'elgato-facecam-mk-2':'v1|176622504786|0',
  'esr-qi2-3-in-1-travel-wireless-charging-set':'v1|187982851827|0',
  'eufy-baby-monitor-e210-spaceview-pro':'v1|137001120210|0',
  'garmin-forerunner-55':'v1|297717183369|0',
  'insta360-x4':'v1|198452008292|0',
  'insta360-x5':'v1|198449654446|0',
  'kuvings-evo820-whole-slow-juicer':'v1|205026851618|0',
  'marshall-monitor-iii-anc':'v1|236589531774|0',
  'microsoft-surface-laptop-7-copilot-pc-138-inch-16gb512gb':'v1|287133106059|0',
  'miofive-s1':'v1|267234025630|0',
  'nanoleaf-essentials-matter-smart-bulb-a60-e27':'v1|407177671136|0',
  'panasonic-sd-r2530-bread-maker':'v1|306811553407|0',
  'petlibro-air-smart-feeder':'v1|178305267841|0',
  'razer-barracuda-x-chroma':'v1|158081024110|0',
  'reolink-argus-3-ultra':'v1|267311852224|0',
  'samsung-galaxy-smarttag2':'v1|296082302198|594211313158',
  'samsung-s90h-55-inch-oled-qa55s90hawxxy':'v1|157833306462|0',
  'scansnap-ix1600-document-scanner':'v1|317091016301|0',
  'schwinn-ic4-indoor-cycling-bike':'v1|325276699162|514160083369',
  'shure-mv7':'v1|278033991168|0',
  'tp-link-tapo-p110':'v1|377252921299|0',
  'ugreen-revodok-107-usb-c-hub':'v1|155156040414|0',
  'ugreen-revodok-1071-usb-c-hub':'v1|206420487515|0',
  'ugreen-revodok-pro-106-usb-c-hub':'v1|257508731976|0',
  'valve-steam-deck-oled-512gb':'v1|197081233368|0',
  'zerowater-12-cup-ready-pour-water-filter-jug':'v1|327253623318|0'
});
function clean(value){return String(value==null?'':value).trim();}
function host(value){try{return new URL(clean(value)).hostname;}catch{return '';}}
function safeSlug(req){try{const slug=clean(new URL(req.url,'https://australianproductguide.au').searchParams.get('slug'));return PRODUCT_MAP.has(slug)?slug:'';}catch{return '';}}
function detailsText(detail){const aspects=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[];return `${clean(detail&&detail.title)} ${aspects.map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' ')}`.trim();}
function publicAspects(detail){return (Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[]).slice(0,120).map(row=>({name:clean(row&&row.name),value:clean(row&&row.value)})).filter(row=>row.name||row.value);}
function diagnosticState(slug,state){
  const forcedItemId=REVIEW_ITEM_ALLOWLIST[slug];
  if(forcedItemId)return {slug,status:state&&state.status||'review',item_id:forcedItemId,legacy_item_id:forcedItemId.split('|')[1]||'',title:state&&state.title||'',recovery_required:true,last_error_code:state&&state.last_error_code||'BOUNDED_RECOVERY_DIAGNOSTIC'};
  if(state&&state.item_id)return state;
  return null;
}
function candidateFrom(state,detail){
  const mapping=continuity.stateToMapping(state)||{};
  return {
    itemId:clean(detail&&detail.itemId)||mapping.itemId||clean(state&&state.item_id),
    legacyItemId:clean(detail&&detail.legacyItemId)||mapping.legacyItemId||clean(state&&state.legacy_item_id),
    title:clean(detail&&detail.title)||mapping.title,
    condition:clean(detail&&detail.condition)||mapping.condition,
    price:detail&&detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:mapping.price,
    imageUrl:clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl)||mapping.imageUrl,
    imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
    itemWebUrl:clean(detail&&detail.itemWebUrl)||mapping.itemWebUrl,
    itemAffiliateWebUrl:clean(detail&&detail.itemAffiliateWebUrl)||mapping.itemAffiliateWebUrl||null,
    itemEndDate:clean(detail&&detail.itemEndDate)||clean(mapping.itemEndDate)||null,
    score:mapping.matchScore,
    reasons:mapping.matchReasons||[],
    flags:mapping.matchFlags||[],
    exactModel:true,
    detailVerified:true,
    verificationLevel:(enrichment.detailedModelEvidence(detail).length?'detail-model-evidence':'detail-title-model'),
    verificationEvidence:{brands:enrichment.detailedBrandEvidence(detail),model:enrichment.detailedModelEvidence(detail),categoryPath:clean(detail&&detail.categoryPath)||null},
    recommendationWeight:0
  };
}
async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,status:'method-not-allowed',version:VERSION});}
  const slug=safeSlug(req);if(!slug)return res.status(400).json({ok:false,status:'invalid-slug',version:VERSION});
  try{
    const product=PRODUCT_MAP.get(slug);
    const state=diagnosticState(slug,await supabase.imageState(slug,{timeoutMs:3000}));
    if(!state||!state.item_id)return res.status(404).json({ok:false,status:'no-image-state',version:VERSION,slug});
    const detail=await ebay.getItem(clean(state.item_id),{referenceId:`apg:${slug}:image-diagnostic-v33`,timeoutMs:10000});
    const text=detailsText(detail);
    const candidate=candidateFrom(state,detail);
    const staged={status:'accept',accepted:candidate,review:null,candidates:[candidate],recommendationWeight:0};
    const familyChecked=familyGuard.applyToEnrichment(product,staged);
    const familyResult=familyChecked&&familyChecked.familyGuard?familyChecked.familyGuard:{version:familyGuard.VERSION,rejectedItemId:null,reason:null,suffix:null,marker:null};
    const guard=familyChecked&&familyChecked.status==='accept'&&familyChecked.accepted
      ?exactGuard.evaluate(product,familyChecked,products,{now:Date.now()})
      :{eligible:false,reason:familyResult.reason||'family-variant-guard'};
    return res.status(200).json({
      ok:true,version:VERSION,slug,zeroMutation:true,
      product:{brand:product.brand||null,name:product.name||null,model:product.model||null,category:product.category||null,modelTokens:enrichment.modelTokens(product),specModelValues:enrichment.specModelValues(product)},
      state:{status:clean(state.status),recoveryRequired:state.recovery_required===true,lastErrorCode:clean(state.last_error_code)||null,itemId:clean(state.item_id),legacyItemId:clean(state.legacy_item_id),storedTitle:clean(state.title)},
      detail:{title:clean(detail&&detail.title),condition:clean(detail&&detail.condition),categoryPath:clean(detail&&detail.categoryPath)||null,brands:enrichment.detailedBrandEvidence(detail),models:enrichment.detailedModelEvidence(detail),aspects:publicAspects(detail)},
      media:{imageUrl:candidate.imageUrl||null,imageHost:host(candidate.imageUrl)||null,imageSource:candidate.imageSource||null,itemWebUrl:candidate.itemWebUrl||null,itemWebHost:host(candidate.itemWebUrl)||null,itemEndDate:candidate.itemEndDate||null,price:candidate.price||null},
      checks:{
        listingAccessory:enrichment.listingLooksAccessory(candidate.title,product),
        listingUsed:enrichment.listingLooksUsed(candidate.title,candidate.condition),
        categoryRisk:enrichment.detailedCategoryRisk(detail),
        voltage:enrichment.regionalVoltageConflict(text),
        materialVariant:enrichment.materialVariantConflict(product,text),
        materialSuffix:enrichment.materialSuffixConflict(product,candidate.title),
        materialIdentity:enrichment.materialIdentityConflict(product,text),
        familyGuard:familyResult,
        exactGuard:guard
      }
    });
  }catch(error){
    return res.status(500).json({ok:false,status:'diagnostic-failed',version:VERSION,slug,code:clean(error&&error.code)||'EBAY_IMAGE_DETAIL_DIAGNOSTIC_ERROR'});
  }
}
module.exports=handler;
module.exports.VERSION=VERSION;
module.exports.REVIEW_ITEM_ALLOWLIST=REVIEW_ITEM_ALLOWLIST;
