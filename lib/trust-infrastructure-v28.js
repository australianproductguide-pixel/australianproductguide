// APG Trust Infrastructure v28.
// Extends v27 with reversible application-side password hardening and truthful
// readiness reporting for imagery, organic search evidence and visual QA.
const {Readable}=require('stream');
const app=require('./evidence-commerce-depth-v27');
const observability=require('./intelligence-observability-v27');

const VERSION='trust-infrastructure-v28';
const CHECKED='2026-08-18';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const NEW_PASSWORD_MIN=12;
const JS='<script src="/assets/trust-infrastructure-v28.js?v=28" defer></script>';

function urlOf(raw){try{return new URL(raw||'/',PRIMARY_ORIGIN)}catch{return new URL('/',PRIMARY_ORIGIN)}}
function isNewPasswordRoute(path,method='POST'){
  return String(method).toUpperCase()==='POST'&&['/api/account/signup','/api/account/password'].includes(path);
}
function passwordPolicyError(body){
  const password=body&&typeof body.password==='string'?body.password:'';
  return password&&password.length<NEW_PASSWORD_MIN?`Use at least ${NEW_PASSWORD_MIN} characters for a new password.`:null;
}
function readRaw(req,limit=250000){
  return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>limit){reject(new Error('Request too large'));req.destroy();}});req.on('end',()=>resolve(body));req.on('error',reject);});
}
function replayRequest(req,raw){
  const replay=Readable.from(raw?[Buffer.from(raw)]:[]);
  replay.method=req.method;replay.url=req.url;replay.headers=req.headers||{};
  replay.httpVersion=req.httpVersion;replay.socket=req.socket;replay.connection=req.connection;
  return replay;
}
function sendJson(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Trust',VERSION);
  return res.end(JSON.stringify(payload));
}
function trustReadiness(){
  const imagery=observability.imagerySnapshot();
  const retailers=observability.retailerSnapshot();
  const creatorsCredentialsConfigured=Boolean(process.env.AMAZON_CREATORS_CLIENT_ID&&process.env.AMAZON_CREATORS_CLIENT_SECRET);
  return {
    version:VERSION,
    checkedAt:CHECKED,
    passwordPolicy:{
      newPasswordMinLength:NEW_PASSWORD_MIN,
      existingPasswordLoginCompatible:true,
      appliesTo:['account creation','password recovery/update'],
      hostedCompromisedPasswordProtection:'external-admin-control-current-security-advisor-warning'
    },
    imagery:{
      authorisedIntegrationTarget:'Amazon Creators API',
      marketplace:'www.amazon.com.au',
      exactAmazonIdentityReady:imagery.acquisition.exactAmazonIdentityReady,
      creatorsApiCredentialsConfigured,
      verifiedImageMappings:imagery.verified,
      invalidImageMappings:imagery.invalid,
      automaticPublication:false,
      publicationRule:'Creators API output is only an acquisition input. Exact ASIN/product match, current Associates rights basis and canonical image-registry validation are required before publication.'
    },
    retailers:{
      exactOfferCount:retailers.exactOfferCount,
      productsWithExactOffers:retailers.productsWithExactOffers,
      independentRetailerOfferCount:retailers.independentRetailerOfferCount,
      recommendationWeight:0
    },
    organic:{
      technicalControls:{robots:true,sitemap:true,canonicalUrls:true,structuredData:true,myApgNoindex:true},
      technicalRuntimeCheckedAt:CHECKED,
      searchConsoleConnected:false,
      currentClicks:null,
      currentImpressions:null,
      currentIndexedPageCount:null,
      currentRankings:null,
      status:'Google organic performance remains unverified until connected Search Console property data is available.'
    },
    visualCertification:{
      workflow:'APG Evidence Commerce v27 Production Visual',
      commitStatusContext:'APG v27 Visual Certification',
      retrievableCommitStatus:'configured-on-main-push',
      status:'Check the exact main commit status; do not infer success from workflow presence.'
    }
  };
}
function enhance(html,pathOrUrl){
  let out=String(html||'');
  if(!/^<!doctype html>/i.test(out)&&!/<html[\s>]/i.test(out))return out;
  if(!out.includes('trust-infrastructure-v28.js'))out=out.replace('</body>',JS+'</body>');
  if(!out.includes('data-trust-v28="true"'))out=out.replace(/<body([^>]*)>/i,(m,a)=>`<body${a} data-trust-v28="true">`);
  return out;
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return enhance(base,pathOrUrl);
}

module.exports=async(req,res)=>{
  const url=urlOf(req.url),path=url.pathname;
  res.setHeader('X-APG-Trust',VERSION);

  if(['/api/intelligence/trust-readiness','/api/intelligence/trust-readiness/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    const data=trustReadiness();
    if(req.method==='HEAD'){
      res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end('');
    }
    return sendJson(res,200,data);
  }

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=enhance(body,url.href);
    res.setHeader('X-APG-Trust',VERSION);
    return originalEnd(body,...args);
  };

  if(isNewPasswordRoute(path,req.method)){
    let raw='';
    try{raw=await readRaw(req);}catch(err){return sendJson(res,413,{error:err.message||'Request too large'});}
    let parsed=null;try{parsed=raw?JSON.parse(raw):{};}catch{}
    const error=passwordPolicyError(parsed);
    if(error)return sendJson(res,400,{error});
    return app(replayRequest(req,raw),res);
  }

  return app(req,res);
};

module.exports.VERSION=VERSION;
module.exports.CHECKED=CHECKED;
module.exports.NEW_PASSWORD_MIN=NEW_PASSWORD_MIN;
module.exports.isNewPasswordRoute=isNewPasswordRoute;
module.exports.passwordPolicyError=passwordPolicyError;
module.exports.trustReadiness=trustReadiness;
module.exports.enhance=enhance;
module.exports.transform=transform;
