'use strict';

const assert=require('assert');
const fs=require('fs');
const pages=require('../lib/pages');
const depth=require('../lib/search-opportunity-depth-v104');
const runtime=require('../lib/search-opportunity-depth-v104-runtime');
const {categories}=require('../data');
const {pairPages,indexableRoutes}=require('../lib/routes');

const TARGETS=['televisions','laptops','washing-machines','coffee-machines','robot-vacuums','smartphones'];
const req={headers:{host:'australianproductguide.au','x-forwarded-proto':'https'},url:'/'};
function url(path){return new URL(path,'https://australianproductguide.au');}
function has(text,token,msg){assert(String(text).includes(token),msg||`Missing ${token}`);}

assert.strictEqual(depth.VERSION,'104.0');
assert.strictEqual(depth.REVIEWED,'2026-08-25');
assert.strictEqual(runtime.SEARCH_OPPORTUNITY_DEPTH_VERSION,'104.0');
assert.strictEqual(Object.keys(depth.categoryDepth).length,6,'v104 must remain a deliberate six-category depth programme');

for(const slug of TARGETS){
  const c=categories[slug];
  assert(c,`Missing maintained target category ${slug}`);
  assert(Array.isArray(c.products)&&c.products.length>0,`Target ${slug} has no maintained products`);
  assert(indexableRoutes.includes(`/categories/${slug}/`),`Target category is not indexable: ${slug}`);
  assert(indexableRoutes.includes(`/guides/${slug}-buying-guide/`),`Target guide is not indexable: ${slug}`);
  assert(indexableRoutes.includes(`/compare/${slug}/`),`Target comparison hub is not indexable: ${slug}`);
  const d=depth.categoryDepth[slug];
  assert.strictEqual(d.decisions.length,4,`${slug} must have four decision gates`);
  assert.strictEqual(d.verify.length,4,`${slug} must have four verification checks`);
  assert.strictEqual(d.comparisonQuestions.length,5,`${slug} must have five head-to-head questions`);

  const categoryHtml=depth.transformHtml(pages.categoryPage(req,c,url(`/categories/${slug}/`)),`/categories/${slug}/`);
  has(categoryHtml,'name="apg-search-opportunity-depth"',`${slug} category missing v104 marker`);
  has(categoryHtml,'data-apg-search-depth="category"',`${slug} category missing depth section`);
  has(categoryHtml,'High-intent decision brief');
  has(categoryHtml,`/guides/${slug}-buying-guide/`);

  const guideHtml=depth.transformHtml(pages.guidePage(req,c),`/guides/${slug}-buying-guide/`);
  has(guideHtml,'data-apg-search-depth="guide"',`${slug} guide missing depth section`);
  has(guideHtml,'What to verify before you commit');
  has(guideHtml,'"dateModified":"2026-08-25"',`${slug} guide dateModified not reconciled`);

  const compareHtml=depth.transformHtml(pages.compareIndex(req,c),`/compare/${slug}/`);
  has(compareHtml,'data-apg-search-depth="compare-index"',`${slug} comparison hub missing framework`);
  has(compareHtml,'Use the same five questions for every shortlist');

  const pair=pairPages.find(x=>x.category===slug);
  assert(pair,`No curated head-to-head exists for target ${slug}`);
  const pairHtml=depth.transformHtml(pages.pairPage(req,pair),pair.path);
  has(pairHtml,'data-apg-search-depth="pair"',`${slug} head-to-head missing v104 framework`);
  has(pairHtml,'Decision-first head-to-head');
  has(pairHtml,'APG does not award a generic winner');
}

const about=depth.transformHtml(pages.trustPage(req,'about'),'/about/');
has(about,'Reviewed 25 August 2026','About review date not reconciled');
has(about,'id="search-feedback-loop"','About search feedback section missing');
has(about,'depth over mass page creation');

const updates=depth.transformHtml(pages.trustPage(req,'updates'),'/updates/');
has(updates,'Reviewed 25 August 2026','Updates review date not reconciled');
has(updates,'id="search-depth-25-aug"','25 August update record missing');
has(updates,'High-intent decision depth and search feedback loop');

const untouched=pages.categoryPage(req,categories['air-fryers'],url('/categories/air-fryers/'));
assert.strictEqual(depth.transformHtml(untouched,'/categories/air-fryers/'),untouched,'Non-target category must remain unchanged');

const apiEntry=fs.readFileSync(require.resolve('../api/index'),'utf8');
has(apiEntry,"module.exports=require('../lib/search-opportunity-depth-v104-runtime')",'API entry is not wired to v104 outer runtime');

console.log('SEARCH_OPPORTUNITY_DEPTH_V104=PASS');
console.log(`TARGET_CATEGORIES=${TARGETS.length}`);
console.log(`CURATED_PAIR_PAGES_TESTED=${TARGETS.length}`);
console.log('ABOUT_UPDATES_RECONCILED=YES');
console.log('NEW_CATALOGUE_ROUTES_CREATED=0');
