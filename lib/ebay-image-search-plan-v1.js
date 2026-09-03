'use strict';

// APG eBay image search plan v1.0
// Broadens discovery recall without weakening exact-product acceptance. Search breadth and
// acceptance are deliberately separate: these plans may retrieve more candidates, but every
// candidate must still pass the existing whole-product, model/family/variant, condition,
// Australian-market and second-pass verification controls before it can become public.
const matcher=require('./ebay-catalogue-enrichment-v1');

const VERSION='1.0';
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
  'e-readers':['ereader'],
  'earbuds':['earbuds'],
  'electric-shavers':['electric shaver'],
  'electric-toothbrushes':['electric toothbrush'],
  'external-ssds':['portable ssd','external ssd'],
  'fitness-trackers':['fitness tracker'],
  'gaming-controllers':['gaming controller','controller'],
  'gaming-headsets':['gaming headset'],
  'gaming-monitors':['gaming monitor'],
  'hair-dryers':['hair dryer'],
  'hair-straighteners':['hair straightener'],
  'home-printers':['printer'],
  'home-security-cameras':['security camera'],
  'kitchen-mixers':['stand mixer'],
  'laptops':['laptop'],
  'luggage':['luggage','suitcase'],
  'massage-guns':['massage gun'],
  'mechanical-keyboards':['mechanical keyboard','keyboard'],
  'mesh-wifi-systems':['mesh wifi system'],
  'microphones':['microphone'],
  'multicookers':['multicooker'],
  'office-chairs':['office chair'],
  'photo-printers':['photo printer'],
  'portable-air-conditioners':['portable air conditioner'],
  'portable-monitors':['portable monitor'],
  'portable-power-stations':['portable power station'],
  'power-banks':['power bank'],
  'pressure-washers':['pressure washer'],
  'projectors':['projector'],
  'rice-cookers':['rice cooker'],
  'robot-vacuums':['robot vacuum'],
  'smart-displays':['smart display'],
  'smart-doorbells':['smart doorbell'],
  'smart-scales':['smart scale','body composition scale'],
  'smartphones':['smartphone'],
  'smartwatches':['smartwatch'],
  'soundbars':['soundbar'],
  'standing-desks':['standing desk'],
  'stick-vacuums':['stick vacuum'],
  'tablets':['tablet'],
  'televisions':['television','tv'],
  'toasters':['toaster'],
  'usb-c-chargers':['usb c charger'],
  'usb-c-hubs-docks':['usb c hub'],
  'vacuum-sealers':['vacuum sealer'],
  'washing-machines':['washing machine'],
  'water-filters':['water filter'],
  'water-flossers':['water flosser'],
  'webcams':['webcam'],
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
  const brand=norm(product&&product.brand);const source=words(product&&product.name);
  if(!brand)return source.join(' ');
  const kept=source.filter(word=>norm(word)!==brand);
  return clean(kept.join(' '));
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
function sourceModelHints(product){
  const source=clean(product&&product.source);if(!source)return [];
  try{
    const url=new URL(source);const decoded=decodeURIComponent(`${url.pathname} ${url.search}`);
    return uniq(matcher.compoundModelTokens({model:decoded,name:''})).slice(0,3);
  }catch{return [];}
}
function categoryHints(product){
  const mapped=CATEGORY_HINTS[clean(product&&product.category)]||[];
  const label=clean(product&&product.categoryLabel);
  return uniq([...mapped,label]).slice(0,2);
}
function productModels(product){
  return uniq([
    ...matcher.modelTokens(product),
    ...sourceModelHints(product),
    ...explicitAliases(product).filter(value=>/[a-z]/i.test(value)&&/\d/.test(value))
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

  if(models.length){
    pushPlan(plans,seen,'brand-model',{q:clean([brand,models.join(' ')].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  }
  pushPlan(plans,seen,'brand-name',{q:clean([brand,name].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});

  for(const alias of explicitAliases(product)){
    pushPlan(plans,seen,'explicit-alias',{q:clean([brand,alias].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  }

  if(models.length&&hints.length){
    pushPlan(plans,seen,'model-category',{q:clean([brand,models[0],hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  }
  if(name&&hints.length){
    pushPlan(plans,seen,'name-category',{q:clean([brand,name,hints[0]].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  }
  if(identity){
    pushPlan(plans,seen,'identity-core',{q:clean([brand,identity,hints[0]||''].filter(Boolean).join(' ')),categoryIds:ebayCategoryId});
  }

  return plans.slice(0,limit);
}
function publicPlans(product,options){
  return plansFor(product,options).map(plan=>({kind:plan.kind,q:plan.q||null,gtin:plan.gtin||null,epid:plan.epid||null,categoryIds:plan.categoryIds||null,limit:plan.limit,filter:plan.filter}));
}

module.exports={VERSION,MAX_QUERIES,SEARCH_LIMIT,NEW_CONDITION_FILTER,CATEGORY_HINTS,clean,norm,compact,uniq,brandlessName,explicitAliases,sourceModelHints,categoryHints,productModels,plansFor,publicPlans};
