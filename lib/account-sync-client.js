const accountSyncClientJs=`
;(()=>{
const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const SESSION_KEY='apgAccountSession';
const localKeys={compare:'apgCompare',saved:'apgSaved',recent:'apgRecent',decisions:'apgDecisionHistory',searches:'apgRecentSearches',comparisons:'apgSavedComparisons',guides:'apgSavedGuides'};
const q=(s,r=document)=>r.querySelector(s);
const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const safe=s=>String(s||'').replace(/[<>&"']/g,'');
const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}};
const saveSession=s=>{if(s?.access_token)localStorage.setItem(SESSION_KEY,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Math.floor(Date.now()/1000)+(s.expires_in||3600),user:s.user?{id:s.user.id,email:s.user.email}:null}));};
const clearSession=()=>localStorage.removeItem(SESSION_KEY);
async function api(path,opts={}){const s=session();const headers={'apikey':SUPABASE_KEY,'Content-Type':'application/json',...(opts.headers||{})};if(s?.access_token)headers.Authorization='Bearer '+s.access_token;const r=await fetch(SUPABASE_URL+path,{...opts,headers});let data=null;try{data=await r.json()}catch{}if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||('Request failed ('+r.status+')'));return data;}
async function refresh(){const s=session();if(!s?.refresh_token)return null;if((s.expires_at||0)>Math.floor(Date.now()/1000)+90)return s;try{const data=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});saveSession(data);return session()}catch{clearSession();return null}}
function keyFor(x){let raw=x?.url||x?.q||x?.title||JSON.stringify(x||{});let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function localRows(userId){const rows=[];const push=(type,key,payload)=>rows.push({user_id:userId,item_type:type,item_key:String(key),payload});
  read(localKeys.saved).forEach(x=>push('saved_product',x,{slug:x}));
  read(localKeys.compare).forEach(x=>push('compare_shortlist',x,{slug:x}));
  read(localKeys.recent).forEach(x=>push('recent_product',x,{slug:x}));
  read(localKeys.decisions).forEach(x=>push('decision_history',keyFor(x),x));
  read(localKeys.searches).forEach(x=>push('recent_search',keyFor(x),x));
  read(localKeys.comparisons).forEach(x=>push('saved_comparison',keyFor(x),x));
  read(localKeys.guides).forEach(x=>push('saved_guide',keyFor(x),x));
  return rows;
}
function mergeRemote(rows){
  const slugs=t=>rows.filter(x=>x.item_type===t).map(x=>x.payload?.slug||x.item_key).filter(Boolean);
  write(localKeys.saved,[...new Set([...read(localKeys.saved),...slugs('saved_product')])].slice(0,50));
  write(localKeys.compare,[...new Set([...read(localKeys.compare),...slugs('compare_shortlist')])].slice(0,4));
  write(localKeys.recent,[...new Set([...slugs('recent_product'),...read(localKeys.recent)])].slice(0,12));
  const mergeObjects=(key,type,limit)=>{const remote=rows.filter(x=>x.item_type===type).map(x=>x.payload).filter(Boolean);const seen=new Set(),out=[];for(const x of [...remote,...read(key)]){const id=x.url||x.q||JSON.stringify(x);if(seen.has(id))continue;seen.add(id);out.push(x)}write(key,out.slice(0,limit));};
  mergeObjects(localKeys.decisions,'decision_history',20);mergeObjects(localKeys.searches,'recent_search',20);mergeObjects(localKeys.comparisons,'saved_comparison',20);mergeObjects(localKeys.guides,'saved_guide',20);
}
async function syncNow(status){const s=await refresh();if(!s?.user?.id){if(status)status.textContent='Sign in to sync across devices.';return}if(status)status.textContent='Syncing…';const remote=await api('/rest/v1/apg_workspace_items?select=item_type,item_key,payload,updated_at&order=updated_at.desc');mergeRemote(remote||[]);const rows=localRows(s.user.id);if(rows.length)await api('/rest/v1/apg_workspace_items?on_conflict=user_id,item_type,item_key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});if(status)status.textContent='My APG is synced.';window.dispatchEvent(new Event('apg-workspace-synced'));}
function accountPanel(root){if(q('[data-account-panel]',root))return;const panel=document.createElement('section');panel.className='feature-card';panel.dataset.accountPanel='';panel.innerHTML='<p class="kicker">Optional account sync</p><h2>Use My APG across devices</h2><p data-account-copy>Local-only remains the default. Create an account only if you want saved products, shortlists, recent decisions, searches, comparisons and guides synced across devices.</p><div data-account-signed-out><form data-account-form><label>Email<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" name="password" autocomplete="current-password" minlength="8" required></label><div class="actions"><button class="button" type="submit" data-sign-in>Sign in</button><button class="button secondary" type="button" data-sign-up>Create account</button></div></form></div><div data-account-signed-in hidden><p>Signed in as <strong data-account-email></strong>.</p><div class="actions"><button class="button" type="button" data-sync-now>Sync now</button><button class="button secondary" type="button" data-sign-out>Sign out</button><button class="button secondary" type="button" data-delete-account>Delete account</button></div></div><p data-account-status aria-live="polite"></p><p><small>Synced data is stored in the APG Supabase project in Sydney with per-user Row Level Security. See <a href="/privacy/">Privacy</a>.</small></p>';
  root.insertBefore(panel,root.firstChild);
}
async function renderAccount(){const root=q('[data-apg-workspace]');if(!root)return;accountPanel(root);const s=await refresh(),signedIn=q('[data-account-signed-in]',root),signedOut=q('[data-account-signed-out]',root),email=q('[data-account-email]',root);signedIn.hidden=!s?.user;signedOut.hidden=!!s?.user;if(email)email.textContent=s?.user?.email||'';}
async function credentials(root){const f=q('[data-account-form]',root);return {email:String(f?.email?.value||'').trim(),password:String(f?.password?.value||'')}}
function bind(){const root=q('[data-apg-workspace]');if(!root)return;accountPanel(root);const status=q('[data-account-status]',root);
  q('[data-account-form]',root)?.addEventListener('submit',async e=>{e.preventDefault();const c=await credentials(root);try{status.textContent='Signing in…';const data=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify(c)});saveSession(data);await renderAccount();await syncNow(status)}catch(err){status.textContent=err.message}});
  q('[data-sign-up]',root)?.addEventListener('click',async()=>{const c=await credentials(root);try{status.textContent='Creating account…';const data=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify(c)});if(data?.session)saveSession(data.session);else if(data?.access_token)saveSession(data);status.textContent=data?.session||data?.access_token?'Account created. Syncing…':'Account created. Check your email if confirmation is required, then sign in.';await renderAccount();if(session())await syncNow(status)}catch(err){status.textContent=err.message}});
  q('[data-sync-now]',root)?.addEventListener('click',()=>syncNow(status).catch(err=>status.textContent=err.message));
  q('[data-sign-out]',root)?.addEventListener('click',async()=>{try{await api('/auth/v1/logout',{method:'POST'});}catch{}clearSession();await renderAccount();status.textContent='Signed out. Local My APG data remains on this device.'});
  q('[data-delete-account]',root)?.addEventListener('click',async()=>{if(!confirm('Permanently delete your APG account and synced cloud data? Local browser data will remain unless you clear it separately.'))return;try{status.textContent='Deleting account…';await api('/functions/v1/delete-account',{method:'POST',body:'{}'});clearSession();await renderAccount();status.textContent='Account and synced cloud data deleted.'}catch(err){status.textContent=err.message}});
}
if(location.pathname==='/my-apg/'){bind();renderAccount();}
})();
`;
module.exports={accountSyncClientJs};