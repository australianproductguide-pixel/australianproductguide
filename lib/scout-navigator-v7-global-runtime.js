'use strict';

// APG Scout Navigator Presentation v7.2
// Availability-first presentation boundary.
//
// The marketplace header lineage (Header Navigation v118 + Marketplace v122-v122.7) was
// historically composed as nested res.end wrappers. Production incident evidence showed that
// large shopping/decision pages could terminate at the Vercel function layer while small pages
// remained healthy. Home had already been stabilised by applying the exact same header transforms
// synchronously in one pass rather than recursively nesting the response wrappers.
//
// v7.2 extends that proven single-pass composition to every ordinary HTML route. No header layer
// is removed: the same transforms are applied in the same order. The legacy nested chain remains
// reachable only for its small runtime header asset requests. eBay Smart Placements remain scoped
// to Deals / Affiliate Disclosure / Privacy through the existing route-safety adapter.
// Recommendation logic, evidence, retailer weighting, affiliate scoring and shopper state are
// unchanged.
const scoutBrand=require('./scout-concierge-v5-brand');
const ebaySmartPlacement=require('./ebay-smart-placement-route-scope-v17-runtime');
const headerNavigation=require('./header-navigation-v118-runtime');
const headerMarketplace122=require('./header-marketplace-v122-runtime');
const headerMarketplace1221=require('./header-marketplace-v1221-runtime');
const headerMarketplace1222=require('./header-marketplace-v1222-runtime');
const headerMarketplace1223=require('./header-marketplace-v1223-runtime');
const headerMarketplace1224=require('./header-marketplace-v1224-runtime');
const headerMarketplace1225=require('./header-marketplace-v1225-runtime');
const headerMarketplace1226=require('./header-marketplace-v1226-runtime');
const headerMarketplace=require('./header-marketplace-v1227-runtime');

const VERSION='7.2';
const CSS_PATH='/assets/scout-navigator-v7-global.css';
const CSS_VERSION='7.2';
const HOME_RUNTIME_STATE='RESTORED_MARKETPLACE_HEADER_SINGLE_PASS_V2';
const HEADER_RUNTIME_STATE='SINGLE_PASS_ALL_HTML_V1';
const HEADER_LAYERS=[
  headerNavigation,
  headerMarketplace122,
  headerMarketplace1221,
  headerMarketplace1222,
  headerMarketplace1223,
  headerMarketplace1224,
  headerMarketplace1225,
  headerMarketplace1226,
  headerMarketplace
];
const css=`/* APG Scout Navigator Presentation v${VERSION} */\n${scoutBrand.presentationCss}`;

function inject(html){
  let out=String(html||'');
  if(!out)return out;
  if(!out.includes('name="apg-scout-navigator-presentation"'))out=out.replace('</head>',`<meta name="apg-scout-navigator-presentation" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${CSS_VERSION}"></head>`);
  if(!/data-apg-scout-navigator=/.test(out))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-scout-navigator="v${VERSION}"$1>`);
  return out;
}

function applyLayer(mod,html){
  if(mod&&typeof mod.transform==='function')return mod.transform(html);
  if(mod&&typeof mod.injectAssets==='function')return mod.injectAssets(html);
  return html;
}
function injectMarketplace(html){
  let out=String(html||'');
  for(const layer of HEADER_LAYERS)out=applyLayer(layer,out);
  return out;
}
// Backwards-compatible diagnostic/export name retained for existing release checks.
const injectHomeMarketplace=injectMarketplace;

function isHeaderRuntimeAsset(path){
  return /^\/assets\/header-(?:navigation|marketplace)-/i.test(String(path||''));
}
function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
  res.setHeader('X-APG-Scout-Navigator-Header-Runtime',HEADER_RUNTIME_STATE);
  return res.end(req.method==='HEAD'?'':css);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Scout Navigator presentation requires downstream handler');

  // Keep the established recursive header lineage available only for its tiny generated assets.
  // Ordinary page HTML never enters this response-wrapper chain in v7.2.
  const headerAssetDownstream=headerMarketplace.wrap(downstream);
  const smartDownstream=ebaySmartPlacement.wrap(downstream);

  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    if(isHeaderRuntimeAsset(path))return headerAssetDownstream(req,res);

    const isHome=path==='/';
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body;
        let next=injectMarketplace(source);
        next=inject(next);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
      res.setHeader('X-APG-Scout-Navigator-Header-Runtime',HEADER_RUNTIME_STATE);
      if(isHome){
        res.setHeader('X-APG-Scout-Navigator-Home-Runtime',HOME_RUNTIME_STATE);
        res.setHeader('X-APG-Header-Marketplace-Mobile-Left-Lockup','v122.6');
        res.setHeader('X-APG-Header-Marketplace-Desktop-Supermenu','v122.7');
      }
      return end(body,...args);
    };

    if(isHome){
      res.setHeader('X-APG-Scout-Navigator-Home-Runtime',HOME_RUNTIME_STATE);
      return downstream(req,res);
    }
    return smartDownstream(req,res);
  }

  Object.assign(handler,smartDownstream,{
    SCOUT_NAVIGATOR_PRESENTATION_VERSION:VERSION,
    SCOUT_NAVIGATOR_CSS_PATH:CSS_PATH,
    SCOUT_NAVIGATOR_HOME_RUNTIME_STATE:HOME_RUNTIME_STATE,
    SCOUT_NAVIGATOR_HEADER_RUNTIME_STATE:HEADER_RUNTIME_STATE,
    scoutNavigatorCss:css,
    injectScoutNavigatorPresentation:inject,
    injectMarketplace,
    injectHomeMarketplace,
    isHeaderRuntimeAsset,
    EBAY_SMART_PLACEMENT_VERSION:ebaySmartPlacement.VERSION,
    EBAY_SMART_PLACEMENT_ROUTE_SCOPE_VERSION:ebaySmartPlacement.ROUTE_SCOPE_VERSION,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION,
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION,
    HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION:headerMarketplace.VERSION
  });
  return handler;
}

module.exports={
  VERSION,CSS_PATH,CSS_VERSION,HOME_RUNTIME_STATE,HEADER_RUNTIME_STATE,HEADER_LAYERS,css,
  inject,applyLayer,injectMarketplace,injectHomeMarketplace,isHeaderRuntimeAsset,wrap
};
