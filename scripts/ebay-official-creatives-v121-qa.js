'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const registry=require('../data/ebay-official-creatives-v121');
const runtime=require('../lib/ebay-official-creatives-v121-runtime');
assert.equal(registry.VERSION,'121.1');assert.equal(runtime.VERSION,'121.1');
const rows=registry.all();assert.equal(rows.length,5);assert.deepEqual(rows.map(r=>r.key),['certifiedRefurbished','tech','homeGarden','motors','sportingGoods']);
function dims(b){assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.toString('ascii',12,16),'VP8 ');const p=20;assert.equal(b[p+3],0x9d);assert.equal(b[p+4],0x01);assert.equal(b[p+5],0x2a);return {width:b.readUInt16LE(p+6)&0x3fff,height:b.readUInt16LE(p+8)&0x3fff};}
for(const row of rows){assert.equal(row.claimScope,'retailer-category-discovery');assert.equal(row.imageType,'image/webp');assert.equal(row.width,700);assert.equal(row.height,400);assert.match(row.image,/-700x400\.webp$/);for(const token of ['campid=5339198634','mkcid=1','mkrid=705-53470-19255-0','siteid=15','toolid=20014','mkevt=1'])assert.match(row.destination,new RegExp(token));const asset=path.join(__dirname,'..','public',row.image.replace(/^\//,''));assert.ok(fs.existsSync(asset));assert.deepEqual(dims(fs.readFileSync(asset)),{width:700,height:400});}
const legacy='<section class="section apg-amz-v41 apg-ebay-v11" data-ebay-epn-discovery="v1.2"><div class="wrap"><div class="apg-amz-v41-home-grid"><span class="apg-amz-v41-art">legacy</span></div></div></section>';
const base=`<!doctype html><html><head></head><body><main>${legacy}</main></body></html>`;
const home=runtime.inject(base,'/');assert.match(home,/data-ebay-official-version="121\.1"/);assert.equal((home.match(/data-ebay-official-creative=/g)||[]).length,5);assert.equal((home.match(/data-ebay-epn-collection=/g)||[]).length,6);assert.doesNotMatch(home,/<section class="section apg-amz-v41 apg-ebay-v11"[^>]*data-ebay-epn-discovery=/i);assert.doesNotMatch(home,/width="125" height="125"/);assert.match(home,/zero recommendation points/i);assert.match(home,/Paid eBay Australia links/i);
const deals=runtime.inject(base,'/deals/');assert.equal(deals,base,'Deals must remain owned by Smart Placement v1.6');
const product=runtime.inject(base,'/products/sony-wh-1000xm6/');assert.equal(product,base,'Product pages must exclude promotional Creative Gallery');
const coffee=runtime.inject('<!doctype html><html><head></head><body><main>coffee</main></body></html>','/categories/coffee-machines/');assert.match(coffee,/data-ebay-official-creative="homeGarden"/);assert.equal((coffee.match(/data-ebay-official-creative=/g)||[]).length,1);
const tyres=runtime.inject('<!doctype html><html><head></head><body><main>tyres</main></body></html>','/categories/tyre-inflators/');assert.match(tyres,/data-ebay-official-creative="motors"/);
const watches=runtime.inject('<!doctype html><html><head></head><body><main>watches</main></body></html>','/categories/smartwatches/');assert.match(watches,/data-ebay-official-creative="tech"/);
for(const rendered of [home,coffee,tyres,watches]){assert.match(rendered,/loading="lazy"/);assert.match(rendered,/rel="sponsored nofollow noopener"/);}
const css=fs.readFileSync(path.join(__dirname,'..','public','assets','ebay-official-creatives-v121.css'),'utf8');assert.match(css,/aspect-ratio:7\/4/);assert.match(css,/translateY\(-2px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/@media\(max-width:700px\)[\s\S]*grid-template-columns:1fr/);assert.doesNotMatch(css,/aspect-ratio:1\/1/);
console.log('EBAY_OFFICIAL_CREATIVES_V121_GREEN version=121.1 homeThemes=5 assets=700x400-webp legacyBlankPanel=removed compactPromotions=6 dealsOwner=smart-placement-v1.6 productPages=excluded recommendationWeight=0 responsive=PASS');
