// APG Brand Fidelity v32.
// Reconciles the approved brand-board identity with the live Premium Theme v31.1,
// restores the proven yellow maintained-research treatment, and strengthens the
// reusable light/dark colour and contrast system without changing product logic.
const upstream=require('./premium-theme-v311');

const VERSION='32';
const CSS_PATH='/assets/brand-fidelity-v32.css';
let svgId=0;

const C={
  blue:'#2563EB',navy:'#0F172A',teal:'#06B6D4',green:'#10B981',grey:'#F1F5F9',slate:'#64748B',
  blueLight:'#38A4F3',blueDeep:'#315FD8',blueDeep2:'#1E56C8',white:'#FFFFFF',
  yellow:'#FFD65B',yellowMid:'#F4BB45',yellowDeep:'#F2B348',yellowBorder:'#E0A630',yellowBorder2:'#D89C24',yellowText:'#082735'
};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function nextId(prefix='apg32'){svgId+=1;return `${prefix}-${svgId}`;}
function tracedMark({mono=false,centre='navy',title=false,prefix='apg32'}={}){
  const id=nextId(prefix);
  const centreFill=centre==='light'?C.white:C.navy;
  if(mono){
    return `<svg class="apg-brand-v32-symbol" viewBox="20 25 170 120" role="img"${title?` aria-labelledby="${id}-title"`:' aria-hidden="true"'}>${title?`<title id="${id}-title">Australian Product Guide</title>`:''}<path d="M54 81 86 83 105 51 123 83 154 83 125 32 83 33Z" fill="currentColor"/><path d="M81 96 48 96 26 135 59 137Z" fill="currentColor"/><path d="M128 97 151 137 182 136 159 95Z" fill="currentColor"/><path d="M104 87 76 136 106 126 132 137Z" fill="currentColor"/></svg>`;
  }
  return `<svg class="apg-brand-v32-symbol" viewBox="20 25 170 120" role="img"${title?` aria-labelledby="${id}-title"`:' aria-hidden="true"'}>${title?`<title id="${id}-title">Australian Product Guide</title>`:''}<defs><linearGradient id="${id}-top" x1="54" y1="56" x2="154" y2="56" gradientUnits="userSpaceOnUse"><stop stop-color="${C.blue}"/><stop offset=".52" stop-color="${C.blueLight}"/><stop offset="1" stop-color="#2F8FEF"/></linearGradient><linearGradient id="${id}-left" x1="26" y1="116" x2="81" y2="116" gradientUnits="userSpaceOnUse"><stop stop-color="${C.blueDeep}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient><linearGradient id="${id}-right" x1="128" y1="116" x2="182" y2="116" gradientUnits="userSpaceOnUse"><stop stop-color="${C.blue}"/><stop offset="1" stop-color="${C.blueDeep2}"/></linearGradient></defs><path d="M54 81 86 83 105 51 123 83 154 83 125 32 83 33Z" fill="url(#${id}-top)"/><path d="M81 96 48 96 26 135 59 137Z" fill="url(#${id}-left)"/><path d="M128 97 151 137 182 136 159 95Z" fill="url(#${id}-right)"/><path class="apg32-centre" d="M104 87 76 136 106 126 132 137Z" fill="${centreFill}"/></svg>`;
}
function monogramSvg({title=false}={}){
  const id=nextId('apg32mono');
  return `<svg class="apg-brand-v32-monogram-svg" viewBox="0 0 150 64" role="img"${title?` aria-labelledby="${id}-title"`:' aria-hidden="true"'}>${title?`<title id="${id}-title">APG</title>`:''}<defs><linearGradient id="${id}-a" x1="4" y1="8" x2="46" y2="56"><stop stop-color="#38A4F3"/><stop offset=".42" stop-color="#2563EB"/><stop offset="1" stop-color="#315FD8"/></linearGradient><linearGradient id="${id}-g" x1="103" y1="10" x2="148" y2="56"><stop stop-color="#2563EB"/><stop offset="1" stop-color="#315FD8"/></linearGradient></defs><path d="M7 54 23 12h10l17 42h-9l-4-11H20l-4 11H7Zm16-19h11l-5.5-15L23 35Z" fill="url(#${id}-a)"/><path d="M55 54V12h24c12 0 20 7 20 17s-8 17-20 17H64v8h-9Zm9-17h15c7 0 11-3 11-8s-4-8-11-8H64v16Z" fill="${C.navy}"/><path d="M126 55c-15 0-26-9-26-22s11-22 27-22c9 0 16 3 21 8l-6 6c-4-4-9-6-15-6-10 0-18 6-18 14s8 14 18 14c6 0 11-2 14-5v-5h-14v-8h23v17c-6 6-14 9-24 9Z" fill="url(#${id}-g)"/></svg>`;
}
function lockup(context='header'){
  const dark=context==='header'||context==='footer';
  return `<span class="apg-brand-v32-lockup is-${esc(context)}${dark?' is-dark':''}"><span class="apg-brand-v32-mark">${tracedMark({centre:dark?'light':'navy'})}</span><span class="apg-brand-v32-type"><span class="apg-brand-v32-name">Australian</span><span class="apg-brand-v32-product">Product Guide</span></span><span class="apg-brand-v32-monogram">${monogramSvg()}</span></span>`;
}
function scoutSvg(){
  const mono=tracedMark({mono:true}).replace('class="apg-brand-v32-symbol"','class="apg-brand-v32-symbol apg-brand-v32-symbol-mono"');
  return `<span class="apg-brand-v32-scout" aria-hidden="true"><span class="apg-brand-v32-scout-disc">${mono}</span></span>`;
}

function primaryLogoSvg({dark=false,white=false}={}){
  const bg=dark?`<rect width="520" height="150" rx="22" fill="${C.navy}"/>`:'';
  const mark=white?tracedMark({mono:true,title:false}).replace('currentColor',C.white):tracedMark({centre:dark?'light':'navy'});
  const nameFill=white||dark?C.white:C.navy;
  const productFill=white?C.white:(dark?'#7CA9FF':C.blue);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="150" viewBox="0 0 520 150" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title>${bg}<g transform="translate(22 17) scale(.82)">${mark}</g><text x="170" y="67" font-family="Inter,Arial,sans-serif" font-size="48" font-weight="800" letter-spacing="-1.8" fill="${nameFill}">Australian</text><text x="170" y="113" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="780" letter-spacing="-1.4" fill="${productFill}">Product Guide</text></svg>`;
}
function compactLogoSvg(){
  const mark=tracedMark({centre:'navy'});
  return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="120" viewBox="0 0 390 120" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><g transform="translate(8 8) scale(.72)">${mark}</g><text x="135" y="54" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="800" letter-spacing="-1.2" fill="${C.navy}">Australian</text><text x="135" y="88" font-family="Inter,Arial,sans-serif" font-size="31" font-weight="780" letter-spacing="-1" fill="${C.blue}">Product Guide</text></svg>`;
}
function monogramAsset(){return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="128" viewBox="0 0 150 64" role="img" aria-labelledby="title"><title id="title">APG</title>${monogramSvg().replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;}
function symbolAsset({mono=false}={}){
  const mark=tracedMark({mono,centre:'navy',title:false});
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="160" viewBox="20 25 170 120" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title>${mark.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;
}
function faviconSvg(){
  const mark=tracedMark({centre:'light'});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><rect x="2" y="2" width="60" height="60" rx="15" fill="${C.navy}"/><g transform="translate(3 8) scale(.3)">${mark}</g></svg>`;
}
function appIconSvg(){
  const mark=tracedMark({mono:true}).replace('currentColor',C.white);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><defs><linearGradient id="appbg" x1="18" y1="8" x2="112" y2="120"><stop stop-color="#38A4F3"/><stop offset=".55" stop-color="${C.blue}"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs><rect x="4" y="4" width="120" height="120" rx="28" fill="url(#appbg)"/><g transform="translate(0 20) scale(.62)">${mark}</g></svg>`;
}
function socialSvg(){
  const mark=tracedMark({centre:'light'});
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t d"><title id="t">Australian Product Guide</title><desc id="d">Independent Australian product guidance</desc><defs><linearGradient id="bg" x1="90" y1="70" x2="1110" y2="580"><stop stop-color="#0B1220"/><stop offset=".58" stop-color="${C.navy}"/><stop offset="1" stop-color="#172554"/></linearGradient></defs><rect width="1200" height="630" fill="#F8FAFC"/><rect x="42" y="42" width="1116" height="546" rx="40" fill="url(#bg)"/><g transform="translate(78 72) scale(1.18)">${mark}</g><text x="310" y="165" font-family="Inter,Arial,sans-serif" font-size="66" font-weight="800" letter-spacing="-2" fill="#FFFFFF">Australian</text><text x="310" y="226" font-family="Inter,Arial,sans-serif" font-size="58" font-weight="780" letter-spacing="-1.8" fill="#7CA9FF">Product Guide</text><text x="84" y="390" font-family="Inter,Arial,sans-serif" font-size="62" font-weight="800" letter-spacing="-1.8" fill="#FFFFFF">Make a better product decision.</text><text x="84" y="455" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="580" fill="#CBD5E1">Independent Australian guidance · evidence-led · commercially neutral recommendations</text><rect x="84" y="506" width="370" height="9" rx="4.5" fill="${C.blue}"/><rect x="454" y="506" width="92" height="9" rx="4.5" fill="${C.teal}"/><rect x="546" y="506" width="72" height="9" rx="4.5" fill="${C.green}"/></svg>`;
}

const css=`
/* APG Brand Fidelity v32 — approved brand board reconciliation. */
:root{
  --apg-blue:#2563EB;--apg-navy:#0F172A;--apg-teal:#06B6D4;--apg-green:#10B981;--apg-light-grey:#F1F5F9;--apg-slate:#64748B;
  --apg-white:#FFFFFF;--apg-surface:#F8FAFC;--apg-border:#E2E8F0;--apg-border-strong:#CBD5E1;
  --apg-text-light-primary:#0F172A;--apg-text-light-secondary:#475569;--apg-text-dark-primary:#FFFFFF;--apg-text-dark-secondary:#CBD5E1;
  --apg-yellow:#FFD65B;--apg-yellow-mid:#F4BB45;--apg-yellow-deep:#F2B348;--apg-yellow-border:#E0A630;--apg-yellow-border-2:#D89C24;--apg-yellow-text:#082735;
}
body[data-brand-fidelity-v32=true]{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;color:var(--apg-text-light-primary)}
body[data-brand-fidelity-v32=true] p{color:var(--apg-text-light-secondary)}
body[data-brand-fidelity-v32=true] .kicker,body[data-brand-fidelity-v32=true] .eyebrow{color:var(--apg-blue)!important}

.apg-brand-v32-lockup{display:inline-flex;align-items:center;gap:.72rem;min-width:0;vertical-align:middle;text-decoration:none}
.apg-brand-v32-mark{display:inline-flex;width:50px;height:39px;flex:0 0 auto}
.apg-brand-v32-symbol{display:block;width:100%;height:100%;overflow:visible}
.apg-brand-v32-type{display:flex;flex-direction:column;justify-content:center;line-height:.88;letter-spacing:-.04em;white-space:nowrap}
.apg-brand-v32-name{font-size:1.19rem;font-weight:800;color:var(--apg-navy)}
.apg-brand-v32-product{margin-top:.25rem;font-size:1.08rem;font-weight:780;color:var(--apg-blue)}
.apg-brand-v32-monogram{display:none;width:72px;height:32px;align-items:center}
.apg-brand-v32-monogram-svg{display:block;width:100%;height:100%}
.site-header .brand{max-width:245px!important;min-width:190px!important}
.site-header .apg-brand-v32-name{color:#FFFFFF!important}.site-header .apg-brand-v32-product{color:#7CA9FF!important}
.footer-v11-wordmark .apg-brand-v32-name{color:#FFFFFF!important}.footer-v11-wordmark .apg-brand-v32-product{color:#7CA9FF!important}
.footer-v11-wordmark .apg-brand-v32-mark{width:47px;height:37px}.footer-v11-wordmark .apg-brand-v32-name{font-size:1.13rem}.footer-v11-wordmark .apg-brand-v32-product{font-size:1.02rem}

body[data-brand-fidelity-v32=true] .apg-proof-band-v20{position:relative!important;overflow:hidden!important;border-top:1px solid var(--apg-yellow-border)!important;border-bottom:1px solid var(--apg-yellow-border-2)!important;background:linear-gradient(90deg,var(--apg-yellow),var(--apg-yellow-mid) 62%,var(--apg-yellow-deep))!important;color:var(--apg-yellow-text)!important;box-shadow:inset 0 1px rgba(255,255,255,.28)!important}
body[data-brand-fidelity-v32=true] .apg-proof-band-v20:before,body[data-brand-fidelity-v32=true] .apg-proof-band-v20:after{content:""!important;position:absolute!important;border-radius:999px!important;background:rgba(255,255,255,.17)!important;pointer-events:none!important}
body[data-brand-fidelity-v32=true] .apg-proof-band-v20:before{width:210px!important;height:210px!important;left:-120px!important;top:-135px!important}
body[data-brand-fidelity-v32=true] .apg-proof-band-v20:after{width:170px!important;height:170px!important;right:-80px!important;bottom:-115px!important}
body[data-brand-fidelity-v32=true] .apg-proof-kicker-v20{color:#254854!important;font-weight:900!important;letter-spacing:.075em!important}
body[data-brand-fidelity-v32=true] .apg-proof-main-v20>strong{color:var(--apg-yellow-text)!important}
body[data-brand-fidelity-v32=true] .apg-proof-trust-v20{color:#2B4B56!important}
body[data-brand-fidelity-v32=true] .apg-counter-v20 span{border:1px solid #303438!important;background:linear-gradient(#1C1E20 0 48%,#050607 48% 52%,#17191B 52%)!important;color:#FFFFFF!important;box-shadow:0 5px 11px rgba(8,39,53,.2),inset 0 1px rgba(255,255,255,.13)!important;text-shadow:0 1px #000!important}

body[data-brand-fidelity-v32=true] .site-header,body[data-brand-fidelity-v32=true] .primary-nav,body[data-brand-fidelity-v32=true] footer.apg-footer-v11,body[data-brand-fidelity-v32=true] .search-hero,body[data-brand-fidelity-v32=true] .decision-hero,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9,body[data-brand-fidelity-v32=true] .apg-home-trust-v9,body[data-brand-fidelity-v32=true] .difference-engine,body[data-brand-fidelity-v32=true] .apg-assistant-head{color:var(--apg-text-dark-primary)!important}
body[data-brand-fidelity-v32=true] .search-hero h1,body[data-brand-fidelity-v32=true] .search-hero h2,body[data-brand-fidelity-v32=true] .decision-hero h1,body[data-brand-fidelity-v32=true] .decision-hero h2,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 h2,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 h3,body[data-brand-fidelity-v32=true] .apg-home-trust-v9 h2,body[data-brand-fidelity-v32=true] .apg-home-trust-v9 h3,body[data-brand-fidelity-v32=true] .difference-engine h2,body[data-brand-fidelity-v32=true] .difference-engine h3,body[data-brand-fidelity-v32=true] .apg-assistant-head strong{color:var(--apg-text-dark-primary)!important}
body[data-brand-fidelity-v32=true] .search-hero p,body[data-brand-fidelity-v32=true] .decision-hero p,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 p,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 small,body[data-brand-fidelity-v32=true] .apg-home-trust-v9 p,body[data-brand-fidelity-v32=true] .difference-engine p,body[data-brand-fidelity-v32=true] .apg-assistant-head small{color:var(--apg-text-dark-secondary)!important}
body[data-brand-fidelity-v32=true] footer.apg-footer-v11 p,body[data-brand-fidelity-v32=true] footer.apg-footer-v11 span{color:#B8C5D6!important}
body[data-brand-fidelity-v32=true] footer.apg-footer-v11 a,body[data-brand-fidelity-v32=true] footer.apg-footer-v11 h3,body[data-brand-fidelity-v32=true] footer.apg-footer-v11 strong{color:#F8FAFC!important}
body[data-brand-fidelity-v32=true] .search-hero a,body[data-brand-fidelity-v32=true] .decision-hero a,body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9>a,body[data-brand-fidelity-v32=true] .apg-home-trust-v9 a:not(.button),body[data-brand-fidelity-v32=true] .difference-engine a{color:#93C5FD!important}

body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 li{background:transparent!important;border:0!important;border-top:1px solid rgba(255,255,255,.13)!important;border-radius:0!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}
body[data-brand-fidelity-v32=true] .apg-home-decision-panel-v9 li:first-child{border-top:0!important}
body[data-brand-fidelity-v32=true] .apg-home-trust-points-v9{background:transparent!important;border:0!important}
body[data-brand-fidelity-v32=true] .apg-home-trust-points-v9 article{background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.10)!important;box-shadow:none!important}
body[data-brand-fidelity-v32=true] .product-card,body[data-brand-fidelity-v32=true] .category-card,body[data-brand-fidelity-v32=true] .comparison-card,body[data-brand-fidelity-v32=true] .guide-card,body[data-brand-fidelity-v32=true] .workspace-panel{box-shadow:none!important}
body[data-brand-fidelity-v32=true] .product-card:hover,body[data-brand-fidelity-v32=true] .category-card:hover,body[data-brand-fidelity-v32=true] .comparison-card:hover,body[data-brand-fidelity-v32=true] .guide-card:hover{box-shadow:0 12px 32px rgba(15,23,42,.08)!important}

body[data-brand-fidelity-v32=true] .apg-consent-card,body[data-brand-fidelity-v32=true] .apg-account-nudge{border-color:var(--apg-border)!important;color:var(--apg-text-light-primary)!important;box-shadow:0 18px 55px rgba(15,23,42,.16)!important}
body[data-brand-fidelity-v32=true] .apg-consent h2,body[data-brand-fidelity-v32=true] .apg-consent-row strong,body[data-brand-fidelity-v32=true] .apg-account-nudge h2{color:var(--apg-navy)!important}
body[data-brand-fidelity-v32=true] .apg-consent p,body[data-brand-fidelity-v32=true] .apg-consent-row small,body[data-brand-fidelity-v32=true] .apg-account-nudge p,body[data-brand-fidelity-v32=true] .apg-account-nudge-note{color:var(--apg-slate)!important}
body[data-brand-fidelity-v32=true] .apg-consent a{color:#1D4ED8!important}
body[data-brand-fidelity-v32=true] .apg-consent .apg-consent-primary,body[data-brand-fidelity-v32=true] .apg-account-nudge a{background:var(--apg-blue)!important;border-color:var(--apg-blue)!important;color:#FFFFFF!important}
body[data-brand-fidelity-v32=true] .apg-consent .apg-consent-primary:hover,body[data-brand-fidelity-v32=true] .apg-account-nudge a:hover{background:#1D4ED8!important;border-color:#1D4ED8!important}
body[data-brand-fidelity-v32=true] .apg-consent-switch input{accent-color:var(--apg-blue)!important}
body[data-brand-fidelity-v32=true] .apg-account-nudge-kicker{color:#0E7490!important}

.apg-brand-v32-scout{display:grid;width:100%;height:100%;place-items:center}.apg-brand-v32-scout-disc{display:grid;width:100%;height:100%;place-items:center;border-radius:999px;background:var(--apg-blue);color:#FFFFFF}.apg-brand-v32-scout-disc .apg-brand-v32-symbol{width:76%;height:76%}
body[data-brand-fidelity-v32=true] .apg-assistant-launcher-icon,body[data-brand-fidelity-v32=true] .apg-assistant-avatar{background:transparent!important;color:#FFFFFF!important;padding:0!important;overflow:visible!important}
body[data-brand-fidelity-v32=true] .apg-assistant-message.is-bot .apg-assistant-bubble{background:#EFF6FF!important;color:var(--apg-navy)!important;border:1px solid #DBEAFE!important}
body[data-brand-fidelity-v32=true] .apg-assistant-message.is-user .apg-assistant-bubble{background:var(--apg-blue)!important;color:#FFFFFF!important}

@media(max-width:1180px){.site-header .brand{min-width:168px!important}.apg-brand-v32-mark{width:44px;height:35px}.apg-brand-v32-name{font-size:1.08rem}.apg-brand-v32-product{font-size:.98rem}}
@media(max-width:920px){
  .site-header .brand{min-width:104px!important;max-width:112px!important}.site-header .apg-brand-v32-type{display:none!important}.site-header .apg-brand-v32-monogram{display:inline-flex!important}.site-header .apg-brand-v32-mark{width:34px!important;height:29px!important}.site-header .apg-brand-v32-monogram{width:60px!important;height:28px!important}
  body[data-brand-fidelity-v32=true] .apg-proof-inner-v20{grid-template-columns:1fr!important;gap:8px!important;text-align:center!important;padding-top:16px!important;padding-bottom:16px!important}
  body[data-brand-fidelity-v32=true] .apg-proof-main-v20{justify-content:center!important;flex-wrap:wrap!important}.apg-proof-trust-v20{max-width:none!important;text-align:center!important}
}
@media(max-width:620px){
  .site-header .brand{min-width:96px!important;max-width:101px!important}.site-header .apg-brand-v32-mark{width:31px!important;height:27px!important}.site-header .apg-brand-v32-monogram{width:56px!important;height:26px!important}
  body[data-brand-fidelity-v32=true] .apg-proof-main-v20{display:grid!important;justify-items:center!important;gap:8px!important}.apg-proof-main-v20>strong{max-width:300px!important;line-height:1.3!important}.apg-proof-kicker-v20{font-size:10px!important}.apg-proof-trust-v20{max-width:340px!important;margin:0 auto!important;line-height:1.45!important}
}
@media(max-width:390px){.site-header .brand{min-width:36px!important;max-width:40px!important}.site-header .apg-brand-v32-monogram{display:none!important}.site-header .apg-brand-v32-mark{width:36px!important;height:30px!important}}
@media(prefers-reduced-motion:reduce){body[data-brand-fidelity-v32=true] *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;

function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}
function replaceIdentity(html){
  let out=String(html||'');
  out=out.replace(/<span class="apg-brand-v30-lockup is-header">[\s\S]*?<span class="apg-brand-v30-monogram" aria-hidden="true">APG<\/span><\/span>/g,lockup('header'));
  out=out.replace(/<span class="apg-brand-v30-lockup is-footer">[\s\S]*?<span class="apg-brand-v30-monogram" aria-hidden="true">APG<\/span><\/span>/g,lockup('footer'));
  out=out.replace(/<svg class="apg-brand-v30-scout"[\s\S]*?<\/svg>/g,scoutSvg());
  return out;
}
function inject(html){
  let out=String(html||'');
  if(out.includes('data-brand-fidelity-v32="true"'))return out;
  out=replaceIdentity(out);
  out=out.replace(/<link rel="icon" href="\/assets\/favicon\.svg(?:\?v=[^"]*)?" type="image\/svg\+xml">/i,`<link rel="icon" href="/assets/favicon.svg?v=${VERSION}" type="image/svg+xml">`);
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-fidelity-v32="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  return out;
}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path==='/assets/logo.svg'||path==='/assets/logo-horizontal.svg')return send(res,req,primaryLogoSvg(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-horizontal-dark.svg')return send(res,req,primaryLogoSvg({dark:true}),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-white.svg')return send(res,req,primaryLogoSvg({white:true}),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-compact.svg')return send(res,req,compactLogoSvg(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-monogram.svg')return send(res,req,monogramAsset(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-symbol.svg')return send(res,req,symbolAsset(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/logo-mono.svg')return send(res,req,symbolAsset({mono:true}),'image/svg+xml; charset=utf-8');
  if(path==='/assets/favicon.svg')return send(res,req,faviconSvg(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/app-icon.svg')return send(res,req,appIconSvg(),'image/svg+xml; charset=utf-8');
  if(path==='/assets/social.svg')return send(res,req,socialSvg(),'image/svg+xml; charset=utf-8');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);
    return end(body,...args);
  };
  return upstream(req,res);
};

module.exports.css=css;
module.exports.inject=inject;
module.exports.lockup=lockup;
module.exports.tracedMark=tracedMark;
module.exports.monogramSvg=monogramSvg;
module.exports.primaryLogoSvg=primaryLogoSvg;
module.exports.compactLogoSvg=compactLogoSvg;
module.exports.faviconSvg=faviconSvg;
module.exports.appIconSvg=appIconSvg;
module.exports.socialSvg=socialSvg;
