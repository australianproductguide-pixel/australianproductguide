// Australian Product Guide public runtime entrypoint.
//
// Footer Navigation v83 is the outermost delivery layer. It hardens native footer
// link hit targets and mobile interaction geometry without introducing client-side
// routing or changing the Trust Centre content underneath.
//
// Trust Centre v82.1 remains the authoritative Trust/company compatibility boundary;
// all eleven Trust Centre page bodies continue to come from lib/content.js.
// Search v52 and Decision Lab v50.6 public contracts are preserved through the
// downstream runtime lineage.
//
// The required modules below register existing APG side-effect runtimes/assets before
// the outer delivery chain handles the request.
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');
module.exports=require('../lib/footer-navigation-v83');
