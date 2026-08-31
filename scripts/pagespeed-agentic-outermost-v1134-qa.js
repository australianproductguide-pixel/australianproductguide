'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.resolve(__dirname,'../api/index.js'),'utf8');

assert(!source.includes('pagespeedAgenticCertification.install(wholeSiteExperience)'),
  'PageSpeed/agentic certification must not be installed inside wholeSiteExperience');
assert(source.includes('const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);'),
  'Scout presentation must complete before final transport certification');
assert(source.includes('const finalHandler=pagespeedAgenticCertification.wrap(presentationHandler);'),
  'PageSpeed/agentic certification must be the final public response wrapper');
assert(source.trim().endsWith('module.exports=finalHandler;'),
  'The outermost certified handler must be the exported production handler');

console.log(JSON.stringify({
  ok:true,
  gate:'PAGESPEED_AGENTIC_OUTERMOST_V1134_OK',
  finalWrapper:'pagespeedAgenticCertification.wrap(presentationHandler)',
  intent:'Capture every late-injected homepage stylesheet while preserving the existing 3/3 agentic-browsing contract.'
},null,2));
