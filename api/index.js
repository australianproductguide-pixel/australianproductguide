// APG Category Index Images v61 is the outermost presentation enrichment for the
// all-categories hub. It reuses the governed 90-category editorial image registry
// while leaving individual category/product decision logic unchanged.
//
// Google Product Discovery v60 remains authoritative underneath v61 for crawler/browser
// product-discovery enrichment and canonical Product review/pros-cons data.
// Search Brand Identity v59 remains authoritative underneath v60 for crawler/browser
// brand identity and the current owner-approved APG brand mark.
// SEO Optimisation v58 remains authoritative underneath v59 for metadata,
// structured content, internal discovery and route freshness.
// Social Share Card v57 remains the global social-preview fallback layer.
// Social Integration v56 remains the verified social-profile entity and UI layer.
// Interaction Runtime v55 remains the browser reliability contract.
// Core consumer journeys are SSR-first and use native GET/link navigation; the
// overlapping Search v52, Decision v50/v50.6, Interaction v37 and Navigation
// Isolation v54.1 browser controllers are retained only as superseded history /
// server compatibility beneath the final v55 response reconciler.
// Scout v5 remains the conversational decision assistant.
// PageSpeed Certification v30 remains the underlying accessibility/performance layer.
// Vercel Analytics v38 remains the privacy-hardened telemetry layer.
// Amazon shopping discovery v39 remains the governed shopping/destination shell.
// Amazon shopping creative v41 remains the current APG-original shopping creative layer.
// Brand System v46 remains the presentation foundation across every route and breakpoint.
// Consumer Intelligence v47 remains the hard/soft decision-continuity and explainability foundation.
// Catalogue Intelligence v48 remains the universal 482-product contract and soft-relevance layer.
// Catalogue Intelligence v49 adds the strict strong-product evidence benchmark and source-backed enrichment passes.
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');
module.exports=require('../lib/category-index-images-v61');