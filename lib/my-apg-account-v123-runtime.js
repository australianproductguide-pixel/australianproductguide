'use strict';

// APG My APG Account Journey v123.0
// Owner-approved 29 Aug 2026 consolidation of /my-apg/. This layer removes repeated
// signed-out account explanations, gives the single server-mediated account shell a dedicated
// top-of-page mount, moves the generic Continue rail below account access, and preserves the
// signed-in profile/workspace. It changes presentation/journey ownership only: Supabase auth,
// HttpOnly session cookies, sync APIs, recovery, preferences, deletion, decision logic,
// evidence, retailer pathways and affiliate weighting remain owned by their existing layers.
const VERSION='123.0';
const CSS_PATH='/assets/my-apg-account-v123.css';
const JS_PATH='/assets/my-apg-account-v123.js';
const JOURNEY_JS='/assets/account-journey-v242.js';
const ORIGIN='https://australianproductguide.au';

function compactIntro(){
  return `<div class="wrap apg-my-apg-breadcrumb-v123"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">My Australian Product Guide</span></nav></div><section class="apg-my-apg-entry-v123" aria-labelledby="apgMyApgTitle"><div class="wrap apg-my-apg-entry-inner-v123"><div class="apg-my-apg-intro-v123"><p class="kicker">My Australian Product Guide</p><h1 id="apgMyApgTitle">Your product decision workspace.</h1><p>Use My APG locally without an account, or sign in to sync selected saved products, comparisons and decision research across your devices.</p><div class="apg-my-apg-trust-v123" aria-label="Account principles"><span>Account optional</span><span>Protected cross-device sync</span><span>Deletion available</span></div></div><div class="apg-my-apg-account-mount-v123" data-apg-account-primary-mount><div class="apg-my-apg-loading-v123" data-apg-account-loading role="status">Loading account access…</div></div><p class="apg-my-apg-privacy-note-v123">Signed-out research stays on this browser. Account status and email preferences contribute zero points to product recommendations or retailer ranking. <a href="/privacy/">Privacy</a></p></div></section>`;
}

function workspaceHeading(){
  return `<div class="apg-my-apg-workspace-head-v123"><p class="kicker">Your workspace</p><h2>Continue your product research</h2><p>Saved and recent research on this browser remains available whether or not you create an account.</p></div>`;
}

function transformMyApg(html){
  let out=String(html||'');
  if(!out.includes('data-platform-page="/my-apg/"'))return out;

  out=out.replace(/<section class="section"><div class="wrap"><div class="v5-account-status">[\s\S]*?<\/div><\/div><\/section>/i,'');

  out=out.replace(/<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb">[\s\S]*?<\/nav><\/div><section class="decision-hero workspace-hero">[\s\S]*?<\/section>/i,compactIntro());

  out=out.replace(/<div class="wrap" data-apg-workspace>/i,`<div class="wrap" data-apg-workspace>${workspaceHeading()}`);

  const railMatch=out.match(/<nav class="apg-system-rail"[\s\S]*?<\/nav>/i);
  if(railMatch){
    out=out.replace(railMatch[0],'');
    const workspaceSection='<section class="section"><div class="wrap" data-apg-workspace>';
    if(out.includes(workspaceSection))out=out.replace(workspaceSection,`${railMatch[0]}${workspaceSection}`);
  }

  out=out.replace(/<script src="\/assets\/account-journey-v241\.js\?v=24\.1" defer><\/script>/i,`<script src="${JOURNEY_JS}?v=24.2" defer></script>`);

  if(!out.includes('name="apg-my-apg-account-journey"')){
    out=out.replace('</head>',`<meta name="apg-my-apg-account-journey" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  if(!out.includes(`src="${JS_PATH}`))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  if(!/data-apg-my-apg-account-journey=/.test(out))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-my-apg-account-journey="v${VERSION}"$1>`);
  return out;
}

const CSS=String.raw`
/* APG My APG Account Journey v123.0 */
body[data-platform-page="/my-apg/"] .apg-my-apg-breadcrumb-v123{padding-top:24px;padding-bottom:4px}
body[data-platform-page="/my-apg/"] .apg-my-apg-entry-v123{padding:20px 0 34px;background:linear-gradient(180deg,#f8fbff 0%,#fff 100%)}
body[data-platform-page="/my-apg/"] .apg-my-apg-entry-inner-v123{max-width:1120px}
body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123{max-width:820px;margin-bottom:22px}
body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123 .kicker{margin-bottom:8px;color:#2563eb}
body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123 h1{margin:0 0 12px;color:#0f172a;font-size:clamp(2rem,4vw,3.35rem);line-height:.98;letter-spacing:-.04em}
body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123>p:not(.kicker){max-width:760px;margin:0;color:#536b77;font-size:clamp(1rem,1.8vw,1.2rem);line-height:1.6}
body[data-platform-page="/my-apg/"] .apg-my-apg-trust-v123{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
body[data-platform-page="/my-apg/"] .apg-my-apg-trust-v123 span{display:inline-flex;align-items:center;min-height:34px;padding:6px 11px;border:1px solid #cbdcf5;border-radius:999px;background:#fff;color:#254b80;font-size:.82rem;font-weight:750}
body[data-platform-page="/my-apg/"] .apg-my-apg-account-mount-v123{max-width:900px}
body[data-platform-page="/my-apg/"] .apg-my-apg-loading-v123{padding:22px;border:1px solid #dbe5ef;border-radius:18px;background:#fff;color:#536b77}
body[data-platform-page="/my-apg/"] .apg-my-apg-privacy-note-v123{max-width:900px;margin:12px 0 0;color:#617482;font-size:.88rem;line-height:1.55}
body[data-platform-page="/my-apg/"] .apg-my-apg-privacy-note-v123 a{color:#1d4ed8;font-weight:700}

body[data-platform-page="/my-apg/"] [data-apg-account-primary-mount]>.apg-account-shell{margin:0!important}
body[data-platform-page="/my-apg/"] .apg-account-head{background:linear-gradient(135deg,#0f1b37 0%,#17295a 100%);padding:24px 26px}
body[data-platform-page="/my-apg/"] .apg-account-head h2{font-size:clamp(1.55rem,3vw,2rem)!important;line-height:1.05!important}
body[data-platform-page="/my-apg/"] .apg-account-body{padding:24px 26px}
body[data-platform-page="/my-apg/"] .apg-account-tabs{display:grid;grid-template-columns:1fr 1fr;max-width:390px;margin-bottom:18px;padding:4px;border:1px solid #d5e0ea;border-radius:12px;background:#f4f7fb}
body[data-platform-page="/my-apg/"] .apg-account-tabs button{min-height:44px;border:0!important;border-radius:9px!important;background:transparent!important;color:#526678!important;font-weight:800!important}
body[data-platform-page="/my-apg/"] .apg-account-tabs button[aria-pressed="true"]{background:#fff!important;color:#0f172a!important;box-shadow:0 2px 7px rgba(15,23,42,.10)}
body[data-platform-page="/my-apg/"] .apg-account-form{max-width:640px}
body[data-platform-page="/my-apg/"] .apg-account-form label{font-weight:750;color:#17364a}
body[data-platform-page="/my-apg/"] .apg-account-form input[type="email"],
body[data-platform-page="/my-apg/"] .apg-account-form input[type="password"]{min-height:52px;border-radius:12px}
body[data-platform-page="/my-apg/"] .apg-account-form-actions.full{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
body[data-platform-page="/my-apg/"] .apg-account-form-actions.full .button{min-width:145px}
body[data-platform-page="/my-apg/"] [data-v242-confirm][hidden],
body[data-platform-page="/my-apg/"] [data-v242-account-terms][hidden],
body[data-platform-page="/my-apg/"] [data-signup-consent][hidden]{display:none!important}
body[data-platform-page="/my-apg/"] [data-v242-account-terms]{max-width:640px;margin:0;color:#627484;font-size:.85rem;line-height:1.5}

body[data-platform-page="/my-apg/"] [data-account-panel]{display:none!important}

body[data-platform-page="/my-apg/"] .apg-system-rail{margin-top:0}
body[data-platform-page="/my-apg/"] .apg-my-apg-workspace-head-v123{margin:0 0 24px;padding:4px 0 6px}
body[data-platform-page="/my-apg/"] .apg-my-apg-workspace-head-v123 .kicker{margin-bottom:6px}
body[data-platform-page="/my-apg/"] .apg-my-apg-workspace-head-v123 h2{margin:0 0 6px;color:#0f172a;font-size:clamp(1.7rem,3vw,2.4rem);letter-spacing:-.025em}
body[data-platform-page="/my-apg/"] .apg-my-apg-workspace-head-v123 p:last-child{max-width:720px;margin:0;color:#637685;line-height:1.55}

@media(max-width:760px){
  body[data-platform-page="/my-apg/"] .apg-my-apg-breadcrumb-v123{padding-top:18px}
  body[data-platform-page="/my-apg/"] .apg-my-apg-entry-v123{padding:14px 0 26px}
  body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123{margin-bottom:17px}
  body[data-platform-page="/my-apg/"] .apg-my-apg-intro-v123 h1{font-size:2.35rem;line-height:1.02}
  body[data-platform-page="/my-apg/"] .apg-my-apg-trust-v123{gap:6px}
  body[data-platform-page="/my-apg/"] .apg-my-apg-trust-v123 span{min-height:30px;padding:5px 9px;font-size:.75rem}
  body[data-platform-page="/my-apg/"] .apg-account-head{display:block;padding:20px}
  body[data-platform-page="/my-apg/"] .apg-account-status-badge{display:inline-flex;margin-top:14px}
  body[data-platform-page="/my-apg/"] .apg-account-body{padding:20px}
  body[data-platform-page="/my-apg/"] .apg-account-tabs{max-width:none;width:100%}
  body[data-platform-page="/my-apg/"] .apg-account-form-actions.full{align-items:stretch}
  body[data-platform-page="/my-apg/"] .apg-account-form-actions.full .button{min-width:0;flex:1 1 150px}
  body[data-platform-page="/my-apg/"] .apg-my-apg-privacy-note-v123{font-size:.82rem}
}
`;

const JS=String.raw`
'use strict';(()=>{
  if(window.__APG_MY_APG_ACCOUNT_V123__)return;window.__APG_MY_APG_ACCOUNT_V123__='123.0';
  if(location.pathname!=='/my-apg/')return;
  const q=(s,r=document)=>r.querySelector(s);
  function consolidate(){
    document.querySelectorAll('[data-account-panel]').forEach(el=>el.remove());
    const target=q('[data-apg-account-primary-mount]'),shell=q('[data-account-shell]');
    if(!target||!shell)return false;
    if(shell.parentElement!==target)target.appendChild(shell);
    q('[data-apg-account-loading]',target)?.remove();
    document.body.dataset.apgAccountSurface='single';
    return true;
  }
  if(consolidate())return;
  const observer=new MutationObserver(()=>{if(consolidate())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>{consolidate();observer.disconnect()},5000);
})();`;

function sendAsset(req,res,path){
  const isJs=path===JS_PATH;
  res.statusCode=200;
  res.setHeader('Content-Type',isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-My-APG-Account-Journey','v'+VERSION);
  return res.end(req.method==='HEAD'?'':(isJs?JS:CSS));
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('My APG Account v123 requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/',ORIGIN).pathname}catch{}
    if((path===CSS_PATH||path===JS_PATH)&&(req.method==='GET'||req.method==='HEAD'))return sendAsset(req,res,path);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(path==='/my-apg/'&&req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformMyApg(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-My-APG-Account-Journey','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{MY_APG_ACCOUNT_JOURNEY_VERSION:VERSION,MY_APG_ACCOUNT_CSS_PATH:CSS_PATH,MY_APG_ACCOUNT_JS_PATH:JS_PATH});
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,JOURNEY_JS,CSS,JS,compactIntro,workspaceHeading,transformMyApg,wrap};
