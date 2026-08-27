'use strict';

// APG Customer Journey Programme v114.3.
// Keeps category certification and quality metrics available to internal/API governance,
// while removing operational release language from the public shopping experience.
// Also installs a pre-bind client guard before v112 so canonical Compare/Save controls
// remain owned by the established app.js state handler rather than double toggling.
const base=require('./customer-journey-programme-v1142-runtime');

const VERSION='114.3';
const ORIGIN='https://australianproductguide.au';
const CATEGORY_ROUTE=/^\/categories\/([^/]+)\/$/;
const JS_PATH='/assets/customer-journey-programme-v1143.js';
const CSS_PATH='/assets/customer-journey-programme-v1143.css';
const V112_SCRIPT=/<script src="\/assets\/premium-mobile-decision-commerce-v112\.js\?v=[^"]+" defer><\/script>/i;

function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function removePublicQualityPanel(html){
  return String(html||'').replace(/<aside class="apg114-quality"[^>]*>[\s\S]*?<\/aside>/gi,'');
}
function shopperGuidanceBanner(html){
  return String(html||'').replace(
    /<aside class="apg112-depth-banner"[^>]*>[\s\S]*?<p>([\s\S]*?)\s*This does not imply every category-completion gate has passed or that the category is formally Decision Grade\.<\/p><\/aside>/i,
    (_match,intent)=>`<aside class="apg112-depth-banner" data-apg112-depth="guidance" aria-label="What to focus on"><div><span>What to focus on</span><strong>Start with the trade-offs that change the choice</strong></div><p>${intent.trim()}</p></aside>`
  );
}
function injectCategoryCss(html){
  const source=String(html||'');
  if(source.includes(CSS_PATH))return source;
  return source.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
}
function injectPrebindGuard(html){
  let source=String(html||'');
  if(source.includes(JS_PATH))return source;
  const script=`<script src="${JS_PATH}?v=${VERSION}" defer></script>`;
  if(V112_SCRIPT.test(source))return source.replace(V112_SCRIPT,match=>`${script}${match}`);
  return source.replace('</body>',`${script}</body>`);
}
function shopperCategoryHtml(html){
  let out=removePublicQualityPanel(html);
  out=shopperGuidanceBanner(out);
  out=injectCategoryCss(out);
  return out;
}
function wrap(downstream){
  const inner=base.wrap(downstream);
  function handler(req,res){
    const u=requestUrl(req),categoryMatch=u.pathname.match(CATEGORY_ROUTE);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body;
        let next=source;
        if(categoryMatch)next=shopperCategoryHtml(next);
        next=injectPrebindGuard(next);
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
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v114.3 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.CUSTOMER_JOURNEY_V1143_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function customerJourneyV1143AwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.CUSTOMER_JOURNEY_V1143_INSTALLED=true;
  wholeSiteExperience.CUSTOMER_JOURNEY_PROGRAMME_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={...base,VERSION,JS_PATH,CSS_PATH,removePublicQualityPanel,shopperGuidanceBanner,injectPrebindGuard,shopperCategoryHtml,wrap,install};
