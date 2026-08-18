const assert=require('assert');
const fs=require('fs');
const path=require('path');
const governance=require('../lib/account-governance-v25');

const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const api=read('api/index.js');
const source=read('lib/account-governance-v25.js');
const v29Path=path.join(__dirname,'../lib/amazon-conversion-v29.js');
const v29=fs.existsSync(v29Path)?fs.readFileSync(v29Path,'utf8'):'';
const v28Path=path.join(__dirname,'../lib/trust-infrastructure-v28.js');
const v28=fs.existsSync(v28Path)?fs.readFileSync(v28Path,'utf8'):'';
const v27Path=path.join(__dirname,'../lib/evidence-commerce-depth-v27.js');
const v27=fs.existsSync(v27Path)?fs.readFileSync(v27Path,'utf8'):'';
const cohesionPath=path.join(__dirname,'../lib/platform-cohesion-v26.js');
const cohesion=fs.existsSync(cohesionPath)?fs.readFileSync(cohesionPath,'utf8'):'';

const directV25=api.includes("require('../lib/account-governance-v25')");
const viaV26=api.includes("require('../lib/platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')");
const v27Chain=v27.includes("require('./platform-cohesion-v26')")&&cohesion.includes("require('./account-governance-v25')");
const viaV27=api.includes("require('../lib/evidence-commerce-depth-v27')")&&v27Chain;
const v28Chain=v28.includes("require('./evidence-commerce-depth-v27')")&&v27Chain;
const viaV28=api.includes("require('../lib/trust-infrastructure-v28')")&&v28Chain;
const viaV29=api.includes("require('../lib/amazon-conversion-v29')")&&v29.includes("require('./trust-infrastructure-v28')")&&v28Chain;
assert(directV25||viaV26||viaV27||viaV28||viaV29,'api/index.js must preserve account governance v25 directly or through the current v26/v27/v28/v29 wrapper chain');
assert(source.includes("require('./account-profile-v24')"),'v25 must compose over the current profile/auth chain');
assert(source.includes('Effective 18 August 2026'),'v25 must refresh policy effective dates');
assert(source.includes('download a JSON copy'),'privacy disclosure must explain the signed-in data export');
assert(source.includes('re-confirms the current password'),'privacy disclosure must explain strengthened deletion re-authentication');
assert(source.includes('Browser-local research is separate'),'privacy disclosure must distinguish browser-local research from cloud account data');
assert(source.includes('Product-research email preferences are optional and separate from account creation'),'terms must preserve separate communication consent');
assert(!source.includes('recommendationScore')&&!source.includes('affiliateCommission'),'governance cleanup must not alter recommendation or affiliate scoring');

const privacyFixture='<!doctype html><html><body><article class="policy-content"><nav class="policy-toc" aria-label="On this page"><strong>On this page</strong><a href="#scope">1. Scope</a></nav><div class="policy-meta"><span>Effective 17 August 2026</span><span>Last updated 17 August 2026</span></div><div>Current data practices · 17 August 2026.</div><h2 id="account">3. Optional My Australian Product Guide accounts</h2><p>Old account wording.</p><h2 id="not-collected">4. Information Australian Product Guide does not currently ask you to provide</h2><p>Not collected.</p><h2 id="accounts-and-updates">Optional accounts and update preferences</h2><p>Duplicate account wording.</p><h2 id="local">5. Browser local storage and sync</h2><p>Local.</p><h2 id="rights">14. Access, correction and complaints</h2><p>Old rights wording.</p></article></body></html>';
const privacy=governance.cleanPrivacy(privacyFixture);
assert.strictEqual((privacy.match(/id="account"/g)||[]).length,1,'privacy must contain one canonical account section');
assert.strictEqual((privacy.match(/id="accounts-and-updates"/g)||[]).length,0,'privacy must remove the duplicate legacy account section');
assert.strictEqual((privacy.match(/class="policy-toc"/g)||[]).length,1,'privacy must contain one reconciled policy TOC');
assert(privacy.includes('Effective 18 August 2026')&&privacy.includes('Last updated 18 August 2026'),'privacy dates must be current');
assert(privacy.includes('download a JSON copy'),'privacy must describe export capability');
assert(privacy.includes('explicit DELETE confirmation'),'privacy must describe irreversible deletion confirmation');
assert(privacy.includes('href="#account">3. Optional My Australian Product Guide accounts</a>'),'privacy TOC must include the account section at the correct number');
assert(privacy.includes('href="#contact">17. Contact</a>'),'privacy TOC numbering must reach the correct final section');

const termsFixture='<!doctype html><html><body><article class="policy-content"><nav class="policy-toc" aria-label="On this page"><strong>On this page</strong><a href="#acceptance">1. Acceptance</a></nav><div class="policy-meta"><span>Effective 17 August 2026</span><span>Last updated 17 August 2026</span></div><h2 id="accounts">11. Optional accounts</h2><p>Old account wording.</p><h2 id="optional-accounts">Optional My Australian Product Guide accounts</h2><p>Duplicate account wording.</p><h2 id="acceptable">12. Acceptable use</h2><p>Acceptable.</p></article></body></html>';
const terms=governance.cleanTerms(termsFixture);
assert.strictEqual((terms.match(/id="accounts"/g)||[]).length,1,'terms must contain one canonical account section');
assert.strictEqual((terms.match(/id="optional-accounts"/g)||[]).length,0,'terms must remove the duplicate legacy account section');
assert.strictEqual((terms.match(/class="policy-toc"/g)||[]).length,1,'terms must contain one reconciled policy TOC');
assert(terms.includes('download a copy of My APG account/workspace information'),'terms must describe export capability');
assert(terms.includes('Product-research email preferences are optional and separate from account creation'),'terms must preserve separate consent');
assert(terms.includes('href="#accounts">11. Optional accounts</a>'),'terms TOC must include the account section at the correct number');
assert(terms.includes('href="#contact">18. Contact</a>'),'terms TOC numbering must reach the correct final section');

console.log('APG account governance v25 QA passed');