// APG Social Integration v56 is the current outer response contract.
// It wraps Interaction Runtime v55 without changing its SSR/native-navigation
// reliability model and adds only verified official social-profile surfaces,
// Organization sameAs entity data, About/mobile/footer cross-linking and a
// machine-readable social-profile registry endpoint.
// Facebook remains active-but-unpublished until its exact public Page URL is
// independently verified; APG never guesses external profile destinations.
//
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
module.exports=require('../lib/social-integration-v56-runtime');
