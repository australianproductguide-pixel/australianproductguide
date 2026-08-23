'use strict';

const assert=require('assert');
const verification=require('../lib/search-platform-verification-v80');

assert.equal(verification.SEARCH_PLATFORM_VERIFICATION_VERSION,'80.0');
assert.equal(verification.PRIMARY_HOST,'australianproductguide.au');
assert.equal(verification.GOOGLE_VERIFICATION_PATH,'/google2e35d1ac089ebb56.html');
assert.equal(verification.GOOGLE_VERIFICATION_BODY,'google-site-verification: google2e35d1ac089ebb56.html');
assert.equal(verification.VERSION,'52.0','Search v52 must remain the protected API contract');
assert.equal(verification.requestHost({headers:{host:'australianproductguide.au'}}),'australianproductguide.au');
assert.equal(verification.requestHost({headers:{'x-forwarded-host':'australianproductguide.au:443'}}),'australianproductguide.au');

const headers={};
const res={
  statusCode:0,
  setHeader(name,value){headers[String(name).toLowerCase()]=String(value)},
  end(body){this.body=body;return body}
};
verification.sendGoogleVerification({method:'GET'},res);
assert.equal(res.statusCode,200);
assert.equal(res.body,verification.GOOGLE_VERIFICATION_BODY);
assert.equal(headers['content-type'],'text/html; charset=utf-8');
assert.equal(headers['x-robots-tag'],'noindex');
assert.equal(headers['x-apg-search-platform-verification'],'v80.0');
assert(!res.body.includes('<meta'),'Google verification response must remain byte-clean');
assert(!res.body.includes('<script'),'Google verification response must remain byte-clean');

console.log('APG Search Platform Verification v80 QA passed');
