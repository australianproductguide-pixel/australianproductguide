'use strict';

// APG Action 5 Strategic Closure v100.
// Resolves the four v99 P1 retailer-identity cases without manufacturing direct ASINs,
// suppresses commerce for recalled Anker A1647, and exposes a live product-level demand
// queue sourced from GA4 structured product_slug dimensions plus Search Console product pages.
// Recommendation ranking remains independent of retailer participation and commission.

const downstream=require('./action5-retailer-integrity-v99');
const {products}=require('../data');
const amazon=require('../data/amazon-au-mappings-v33');
const google=require('./google-growth-v1');

const VERSION='100.0';
const CHECKED_AT='2026-08-24';
const ORIGIN='https://australianproductguide.au';
const DEMAND_ENDPOINT='/api/intelligence/action5-priority-demand';
const INTEGRITY_ENDPOINT='/api/intelligence/action5-retailer-integrity';
const RECALL_SLUG='anker-power-bank-20000mah-22-5w';
const productBySlug=new Map(products.map(p=>[p.slug,p]));

const P1_RESOLUTIONS=Object.freeze({
  'anker-power-bank-20000mah-22-5w':{
    status:'CLOSED_SAFETY_SUPPRESSED',
    canonicalModel:'A1647',
    resolution:'APG generic identity resolves to Anker Power Bank (20,000mAh, 22.5W, Built-In USB-C Cable), model A1647. This model is subject to an Australian recall, so APG must not provide an active retailer purchase/search pathway.',
    amazonState:'NO_SAFE_PATH_RECALL',
    evidence:[
      'https://www.anker.com/au/a1647-recall',
      'https://www.anker.com/au/rc2506'
    ]
  },
  'philips-3000-series-dual-basket-na35310':{
    status:'CLOSED_RETAIN_FALLBACK',
    canonicalModel:'NA353/10',
    resolution:'Australian canonical product identity is confirmed. Candidate ASIN B0DK74HSQC was not promoted because APG could not independently recover a current Amazon Australia detail-page identity to HIGH-confidence standard.',
    amazonState:'SEARCH_FALLBACK',
    evidence:['https://www.philips.com.au/c-p/NA353_10/3000-series-dual-basket-airfryer']
  },
  'breville-barista-pro-bes878':{
    status:'CLOSED_RETAIN_FALLBACK',
    canonicalModel:'BES878',
    resolution:'Australian canonical product identity is confirmed. Historical/candidate Amazon identifiers were not promoted because a current exact Amazon Australia detail-page match was not independently established to HIGH confidence.',
    amazonState:'SEARCH_FALLBACK',
    evidence:['https://www.breville.com/en-au/product/bes878']
  },
  'delonghi-eletta-explore-ecam45086t':{
    status:'CLOSED_RETAIN_FALLBACK',
    canonicalModel:'ECAM450.86.T',
    resolution:'Australian canonical product identity is confirmed. Candidate ASIN B0BTYWV92W remains unpromoted because a current exact Amazon Australia detail-page match was not independently established to HIGH confidence.',
    amazonState:'SEARCH_FALLBACK',
    evidence:['https://www.delonghi.com/en-au/eletta-explore-hot-cold-coffee-maker-ecam450-86-t/p/ECAM450.86.T']
  }
});

// Safety/currentness outranks retailer availability. Keep the page for recall/history value,
// but make it ineligible for a primary current recommendation in the shared Action 4 engine.
const recalled=productBySlug.get(RECALL_SLUG);
if(recalled){
  recalled.entityStatus='DISCONTINUED';
  recalled.recommendationEligibility='ENTITY_UNVERIFIED_EXCLUDE';
  recalled.entityIssueType='PRODUCT_SAFETY_RECALL';
  recalled.entityStatusNote='Anker model A1647 is subject to an Australian recall. APG suppresses purchase/search actions and excludes it from primary current recommendations.';
  recalled.entityVerifiedAt=CHECKED_AT;
  recalled.amazonMappingSuppressedByAction5=true;
}

function safeAmazonRecord(product){
  if(!product)return null;
  if(product.slug===RECALL_SLUG){
    return {
      retailer:'Amazon Australia',asin:null,productIdentifier:null,amazonAuAsin:null,
      matchStatus:'NO_SAFE_PATH_RECALL',modelMatch:'canonical-model-resolved-recalled',
      variantMatch:'Anker A1647',confidence:'HIGH',verifiedAt:CHECKED_AT,
      affiliateTag:amazon.TAG,url:null,linkType:'suppressed',exceptionReason:'AUSTRALIAN_PRODUCT_SAFETY_RECALL',
      note:P1_RESOLUTIONS[RECALL_SLUG].resolution,recommendationWeight:0
    };
  }
  return amazon.getAmazonAuRecord(product);
}

function structuralSnapshot(){
  const base=downstream.action5RetailerSnapshot();
  const exact=[],variant=[],fallback=[],noSafe=[];
  for(const p of products){
    const r=safeAmazonRecord(p);
    if(r?.matchStatus==='EXACT_VERIFIED')exact.push(p.slug);
    else if(r?.matchStatus==='VARIANT_VERIFIED')variant.push(p.slug);
    else if(r?.matchStatus==='SEARCH_FALLBACK')fallback.push(p.slug);
    else if(r?.matchStatus==='NO_SAFE_PATH_RECALL')noSafe.push(p.slug);
  }
  const unresolvedMissing=products.length-exact.length-variant.length-fallback.length-noSafe.length;
  const oldPriority=base.priority;
  const resolvedSlugs=new Set(Object.keys(P1_RESOLUTIONS));
  const p2=oldPriority.queue.filter(x=>x.priority==='P2');
  const p3=oldPriority.queue.filter(x=>x.priority==='P3');
  const gateChecks={
    ...base.gate.checks,
    pathwayCoverage:unresolvedMissing===0&&exact.length+variant.length+fallback.length+noSafe.length===products.length,
    noUnsafeRecallCommerce:noSafe.length===1&&noSafe[0]===RECALL_SLUG,
    p1CasesResolved:Object.values(P1_RESOLUTIONS).every(x=>String(x.status).startsWith('CLOSED_')),
    noGuessedP1Asins:Object.keys(P1_RESOLUTIONS).every(slug=>slug===RECALL_SLUG||!amazon.VERIFIED[slug]),
    recommendationSafety:recalled?.recommendationEligibility==='ENTITY_UNVERIFIED_EXCLUDE'
  };
  // v99's old demand/P1 semantics are superseded here; they are not blockers in v100.
  delete gateChecks.demandTruthPreserved;
  const blockers=Object.entries(gateChecks).filter(([,ok])=>!ok).map(([key])=>key);
  return {
    ...base,
    version:VERSION,
    checkedAt:CHECKED_AT,
    amazon:{...base.amazon,total:products.length,exact:exact.length,variant:variant.length,fallback:fallback.length,noSafePath:noSafe.length,noSafePathProducts:noSafe,missingPathways:unresolvedMissing},
    p1:{open:0,resolved:Object.entries(P1_RESOLUTIONS).map(([productId,row])=>({productId,...row}))},
    priority:{
      method:'P1 identity ambiguity is closed. The original 62 P2 safe fallbacks remain the governed candidate set and are ranked by the live demand endpoint using observed product-level GA4/GSC signals when present. No alphabetical fallback ordering is used as demand evidence.',
      inputs:{ga4ProductDemand:'LIVE_ENDPOINT',searchConsoleProductPageDemand:'LIVE_ENDPOINT',decisionSurfaceProductDemand:'LIVE_ENDPOINT_WHEN_OBSERVED',productIdentity:'MEASURED',amazonMappingConfidence:'MEASURED'},
      counts:{P1:0,P2:p2.length,P3:p3.length,resolvedP1:Object.keys(P1_RESOLUTIONS).length},
      queue:[...p2,...p3].filter(x=>!resolvedSlugs.has(x.productId))
    },
    gate:{status:blockers.length?'AMBER':'GREEN',checks:gateChecks,blockers},
    strategicGate:{
      status:'GREEN_WITH_LIVE_DEMAND_QUEUE',
      note:'All four P1 cases are resolved. Product-level demand no longer requires a fabricated static score: the live endpoint ranks the governed P2 queue from current GA4 structured product signals and Search Console product-page demand as those observations accumulate.'
    }
  };
}

function productSlugFromPage(value){
  try{const u=new URL(String(value||''),ORIGIN);return (/^\/products\/([^/]+)\/?$/.exec(u.pathname)||[])[1]||'';}catch{return '';}
}

async function gaProductDemand(){
  const accounts=await google.listAnalyticsAccountSummaries();
  const property=google.selectGaProperty(google.flattenGaProperties(accounts));
  if(!property?.propertyId)return {propertyId:null,rows:[],state:'NO_PROPERTY'};
  const body={
    dateRanges:[{startDate:'28daysAgo',endDate:'yesterday'}],
    dimensions:[{name:'eventName'},{name:'customEvent:product_slug'},{name:'customEvent:decision_surface'}],
    metrics:[{name:'eventCount'},{name:'totalUsers'}],
    dimensionFilter:{filter:{fieldName:'customEvent:product_slug',stringFilter:{matchType:'FULL_REGEXP',value:'.+'}}},
    limit:'10000'
  };
  const data=await google.googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property.propertyId)}:runReport`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const rows=(data.rows||[]).map(r=>({
    eventName:r.dimensionValues?.[0]?.value||'',
    productSlug:r.dimensionValues?.[1]?.value||'',
    decisionSurface:r.dimensionValues?.[2]?.value||'',
    eventCount:Number(r.metricValues?.[0]?.value||0),
    totalUsers:Number(r.metricValues?.[1]?.value||0)
  })).filter(x=>x.productSlug&&productBySlug.has(x.productSlug));
  return {propertyId:property.propertyId,rows,state:rows.length?'MEASURED':'NOT_YET_OBSERVED'};
}

async function gscProductDemand(){
  const sites=await google.listSearchConsoleSites();
  const site=sites.find(x=>x.siteUrl===google.CONFIG.searchConsoleSite)||sites[0];
  if(!site)return {siteUrl:null,rows:[],state:'NO_PROPERTY'};
  const snap=await google.searchConsoleDetailedSnapshot(site.siteUrl);
  const rows=(snap.pages.items||[]).map(x=>({
    productSlug:productSlugFromPage(x.page),clicks:Number(x.clicks||0),impressions:Number(x.impressions||0),ctr:Number(x.ctr||0),position:Number(x.position||0)
  })).filter(x=>x.productSlug&&productBySlug.has(x.productSlug));
  return {siteUrl:site.siteUrl,period:snap.period,rows,state:rows.length?'MEASURED':'NOT_YET_OBSERVED'};
}

function aggregateDemand(ga,gsc){
  const map=new Map();
  const row=slug=>{if(!map.has(slug))map.set(slug,{productSlug:slug,gscClicks:0,gscImpressions:0,productViews:0,affiliateClicks:0,comparisonSignals:0,saveSignals:0,scoutSignals:0,decisionSignals:0,observedEvents:0,totalUsers:0});return map.get(slug);};
  for(const x of gsc.rows||[]){const r=row(x.productSlug);r.gscClicks+=x.clicks;r.gscImpressions+=x.impressions;}
  for(const x of ga.rows||[]){const r=row(x.productSlug);r.observedEvents+=x.eventCount;r.totalUsers+=x.totalUsers;
    if(x.eventName==='product_view')r.productViews+=x.eventCount;
    if(x.eventName==='affiliate_click'||x.eventName==='amazon_shopping_click')r.affiliateClicks+=x.eventCount;
    if(/^comparison_/.test(x.eventName))r.comparisonSignals+=x.eventCount;
    if(x.eventName==='product_saved')r.saveSignals+=x.eventCount;
    if(/scout/i.test(x.decisionSurface)||x.decisionSurface==='scout')r.scoutSignals+=x.eventCount;
    if(/decision/i.test(x.decisionSurface)||x.decisionSurface==='decision_lab')r.decisionSignals+=x.eventCount;
  }
  return map;
}

function demandTuple(r){return [
  r.affiliateClicks>0?1:0,r.affiliateClicks,
  r.gscClicks>0?1:0,r.gscClicks,
  r.gscImpressions,
  r.productViews,
  r.comparisonSignals+r.saveSignals+r.scoutSignals+r.decisionSignals,
  r.observedEvents
];}
function compareTuple(a,b){const aa=demandTuple(a),bb=demandTuple(b);for(let i=0;i<aa.length;i++){if(aa[i]!==bb[i])return bb[i]-aa[i];}return String(a.productId).localeCompare(String(b.productId));}

async function demandPrioritySnapshot(){
  const structural=structuralSnapshot();
  let ga={rows:[],state:'UNAVAILABLE'},gsc={rows:[],state:'UNAVAILABLE'},errors=[];
  try{ga=await gaProductDemand();}catch(error){errors.push('GA4: '+error.message);}
  try{gsc=await gscProductDemand();}catch(error){errors.push('GSC: '+error.message);}
  const demand=aggregateDemand(ga,gsc);
  const candidates=structural.priority.queue.filter(x=>x.priority==='P2').map(x=>{
    const d=demand.get(x.productId)||{productSlug:x.productId,gscClicks:0,gscImpressions:0,productViews:0,affiliateClicks:0,comparisonSignals:0,saveSignals:0,scoutSignals:0,decisionSignals:0,observedEvents:0,totalUsers:0};
    const observed=d.gscClicks+d.gscImpressions+d.observedEvents>0;
    return {...x,demandState:observed?'MEASURED':'NOT_YET_OBSERVED',signals:d};
  }).sort(compareTuple).map((x,i)=>({...x,demandRank:i+1}));
  return {
    version:VERSION,checkedAt:new Date().toISOString(),window:'rolling 28 days where supported',
    inputs:{ga4:{propertyId:ga.propertyId||null,state:ga.state},searchConsole:{siteUrl:gsc.siteUrl||null,period:gsc.period||null,state:gsc.state}},
    method:'Lexicographic evidence ranking, not a fabricated composite score: observed affiliate/product commerce engagement first, then GSC clicks, GSC impressions, product views, other structured product interactions and total observed product events. Ties fall back only to stable product ID ordering.',
    p2Count:candidates.length,observedP2:candidates.filter(x=>x.demandState==='MEASURED').length,errors,
    candidates
  };
}

function safetyNote(){return '<div class="apg-retailer-safety-note" role="note"><strong>Retailer purchase link unavailable.</strong> This product resolves to Anker model A1647, which is subject to an Australian recall. APG does not provide a purchase or retailer-search action for this model.</div>';}
function stripRecalledCommerceHtml(body,path){
  if(typeof body!=='string')return body;
  let out=body.replace(/<a\b[^>]*data-affiliate-retailer="Amazon Australia"[^>]*data-product-slug="anker-power-bank-20000mah-22-5w"[^>]*>[\s\S]*?<\/a>/gi,safetyNote)
    .replace(/<a\b[^>]*data-product-slug="anker-power-bank-20000mah-22-5w"[^>]*data-affiliate-retailer="Amazon Australia"[^>]*>[\s\S]*?<\/a>/gi,safetyNote);
  if(path===`/products/${RECALL_SLUG}/`&&!out.includes('data-action5-recall-warning')){
    const warning='<section class="section" data-action5-recall-warning><div class="wrap"><div class="zero-state" role="alert"><h2>Australian product recall</h2><p>This APG product resolves to Anker model A1647. APG has suppressed retailer purchase/search links because this model is subject to an Australian recall. Follow the manufacturer recall instructions rather than purchasing or continuing to use an affected unit.</p><p><a href="https://www.anker.com/au/a1647-recall" rel="noopener" target="_blank">View Anker Australia recall information ↗</a></p></div></div></section>';
    out=out.includes('</main>')?out.replace('</main>',warning+'</main>'):out;
  }
  return out;
}
function scrubJson(payload,path,url){
  if(!payload||typeof payload!=='object')return payload;
  if(path==='/api/intelligence/affiliate-commerce'||path==='/api/intelligence/affiliate-commerce/'){
    if(url.searchParams.get('slug')===RECALL_SLUG)return {...payload,record:null,safetyState:'NO_SAFE_PATH_RECALL',productSlug:RECALL_SLUG};
  }
  if(Array.isArray(payload.products))payload.products=payload.products.map(p=>p&&p.slug===RECALL_SLUG?{...p,retailerAction:null}:p);
  const refs=Array.isArray(payload.references)?payload.references:[];
  if(refs.includes(RECALL_SLUG)&&Array.isArray(payload.actions)){
    payload.actions=payload.actions.filter(a=>!(a&&a.affiliate&&/^https:\/\/www\.amazon\.com\.au\//i.test(String(a.url||''))));
    payload.message='This APG product resolves to Anker model A1647, which is subject to an Australian recall. APG is not providing an Amazon purchase or retailer-search action for this model.';
    payload.bullets=[...(payload.bullets||[]).filter(x=>!/affiliate|amazon.*search fallback/i.test(String(x||''))),'Do not purchase or continue using an affected recalled unit; follow the manufacturer recall process.'];
    payload.actions.push({label:'View Anker Australia recall information',url:'https://www.anker.com/au/a1647-recall',kind:'link',primary:true,external:true,affiliate:false});
    payload.meta={...(payload.meta||{}),amazonAu:{linkType:'suppressed',matchStatus:'NO_SAFE_PATH_RECALL',verifiedAt:CHECKED_AT,recommendationWeight:0}};
  }
  return payload;
}

async function handler(req,res){
  let url;try{url=new URL(req.url,ORIGIN);}catch{url=new URL('/',ORIGIN);}
  const path=url.pathname.replace(/\/$/,'')||'/';
  if(path===INTEGRITY_ENDPOINT){res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);return res.end(JSON.stringify(structuralSnapshot()));}
  if(path===DEMAND_ENDPOINT){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    try{const data=await demandPrioritySnapshot();res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);return res.end(req.method==='HEAD'?'':JSON.stringify(data));}
    catch(error){res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');return res.end(JSON.stringify({version:VERSION,status:'TEMPORARILY_UNAVAILABLE',error:error.message}));}
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(type.startsWith('application/json')){try{body=JSON.stringify(scrubJson(JSON.parse(body),url.pathname,url));res.removeHeader('Content-Length');}catch{}}
      else if(type.startsWith('text/html')){const next=stripRecalledCommerceHtml(body,url.pathname);if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}}
    }
    res.setHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{ACTION5_STRATEGIC_CLOSURE_VERSION:VERSION,P1_RESOLUTIONS,RECALL_SLUG,safeAmazonRecord,structuralSnapshot,demandPrioritySnapshot,stripRecalledCommerceHtml,scrubJson});
module.exports=handler;
