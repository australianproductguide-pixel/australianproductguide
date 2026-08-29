'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const registry=require('../data/ebay-official-creatives-v121');
const runtime=require('../lib/ebay-official-creatives-v121-runtime');

assert.equal(registry.VERSION,'121.0');
assert.equal(runtime.VERSION,'121.0');
const rows=registry.all();
assert.equal(rows.length,5,'v121 should publish only the five current APG-relevant official eBay creative themes');
assert.deepEqual(rows.map(r=>r.key),['certifiedRefurbished','tech','homeGarden','motors','sportingGoods']);

for(const row of rows){
  assert.equal(row.claimScope,'retailer-category-discovery');
  assert.match(row.destination,/^https:\/\/www\.ebay\.com\.au\/sch\/i\.html\?/);
  assert.match(row.destination,/campid=5339198634/);
  assert.match(row.destination,/mkcid=1/);
  assert.match(row.destination,/mkrid=705-53470-19255-0/);
  assert.match(row.destination,/siteid=15/);
  assert.match(row.destination,/toolid=20014/);
  const asset=path.join(__dirname,'..','public',row.image.replace(/^\//,''));
  assert.ok(fs.existsSync(asset),`Missing official creative asset: ${row.image}`);
}

const base='<!doctype html><html><head><title>x</title></head><body><main><section class="section apg-amz-v41 apg-ebay-v11" data-ebay-epn-discovery="v1.2"><div class="wrap">existing eBay cards</div></section></main></body></html>';
const home=runtime.inject(base,'/');
assert.match(home,/data-ebay-official-creatives-v121="true"/);
assert.match(home,/Official eBay creative/);
assert.match(home,/ebay-certified-refurbished\.jpg/);
assert.match(home,/ebay-tech\.jpg/);
assert.match(home,/ebay-home-garden\.jpg/);
assert.match(home,/ebay-motors\.jpg/);
assert.match(home,/ebay-sporting-goods\.png/);
assert.equal((home.match(/data-ebay-official-creative=/g)||[]).length,5);
assert.match(home,/rel="sponsored nofollow noopener"/);
assert.match(home,/do not affect product rankings/i);
assert.doesNotMatch(home,/exact listing verified|best deal|lowest price|sale ends|discount/i);

const product=runtime.inject(base,'/products/sony-wh-1000xm6/');
assert.doesNotMatch(product,/data-ebay-official-creatives-v121="true"/,'Official category creative must not be injected into product recommendations');

const coffee=runtime.inject('<!doctype html><html><head></head><body><main>coffee</main></body></html>','/categories/coffee-machines/');
assert.match(coffee,/data-ebay-official-creative="homeGarden"/,'Home and Garden creative should be available on relevant category discovery');
assert.doesNotMatch(coffee,/data-ebay-official-creative="motors"/);

const tyres=runtime.inject('<!doctype html><html><head></head><body><main>tyres</main></body></html>','/categories/tyre-inflators/');
assert.match(tyres,/data-ebay-official-creative="motors"/,'Motors creative should be available on relevant automotive discovery');

console.log('EBAY_OFFICIAL_CREATIVES_V121_GREEN themes=5 homeDeals=official-category-creative productPages=excluded recommendationWeight=0 disclosure=PASS assets=PASS');
