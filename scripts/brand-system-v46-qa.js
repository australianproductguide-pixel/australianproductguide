'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const brand=require('../lib/brand-system-v46');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'public/assets/brand-system-v46.css'),'utf8');
const commerceCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-commerce.css'),'utf8');
const imageryCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-imagery.css'),'utf8');
const finalCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-final.css'),'utf8');
const proofCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-research-proof.css'),'utf8');
const v47Source=fs.readFileSync(path.join(root,'lib/consumer-intelligence-v47.js'),'utf8');
const api=fs.readFileSync(path.join(root,'api/index.js'),'utf8');
const wrapper=fs.readFileSync(path.join(root,'lib/brand-system-v46.js'),'utf8');

assert.equal(brand.VERSION,'46');
assert.equal(brand.CSS_PATH,'/assets/brand-system-v46.css');
assert.equal(brand.COMMERCE_CSS_PATH,'/assets/brand-system-v46-commerce.css');
assert.equal(brand.IMAGERY_CSS_PATH,'/assets/brand-system-v46-imagery.css');
assert.equal(brand.FINAL_CSS_PATH,'/assets/brand-system-v46-final.css');
assert.match(brand.FINAL_CSS_VERSION,/^46\.\d+$/,'v46 final cache version must remain within the v46 contract');
assert.equal(brand.RESEARCH_PROOF_CSS_PATH,'/assets/brand-system-v46-research-proof.css');
assert.equal(brand.RESEARCH_PROOF_VERSION,'46.2');
assert(api.includes("require('../lib/brand-system-v46')"),'api/index.js must preserve v46 as the presentation foundation in the current runtime chain');
assert(api.includes("require('../lib/consumer-intelligence-v47')"),'api/index.js must preserve Consumer Intelligence v47 as the current final decision layer');
assert(wrapper.includes("require('./amazon-shopping-creative-final-v41')"),'v46 must preserve current Amazon shopping creative v41 downstream');
assert(v47Source.includes("require('./brand-system-v46')"),'Consumer Intelligence v47 must remain layered over Brand System v46');

for(const [name,value] of Object.entries({blue:'#2563EB',navy:'#0F172A',teal:'#06B6D4',green:'#10B981',light:'#F1F5F9',slate:'#64748B'}))assert(css.includes(value),`missing master brand token ${name} ${value}`);
assert(css.includes('Inter,ui-sans-serif'),'Inter must remain the first-choice APG typeface without adding an external font dependency');
for(const selector of ['.global-search','.search-suggestions','.suggest-item','.suggest-thumb','.apg-account-shell','.apg-account-head','.apg-profile-hero-v24','.apg-profile-tabs-v24','.apg-verification-v24','.apg-rv-v43','.apg-rv-card-v43','.apg-rv-compare-v43','.apg-assistant-launcher','.apg-assistant-head','.scout-v5-bubble','.scout-v5-action.primary','.apg-nav-v8 .apg-deals-link','.apg-mobile-account-v20','.apg-footer-v11','.category-hero[data-category-editorial-image]'])assert(css.includes(selector),`v46 missing governed surface ${selector}`);
for(const selector of ['.apg-shopping-hero','.apg-shopping-principles','.apg-shopping-card','.apg-shopping-icon','.apg-shopping-bridge-shell','.apg-search-shopping-shell','.apg-amz-v41-card','.apg-amz-v41-eyebrow','.apg-amz-v41-cta','.apg-amz-v41-art','.apg-amz-v41-orbit','.apg-amz-v41-chip'])assert(commerceCss.includes(selector),`v46 shopping reconciliation missing ${selector}`);
for(const selector of ['.category-hero-media','.category-hero-media>img','.category-hero-media-shade','.category-hero-media-overlay','.category-hero-photo-label','.category-hero-media-overlay strong','.category-hero-media figcaption','.category-hero-media figcaption a'])assert(imageryCss.includes(selector),`v46 imagery reconciliation missing ${selector}`);
for(const selector of ['.mobile-power.apg-v325-decision-mobile','.mobile-power.apg-v26-scout-mobile','.apg-home-panel-label-v9','.apg-home-gold-button-v9'])assert(finalCss.includes(selector),`v46 final legacy-colour cleanup missing ${selector}`);
assert(finalCss.includes('body[data-brand-system-v46="true"][data-institutional-v9="true"] .institutional-home-v9 .apg-home-decision-panel-v9 .apg-home-panel-label-v9'),'homepage panel label override must target the actual current institutional v9 decision-panel markup with authoritative specificity');
assert(!finalCss.includes('.apg-home-panel-v9 .apg-home-panel-label-v9'),'homepage panel label override must not regress to the superseded non-existent .apg-home-panel-v9 parent');
assert(finalCss.includes('background-color:rgba(37,99,235,.20)!important'),'homepage panel label must explicitly govern computed background colour');
for(const selector of ['.apg-proof-band-v19','.apg-proof-band-v20','.apg-proof-kicker-v20','.apg-proof-main-v20>strong','.apg-proof-trust-v20'])assert(proofCss.includes(selector),`research-proof exception missing ${selector}`);
for(const selector of ['.ci47-panel','.ci47-proof span','.ci47-actions a:first-child','.ci47-handoff','.ci47-handoff a'])assert(v47Source.includes(selector),`Consumer Intelligence v47 missing governed APG surface ${selector}`);
assert(proofCss.includes('body[data-brand-system-v46="true"][data-brand-fidelity-v323="true"] .apg-proof-band-v20 .apg-proof-trust-v20'),'latest proof exception must explicitly outrank the legacy v32.3 trust-copy selector');

for(const retired of ['#082735','#087c76','#075e5a','#0b6f70','#0b3445','#08786f','#ffd95d','#f6bd45','#f3b548','#f4b548']){
  assert(!css.toLowerCase().includes(retired),`retired historical brand colour leaked into v46: ${retired}`);
  assert(!commerceCss.toLowerCase().includes(retired),`retired historical brand colour leaked into v46 commerce: ${retired}`);
  assert(!imageryCss.toLowerCase().includes(retired),`retired historical brand colour leaked into v46 imagery: ${retired}`);
  assert(!finalCss.toLowerCase().includes(retired),`retired historical brand colour leaked into v46 final cleanup: ${retired}`);
  assert(!proofCss.toLowerCase().includes(retired),`retired non-approved proof colour leaked into research-proof exception: ${retired}`);
  assert(!v47Source.toLowerCase().includes(retired),`retired historical brand colour leaked into Consumer Intelligence v47: ${retired}`);
}
for(const retired of ['#cedfdd','#f7fbfa','#1d655e','#164f4a','#d9e6e4','#23414a','#5a6f75','#d6e4e2','#f8fbfb'])assert(!v47Source.toLowerCase().includes(retired),`v47 teal-era presentation colour remains: ${retired}`);
for(const approved of ['#FFD65B','#F4BB45','#F2B348','#E0A630','#D89C24'])assert(proofCss.includes(approved),`approved maintained-research heritage colour missing: ${approved}`);
for(const approved of ['#FFD65B','#F4BB45','#F2B348']){assert(!finalCss.includes(approved),`yellow must not leak into standard UI cleanup: ${approved}`);assert(!v47Source.includes(approved),`yellow must not leak into Consumer Intelligence v47: ${approved}`);}
for(const required of ['#2563EB','#1D4ED8','#0F172A','#EFF6FF','#E2E8F0','#64748B'])assert(v47Source.includes(required),`Consumer Intelligence v47 missing current APG colour ${required}`);
assert(proofCss.includes('color:#0F172A!important'),'maintained-research proof text must remain dark APG navy/black for contrast');
assert(proofCss.includes('Yellow is restricted to this research-proof surface'),'yellow exception must remain explicitly scoped and documented');
assert(finalCss.includes('sole approved yellow/gold'),'v46 final cleanup must document that the proof strip is the only yellow/gold exception');
assert(v47Source.includes('sole approved yellow/gold heritage surface'),'v47 must inherit the same yellow-exception governance');
const greenOccurrences=(css.match(/#10B981/gi)||[]).length;assert.equal(greenOccurrences,1,'master APG green should be declared once and used through semantic success states rather than as a general skin');
assert(css.includes('Semantic colour discipline. Green is reserved for actual success/positive state.'),'v46 must document semantic green discipline');
assert(css.includes('.pill.good'),'positive state styling must remain explicitly governed');assert(css.includes('.is-error'),'error state styling must remain explicitly governed');

const sample='<!doctype html><html><head><title>APG</title></head><body><main>Test</main></body></html>';const once=brand.inject(sample),twice=brand.inject(once);const finalVersion=brand.FINAL_CSS_VERSION;
assert(once.includes('data-brand-system-v46="true"'),'v46 body marker missing');
assert(once.includes('/assets/brand-system-v46.css?v=46'),'v46 master stylesheet link missing');
assert(once.includes('/assets/brand-system-v46-commerce.css?v=46'),'v46 shopping stylesheet link missing');
assert(once.includes('/assets/brand-system-v46-imagery.css?v=46'),'v46 imagery stylesheet link missing');
assert(once.includes(`/assets/brand-system-v46-final.css?v=${finalVersion}`),'v46 final cleanup stylesheet link missing');
assert(once.includes('/assets/brand-system-v46-research-proof.css?v=46.2'),'v46 research-proof exception stylesheet link missing');
assert(once.indexOf(`/assets/brand-system-v46-final.css?v=${finalVersion}`)>once.indexOf('/assets/brand-system-v46-imagery.css?v=46'),'final standard-UI cleanup must load after general imagery styling');
assert(once.indexOf('/assets/brand-system-v46-research-proof.css?v=46.2')>once.indexOf(`/assets/brand-system-v46-final.css?v=${finalVersion}`),'research-proof exception must remain the final v46 stylesheet');assert.equal(twice,once,'v46 HTML injection must be idempotent');

function rgb(hex){const h=hex.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}function lum(hex){const [r,g,b]=rgb(hex).map(v=>{const s=v/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b;}function contrast(a,b){const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return(hi+.05)/(lo+.05);}
for(const [fg,bg,label,min] of [['#0F172A','#FFFFFF','navy on white',7],['#FFFFFF','#2563EB','white on APG blue',4.5],['#64748B','#FFFFFF','slate on white',4.5],['#FFFFFF','#0F172A','white on APG navy',7],['#0F172A','#F2B348','dark text on maintained-research gold',7]])assert(contrast(fg,bg)>=min,`${label} contrast ${contrast(fg,bg).toFixed(2)} is below ${min}:1`);
assert(css.includes('rgba(15,23,42,.94)'),'generic editorial-image hero must include a high-contrast navy scrim');assert(css.includes('background-position:center'),'generic editorial-image hero must maintain controlled image framing');assert(imageryCss.includes('rgba(15,23,42,.96)'),'actual category photo markup must include a high-contrast APG navy lower scrim');assert(imageryCss.includes('rgba(15,23,42,.97)'),'actual category photo attribution must use an APG navy caption surface');assert(imageryCss.includes('color:#FFFFFF!important'),'actual category photo overlay must force high-contrast white copy');assert(css.includes('@media(max-width:920px)'),'v46 must explicitly govern responsive/mobile presentation');assert(css.includes('@media(max-width:640px)'),'v46 must explicitly govern compact mobile controls');assert(commerceCss.includes('@media(max-width:820px)'),'shopping discovery must retain responsive v46 coverage');assert(imageryCss.includes('@media(max-width:920px)')&&imageryCss.includes('@media(max-width:640px)'),'category imagery must retain tablet/mobile contrast governance');assert(v47Source.includes('@media(max-width:700px)'),'Consumer Intelligence v47 must retain mobile layout coverage');
console.log('APG Brand System v46/v47 source QA passed: palette=PASS typography=PASS account=PASS search=PASS scout=PASS research=PASS shopping-v39=PASS shopping-v41=PASS imagery=PASS v47=PASS legacy-colour-cleanup=PASS panel-label-precedence=PASS maintained-research-yellow-exception=PASS contrast=PASS responsive=PASS');
