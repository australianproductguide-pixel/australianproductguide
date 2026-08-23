'use strict';
const assert=require('assert');
const layer=require('../lib/action2-measurement-v87');
const scout=require('../lib/scout-concierge-v5-client');

const direct=layer.enrichScoutPayload({
  references:['sony-wh-1000xm6'],
  meta:{amazonAu:{linkType:'affiliate-direct'}},
  actions:[{label:'View on Amazon Australia',url:'https://www.amazon.com.au/dp/B012345678?tag=auproductguid-22',affiliate:true,external:true}]
});
assert.equal(direct.actions[0].measurement.retailer,'Amazon Australia');
assert.equal(direct.actions[0].measurement.linkKind,'direct');
assert.equal(direct.actions[0].measurement.destinationKey,'direct_asin');
assert.equal(direct.actions[0].measurement.placement,'scout_recommendation');
assert.equal(direct.actions[0].measurement.referralContext,'scout');
assert.ok(direct.actions[0].measurement.productSlug);

const fallback=layer.enrichScoutPayload({
  references:['sony-wh-1000xm6'],
  meta:{amazonAu:{linkType:'search-fallback'}},
  actions:[{label:'Search on Amazon Australia',url:'https://www.amazon.com.au/s?k=Sony+WH-1000XM6&tag=auproductguid-22',affiliate:true,external:true}]
});
assert.equal(fallback.actions[0].measurement.linkKind,'search');
assert.equal(fallback.actions[0].measurement.destinationKey,'search_fallback');

const patched=layer.patchClient(scout.js);
assert.notEqual(patched,scout.js,'Scout client renderer must be patched');
for(const token of ['data-affiliate-link','data-affiliate-retailer','data-affiliate-kind','data-product-slug','data-affiliate-category','data-affiliate-placement','data-affiliate-context','data-affiliate-destination'])assert.ok(patched.includes(token),`missing ${token}`);
assert.ok(patched.includes('scout_recommendation'));
assert.ok(patched.includes('nofollow sponsored noopener'));
assert.ok(patched.includes("track('scout_message',{conversation_turn:state.turns+1})"),'Scout message analytics must remain structured and must not include message text');
assert.ok(!patched.includes("track('scout_message',{text"),'raw Scout message must never enter analytics');
console.log('ACTION2_MEASUREMENT_V87_OK');
