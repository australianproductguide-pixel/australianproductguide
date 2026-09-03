'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.resolve(__dirname,'../api/index.js'),'utf8');
const pagespeedSource=fs.readFileSync(path.resolve(__dirname,'../lib/pagespeed-agentic-certification-v113-runtime.js'),'utf8');
const v128Source=fs.readFileSync(path.resolve(__dirname,'../lib/google-discoverability-performance-v128-runtime.js'),'utf8');

assert(!source.includes('pagespeedAgenticCertification.install(wholeSiteExperience)'),
  'PageSpeed/agentic certification must not be installed inside wholeSiteExperience');
assert(source.includes('const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);'),
  'Scout presentation must complete before route-scoped imagery and transport certification');
assert(source.includes('const categoryImageHandler=categoryFeaturedImagery.wrap(searchImageHandler);'),
  'route-scoped result imagery must complete before PageSpeed transport certification');
assert(source.includes('const pagespeedHandler=pagespeedAgenticCertification.wrap(categoryImageHandler);'),
  'PageSpeed/agentic certification must remain the transport and accessibility safety wrapper over the completed semantic and image response');
assert(source.includes('const reviewProfileHandler=reviewProfiles.wrap(pagespeedHandler);'),
  'review-profile presentation may only wrap after PageSpeed transport safety');
assert(source.includes('const finalHandler=brandLogoStability.wrap(reviewProfileHandler);'),
  'brand-logo stability must retain the PageSpeed-certified response beneath it');
assert(source.includes('const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(desktopAboutTrustContrastHandler);'),
  'v128 must remain the narrow final cache, redirect and viewport-delivery layer');
assert(source.trim().endsWith('module.exports=googleDiscoverabilityPerformanceHandler;'),
  'the completed v128-wrapped handler must be the exported production handler');

const navigatorIndex=source.indexOf('const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);');
const categoryImageIndex=source.indexOf('const categoryImageHandler=categoryFeaturedImagery.wrap(searchImageHandler);');
const pagespeedIndex=source.indexOf('const pagespeedHandler=pagespeedAgenticCertification.wrap(categoryImageHandler);');
const reviewIndex=source.indexOf('const reviewProfileHandler=reviewProfiles.wrap(pagespeedHandler);');
const v128Index=source.indexOf('const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(desktopAboutTrustContrastHandler);');
assert(navigatorIndex>=0&&categoryImageIndex>navigatorIndex&&pagespeedIndex>categoryImageIndex&&reviewIndex>pagespeedIndex&&v128Index>reviewIndex,
  'current public response wrappers must remain in the certified direct order');

assert(pagespeedSource.includes("const VERSION='113.5';"),'P0-safe PageSpeed runtime version must be v113.5');
assert(pagespeedSource.includes("const RUNTIME_CSS_CONSOLIDATION='P0_DISABLED_RECURSIVE_CAPTURE';"),'runtime CSS recursive capture must be explicitly disabled');
assert(pagespeedSource.includes('function capture(_handler,url){throw unsafeCaptureError(url)}'),'legacy recursive capture entry point must fail closed');
assert(!pagespeedSource.includes("const home=capture(downstream,'/');"),'PageSpeed runtime must never recursively render the homepage from inside a live response');
assert(!pagespeedSource.includes('const asset=capture(downstream,href);'),'PageSpeed runtime must never recursively invoke the application for CSS assets');
for(const token of ['scoreProduct(','rankDecision(','commissionWeight','commercialRecommendationWeight:1'])assert(!v128Source.includes(token),`v128 final delivery layer must not contain ${token}`);

console.log(JSON.stringify({
  ok:true,
  gate:'PAGESPEED_AGENTIC_TRANSPORT_V1135_P0_SAFE',
  transportWrapper:'pagespeedAgenticCertification.wrap(categoryImageHandler)',
  laterNonScoringLayers:['reviewProfiles','brandLogoStability','desktopHomeHeader','desktopAboutTrustContrast','googleDiscoverabilityPerformance'],
  runtimeCssConsolidation:'P0_DISABLED_RECURSIVE_CAPTURE',
  recursiveApplicationCapture:false,
  intent:'Preserve synchronous transport, accessibility and agentic certification after the completed semantic and image response, while permitting later non-scoring presentation and narrow final-delivery wrappers.'
},null,2));
