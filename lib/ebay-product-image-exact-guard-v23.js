'use strict';

// APG eBay product-image exact identity guard v2.5.
// Extends the conservative v2.4 named-product fallback for legitimate branded retail identities
// that do not expose a manufacturer-SKU-shaped model token (for example Tile Mate or Tile Pro).
// The fallback requires token-bounded brand evidence and either the exact maintained name phrase
// or complete distinctive-name coverage, rejects same-brand sibling collisions, and preserves every
// accessory, bundle, pack, condition, regional-voltage, URL, price and listing-state control in the
// base guard. Products with a usable model token remain governed by the stricter model path.
// v2.5 also rejects coloured identification tag/ring/cap accessory listings before any named-title
// fallback and preserves legitimate names such as Instant Pot Duo Plus where the product name is
// exact but an intervening feature phrase appears between the brand and model family in the title.

const base=require('./ebay-product-hero-exact-guard-v2');
const matcher=require('./ebay-catalogue-enrichment-v1');
const VERSION='2.5';
const MODEL_GATE_FAILURES=new Set(['no-product-model-token','structured-model-evidence-missing','insufficient-title-model-evidence','structured-model-evidence-mismatch','weak-model-evidence']);
const GENERIC_NAME_WORDS=new Set([
  'the','a','an','and','with','for','of','to','in','on','by','new','australia','au','series','model',
  'smart','wireless','portable','professional','premium','automatic','electric','digital','home'
]);
const EXTRA_ACCESSORY_TITLE_PATTERNS=[
  /\b(?:colou?r(?:ed)?\s+)?identification\s+(?:tags?|rings?|caps?)\b/i,
  /\bcolou?r(?:ed)?\s+(?:tags?|rings?|caps?)\s+for\b/i,
  /\b(?:microphone|mic)\s+(?:identification\s+)?(?:tags?|rings?|caps?)\b/i
];
function clean(value){return String(value==null?'':value).trim();}
function norm(value){return base.norm(value);}
function compact(value){return base.compact(value);}
function sameBrand(a,b){return compact(a&&a.brand)===compact(b&&b.brand);}
function phraseInTitle(title,phrase){
  const hay=` ${norm(title)} `,needle=norm(phrase);
  return Boolean(needle)&&hay.includes(` ${needle} `);
}
function extraAccessoryTitle(title){return EXTRA_ACCESSORY_TITLE_PATTERNS.some(pattern=>pattern.test(clean(title)));}
function brandlessName(product){
  const brandWords=norm(product&&product.brand).split(' ').filter(Boolean);
  const nameWords=norm(product&&product.name).split(' ').filter(Boolean);
  if(!brandWords.length)return nameWords.join(' ');
  const startsWithBrand=brandWords.every((word,index)=>nameWords[index]===word);
  const out=startsWithBrand?nameWords.slice(brandWords.length):nameWords;
  return out.join(' ').trim();
}
function meaningfulModelTokens(product){return matcher.modelTokens(product).filter(token=>!matcher.isFeatureDescriptorModel(token));}
function nameCoreWords(product){
  return brandlessName(product).split(' ').filter(word=>word&&!GENERIC_NAME_WORDS.has(word));
}
function nameCore(product){return nameCoreWords(product).join(' ').trim();}
function namedIdentityCheck(product,accepted,allProducts=[]){
  if(meaningfulModelTokens(product).length)return {ok:false,reason:'model-token-present'};
  const title=norm(accepted&&accepted.title),brand=norm(product&&product.brand),name=brandlessName(product),coreWords=nameCoreWords(product),core=coreWords.join(' ');
  if(!brand||!phraseInTitle(title,brand))return {ok:false,reason:'named-product-brand-missing'};
  if(!name||!coreWords.length)return {ok:false,reason:'named-product-identity-too-generic'};

  const exactBrandedPhrase=phraseInTitle(title,`${brand} ${name}`);
  const exactCorePhrase=phraseInTitle(title,core);
  const matched=coreWords.filter(word=>phraseInTitle(title,word));
  const coverage=matched.length/coreWords.length;
  const oneWordExact=coreWords.length===1&&coreWords[0].length>=3&&exactBrandedPhrase;
  const multiWordComplete=coreWords.length>=2&&coverage===1&&(
    exactBrandedPhrase||exactCorePhrase||coreWords.some(word=>/\d/.test(word))||coreWords.filter(word=>word.length>=4).length>=2
  );
  if(!oneWordExact&&!multiWordComplete){
    return {ok:false,reason:'named-product-full-name-missing',core,matched,coverage,exactBrandedPhrase,exactCorePhrase};
  }

  for(const sibling of Array.isArray(allProducts)?allProducts:[]){
    if(!sibling||sibling.slug===product.slug||!sameBrand(product,sibling))continue;
    const siblingName=brandlessName(sibling),siblingWords=nameCoreWords(sibling),siblingCore=siblingWords.join(' ');
    if(!siblingName||siblingName===name)continue;
    const fullSiblingPhrase=phraseInTitle(title,`${brand} ${siblingName}`);
    const siblingCorePresent=siblingWords.length===1&&siblingWords[0].length>=3&&phraseInTitle(title,siblingWords[0]);
    if(fullSiblingPhrase||siblingCorePresent){
      return {ok:false,reason:'named-product-sibling-collision',sibling:sibling.slug,siblingCore};
    }
  }
  return {ok:true,reason:'exact-named-product-title-evidence',core,matched,coverage,exactBrandedPhrase,exactCorePhrase};
}
function evaluate(product,row,allProducts=[],options={}){
  const accepted=row&&row.accepted;
  if(accepted&&extraAccessoryTitle(accepted.title))return {eligible:false,reason:'accessory-title',detail:{rule:'identification-tag-accessory'}};
  const ordinary=base.evaluate(product,row,allProducts,options);
  if(ordinary.eligible)return ordinary;
  const rawModels=matcher.modelTokens(product),meaningfulModels=meaningfulModelTokens(product);
  const pseudoOnly=rawModels.length>0&&meaningfulModels.length===0;
  if(ordinary.reason!=='no-product-model-token'&&!(pseudoOnly&&MODEL_GATE_FAILURES.has(ordinary.reason)))return ordinary;
  const named=namedIdentityCheck(product,accepted,allProducts);
  if(!named.ok)return {eligible:false,reason:named.reason,detail:named};
  // The base guard has already passed every check before its model gate. Re-run every safety
  // control after that gate so the named fallback cannot bypass sibling, URL, price or state checks.
  const sibling=base.siblingModelConflict(product,accepted,allProducts);
  if(sibling.conflict)return {eligible:false,reason:sibling.reason,detail:sibling};
  if(!accepted.legacyItemId||!accepted.itemId)return {eligible:false,reason:'missing-item-id'};
  if(!accepted.price||accepted.price.currency!=='AUD')return {eligible:false,reason:'non-aud-or-missing-price'};
  if(!base.exactEbayImage(accepted.imageUrl))return {eligible:false,reason:'unsupported-image-url'};
  if(!base.exactEbayItemUrl(accepted.itemWebUrl,accepted.legacyItemId))return {eligible:false,reason:'unsupported-item-url'};
  if(!base.activeListing(accepted,options.now==null?Date.now():options.now))return {eligible:false,reason:'ended-listing'};
  return {eligible:true,reason:'exact-current-ebay-au-named-product',model:named};
}
module.exports={VERSION,MODEL_GATE_FAILURES,GENERIC_NAME_WORDS,EXTRA_ACCESSORY_TITLE_PATTERNS,phraseInTitle,extraAccessoryTitle,brandlessName,meaningfulModelTokens,nameCoreWords,nameCore,namedIdentityCheck,evaluate};
