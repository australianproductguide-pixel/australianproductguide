'use strict';
const assert=require('assert');
const layer=require('../lib/pagespeed-performance-v89');

const sample=`<!doctype html><html><head>
<link rel="stylesheet" href="/assets/site-optimised.css?scope=core&v=test">
<link rel="stylesheet" href="/assets/privacy-experience.css">
<link rel="stylesheet" href="/assets/illustrative-experience.css">
<link rel="stylesheet" href="/assets/consumer-v13.css">
<link rel="stylesheet" href="/assets/amazon-shopping-creative-v41.css?v=41" media="print" fetchpriority="low" onload="this.media='all'">
</head><body><script src="/assets/privacy-experience.js" defer></script><script src="/assets/illustrative-experience.js" defer></script></body></html>`;
const out=layer.transformHtml(sample,'/');
assert.ok(out.includes('/assets/site-optimised.css?scope=core&v=test'),'core bundle must remain');
assert.ok(out.includes('/assets/home-critical-v89.css?v='),'critical bundle must be injected');
assert.ok(out.includes('data-apg-critical-css="v89.0"'));
assert.ok(!out.includes('href="/assets/privacy-experience.css"'),'privacy CSS must be bundled');
assert.ok(!out.includes('href="/assets/illustrative-experience.css"'),'illustrative CSS must be bundled');
assert.ok(!out.includes('href="/assets/consumer-v13.css"'),'consumer CSS must be bundled');
assert.ok(out.includes('/assets/amazon-shopping-creative-v41.css?v=41'),'existing async/noncritical CSS must remain untouched');
assert.ok(out.includes('/assets/privacy-experience.js?v='),'mutable privacy JS must be deployment-versioned');
assert.ok(out.includes('/assets/illustrative-experience.js?v='),'mutable illustration JS must be deployment-versioned');
assert.ok(out.includes('name="apg-pagespeed-performance-v89"'));
const nonHome=layer.transformHtml(sample,'/categories/');
assert.ok(nonHome.includes('href="/assets/privacy-experience.css?v='),'non-home CSS must not be consolidated but should be versioned');
assert.ok(!nonHome.includes('/assets/home-critical-v89.css'));
assert.equal(layer.HOME_CRITICAL_CSS.length,17,'critical bundle contract changed unexpectedly');
console.log('PAGESPEED_PERFORMANCE_V89_OK');
