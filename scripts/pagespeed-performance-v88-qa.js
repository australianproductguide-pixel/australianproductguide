'use strict';
const assert=require('assert');
const layer=require('../lib/pagespeed-performance-v88');

const target='/assets/footer-navigation-v83.css';
const core='/assets/brand-system-v46.css';
const source=`<!doctype html><html><head><link rel="stylesheet" href="${core}"><link rel="stylesheet" href="${target}"></head><body>APG</body></html>`;
const home=layer.transformHtml(source,'/');
assert.ok(home.includes(`<link rel="stylesheet" href="${core}">`),'core stylesheet must remain render blocking');
assert.ok(home.includes(`href="${target}" media="print"`),'secondary homepage stylesheet must become nonblocking');
assert.ok(home.includes(`data-apg-noncritical-style="v${layer.PAGESPEED_PERFORMANCE_VERSION}"`),'nonblocking style marker missing');
assert.ok(home.includes('name="apg-pagespeed-performance"'),'PageSpeed meta marker missing');
assert.ok(home.includes(`<noscript><link rel="stylesheet" href="${target}"></noscript>`),'noscript fallback missing');

const inner=layer.transformHtml(source,'/categories/robot-vacuums/');
assert.ok(inner.includes(`<link rel="stylesheet" href="${target}">`),'non-home routes must retain stylesheet loading semantics');
assert.ok(!inner.includes('data-apg-noncritical-style'),'non-home routes must not receive homepage async styling');
assert.ok(inner.includes('name="apg-pagespeed-performance"'),'version marker should remain available for Production verification');

const query=`<link rel="stylesheet" href="${target}?v=83.2">`;
const queryOut=layer.makeSecondaryCssNonBlocking(query);
assert.ok(queryOut.includes('media="print"'),'query-string target should be recognised by pathname');
assert.ok(queryOut.includes('?v=83.2'),'asset version/query string must be preserved');

assert.equal(layer.pathOf('https://australianproductguide.au/assets/footer-navigation-v83.css?v=1'),target);
assert.ok(layer.HOME_NONBLOCKING_CSS.has(target));
assert.equal(typeof layer.enrichScoutPayload,'function','v87 measurement exports must remain reachable through v88');
console.log('PAGESPEED_PERFORMANCE_V88_OK');
