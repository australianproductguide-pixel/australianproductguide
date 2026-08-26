'use strict';

// APG Premium Experience v107.
// Presentation/progressive-enhancement layer only: one global Scout surface, stronger
// mobile gutters, readable touch targets and a deliberate narrow-screen comparison
// representation. The underlying SSR pages, evidence, recommendation and retailer logic
// remain authoritative.
const VERSION='107.1';
const CSS_PATH='/assets/premium-experience-v107.css';
const JS_PATH='/assets/premium-experience-v107.js';
const SCOUT_CSS='/assets/scout-concierge-v5.css?v=5.0';
const SCOUT_JS='/assets/assistant.js?v=5.0';

const css=String.raw`
/* APG Premium Experience v107.1 */
:root{--apg-premium-blue:#2563eb;--apg-premium-blue-strong:#1d4ed8;--apg-premium-navy:#102f4a;--apg-premium-soft:#f7faff;--apg-premium-line:#dbe5ef;--apg-premium-gutter:24px}
body[data-apg-premium-v107="true"]{overflow-x:clip}
body[data-apg-premium-v107="true"] main :where(h1,h2,h3,p,li,a,button,span,strong,small,dt,dd){overflow-wrap:anywhere}
body[data-apg-premium-v107="true"] main :where(.grid,.card-grid,.feature-grid,.comparison-grid,.product-grid,.category-grid,.actions,.card-actions,.section-head,.ci47-panel,.ci47-handoff){min-width:0}
body[data-apg-premium-v107="true"] :where(button,a,input,select,textarea,summary){-webkit-tap-highlight-color:rgba(37,99,235,.12)}
body[data-apg-premium-v107="true"] :where(button,a,input,select,textarea,summary):focus-visible{outline:3px solid rgba(37,99,235,.28)!important;outline-offset:3px}
body[data-apg-premium-v107="true"] :where(.button,.compare-button,.save-button,.header-action,.mobile-toggle,.mobile-section a,.retailer-row){min-height:44px}
body[data-apg-premium-v107="true"] .section-head p{max-width:760px}
body[data-apg-premium-v107="true"] .feature-card,
body[data-apg-premium-v107="true"] .comparison-card,
body[data-apg-premium-v107="true"] .brand-card,
body[data-apg-premium-v107="true"] .winner-card,
body[data-apg-premium-v107="true"] .decision-result{box-shadow:0 4px 18px rgba(15,47,74,.045)}
body[data-apg-premium-v107="true"] .step-number{background:#eff6ff!important;color:#1d4ed8!important;border-color:#bfdbfe!important}

/* Global Scout shell — available on every rendered page. */
body[data-apg-premium-v107="true"] .apg-assistant-launcher{position:fixed;left:20px;right:auto;bottom:max(20px,env(safe-area-inset-bottom));z-index:900;display:flex;align-items:center;gap:10px;min-height:58px;max-width:min(260px,calc(100vw - 40px));border:1px solid rgba(37,99,235,.22);border-radius:18px;background:#fff;color:var(--apg-premium-navy);padding:8px 13px 8px 9px;box-shadow:0 16px 45px rgba(15,47,74,.18);font:inherit;cursor:pointer;text-align:left}
body[data-apg-premium-v107="true"] .apg-assistant-launcher:hover{border-color:rgba(37,99,235,.5);box-shadow:0 18px 50px rgba(15,47,74,.24);transform:translateY(-1px)}
body[data-apg-premium-v107="true"] .apg-assistant-launcher-copy{display:flex;flex-direction:column;min-width:0;line-height:1.2}
body[data-apg-premium-v107="true"] .apg-assistant-launcher-copy strong{font-size:13px;color:var(--apg-premium-navy)}
body[data-apg-premium-v107="true"] .apg-assistant-launcher-copy small{margin-top:3px;color:#64748b;font-size:10.5px;font-weight:650}
body[data-apg-premium-v107="true"] .apg-assistant-avatar{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border-radius:13px;background:linear-gradient(145deg,#eff6ff,#fff7df);overflow:hidden}
body[data-apg-premium-v107="true"] .apg-assistant-avatar img{display:block;width:32px;height:32px}
body[data-apg-premium-v107="true"] .apg-assistant-panel{position:fixed;left:20px;right:auto;bottom:max(90px,calc(86px + env(safe-area-inset-bottom)));z-index:950;display:flex;flex-direction:column;width:min(470px,calc(100vw - 40px));max-height:min(760px,calc(100dvh - 120px));overflow:hidden;border:1px solid #d8e3ee;border-radius:24px;background:#fff;box-shadow:0 28px 90px rgba(15,47,74,.26)}
body[data-apg-premium-v107="true"] .apg-assistant-panel[hidden]{display:none!important}
body[data-apg-premium-v107="true"] .apg-assistant-head{display:flex;align-items:center;gap:11px;min-height:72px;padding:13px 14px;background:linear-gradient(135deg,#102f4a,#164f7b);color:#fff}
body[data-apg-premium-v107="true"] .apg-assistant-brand{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
body[data-apg-premium-v107="true"] .apg-assistant-brand>span:last-child{display:flex;flex-direction:column;min-width:0;line-height:1.2}
body[data-apg-premium-v107="true"] .apg-assistant-brand strong{color:#fff;font-size:14px}
body[data-apg-premium-v107="true"] .apg-assistant-brand small{margin-top:3px;color:#dbeafe;font-size:10.5px}
body[data-apg-premium-v107="true"] .apg-assistant-close{display:grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border:1px solid rgba(255,255,255,.22);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:22px;cursor:pointer}
body[data-apg-premium-v107="true"] .apg-assistant-body{min-height:280px;flex:1 1 auto;overflow:auto;background:#f8fafc}
body[data-apg-premium-v107="true"] .apg-assistant-foot{border-top:1px solid #e2e8f0;padding:9px 13px;background:#fff;color:#64748b;font-size:10px;line-height:1.4}
body[data-apg-premium-v107="true"] .scout-v5-bubble{font-size:14px;line-height:1.55}
body[data-apg-premium-v107="true"] .scout-v5-chip,
body[data-apg-premium-v107="true"] .scout-v5-action,
body[data-apg-premium-v107="true"] .scout-v5-card-actions a,
body[data-apg-premium-v107="true"] .scout-v5-card-actions button{min-height:40px;white-space:normal;text-align:center;line-height:1.3}
body[data-apg-premium-v107="true"] .scout-v107-context-suggestions{display:flex;flex-wrap:wrap;gap:7px;margin:5px 0 4px 33px;padding-top:4px;border-top:1px dashed #d9e4ef}
body[data-apg-premium-v107="true"] .scout-v107-context-label{flex:0 0 100%;color:#64748b;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
body[data-apg-premium-v107="true"].apg-compare-tray-active .apg-assistant-launcher{bottom:calc(92px + env(safe-area-inset-bottom))}

/* Comparison tables become labelled decision cards on narrow screens rather than a squeezed desktop table. */
@media(max-width:760px){
  :root{--apg-premium-gutter:18px}
  body[data-apg-premium-v107="true"] .wrap{width:calc(100% - (var(--apg-premium-gutter) * 2))!important;max-width:var(--max);margin-inline:auto}
  body[data-apg-premium-v107="true"] .policy-shell{width:calc(100% - (var(--apg-premium-gutter) * 2))!important;margin-inline:auto}
  body[data-apg-premium-v107="true"] .section{padding-block:44px}
  body[data-apg-premium-v107="true"] .hero{padding-block:40px 36px}
  body[data-apg-premium-v107="true"] .home-hero-grid{padding-block:48px 44px}
  body[data-apg-premium-v107="true"] h1{font-size:clamp(35px,10.8vw,48px);line-height:1.04;letter-spacing:-.025em}
  body[data-apg-premium-v107="true"] h2{font-size:clamp(27px,7.5vw,35px);line-height:1.1;letter-spacing:-.015em}
  body[data-apg-premium-v107="true"] .lede{font-size:18px;line-height:1.55}
  body[data-apg-premium-v107="true"] main :where(p,li,dd){line-height:1.55}
  body[data-apg-premium-v107="true"] main :where(.fine,.fine-inline,.meta,.card-meta,.product-meta,.image-provenance,.ci47-note){font-size:12.5px!important;line-height:1.45!important}
  body[data-apg-premium-v107="true"] main :where(.kicker,.eyebrow){font-size:12px!important;line-height:1.3!important;letter-spacing:.075em}
  body[data-apg-premium-v107="true"] :where(input[type=search],input[type=text],input[type=email],input[type=password],input[type=number],select,textarea,.scout-v5-input){font-size:16px!important;min-height:44px}
  body[data-apg-premium-v107="true"] :where(.button,.compare-button,.save-button,.text-button,.scout-v5-chip,.scout-v5-action,.scout-v5-card-actions a,.scout-v5-card-actions button){white-space:normal;text-align:center;line-height:1.3;max-width:100%}
  body[data-apg-premium-v107="true"] .global-search{grid-template-columns:auto minmax(0,1fr) auto;min-width:0}
  body[data-apg-premium-v107="true"] .global-search input{padding-block:12px!important;min-width:0}
  body[data-apg-premium-v107="true"] .global-search button{min-width:70px;padding-inline:14px}
  body[data-apg-premium-v107="true"] .section-head{margin-bottom:22px}
  body[data-apg-premium-v107="true"] :where(.feature-card,.comparison-card,.brand-card,.soft-panel,.decision-card,.winner-card,.retailer-panel,.evidence-box,.ci47-panel,.ci47-handoff){padding:20px}
  body[data-apg-premium-v107="true"] .category-card{padding:20px;gap:16px}
  body[data-apg-premium-v107="true"] .product-card-body{padding:20px}
  body[data-apg-premium-v107="true"] .actions,body[data-apg-premium-v107="true"] .card-actions{gap:10px;margin-top:17px}
  body[data-apg-premium-v107="true"] .actions>:where(a,button),body[data-apg-premium-v107="true"] .card-actions>:where(a,button){min-height:44px}
  body[data-apg-premium-v107="true"] .compare-wrap{margin-top:18px;max-width:100%;overflow-x:hidden}
  body[data-apg-premium-v107="true"] .compare{max-width:100%}
  body[data-apg-premium-v107="true"] .compare tr{margin-bottom:16px;border:1px solid #dbe5ef;border-radius:16px;box-shadow:0 4px 14px rgba(15,47,74,.04);overflow:hidden}
  body[data-apg-premium-v107="true"] .compare td{padding:15px 16px!important;line-height:1.5;min-width:0}
  body[data-apg-premium-v107="true"] .compare td:first-child{padding-block:13px!important;background:#f4f8ff!important;color:#102f4a!important;font-size:13px}
  body[data-apg-premium-v107="true"] .compare td[data-apg-compare-label]:not(:first-child)::before{content:attr(data-apg-compare-label);display:block;margin-bottom:5px;color:#1d4ed8;font-size:11px;font-weight:900;letter-spacing:.065em;text-transform:uppercase}
  body[data-apg-premium-v107="true"] .compare-tray{left:var(--apg-premium-gutter);right:var(--apg-premium-gutter);transform:none;width:auto;bottom:max(10px,env(safe-area-inset-bottom));border-radius:16px;padding:11px 12px;gap:10px}
  body[data-apg-premium-v107="true"] .apg-assistant-launcher{left:var(--apg-premium-gutter)!important;right:auto!important;bottom:max(14px,env(safe-area-inset-bottom))!important;max-width:calc(100vw - (var(--apg-premium-gutter) * 2));min-height:56px}
  body[data-apg-premium-v107="true"].apg-compare-tray-active .apg-assistant-launcher{bottom:calc(88px + env(safe-area-inset-bottom))!important}
  body[data-apg-premium-v107="true"] .apg-assistant-panel{inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;border:0!important;border-radius:0!important;box-shadow:none!important}
  body[data-apg-premium-v107="true"] .apg-assistant-head{padding:max(12px,env(safe-area-inset-top)) var(--apg-premium-gutter) 12px!important}
  body[data-apg-premium-v107="true"] .scout-v5-thread{padding:18px var(--apg-premium-gutter) 20px!important}
  body[data-apg-premium-v107="true"] .scout-v5-bubble{max-width:92%;font-size:15px;line-height:1.55}
  body[data-apg-premium-v107="true"] .scout-v5-chip{min-height:44px;font-size:13px;padding:9px 11px}
  body[data-apg-premium-v107="true"] .scout-v5-action{min-height:44px;font-size:12.5px;padding:9px 11px}
  body[data-apg-premium-v107="true"] .scout-v5-suggestions,
  body[data-apg-premium-v107="true"] .scout-v5-products,
  body[data-apg-premium-v107="true"] .scout-v5-actions,
  body[data-apg-premium-v107="true"] .scout-v5-feedback,
  body[data-apg-premium-v107="true"] .scout-v5-status,
  body[data-apg-premium-v107="true"] .scout-v107-context-suggestions{margin-left:0!important}
  body[data-apg-premium-v107="true"] .scout-v107-context-suggestions{gap:8px;padding-top:8px}
  body[data-apg-premium-v107="true"] .scout-v107-context-label{font-size:11px}
  body[data-apg-premium-v107="true"] .scout-v5-composer{padding:11px var(--apg-premium-gutter) max(12px,env(safe-area-inset-bottom))!important}
  body[data-apg-premium-v107="true"] .scout-v5-send{width:44px;height:44px;flex-basis:44px}
  body[data-apg-premium-v107="true"] footer :where(a,p,span,small){overflow-wrap:anywhere}
}
@media(max-width:380px){
  :root{--apg-premium-gutter:16px}
  body[data-apg-premium-v107="true"] .section{padding-block:39px}
  body[data-apg-premium-v107="true"] .hero{padding-block:34px 30px}
  body[data-apg-premium-v107="true"] .home-hero-grid{padding-block:40px 36px}
  body[data-apg-premium-v107="true"] h1{font-size:34px;line-height:1.06}
  body[data-apg-premium-v107="true"] h2{font-size:26px;line-height:1.12}
  body[data-apg-premium-v107="true"] .lede{font-size:17px;line-height:1.55}
  body[data-apg-premium-v107="true"] :where(.feature-card,.comparison-card,.brand-card,.soft-panel,.decision-card,.winner-card,.retailer-panel,.evidence-box,.ci47-panel,.ci47-handoff){padding:18px}
  body[data-apg-premium-v107="true"] .category-card{grid-template-columns:54px minmax(0,1fr);padding:18px 16px;gap:14px}
  body[data-apg-premium-v107="true"] .product-card-body{padding:18px}
  body[data-apg-premium-v107="true"] .product-visual{grid-template-columns:90px minmax(0,1fr);padding:16px}
  body[data-apg-premium-v107="true"] .global-search button{min-width:62px;padding-inline:10px;font-size:13px}
  body[data-apg-premium-v107="true"] .apg-assistant-launcher-copy small{display:none}
  body[data-apg-premium-v107="true"] .apg-assistant-launcher{padding-right:12px}
  body[data-apg-premium-v107="true"] .scout-v5-bubble{max-width:94%;font-size:14.5px}
}
@media(max-width:340px){
  body[data-apg-premium-v107="true"] h1{font-size:32px}
  body[data-apg-premium-v107="true"] h2{font-size:24px}
  body[data-apg-premium-v107="true"] .section{padding-block:36px}
  body[data-apg-premium-v107="true"] .global-search button{min-width:58px;padding-inline:8px;font-size:12.5px}
  body[data-apg-premium-v107="true"] .category-card{grid-template-columns:48px minmax(0,1fr);padding:17px 15px}
  body[data-apg-premium-v107="true"] .product-visual{grid-template-columns:78px minmax(0,1fr);padding:15px}
}
@media(prefers-reduced-motion:reduce){body[data-apg-premium-v107="true"] .apg-assistant-launcher{transition:none!important;transform:none!important}}
`;

const clientJs=String.raw`(()=>{
'use strict';
if(window.__APG_PREMIUM_V107__)return;window.__APG_PREMIUM_V107__='${VERSION}';
const body=document.body;if(!body)return;body.dataset.apgPremiumV107='true';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function routeContext(){const path=location.pathname,parts=path.split('/').filter(Boolean);if(parts[0]==='products')return 'product';if(parts[0]==='categories')return parts[2]==='finder'?'finder':'category';if(parts[0]==='guides')return 'guide';if(parts[0]==='compare')return 'comparison';if(path==='/decision-lab/')return 'decision-lab';if(path==='/search/')return 'search';if(path==='/my-apg/')return 'my-apg';if(path==='/')return 'home';return 'other'}
function labelComparison(){qsa('table.compare').forEach(table=>{const headers=qsa('thead th',table).map(th=>th.textContent.trim());qsa('tbody tr',table).forEach(row=>qsa('td',row).forEach((cell,index)=>{if(index>0&&!cell.dataset.apgCompareLabel)cell.dataset.apgCompareLabel=headers[index]||('Option '+index)}));table.dataset.apgMobileLabels='true'})}
function syncCompareTray(){const tray=qs('#compareTray');body.classList.toggle('apg-compare-tray-active',!!(tray&&!tray.hidden));}
function contextualPrompts(){const host=qs('.scout-v5-suggestions');if(!host||qs('.scout-v107-context-suggestions'))return;const type=routeContext(),items={product:[['Bad fit?','What would make this product a bad fit for me?'],['Before buying','What should I verify before buying?'],['Good value?','Is this good value for the money?'],['Buy or wait?','Should I buy now or wait?']],comparison:[['Decision differences','What actually changes the decision here?'],['Neither option?','When is neither option the right choice?'],['Apply my budget','Apply my budget and priorities to this comparison'],['Before buying','What should I verify before buying?']],category:[['What matters','What matters most in this category?'],['Deal-breakers','What deal-breakers should I think about?'],['Build a shortlist','Help me build a shortlist for my situation'],['Next step','What should I do next?']],finder:[['What matters','What matters most in this category?'],['Check my brief','Help me tighten my buying brief'],['Explain result','Explain why this result fits me'],['Next step','What should I do next?']],guide:[['Key decisions','What are the key decisions in this guide?'],['Help me choose','Turn this guide into a shortlist for me'],['Evidence gaps','What should I verify before buying?'],['Short version','Summarise this page']],search:[['Better search','Help me improve my search'],['Turn into brief','Turn this search into a buying brief'],['Which tool next?','Should I use Search, Compare or Decision Lab next?'],['Next step','What should I do next?']],'decision-lab':[['Why this won','Why did this option win?'],['What changes it','What would change this recommendation?'],['Confidence','What is uncertain or unverified here?'],['Next step','What should I do next?']],'my-apg':[['Saved options','What have I saved?'],['Compare saved','Help me compare my saved options'],['Next step','What should I do next with my shortlist?'],['Before buying','What should I verify before buying?']],home:[['How APG connects','How do Search, Scout, Decision Lab and Compare work together?'],['Start my decision','Help me choose a product for my situation'],['What can Scout do?','What can Scout do?'],['Why APG?','What makes APG different?']],other:[['Guide this page','Help me with this page'],['Find the right tool','What APG tool should I use?'],['What can Scout do?','What can Scout do?'],['Next step','What should I do next?']]}[type]||[];if(!items.length)return;const wrap=document.createElement('div');wrap.className='scout-v107-context-suggestions';wrap.innerHTML='<span class="scout-v107-context-label">Useful next questions</span>'+items.map(item=>'<button type="button" class="scout-v5-chip" data-scout-v5-ask="'+item[1].replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')+'">'+item[0]+'</button>').join('');host.insertAdjacentElement('afterend',wrap)}
function syncScoutAria(){const launcher=qs('#apgAssistantLauncher'),panel=qs('#apgAssistantPanel');if(!launcher||!panel)return;panel.setAttribute('aria-hidden',String(panel.hidden));launcher.setAttribute('aria-expanded',String(!panel.hidden))}
labelComparison();syncCompareTray();syncScoutAria();contextualPrompts();
const observer=new MutationObserver(()=>{labelComparison();syncCompareTray();syncScoutAria();contextualPrompts()});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','aria-expanded']});
window.addEventListener('pageshow',()=>{labelComparison();syncCompareTray();contextualPrompts()});
})();`;

const shell=String.raw`<button id="apgAssistantLauncher" class="apg-assistant-launcher" type="button" aria-controls="apgAssistantPanel" aria-expanded="false"><span class="apg-assistant-avatar" aria-hidden="true"><img src="/assets/logo.svg" alt=""></span><span class="apg-assistant-launcher-copy"><strong>Ask Scout</strong><small>Products, comparisons & APG</small></span></button><aside id="apgAssistantPanel" class="apg-assistant-panel" hidden role="dialog" aria-modal="false" aria-labelledby="apgScoutTitle"><div class="apg-assistant-head"><div class="apg-assistant-brand"><span class="apg-assistant-avatar" aria-hidden="true"><img src="/assets/logo.svg" alt=""></span><span><strong id="apgScoutTitle">Scout</strong><small>Australian Product Guide assistant</small></span></div><button class="apg-assistant-close" data-apg-assistant-close type="button" aria-label="Close Scout">×</button></div><div id="apgAssistantBody" class="apg-assistant-body" aria-live="polite"></div><div class="apg-assistant-foot"><strong>Grounded in APG.</strong> Maintained Australian product research, explicit uncertainty and commercial-neutral recommendations.</div></aside>`;

function inject(html){
  let out=String(html||'');if(!out)return out;
  if(!out.includes('name="apg-premium-experience"'))out=out.replace('</head>',`<meta name="apg-premium-experience" content="v${VERSION}"><link rel="stylesheet" href="${SCOUT_CSS}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes('id="apgAssistantLauncher"'))out=out.replace('</body>',shell+'</body>');
  const scripts=[];if(!out.includes('/assets/assistant.js'))scripts.push(`<script src="${SCOUT_JS}" defer></script>`);if(!out.includes(JS_PATH))scripts.push(`<script src="${JS_PATH}?v=${VERSION}" defer></script>`);if(scripts.length)out=out.replace('</body>',scripts.join('')+'</body>');
  if(!/data-apg-premium-v107=/.test(out))out=out.replace(/<body\b([^>]*)>/i,'<body data-apg-premium-v107="true"$1>');
  return out;
}
function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Premium-Experience','v'+VERSION);return res.end(req.method==='HEAD'?'':body)}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('premium experience requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',css);
    if(path===JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body);if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}res.setHeader('X-APG-Premium-Experience','v'+VERSION)}return end(body,...args)};
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{PREMIUM_EXPERIENCE_VERSION:VERSION,PREMIUM_EXPERIENCE_CSS_PATH:CSS_PATH,PREMIUM_EXPERIENCE_JS_PATH:JS_PATH,premiumExperienceCss:css,premiumExperienceClientJs:clientJs,injectPremiumExperience:inject});
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,css,clientJs,shell,inject,wrap};
