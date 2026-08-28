'use strict';

// APG Favicon Parity v115.0
// Narrow presentation-metadata layer only. It preserves the approved APG favicon.svg
// artwork and standardises browser, Google Search, iOS and PWA discovery references.
// It also carries owner-authorised affiliate-network website verification meta tags for
// Commission Factory and Impact/Lenovo ANZ. These tags verify site ownership only.
// It does not score, rank, recommend, persist shopper state, change retailer weighting,
// alter account/Auth/privacy behaviour or modify commercial logic.
const VERSION='115.0';
const META_NAME='apg-favicon-parity';
const COMMISSION_FACTORY_VERIFICATION='<meta name="commission-factory-verification" content="9a6ccb68d6c44c588a57fb00f4b73e32">';
const IMPACT_SITE_VERIFICATION='<meta name="impact-site-verification" value="0caa62dd-092f-4b63-90a9-348e04c895fa">';

const ICON_LINKS=[
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">',
  '<link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">',
  '<link rel="shortcut icon" href="/favicon.ico">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">',
  '<link rel="manifest" href="/site.webmanifest">'
].join('');

function stripManagedIconLinks(html){
  return String(html||'').replace(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*(?:\bicon\b|apple-touch-icon|apple-touch-icon-precomposed|\bmanifest\b)[^"']*["'])[^>]*>\s*/gi,'');
}

function inject(html){
  const source=String(html||'');
  if(!source||!/<\/head>/i.test(source))return source;
  if(source.includes(`name="${META_NAME}"`))return source;
  const out=stripManagedIconLinks(source);
  const marker=`<meta name="${META_NAME}" content="v${VERSION}">`;
  return out.replace(/<\/head>/i,`${marker}${COMMISSION_FACTORY_VERIFICATION}${IMPACT_SITE_VERIFICATION}${ICON_LINKS}</head>`);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('favicon parity requires downstream handler');
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader('Content-Type')||'').toLowerCase();
      if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body);
        const original=wasBuffer?body.toString('utf8'):body;
        const next=inject(original);
        if(next!==original){
          body=wasBuffer?Buffer.from(next,'utf8'):next;
          try{res.removeHeader('Content-Length')}catch{}
        }
      }
      res.setHeader('X-APG-Favicon-Parity','v'+VERSION);
      return end(body,...args);
    };
    res.setHeader('X-APG-Favicon-Parity','v'+VERSION);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{FAVICON_PARITY_VERSION:VERSION});
  return handler;
}

// Install through the established Whole-Site v109 wrapper factory rather than outside it.
// This keeps Whole-Site v109 as APG's certified final HTML communication boundary while the
// favicon transform remains a narrow inner presentation-metadata control, consistent with
// the v113/v114 installation pattern already used by the protected runtime.
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('favicon parity requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.FAVICON_PARITY_V115_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function faviconParityAwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.FAVICON_PARITY_V115_INSTALLED=true;
  wholeSiteExperience.FAVICON_PARITY_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={VERSION,META_NAME,COMMISSION_FACTORY_VERIFICATION,IMPACT_SITE_VERIFICATION,ICON_LINKS,stripManagedIconLinks,inject,wrap,install};
