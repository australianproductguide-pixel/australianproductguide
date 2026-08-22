'use strict';

// APG Brand Mark Device Parity v66.1
// Ensures desktop and mobile receive the same current brand-mark asset generation.
// Previous brand-mark markup used stable URLs while the resolver evolved through
// v62/v65/v66, so a browser could legitimately retain an older cached asset at the
// same URL. This layer versions every governed brand-mark request in rendered HTML.
const downstream=require('./brand-mark-curated-v66');

const BRAND_MARK_DEVICE_PARITY_VERSION='66.1';
const BRAND_MARK_ASSET_VERSION='66.1';

function versionBrandMarkUrls(html){
  return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${BRAND_MARK_ASSET_VERSION}`);
}

function injectParityMeta(html){
  const out=String(html||'');
  if(out.includes('name="apg-brand-mark-device-parity"'))return out;
  return out.replace('</head>',`<meta name="apg-brand-mark-device-parity" content="v${BRAND_MARK_DEVICE_PARITY_VERSION}"></head>`);
}

function handler(req,res){
  res.setHeader('X-APG-Brand-Mark-Device-Parity','v'+BRAND_MARK_DEVICE_PARITY_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      let next=versionBrandMarkUrls(body);
      next=injectParityMeta(next);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_MARK_DEVICE_PARITY_VERSION,
  BRAND_MARK_ASSET_VERSION,
  versionBrandMarkUrls,
  injectBrandMarkDeviceParityMeta:injectParityMeta
});
module.exports=handler;
