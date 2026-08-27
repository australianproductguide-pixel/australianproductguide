'use strict';

// APG Customer Journey Programme v114.4.
// v114.3 remains the shopper-trust/category boundary. This outer compatibility layer
// removes the legacy v114 inline accessibility stylesheet after the inherited transform
// and replaces it with a same-origin stylesheet so APG can keep style-src 'self' without
// console CSP violations. It changes no recommendation, retailer or decision scoring.
const base=require('./customer-journey-programme-v1143-runtime');

const VERSION='114.4';
const CSS_PATH='/assets/customer-journey-programme-v1144.css';
const INLINE_STYLE=/<style\s+data-apg114-style="v[^"]+">[\s\S]*?<\/style>/gi;

function stripInheritedInlineStyle(html){return String(html||'').replace(INLINE_STYLE,'');}
function injectCspSafeCss(html){
  const source=String(html||'');
  if(source.includes(CSS_PATH))return source;
  return source.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
}
function cspSafeHtml(html){
  const source=String(html||'');
  if(!/data-apg114-style=/i.test(source))return source;
  return injectCspSafeCss(stripInheritedInlineStyle(source));
}
function wrap(downstream){
  const inner=base.wrap(downstream);
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=cspSafeHtml(source);
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
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v114.4 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.CUSTOMER_JOURNEY_V1144_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function customerJourneyV1144AwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.CUSTOMER_JOURNEY_V1144_INSTALLED=true;
  wholeSiteExperience.CUSTOMER_JOURNEY_PROGRAMME_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={...base,VERSION,CSS_PATH,stripInheritedInlineStyle,injectCspSafeCss,cspSafeHtml,wrap,install};
