// Scout v5 brand overrides deliberately reuse APG's existing design tokens.
const css=String.raw`
body[data-scout-v5="true"] .scout-v5-bubble{color:var(--v7-text,#142d37);border-color:var(--v7-line,#d9e4e2)}
body[data-scout-v5="true"] .scout-v5-row.user .scout-v5-bubble{background:var(--v7-ink,#092b3d);border-color:var(--v7-ink,#092b3d)}
body[data-scout-v5="true"] .scout-v5-kicker{color:var(--v7-teal,#08786f)}
body[data-scout-v5="true"] .scout-v5-chip{border-color:var(--v7-line-strong,#bdd2ce);color:var(--v7-ink,#092b3d)}
body[data-scout-v5="true"] .scout-v5-chip:hover{border-color:var(--v7-teal,#08786f);background:var(--v7-mint,#e7f5f1)}
body[data-scout-v5="true"] .scout-v5-card{border-color:var(--v7-line,#d9e4e2)}
body[data-scout-v5="true"] .scout-v5-card h4{color:var(--v7-ink,#092b3d)}
body[data-scout-v5="true"] .scout-v5-card-brand,body[data-scout-v5="true"] .scout-v5-card-meta,body[data-scout-v5="true"] .scout-v5-status{color:var(--v7-muted,#60747b)}
body[data-scout-v5="true"] .scout-v5-card-copy{color:var(--v7-text,#142d37)}
body[data-scout-v5="true"] .scout-v5-card-actions a,body[data-scout-v5="true"] .scout-v5-card-actions button,body[data-scout-v5="true"] .scout-v5-action{border-color:var(--v7-line-strong,#bdd2ce);color:var(--v7-ink,#092b3d)}
body[data-scout-v5="true"] .scout-v5-action.primary,body[data-scout-v5="true"] .scout-v5-send{background:var(--v7-teal,#08786f);border-color:var(--v7-teal,#08786f)}
body[data-scout-v5="true"] .scout-v5-dot{background:var(--v7-signal,#f4b45f)}
body[data-scout-v5="true"] .scout-v5-input:focus{border-color:var(--v7-teal,#08786f);outline-color:rgba(8,120,111,.14)}
`;
module.exports={css};
