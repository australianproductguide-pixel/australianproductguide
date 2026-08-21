'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const brand=require('../lib/brand-system-v46');
const cohesion=require('../lib/platform-cohesion-v26');
const shoppingShell=require('../lib/amazon-shopping-shell-v39');

const root=path.join(__dirname,'..');
const proofCss=fs.readFileSync(path.join(root,'public/assets/brand-system-v46-research-proof.css'),'utf8');
const decisionBadgeCss=fs.readFileSync(path.join(root,'public/assets/homepage-decision-badge-v18.css'),'utf8');

const shellInput='<!doctype html><html><head><title>APG</title></head><body><nav class="primary-nav apg-nav-v8" aria-label="Primary"><div class="wrap nav-inner"><button id="apgProductsMenuButton" type="button" class="nav-trigger apg-products-trigger" data-discovery-trigger>Products</button><a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a><a href="/compare/">Compare</a><a href="/guides/">Buying guides</a><a href="/brands/">Brands</a><a href="/retailers/">Retailers</a><a class="nav-trust" href="/methodology/">How we compare</a></div></nav><div class="apg-mega-footer"><nav aria-label="More product research"><a href="/compare/">Compare products</a></nav></div><nav id="mobileNav"><div><a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a><details class="mobile-section"><summary>Popular products</summary></details></div></nav><footer class="apg-footer-v11"><div class="footer-v11-group"><h3>Connect</h3><a href="/search/">Search APG</a></div></footer></body></html>';

const withScout=cohesion.addScoutNavigation(shellInput);
assert(withScout.includes('class="nav-trigger apg-v26-scout-nav"'),'Ask Scout must reuse the native desktop nav-trigger class');
assert(withScout.includes('data-v26-scout-open'),'Ask Scout behaviour hook must remain intact');

const out=shoppingShell.enhance(withScout);
assert(out.includes('<a data-shopping-primary href="/deals/">Deals</a>'),'Deals must be emitted as a native primary-nav anchor');
assert(!out.includes('class="apg-deals-link"'),'Deals must not carry the retired promotional desktop class');
assert(!shoppingShell.css.includes('.apg-nav-v8 .apg-deals-link'),'shopping shell CSS must not special-case desktop Deals');

const primary=(out.match(/<nav class="primary-nav apg-nav-v8"[\s\S]*?<\/nav>/)||[])[0]||'';
for(const label of ['Products','Decision Lab','Ask Scout','Compare','Buying guides','Brands','Retailers','Deals','How we compare'])assert(primary.includes(label),`primary nav missing ${label}`);
assert(primary.indexOf('Decision Lab')<primary.indexOf('Ask Scout')&&primary.indexOf('Ask Scout')<primary.indexOf('Compare'),'Ask Scout must sit between Decision Lab and Compare');
assert(primary.indexOf('Retailers')<primary.indexOf('Deals')&&primary.indexOf('Deals')<primary.indexOf('How we compare'),'Deals must sit between Retailers and How we compare');

const brandSample='<!doctype html><html><head><title>APG</title></head><body><main>Test</main></body></html>';
const branded=brand.inject(brandSample);
assert.equal(brand.NAV_PARITY_CSS_PATH,undefined,'retired nav override must not remain exported');
assert(!branded.includes('/assets/desktop-nav-parity-v50.css'),'retired nav override stylesheet must not be injected');
const finalIndex=branded.indexOf(`/assets/brand-system-v46-final.css?v=${brand.FINAL_CSS_VERSION}`);
const proofIndex=branded.indexOf(`/assets/brand-system-v46-research-proof.css?v=${brand.RESEARCH_PROOF_VERSION}`);
assert(finalIndex>=0&&proofIndex>finalIndex,'maintained-research proof exception must remain after the normal v46 presentation layer');
assert.equal(brand.inject(branded),branded,'brand injection must remain idempotent');

// Header fixes must not regress the owner-approved homepage yellow treatments.
assert(proofCss.includes('#FFD65B')&&proofCss.includes('#F4BB45')&&proofCss.includes('#F2B348'),'maintained-research yellow proof treatment must remain intact');
assert(decisionBadgeCss.toLowerCase().includes('#f3b548!important'),'homepage decision guidance badge must remain yellow');

console.log('APG desktop nav parity v50 QA passed: native nav restored, Ask Scout inherits Products styling, Deals inherits ordinary link styling, mobile untouched, homepage yellow accents preserved.');
