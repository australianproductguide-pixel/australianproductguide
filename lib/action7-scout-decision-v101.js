'use strict';

// Action 7 — intelligence refinement over Scout v5 + Decision Engine v4.
// This layer deliberately preserves Scout v5. It adds structured multi-turn state
// reconciliation, Action 4 schema-aware question selection, trace-aware explanations,
// central platform facts and state-preserving Decision Lab handoffs.
const downstream=require('./action5-recall-surface-v1002');
const scout=require('./scout-concierge-v5');
const core=scout.core;
const decision=require('./decision-engine-v4');
const action4=require('../data/action4-decision-evidence-v96');
const platform=require('./platform-facts-v101');
const amazon=require('../data/amazon-au-mappings-v33');
const {products}=require('../data');

const VERSION='101.0';
const EVALUATION_VERSION='action7-eval-v1';
const PRODUCT_BY_SLUG=core.PRODUCT_BY_SLUG;
const baseBuildResponse=core.buildResponse;
const baseClassifyIntent=core.classifyIntent;
const schemaByCategory=action4.categorySchemas;
const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))];
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.-]+/g,' ').replace(/\s+/g,' ').trim();
const human=v=>String(v||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const uniq=v=>[...new Set((v||[]).filter(Boolean))];
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

function brandMention(text){const q=norm(text);return brands.find(b=>q.includes(norm(b)))||null;}
function cleanState(raw){
  const base=core.safeState(raw)||{category:null,budget:null,hardConstraints:{budgetCeiling:null,requiredTags:[],excludedTags:[],excludedBrands:[]},softPreferences:[],softExclusions:[],numericConstraints:[],categoryIntent:{},brandPreference:null};
  base.hardConstraints.requiredBrands=uniq((raw&&raw.hardConstraints&&raw.hardConstraints.requiredBrands)||[]).slice(0,4);
  base.shortlist=uniq(raw&&raw.shortlist).filter(x=>PRODUCT_BY_SLUG.has(x)).slice(0,5);
  base.rejectedProducts=uniq(raw&&raw.rejectedProducts).filter(x=>PRODUCT_BY_SLUG.has(x)).slice(0,12);
  base.evidenceGaps=uniq(raw&&raw.evidenceGaps).map(x=>String(x).slice(0,240)).slice(0,12);
  base.pendingQuestion=raw&&raw.pendingQuestion&&typeof raw.pendingQuestion==='object'?clone(raw.pendingQuestion):null;
  base.lastTrace=raw&&raw.lastTrace&&typeof raw.lastTrace==='object'?clone(raw.lastTrace):null;
  return base;
}
function schemaCriterion(schema,text){const q=norm(text);if(!schema)return null;return schema.criteria.find(c=>(c.aliases||[]).some(a=>q===norm(a)||q.includes(norm(a)))||q===norm(c.label)||q===norm(c.key))||null;}
function removePreference(state,key){state.softPreferences=(state.softPreferences||[]).filter(p=>p.tag!==key);state.softExclusions=(state.softExclusions||[]).filter(x=>x!==key);state.hardConstraints.requiredTags=(state.hardConstraints.requiredTags||[]).filter(x=>x!==key);state.hardConstraints.excludedTags=(state.hardConstraints.excludedTags||[]).filter(x=>x!==key);}
function upsertPreference(state,item){const list=(state.softPreferences||[]).filter(p=>p.tag!==item.tag);list.push({tag:item.tag,priority:item.priority||'normal',weight:item.weight||undefined});state.softPreferences=list.slice(0,16);}
function reconcileState(raw,text,pageContext={}){
  const state=cleanState(raw),q=norm(text),parsed=decision.interpretQuery(text),schema=schemaByCategory[state.category||parsed.categorySlug]||null;
  const explicitNewCategory=parsed.categorySlug&&parsed.categorySlug!==state.category&&/(instead|now i need|switch|something else|actually.*(?:laptop|headphone|vacuum|coffee|tv|television))/i.test(String(text));
  if(parsed.categorySlug&&(!state.category||explicitNewCategory)){state.category=parsed.categorySlug;if(explicitNewCategory){state.budget=null;state.hardConstraints={budgetCeiling:null,requiredTags:[],excludedTags:[],excludedBrands:[],requiredBrands:[]};state.softPreferences=[];state.softExclusions=[];state.numericConstraints=[];state.brandPreference=null;state.shortlist=[];state.lastTrace=null;}}
  if(!state.category&&pageContext.categorySlug)state.category=pageContext.categorySlug;
  if(/(?:ignore|forget|remove|drop|no) (?:the )?(?:budget|price limit|spending limit)|budget (?:doesn t|does not) matter/i.test(String(text))){state.budget=null;state.hardConstraints.budgetCeiling=null;}
  else if(parsed.decisionState&&parsed.decisionState.budget){state.budget=parsed.decisionState.budget;state.hardConstraints.budgetCeiling=parsed.decisionState.hardConstraints.budgetCeiling;}
  const mentioned=brandMention(text);
  if(mentioned&&/(?:is|are) (?:ok|okay|fine)|allow|include|don t exclude|do not exclude|okay after all|ok after all/i.test(String(text))){state.hardConstraints.excludedBrands=(state.hardConstraints.excludedBrands||[]).filter(b=>norm(b)!==norm(mentioned));state.hardConstraints.requiredBrands=(state.hardConstraints.requiredBrands||[]).filter(b=>norm(b)!==norm(mentioned));if(/prefer/i.test(String(text)))state.brandPreference=mentioned;}
  for(const b of parsed.excludedBrands||[])if(!(state.hardConstraints.excludedBrands||[]).some(x=>norm(x)===norm(b)))state.hardConstraints.excludedBrands.push(b);
  if(mentioned&&/(?:only|must be|has to be)\s*$/i.test(String(text).trim())||mentioned&&new RegExp('(?:only|must be|has to be)\\s+'+mentioned.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(String(text))){state.hardConstraints.requiredBrands=[mentioned];state.brandPreference=null;}
  else if(parsed.brandPreference||parsed.brand){state.brandPreference=parsed.brandPreference||parsed.brand;}
  for(const tag of parsed.requiredTags||[])state.hardConstraints.requiredTags=uniq([...(state.hardConstraints.requiredTags||[]),tag]);
  for(const tag of parsed.hardExcludedTags||[])state.hardConstraints.excludedTags=uniq([...(state.hardConstraints.excludedTags||[]),tag]);
  for(const tag of parsed.softExclusions||[])state.softExclusions=uniq([...(state.softExclusions||[]),tag]);
  const asked=state.pendingQuestion&&state.pendingQuestion.type==='priority';
  const criterion=schemaCriterion(schema,text);
  if(criterion&&/(?:forget|ignore|doesn t matter|does not matter|not important)/i.test(String(text)))removePreference(state,criterion.key);
  else {
    for(const pref of parsed.softPreferences||[]){const mapped=schemaCriterion(schema,pref.tag)||schemaCriterion(schema,pref.label)||null;upsertPreference(state,{tag:mapped?mapped.key:pref.tag,priority:asked&&mapped?'highest':pref.priority,weight:asked&&mapped?1.8:pref.weight});}
    if(criterion&&asked&&!state.softPreferences.some(p=>p.tag===criterion.key))upsertPreference(state,{tag:criterion.key,priority:'highest',weight:1.8});
  }
  if(/(?:forget|ignore|drop) battery/i.test(String(text)))removePreference(state,'battery-hours'),removePreference(state,'battery');
  if(/weight matters more|lighter matters|lightweight matters/i.test(String(text))){removePreference(state,'battery-hours');removePreference(state,'battery');if(schema&&schema.criteria.some(c=>c.key==='weight-g'))state.evidenceGaps=uniq([...(state.evidenceGaps||[]),'Weight is documented as a fact but is not currently an approved Action 4 ranking criterion for this category.']);}
  if(Array.isArray(parsed.numericConstraints)&&parsed.numericConstraints.length)state.numericConstraints=parsed.numericConstraints;
  state.pendingQuestion=null;
  return state;
}
function stateQuery(state){const q=core.stateToQuery(state);const required=(state.hardConstraints&&state.hardConstraints.requiredBrands)||[];return [q,...required.map(b=>b+' only')].filter(Boolean).join(' ');}
function signalCount(state){return (state.budget?1:0)+(state.hardConstraints.requiredTags||[]).length+(state.hardConstraints.excludedTags||[]).length+(state.hardConstraints.excludedBrands||[]).length+(state.hardConstraints.requiredBrands||[]).length+(state.softPreferences||[]).length+(state.numericConstraints||[]).length+(state.brandPreference?1:0);}
function nextQuestion(state){
  const schema=schemaByCategory[state.category];if(!schema)return null;
  const resolved=new Set([...(state.softPreferences||[]).map(x=>x.tag),...(state.hardConstraints.requiredTags||[]),...(state.hardConstraints.excludedTags||[])]);
  const criteria=schema.criteria.filter(c=>c.usedByEngine&&!resolved.has(c.key));if(!criteria.length)return null;
  const choices=criteria.slice(0,4).map(c=>c.label.replace(/ suitability$/i,'').replace(/ quality$/i,'')).join(', ');
  return {type:'priority',criteria:criteria.slice(0,4).map(c=>c.key),message:`What matters most for this decision: ${choices}?`};
}
function decisionLabUrl(state){const u=new URL('/decision-lab/','https://australianproductguide.au');const q=stateQuery(state);if(q)u.searchParams.set('q',q);if(state.category)u.searchParams.set('category',state.category);if(state.budget&&state.budget.amount)u.searchParams.set('budget',String(state.budget.amount));if(state.brandPreference)u.searchParams.set('brand',state.brandPreference);return u.pathname+u.search;}
function evidenceState(result){
  const criteria=result&&result.criteria||[];if((result&&result.conflicts||[]).length||criteria.some(c=>/conflict/i.test(String(c.note||''))))return 'CONFLICTING';
  if((result&&result.verificationNeeds||[]).length||criteria.some(c=>c.evidenceStatus&&c.evidenceStatus!=='VERIFIED'))return 'WEAK_OR_UNAVAILABLE';
  if(criteria.some(c=>/rule-derived|interpretation/i.test(String(c.note||''))))return 'INFERRED';
  return 'KNOWN';
}
function retailerAction(product){const r=product&&amazon.getAmazonAuRecord(product);if(!r||!r.url||r.matchStatus==='NO_SAFE_PATH_RECALL')return null;if(r.matchStatus==='EXACT_VERIFIED')return {label:'View on Amazon Australia',url:r.url,kind:'retailer',primary:false,external:true,affiliate:true};if(r.matchStatus==='VARIANT_VERIFIED')return {label:'View verified variant on Amazon Australia',url:r.url,kind:'retailer',primary:false,external:true,affiliate:true};if(r.matchStatus==='SEARCH_FALLBACK')return {label:'Search this model on Amazon Australia',url:r.url,kind:'retailer',primary:false,external:true,affiliate:true};return null;}
function recommendationFromState(state,pageContext={}){
  const query=stateQuery(state);if(!state.category)return null;
  const result=decision.publicDecision(query,{category:state.category});
  let rows=(result.results||[]).filter(r=>r.hardConstraintStatus!=='ineligible');
  const required=(state.hardConstraints&&state.hardConstraints.requiredBrands)||[];
  if(required.length)rows=rows.filter(r=>required.some(b=>norm(b)===norm(r.brand)));
  rows=rows.slice(0,3);
  if(!rows.length)return {version:core.VERSION,intent:'product_recommendation',message:'I can’t verify a clean maintained match for the active hard requirements. I won’t silently relax them; you can change a constraint or inspect the closest options in Decision Lab.',decisionState:state,references:[],products:[],actions:[{label:'Refine in Decision Lab',url:decisionLabUrl(state),kind:'link',primary:true}],meta:{action7Version:VERSION,evidenceState:'UNAVAILABLE',commercialRecommendationWeight:0}};
  const top=rows[0],topProduct=PRODUCT_BY_SLUG.get(top.slug),cards=rows.map(r=>core.card(PRODUCT_BY_SLUG.get(r.slug),{reason:(r.reasons||[])[0],tradeoff:(r.verificationNeeds||[])[0]||(r.gaps||[])[0]||PRODUCT_BY_SLUG.get(r.slug)?.watch})).filter(Boolean);
  const active=[];if(state.budget)active.push(`budget ${state.budget.hard?'ceiling':'target'} A$${Number(state.budget.amount).toLocaleString('en-AU')}`);if((state.hardConstraints.excludedBrands||[]).length)active.push(`excluded ${state.hardConstraints.excludedBrands.join(', ')}`);if((state.hardConstraints.requiredBrands||[]).length)active.push(`${state.hardConstraints.requiredBrands.join(', ')} only`);if((state.softPreferences||[]).length)active.push(`${human(state.softPreferences[0].tag)} priority`);
  let message=`My leading fit is ${top.brand} ${top.name}.`;
  if((top.reasons||[]).length)message+=` ${top.reasons[0]}.`;
  const ev=evidenceState(top);if(ev==='CONFLICTING')message+=' The maintained evidence is mixed on at least one relevant criterion, so I would not treat that point as decisive.';else if(ev==='WEAK_OR_UNAVAILABLE')message+=' At least one relevant criterion is not strongly verified, so the recommendation remains qualified rather than falsely precise.';
  const trace={productSlug:top.slug,activeRequirements:active,criteria:(top.criteria||[]).slice(0,12),reasons:(top.reasons||[]).slice(0,7),gaps:(top.gaps||[]).slice(0,6),conflicts:(top.conflicts||[]).slice(0,6),verificationNeeds:(top.verificationNeeds||[]).slice(0,6),confidence:top.confidence||null,evidenceState:ev,whatAlmostWon:result.recommendation&&result.recommendation.whatAlmostWon||null};
  state.shortlist=rows.map(r=>r.slug);state.evidenceGaps=uniq([...(state.evidenceGaps||[]),...(top.verificationNeeds||[]),...(top.gaps||[])]).slice(0,12);state.lastTrace=trace;
  const actions=[];if(cards.length>1)actions.push({label:'Compare these options',url:'/compare/custom/?products='+cards.map(c=>c.slug).join(','),kind:'link',primary:true});actions.push({label:'Refine in Decision Lab',url:decisionLabUrl(state),kind:'link',primary:cards.length===1});actions.push({label:'Open product guide',url:`/products/${top.slug}/`,kind:'link',primary:false});const retail=retailerAction(topProduct);if(retail)actions.push(retail);
  return {version:core.VERSION,intent:'product_recommendation',message,products:cards,references:state.shortlist,decisionState:state,actions,meta:{action7Version:VERSION,evidenceState:ev,commercialRecommendationWeight:0,decisionEngine:result.version,categoryDecisionSchemaVersion:result.categoryDecisionSchemaVersion||null}};
}
function whyFromTrace(state){const t=state&&state.lastTrace;if(!t||!PRODUCT_BY_SLUG.has(t.productSlug))return null;const p=PRODUCT_BY_SLUG.get(t.productSlug),bullets=[];if((t.activeRequirements||[]).length)bullets.push('What you told me: '+t.activeRequirements.join('; ')+'.');for(const r of (t.reasons||[]).slice(0,3))bullets.push(r);for(const x of (t.verificationNeeds||[]).slice(0,2))bullets.push('Evidence limitation: '+x);if(t.whatAlmostWon&&t.whatAlmostWon.name)bullets.push(`What nearly won: ${t.whatAlmostWon.brand} ${t.whatAlmostWon.name}.`);return {version:core.VERSION,intent:'product_question',message:`I chose ${p.brand} ${p.name} from the same Decision Engine trace that produced the shortlist — not from a separate Scout score.`,bullets,products:[core.card(p)],references:[p.slug],decisionState:state,actions:[{label:'Open product guide',url:`/products/${p.slug}/`,kind:'link',primary:true},{label:'Refine in Decision Lab',url:decisionLabUrl(state),kind:'link',primary:false}],meta:{action7Version:VERSION,evidenceState:t.evidenceState||'KNOWN'}};}
function platformResponse(text,input){
  const q=norm(text);let fact=null;
  if(/do you (?:personally |physically )?test|hands on|desk research/.test(q))fact=platform.platformFact('testing');
  else if(/affiliate|commission|make money|amazon pay/.test(q))fact=platform.platformFact('affiliate');
  else if(/what is australian product guide|what is apg|what does apg do/.test(q))fact=platform.platformFact('about');
  else if(/methodology|how do .*recommend|how .*compare/.test(q))fact=platform.platformFact('methodology');
  else if(/what do you know about me|save my chat|save .* chats|privacy|personal information/.test(q))fact=platform.platformFact('privacy');
  if(!fact)return null;const page=platform.findSitePage(fact.source)||{url:fact.source.split('#')[0],label:'Read more'};return {version:core.VERSION,intent:'apg_information',message:fact.text,actions:[{label:page.label||'Read current APG policy',url:page.url||fact.source.split('#')[0],kind:'link',primary:true}],meta:{action7Version:VERSION,platformFactSource:fact.source}};
}
function looksLikeRefinement(text,rawState){if(!rawState||!rawState.category)return false;const q=norm(text),parsed=decision.interpretQuery(text);return !!(parsed.budget||(parsed.softPreferences||[]).length||(parsed.requiredTags||[]).length||(parsed.excludedTags||[]).length||(parsed.excludedBrands||[]).length||(parsed.numericConstraints||[]).length||brandMention(text)||/actually|instead|forget|ignore|matters|priority|under \$|below \$|nothing |only$|okay after all|ok after all/.test(q));}
function action7BuildResponse(input={}){
  const text=String(input.text||'').slice(0,2000),pageContext=core.validatePageContext(input.pageContext||{}),rawState=input.decisionState&&typeof input.decisionState==='object'?input.decisionState:null;
  const central=platformResponse(text,input);if(central)return central;
  if(rawState&&/\bwhy (?:this|that|it|one)|why did you choose|why this one|what nearly won\b/i.test(text)){const why=whyFromTrace(cleanState(rawState));if(why)return why;}
  if(looksLikeRefinement(text,rawState)){const state=reconcileState(rawState,text,pageContext);return recommendationFromState(state,pageContext)||baseBuildResponse(input);}
  const base=baseBuildResponse(input);
  if((base.intent==='product_recommendation'||base.intent==='product_search')&&base.decisionState){
    const state=reconcileState(base.decisionState,text,pageContext),question=nextQuestion(state);
    // Ask one high-information question when the brief is still materially under-specified.
    if(question&&signalCount(state)<=1&&!base.products){state.pendingQuestion=question;return {...base,message:question.message,decisionState:state,actions:[{label:'Refine in Decision Lab',url:decisionLabUrl(state),kind:'link',primary:false}],meta:{...(base.meta||{}),action7Version:VERSION,questionSource:action4.SCHEMA_VERSION}};}
    if(question&&signalCount(state)<=1&&base.products){state.pendingQuestion=question;return {version:core.VERSION,intent:'product_recommendation',message:question.message,decisionState:state,references:[],products:[],actions:[{label:'Refine in Decision Lab',url:decisionLabUrl(state),kind:'link',primary:false}],meta:{action7Version:VERSION,questionSource:action4.SCHEMA_VERSION}};}
    return recommendationFromState(state,pageContext)||base;
  }
  return {...base,meta:{...(base.meta||{}),action7Version:VERSION}};
}
if(!core.__action7Patched){core.buildResponse=action7BuildResponse;Object.defineProperty(core,'__action7Patched',{value:true});}

const handoffScript=String.raw`<script data-apg-action7-handoff>(()=>{if(location.pathname!=='/decision-lab/'||window.__APG_ACTION7_HANDOFF__)return;window.__APG_ACTION7_HANDOFF__=true;const add=()=>{const host=document.querySelector('[data-v506-results-host]');if(!host||!host.children.length||document.querySelector('[data-action7-ask-scout]'))return;const b=document.createElement('button');b.type='button';b.dataset.action7AskScout='';b.className='apg-dl506-button';b.textContent='Ask Scout about these results';b.addEventListener('click',()=>{const u=new URL(location.href),q=u.searchParams.get('q')||'';window.apgScout?.open();if(q)setTimeout(()=>window.apgScout?.ask('Continue this Decision Lab decision: '+q),0);});host.appendChild(b)};new MutationObserver(add).observe(document.body,{childList:true,subtree:true});add()})();</script>`;
function handler(req,res){let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{};res.setHeader('X-APG-Action7-Scout-Decision','v'+VERSION);if(path==='/api/intelligence/action7'){const payload={version:VERSION,evaluationVersion:EVALUATION_VERSION,scoutVersion:core.VERSION,decisionEngine:decision.ENGINE_VERSION||'decision-engine-v4',decisionStateSchema:'action7-decision-state-v2-compatible',categorySchemaVersion:action4.SCHEMA_VERSION,platformFactsVersion:platform.VERSION,paidExternalModelDependency:false,rawConversationPersisted:false,retailerStates:['EXACT_VERIFIED','VARIANT_VERIFIED','SEARCH_FALLBACK','NO_SAFE_PATH_RECALL'],handoffs:{scoutToDecisionLab:true,decisionLabToScout:true},cost:{mode:'deterministic-shared-engine',catalogueRetrieval:'bounded-by-engine-candidate-set',newRecurringPaidCostAUD:0}};res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(payload));}const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(path==='/decision-lab/'&&req.method!=='HEAD'&&res.statusCode===200&&type.startsWith('text/html')&&typeof body==='string'&&!body.includes('data-apg-action7-handoff')){body=body.replace('</body>',handoffScript+'</body>');try{res.removeHeader('Content-Length')}catch{}}return end(body,...args)};return downstream(req,res);}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,ACTION7_EVALUATION_VERSION:EVALUATION_VERSION,platform,action7BuildResponse,reconcileState,recommendationFromState,nextQuestion,decisionLabUrl,evidenceState});
module.exports=handler;