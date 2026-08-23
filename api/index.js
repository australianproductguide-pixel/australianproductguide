// APG Search Console Depth v85 is the outermost runtime layer.
// It operationalises APG's depth-over-breadth Search Console workflow by preserving
// search equity during a verified Australian product-identity correction: legacy
// Philips STH5030/80 product/comparison URLs permanently redirect to STH5030/20.
// The underlying product is enriched from Philips Australia exact-model evidence.
// No comparison-page expansion, recommendation scoring, affiliate preference,
// analytics collection or unrelated canonical/indexability behaviour is changed.
// Compatibility lineage: module.exports=require('../lib/search-console-opportunity-v84')
//
// APG Search Console Opportunity v84 remains authoritative immediately underneath.
// It sharpens consumer-facing product/comparison/category metadata using observed
// search intent and adds lightweight SSR decision-path links between product,
// comparison, category, buying-guide and finder routes without changing scoring.
// Compatibility lineage: module.exports=require('../lib/footer-navigation-v83')
//
// APG Footer Navigation v83 remains authoritative underneath for footer interaction
// geometry and delegates to Trust Centre Authoritative Runtime v82.
// Compatibility lineage: module.exports=require('../lib/trust-centre-authoritative-v82')
//
// APG Trust Centre Authoritative Runtime v82 keeps the eleven Trust Centre/company
// pages sourced from lib/content.js and delegates through the established consumer,
// search-verification, analytics, navigation, imagery, brand, commerce and SEO chain.
// The historical v81 -> v58 compatibility chain is intentionally preserved in those
// runtime modules; v85 does not replace or fork it.
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');
module.exports=require('../lib/search-console-depth-v85-runtime');
