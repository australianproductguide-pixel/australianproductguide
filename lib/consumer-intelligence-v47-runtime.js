'use strict';

// Runtime bridge for APG Consumer Intelligence v47. The existing Scout v5
// security/auth boundary stays authoritative; this module enriches its grounded
// responses with the same decision state, ranking version and explainability
// used by Search and Decision Lab.
const decisionLayer=require('./consumer-decision-v47');
const engine=decisionLayer.install();
const scoutRuntime=require('./scout-concierge-v5-runtime');
const search=require('./search-v4');
const graph=require('./product-intelligence-v41');

const VERSION='consumer-intelligence-v47-runtime';
const LEARNING_SCHEMA_VERSION='scout-learning-signal-v1';
const core=scoutRuntime.core;
const originalBuildResponse=core.buildResponse;
let installed=false;

const uniqActions=actions=>{
  const seen=new Set(),out=[];
  for(const item of actions||[]){
    if(!item)continue;
    const key=`${item.kind||'link'}|${item.url||''}|${item.label||''}`;
    if(seen.has(key))continue;
    seen.add(key);out.push(item);
  }
  return out;
};
function action(label,url,primary=false){return {label,url,kind:'link',primary,external:false,affiliate:false};}
function shoppingIntent(intent){return ['product_recommendation','product_search','alternative_request','product_comparison','product_question','price_or_retailer_question'].includes(intent);}
function safeQueryFromState(state){try{return core.stateToQuery(state)||'';}catch{return '';}}

function decisionContext(out){
  const state=out&&out.decisionState;
  if(!state)return null;
  const q=safeQueryFromState(state);if(!q)return null;
  try{return {query:q,result:engine.publicDecision(q,{category:state.category||''})};}catch{return null;}
}

function enrichProductContinuity(out){
  const products=Array.isArray(out.products)?out.products:[];
  if(products.length!==1)return out;
  const slug=products[0]?.slug;if(!slug)return out;
  const node=graph.knowledgeNode(slug),closest=node?.relationships?.comparable?.[0];
  if(!closest)return out;
  const compareUrl=`/compare/custom/?products=${encodeURIComponent(slug)},${encodeURIComponent(closest.slug)}`;
  const actions=uniqActions([...(out.actions||[]),action('Compare a close alternative',compareUrl,false)]);
  return {...out,actions,meta:{...(out.meta||{}),closestMaintainedAlternative:{slug:closest.slug,similarity:Number(closest.similarity)||null}}};
}

function learningSignals(out,searchSignal,decisionSignal){
  return {
    schemaVersion:LEARNING_SCHEMA_VERSION,
    intent:out.intent||null,
    category:out.decisionState?.category||out.pageContext?.categorySlug||searchSignal?.queryUnderstanding?.category||null,
    outcome:decisionSignal?.learningSignals?.outcome||searchSignal?.zeroResult?.reason||(Array.isArray(out.products)&&out.products.length?'grounded-products':'grounded-response'),
    productCount:Array.isArray(out.products)?out.products.length:0,
    searchResultCount:Array.isArray(searchSignal?.products)?searchSignal.products.length:null,
    hardConstraintFallback:!!decisionSignal?.audit?.hardConstraintFallback,
    topConfidence:decisionSignal?.results?.[0]?.confidence?.level||null,
    rawQueryPersisted:false,
    rawConversationPersisted:false,
    productionSelfModification:false,
    policy:'Use aggregate outcome codes for human-reviewed evaluation. Do not persist raw Scout conversation text in this learning signal.'
  };
}

function buildResponse(input={}){
  let out=originalBuildResponse(input);
  const text=String(input.text||'');
  let searchSignal=null;
  if(shoppingIntent(out.intent)){
    try{searchSignal=search.searchSite(text);}catch{}
  }

  // Some legacy Scout intents can answer safely without returning decisionState even
  // when Search v4 has already understood the same shopping brief. Recover only the
  // structured state (never raw query history) so cross-tool hand-off is consistent.
  if(!out.decisionState&&searchSignal?.decisionState)out={...out,decisionState:searchSignal.decisionState};
  const context=decisionContext(out),q=context?.query||'';

  if(q){
    const encoded=encodeURIComponent(q);
    const actions=(out.actions||[]).map(item=>item&&item.url==='/decision-lab/'?{...item,label:item.label==='Open full Decision Lab'?'Refine this brief in Decision Lab':item.label,url:`/decision-lab/?q=${encoded}`} : item);
    if(!actions.some(item=>String(item?.url||'').startsWith('/decision-lab/?q=')))actions.push(action('Refine this brief in Decision Lab',`/decision-lab/?q=${encoded}`,true));
    if(['product_recommendation','product_search','alternative_request'].includes(out.intent)&&!actions.some(item=>String(item?.url||'').startsWith('/search/?q=')))actions.push(action('Search this same brief',`/search/?q=${encoded}`,false));
    out={...out,actions:uniqActions(actions)};
  }

  out=enrichProductContinuity(out);
  const top=context?.result?.results?.[0]||null;
  const meta={
    ...(out.meta||{}),
    intelligenceVersion:VERSION,
    decisionIntelligenceVersion:decisionLayer.VERSION,
    searchRankingVersion:engine.SEARCH_RANKING_VERSION||'search-ranking-v4',
    sharedDecisionState:!!out.decisionState,
    commercialRecommendationWeight:0
  };
  if(top){
    meta.explainability={
      topSlug:top.slug,
      criterionCoverage:top.criterionCoverage||null,
      criteria:(top.criteria||[]).slice(0,8),
      verificationNeeds:(top.verificationNeeds||[]).slice(0,4),
      whenTheAnswerWouldChange:(context.result.recommendation?.whenTheAnswerWouldChange||[]).slice(0,3)
    };
  }
  if(searchSignal){
    meta.searchUnderstanding={
      category:searchSignal.queryUnderstanding?.category||null,
      hardConstraints:!!searchSignal.queryUnderstanding?.hardConstraints,
      zeroResultReason:searchSignal.zeroResult?.reason||null,
      maintainedProductCount:Array.isArray(searchSignal.products)?searchSignal.products.length:0
    };
  }
  out={...out,meta,learningSignals:learningSignals(out,searchSignal,context?.result||null)};
  return out;
}

function install(){
  if(installed)return scoutRuntime;
  core.buildResponse=buildResponse;
  scoutRuntime.CONSUMER_INTELLIGENCE_VERSION=VERSION;
  installed=true;
  return scoutRuntime;
}

install();
module.exports={VERSION,LEARNING_SCHEMA_VERSION,install,buildResponse,learningSignals,core,engine,search,scoutRuntime};
