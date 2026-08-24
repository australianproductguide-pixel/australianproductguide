'use strict';

const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {products,categories}=require('../data');
const {brands}=require('../lib/routes');
const proof=require('../lib/apg-proof-rail-v103');

function assert(condition,message){
  if(!condition)throw new Error(`APG Proof Rail v103 QA failed: ${message}`);
}

const stats=proof.proofStats();
assert(stats.products===products.length,'product count must come from the live catalogue');
assert(stats.categories===Object.keys(categories).length,'category count must come from the live catalogue');
assert(stats.brands===brands.length,'brand count must come from the maintained product set');
assert(stats.products>0&&stats.categories>0&&stats.brands>0,'dynamic proof counts must be populated');

const cards=proof.proofCards(stats);
assert(cards.length===5,'exactly five governed proof cards are required');
assert(cards[0].value===String(stats.products),'maintained product value must be dynamic');
assert(cards[0].headline===`Maintained products across ${stats.categories} categories`,'category count must be dynamic');
assert(cards[0].support===`${stats.brands} brands represented`,'brand count must be dynamic');
assert(cards[1].headline==='Commercial relationships add zero recommendation points','independence wording drifted');
assert(cards[2].value==='Australian-first','Australian-first proof must use plain language');
assert(cards[3].value==='Sources shown','evidence proof must use plain language');
assert(cards[4].value==='Best fit','fit proof must use plain language');
assert(!cards.some(card=>['AU','SRC','FIT'].includes(card.value)),'cryptic proof abbreviations must not return');

const html=proof.ApgProofRail(stats);
assert((html.match(/data-proof-card/g)||[]).length===5,'SSR output must contain five proof cards');
assert((html.match(/data-proof-dot>/g)||[]).length===5,'SSR output must contain five progress indicators');
assert(html.includes('aria-label="Australian Product Guide proof rail"'),'semantic section label missing');
assert(html.includes('aria-label="Previous proof"'),'previous control accessible label missing');
assert(html.includes('aria-label="Next proof"'),'next control accessible label missing');
assert(html.includes('data-proof-current>1</strong>'),'screen-reader progress state missing');
assert(html.includes('apg-proof-dot-v103 is-active'),'first progress indicator must be active in SSR');
assert(html.includes('data-apg-proof-autoplay="5000"'),'five-second autoplay contract missing from SSR');
assert(html.includes('data-proof-autoplay-toggle'),'autoplay pause/resume control missing');
assert(html.includes('aria-label="Pause automatic proof rotation"'),'autoplay control accessible label missing');
assert(html.includes('aria-live="off"'),'automatic rotation must not create repetitive live-region announcements');
assert(!/apg-proof-mark-v103/.test(html),'legacy split-flap proof marks must be removed');
assert(html.includes(`data-apg-proof-products="${stats.products}"`),'SSR product provenance marker missing');
assert(html.includes(`data-apg-proof-categories="${stats.categories}"`),'SSR category provenance marker missing');
assert(html.includes(`data-apg-proof-brands="${stats.brands}"`),'SSR brand provenance marker missing');

const sample='<!doctype html><html><head></head><body><main><section class="apg-proof-band-v20"><div>legacy proof</div></section><section id="next">Start with your situation</section></main></body></html>';
const transformed=proof.transformHomepage(sample,'/');
assert(transformed.includes('data-apg-proof-rail'),'homepage legacy banner was not replaced');
assert(!transformed.includes('legacy proof'),'legacy proof content survived replacement');
assert(transformed.includes(proof.CSS),'proof rail stylesheet was not injected');
assert(transformed.includes(proof.JS),'proof rail enhancer was not injected');
assert(proof.transformHomepage(sample,'/categories/')===sample,'non-home routes must remain untouched');
assert(proof.transformHomepage(transformed,'/')===transformed,'homepage transform must be idempotent');

const css=fs.readFileSync(path.join(__dirname,'..','public','assets','apg-proof-rail-v103.css'),'utf8');
assert(/scroll-snap-type\s*:\s*x mandatory/i.test(css),'CSS scroll snap is required');
assert(/flex\s*:\s*0 0 calc\(\(100% - 32px\)\/3\)/i.test(css),'desktop must expose three equal cards');
assert(/@media\(max-width:780px\)[\s\S]*?flex-basis\s*:\s*100%/i.test(css),'mobile must expose one card at a time');
assert(/@media\(max-width:780px\)[\s\S]*?min-height\s*:\s*208px/i.test(css),'mobile card must use the final compact 208px minimum height');
assert(/@media\(max-width:780px\)[\s\S]*?margin-top\s*:\s*-20px/i.test(css),'mobile rail must tighten the gap beneath the homepage explainer');
const phraseBlock=(css.match(/\.apg-proof-value-v103\.is-phrase\s*\{([\s\S]*?)\}/)||[])[1]||'';
assert(/display\s*:\s*block/i.test(phraseBlock),'phrase proof must render as editorial text');
assert(/padding\s*:\s*0/i.test(phraseBlock),'phrase proof must not retain pill padding');
assert(/border\s*:\s*0/i.test(phraseBlock),'phrase proof must not retain a button-like border');
assert(/background\s*:\s*transparent/i.test(phraseBlock),'phrase proof must not retain a button-like background');
assert(/background\s*:\s*rgba\(255,255,255,\.135\)/i.test(css),'decorative proof circles must use the softened opacity');
assert(/width\s*:\s*44px/i.test(css)&&/height\s*:\s*44px/i.test(css),'arrow touch targets must remain at least 44px');
assert(/apg-proof-dot-v103\.is-active[\s\S]*?width\s*:\s*22px/i.test(css),'active pill progress treatment missing');
assert(/apg-proof-autoplay-toggle-v103[\s\S]*?width\s*:\s*24px[\s\S]*?height\s*:\s*24px/i.test(css),'compact autoplay control sizing missing');
assert(/apg-proof-autoplay-toggle-v103\.is-paused[\s\S]*?is-play/i.test(css),'pause/resume visual state missing');
assert(!/#1C1E20 0 48%/.test(css),'legacy black split-flap visual treatment must be removed');
assert(/prefers-reduced-motion\s*:\s*reduce/i.test(css),'reduced-motion support missing');
assert(/prefers-reduced-motion\s*:\s*reduce[\s\S]*?apg-proof-autoplay-toggle-v103\s*\{display:none!important\}/i.test(css),'autoplay control must disappear when reduced motion disables rotation');

const js=fs.readFileSync(path.join(__dirname,'..','public','assets','apg-proof-rail-v103.js'),'utf8');
new vm.Script(js,{filename:'apg-proof-rail-v103.js'});
assert(/const AUTO_DELAY=5000;/.test(js),'autoplay must hold each proof for five seconds');
assert(/window\.setTimeout\([\s\S]*?AUTO_DELAY\)/.test(js),'autoplay must use a resettable five-second timeout');
assert(!/setInterval\s*\(/.test(js),'autoplay must remain resettable rather than using an uncontrolled interval');
assert(js.includes('direction>0&&atEnd()')&&js.includes("moveTo('start')"),'forward navigation must wrap from the final proof to the first');
assert(js.includes('direction<0&&atStart()')&&js.includes("moveTo('end')"),'reverse navigation must wrap from the first proof to the final proof');
assert(js.includes('touchStartedAtEnd&&delta<=-SWIPE_THRESHOLD'),'an additional forward swipe at the end must wrap to the first proof');
assert(js.includes('touchStartedAtStart&&delta>=SWIPE_THRESHOLD'),'an additional reverse swipe at the start must wrap to the final proof');
assert(js.includes("event.key==='ArrowLeft'")&&js.includes("event.key==='ArrowRight'"),'keyboard arrow navigation missing');
assert(js.includes("event.key==='Home'")&&js.includes("event.key==='End'"),'keyboard boundary navigation missing');
assert(js.includes("matchMedia('(prefers-reduced-motion: reduce)')"),'JS reduced-motion preference missing');
assert(js.includes("matchMedia('(max-width: 780px)')"),'autoplay must remain scoped to the one-card mobile mode');
assert(js.includes('!reduceMotion.matches')&&js.includes('mobileMode.matches'),'autoplay eligibility must respect reduced motion and mobile mode');
assert(js.includes("document.visibilityState!=='hidden'")&&js.includes("document.addEventListener('visibilitychange'"),'autoplay must stop while the page is hidden');
assert(js.includes("'IntersectionObserver' in window")&&js.includes('intersectionRatio>=0.25'),'autoplay must only run while the rail is meaningfully visible');
assert(js.includes("root.addEventListener('focusin'")&&js.includes("root.addEventListener('pointerenter'"),'autoplay must pause during keyboard/pointer interaction');
assert(js.includes("Resume automatic proof rotation")&&js.includes("Pause automatic proof rotation"),'explicit pause/resume control logic missing');
assert(js.includes("classList.toggle('is-active'"),'progress indicators must follow active proof state');
assert(js.includes('previous.disabled=false')&&js.includes('next.disabled=false'),'looping arrows must not expose a dead end state');

console.log(`APG_PROOF_RAIL_V103_QA=PASS version=${proof.VERSION} products=${stats.products} categories=${stats.categories} brands=${stats.brands} cards=${cards.length} premium=autoplay-loop`);
