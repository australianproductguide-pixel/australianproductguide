'use strict';

// APG public runtime entrypoint for continuous exact-product imagery.
// The existing certified API/index runtime remains intact; this wrapper only adds the governed
// Supabase-backed image continuity layer outside it, keeping shopper requests zero-eBay-network.

const base=require('./index');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');

const handler=continuity.wrap(base);
handler.EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION=continuity.VERSION;
module.exports=handler;
