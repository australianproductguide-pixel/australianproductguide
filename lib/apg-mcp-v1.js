'use strict';

const growth=require('./google-growth-v1');

function clampInt(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback;}
function safeDate(value,fallback){const s=String(value||'');return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:fallback;}
function daysAgo(days){return new Date(Date.now()-days*86400000).toISOString().slice(0,10);}

async function searchConsolePerformance(input={}){
  const startDate=safeDate(input.startDate,daysAgo(28));
  const endDate=safeDate(input.endDate,daysAgo(1));
  const allowedDimensions=new Set(['query','page','country','device','date','searchAppearance']);
  const dimensions=(Array.isArray(input.dimensions)?input.dimensions:['query']).filter(v=>allowedDimensions.has(v)).slice(0,3);
  const rowLimit=clampInt(input.rowLimit,1,250,50);
  const body={startDate,endDate,dimensions:dimensions.length?dimensions:['query'],rowLimit,dataState:'final'};
  const filters=[];
  if(input.query)filters.push({dimension:'query',operator:'contains',expression:String(input.query).slice(0,180)});
  if(input.page)filters.push({dimension:'page',operator:'contains',expression:String(input.page).slice(0,500)});
  if(filters.length)body.dimensionFilterGroups=[{groupType:'and',filters}];
  const data=await growth.googleFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(growth.CONFIG.searchConsoleSite)}/searchAnalytics/query`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  return {site: growth.CONFIG.searchConsoleSite,startDate,endDate,dimensions:body.dimensions,rows:(data.rows||[]).map(r=>({keys:r.keys||[],clicks:r.clicks||0,impressions:r.impressions||0,ctr:r.ctr||0,position:r.position||0}))};
}

async function resolveGaProperty(){
  const summaries=await growth.listAnalyticsAccountSummaries();
  const properties=growth.flattenGaProperties(summaries);
  return growth.selectGaProperty(properties);
}
async function ga4Report(input={}){
  const property=await resolveGaProperty();
  if(!property)throw new Error('No accessible GA4 property was found for APG.');
  const allowedMetrics=new Set(['activeUsers','sessions','engagedSessions','screenPageViews','eventCount','conversions','userEngagementDuration']);
  const allowedDimensions=new Set(['date','pagePath','pageTitle','sessionDefaultChannelGroup','country','deviceCategory','eventName','firstUserDefaultChannelGroup']);
  const metrics=(Array.isArray(input.metrics)?input.metrics:['activeUsers','sessions','engagedSessions']).filter(v=>allowedMetrics.has(v)).slice(0,6);
  const dimensions=(Array.isArray(input.dimensions)?input.dimensions:[]).filter(v=>allowedDimensions.has(v)).slice(0,3);
  const body={dateRanges:[{startDate:String(input.startDate||'28daysAgo').slice(0,30),endDate:String(input.endDate||'yesterday').slice(0,30)}],metrics:(metrics.length?metrics:['activeUsers','sessions']).map(name=>({name})),limit:String(clampInt(input.limit,1,250,50))};
  if(dimensions.length)body.dimensions=dimensions.map(name=>({name}));
  const data=await growth.googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property.propertyId)}:runReport`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const dimHeaders=(data.dimensionHeaders||[]).map(x=>x.name),metricHeaders=(data.metricHeaders||[]).map(x=>x.name);
  return {property:{id:property.propertyId,displayName:property.displayName},dateRange:body.dateRanges[0],dimensions:dimHeaders,metrics:metricHeaders,rows:(data.rows||[]).map(row=>({dimensions:Object.fromEntries(dimHeaders.map((name,i)=>[name,row.dimensionValues?.[i]?.value||''])),metrics:Object.fromEntries(metricHeaders.map((name,i)=>[name,Number(row.metricValues?.[i]?.value||0)]))}))};
}

async function growthOpportunities(input={}){
  const limit=clampInt(input.limit,1,50,20);
  const gsc=await searchConsolePerformance({startDate:input.startDate,endDate:input.endDate,dimensions:['query','page'],rowLimit:250});
  const opportunities=gsc.rows.filter(r=>r.impressions>=20&&r.position>=3&&r.position<=25).map(r=>({query:r.keys[0]||'',page:r.keys[1]||'',clicks:r.clicks,impressions:r.impressions,ctr:r.ctr,position:r.position,score:Math.round(r.impressions*Math.max(0.01,Math.min(1,(26-r.position)/23))*(1-Math.min(.35,r.ctr))*100)/100,reason:r.position<=10?'Page-one query with room to improve CTR/rank':'High-impression query within striking distance of page one'})).sort((a,b)=>b.score-a.score).slice(0,limit);
  return {period:{startDate:gsc.startDate,endDate:gsc.endDate},method:'Opportunity score prioritises impressions, attainable rank and low CTR; it is a decision aid, not a guarantee of ranking gains.',opportunities};
}

async function connectionStatus(){
  const result=await growth.diagnose({includeSnapshots:false});
  return {ok:result.ok,auth:result.auth,searchConsole:{connected:result.searchConsole.accessibleSites.length>0,siteCount:result.searchConsole.accessibleSites.length,sites:result.searchConsole.accessibleSites},analytics:{connected:result.analytics.accessibleProperties.length>0,propertyCount:result.analytics.accessibleProperties.length,selectedProperty:result.analytics.selectedProperty}};
}

module.exports={connectionStatus,searchConsolePerformance,ga4Report,growthOpportunities};
