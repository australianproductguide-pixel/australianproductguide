// Scout v5 premium presentation layer.
// 2026-08-28: original APG compass companion + premium concierge surface.
// Decision logic, ranking and evidence behaviour remain owned by Scout v5 runtime.
const css=String.raw`
body[data-scout-v5="true"]{
  --scout-blue:var(--apg351-blue,#2563EB);
  --scout-blue-dark:var(--apg351-blue-dark,#1D4ED8);
  --scout-navy:var(--apg351-navy,#0F172A);
  --scout-cyan:var(--apg351-teal,#06B6D4);
  --scout-light:var(--apg351-light,#F1F5F9);
  --scout-surface:var(--apg351-surface,#F8FAFC);
  --scout-slate:var(--apg351-slate,#64748B);
  --scout-line:var(--apg351-line,#E2E8F0);
  --scout-line-strong:var(--apg351-line-strong,#CBD5E1);
  --scout-blue-soft:var(--apg351-blue-soft,#EFF6FF);
  --scout-blue-line:var(--apg351-blue-line,#BFDBFE);
  --scout-warm:#FFF9EA;
  --scout-gold:#F5C400;
}

body[data-scout-v5="true"] .apg-assistant-launcher{
  border-radius:22px!important;
  border:1px solid rgba(255,255,255,.16)!important;
  background:
    radial-gradient(circle at 18% 0%,rgba(255,255,255,.14),transparent 34%),
    linear-gradient(145deg,#0B1729,#12233B 62%,#172E4B)!important;
  color:#fff!important;
  box-shadow:0 18px 46px rgba(15,23,42,.24),0 5px 16px rgba(15,23,42,.12)!important;
  transition:opacity .16s ease,visibility .16s ease,transform .2s ease,box-shadow .2s ease,border-color .2s ease!important;
  isolation:isolate;
}
body[data-scout-v5="true"] .apg-assistant-launcher:hover{
  transform:translateY(-2px)!important;
  border-color:rgba(245,196,0,.42)!important;
  box-shadow:0 24px 58px rgba(15,23,42,.27),0 8px 20px rgba(15,23,42,.13)!important;
}
body[data-scout-v5="true"] .apg-assistant-launcher-copy strong{
  letter-spacing:-.015em!important;
  font-weight:850!important;
}
body[data-scout-v5="true"] .apg-assistant-launcher-copy small{
  color:rgba(255,255,255,.72)!important;
}
body.scout-v5-open[data-scout-v5="true"] .apg-assistant-launcher{
  opacity:0!important;
  visibility:hidden!important;
  pointer-events:none!important;
  transform:translateY(12px) scale(.96)!important;
}

body[data-scout-v5="true"] .apg-assistant-avatar,
body[data-scout-v5="true"] .apg-assistant-launcher-icon{
  display:grid!important;
  place-items:center!important;
  flex:0 0 auto!important;
  width:50px!important;
  height:50px!important;
  padding:3px!important;
  overflow:visible!important;
  border-radius:18px!important;
  background:linear-gradient(145deg,#FFFDF8,#FFF3C6)!important;
  border:1px solid rgba(245,196,0,.48)!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 8px 20px rgba(15,23,42,.16)!important;
}
body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34,
body[data-scout-v5="true"] .apg-assistant-launcher-icon .apg-scout-character-v34{
  position:relative!important;
  display:grid!important;
  place-items:center!important;
  width:44px!important;
  height:44px!important;
  filter:none!important;
}
body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34 svg,
body[data-scout-v5="true"] .apg-assistant-launcher-icon .apg-scout-character-v34 svg,
body[data-scout-v5="true"] .scout-v5-mini .apg-scout-character-v34 svg{
  opacity:0!important;
  pointer-events:none!important;
}
body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34::before,
body[data-scout-v5="true"] .apg-assistant-launcher-icon .apg-scout-character-v34::before,
body[data-scout-v5="true"] .scout-v5-mini .apg-scout-character-v34::before{
  content:'';
  position:absolute;
  inset:0;
  background:url('/assets/scout-compass-v6.svg') center/contain no-repeat;
  transform-origin:50% 72%;
}
body[data-scout-v5="true"] .apg-assistant-launcher:hover .apg-scout-character-v34::before{
  animation:apgScoutHelloV6 .68s cubic-bezier(.2,.8,.2,1) both;
}

body[data-scout-v5="true"] .apg-assistant-panel{
  width:min(488px,calc(100vw - 28px))!important;
  max-height:min(790px,calc(100dvh - 44px))!important;
  border-radius:30px!important;
  overflow:hidden!important;
  border:1px solid rgba(148,163,184,.28)!important;
  background:#fff!important;
  box-shadow:0 34px 100px rgba(15,23,42,.3),0 10px 30px rgba(15,23,42,.1)!important;
}
body[data-scout-v5="true"] .apg-assistant-head{
  position:relative!important;
  min-height:94px!important;
  padding:18px 17px!important;
  gap:12px!important;
  color:#fff!important;
  background:
    radial-gradient(circle at 88% -12%,rgba(37,99,235,.45),transparent 37%),
    radial-gradient(circle at 66% 120%,rgba(6,182,212,.13),transparent 38%),
    linear-gradient(135deg,#0B1729,#10253F 62%,#14304D)!important;
  border-bottom:1px solid rgba(255,255,255,.08)!important;
}
body[data-scout-v5="true"] .apg-assistant-head::after{
  content:'';
  position:absolute;
  left:18px;
  right:18px;
  bottom:-1px;
  height:1px;
  pointer-events:none;
  background:linear-gradient(90deg,rgba(245,196,0,.72),rgba(37,99,235,.28) 56%,transparent);
}
body[data-scout-v5="true"] .apg-assistant-brand{gap:12px!important;min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand>span:last-child{min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand strong{
  color:#fff!important;
  font-size:16px!important;
  font-weight:880!important;
  letter-spacing:-.025em!important;
}
body[data-scout-v5="true"] .apg-assistant-brand small{
  display:block!important;
  margin-top:2px!important;
  color:rgba(255,255,255,.72)!important;
  font-size:11.5px!important;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
body[data-scout-v5="true"] .scout-v5-head-actions{gap:7px!important}
body[data-scout-v5="true"] .scout-v5-new,
body[data-scout-v5="true"] .apg-assistant-close{
  border:1px solid rgba(255,255,255,.18)!important;
  background:rgba(255,255,255,.07)!important;
  color:#fff!important;
  backdrop-filter:blur(7px);
  transition:background .16s ease,border-color .16s ease,transform .16s ease!important;
}
body[data-scout-v5="true"] .scout-v5-new:hover,
body[data-scout-v5="true"] .apg-assistant-close:hover{
  background:rgba(255,255,255,.14)!important;
  border-color:rgba(245,196,0,.38)!important;
  transform:translateY(-1px)!important;
}

body[data-scout-v5="true"] .apg-assistant-body{
  min-height:360px!important;
  padding:0!important;
  overflow:auto!important;
  background:
    radial-gradient(circle at 100% 0%,rgba(219,234,254,.58),transparent 32%),
    linear-gradient(180deg,#FAFCFF 0%,#F8FAFC 52%,#FCFCFA 100%)!important;
  scrollbar-color:rgba(100,116,139,.32) transparent;
}
body[data-scout-v5="true"] .scout-v5-thread{
  padding:18px 17px 20px!important;
  gap:12px!important;
}
body[data-scout-v5="true"] .scout-v5-row{gap:9px!important}
body[data-scout-v5="true"] .scout-v5-mini{
  position:relative!important;
  display:grid!important;
  place-items:center!important;
  width:30px!important;
  height:30px!important;
  flex:0 0 30px!important;
  border-radius:11px!important;
  overflow:hidden!important;
  margin-top:1px!important;
  background:linear-gradient(145deg,#FFFDF8,#FFF4CF)!important;
  border:1px solid rgba(245,196,0,.38)!important;
  box-shadow:0 4px 12px rgba(15,23,42,.08)!important;
}
body[data-scout-v5="true"] .scout-v5-mini .apg-scout-character-v34{
  position:relative!important;
  display:grid!important;
  width:27px!important;
  height:27px!important;
  filter:none!important;
}
body[data-scout-v5="true"] .scout-v5-bubble{
  max-width:88%!important;
  border:1px solid rgba(203,213,225,.76)!important;
  border-radius:18px 18px 18px 6px!important;
  background:rgba(255,255,255,.98)!important;
  padding:12px 13px!important;
  color:var(--scout-navy)!important;
  font-size:13.7px!important;
  line-height:1.55!important;
  box-shadow:0 7px 22px rgba(15,23,42,.055)!important;
}
body[data-scout-v5="true"] .scout-v5-row.user .scout-v5-bubble{
  color:#fff!important;
  border-color:rgba(15,23,42,.05)!important;
  border-radius:18px 18px 6px 18px!important;
  background:linear-gradient(145deg,#0F172A,#172A45)!important;
  box-shadow:0 7px 22px rgba(15,23,42,.12)!important;
}
body[data-scout-v5="true"] .scout-v5-kicker,
body[data-scout-v5="true"] .scout-kicker{
  color:var(--scout-blue-dark)!important;
  font-size:9.8px!important;
  letter-spacing:.095em!important;
}
body[data-scout-v5="true"] .scout-v5-welcome{font-size:15.2px!important;line-height:1.5!important}

body[data-scout-v5="true"] .scout-v5-suggestions{
  gap:7px!important;
  margin:1px 0 5px 39px!important;
}
body[data-scout-v5="true"] .scout-v5-chip{
  min-height:34px!important;
  border:1px solid var(--scout-line-strong)!important;
  border-radius:12px!important;
  background:rgba(255,255,255,.94)!important;
  color:var(--scout-navy)!important;
  box-shadow:0 3px 10px rgba(15,23,42,.035)!important;
  transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease,background .16s ease!important;
}
body[data-scout-v5="true"] .scout-v5-chip:hover{
  transform:translateY(-1px)!important;
  border-color:var(--scout-blue)!important;
  background:var(--scout-blue-soft)!important;
  box-shadow:0 7px 16px rgba(37,99,235,.09)!important;
}

body[data-scout-v5="true"] .scout-v5-products{gap:10px!important;margin-left:39px!important}
body[data-scout-v5="true"] .scout-v5-card{
  position:relative!important;
  overflow:hidden!important;
  border:1px solid rgba(203,213,225,.76)!important;
  border-radius:18px!important;
  background:rgba(255,255,255,.98)!important;
  padding:13px!important;
  box-shadow:0 9px 25px rgba(15,23,42,.055)!important;
}
body[data-scout-v5="true"] .scout-v5-card::before{
  content:'';
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:3px;
  background:linear-gradient(180deg,var(--scout-blue),var(--scout-cyan));
}
body[data-scout-v5="true"] .scout-v5-card h4{color:var(--scout-navy)!important;font-size:14.2px!important;letter-spacing:-.012em!important}
body[data-scout-v5="true"] .scout-v5-card-brand{
  color:var(--scout-slate)!important;
  font-size:9.3px!important;
  letter-spacing:.09em!important;
}
body[data-scout-v5="true"] .scout-v5-card-price{color:#233247!important;font-weight:850!important}
body[data-scout-v5="true"] .scout-v5-card-meta,
body[data-scout-v5="true"] .scout-v5-status{color:var(--scout-slate)!important}
body[data-scout-v5="true"] .scout-v5-card-copy{color:#334155!important;line-height:1.5!important}
body[data-scout-v5="true"] .scout-v5-card-watch{
  border:1px solid rgba(226,232,240,.9)!important;
  border-radius:11px!important;
  background:linear-gradient(145deg,#F8FAFC,#F1F5F9)!important;
  color:#475569!important;
}
body[data-scout-v5="true"] .scout-v5-card-actions{gap:7px!important}
body[data-scout-v5="true"] .scout-v5-card-actions a,
body[data-scout-v5="true"] .scout-v5-card-actions button,
body[data-scout-v5="true"] .scout-v5-action{
  min-height:34px!important;
  border:1px solid var(--scout-line-strong)!important;
  border-radius:11px!important;
  color:var(--scout-blue-dark)!important;
  background:#fff!important;
  font-weight:820!important;
  box-shadow:0 2px 8px rgba(15,23,42,.025)!important;
  transition:transform .16s ease,border-color .16s ease,background .16s ease!important;
}
body[data-scout-v5="true"] .scout-v5-card-actions a:hover,
body[data-scout-v5="true"] .scout-v5-card-actions button:hover,
body[data-scout-v5="true"] .scout-v5-action:hover{
  transform:translateY(-1px)!important;
  border-color:var(--scout-blue)!important;
  background:var(--scout-blue-soft)!important;
}
body[data-scout-v5="true"] .scout-v5-action.primary,
body[data-scout-v5="true"] .scout-v5-send,
body[data-scout-v5="true"] .scout-send{
  color:#fff!important;
  border-color:var(--scout-blue)!important;
  background:linear-gradient(145deg,var(--scout-blue),var(--scout-blue-dark))!important;
  box-shadow:0 7px 16px rgba(37,99,235,.2)!important;
}

body[data-scout-v5="true"] .scout-v5-status{margin-left:39px!important}
body[data-scout-v5="true"] .scout-v5-dot{
  background:linear-gradient(180deg,var(--scout-cyan),#0891B2)!important;
  box-shadow:0 0 0 4px rgba(6,182,212,.1)!important;
}
body[data-scout-v5="true"] .scout-v5-composer{
  border-top:1px solid rgba(226,232,240,.9)!important;
  background:rgba(255,255,255,.96)!important;
  padding:12px 13px 13px!important;
  box-shadow:0 -12px 30px rgba(15,23,42,.035)!important;
  backdrop-filter:blur(14px);
}
body[data-scout-v5="true"] .scout-v5-form{gap:9px!important}
body[data-scout-v5="true"] .scout-v5-input{
  min-height:45px!important;
  border:1px solid var(--scout-line-strong)!important;
  border-radius:14px!important;
  padding:11px 13px!important;
  color:var(--scout-navy)!important;
  background:#fff!important;
  box-shadow:inset 0 1px 2px rgba(15,23,42,.025)!important;
}
body[data-scout-v5="true"] .scout-v5-input:focus{
  border-color:var(--scout-blue)!important;
  outline:3px solid rgba(37,99,235,.13)!important;
}
body[data-scout-v5="true"] .scout-v5-send{
  width:45px!important;
  height:45px!important;
  flex:0 0 45px!important;
  border-radius:14px!important;
}
body[data-scout-v5="true"] .scout-v5-helper{
  margin-top:7px!important;
  color:#718096!important;
  font-size:9.6px!important;
}
body[data-scout-v5="true"] .apg-assistant-foot{
  padding:9px 14px!important;
  color:#64748B!important;
  background:linear-gradient(180deg,#FFF,#FBFCFE)!important;
  border-top:1px solid rgba(226,232,240,.72)!important;
}
body[data-scout-v5="true"] .apg-assistant-foot strong{color:#334155!important}

body[data-scout-v5="true"] .apg-assistant-launcher:focus-visible,
body[data-scout-v5="true"] .apg-assistant-panel button:focus-visible,
body[data-scout-v5="true"] .apg-assistant-panel a:focus-visible,
body[data-scout-v5="true"] .apg-assistant-panel input:focus-visible{
  outline:3px solid rgba(245,196,0,.72)!important;
  outline-offset:3px!important;
}

@keyframes apgScoutHelloV6{
  0%,100%{transform:rotate(0deg) translateY(0)}
  28%{transform:rotate(-5deg) translateY(-1px)}
  56%{transform:rotate(4deg) translateY(-2px)}
  78%{transform:rotate(-1deg) translateY(0)}
}

@media(min-width:641px){
  body[data-scout-v5="true"] .apg-assistant-panel{bottom:22px!important}
}
@media(max-width:640px){
  body[data-scout-v5="true"] .apg-assistant-panel{
    inset:0!important;
    width:100vw!important;
    height:100dvh!important;
    max-height:none!important;
    border-radius:0!important;
    border:0!important;
    box-shadow:none!important;
  }
  body[data-scout-v5="true"] .apg-assistant-head{
    min-height:84px!important;
    padding-top:max(13px,env(safe-area-inset-top))!important;
    padding-left:13px!important;
    padding-right:11px!important;
  }
  body[data-scout-v5="true"] .apg-assistant-avatar{
    width:46px!important;
    height:46px!important;
    border-radius:16px!important;
  }
  body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34{width:40px!important;height:40px!important}
  body[data-scout-v5="true"] .scout-v5-thread{padding:15px 12px 17px!important}
  body[data-scout-v5="true"] .scout-v5-bubble{max-width:91%!important;font-size:13.2px!important}
  body[data-scout-v5="true"] .scout-v5-suggestions,
  body[data-scout-v5="true"] .scout-v5-products,
  body[data-scout-v5="true"] .scout-v5-actions,
  body[data-scout-v5="true"] .scout-v5-feedback,
  body[data-scout-v5="true"] .scout-v5-status{margin-left:0!important}
  body[data-scout-v5="true"] .scout-v5-composer{padding-bottom:max(11px,env(safe-area-inset-bottom))!important}
}
@media(max-width:380px){
  body[data-scout-v5="true"] .apg-assistant-brand small{max-width:165px!important}
  body[data-scout-v5="true"] .scout-v5-bubble{max-width:94%!important}
}
@media(prefers-reduced-motion:reduce){
  body[data-scout-v5="true"] .apg-assistant-launcher,
  body[data-scout-v5="true"] .scout-v5-chip,
  body[data-scout-v5="true"] .scout-v5-card-actions a,
  body[data-scout-v5="true"] .scout-v5-card-actions button,
  body[data-scout-v5="true"] .scout-v5-action,
  body[data-scout-v5="true"] .scout-v5-new,
  body[data-scout-v5="true"] .apg-assistant-close{transition:none!important}
  body[data-scout-v5="true"] .apg-assistant-launcher:hover .apg-scout-character-v34::before,
  body[data-scout-v5="true"] .scout-v5-dot{animation:none!important}
}
`;
module.exports={css};
