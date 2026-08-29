'use strict';
const assert=require('node:assert/strict');
const app=require('../api/index');
const core=require('../lib/scout-concierge-v5-core');
const patch=require('../lib/scout-active-context-v120');

assert.equal(patch.installed,true,'Scout active-context guard must install');
assert.equal(app.SCOUT_ACTIVE_CONTEXT_VERSION,patch.VERSION,'outer API must expose Scout active-context version');
assert.equal(core.SCOUT_ACTIVE_CONTEXT_VERSION,patch.VERSION,'shared Scout core must expose active-context version');

const stale='sony-wh-1000xm6';
const decision=core.validatePageContext({path:'/decision-lab/',productSlug:stale,categorySlug:'wireless-headphones',currentSearchQuery:'sony headphones'});
assert.equal(decision.pageType,'decision-lab');
assert.equal(decision.productSlug,null,'Decision Lab must not inherit a stale product identity');
assert.deepEqual(decision.comparisonProductSlugs,[],'Decision Lab must not inherit a stale comparison identity');

const search=core.validatePageContext({path:'/search/?q=robot+vacuum',productSlug:stale,categorySlug:'wireless-headphones',currentSearchQuery:'robot vacuum'});
assert.equal(search.pageType,'search');
assert.equal(search.productSlug,null,'Search must not inherit a stale product identity');
assert.equal(search.categorySlug,null,'Search must not inherit a stale product category');
assert.equal(search.currentSearchQuery,'robot vacuum','current Search intent must survive');

const category=core.validatePageContext({path:'/categories/televisions/',productSlug:stale,categorySlug:'wireless-headphones'});
assert.equal(category.pageType,'category');
assert.equal(category.productSlug,null,'category page must not inherit stale product identity');
assert.equal(category.categorySlug,'televisions','URL category must beat stale supplied category');

const product=core.validatePageContext({path:'/products/bose-quietcomfort-ultra-headphones/',productSlug:stale});
assert.equal(product.pageType,'product');
assert.equal(product.productSlug,'bose-quietcomfort-ultra-headphones','current product URL must beat stale supplied product');

const answer=core.buildResponse({text:'Help me with this page',pageContext:{path:'/decision-lab/',productSlug:stale,categorySlug:'wireless-headphones'}});
assert.equal(answer.pageContext?.productSlug,null,'Scout response must expose the corrected current context');
assert(!String(answer.message||'').toLowerCase().includes('sony'),'Decision Lab page help must not be hijacked by stale Sony context');
assert.equal(answer.meta?.commercialRecommendationWeight,0,'context correction must not affect recommendation weighting');

console.log(JSON.stringify({version:patch.VERSION,status:'PASS',checks:{urlAuthoritative:true,staleProductCleared:true,searchIntentPreserved:true,currentProductWins:true,commercialWeightZero:true}},null,2));
