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
assert(cards[0].stat===String(stats.products),'maintained product stat must be dynamic');
assert(cards[0].headline===`Maintained products across ${stats.categories} categories`,'category count must be dynamic');
assert(cards[0].support===`${stats.brands} brands represented`,'brand count must be dynamic');
assert(cards[1].headline==='Commercial relationships add zero recommendation points','independence wording drifted');
assert(cards[2].stat==='AU'&&cards[3].stat==='SRC'&&cards[4].stat==='FIT','governed proof marks drifted');

const html=proof.ApgProofRail(stats);
assert((html.match(/data-proof-card/g)||[]).length===5,'SSR output must contain five proof cards');
assert(html.includes('aria-label="Australian Product Guide proof rail"'),'semantic section label missing');
assert(html.includes('aria-label="Previous proof"'),'previous control accessible label missing');
assert(html.includes('aria-label="Next proof"'),'next control accessible label missing');
assert(html.includes('data-proof-current>1</strong>'),'SSR progress state missing');
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
assert(/width\s*:\s*44px/i.test(css)&&/height\s*:\s*44px/i.test(css),'mobile arrow touch targets must be at least 44px');
assert(/prefers-reduced-motion\s*:\s*reduce/i.test(css),'reduced-motion support missing');

const js=fs.readFileSync(path.join(__dirname,'..','public','assets','apg-proof-rail-v103.js'),'utf8');
new vm.Script(js,{filename:'apg-proof-rail-v103.js'});
assert(!/setInterval\s*\(/.test(js),'autoplay/timer rotation is not permitted');
assert(!/autoplay/i.test(js),'autoplay must not be introduced');
assert(js.includes("event.key==='ArrowLeft'")&&js.includes("event.key==='ArrowRight'"),'keyboard arrow navigation missing');
assert(js.includes("event.key==='Home'")&&js.includes("event.key==='End'"),'keyboard boundary navigation missing');
assert(js.includes("matchMedia('(prefers-reduced-motion: reduce)')"),'JS reduced-motion preference missing');

console.log(`APG_PROOF_RAIL_V103_QA=PASS products=${stats.products} categories=${stats.categories} brands=${stats.brands} cards=${cards.length}`);
