#!/usr/bin/env node
'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const runtime=require('../lib/footer-navigation-v83');
const api=require('../api');

const css=fs.readFileSync(path.join(__dirname,'../public/assets/footer-navigation-v83.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../public/assets/footer-navigation-v83.js'),'utf8');

assert.equal(runtime.FOOTER_NAVIGATION_VERSION,'83.0','footer runtime version');
assert.equal(api.FOOTER_NAVIGATION_VERSION,'83.0','api outer runtime must expose footer v83');
assert.equal(api.VERSION,'52.0','Search v52 public contract must be preserved');
assert.equal(api.DECISION_VERSION,'50.6','Decision Lab v50.6 public contract must be preserved');
assert.equal(api.TRUST_CENTRE_VERSION,'82.1','Trust Centre v82.1 must remain underneath footer v83');

const sample='<html><head><title>APG</title></head><body><main>Test</main><footer class="apg-footer-v11"><nav class="footer-v11-nav"><div class="footer-v11-group"><a href="/about/">About us</a></div></nav></footer></body></html>';
const injected=runtime.injectFooterNavigation(sample);
assert.match(injected,/\/assets\/footer-navigation-v83\.css\?v=83\.0/,'footer CSS injection');
assert.match(injected,/\/assets\/footer-navigation-v83\.js\?v=83\.0/,'footer JS injection');
assert.equal((injected.match(/footer-navigation-v83\.css/g)||[]).length,1,'footer CSS injected once');
assert.equal((injected.match(/footer-navigation-v83\.js/g)||[]).length,1,'footer JS injected once');
assert.equal(runtime.injectFooterNavigation(injected),injected,'footer injection idempotent');

assert.match(css,/min-height:44px!important/,'mobile links require 44px tap target');
assert.match(css,/@media\(max-width:700px\)/,'mobile footer breakpoint');
assert.match(css,/grid-template-columns:1fr!important/,'mobile footer must use one column');
assert.match(css,/\.apg-assistant-launcher\.apg-footer-overlap-guard/,'Scout overlap guard CSS');
assert.match(css,/pointer-events:none!important/,'overlapping Scout launcher must not intercept footer');
assert.match(css,/touch-action:manipulation!important/,'footer links are touch-optimised');

assert.match(js,/IntersectionObserver/,'footer visibility observer required');
assert.match(js,/apg-footer-overlap-guard/,'footer visibility must toggle Scout guard');
assert.doesNotMatch(js,/preventDefault\s*\(/,'footer runtime must not intercept native navigation');
assert.doesNotMatch(js,/location\.(?:href|assign|replace)/,'footer runtime must not replace native navigation');

console.log('FOOTER_NAVIGATION_V83_SOURCE=PASS search=52.0 decision=50.6 trust=82.1');
