// Scout v5 brand overrides align to APG Brand Conformity v35.2.
// Do not reintroduce retired dark-teal/mint Scout surfaces.
const css=String.raw`
body[data-scout-v5="true"]{--scout-blue:var(--apg351-blue,#2563EB);--scout-blue-dark:var(--apg351-blue-dark,#1D4ED8);--scout-navy:var(--apg351-navy,#0F172A);--scout-cyan:var(--apg351-teal,#06B6D4);--scout-light:var(--apg351-light,#F1F5F9);--scout-surface:var(--apg351-surface,#F8FAFC);--scout-slate:var(--apg351-slate,#64748B);--scout-line:var(--apg351-line,#E2E8F0);--scout-line-strong:var(--apg351-line-strong,#CBD5E1);--scout-blue-soft:var(--apg351-blue-soft,#EFF6FF);--scout-blue-line:var(--apg351-blue-line,#BFDBFE)}
body[data-scout-v5="true"] .apg-assistant-head{background:linear-gradient(135deg,var(--scout-navy),#172554)!important;color:#fff!important;border-bottom:1px solid rgba(255,255,255,.08)}
body[data-scout-v5="true"] .apg-assistant-brand{gap:12px!important;min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand>span:last-child{min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand strong{letter-spacing:-.01em}
body[data-scout-v5="true"] .apg-assistant-brand small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body[data-scout-v5="true"] .apg-assistant-avatar,body[data-scout-v5="true"] .apg-assistant-launcher-icon{position:relative;isolation:isolate;display:grid!important;place-items:center!important;flex:0 0 auto!important;width:40px!important;height:40px!important;border-radius:50%!important;background:linear-gradient(145deg,var(--scout-blue),var(--scout-blue-dark))!important;color:transparent!important;font-size:0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),0 7px 18px rgba(37,99,235,.28)}
body[data-scout-v5="true"] .apg-assistant-avatar::before,body[data-scout-v5="true"] .apg-assistant-launcher-icon::before{content:'S';display:grid;place-items:center;width:24px;height:24px;border:1px solid rgba(255,255,255,.34);border-radius:50%;color:#fff;font-size:12px;font-weight:950;line-height:1;letter-spacing:-.04em;background:rgba(255,255,255,.08)}
body[data-scout-v5="true"] .apg-assistant-avatar::after,body[data-scout-v5="true"] .apg-assistant-launcher-icon::after{content:'';position:absolute;right:0;bottom:1px;width:9px;height:9px;border:2px solid var(--scout-navy);border-radius:50%;background:var(--scout-cyan)}
body[data-scout-v5="true"] .apg-assistant-launcher{background:var(--scout-navy)!important;border-color:#1E293B!important;color:#fff!important;box-shadow:0 16px 42px rgba(15,23,42,.22)!important;transition:opacity .16s ease,visibility .16s ease,transform .18s ease,box-shadow .18s ease!important}
body.scout-v5-open[data-scout-v5="true"] .apg-assistant-launcher{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(12px) scale(.96)!important}
@media(min-width:641px){body[data-scout-v5="true"] .apg-assistant-panel{bottom:22px!important;max-height:min(780px,calc(100dvh - 44px))!important;border-color:rgba(148,163,184,.32)!important;box-shadow:0 28px 90px rgba(15,23,42,.28)!important}}
body[data-scout-v5="true"] .apg-assistant-body{background:var(--scout-surface)!important}
body[data-scout-v5="true"] .scout-v5-mini{position:relative;display:grid!important;place-items:center!important;border-radius:50%!important;background:linear-gradient(145deg,var(--scout-blue),var(--scout-blue-dark))!important;color:transparent!important;font-size:0!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2),0 4px 10px rgba(37,99,235,.18)}
body[data-scout-v5="true"] .scout-v5-mini::before{content:'S';display:grid;place-items:center;width:17px;height:17px;border:1px solid rgba(255,255,255,.32);border-radius:50%;color:#fff;font-size:9px;font-weight:950;line-height:1;background:rgba(255,255,255,.08)}
body[data-scout-v5="true"] .scout-v5-mini::after{content:'';position:absolute;right:-1px;bottom:0;width:6px;height:6px;border:1.5px solid var(--scout-surface);border-radius:50%;background:var(--scout-cyan)}
body[data-scout-v5="true"] .scout-v5-bubble{color:var(--scout-navy);border-color:var(--scout-line)}
body[data-scout-v5="true"] .scout-v5-row.user .scout-v5-bubble{background:var(--scout-navy);border-color:var(--scout-navy)}
body[data-scout-v5="true"] .scout-v5-kicker,body[data-scout-v5="true"] .scout-kicker{color:var(--scout-blue-dark)!important}
body[data-scout-v5="true"] .scout-v5-chip{border-color:var(--scout-line-strong);color:var(--scout-navy)}
body[data-scout-v5="true"] .scout-v5-chip:hover{border-color:var(--scout-blue);background:var(--scout-blue-soft)}
body[data-scout-v5="true"] .scout-v5-card{border-color:var(--scout-line)}
body[data-scout-v5="true"] .scout-v5-card h4{color:var(--scout-navy)}
body[data-scout-v5="true"] .scout-v5-card-brand,body[data-scout-v5="true"] .scout-v5-card-meta,body[data-scout-v5="true"] .scout-v5-status{color:var(--scout-slate)}
body[data-scout-v5="true"] .scout-v5-card-copy{color:#334155}
body[data-scout-v5="true"] .scout-v5-card-watch{background:var(--scout-light);color:#475569}
body[data-scout-v5="true"] .scout-v5-card-actions a,body[data-scout-v5="true"] .scout-v5-card-actions button,body[data-scout-v5="true"] .scout-v5-action{border-color:var(--scout-line-strong);color:var(--scout-blue-dark)}
body[data-scout-v5="true"] .scout-v5-card-actions a:hover,body[data-scout-v5="true"] .scout-v5-card-actions button:hover,body[data-scout-v5="true"] .scout-v5-action:hover{border-color:var(--scout-blue);background:var(--scout-blue-soft)}
body[data-scout-v5="true"] .scout-v5-action.primary,body[data-scout-v5="true"] .scout-v5-send,body[data-scout-v5="true"] .scout-send{background:var(--scout-blue)!important;border-color:var(--scout-blue)!important;color:#fff!important}
body[data-scout-v5="true"] .scout-v5-dot{background:var(--scout-cyan)}
body[data-scout-v5="true"] .scout-v5-input:focus{border-color:var(--scout-blue);outline-color:rgba(37,99,235,.14)}
body[data-scout-v5="true"] .scout-v5-new:hover,body[data-scout-v5="true"] .apg-assistant-close:hover{background:rgba(255,255,255,.18)!important}
@media(max-width:640px){body[data-scout-v5="true"] .apg-assistant-head{min-height:74px!important;padding-left:14px!important;padding-right:12px!important}body[data-scout-v5="true"] .apg-assistant-avatar{width:38px!important;height:38px!important}}
@media(prefers-reduced-motion:reduce){body[data-scout-v5="true"] .apg-assistant-launcher{transition:none!important}}
`;
module.exports={css};
