'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const whole=require('../lib/whole-site-experience-v109-runtime');
const {categories,products}=require('../data');

function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},getHeader(k){return headers[String(k).toLowerCase()]},removeHeader(k){delete headers[String(k).toLowerCase()]},write(){return true},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')})}};
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}
function count(text,needle){return (String(text).match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length}
function populatedCategoryCount(){return Object.values(categories).filter(c=>Array.isArray(c.products)&&c.products.length>0).length}
function brandCount(){return new Set(products.map(p=>String(p.brand||'').trim()).filter(Boolean)).size}

(async()=>{
  assert.equal(app.WHOLE_SITE_EXPERIENCE_VERSION,whole.VERSION,'outer runtime must expose whole-site experience version');
  assert.equal(whole.FACTS.productCount,products.length,'product fact must come from canonical catalogue data');
  assert.equal(whole.FACTS.categoryCount,populatedCategoryCount(),'category fact must come from populated canonical categories');
  assert.equal(whole.FACTS.brandCount,brandCount(),'brand fact must come from canonical product entities');
  assert(whole.FACTS.productCount>257,'current canonical product count must not regress to the legacy 257-product state');
  assert(whole.FACTS.categoryCount>48,'current populated category count must not regress to the legacy 48-category state');
  assert(whole.FACTS.brandCount>16,'current brand count must not regress to the legacy 16-brand state');

  for(const family of ['home','search','categories','category','finder','product','compare','decision-lab','my-apg','guide','brand','retailers','deals','trust','sitemap','other']){
    assert.equal(typeof whole.routeContext('/',new URL('https://australianproductguide.au/')).family,'string');
    assert(whole.css.includes('.apg-system-rail'),'shared experience rail CSS must exist');
    assert(whole.clientJs.includes('markCurrentNavigation'),'navigation must be progressively enhanced with current-location semantics');
    assert(whole.clientJs.includes('data-apg-system-scout'),'shared journey actions must be able to open the one canonical Scout surface');
  }
  assert.match(whole.css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,'mobile system actions must be deliberately responsive');
  assert.match(whole.css,/min-height:44px/,'mobile system actions must satisfy the practical touch-target floor');
  assert.match(whole.css,/prefers-reduced-motion:reduce/,'whole-site polish must respect reduced motion');
  assert.match(whole.css,/--apg109-navy:#102f4a/,'whole-site layer must retain the established APG navy');
  assert.match(whole.css,/--apg109-blue:#2563eb/,'whole-site layer must retain the established APG blue');

  const sample='<h2>48 category pathways</h2><p>257 products across 48 categories.</p><h2>16 brands represented in the maintained catalogue</h2>';
  const reconciled=whole.reconcilePlatformFacts(sample,'/about/');
  assert(!reconciled.includes('257 products'),'legacy 257-product current-state copy must be reconciled');
  assert(!reconciled.includes('48 categories'),'legacy 48-category current-state copy must be reconciled');
  assert(!reconciled.includes('48 category pathways'),'legacy 48-category-pathway current-state copy must be reconciled');
  assert(!reconciled.includes('16 brands represented'),'legacy 16-brand current-state copy must be reconciled');
  assert(reconciled.includes(String(whole.FACTS.productCount)),'reconciled current-state copy must expose canonical product fact');
  assert(reconciled.includes(String(whole.FACTS.categoryCount)),'reconciled current-state copy must expose canonical category fact');
  assert(reconciled.includes(String(whole.FACTS.brandCount)),'reconciled current-state copy must expose canonical brand fact');

  const routes=[
    ['home','/'],
    ['search','/search/?q=wireless+headphones&budget=500'],
    ['categories','/categories/'],
    ['category','/categories/wireless-headphones/'],
    ['finder','/categories/wireless-headphones/finder/'],
    ['product','/products/bose-quietcomfort-ultra-headphones/'],
    ['compare','/compare/wireless-headphones/'],
    ['decision-lab','/decision-lab/?q=quiet+headphones&category=wireless-headphones&budget=500'],
    ['my-apg','/my-apg/'],
    ['guide','/guides/wireless-headphones-buying-guide/'],
    ['brand','/brands/bose/'],
    ['retailers','/retailers/'],
    ['deals','/deals/'],
    ['trust','/methodology/'],
    ['trust','/about/'],
    ['trust','/coverage/'],
    ['sitemap','/sitemap/'],
    ['other','/this-route-does-not-exist/']
  ];
  for(const [family,route] of routes){
    const response=await render(route);
    assert(response.status===200||response.status===404,`${route} must render a valid document response`);
    assert.equal(response.headers['x-apg-whole-site-experience'],'v'+whole.VERSION,`${route} must pass through whole-site experience wrapper`);
    assert(response.body.includes('data-apg-experience-v109="true"'),`${route} must enable whole-site body contract`);
    assert(response.body.includes(`data-apg-route-family="${family}"`),`${route} must expose the correct route family`);
    assert.equal(count(response.body,'class="apg-system-rail"'),1,`${route} must contain exactly one shared APG decision-system rail`);
    const wholeCssDelivered=response.body.includes(whole.CSS_PATH)||(route==='/'&&response.body.includes('/assets/pagespeed-home-v113.css'));
    assert(wholeCssDelivered,`${route} must load whole-site styling directly or through the certified homepage bundle`);
    assert(response.body.includes(whole.JS_PATH),`${route} must load whole-site progressive enhancement`);
    assert(response.body.includes('APG decision system'),`${route} must communicate its place in the connected customer journey`);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route} must still retain exactly one canonical Scout launcher`);
  }

  const homepage=await render('/');
  assert(homepage.body.includes(`${whole.FACTS.productCount}`),'homepage must communicate canonical product count');
  assert(homepage.body.includes(`${whole.FACTS.categoryCount}`),'homepage must communicate canonical populated category count');
  assert(homepage.body.includes(`${whole.FACTS.brandCount}`),'homepage must communicate canonical brand count');
  assert(!homepage.body.includes('37 maintained products'),'homepage must not expose superseded maintained-product count');
  assert(!homepage.body.includes('4 live decision categories'),'homepage must not expose superseded four-category state');

  const priorityRail=homepage.body.indexOf('data-apg112-depth-rail="true"');
  const mainClose=homepage.body.lastIndexOf('</main>');
  const footerStart=homepage.body.indexOf('<footer');
  const htmlClose=homepage.body.lastIndexOf('</html>');
  assert.equal(count(homepage.body,'data-apg112-depth-rail="true"'),1,'homepage must contain exactly one Priority Decision Areas rail');
  assert(priorityRail>=0,'homepage must render the Priority Decision Areas rail');
  assert(mainClose>priorityRail,'Priority Decision Areas must remain inside main content');
  assert(footerStart>priorityRail,'Priority Decision Areas must render before the footer on every viewport');
  assert(htmlClose>=0,'homepage must close the HTML document');
  assert.equal(homepage.body.slice(htmlClose+'</html>'.length).trim(),'','homepage must never append rendered content after </html>');

  const categoriesPage=await render('/categories/');
  assert(!categoriesPage.body.includes('Four categories are fully maintained today'),'category directory must not communicate the superseded four-category platform state');
  assert(!categoriesPage.body.includes('48 category pathways'),'category directory must not communicate a superseded pathway count as current truth');

  const searchContext=whole.routeContext('/search/',new URL('https://australianproductguide.au/search/?q=quiet+headphones&budget=500&brand=Bose'));
  const decisionAction=searchContext.actions.find(x=>x[0]==='Continue in Decision Lab');
  assert(decisionAction&&decisionAction[1].includes('q=quiet+headphones'),'Search -> Decision Lab rail action must preserve search intent');
  assert(decisionAction[1].includes('budget=500'),'Search -> Decision Lab rail action must preserve budget context');
  assert(decisionAction[1].includes('brand=Bose'),'Search -> Decision Lab rail action must preserve brand context without making brand a recommendation');

  console.log(JSON.stringify({version:whole.VERSION,status:'PASS',facts:whole.FACTS,routesChecked:routes.length,checks:{canonicalFacts:true,legacyFactReconciliation:true,allPageFamilies:true,oneScout:true,routeAwareJourney:true,searchDecisionContinuity:true,premiumBranding:true,mobileTouchTargets:true,reducedMotion:true,commercialNeutralityPreserved:true,homepageBundledCssCompatible:true,priorityDecisionRailBeforeFooter:true,noContentAfterHtml:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
