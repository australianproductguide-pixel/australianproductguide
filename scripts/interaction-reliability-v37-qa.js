'use strict';
const assert=require('assert');
const fs=require('fs');
const handler=require('../lib/interaction-reliability-v37');

assert.equal(handler.VERSION,'37');
assert.equal(handler.ASSET_PATH,'/assets/interaction-reliability-v37.js');
const js=handler.clientJs;
new Function(js);
for(const required of [
  'form[data-search-shell]',
  'form.decision-form[data-busy-form]',
  'a.button[href^="/decision-lab/"]',
  'a[data-compare-link]',
  '[data-compare-product]',
  "localStorage.getItem('apgCompare')",
  "url.pathname!=='/api/account/scout'",
  'SCOUT_TIMEOUT_MS=15000',
  'window.addEventListener(\'submit\',guardCoreSubmit,true)',
  'window.addEventListener(\'click\',guardCoreLink,true)',
  'location.assign(target.href)',
  'window.addEventListener(\'pageshow\',restoreAfterHistory)'
]) assert(js.includes(required),`missing reliability contract: ${required}`);
assert(!js.includes('event.preventDefault()'),'v37 must preserve native link/form navigation');
const sample='<!doctype html><html><head></head><body><main>APG</main></body></html>';
const injected=handler.inject(sample);
assert(injected.includes('/assets/interaction-reliability-v37.js?v=37'));
assert.equal(handler.inject(injected),injected,'asset injection must be idempotent');

const scoutBridge=fs.readFileSync(require.resolve('../public/assets/platform-cohesion-v26.js'),'utf8');
new Function(scoutBridge);
assert(scoutBridge.includes('if(panel.hidden){'),'Scout compatibility bridge must only open when Scout is still closed');
assert(scoutBridge.includes("window.apgScout&&typeof window.apgScout.open==='function'"),'Scout compatibility bridge must prefer the current Scout API');
assert(!/if\(mobile\)mobile\.click\(\);\s*launcher\.click\(\);/.test(scoutBridge),'Scout bridge must never unconditionally double-toggle the launcher');
const cohesionSource=fs.readFileSync(require.resolve('../lib/platform-cohesion-v26'),'utf8');
assert(cohesionSource.includes("platform-cohesion-v26.js?v=26.1"),'repaired Scout bridge must be cache-busted');

console.log('APG interaction reliability v37 source QA passed');
