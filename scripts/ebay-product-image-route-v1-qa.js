'use strict';
const assert=require('node:assert/strict');
const route=require('../lib/ebay-product-image-route-v1-runtime');

assert.equal(route.VERSION,'1.0');
assert.equal(route.isProductPath('/products/breville-barista-express-impress-bes876/'),true);
for(const path of ['/','/search/','/compare/','/decision-lab/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876','/about/'])assert.equal(route.isProductPath(path),false,`${path} must bypass product-image response interception`);
let wrappedCalls=0,downstreamCalls=0;
const downstream=(req,res)=>{downstreamCalls++;res.end('base');};
const wrapped=route.wrap(downstream,{continuityWrap:inner=>(req,res)=>{wrappedCalls++;return inner(req,res);}});
function invoke(url){return new Promise(resolve=>{const req={url};const res={end:body=>resolve(String(body||''))};wrapped(req,res);});}
(async()=>{
  await invoke('/');assert.equal(wrappedCalls,0);assert.equal(downstreamCalls,1);
  await invoke('/search/?q=coffee');assert.equal(wrappedCalls,0);assert.equal(downstreamCalls,2);
  await invoke('/products/breville-barista-express-impress-bes876/');assert.equal(wrappedCalls,1);assert.equal(downstreamCalls,3);
  assert.equal(wrapped.EBAY_PRODUCT_IMAGE_PRESENTATION_STATE,'ROUTE_SCOPED_PRODUCT_ONLY_V1');
  assert.equal(wrapped.EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION,'3.2');
  console.log('EBAY_PRODUCT_IMAGE_ROUTE_V1=PASS product-only=1 home-interception=0 search-interception=0 recommendationWeight=0');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
