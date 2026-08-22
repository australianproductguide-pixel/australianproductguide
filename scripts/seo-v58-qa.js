'use strict';

const assert=require('assert');
const seo=require('../lib/seo-optimisation-v58-runtime');
const relatedUi=require('../lib/related-decisions-ui-v69');
const social=require('../lib/social-integration-v56-runtime');
const shareCard=require('../lib/social-share-card-v57-runtime');
const {categories,products}=require('../data');
const {pairPages,comparisonGovernance,MAX_TOTAL_COMPARISONS,MAX_CATEGORY_COMPARISONS}=require('../lib/routes');

const e28=products.find(p=>p.slug==='eufy-robot-vacuum-omni-e28');
assert(e28,'E28 product fixture must exist');
assert.strictEqual(seo.productDisplayName(e28),'eufy Robot Vacuum Omni E28','product display name must add the official eufy brand styling');

const sample='<html><head><title>Robot Vacuum Omni E28 Australia | Decision Guide & Comparison</title><meta property="og:title" content="Old"><meta property="og:image" content="https://australianproductguide.au/assets/apg-social-card.png"><meta property="og:image:url" content="https://australianproductguide.au/assets/legacy-social-card.jpg"></head><body><div id="where-to-buy" class="wrap"></div></body></html>';
const productHtml=seo.optimiseHtml(sample,'/products/eufy-robot-vacuum-omni-e28/');
assert(productHtml.includes('<title>eufy Robot Vacuum Omni E28 Australia | Decision Guide &amp; Comparison</title>'),'product title must include brand');
assert(productHtml.includes('name="twitter:title"'),'product pages must expose a Twitter/X title');
assert(productHtml.includes('apg-seo-product-related'),'product pages must expose semantic adjacent buying decisions');
assert(productHtml.includes('<a class="category-card"'),'SEO v58 fixture must expose the legacy related-card markup before the presentation repair');
const polishedProductHtml=relatedUi.polishRelatedDecisionsHtml(productHtml);
assert(!polishedProductHtml.includes('<a class="category-card"'),'related decision cards must not use the incompatible legacy anchor-only category-card structure');
assert(polishedProductHtml.includes('<article class="category-card">'),'related decision cards must reuse APG canonical category-card markup');
assert(polishedProductHtml.includes('class="category-icon large"'),'related decision cards must expose APG category iconography');
assert(polishedProductHtml.includes('class="button secondary"'),'related decision cards must expose governed APG action styling');
assert(polishedProductHtml.includes('Explore category'),'related decision cards must provide the standard category action');
assert(polishedProductHtml.includes('Help me choose →'),'related decision cards must preserve the standard adjacent finder action');
assert(polishedProductHtml.includes('name="apg-related-decisions-ui" content="v69.0.0"'),'repaired related decision markup must expose the v69 presentation marker');

const robot=categories['robot-vacuums'];
const related=seo.relatedCategories(robot).map(c=>c.slug);
for(const slug of ['stick-vacuums','automatic-litter-boxes','smart-plugs','smart-displays','home-security-cameras'])assert(related.includes(slug),`robot-vacuum semantic links missing ${slug}`);
assert(!related.includes('action-cameras'),'robot-vacuum semantic links must not include action cameras');

const categoryImage=seo.categorySocialImage(robot);
assert(categoryImage&&categoryImage.src.includes('/category-editorial/robot-vacuums.'),'robot-vacuum category must use its approved editorial image for social metadata');
const categoryHtml=seo.patchSocialImage(sample,categoryImage);
assert(categoryHtml.includes(categoryImage.src),'category OG image must be page-specific');
assert(categoryHtml.includes('og:image:alt'),'category OG image must expose descriptive alt metadata');

const globalShareHtml=shareCard.patchShareMetadata(sample);
assert(globalShareHtml.includes(shareCard.SHARE_IMAGE_URL),'owner-approved APG social artwork must remain the global fallback');
assert(!globalShareHtml.includes('property="og:image:url"'),'global share-card layer must not emit the redundant Open Graph image URL alias');
const categoryAfterFallback=seo.optimiseHtml(globalShareHtml,'/categories/robot-vacuums/');
assert(categoryAfterFallback.includes(categoryImage.src),'category SEO metadata must override the global card with relevant provenance-backed category imagery');
assert(!categoryAfterFallback.includes(shareCard.SHARE_IMAGE_URL),'category-specific social metadata must not retain a conflicting generic APG image declaration');
const productAfterFallback=seo.optimiseHtml(globalShareHtml,'/products/eufy-robot-vacuum-omni-e28/');
assert(productAfterFallback.includes(shareCard.SHARE_IMAGE_URL),'product pages without verified exact imagery must retain the approved APG fallback card');

assert.strictEqual(seo.routeLastmod('/products/eufy-robot-vacuum-omni-e28/'),e28.lastSubstantiveReview,'product sitemap lastmod must equal substantive review date');
assert.strictEqual(seo.routeLastmod('/categories/robot-vacuums/'),'2026-08-19','category lastmod should reflect the later approved editorial-image update');
assert.strictEqual(seo.routeLastmod('/about/'),null,'routes without defensible material-change provenance must omit lastmod');
const sitemap=seo.patchSitemapXml('<?xml version="1.0"?><urlset><url><loc>https://australianproductguide.au/products/eufy-robot-vacuum-omni-e28/</loc></url><url><loc>https://australianproductguide.au/categories/robot-vacuums/</loc></url><url><loc>https://australianproductguide.au/about/</loc></url></urlset>');
assert(sitemap.includes(`<lastmod>${e28.lastSubstantiveReview}</lastmod>`),'product sitemap entry must gain accurate lastmod');
assert(sitemap.includes('<lastmod>2026-08-19</lastmod>'),'category sitemap entry must gain accurate lastmod');
assert(/<url><loc>https:\/\/australianproductguide\.au\/about\/<\/loc><\/url>/.test(sitemap),'undated trust route must remain present without synthetic lastmod');

assert(pairPages.length<=MAX_TOTAL_COMPARISONS,'comparison route count must remain under global SEO cap');
assert.strictEqual(comparisonGovernance.totalCap,MAX_TOTAL_COMPARISONS);
assert.strictEqual(comparisonGovernance.categoryCap,MAX_CATEGORY_COMPARISONS);
for(const c of Object.values(categories))assert((Number.isInteger(c.comparisonLimit)?c.comparisonLimit:2)<=MAX_CATEGORY_COMPARISONS,`comparison cap exceeded for ${c.slug}`);

const socialSample='<html><head></head><body><header><nav><div></div></nav></header><footer><div class="footer-v11-rulebar"></div></footer></body></html>';
const socialHtml=social.inject(socialSample,'/');
assert(socialHtml.includes('Follow us on social'),'social UI must use the simplified follow-us wording');
assert(socialHtml.includes('Comparisons, buying tips and fresh product research'),'footer social copy must be concise and marketing-oriented');
assert(socialHtml.includes('M18.263 11.097'),'Threads must use the current recognisable fill mark rather than the old approximation');
assert(socialHtml.includes('M12.017 0C5.396'),'Pinterest must use the recognisable circular Pinterest mark');

console.log(`APG SEO v58 QA PASSED: branded product titles, route-specific lastmod, semantic internal links, canonical related-decision cards, category OG imagery, conflict-free approved social fallback, social copy/marks and comparison caps (${pairPages.length}/${MAX_TOTAL_COMPARISONS}).`);
