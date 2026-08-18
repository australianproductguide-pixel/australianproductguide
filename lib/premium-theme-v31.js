// APG Premium Theme v31.
// Applies the approved Premium Brand v30 palette and visual language site-wide while
// preserving the existing SSR-first product, decision, account, retailer and affiliate logic.
const upstream=require('./premium-brand-v30');

const VERSION='31';
const CSS_PATH='/assets/premium-theme-v31.css';

const css=`
/* Australian Product Guide Premium Theme v31
   Approved palette: Blue #2563EB · Navy #0F172A · Teal #06B6D4 · Green #10B981
   Light Grey #F1F5F9 · Slate #64748B. */
:root{
  --apg31-blue:#2563EB;--apg31-blue-dark:#1D4ED8;--apg31-blue-deep:#1E40AF;--apg31-blue-soft:#EFF6FF;
  --apg31-navy:#0F172A;--apg31-navy-2:#111C33;--apg31-navy-3:#172554;--apg31-teal:#06B6D4;
  --apg31-green:#10B981;--apg31-green-dark:#047857;--apg31-green-soft:#ECFDF5;
  --apg31-canvas:#F8FAFC;--apg31-grey:#F1F5F9;--apg31-line:#E2E8F0;--apg31-line-strong:#CBD5E1;
  --apg31-slate:#64748B;--apg31-text:#1E293B;--apg31-white:#FFFFFF;
  --apg31-shadow:0 14px 38px rgba(15,23,42,.08);--apg31-shadow-lg:0 28px 72px rgba(15,23,42,.16);
  --navy:#0F172A;--navy2:#172554;--teal:#2563EB;--teal2:#1D4ED8;--mint:#EFF6FF;--aqua:#F0F9FF;
  --sand:#F8FAFC;--cream:#FFFFFF;--sun:#06B6D4;--ink:#1E293B;--muted:#64748B;--line:#E2E8F0;--line2:#F1F5F9;
  --success:#ECFDF5;--soft:#F8FAFC;
  --apg-ink:#0F172A;--apg-navy:#0F172A;--apg-navy-deep:#0B1220;--apg-teal:#2563EB;--apg-teal-dark:#1D4ED8;
  --apg-mint:#EFF6FF;--apg-sky:#F0F9FF;--apg-sand:#F8FAFC;--apg-gold:#06B6D4;--apg-canvas:#F8FAFC;
  --apg-muted:#64748B;--apg-line:#E2E8F0;--apg-line-strong:#CBD5E1;
  --v5-ink:#0F172A;--v5-teal:#2563EB;--v5-mint:#EFF6FF;--v5-cream:#F8FAFC;--v5-gold:#06B6D4;--v5-line:rgba(15,23,42,.10);
  --v7-ink:#0F172A;--v7-ink-2:#172554;--v7-teal:#2563EB;--v7-teal-2:#1D4ED8;--v7-mint:#EFF6FF;--v7-mint-2:#DBEAFE;
  --v7-cream:#F8FAFC;--v7-sand:#F1F5F9;--v7-signal:#06B6D4;--v7-sky:#E0F2FE;--v7-text:#1E293B;--v7-muted:#64748B;
  --v7-line:#E2E8F0;--v7-line-strong:#CBD5E1;--v7-shadow:0 18px 50px rgba(15,23,42,.10);--v7-shadow-soft:0 8px 26px rgba(15,23,42,.07);
  --apg9-ink:#0F172A;--apg9-navy:#0F172A;--apg9-navy-2:#172554;--apg9-teal:#2563EB;--apg9-teal-dark:#1D4ED8;
  --apg9-gold:#06B6D4;--apg9-gold-soft:#ECFEFF;--apg9-soft:#F8FAFC;--apg9-soft-2:#F1F5F9;--apg9-line:#E2E8F0;
  --apg9-line-dark:#CBD5E1;--apg9-muted:#64748B;--apg9-shadow:0 12px 32px rgba(15,23,42,.08);--apg9-shadow-hover:0 18px 42px rgba(15,23,42,.12);
}
html{background:#fff}
body[data-theme-v31=true]{background:#fff!important;color:var(--apg31-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
body[data-theme-v31=true]:before{content:""!important;position:fixed!important;z-index:400!important;inset:0 0 auto!important;height:3px!important;background:linear-gradient(90deg,#2563EB 0 55%,#06B6D4 78%,#10B981 100%)!important;pointer-events:none!important}
body[data-theme-v31=true] h1,body[data-theme-v31=true] h2,body[data-theme-v31=true] h3{color:var(--apg31-navy)!important}
body[data-theme-v31=true] p{color:#475569}
body[data-theme-v31=true] .kicker,body[data-theme-v31=true] .eyebrow{color:var(--apg31-blue)!important}
body[data-theme-v31=true] a{color:var(--apg31-blue-dark)}
body[data-theme-v31=true] a:focus-visible,body[data-theme-v31=true] button:focus-visible,body[data-theme-v31=true] input:focus-visible,body[data-theme-v31=true] select:focus-visible,body[data-theme-v31=true] textarea:focus-visible,body[data-theme-v31=true] summary:focus-visible{outline:3px solid rgba(37,99,235,.34)!important;outline-offset:3px!important}

/* Core actions */
body[data-theme-v31=true] .button:not(.secondary),body[data-theme-v31=true] .global-search button,body[data-theme-v31=true] .apg-amazon-cta{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important;color:#fff!important;box-shadow:none!important}
body[data-theme-v31=true] .button:not(.secondary):hover,body[data-theme-v31=true] .global-search button:hover,body[data-theme-v31=true] .apg-amazon-cta:hover{background:var(--apg31-blue-dark)!important;border-color:var(--apg31-blue-dark)!important;color:#fff!important}
body[data-theme-v31=true] .button.secondary{background:#fff!important;color:var(--apg31-navy)!important;border-color:var(--apg31-line-strong)!important}
body[data-theme-v31=true] .button.secondary:hover{background:var(--apg31-blue-soft)!important;border-color:#93C5FD!important;color:var(--apg31-blue-deep)!important}
body[data-theme-v31=true] .text-link,body[data-theme-v31=true] .text-button,body[data-theme-v31=true] .apg-power-link{color:var(--apg31-blue)!important}
body[data-theme-v31=true] .pill.good,body[data-theme-v31=true] .evidence-deep,body[data-theme-v31=true] .independence-badge{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important;border-color:#A7F3D0!important}
body[data-theme-v31=true] .evidence-starter{background:#F8FAFC!important;color:#475569!important;border-color:#CBD5E1!important}
body[data-theme-v31=true] .apg-card-purchase,body[data-theme-v31=true] .apg-context-purchase{background:var(--apg31-blue-soft)!important;border-color:#BFDBFE!important;color:var(--apg31-blue-deep)!important}
body[data-theme-v31=true] .apg-card-purchase:hover,body[data-theme-v31=true] .apg-context-purchase:hover{background:#DBEAFE!important;border-color:#93C5FD!important;color:var(--apg31-blue-deep)!important}

/* Header and navigation — dark premium application from the approved brand board */
body[data-theme-v31=true] .site-header{background:var(--apg31-navy)!important;border-bottom:1px solid #1E293B!important;box-shadow:0 8px 28px rgba(15,23,42,.16)!important;backdrop-filter:none!important}
body[data-theme-v31=true] .utility{background:#090F1D!important;border-bottom:1px solid rgba(255,255,255,.08)!important;color:#CBD5E1!important}
body[data-theme-v31=true] .utility-inner,body[data-theme-v31=true] .utility a{color:#E2E8F0!important}
body[data-theme-v31=true] .masthead{background:var(--apg31-navy)!important}
body[data-theme-v31=true] .site-header .apg-brand-v30-name{color:#fff!important}
body[data-theme-v31=true] .site-header .apg-brand-v30-product{color:#7CA9FF!important}
body[data-theme-v31=true] .site-header .apg-brand-v30-monogram{color:#fff!important}
body[data-theme-v31=true] .site-header .brand:focus-visible{outline-color:#60A5FA!important}
body[data-theme-v31=true] .site-header .global-search{background:#fff!important;border-color:#CBD5E1!important;box-shadow:0 8px 24px rgba(0,0,0,.18)!important}
body[data-theme-v31=true] .site-header .global-search:focus-within{border-color:#60A5FA!important;box-shadow:0 0 0 4px rgba(37,99,235,.20),0 10px 30px rgba(0,0,0,.18)!important}
body[data-theme-v31=true] .site-header .global-search input{color:var(--apg31-navy)!important}
body[data-theme-v31=true] .site-header .global-search svg{color:#64748B!important;stroke:currentColor!important}
body[data-theme-v31=true] .header-action,body[data-theme-v31=true] .apg-member-login-v19{background:transparent!important;border-color:#475569!important;color:#F8FAFC!important}
body[data-theme-v31=true] .header-action:hover,body[data-theme-v31=true] .apg-member-login-v19:hover{background:#172554!important;border-color:#64748B!important;color:#fff!important}
body[data-theme-v31=true] .apg-member-join-v19{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important;color:#fff!important;box-shadow:none!important}
body[data-theme-v31=true] .apg-member-join-v19:hover{background:var(--apg31-blue-dark)!important;border-color:var(--apg31-blue-dark)!important}
body[data-theme-v31=true] .apg-nav-v8,body[data-theme-v31=true] .primary-nav{background:var(--apg31-navy)!important;border-top:1px solid #1E293B!important;border-bottom:1px solid #1E293B!important;box-shadow:none!important}
body[data-theme-v31=true] .apg-nav-v8 .nav-inner>a,body[data-theme-v31=true] .apg-nav-v8 .nav-trigger,body[data-theme-v31=true] .apg-v26-scout-nav{color:#E2E8F0!important}
body[data-theme-v31=true] .apg-nav-v8 .nav-inner>a:hover,body[data-theme-v31=true] .apg-nav-v8 .nav-trigger:hover,body[data-theme-v31=true] .apg-nav-v8 .nav-trigger[aria-expanded=true],body[data-theme-v31=true] .apg-v26-scout-nav:hover{background:#172554!important;color:#fff!important}
body[data-theme-v31=true] .apg-nav-v8 .apg-power-link{color:#7CA9FF!important}
body[data-theme-v31=true] .apg-nav-v8 .nav-trust{color:#CBD5E1!important}
body[data-theme-v31=true] .mobile-toggle{background:transparent!important;border-color:#475569!important;color:#fff!important}
body[data-theme-v31=true] .mobile-toggle svg{stroke:#fff!important}
body[data-theme-v31=true] .apg-discovery-menu .apg-mega-shell{border-color:var(--apg31-line)!important;box-shadow:var(--apg31-shadow-lg)!important}
body[data-theme-v31=true] .apg-mega-head{background:var(--apg31-canvas)!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .apg-mega-eyebrow{color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-mega-head-actions .apg-mega-decision{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-mega-category:hover,body[data-theme-v31=true] .apg-mega-category:focus-visible{background:var(--apg31-blue-soft)!important;color:var(--apg31-blue-deep)!important}
body[data-theme-v31=true] .apg-mega-icon{background:var(--apg31-blue-soft)!important;color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-mega-group:nth-child(2) .apg-mega-icon{background:#ECFEFF!important;color:#0891B2!important}
body[data-theme-v31=true] .apg-mega-group:nth-child(3) .apg-mega-icon{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important}
body[data-theme-v31=true] .apg-mega-group:nth-child(4) .apg-mega-icon{background:#F1F5F9!important;color:#475569!important}
body[data-theme-v31=true] .apg-mega-footer{background:#F8FAFC!important;border-color:var(--apg31-line)!important}

/* Homepage */
body[data-theme-v31=true] .apg-home-hero-v9{background:radial-gradient(circle at 88% 8%,rgba(37,99,235,.12),transparent 31%),radial-gradient(circle at 100% 65%,rgba(6,182,212,.07),transparent 27%),linear-gradient(135deg,#FFFFFF 0%,#F8FAFC 66%,#EFF6FF 100%)!important;border-bottom-color:var(--apg31-line)!important}
body[data-theme-v31=true] .apg-home-hero-copy-v9 h1{color:var(--apg31-navy)!important}
body[data-theme-v31=true] .apg-home-search-v9{background:#F1F5F9!important;border-color:#CBD5E1!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9{background:linear-gradient(145deg,#0F172A,#172554)!important;border-color:#26355C!important;box-shadow:0 22px 55px rgba(15,23,42,.18)!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9:before{background:rgba(37,99,235,.22)!important}
body[data-theme-v31=true] .apg-home-panel-label-v9{background:#DBEAFE!important;color:#1E40AF!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9 li>b{background:#1E293B!important;color:#7CA9FF!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9>a b{color:#38BDF8!important}
body[data-theme-v31=true] .apg-proof-band-v20,body[data-theme-v31=true] .apg-home-proof-v9{background:var(--apg31-navy)!important;border-color:#1E293B!important;color:#fff!important}
body[data-theme-v31=true] .apg-proof-band-v20 *,body[data-theme-v31=true] .apg-home-proof-v9 strong{color:#fff!important}
body[data-theme-v31=true] .apg-proof-band-v20 .apg-proof-trust-v20,body[data-theme-v31=true] .apg-home-proof-v9 span{color:#CBD5E1!important}
body[data-theme-v31=true] .apg-home-soft-v9,body[data-theme-v31=true] .apg-v12-situations{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .apg-v12-filter button{background:#fff!important;border-color:var(--apg31-line-strong)!important;color:#475569!important}
body[data-theme-v31=true] .apg-v12-filter button[aria-pressed=true]{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important;color:#fff!important}
body[data-theme-v31=true] .apg-v12-card,body[data-theme-v31=true] .apg-home-category-v9,body[data-theme-v31=true] .apg-home-journey-v9,body[data-theme-v31=true] .apg-home-research-v9,body[data-theme-v31=true] .apg-home-governance-grid-v9{border-color:var(--apg31-line)!important;background:#fff!important;box-shadow:none!important}
body[data-theme-v31=true] .apg-v12-card:hover,body[data-theme-v31=true] .apg-home-category-v9:hover,body[data-theme-v31=true] .apg-home-journey-v9:hover,body[data-theme-v31=true] .apg-home-research-v9:hover{border-color:#93C5FD!important;box-shadow:var(--apg31-shadow)!important}
body[data-theme-v31=true] .apg-v12-icon,body[data-theme-v31=true] .apg-home-category-icon-v9{background:var(--apg31-blue-soft)!important;color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-home-journey-v9>span{background:#ECFEFF!important;color:#0E7490!important}
body[data-theme-v31=true] .apg-home-category-v9:hover>b,body[data-theme-v31=true] .apg-home-section-head-v9>a,body[data-theme-v31=true] .apg-home-journey-v9 a,body[data-theme-v31=true] .apg-home-research-v9>span,body[data-theme-v31=true] .apg-home-research-v9>div a{color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-national-v10{background:#fff!important}
body[data-theme-v31=true] .apg-national-card{border-color:var(--apg31-line)!important;background:linear-gradient(145deg,#fff,#F8FAFC)!important}
body[data-theme-v31=true] .apg-national-card:hover{border-color:#93C5FD!important;box-shadow:var(--apg31-shadow)!important}
body[data-theme-v31=true] .apg-home-trust-v9{background:linear-gradient(145deg,#0B1220,#0F172A 58%,#172554)!important}
body[data-theme-v31=true] .apg-home-trust-copy-v9 .kicker{color:#38BDF8!important}
body[data-theme-v31=true] .apg-home-trust-points-v9{background:#26355C!important;border-color:#26355C!important}
body[data-theme-v31=true] .apg-home-trust-points-v9 article{background:#111C33!important}
body[data-theme-v31=true] .apg-home-gold-button-v9{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important;color:#fff!important}
body[data-theme-v31=true] .apg-home-dark-secondary-v9{border-color:#475569!important;color:#fff!important;background:transparent!important}

/* Global surfaces, cards, categories and product visuals */
body[data-theme-v31=true] main{background:#fff}
body[data-theme-v31=true] .soft-section,body[data-theme-v31=true] .soft-panel,body[data-theme-v31=true] .filter-bar,body[data-theme-v31=true] .finder,body[data-theme-v31=true] .decision-examples,body[data-theme-v31=true] .platform-policy-note{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .category-card,body[data-theme-v31=true] .product-card,body[data-theme-v31=true] .feature-card,body[data-theme-v31=true] .comparison-card,body[data-theme-v31=true] .guide-card,body[data-theme-v31=true] .brand-card,body[data-theme-v31=true] .platform-hub-card,body[data-theme-v31=true] .workspace-panel,body[data-theme-v31=true] .winner-card,body[data-theme-v31=true] .alternative-card,body[data-theme-v31=true] .retailer-panel,body[data-theme-v31=true] .evidence-box,body[data-theme-v31=true] .fact-card{border-color:var(--apg31-line)!important;background:#fff!important;box-shadow:none!important}
body[data-theme-v31=true] .category-card:hover,body[data-theme-v31=true] .product-card:hover,body[data-theme-v31=true] .feature-card:hover,body[data-theme-v31=true] .comparison-card:hover,body[data-theme-v31=true] .guide-card:hover,body[data-theme-v31=true] .brand-card:hover,body[data-theme-v31=true] .platform-hub-card:hover{border-color:#93C5FD!important;box-shadow:var(--apg31-shadow)!important}
body[data-theme-v31=true] .v7-category-scene,body[data-theme-v31=true] .v7-semantic-product-visual,body[data-theme-v31=true] .product-visual{--scene:#2563EB;--scene2:#EFF6FF;background:linear-gradient(145deg,#EFF6FF 0%,#F8FAFC 62%,#FFFFFF 100%)!important;border-color:#DBEAFE!important}
body[data-theme-v31=true] [data-v7-category="home-security-cameras"],body[data-theme-v31=true] [data-v7-category="smart-doorbells"],body[data-theme-v31=true] [data-v7-category="mesh-wifi-systems"],body[data-theme-v31=true] [data-v7-category="robot-vacuums"],body[data-theme-v31=true] [data-v7-category="stick-vacuums"],body[data-theme-v31=true] [data-v7-category="air-purifiers"]{--scene:#047857;--scene2:#ECFDF5}
body[data-theme-v31=true] [data-v7-category="wireless-headphones"],body[data-theme-v31=true] [data-v7-category="earbuds"],body[data-theme-v31=true] [data-v7-category="bluetooth-speakers"],body[data-theme-v31=true] [data-v7-category="soundbars"]{--scene:#0891B2;--scene2:#ECFEFF}
body[data-theme-v31=true] .v7-category-scene:before{background:radial-gradient(circle,rgba(37,99,235,.14),rgba(37,99,235,0) 70%)!important}
body[data-theme-v31=true] .v7-scene-icon{background:#fff!important;border-color:#DBEAFE!important;color:var(--scene,#2563EB)!important}
body[data-theme-v31=true] .product-visual.large{background:linear-gradient(145deg,#F8FAFC,#EFF6FF)!important}
body[data-theme-v31=true] .best-for{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .best-for strong{color:var(--apg31-blue)!important;background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .retailer-row:hover{background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .retailer-logo{background:var(--apg31-navy)!important;color:#fff!important}
body[data-theme-v31=true] .official-logo{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important}
body[data-theme-v31=true] .retailer-action{color:var(--apg31-blue)!important}
body[data-theme-v31=true] .pros{background:var(--apg31-green-soft)!important;border-color:#A7F3D0!important}
body[data-theme-v31=true] .cons,body[data-theme-v31=true] .decision-caution{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .decision-card{background:#F8FAFC!important;border-color:var(--apg31-line)!important;border-left:4px solid var(--apg31-blue)!important}
body[data-theme-v31=true] .evidence-box{background:linear-gradient(145deg,#F8FAFC,#EFF6FF)!important}

/* Page heroes, search, Decision Lab and comparisons */
body[data-theme-v31=true] .hero-shell,body[data-theme-v31=true] .category-hero,body[data-theme-v31=true] .product-hero,body[data-theme-v31=true] .policy-hero{background:linear-gradient(135deg,#FFFFFF,#F8FAFC 70%,#EFF6FF)!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .category-hero-art,body[data-theme-v31=true] .policy-hero-mark,body[data-theme-v31=true] .brand-monogram{background:linear-gradient(145deg,#0F172A,#172554)!important;border-color:#26355C!important;color:#fff!important}
body[data-theme-v31=true] .category-hero-art .category-icon,body[data-theme-v31=true] .policy-hero-mark .category-icon{color:#60A5FA!important;background:rgba(255,255,255,.08)!important}
body[data-theme-v31=true] .search-hero,body[data-theme-v31=true] .decision-hero{background:linear-gradient(135deg,#0B1220 0%,#0F172A 48%,#172554 76%,#1E40AF 100%)!important;color:#fff!important}
body[data-theme-v31=true] .search-hero h1,body[data-theme-v31=true] .decision-hero h1,body[data-theme-v31=true] .search-hero .kicker,body[data-theme-v31=true] .decision-hero .kicker{color:#fff!important}
body[data-theme-v31=true] .search-hero .lede,body[data-theme-v31=true] .decision-hero .lede{color:#CBD5E1!important}
body[data-theme-v31=true] .decision-engine-card{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.18)!important}
body[data-theme-v31=true] .decision-engine-card .engine-status{background:#DBEAFE!important;color:#1E40AF!important}
body[data-theme-v31=true] .decision-form{border-color:var(--apg31-line)!important;box-shadow:var(--apg31-shadow)!important}
body[data-theme-v31=true] .decision-query textarea:focus,body[data-theme-v31=true] .decision-fields input:focus,body[data-theme-v31=true] .decision-fields select:focus{border-color:var(--apg31-blue)!important;outline:3px solid rgba(37,99,235,.15)!important}
body[data-theme-v31=true] .decision-result-top{border-color:#93C5FD!important;box-shadow:0 16px 44px rgba(37,99,235,.08)!important}
body[data-theme-v31=true] .decision-rank,body[data-theme-v31=true] .decision-coverage,body[data-theme-v31=true] .decision-reasons{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .decision-match.strong,body[data-theme-v31=true] .decision-match.good{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important}
body[data-theme-v31=true] .decision-disclaimer{border-left-color:var(--apg31-blue)!important;background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .difference-engine,body[data-theme-v31=true] .v6-diff-summary article:first-child{background:linear-gradient(145deg,#0F172A,#172554)!important}
body[data-theme-v31=true] .difference-engine:after{background:radial-gradient(circle,rgba(37,99,235,.28),transparent 66%)!important}
body[data-theme-v31=true] .v6-diff-index{background:linear-gradient(135deg,#2563EB,#06B6D4)!important;box-shadow:none!important}
body[data-theme-v31=true] .compare thead th,body[data-theme-v31=true] .comparison-table th{background:var(--apg31-navy)!important;color:#fff!important}
body[data-theme-v31=true] .winner-card.recommended,body[data-theme-v31=true] .result-hero{background:linear-gradient(145deg,#fff,#EFF6FF)!important;border-color:#93C5FD!important}
body[data-theme-v31=true] .vs-badge,body[data-theme-v31=true] .big-vs{background:#DBEAFE!important;color:#1E40AF!important}
body[data-theme-v31=true] .v7-signature-illustration,body[data-theme-v31=true] .v7-decision-art,body[data-theme-v31=true] .v7-brand-art{background:linear-gradient(145deg,#172554,#2563EB)!important}
body[data-theme-v31=true] .v7-workspace-art,body[data-theme-v31=true] .v7-search-art,body[data-theme-v31=true] .v7-guide-art,body[data-theme-v31=true] .v7-retailer-art,body[data-theme-v31=true] .v7-trust-art{background:linear-gradient(145deg,#EFF6FF,#F8FAFC)!important}

/* Account and profile */
body[data-theme-v31=true] .apg-profile-hero-v24{border-color:var(--apg31-line)!important;background:linear-gradient(135deg,#F8FAFC,#EFF6FF)!important}
body[data-theme-v31=true] .apg-profile-avatar-v24,body[data-theme-v31=true] .apg-verification-icon-v24{background:var(--apg31-blue)!important;box-shadow:none!important}
body[data-theme-v31=true] .apg-profile-email-v24,body[data-theme-v31=true] .apg-profile-card-v24 h3,body[data-theme-v31=true] .apg-profile-detail-v24 strong{color:var(--apg31-navy)!important}
body[data-theme-v31=true] .apg-profile-badge-v24{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important}
body[data-theme-v31=true] .apg-profile-tabs-v24{background:#F1F5F9!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .apg-profile-tabs-v24 button[aria-selected=true]{color:var(--apg31-blue)!important;background:#fff!important}
body[data-theme-v31=true] .apg-profile-card-v24,body[data-theme-v31=true] .apg-profile-data-item-v24,body[data-theme-v31=true] .apg-profile-stat-v24{border-color:var(--apg31-line)!important;background:#fff!important}
body[data-theme-v31=true] .apg-profile-stat-v24 strong,body[data-theme-v31=true] .apg-profile-link-v24{color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-profile-callout-v24,body[data-theme-v31=true] .apg-verification-v24,body[data-theme-v31=true] .apg-account-flash-v24{background:var(--apg31-blue-soft)!important;border-color:#BFDBFE!important}
body[data-theme-v31=true] .apg-profile-callout-v24 svg,body[data-theme-v31=true] .apg-profile-data-icon-v24{color:var(--apg31-blue)!important;stroke:var(--apg31-blue)!important;background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .apg-profile-message-v24.is-success{color:var(--apg31-green-dark)!important}

/* Trust, policy and editorial */
body[data-theme-v31=true] .policy-nav,body[data-theme-v31=true] .policy-toc,body[data-theme-v31=true] .related-policies{background:#F8FAFC!important;border-color:var(--apg31-line)!important}
body[data-theme-v31=true] .policy-nav a:hover,body[data-theme-v31=true] .policy-nav a[aria-current=page]{background:var(--apg31-blue-soft)!important;color:var(--apg31-blue)!important}
body[data-theme-v31=true] .guide-body blockquote,body[data-theme-v31=true] .decision-callout{border-left-color:var(--apg31-blue)!important;background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .guide-body th{background:#F1F5F9!important;color:var(--apg31-navy)!important}

/* Footer — replace the legacy charcoal with APG Navy */
body[data-theme-v31=true] footer.apg-footer-v11{background:var(--apg31-navy)!important;color:#CBD5E1!important;border-top:4px solid var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-wordmark{color:#fff!important}
body[data-theme-v31=true] .apg-footer-v11 .apg-brand-v30-name{color:#fff!important}
body[data-theme-v31=true] .apg-footer-v11 .apg-brand-v30-product{color:#7CA9FF!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-group h3,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-group a,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-rulebar,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-rulebar a{color:#F8FAFC!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-rulebar{border-color:#334155!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-market,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-disclosure,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-proud,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-ack,body[data-theme-v31=true] .apg-footer-v11 .footer-v11-rights{color:#94A3B8!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-disclosure strong{color:#E2E8F0!important}
body[data-theme-v31=true] .apg-footer-v11 .footer-v11-country{background:#fff!important;color:var(--apg31-navy)!important}

/* Scout */
body[data-theme-v31=true] .apg-assistant-launcher{background:var(--apg31-navy)!important;border-color:#334155!important;box-shadow:0 16px 44px rgba(15,23,42,.24)!important}
body[data-theme-v31=true] .apg-assistant-launcher:hover{background:#172554!important;border-color:#475569!important}
body[data-theme-v31=true] .apg-assistant-launcher-icon,body[data-theme-v31=true] .apg-assistant-avatar{background:#EFF6FF!important;color:var(--apg31-blue)!important}
body[data-theme-v31=true] .apg-assistant-head{background:linear-gradient(135deg,#0F172A,#172554)!important}
body[data-theme-v31=true] .apg-assistant-panel{border-color:var(--apg31-line)!important;box-shadow:var(--apg31-shadow-lg)!important}
body[data-theme-v31=true] .apg-assistant-body{background:linear-gradient(#F8FAFC,#fff)!important}
body[data-theme-v31=true] .apg-assistant-message.is-user .apg-assistant-bubble{background:var(--apg31-blue)!important;color:#fff!important}
body[data-theme-v31=true] .apg-assistant-message.is-bot .apg-assistant-bubble{background:var(--apg31-blue-soft)!important;color:var(--apg31-navy)!important}
body[data-theme-v31=true] .apg-assistant-option:hover{border-color:#93C5FD!important;background:var(--apg31-blue-soft)!important}
body[data-theme-v31=true] .apg-assistant-match{background:var(--apg31-green-soft)!important;color:var(--apg31-green-dark)!important}
body[data-theme-v31=true] .apg-assistant-action.primary{background:var(--apg31-blue)!important;border-color:var(--apg31-blue)!important;color:#fff!important}

/* Mobile — use the compact APG lockup from the approved application example */
@media(max-width:920px){
  body[data-theme-v31=true] .site-header{background:var(--apg31-navy)!important}
  body[data-theme-v31=true] .masthead{background:var(--apg31-navy)!important;min-height:72px!important;padding-top:10px!important;padding-bottom:10px!important}
  body[data-theme-v31=true] .site-header .brand{max-width:118px!important;min-width:0!important;width:auto!important}
  body[data-theme-v31=true] .site-header .apg-brand-v30-lockup{gap:7px!important}
  body[data-theme-v31=true] .site-header .apg-brand-v30-mark{width:38px!important;height:32px!important}
  body[data-theme-v31=true] .site-header .apg-brand-v30-type{display:none!important}
  body[data-theme-v31=true] .site-header .apg-brand-v30-monogram{display:inline-block!important;color:#fff!important;font-size:1.15rem!important}
  body[data-theme-v31=true] .apg-mobile-member-top-v20{display:flex!important;gap:7px!important;align-items:center!important}
  body[data-theme-v31=true] .apg-mobile-member-top-v20 a{min-height:42px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:8px 12px!important;border-radius:10px!important;text-decoration:none!important;font-weight:800!important}
  body[data-theme-v31=true] .apg-mobile-member-top-v20 a:not(.is-primary){background:transparent!important;border:1px solid #475569!important;color:#fff!important}
  body[data-theme-v31=true] .apg-mobile-member-top-v20 a.is-primary{background:var(--apg31-blue)!important;border:1px solid var(--apg31-blue)!important;color:#fff!important}
  body[data-theme-v31=true] .mobile-toggle{width:44px!important;height:44px!important;padding:0!important;justify-content:center!important}
  body[data-theme-v31=true] .mobile-toggle span{display:none!important}
  body[data-theme-v31=true] .mobile-nav{background:#fff!important;border-top:1px solid var(--apg31-line)!important;box-shadow:0 20px 45px rgba(15,23,42,.16)!important}
  body[data-theme-v31=true] .mobile-nav .global-search{background:#fff!important;border-color:var(--apg31-line-strong)!important;box-shadow:none!important}
  body[data-theme-v31=true] .mobile-section{border-color:var(--apg31-line)!important;background:#fff!important}
  body[data-theme-v31=true] .mobile-section summary,body[data-theme-v31=true] .mobile-section a{color:var(--apg31-navy)!important}
  body[data-theme-v31=true] .mobile-power{background:linear-gradient(135deg,#172554,#2563EB)!important;color:#fff!important}
  body[data-theme-v31=true] .apg-home-hero-v9{padding-top:52px!important}
}
@media(max-width:680px){
  body[data-theme-v31=true] .apg-home-hero-copy-v9 h1{font-size:clamp(2.75rem,13vw,4rem)!important}
  body[data-theme-v31=true] .apg-home-search-v9{background:#F1F5F9!important}
  body[data-theme-v31=true] .apg-home-hero-actions-v9 .button{border-radius:12px!important}
}
@media(max-width:380px){
  body[data-theme-v31=true] .site-header .brand{max-width:44px!important}
  body[data-theme-v31=true] .site-header .apg-brand-v30-monogram{display:none!important}
}
@media(prefers-reduced-motion:reduce){body[data-theme-v31=true] *{transition:none!important}}
`;

function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}

function injectTheme(html){
  let body=String(html||'');
  if(body.includes('data-theme-v31="true"'))return body;
  body=body.replace(/<meta name="theme-color" content="[^"]*">/i,'<meta name="theme-color" content="#0F172A">');
  body=body.replace(/<body\b([^>]*)>/i,'<body data-theme-v31="true"$1>');
  if(!body.includes(CSS_PATH))body=body.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  return body;
}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=injectTheme(body);
    return originalEnd(body,...args);
  };
  return upstream(req,res);
};

module.exports.css=css;
module.exports.injectTheme=injectTheme;
