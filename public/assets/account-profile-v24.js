(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const LOCAL_KEYS={saved:'apgSaved',compare:'apgCompare',recent:'apgRecent',decisions:'apgDecisionHistory',searches:'apgRecentSearches',comparisons:'apgSavedComparisons',guides:'apgSavedGuides'};
let refreshTimer=null,lastProfileKey='';

async function api(path,opts={}){
  const response=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||'Request failed.');
  return data;
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function readLocal(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function formatDate(value){if(!value)return 'Not available';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Not available';return new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric'}).format(d)}
function formatDateTime(value){if(!value)return 'Not available';const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Not available';return new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}).format(d)}
function initials(email){const c=String(email||'A').trim().charAt(0).toUpperCase();return /[A-Z0-9]/.test(c)?c:'A'}
function setProfileMessage(root,text,type=''){
  const el=q('[data-profile-message]',root);if(!el)return;
  el.textContent=text||'';el.classList.remove('is-error','is-success');if(type)el.classList.add(type==='error'?'is-error':'is-success');
}
function countTypes(items){
  const c={saved:0,compare:0,decisions:0,recent:0};
  for(const x of items||[]){if(x.item_type==='saved_product'||x.item_type==='saved_guide'||x.item_type==='saved_comparison')c.saved++;else if(x.item_type==='compare_shortlist')c.compare++;else if(x.item_type==='decision_history')c.decisions++;else if(x.item_type==='recent_product'||x.item_type==='recent_search')c.recent++;}
  return c;
}
function latestSync(items){let latest=0;for(const x of items||[]){const t=new Date(x.updated_at||0).getTime();if(t>latest)latest=t;}return latest?new Date(latest).toISOString():null}
function profileShell(){return `
<div class="apg-profile-v24" data-profile-v24>
  <div class="apg-account-flash-v24" data-account-flash-v24 role="status"></div>
  <section class="apg-profile-hero-v24" aria-label="My APG profile summary">
    <div class="apg-profile-avatar-v24" data-profile-avatar aria-hidden="true">A</div>
    <div class="apg-profile-identity-v24">
      <span class="apg-profile-eyebrow-v24">My APG profile</span>
      <strong class="apg-profile-email-v24" data-profile-email></strong>
      <div class="apg-profile-badges-v24"><span class="apg-profile-badge-v24" data-profile-verified>Verified email</span><span class="apg-profile-badge-v24 is-neutral">Cross-device sync</span><span class="apg-profile-badge-v24 is-neutral">Account optional</span></div>
    </div>
    <div class="apg-profile-hero-actions-v24"><button class="button" type="button" data-profile-sync>Sync now</button><button class="button secondary" type="button" data-profile-signout>Sign out</button></div>
  </section>
  <nav class="apg-profile-tabs-v24" aria-label="Account settings"><button type="button" data-profile-tab="overview" aria-selected="true">Overview</button><button type="button" data-profile-tab="security" aria-selected="false">Security</button><button type="button" data-profile-tab="privacy" aria-selected="false">Privacy & data</button></nav>
  <section class="apg-profile-view-v24" data-profile-view="overview">
    <div class="apg-profile-grid-v24">
      <article class="apg-profile-card-v24"><h3>Account details</h3><p>Your My APG identity is deliberately minimal.</p><div class="apg-profile-detail-list-v24"><div class="apg-profile-detail-v24"><span>Email</span><strong data-profile-email-detail></strong></div><div class="apg-profile-detail-v24"><span>Email status</span><strong data-profile-email-status></strong></div><div class="apg-profile-detail-v24"><span>Member since</span><strong data-profile-created></strong></div><div class="apg-profile-detail-v24"><span>Last sign-in</span><strong data-profile-last-signin></strong></div></div></article>
      <article class="apg-profile-card-v24"><h3>Synced research</h3><p>Your cloud workspace is tied to this account and protected by per-user access controls.</p><div class="apg-profile-stats-v24"><div class="apg-profile-stat-v24"><strong data-profile-count-saved>0</strong><span>saved items</span></div><div class="apg-profile-stat-v24"><strong data-profile-count-compare>0</strong><span>compare items</span></div><div class="apg-profile-stat-v24"><strong data-profile-count-decisions>0</strong><span>decisions</span></div><div class="apg-profile-stat-v24"><strong data-profile-count-recent>0</strong><span>recent items</span></div></div><div class="apg-profile-callout-v24"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7 10 17l-5-5"/></svg><div><strong>Sync is available across signed-in devices</strong><span data-profile-last-sync>No synced items yet.</span></div></div></article>
      <article class="apg-profile-card-v24 is-wide is-soft"><h3>What your account changes</h3><p>It lets you carry selected My APG research across devices. It does not change product suitability, retailer ranking or affiliate weighting. You can continue using Australian Product Guide without an account.</p></article>
    </div>
  </section>
  <section class="apg-profile-view-v24" data-profile-view="security" hidden>
    <div class="apg-profile-grid-v24">
      <article class="apg-profile-card-v24"><h3>Password & sign-in</h3><p>Change your password while signed in. Your existing session is stored using secure HttpOnly cookies.</p><form class="apg-profile-form-v24" data-profile-password-form><label>New password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label><div class="apg-profile-form-actions-v24"><button class="button" type="submit">Update password</button></div><span class="apg-profile-form-note-v24">Use at least 8 characters. Australian Product Guide does not store your password in its own database.</span></form></article>
      <article class="apg-profile-card-v24"><h3>Current session</h3><p>Sign out when using a shared device. Signing out does not erase this browser's local research.</p><div class="apg-profile-detail-list-v24"><div class="apg-profile-detail-v24"><span>Sign-in method</span><strong data-profile-provider>Email & password</strong></div><div class="apg-profile-detail-v24"><span>Last sign-in</span><strong data-profile-security-last-signin></strong></div></div><div class="apg-profile-actions-v24"><button class="button secondary" type="button" data-profile-signout>Sign out on this device</button><button class="apg-profile-link-v24" type="button" data-profile-forgot>Send password reset email</button></div></article>
    </div>
  </section>
  <section class="apg-profile-view-v24" data-profile-view="privacy" hidden>
    <div class="apg-profile-grid-v24">
      <article class="apg-profile-card-v24"><h3>Communication preferences</h3><p>Account and security emails are operational messages. Product-research updates are a separate optional choice.</p><div class="apg-profile-switch-row-v24"><div><strong>Product research updates</strong><span>Occasional APG product-research and buying-guide updates when this delivery capability is activated and verified.</span></div><label class="apg-profile-switch-v24"><input type="checkbox" data-profile-email-updates><span>Allow updates</span></label></div></article>
      <article class="apg-profile-card-v24"><h3>Your data</h3><p>Download a readable copy of the My APG information available to this signed-in browser.</p><div class="apg-profile-data-list-v24"><div class="apg-profile-data-item-v24"><div class="apg-profile-data-icon-v24">A</div><div><strong>Account information</strong><span>Email, verification status and account timestamps.</span></div></div><div class="apg-profile-data-item-v24"><div class="apg-profile-data-icon-v24">S</div><div><strong>Synced workspace</strong><span>Saved, comparison, recent and Decision Lab records linked to this account.</span></div></div><div class="apg-profile-data-item-v24"><div class="apg-profile-data-icon-v24">L</div><div><strong>Browser-local workspace</strong><span>Local My APG research on this device is included separately.</span></div></div></div><div class="apg-profile-actions-v24"><button class="button secondary" type="button" data-profile-export>Download my APG data</button></div></article>
      <article class="apg-profile-card-v24 is-wide is-danger"><h3>Delete account</h3><p>Permanent deletion removes your My APG authentication account and synced APG cloud records. Browser-local research is separate; you can choose whether to clear it at the same time.</p><div class="apg-profile-actions-v24"><button class="button secondary" type="button" data-profile-delete-open>Start account deletion</button></div><div class="apg-delete-panel-v24" data-profile-delete-panel><h4>Confirm permanent account deletion</h4><p>For security, enter your current password and type <strong>DELETE</strong>. Your password is used only to re-confirm your sign-in before deletion and is not stored by APG.</p><div class="apg-delete-confirm-v24"><label>Current password<input type="password" autocomplete="current-password" data-profile-delete-password></label><label>Type DELETE to confirm<input type="text" autocomplete="off" autocapitalize="characters" data-profile-delete-text></label><label class="apg-delete-local-v24"><input type="checkbox" data-profile-delete-local><span>Also clear My APG browser-local research on this device</span></label><div class="apg-delete-actions-v24"><button class="button secondary" type="button" data-profile-delete-cancel>Cancel</button><button class="button apg-delete-button-v24" type="button" data-profile-delete-confirm disabled>Permanently delete account</button></div></div></div></article>
    </div>
  </section>
  <p class="apg-profile-message-v24" data-profile-message aria-live="polite"></p>
</div>`}
function verificationShell(){return `<section class="apg-verification-v24" data-verification-v24 aria-live="polite"><div class="apg-verification-icon-v24" aria-hidden="true">✓</div><div><h3>Check your email to finish creating your account</h3><p>We've requested a confirmation email for:</p><strong class="apg-verification-email-v24" data-verification-email></strong><div class="apg-verification-steps-v24"><div class="apg-verification-step-v24"><b>1</b><span>Open the Australian Product Guide confirmation email.</span></div><div class="apg-verification-step-v24"><b>2</b><span>Select the confirmation button once.</span></div><div class="apg-verification-step-v24"><b>3</b><span>You'll return to My APG signed in, ready to sync your research.</span></div></div><div class="apg-verification-actions-v24"><button class="button secondary" type="button" data-verification-resend>Resend confirmation</button><button class="apg-account-link" type="button" data-verification-change>Use a different email</button></div><p class="apg-verification-status-v24" data-verification-status></p></div></section>`}
function ensureVerification(root){
  const out=q('[data-account-signed-out]',root);if(!out)return null;
  let panel=q('[data-verification-v24]',out);if(!panel){out.insertAdjacentHTML('beforeend',verificationShell());panel=q('[data-verification-v24]',out);}return panel;
}
function pendingEmail(){return String(sessionStorage.getItem('apgPendingConfirmationEmail')||'').trim()}
function showVerification(root,email){
  const panel=ensureVerification(root);if(!panel||!email)return;
  panel.classList.add('is-open');q('[data-verification-email]',panel).textContent=email;sessionStorage.setItem('apgPendingConfirmationEmail',email);
}
function hideVerification(root,clear=false){const panel=q('[data-verification-v24]',root);panel?.classList.remove('is-open');if(clear)sessionStorage.removeItem('apgPendingConfirmationEmail')}
function setFlash(root){
  const raw=sessionStorage.getItem('apgAccountFlash');if(!raw)return;
  sessionStorage.removeItem('apgAccountFlash');let data={message:raw};try{data=JSON.parse(raw)}catch{}
  const el=q('[data-account-flash-v24]',root);if(el){el.textContent=data.message||'';el.classList.add('is-open');}
}
function switchTab(root,name){
  qa('[data-profile-tab]',root).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.profileTab===name)));
  qa('[data-profile-view]',root).forEach(v=>v.hidden=v.dataset.profileView!==name);
}
function localWorkspace(){const out={};for(const [name,key] of Object.entries(LOCAL_KEYS))out[name]=readLocal(key);return out}
function clearLocalWorkspace(){for(const key of Object.values(LOCAL_KEYS))localStorage.removeItem(key);window.dispatchEvent(new Event('apg-workspace-synced'))}
function downloadExport(data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`my-apg-data-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
async function getProfileBundle(){
  const [profile,workspace,preferences]=await Promise.all([api('/api/account/profile'),api('/api/account/workspace'),api('/api/account/preferences').catch(()=>({email_updates:false}))]);
  return {profile:profile.profile||{},items:workspace.items||[],preferences};
}
function renderBundle(root,bundle){
  const p=bundle.profile||{},items=bundle.items||[],counts=countTypes(items),last=latestSync(items),profile=q('[data-profile-v24]',root);
  if(!profile)return;
  q('[data-profile-email]',profile).textContent=p.email||'';q('[data-profile-email-detail]',profile).textContent=p.email||'';q('[data-profile-avatar]',profile).textContent=initials(p.email);
  const verified=q('[data-profile-verified]',profile);verified.textContent=p.email_verified?'Verified email':'Email verification pending';verified.classList.toggle('is-warn',!p.email_verified);
  q('[data-profile-email-status]',profile).textContent=p.email_verified?(p.email_confirmed_at?`Verified ${formatDate(p.email_confirmed_at)}`:'Verified'):'Verification pending';
  q('[data-profile-created]',profile).textContent=formatDate(p.created_at);q('[data-profile-last-signin]',profile).textContent=formatDateTime(p.last_sign_in_at);q('[data-profile-security-last-signin]',profile).textContent=formatDateTime(p.last_sign_in_at);
  q('[data-profile-provider]',profile).textContent=(p.providers||[]).length?(p.providers||[]).map(x=>x==='email'?'Email & password':x).join(', '):'Email & password';
  q('[data-profile-count-saved]',profile).textContent=String(counts.saved);q('[data-profile-count-compare]',profile).textContent=String(counts.compare);q('[data-profile-count-decisions]',profile).textContent=String(counts.decisions);q('[data-profile-count-recent]',profile).textContent=String(counts.recent);
  q('[data-profile-last-sync]',profile).textContent=last?`Latest synced record: ${formatDateTime(last)}.`:'No synced records yet. Select “Sync now” when you want to upload eligible My APG research from this browser.';
  const toggle=q('[data-profile-email-updates]',profile);if(toggle)toggle.checked=!!bundle.preferences?.email_updates;
  root.dataset.v24Email=p.email||'';root.__apgV24Bundle=bundle;lastProfileKey=JSON.stringify([p.email,p.updated_at,items.length,bundle.preferences?.email_updates]);
}
async function renderSignedIn(root){
  const signed=q('[data-account-signed-in]',root);if(!signed||signed.hidden)return false;
  if(!q('[data-profile-v24]',signed))signed.insertAdjacentHTML('afterbegin',profileShell());
  root.classList.add('apg-profile-ready-v24');
  const head=q('.apg-account-head',root);if(head){const h=q('h2',head),p=q('p:not(.kicker)',head);if(h)h.textContent='Your My APG profile & settings.';if(p)p.textContent='Manage synced research, sign-in security, communication preferences and privacy controls in one place.';}
  const bundle=await getProfileBundle();renderBundle(root,bundle);hideVerification(root,true);setFlash(root);return true;
}
async function refreshState(root){
  clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{
    try{
      const signed=q('[data-account-signed-in]',root);if(signed&&!signed.hidden){await renderSignedIn(root);return;}
      root.classList.remove('apg-profile-ready-v24');
      const email=pendingEmail();if(email)showVerification(root,email);
      const msg=q('[data-account-message]',root)?.textContent||'';
      if(/check your email|confirm the address/i.test(msg)){const formEmail=q('[data-account-form] input[name="email"]',root)?.value.trim();if(formEmail)showVerification(root,formEmail);}
    }catch{}
  },120);
}
function bind(root){
  q('[data-account-form]',root)?.addEventListener('submit',()=>{if(root.dataset.mode==='signup'){const email=q('[data-account-form] input[name="email"]',root)?.value.trim();if(email)sessionStorage.setItem('apgPendingConfirmationEmail',email);setTimeout(()=>refreshState(root),500);}});
  const observer=new MutationObserver(()=>refreshState(root));observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden'],characterData:true});
  root.addEventListener('click',async event=>{
    const t=event.target.closest('button,a');if(!t)return;
    if(t.matches('[data-profile-tab]')){switchTab(root,t.dataset.profileTab);return;}
    if(t.matches('[data-verification-change]')){hideVerification(root,true);q('[data-account-form] input[name="email"]',root)?.focus();return;}
    if(t.matches('[data-verification-resend]')){const panel=q('[data-verification-v24]',root),status=q('[data-verification-status]',panel),email=pendingEmail()||q('[data-account-form] input[name="email"]',root)?.value.trim();if(!email)return;if(status)status.textContent='Requesting a new confirmation email…';try{const data=await api('/api/account/resend-confirmation',{method:'POST',body:JSON.stringify({email})});if(status)status.textContent=data.message||'Confirmation email requested.';}catch(err){if(status)status.textContent=err.message;}return;}
    if(t.matches('[data-profile-sync]')){const legacy=q('[data-account-sync]',root);if(legacy){legacy.click();setProfileMessage(root,'Sync requested.','success');setTimeout(()=>renderSignedIn(root).catch(()=>{}),700);}return;}
    if(t.matches('[data-profile-signout]')){try{await api('/api/account/logout',{method:'POST',body:'{}'});sessionStorage.setItem('apgAccountFlash',JSON.stringify({message:'Signed out. Your browser-local My APG research remains on this device.'}));location.reload();}catch(err){setProfileMessage(root,err.message,'error')}return;}
    if(t.matches('[data-profile-forgot]')){const email=root.dataset.v24Email||'';try{const data=await api('/api/account/recover',{method:'POST',body:JSON.stringify({email})});setProfileMessage(root,data.message||'Password reset email requested.','success');}catch(err){setProfileMessage(root,err.message,'error')}return;}
    if(t.matches('[data-profile-export]')){try{const bundle=root.__apgV24Bundle||await getProfileBundle();downloadExport({exported_at:new Date().toISOString(),account:bundle.profile,synced_workspace:bundle.items,communication_preferences:bundle.preferences,browser_local_workspace:localWorkspace()});setProfileMessage(root,'Your My APG data export has been prepared.','success');}catch(err){setProfileMessage(root,err.message,'error')}return;}
    if(t.matches('[data-profile-delete-open]')){q('[data-profile-delete-panel]',root)?.classList.add('is-open');q('[data-profile-delete-password]',root)?.focus();return;}
    if(t.matches('[data-profile-delete-cancel]')){const panel=q('[data-profile-delete-panel]',root);panel?.classList.remove('is-open');const pw=q('[data-profile-delete-password]',root),txt=q('[data-profile-delete-text]',root);if(pw)pw.value='';if(txt)txt.value='';const b=q('[data-profile-delete-confirm]',root);if(b)b.disabled=true;return;}
    if(t.matches('[data-profile-delete-confirm]')){const email=root.dataset.v24Email||'',password=q('[data-profile-delete-password]',root)?.value||'',typed=q('[data-profile-delete-text]',root)?.value.trim()||'',clearLocal=!!q('[data-profile-delete-local]',root)?.checked;if(typed!=='DELETE'){setProfileMessage(root,'Type DELETE exactly to confirm permanent account deletion.','error');return}if(!password){setProfileMessage(root,'Enter your current password to confirm your identity.','error');return}t.disabled=true;setProfileMessage(root,'Re-confirming your sign-in and deleting the account…');try{await api('/api/account/login',{method:'POST',body:JSON.stringify({email,password})});const pw=q('[data-profile-delete-password]',root);if(pw)pw.value='';await api('/api/account/delete',{method:'POST',body:'{}'});if(clearLocal)clearLocalWorkspace();sessionStorage.removeItem('apgPendingConfirmationEmail');sessionStorage.setItem('apgAccountFlash',JSON.stringify({message:clearLocal?'Your My APG account, synced cloud data and browser-local research were deleted.':'Your My APG account and synced cloud data were deleted. Browser-local research was kept on this device.'}));location.reload();}catch(err){const pw=q('[data-profile-delete-password]',root);if(pw)pw.value='';t.disabled=false;setProfileMessage(root,err.message,'error')}return;}
  });
  root.addEventListener('input',event=>{if(event.target.matches('[data-profile-delete-text]')){const b=q('[data-profile-delete-confirm]',root);if(b)b.disabled=event.target.value.trim()!=='DELETE';}});
  root.addEventListener('change',async event=>{if(event.target.matches('[data-profile-email-updates]')){const old=!event.target.checked;try{await api('/api/account/preferences',{method:'POST',body:JSON.stringify({email_updates:event.target.checked})});setProfileMessage(root,event.target.checked?'Product-research update preference saved.':'Product-research updates switched off.','success');if(root.__apgV24Bundle)root.__apgV24Bundle.preferences.email_updates=event.target.checked;}catch(err){event.target.checked=old;setProfileMessage(root,err.message,'error')}}});
  root.addEventListener('submit',async event=>{if(event.target.matches('[data-profile-password-form]')){event.preventDefault();const input=event.target.password;try{await api('/api/account/password',{method:'POST',body:JSON.stringify({password:input.value})});input.value='';setProfileMessage(root,'Password updated successfully.','success');}catch(err){setProfileMessage(root,err.message,'error')}}});
}
function start(){
  let attempts=0;const timer=setInterval(()=>{const root=q('[data-account-shell]');if(root){clearInterval(timer);ensureVerification(root);bind(root);refreshState(root);const email=pendingEmail();if(email)showVerification(root,email);}else if(++attempts>80)clearInterval(timer);},50);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
