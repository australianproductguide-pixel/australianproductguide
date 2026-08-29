'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const registry=require('../data/ebay-official-creatives-v121');
const runtime=require('../lib/ebay-official-creatives-v121-runtime');

assert.equal(registry.VERSION,'121.1');
assert.equal(runtime.VERSION,'121.1');
const rows=registry.all();
assert.equal(rows.length,5,'v121.1 publishes only the five current APG-relevant official eBay themes');
assert.deepEqual(rows.map(row=>row.key),['certifiedRefurbished','tech','homeGarden','motors','sportingGoods']);

function webpDimensions(b){
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  const kind=b.toString('ascii',12,16);assert.equal(kind,'VP8 ','Expected lossy VP8 WebP creative');
  const p=20;assert.equal(b[p+3],0x9d);assert.equal(b[p+4],0x01);assert.equal(b[p+5],0x2a);
  return {width:b.readUInt16LE(p+6)&0x3fff,height:b.readUInt16LE(p+8)&0x3fff};
}
for(const row of rows){
  assert.equal(row.claimScope,'retailer-category-discovery');
  assert.equal(row.imageType,'image/webp');assert.equal(row.width,700);assert.equal(row.height,400);assert.match(row.image,/-700x400\.webp$/);
  assert.match(row.destination,/^https:\/\/www\.ebay\.com\.au\/sch\/i\.html\?/);
  for(const token of ['campid=5339198634','mkcid=1','mkrid=705-53470-19255-0','siteid=15','toolid=20014','mkevt=1'])assert.match(row.destination,new RegExp(token));
  const asset=path.join(__dirname,'..','public',row.image.replace(/^\//,''));assert.ok(fs.existsSync(asset),`Missing official creative asset: ${row.image}`);
  assert.deepEqual(webpDimensions(fs.readFileSync(asset)),{width:700,height:400},`Creative dimensions mismatch: ${row.image}`);
}

const legacy='<section class="section apg-amz-v41 apg-ebay-v11" data-ebay-epn-discovery="v1.2"><div class="wrap"><div class="apg-amz-v41-home-grid"><span class="apg-amz-v41-art">legacy giant blank promo art</span></div></div></section>';
const base=`<!doctype html><html><head><title>x</title></head><body><main>${legacy}</main></body></html>`;
const home=runtime.inject(base,'/');
assert.match(home,/data-ebay-official-version="121\.1"/);
assert.equal((home.match(/data-ebay-official-creative=/g)||[]).length,5);
for(const name of ['certified-refurbished','tech','home-garden','motors','sporting-goods'])assert.match(home,new RegExp(`ebay-${name}-700x400\\.webp`));
assert.doesNotMatch(home,/width="125" height="125"/);
assert.doesNotMatch(home,/apg-amz-v41-home-grid|apg-amz-v41-art/,'Legacy oversized promo artwork must be removed from Home/Deals eBay discovery');
assert.equal((home.match(/data-ebay-epn-collection=/g)||[]).length,6,'Existing six governed eBay collection/promotion pathways must remain available as compact secondary links');
assert.match(home,/Paid eBay Australia links/i);assert.match(home,/zero recommendation points/i);
assert.doesNotMatch(home,/exact listing verified|best deal|lowest price|sale ends|discount/i);
const deals=runtime.inject(base,'/deals/');assert.equal((deals.match(/data-ebay-official-creative=/g)||[]).length,5);assert.doesNotMatch(deals,/apg-amz-v41-home-grid|apg-amz-v41-art/);

const product=runtime.inject(base,'/products/sony-wh-1000xm6/');
assert.doesNotMatch(product,/data-ebay-official-creatives-v121="true"/,'Promotional Creative Gallery must not be injected into product pages');
const coffee=runtime.inject('<!doctype html><html><head></head><body><main>coffee</main></body></html>','/categories/coffee-machines/');assert.match(coffee,/data-ebay-official-creative="homeGarden"/);assert.equal((coffee.match(/data-ebay-official-creative=/g)||[]).length,1);
const tyres=runtime.inject('<!doctype html><html><head></head><body><main>tyres</main></body></html>','/categories/tyre-inflators/');assert.match(tyres,/data-ebay-official-creative="motors"/);assert.equal((tyres.match(/data-ebay-official-creative=/g)||[]).length,1);
const smartwatches=runtime.inject('<!doctype html><html><head></head><body><main>watches</main></body></html>','/categories/smartwatches/');assert.match(smartwatches,/data-ebay-official-creative="tech"/);assert.equal((smartwatches.match(/data-ebay-official-creative=/g)||[]).length,1);
for(const rendered of [home,deals,coffee,tyres,smartwatches]){assert.match(rendered,/loading="lazy"/);assert.match(rendered,/rel="sponsored nofollow noopener"/);}

const css=fs.readFileSync(path.join(__dirname,'..','public','assets','ebay-official-creatives-v121.css'),'utf8');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/@media\(max-width:700px\)[\s\S]*grid-template-columns:1fr/);assert.match(css,/translateY\(-2px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/aspect-ratio:7\/4/);assert.doesNotMatch(css,/aspect-ratio:1\/1|apg-ebay-official-v121-hero/);

console.log('EBAY_OFFICIAL_CREATIVES_V121_GREEN version=121.1 themes=5 assets=700x400-webp legacyBlankPanel=removed compactPromotions=6 productPages=excluded recommendationWeight=0 disclosure=PASS responsive=PASS');
