'use strict';

// APG Scout Navigator Presentation v7.1
// Final presentation-only wrapper. It ensures the approved homepage Navigator skin is the
// last Scout visual layer on every rendered route, after Whole-Site, mobile and route-specific
// styles. It does not score, rank, persist shopper state or alter Scout recommendation logic.
const scoutBrand=require('./scout-concierge-v5-brand');
const ebaySmartPlacement=require('./ebay-smart-placement-v1-runtime');
const headerMarketplace=require('./header-marketplace-v1222-runtime');

const VERSION='7.1';
const CSS_PATH='/assets/scout-navigator-v7-global.css';
const CSS_VERSION='7.1';
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
  // Header marketplace mobile ownership v122.2 remains inside Navigator so APG's established certification invariant is preserved:
  // Navigator is still the final Scout visual-cascade wrapper on every route. The header layer itself is
  // presentation/navigation only and contributes no product, evidence or retailer scoring.
  const headerDownstream=headerMarketplace.wrap(downstream);
  // The Smart Placement pilot remains immediately inside Navigator as the retailer-discovery layer.
  // It wraps the header-enhanced downstream so its route-scoped CSP interception remains intact.
  const smartDownstream=ebaySmartPlacement.wrap(headerDownstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=inject(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
      return end(body,...args);
    };
    return smartDownstream(req,res);
  }
  Object.assign(handler,smartDownstream,{
    SCOUT_NAVIGATOR_PRESENTATION_VERSION:VERSION,
    SCOUT_NAVIGATOR_CSS_PATH:CSS_PATH,
    scoutNavigatorCss:css,
    injectScoutNavigatorPresentation:inject,
    EBAY_SMART_PLACEMENT_VERSION:ebaySmartPlacement.VERSION,
    HEADER_NAVIGATION_VERSION:headerMarketplace.HEADER_NAVIGATION_VERSION,
    HEADER_MARKETPLACE_VERSION:headerMarketplace.HEADER_MARKETPLACE_VERSION,
    HEADER_MARKETPLACE_CLEANUP_VERSION:headerMarketplace.HEADER_MARKETPLACE_CLEANUP_VERSION,
    HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION:headerMarketplace.VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS_VERSION,css,inject,wrap};
