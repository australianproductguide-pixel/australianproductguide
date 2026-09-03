'use strict';

// APG Desktop About & Trust Contrast Repair v127.0.
// Presentation-only desktop safeguard. Header Navigation v118 intentionally applies white
// text to top-level primary-nav links, but that broad rule also wins inside the light About
// & trust popover. This layer restores explicit contrast only for the desktop popover and
// its trigger states; mobile navigation is unchanged.
const VERSION='127.0';
const CSS_PATH='/assets/desktop-about-trust-contrast-v127.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out||out.includes('name="apg-desktop-about-trust-contrast"'))return out;
  return out.replace('</head>',`<meta name="apg-desktop-about-trust-contrast" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
}

function transformHtml(html){return injectAssets(html);}

const css=String.raw`
/* APG Desktop About & Trust Contrast Repair v127.0 */
@media(min-width:921px){
  .site-header .primary-nav .apg-about-trust-menu[open]>summary,
  .site-header .primary-nav .apg-about-trust-menu>summary:hover,
  .site-header .primary-nav .apg-about-trust-menu>summary:focus-visible{
    color:#1d4ed8!important;
    -webkit-text-fill-color:#1d4ed8!important;
  }

  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-column a,
  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-column a:visited{
    color:#1e3a52!important;
    -webkit-text-fill-color:#1e3a52!important;
    opacity:1!important;
    visibility:visible!important;
  }

  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-column a>span{
    color:inherit!important;
    -webkit-text-fill-color:currentColor!important;
    opacity:1!important;
    visibility:visible!important;
  }

  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-column a:hover,
  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-column a:focus-visible{
    color:#1d4ed8!important;
    -webkit-text-fill-color:#1d4ed8!important;
  }

  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-contact-link,
  .site-header .primary-nav .apg-about-trust-popover .apg-about-trust-contact-link:visited{
    color:#1d4ed8!important;
    -webkit-text-fill-color:#1d4ed8!important;
  }
}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Desktop-About-Trust-Contrast','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('desktop About & trust contrast repair requires downstream handler');
  function handler(req,res){
    let path='';
    try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body);
        const source=wasBuffer?body.toString('utf8'):body;
        const next=transformHtml(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length');}catch{}}
      }
      res.setHeader('X-APG-Desktop-About-Trust-Contrast','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    DESKTOP_ABOUT_TRUST_CONTRAST_VERSION:VERSION,
    DESKTOP_ABOUT_TRUST_CONTRAST_CSS_PATH:CSS_PATH
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,css,injectAssets,transformHtml,wrap};
