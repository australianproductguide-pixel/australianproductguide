'use strict';

// APG eBay image search plan v1.6
// Broadens discovery recall without weakening exact-product acceptance. Search breadth and
// acceptance are deliberately separate: these plans may retrieve more candidates, but every
// candidate must still pass the existing whole-product, model/family/variant, condition,
// Australian-market and independent second-pass controls before it can become public.
// v1.6 corrects the Anker 547 retrieval identity to the Australian A8371 model, adds its exact
// Anker Official Store eBay AU UPC, and adds evidence-backed Brother/Canon identifiers for two
// stubborn home-printer residuals. Identifiers improve retrieval only; they never bypass guards.
const matcher=require('./ebay-catalogue-enrichment-v1');

const VERSION='1.6';
const MAX_QUERIES=4;
const SEARCH_LIMIT=50;
const NEW_CONDITION_FILTER='conditions:{NEW}';

// Verified from current public eBay Australia product entities on 4 Sep 2026.
// Keep this intentionally small and evidence-bound; never infer or guess ePIDs.
const VERIFIED_EBAY_EPIDS=Object.freeze({
  'noco-boost-plus-gb40':'3017023008',
  'corsair-hs55-stereo':'22060536945',
  'jbl-flip-7':'4085773786',
  'brother-mfc-j4440dw':'20048317709'
});

// Exact product identifiers independently verified from Australian manufacturer, official-brand
// marketplace or reputable Australian retailer evidence on 4 Sep 2026. They are retrieval aliases
// only and therefore do not alter APG's maintained product identity or bypass any acceptance guard.
const VERIFIED_SEARCH_ALIASES=Object.freeze({
  'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad':['WIA011'],
  'ugreen-nexode-power-bank-12000mah-100w':['35526'],
  'noco-boost-hd-gb70':['046221150056'],
  'anker-547-usb-c-hub-7-in-2':['A8371','194644118723'],
  'canon-pixma-ts7760':['4549292221350']
});

const CATEGORY_HINTS=Object.freeze({
  'action-cameras':['action camera'],
  'air-fryers':['air fryer'],
  'air-purifiers':['air purifier'],
  'automatic-pet-feeders':['automatic pet feeder'],
  'baby-monitors':['baby monitor'],
  'beard-trimmers':['beard trimmer'],
  'blenders':['blender'],
  'bluetooth-speakers':['bluetooth speaker'],
  'bluetooth-trackers':['bluetooth tracker','item tracker'],
  'car-jump-starters':['jump starter'],
  'coffee-grinders':['coffee grinder'],
  'coffee-machines':['coffee machine','espresso machine'],
  'computer-mice':['computer mouse'],
  'computer-monitors':['computer monitor'],
  'cordless-drills':['cordless drill'],
  'dash-cameras':['dash camera'],
  'dishwashers':['dishwasher'],
  'document-scanners':['document scanner'],
  'e-readers':['ereader'],
  'earbuds':['earbuds'],
  'electric-kettles':['electric kettle'],
  'electric-shavers':['electric shaver'],
  'electric-toothbrushes':['electric toothbrush'],
  'external-ssds':['portable ssd','external ssd'],
  'fitness-trackers':['fitness tracker'],
  'food-processors':['food processor'],
  'fridges':['fridge','refrigerator'],
  'gaming-controllers':['gaming controller','controller'],
  'gaming-headsets':['gaming headset'],
  'gaming-monitors':['gaming monitor'],
  'garment-steamers':['garment steamer'],
  'hair-dryers':['hair dryer'],
  'hair-straighteners':['hair straightener'],
  'home-fitness-equipment':['fitness equipment'],
  'home-printers':['printer'],
  'home-security-cameras':['security camera'],
  'ice-cream-makers':['ice cream maker'],
  'instant-cameras':['instant camera'],
  'juicers':['juicer'],
  'kitchen-mixers':['stand mixer'],
  'laptops':['laptop'],
  'luggage':['luggage','suitcase'],
  'massage-guns':['massage gun'],
  'mechanical-keyboards':['mechanical keyboard','keyboard'],
  'mesh-wifi-systems':['mesh wifi system'],
  'microphones':['microphone'],
  'microwave-ovens':['microwave oven'],
  'multicookers':['multicooker','pressure cooker'],
  'office-chairs':['office chair'],
  'pet-water-fountains':['pet water fountain'],
  'photo-printers':['photo printer'],
  'pizza-ovens':['pizza oven'],
  'portable-air-conditioners':['portable air conditioner'],
  'portable-fridges':['portable fridge'],
  'portable-monitors':['portable monitor'],
  'portable-power-stations':['portable power station'],
  'power-banks':['power bank'],
  'pressure-washers':['pressure washer'],
  'projectors':['projector'],
  'rice-cookers':['rice cooker'],
  'robot-vacuums':['robot vacuum'],
  'slow-cookers':['slow cooker'],
  'smart-displays':['smart display'],
  'smart-doorbells':['smart doorbell'],
  'smart-light-bulbs':['smart light bulb'],
  'smart-plugs':['smart plug'],
  'smart-scales':['smart scale','body composition scale'],
  'smartphones':['smartphone'],
  'smartwatches':['smartwatch'],
  'soundbars':['soundbar'],
  'standing-desks':['standing desk'],
  'stick-vacuums':['stick vacuum'],
  'streaming-devices':['streaming device'],
  'tablets':['tablet'],
  'televisions':['television','tv'],
  'toasters':['toaster'],
  'tyre-inflators':['tyre inflator'],
  'usb-c-chargers':['usb c charger'],
  'usb-c-hubs-docks':['usb c hub'],
  'vacuum-sealers':['vacuum sealer'],
  'washing-machines':['washing machine'],
  'water-filters':['water filter'],
  'water-flossers':['water flosser'],
  'webcams':['webcam'],
  'wifi-routers':['wifi router'],
  'wireless-chargers':['wireless charger'],
  'wireless-headphones':['wireless headphones']
});

function clean(value){return String(value==null?'':value).trim();}
function norm(value){return matcher.norm(value);}
function compact(value){return matcher.compact(value);}
function uniq(values){
  const out=[];const seen=new Set();
  for(const value of values||[]){const text=clean(value);const key=norm(text);if(!text||!key||seen.has(key))continue;seen.add(key);out.push(text);}
  return out;
}
function words(value){return clean(value).split(/\s+/).filter(Boolean);}
function brandlessName(product){
  const brandWords=norm(product&&product.brand).split(' ').filter(Boolean);
  const source=words(product&&product.name);
  if(!brandWords.length)return source.join(' ');
  const normalised=source.map(norm);
  const startsWithBrand=brandWords.every((word,index)=>normalised[index]===word);
  return clean((startsWithBrand?source.slice(brandWords.length):source).join(' '));
}
function stripBrandPrefix(product,value){
  const source=words(value),brandWords=norm(product&&product.brand).split(' ').filter(Boolean);
  if(!source.length||!brandWords.length)return clean(value);
  const normalised=source.map(norm);
  const startsWithBrand=brandWords.every((word,index)=>normalised[index]===word);
  return clean((startsWithBrand?source.slice(brandWords.length):source).join(' '));
}
function explicitAliases(product){
  const rows=[];
  for(const key of ['ebaySearchAliases','searchAliases','modelAliases']){
    const value=product&&product[key];
    if(Array.isArray(value))rows.push(...value);
    else if(value)rows.push(value);
  }
  return uniq(rows);
}
function verifiedAliases(product){return uniq(VERIFIED_SEARCH_ALIASES[clean(product&&product.slug)]||[]);}
function sourceUrls(product){
  const rows=[];
  const collect=value=>{
    if(!value)return;
    if(typeof value==='string')rows.push(value);
    else if(Array.isArray(value))value.forEach(collect);
    else if(typeof value==='object'){
      for(const key of ['url','href','source','link'])if(value[key])rows.push(value[key]);
    }
  };
  collect(product&&product.source);
  collect(product&&product.evidenceSources);
  collect(product&&product.verifiedRetailers);
  return uniq(rows);
}
function plausibleModelHint(value){
  const text=clean(value);
  if(!text||text.length>32||/[\\?#=&]/.test(text))return false;
  const slashCount=(text.match(/\//g)||[]).length;
  if(slashCount>1)return false;
  if(slashCount===1&&!/^[A-Za-z0-9.+-]+(?:\s+[A-Za-z0-9.+-]+)*\/[A-Za-z0-9.+-]{1,6}$/.test(text))return false;
  const flat=compact(text);
  if(flat.length<3||flat.length>24||!/[a-z]/i.test(flat)||!/[0-9]/.test(flat))return false;
  if(matcher.isFeatureDescriptorModel(text)||matcher.isUnitLikeModel(text))return false;
  return true;
}
function modelTermsFromText(value){
  const text=clean(value);if(!text)return [];
  const compound=matcher.compoundModelTokens({model:text,name:''});
  const fallback=matcher.modelTokens({model:text,name:''});
  return uniq([...compound,...fallback]).filter(token=>!matcher.isFeatureDescriptorModel(token));
}
function expandModelHint(product,value){
  const stripped=stripBrandPrefix(product,value);
  if(!plausibleModelHint(stripped))return [];
  const out=[stripped];
  const slash=stripped.match(/^(.+?)\/([A-Za-z0-9.+-]{1,6})$/);
  if(slash&&plausibleModelHint(slash[1]))out.push(slash[1]);
  return uniq(out);
}
function sourcePieces(url){
  const pieces=[];
  const add=value=>{
    const decoded=clean(value);if(!decoded)return;
    const withoutExt=decoded.replace(/\.(?:html?|php|aspx?)$/i,'');
    pieces.push(withoutExt);
    for(const part of withoutExt.split(/[-_~]+/))if(part)pieces.push(part);
  };
  for(const segment of url.pathname.split('/')){
    try{add(decodeURIComponent(segment));}catch{add(segment);}
  }
  for(const [,value] of url.searchParams.entries()){
    try{add(decodeURIComponent(value));}catch{add(value);}
  }
  return uniq(pieces);
}
function sourceModelHints(product){
  const out=[];
  for(const source of sourceUrls(product)){
    try{
      const url=new URL(source);
      for(const piece of sourcePieces(url)){
        for(const token of modelTermsFromText(piece))out.push(...expandModelHint(product,token));
        out.push(...expandModelHint(product,piece));
      }
    }catch{}
  }
  return uniq(out).slice(0,4);
}
function specificationModelHints(product){
  const out=[];
  for(const value of matcher.specModelValues(product)){
    const terms=modelTermsFromText(value);
    if(terms.length){for(const term of terms)out.push(...expandModelHint(product,term));}
    else out.push(...expandModelHint(product,value));
  }
  return uniq(out).filter(token=>!matcher.isFeatureDescriptorModel(token)).slice(0,4);
}
function categoryHints(product){
  const mapped=CATEGORY_HINTS[clean(product&&product.category)]||[];
  const label=clean(product&&product.categoryLabel);
  return uniq([...mapped,label]).slice(0,2);
}
function productModels(product){
  const out=[];
  for(const token of matcher.modelTokens(product))out.push(...expandModelHint(product,token));
  out.push(...specificationModelHints(product));
  out.push(...sourceModelHints(product));
  for(const alias of explicitAliases(product)){
    const terms=modelTermsFromText(alias);
    if(terms.length){for(const term of terms)out.push(...expandModelHint(product,term));}
    else out.push(...expandModelHint(product,alias));
  }
  return uniq(out).slice(0,4);
}
function requestKey(request){
  return JSON.stringify({q:norm(request.q),gtin:clean(request.gtin),epid:clean(request.epid),categoryIds:clean(request.categoryIds)});
}
function pushPlan(plans,seen,kind,request){
  const safe={...request,limit:SEARCH_LIMIT,filter:NEW_CONDITION_FILTER};
  if(!clean(safe.q)&&!clean(safe.gtin)&&!clean(safe.epid)&&!clean(safe.categoryIds))return;
  const key=requestKey(safe);if(seen.has(key))return;seen.add(key);plans.push(Object.freeze({kind,...safe}));
}
function plansFor(product,{maxQueries=MAX_QUERIES}={}){
  const limit=Math.max(1,Math.min(MAX_QUERIES,Number(maxQueries)||MAX_QUERIES));
  const plans=[];const seen=new Set();
  const brand=clean(product&&product.brand),name=brandlessName(product)||clean(product&&product.name);
  const models=productModels(product),hints=categoryHints(product),identity=matcher.identityTokens(product).slice(0,6).join(' '),verified=verifiedAliases(product);
  const gtin=clean(product&&product.gtin),epid=clean(product&&product.epid)||clean(VERIFIED_EBAY_EPIDS[clean(product&&product.slug)]),ebayCategoryId=clean(product&&product.ebayCategoryId);

  if(gtin)pushPlan(plans,seen,'gtin',{gtin});
  if(epid)pushPlan(plans,seen,'verified-epid',{epid});
  for(const alias of verified)pushPlan(plans,seen,'verified-product-code',{q:clean([brand,alias].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(models.length)pushPlan(plans,seen,'brand-model',{q:clean([brand,models[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  pushPlan(plans,seen,'brand-name',{q:clean([brand,name].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(models.length>1)pushPlan(plans,seen,'brand-model-alt',{q:clean([brand,models[1]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});

  for(const alias of explicitAliases(product))pushPlan(plans,seen,'explicit-alias',{q:clean([brand,stripBrandPrefix(product,alias)].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(models.length&&hints.length)pushPlan(plans,seen,'model-category',{q:clean([brand,models[0],hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(name&&hints.length)pushPlan(plans,seen,'name-category',{q:clean([brand,name,hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(identity)pushPlan(plans,seen,'identity-core',{q:clean([brand,identity,hints[0]||''].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});

  return plans.slice(0,limit);
}
function publicPlans(product,options){
  return plansFor(product,options).map(plan=>({kind:plan.kind,q:plan.q||null,gtin:plan.gtin||null,epid:plan.epid||null,categoryIds:plan.categoryIds||null,limit:plan.limit,filter:plan.filter}));
}

module.exports={VERSION,MAX_QUERIES,SEARCH_LIMIT,NEW_CONDITION_FILTER,VERIFIED_EBAY_EPIDS,VERIFIED_SEARCH_ALIASES,CATEGORY_HINTS,clean,norm,compact,uniq,brandlessName,stripBrandPrefix,explicitAliases,verifiedAliases,sourceUrls,plausibleModelHint,modelTermsFromText,expandModelHint,sourcePieces,sourceModelHints,specificationModelHints,categoryHints,productModels,plansFor,publicPlans};
