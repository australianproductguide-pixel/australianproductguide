'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const parity=require('../lib/premium-mobile-card-parity-v1121-runtime');
const v112=require('../lib/premium-mobile-decision-commerce-v112-runtime');
const {products}=require('../data');

assert.equal(parity.VERSION,'112.1');
const source=fs.readFileSync('lib/premium-mobile-card-parity-v1121-runtime.js','utf8');
const api=fs.readFileSync('api/index.js','utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','localStorage.setItem(','sessionStorage.setItem(','affiliateRecommendationWeight:1','commissionWeight'])assert(!source.includes(banned),`v112.1 must remain presentation/compatibility only: ${banned}`);
assert(source.includes('Object.assign(handler,downstream'),'v112.1 wrapper must preserve downstream runtime metadata');
assert(source.includes('Open product guide:'),'v112.1 Product Card must retain an explicit accessible product-guide destination');
assert(api.includes("require('../lib/premium-mobile-card-parity-v1121-runtime')"),'API must wire v112.1 parity');
assert(api.includes('const premiumMobileParityHandler=premiumMobileCardParity.wrap(premiumMobileHandler);'),'v112.1 must compose over v112');
assert(api.includes('const handler=wholeSiteExperience.wrap(premiumMobileParityHandler);'),'Whole-Site v109 must remain outermost after v112.1');

const product=products.find(row=>row&&row.slug&&row.brand&&row.name&&row.source&&Array.isArray(row.highlights)&&row.highlights.length&&row.watch)||products.find(row=>row&&row.slug);
assert(product,'No product available for v112.1 QA');
const href=`/products/${product.slug}/`;

const categoryHtml=`<!doctype html><html><head></head><body><main><article class="product-card v7-product-card" data-old="true"><a href="${href}">${product.name}</a><button data-compare-product="${product.slug}">Compare</button></article></main></body></html>`;
const categoryUrl=new URL('https://australianproductguide.au/categories/wireless-headphones/');
const categoryOut=parity.transform(categoryHtml,categoryUrl.pathname,categoryUrl);
assert(categoryOut.includes(`data-apg112-product-card="${product.slug}"`),'multi-class catalogue product card was not upgraded to Product Card v2');
assert(categoryOut.includes('aria-label="Open product guide:'),'Product Card v2 must preserve the explicit accessible product-guide action');
assert(!categoryOut.includes('v7-product-card'),'legacy catalogue card remained after parity transform');
assert(categoryOut.includes('data-apg-premium-card-parity="v112.1"'),'v112.1 body marker missing');

const searchHtml=`<!doctype html><html><head></head><body><main><article class="feature-card"><p>Maintained match</p><a href="${href}">${product.name}</a></article><article class="feature-card"><a href="/categories/wireless-headphones/">Wireless headphones</a></article></main></body></html>`;
const searchUrl=new URL('https://australianproductguide.au/search/?q=wireless+headphones');
const searchOut=parity.transform(searchHtml,searchUrl.pathname,searchUrl);
assert(searchOut.includes(`data-apg112-product-card="${product.slug}"`),'Search product feature-card was not upgraded to Product Card v2');
assert(searchOut.includes('aria-label="Open product guide:'),'Search Product Card v2 must retain the product-guide interaction contract without another visible CTA');
assert(searchOut.includes('href="/categories/wireless-headphones/"'),'non-product Search feature-card must remain intact');
assert.equal((searchOut.match(/data-apg112-product-card=/g)||[]).length,1,'Search parity upgraded a non-product feature card');
assert(searchOut.includes('Why this matched:'),'Search Product Card v2 must retain why-match explanation');

const nonSearchUrl=new URL('https://australianproductguide.au/decision-lab/');
const nonSearchOut=parity.transform(searchHtml,nonSearchUrl.pathname,nonSearchUrl);
assert(!nonSearchOut.includes('data-apg112-product-card='),'generic feature-card outside Search must not be blindly expanded');

const exactPanel=`<!doctype html><html><body><section class="retailer-panel apg112-offer-panel" data-apg112-offer-layer="true"><a data-apg112-retailer-state="exact">Exact</a><a data-apg112-retailer-state="fallback">Fallback</a></section></body></html>`;
const exactOut=parity.transform(exactPanel,'/products/example/',new URL('https://australianproductguide.au/products/example/'));
assert.equal((exactOut.match(/apg-exact-offers-v42/g)||[]).length,1,'exact retailer layer must preserve one legacy visual certification marker');
const fallbackPanel=`<!doctype html><html><body><section class="retailer-panel apg112-offer-panel" data-apg112-offer-layer="true"><a data-apg112-retailer-state="fallback">Fallback</a></section></body></html>`;
const fallbackOut=parity.transform(fallbackPanel,'/products/example/',new URL('https://australianproductguide.au/products/example/'));
assert(!fallbackOut.includes('apg-exact-offers-v42'),'fallback-only retailer layer must never gain an exact-offer marker');

const already=v112.productCardV2(product,{query:'headphones'});
const alreadyHtml=`<!doctype html><html><body>${already}</body></html>`;
const alreadyOut=parity.transform(alreadyHtml,'/search/',searchUrl);
assert.equal((alreadyOut.match(/data-apg112-product-card=/g)||[]).length,1,'v112.1 must not duplicate an already-upgraded Product Card v2');
assert.equal(parity.transform(alreadyOut,'/search/',searchUrl),alreadyOut,'v112.1 transform must be idempotent');

console.log(JSON.stringify({status:'PASS',version:parity.VERSION,multiClassCatalogueParity:true,searchProductParity:true,accessibleProductGuideContract:true,nonProductSearchPreserved:true,exactRetailerVisualCompatibility:true,wholeSiteV109Outermost:true,stateMutationOwner:'canonical-app-js'},null,2));
