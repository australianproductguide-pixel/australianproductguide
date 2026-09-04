'use strict';

// APG eBay image search plan v1.2
// Broadens discovery recall without weakening exact-product acceptance. Search breadth and
// acceptance are deliberately separate: these plans may retrieve more candidates, but every
// candidate must still pass the existing whole-product, model/family/variant, condition,
// Australian-market and independent second-pass controls before it can become public.
// v1.2 keeps official-source model evidence but prevents URL paths from being promoted into
// search terms and searches one precise model identifier at a time instead of concatenating
// unrelated/alternate identifiers into one low-recall query.
const matcher=require('./ebay-catalogue-enrichment-v1');

const VERSION='1.2';
const MAX_QUERIES=4;
const SEARCH_LIMIT=50;
const NEW_CONDITION_FILTER='conditions:{NEW}';

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
function explicitAliases(product){
  const rows=[];
  for(const key of ['ebaySearchAliases','searchAliases','modelAliases']){
    const value=product&&product[key];
    if(Array.isArray(value))rows.push(...value);
    else if(value)rows.push(value);
  }
  return uniq(rows);
}
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
  if(!text||text.length>32||/[\\/?#=&]/.test(text))return false;
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
        for(const token of modelTermsFromText(piece))if(plausibleModelHint(token))out.push(token);
        if(plausibleModelHint(piece))out.push(piece);
      }
    }catch{}
  }
  return uniq(out).slice(0,4);
}
function specificationModelHints(product){
  const out=[];
  for(const value of matcher.specModelValues(product)){
    const terms=modelTermsFromText(value).filter(plausibleModelHint);
    if(terms.length)out.push(...terms);else if(plausibleModelHint(value))out.push(value);
  }
  return uniq(out).filter(token=>!matcher.isFeatureDescriptorModel(token)).slice(0,4);
}
function categoryHints(product){
  const mapped=CATEGORY_HINTS[clean(product&&product.category)]||[];
  const label=clean(product&&product.categoryLabel);
  return uniq([...mapped,label]).slice(0,2);
}
function productModels(product){
  return uniq([
    ...matcher.modelTokens(product).filter(token=>!matcher.isFeatureDescriptorModel(token)&&plausibleModelHint(token)),
    ...specificationModelHints(product),
    ...sourceModelHints(product),
    ...explicitAliases(product).flatMap(modelTermsFromText).filter(plausibleModelHint)
  ]).slice(0,4);
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
  const brand=clean(product&&product.brand);const name=brandlessName(product)||clean(product&&product.name);
  const models=productModels(product);const hints=categoryHints(product);const identity=matcher.identityTokens(product).slice(0,6).join(' ');
  const gtin=clean(product&&product.gtin);const epid=clean(product&&product.epid);const ebayCategoryId=clean(product&&product.ebayCategoryId);

  if(gtin)pushPlan(plans,seen,'gtin',{gtin});
  if(epid)pushPlan(plans,seen,'epid',{epid});
  if(models.length)pushPlan(plans,seen,'brand-model',{q:clean([brand,models[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  pushPlan(plans,seen,'brand-name',{q:clean([brand,name].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(models.length>1)pushPlan(plans,seen,'brand-model-alt',{q:clean([brand,models[1]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});

  for(const alias of explicitAliases(product))pushPlan(plans,seen,'explicit-alias',{q:clean([brand,alias].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(models.length&&hints.length)pushPlan(plans,seen,'model-category',{q:clean([brand,models[0],hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(name&&hints.length)pushPlan(plans,seen,'name-category',{q:clean([brand,name,hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  if(identity)pushPlan(plans,seen,'identity-core',{q:clean([brand,identity,hints[0]||''].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});

  return plans.slice(0,limit);
}
function publicPlans(product,options){
  return plansFor(product,options).map(plan=>({kind:plan.kind,q:plan.q||null,gtin:plan.gtin||null,epid:plan.epid||null,categoryIds:plan.categoryIds||null,limit:plan.limit,filter:plan.filter}));
}

module.exports={VERSION,MAX_QUERIES,SEARCH_LIMIT,NEW_CONDITION_FILTER,CATEGORY_HINTS,clean,norm,compact,uniq,brandlessName,explicitAliases,sourceUrls,plausibleModelHint,modelTermsFromText,sourcePieces,sourceModelHints,specificationModelHints,categoryHints,productModels,plansFor,publicPlans};
