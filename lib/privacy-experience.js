const app=require('./accessibility-final');

const ASSET_JS='/assets/privacy-experience.js';
const ASSET_CSS='/assets/privacy-experience.css';

const css=`
/* APG privacy consent + delayed optional account invitation */
.apg-consent{position:fixed;left:18px;right:18px;bottom:18px;z-index:1200;display:flex;justify-content:center;pointer-events:none}
.apg-consent[hidden],.apg-account-nudge[hidden]{display:none!important}
.apg-consent-card{pointer-events:auto;width:min(760px,100%);border:1px solid #cfdcda;border-radius:20px;background:#fff;color:#173746;box-shadow:0 18px 55px rgba(8,39,53,.20);padding:22px}
.apg-consent-top{display:flex;gap:16px;justify-content:space-between;align-items:flex-start}
.apg-consent-copy{max-width:610px}.apg-consent-kicker{margin:0 0 5px;color:#557079;font-size:.76rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.apg-consent h2{margin:0 0 8px;color:#082735;font-size:1.25rem;line-height:1.25}.apg-consent p{margin:0;color:#4a626b;font-size:.94rem;line-height:1.55}.apg-consent a{color:#0b5369;text-decoration:underline;text-underline-offset:2px}
.apg-consent-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}.apg-consent button{min-height:44px;border-radius:11px;border:1px solid #9eb3b4;padding:10px 14px;background:#fff;color:#173746;font:inherit;font-weight:800;cursor:pointer}.apg-consent button:hover{border-color:#496a72}.apg-consent .apg-consent-primary{background:#0b5268;border-color:#0b5268;color:#fff}.apg-consent .apg-consent-primary:hover{background:#083f50}.apg-consent .apg-consent-text{border-color:transparent;background:transparent;text-decoration:underline;text-underline-offset:3px}
.apg-consent-manage{margin-top:18px;padding-top:18px;border-top:1px solid #e1e9e8}.apg-consent-row{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;padding:12px 0}.apg-consent-row+.apg-consent-row{border-top:1px solid #edf2f1}.apg-consent-row strong{display:block;color:#173746}.apg-consent-row small{display:block;margin-top:3px;color:#60777f;line-height:1.45}.apg-consent-switch{display:flex;align-items:center;gap:8px;font-weight:800}.apg-consent-switch input{width:20px;height:20px;accent-color:#0b5268}.apg-consent-switch input:disabled{opacity:.7}
.apg-cookie-footer-wrap{margin-top:8px}.apg-cookie-footer-button{border:0;background:transparent;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px 0;opacity:.92}.apg-cookie-footer-button:hover{opacity:1}
.apg-account-nudge{position:fixed;right:20px;bottom:20px;z-index:1050;width:min(390px,calc(100vw - 32px));border:1px solid #cbd9d8;border-radius:18px;background:#fff;color:#173746;box-shadow:0 18px 50px rgba(8,39,53,.18);padding:20px}.apg-account-nudge-kicker{margin:0 0 5px;color:#8c5a00;font-size:.74rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.apg-account-nudge h2{margin:0 26px 7px 0;color:#082735;font-size:1.18rem;line-height:1.3}.apg-account-nudge p{margin:0;color:#506970;line-height:1.5;font-size:.93rem}.apg-account-nudge-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.apg-account-nudge a,.apg-account-nudge button{min-height:42px;border-radius:10px;padding:9px 13px;font:inherit;font-weight:800}.apg-account-nudge a{display:inline-flex;align-items:center;text-decoration:none;background:#0b5268;color:#fff;border:1px solid #0b5268}.apg-account-nudge button{background:#fff;color:#294b58;border:1px solid #b3c4c4;cursor:pointer}.apg-account-nudge-close{position:absolute;right:12px;top:10px!important;min-height:auto!important;border:0!important;padding:6px!important;background:transparent!important;font-size:1.25rem!important;line-height:1!important;color:#526b74!important}.apg-account-nudge-note{display:block;margin-top:10px;color:#687e85;font-size:.78rem;line-height:1.4}
@media(max-width:640px){.apg-consent{left:0;right:0;bottom:0}.apg-consent-card{border-radius:20px 20px 0 0;border-left:0;border-right:0;border-bottom:0;padding:20px 18px}.apg-consent-actions{display:grid;grid-template-columns:1fr}.apg-consent button{width:100%}.apg-consent-row{grid-template-columns:1fr;gap:8px}.apg-consent-switch{justify-content:flex-start}.apg-account-nudge{left:12px;right:12px;bottom:12px;width:auto}}
@media(prefers-reduced-motion:no-preference){.apg-consent-card,.apg-account-nudge{animation:apgPrivacyEnter .2s ease-out}@keyframes apgPrivacyEnter{from{transform:translateY(10px);opacity:.4}to{transform:none;opacity:1}}}
`;

const clientJs=`
;(()=>{
const COOKIE='apg_cookie_preferences';
const VERSION='2026-08-17-v1';
const NUDGE_KEY='apg_account_nudge_v1';
const SIX_MONTHS=15552000;
const THIRTY_DAYS=2592000000;
const qs=(s,r=document)=>r.querySelector(s);
function safeParse(raw){try{return JSON.parse(raw)}catch{return null}}
function readCookie(){const part=document.cookie.split('; ').find(x=>x.startsWith(COOKIE+'='));if(!part)return null;try{return safeParse(decodeURIComponent(part.slice(COOKIE.length+1)))}catch{return null}}
function readConsent(){const c=readCookie();if(c&&c.version===VERSION&&typeof c.analytics==='boolean')return c;try{const l=safeParse(localStorage.getItem(COOKIE)||'');if(l&&l.version===VERSION&&typeof l.analytics==='boolean')return l}catch{}return null}
function writeConsent(analytics){const value={version:VERSION,analytics:!!analytics,updated_at:new Date().toISOString()};const encoded=encodeURIComponent(JSON.stringify(value));document.cookie=COOKIE+'='+encoded+'; Path=/; Max-Age='+SIX_MONTHS+'; SameSite=Lax; Secure';try{localStorage.setItem(COOKIE,JSON.stringify(value))}catch{}return value}
function removeGaCookies(){document.cookie.split(';').forEach(raw=>{const name=raw.split('=')[0].trim();if(!/^_ga(?:_|$)/.test(name))return;const domains=[location.hostname,'.'+location.hostname.replace(/^www\\./,''),'.australianproductguide.au'];for(const domain of domains){document.cookie=name+'=; Path=/; Max-Age=0; SameSite=Lax; domain='+domain}document.cookie=name+'=; Path=/; Max-Age=0; SameSite=Lax'});}
function applyConsent(value){if(value&&value.analytics){if(typeof window.apgLoadGoogleAnalytics==='function')window.apgLoadGoogleAnalytics();return}if(typeof window.gtag==='function')window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});removeGaCookies();}
function consentMarkup(){return '<section class="apg-consent" data-apg-consent role="dialog" aria-modal="false" aria-labelledby="apgConsentTitle"><div class="apg-consent-card"><div class="apg-consent-top"><div class="apg-consent-copy"><p class="apg-consent-kicker">Privacy choices</p><h2 id="apgConsentTitle">You choose how APG measures website use.</h2><p>Australian Product Guide uses essential browser storage for core features. With your permission, Google Analytics helps us understand aggregate usage and improve the site. We do not use advertising pixels or cross-site tracking. <a href="/privacy/#cookies">Read our privacy information</a>.</p></div></div><div class="apg-consent-actions"><button type="button" class="apg-consent-primary" data-consent-allow>Allow analytics</button><button type="button" data-consent-essential>Necessary only</button><button type="button" class="apg-consent-text" data-consent-manage>Manage choices</button></div><div class="apg-consent-manage" data-consent-panel hidden><div class="apg-consent-row"><div><strong>Essential storage</strong><small>Used for privacy preferences, account sessions when you sign in, and browser-local product research features. Core APG remains available.</small></div><label class="apg-consent-switch"><input type="checkbox" checked disabled aria-label="Essential storage is always on"><span>Always on</span></label></div><div class="apg-consent-row"><div><strong>Analytics</strong><small>Allows privacy-minimised Google Analytics measurement. Advertising storage and personalisation remain off.</small></div><label class="apg-consent-switch"><input type="checkbox" data-consent-analytics><span>Allow</span></label></div><div class="apg-consent-actions"><button type="button" class="apg-consent-primary" data-consent-save>Save choices</button><button type="button" data-consent-close>Cancel</button></div></div></div></section>'}
function ensureConsentUi(){let root=qs('[data-apg-consent]');if(root)return root;document.body.insertAdjacentHTML('beforeend',consentMarkup());root=qs('[data-apg-consent]');bindConsent(root);return root}
function closeConsent(root){if(root)root.hidden=true;scheduleAccountNudge()}
function openManager(){const root=ensureConsentUi(),panel=qs('[data-consent-panel]',root),stored=readConsent();root.hidden=false;panel.hidden=false;qs('[data-consent-analytics]',root).checked=!!stored?.analytics;setTimeout(()=>qs('[data-consent-analytics]',root)?.focus(),0)}
function bindConsent(root){if(!root||root.dataset.bound)return;root.dataset.bound='1';qs('[data-consent-allow]',root)?.addEventListener('click',()=>{const value=writeConsent(true);applyConsent(value);closeConsent(root)});qs('[data-consent-essential]',root)?.addEventListener('click',()=>{const value=writeConsent(false);applyConsent(value);closeConsent(root)});qs('[data-consent-manage]',root)?.addEventListener('click',()=>{const panel=qs('[data-consent-panel]',root);panel.hidden=false;qs('[data-consent-analytics]',root).checked=!!readConsent()?.analytics;qs('[data-consent-analytics]',root)?.focus()});qs('[data-consent-save]',root)?.addEventListener('click',()=>{const value=writeConsent(!!qs('[data-consent-analytics]',root)?.checked);applyConsent(value);closeConsent(root)});qs('[data-consent-close]',root)?.addEventListener('click',()=>{const panel=qs('[data-consent-panel]',root);panel.hidden=true;if(readConsent())closeConsent(root)})}
function nudgeState(){try{return safeParse(localStorage.getItem(NUDGE_KEY)||'')||{}}catch{return {}}}
function saveNudge(state){try{localStorage.setItem(NUDGE_KEY,JSON.stringify(state))}catch{}}
function nudgeEligiblePath(){return !['/my-apg/','/privacy/','/terms/'].includes(location.pathname)}
function accountNudgeMarkup(){return '<aside class="apg-account-nudge" data-account-nudge aria-label="Optional Australian Product Guide account" hidden><button type="button" class="apg-account-nudge-close" data-account-nudge-dismiss aria-label="Dismiss account invitation">×</button><p class="apg-account-nudge-kicker">Optional account</p><h2>Keep your product shortlist across devices.</h2><p>Create a free My APG account when you want your saved products, comparisons and Decision Lab research available on another signed-in device.</p><div class="apg-account-nudge-actions"><a href="/my-apg/?mode=signup" data-account-nudge-create>Create account</a><button type="button" data-account-nudge-dismiss>Not now</button></div><small class="apg-account-nudge-note">No account is required to browse or compare. Creating an account does not subscribe you to marketing and does not change recommendations.</small></aside>'}
async function showAccountNudge(){if(!nudgeEligiblePath()||!readConsent()||qs('[data-apg-consent]:not([hidden])'))return;const state=nudgeState(),now=Date.now();if((state.dismissedUntil||0)>now||(state.lastShown||0)>now-THIRTY_DAYS)return;try{const r=await fetch('/api/account/me',{credentials:'same-origin',headers:{Accept:'application/json'}});if(r.ok){const data=await r.json();if(data.authenticated)return}}catch{}if(!qs('[data-account-nudge]'))document.body.insertAdjacentHTML('beforeend',accountNudgeMarkup());const root=qs('[data-account-nudge]');if(!root)return;root.hidden=false;state.lastShown=now;saveNudge(state);root.querySelectorAll('[data-account-nudge-dismiss]').forEach(btn=>btn.addEventListener('click',()=>{root.hidden=true;const s=nudgeState();s.dismissedUntil=Date.now()+THIRTY_DAYS;saveNudge(s)},{once:true}));qs('[data-account-nudge-create]',root)?.addEventListener('click',()=>{const s=nudgeState();s.dismissedUntil=Date.now()+THIRTY_DAYS;saveNudge(s)},{once:true})}
let nudgeTimer=0;
function scheduleAccountNudge(){if(nudgeTimer||!nudgeEligiblePath()||!readConsent())return;const state=nudgeState(),now=Date.now();if(!state.firstSeen)state.firstSeen=now;state.pageViews=Math.min(50,Number(state.pageViews||0)+1);saveNudge(state);if((state.dismissedUntil||0)>now||(state.lastShown||0)>now-THIRTY_DAYS)return;const age=now-state.firstSeen;const wait=state.pageViews>=3?5000:Math.max(5000,90000-age);nudgeTimer=window.setTimeout(()=>{nudgeTimer=0;showAccountNudge()},wait)}
function openSignupMode(){if(location.pathname!=='/my-apg/'||new URLSearchParams(location.search).get('mode')!=='signup')return;let attempts=0;const timer=setInterval(()=>{attempts++;const button=qs('[data-account-tab="signup"]');if(button){button.click();clearInterval(timer);history.replaceState(null,'','/my-apg/')}else if(attempts>20)clearInterval(timer)},100)}
function start(){document.querySelectorAll('[data-apg-cookie-settings]').forEach(btn=>btn.addEventListener('click',openManager));const stored=readConsent();if(stored){applyConsent(stored);scheduleAccountNudge()}else{const root=ensureConsentUi();root.hidden=false}openSignupMode()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
`;

function sendAsset(req,res,type,body){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}

function injectHtml(html){
  let out=String(html||'');
  if(!out.includes(ASSET_CSS)&&out.includes('</head>'))out=out.replace('</head>',`<link rel="stylesheet" href="${ASSET_CSS}"></head>`);
  if(out.includes('</footer>')&&!out.includes('data-apg-cookie-settings'))out=out.replace('</footer>','<div class="apg-cookie-footer-wrap"><button type="button" class="apg-cookie-footer-button" data-apg-cookie-settings>Cookie preferences</button></div></footer>');
  if(!out.includes(ASSET_JS)&&out.includes('</body>'))out=out.replace('</body>',`<script src="${ASSET_JS}" defer></script></body>`);
  return out;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===ASSET_JS)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
  if(path===ASSET_CSS)return sendAsset(req,res,'text/css; charset=utf-8',css);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=injectHtml(body);
    return originalEnd(body,...args);
  };
  return app(req,res);
};
