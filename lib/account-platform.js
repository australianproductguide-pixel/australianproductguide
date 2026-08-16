const app=require('./mobile-search-layer-fix');

const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const ACCESS_COOKIE='apg_at';
const REFRESH_COOKIE='apg_rt';
const ASSET_JS='/assets/account-platform.js';
const ASSET_CSS='/assets/account-platform.css';
const CONSENT_VERSION='2026-08-16-v1';
const WORKSPACE_TYPES={
  saved:'saved_product',compare:'compare_shortlist',recent:'recent_product',decisions:'decision_history',searches:'recent_search',comparisons:'saved_comparison',guides:'saved_guide'
};

const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{const i=part.indexOf('=');if(i<0)return;const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();try{out[k]=decodeURIComponent(v)}catch{out[k]=v}});
  return out;
}
function appendCookie(res,value){const current=res.getHeader('Set-Cookie');if(!current)res.setHeader('Set-Cookie',[value]);else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);}
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
function sendJson(res,status,payload){res.statusCode=status;for(const [k,v] of Object.entries(jsonHeaders))res.setHeader(k,v);return res.end(JSON.stringify(payload));}
function allowedOrigin(req){const origin=String(req.headers.origin||'');return !origin||origin===PRIMARY_ORIGIN||process.env.VERCEL_ENV!=='production';}
async function readJson(req,limit=250000){
  return new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>limit){reject(new Error('Request too large'));req.destroy();}});req.on('end',()=>{if(!body)return resolve({});try{resolve(JSON.parse(body))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject);});
}
async function supabase(path,{method='GET',token,body,headers={}}={}){
  const h={apikey:SUPABASE_KEY,...headers};if(token)h.Authorization=`Bearer ${token}`;if(body!==undefined)h['Content-Type']='application/json';
  const r=await fetch(SUPABASE_URL+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  let data=null;const text=await r.text();if(text){try{data=JSON.parse(text)}catch{data=text}}
  return {ok:r.ok,status:r.status,data,headers:r.headers};
}
function friendlyError(result,fallback='That request could not be completed. Please try again.'){
  const raw=String(result?.data?.msg||result?.data?.message||result?.data?.error_description||result?.data?.error||'').toLowerCase();
  if(raw.includes('invalid login'))return 'Email or password is incorrect.';
  if(raw.includes('email not confirmed'))return 'Please confirm your email address before signing in.';
  if(raw.includes('already registered')||raw.includes('already been registered'))return 'An account already exists for this email address.';
  if(raw.includes('password'))return result?.data?.message||result?.data?.msg||'Please use a stronger password of at least 8 characters.';
  if(result?.status===429)return 'Too many attempts. Please wait a moment and try again.';
  return fallback;
}
async function refreshSession(req,res){
  const c=cookies(req);if(!c[REFRESH_COOKIE])return null;
  const r=await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:c[REFRESH_COOKIE]}});
  if(!r.ok){clearSessionCookies(res);return null;}setSessionCookies(res,r.data);return r.data;
}
async function authContext(req,res){
  const c=cookies(req);let token=c[ACCESS_COOKIE];
  if(token){const u=await supabase('/auth/v1/user',{token});if(u.ok&&u.data?.id)return {token,user:u.data};}
  const refreshed=await refreshSession(req,res);if(!refreshed?.access_token)return null;
  const u=await supabase('/auth/v1/user',{token:refreshed.access_token});return u.ok&&u.data?.id?{token:refreshed.access_token,user:u.data}:null;
}
function safeEmail(email){const s=String(email||'').trim().toLowerCase();return s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:'';}
function safePassword(password){const s=String(password||'');return s.length>=8&&s.length<=200?s:'';}
function hashKey(value){const raw=typeof value==='string'?value:JSON.stringify(value||{});let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function normaliseWorkspace(input,userId){
  const rows=[];const push=(type,key,payload)=>rows.push({user_id:userId,item_type:type,item_key:String(key).slice(0,220),payload,updated_at:new Date().toISOString()});
  for(const [clientKey,type] of Object.entries(WORKSPACE_TYPES)){
    const list=Array.isArray(input?.[clientKey])?input[clientKey]:[];
    const max=['saved','recent'].includes(clientKey)?50:clientKey==='compare'?4:20;
    for(const raw of list.slice(0,max)){
      if(['saved','compare','recent'].includes(clientKey)){const slug=String(raw||'').trim().slice(0,180);if(slug)push(type,slug,{slug});}
      else if(raw&&typeof raw==='object'){const payload=JSON.parse(JSON.stringify(raw));const seed=payload.url||payload.q||payload.title||payload.path||JSON.stringify(payload);push(type,hashKey(seed),payload);}
    }
  }
  return rows;
}
async function fetchWorkspace(token,userId){
  return supabase(`/rest/v1/apg_workspace_items?user_id=eq.${encodeURIComponent(userId)}&select=item_type,item_key,payload,updated_at&order=updated_at.desc`,{token});
}
async function handleApi(req,res,path){
  if(req.method!=='GET'&&req.method!=='HEAD'&&!allowedOrigin(req))return sendJson(res,403,{error:'Request origin not allowed.'});
  try{
    if(path==='/api/account/signup'&&req.method==='POST'){
      const body=await readJson(req),email=safeEmail(body.email),password=safePassword(body.password);if(!email||!password)return sendJson(res,400,{error:'Enter a valid email address and a password of at least 8 characters.'});
      const r=await supabase(`/auth/v1/signup?redirect_to=${encodeURIComponent(PRIMARY_ORIGIN+'/my-apg/')}`,{method:'POST',body:{email,password}});
      if(!r.ok)return sendJson(res,r.status===429?429:400,{error:friendlyError(r,'We could not create the account. Please check the details and try again.')});
      if(r.data?.access_token)setSessionCookies(res,r.data);
      return sendJson(res,200,{ok:true,authenticated:!!r.data?.access_token,email_confirmation_required:!r.data?.access_token,message:r.data?.access_token?'Account created and signed in.':'Account created. Check your email to confirm the address, then return here to sign in.'});
    }
    if(path==='/api/account/login'&&req.method==='POST'){
      const body=await readJson(req),email=safeEmail(body.email),password=String(body.password||'');if(!email||!password)return sendJson(res,400,{error:'Enter your email address and password.'});
      const r=await supabase('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});if(!r.ok)return sendJson(res,r.status===429?429:401,{error:friendlyError(r)});setSessionCookies(res,r.data);return sendJson(res,200,{ok:true,user:{email:r.data?.user?.email||email}});
    }
    if(path==='/api/account/session'&&req.method==='POST'){
      const body=await readJson(req),access=String(body.access_token||''),refresh=String(body.refresh_token||'');if(!access||!refresh)return sendJson(res,400,{error:'Missing confirmation session.'});
      const u=await supabase('/auth/v1/user',{token:access});if(!u.ok||!u.data?.id)return sendJson(res,401,{error:'This confirmation link is no longer valid. Please sign in or request another link.'});setSessionCookies(res,{access_token:access,refresh_token:refresh,expires_in:Number(body.expires_in)||3600});return sendJson(res,200,{ok:true,user:{email:u.data.email||''},type:String(body.type||'')});
    }
    if(path==='/api/account/me'&&req.method==='GET'){
      const a=await authContext(req,res);return sendJson(res,200,a?{authenticated:true,user:{email:a.user.email||'',id:a.user.id}}:{authenticated:false});
    }
    if(path==='/api/account/logout'&&req.method==='POST'){
      const a=await authContext(req,res);if(a)await supabase('/auth/v1/logout',{method:'POST',token:a.token});clearSessionCookies(res);return sendJson(res,200,{ok:true});
    }
    if(path==='/api/account/recover'&&req.method==='POST'){
      const body=await readJson(req),email=safeEmail(body.email);if(email)await supabase(`/auth/v1/recover?redirect_to=${encodeURIComponent(PRIMARY_ORIGIN+'/my-apg/')}`,{method:'POST',body:{email}});return sendJson(res,200,{ok:true,message:'If an account exists for that email, a password reset message has been requested.'});
    }
    if(path==='/api/account/password'&&req.method==='POST'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Please use a valid recovery link or sign in first.'});const body=await readJson(req),password=safePassword(body.password);if(!password)return sendJson(res,400,{error:'Use a new password of at least 8 characters.'});const r=await supabase('/auth/v1/user',{method:'PUT',token:a.token,body:{password}});return r.ok?sendJson(res,200,{ok:true}):sendJson(res,400,{error:friendlyError(r,'The password could not be updated.')});
    }
    if(path==='/api/account/workspace'&&req.method==='GET'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Sign in to sync My Australian Product Guide.'});const r=await fetchWorkspace(a.token,a.user.id);return r.ok?sendJson(res,200,{items:r.data||[]}):sendJson(res,502,{error:'Workspace sync is temporarily unavailable.'});
    }
    if(path==='/api/account/workspace/sync'&&req.method==='POST'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Sign in to sync My Australian Product Guide.'});const body=await readJson(req),rows=normaliseWorkspace(body,a.user.id);
      if(rows.length){const write=await supabase('/rest/v1/apg_workspace_items?on_conflict=user_id,item_type,item_key',{method:'POST',token:a.token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows});if(!write.ok)return sendJson(res,502,{error:'Workspace sync is temporarily unavailable.'});}
      const remote=await fetchWorkspace(a.token,a.user.id);return remote.ok?sendJson(res,200,{ok:true,items:remote.data||[]}):sendJson(res,502,{error:'Workspace sync is temporarily unavailable.'});
    }
    if(path==='/api/account/preferences'&&req.method==='GET'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Sign in to manage update preferences.'});const r=await supabase(`/rest/v1/apg_communication_preferences?user_id=eq.${encodeURIComponent(a.user.id)}&select=email_updates,consented_at,withdrawn_at,consent_version`,{token:a.token});if(!r.ok)return sendJson(res,502,{error:'Preferences are temporarily unavailable.'});const row=Array.isArray(r.data)?r.data[0]:null;return sendJson(res,200,{email_updates:!!row?.email_updates,consented_at:row?.consented_at||null,withdrawn_at:row?.withdrawn_at||null});
    }
    if(path==='/api/account/preferences'&&req.method==='POST'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Sign in to manage update preferences.'});const body=await readJson(req),enabled=body.email_updates===true;
      const existing=await supabase(`/rest/v1/apg_communication_preferences?user_id=eq.${encodeURIComponent(a.user.id)}&select=consented_at`,{token:a.token});const prior=Array.isArray(existing.data)?existing.data[0]:null,now=new Date().toISOString();
      const row={user_id:a.user.id,email_updates:enabled,consented_at:enabled?(prior?.consented_at||now):(prior?.consented_at||null),withdrawn_at:enabled?null:now,consent_source:'my_apg_settings',consent_version:CONSENT_VERSION,updated_at:now};
      const r=await supabase('/rest/v1/apg_communication_preferences?on_conflict=user_id',{method:'POST',token:a.token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:row});return r.ok?sendJson(res,200,{ok:true,email_updates:enabled}):sendJson(res,502,{error:'We could not save that preference. Please try again.'});
    }
    if(path==='/api/account/delete'&&req.method==='POST'){
      const a=await authContext(req,res);if(!a)return sendJson(res,401,{error:'Sign in before deleting the account.'});const r=await supabase('/functions/v1/delete-account',{method:'POST',token:a.token,body:{}});if(!r.ok)return sendJson(res,502,{error:'Account deletion could not be completed. Please try again.'});clearSessionCookies(res);return sendJson(res,200,{ok:true});
    }
    return sendJson(res,404,{error:'Not found'});
  }catch(err){return sendJson(res,500,{error:'The account service could not complete that request. Please try again.'});}
}

const accountCss=`
/* APG consumer accounts v1 */
.apg-account-shell{margin-bottom:28px;border:1px solid var(--apg9-line,#dce5e4);border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 12px 32px rgba(8,39,53,.07)}
.apg-account-head{padding:26px 28px;background:#082735;color:#fff;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}.apg-account-head .kicker{color:#f3b548!important}.apg-account-head h2{color:#fff!important;margin:4px 0 7px!important;font-size:1.8rem!important}.apg-account-head p{color:#bdccce!important;margin:0;max-width:700px}.apg-account-status-badge{padding:7px 10px;border-radius:999px;background:#123d4b;color:#fff;font-size:10px;font-weight:800;white-space:nowrap}
.apg-account-body{padding:28px}.apg-account-tabs{display:flex;gap:7px;margin-bottom:20px}.apg-account-tabs button{border:1px solid #cbd8d7;background:#fff;color:#294957;border-radius:9px;padding:8px 13px;font-weight:760}.apg-account-tabs button[aria-selected=true]{background:#e9f4f1;border-color:#b9d3ce;color:#087c76}.apg-account-form{display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:760px}.apg-account-form .full{grid-column:1/-1}.apg-account-form label{display:grid;gap:6px}.apg-account-form input{width:100%}.apg-account-form-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.apg-account-link{border:0;background:transparent;color:#087c76;padding:5px 0;font-weight:730;text-decoration:underline;text-underline-offset:3px}.apg-account-consent{display:flex!important;grid-column:1/-1;align-items:flex-start!important;gap:10px!important;padding:14px;border:1px solid #dce5e4;border-radius:11px;background:#f7f9f8;font-size:12px!important;font-weight:500!important;color:#405c67!important}.apg-account-consent input{width:18px!important;height:18px!important;min-height:0!important;margin-top:1px;flex:0 0 auto}.apg-account-consent strong{display:block;color:#173e4c}.apg-account-consent small{display:block;margin-top:3px;color:#687d85;font-size:10.5px}.apg-account-note{margin:14px 0 0;font-size:10.5px!important;color:#71838a!important}.apg-account-message{min-height:22px;margin:13px 0 0;color:#31515e;font-size:12px;font-weight:650}.apg-account-message.is-error{color:#9b2d2d}.apg-account-signed-in{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:start}.apg-account-identity strong{display:block;font-size:17px;color:#0a2a3a}.apg-account-identity span{display:block;color:#657981;font-size:11px;margin-top:3px}.apg-account-controls{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.apg-account-preferences{margin-top:24px;padding-top:22px;border-top:1px solid #e2e9e8;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:22px;align-items:center}.apg-account-preferences h3{margin:0 0 5px!important}.apg-account-preferences p{margin:0;font-size:11px}.apg-pref-toggle{display:flex;align-items:center;gap:9px;font-size:12px!important}.apg-pref-toggle input{width:20px!important;height:20px!important;min-height:0!important}.apg-account-danger{margin-top:24px;padding-top:20px;border-top:1px solid #e2e9e8}.apg-account-danger summary{cursor:pointer;color:#6d3838;font-size:11px;font-weight:760}.apg-account-danger div{margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.apg-account-danger button{border-color:#d8bcbc!important;color:#8b3030!important}.apg-account-recovery{padding:18px;border:1px solid #dce5e4;border-radius:12px;background:#f7f9f8;max-width:700px}.apg-account-recovery h3{margin-top:0!important}.apg-account-recovery form{display:flex;gap:9px;align-items:end;flex-wrap:wrap}.apg-account-recovery label{flex:1 1 280px;display:grid;gap:6px}.apg-header-account-state{font-size:9px;display:block;color:#70838b;font-weight:600}
@media(max-width:720px){.apg-account-head{display:grid;padding:22px}.apg-account-body{padding:20px}.apg-account-form{grid-template-columns:1fr}.apg-account-form .full,.apg-account-consent{grid-column:1}.apg-account-signed-in,.apg-account-preferences{grid-template-columns:1fr}.apg-account-controls{justify-content:flex-start}.apg-account-status-badge{justify-self:start}}
`;

const accountClientJs=`(()=>{
const q=(s,r=document)=>r.querySelector(s);const read=(k,f=[])=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const keys={saved:'apgSaved',compare:'apgCompare',recent:'apgRecent',decisions:'apgDecisionHistory',searches:'apgRecentSearches',comparisons:'apgSavedComparisons',guides:'apgSavedGuides'};
async function api(path,opts={}){const r=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||'Request failed.');return data;}
function setMessage(root,text,error=false){const el=q('[data-account-message]',root);if(!el)return;el.textContent=text||'';el.classList.toggle('is-error',!!error)}
function localWorkspace(){const out={};Object.entries(keys).forEach(([k,v])=>out[k]=read(v));return out;}
function mergeRemote(items){const by=t=>(items||[]).filter(x=>x.item_type===t).map(x=>x.payload).filter(Boolean);const slugs=t=>by(t).map(x=>x.slug).filter(Boolean);write(keys.saved,[...new Set([...read(keys.saved),...slugs('saved_product')])].slice(0,50));write(keys.compare,[...new Set([...read(keys.compare),...slugs('compare_shortlist')])].slice(0,4));write(keys.recent,[...new Set([...slugs('recent_product'),...read(keys.recent)])].slice(0,50));const merge=(key,type,limit)=>{const seen=new Set(),out=[];for(const x of [...by(type),...read(key)]){const id=x.url||x.q||x.title||x.path||JSON.stringify(x);if(seen.has(id))continue;seen.add(id);out.push(x)}write(key,out.slice(0,limit))};merge(keys.decisions,'decision_history',20);merge(keys.searches,'recent_search',20);merge(keys.comparisons,'saved_comparison',20);merge(keys.guides,'saved_guide',20);}
async function sync(root){setMessage(root,'Syncing your saved research…');const data=await api('/api/account/workspace/sync',{method:'POST',body:JSON.stringify(localWorkspace())});mergeRemote(data.items||[]);setMessage(root,'Saved research is synced across signed-in devices.');window.dispatchEvent(new Event('apg-workspace-synced'));}
function authHash(root){if(!location.hash)return false;const p=new URLSearchParams(location.hash.slice(1));const access=p.get('access_token'),refresh=p.get('refresh_token');if(!access||!refresh)return false;api('/api/account/session',{method:'POST',body:JSON.stringify({access_token:access,refresh_token:refresh,expires_in:Number(p.get('expires_in')||3600),type:p.get('type')||''})}).then(async data=>{history.replaceState(null,'',location.pathname+location.search);if(p.get('type')==='recovery'){root.dataset.recovery='true';showRecovery(root);}await render(root);await sync(root)}).catch(err=>setMessage(root,err.message,true));return true;}
function shell(){return '<section class="apg-account-shell" data-account-shell><header class="apg-account-head"><div><p class="kicker">My Australian Product Guide account</p><h2>Save your research across devices.</h2><p>Create an optional account to sync products, comparison shortlists, Decision Lab history and saved research. Browsing and comparison still work without an account.</p></div><span class="apg-account-status-badge" data-account-badge>Checking account…</span></header><div class="apg-account-body"><div data-account-signed-out hidden><div class="apg-account-tabs" role="tablist"><button type="button" data-account-tab="login" aria-selected="true">Sign in</button><button type="button" data-account-tab="signup" aria-selected="false">Create account</button></div><form class="apg-account-form" data-account-form><label>Email address<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" name="password" autocomplete="current-password" minlength="8" required></label><label class="apg-account-consent" data-signup-consent hidden><input type="checkbox" name="email_updates"><span><strong>Email me occasional Australian Product Guide updates</strong><small>Optional. Product research and buying-guide updates only. You can change this at any time. Account/security emails are separate.</small></span></label><div class="apg-account-form-actions full"><button class="button" type="submit" data-account-submit>Sign in</button><button class="apg-account-link" type="button" data-account-forgot>Forgot password?</button></div></form><div class="apg-account-recovery" data-account-forgot-panel hidden><h3>Reset your password</h3><form data-recover-form><label>Email address<input type="email" name="email" autocomplete="email" required></label><button class="button secondary" type="submit">Send reset email</button></form></div><p class="apg-account-note">Creating an account does not subscribe you to marketing. Update emails are a separate, unchecked opt-in.</p></div><div data-account-signed-in hidden><div class="apg-account-signed-in"><div class="apg-account-identity"><span>Signed in as</span><strong data-account-email></strong><span>Workspace sync uses Australian Product Guide\'s Sydney-hosted Supabase project with per-user access controls.</span></div><div class="apg-account-controls"><button class="button" type="button" data-account-sync>Sync now</button><button class="button secondary" type="button" data-account-logout>Sign out</button></div></div><div class="apg-account-preferences"><div><h3>Product research updates</h3><p>Choose whether APG may email occasional product-research and buying-guide updates. No marketing email delivery service is active yet; this preference is stored for when that capability is introduced and verified.</p></div><label class="apg-pref-toggle"><input type="checkbox" data-email-updates><span>Receive update emails</span></label></div><details class="apg-account-danger"><summary>Account & privacy controls</summary><div><button class="button secondary" type="button" data-account-delete>Delete account</button><small>Deletes the account and synced APG cloud workspace. Browser-local history remains until you clear it separately.</small></div></details></div><div class="apg-account-recovery" data-password-panel hidden><h3>Choose a new password</h3><form data-password-form><label>New password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label><button class="button" type="submit">Update password</button></form></div><p class="apg-account-message" data-account-message aria-live="polite"></p></div></section>';}
function inject(){const root=q('[data-apg-workspace]');if(!root||q('[data-account-shell]',root))return root;root.insertAdjacentHTML('afterbegin',shell());return root;}
function tab(root,mode){root.dataset.mode=mode;q('[data-account-submit]',root).textContent=mode==='signup'?'Create account':'Sign in';q('[data-signup-consent]',root).hidden=mode!=='signup';q('[data-account-form] input[name=password]',root).autocomplete=mode==='signup'?'new-password':'current-password';root.querySelectorAll('[data-account-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.accountTab===mode)));}
async function loadPreference(root){try{const p=await api('/api/account/preferences');const toggle=q('[data-email-updates]',root);if(toggle)toggle.checked=!!p.email_updates}catch{}}
function showRecovery(root){q('[data-password-panel]',root).hidden=false;q('[data-password-panel] input',root)?.focus();}
async function render(root){const state=await api('/api/account/me');const out=q('[data-account-signed-out]',root),inside=q('[data-account-signed-in]',root),badge=q('[data-account-badge]',root);out.hidden=!!state.authenticated;inside.hidden=!state.authenticated;badge.textContent=state.authenticated?'Signed in · sync on':'Optional account';const header=q('.apg-workspace-link span');if(header)header.textContent=state.authenticated?'My APG':'Sign in';if(state.authenticated){q('[data-account-email]',root).textContent=state.user?.email||'';await loadPreference(root)}return state;}
function bind(root){root.addEventListener('click',async e=>{const tabBtn=e.target.closest('[data-account-tab]');if(tabBtn){tab(root,tabBtn.dataset.accountTab);return}if(e.target.closest('[data-account-forgot]')){const p=q('[data-account-forgot-panel]',root);p.hidden=!p.hidden;if(!p.hidden)q('input',p)?.focus();return}if(e.target.closest('[data-account-sync]')){try{await sync(root)}catch(err){setMessage(root,err.message,true)}return}if(e.target.closest('[data-account-logout]')){try{await api('/api/account/logout',{method:'POST',body:'{}'});await render(root);setMessage(root,'Signed out. Your local workspace remains on this device.')}catch(err){setMessage(root,err.message,true)}return}if(e.target.closest('[data-account-delete]')){if(!confirm('Permanently delete your Australian Product Guide account and synced cloud data?'))return;try{await api('/api/account/delete',{method:'POST',body:'{}'});await render(root);setMessage(root,'Account and synced cloud workspace deleted.')}catch(err){setMessage(root,err.message,true)}}});
q('[data-account-form]',root)?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,mode=root.dataset.mode||'login',email=f.email.value.trim(),password=f.password.value;try{setMessage(root,mode==='signup'?'Creating your account…':'Signing in…');const data=await api(mode==='signup'?'/api/account/signup':'/api/account/login',{method:'POST',body:JSON.stringify({email,password})});if(mode==='signup'&&f.email_updates?.checked)sessionStorage.setItem('apgPendingEmailUpdates','1');if(data.authenticated===false||data.email_confirmation_required){setMessage(root,data.message||'Check your email to finish creating the account.');return}const state=await render(root);if(state.authenticated){if(sessionStorage.getItem('apgPendingEmailUpdates')==='1'){await api('/api/account/preferences',{method:'POST',body:JSON.stringify({email_updates:true})});sessionStorage.removeItem('apgPendingEmailUpdates');await loadPreference(root)}await sync(root)}}catch(err){setMessage(root,err.message,true)}});
q('[data-recover-form]',root)?.addEventListener('submit',async e=>{e.preventDefault();try{const data=await api('/api/account/recover',{method:'POST',body:JSON.stringify({email:e.currentTarget.email.value.trim()})});setMessage(root,data.message||'If the account exists, a reset message has been requested.')}catch(err){setMessage(root,err.message,true)}});
q('[data-password-form]',root)?.addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/account/password',{method:'POST',body:JSON.stringify({password:e.currentTarget.password.value})});q('[data-password-panel]',root).hidden=true;setMessage(root,'Password updated.')}catch(err){setMessage(root,err.message,true)}});
q('[data-email-updates]',root)?.addEventListener('change',async e=>{const old=!e.target.checked;try{await api('/api/account/preferences',{method:'POST',body:JSON.stringify({email_updates:e.target.checked})});setMessage(root,e.target.checked?'Update-email preference saved.':'Update emails switched off.')}catch(err){e.target.checked=old;setMessage(root,err.message,true)}});
}
async function start(){const root=inject();if(!root){try{const s=await api('/api/account/me');const header=q('.apg-workspace-link span');if(header)header.textContent=s.authenticated?'My APG':'Sign in'}catch{}return}root.dataset.mode='login';bind(root);if(authHash(root))return;try{const state=await render(root);if(state.authenticated)await sync(root)}catch(err){setMessage(root,'Account controls are temporarily unavailable. Your browser-local workspace still works.',true)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

function accountSectionHtml(html){
  let body=String(html||'');
  if(body.includes('data-account-shell'))return body;
  body=body.replace('Your private decision workspace on this device.','Your product decision workspace, wherever you shop.');
  body=body.replace('Bring together saved products, your comparison shortlist, recently viewed products and recent Decision Lab sessions without creating an account.','Keep using My Australian Product Guide locally, or create an optional account to sync saved products, comparisons and decision research across devices.');
  body=body.replace('<span>Browser-local storage</span><span>No account required</span><span>Clearable at any time</span>','<span>Local-first when signed out</span><span>Cross-device sync when signed in</span><span>Account remains optional</span>');
  body=body.replace('<strong>Privacy by default</strong><p>This workspace reads information already stored in this browser by Australian Product Guide. Nothing here implies an Australian Product Guide user account or cross-device profile.</p>','<strong>Control stays with you</strong><p>Signed-out research remains on this browser. Create an account only when you want selected My Australian Product Guide workspace items synced across your signed-in devices.</p>');
  body=body.replace('<strong>Optional cross-device My Australian Product Guide sync is active</strong><p>Stay local-first when signed out, or sign in to sync selected saved research through Australian Product Guide’s Sydney-hosted Supabase project. Product recommendations and retailer ranking do not change based on account status.</p>','<strong>Optional consumer accounts and cross-device sync</strong><p>Sign in to sync selected saved research across devices, or stay local-first. Account status and update-email preferences contribute zero points to product recommendations or retailer ranking.</p>');
  body=body.replace('<span class="v5-account-badge">RLS protected · deletion available</span>','<span class="v5-account-badge">Optional account · protected sync · deletion available</span>');
  body=body.replace('<section class="workspace-panel future-panel"><p class="kicker">Future</p><h2>Product & price alerts</h2><p>Reserved for a later opt-in service after retailer freshness and account infrastructure are approved.</p></section>','<section class="workspace-panel future-panel"><p class="kicker">Updates & alerts</p><h2>Your notification controls</h2><p>Signed-in consumers can record an optional preference for future Australian Product Guide product-research emails. Product-specific price alerts remain planned until retailer freshness and outbound delivery are separately verified.</p></section>');
  return body;
}
function policyHtml(html,path){
  let body=String(html||'');
  if(path==='/privacy/'){
    body=body.replace(/Australian Product Guide is designed to minimise personal information collection\.[\s\S]*?<\/p>/,`Australian Product Guide is designed to minimise personal information collection. Browsing, search, comparison and recommendation tools remain available without an account. If you create an optional My Australian Product Guide account, APG processes your email address, authentication records and the workspace items you choose to sync.</p>`);
    if(!body.includes('id="accounts-and-updates"'))body=body.replace('<h2 id="local">',`<h2 id="accounts-and-updates">Optional accounts and update preferences</h2><p>My Australian Product Guide accounts use APG's Supabase project hosted in the Sydney region. Synced workspace records are stored against the authenticated account and protected by per-user Row Level Security. Account status does not change product suitability or retailer ranking.</p><p>Update emails are a separate optional choice. Creating an account does not subscribe you automatically. If you opt in, APG records the preference, the time and source of consent, and any later withdrawal. No marketing-email delivery service is currently active; the preference is being recorded so future delivery can be introduced only after its sender identity, unsubscribe process and operational controls are verified. You can switch the preference off in My Australian Product Guide at any time.</p><p>Deleting the account removes the authenticated account and cascades deletion of synced APG workspace and communication-preference records. Browser-local history remains until you clear it separately.</p><h2 id="local">`);
  }
  if(path==='/terms/'&&!body.includes('id="optional-accounts"'))body=body.replace('<h2 id="acceptable">',`<h2 id="optional-accounts">Optional My Australian Product Guide accounts</h2><p>An account is optional and is not required for core browsing, search, comparison or recommendation tools. Account holders are responsible for keeping sign-in credentials secure. APG may restrict account functionality where reasonably necessary for security, abuse prevention or service operation. Deleting an account removes the authenticated account and synced cloud workspace; browser-local data remains until separately cleared.</p><p>Any product-research email preference is optional and separate from account creation. Users can withdraw that preference through My Australian Product Guide. Product-specific price alerts are not represented as active unless APG has separately verified the supporting retailer freshness and delivery controls.</p><h2 id="acceptable">`);
  return body;
}
function injectAssets(html){let body=String(html||'');if(!body.includes(ASSET_CSS))body=body.replace('</head>',`<link rel="stylesheet" href="${ASSET_CSS}"></head>`);if(!body.includes(ASSET_JS))body=body.replace('</body>',`<script src="${ASSET_JS}" defer></script></body>`);return body;}
function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,PRIMARY_ORIGIN).pathname}catch{}
  if(path===ASSET_JS)return sendAsset(req,res,'application/javascript; charset=utf-8',accountClientJs);
  if(path===ASSET_CSS)return sendAsset(req,res,'text/css; charset=utf-8',accountCss);
  if(path.startsWith('/api/account/'))return handleApi(req,res,path);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      if(path==='/my-apg/')body=accountSectionHtml(body);
      if(path==='/privacy/'||path==='/terms/')body=policyHtml(body,path);
      body=injectAssets(body);
    }
    return originalEnd(body,...args);
  };
  return app(req,res);
};

module.exports.accountCss=accountCss;
module.exports.accountClientJs=accountClientJs;
