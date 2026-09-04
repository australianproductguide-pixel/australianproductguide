'use strict';

// APG Home National Category Cards presentation repair v131.0.
//
// P0, Home-only presentation containment for the Major Australian Buying Decisions section.
// The underlying semantic section and links remain unchanged. This wrapper attaches a small,
// versioned stylesheet after the Home CSS consolidation layer so the established national-category
// card/grid treatment cannot be lost if the consolidated bundle omits or misapplies those rules.
// No recommendation, evidence, retailer, analytics, structured-data or SEO semantics are changed.

const VERSION='131.0';
const PATH='/assets/home-national-cards-v131.css';
const MARKER=`<link rel="stylesheet" href="${PATH}?v=${VERSION}" data-apg-home-national-cards-repair="v${VERSION}">`;
const HEADER='X-APG-Home-National-Cards-Repair';

function requestPath(req){
  try{return new URL(String(req&&req.url||'/'),'https://australianproductguide.au').pathname;}
  catch{return '/';}
}

function inject(html){
  const source=String(html||'');
  if(!source||source.includes('data-apg-home-national-cards-repair='))return source;
  if(!source.includes('apg-national-v10')||!source.includes('</head>'))return source;
  return source.replace('</head>',MARKER+'</head>');
}

function safeSetHeader(res,name,value){
  if(!res||res.headersSent===true||typeof res.setHeader!=='function')return false;
  try{res.setHeader(name,value);return true;}catch{return false;}
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Home national-card repair requires a downstream handler');
  function handler(req,res){
    const pathname=requestPath(req);
    if(pathname==='/')safeSetHeader(res,HEADER,'v'+VERSION);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      let next=body;
      try{
        const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
        const status=Number(res.statusCode||200);
        if(pathname==='/'&&req&&req.method!=='HEAD'&&status>=200&&status<400&&res.headersSent!==true&&type.startsWith('text/html')&&(typeof body==='string'||Buffer.isBuffer(body))){
          const wasBuffer=Buffer.isBuffer(body);
          const source=wasBuffer?body.toString('utf8'):body;
          const transformed=inject(source);
          if(transformed!==source){
            next=wasBuffer?Buffer.from(transformed,'utf8'):transformed;
            try{res.removeHeader('Content-Length');}catch{}
          }
        }
      }catch{}
      return end(next,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{HOME_NATIONAL_CARDS_REPAIR_VERSION:VERSION});
  return handler;
}

module.exports={VERSION,PATH,MARKER,HEADER,requestPath,inject,safeSetHeader,wrap};
