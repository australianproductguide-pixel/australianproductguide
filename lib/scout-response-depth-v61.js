'use strict';

// Scout Response Depth v6.1
// Customer-centred conversational depth over Scout v6. This layer never scores or ranks
// products. It answers journey, evidence, freshness and purchase-readiness questions, then
// delegates recommendation work to the already-installed shared Scout/Decision Engine path.
const scout=require('./scout-concierge-v5');
const core=scout.core;
const {categories}=require('../data');

const VERSION='scout-response-depth-v6.1';
const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.-]+/g,' ').replace(/\s+/g,' ').trim();
const human=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
let installed=false;
let previousBuild=null;
let previousClassify=null;

function prompt(label,primary=false){return {label,kind:'prompt',primary};}
function link(label,url,primary=false){return {label,url,kind:'link',primary};}
function categoryFor(pageContext,state){return (state&&state.category)||pageContext.categorySlug||null;}
function categoryLabel(slug){return categories[slug]&&categories[slug].label||human(slug||'this category');}
function productFor(pageContext){return pageContext.productSlug&&core.PRODUCT_BY_SLUG.has(pageContext.productSlug)?core.PRODUCT_BY_SLUG.get(pageContext.productSlug):null;}
function dateLabel(value){const raw=String(value||'').trim();return /^\d{4}-\d{2}-\d{2}$/.test(raw)?raw:null;}
function lastTrace(state){return state&&state.lastTrace&&typeof state.lastTrace==='object'?state.lastTrace:null;}
function safeState(input){return input&&input.decisionState&&typeof input.decisionState==='object'?input.decisionState:null;}

function response(input,pageContext){
  const text=norm(input.text),state=safeState(input),trace=lastTrace(state),product=productFor(pageContext),category=categoryFor(pageContext,state),label=categoryLabel(category);

  const asksCapabilities=/what can (?:you|scout) do|how can scout help|what can i ask scout|scout help me with|give me examples/.test(text);
  if(asksCapabilities){
    return {version:core.VERSION,intent:'apg_information',message:'Scout can stay with you through the whole APG shopping journey rather than only answer product-name questions.',bullets:['Turn a vague need into a structured buying brief.','Explain what matters in the category and what could change the recommendation.','Compare two to four maintained options and call out when neither is a clean fit.','Explain confidence, missing evidence and the closest alternative.','Check APG retailer-pathway wording and what to verify before checkout.','Guide you around Search, Decision Lab, Compare, buying guides, My APG and APG trust pages.'],actions:[prompt('Help me choose something',true),prompt('What should I verify before buying?'),prompt('Explain how APG recommendations work'),link('Browse categories','/categories/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksNext=/what should i do next|what next|next step|where do i go from here|what would you do next|help me finish this decision/.test(text);
  if(asksNext){
    const bullets=[];
    if(trace&&((trace.verificationNeeds||[]).length||(trace.gaps||[]).length))bullets.push('Resolve the remaining evidence gap before treating the current leader as final.');
    if(state&&state.shortlist&&state.shortlist.length>=2)bullets.push('Use Compare to make the trade-off between the shortlist options explicit.');
    if(state&&state.shortlist&&state.shortlist.length===1)bullets.push('Open the product guide and verify the exact retailer/model pathway before checkout.');
    if(!bullets.length&&pageContext.pageType==='search')bullets.push('If your search depends on budget or must-haves, move the same brief into Decision Lab.');
    if(!bullets.length&&pageContext.pageType==='category')bullets.push('Start with your intended use, budget and deal-breakers rather than a generic best product.');
    if(!bullets.length)bullets.push('Tell me your budget, intended use and any non-negotiable requirements and I can help structure the next decision.');
    return {version:core.VERSION,intent:'contextual_decision_help',message:'The best next step is the one that removes the biggest remaining uncertainty without making you start again.',bullets:bullets.slice(0,4),actions:[prompt('Show me my biggest uncertainty',true),link('Open Compare','/compare/'),link('Open Decision Lab','/decision-lab/'),link('Open My APG','/my-apg/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksCheckout=/what should i verify before (?:buying|checkout)|before i buy|checkout checklist|purchase checklist|what do i need to check|anything to check before buying/.test(text);
  if(asksCheckout){
    const subject=product?`${product.brand} ${product.name}`:category?label.toLowerCase():'this product';
    return {version:core.VERSION,intent:'price_or_retailer_question',message:`Before buying ${subject}, I’d verify the exact identity and offer rather than relying on a generic retailer result.`,bullets:['Exact model, generation, capacity, size, colour or bundle matches the APG product you researched.','Current seller, Australian warranty/returns, stock and delivery terms are acceptable.','Any must-have feature in your brief is explicitly verified rather than merely absent from the spec sheet.','Current price is checked at the retailer; APG does not treat a stale reference price as a live checkout price.','If the retailer pathway is a verified variant or search fallback, confirm the final listing before purchase.'],actions:[product?prompt('Where can I buy this?',true):prompt('Help me choose a specific model',true),link('How retailer evidence works','/retailers/'),link('APG sources','/sources/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksFreshness=/how fresh|how current|when was this updated|last updated|is this up to date|is this information current|how recent/.test(text);
  if(asksFreshness){
    const sourceDate=product&&dateLabel(product.lastSourceVerification),retailerDate=product&&dateLabel(product.lastRetailerCheck),bullets=[];
    if(sourceDate)bullets.push(`The maintained source-verification date recorded for this product is ${sourceDate}.`);
    if(retailerDate)bullets.push(`The maintained retailer-check date recorded for this product is ${retailerDate}.`);
    bullets.push('APG keeps product evidence and retailer freshness separate because a product fact can remain valid after price, stock or seller conditions change.');
    bullets.push('If an exact current fact is not verified, Scout should label the gap rather than invent freshness.');
    return {version:core.VERSION,intent:'methodology_question',message:product?'I can distinguish APG’s maintained product evidence from retailer freshness for the product on this page.':'APG treats freshness as evidence that must be maintained and visible, not as a cosmetic “updated” badge.',bullets,actions:[link('Recently updated','/updates/',true),link('Coverage','/coverage/'),link('Sources','/sources/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksBadFit=/bad fit|deal breaker|deal-breaker|why should i not buy|why not buy|what is wrong with|main downside|biggest downside|main compromise|what could make this wrong for me/.test(text);
  if(asksBadFit){
    const bullets=[];
    if(trace){for(const item of [...(trace.conflicts||[]),...(trace.gaps||[]),...(trace.verificationNeeds||[])].slice(0,5))bullets.push(item);}
    if(product&&product.watch)bullets.push(product.watch);
    if(!bullets.length)bullets.push('A product becomes a bad fit when it conflicts with your actual use, budget or must-haves; missing evidence is not proof that a compromise is absent.');
    return {version:core.VERSION,intent:'product_question',message:product?`For ${product.brand} ${product.name}, I’d focus on the compromises that could change the decision for your situation rather than manufacture a generic list of cons.`:'I’d judge a bad fit against your situation and hard requirements, not by inventing universal negatives.',bullets:bullets.slice(0,5),actions:[prompt('Is this right for my situation?',true),prompt('What would change the recommendation?'),link('Refine in Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksWait=/should i buy now|buy now or wait|should i wait|wait for a sale|wait for new model|worth waiting|buy today/.test(text);
  if(asksWait){
    return {version:core.VERSION,intent:'price_or_retailer_question',message:'I can help with purchase readiness, but I won’t predict a future sale or unreleased replacement without maintained evidence. The practical decision is whether the current verified fit and current retailer offer are good enough for your timing.',bullets:['Buy sooner when the current model cleanly satisfies your hard requirements and you need it now.','Wait when a key feature, exact model identity, retailer condition or compatibility point is still unverified.','Recheck live retailer price, seller, stock and warranty immediately before purchase.','A future-price guess contributes zero recommendation points.'],actions:[prompt('What is still unverified?',true),prompt('What should I verify before buying?'),link('Retailer approach','/retailers/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksValue=/is this good value|good value|worth the money|worth it for the price|too expensive|cheaper but still good|what if my budget changes|if i spend less|if i spend more/.test(text);
  if(asksValue){
    const budget=Number(state&&state.budget&&state.budget.amount),bullets=[];
    if(Number.isFinite(budget)&&budget>0)bullets.push(`Your current maintained buying brief includes an A$${budget.toLocaleString('en-AU')} ${state.budget.hard===false?'target':'ceiling'}.`);
    bullets.push('APG treats value as fit for your situation relative to spend, not as the cheapest product or the highest affiliate payout.');
    bullets.push('A lower price should only change the recommendation when the cheaper option still satisfies the important requirements.');
    bullets.push('If you change the budget materially, Decision Lab can rerun the same brief while keeping your must-haves intact.');
    return {version:core.VERSION,intent:'product_question',message:'“Good value” is only meaningful relative to what you actually need. I can help test whether spending more buys something decision-relevant or whether a cheaper maintained option preserves the fit.',bullets,actions:[prompt('Show me a cheaper credible alternative',true),prompt('What do I gain by spending more?'),link('Refine budget in Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksSummary=/summarise this page|summarize this page|give me the short version|tldr|tl dr|what is the point of this page/.test(text);
  if(asksSummary){
    if(product)return {version:core.VERSION,intent:'product_question',message:`This page is APG’s maintained decision guide for ${product.brand} ${product.name}: what it is, where it fits, what to watch, the evidence APG has, close alternatives and the safest available retailer pathway.`,products:[core.card(product)],references:[product.slug],actions:[prompt('Is it right for me?',true),prompt('What is the biggest compromise?'),prompt('Compare the closest alternative')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
    if(pageContext.pageType==='comparison')return {version:core.VERSION,intent:'product_comparison',message:'This Compare page is meant to show which differences between the selected products can actually change the decision, not just repeat a specification table.',actions:[prompt('Which differences matter most?',true),prompt('Which one suits my priorities?'),prompt('When is neither right?')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
    if(pageContext.pageType==='decision-lab')return {version:core.VERSION,intent:'apg_information',message:'Decision Lab turns your budget, must-haves, preferences and deal-breakers into a transparent maintained shortlist, then shows why the leader won and what evidence is still missing.',actions:[prompt('Explain my current result',true),prompt('What is still unverified?')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
    if(pageContext.pageType==='search')return {version:core.VERSION,intent:'site_navigation',message:'Search is the fast discovery layer: exact models, brands, categories and natural-language needs. When the choice becomes conditional, carry the same intent into Decision Lab or Compare.',actions:[prompt('Turn this search into a buying brief',true),link('Open Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
    if(category)return {version:core.VERSION,intent:'category_question',message:`This page is APG’s maintained ${label.toLowerCase()} decision surface: the category, products, buying factors and routes into Help Me Choose, Compare and Decision Lab.`,actions:[prompt('What matters most here?',true),prompt('Help me choose'),link('Compare products',`/compare/${category}/`)],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
    return {version:core.VERSION,intent:'apg_information',message:'This APG page is part of the same decision journey. I can explain what it is for, what to do next, or take you to the right maintained tool or trust page.',actions:[prompt('What should I do next?',true),link('Search APG','/search/'),link('Decision Lab','/decision-lab/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  const asksDifference=/why use apg|what makes apg different|how is apg different|why trust apg|why not just amazon|why not just google/.test(text);
  if(asksDifference){
    return {version:core.VERSION,intent:'apg_information',message:'APG is designed around the decision rather than the retailer listing: your situation first, explicit hard constraints, maintained evidence, visible uncertainty and retailer/commercial neutrality in recommendation scoring.',bullets:['Affiliate commission adds zero suitability points.','Missing evidence stays visible instead of being guessed.','Search, Scout, Decision Lab and Compare are intended to carry one decision forward.','Australian retailer/model identity and Australian relevance are treated as first-class evidence questions.','APG guidance is desk-researched unless explicitly documented otherwise.'],actions:[link('Methodology','/methodology/',true),link('Sources','/sources/'),link('Affiliate disclosure','/affiliate-disclosure/'),link('Corrections','/corrections-policy/')],decisionState:state,meta:{scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
  }

  return null;
}

function buildResponse(input={}){
  const pageContext=core.validatePageContext(input.pageContext||{});
  const deeper=response(input,pageContext);
  if(deeper)return {...deeper,pageContext};
  const out=previousBuild(input);
  return {...out,meta:{...(out.meta||{}),scoutResponseDepthVersion:VERSION,commercialRecommendationWeight:0}};
}
function classifyIntent(text,pageContext={}){
  const q=norm(text);
  if(/what can (?:you|scout) do|what should i do next|what next|verify before|checkout checklist|how fresh|how current|last updated|bad fit|deal breaker|why should i not buy|buy now or wait|should i wait|good value|worth the money|what if my budget changes|summari[sz]e this page|tldr|what makes apg different|why use apg/.test(q))return 'customer_decision_support';
  return previousClassify(text,pageContext);
}
function install(){
  if(installed)return core;
  previousBuild=core.buildResponse;
  previousClassify=core.classifyIntent;
  core.buildResponse=buildResponse;
  core.classifyIntent=classifyIntent;
  core.SCOUT_RESPONSE_DEPTH_VERSION=VERSION;
  installed=true;
  return core;
}

module.exports={VERSION,install,response,get installed(){return installed;}};
