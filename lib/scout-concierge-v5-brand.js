// Scout v5 brand overrides align to APG Brand Conformity v35.2.
// Preserve the approved illustrated Scout character across closed and open states.
// Do not reintroduce retired dark-teal/mint Scout surfaces.
const css=String.raw`
body[data-scout-v5="true"]{--scout-blue:var(--apg351-blue,#2563EB);--scout-blue-dark:var(--apg351-blue-dark,#1D4ED8);--scout-navy:var(--apg351-navy,#0F172A);--scout-cyan:var(--apg351-teal,#06B6D4);--scout-light:var(--apg351-light,#F1F5F9);--scout-surface:var(--apg351-surface,#F8FAFC);--scout-slate:var(--apg351-slate,#64748B);--scout-line:var(--apg351-line,#E2E8F0);--scout-line-strong:var(--apg351-line-strong,#CBD5E1);--scout-blue-soft:var(--apg351-blue-soft,#EFF6FF);--scout-blue-line:var(--apg351-blue-line,#BFDBFE)}
body[data-scout-v5="true"] .apg-assistant-head{background:linear-gradient(135deg,var(--scout-navy),#172554)!important;color:#fff!important;border-bottom:1px solid rgba(255,255,255,.08)}
body[data-scout-v5="true"] .apg-assistant-brand{gap:12px!important;min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand>span:last-child{min-width:0}
body[data-scout-v5="true"] .apg-assistant-brand strong{letter-spacing:-.01em}
body[data-scout-v5="true"] .apg-assistant-brand small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
body[data-scout-v5="true"] .apg-assistant-avatar,body[data-scout-v5="true"] .apg-assistant-launcher-icon{display:grid!important;place-items:center!important;flex:0 0 auto!important;width:44px!important;height:44px!important;padding:0!important;overflow:visible!important;background:transparent!important;color:inherit!important;font-size:inherit!important;box-shadow:none!important}
body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34,body[data-scout-v5="true"] .apg-assistant-launcher-icon .apg-scout-character-v34{display:grid!important;width:44px!important;height:44px!important;filter:drop-shadow(0 6px 12px rgba(15,23,42,.18))}
body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34 svg,body[data-scout-v5="true"] .apg-assistant-launcher-icon .apg-scout-character-v34 svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}
body[data-scout-v5="true"] .apg-assistant-launcher{background:var(--scout-navy)!important;border-color:#1E293B!important;color:#fff!important;box-shadow:0 16px 42px rgba(15,23,42,.22)!important;transition:opacity .16s ease,visibility .16s ease,transform .18s ease,box-shadow .18s ease!important}
body.scout-v5-open[data-scout-v5="true"] .apg-assistant-launcher{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(12px) scale(.96)!important}
@media(min-width:641px){body[data-scout-v5="true"] .apg-assistant-panel{bottom:22px!important;max-height:min(780px,calc(100dvh - 44px))!important;border-color:rgba(148,163,184,.32)!important;box-shadow:0 28px 90px rgba(15,23,42,.28)!important}}
body[data-scout-v5="true"] .apg-assistant-body{background:var(--scout-surface)!important}
body[data-scout-v5="true"] .scout-v5-mini{display:grid!important;place-items:center!important;width:28px!important;height:28px!important;flex:0 0 28px!important;border-radius:50%!important;overflow:visible!important;background:transparent!important;box-shadow:none!important;margin-top:1px!important}
body[data-scout-v5="true"] .scout-v5-mini .apg-scout-character-v34{display:grid!important;width:28px!important;height:28px!important;filter:drop-shadow(0 3px 7px rgba(15,23,42,.14))}
body[data-scout-v5="true"] .scout-v5-mini .apg-scout-character-v34 svg{display:block!important;width:100%!important;height:100%!important;overflow:visible!important}
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
@media(max-width:640px){body[data-scout-v5="true"] .apg-assistant-head{min-height:74px!important;padding-left:14px!important;padding-right:12px!important}body[data-scout-v5="true"] .apg-assistant-avatar,body[data-scout-v5="true"] .apg-assistant-avatar .apg-scout-character-v34{width:42px!important;height:42px!important}}
@media(prefers-reduced-motion:reduce){body[data-scout-v5="true"] .apg-assistant-launcher{transition:none!important}}
`;
module.exports={css};
