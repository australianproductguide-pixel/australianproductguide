'use strict';

// APG eBay product-image exact identity guard v2.3.
// Extends the conservative v2.2 guard only for maintained products that have no usable
// alphanumeric model token. Many legitimate retail identities (for example "Venu 4" or
// "Gold Styler") are exact named products rather than manufacturer-SKU-shaped names.
// The fallback requires the maintained brand and full normalised product-name phrase in the
// detailed eBay title, rejects same-brand sibling-name collisions, and preserves every other
// v2.2 safety control. It does not relax products that already have a usable model token.

const base=require('./ebay-product-hero-exact-guard-v2');
const matcher=require('./ebay-catalogue-enrichment-v1');
const VERSION='2.3';
const GENERIC_NAME_WORDS=new Set(['the','a','an','and','with','for','of','to','in','on','by','new','australia','au','series','model','smart','wireless','portable','professional','premium','automatic','electric','digital','home']);
function clean(value){return String(value==null?'':value).trim();}
function norm(value){return base.norm(value);}
function compact(value){return base.compact(value);}
function sameBrand(a,b){return compact(a&&a.brand)===compact(b&&b.brand);}
function nameCore(product){
  const brand=norm(product&&product.brand);
  const words=norm(product&&product.name).split(' ').filter(Boolean);
  const stripped=words.filter(word=>word!==brand&&!GENERIC_NAME_WORDS.has(word));
  return stripped.join(' ').trim();
}
function namedIdentityCheck(product,accepted,allProducts=[]){
  if(matcher.modelTokens(product).length)return {ok:false,reason:'model-token-present'};
  const title=norm(accepted&&accepted.title),brand=norm(product&&product.brand),core=nameCore(product);
  const coreWords=core.split(' ').filter(Boolean);
  if(!brand||!title.includes(brand))return {ok:false,reason:'named-product-brand-missing'};
  if(!core||core.length<5||(!coreWords.some(word=>/\d/.test(word))&&coreWords.length<2))return {ok:false,reason:'named-product-identity-too-generic'};
  if(!` ${title} `.includes(` ${core} `))return {ok:false,reason:'named-product-full-name-missing',core};
  for(const sibling of Array.isArray(allProducts)?allProducts:[]){
    if(!sibling||sibling.slug===product.slug||!sameBrand(product,sibling))continue;
    const siblingCore=nameCore(sibling);
    if(!siblingCore||siblingCore===core||siblingCore.length<5)continue;
    if(` ${title} `.includes(` ${siblingCore} `))return {ok:false,reason:'named-product-sibling-collision',sibling:sibling.slug};
  }
  return {ok:true,reason:'exact-named-product-title-evidence',core};
}
function evaluate(product,row,allProducts=[],options={}){
  const ordinary=base.evaluate(product,row,allProducts,options);
  if(ordinary.eligible||ordinary.reason!=='no-product-model-token')return ordinary;
  const accepted=row&&row.accepted;
  const named=namedIdentityCheck(product,accepted,allProducts);
  if(!named.ok)return {eligible:false,reason:named.reason,detail:named};
  // v2.2 has already passed all checks before model evidence. Re-run every safety check that
  // occurs after its model gate so the fallback cannot bypass sibling, URL, price or listing state.
  const sibling=base.siblingModelConflict(product,accepted,allProducts);
  if(sibling.conflict)return {eligible:false,reason:sibling.reason,detail:sibling};
  if(!accepted.legacyItemId||!accepted.itemId)return {eligible:false,reason:'missing-item-id'};
  if(!accepted.price||accepted.price.currency!=='AUD')return {eligible:false,reason:'non-aud-or-missing-price'};
  if(!base.exactEbayImage(accepted.imageUrl))return {eligible:false,reason:'unsupported-image-url'};
  if(!base.exactEbayItemUrl(accepted.itemWebUrl,accepted.legacyItemId))return {eligible:false,reason:'unsupported-item-url'};
  if(!base.activeListing(accepted,options.now==null?Date.now():options.now))return {eligible:false,reason:'ended-listing'};
  return {eligible:true,reason:'exact-current-ebay-au-named-product',model:named};
}
module.exports={VERSION,nameCore,namedIdentityCheck,evaluate};
