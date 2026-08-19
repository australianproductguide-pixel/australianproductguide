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
for(const token of ['User-agent: *','User-agent: OAI-SearchBot','User-agent: ChatGPT-User','Disallow: /my-apg/','https://australianproductguide.au/sitemap.xml','https://australianproductguide.au/sitemap-index.xml'])assert(robots.includes(token),`robots.txt missing ${token}`);
assert(!robots.includes('Disallow: /products/'),'public product pages must remain crawlable');
assert(!robots.includes('Disallow: /categories/'),'public category pages must remain crawlable');

const legacy=layer.urlset(indexableRoutes);
assert(legacy.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),'sitemap must be XML');
assert(legacy.includes('<lastmod>'),'sitemap must carry evidence-derived lastmod values');
for(const path of ['/','/categories/','/products/'+products[0].slug+'/'])assert(legacy.includes(`<loc>https://australianproductguide.au${path}</loc>`),`legacy sitemap missing ${path}`);

const index=layer.sitemapIndex();
for(const name of layer.GROUP_ORDER)assert(index.includes(`https://australianproductguide.au/sitemaps/${name}.xml`),`sitemap index missing ${name}`);

const llms=layer.llmsText();
for(const token of ['Australian Product Guide',`${products.length} products`,`${Object.keys(categories).length} categories`,`${brands.length} represented brands`,'zero recommendation points','desk-researched / specification-based','sitemap-index.xml'])assert(llms.includes(token),`llms.txt missing ${token}`);

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

const sample='<html><head><title>Sample</title></head><body></body></html>';
const indexed=layer.injectIndexingDirectives(sample,'/');
assert(indexed.includes('max-image-preview:large'),'indexable pages must expose rich-preview crawler directives');
assert.strictEqual(layer.injectIndexingDirectives(sample,'/search/'),sample,'noindex/dynamic search surface must not receive index directives');
assert.strictEqual(layer.injectIndexingDirectives('<html><head><meta name="robots" content="noindex,follow"></head></html>','/'),'<html><head><meta name="robots" content="noindex,follow"></head></html>','existing robots directives must never be overridden');

console.log(`APG Discoverability v1 QA PASSED: ${indexableRoutes.length} canonical routes, ${products.length} products, ${Object.keys(categories).length} categories, ${brands.length} brands.`);
