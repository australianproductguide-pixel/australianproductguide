'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const core=require('../lib/scout-concierge-v5-core');
const patch=require('../lib/scout-customer-intelligence-v6');
const responseDepth=require('../lib/scout-response-depth-v61');
const decisionState=require('../lib/decision-state-v2');

assert.equal(app.SCOUT_CUSTOMER_INTELLIGENCE_VERSION,patch.VERSION,'outer runtime must expose Scout customer intelligence version');
assert.equal(app.SCOUT_RESPONSE_DEPTH_VERSION,responseDepth.VERSION,'outer runtime must expose Scout response-depth version');
assert.equal(core.SCOUT_CUSTOMER_INTELLIGENCE_VERSION,patch.VERSION,'Scout core must be patched after the current runtime lineage');
assert.equal(core.SCOUT_RESPONSE_DEPTH_VERSION,responseDepth.VERSION,'Scout core must expose the post-v6 customer-response layer');
assert.equal(patch.installed,true,'Scout v6 patch must be installed');
assert.equal(responseDepth.installed,true,'Scout response depth must be installed after Scout v6');

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

const capabilities=core.buildResponse({text:'What can Scout do?',pageContext:{path:'/'}});
assert.equal(capabilities.meta?.scoutResponseDepthVersion,responseDepth.VERSION);
assert((capabilities.bullets||[]).length>=5,'Scout must explain a materially broader customer-help repertoire');
assert(capabilities.actions.some(action=>/verify before buying/i.test(action.label)),'capability answer should lead into purchase-readiness help');

const checkout=core.buildResponse({text:'What should I verify before buying?',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(checkout.intent,'price_or_retailer_question');
assert.match(checkout.message,/Bose QuietComfort Ultra/i);
assert((checkout.bullets||[]).some(item=>/exact model/i.test(item)),'checkout help must protect exact model identity');
assert((checkout.bullets||[]).some(item=>/current price/i.test(item)),'checkout help must distinguish live retailer price from maintained context');
assert.equal(checkout.meta?.commercialRecommendationWeight,0);

const freshness=core.buildResponse({text:'How current is this information?',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(freshness.intent,'methodology_question');
assert((freshness.bullets||[]).some(item=>/product evidence and retailer freshness separate/i.test(item)),'freshness answer must distinguish product evidence from retailer freshness');
assert(freshness.actions.some(action=>action.url==='/updates/'),'freshness answer must know APG Updates');

const badFit=core.buildResponse({text:'What would make this a bad fit for me?',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(badFit.intent,'product_question');
assert.match(badFit.message,/compromises that could change the decision/i);
assert((badFit.bullets||[]).length>=1,'bad-fit reasoning must expose at least one evidence-bound consideration');

const wait=core.buildResponse({text:'Should I buy now or wait for a sale?',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(wait.intent,'price_or_retailer_question');
assert.match(wait.message,/won.t predict a future sale/i,'Scout must not fabricate future pricing');
assert((wait.bullets||[]).some(item=>/future-price guess contributes zero recommendation points/i.test(item)),'purchase timing must remain commercially neutral');

const value=core.buildResponse({text:'Is this good value for the money?',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(value.intent,'product_question');
assert.match(value.message,/relative to what you actually need/i);
assert.equal(value.meta?.commercialRecommendationWeight,0);

const summary=core.buildResponse({text:'Summarise this page',pageContext:{path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:'bose-quietcomfort-ultra-headphones'}});
assert.equal(summary.intent,'product_question');
assert.match(summary.message,/maintained decision guide/i);
assert.equal(summary.references?.[0],'bose-quietcomfort-ultra-headphones');

const difference=core.buildResponse({text:'What makes APG different?',pageContext:{path:'/'}});
assert.equal(difference.intent,'apg_information');
assert((difference.bullets||[]).some(item=>/commission adds zero suitability points/i.test(item)),'APG differentiation must preserve commercial neutrality');
assert(difference.actions.some(action=>action.url==='/corrections-policy/'),'Scout must understand APG Corrections as part of site trust knowledge');

const nextStep=core.buildResponse({text:'What should I do next?',pageContext:{path:'/search/?q=wireless%20headphones',currentSearchQuery:'wireless headphones'}});
assert.equal(nextStep.intent,'contextual_decision_help');
assert((nextStep.bullets||[]).length>=1);
assert.equal(core.classifyIntent('What should I do next?',{path:'/search/'}),'customer_decision_support');

const hardExclusionState={
  category:'wireless-headphones',
  budget:{amount:500,currency:'AUD',mode:'ceiling',hard:true},
  hardConstraints:{budgetCeiling:500,requiredTags:[],excludedTags:['gaming'],excludedBrands:[],requiredBrands:[]},
  softPreferences:[{tag:'comfort',priority:'high'}],
  softExclusions:[],numericConstraints:[],categoryIntent:{},brandPreference:null,
  shortlist:[],rejectedProducts:[],evidenceGaps:[],pendingQuestion:null,lastTrace:null
};
const pageContext={path:'/categories/wireless-headphones/',pageType:'category',categorySlug:'wireless-headphones',comparisonProductSlugs:[],currentSearchQuery:'',currentFilters:{}};
const aligned=patch.structuredRecommendationParity({intent:'product_recommendation',message:'legacy text',decisionState:hardExclusionState,products:[{slug:'legacy'}],actions:[],meta:{}},{text:'recommend now'},pageContext);
assert.equal(aligned.meta?.decisionStateSchema,decisionState.VERSION,'Scout recommendation must identify canonical Decision State v2');
assert.equal(aligned.meta?.decisionInputMode,'structured-state','Scout internal recommendation evaluation must use structured state');
assert.equal(aligned.meta?.decisionLabHandoff,'context-preserving-navigation-only','Scout must distinguish URL handoff text from structured-state scoring');
assert.equal(aligned.meta?.commercialRecommendationWeight,0,'commercial recommendation weight must remain zero');
assert.equal(aligned.meta?.hardConstraintFallback,true,'unsupported hard exclusion must remain fail-closed rather than silently eligible');
assert(Array.isArray(aligned.products)&&aligned.products.length>0,'qualified maintained alternatives must remain available to the customer');
assert.equal(aligned.decisionState?.pendingQuestion,null,'existing pending-question field must be preserved');
assert(Array.isArray(aligned.decisionState?.rejectedProducts),'existing rejected-products state must be preserved');

const refine=aligned.actions.find(action=>action.label==='Refine in Decision Lab');
assert(refine&&refine.url,'structured Scout result must provide a Decision Lab handoff');
const handoff=new URL(refine.url,'https://australianproductguide.au');
assert.equal(handoff.pathname,'/decision-lab/');
assert.equal(handoff.searchParams.get('category'),'wireless-headphones','Decision Lab handoff must preserve category');
assert.equal(handoff.searchParams.get('budget'),'500','Decision Lab handoff must preserve AUD budget amount');
assert.match(handoff.searchParams.get('q')||'',/must not have gaming/i,'Decision Lab handoff must preserve the active hard exclusion as navigation context');
assert.match(handoff.searchParams.get('q')||'',/comfort/i,'Decision Lab handoff must preserve meaningful soft priority context');

const requiredBrandUrl=new URL(patch.decisionLabHandoff({...hardExclusionState,hardConstraints:{...hardExclusionState.hardConstraints,excludedTags:[],requiredBrands:['Bose']}},pageContext),'https://australianproductguide.au');
assert.match(requiredBrandUrl.searchParams.get('q')||'',/Bose only/i,'required-brand context must survive navigation even though internal scoring stays structured');
assert.equal(requiredBrandUrl.searchParams.get('category'),'wireless-headphones');

const searchHandoff=core.buildResponse({text:'Help me with this page',pageContext:{path:'/search/?q=quiet%20headphones%20for%20travel',currentSearchQuery:'quiet headphones for travel'}});
const searchLab=searchHandoff.actions.find(action=>action.url&&action.url.startsWith('/decision-lab/'));
assert(searchLab,'Search-context Scout help must offer Decision Lab');
assert.match(new URL(searchLab.url,'https://australianproductguide.au').searchParams.get('q')||'',/quiet headphones for travel/i,'Search-to-Scout-to-Decision Lab must retain the current search intent');

const uncertainty=core.buildResponse({text:'What is uncertain or unverified?',pageContext:{path:'/decision-lab/'},decisionState:{...hardExclusionState,lastTrace:{productSlug:'bose-quietcomfort-ultra-headphones',evidenceState:'WEAK_EVIDENCE',verificationNeeds:['Gaming exclusion is not verified for this candidate.'],gaps:[],conflicts:[],confidence:{level:'LOW'}}}});
assert.match(uncertainty.message,/same APG evidence|maintained APG evidence/i);
assert((uncertainty.bullets||[]).some(item=>/evidence boundary/i.test(item)),'uncertainty answer must make the evidence boundary visible');

console.log(JSON.stringify({version:patch.VERSION,responseDepthVersion:responseDepth.VERSION,status:'PASS',checks:{connectedJourneys:true,pageAwareHelp:true,categoryFactors:true,structuredDecisionState:true,hardConstraintFailClosed:true,contextPreservingDecisionLabHandoff:true,requiredBrandHandoff:true,searchIntentHandoff:true,evidenceConfidence:true,expandedCustomerResponses:true,purchaseReadiness:true,freshnessAwareness:true,badFitReasoning:true,buyWaitBoundary:true,valueReasoning:true,pageSummaries:true,siteTrustKnowledge:true,commercialWeightZero:true}},null,2));
