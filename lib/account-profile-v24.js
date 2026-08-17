// My Australian Product Guide account profile & settings v24 over Auth Hardening v23.
// Adds a professional signed-in profile/settings experience and a clearer signup-confirmation hand-off.
const app=require('./auth-hardening-v23');

const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const ACCESS_COOKIE='apg_at';
const REFRESH_COOKIE='apg_rt';
const PROFILE_JS='/assets/account-profile-v24.js?v=24';
const PROFILE_CSS='/assets/account-profile-v24.css?v=24';

function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');if(i<0)return;
    const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();
    try{out[k]=decodeURIComponent(v)}catch{out[k]=v}
  });
  return out;
}
function appendCookie(res,value){
  const current=res.getHeader('Set-Cookie');
  if(!current)res.setHeader('Set-Cookie',[value]);
  else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);
}
function setSessionCookies(res,data){
  if(!data?.access_token||!data?.refresh_token)return;
  const accessAge=Math.max(300,Number(data.expires_in)||3600);
  appendCookie(res,`${ACCESS_COOKIE}=${encodeURIComponent(data.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${accessAge}`);
  appendCookie(res,`${REFRESH_COOKIE}=${encodeURIComponent(data.refresh_token)}; Path=/api/account; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
}
function clearSessionCookies(res){
  appendCookie(res,`${ACCESS_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  appendCookie(res,`${REFRESH_COOKIE}=; Path=/api/account; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
function sendJson(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(JSON.stringify(payload));
}
function allowedOrigin(req){
  const origin=String(req.headers.origin||'');
  return !origin||origin===PRIMARY_ORIGIN||process.env.VERCEL_ENV!=='production';
}
async function readJson(req,limit=10000){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data',chunk=>{body+=chunk;if(body.length>limit){reject(new Error('Request too large'));req.destroy();}});
    req.on('end',()=>{if(!body)return resolve({});try{resolve(JSON.parse(body))}catch{reject(new Error('Invalid JSON'))}});
    req.on('error',reject);
  });
}
async function supabase(path,{method='GET',token,body,headers={}}={}){
  const h={apikey:SUPABASE_KEY,...headers};
  if(token)h.Authorization=`Bearer ${token}`;
  if(body!==undefined)h['Content-Type']='application/json';
  const response=await fetch(SUPABASE_URL+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();let data=null;
  if(text){try{data=JSON.parse(text)}catch{data=text}}
  return {ok:response.ok,status:response.status,data};
}
async function refreshSession(req,res){
  const c=cookies(req);if(!c[REFRESH_COOKIE])return null;
  const r=await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:c[REFRESH_COOKIE]}});
  if(!r.ok){clearSessionCookies(res);return null;}
  setSessionCookies(res,r.data);return r.data;
}
async function authContext(req,res){
  const c=cookies(req);let token=c[ACCESS_COOKIE];
  if(token){const u=await supabase('/auth/v1/user',{token});if(u.ok&&u.data?.id)return {token,user:u.data};}
  const refreshed=await refreshSession(req,res);if(!refreshed?.access_token)return null;
  const u=await supabase('/auth/v1/user',{token:refreshed.access_token});
  return u.ok&&u.data?.id?{token:refreshed.access_token,user:u.data}:null;
}
function safeEmail(email){
  const value=String(email||'').trim().toLowerCase();
  return value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value:'';
}
function profilePayload(user){
  const providers=Array.isArray(user?.identities)?[...new Set(user.identities.map(x=>x?.provider).filter(Boolean))]:[];
  return {
    email:user?.email||'',
    email_verified:!!user?.email_confirmed_at,
    email_confirmed_at:user?.email_confirmed_at||null,
    created_at:user?.created_at||null,
    updated_at:user?.updated_at||null,
    last_sign_in_at:user?.last_sign_in_at||null,
    providers
  };
}
async function handleProfileApi(req,res,path){
  if(req.method!=='GET'&&req.method!=='HEAD'&&!allowedOrigin(req))return sendJson(res,403,{error:'Request origin not allowed.'});
  try{
    if(path==='/api/account/profile'&&req.method==='GET'){
      const a=await authContext(req,res);
      if(!a)return sendJson(res,401,{error:'Sign in to view your My APG profile.'});
      return sendJson(res,200,{authenticated:true,profile:profilePayload(a.user)});
    }
    if(path==='/api/account/resend-confirmation'&&req.method==='POST'){
      const body=await readJson(req),email=safeEmail(body.email);
      if(email){
        await supabase(`/auth/v1/resend?redirect_to=${encodeURIComponent(PRIMARY_ORIGIN+'/my-apg/')}`,{method:'POST',body:{type:'signup',email}});
      }
      // Deliberately generic to avoid account enumeration.
      return sendJson(res,200,{ok:true,message:'If that address has a pending Australian Product Guide account, a new confirmation email has been requested. Please also check junk or spam folders.'});
    }
    return false;
  }catch{
    return sendJson(res,500,{error:'The profile service could not complete that request. Please try again.'});
  }
}
function injectProfileAssets(html){
  let out=String(html||'');
  if(!out.includes(PROFILE_CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${PROFILE_CSS}"></head>`);
  if(!out.includes(PROFILE_JS))out=out.replace('</body>',`<script src="${PROFILE_JS}" defer></script></body>`);
  return out;
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  let path='/';try{path=new URL(pathOrUrl||'/',PRIMARY_ORIGIN).pathname}catch{}
  return path==='/my-apg/'?injectProfileAssets(base):base;
}

module.exports=async(req,res)=>{
  let path='/';try{path=new URL(req.url,PRIMARY_ORIGIN).pathname}catch{}
  if(path==='/api/account/profile'||path==='/api/account/resend-confirmation'){
    const handled=await handleProfileApi(req,res,path);if(handled!==false)return handled;
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&path==='/my-apg/')body=injectProfileAssets(body);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.profilePayload=profilePayload;
module.exports.injectProfileAssets=injectProfileAssets;
