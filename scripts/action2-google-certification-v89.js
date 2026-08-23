'use strict';

function pickSample(routes,count=4){
  const list=Array.isArray(routes)?routes:[];
  if(list.length<=count)return list.slice();
  const chosen=[];
  for(let i=0;i<count;i++)chosen.push(list[Math.round(i*(list.length-1)/(count-1))]);
  return [...new Set(chosen)];
}
function tally(rows,key){
  const out={};
  for(const row of rows||[]){const value=String(row&&row[key]||'UNKNOWN');out[value]=(out[value]||0)+1;}
  return out;
}
async function inspectSample(growth,siteUrl){
  const discovery=require('../lib/discoverability-v1');
  const sample=[];
  for(const group of discovery.GROUP_ORDER){for(const path of pickSample(discovery.sitemapGroups[group],4))sample.push({group,path});}
  const results=[];
  for(const item of sample){
    try{
      const data=await growth.googleFetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({inspectionUrl:discovery.CANONICAL_ORIGIN+item.path,siteUrl})});
      const s=data&&data.inspectionResult&&data.inspectionResult.indexStatusResult||{};
      results.push({group:item.group,verdict:s.verdict||'UNKNOWN',coverageState:s.coverageState||'UNKNOWN',indexingState:s.indexingState||'UNKNOWN',robotsTxtState:s.robotsTxtState||'UNKNOWN',pageFetchState:s.pageFetchState||'UNKNOWN'});
    }catch(error){results.push({group:item.group,verdict:'INSPECTION_ERROR',coverageState:'INSPECTION_ERROR',indexingState:'INSPECTION_ERROR',robotsTxtState:'INSPECTION_ERROR',pageFetchState:'INSPECTION_ERROR'});}
  }
  const groups={};
  for(const group of discovery.GROUP_ORDER){const rows=results.filter(x=>x.group===group);groups[group]={sampled:rows.length,verdicts:tally(rows,'verdict'),coverageStates:tally(rows,'coverageState'),indexingStates:tally(rows,'indexingState'),robotsTxtStates:tally(rows,'robotsTxtState'),pageFetchStates:tally(rows,'pageFetchState')};}
  return {sampleSize:results.length,method:'Deterministic stratified sample only; not a sitewide indexed-page count.',groups,overall:{verdicts:tally(results,'verdict'),coverageStates:tally(results,'coverageState'),indexingStates:tally(results,'indexingState'),robotsTxtStates:tally(results,'robotsTxtState'),pageFetchStates:tally(results,'pageFetchState')}};
}

(async()=>{
  if(process.env.VERCEL_ENV!=='production'){
    console.log('ACTION2_GOOGLE_CERTIFICATION_V89=SKIP_NON_PRODUCTION');
    return;
  }
  const growth=require('../lib/google-growth-v1');
  const sites=await growth.listSearchConsoleSites();
  const site=sites.find(x=>x.siteUrl===growth.CONFIG.searchConsoleSite)||sites[0];
  if(!site)throw new Error('Action 2: no accessible Search Console property');
  const accounts=await growth.listAnalyticsAccountSummaries();
  const property=growth.selectGaProperty(growth.flattenGaProperties(accounts));
  if(!property?.propertyId)throw new Error('Action 2: no accessible GA4 property');

  const dimensions=await growth.ensureAction2CustomDimensions(property.propertyId);
  const [gsc,ga4,events,realtime,indexSample]=await Promise.all([
    growth.searchConsoleDetailedSnapshot(site.siteUrl),
    growth.analyticsSnapshot(property.propertyId),
    growth.analyticsEventBaseline(property.propertyId),
    growth.analyticsRealtimeEvents(property.propertyId),
    inspectSample(growth,site.siteUrl)
  ]);
  const requiredEvents=['product_view','site_search','decision_lab_view','decision_lab_submitted','finder_view','finder_submitted','comparison_started','comparison_opened','product_saved','affiliate_click','amazon_shopping_click','scout_message'];
  const byEvent=new Map(events.map(x=>[x.eventName,x]));
  const funnelEvents=requiredEvents.map(eventName=>Object.assign({eventName,eventCount:0,totalUsers:0,measurementState:'ACTUAL ZERO / NOT OBSERVED IN PERIOD'},byEvent.get(eventName)||{},byEvent.has(eventName)?{measurementState:'MEASURED'}:{}));

  console.log('ACTION2_GSC_TOTALS_V89='+JSON.stringify({siteUrl:gsc.siteUrl,permissionLevel:site.permissionLevel,period:gsc.period,totals:gsc.totals,searchAppearanceRows:gsc.searchAppearances.rows,pageRowsReturned:gsc.pages.rows}));
  console.log('ACTION2_GSC_SITEMAPS_V89='+JSON.stringify(gsc.sitemaps));
  console.log('ACTION2_GSC_INDEX_SAMPLE_V89='+JSON.stringify(indexSample));
  console.log('ACTION2_GA4_SNAPSHOT_V89='+JSON.stringify({propertyId:property.propertyId,propertyName:property.displayName,snapshot:ga4,customDimensions:dimensions}));
  for(const row of funnelEvents)console.log('ACTION2_GA4_EVENT_V89='+JSON.stringify(row));
  console.log('ACTION2_GA4_REALTIME_V89='+JSON.stringify(realtime.filter(x=>requiredEvents.includes(x.eventName))));
  console.log('ACTION2_GOOGLE_CERTIFICATION_V89=PASS');
})().catch(error=>{
  console.error('ACTION2_GOOGLE_CERTIFICATION_V89=FAIL '+error.message);
  process.exit(1);
});