'use strict';

// APG Footer Navigation v83.
// The footer destinations already use canonical native links. This outer interaction
// layer improves the physical hit targets, removes the two-column mobile pinch point,
// and temporarily clears Scout from the footer interaction area while the footer is
// visible. It does not intercept clicks or replace native browser navigation.
const downstream=require('./trust-centre-authoritative-v82');

const FOOTER_NAVIGATION_VERSION='83.0';
const CSS_PATH='/assets/footer-navigation-v83.css';
const JS_PATH='/assets/footer-navigation-v83.js';

function inject(html){
  let out=String(html||'');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${FOOTER_NAVIGATION_VERSION}"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${FOOTER_NAVIGATION_VERSION}" defer></script></body>`);
  return out;
}

function handler(req,res){
  res.setHeader('X-APG-Footer-Navigation','v'+FOOTER_NAVIGATION_VERSION);
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
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  FOOTER_NAVIGATION_VERSION,
  FOOTER_NAVIGATION_CSS_PATH:CSS_PATH,
  FOOTER_NAVIGATION_JS_PATH:JS_PATH,
  injectFooterNavigation:inject
});

module.exports=handler;
