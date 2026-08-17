const assert=require('node:assert/strict');
const data=require('../data');
const baseline=475;
const expected=[
  'lg-oled-b6-55-inch-oled55b6psa',
  'samsung-s90h-55-inch-oled-qa55s90hawxxy',
  'asus-zenbook-s16-um5606',
  'lenovo-yoga-pro-7i-gen10-aura-14',
  'hisense-75u6sau-75-inch-u6s-uled-miniled-tv',
  'hisense-75u7sau-75-inch-u7s-uled-miniled-tv',
  'tcl-75c7l-75-inch-c7l-sqd-miniled-tv',
  'lg-75qned86bsa-75-inch-qned86-miniled-tv'
];
const before=data.products.map(p=>p.slug);
assert(data.products.length>=baseline,`clean GitHub-maintained catalogue must contain at least the certified ${baseline}-product v4.1 baseline`);
assert.equal(new Set(before).size,before.length,'canonical catalogue must not contain duplicate product slugs');
for(const slug of expected)assert.equal(before.filter(x=>x===slug).length,1,`${slug} must exist exactly once in canonical data`);
require('../lib/consumer-readability-v13');
const after=data.products.map(p=>p.slug);
assert.equal(data.products.length,before.length,'consumer presentation layer must not mutate canonical catalogue count');
assert.deepEqual(after,before,'consumer presentation layer must not mutate canonical catalogue identity/order');
const exported=require('../lib/catalogue-export').catalogueJson();
assert.equal(exported.productCount,data.products.length,'source catalogue exporter must resolve the canonical catalogue count');
assert.equal(exported.products.length,data.products.length,'catalogue export rows must match canonical count');
for(const slug of expected)assert(exported.products.some(p=>p['Product Slug']===slug),`${slug} missing from source export`);
console.log(`CATALOGUE_SOURCE_AUTHORITY=PASS products=${data.products.length} runtimeMutation=0 certifiedBaseline=${baseline} canonicalSentinels=${expected.length}`);
