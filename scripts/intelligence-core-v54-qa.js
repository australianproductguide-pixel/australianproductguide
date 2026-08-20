#!/usr/bin/env node
'use strict';
const assert=require('assert');
const decision=require('../lib/decision-engine-v4');
const search=require('../lib/search');
const scout=require('../lib/scout-concierge-v5-core');
const {products}=require('../data');

{
  const q='headphones under $300 for commuting, no Apple';
  const intent=decision.interpretQuery(q,{category:'wireless-headphones'});
  assert(intent.excludedBrands.includes('Apple'),'No Apple must remain a hard brand exclusion');
  assert.strictEqual(intent.brand,null,'Excluded brand must not also be interpreted as preferred');
  assert.strictEqual(intent.decisionState.brandPreference,null,'Excluded brand must not survive in decision state');
  const run=decision.rankDecision(q,{category:'wireless-headphones'});
  assert(run.ranked.filter(r=>r.eligibility!=='ineligible').every(r=>r.p.brand!=='Apple'),'Excluded Apple product leaked into viable results');
}

{
  const q='headphones under $500 primarily for commuting, comfort matters most';
  const intent=decision.interpretQuery(q,{category:'wireless-headphones'});
  const comfort=intent.softPreferences.find(x=>x.tag==='comfort');
  assert(comfort,'Comfort intent missing');
  assert.strictEqual(comfort.priority,'highest','Comfort “matters most” must be highest priority');
  const run=decision.rankDecision(q,{category:'wireless-headphones'});
  const top=run.ranked.find(r=>r.eligibility!=='ineligible');
  assert(top,'Expected a viable/unverified headphone candidate');
  assert(top.reasons.some(x=>/^Comfort aligns/.test(x)),'Top result explanation must acknowledge comfort');
  assert.strictEqual(top.p.slug,'bose-quietcomfort-ultra-headphones','Comfort-first commuting should surface the maintained Bose comfort-focused candidate');
}

{
  const q='TV under $2k for a bright room';
  const intent=decision.interpretQuery(q,{category:'televisions'});
  assert.strictEqual(intent.budget,2000,'A$2k shorthand must parse to A$2,000');
  assert.strictEqual(intent.budgetHard,true,'under $2k must remain a hard ceiling');
  assert.strictEqual(intent.decisionState.hardConstraints.budgetCeiling,2000,'A$2k hard ceiling missing from decision state');
}

{
  const result=search.searchSite('Sony XM6');
  const got=result.products.map(p=>p.slug).sort();
  const want=['sony-wf-1000xm6','sony-wh-1000xm6'].sort();
  assert.deepStrictEqual(got,want,'Sony XM6 should return only maintained XM6 model matches');
  assert.strictEqual(result.queryUnderstanding.modelAmbiguous,true,'Sony XM6 should be marked ambiguous across earbuds/headphones');
  assert.strictEqual(result.comparisons.length,0,'Ambiguous model fragment should not manufacture a cross-category comparison');
}

{
  const result=search.searchSite('WH-1000XM6');
  assert.strictEqual(result.products.length,1,'Exact WH-1000XM6 should resolve to one maintained model');
  assert.strictEqual(result.products[0].slug,'sony-wh-1000xm6');
  assert.strictEqual(result.queryUnderstanding.modelAmbiguous,false);
}

{
  assert.deepStrictEqual(search.modelTokens('65-inch TV under $2k at 144Hz'),[],'Generic size, budget and refresh tokens must not be mistaken for model identifiers');
}

{
  const a=products.find(p=>p.brand==='Samsung');
  const b=a&&products.find(p=>p.brand==='LG'&&p.category!==a.category);
  assert(a&&b,'Expected maintained Samsung/LG products in different categories for regression coverage');
  const out=scout.buildResponse({text:`${a.brand} ${a.name} vs ${b.brand} ${b.name}`,pageContext:{path:'/'}});
  assert.strictEqual(out.intent,'product_comparison');
  assert.strictEqual((out.products||[]).length,0,'Scout must not compare exact products from different categories');
}

console.log('INTELLIGENCE_CORE_V54=PASS');
