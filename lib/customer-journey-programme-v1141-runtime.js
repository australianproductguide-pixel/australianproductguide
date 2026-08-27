'use strict';

// APG Customer Journey Programme v114.2 composition + Production hotfix adapter.
// Keeps Whole-Site v109 as the final public HTML communication layer while installing
// the v114 category/search/filter/continuity transform inside it. v114.2 repairs the
// category filter summary placement and makes SSR confidence filtering compatible with
// the current v7/apg112 product-card variants. Unrelated routes such as Deals stay out.
const base=require('./customer-journey-programme-v114-runtime');
const {categories,products}=require('../data');
const premiumMobile=require('./premium-mobile-decision-commerce-v112-runtime');

const VERSION='114.2';
const ORIGIN='https://australianproductguide.au';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));
const TARGET_HTML=path=>/^\/categories\/[^/]+\/$/.test(path)||path==='/search/'||path.startsWith('/compare/')||path==='/decision-lab/';
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function sendJson(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return res.end(JSON.stringify(payload));}
function suggestions(req,res,u){
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{error:'method_not_allowed'});
  const query=(u.searchParams.get('q')||'').slice(0,160),items=base.searchSuggestions(query,7),payload={version:VERSION,queryLength:query.trim().length,count:items.length,items};
  return req.method==='HEAD'?sendJson(res,200,{...payload,items:[]}):sendJson(res,200,payload);
}
function quality(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{error:'method_not_allowed'});
  const payload=base.categoryQualityRegister(),versioned={...payload,version:VERSION};
  return req.method==='HEAD'?sendJson(res,200,{version:VERSION,summary:payload.summary}):sendJson(res,200,versioned);
}
function categoryFromPath(path){const match=String(path||'').match(/^\/categories\/([^/]+)\/$/);return match&&categories[match[1]]||null;}
function exactRetailer(product){const best=premiumMobile.strongestRetailer(product);return (Number(best&&best.state&&best.state.rank)||0)>=5;}
function matchesConfidence(product,row,u){
  const evidence=u.searchParams.get('evidence')||'',retailer=u.searchParams.get('retailer')||'',imagery=u.searchParams.get('imagery')||'';
  if(evidence==='strong'&&(row.backlogs.evidence||[]).includes(product.slug))return false;
  if(retailer==='identity'&&(row.backlogs.retailerIdentity||[]).includes(product.slug))return false;
  if(retailer==='exact'&&!exactRetailer(product))return false;
  if(imagery==='verified'&&(row.backlogs.imagery||[]).includes(product.slug))return false;
  return true;
}
function removeLegacyFilterFeedback(html){
  return String(html)
    .replace(/<div class="apg114-filter-summary"[^>]*>[\s\S]*?<\/div>/g,'')
    .replace(/<div class="zero-state apg114-filter-empty"[^>]*>[\s\S]*?<\/div>/g,'');
}
function repairCategoryFilters(html,category,u){
  const row=base.categoryRow(category.slug);if(!row)return html;
  let out=removeLegacyFilterFeedback(html);
  const evidence=u.searchParams.get('evidence')||'',retailer=u.searchParams.get('retailer')||'',imagery=u.searchParams.get('imagery')||'',active=Boolean(evidence||retailer||imagery);
  const matchedProducts=category.products.filter(product=>!active||matchesConfidence(product,row,u));
  const matchedSlugs=new Set(matchedProducts.map(product=>product.slug));
  const productCardPattern=/<article class="product-card[^"]*"[^>]*>[\s\S]*?<\/article>/g;
  out=out.replace(productCardPattern,block=>{
    const match=block.match(/href="\/products\/([^/]+)\//),slug=match&&match[1],product=slug&&PRODUCT_BY_SLUG.get(slug);
    if(!product||product.category!==category.slug)return block;
    return matchedSlugs.has(slug)?block:'';
  });
  const available=category.products.length,shown=matchedProducts.length;
  const summary=`<div class="apg114-filter-summary" role="status" aria-live="polite"><strong>${shown}</strong> of <strong>${available}</strong> products match the current catalogue filters.${active?` <a href="/categories/${category.slug}/">Clear all filters</a>`:''}</div>${active&&shown===0?`<div class="zero-state apg114-filter-empty"><h3>No products match every selected confidence filter</h3><p>Remove one filter to broaden the maintained shortlist. APG does not manufacture evidence or retailer certainty to fill an empty result.</p><a class="button secondary" href="/categories/${category.slug}/">Clear all filters</a></div>`:''}`;
  const filterForm=/(<form class="filter-bar"[\s\S]*?<\/form>)/;
  return filterForm.test(out)?out.replace(filterForm,`$1${summary}`):out;
}
function stampVersion(html){
  return String(html)
    .replace(/data-apg-customer-journey="v114\.0"/g,`data-apg-customer-journey="v${VERSION}"`)
    .replace(/data-apg114-style="v114\.0"/g,`data-apg114-style="v${VERSION}"`)
    .replace(/customer-journey-programme-v114\.js\?v=114\.0/g,`customer-journey-programme-v114.js?v=${VERSION}`);
}
function transformHtml(html,path,u){
  let out=base.transformHtml(html,path,u);
  const category=categoryFromPath(path);if(category)out=repairCategoryFilters(out,category,u);
  return stampVersion(out);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('customer journey programme v114.2 requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),path=u.pathname;
    if(path==='/api/search-suggest')return suggestions(req,res,u);
    if(path==='/api/intelligence/category-quality')return quality(req,res);
    if(!TARGET_HTML(path))return downstream(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase(),textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformHtml(source,path,u);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CUSTOMER_JOURNEY_PROGRAMME_VERSION:VERSION,CATEGORY_QUALITY_REGISTER_VERSION:VERSION,SEARCH_SUGGEST_VERSION:VERSION});
  return handler;
}
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v114.2 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.CUSTOMER_JOURNEY_V1141_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function customerJourneyAwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.CUSTOMER_JOURNEY_V1141_INSTALLED=true;
  wholeSiteExperience.CUSTOMER_JOURNEY_PROGRAMME_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={...base,VERSION,TARGET_HTML,repairCategoryFilters,matchesConfidence,transformHtml,wrap,install};
