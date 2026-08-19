// APG Discoverability v1 is the preview governing runtime over Scout Concierge v5.
// Keep the current Scout session-guard runtime explicitly loaded so its mandatory
// release invariant remains visible and enforced while the discovery wrapper is active.
require('../lib/scout-concierge-v5-runtime');
module.exports=require('../lib/discoverability-v1');
