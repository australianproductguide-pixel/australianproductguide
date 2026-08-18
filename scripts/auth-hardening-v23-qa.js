const assert=require('assert');
const fs=require('fs');
const path=require('path');

const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=read('api/index.js');
const auth=read('lib/auth-hardening-v23.js');
const account=read('lib/account-platform.js');
const confirmation=read('docs/auth-email-templates/confirmation.html');
const recovery=read('docs/auth-email-templates/recovery.html');
const config=read('docs/APG-AUTH-PRODUCTION-CONFIG.md');
const architecture=read('docs/APG-ACCOUNT-ARCHITECTURE.md');
const profilePath=path.join(__dirname,'../lib/account-profile-v24.js');
const profile=fs.existsSync(profilePath)?fs.readFileSync(profilePath,'utf8'):'';
const governancePath=path.join(__dirname,'../lib/account-governance-v25.js');
const governance=fs.existsSync(governancePath)?fs.readFileSync(governancePath,'utf8'):'';
const cohesionPath=path.join(__dirname,'../lib/platform-cohesion-v26.js');
const cohesion=fs.existsSync(cohesionPath)?fs.readFileSync(cohesionPath,'utf8'):'';
const v27Path=path.join(__dirname,'../lib/evidence-commerce-depth-v27.js');
const v27=fs.existsSync(v27Path)?fs.readFileSync(v27Path,'utf8'):'';
const v28Path=path.join(__dirname,'../lib/trust-infrastructure-v28.js');
const v28=fs.existsSync(v28Path)?fs.readFileSync(v28Path,'utf8'):'';

const directV23=api.includes("require('../lib/auth-hardening-v23')");
const layeredV23=api.includes("require('../lib/account-profile-v24')")&&profile.includes("require('./auth-hardening-v23')");
const layeredV25=api.includes("require('../lib/account-governance-v25')")&&governance.includes("require('./account-profile-v24')")&&profile.includes("require('./auth-hardening-v23')");
const layeredV26=api.includes("require('../lib/platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')")&&governance.includes("require('./account-profile-v24')")&&profile.includes("require('./auth-hardening-v23')");
const v27Chain=v27.includes("require('./platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')")&&governance.includes("require('./account-profile-v24')")&&profile.includes("require('./auth-hardening-v23')");
const layeredV27=api.includes("require('../lib/evidence-commerce-depth-v27')")&&v27Chain;
const layeredV28=api.includes("require('../lib/trust-infrastructure-v28')")&&v28.includes("require('./evidence-commerce-depth-v27')")&&v27Chain;
assert(directV23||layeredV23||layeredV25||layeredV26||layeredV27||layeredV28,'api/index.js must preserve auth hardening v23 directly or through the current account/platform wrapper chain');
assert(auth.includes("require('./site-surface-polish-v22')"),'v23 must preserve the complete v22 site implementation chain');
assert(auth.includes("path==='/auth/confirm'"),'first-party auth callback must be routed');
assert(auth.includes("new Set(['email','recovery'])"),'callback must restrict accepted email action types');
assert(auth.includes("/auth/v1/verify"),'callback must exchange token hashes with Supabase Auth');
assert(auth.includes('HttpOnly; Secure; SameSite=Lax'),'access token cookie must remain HttpOnly, Secure and SameSite=Lax');
assert(auth.includes('HttpOnly; Secure; SameSite=Strict'),'refresh token cookie must remain HttpOnly, Secure and SameSite=Strict');
assert(auth.includes("'X-Robots-Tag','noindex, nofollow'"),'auth callback must be excluded from indexing');
assert(auth.includes("'Referrer-Policy','no-referrer'"),'auth callback must not leak token-bearing URLs via referrers');
assert(!auth.includes('http://localhost'),'active auth hardening must never point at localhost');

const confirmUrl='https://australianproductguide.au/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email';
const recoveryUrl='https://australianproductguide.au/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery';
assert(confirmation.includes(confirmUrl),'confirmation email must use the first-party APG token-hash callback');
assert(recovery.includes(recoveryUrl),'recovery email must use the first-party APG token-hash callback');
assert(!confirmation.toLowerCase().includes('powered by supabase'),'consumer confirmation template must not expose generic Supabase footer branding');
assert(!recovery.toLowerCase().includes('powered by supabase'),'consumer recovery template must not expose generic Supabase footer branding');
assert(confirmation.includes('Creating an account does not subscribe you to marketing'),'confirmation email must preserve separate marketing consent');
assert(!confirmation.includes('localhost')&&!recovery.includes('localhost'),'production auth templates must never contain localhost');

assert(config.includes('**Site URL:** `https://australianproductguide.au`'),'production Auth config must specify the canonical Site URL');
assert(config.includes('**Additional Redirect URL:** `https://australianproductguide.au/my-apg/`'),'production Auth config must specify exact My APG redirect');
assert(config.includes('Confirm your Australian Product Guide account'),'production config must specify the branded confirmation subject');
assert(config.includes('Reset your Australian Product Guide password'),'production config must specify the branded recovery subject');
assert(config.includes('No SMTP provider should be purchased or contractually activated without owner approval.'),'SMTP commercial activation must remain approval-gated');

assert(architecture.includes('**Status:** CURRENT / ACTIVATED'),'account architecture must reflect current activation state');
assert(architecture.includes('Account status must never affect product suitability, retailer ranking or affiliate weighting.'),'account architecture must preserve recommendation neutrality');

assert(account.includes("PRIMARY_ORIGIN='https://australianproductguide.au'"),'base account implementation must keep the canonical production origin');
assert(account.includes("PRIMARY_ORIGIN+'/my-apg/'"),'base account implementation must request My APG as signup/recovery redirect');
assert(account.includes("if(raw.includes('email not confirmed'))return 'Please confirm your email address before signing in.'"),'unconfirmed sign-in must return a clear consumer message');
assert(account.includes("email_updates:enabled"),'communication preference must remain separately stored');
assert(account.includes("'/functions/v1/delete-account'"),'account deletion path must remain wired');

console.log('APG auth hardening v23 QA passed');