'use strict';

// APG Search Brand Identity v59
// Outermost public-response layer for crawler/browser brand identity only.
// SEO Optimisation v58 remains authoritative underneath it.
const downstream=require('./seo-optimisation-v58-runtime');

const BRAND_IDENTITY_VERSION='59.0';
const ORIGIN='https://australianproductguide.au';
const FAVICON='/favicon.svg';
const BRAND_MARK='/assets/apg-brand-mark.svg';
const MANIFEST='/site.webmanifest';

function stripLegacyIdentityLinks(html){
  return String(html||'')
    .replace(/<link\b(?=[^>]*\brel=["'][^"']*(?:shortcut\s+icon|icon|manifest)[^"']*["'])[^>]*>/gi,'');
}
function patchOrganisationLogo(html){
  const target=`${ORIGIN}${BRAND_MARK}`;
  return String(html||'').replace(
    /"logo"\s*:\s*"https:\/\/[^"/]+\/assets\/logo\.svg"/g,
    `"logo":{"@type":"ImageObject","url":"${target}","width":192,"height":192}`
  );
}
function injectIdentity(html){
  let out=String(html||'');
  if(!/<head[\s>]/i.test(out))return out;
  out=stripLegacyIdentityLinks(out);
  out=patchOrganisationLogo(out);
  const tags=[
    `<link rel="icon" type="image/svg+xml" sizes="any" href="${FAVICON}">`,
    `<link rel="manifest" href="${MANIFEST}">`
  ].join('');
  return out.replace('</head>',tags+'</head>');
}
function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path==='/favicon.ico'){
    res.statusCode=308;
    res.setHeader('Location',FAVICON);
    res.setHeader('Cache-Control','public, max-age=86400');
    return res.end();
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=injectIdentity(body);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

// Preserve every established downstream runtime contract (including Search v52
// VERSION/PATCH fields) and add brand identity metadata without overwriting them.
Object.assign(handler,downstream,{BRAND_IDENTITY_VERSION,ORIGIN,FAVICON,BRAND_MARK,MANIFEST,stripLegacyIdentityLinks,patchOrganisationLogo,injectIdentity,downstream});
module.exports=handler;
