'use strict';

// APG Favicon Parity v115.0
// Narrow presentation-metadata layer only. It preserves the approved APG favicon.svg
// artwork and standardises browser, Google Search, iOS and PWA discovery references.
// It does not score, rank, recommend, persist shopper state, change retailer weighting,
// alter account/Auth/privacy behaviour or modify commercial logic.
const VERSION='115.0';
const META_NAME='apg-favicon-parity';

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
  let out=stripManagedIconLinks(html);
  if(!out||!/<\/head>/i.test(out))return out;
  const marker=`<meta name="${META_NAME}" content="v${VERSION}">`;
  if(out.includes(`name="${META_NAME}"`))return out;
  return out.replace(/<\/head>/i,`${marker}${ICON_LINKS}</head>`);
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

module.exports={VERSION,META_NAME,ICON_LINKS,stripManagedIconLinks,inject,wrap};
