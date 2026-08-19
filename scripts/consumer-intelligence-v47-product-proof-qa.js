'use strict';
const assert=require('node:assert/strict');
const layer=require('../lib/consumer-intelligence-v47');

const sony=layer.productPanel(new URL('https://australianproductguide.au/products/sony-wh-1000xm6/'));
assert.match(sony,/Connected decision intelligence/);
assert.match(sony,/Deep maintained evidence/,'deep-evidence products should communicate their maintained evidence tier when no factEvidence map is populated');
assert.doesNotMatch(sony,/0 maintained fact-level evidence points/,'consumer UI must never imply zero evidence for a maintained deep-evidence product');
assert.match(sony,/1 current exact-model retailer check/);
assert.match(sony,/awaiting an authorised exact-product source/);
console.log('CONSUMER_INTELLIGENCE_V47_PRODUCT_PROOF_QA=PASS');
