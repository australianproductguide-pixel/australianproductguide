'use strict';

// APG final presentation response stability v131.0.
//
// This layer preserves the established desktop Home/header and About & trust presentation assets,
// but moves their response headers before downstream rendering and refuses to transform a body
// after headers have committed. Presentation exceptions fail closed to the unchanged downstream
// response. Product evidence, recommendations, retailer weighting, privacy, canonicals, structured
// data and customer decision state are untouched.
const desktopHomeHeader=require('./desktop-home-header-v126-runtime');
const desktopAboutTrustContrast=require('./desktop-about-trust-contrast-v127-runtime');

const VERSION='131.0';
const HEADER_NAME='X-APG-Final-Presentation-Stability';
const FALLBACK_HEADER='X-APG-Final-Presentation-Fallback';
const HOME_HEADER_NAME='X-APG-Desktop-Home-Header';
const TRUST_HEADER_NAME='X-APG-Desktop-About-Trust-Contrast';
const ORIGIN='https://australianproductguide.au';

function requestPath(req){
  try{return new URL(req&&req.url||'/',ORIGIN).pathname;}
  catch{return '/';}
}
function safeSetHeader(res,name,value){
  if(!res||res.headersSent===true||typeof res.setHeader!=='function')return false;
  try{res.setHeader(name,value);return true;}catch{return false;}
}
function safeRemoveHeader(res,name){
  if(!res||res.headersSent===true||typeof res.removeHeader!=='function')return false;
  try{res.removeHeader(name);return true;}catch{return false;}
}
function fallbackLog(layer,error,pathname){
  const name=error&&error.name?String(error.name):'Error';
  const message=error&&error.message?String(error.message).slice(0,500):'presentation transform failed';
  try{
    console.error('APG_FINAL_PRESENTATION_FALLBACK',JSON.stringify({version:VERSION,layer,pathname,name,message}));
  }catch{
    console.error('APG_FINAL_PRESENTATION_FALLBACK');
  }
}
function sendAsset(req,res,{type,body,layerHeader,layerVersion}){
  res.statusCode=200;
  safeSetHeader(res,'Content-Type',type);
  safeSetHeader(res,'Cache-Control','public, max-age=0, must-revalidate');
  safeSetHeader(res,'X-Content-Type-Options','nosniff');
  safeSetHeader(res,layerHeader,'v'+layerVersion);
  safeSetHeader(res,HEADER_NAME,'v'+VERSION);
  return res.end(req&&req.method==='HEAD'?'':body);
}
function wrapPresentationLayer(downstream,{name,headerName,headerVersion,transform,assets}){
  if(typeof downstream!=='function')throw new TypeError(`${name} requires a downstream handler`);
  if(typeof transform!=='function')throw new TypeError(`${name} requires a transform function`);
  const assetMap=new Map((assets||[]).map(asset=>[asset.path,asset]));

  function handler(req,res){
    const pathname=requestPath(req);
    const asset=assetMap.get(pathname);
    if(asset){
      return sendAsset(req,res,{
        type:asset.type,
        body:asset.body,
        layerHeader:headerName,
        layerVersion:headerVersion
      });
    }

    // Set all invariant headers before the underlying render can commit a streamed response.
    safeSetHeader(res,headerName,'v'+headerVersion);
    safeSetHeader(res,HEADER_NAME,'v'+VERSION);

    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const originalBody=body;
      let nextBody=body;
      try{
        const status=Number(res.statusCode||200);
        const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
        const textual=typeof nextBody==='string'||Buffer.isBuffer(nextBody);
        const headersMutable=res.headersSent!==true;
        if(headersMutable&&req&&req.method!=='HEAD'&&textual&&status>=200&&status<500&&type.startsWith('text/html')){
          const wasBuffer=Buffer.isBuffer(nextBody);
          const source=wasBuffer?nextBody.toString('utf8'):nextBody;
          const transformed=transform(source);
          if(transformed!==source){
            nextBody=wasBuffer?Buffer.from(transformed,'utf8'):transformed;
            safeRemoveHeader(res,'Content-Length');
          }
        }
      }catch(error){
        nextBody=originalBody;
        safeSetHeader(res,FALLBACK_HEADER,'v'+VERSION);
        fallbackLog(name,error,pathname);
      }
      return end(nextBody,...args);
    };
    return downstream(req,res);
  }

  Object.assign(handler,downstream,{
    FINAL_PRESENTATION_STABILITY_VERSION:VERSION,
    FINAL_PRESENTATION_LAYER:name
  });
  return handler;
}
function wrapDesktopHome(downstream){
  const handler=wrapPresentationLayer(downstream,{
    name:'desktop-home-header',
    headerName:HOME_HEADER_NAME,
    headerVersion:desktopHomeHeader.VERSION,
    transform:desktopHomeHeader.transformHtml,
    assets:[
      {path:desktopHomeHeader.CSS_PATH,type:'text/css; charset=utf-8',body:desktopHomeHeader.css},
      {path:desktopHomeHeader.JS_PATH,type:'application/javascript; charset=utf-8',body:desktopHomeHeader.clientJs}
    ]
  });
  Object.assign(handler,{
    DESKTOP_HOME_HEADER_VERSION:desktopHomeHeader.VERSION,
    DESKTOP_HOME_HEADER_CSS_PATH:desktopHomeHeader.CSS_PATH,
    DESKTOP_HOME_HEADER_JS_PATH:desktopHomeHeader.JS_PATH
  });
  return handler;
}
function wrapDesktopTrust(downstream){
  const handler=wrapPresentationLayer(downstream,{
    name:'desktop-about-trust-contrast',
    headerName:TRUST_HEADER_NAME,
    headerVersion:desktopAboutTrustContrast.VERSION,
    transform:desktopAboutTrustContrast.transformHtml,
    assets:[
      {path:desktopAboutTrustContrast.CSS_PATH,type:'text/css; charset=utf-8',body:desktopAboutTrustContrast.css}
    ]
  });
  Object.assign(handler,{
    DESKTOP_ABOUT_TRUST_CONTRAST_VERSION:desktopAboutTrustContrast.VERSION,
    DESKTOP_ABOUT_TRUST_CONTRAST_CSS_PATH:desktopAboutTrustContrast.CSS_PATH
  });
  return handler;
}
function wrap(downstream){
  return wrapDesktopTrust(wrapDesktopHome(downstream));
}

module.exports={
  VERSION,HEADER_NAME,FALLBACK_HEADER,HOME_HEADER_NAME,TRUST_HEADER_NAME,ORIGIN,
  requestPath,safeSetHeader,safeRemoveHeader,fallbackLog,sendAsset,wrapPresentationLayer,
  wrapDesktopHome,wrapDesktopTrust,wrap,
  desktopHomeHeader,desktopAboutTrustContrast
};
