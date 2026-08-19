// Scout v5 brand overrides align to APG Brand Conformity v35.2.
// Do not reintroduce retired dark-teal/mint Scout surfaces.
const css=String.raw`
body[data-scout-v5="true"]{--scout-blue:var(--apg351-blue,#2563EB);--scout-blue-dark:var(--apg351-blue-dark,#1D4ED8);--scout-navy:var(--apg351-navy,#0F172A);--scout-cyan:var(--apg351-teal,#06B6D4);--scout-light:var(--apg351-light,#F1F5F9);--scout-surface:var(--apg351-surface,#F8FAFC);--scout-slate:var(--apg351-slate,#64748B);--scout-line:var(--apg351-line,#E2E8F0);--scout-line-strong:var(--apg351-line-strong,#CBD5E1);--scout-blue-soft:var(--apg351-blue-soft,#EFF6FF);--scout-blue-line:var(--apg351-blue-line,#BFDBFE)}
body[data-scout-v5="true"] .apg-assistant-head{background:linear-gradient(135deg,var(--scout-navy),#172554)!important;color:#fff!important}
body[data-scout-v5="true"] .apg-assistant-avatar,body[data-scout-v5="true"] .apg-assistant-launcher-icon{background:var(--scout-blue)!important;color:#fff!important}
body[data-scout-v5="true"] .apg-assistant-launcher{background:var(--scout-navy)!important;border-color:#1E293B!important;color:#fff!important;box-shadow:0 16px 42px rgba(15,23,42,.22)!important}
body[data-scout-v5="true"] .apg-assistant-body{background:var(--scout-surface)!important}
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
`;
module.exports={css};
