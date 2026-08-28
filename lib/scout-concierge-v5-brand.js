// Scout premium presentation layer.
// 2026-08-29: Scout Navigator v7 global APG skin.
// Presentation only: Scout v5 owns decision logic, ranking, evidence and retailer neutrality.
const {css:scopedCore}=require('./scout-concierge-v5-client');
const {css:scopedV6}=require('./scout-concierge-v6-brand-base');
const globalCore=scopedCore.replaceAll('body[data-scout-v5=\"true\"] ','');
const globalV6=scopedV6
  .replace('body[data-scout-v5="true"]{',':where(.apg-assistant-launcher,.apg-assistant-panel){')
  .replaceAll('body.scout-v5-open[data-scout-v5="true"]','body.scout-v5-open')
  .replaceAll('body[data-scout-v5="true"] ','');
const v7=String.raw`
:where(.apg-assistant-launcher,.apg-assistant-panel){
  --scout-cyan:#38A4F3;
  --scout-warm:#EFF6FF;
  --scout-gold:#2563EB;
}
.apg-assistant-launcher{
  border-color:rgba(147,197,253,.28)!important;
  background:radial-gradient(circle at 18% -8%,rgba(56,164,243,.22),transparent 36%),linear-gradient(145deg,#0A1425,#102341 62%,#15345E)!important;
}
.apg-assistant-launcher:hover{border-color:rgba(96,165,250,.62)!important;box-shadow:0 24px 58px rgba(15,23,42,.27),0 8px 20px rgba(37,99,235,.13)!important}
.apg-assistant-launcher-copy strong{color:#fff!important}
.apg-assistant-launcher-copy small{color:#C7E3FF!important}
body.scout-v5-open[data-scout-v5="true"] .apg-assistant-launcher,body.scout-v5-open .apg-assistant-launcher{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(12px) scale(.96)!important}
.apg-assistant-avatar,.apg-assistant-launcher-icon{
  background:linear-gradient(145deg,#F8FBFF,#E6F1FF)!important;
  border-color:rgba(147,197,253,.62)!important;
}
.apg-assistant-avatar .apg-scout-character-v34::before,
.apg-assistant-launcher-icon .apg-scout-character-v34::before,
.scout-v5-mini .apg-scout-character-v34::before{
  background-image:url('/assets/scout-navigator-v7.svg')!important;
  transform-origin:50% 74%!important;
}
.apg-assistant-launcher:hover .apg-scout-character-v34::before{animation:apgScoutNavigatorHelloV7 .62s cubic-bezier(.2,.8,.2,1) both!important}
.apg-assistant-panel{width:min(492px,calc(100vw - 28px))!important;max-height:min(804px,calc(100dvh - 44px))!important;border-radius:28px!important}
.apg-assistant-head{
  background:radial-gradient(circle at 90% -18%,rgba(37,99,235,.58),transparent 38%),radial-gradient(circle at 64% 122%,rgba(56,164,243,.18),transparent 40%),linear-gradient(135deg,#091526,#102743 60%,#13355B)!important;
}
.apg-assistant-head::after{background:linear-gradient(90deg,#38A4F3,rgba(37,99,235,.5) 58%,transparent)!important}
.scout-v5-new:hover,.apg-assistant-close:hover{border-color:rgba(96,165,250,.58)!important}
.apg-assistant-body{background:radial-gradient(circle at 100% 0%,rgba(219,234,254,.68),transparent 34%),linear-gradient(180deg,#FBFDFF 0%,#F7FAFD 58%,#FAFCFF 100%)!important}
.scout-v5-mini{background:linear-gradient(145deg,#F8FBFF,#E7F2FF)!important;border-color:rgba(147,197,253,.58)!important}
.scout-v5-row.user .scout-v5-bubble{background:linear-gradient(145deg,#0F172A,#17345B)!important}
.scout-v5-card::before{background:linear-gradient(180deg,var(--scout-blue),#38A4F3)!important}
.scout-v5-dot{background:linear-gradient(180deg,#38A4F3,var(--scout-blue))!important;box-shadow:0 0 0 4px rgba(56,164,243,.1)!important}
.apg-assistant-launcher:focus-visible,.apg-assistant-panel button:focus-visible,.apg-assistant-panel a:focus-visible,.apg-assistant-panel input:focus-visible{outline:3px solid rgba(56,164,243,.62)!important;outline-offset:3px!important}
@keyframes apgScoutNavigatorHelloV7{0%,100%{transform:rotate(0) translateY(0)}35%{transform:rotate(-4deg) translateY(-1px)}68%{transform:rotate(3deg) translateY(0)}}
@media(max-width:640px){.apg-assistant-panel{border-radius:0!important}}
@media(prefers-reduced-motion:reduce){.apg-assistant-launcher:hover .apg-scout-character-v34::before{animation:none!important}}
`;
// Keep the existing full Scout asset intact while exposing only the v7 visual overrides for
// the final all-route parity layer. Re-emitting v6 here would override later v111/v112 geometry.
const presentationCss=v7;
const css=globalCore+globalV6+v7;
module.exports={css,presentationCss,v7};