'use strict';

// APG Scout Navigator Presentation v7.1
// Final presentation-only wrapper. Home uses a single synchronous pure-transform pass for the
// marketplace header so the approved Amazon-style APG navigation is restored without the nested
// res.end interception chain that caused FUNCTION_INVOCATION_FAILED in Vercel Production.
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

const VERSION='7.1';
const CSS_PATH='/assets/scout-navigator-v7-global.css';
const CSS_VERSION='7.1';
const HOME_RUNTIME_STATE='RESTORED_MARKETPLACE_HEADER_SINGLE_PASS_V2';
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
function injectHomeMarketplace(html){
  let out=String(html||'');
  for(const layer of [headerNavigation,headerMarketplace122,headerMarketplace1221,headerMarketplace1222,headerMarketplace1223,headerMarketplace1224,headerMarketplace1225,headerMarketplace1226,headerMarketplace])out=applyLayer(layer,out);
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
  const headerDownstream=headerMarketplace.wrap(downstream);
  const smartDownstream=ebaySmartPlacement.wrap(headerDownstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const isHome=path==='/';
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body;
        let next=isHome?injectHomeMarketplace(source):source;
        next=inject(next);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Scout-Navigator-Presentation','v'+VERSION);
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
    scoutNavigatorCss:css,
    injectScoutNavigatorPresentation:inject,
    injectHomeMarketplace,
    EBAY_SMART_PLACEMENT_VERSION:ebaySmartPlacement.VERSION,
    EBAY_SMART_PLACEMENT_ROUTE_SCOPE_VERSION:ebaySmartPlacement.ROUTE_SCOPE_VERSION,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION,
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:headerMarketplace.HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION,
    HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION:headerMarketplace.VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS_VERSION,HOME_RUNTIME_STATE,css,inject,injectHomeMarketplace,wrap};
