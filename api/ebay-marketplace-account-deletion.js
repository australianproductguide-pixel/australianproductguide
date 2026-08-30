'use strict';

const crypto=require('crypto');

const ENDPOINT_URL='https://australianproductguide.au/api/ebay-marketplace-account-deletion';
const TOKEN_ENV='EBAY_MARKETPLACE_DELETION_VERIFICATION_TOKEN';

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.end(JSON.stringify(payload));
}

function configuredToken(){
  return String(process.env[TOKEN_ENV]||'').trim();
}

function isValidToken(token){
  return /^[A-Za-z0-9_-]{32,80}$/.test(token);
}

function challengeResponse(challengeCode,token){
  return crypto.createHash('sha256')
    .update(String(challengeCode)+String(token)+ENDPOINT_URL,'utf8')
    .digest('hex');
}

module.exports=async function handler(req,res){
  const method=String(req.method||'GET').toUpperCase();
  const token=configuredToken();

  if(!isValidToken(token)){
    return json(res,503,{ok:false,error:'EBAY_MARKETPLACE_DELETION_NOT_CONFIGURED'});
  }

  if(method==='GET'){
    const challengeCode=String((req.query&&req.query.challenge_code)||'').trim();
    if(!challengeCode){
      return json(res,400,{ok:false,error:'MISSING_CHALLENGE_CODE'});
    }
    return json(res,200,{challengeResponse:challengeResponse(challengeCode,token)});
  }

  if(method==='POST'){
    // eBay requires a timely acknowledgement. APG does not intentionally persist
    // eBay marketplace user PII as part of its product-discovery integration.
    // Do not log or echo the incoming payload, which may contain user identifiers.
    return json(res,200,{ok:true,acknowledged:true});
  }

  res.setHeader('Allow','GET, POST');
  return json(res,405,{ok:false,error:'METHOD_NOT_ALLOWED'});
};
