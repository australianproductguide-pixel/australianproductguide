'use strict';

// APG Scout Navigator Presentation v7.1
// Final presentation-only wrapper. It ensures the approved homepage Navigator skin is the
// last Scout visual layer on every rendered route, after Whole-Site, mobile and route-specific
// styles. It does not score, rank, persist shopper state or alter Scout recommendation logic.
const scoutBrand=require('./scout-concierge-v5-brand');
const ebaySmartPlacement=require('./ebay-smart-placement-route-scope-v17-runtime');
const headerMarketplace=require('./header-marketplace-v1227-runtime');

const VERSION='7.1';
const CSS_PATH='/assets/scout-navigator-v7-global.css';
const CSS_VERSION='7.1';
const HOME_RUNTIME_STATE='P0_BYPASS_HEADER_MARKETPLACE_SMART_PLACEMENT';
const css=`/* APG Scout Navigator Presentation v${VERSION} */\n${scoutBrand.presentationCss}`;

function inject(html){
  let out=String(html||'');
  if(!out)return out;
  if(!out.includes('name="apg-scout-navigator-presentation"'))out=out.replace('</head>',`<meta name="apg-scout-navigator-presentation" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${CSS_VERSION}"></head>`);
  if(!/data-apg-scout-navigator=/.test(out))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-scout-navigator="v${VERSION}"$1>`);
  return out;
}
function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Scout Navigator presentation requires downstream handler');
  // Header Marketplace v122.7 remains inside Navigator so APG's established certification
  // invariant is preserved on every non-Home route. During the 1 Sep 2026 P0, Production
  // bisect proved native Home healthy through auditIntegration and first failing only when this
  // composed presentation boundary was added. Home therefore bypasses the nested Header
  // Marketplace + Smart Placement response chain while retaining the small Navigator skin.
  const headerDownstream=headerMarketplace.wrap(downstream);
  // Smart Placement remains immediately inside Navigator on non-Home routes. Its own route-safety
  // adapter remains unchanged; the Home bypass below additionally removes the full nested
  // presentation composition from the oversized native Home response while incident recovery runs.
  const smartDownstream=ebaySmartPlacement.wrap(headerDownstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const homeP0=path==='/';
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=inject(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
      if(homeP0)res.setHeader('X-APG-Scout-Navigator-Home-Runtime',HOME_RUNTIME_STATE);
      return end(body,...args);
    };
    if(homeP0){
      res.setHeader('X-APG-Scout-Navigator-Home-Runtime',HOME_RUNTIME_STATE);
      return downstream(req,res);
    }
    return smartDownstream(req,res);
  }
  Object.assign(handler,smartDownstream,{
    SCOUT_NAVIGATOR_PRESENTATION_VERSION:VERSION,
    SCOUT_NAVIGATOR_CSS_PATH:CSS_PATH,
    SCOUT_NAVIGATOR_HOME_RUNTIME_STATE:HOME_RUNTIME_STATE,
    scoutNavigatorCss:css,
    injectScoutNavigatorPresentation:inject,
    EBAY_SMART_PLACEMENT_VERSION:ebaySmartPlacement.VERSION,
    EBAY_SMART_PLACEMENT_ROUTE_SCOPE_VERSION:ebaySmartPlacement.ROUTE_SCOPE_VERSION,
    HEADER_NAVIGATION_VERSION:smartDownstream.HEADER_NAVIGATION_VERSION,
    HEADER_MARKETPLACE_VERSION:smartDownstream.HEADER_MARKETPLACE_VERSION,
    HEADER_MARKETPLACE_CLEANUP_VERSION:smartDownstream.HEADER_MARKETPLACE_CLEANUP_VERSION,
    HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION:smartDownstream.HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION,
    HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION:smartDownstream.HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION,
    HEADER_MARKETPLACE_MOBILE_ORDER_VERSION:smartDownstream.HEADER_MARKETPLACE_MOBILE_ORDER_VERSION,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION,
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION,
    HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION:headerMarketplace.VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS_VERSION,HOME_RUNTIME_STATE,css,inject,wrap};
