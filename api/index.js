// APG Interaction Reliability v37 remains the legacy site-wide fallback runtime.
// Decision Lab Resilience v50.6 owns interactive Decision Lab rendering and result navigation; v50.4 remains the isolated JSON transport.
// Search Reliability v52 owns Search isolated JSON rendering, direct-result simplification and recent-query recovery.
// Navigation Isolation v54.1 keeps Search-product and Compare-tray clicks on one native navigation path.
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
module.exports=require('../lib/navigation-isolation-v541-runtime');
