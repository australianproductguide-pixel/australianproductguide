// APG authentication hardening v23 over Site Surface Polish v22.
// Adds a first-party Supabase token-hash callback and consumer-safe confirmation/recovery UX.
// The callback is designed for the branded Supabase email templates in docs/auth-email-templates/.
const app=require('./site-surface-polish-v22');

const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const ACCESS_COOKIE='apg_at';
const REFRESH_COOKIE='apg_rt';
const CLIENT_ASSET='/assets/auth-hardening-v23.js';
const ALLOWED_EMAIL_TYPES=new Set(['email','recovery']);

function appendCookie(res,value){
  const current=res.getHeader('Set-Cookie');
  if(!current)res.setHeader('Set-Cookie',[value]);
  else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);
}
function setSessionCookies(res,data){
  const session=data?.session||data;
  if(!session?.access_token||!session?.refresh_token)return false;
  const accessAge=Math.max(300,Number(session.expires_in)||3600);
  appendCookie(res,`${ACCESS_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${accessAge}`);
  appendCookie(res,`${REFRESH_COOKIE}=${encodeURIComponent(session.refresh_token)}; Path=/api/account; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
  return true;
}
function noStore(res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
}
function redirect(res,location){
  res.statusCode=303;
  noStore(res);
  res.setHeader('Location',location);
  return res.end();
}
async function verifyTokenHash(tokenHash,type){
  const response=await fetch(`${SUPABASE_URL}/auth/v1/verify`,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({token_hash:tokenHash,type})
  });
  let data=null;
  const text=await response.text();
  if(text){try{data=JSON.parse(text)}catch{data=null}}
  return {ok:response.ok,status:response.status,data};
}
async function confirmAuth(req,res,url){
  if(req.method!=='GET'&&req.method!=='HEAD')return redirect(res,PRIMARY_ORIGIN+'/my-apg/?auth=invalid');
  const tokenHash=String(url.searchParams.get('token_hash')||'');
  const type=String(url.searchParams.get('type')||'');
  if(!tokenHash||tokenHash.length>4096||!ALLOWED_EMAIL_TYPES.has(type))return redirect(res,PRIMARY_ORIGIN+'/my-apg/?auth=invalid');
  try{
    const result=await verifyTokenHash(tokenHash,type);
    if(!result.ok||!setSessionCookies(res,result.data))return redirect(res,PRIMARY_ORIGIN+'/my-apg/?auth=invalid');
    return redirect(res,PRIMARY_ORIGIN+`/my-apg/?auth=${type==='recovery'?'recovery':'confirmed'}`);
  }catch{
    return redirect(res,PRIMARY_ORIGIN+'/my-apg/?auth=unavailable');
  }
}

const clientJs=`(()=>{
function applyAuthResult(){
  const params=new URLSearchParams(location.search),status=params.get('auth');
  if(!status)return;
  const root=document.querySelector('[data-account-shell]');
  if(!root){setTimeout(applyAuthResult,80);return;}
  const message=root.querySelector('[data-account-message]');
  const set=(text,error=false)=>{if(!message)return;message.textContent=text;message.classList.toggle('is-error',error);};
  if(status==='recovery'){
    const panel=root.querySelector('[data-password-panel]');
    if(panel){panel.hidden=false;panel.querySelector('input')?.focus();}
    set('Secure recovery link accepted. Choose a new password below.');
  }else if(status==='confirmed'){
    setTimeout(()=>set('Email confirmed. Your Australian Product Guide account is ready.'),700);
  }else if(status==='invalid'){
    set('That confirmation or recovery link is invalid, expired or has already been used. You can sign in normally if your email was already confirmed, or request a new password-reset email.',true);
  }else if(status==='unavailable'){
    set('The account confirmation service is temporarily unavailable. Please try the link again shortly.',true);
  }
  history.replaceState(null,'',location.pathname);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyAuthResult);else applyAuthResult();
})();`;

function injectClient(html){
  let body=String(html||'');
  if(!body.includes(CLIENT_ASSET))body=body.replace('</body>',`<script src="${CLIENT_ASSET}" defer></script></body>`);
  return body;
}
function pathFrom(pathOrUrl){
  try{return new URL(String(pathOrUrl||'/'),PRIMARY_ORIGIN).pathname}catch{return String(pathOrUrl||'/').split('?')[0]}
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return pathFrom(pathOrUrl)==='/my-apg/'?injectClient(base):base;
}
function sendClientAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':clientJs);
}

module.exports=(req,res)=>{
  let url;
  try{url=new URL(req.url,PRIMARY_ORIGIN)}catch{url=new URL(PRIMARY_ORIGIN+'/')}
  const path=url.pathname;
  if(path==='/auth/confirm')return confirmAuth(req,res,url);
  if(path===CLIENT_ASSET)return sendClientAsset(req,res);

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&path==='/my-apg/')body=injectClient(body);
    return originalEnd(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.verifyTokenHash=verifyTokenHash;
module.exports.clientJs=clientJs;
module.exports.injectClient=injectClient;
module.exports.pathFrom=pathFrom;
