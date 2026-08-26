'use strict';
const fs=require('fs');
const assert=require('assert');
const runtime=require('../lib/premium-mobile-decision-commerce-v112-runtime');
const {products,categories}=require('../data');
const {imageStatus}=require('../data/image-provenance');
const searchDepth=require('../data/search-opportunity-depth-v104');

const expect=(ok,msg)=>assert.ok(ok,msg);
expect(runtime.VERSION==='112.0','v112 runtime version mismatch');
const runtimeSource=fs.readFileSync('lib/premium-mobile-decision-commerce-v112-runtime.js','utf8');
const clientSource=fs.readFileSync('public/assets/premium-mobile-decision-commerce-v112.js','utf8');
const cssSource=fs.readFileSync('public/assets/premium-mobile-decision-commerce-v112.css','utf8');
const apiSource=fs.readFileSync('api/index.js','utf8');
expect(apiSource.includes("premium-mobile-decision-commerce-v112-runtime"),'api/index.js does not wire v112');
expect(apiSource.includes('const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler);'),'v112 must sit outside v109.1 stability and inside Whole-Site v109');
expect(apiSource.includes('const handler=wholeSiteExperience.wrap(premiumMobileHandler);'),'Whole-Site v109 must remain the final outer HTML communication layer');
expect(runtimeSource.includes('Object.assign(handler,downstream'),'v112 wrapper must preserve downstream runtime certification metadata');
expect(!clientSource.includes('MutationObserver'),'v112 must not introduce MutationObserver');
expect(clientSource.includes("COMPARE_KEY='apgCompare'"),'v112 must reuse established compare storage');
expect(clientSource.includes("SAVED_KEY='apgSaved'"),'v112 must reuse established saved-product storage');
expect(clientSource.includes("'apg-workspace-synced'"),'v112 must reuse workspace sync event');
expect(clientSource.includes('toggleCompare'),'v112 product-card Compare actions must be interactive');
expect(clientSource.includes('toggleSaved'),'v112 product-card Save actions must be interactive');
expect(clientSource.includes('#apgAssistantLauncher'),'v112 must target the certified current Scout launcher');
expect(clientSource.includes('#apgAssistantPanel'),'v112 must target the certified current Scout panel');
expect(clientSource.includes('data-apg112ScoutSave'),'Scout must expose an explicit user-triggered Save action on product suggestions');
expect(clientSource.includes('data-apg112ScoutCompare'),'Scout must expose an explicit user-triggered Compare action on product suggestions');
expect(cssSource.includes('--apg112-scout-lift'),'Scout collision lift variable missing');
expect(cssSource.includes('#apgAssistantLauncher'),'v112 collision CSS must include the certified current Scout launcher');
expect(!cssSource.match(/#apgAssistantLauncher[^}]*visibility\s*:/),'v112 must not override Scout visibility guard');
expect(!cssSource.match(/#apgAssistantLauncher[^}]*pointer-events\s*:/),'v112 must not override Scout pointer guard');
expect(cssSource.includes('[data-apg-route-family="home"] .apg-system-rail{display:none}'),'mobile homepage must remove the duplicated journey rail while preserving it in SSR');
expect(!runtimeSource.includes("||'2026-08-15'"),'v112 must not invent product review freshness');
expect(!runtimeSource.includes('Deep maintained category'),'v112 must not present priority depth as formal Decision Grade');
expect(runtimeSource.includes('does not imply every category-completion gate'),'priority-depth disclaimer missing');

for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight'])expect(!runtimeSource.includes(banned),`v112 runtime must not become a recommendation/commercial scoring layer: ${banned}`);

const candidate=products.find(p=>p&&p.slug&&p.brand&&p.name&&p.source&&Array.isArray(p.highlights)&&p.highlights.length&&p.watch)||products.find(p=>p&&p.slug&&p.source);
expect(candidate,'No product available for v112 source QA');
const card=runtime.productCardV2(candidate,{query:`${candidate.brand} ${candidate.name}`});
for(const token of ['apg112-card-visual','Best for when','Decision reasons','Main trade-off','Why this matched:','View offers','data-compare-product','data-save-product','apg112-commerce-line'])expect(card.includes(token),`Product Card v2 missing ${token}`);
const status=imageStatus(candidate);
if(status.productPhotography)expect(card.includes('Verified product photo'),'Verified imagery must carry provenance-facing state');else expect(card.includes('Verified-photo pending'),'Unverified imagery must retain transparent fallback state');
expect(!card.includes('undefined'),'Product Card v2 exposed undefined data');

const combined=products.find(p=>Array.isArray(p.retailers)&&p.retailers.length&&Array.isArray(p.offers)&&p.offers.length);
if(combined)expect(runtime.retailerRows(combined).length>=Math.max(combined.retailers.length,combined.offers.length),'Retailer layer did not combine maintained retailer sources');
const allRetailerRows=products.flatMap(p=>runtime.retailerRows(p));
const exact=allRetailerRows.find(r=>String(r.amazonMatchStatus||'').toUpperCase()==='EXACT_VERIFIED'||r.amazonModelMatch==='exact');
if(exact)expect(runtime.retailerState(exact).key==='exact','Exact verified Amazon state misclassified');
const variant=allRetailerRows.find(r=>String(r.amazonMatchStatus||'').toUpperCase()==='VARIANT_VERIFIED'||r.amazonModelMatch==='verified-variant');
if(variant)expect(runtime.retailerState(variant).key==='variant','Verified variant state misclassified');
const fallback=allRetailerRows.find(r=>r.kind==='affiliate-search'||String(r.amazonMatchStatus||'').toUpperCase()==='SEARCH_FALLBACK');
if(fallback)expect(runtime.retailerState(fallback).key==='fallback','Model-search fallback state misclassified');
const panel=runtime.retailerPanelV2(candidate);
expect(panel.includes('Retailers contribute 0 recommendation points'),'Retailer independence statement missing');
expect(panel.includes('current price and stock stay explicitly separate'),'Price/stock truth separation missing');
expect(!panel.includes('id="where-to-buy"'),'Retailer inner panel must not duplicate product-page where-to-buy anchor');

const compared=products.filter(p=>p.category===candidate.category).slice(0,2);
if(compared.length===2){const toolbar=runtime.comparisonToolbar(compared);expect(toolbar.includes('Only differences'),'Comparison difference-first control missing');expect((toolbar.match(/apg112-compare-identity/g)||[]).length>=2,'Comparison must keep both product identities visible');}
expect(clientSource.includes("'table.compare tbody tr'"),'Only-differences client must understand the current compare table DOM');

const prioritySlug=Object.keys(searchDepth.categoryDepth||{}).find(slug=>categories[slug]);
expect(prioritySlug,'No priority-depth category found');
const banner=runtime.categoryDepthBanner(prioritySlug);
expect(banner.includes('Priority decision area'),'Priority depth banner missing');
expect(banner.includes('formally Decision Grade'),'Priority depth banner must explicitly avoid false completion claim');

const home=`<!doctype html><html><head><title>x</title></head><body><main><div class="hero-links"><a>x</a></div><div class="category-grid premium-category-grid"><a>A</a><a>B</a><a>C</a><a>D</a><a>E</a></div><section class="trust-strip">Trust</section></main></body></html>`;
const hu=new URL('https://australianproductguide.au/');
const homeOut=runtime.transform(home,'/',hu);
for(const token of ['Search products','Describe what I need','Browse categories','data-apg112-home-categories','data-apg112-depth-rail','premium-mobile-decision-commerce-v112.css','premium-mobile-decision-commerce-v112.js'])expect(homeOut.includes(token),`Homepage transform missing ${token}`);
expect(homeOut.includes('<a>E</a>'),'Homepage SSR must retain all category content before progressive collapse');
expect(runtime.transform(homeOut,'/',hu)===homeOut,'v112 transform must be idempotent');

const productHtml=`<!doctype html><html><head></head><body><section class="product-hero"><div>Hero</div></section><div class="wrap decision-layout"><div>Fit</div></div><div id="where-to-buy" class="wrap"><section class="retailer-panel"><p>legacy</p></section></div><section class="section soft-section full-bleed"><div>Facts</div></section><aside class="evidence-box">Evidence</aside></body></html>`;
const pu=new URL(`https://australianproductguide.au/products/${candidate.slug}/`);
const productOut=runtime.transform(productHtml,pu.pathname,pu);
expect((productOut.match(/id="where-to-buy"/g)||[]).length===1,'Product v112 created duplicate where-to-buy ID');
for(const token of ['data-apg112-product-nav','apg112-summary','apg112-fit','apg112-facts','apg112-evidence','data-apg112-offer-layer'])expect(productOut.includes(token),`Product progressive disclosure missing ${token}`);

const contexts=['/search/','/categories/','/decision-lab/','/my-apg/'];
for(const path of contexts){const u=new URL(`https://australianproductguide.au${path}`);const out=runtime.transform('<html><head></head><body><main>ok</main></body></html>',path,u);expect(out.includes('data-apg-premium-mobile-commerce="v112.0"'),`Global v112 marker missing on ${path}`);}

console.log(JSON.stringify({status:'PASS',version:runtime.VERSION,products:products.length,priorityDecisionAreas:Object.keys(searchDepth.categoryDepth||{}).length,formalDecisionGradeClaim:false,imageryTrustGate:true,retailerCommissionWeightingChanged:false,workspaceActions:'established-local-keys',wholeSiteV109Outermost:true,notes:['Priority decision areas are not formal Category Completion Gate certification.','v112 does not close pre-existing Amazon exact-link, imagery, price, stock or category-evidence backlogs.']},null,2));
