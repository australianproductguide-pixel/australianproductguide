// APG Interaction Reliability v37 is the governing runtime over discoverability and Scout.
// Keep the current Scout session-guard runtime explicitly loaded so its mandatory
// release invariant remains visible and enforced while the v37 navigation, comparison
// and bounded Scout recovery controls protect core consumer journeys.
require('../lib/scout-concierge-v5-runtime');
module.exports=require('../lib/interaction-reliability-v37');
