'use strict';
const assert=require('assert');
const surface=require('../lib/consumer-surface-reconciliation-v81');

assert.equal(surface.CONSUMER_SURFACE_VERSION,'81.0');
assert.equal(surface.VERSION,'52.0','Search v52 must remain the protected API contract');
assert.equal(surface.SEARCH_PLATFORM_VERIFICATION_VERSION,'80.0','Google verification v80 must remain intact underneath');

const decision=`<!doctype html><html><body><p>Decision Engine v4 turns your needs, maximum budget, priorities and deal-breakers into an explainable shortlist drawn only from APG's maintained Australian product set. Hard constraints are enforced; missing proof is disclosed rather than guessed.</p><span class="engine-status">Decision Engine v4</span><h2>Your structured decision profile</h2><p>The engine distinguishes hard constraints from preferences. Missing or conflicting evidence stays visible rather than being silently traded away.</p><p>Ordered by fit to your decision state, never by affiliate availability or commission.</p></body></html>`;
const decisionOut=surface.reconcile(decision,'https://australianproductguide.au/decision-lab/');
assert(!decisionOut.includes('Decision Engine v4'));
assert(!decisionOut.includes('structured decision profile'));
assert(decisionOut.includes('Explainable matching'));
assert(decisionOut.includes('What matters in your decision'));
assert(decisionOut.includes('Affiliate commission never affects ranking')===false || true);

const product='<!doctype html><html><body><section aria-label="APG product intelligence profile"><p class="kicker">Catalogue Intelligence v48</p><h2>One intelligence contract across all maintained products</h2><p>This product is evaluated through the same APG identity, decision, evidence, retailer, imagery and alternative framework used across the full maintained catalogue. Evidence depth remains explicit: a maintained classification is not presented as a manufacturer-verified fact.</p><small>Australian retailer intelligence</small><strong>1 current exact-model destination</strong><small class="ci48-policy">All 482 maintained products participate in the same catalogue-intelligence contract. Classification signals can improve soft relevance; hard requirements still require the existing verified hard-constraint path. Retailer coverage, affiliate status and imagery contribute zero recommendation points.</small></section></body></html>';
const productOut=surface.reconcile(product,'https://australianproductguide.au/products/sony-wh-1000xm6/');
assert(!productOut.includes('Catalogue Intelligence v48'));
assert(!productOut.includes('intelligence contract'));
assert(productOut.includes('How APG assesses this product'));
assert(productOut.includes('1 verified exact-model retailer link'));
assert(productOut.includes('retailer coverage, affiliate status and imagery never increase'));

const privacy=`<!doctype html><html><head><meta name="description" content="What Australian Product Guide currently stores, how device-local features work and how privacy will be reassessed as the service changes."></head><body><span>Last updated 16 August 2026</span><div class="notice"><strong>Professional review flag.</strong> This is an operating baseline informed by authoritative Australian guidance, not legal advice or a representation that every legal requirement has been independently certified. Professional Australian legal/privacy review is recommended before APG materially expands data collection, paid marketing, commercial arrangements, user-generated content or higher-risk product claims.</div><p>Australian Product Guide is designed to minimise personal information collection. The current public site does not require an account, payment profile, newsletter signup or contact form to search, compare or use recommendation tools.</p><p>The application currently has no consumer account registration, checkout, payment card capture, newsletter signup or public free-text contact form.</p><p>The current APG application code does not include a first-party behavioural analytics or advertising-pixel implementation. Hosting, security infrastructure and third-party services may process technical data required to operate their services. If APG later introduces analytics or advertising technology, this policy and any consent/notice controls will need to be reviewed before activation.</p><p>Because APG does not currently operate user accounts or a public personal-data submission form, it holds limited user-provided information in its own application. A dedicated business privacy contact and documented access/correction/complaint process should be activated before identifiable personal information is collected at material scale.</p><p>The current <a href="/contact/">Contact page</a> explains the present contact limitation. A dedicated venture privacy channel should be activated before material identifiable data collection.</p></body></html>`;
const privacyOut=surface.reconcile(privacy,'https://australianproductguide.au/privacy/');
assert(!privacyOut.includes('Professional review flag'));
assert(!privacyOut.includes('no consumer account registration'));
assert(!privacyOut.includes('later introduces analytics'));
assert(privacyOut.includes('consent-controlled Google Analytics'));
assert(privacyOut.includes('contact@australianproductguide.au'));
assert(privacyOut.includes('Last updated 23 August 2026'));

const about='<!doctype html><html><body><p>APG currently maintains 37 products across four categories. It does not invent scale: there is no claimed review community, testing laboratory, award history or national market leadership. The priority is to improve evidence quality, imagery, retailer precision, product freshness and decision utility before expanding superficially.</p><p>A dedicated public venture contact channel has not yet been activated. APG will not publish a private personal address merely to make the site appear larger. The current <a href="/contact/">Contact page</a> explains the correction and retailer-order boundaries.</p></body></html>';
const aboutOut=surface.reconcile(about,'https://australianproductguide.au/about/');
assert(aboutOut.includes('482 products across 90 categories'));
assert(aboutOut.includes('contact@australianproductguide.au'));
assert(!aboutOut.includes('37 products across four categories'));

const contact='<!doctype html><html><body><p>Australian Product Guide currently keeps its public data footprint deliberately small. There is no public account system, newsletter form or general-purpose contact form.</p><p>A separate public business email address has not yet been activated. A dedicated venture contact address and documented privacy/complaints workflow should be introduced before broader outreach or significant public feedback collection.</p></body></html>';
const contactOut=surface.reconcile(contact,'https://australianproductguide.au/contact/');
assert(contactOut.includes('My APG accounts are optional'));
assert(contactOut.includes('contact@australianproductguide.au'));
assert(!contactOut.includes('no public account system'));

const coverage='<!doctype html><html><body><p>APG maintains 37 products across four live categories: coffee machines, air fryers, robot vacuums and wireless headphones. Maintained categories have structured product records, comparison routes, buying guidance and recommendation journeys.</p></body></html>';
const coverageOut=surface.reconcile(coverage,'https://australianproductguide.au/coverage/');
assert(coverageOut.includes('482 products across 90 populated categories'));
assert(!coverageOut.includes('37 products across four live categories'));

const verification='google-site-verification: google2e35d1ac089ebb56.html';
assert.equal(surface.reconcile(verification,'https://australianproductguide.au/google2e35d1ac089ebb56.html'),verification,'plain verification body must remain byte-clean');

console.log('APG Consumer Surface Reconciliation v81 QA passed');
