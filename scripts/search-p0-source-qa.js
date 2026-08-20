'use strict';
const assert=require('assert');
const fs=require('fs');
const runtime=require('../lib/search-reliability-v51-runtime');
const decision=require('../lib/decision-lab-resilience-v50-runtime');
const api=require('../api/index');

assert.equal(runtime.VERSION,'51.0');
assert.equal(runtime.PATCH,'search-p0-2026-08-20-single-nav-r1');
assert.equal(api.VERSION,'51.0','Search v51 must remain the outer API runtime');
assert.equal(api.PATCH,runtime.PATCH,'outer API marker must be Search v51');
assert.equal(decision.VERSION,'50.4','Decision Lab v50.4 must remain directly beneath Search v51');
assert.equal(decision.ENGINE,'decision-engine-v4');
new Function(runtime.clientJs);

for(const contract of [
  "window.__APG_SEARCH_RELIABILITY_V51__",
  "const BUSY_TIMEOUT_MS=10000",
  "event.preventDefault()",
  "event.stopImmediatePropagation()",
  "form.matches('form[data-search-shell]')",
  "location.assign(target.href)",
  "window.stop()",
  "window.addEventListener('pageshow',restore)",
  "[data-search-suggestions]",
  "aria-activedescendant",
  "entry.q||entry.query||entry.value||entry.label",
  "migrateRecentSearches()",
  "localStorage.setItem(SEARCH_KEY,JSON.stringify(rows.slice(0,10)))"
]) assert(runtime.clientJs.includes(contract),`missing Search P0 contract: ${contract}`);

assert.equal((runtime.clientJs.match(/location\.assign\(target\.href\)/g)||[]).length,1,'Search must have exactly one controlled location.assign path');
assert(!runtime.clientJs.includes('scheduleNavigation('),'Search v51 must not add a second fallback navigation');
assert(!runtime.clientJs.includes('location.href=active.href'),'active recent Search must use the same controlled navigator');

const html='<html><head><script src="/assets/app.js?v=test" defer></script></head><body><form data-search-shell></form></body></html>';
const transformed=runtime.inject(html);
const v51=transformed.indexOf('/assets/search-reliability-v51.js');
const app=transformed.indexOf('/assets/app.js');
assert(v51>=0&&app>=0&&v51<app,'Search v51 must load before the legacy app Search handlers');
assert.equal((transformed.match(/search-reliability-v51\.js/g)||[]).length,1,'Search v51 asset must be injected once');

const legacyMobile=fs.readFileSync(require.resolve('../lib/mobile-history-ux-v16'),'utf8');
assert(legacyMobile.includes("SEARCH_KEY='apgRecentSearches'"),'mobile history must still consume the shared recent-search key');
assert(runtime.clientJs.indexOf('migrateRecentSearches()')<runtime.clientJs.indexOf("window.addEventListener('submit',captureSubmit,true)"),'recent storage must be normalised before Search handlers activate');

const decisionHtml='<html><head><script src="/assets/app.js" defer></script></head><body></body></html>';
const nested=runtime.inject(decision.inject(decisionHtml));
assert(nested.indexOf('/assets/decision-lab-resilience-v50.js')<nested.indexOf('/assets/app.js'),'Decision Lab v50.4 must remain before app.js');
assert(nested.indexOf('/assets/search-reliability-v51.js')<nested.indexOf('/assets/app.js'),'Search v51 must remain before app.js');

console.log('Search P0 source contracts passed');
