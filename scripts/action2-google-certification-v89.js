'use strict';

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
  const [gsc,ga4,events,realtime]=await Promise.all([
    growth.searchConsoleDetailedSnapshot(site.siteUrl),
    growth.analyticsSnapshot(property.propertyId),
    growth.analyticsEventBaseline(property.propertyId),
    growth.analyticsRealtimeEvents(property.propertyId)
  ]);
  const requiredEvents=['product_view','site_search','decision_lab_submitted','comparison_started','comparison_opened','product_saved','affiliate_click','amazon_shopping_click','scout_message'];
  const byEvent=new Map(events.map(x=>[x.eventName,x]));
  const summary={
    certifiedAt:new Date().toISOString(),
    auth:'vercel-oidc-google-wif-service-account',
    searchConsole:{
      siteUrl:gsc.siteUrl,permissionLevel:site.permissionLevel,period:gsc.period,totals:gsc.totals,
      sitemaps:gsc.sitemaps,
      devices:gsc.devices.items,
      countries:gsc.countries.items,
      searchAppearances:gsc.searchAppearances.items,
      pageRowsReturned:gsc.pages.rows,
      apiLimitations:gsc.apiLimitations
    },
    analytics:{
      propertyId:property.propertyId,propertyName:property.displayName,snapshot:ga4,
      customDimensions:dimensions,
      funnelEvents:requiredEvents.map(eventName=>Object.assign({eventName,eventCount:0,totalUsers:0,measurementState:'ACTUAL ZERO / NOT OBSERVED IN PERIOD'},byEvent.get(eventName)||{},byEvent.has(eventName)?{measurementState:'MEASURED'}:{})),
      realtimeEvents:realtime.filter(x=>requiredEvents.includes(x.eventName))
    }
  };
  console.log('ACTION2_GOOGLE_CERTIFICATION_V89='+JSON.stringify(summary));
})().catch(error=>{
  console.error('ACTION2_GOOGLE_CERTIFICATION_V89=FAIL '+error.message);
  process.exit(1);
});