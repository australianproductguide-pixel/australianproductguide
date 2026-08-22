'use strict';

// APG Brand Directory CSP v63
// Loads the brand-directory presentation from a same-origin stylesheet so APG's
// Production Content Security Policy can remain strict (`style-src 'self'`).
const downstream=require('./brand-index-logos-v62');

const BRAND_DIRECTORY_CSP_VERSION='63.0';
const ORIGIN='https://australianproductguide.au';
const STYLESHEET='/assets/brand-directory-v63.css?v=63.0';

function isBrandRoute(path){
  return path==='/brands/'||(/^\/brands\/[^/]+\/$/i.test(path));
}

function injectBrandDirectoryStylesheet(html,path){
  let out=String(html||'');
  if(!isBrandRoute(path)||out.includes('brand-directory-v63.css'))return out;
  return out.replace('</head>',`<link rel="stylesheet" href="${STYLESHEET}"><meta name="apg-brand-directory-csp" content="v${BRAND_DIRECTORY_CSP_VERSION}"></head>`);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Brand-Directory-CSP','v'+BRAND_DIRECTORY_CSP_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=injectBrandDirectoryStylesheet(body,path);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{BRAND_DIRECTORY_CSP_VERSION,BRAND_DIRECTORY_STYLESHEET:STYLESHEET,injectBrandDirectoryStylesheet});
module.exports=handler;
