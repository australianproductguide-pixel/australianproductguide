'use strict';
const assert=require('node:assert/strict');
const layer=require('../lib/consumer-intelligence-v47');

const sony=layer.productPanel(new URL('https://australianproductguide.au/products/sony-wh-1000xm6/'));
assert.match(sony,/Connected decision intelligence/);
assert.match(sony,/Deep maintained evidence/,'deep-evidence products should communicate their maintained evidence tier when no factEvidence map is populated');
assert.doesNotMatch(sony,/0 maintained fact-level evidence points/,'consumer UI must never imply zero evidence for a maintained deep-evidence product');
assert.match(sony,/Verified retailer variant pathway/,'Sony WH-1000XM6 is currently a verified Amazon Australia colour variant, not an unqualified exact generic-colour destination');
assert.doesNotMatch(sony,/current exact-model retailer check/,'consumer proof must not relabel a verified variant as an exact-model retailer check');
assert.match(sony,/awaiting an authorised exact-product source/);
assert.match(sony,/Exact and verified-variant retailer states are kept distinct/,'consumer copy must explain the retailer identity distinction');
console.log('CONSUMER_INTELLIGENCE_V47_PRODUCT_PROOF_QA=PASS');
