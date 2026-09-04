'use strict';

// APG eBay product-image exact identity guard v2.8.
// Extends the conservative v2.7 guard for APG categories whose legitimate whole products are
// commonly classified beneath marketplace parent categories named "Accessories". The override is
// explicit by APG category and expected terminal leaf only, then the complete base exact-product
// guard is re-run. A leaf that is itself Parts, Accessories, Components, Replacement or Spares
// remains rejected. Title/model/sibling/bundle/pack/voltage/condition/URL/AUD-price/state checks
// remain unchanged and recommendation weight remains zero.

const base=require('./ebay-product-hero-exact-guard-v2');
const matcher=require('./ebay-catalogue-enrichment-v1');
const VERSION='2.8';
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
const BUNDLE_COMPONENT_RULES=Object.freeze([
  {key:'solar-panel',component:/\bsolar\s+panels?\b/i,addition:/\b(?:with|plus|and|incl(?:udes?|uding)?|\+)\s+(?:an?\s+)?(?:\d+w\s+)?solar\s+panels?\b/i},
  {key:'memory-card',component:/\b(?:micro\s*)?sd\s+cards?|memory\s+cards?\b/i,addition:/\b(?:with|plus|and|incl(?:udes?|uding)?|\+)\s+(?:an?\s+)?(?:\d+\s*(?:gb|tb)\s+)?(?:micro\s*)?sd\s+cards?\b/i},
  {key:'protective-case',component:/\b(?:protective|carry|carrying|travel)\s+cases?\b/i,addition:/\b(?:with|plus|and|incl(?:udes?|uding)?|\+)\s+(?:an?\s+)?(?:protective|carry|carrying|travel)\s+cases?\b/i},
  {key:'extra-battery',component:/\b(?:extra|spare|second|additional)\s+batter(?:y|ies)\b/i,addition:/\b(?:with|plus|and|incl(?:udes?|uding)?|\+)\s+(?:an?\s+)?(?:extra|spare|second|additional)\s+batter(?:y|ies)\b/i}
]);
const ACCESSORY_PARENT_WHOLE_PRODUCT_LEAVES=Object.freeze({
  'dash-cameras':[/\bdash\s*cams?\b/i,/\bdashboard\s*cameras?\b/i],
  'webcams':[/\bwebcams?\b/i],
  'power-banks':[/\bpower\s*banks?\b/i,/\bportable\s+power\s+banks?\b/i,/\bchargers?\s*&\s*cradles?\b/i],
  'usb-c-chargers':[/\busb[- ]?c\s+chargers?\b/i,/\bwall\s+chargers?\b/i,/^chargers?$/i,/\bchargers?\s*&\s*cradles?\b/i],
  'wireless-chargers':[/\bwireless\s+chargers?\b/i,/\bcharging\s+(?:pads?|stands?|stations?)\b/i,/^chargers?$/i,/\bchargers?\s*&\s*cradles?\b/i],
  'car-jump-starters':[/\bjump\s*starters?\b/i],
  'tyre-inflators':[/\btyre\s*inflators?\b/i,/\btire\s*inflators?\b/i],
  'bluetooth-trackers':[/\b(?:bluetooth|item|smart)\s*trackers?\b/i,/\bsmart\s*tags?\b/i],
  'gaming-headsets':[/\bgaming\s+headsets?\b/i,/^headsets?$/i],
  'gaming-controllers':[/\bgaming\s+controllers?\b/i,/^controllers?$/i,/\bgamepads?\b/i],
  'mechanical-keyboards':[/\bmechanical\s+keyboards?\b/i,/\bkeyboards?\s*&\s*keypads?\b/i,/^keyboards?$/i],
  'computer-mice':[/\bcomputer\s+mice\b/i,/\bmice\s*&\s*trackballs?\b/i,/^mice$/i,/^mouse$/i],
  'earbuds':[/\bearbuds?\b/i,/\bin[- ]ear\s+headphones?\b/i],
  'wireless-headphones':[/\bwireless\s+headphones?\b/i,/^headphones?$/i],
  'smartwatches':[/\bsmart\s*watches?\b/i,/^smartwatches?$/i],
  'fitness-trackers':[/\bactivity\s+trackers?\b/i,/\bfitness\s+trackers?\b/i],
  'external-ssds':[/\bsolid\s+state\s+drives?\b/i,/\bexternal\s+(?:solid\s+state\s+)?drives?\b/i]
});
const UNSAFE_ACCESSORY_LEAF=/\b(?:parts?|accessor(?:y|ies)|components?|replacement|spares?)\b/i;
function clean(value){return String(value==null?'':value).trim();}
function norm(value){return base.norm(value);}
function compact(value){return base.compact(value);}
function sameBrand(a,b){return compact(a&&a.brand)===compact(b&&b.brand);}
function phraseInTitle(title,phrase){
  const hay=` ${norm(title)} `,needle=norm(phrase);
  return Boolean(needle)&&hay.includes(` ${needle} `);
}
function extraAccessoryTitle(title){return EXTRA_ACCESSORY_TITLE_PATTERNS.some(pattern=>pattern.test(clean(title)));}
function unexpectedBundleComponent(product,title){
  const listing=clean(title),identity=clean([product&&product.model,product&&product.name,product&&product.slug].filter(Boolean).join(' '));
  for(const rule of BUNDLE_COMPONENT_RULES){
    if(rule.addition.test(listing)&&!rule.component.test(identity))return {conflict:true,reason:`unexpected-bundle-component:${rule.key}`,component:rule.key};
  }
  return {conflict:false};
}
function categoryPath(accepted){return clean(accepted&&accepted.verificationEvidence&&accepted.verificationEvidence.categoryPath);}
function categoryLeaf(accepted){
  const path=categoryPath(accepted);
  if(!path)return '';
  const parts=path.split(/[>|]/).map(clean).filter(Boolean);
  return parts.length?parts[parts.length-1]:path;
}
function accessoryParentWholeProductOverride(product,accepted){
  const path=categoryPath(accepted),leaf=categoryLeaf(accepted);
  if(!path||!leaf||UNSAFE_ACCESSORY_LEAF.test(leaf)||!base.categoryLooksAccessory(accepted))return {ok:false};
  const rules=ACCESSORY_PARENT_WHOLE_PRODUCT_LEAVES[clean(product&&product.category)]||[];
  if(!rules.some(pattern=>pattern.test(leaf)))return {ok:false};
  const verificationEvidence={...(accepted&&accepted.verificationEvidence||{}),categoryPath:leaf};
  return {ok:true,path,leaf,accepted:{...accepted,verificationEvidence}};
}
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
  let accepted=row&&row.accepted;
  if(accepted&&extraAccessoryTitle(accepted.title))return {eligible:false,reason:'accessory-title',detail:{rule:'identification-tag-accessory'}};
  if(accepted){
    const bundle=unexpectedBundleComponent(product,accepted.title);
    if(bundle.conflict)return {eligible:false,reason:bundle.reason,detail:bundle};
    const suffix=matcher.materialSuffixConflict(product,accepted.title);
    if(suffix.conflict)return {eligible:false,reason:`material-model-suffix-mismatch:${suffix.suffix}`,detail:suffix};
  }
  let ordinary=base.evaluate(product,row,allProducts,options);
  if(ordinary.eligible)return ordinary;

  if(ordinary.reason==='accessory-category'&&accepted){
    const override=accessoryParentWholeProductOverride(product,accepted);
    if(override.ok){
      accepted=override.accepted;
      const adjusted={...row,accepted};
      ordinary=base.evaluate(product,adjusted,allProducts,options);
      if(ordinary.eligible)return {...ordinary,reason:'exact-current-ebay-au-product-accessory-parent-category',categoryOverride:{path:override.path,leaf:override.leaf}};
      row=adjusted;
    }
  }

  const rawModels=matcher.modelTokens(product),meaningfulModels=meaningfulModelTokens(product);
  const pseudoOnly=rawModels.length>0&&meaningfulModels.length===0;
  if(ordinary.reason!=='no-product-model-token'&&!(pseudoOnly&&MODEL_GATE_FAILURES.has(ordinary.reason)))return ordinary;
  const named=namedIdentityCheck(product,accepted,allProducts);
  if(!named.ok)return {eligible:false,reason:named.reason,detail:named};
  const sibling=base.siblingModelConflict(product,accepted,allProducts);
  if(sibling.conflict)return {eligible:false,reason:sibling.reason,detail:sibling};
  if(!accepted.legacyItemId||!accepted.itemId)return {eligible:false,reason:'missing-item-id'};
  if(!accepted.price||accepted.price.currency!=='AUD')return {eligible:false,reason:'non-aud-or-missing-price'};
  if(!base.exactEbayImage(accepted.imageUrl))return {eligible:false,reason:'unsupported-image-url'};
  if(!base.exactEbayItemUrl(accepted.itemWebUrl,accepted.legacyItemId))return {eligible:false,reason:'unsupported-item-url'};
  if(!base.activeListing(accepted,options.now==null?Date.now():options.now))return {eligible:false,reason:'ended-listing'};
  return {eligible:true,reason:'exact-current-ebay-au-named-product',model:named};
}
module.exports={VERSION,MODEL_GATE_FAILURES,GENERIC_NAME_WORDS,EXTRA_ACCESSORY_TITLE_PATTERNS,BUNDLE_COMPONENT_RULES,ACCESSORY_PARENT_WHOLE_PRODUCT_LEAVES,UNSAFE_ACCESSORY_LEAF,phraseInTitle,extraAccessoryTitle,unexpectedBundleComponent,categoryPath,categoryLeaf,accessoryParentWholeProductOverride,brandlessName,meaningfulModelTokens,nameCoreWords,nameCore,namedIdentityCheck,evaluate};
