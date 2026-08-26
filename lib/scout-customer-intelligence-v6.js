'use strict';

// Scout Customer Intelligence v6.
// This extends the existing deterministic Scout v5 surface. It does not introduce a
// second recommendation engine or paid model dependency. Recommendation turns are
// revalidated against canonical Decision State v2 and the live shared Decision Engine.
const scout=require('./scout-concierge-v5');
const core=scout.core;
const decision=require('./decision-engine-v4');
const decisionState=require('./decision-state-v2');
const action4=require('../data/action4-decision-evidence-v96');
const {categories}=require('../data');

const VERSION='scout-customer-intelligence-v6';
const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.-]+/g,' ').replace(/\s+/g,' ').trim();
const human=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
let installed=false;
let previousBuild=null;
let previousClassify=null;

function prompt(label,primary=false){return {label,kind:'prompt',primary};}
function link(label,url,primary=false){return {label,url,kind:'link',primary};}
function contextCategory(pageContext,state){return (state&&state.category)||pageContext.categorySlug||null;}
function categorySchema(slug){return slug&&action4.categorySchemas&&action4.categorySchemas[slug]||null;}
function categoryLabel(slug){return categories[slug]&&categories[slug].label||human(slug||'this category');}
function criteriaFor(slug){const schema=categorySchema(slug);return (schema&&schema.criteria||[]).filter(item=>item&&item.usedByEngine).slice(0,5);}

function pageHelp(input,pageContext){
  const text=norm(input.text),state=input.decisionState&&typeof input.decisionState==='object'?input.decisionState:null;
  const asksPage=/what (?:can you|should i) (?:do|ask)|help me (?:with|on) this page|what is this page|explain this page|what matters here|guide me here|what should i look at|how can you help here/.test(text);
  const asksFactors=/what matters (?:most|in this category)|what should i look for|key factors|important factors|decision factors/.test(text);
  const asksChange=/what would change (?:the|your|this) recommendation|when would you choose something else|what could change your mind|what nearly won/.test(text);
  const asksConfidence=/how confident|why (?:are you|is this) confident|evidence confidence|how strong is the evidence|what is uncertain|what don t you know|what is unverified/.test(text);
  const asksConnected=/how do (?:search|scout|decision lab|compare).*(?:work together|connect)|what tool should i use|search vs decision lab|decision lab vs compare|how does the site work/.test(text);
  if(!(asksPage||asksFactors||asksChange||asksConfidence||asksConnected))return null;

  const slug=contextCategory(pageContext,state),label=categoryLabel(slug),criteria=criteriaFor(slug),trace=state&&state.lastTrace;
  if(asksConnected){
    return {version:core.VERSION,intent:'apg_information',message:'APG’s shopping tools are designed to carry the same decision forward rather than make you start again: Search helps you find the right product or category, Scout helps you reason conversationally, Decision Lab structures priorities and hard constraints, and Compare makes the trade-offs visible side by side.',bullets:['Use Search when you know a model, brand or broad need.','Use Scout when you want conversational help or an explanation in context.','Use Decision Lab when budget, must-haves and priorities need to be explicit.','Use Compare when you have two to four real candidates and want the differences that could change the decision.'],actions:[link('Open Search','/search/'),link('Open Decision Lab','/decision-lab/',true),link('Open Compare','/compare/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  }
  if(asksConfidence){
    if(trace){
      const limitations=[...(trace.verificationNeeds||[]),...(trace.gaps||[]),...(trace.conflicts||[])].slice(0,4);
      const confidence=trace.confidence&&typeof trace.confidence==='object'?(trace.confidence.label||trace.confidence.level):trace.confidence;
      return {version:core.VERSION,intent:'product_question',message:`The current recommendation is ${confidence?String(confidence).toLowerCase():'qualified'} because Scout uses the same APG evidence and hard-constraint trace as the Decision Engine. I won’t turn missing evidence into certainty.`,bullets:limitations.length?limitations.map(item=>'Evidence boundary: '+item):['No unresolved evidence gap is recorded in the current Scout trace, but retailer price and availability still need checking at purchase time.'],actions:[prompt('What would change this recommendation?',true),link('Review APG methodology','/methodology/'),link('Review sources','/sources/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,evidenceState:trace.evidenceState||null,commercialRecommendationWeight:0}};
    }
    return {version:core.VERSION,intent:'methodology_question',message:'Scout only describes confidence from maintained APG evidence. Verified facts can support a decision; missing or conflicting evidence stays visible as unverified or qualified instead of being guessed.',actions:[link('How recommendations work','/methodology/',true),link('APG sources','/sources/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  }
  if(asksChange){
    const bullets=[];
    if(trace&&trace.whatAlmostWon&&trace.whatAlmostWon.name)bullets.push(`The closest alternative in the last trace was ${trace.whatAlmostWon.brand||''} ${trace.whatAlmostWon.name}.`.replace(/\s+/g,' ').trim());
    if(state&&state.budget)bullets.push('A materially different budget can change the eligible candidate set.');
    if(state&&state.hardConstraints&&((state.hardConstraints.requiredTags||[]).length||(state.hardConstraints.excludedTags||[]).length||(state.hardConstraints.excludedBrands||[]).length||(state.hardConstraints.requiredBrands||[]).length))bullets.push('Changing a must-have or exclusion can change the result more than a soft preference.');
    for(const item of criteria.slice(0,3))bullets.push(`${item.label} is a category decision factor that can change the ordering when it matters to you.`);
    return {version:core.VERSION,intent:'product_question',message:`The answer should change when your situation changes — not because a retailer pays more. For ${label.toLowerCase()}, these are the most credible levers to revisit.`,bullets:bullets.slice(0,5),actions:[link('Refine in Decision Lab','/decision-lab/',true),prompt('Show me the closest alternative'),link('Compare shortlist','/compare/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  }
  if(asksFactors&&slug){
    return {version:core.VERSION,intent:'category_question',message:`For ${label.toLowerCase()}, APG’s maintained category schema focuses on the factors that can actually change a buying decision rather than feature volume.`,bullets:criteria.length?criteria.map(item=>item.label):['Budget, intended use, must-haves and important trade-offs should be resolved before choosing a model.'],actions:[prompt('Help me choose using these factors',true),link('Open buying guide',`/guides/${slug}-buying-guide/`),link('Open Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,categoryDecisionSchemaVersion:action4.SCHEMA_VERSION,commercialRecommendationWeight:0}};
  }

  if(pageContext.pageType==='product'&&pageContext.productSlug&&core.PRODUCT_BY_SLUG.has(pageContext.productSlug)){
    const product=core.PRODUCT_BY_SLUG.get(pageContext.productSlug);
    return {version:core.VERSION,intent:'product_question',message:`You’re looking at ${product.brand} ${product.name}. I can help work out whether it fits your situation, explain its meaningful trade-offs, compare it with maintained alternatives, or check APG’s current retailer pathway without pretending an unverified claim is known.`,products:[core.card(product)],references:[product.slug],actions:[prompt('Is this right for my situation?',true),prompt('What are the main trade-offs?'),prompt('Compare this with the closest alternatives'),prompt('Where can I buy this?')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  }
  if(pageContext.pageType==='comparison')return {version:core.VERSION,intent:'product_comparison',message:'You’re in APG Compare. I can explain which differences are decision-relevant, apply your budget and priorities, tell you when neither option is a clean fit, or carry the shortlist into Decision Lab.',actions:[prompt('Which one suits my priorities?',true),prompt('What actually changes the decision?'),prompt('When is neither option right?'),link('Refine in Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  if(pageContext.pageType==='search')return {version:core.VERSION,intent:'site_navigation',message:'You’re in APG Search. You can search by exact model, category, brand or a natural-language need. If the question becomes more conditional — budget, must-haves or deal-breakers — I can carry it into Decision Lab rather than forcing Search to do everything.',actions:[prompt('Help me improve my search',true),prompt('Turn this into a buying brief'),link('Open Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  if(pageContext.pageType==='decision-lab')return {version:core.VERSION,intent:'apg_information',message:'You’re in Decision Lab. This is where APG separates hard constraints from preferences, ranks maintained candidates, explains why the leader won and keeps missing proof visible. I can help translate your situation into a clearer brief or explain the result after it appears.',actions:[prompt('Help me tighten my brief',true),prompt('Explain my current result'),prompt('What would change this recommendation?')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  if((pageContext.pageType==='category'||pageContext.pageType==='finder'||pageContext.pageType==='guide')&&slug)return {version:core.VERSION,intent:'category_question',message:`You’re researching ${label.toLowerCase()}. I can narrow the category around your budget, intended use and deal-breakers, explain what matters, or help turn the page into a shortlist.`,bullets:criteria.slice(0,4).map(item=>item.label),actions:[prompt('Help me choose',true),prompt('What matters most here?'),link('Open Decision Lab','/decision-lab/'),link('Compare products',`/compare/${slug}/`)],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,categoryDecisionSchemaVersion:action4.SCHEMA_VERSION,commercialRecommendationWeight:0}};
  if(pageContext.pageType==='my-apg')return {version:core.VERSION,intent:'apg_information',message:'You’re in My APG. I can help you work through saved products, compare a shortlist and continue a buying decision. Account data is only used from your authenticated APG session; Scout does not expose passwords or tokens.',actions:[prompt('What have I saved?',true),prompt('Compare my saved options'),link('Browse products','/categories/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
  return {version:core.VERSION,intent:'apg_information',message:'I can guide this page, help you find the right APG tool, or start a shopping decision from your budget, intended use and deal-breakers.',actions:[prompt('Help me choose a product',true),link('Search APG','/search/'),link('Open Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
}

function structuredRecommendationParity(out,input,pageContext){
  if(!out||!out.decisionState||out.decisionState.pendingQuestion)return out;
  if(!['product_recommendation','product_search','alternative_request'].includes(out.intent))return out;
  const category=contextCategory(pageContext,out.decisionState);if(!category)return out;
  const canonical=decisionState.normaliseState(out.decisionState,{category});
  if(!canonical.category)return out;
  const result=decision.publicDecision('',{category:canonical.category,decisionState:canonical});
  const ranked=(result.results||[]),usable=ranked.filter(row=>row.hardConstraintStatus!=='ineligible'),rows=(usable.length?usable:ranked).slice(0,3);
  if(!rows.length)return {...out,meta:{...(out.meta||{}),scoutCustomerIntelligenceVersion:VERSION,decisionStateSchema:decisionState.VERSION,decisionInputMode:'structured-state',commercialRecommendationWeight:0}};
  const cards=rows.map(row=>core.card(core.PRODUCT_BY_SLUG.get(row.slug),{reason:(row.reasons||[])[0],tradeoff:(row.verificationNeeds||[])[0]||(row.conflicts||[])[0]||(row.gaps||[])[0]})).filter(Boolean);
  if(!cards.length)return out;
  const top=rows[0],preserved={...out.decisionState,schemaVersion:decisionState.VERSION,category:canonical.category,shortlist:cards.map(card=>card.slug),lastTrace:{...(out.decisionState.lastTrace||{}),productSlug:top.slug,reasons:(top.reasons||[]).slice(0,7),gaps:(top.gaps||[]).slice(0,6),conflicts:(top.conflicts||[]).slice(0,6),verificationNeeds:(top.verificationNeeds||[]).slice(0,6),confidence:top.confidence||null,whatAlmostWon:result.recommendation&&result.recommendation.whatAlmostWon||null}};
  let message=out.message;
  if(result.audit&&result.audit.hardConstraintFallback)message='I can’t verify a clean maintained match for every active must-have, so I’m keeping the closest options visibly qualified rather than silently relaxing your requirements.';
  else if(top&&top.name){const reason=(top.reasons||[])[0];message=`My leading maintained fit is ${top.brand} ${top.name}${reason?` because ${String(reason).replace(/^./,c=>c.toLowerCase())}`:''}.`}
  const actions=[];
  if(cards.length>1)actions.push(link('Compare these options','/compare/custom/?products='+cards.map(card=>card.slug).join(','),true));
  actions.push(link('Refine in Decision Lab','/decision-lab/',cards.length===1));
  actions.push(prompt('Why did this one win?'));
  actions.push(prompt('What would change this recommendation?'));
  return {...out,message,products:cards,references:cards.map(card=>card.slug),decisionState:preserved,actions,meta:{...(out.meta||{}),scoutCustomerIntelligenceVersion:VERSION,decisionStateSchema:decisionState.VERSION,decisionInputMode:'structured-state',hardConstraintFallback:!!(result.audit&&result.audit.hardConstraintFallback),commercialRecommendationWeight:0}};
}

function buildResponse(input={}){
  const pageContext=core.validatePageContext(input.pageContext||{});
  const contextual=pageHelp(input,pageContext);if(contextual)return {...contextual,pageContext};
  const out=previousBuild(input);
  const aligned=structuredRecommendationParity(out,input,pageContext);
  return {...aligned,meta:{...(aligned.meta||{}),scoutCustomerIntelligenceVersion:VERSION,commercialRecommendationWeight:0}};
}
function classifyIntent(text,pageContext={}){
  const q=norm(text);
  if(/help me (?:with|on) this page|what is this page|explain this page|what matters here|what would change (?:the|your|this) recommendation|how confident|what is uncertain|what tool should i use|work together|search vs decision lab|decision lab vs compare/.test(q))return 'contextual_decision_help';
  return previousClassify(text,pageContext);
}
function install(){
  if(installed)return core;
  previousBuild=core.buildResponse;
  previousClassify=core.classifyIntent;
  core.buildResponse=buildResponse;
  core.classifyIntent=classifyIntent;
  core.SCOUT_CUSTOMER_INTELLIGENCE_VERSION=VERSION;
  installed=true;
  return core;
}

module.exports={VERSION,install,pageHelp,structuredRecommendationParity,get installed(){return installed;}};
