#!/usr/bin/env node
'use strict';
const assert=require('assert');
const research=require('../lib/research-view-v44');
const {searchSite}=require('../lib/search');
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

for(const query of ['Sony','Philips','robot vacuum for pet hair','TV under $2,000']){
  const payload=research.researchPayload(query);
  assert.notStrictEqual(payload.modelScoped,true,`${query}: broad/non-model query must not be forced into a model category`);
  report.push({query,modelScoped:false,mode:payload.mode,results:(payload.results||[]).slice(0,3).map(x=>x.slug)});
}

const comparison=research.researchPayload('Samsung vs LG');
assert.notStrictEqual(comparison.modelScoped,true,'comparison query must retain comparison/discovery behaviour');
report.push({query:'Samsung vs LG',modelScoped:false,mode:comparison.mode,results:(comparison.results||[]).slice(0,3).map(x=>x.slug)});

console.log(JSON.stringify({status:'PASS',version:research.VERSION,cases:report},null,2));
