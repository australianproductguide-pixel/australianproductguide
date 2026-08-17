const fs=require('fs');
const path=require('path');
const {products}=require('../data');
const engine=require('./decision-engine-v4');
const graph=require('./product-intelligence-v4');
const QUALITY_VERSION='intelligence-quality-v1';
const scenarios=[
 ['commute-headphones','quiet headphones for commuting with strong battery life','wireless-headphones'],
 ['pet-robot','robot vacuum for pet hair and mopping','robot-vacuums'],
 ['coffee-auto','easy automatic coffee machine under $1300 for milk drinks and switching beans','coffee-machines'],
 ['bright-tv','65 inch TV for a bright living room and sport','televisions'],
 ['family-washer','9kg washing machine with automatic dosing','washing-machines'],
 ['usb-c-power','power bank must support USB-C for a laptop','power-banks']
];
function scenarioResult([id,q,category]){const d=engine.publicDecision(q,{category}),top=d.results[0];return {id,pass:!!top&&top.hardConstraintStatus!=='ineligible',top:top?.slug||null,status:top?.hardConstraintStatus||'none',confidence:top?.confidence?.level||null,limitation:!top?'No maintained candidate':top.hardConstraintStatus==='unverified'?'Hard-constraint evidence still needs verification':null};}
function budgetGate(){const p=products.find(x=>Number(x.price)>1);if(!p)return {pass:true,reason:'No maintained priced product available for deterministic budget test'};const ceiling=Math.max(1,Number(p.price)-1),d=engine.publicDecision('',{category:p.category,budget:String(ceiling)}),x=d.results.find(r=>r.slug===p.slug);return {pass:!x||x.hardConstraintStatus!=='eligible',product:p.slug,price:p.price,ceiling,status:x?.hardConstraintStatus||'not-displayed'};}
function neutrality(){const src=fs.readFileSync(path.join(__dirname,'decision-engine-v4.js'),'utf8'),start=src.indexOf('function scoreProduct'),end=src.indexOf('function confidence'),block=src.slice(start,end),banned=['affiliate','commission','asin','retailer payout','retailer commission'];const hits=banned.filter(x=>block.toLowerCase().includes(x));return {pass:hits.length===0,commercialRecommendationWeight:0,hits};}
function qualitySnapshot(){const results=scenarios.map(scenarioResult),bg=budgetGate(),an=neutrality(),constraintViolations=results.filter(x=>x.status==='ineligible').length,data={source:products.filter(p=>!p.source).length,sourceVerification:products.filter(p=>!p.lastSourceVerification).length,retailerCheck:products.filter(p=>!p.lastRetailerCheck).length,price:products.filter(p=>!Number(p.price)).length,structuredSpecs:products.filter(p=>!(p.specs||[]).length).length};const pass=results.every(x=>x.pass)&&bg.pass&&an.pass&&constraintViolations===0;return {version:QUALITY_VERSION,generatedAt:new Date().toISOString().slice(0,10),engineVersion:engine.ENGINE_VERSION,policyVersion:engine.POLICY_VERSION,stateSchemaVersion:engine.STATE_SCHEMA_VERSION,searchRankingVersion:engine.SEARCH_RANKING_VERSION,catalogue:graph.graphSummary(),dataQuality:{missing:data},evaluation:{scenarios:results,hardBudgetGate:bg,affiliateNeutrality:an,constraintViolations},releaseGate:{pass,requirements:['No unexplained hard-constraint violation','Affiliate/commercial fields absent from recommendation scoring','Core Australian buying journeys return a maintained candidate or an explicit limitation']}};}
module.exports={QUALITY_VERSION,qualitySnapshot};
