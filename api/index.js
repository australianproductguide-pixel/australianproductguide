// APG Trust Centre Authoritative Runtime v82 is the outermost runtime layer.
// The eleven Trust Centre/company pages now take their substantive content from the
// single authoritative lib/content.js source. v82 only neutralises legacy technical
// account-status chrome injected by older shared runtime layers; it does not rewrite
// policy substance. Search v52 and the existing v81/v80 compatibility lineage remain
// unchanged underneath.
// Compatibility lineage: module.exports=require('../lib/consumer-surface-reconciliation-v81')
//
// APG Consumer Surface Reconciliation v81 remains authoritative underneath v82 for
// non-Trust consumer-facing wording. Its historical Trust copy replacements are now
// expected to be no-ops because Trust Centre substance is current at source.
//
// APG Search Platform Verification v80 remains authoritative immediately underneath.
// It guarantees the canonical Google Search Console HTML verification route returns
// only Google's exact verification body. Bing ownership is not fabricated: Bing uses
// the governed sitemap/robots/IndexNow surfaces until a genuine console import or
// verification token is evidenced. Search v52 remains the protected API contract.
// Compatibility lineage: module.exports=require('../lib/analytics-funnel-v79')
//
// APG Consent-Safe Analytics Funnel v79 remains authoritative immediately underneath.
// It blocks GA4 event queuing until analytics consent is granted, stops later event
// sending if consent is withdrawn, and adds privacy-minimised decision-funnel events
// without sending typed search terms, Decision Lab descriptions, Scout messages,
// account identifiers or URL query strings. Search v52 remains the protected API contract.
// Compatibility lineage: module.exports=require('../lib/footer-country-removal-v78')
//
// APG Footer Country Selector Removal v78 remains authoritative immediately underneath.
// APG currently serves Australia only, so the redundant footer country selector is
// removed from rendered HTML across desktop and mobile. Footer identity, navigation,
// social links and disclosure content are unchanged.
// Compatibility lineage: module.exports=require('../lib/navigation-blue-interactions-v77')
//
// APG Navigation Blue Interactions v77 remains authoritative immediately underneath.
// It replaces legacy teal/green navigation hover, focus and touch states with the
// current APG blue interaction language across the mobile menu and desktop mega menu.
// Navigation structure, links and behaviour are unchanged.
// Compatibility lineage: module.exports=require('../lib/homepage-situation-overlay-v701')
//
// APG Homepage Situation Overlay v70.1 remains authoritative immediately underneath.
// It left-aligns the icon + situation-label treatment across the homepage
// "What are you trying to improve?" cards and prevents the two overlays from
// colliding on narrow mobile viewports. Imagery, copy, filters and links are unchanged.
// Compatibility lineage: module.exports=require('../lib/premium-search-mobile-v761')
//
// APG Premium Search Mobile Cascade Fix v76.1 remains authoritative immediately underneath.
// It resolves the higher-specificity site-wide form rule that was still drawing an
// inner rounded search input on iOS/mobile, so the search now renders as one unified
// icon + field + Search button control. Search v52 behaviour remains unchanged.
// Compatibility lineage: module.exports=require('../lib/premium-search-v76')
//
// APG Premium Search Experience v76 remains authoritative immediately underneath.
// It upgrades the visual hierarchy, responsive proportions, focus states and
// suggestion surfaces of APG search while preserving Search v52 query handling,
// ranking, transport, analytics and interaction contracts unchanged.
// Compatibility lineage: module.exports=require('../lib/mobile-header-wordmark-v75')
//
// APG Mobile Header Full Wordmark v75 remains authoritative immediately underneath.
// It keeps the full Australian Product Guide lock-up visible in the mobile header,
// hides the APG monogram on mobile, and scales the governed identity responsively
// while leaving desktop header behaviour unchanged.
// Compatibility lineage: module.exports=require('../lib/image-seo-phase1-v74')
//
// APG Image SEO Phase 1 v74 remains authoritative immediately underneath.
// It classifies imagery as verified product photography, governed brand identity or
// category editorial context; enriches SSR alt text/social metadata/JSON-LD/image
// sitemap signals; and fails closed so brand/category placeholders never become
// Product.image. Image provenance and rights decisions remain inherited from the
// existing product/category/brand governance layers.
// Compatibility lineage: module.exports=require('../lib/brand-mark-missing-only-v73')
//
// APG Missing Brand Logo Completion v73.1 remains authoritative immediately underneath.
// It is intentionally narrow: only brands observed as blank/broken in the 22 Aug 2026
// /brands/ capture are eligible for retry/hydration. Existing successful logos are left
// unchanged. It also rejects invisible/empty SVG payloads and hydrates the targeted
// directory marks through a CSP-safe first-party runtime asset.
// Compatibility lineage: module.exports=require('../lib/earbuds-category-image-v72')
//
// APG Earbuds Category Image Refresh v72 remains authoritative immediately underneath.
// It replaces the misleading cotton-swab category image with a verified true-wireless-
// earbuds photograph and corrects the visible source attribution and image dimensions.
// Compatibility lineage: module.exports=require('../lib/televisions-category-image-v71')
//
// APG Televisions Category Image Refresh v71 remains authoritative immediately underneath.
// It keeps the canonical /category-editorial/televisions.jpg path while replacing the
// weaker generic room image with a clearer governed television-focused photograph and
// corrects television hero/social dimensions and visible attribution.
// Compatibility lineage: module.exports=require('../lib/homepage-situation-images-v70')
//
// APG Homepage Situation Images v70 remains authoritative immediately underneath.
// It reuses the governed category editorial imagery for the homepage
// "What are you trying to improve?" cards while preserving their existing icon,
// situation label, copy, filters, links and overall geometry.
// Compatibility lineage: module.exports=require('../lib/related-decisions-ui-v69')
//
// APG Related Buying Decisions UI v69 remains authoritative immediately underneath.
// It repairs the SEO v58 adjacent-category card markup by reusing APG's canonical
// category-card renderer. Semantic category selection is preserved while icons,
// spacing, responsive structure and standard decision actions return to the governed UI.
//
// APG Brand Mark Completion v68 remains authoritative immediately underneath for
// complete brand identity coverage and its v67/v66 integrity lineage.
// Compatibility lineage: module.exports=require('../lib/brand-mark-complete-v67')
// APG Brand Mark Complete v67 remains authoritative underneath v68 for official-domain
// logo/wordmark discovery, high-resolution declared identity and fail-closed text fallback.
// APG Brand Mark Device Parity + Integrity v66.2 remains authoritative underneath.
// APG Brand Mark Curated v66 provides reviewed premium-vector overrides.
// APG Brand Mark Quality v65 rejects tiny/incorrect automatic imagery.
// APG Product Brand Placeholder v64 uses governed identity only where verified product
// photography is absent; genuine product photography always remains authoritative.
// APG Brand Directory CSP v63 and Brand Identity v62 remain the directory foundation.
// Category Index Images v61, Google Product Discovery v60, Search Brand Identity v59,
// SEO v58 and the broader consumer-intelligence/runtime layers remain unchanged.
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');
module.exports=require('../lib/trust-centre-authoritative-v82');
