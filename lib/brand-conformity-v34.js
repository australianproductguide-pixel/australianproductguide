// Australian Product Guide Brand Conformity v34.
// Final whole-site palette normalisation and first-party Scout character system.
// Keeps the v32.5 SSR/mobile fixes and the approved yellow research band, while
// removing decorative legacy green/cyan families from the controlling cascade.
const upstream=require('./brand-fidelity-v325');
const v29=require('./amazon-conversion-v29');
const v32=require('./brand-fidelity-v32');

const VERSION='34';
const CSS_PATH='/assets/brand-conformity-v34.css';
const JS_PATH='/assets/brand-conformity-v34.js';

function scoutCharacterMarkup(){
  // Compatibility marker keeps the earlier v32.2 guard from replacing the new
  // character with the temporary master-logo disc. The character itself uses
  // only approved APG Navy / Blue / Teal / white / light-blue tokens.
  return `<span class="apg-scout-character-v34" data-apg-v322-scout="true" data-apg-scout-character="v34" aria-hidden="true"><svg viewBox="0 0 64 64" role="img" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#EFF6FF"/><path d="M17 14 26 5h12l9 9-4 4H21l-4-4Z" fill="#2563EB"/><rect x="8.5" y="13" width="47" height="37" rx="18.5" fill="#0F172A"/><rect x="13" y="17" width="38" height="29" rx="14.5" fill="#FFFFFF"/><path d="M15.5 21c4-6 10-9 16.5-9s12.5 3 16.5 9c-5-2-10.5-3-16.5-3s-11.5 1-16.5 3Z" fill="#2563EB"/><circle cx="24" cy="29" r="3.2" fill="#2563EB"/><circle cx="40" cy="29" r="3.2" fill="#2563EB"/><circle cx="25" cy="28" r="1.15" fill="#06B6D4"/><circle cx="41" cy="28" r="1.15" fill="#06B6D4"/><path d="M25 37c2.1 2.2 4.4 3.2 7 3.2s4.9-1 7-3.2" fill="none" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round"/><circle cx="8.5" cy="30" r="4" fill="#2563EB"/><circle cx="55.5" cy="30" r="4" fill="#2563EB"/><path d="M17 48c3.8-3.8 8.8-5.7 15-5.7S43.2 44.2 47 48v10H17V48Z" fill="#2563EB"/><g transform="translate(22.2 43.8) scale(.105)" fill="#FFFFFF"><path d="M54 81 86 83 105 51 123 83 154 83 125 32 83 33Z"/><path d="M81 96 48 96 26 135 59 137Z"/><path d="M128 97 151 137 182 136 159 95Z"/><path d="M104 87 76 136 106 126 132 137Z"/></g></svg></span>`;
}

const css=`
/* APG Brand Conformity v34 — approved whole-site palette + Scout character. */
:root{
  --apg-v34-blue:#2563EB;--apg-v34-navy:#0F172A;--apg-v34-teal:#06B6D4;--apg-v34-green:#10B981;
  --apg-v34-light:#F1F5F9;--apg-v34-slate:#64748B;--apg-v34-white:#FFFFFF;--apg-v34-surface:#F8FAFC;
  --apg-v34-blue-soft:#EFF6FF;--apg-v34-blue-line:#BFDBFE;--apg-v34-line:#E2E8F0;--apg-v34-line-strong:#CBD5E1;
}
body[data-brand-conformity-v34="true"]{color:var(--apg-v34-navy)!important}
body[data-brand-conformity-v34="true"] p{color:#475569}
body[data-brand-conformity-v34="true"] h1,
body[data-brand-conformity-v34="true"] h2,
body[data-brand-conformity-v34="true"] h3,
body[data-brand-conformity-v34="true"] h4{color:var(--apg-v34-navy)}
body[data-brand-conformity-v34="true"] .kicker,
body[data-brand-conformity-v34="true"] .eyebrow{color:var(--apg-v34-blue)!important}

/* Core brand accent: Blue leads, Teal is restrained, decorative Green is removed. */
body[data-brand-conformity-v34="true"]:before{
  background:linear-gradient(90deg,var(--apg-v34-blue) 0 78%,var(--apg-v34-teal) 100%)!important;
}
body[data-brand-conformity-v34="true"] .apg-mega-group:nth-child(2) .apg-mega-icon,
body[data-brand-conformity-v34="true"] .apg-mega-group:nth-child(3) .apg-mega-icon,
body[data-brand-conformity-v34="true"] .apg-mega-group:nth-child(4) .apg-mega-icon,
body[data-brand-conformity-v34="true"] .apg-home-journey-v9>span{
  background:var(--apg-v34-blue-soft)!important;color:var(--apg-v34-blue)!important;
}
body[data-brand-conformity-v34="true"] [data-v7-category="home-security-cameras"],
body[data-brand-conformity-v34="true"] [data-v7-category="smart-doorbells"],
body[data-brand-conformity-v34="true"] [data-v7-category="mesh-wifi-systems"],
body[data-brand-conformity-v34="true"] [data-v7-category="robot-vacuums"],
body[data-brand-conformity-v34="true"] [data-v7-category="stick-vacuums"],
body[data-brand-conformity-v34="true"] [data-v7-category="air-purifiers"],
body[data-brand-conformity-v34="true"] [data-v7-category="wireless-headphones"],
body[data-brand-conformity-v34="true"] [data-v7-category="earbuds"],
body[data-brand-conformity-v34="true"] [data-v7-category="bluetooth-speakers"],
body[data-brand-conformity-v34="true"] [data-v7-category="soundbars"]{
  --scene:var(--apg-v34-blue)!important;--scene2:var(--apg-v34-blue-soft)!important;
}
body[data-brand-conformity-v34="true"] .v6-diff-index{
  background:linear-gradient(135deg,var(--apg-v34-blue),#1D4ED8)!important;
}
body[data-brand-conformity-v34="true"] .apg-account-nudge-kicker,
body[data-brand-conformity-v34="true"] .apg-home-trust-copy-v9 .kicker{color:var(--apg-v34-blue)!important}

/* Green is semantic only: verified/good/success states use a small exact APG Green cue,
   while the readable surface and text remain within the core Navy/Blue neutral system. */
body[data-brand-conformity-v34="true"] .pill.good,
body[data-brand-conformity-v34="true"] .evidence-deep,
body[data-brand-conformity-v34="true"] .independence-badge,
body[data-brand-conformity-v34="true"] .apg-profile-badge-v24,
body[data-brand-conformity-v34="true"] .decision-match.strong,
body[data-brand-conformity-v34="true"] .decision-match.good,
body[data-brand-conformity-v34="true"] .apg-assistant-match{
  background:var(--apg-v34-blue-soft)!important;color:var(--apg-v34-navy)!important;
  border-color:var(--apg-v34-blue-line)!important;box-shadow:inset 3px 0 0 var(--apg-v34-green)!important;
}
body[data-brand-conformity-v34="true"] .pros{
  background:var(--apg-v34-surface)!important;color:var(--apg-v34-navy)!important;
  border-color:var(--apg-v34-line-strong)!important;border-left:4px solid var(--apg-v34-green)!important;
}
body[data-brand-conformity-v34="true"] .official-logo{
  background:var(--apg-v34-blue-soft)!important;color:var(--apg-v34-navy)!important;
  border:1px solid var(--apg-v34-blue-line)!important;
}
body[data-brand-conformity-v34="true"] .apg-profile-message-v24.is-success{color:var(--apg-v34-navy)!important}

/* Prevent historical green/cyan families from resurfacing as body-copy or decorative accents. */
body[data-brand-conformity-v34="true"] .apg-mega-category:hover,
body[data-brand-conformity-v34="true"] .apg-mega-category:focus-visible,
body[data-brand-conformity-v34="true"] .retailer-row:hover,
body[data-brand-conformity-v34="true"] .apg-assistant-option:hover{
  background:var(--apg-v34-blue-soft)!important;border-color:var(--apg-v34-blue-line)!important;color:var(--apg-v34-navy)!important;
}
body[data-brand-conformity-v34="true"] .apg-home-panel-label-v9,
body[data-brand-conformity-v34="true"] .decision-engine-card .engine-status,
body[data-brand-conformity-v34="true"] .vs-badge,
body[data-brand-conformity-v34="true"] .big-vs{
  background:#DBEAFE!important;color:#1E40AF!important;
}

/* Approved yellow research band remains an intentional brand/trust exception. */
body[data-brand-conformity-v34="true"] .apg-proof-band-v20 .apg-proof-trust-v20{color:#2B4B56!important}
body[data-brand-conformity-v34="true"] .apg-proof-band-v20 .apg-proof-kicker-v20{color:#254854!important}

/* Scout v34 — a recognisable APG navigator rather than either the old mascot or a bare logo. */
.apg-scout-character-v34{display:grid;width:100%;height:100%;place-items:center;line-height:0}
.apg-scout-character-v34 svg{display:block;width:100%;height:100%;overflow:visible}
body[data-brand-conformity-v34="true"] .apg-assistant-launcher-icon,
body[data-brand-conformity-v34="true"] .apg-assistant-avatar{background:transparent!important;padding:0!important;overflow:visible!important}
body[data-brand-conformity-v34="true"] .apg-assistant-launcher-icon .apg-scout-character-v34{width:44px;height:44px}
body[data-brand-conformity-v34="true"] .apg-assistant-avatar .apg-scout-character-v34{width:46px;height:46px}
body[data-brand-conformity-v34="true"] .scout-mini .apg-scout-character-v34{width:28px!important;height:28px!important}
body[data-brand-conformity-v34="true"] .apg-assistant-launcher{
  background:var(--apg-v34-navy)!important;border-color:#334155!important;
}
body[data-brand-conformity-v34="true"] .apg-assistant-head{background:linear-gradient(135deg,var(--apg-v34-navy),#172554)!important}
body[data-brand-conformity-v34="true"] .apg-assistant-brand strong{color:#FFFFFF!important}
body[data-brand-conformity-v34="true"] .apg-assistant-brand small{color:#CBD5E1!important}
body[data-brand-conformity-v34="true"] .scout-thinking-orb,
body[data-brand-conformity-v34="true"] .scout-trustline>span:first-child{background:var(--apg-v34-blue)!important;color:#FFFFFF!important}

@media(max-width:920px){
  body[data-brand-conformity-v34="true"] #mobileNav .apg-v325-scout-mobile{
    background:var(--apg-v34-blue-soft)!important;border-color:var(--apg-v34-blue-line)!important;color:#1D4ED8!important;
  }
}
@media(prefers-reduced-motion:reduce){body[data-brand-conformity-v34="true"] *{transition:none!important;animation:none!important}}
`;

const clientJs=`(()=>{
  const character=${JSON.stringify(scoutCharacterMarkup())};
  let applying=false;
  const setGraphic=el=>{if(el&&!el.querySelector('[data-apg-scout-character="v34"]'))el.innerHTML=character;};
  const setText=(el,html,key)=>{if(el&&el.dataset[key]!=='true'){el.innerHTML=html;el.dataset[key]='true';}};
  const apply=()=>{
    if(applying)return;applying=true;
    try{
      document.querySelectorAll('.apg-assistant-launcher-icon,.apg-assistant-avatar,.scout-mini').forEach(setGraphic);
      const panel=document.getElementById('apgAssistantPanel');
      const launcher=document.getElementById('apgAssistantLauncher');
      if(panel){
        panel.dataset.apgScoutCharacter='v34';
        panel.setAttribute('aria-label','Scout — Australian Product Guide decision assistant');
        const brand=panel.querySelector('.apg-assistant-brand>span:last-child');
        setText(brand,'<strong>Scout</strong><small>Your APG decision guide</small>','apgV34Copy');
      }
      if(launcher){
        launcher.dataset.apgScoutCharacter='v34';
        launcher.setAttribute('aria-label','Ask Scout — your APG decision guide');
        const copy=launcher.querySelector('.apg-assistant-launcher-copy');
        setText(copy,'<strong>Ask Scout</strong><small>Your APG decision guide</small>','apgV34Copy');
      }
    }finally{applying=false;}
  };
  const boot=()=>{
    apply();
    const panel=document.getElementById('apgAssistantPanel');
    const launcher=document.getElementById('apgAssistantLauncher');
    if(panel)new MutationObserver(apply).observe(panel,{subtree:true,childList:true});
    if(launcher)new MutationObserver(apply).observe(launcher,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

function normaliseText(html){
  return String(html||'')
    .replace(/<strong>Shopping Assistant<\/strong><small>Evidence-backed product matching<\/small>/g,'<strong>Scout</strong><small>Your APG decision guide</small>')
    .replace(/aria-label="Australian Product Guide Shopping Assistant"/g,'aria-label="Scout — Australian Product Guide decision assistant"');
}
function inject(html){
  let out=normaliseText(String(html||''));
  if(out.includes('data-brand-conformity-v34="true"'))return out;
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-conformity-v34="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function send(res,req,body,type){
  res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);
}
function transform(html,pathOrUrl){let out=upstream.transform?upstream.transform(String(html||''),pathOrUrl):String(html||'');return inject(out);}
function handler(req,res){
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path===JS_PATH)return send(res,req,clientJs,'application/javascript; charset=utf-8');
  const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);return end(body,...args);};
  return upstream(req,res);
}
Object.assign(handler,v29,v32,upstream,{VERSION,CSS_PATH,JS_PATH,css,clientJs,scoutCharacterMarkup,normaliseText,inject,transform});
module.exports=handler;
