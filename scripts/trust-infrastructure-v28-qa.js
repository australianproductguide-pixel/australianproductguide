#!/usr/bin/env node
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const trust=require('../lib/trust-infrastructure-v28');
const creators=require('./amazon-creators-image-import-v28');
const amazon=require('../data/retailers-v6');
const observability=require('../lib/intelligence-observability-v27');

let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name)}catch(err){console.error('FAIL',name,'-',err.message);process.exitCode=1}}

check('new-password policy is 12 characters without breaking existing-password login',()=>{
  assert.equal(trust.NEW_PASSWORD_MIN,12);
  assert.equal(trust.isNewPasswordRoute('/api/account/signup','POST'),true);
  assert.equal(trust.isNewPasswordRoute('/api/account/password','POST'),true);
  assert.equal(trust.isNewPasswordRoute('/api/account/login','POST'),false);
  assert.match(trust.passwordPolicyError({password:'short123'}),/12 characters/);
  assert.equal(trust.passwordPolicyError({password:'long-enough-12'}),null);
});

check('browser UX mirrors stronger new-password policy while retaining login compatibility',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/assets/trust-infrastructure-v28.js'),'utf8');
  assert.match(js,/NEW_MIN=12,LOGIN_MIN=8/);
  assert.ok(js.includes('data-account-tab="signup"'));
  assert.match(js,/data-password-form/);
  assert.match(js,/data-profile-password-form/);
  assert.doesNotMatch(js,/localStorage|sessionStorage/);
});

check('trust readiness separates verified technical controls from unavailable Search Console performance',()=>{
  const x=trust.trustReadiness();
  assert.equal(x.organic.technicalControls.robots,true);
  assert.equal(x.organic.technicalControls.sitemap,true);
  assert.equal(x.organic.technicalControls.canonicalUrls,true);
  assert.equal(x.organic.technicalControls.structuredData,true);
  assert.equal(x.organic.technicalControls.myApgNoindex,true);
  assert.equal(x.organic.searchConsoleConnected,false);
  assert.equal(x.organic.currentClicks,null);
  assert.equal(x.organic.currentImpressions,null);
  assert.equal(x.organic.currentIndexedPageCount,null);
  assert.equal(x.organic.currentRankings,null);
  assert.match(x.organic.status,/unverified/i);
});

check('trust readiness preserves current retailer truth and zero recommendation weight',()=>{
  const x=trust.trustReadiness(),live=observability.retailerSnapshot();
  assert.ok(x.retailers.exactOfferCount>=43);
  assert.ok(x.retailers.productsWithExactOffers>=41);
  assert.ok(x.retailers.independentRetailerOfferCount>=33);
  assert.equal(x.retailers.recommendationWeight,0);
  assert.equal(x.retailers.exactOfferCount,live.exactOfferCount);
});

check('Creators API readiness cannot self-authorise or auto-publish imagery',()=>{
  const x=trust.trustReadiness();
  assert.equal(x.imagery.authorisedIntegrationTarget,'Amazon Creators API');
  assert.equal(x.imagery.marketplace,'www.amazon.com.au');
  assert.equal(x.imagery.exactAmazonIdentityReady,22);
  assert.equal(x.imagery.verifiedImageMappings,0);
  assert.equal(x.imagery.invalidImageMappings,0);
  assert.equal(x.imagery.automaticPublication,false);
  assert.match(x.imagery.publicationRule,/required before publication/i);
});

check('Creators API importer accepts only already verified exact Amazon identities',()=>{
  const exact=Object.entries(amazon.direct).find(([,row])=>row?.asin);
  assert.ok(exact,'expected at least one exact Amazon identity');
  const [slug,row]=exact;
  const payload={itemsResult:{items:[
    {asin:row.asin,images:{primary:{large:{url:'https://images.example.test/exact.jpg'}}}},
    {asin:'B000000000',images:{primary:{large:{url:'https://images.example.test/unknown.jpg'}}}}
  ]}};
  const out=creators.report(payload,{verifiedAt:'2026-08-18'});
  assert.equal(out.automaticPublication,false);
  assert.equal(out.candidateCount,1);
  assert.ok(out.candidates[slug]);
  assert.equal(out.candidates[slug].asin,row.asin);
  assert.equal(out.candidates[slug].image_source_type,'amazon_associates_approved');
  assert.equal(out.candidates[slug].image_status,'needs_review');
  assert.equal(out.candidates[slug].image_verified,false);
  assert.equal(out.candidates[slug].image_link_url,row.url);
});

check('v28 HTML enhancement is idempotent and additive to v27',()=>{
  const base='<!doctype html><html><head></head><body data-evidence-commerce-v27="true"></body></html>';
  const once=trust.enhance(base,'https://australianproductguide.au/my-apg/');
  const twice=trust.enhance(once,'https://australianproductguide.au/my-apg/');
  assert.equal((twice.match(/trust-infrastructure-v28\.js/g)||[]).length,1);
  assert.equal((twice.match(/data-trust-v28="true"/g)||[]).length,1);
  assert.match(twice,/data-evidence-commerce-v27="true"/);
});

check('visual certification is configured to surface exact-commit status instead of inferred workflow success',()=>{
  const x=trust.trustReadiness();
  assert.equal(x.visualCertification.commitStatusContext,'APG v27 Visual Certification');
  assert.match(x.visualCertification.status,/exact main commit status/i);
});

if(process.exitCode)process.exit(process.exitCode);
console.log(`TRUST_INFRASTRUCTURE_V28_QA=${passed}_CHECKS_PASS`);
