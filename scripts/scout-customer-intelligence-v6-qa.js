'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const core=require('../lib/scout-concierge-v5-core');
const patch=require('../lib/scout-customer-intelligence-v6');
const decisionState=require('../lib/decision-state-v2');

assert.equal(app.SCOUT_CUSTOMER_INTELLIGENCE_VERSION,patch.VERSION,'outer runtime must expose Scout customer intelligence version');
assert.equal(core.SCOUT_CUSTOMER_INTELLIGENCE_VERSION,patch.VERSION,'Scout core must be patched after the current runtime lineage');
assert.equal(patch.installed,true,'Scout v6 patch must be installed');

const connected=core.buildResponse({text:'How do Search, Scout, Decision Lab and Compare work together?',pageContext:{path:'/'}});
assert.equal(connected.intent,'apg_information');
assert.match(connected.message,/carry the same decision forward/i);
assert(connected.actions.some(action=>action.url==='/decision-lab/'),'connected-tool answer must offer Decision Lab');
assert(connected.actions.some(action=>action.url==='/compare/'),'connected-tool answer must offer Compare');
assert.equal(connected.meta?.commercialRecommendationWeight,0);

const factors=core.buildResponse({text:'What matters most in this category?',pageContext:{path:'/categories/wireless-headphones/',categorySlug:'wireless-headphones'}});
assert.equal(factors.intent,'category_question');
assert((factors.bullets||[]).length>=2,'category response must expose decision factors');
assert.equal(factors.meta?.categoryDecisionSchemaVersion!==undefined,true,'category response must identify governed decision schema');

const product=core.buildResponse({text:'Help me with this page',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(product.intent,'product_question');
assert.equal(product.references?.[0],'bose-quietcomfort-ultra-headphones');
assert(product.actions.some(action=>/bad fit|right for my situation/i.test(action.label)),'product context must offer fit-oriented next question');

const hardExclusionState={
  category:'wireless-headphones',
  budget:{amount:500,currency:'AUD',mode:'ceiling',hard:true},
  hardConstraints:{budgetCeiling:500,requiredTags:[],excludedTags:['gaming'],excludedBrands:[],requiredBrands:[]},
  softPreferences:[{tag:'comfort',priority:'high'}],
  softExclusions:[],numericConstraints:[],categoryIntent:{},brandPreference:null,
  shortlist:[],rejectedProducts:[],evidenceGaps:[],pendingQuestion:null,lastTrace:null
};
const aligned=patch.structuredRecommendationParity({intent:'product_recommendation',message:'legacy text',decisionState:hardExclusionState,products:[{slug:'legacy'}],actions:[],meta:{}},{text:'recommend now'},{path:'/categories/wireless-headphones/',pageType:'category',categorySlug:'wireless-headphones',comparisonProductSlugs:[],currentSearchQuery:'',currentFilters:{}});
assert.equal(aligned.meta?.decisionStateSchema,decisionState.VERSION,'Scout recommendation must identify canonical Decision State v2');
assert.equal(aligned.meta?.decisionInputMode,'structured-state','Scout internal recommendation evaluation must use structured state');
assert.equal(aligned.meta?.commercialRecommendationWeight,0,'commercial recommendation weight must remain zero');
assert.equal(aligned.meta?.hardConstraintFallback,true,'unsupported hard exclusion must remain fail-closed rather than silently eligible');
assert(Array.isArray(aligned.products)&&aligned.products.length>0,'qualified maintained alternatives must remain available to the customer');
assert.equal(aligned.decisionState?.pendingQuestion,null,'existing pending-question field must be preserved');
assert(Array.isArray(aligned.decisionState?.rejectedProducts),'existing rejected-products state must be preserved');

const uncertainty=core.buildResponse({text:'What is uncertain or unverified?',pageContext:{path:'/decision-lab/'},decisionState:{...hardExclusionState,lastTrace:{productSlug:'bose-quietcomfort-ultra-headphones',evidenceState:'WEAK_EVIDENCE',verificationNeeds:['Gaming exclusion is not verified for this candidate.'],gaps:[],conflicts:[],confidence:{level:'LOW'}}}});
assert.match(uncertainty.message,/same APG evidence|maintained APG evidence/i);
assert((uncertainty.bullets||[]).some(item=>/evidence boundary/i.test(item)),'uncertainty answer must make the evidence boundary visible');

console.log(JSON.stringify({version:patch.VERSION,status:'PASS',checks:{connectedJourneys:true,pageAwareHelp:true,categoryFactors:true,structuredDecisionState:true,hardConstraintFailClosed:true,evidenceConfidence:true,commercialWeightZero:true}},null,2));
