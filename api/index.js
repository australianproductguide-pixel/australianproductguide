// APG Interaction Reliability v37 remains the governing consumer runtime.
// PageSpeed Certification v30 remains the underlying accessibility/performance layer.
// Vercel Analytics v38 is a narrow privacy-hardened final-response telemetry layer.
// Category editorial research diagnostics are preview-only and never exposed in Production.
module.exports=process.env.VERCEL_ENV==='production'
  ? (require('../lib/scout-concierge-v5-runtime'),require('../lib/vercel-analytics-v38'))
  : require('../lib/editorial-image-preview-v43');
