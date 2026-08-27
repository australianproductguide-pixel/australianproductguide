'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const runtime=require('../lib/premium-mobile-decision-commerce-v112-runtime');

const productionSource=fs.readFileSync(require.resolve('./production-premium-mobile-v112'),'utf8');
const expected=`v${runtime.VERSION}`;
assert.equal(expected,'v112.1','Protected v112 runtime version changed; review the Production certification contract deliberately');
assert.match(productionSource,/EXPECTED='v112\.1'/,'Production v112 browser certification must wait for the current v112.1 response contract');
assert.match(productionSource,/data-apg-premium-mobile-commerce=\\?"v112\.1\\?"/,'Production v112 browser certification must select the current v112.1 body contract');
assert.doesNotMatch(productionSource,/EXPECTED='v112\.0'|data-apg-premium-mobile-commerce=\\?"v112\.0\\?"|expose v112\.0/,'Stale v112.0 Production certification contract survived');
console.log(`PRODUCTION_PREMIUM_MOBILE_V112_CONTRACT=PASS runtime=${runtime.VERSION} expected=${expected}`);
