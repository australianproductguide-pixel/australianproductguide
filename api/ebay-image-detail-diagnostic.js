'use strict';

// Read-only APG eBay image identity diagnostic v1.0.
// Re-fetches the current governed item from eBay and explains the exact product-identity checks.
// It accepts only maintained APG slugs, exposes no credentials, mutates no state, is noindex/no-store
// and is intended for bounded operational diagnosis of review/recovery rows.
const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');

const VERSION='1.0';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
function clean(value){return String(value==null?'':value).trim();}
function safeSlug(req){try{const slug=clean(new URL(req.url,'https://australianproductguide.au').searchParams.get('slug'));return PRODUCT_MAP.has(slug)?slug:'';}catch{return '';}}
function detailsText(detail){const aspects=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[];return `${clean(detail&&detail.title)} ${aspects.map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' ')}`.trim();}
function publicAspects(detail){return (Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[]).slice(0,120).map(row=>({name:clean(row&&row.name),value:clean(row&&row.value)})).filter(row=>row.name||row.value);}
function candidateFrom(state,detail){
  const mapping=continuity.stateToMapping(state)||{};
  return {
    itemId:clean(detail&&detail.itemId)||mapping.itemId,
    legacyItemId:clean(detail&&detail.legacyItemId)||mapping.legacyItemId,
    title:clean(detail&&detail.title)||mapping.title,
    condition:clean(detail&&detail.condition)||mapping.condition,
    price:detail&&detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:mapping.price,
    imageUrl:clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl)||mapping.imageUrl,
    imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
    itemWebUrl:clean(detail&&detail.itemWebUrl)||mapping.itemWebUrl,
    itemAffiliateWebUrl:clean(detail&&detail.itemAffiliateWebUrl)||mapping.itemAffiliateWebUrl||null,
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
    const state=await supabase.imageState(slug,{timeoutMs:3000});
    if(!state||!state.item_id)return res.status(404).json({ok:false,status:'no-image-state',version:VERSION,slug});
    const detail=await ebay.getItem(clean(state.item_id),{referenceId:`apg:${slug}:image-diagnostic-v1`,timeoutMs:10000});
    const text=detailsText(detail);
    const candidate=candidateFrom(state,detail);
    const staged={status:'accept',accepted:candidate,review:null,candidates:[candidate],recommendationWeight:0};
    const guard=exactGuard.evaluate(product,staged,products,{now:Date.now()});
    return res.status(200).json({
      ok:true,version:VERSION,slug,zeroMutation:true,
      product:{brand:product.brand||null,name:product.name||null,model:product.model||null,category:product.category||null,modelTokens:enrichment.modelTokens(product),specModelValues:enrichment.specModelValues(product)},
      state:{status:clean(state.status),recoveryRequired:state.recovery_required===true,lastErrorCode:clean(state.last_error_code)||null,itemId:clean(state.item_id),legacyItemId:clean(state.legacy_item_id),storedTitle:clean(state.title)},
      detail:{title:clean(detail&&detail.title),condition:clean(detail&&detail.condition),categoryPath:clean(detail&&detail.categoryPath)||null,brands:enrichment.detailedBrandEvidence(detail),models:enrichment.detailedModelEvidence(detail),aspects:publicAspects(detail)},
      checks:{
        listingAccessory:enrichment.listingLooksAccessory(candidate.title,product),
        listingUsed:enrichment.listingLooksUsed(candidate.title,candidate.condition),
        categoryRisk:enrichment.detailedCategoryRisk(detail),
        voltage:enrichment.regionalVoltageConflict(text),
        materialVariant:enrichment.materialVariantConflict(product,text),
        materialSuffix:enrichment.materialSuffixConflict(product,candidate.title),
        materialIdentity:enrichment.materialIdentityConflict(product,text),
        exactGuard:guard
      }
    });
  }catch(error){
    return res.status(500).json({ok:false,status:'diagnostic-failed',version:VERSION,slug,code:clean(error&&error.code)||'EBAY_IMAGE_DETAIL_DIAGNOSTIC_ERROR'});
  }
}
module.exports=handler;
module.exports.VERSION=VERSION;
