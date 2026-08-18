const upstream=require('./amazon-conversion-v29');

const VERSION='30';
const BLUE='#2563EB';
const BLUE_LIGHT='#38A4F3';
const BLUE_DEEP='#315FD8';
const NAVY='#0F172A';

const markShapes=`<path d="M8 31 24 6h10L19 31H8Z" fill="${BLUE}"/><path d="M34 6h10l16 25H49L29 6h5Z" fill="${BLUE_LIGHT}"/><path d="M5 36h19l-8 15H0l5-15Z" fill="${BLUE_DEEP}"/><path d="M48 36h19l6 15H40l8-15Z" fill="#1E56C8"/><path d="m23 51 11-19 11 19H23Z" fill="${NAVY}"/>`;

function markSvg({title=false,mono=false,dark=false}={}){
  const shapes=mono
    ? '<path d="M8 31 24 6h10L19 31H8ZM34 6h10l16 25H49L29 6h5ZM5 36h19l-8 15H0l5-15ZM48 36h19l6 15H40l8-15Zm-25 15 11-19 11 19H23Z" fill="currentColor"/>'
    : markShapes;
  return `<svg class="apg-brand-v30-svg" viewBox="0 0 73 58" role="img"${title?' aria-labelledby="apgBrandV30Title"':' aria-hidden="true"'}>${title?'<title id="apgBrandV30Title">Australian Product Guide</title>':''}${dark?'<rect width="73" height="58" rx="14" fill="#0F172A"/>':''}<g${dark?' transform="translate(5 5) scale(.86)"':''}>${shapes}</g></svg>`;
}

function lockup(context='header'){
  return `<span class="apg-brand-v30-lockup is-${context}"><span class="apg-brand-v30-mark">${markSvg()}</span><span class="apg-brand-v30-type"><span class="apg-brand-v30-name">Australian</span><span class="apg-brand-v30-product">Product Guide</span></span><span class="apg-brand-v30-monogram" aria-hidden="true">APG</span></span>`;
}

function scoutMarkSvg(){
  return `<svg class="apg-brand-v30-scout" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#EFF5FF"/><g transform="translate(8 12) scale(.66)">${markShapes}</g></svg>`;
}

const logoSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 58" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title>${markShapes}</svg>`;
const logoDarkSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 58" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><rect width="73" height="58" rx="14" fill="#0F172A"/><g transform="translate(5 5) scale(.86)">${markShapes}</g></svg>`;
const logoMonoSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73 58" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><path d="M8 31 24 6h10L19 31H8ZM34 6h10l16 25H49L29 6h5ZM5 36h19l-8 15H0l5-15ZM48 36h19l6 15H40l8-15Zm-25 15 11-19 11 19H23Z" fill="#111827"/></svg>`;
const faviconSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><rect x="2" y="2" width="60" height="60" rx="16" fill="#0F172A"/><g transform="translate(8 10) scale(.65)">${markShapes}</g></svg>`;
const socialSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t d"><title id="t">Australian Product Guide</title><desc id="d">Find the right product. Make the right decision.</desc><defs><linearGradient id="panel" x1="80" y1="80" x2="1120" y2="560" gradientUnits="userSpaceOnUse"><stop stop-color="#0F172A"/><stop offset="1" stop-color="#122A52"/></linearGradient><linearGradient id="accent" x1="0" x2="1"><stop stop-color="#2563EB"/><stop offset="1" stop-color="#38A4F3"/></linearGradient></defs><rect width="1200" height="630" fill="#F8FAFC"/><rect x="44" y="44" width="1112" height="542" rx="42" fill="url(#panel)"/><g transform="translate(92 92) scale(2.05)">${markShapes}</g><text x="92" y="320" font-family="Inter,Arial,sans-serif" font-size="72" font-weight="800" letter-spacing="-2.6" fill="#FFFFFF">Australian</text><text x="92" y="390" font-family="Inter,Arial,sans-serif" font-size="64" font-weight="780" letter-spacing="-2" fill="#78A7FF">Product Guide</text><text x="92" y="474" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="650" fill="#E2E8F0">Find the right product. Make the right decision.</text><rect x="92" y="516" width="315" height="8" rx="4" fill="url(#accent)"/></svg>`;

const css=`
:root{--apg-brand-blue:#2563EB;--apg-brand-blue-light:#38A4F3;--apg-brand-navy:#0F172A;--apg-brand-mist:#EFF5FF}
.apg-brand-v30-lockup{display:inline-flex;align-items:center;gap:.7rem;min-width:0;vertical-align:middle}
.apg-brand-v30-mark{display:inline-flex;width:46px;height:38px;flex:0 0 auto}
.apg-brand-v30-svg{display:block;width:100%;height:100%}
.apg-brand-v30-type{display:flex;flex-direction:column;justify-content:center;line-height:.9;letter-spacing:-.035em;white-space:nowrap}
.apg-brand-v30-name{font-size:1.16rem;font-weight:820;color:var(--apg-brand-navy)}
.apg-brand-v30-product{margin-top:.23rem;font-size:1.03rem;font-weight:780;color:var(--apg-brand-blue)}
.apg-brand-v30-monogram{display:none;font-size:1.18rem;font-weight:850;letter-spacing:-.055em;color:var(--apg-brand-navy)}
.site-header .brand{display:inline-flex;align-items:center;min-width:0;max-width:275px;text-decoration:none}
.site-header .brand:focus-visible{outline:3px solid #93C5FD;outline-offset:5px;border-radius:8px}
.footer-v11-wordmark{display:inline-flex;align-items:center;text-decoration:none}
.footer-v11-wordmark .apg-brand-v30-lockup{gap:.62rem}
.footer-v11-wordmark .apg-brand-v30-mark{width:42px;height:34px}
.footer-v11-wordmark .apg-brand-v30-name{color:inherit;font-size:1.08rem}
.footer-v11-wordmark .apg-brand-v30-product{color:#8BB2FF;font-size:.96rem}
.apg-assistant-launcher-icon .apg-brand-v30-scout,.apg-assistant-avatar .apg-brand-v30-scout{display:block;width:100%;height:100%}
@media(max-width:1180px){.apg-brand-v30-lockup{gap:.55rem}.apg-brand-v30-mark{width:40px;height:34px}.apg-brand-v30-name{font-size:1.03rem}.apg-brand-v30-product{font-size:.92rem}}
@media(max-width:760px){.site-header .brand{max-width:108px}.apg-brand-v30-lockup{gap:.38rem}.apg-brand-v30-mark{width:35px;height:29px}.apg-brand-v30-type{display:none}.apg-brand-v30-monogram{display:inline-block}.footer-v11-wordmark .apg-brand-v30-type{display:flex}.footer-v11-wordmark .apg-brand-v30-monogram{display:none}}
@media(max-width:380px){.site-header .brand{max-width:42px}.site-header .brand .apg-brand-v30-monogram{display:none}}
`;

function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}

function injectBrand(html){
  let body=String(html||'');
  if(body.includes('data-brand-v30="true"'))return body;
  body=body.replace(/<span class="v7-logo-lockup[^"]*">[\s\S]*?<\/span><\/span>/g,lockup('header'));
  body=body.replace(/(<a class="footer-v11-wordmark"[^>]*>)[\s\S]*?(<\/a>)/g,(_,open,close)=>`${open}${lockup('footer')}${close}`);
  body=body.replace(/(<span class="apg-assistant-launcher-icon"[^>]*>)[\s\S]*?(<\/span>)/g,(_,open,close)=>`${open}${scoutMarkSvg()}${close}`);
  body=body.replace(/(<span class="apg-assistant-avatar"[^>]*>)[\s\S]*?(<\/span>)/g,(_,open,close)=>`${open}${scoutMarkSvg()}${close}`);
  body=body.replace(/<meta name="theme-color" content="#[0-9A-Fa-f]{6}">/i,'<meta name="theme-color" content="#0F172A">');
  body=body.replace(/<link rel="icon" href="\/assets\/logo\.svg[^"]*" type="image\/svg\+xml">/i,`<link rel="icon" href="/assets/favicon.svg?v=${VERSION}" type="image/svg+xml">`);
  body=body.replace(/<body\b([^>]*)>/i,'<body data-brand-v30="true"$1>');
  if(!body.includes('/assets/premium-brand-v30.css'))body=body.replace('</head>',`<link rel="stylesheet" href="/assets/premium-brand-v30.css?v=${VERSION}"></head>`);
  return body;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
  if(path==='/assets/logo.svg')return send(res,req,logoSvg,'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-dark.svg')return send(res,req,logoDarkSvg,'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-mono.svg')return send(res,req,logoMonoSvg,'image/svg+xml; charset=utf-8');
  if(path==='/assets/favicon.svg'||path==='/assets/app-icon.svg')return send(res,req,faviconSvg,'image/svg+xml; charset=utf-8');
  if(path==='/assets/social.svg')return send(res,req,socialSvg,'image/svg+xml; charset=utf-8');
  if(path==='/assets/premium-brand-v30.css')return send(res,req,css,'text/css; charset=utf-8');

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=injectBrand(body);
    return originalEnd(body,...args);
  };
  return upstream(req,res);
};

module.exports.injectBrand=injectBrand;
module.exports.lockup=lockup;
module.exports.logoSvg=logoSvg;
module.exports.logoDarkSvg=logoDarkSvg;
module.exports.logoMonoSvg=logoMonoSvg;
module.exports.faviconSvg=faviconSvg;
module.exports.socialSvg=socialSvg;
module.exports.css=css;
