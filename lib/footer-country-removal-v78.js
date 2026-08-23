'use strict';

// APG Footer Country Selector Removal v78.
// APG is currently an Australia-only consumer product guide, so the footer country
// selector is redundant and can imply unsupported international market switching.
// Remove the control from rendered HTML on every route while preserving the footer
// wordmark, navigation groups, social links, disclosures and all underlying behaviour.
const downstream=require('./navigation-blue-interactions-v77');

const FOOTER_COUNTRY_REMOVAL_VERSION='78.0';

function stripFooterCountrySelector(html){
  return String(html||'').replace(
    /<div\b(?=[^>]*\bclass=(['"])[^'"]*\bfooter-v11-country\b[^'"]*\1)[^>]*>[\s\S]*?<\/div>/i,
    ''
  );
}

function transform(html,pathOrUrl){
  const base=downstream.transform
    ? downstream.transform(String(html||''),pathOrUrl)
    : String(html||'');
  return stripFooterCountrySelector(base);
}

function handler(req,res){
  res.setHeader('X-APG-Footer-Country-Removal','v'+FOOTER_COUNTRY_REMOVAL_VERSION);

  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=stripFooterCountrySelector(original);
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
  FOOTER_COUNTRY_REMOVAL_VERSION,
  stripFooterCountrySelector,
  transform
});

module.exports=handler;
