'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const brand=require('../lib/brand-system-v46');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'public/assets/brand-system-v46.css'),'utf8');
const api=fs.readFileSync(path.join(root,'api/index.js'),'utf8');
const wrapper=fs.readFileSync(path.join(root,'lib/brand-system-v46.js'),'utf8');

assert.equal(brand.VERSION,'46');
assert.equal(brand.CSS_PATH,'/assets/brand-system-v46.css');
assert(api.includes("require('../lib/brand-system-v46')"),'api/index.js must make v46 the final presentation layer');
assert(wrapper.includes("require('./amazon-shopping-final-v39')"),'v46 must preserve the governed v39 shopping runtime downstream');

for(const [name,value] of Object.entries({
  blue:'#2563EB',navy:'#0F172A',teal:'#06B6D4',green:'#10B981',light:'#F1F5F9',slate:'#64748B'
})) assert(css.includes(value),`missing master brand token ${name} ${value}`);
assert(css.includes('Inter,ui-sans-serif'),'Inter must remain the first-choice APG typeface without adding an external font dependency');

for(const selector of [
  '.global-search', '.search-suggestions', '.suggest-item', '.suggest-thumb',
  '.apg-account-shell', '.apg-account-head', '.apg-profile-hero-v24', '.apg-profile-tabs-v24', '.apg-verification-v24',
  '.apg-proof-band-v19', '.apg-proof-band-v20',
  '.apg-rv-v43', '.apg-rv-card-v43', '.apg-rv-compare-v43',
  '.apg-assistant-launcher', '.apg-assistant-head', '.scout-v5-bubble', '.scout-v5-action.primary',
  '.apg-nav-v8 .apg-deals-link', '.apg-mobile-account-v20', '.apg-footer-v11',
  '.category-hero[data-category-editorial-image]'
]) assert(css.includes(selector),`v46 missing governed surface ${selector}`);

for(const retired of ['#082735','#087c76','#075e5a','#0b6f70','#ffd95d','#f6bd45','#f3b548','#f4b548']){
  assert(!css.toLowerCase().includes(retired),`retired historical brand colour leaked into v46: ${retired}`);
}

const greenOccurrences=(css.match(/#10B981/gi)||[]).length;
assert.equal(greenOccurrences,1,'master APG green should be declared once and used through semantic success states rather than as a general skin');
assert(css.includes('Semantic colour discipline. Green is reserved for actual success/positive state.'),'v46 must document semantic green discipline');
assert(css.includes('.pill.good'),'positive state styling must remain explicitly governed');
assert(css.includes('.is-error'),'error state styling must remain explicitly governed');

const sample='<!doctype html><html><head><title>APG</title></head><body><main>Test</main></body></html>';
const once=brand.inject(sample),twice=brand.inject(once);
assert(once.includes('data-brand-system-v46="true"'),'v46 body marker missing');
assert(once.includes('/assets/brand-system-v46.css?v=46'),'v46 stylesheet link missing');
assert.equal(twice,once,'v46 HTML injection must be idempotent');

function rgb(hex){const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
function lum(hex){const [r,g,b]=rgb(hex).map(v=>{const s=v/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05);}
for(const [fg,bg,label,min] of [
  ['#0F172A','#FFFFFF','navy on white',7],
  ['#FFFFFF','#2563EB','white on APG blue',4.5],
  ['#64748B','#FFFFFF','slate on white',4.5],
  ['#FFFFFF','#0F172A','white on APG navy',7]
]) assert(contrast(fg,bg)>=min,`${label} contrast ${contrast(fg,bg).toFixed(2)} is below ${min}:1`);

assert(css.includes('rgba(15,23,42,.94)'),'editorial-image hero must include a high-contrast navy scrim');
assert(css.includes('background-position:center'),'editorial-image hero must maintain controlled image framing');
assert(css.includes('@media(max-width:920px)'),'v46 must explicitly govern responsive/mobile presentation');
assert(css.includes('@media(max-width:640px)'),'v46 must explicitly govern compact mobile controls');

console.log('APG Brand System v46 source QA passed: palette=PASS typography=PASS account=PASS search=PASS scout=PASS research=PASS contrast=PASS responsive=PASS');
