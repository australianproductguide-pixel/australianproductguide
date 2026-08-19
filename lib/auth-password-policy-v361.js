// Australian Product Guide auth password policy v36.1.
// Adds a no-cost compensating control while Supabase leaked-password protection remains
// unavailable on the current Free plan. Existing sign-in compatibility is preserved:
// the stronger policy applies only to new accounts and password changes.
const {Readable}=require('stream');
const upstream=require('./brand-conformity-v352');

const VERSION='36.1';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const PRIMARY_HOST='australianproductguide.au';
const PASSWORD_RULE_MESSAGE='Use at least 12 characters, including uppercase, lowercase, a number and a symbol.';
const PASSWORD_PATTERN='(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,200}';

function passwordPolicy(password){
  const value=String(password||'');
  return {
    ok:value.length>=12&&value.length<=200&&/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/[0-9]/.test(value)&&/[^A-Za-z0-9]/.test(value),
    value
  };
}
function requestHost(req){
  const forwarded=String(req.headers?.['x-forwarded-host']||'').split(',')[0].trim();
  const raw=(forwarded||String(req.headers?.host||'')).trim().toLowerCase();
  return raw.replace(/:\d+$/,'');
}
function originAllowed(req){
  const origin=String(req.headers?.origin||'');
  if(!origin||origin===PRIMARY_ORIGIN)return true;
  // Canonical Production must never depend on an optional platform environment flag
  // for its same-origin account mutation boundary.
  if(requestHost(req)===PRIMARY_HOST)return false;
  return process.env.VERCEL_ENV!=='production';
}
function sendJson(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(JSON.stringify(payload));
}
async function readRaw(req,limit=250000){
  return new Promise((resolve,reject)=>{
    let raw='';
    req.on('data',chunk=>{
      raw+=chunk;
      if(raw.length>limit){reject(new Error('Request too large'));req.destroy();}
    });
    req.on('end',()=>resolve(raw));
    req.on('error',reject);
  });
}
function replayRequest(req,raw){
  const clone=new Readable({read(){this.push(raw);this.push(null);}});
  clone.method=req.method;
  clone.url=req.url;
  clone.headers=req.headers;
  if(req.query!==undefined)clone.query=req.query;
  if(req.cookies!==undefined)clone.cookies=req.cookies;
  return clone;
}
function strengthenAccountAsset(js){
  let out=String(js||'');
  const loginPassword='<label>Password<input type="password" name="password" autocomplete="current-password" minlength="8" required></label>';
  const strongerLoginPassword='<label>Password<input type="password" name="password" autocomplete="current-password" minlength="8" required aria-describedby="apgPasswordPolicy"><small id="apgPasswordPolicy" data-password-policy hidden>New accounts require 12+ characters with uppercase, lowercase, a number and a symbol.</small></label>';
  const recoveryPassword='<label>New password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label>';
  const strongerRecoveryPassword=`<label>New password<input type="password" name="password" autocomplete="new-password" minlength="12" maxlength="200" pattern="${PASSWORD_PATTERN}" title="${PASSWORD_RULE_MESSAGE}" required><small>${PASSWORD_RULE_MESSAGE}</small></label>`;
  const oldTab="q('[data-account-form] input[name=password]',root).autocomplete=mode==='signup'?'new-password':'current-password';";
  const newTab=`const passwordInput=q('[data-account-form] input[name=password]',root);if(passwordInput){passwordInput.autocomplete=mode==='signup'?'new-password':'current-password';if(mode==='signup'){passwordInput.minLength=12;passwordInput.maxLength=200;passwordInput.pattern='${PASSWORD_PATTERN}';passwordInput.title='${PASSWORD_RULE_MESSAGE}';}else{passwordInput.minLength=8;passwordInput.removeAttribute('maxlength');passwordInput.removeAttribute('pattern');passwordInput.removeAttribute('title');}}const passwordPolicy=q('[data-password-policy]',root);if(passwordPolicy)passwordPolicy.hidden=mode!=='signup';`;
  out=out.replace(loginPassword,strongerLoginPassword).replace(recoveryPassword,strongerRecoveryPassword).replace(oldTab,newTab);
  return out;
}

async function handler(req,res){
  let path='';
  try{path=new URL(req.url,PRIMARY_ORIGIN).pathname}catch{}
  const accountMutation=req.method!=='GET'&&req.method!=='HEAD'&&path.startsWith('/api/account/');
  if(accountMutation&&!originAllowed(req))return sendJson(res,403,{error:'Request origin not allowed.'});

  const target=req.method==='POST'&&(path==='/api/account/signup'||path==='/api/account/password');
  if(target){
    try{
      const raw=await readRaw(req);
      let body={};
      try{body=raw?JSON.parse(raw):{};}catch{return sendJson(res,400,{error:'Enter valid account details and try again.'});}
      if(!passwordPolicy(body.password).ok)return sendJson(res,400,{error:PASSWORD_RULE_MESSAGE});
      return upstream(replayRequest(req,raw),res);
    }catch{return sendJson(res,400,{error:'Enter valid account details and try again.'});}
  }

  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/account-platform.js'&&type.includes('javascript')){
      const next=strengthenAccountAsset(body);
      if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{VERSION,PRIMARY_ORIGIN,PRIMARY_HOST,PASSWORD_RULE_MESSAGE,PASSWORD_PATTERN,passwordPolicy,requestHost,originAllowed,strengthenAccountAsset,replayRequest});
module.exports=handler;