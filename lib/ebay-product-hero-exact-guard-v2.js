'use strict';

// APG eBay product hero exact-identity guard v2.1.
// Presentation-only safety layer. It deliberately accepts fewer listings than the wider
// eBay enrichment programme: a product hero is eligible only when current eBay detail proves
// the maintained product identity and no accessory, bundle, pack or sibling-model risk remains.
// Retailer participation and affiliate status contribute zero recommendation points.

const matcher=require('./ebay-catalogue-enrichment-v1');

const VERSION='2.1';

const ACCESSORY_TITLE_PATTERNS=[
  /\breplacement\b/i,/\bspare\b/i,/\bspares\b/i,/\bparts?\b/i,/\bcompatible\s+with\b/i,/\bfits?\b/i,
  /\baccessor(?:y|ies)\b/i,/\bbox\s+only\b/i,/\bempty\s+box\b/i,/\bmanual\s+only\b/i,
  /\bsilicone\b[^,;]{0,60}\bliner\b/i,/\bliner\s+for\b/i,/\boutlet\s+cover\b/i,
  /\bpower\s+port\b/i,/\bcharging\s+port\b/i,/\bcharging\s+socket\b/i,
  /\b(?:rubber|replacement)\b[^,;]{0,60}\bhandles?\b/i,/\bhandles?\s+for\b/i,
  /\b(?:cover|case|sleeve|insert|holder|rack|tray|basket|hose|brush|filter|bag|cable|adapter|adaptor|charger|battery|mount|bracket)\s+for\b/i,
  /\b(?:main|power|control)\s*board\b/i,/\bpcb\b/i,/\bhousing\s+for\b/i,/\bassembly\s+for\b/i,
  /\bmotor\s+for\b/i,/\bpump\s+for\b/i,/\blid\s+for\b/i,/\bdrip\s*tray\b/i,/\bgasket\b/i,/\bseal\s*kit\b/i,
  /\bportafilter\b/i,/\broller\s*brush\b/i,/\bside\s*brush\b/i,/\bmop\s*pads?\b/i,/\bdust\s*bags?\b/i,/\bdustbin\b/i
];

const ACCESSORY_CATEGORY_PATTERNS=[
  /\bparts?\b/i,/\baccessor(?:y|ies)\b/i,/\bcomponents?\b/i,/\breplacement\b/i,
  /\bpower\s+tool\s+batter(?:y|ies)\b/i,/\bsmall\s+kitchen\s+appliance\s+accessories\b/i
];

const BUNDLE_ACCESSORY_PATTERN=/(?:&|\+|\bwith\b|\bw\/)\s*(?:a\s+)?(?:chime|case|charger|charging\s+station|dock|battery|batteries|stand|bag|cover|filter|accessor(?:y|ies))\b/i;
const GENERIC_MODEL_PATTERN=/^(?:\d+(?:v|a|w|kw|wh|mah|gb|tb|hz|mp|ml|l|cm|mm|kg|g)|\d+(?:st|nd|rd|th)|\d+in\d+)$/i;

function clean(value){return String(value==null?'':value).trim();}
function norm(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function compact(value){return norm(value).replace(/\s+/g,'');}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function productIdentity(product){return [product&&product.brand,product&&product.model,product&&product.name,product&&product.slug].filter(Boolean).join(' ');}
function evidenceModels(accepted){
  const rows=accepted&&accepted.verificationEvidence&&Array.isArray(accepted.verificationEvidence.model)?accepted.verificationEvidence.model:[];
  return uniq(rows.map(clean).filter(Boolean));
}
function evidenceText(accepted){return [accepted&&accepted.title,...evidenceModels(accepted)].filter(Boolean).join(' ');}
function titleLooksAccessory(title){return ACCESSORY_TITLE_PATTERNS.some(pattern=>pattern.test(clean(title)));}
function categoryLooksAccessory(accepted){
  const path=clean(accepted&&accepted.verificationEvidence&&accepted.verificationEvidence.categoryPath);
  return Boolean(path)&&ACCESSORY_CATEGORY_PATTERNS.some(pattern=>pattern.test(path));
}
function compatibilityTargetConflict(product,title){
  const text=norm(title);
  if(!text)return false;
  const brand=norm(product&&product.brand);
  if(brand&&new RegExp(`\\bfor\\s+${brand.replace(/\s+/g,'\\s+')}\\b`,'i').test(text))return true;
  for(const model of matcher.modelTokens(product)){
    const token=norm(model);
    if(token&&new RegExp(`\\bfor\\s+${token.replace(/\s+/g,'\\s+')}\\b`,'i').test(text))return true;
  }
  return false;
}
function packCounts(text){
  const out=[];
  const re=/\b(\d+)\s*[- ]?(?:pack|pk)\b/ig;
  let match;
  while((match=re.exec(clean(text)))!==null){const n=Number(match[1]);if(Number.isFinite(n)&&n>1)out.push(n);}
  return uniq(out);
}
function packOrBundleConflict(product,title){
  const expected=packCounts(productIdentity(product));
  const observed=packCounts(title);
  if(observed.length&&!observed.some(value=>expected.includes(value)))return {conflict:true,reason:'unexpected-pack-count',observed,expected};
  const bundle=clean(title).match(BUNDLE_ACCESSORY_PATTERN);
  if(bundle){
    const accessory=norm(bundle[0].replace(/^(?:&|\+|with|w\/)\s*/i,''));
    if(accessory&&!norm(productIdentity(product)).includes(accessory))return {conflict:true,reason:'unexpected-bundle-accessory',accessory};
  }
  return {conflict:false};
}
function isSpecificModel(value){
  const token=compact(value);
  if(!token||token.length<3||GENERIC_MODEL_PATTERN.test(token)||/^\d+$/.test(token))return false;
  return /[a-z]/i.test(token)&&/\d/.test(token);
}
function modelEvidenceCompatible(expected,evidence){
  const expectedNorm=norm(expected);const evidenceNorm=norm(evidence);
  const a=compact(expected);const b=compact(evidence);
  if(!a||!b)return false;
  if(a===b)return true;
  if(expectedNorm&&evidenceNorm&&` ${evidenceNorm} `.includes(` ${expectedNorm} `))return true;
  if(!isSpecificModel(expected))return false;
  const index=b.indexOf(a);
  if(index<0)return false;
  const prefix=b.slice(0,index);const suffix=b.slice(index+a.length);
  // Permit common regional/colour/full-SKU extensions around a specific base model, while
  // deliberately rejecting one-character family mutations such as P110 -> P110M.
  if(prefix.length>1)return false;
  if(suffix.length===1)return false;
  return prefix.length<=1&&suffix.length>=2;
}
function titleModelCandidates(title){
  return uniq((clean(title).match(/[A-Za-z0-9]+(?:[-./][A-Za-z0-9]+)*/g)||[]).filter(token=>/\d/.test(token)));
}
function titleIdentityCoverage(product,title){
  const ids=matcher.identityTokens(product);
  if(!ids.length)return 1;
  const hay=` ${norm(title)} `;
  const hits=ids.filter(token=>hay.includes(` ${norm(token)} `));
  return hits.length/ids.length;
}
function titleSpecificModelCheck(product,accepted,expected){
  const specific=expected.filter(isSpecificModel);
  if(!specific.length)return {ok:false,reason:'structured-model-evidence-missing',expected,evidence:[]};
  const title=clean(accepted&&accepted.title);
  const candidates=titleModelCandidates(title);
  const matched=specific.filter(model=>candidates.some(value=>modelEvidenceCompatible(model,value)));
  const coverage=titleIdentityCoverage(product,title);
  const brandOk=Boolean(norm(product&&product.brand))&&norm(title).includes(norm(product&&product.brand));
  return matched.length&&brandOk&&coverage>=0.6
    ?{ok:true,reason:'specific-model-title-evidence',expected,evidence:[],matched,coverage}
    :{ok:false,reason:'insufficient-title-model-evidence',expected,evidence:[],matched,coverage};
}
function modelEvidenceCheck(product,accepted){
  const expected=matcher.modelTokens(product);
  const evidence=evidenceModels(accepted);
  if(!expected.length)return {ok:false,reason:'no-product-model-token',expected,evidence};
  const specific=expected.filter(isSpecificModel);
  if(!evidence.length)return titleSpecificModelCheck(product,accepted,expected);
  if(specific.length){
    const matched=specific.filter(model=>evidence.some(value=>modelEvidenceCompatible(model,value)));
    return matched.length?{ok:true,reason:'specific-model-evidence',expected,evidence,matched}:{ok:false,reason:'structured-model-evidence-mismatch',expected,evidence};
  }
  // Numeric-only model families can still be exact (for example Gerni 3600), but only when
  // structured model evidence contains that token and the listing strongly repeats the product identity.
  const title=clean(accepted&&accepted.title);
  const matched=expected.filter(model=>{
    const token=norm(model);
    return evidence.some(value=>new RegExp(`(?:^|\\s)${token.replace(/\s+/g,'\\s+')}(?:$|\\s)`,'i').test(norm(value)));
  });
  const coverage=titleIdentityCoverage(product,title);
  return matched.length&&coverage>=0.65?{ok:true,reason:'numeric-model-plus-identity-evidence',expected,evidence,matched,coverage}:{ok:false,reason:'weak-model-evidence',expected,evidence,coverage};
}
function sameBrand(a,b){return compact(a&&a.brand)===compact(b&&b.brand);}
function siblingModelConflict(product,accepted,allProducts){
  const current=compact(productIdentity(product));
  const hay=compact(evidenceText(accepted));
  if(!hay)return {conflict:false};
  for(const sibling of Array.isArray(allProducts)?allProducts:[]){
    if(!sibling||sibling.slug===product.slug||!sameBrand(product,sibling))continue;
    for(const model of matcher.modelTokens(sibling).filter(isSpecificModel)){
      const token=compact(model);
      if(token&&hay.includes(token)&&!current.includes(token))return {conflict:true,reason:'sibling-model-collision',sibling:sibling.slug,model};
    }
  }
  return {conflict:false};
}
function exactEbayImage(value){try{const u=new URL(clean(value));return u.protocol==='https:'&&u.hostname==='i.ebayimg.com';}catch{return false;}}
function exactEbayItemUrl(value,legacyItemId){
  try{
    const u=new URL(clean(value));
    if(u.protocol!=='https:'||u.hostname!=='www.ebay.com.au')return false;
    const id=String(legacyItemId||'').replace(/[^0-9]/g,'');
    return Boolean(id)&&new RegExp(`^/itm/(?:[^/]+/)?${id}(?:$|[/?])`,'i').test(u.pathname+u.search);
  }catch{return false;}
}
function activeListing(accepted,now=Date.now()){
  const raw=clean(accepted&&accepted.itemEndDate);
  if(!raw)return true;
  const end=Date.parse(raw);
  return !Number.isFinite(end)||end>Number(now);
}
function evaluate(product,row,allProducts=[],{now=Date.now()}={}){
  if(!product||!row||row.status!=='accept'||!row.accepted)return {eligible:false,reason:'not-accepted'};
  const accepted=row.accepted;
  if(accepted.detailVerified!==true||accepted.exactModel!==true)return {eligible:false,reason:'not-detail-verified-exact-model'};
  if(!['detail-model-evidence','detail-title-model'].includes(accepted.verificationLevel))return {eligible:false,reason:'unsupported-verification-level'};
  if(accepted.recommendationWeight!==0)return {eligible:false,reason:'commercial-weight-not-zero'};
  if(titleLooksAccessory(accepted.title)||compatibilityTargetConflict(product,accepted.title))return {eligible:false,reason:'accessory-title'};
  if(categoryLooksAccessory(accepted))return {eligible:false,reason:'accessory-category'};
  if(matcher.listingLooksUsed(accepted.title,accepted.condition))return {eligible:false,reason:'used-or-refurbished'};
  const identity=matcher.materialIdentityConflict(product,evidenceText(accepted));
  if(identity.conflict)return {eligible:false,reason:identity.reason};
  const pack=packOrBundleConflict(product,accepted.title);
  if(pack.conflict)return {eligible:false,reason:pack.reason,detail:pack};
  const model=modelEvidenceCheck(product,accepted);
  if(!model.ok)return {eligible:false,reason:model.reason,detail:model};
  const sibling=siblingModelConflict(product,accepted,allProducts);
  if(sibling.conflict)return {eligible:false,reason:sibling.reason,detail:sibling};
  if(!accepted.legacyItemId||!accepted.itemId)return {eligible:false,reason:'missing-item-id'};
  if(!accepted.price||accepted.price.currency!=='AUD')return {eligible:false,reason:'non-aud-or-missing-price'};
  if(!exactEbayImage(accepted.imageUrl))return {eligible:false,reason:'unsupported-image-url'};
  if(!exactEbayItemUrl(accepted.itemWebUrl,accepted.legacyItemId))return {eligible:false,reason:'unsupported-item-url'};
  if(!activeListing(accepted,now))return {eligible:false,reason:'ended-listing'};
  return {eligible:true,reason:'exact-current-ebay-au-product',model};
}

module.exports={
  VERSION,ACCESSORY_TITLE_PATTERNS,ACCESSORY_CATEGORY_PATTERNS,clean,norm,compact,productIdentity,evidenceModels,evidenceText,
  titleLooksAccessory,categoryLooksAccessory,compatibilityTargetConflict,packCounts,packOrBundleConflict,isSpecificModel,
  modelEvidenceCompatible,titleModelCandidates,titleIdentityCoverage,titleSpecificModelCheck,modelEvidenceCheck,siblingModelConflict,
  exactEbayImage,exactEbayItemUrl,activeListing,evaluate
};
