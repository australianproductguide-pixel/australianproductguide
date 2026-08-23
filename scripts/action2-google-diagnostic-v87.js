'use strict';
(async()=>{
  const growth=require('../lib/google-growth-v1');
  const sites=await growth.listSearchConsoleSites();
  const accounts=await growth.listAnalyticsAccountSummaries();
  const properties=growth.flattenGaProperties(accounts);
  const property=growth.selectGaProperty(properties);
  const site=sites.find(x=>x.siteUrl===growth.CONFIG.searchConsoleSite)||sites[0];
  const end=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const start=new Date(Date.now()-29*86400000).toISOString().slice(0,10);
  async function sc(dimensions,rowLimit=25){
    if(!site)return null;
    const body={startDate:start,endDate:end,dimensions,rowLimit,dataState:'final'};
    const url=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`;
    return growth.googleFetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  }
  async function scTotals(){
    if(!site)return null;
    const body={startDate:start,endDate:end,rowLimit:1,dataState:'final'};
    const url=`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`;
    return growth.googleFetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  }
  async function sitemaps(){
    if(!site)return null;
    return growth.googleFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps`);
  }
  async function gaReport(){
    if(!property)return null;
    const body={dateRanges:[{startDate:'28daysAgo',endDate:'yesterday'}],dimensions:[{name:'eventName'}],metrics:[{name:'eventCount'},{name:'totalUsers'}],limit:'100',orderBys:[{metric:{metricName:'eventCount'},desc:true}]};
    return growth.googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property.propertyId)}:runReport`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  }
  async function gaRealtime(){
    if(!property)return null;
    const body={dimensions:[{name:'eventName'}],metrics:[{name:'eventCount'},{name:'activeUsers'}],limit:'100'};
    return growth.googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property.propertyId)}:runRealtimeReport`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  }
  async function customDimensions(){
    if(!property)return null;
    return growth.googleFetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${encodeURIComponent(property.propertyId)}/customDimensions?pageSize=200`);
  }
  const [totals,queries,pages,devices,countries,appearance,maps,ga,rt,dims]=await Promise.all([
    scTotals(),sc(['query']),sc(['page']),sc(['device']),sc(['country']),sc(['searchAppearance']),sitemaps(),gaReport(),gaRealtime(),customDimensions()
  ]);
  const mapRows=data=>(data&&data.rows||[]).map(r=>({keys:r.keys,clicks:r.clicks,impressions:r.impressions,ctr:r.ctr,position:r.position}));
  const gaRows=data=>(data&&data.rows||[]).map(r=>({eventName:r.dimensionValues&&r.dimensionValues[0]&&r.dimensionValues[0].value,eventCount:Number(r.metricValues&&r.metricValues[0]&&r.metricValues[0].value||0),users:Number(r.metricValues&&r.metricValues[1]&&r.metricValues[1].value||0)}));
  const out={
    generatedAt:new Date().toISOString(),period:{start,end},
    searchConsole:{sites:sites.map(x=>({siteUrl:x.siteUrl,permissionLevel:x.permissionLevel})),totals:mapRows(totals),queries:mapRows(queries),pages:mapRows(pages),devices:mapRows(devices),countries:mapRows(countries),searchAppearance:mapRows(appearance),sitemaps:(maps&&maps.sitemap||[]).map(s=>({path:s.path,lastSubmitted:s.lastSubmitted,lastDownloaded:s.lastDownloaded,isPending:s.isPending,isSitemapsIndex:s.isSitemapsIndex,type:s.type,contents:s.contents,errors:s.errors,warnings:s.warnings}))},
    analytics:{property,events28d:gaRows(ga),realtime:gaRows(rt),customDimensions:(dims&&dims.customDimensions||[]).map(d=>({name:d.name,parameterName:d.parameterName,displayName:d.displayName,scope:d.scope,description:d.description}))}
  };
  console.log('ACTION2_GOOGLE_DIAGNOSTIC='+JSON.stringify(out));
})().catch(err=>{console.error('ACTION2_GOOGLE_DIAGNOSTIC_ERROR',err&&err.message,err&&err.status||'');process.exit(1);});
