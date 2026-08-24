'use strict';
const assert=require('node:assert/strict');
const action5=require('../lib/action5-recall-surface-v1002');
const amazon=require('../data/amazon-au-mappings-v33');
const scout=require('../lib/scout-concierge-v5');

const x=action5.structuralSnapshot();
assert.equal(x.version,'100.0');
assert.equal(action5.ACTION5_DEMAND_RANKING_VERSION,'100.1');
assert.equal(action5.ACTION5_RECALL_SURFACE_VERSION,'100.2');
assert.equal(x.amazon.total,482,'Action 5 must recount the full maintained catalogue');
assert.equal(x.amazon.exact,18,'Verified exact mappings must remain evidence-backed');
assert.equal(x.amazon.variant,12,'Verified variant mappings must remain evidence-backed');
assert.equal(x.amazon.fallback,451,'The recalled Anker A1647 must be removed from active retailer-search fallbacks');
assert.equal(x.amazon.noSafePath,1,'One recalled product must be represented as a controlled no-safe-purchase-path state');
assert.deepEqual(x.amazon.noSafePathProducts,['anker-power-bank-20000mah-22-5w']);
assert.equal(x.amazon.missingPathways,0,'No product may have an uncontrolled retailer state');
assert.equal(x.p1.open,0,'All four v99 P1 identity cases must be resolved');
assert.equal(x.p1.resolved.length,4,'All four v99 P1 cases must retain explicit resolution provenance');
assert.equal(x.priority.counts.P1,0);
assert.equal(x.priority.counts.P2,62,'The original governed P2 candidate set must remain intact for measured demand ranking');
assert.equal(x.priority.counts.P3,386);
assert.equal(x.priority.counts.resolvedP1,4);
assert.deepEqual(x.amazon.collisions,[],'One ASIN must not silently map to incompatible APG products');
assert.deepEqual(x.amazon.structuralErrors,[],'Underlying Amazon retailer contracts must remain structurally clean');
assert.equal(x.amazon.freshness.reviewDue,0,'Current verified Amazon mappings must remain inside the risk-based review window');
assert.ok(x.retailers.exactDestinationCount>=57,'Fresh broader-retailer recount must not regress below the established exact-destination floor');
assert.ok(x.retailers.productsWithExactDestinations>=51,'Fresh broader-retailer product coverage must not regress below the established floor');
assert.equal(x.policy.automatedAmazonRequests,0,'Action 5 must not introduce automated Amazon requests');
assert.equal(x.policy.scraping,'NOT_INTRODUCED');
assert.deepEqual(x.analyticsTaxonomy,['direct_asin','verified_variant','search_fallback']);
assert.equal(x.gate.checks.noUnsafeRecallCommerce,true);
assert.equal(x.gate.checks.p1CasesResolved,true);
assert.equal(x.gate.checks.noGuessedP1Asins,true);
assert.equal(x.gate.checks.recommendationSafety,true);
assert.equal(x.gate.status,'GREEN',`Action 5 v100 blockers: ${x.gate.blockers.join(', ')}`);
assert.equal(x.strategicGate.status,'GREEN_WITH_LIVE_DEMAND_QUEUE');

const observed={productId:'observed-product',signals:{affiliateClicks:2,gscClicks:0,gscImpressions:0,productViews:0,comparisonSignals:0,saveSignals:0,scoutSignals:0,decisionSignals:0,observedEvents:2}};
const unobserved={productId:'aaa-zero-product',signals:{affiliateClicks:0,gscClicks:0,gscImpressions:0,productViews:0,comparisonSignals:0,saveSignals:0,scoutSignals:0,decisionSignals:0,observedEvents:0}};
const ranked=action5.rankCandidates([unobserved,observed]);
assert.equal(ranked[0].productId,'observed-product','Observed product demand must outrank stable-ID ordering when a real signal exists');
assert.equal(ranked[0].demandRank,1);
assert.ok(action5.compareDemandRows(observed,unobserved)<0,'Demand comparator must order measured commerce engagement first');

const recalled=action5.safeAmazonRecord(scout.core.PRODUCT_BY_SLUG.get(action5.RECALL_SLUG));
assert.equal(recalled.matchStatus,'NO_SAFE_PATH_RECALL');
assert.equal(recalled.url,null);
assert.equal(recalled.recommendationWeight,0);

const scrubbed=action5.scrubJson({version:'test',record:{amazon_url:'https://www.amazon.com.au/s?k=Anker'}},'/api/intelligence/affiliate-commerce',new URL('https://australianproductguide.au/api/intelligence/affiliate-commerce?slug='+action5.RECALL_SLUG));
assert.equal(scrubbed.record,null,'Dynamic commerce API must not re-add a recalled Anker purchase/search link');
assert.equal(scrubbed.safetyState,'NO_SAFE_PATH_RECALL');

const recalledHtml='<a data-affiliate-retailer="Amazon Australia" data-product-slug="anker-power-bank-20000mah-22-5w" href="https://www.amazon.com.au/s?k=Anker">Search this model on Amazon Australia</a>';
const safeHtml=action5.stripRecalledCommerceHtml(recalledHtml,'/products/anker-power-bank-20000mah-22-5w/');
assert.ok(!safeHtml.includes('href="https://www.amazon.com.au/'), 'Recalled primary CTA must not retain an Amazon purchase/search URL');
assert.ok(safeHtml.includes('Australian recall'));

const historical=`<script type="application/ld+json">{"@type":"Product","sameAs":"${action5.OLD_AMAZON_URL}"}</script><a class="retailer-row" href="${action5.OLD_AMAZON_URL}"><span>Model discovery reference</span></a><div class="notice affiliate-disclosure-inline"><strong>Paid Amazon Associate links.</strong> As an Amazon Associate I earn from qualifying purchases.</div><p class="fine-inline">Amazon links are paid links. APG-maintained price context is not a live Amazon price.</p>`;
const sanitised=action5.sanitiseRecallPageHtml(historical,action5.RECALL_PATH);
assert.ok(!sanitised.includes(action5.OLD_AMAZON_URL),'Recalled product page must not retain its historical Amazon model-discovery URL or structured sameAs');
assert.ok(sanitised.includes(action5.RECALL_URL),'Recalled product page should route provenance/safety context to the manufacturer recall source');
assert.ok(sanitised.includes('No purchase pathway is provided for this product'));

const exactSlug=Object.keys(amazon.VERIFIED).find(slug=>amazon.VERIFIED[slug].matchStatus==='EXACT_VERIFIED'&&scout.core.PRODUCT_BY_SLUG.has(slug));
const variantSlug=Object.keys(amazon.VERIFIED).find(slug=>amazon.VERIFIED[slug].matchStatus==='VARIANT_VERIFIED'&&scout.core.PRODUCT_BY_SLUG.has(slug));
assert.ok(exactSlug&&variantSlug,'Scout QA needs maintained exact and variant examples');
function ask(slug){const base=scout.core.buildResponse({text:'Is this on Amazon Australia?',pageContext:{path:`/products/${slug}/`}});return scout.amazon.apply(scout.core,'Is this on Amazon Australia?',base.pageContext,base.references,base);}
const exact=ask(exactSlug),variant=ask(variantSlug);
assert.equal(exact.actions.find(a=>a&&a.affiliate)?.label,'View on Amazon Australia');
assert.equal(variant.actions.find(a=>a&&a.affiliate)?.label,'View available variant on Amazon Australia');
assert.equal(variant.meta.amazonAu.matchStatus,'VARIANT_VERIFIED');

console.log(`ACTION5_STRATEGIC_CLOSURE_V1002_GREEN exact=${x.amazon.exact} variant=${x.amazon.variant} fallback=${x.amazon.fallback} noSafe=${x.amazon.noSafePath} p1Open=${x.p1.open} p2=${x.priority.counts.P2} broaderExactDestinations=${x.retailers.exactDestinationCount} demandOrdering=measured-first recallSurface=sanitised`);
