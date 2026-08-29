'use strict';

// APG eBay Official Creative Gallery v121 entry boundary.
// Preserve the complete existing APG runtime as the authoritative application handler and add
// one final presentation-only retailer creative layer. No recommendation, evidence, identity,
// commerce-eligibility, account or decision logic is duplicated here.
const base=require('./index-base-v120');
const ebayOfficialCreatives=require('../lib/ebay-official-creatives-v121-runtime');

const handler=ebayOfficialCreatives.wrap(base);
handler.EBAY_OFFICIAL_CREATIVES_VERSION=ebayOfficialCreatives.VERSION;
module.exports=handler;
