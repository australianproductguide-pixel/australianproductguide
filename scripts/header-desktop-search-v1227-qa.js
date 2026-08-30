'use strict';
const assert=require('node:assert/strict');
const runtime=require('../lib/header-desktop-search-v1227-runtime');
const navigator=require('../lib/scout-navigator-v7-global-runtime');
assert.equal(runtime.VERSION,'122.7');
assert.equal(navigator.VERSION,'7.1');
assert.equal(runtime.CSS_PATH,'/assets/header-desktop-search-v1227.css');
assert.equal(runtime.JS_PATH,'/assets/header-desktop-search-v1227.js');
for(const token of [
  '@media(min-width:921px)',
  'main#main .apg-home-search-v9{display:none!important}',
  '.apg-search-category',
  'background:#FBBF24!important',
  'height:52px!important',
  '.search-suggestions',
  'apg-desktop-suggest-item-v1227'
])assert(runtime.CSS.includes(token),`desktop Search CSS missing ${token}`);
for(const token of [
  "'X-APG-Search-JSON':'1'",
  "payload.version!=='search-ranking-v4'",
  "category&&category.addEventListener('change'",
  "input.addEventListener('input',schedule)",
  "e.key==='ArrowDown'",
  "e.key==='ArrowUp'",
  "e.key==='Enter'",
  "e.key==='Escape'",
  "href=\"/search/?q="
])assert(runtime.JS.includes(token),`desktop Search JS missing ${token}`);
for(const forbidden of ['commissionWeight','scoreProduct(','rankDecision(','localStorage.setItem(','sessionStorage.setItem('])assert(!runtime.JS.includes(forbidden),`desktop Search must not introduce ${forbidden}`);
const sample='<!doctype html><html><head></head><body data-apg-route-family="home"><main id="main"><form class="global-search apg-home-search-v9"></form></main></body></html>';
const injected=runtime.inject(sample);
assert(injected.includes('name="apg-header-desktop-search"'));
assert(injected.includes('/assets/header-desktop-search-v1227.css?v=122.7'));
assert(injected.includes('/assets/header-desktop-search-v1227.js?v=122.7'));
console.log(JSON.stringify({version:runtime.VERSION,status:'PASS',checks:{desktopHeroSearchSuppressed:true,categorySelectorPreserved:true,yellowFullHeightSearchAction:true,liveSuggestions:true,keyboardNavigation:true,searchV52AuthorityPreserved:true}},null,2));
