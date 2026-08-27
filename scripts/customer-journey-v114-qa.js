'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const modulePath=require.resolve('../lib/customer-journey-programme-v1141-runtime');
const basePath=require.resolve('../lib/customer-journey-programme-v114-runtime');
const adapterSource=fs.readFileSync(modulePath,'utf8');
const runtimeSource=fs.readFileSync(basePath,'utf8');
const client=fs.readFileSync(require.resolve('../public/assets/customer-journey-programme-v114.js'),'utf8');
const api=fs.readFileSync(require.resolve('../api/index'),'utf8');
const v114=require(modulePath);

assert.match(runtimeSource,/formalDecisionGradeRequiresAllGates:true/,'Decision Grade must fail closed');
assert.match(runtimeSource,/This category is decision-ready/,'Known overclaim regression must be explicitly repaired');
assert.match(runtimeSource,/data-apg114-deduped-pick/,'Decision shortcuts must de-duplicate repeated products');
assert.match(adapterSource,/\/api\/intelligence\/category-quality/,'Category quality register endpoint missing');
assert.match(adapterSource,/\/api\/search-suggest/,'Search suggestion endpoint missing');
assert.match(runtimeSource,/allowedDistance/,'Bounded typo recovery missing');
assert.match(runtimeSource,/filterControl\('apg114-evidence'/,'Evidence filter missing');
assert.match(runtimeSource,/retailer==='identity'/,'Retailer identity filter missing');
assert.match(runtimeSource,/imagery==='verified'/,'Verified imagery filter missing');
assert.match(runtimeSource,/data-apg114-continuity/,'Decision continuity surface missing');
assert.match(runtimeSource,/does not alter recommendation scoring/,'Continuity must not silently affect scoring');
assert.match(runtimeSource,/min-height:44px/,'44px target control missing');
assert.match(runtimeSource,/prefers-reduced-motion/,'Reduced motion control missing');
assert.match(client,/ArrowDown/,'Autocomplete keyboard down control missing');
assert.match(client,/ArrowUp/,'Autocomplete keyboard up control missing');
assert.match(client,/Escape/,'Autocomplete escape control missing');
assert.match(client,/aria-activedescendant/,'Autocomplete active-descendant support missing');
assert.match(client,/search_suggestion_selected/,'Search suggestion analytics missing');
assert.match(client,/search_zero_result/,'Zero-result analytics missing');
assert.match(client,/category_filter_applied/,'Filter analytics missing');
assert.match(client,/decision_continuity_used/,'Decision continuity analytics missing');
assert.match(api,/customer-journey-programme-v1141-runtime/,'v114.1 composition adapter not wired into API');
assert.match(api,/customerJourneyProgramme\.install\(wholeSiteExperience\)/,'v114.1 must install inside Whole-Site v109');
assert.match(api,/const handler=wholeSiteExperience\.wrap\(premiumMobileHandler\);/,'Whole-Site v109 must remain the final public HTML communication layer');
assert.equal(v114.TARGET_HTML('/deals/'),false,'Deals must remain outside the v114 HTML transform');
assert.equal(v114.TARGET_HTML('/categories/electric-toothbrushes/'),true,'Category pages must receive v114 controls');
assert.equal(v114.TARGET_HTML('/search/'),true,'Search must receive v114 controls');
assert.equal(v114.TARGET_HTML('/compare/custom/'),true,'Comparison must receive v114 controls');
assert.equal(v114.TARGET_HTML('/decision-lab/'),true,'Decision Lab must receive v114 controls');

const register=v114.categoryQualityRegister();
assert.equal(register.summary.categories,90,'Canonical category count drifted');
assert.equal(register.summary.products,482,'Canonical product count drifted');
assert.equal(register.priorityProgramme.summary.priorityCategoryCount,8,'Priority category programme drifted');
assert.equal(register.priorityProgramme.summary.decisionGradeCount,0,'No priority category is currently certified Decision Grade');
const starter=register.rows.find(row=>row.slug==='electric-toothbrushes');
assert(starter,'Electric toothbrushes category missing');
assert.equal(starter.formalDecisionGrade,false,'Starter category must not be promoted to Decision Grade');
const coffee=register.rows.find(row=>row.slug==='coffee-machines');
assert(coffee&&coffee.priorityCategory,'Coffee machines must remain in priority programme');
assert.equal(coffee.formalDecisionGrade,false,'Coffee machines must remain fail-closed until all formal gates pass');

const typo=v114.searchSuggestions('hedphones');
assert(typo.some(item=>/headphones/i.test(item.label)),'Bounded typo recovery should suggest headphones');
const multiTypo=v114.searchSuggestions('wireles headphones');
assert(multiTypo.some(item=>/wireless headphones/i.test(item.label)),'Multi-word typo recovery should suggest Wireless headphones');
const shortNoise=v114.searchSuggestions('tvv');
assert(!shortNoise.some(item=>item.matchType==='typo'),'Short queries must not receive fuzzy typo correction');

const corrected=v114.fixMaturityLanguage('<p>This category is decision-ready, but APG has not yet verified an exact retailer destination for every maintained product.</p>',starter);
assert(!/category is decision-ready/i.test(corrected),'Known public maturity overclaim survived transform');
assert(/starter-evidence/i.test(corrected),'Starter maturity repair should remain explicit');

const transformed=v114.transformHtml('<html><head></head><body><main><section class="category-hero"><h1>Electric toothbrushes</h1></section><p>This category is decision-ready, but APG has not yet verified an exact retailer destination for every maintained product.</p><form class="filter-bar"><button class="button compact" type="submit">Apply</button></form></main></body></html>','/categories/electric-toothbrushes/',new URL('https://australianproductguide.au/categories/electric-toothbrushes/'));
assert.match(transformed,/data-apg114-category-quality="STARTER_EVIDENCE"/,'Category quality surface missing');
assert.match(transformed,/Evidence and purchase confidence/,'Category decision filters missing');
assert.match(transformed,/customer-journey-programme-v114\.js/,'Progressive enhancement asset missing');
assert.match(transformed,/prefers-reduced-motion/,'Accessibility CSS missing');

const compareUrl=new URL('https://australianproductguide.au/compare/custom/?products=breville-barista-touch-bes880,bose-quietcomfort-ultra-headphones');
const continuity=v114.compareContinuity('<html><body><main><aside class="apg112-compare-toolbar">Toolbar</aside></main></body></html>','/compare/custom/',compareUrl);
assert.match(continuity,/Continue in Decision Lab/,'Compare to Decision Lab continuity missing');
assert.match(continuity,/reference context only/,'Continuity must disclose non-scoring context');
const lab=v114.decisionLabContext('<html><body><main><h1>Decision Lab</h1></main></body></html>',new URL('https://australianproductguide.au/decision-lab/?category=coffee-machines&products=breville-barista-touch-bes880,bose-quietcomfort-ultra-headphones'));
assert.match(lab,/Comparison context carried in/,'Decision Lab context restoration missing');
assert.match(lab,/data-apg112-compare-products=/,'Scout comparison context bridge missing');

console.log(JSON.stringify({status:'PASS',version:v114.VERSION,summary:register.summary,priority:register.priorityProgramme.summary,typoSuggestion:typo[0]||null,wholeSiteBoundaryPreserved:true,dealsUntouched:true}));
