const assert=require('assert');
const fs=require('fs');
const path=require('path');

const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=read('api/index.js');
const v27Path=path.join(__dirname,'../lib/evidence-commerce-depth-v27.js');
const v27=fs.existsSync(v27Path)?fs.readFileSync(v27Path,'utf8'):'';
const cohesionPath=path.join(__dirname,'../lib/platform-cohesion-v26.js');
const cohesion=fs.existsSync(cohesionPath)?fs.readFileSync(cohesionPath,'utf8'):'';
const governancePath=path.join(__dirname,'../lib/account-governance-v25.js');
const governance=fs.existsSync(governancePath)?fs.readFileSync(governancePath,'utf8'):'';
const profile=read('lib/account-profile-v24.js');
const auth=read('lib/auth-hardening-v23.js');
const account=read('lib/account-platform.js');
const js=read('public/assets/account-profile-v24.js');
const css=read('public/assets/account-profile-v24.css');

const directV24=api.includes("require('../lib/account-profile-v24')");
const viaV25=api.includes("require('../lib/account-governance-v25')")&&governance.includes("require('./account-profile-v24')");
const viaV26=api.includes("require('../lib/platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')")&&governance.includes("require('./account-profile-v24')");
const viaV27=api.includes("require('../lib/evidence-commerce-depth-v27')")&&v27.includes("require('./platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')")&&governance.includes("require('./account-profile-v24')");
assert(directV24||viaV25||viaV26||viaV27,'api/index.js must preserve account profile v24 directly or through the current v25/v26/v27 wrapper chain');
assert(profile.includes("require('./auth-hardening-v23')"),'v24 must compose over auth hardening v23');
assert(auth.includes("require('./site-surface-polish-v22')"),'v23 must continue preserving the site surface chain');
assert(profile.includes("path==='/api/account/profile'"),'v24 must expose a signed-in profile endpoint');
assert(profile.includes("path==='/api/account/resend-confirmation'"),'v24 must expose confirmation-email resend handling');
assert(profile.includes('email_verified:!!user?.email_confirmed_at'),'profile must report verified-email state from Supabase Auth');
assert(profile.includes("HttpOnly; Secure; SameSite=Lax"),'v24 session refresh must preserve secure HttpOnly access cookies');
assert(profile.includes("HttpOnly; Secure; SameSite=Strict"),'v24 session refresh must preserve strict refresh cookies');
assert(profile.includes('Deliberately generic to avoid account enumeration'),'confirmation resend must remain enumeration-resistant');
assert(!profile.includes('SUPABASE_SERVICE_ROLE_KEY'),'v24 application wrapper must not contain a Supabase service-role secret');
assert(profile.includes("PROFILE_JS='/assets/account-profile-v24.js?v=24'"),'v24 JavaScript asset must be versioned');
assert(profile.includes("PROFILE_CSS='/assets/account-profile-v24.css?v=24'"),'v24 stylesheet must be versioned');

for(const label of ['My APG profile','Overview','Security','Privacy & data','Download my APG data','Start account deletion'])assert(js.includes(label),`profile UI must include ${label}`);
assert(js.includes("typed!=='DELETE'"),'account deletion must require an explicit DELETE confirmation phrase');
assert(js.includes("await api('/api/account/login'"),'account deletion must re-confirm the current password before deletion');
assert(js.includes("await api('/api/account/delete'"),'profile must use the existing server-side account deletion route');
assert(js.includes('data-profile-delete-local'),'clearing browser-local data must remain a separate explicit choice');
assert(js.includes('browser_local_workspace:localWorkspace()'),'data export must distinguish browser-local data from synced account data');
assert(js.includes("api('/api/account/password'"),'profile must retain signed-in password-change capability');
assert(js.includes("api('/api/account/preferences'"),'profile must retain separate communication preference controls');
assert(js.includes("api('/api/account/workspace'"),'profile must report synced workspace state');
assert(js.includes('checkSignupResult'),'signup flow must provide a professional pending-confirmation hand-off');
assert(js.includes("api('/api/account/resend-confirmation'"),'pending-confirmation UI must support resend');
assert(!js.includes('access_token')&&!js.includes('refresh_token'),'profile browser code must not handle or persist authentication tokens');
assert(!js.includes('localStorage.setItem')||!js.includes('token'),'profile code must not place authentication tokens in localStorage');

assert(css.includes('.apg-profile-v24'),'profile stylesheet must include the v24 profile system');
assert(css.includes('.apg-delete-panel-v24'),'profile stylesheet must include a dedicated deletion confirmation state');
assert(css.includes('@media(max-width:720px)'),'profile must include mobile responsive treatment');
assert(css.includes('prefers-reduced-motion'),'profile must respect reduced-motion preferences');

assert(account.includes("'/functions/v1/delete-account'"),'base account platform must keep the authenticated deletion edge-function route');
assert(account.includes('Deleting the account removes the authenticated account and cascades deletion'),'privacy disclosure must continue explaining deletion behaviour');

console.log('My APG account profile v24 QA passed');
