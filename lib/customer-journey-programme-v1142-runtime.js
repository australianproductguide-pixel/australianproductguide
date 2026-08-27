'use strict';

// APG Customer Journey Programme v114.2 hotfix.
// Corrects the v114 confidence-filter integration against the final v7 product-card
// markup and anchors result feedback to the category filter form rather than the
// global header Search form. It deliberately reuses v114.1 for all other behaviour.
const base=require('./customer-journey-programme-v1141-runtime');
const premiumMobile=require('./premium-mobile-decision-commerce-v112-runtime');

const VERSION='114.2';
const ORIGIN='https://australianproductguide.au';
const CATEGORY_ROUTE=/^\/categories\/([^/]+)\/$/;

function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function removeMisplacedFeedback(html){
  return String(html)
    .replace(/<div class="apg114-filter-summary"[\s\S]*?<\/div>/g,'')
    .replace(/<div class="zero-state apg114-filter-empty"[\s\S]*?<\/div>/g,'');
}
function activeConfidenceFilters(u){
  return {
    evidence:u.searchParams.get('evidence')||'',
    retailer:u.searchParams.get('retailer')||'',
    imagery:u.searchParams.get('imagery')||''
  };
}
function productMatches(product,row,filters){
  if(filters.evidence==='strong'&&row.backlogs.evidence.includes(product.slug))return false;
  if(filters.imagery==='verified'&&row.backlogs.imagery.includes(product.slug))return false;
  if(filters.retailer){
    const state=premiumMobile.strongestRetailer(product).state||{rank:0};
    if(filters.retailer==='identity'&&Number(state.rank)<3)return false;
    if(filters.retailer==='exact'&&Number(state.rank)<5)return false;
  }
  return true;
}
function feedback(categorySlug,shown,available,empty){
  const clear=`/categories/${encodeURIComponent(categorySlug)}/`;
  const summary=`<div class="apg114-filter-summary" data-apg114-filter-summary="true" role="status" aria-live="polite"><strong>${shown}</strong> of <strong>${available}</strong> products match the current confidence filters. <a href="${clear}">Clear confidence filters</a></div>`;
  if(!empty)return summary;
  return summary+`<div class="zero-state apg114-filter-empty" data-apg114-filter-empty="true"><h3>No products match every selected confidence filter</h3><p>Remove one filter to broaden the maintained shortlist. APG does not manufacture evidence, imagery or retailer certainty to fill an empty result.</p><a class="button secondary" href="${clear}">Clear confidence filters</a></div>`;
}
function correctCategoryFilters(html,categorySlug,u){
  let out=removeMisplacedFeedback(html);
  const row=base.categoryRow(categorySlug);
  if(!row)return out;
  const filters=activeConfidenceFilters(u);
  const active=Boolean(filters.evidence||filters.retailer||filters.imagery);
  if(!active)return out;

  let available=0,shown=0;
  const cardPattern=/<article class="product-card[^"]*"[^>]*>[\s\S]*?<\/article>/g;
  out=out.replace(cardPattern,block=>{
    const slugMatch=block.match(/href="\/products\/([^/]+)\//)||block.match(/data-product-slug="([^"]+)"/);
    const slug=slugMatch&&slugMatch[1];
    const product=slug&&base.PRODUCT_BY_SLUG.get(slug);
    if(!product||product.category!==categorySlug)return block;
    available++;
    if(productMatches(product,row,filters)){shown++;return block;}
    return '';
  });

  const formPattern=/(<form class="filter-bar"[\s\S]*?<\/form>)/i;
  if(!formPattern.test(out))return out;
  return out.replace(formPattern,`$1${feedback(categorySlug,shown,available,shown===0)}`);
}
function wrap(downstream){
  const inner=base.wrap(downstream);
  function handler(req,res){
    const u=requestUrl(req),match=u.pathname.match(CATEGORY_ROUTE);
    if(!match)return inner(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=correctCategoryFilters(source,match[1],u);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);
      return end(body,...args);
    };
    return inner(req,res);
  }
  Object.assign(handler,inner,{CUSTOMER_JOURNEY_PROGRAMME_VERSION:VERSION,CATEGORY_QUALITY_REGISTER_VERSION:VERSION,SEARCH_SUGGEST_VERSION:VERSION});
  return handler;
}
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v114.2 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.CUSTOMER_JOURNEY_V1142_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function customerJourneyV1142AwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.CUSTOMER_JOURNEY_V1142_INSTALLED=true;
  wholeSiteExperience.CUSTOMER_JOURNEY_PROGRAMME_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={...base,VERSION,removeMisplacedFeedback,activeConfidenceFilters,correctCategoryFilters,wrap,install};
