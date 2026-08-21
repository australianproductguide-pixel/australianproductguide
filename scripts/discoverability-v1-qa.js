'use strict';
const assert=require('assert');
const layer=require('../lib/discoverability-v1');
const {categories,products}=require('../data');
const {brands,indexableRoutes}=require('../lib/routes');

const grouped=layer.GROUP_ORDER.flatMap(name=>layer.sitemapGroups[name]);
assert.strictEqual(grouped.length,indexableRoutes.length,'every canonical route must belong to exactly one sitemap group');
assert.strictEqual(new Set(grouped).size,indexableRoutes.length,'segmented sitemap routes must be unique');
assert.deepStrictEqual(new Set(grouped),new Set(indexableRoutes),'segmented sitemaps must reconcile to the canonical route registry');
assert.strictEqual(layer.sitemapGroups.products.length,products.length,'product sitemap must contain every maintained product');
assert.strictEqual(layer.sitemapGroups.categories.length,Object.keys(categories).length,'category sitemap must contain every maintained category');
assert.strictEqual(layer.sitemapGroups.brands.length,brands.length,'brand sitemap must contain every represented brand');

const robots=layer.robotsText();
for(const token of ['User-agent: *','User-agent: Googlebot','User-agent: bingbot','User-agent: OAI-SearchBot','User-agent: ChatGPT-User','User-agent: PerplexityBot','User-agent: Perplexity-User','User-agent: Claude-SearchBot','User-agent: Claude-User','Disallow: /my-apg/','https://australianproductguide.au/sitemap.xml','https://australianproductguide.au/sitemap-index.xml'])assert(robots.includes(token),`robots.txt missing ${token}`);
assert(!robots.includes('Disallow: /products/'),'public product pages must remain crawlable');
assert(!robots.includes('Disallow: /categories/'),'public category pages must remain crawlable');

const legacy=layer.urlset(indexableRoutes);
assert(legacy.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),'sitemap must be XML');
assert(!/<lastmod>/i.test(legacy),'sitemap must not invent page modification dates from catalogue evidence dates');
assert.strictEqual((legacy.match(/<loc>/g)||[]).length,indexableRoutes.length,'sitemap must retain every canonical route');
for(const path of ['/','/categories/','/products/'+products[0].slug+'/'])assert(legacy.includes(`<loc>https://australianproductguide.au${path}</loc>`),`legacy sitemap missing ${path}`);

const index=layer.sitemapIndex();
assert(!/<lastmod>/i.test(index),'sitemap index must not invent group modification dates');
for(const name of layer.GROUP_ORDER)assert(index.includes(`https://australianproductguide.au/sitemaps/${name}.xml`),`sitemap index missing ${name}`);

const llms=layer.llmsText();
for(const token of ['Australian Product Guide',`${products.length} products`,`${Object.keys(categories).length} categories`,`${brands.length} represented brands`,'zero recommendation points','desk-researched / specification-based','sitemap-index.xml','route-specific material-change provenance'])assert(llms.includes(token),`llms.txt missing ${token}`);
assert.strictEqual((llms.match(/^# /gm)||[]).length,1,'llms.txt must contain one H1 title');
assert(/^> .+/m.test(llms),'llms.txt must include the recommended summary blockquote');
for(const heading of ['## Best entry points','## Trust and methodology','## Machine-readable discovery'])assert(llms.includes(heading),`llms.txt missing section ${heading}`);
for(const link of ['[Product categories](','[Product comparison](','[Buying guides](','[Decision Lab](','[Methodology](','[Sources](','[Complete sitemap](','[Public catalogue data]('])assert(llms.includes(link),`llms.txt missing recommended Markdown link ${link}`);
assert(!/^- [^\[][^\n]*:\s+https?:\/\//m.test(llms),'llms.txt list entries must use Markdown links rather than label-colon bare URLs');
const listLines=llms.split('\n').filter(line=>line.startsWith('- '));
assert(listLines.length>0,'llms.txt must expose linked resources');
assert(listLines.every(line=>/^- \[[^\]]+\]\(https:\/\/australianproductguide\.au\/[^)]*\):\s+\S/.test(line)),'every llms.txt list item must be a canonical Markdown link followed by a useful description');

const manifest=layer.discoveryManifest();
assert.strictEqual(manifest.canonicalUrl,'https://australianproductguide.au/');
assert.strictEqual(manifest.locale,'en-AU');
assert.strictEqual(manifest.market,'AU');
assert.strictEqual(manifest.counts.products,products.length);
assert.strictEqual(manifest.counts.categories,Object.keys(categories).length);
assert.strictEqual(manifest.counts.brands,brands.length);
assert.strictEqual(manifest.counts.indexableRoutes,indexableRoutes.length);
assert.strictEqual(manifest.categories.length,Object.keys(categories).length);
assert(manifest.categories.every(c=>/^https:\/\/australianproductguide\.au\/categories\/.+\/$/.test(c.url)),'manifest category URLs must be canonical AU URLs');
assert(!Object.prototype.hasOwnProperty.call(manifest,'lastModified'),'discovery manifest must not present a catalogue batch date as a site modification date');
assert(manifest.categories.every(c=>!Object.prototype.hasOwnProperty.call(c,'lastModified')),'manifest category entries must not invent modification dates');
assert(/route-specific material-change provenance/i.test(manifest.principles.freshness),'manifest must explain the page-freshness policy');

const sample='<html><head><title>Sample</title></head><body></body></html>';
const indexed=layer.injectIndexingDirectives(sample,'/');
assert(indexed.includes('max-image-preview:large'),'indexable pages must expose rich-preview crawler directives');
assert.strictEqual(layer.injectIndexingDirectives(sample,'/search/'),sample,'noindex/dynamic search surface must not receive index directives');
assert.strictEqual(layer.injectIndexingDirectives('<html><head><meta name="robots" content="noindex,follow"></head></html>','/'),'<html><head><meta name="robots" content="noindex,follow"></head></html>','existing robots directives must never be overridden');

console.log(`APG Discoverability v1 QA PASSED: ${indexableRoutes.length} canonical routes, ${products.length} products, ${Object.keys(categories).length} categories, ${brands.length} brands; synthetic lastmod=OFF; llms.txt agent guidance=SPEC-COMPLIANT.`);
