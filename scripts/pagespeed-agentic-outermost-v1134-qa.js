'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.resolve(__dirname,'../api/index.js'),'utf8');
const pagespeedSource=fs.readFileSync(path.resolve(__dirname,'../lib/pagespeed-agentic-certification-v113-runtime.js'),'utf8');

assert(!source.includes('pagespeedAgenticCertification.install(wholeSiteExperience)'),
  'PageSpeed/agentic certification must not be installed inside wholeSiteExperience');
assert(source.includes('const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);'),
  'Scout presentation must complete before final transport certification');
assert(source.includes('const finalHandler=pagespeedAgenticCertification.wrap(presentationHandler);'),
  'PageSpeed/agentic certification must remain the final public response wrapper');
assert(source.trim().endsWith('module.exports=finalHandler;'),
  'The outermost certified handler must be the exported production handler');
assert(pagespeedSource.includes("const VERSION='113.5';"),'P0-safe PageSpeed runtime version must be v113.5');
assert(pagespeedSource.includes("const RUNTIME_CSS_CONSOLIDATION='P0_DISABLED_RECURSIVE_CAPTURE';"),'runtime CSS recursive capture must be explicitly disabled');
assert(pagespeedSource.includes('function capture(_handler,url){throw unsafeCaptureError(url)}'),'legacy recursive capture entry point must fail closed');
assert(!pagespeedSource.includes("const home=capture(downstream,'/');"),'PageSpeed runtime must never recursively render the homepage from inside a live response');
assert(!pagespeedSource.includes('const asset=capture(downstream,href);'),'PageSpeed runtime must never recursively invoke the application for CSS assets');

console.log(JSON.stringify({
  ok:true,
  gate:'PAGESPEED_AGENTIC_OUTERMOST_V1135_P0_SAFE',
  finalWrapper:'pagespeedAgenticCertification.wrap(presentationHandler)',
  runtimeCssConsolidation:'P0_DISABLED_RECURSIVE_CAPTURE',
  recursiveApplicationCapture:false,
  intent:'Preserve final synchronous transport/accessibility certification while prohibiting serverless re-entry; rebuild homepage CSS consolidation as a static/build-time asset.'
},null,2));
