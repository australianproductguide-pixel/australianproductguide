'use strict';

// APG Google Discoverability + Safe Performance Delivery v128.2.
// A deliberately narrow outer delivery layer. It does not alter product evidence,
// recommendations, retailer weighting, privacy choices, structured data, canonicals,
// robots, crawler permissions or agentic-browsing controls.
const VERSION='128.2';
const HEADER_NAME='X-APG-Google-Discoverability-Performance';
const MARKER='<meta name="apg-google-discoverability-performance" content="v128.2">';
const ORIGIN='https://australianproductguide.au';

const LEGACY_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-80/';
const CANONICAL_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-20/';
const LEGACY_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-80/';
const CANONICAL_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-20/';

// These replacements are intentionally exact and fail closed. Each referenced stylesheet is
// already wholly guarded by the same viewport media query in its own source. Adding the media
// hint prevents irrelevant CSS from blocking the opposite viewport without changing the
// applicable cascade. A future asset-version change simply stops matching until re-certified.
const STYLE_REPLACEMENTS=Object.freeze([
  Object.freeze([
    '<link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2">',
    '<link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2" media="(min-width:981px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/desktop-about-trust-contrast-v127.css?v=127.0">',
    '<link rel="stylesheet" href="/assets/desktop-about-trust-contrast-v127.css?v=127.0" media="(min-width:921px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/mobile-header-wordmark-v75.css?v=75.0">',
    '<link rel="stylesheet" href="/assets/mobile-header-wordmark-v75.css?v=75.0" media="(max-width:920px)">'
  ]),
  Object.freeze([
    '<link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21">',
    '<link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21" media="(max-width:920px)">'
  ])
]);

function requestUrl(raw){
  try{return new URL(String(raw||'/'),ORIGIN);}
  catch{return new URL(ORIGIN+'/');}
}
function redirectTarget(pathname){
  if(pathname===LEGACY_PRODUCT)return CANONICAL_PRODUCT;
  if(pathname===LEGACY_COMPARISON)return CANONICAL_COMPARISON;
  return '';
}
function sendPermanentRedirect(req,res,target){
  res.statusCode=308;
  res.setHeader('Location',target);
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=31536000');
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader(HEADER_NAME,'v'+VERSION);
  return res.end(req&&req.method==='HEAD'?'':'Permanent redirect');
}
function scopeCertifiedViewportStyles(html){
  let out=String(html||'');
  for(const [before,after] of STYLE_REPLACEMENTS)out=out.split(before).join(after);
  return out;
}
function injectMarker(html){
  const out=String(html||'');
  if(!out||out.includes(MARKER))return out;
  return out.replace('</head>',MARKER+'</head>');
}
function transformHtml(html){return injectMarker(scopeCertifiedViewportStyles(html));}
function isVersionedAsset(raw){
  const url=requestUrl(raw);
  return url.pathname.startsWith('/assets/')&&Boolean(url.searchParams.get('v'));
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Google discoverability delivery requires a downstream handler');
  function handler(req,res){
    const url=requestUrl(req&&req.url);
    const target=redirectTarget(url.pathname);
    if(target)return sendPermanentRedirect(req,res,target);

    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const status=Number(res.statusCode||200);
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      if(status>=200&&status<400&&isVersionedAsset(req&&req.url)){
        res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      }
      if(req&&req.method!=='HEAD'&&status>=200&&status<400&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body);
        const source=wasBuffer?body.toString('utf8'):body;
        const next=transformHtml(source);
        if(next!==source){
          body=wasBuffer?Buffer.from(next,'utf8'):next;
          try{res.removeHeader('Content-Length');}catch{}
        }
      }
      res.setHeader(HEADER_NAME,'v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION:VERSION,
    GOOGLE_DISCOVERABILITY_PERFORMANCE_REDIRECTS:Object.freeze({
      [LEGACY_PRODUCT]:CANONICAL_PRODUCT,
      [LEGACY_COMPARISON]:CANONICAL_COMPARISON
    })
  });
  return handler;
}

module.exports={
  VERSION,HEADER_NAME,MARKER,LEGACY_PRODUCT,CANONICAL_PRODUCT,LEGACY_COMPARISON,CANONICAL_COMPARISON,
  STYLE_REPLACEMENTS,requestUrl,redirectTarget,sendPermanentRedirect,scopeCertifiedViewportStyles,
  injectMarker,transformHtml,isVersionedAsset,wrap
};
