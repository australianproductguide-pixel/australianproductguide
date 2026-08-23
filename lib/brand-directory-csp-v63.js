'use strict';

// APG Brand Directory CSP v63
// Loads the brand-directory presentation from a same-origin stylesheet so APG's
// Production Content Security Policy can remain strict (`style-src 'self'`).
// v62 historically injected the same presentation through an inline <style> block;
// this boundary removes that superseded block before delivering any brand route.
const downstream=require('./brand-index-logos-v62');

const BRAND_DIRECTORY_CSP_VERSION='63.0';
const ORIGIN='https://australianproductguide.au';
const STYLESHEET='/assets/brand-directory-v63.css?v=63.0';
const LEGACY_INLINE_STYLE_RE=/<style\b[^>]*\bid=["']apg-brand-index-logos-v62["'][^>]*>[\s\S]*?<\/style>/gi;

function isBrandRoute(path){
  return path==='/brands/'||(/^\/brands\/[^/]+\/$/i.test(path));
}

function removeLegacyInlineBrandStyles(html){
  return String(html||'').replace(LEGACY_INLINE_STYLE_RE,'');
}

function injectBrandDirectoryStylesheet(html,path){
  let out=String(html||'');
  if(!isBrandRoute(path))return out;
  out=removeLegacyInlineBrandStyles(out);
  if(out.includes('brand-directory-v63.css'))return out;
  return out.replace('</head>',`<link rel="stylesheet" href="${STYLESHEET}"><meta name="apg-brand-directory-csp" content="v${BRAND_DIRECTORY_CSP_VERSION}"></head>`);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Brand-Directory-CSP','v'+BRAND_DIRECTORY_CSP_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=injectBrandDirectoryStylesheet(original,path);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_DIRECTORY_CSP_VERSION,
  BRAND_DIRECTORY_STYLESHEET:STYLESHEET,
  removeLegacyInlineBrandStyles,
  injectBrandDirectoryStylesheet
});
module.exports=handler;
