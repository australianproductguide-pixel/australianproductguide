'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const growth=require('../lib/google-growth-v1');
assert.equal(growth.CONFIG.projectId,'serious-flight-364223');
assert.equal(growth.CONFIG.projectNumber,'4015856724');
assert.equal(growth.CONFIG.poolId,'apg-vercel-oidc');
assert.equal(growth.CONFIG.providerId,'apg-vercel');
assert.equal(growth.CONFIG.serviceAccountEmail,'apg-growth-automation@serious-flight-364223.iam.gserviceaccount.com');
assert.equal(growth.CONFIG.searchConsoleSite,'sc-domain:australianproductguide.au');
assert.equal(
  growth.providerAudience(),
  '//iam.googleapis.com/projects/4015856724/locations/global/workloadIdentityPools/apg-vercel-oidc/providers/apg-vercel'
);
assert(growth.SERVICE_ACCOUNT_SCOPES.includes('https://www.googleapis.com/auth/webmasters'));
assert(growth.SERVICE_ACCOUNT_SCOPES.includes('https://www.googleapis.com/auth/analytics.readonly'));
assert(growth.SERVICE_ACCOUNT_SCOPES.includes('https://www.googleapis.com/auth/analytics.edit'));

const clientSource=fs.readFileSync(path.join(__dirname,'../lib/google-growth-v1.js'),'utf8');
const apiSource=fs.readFileSync(path.join(__dirname,'../api/growth-google.js'),'utf8');
new Function(clientSource);
new Function(apiSource);
assert(clientSource.includes('process.env.VERCEL_OIDC_TOKEN'),'must use Vercel short-lived OIDC credentials');
assert(!/private_key|BEGIN PRIVATE KEY|GOOGLE_APPLICATION_CREDENTIALS/i.test(clientSource),'must not embed or require a long-lived Google service-account private key');
assert(clientSource.includes('sts.googleapis.com/v1/token'),'must exchange Vercel OIDC at Google STS');
assert(clientSource.includes('iamcredentials.googleapis.com'),'must use service-account impersonation');
assert(apiSource.includes("process.env.VERCEL_ENV!=='production'"),'preview-only diagnostic allowance must remain explicit');
assert(apiSource.includes('APG_GROWTH_API_TOKEN'),'Production diagnostics must require a separate private token');

console.log('APG Google Growth v1 source QA passed');
