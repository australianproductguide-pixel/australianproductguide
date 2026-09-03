'use strict';

const assert=require('assert');
const fs=require('fs');
const pages=require('../lib/pages');
const content=require('../lib/content');
const depth=require('../lib/search-opportunity-depth-v104');
const runtime=require('../lib/search-opportunity-depth-v104-runtime');
const decisionFix=require('../lib/decision-hard-constraint-fallback-v1036');
const growth=require('../lib/search-opportunity-growth-v104');
const {categories}=require('../data');
const {pairPages,indexableRoutes}=require('../lib/routes');

const TARGETS=['televisions','laptops','washing-machines','coffee-machines','robot-vacuums','smartphones'];
const req={headers:{host:'australianproductguide.au','x-forwarded-proto':'https'},url:'/'};
function url(path){return new URL(path,'https://australianproductguide.au');}
function has(text,token,msg){assert(String(text).includes(token),msg||`Missing ${token}`);}
function renderRuntime(path){
  return new Promise((resolve,reject)=>{
    const headers={};
    const request={
      url:path,
      method:'GET',
      headers:{host:'australianproductguide.au','x-forwarded-proto':'https'},
      on(){return this;},
      destroy(){}
    };
    const response={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=v;},
      getHeader(k){return headers[String(k).toLowerCase()];},
      removeHeader(k){delete headers[String(k).toLowerCase()];},
      write(){return true;},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}
    };
    try{
      const result=runtime(request,response);
      if(result&&typeof result.then==='function')result.catch(reject);
    }catch(error){reject(error);}
  });
}

assert.strictEqual(depth.VERSION,'104.0');
assert.strictEqual(depth.REVIEWED,'2026-08-25');
assert.strictEqual(runtime.SEARCH_OPPORTUNITY_DEPTH_VERSION,'104.0');
assert.strictEqual(decisionFix.DECISION_HARD_CONSTRAINT_FALLBACK_VERSION,'103.6');
assert.strictEqual(growth.VERSION,'104.0');
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

// Step 1 reconciliation: About/Updates are already sourced from the canonical,
// data-driven Trust Centre content. v104 must not create a competing runtime version
// merely to change dates or react to a stale search-engine cache.
const facts=content.__facts;
assert(facts&&facts.products&&facts.categories&&facts.brands,'Canonical Trust Centre catalogue facts required');
for(const slug of ['about','updates']){
  const original=pages.trustPage(req,slug);
  const transformed=depth.transformHtml(original,`/${slug}/`);
  assert.strictEqual(transformed,original,`v104 must not mutate canonical Trust Centre route /${slug}/`);
  has(original,`${facts.products} products`,`${slug} must use current data-driven product count`);
  has(original,`${facts.categories} populated categories`,`${slug} must use current data-driven category count`);
  has(original,'Reviewed 23 August 2026',`${slug} must retain the legitimate Trust Centre review date`);
  assert(!/257 products/i.test(original),`${slug} contains superseded 257-product claim`);
  assert(!/48 populated categories/i.test(original),`${slug} contains superseded 48-category claim`);
}

// Steps 4-5: prepare exact APG distribution + earned-authority work, but do not
// publish or send from the build process.
const plan=growth.plan();
assert.strictEqual(plan.published,false,'v104 must never auto-publish external content');
assert.deepStrictEqual([...plan.targets].sort(),[...TARGETS].sort(),'Distribution targets must match the six depth categories');
assert.strictEqual(plan.profiles.length,6,'All six verified APG social profiles must be available to the distribution plan');
assert(plan.profiles.every(p=>p.active&&p.verified&&p.url),'Distribution plan may use only active verified APG profiles');
assert.strictEqual(plan.items.length,12,'Expected one category and one head-to-head asset for each target category');
for(const item of plan.items){
  assert.strictEqual(item.status,'READY_FOR_HUMAN_APPROVAL_NOT_PUBLISHED',`${item.id} must remain approval-gated`);
  assert(item.destination.startsWith(growth.ORIGIN+'/'),'Social destination must remain canonical APG');
  assert(!/amazon\.|tag=auproductguid/i.test(item.destination),`${item.id} must not distribute direct Amazon affiliate URLs`);
  for(const key of growth.SOCIAL_KEYS){
    assert(item.drafts[key],`${item.id} missing ${key} draft`);
    assert.strictEqual(item.drafts[key].destination,item.destination,`${item.id} ${key} destination drift`);
  }
  if(item.kind==='head-to-head'){
    assert(item.pair&&item.pair.a&&item.pair.b,`${item.id} must resolve a curated comparison pair`);
    assert.strictEqual(item.creative.type,'generic-apg-card',`${item.id} must default to generic APG creative until product imagery is independently cleared`);
  }
}
assert(growth.authorityQueue.length>=5,'Earned-authority queue must contain selective high-quality candidates');
assert(growth.authorityQueue.every(x=>x.status==='PREPARED_NOT_SENT'),'Earned-authority work must remain unsent pending approval');
assert(/Observed search demand/.test(growth.expansionGate.rule),'Expansion must remain search-evidence gated');

const untouched=pages.categoryPage(req,categories['air-fryers'],url('/categories/air-fryers/'));
assert.strictEqual(depth.transformHtml(untouched,'/categories/air-fryers/'),untouched,'Non-target category must remain unchanged');

// The maintained public entry point is governed by v106. v106 delegates directly to
// v104, and v104 delegates directly to the v103.6 hard-constraint correction.
const apiEntry=fs.readFileSync(require.resolve('../api/index'),'utf8');
const v106Source=fs.readFileSync(require.resolve('../lib/action5-catalogue-certification-v106-runtime'),'utf8');
const runtimeSource=fs.readFileSync(require.resolve('../lib/search-opportunity-depth-v104-runtime'),'utf8');
has(apiEntry,"const runtime=require('../lib/action5-catalogue-certification-v106-runtime')",'API entry must retain the governed v106 runtime');
has(v106Source,"const downstream=require('./search-opportunity-depth-v104-runtime')",'v106 must directly retain v104 beneath its catalogue certification controls');
has(runtimeSource,"const downstream=require('./decision-hard-constraint-fallback-v1036')",'v104 runtime must directly delegate to v103.6');

(async()=>{
  let certifiedRuntimeRoutes=0;
  for(const slug of TARGETS){
    const featured=growth.featuredPair(slug);
    assert(featured&&featured.path,`No featured curated pair available for full-runtime certification: ${slug}`);
    const routes=[
      {path:`/categories/${slug}/`,section:'category'},
      {path:`/guides/${slug}-buying-guide/`,section:'guide'},
      {path:`/compare/${slug}/`,section:'compare-index'},
      {path:featured.path,section:'pair'}
    ];
    for(const route of routes){
      const rendered=await renderRuntime(route.path);
      assert.strictEqual(rendered.status,200,`${route.path} full-runtime status`);
      assert.match(String(rendered.headers['content-type']||''),/text\/html/i,`${route.path} must render HTML through the full runtime`);
      assert.strictEqual(rendered.headers['x-apg-decision-hard-constraint-fallback'],'v103.6',`${route.path} must retain v103.6 beneath v104`);
      assert.strictEqual(rendered.headers['x-apg-search-opportunity-depth'],'v104.0',`${route.path} missing full-runtime v104 header`);
      has(rendered.body,'name="apg-search-opportunity-depth"',`${route.path} missing full-runtime v104 marker`);
      has(rendered.body,`data-apg-search-depth="${route.section}"`,`${route.path} missing full-runtime ${route.section} section`);
      if(route.section==='guide')has(rendered.body,'"dateModified":"2026-08-25"',`${route.path} full-runtime guide dateModified not reconciled`);
      if(route.section==='pair')has(rendered.body,'APG does not award a generic winner',`${route.path} full-runtime pair lacks conditional-choice wording`);
      certifiedRuntimeRoutes+=1;
    }
  }

  // v104 must preserve the just-certified v103.6 Decision Engine correction through
  // the public outer runtime. Decision API is not a v104 search-depth content route,
  // so it must retain v103.6 without receiving a v104 content marker/header.
  const exact75=await renderRuntime('/api/decision?q=TV+must+be+exactly+75+inches&category=televisions');
  assert.strictEqual(exact75.status,200,'75-inch Decision API status');
  assert.strictEqual(exact75.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','75-inch Decision API lost v103.6');
  assert.strictEqual(exact75.headers['x-apg-search-opportunity-depth'],undefined,'Decision API must not be labelled as v104 content depth');
  const exact75Body=JSON.parse(exact75.body);
  assert.strictEqual(exact75Body.audit?.hardConstraintFallback,false,'valid 75-inch exact match must not fall back');
  assert(exact75Body.audit?.eligibleCount>0,'valid 75-inch exact request must retain eligible products');
  assert.strictEqual(exact75Body.results?.[0]?.hardConstraintStatus,'eligible','leading 75-inch result must remain eligible');
  assert.strictEqual(exact75Body.results?.[0]?.slug,'hisense-75u6sau-75-inch-u6s-uled-miniled-tv','known 75-inch benchmark drifted');

  const impossible=await renderRuntime('/api/decision?q=TV+must+be+exactly+999+inches&category=televisions');
  assert.strictEqual(impossible.status,200,'999-inch Decision API status');
  assert.strictEqual(impossible.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','999-inch Decision API lost v103.6');
  assert.strictEqual(impossible.headers['x-apg-search-opportunity-depth'],undefined,'Decision API must not be labelled as v104 content depth');
  const impossibleBody=JSON.parse(impossible.body);
  assert.strictEqual(impossibleBody.audit?.eligibleCount,0,'999-inch exact request must keep zero eligible products');
  assert.strictEqual(impossibleBody.audit?.hardConstraintFallback,true,'999-inch exact request must retain explicit fallback');
  assert.strictEqual(impossibleBody.commercialRecommendationWeight,0,'v104 must not alter commercial recommendation neutrality');
  assert(impossibleBody.results?.length>0,'999-inch fallback must expose maintained alternatives');
  assert(impossibleBody.results.every(row=>row.hardConstraintStatus==='ineligible'),'999-inch fallback alternatives must remain explicitly ineligible');

  const lab=await renderRuntime('/decision-lab/?q=TV+must+be+exactly+999+inches');
  assert.strictEqual(lab.status,200,'999-inch Decision Lab status through v104');
  assert.strictEqual(lab.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','Decision Lab lost v103.6 through v104');
  assert.strictEqual(lab.headers['x-apg-search-opportunity-depth'],undefined,'Decision Lab must not be labelled as a v104 content-depth route');
  has(lab.body,'999','Decision Lab must retain impossible exact requirement');
  assert(!/>Best fit</.test(lab.body),'Decision Lab fallback must not be presented as a best fit');

  for(const slug of ['about','updates']){
    const rendered=await renderRuntime(`/${slug}/`);
    assert.strictEqual(rendered.status,200,`/${slug}/ full-runtime status`);
    assert.match(String(rendered.headers['content-type']||''),/text\/html/i,`/${slug}/ full-runtime HTML`);
    assert.strictEqual(rendered.headers['x-apg-decision-hard-constraint-fallback'],'v103.6',`/${slug}/ must retain v103.6 runtime lineage`);
    assert.strictEqual(rendered.headers['x-apg-search-opportunity-depth'],undefined,`/${slug}/ must not carry v104 search-depth header`);
    assert(!rendered.body.includes('name="apg-search-opportunity-depth"'),`/${slug}/ must not carry v104 search-depth marker`);
    has(rendered.body,`${facts.products} products`,`${slug} full-runtime current product count`);
    has(rendered.body,`${facts.categories} populated categories`,`${slug} full-runtime current category count`);
    has(rendered.body,'Reviewed 23 August 2026',`${slug} full-runtime must retain legitimate review date`);
    assert(!/257 products/i.test(rendered.body),`/${slug}/ full-runtime contains superseded 257-product claim`);
    assert(!/48 populated categories/i.test(rendered.body),`/${slug}/ full-runtime contains superseded 48-category claim`);
  }

  const nonTarget=await renderRuntime('/categories/air-fryers/');
  assert.strictEqual(nonTarget.status,200,'non-target category full-runtime status');
  assert.strictEqual(nonTarget.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','non-target category must retain v103.6');
  assert.strictEqual(nonTarget.headers['x-apg-search-opportunity-depth'],undefined,'non-target category must not carry v104 header');
  assert(!nonTarget.body.includes('name="apg-search-opportunity-depth"'),'non-target category must not carry v104 marker');

  console.log('SEARCH_OPPORTUNITY_DEPTH_V104=PASS');
  console.log(`TARGET_CATEGORIES=${TARGETS.length}`);
  console.log(`CURATED_PAIR_PAGES_TESTED=${TARGETS.length}`);
  console.log(`FULL_RUNTIME_ROUTES_CERTIFIED=${certifiedRuntimeRoutes}`);
  console.log('DECISION_FALLBACK_INHERITANCE_V1036=PASS exact75=eligible exact999=fallback-ineligible');
  console.log('TRUST_RUNTIME_NON_MUTATION=2');
  console.log('ABOUT_UPDATES_SOURCE_RECONCILIATION=PASS review_date=2026-08-23');
  console.log(`SOCIAL_DISTRIBUTION_ASSETS=${plan.items.length} APPROVAL_GATED=YES`);
  console.log(`EARNED_AUTHORITY_CANDIDATES=${growth.authorityQueue.length} SENT=NO`);
  console.log('SEARCH_EXPANSION_GATE=ENFORCED');
  console.log('NEW_CATALOGUE_ROUTES_CREATED=0');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
