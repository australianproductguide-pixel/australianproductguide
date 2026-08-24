'use strict';
const assert=require('node:assert/strict');
const action5=require('../lib/action5-retailer-integrity-v99');
const amazon=require('../data/amazon-au-mappings-v33');
const scout=require('../lib/scout-concierge-v5');

const x=action5.action5RetailerSnapshot();
assert.equal(x.version,'99.0');
assert.equal(x.amazon.total,482,'Action 5 must recount the full maintained catalogue');
assert.equal(x.amazon.exact,18,'Current verified exact baseline must reconcile');
assert.equal(x.amazon.variant,12,'Current verified variant baseline must reconcile');
assert.equal(x.amazon.fallback,452,'Current safe fallback baseline must reconcile');
assert.equal(x.amazon.missingPathways,0,'No maintained product may lose a truthful Amazon pathway');
assert.deepEqual(x.amazon.collisions,[],'One ASIN must not silently map to incompatible APG products');
assert.deepEqual(x.amazon.structuralErrors,[],'Amazon retailer contracts must be structurally clean');
assert.equal(x.amazon.freshness.reviewDue,0,'Current verified Amazon mappings must be inside the risk-based review window');
assert.ok(x.retailers.exactDestinationCount>=57,'Fresh broader-retailer recount must not regress below the established exact-destination floor');
assert.ok(x.retailers.productsWithExactDestinations>=51,'Fresh broader-retailer product coverage must not regress below the established floor');
assert.ok(x.retailers.manufacturerDirectDestinations>=0);
assert.ok(x.retailers.independentAuRetailerDestinations>=0);
assert.ok(x.retailers.otherAffiliateRetailerDestinations>=0);
assert.equal(x.policy.automatedAmazonRequests,0,'Action 5 must not introduce automated Amazon requests');
assert.equal(x.policy.scraping,'NOT_INTRODUCED');
assert.deepEqual(x.analyticsTaxonomy,['direct_asin','verified_variant','search_fallback']);
assert.equal(x.priority.inputs.decisionLabProductDemand,'NOT_YET_MEASURED');
assert.equal(x.priority.inputs.scoutProductDemand,'NOT_YET_MEASURED');
assert.equal(x.priority.inputs.comparisonProductDemand,'NOT_YET_MEASURED');
assert.equal(x.priority.inputs.categoryPlanningSignals,'HISTORICAL_NOT_USED_AS_MEASURED_DEMAND');
assert.equal(x.gate.status,'GREEN',`Action 5 structural gate blockers: ${x.gate.blockers.join(', ')}`);

const exactSlug=Object.keys(amazon.VERIFIED).find(slug=>amazon.VERIFIED[slug].matchStatus==='EXACT_VERIFIED'&&scout.core.PRODUCT_BY_SLUG.has(slug));
const variantSlug=Object.keys(amazon.VERIFIED).find(slug=>amazon.VERIFIED[slug].matchStatus==='VARIANT_VERIFIED'&&scout.core.PRODUCT_BY_SLUG.has(slug));
assert.ok(exactSlug&&variantSlug,'Scout QA needs maintained exact and variant examples');
function ask(slug){const base=scout.core.buildResponse({text:'Is this on Amazon Australia?',pageContext:{path:`/products/${slug}/`}});return scout.amazon.apply(scout.core,'Is this on Amazon Australia?',base.pageContext,base.references,base);}
const exact=ask(exactSlug),variant=ask(variantSlug);
assert.equal(exact.actions.find(a=>a&&a.affiliate)?.label,'View on Amazon Australia');
assert.equal(variant.actions.find(a=>a&&a.affiliate)?.label,'View available variant on Amazon Australia');
assert.equal(variant.meta.amazonAu.matchStatus,'VARIANT_VERIFIED');

console.log(`ACTION5_RETAILER_INTEGRITY_V99_GREEN exact=${x.amazon.exact} variant=${x.amazon.variant} fallback=${x.amazon.fallback} broaderExactDestinations=${x.retailers.exactDestinationCount} manufacturerDirect=${x.retailers.manufacturerDirectDestinations} independentAU=${x.retailers.independentAuRetailerDestinations} otherAffiliate=${x.retailers.otherAffiliateRetailerDestinations}`);
