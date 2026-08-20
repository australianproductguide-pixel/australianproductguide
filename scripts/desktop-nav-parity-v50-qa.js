'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const brand=require('../lib/brand-system-v46');

const root=path.join(__dirname,'..');
const css=fs.readFileSync(path.join(root,'public/assets/desktop-nav-parity-v50.css'),'utf8');
const proofCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-research-proof.css'),'utf8');
const decisionBadgeCss=fs.readFileSync(path.join(root,'public/assets/homepage-decision-badge-v18.css'),'utf8');

assert.equal(brand.NAV_PARITY_CSS_PATH,'/assets/desktop-nav-parity-v50.css');
assert.equal(brand.NAV_PARITY_CSS_VERSION,'50');
assert(css.includes('@media (min-width:921px)'),'desktop nav parity must remain desktop-only');
assert(css.includes('.apg-nav-v8 .apg-v26-scout-nav'),'Ask Scout desktop nav must be governed');
assert(css.includes('.apg-nav-v8 .apg-deals-link'),'Deals desktop nav must be governed');
assert(css.includes('min-height:40px!important'),'Ask Scout must use the standard primary-nav control height');
assert(css.includes('padding:9px 13px!important'),'Ask Scout must use the standard primary-nav padding');
assert(css.includes('font-size:14px!important'),'Ask Scout must use the standard desktop primary-nav font size');
assert(css.includes('font-weight:780!important'),'Scout and Deals must use the same primary-nav weight as ordinary links');
assert(css.includes('background:transparent!important'),'Scout and Deals must not ship with a permanent promotional fill');
assert(css.includes('border:0!important'),'Scout and Deals must not ship as outlined pills');
assert(css.includes('@media (min-width:921px) and (max-width:1120px)'),'compact desktop parity must cover the existing navigation breakpoint');
assert(css.includes('padding-inline:10px!important')&&css.includes('font-size:12.5px!important'),'Scout and Deals must match the compact desktop nav geometry');
assert(css.includes('.apg-nav-v8 .nav-inner>a:hover'),'normal primary links must share the same hover language');
assert(css.includes('.apg-nav-v8 .apg-v26-scout-nav:hover'),'Ask Scout must share the same hover language');
assert(css.includes('background:#EFF6FF!important')&&css.includes('color:#1D4ED8!important'),'desktop primary-nav hover must use the current APG blue system');

const sample='<!doctype html><html><head><title>APG</title></head><body><main>Test</main></body></html>';
const out=brand.inject(sample);
const finalIndex=out.indexOf('/assets/brand-system-v46-final.css?v=46.5');
const navIndex=out.indexOf('/assets/desktop-nav-parity-v50.css?v=50');
const proofIndex=out.indexOf('/assets/brand-system-v46-research-proof.css?v=46.2');
assert(finalIndex>=0&&navIndex>finalIndex,'desktop nav parity must load after legacy brand cleanup');
assert(proofIndex>navIndex,'maintained-research proof exception must remain the final v46 stylesheet');
assert.equal(brand.inject(out),out,'nav parity injection must remain idempotent');

// Do not let a header cleanup regress either owner-approved homepage yellow treatment.
assert(proofCss.includes('#FFD65B')&&proofCss.includes('#F4BB45')&&proofCss.includes('#F2B348'),'maintained-research yellow proof treatment must remain intact');
assert(decisionBadgeCss.toLowerCase().includes('#f3b548!important'),'homepage decision guidance badge must remain yellow');

console.log('APG desktop nav parity v50 QA passed: Ask Scout=standard nav, Deals=standard nav, compact desktop=PASS, hover=blue system, mobile untouched, homepage yellow accents preserved.');
