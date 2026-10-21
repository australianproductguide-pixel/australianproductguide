'use strict';
const assert=require('assert');
const policy=require('../data/ebay-image-provider-policy-v120');
const productImages=require('../data/product-images');

assert.strictEqual(policy.VERSION,'120.0');
assert.strictEqual(policy.ENABLED,false,'eBay imagery must remain dormant until approved API access is explicitly enabled');
assert(productImages.ALLOWED_SOURCE_TYPES.has('ebay_api_approved'),'Canonical image registry must recognise the governed eBay API source type');
const candidate={ebayItemId:'v1|123|0',ebayItemUrl:'https://www.ebay.com.au/itm/123',ebayAffiliateUrl:'https://www.ebay.com.au/itm/123?campid=test',imageUrl:'https://i.ebayimg.com/images/test.jpg',imageSource:'eBay Browse API response',imageRightsBasis:'eBay API-delivered content subject to applicable API/EPN terms',imageVerifiedAt:'2026-08-29',imageProductMatch:'exact',imageLinkUrl:'https://www.ebay.com.au/itm/123?campid=test'};
assert.strictEqual(policy.canPublish(candidate).ok,false,'Even a structurally valid candidate must fail closed while provider is disabled');
const errors=productImages.validationErrors({slug:'qa',brand:'QA',name:'Product'}, {...candidate,image_source_type:'ebay_api_approved',image_status:'verified',image_verified:true,image_url:candidate.imageUrl,image_source:candidate.imageSource,image_rights_basis:candidate.imageRightsBasis,image_verified_at:candidate.imageVerifiedAt,image_product_match:'exact',ebay_item_id:candidate.ebayItemId,ebay_item_url:candidate.ebayItemUrl,ebay_affiliate_url:candidate.ebayAffiliateUrl,image_link_url:candidate.imageLinkUrl});
assert.deepStrictEqual(errors,[],'A future API-delivered exact eBay image should pass structural provenance validation');
console.log(JSON.stringify({ok:true,version:policy.VERSION,enabled:policy.ENABLED,sourceType:'ebay_api_approved'},null,2));
