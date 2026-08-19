'use strict';
const assert=require('assert');
const fs=require('fs');
const handler=require('../lib/interaction-reliability-v37');

assert.equal(handler.VERSION,'37');
assert.equal(handler.ASSET_PATH,'/assets/interaction-reliability-v37.js');
assert.equal(handler.CSS_PATH,'/assets/interaction-reliability-v37.css');
const js=handler.clientJs;
const css=handler.css;
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
  'closeSearchSuggestions(form)',
  'window.addEventListener(\'submit\',guardCoreSubmit,true)',
  'window.addEventListener(\'click\',guardCoreLink,true)',
  'location.assign(target.href)',
  'window.addEventListener(\'pageshow\',restoreAfterHistory)'
]) assert(js.includes(required),`missing reliability contract: ${required}`);
assert(!js.includes('event.preventDefault()'),'v37 must preserve native link/form navigation');
for(const required of [
  '.apg-alternative-reason{display:block;margin-top:6px}',
  '@media(max-width:760px)',
  'form[data-search-shell] .search-suggestions',
  'position:absolute!important',
  'top:calc(100% + 8px)!important',
  'bottom:auto!important',
  'transform:none!important',
  '.search-suggestions[hidden]{display:none!important}',
  'button[type="submit"]{position:relative!important;z-index:2!important}'
]) assert(css.includes(required),`missing v37 CSS contract: ${required}`);
assert(!/position:\s*fixed/i.test(css),'v37 autocomplete guard must never make Search suggestions viewport-fixed');
const sample='<!doctype html><html><head></head><body><span style="display:block;margin-top:6px"><strong>Alternative</strong></span></body></html>';
const injected=handler.inject(sample);
assert(injected.includes('/assets/interaction-reliability-v37.css?v=37'));
assert(injected.includes('/assets/interaction-reliability-v37.js?v=37'));
assert(injected.includes('class="apg-alternative-reason"'),'inline alternative style must become a CSP-safe class');
assert(!injected.includes('style="display:block;margin-top:6px"'),'CSP-blocked alternative inline style must be removed');
assert.equal(handler.inject(injected),injected,'asset injection must be idempotent');

const scoutBridge=fs.readFileSync(require.resolve('../public/assets/platform-cohesion-v26.js'),'utf8');
new Function(scoutBridge);
assert(scoutBridge.includes('if(panel.hidden){'),'Scout compatibility bridge must only open when Scout is still closed');
assert(scoutBridge.includes("window.apgScout&&typeof window.apgScout.open==='function'"),'Scout compatibility bridge must prefer the current Scout API');
assert(scoutBridge.includes('event.stopImmediatePropagation()'),'Scout activation must be isolated from other feature handlers');
assert(scoutBridge.includes("window.addEventListener('click',event=>"),'Scout compatibility bridge must own click activation at the window capture boundary');
assert(scoutBridge.includes("['pointerdown','mousedown','touchstart','pointerup','touchend'].forEach(type=>"),'Scout bridge must isolate pointer and touch precursor events before legacy handlers');
assert(scoutBridge.includes('window.addEventListener(type,stopScoutPreactivation,true)'),'Scout precursor isolation must run in window capture phase');
assert(scoutBridge.includes('q=[object Object]'),'Scout bridge source must document the mobile regression being prevented');
assert(!scoutBridge.includes("document.addEventListener('click',event=>"),'Scout activation must not fall back to the too-late document capture boundary');
assert(!/if\(mobile\)mobile\.click\(\);\s*launcher\.click\(\);/.test(scoutBridge),'Scout bridge must never unconditionally double-toggle the launcher');
const cohesionSource=fs.readFileSync(require.resolve('../lib/platform-cohesion-v26'),'utf8');
assert(cohesionSource.includes("platform-cohesion-v26.js?v=26.4"),'window-capture Scout bridge must be cache-busted');

console.log('APG interaction reliability v37 source QA passed');
