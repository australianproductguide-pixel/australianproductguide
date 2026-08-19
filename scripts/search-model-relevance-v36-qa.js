#!/usr/bin/env node
'use strict';
const assert=require('assert');
const research=require('../lib/research-view-v44');
const {searchSite}=require('../lib/search');
const {categoryFromQuery}=require('../lib/category-match');
const {products}=require('../data');

const bySlug=new Map(products.map(p=>[p.slug,p]));
function checkModelQuery(query){
  const lexical=searchSite(query),payload=research.researchPayload(query);
  assert(lexical.products?.length,`${query}: expected a lexical product match`);
  assert(payload.modelScoped===true,`${query}: expected model-scoped Research View`);
  assert.strictEqual(payload.modelScope.anchorSlug,lexical.products[0].slug,`${query}: anchor should remain the top lexical match`);
  assert(payload.results.length>=1,`${query}: expected maintained Research View results`);
  assert.strictEqual(payload.results[0].slug,lexical.products[0].slug,`${query}: exact/model match must remain first`);
  assert(payload.compareSlugs.length<=3,`${query}: compare shortlist should contain at most three products`);
  const category=bySlug.get(payload.results[0].slug)?.category;
  assert(category,`${query}: anchored category missing`);
  for(const result of payload.results){
    assert.strictEqual(bySlug.get(result.slug)?.category,category,`${query}: cross-category result leaked into Research View: ${result.slug}`);
  }
  for(const slug of payload.compareSlugs){
    assert.strictEqual(bySlug.get(slug)?.category,category,`${query}: cross-category compare candidate leaked: ${slug}`);
  }
  return {query,anchor:payload.results[0].slug,category,results:payload.results.map(x=>x.slug),compareSlugs:payload.compareSlugs};
}

const report=[];
report.push(checkModelQuery('Sony XM6'));
report.push(checkModelQuery('Philips NA551'));

for(const query of ['robot vacuum for pet hair','TV under $2,000']){
  const payload=research.researchPayload(query);
  assert.notStrictEqual(payload.modelScoped,true,`${query}: broad/non-model query must not be forced into a model category`);
  report.push({query,modelScoped:false,mode:payload.mode,results:(payload.results||[]).slice(0,3).map(x=>x.slug)});
}

// Exact maintained brand queries are discovery filters, not cross-category recommendation
// prompts. All visible products and source labels must remain within the chosen brand.
for(const query of ['Sony','Philips','Baratza']){
  const lexical=searchSite(query),payload=research.researchPayload(query);
  assert.strictEqual(payload.mode,'brand-discovery',`${query}: exact brand should use brand discovery mode`);
  assert(lexical.products?.length,`${query}: expected maintained brand products`);
  assert(payload.results?.length,`${query}: expected maintained brand discovery results`);
  for(const product of lexical.products)assert.strictEqual(product.brand,query,`${query}: cross-brand lexical result leaked: ${product.slug}`);
  for(const result of payload.results)assert.strictEqual(result.brand,query,`${query}: cross-brand Research View result leaked: ${result.slug}`);
  assert.strictEqual((payload.compareSlugs||[]).length,0,`${query}: brand-only discovery must not create a cross-category compare shortlist`);
  for(const source of payload.sources||[]){
    assert(!String(source.product||'').startsWith(`${query} ${query} `),`${query}: source label duplicated the brand: ${source.product}`);
  }
  report.push({query,mode:payload.mode,results:payload.results.map(x=>x.slug),sources:(payload.sources||[]).map(x=>x.product)});
}

// Consumer typo regression: category parsing must never treat `phone` inside
// `headphonez` as a Smartphones intent. One-edit recovery should resolve the
// maintained `headphones` alias and keep the Research View like-for-like.
{
  const match=categoryFromQuery('headphonez');
  const lexical=searchSite('headphonez');
  const payload=research.researchPayload('headphonez');
  assert.strictEqual(match?.slug,'wireless-headphones','headphonez: typo matcher should resolve Wireless headphones');
  assert.strictEqual(payload.decisionState?.category,'wireless-headphones','headphonez: decision state must not resolve to Smartphones');
  assert(lexical.products?.length,'headphonez: expected maintained headphone results');
  assert(payload.results?.length,'headphonez: expected Research View results');
  for(const product of lexical.products.slice(0,12))assert.strictEqual(product.category,'wireless-headphones',`headphonez: cross-category lexical result leaked: ${product.slug}`);
  for(const result of payload.results)assert.strictEqual(bySlug.get(result.slug)?.category,'wireless-headphones',`headphonez: cross-category Research View result leaked: ${result.slug}`);
  assert(!payload.results.some(result=>bySlug.get(result.slug)?.category==='smartphones'),'headphonez: smartphone result must never survive typo recovery');
  report.push({query:'headphonez',category:payload.decisionState?.category,match:match?.match,results:payload.results.map(x=>x.slug)});
}

// Preserve legitimate whole-token category behaviour while removing substring collisions.
for(const [query,expected] of [['headphones','wireless-headphones'],['smartphone','smartphones']]){
  const match=categoryFromQuery(query);
  const payload=research.researchPayload(query);
  assert.strictEqual(match?.slug,expected,`${query}: expected ${expected} category`);
  assert.strictEqual(payload.decisionState?.category,expected,`${query}: Decision Intelligence category regression`);
  report.push({query,category:expected,match:match?.match,results:(payload.results||[]).slice(0,3).map(x=>x.slug)});
}

// Australian price-format regression: the comma in A$2,000 must not destroy the
// hard ceiling or allow a known maintained A$2,299 product to be treated as eligible.
{
  const query='TV under $2,000';
  const lexical=searchSite(query),payload=research.researchPayload(query);
  assert.strictEqual(payload.decisionState?.category,'televisions',`${query}: category regression`);
  assert.strictEqual(payload.decisionState?.budget?.amount,2000,`${query}: comma-formatted budget should parse to 2000`);
  assert.strictEqual(payload.decisionState?.budget?.hard,true,`${query}: under should remain a hard ceiling`);
  assert.strictEqual(payload.decisionState?.hardConstraints?.budgetCeiling,2000,`${query}: hard budget ceiling missing`);
  assert(payload.results?.length,`${query}: expected maintained TV results`);
  for(const result of payload.results){
    if(Number(result.priceBasis)>0)assert(Number(result.priceBasis)<=2000,`${query}: known over-budget result presented as viable: ${result.slug} A$${result.priceBasis}`);
    assert.notStrictEqual(result.status,'ineligible',`${query}: ineligible result leaked into Research View: ${result.slug}`);
  }
  for(const product of lexical.products){
    const price=Number(product.price||0);
    if(price>0)assert(price<=2000,`${query}: known over-budget lexical result leaked: ${product.slug} A$${price}`);
  }
  report.push({query,budget:payload.decisionState.budget,results:payload.results.map(x=>({slug:x.slug,priceBasis:x.priceBasis,status:x.status}))});
}

// Brand-vs-brand without a category is ambiguous. Never construct a head-to-head
// from arbitrary products in different categories; ask for one more detail instead.
{
  const query='Samsung vs LG',lexical=searchSite(query),payload=research.researchPayload(query);
  assert.strictEqual(lexical.directCompare,null,`${query}: cross-category direct comparison must be suppressed`);
  assert.strictEqual(payload.mode,'comparison-needs-category',`${query}: expected clarification state`);
  assert(!payload.comparison,`${query}: must not expose a fabricated prepared comparison`);
  assert.strictEqual((payload.results||[]).length,0,`${query}: must not present unrelated product candidates as a comparison`);
  assert((payload.followUps||[]).every(x=>String(x.query||'').startsWith('Samsung vs LG ')),`${query}: follow-ups must preserve both brands and add a category`);
  report.push({query,mode:payload.mode,followUps:(payload.followUps||[]).map(x=>x.query)});
}

// The coherence guard must not remove legitimate exact product comparisons. Build a
// maintained Samsung/LG same-category pair dynamically so the test follows catalogue truth.
{
  let pair=null;
  for(const a of products.filter(p=>p.brand==='Samsung')){
    const b=products.find(p=>p.brand==='LG'&&p.category===a.category);
    if(b){pair={a,b};break;}
  }
  if(pair){
    const query=`${pair.a.brand} ${pair.a.name} vs ${pair.b.brand} ${pair.b.name}`,lexical=searchSite(query),payload=research.researchPayload(query);
    assert(lexical.directCompare,`${query}: exact same-category products should retain direct comparison`);
    assert.strictEqual(lexical.directCompare.a.category,lexical.directCompare.b.category,`${query}: direct comparison must remain like-for-like`);
    assert.strictEqual(payload.mode,'comparison',`${query}: exact same-category comparison should retain prepared comparison mode`);
    assert(payload.comparison,`${query}: expected prepared comparison payload`);
    report.push({query,mode:payload.mode,category:lexical.directCompare.a.category,products:[lexical.directCompare.a.slug,lexical.directCompare.b.slug]});
  }
}

// A query with no recognised category, brand, model or decision signal must end in a
// useful zero-result state. Never fill the space with unrelated catalogue products.
{
  const query='zzzxqv 123456789',lexical=searchSite(query),payload=research.researchPayload(query);
  assert.strictEqual(lexical.zeroResult?.reason,'unrecognised-query',`${query}: expected unrecognised-query state`);
  assert.strictEqual((lexical.products||[]).length,0,`${query}: lexical Search must not return unrelated products`);
  assert.strictEqual((lexical.comparisons||[]).length,0,`${query}: Search must not manufacture comparison suggestions`);
  assert.strictEqual(payload.mode,'no-match',`${query}: Research View must render an honest no-match state`);
  assert.strictEqual((payload.results||[]).length,0,`${query}: Research View must not return arbitrary maintained products`);
  assert.strictEqual((payload.compareSlugs||[]).length,0,`${query}: no-match state must not create a compare shortlist`);
  assert((payload.followUps||[]).some(x=>x.url==='/categories/'),`${query}: no-match state should offer a useful next step`);
  report.push({query,mode:payload.mode,zeroResult:lexical.zeroResult?.reason,followUps:payload.followUps});
}

console.log(JSON.stringify({status:'PASS',version:research.VERSION,cases:report},null,2));
