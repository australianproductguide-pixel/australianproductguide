'use strict';
const assert=require('assert');
const layer=require('../lib/entity-discovery-v1');
const {products}=require('../data');

const website=layer.normaliseSchema({'@context':'https://schema.org','@type':'WebSite',name:'Australian Product Guide',url:'https://preview.invalid/'},'/');
assert.strictEqual(website['@id'],'https://australianproductguide.au/#website');
assert.strictEqual(website.url,'https://australianproductguide.au/');
assert.strictEqual(website.inLanguage,'en-AU');
assert.strictEqual(website.publisher['@id'],'https://australianproductguide.au/#organization');

const org=layer.normaliseSchema({'@context':'https://schema.org','@type':'Organization',name:'Australian Product Guide'},'/');
assert.strictEqual(org['@id'],'https://australianproductguide.au/#organization');
assert.strictEqual(org.alternateName,'APG');
assert.strictEqual(org.areaServed.name,'Australia');
assert(!org.sameAs,'unverified external profiles must not be invented in Organization schema');

const p=products.find(x=>x.id&&/^https:\/\//.test(String(x.source||'')));
assert(p,'QA requires a maintained product with an APG ID and exact primary source');
const path=`/products/${p.slug}/`;
const schema=layer.normaliseSchema({'@context':'https://schema.org','@type':'Product',name:p.name,brand:{'@type':'Brand',name:p.brand},url:'https://preview.invalid'+path},path);
assert.strictEqual(schema['@id'],`https://australianproductguide.au${path}#product`);
assert.strictEqual(schema.url,`https://australianproductguide.au${path}`);
assert.strictEqual(schema.mainEntityOfPage,`https://australianproductguide.au${path}`);
assert.strictEqual(schema.sku,p.id);
assert.strictEqual(schema.sameAs,p.source);
assert(!schema.aggregateRating,'product entity enrichment must not invent ratings');
assert(!schema.review,'product entity enrichment must not invent reviews');
assert(!schema.offers,'product entity enrichment must not turn maintained price context into a live offer claim');

const html=`<html><head><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Product',name:p.name})}</script></head></html>`;
const enriched=layer.enrichSchemas(html,path);
assert(enriched.includes(`https://australianproductguide.au${path}#product`),'rendered Product JSON-LD must receive canonical entity ID');
assert(enriched.includes(p.id),'rendered Product JSON-LD must receive maintained APG identifier');

console.log(`APG Entity Discovery v1 QA PASSED: canonical Website/Organization IDs and truthful Product identity enrichment verified.`);
