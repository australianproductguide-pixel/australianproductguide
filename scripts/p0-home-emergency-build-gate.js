'use strict';

// Temporary P0 deployment gate for the 1 Sep 2026 homepage restoration incident.
// The normal qa:deploy command remains unchanged and available for full certification.
// Vercel has been re-invoking the project build command repeatedly while the site is on a
// degraded homepage. Keep the production build bounded to the exact homepage/navigation safety
// checks needed to restore service; remove this temporary gate immediately after Production is
// restored and verified.

const {spawnSync}=require('node:child_process');
const checks=[
  'scripts/scout-navigator-v7-global-qa.js',
  'scripts/desktop-nav-parity-v50-qa.js',
  'scripts/search-p0-source-qa.js',
  'scripts/runtime-javascript-syntax.js',
  'scripts/pagespeed-performance-v89-qa.js'
];
for(const script of checks){
  const result=spawnSync(process.execPath,[script],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
console.log('P0_HOME_EMERGENCY_BUILD_GATE=PASS');
