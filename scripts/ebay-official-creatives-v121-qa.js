'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const registry=require('../data/ebay-official-creatives-v121');
const runtime=require('../lib/ebay-official-creatives-v121-runtime');

assert.equal(registry.VERSION,'121.1');
assert.equal(runtime.VERSION,'121.1');
const rows=registry.all();
assert.equal(rows.length,9,'v121.1 should register nine official category creatives for appropriate discovery use');
assert.deepEqual(registry.HOME_KEYS,['certifiedRefurbished','tech','homeGarden','motors','sportingGoods']);
assert.deepEqual(registry.DEAL_KEYS,['certifiedRefurbished','tech','homeGarden','motors','sportingGoods','fashion','sneakers','watches','collectibles']);

function dimensions(file){
  const b=fs.readFileSync(file);
  if(b.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
  if(b[0]===0xff&&b[1]===0xd8){let i=2;while(i<b.length){if(b[i]!==0xff){i++;continue;}const marker=b[i+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:b.readUInt16BE(i+5),width:b.readUInt16BE(i+7)};const len=b.readUInt16BE(i+2);if(!len)break;i+=2+len;}}
  throw new Error(`Unsupported image format for ${file}`);
}
function checkAsset(row){
  assert.equal(row.claimScope,'retailer-category-discovery');
  assert.match(row.destination,/^https:\/\/www\.ebay\.com\.au\/sch\/i\.html\?/);
  for(const token of ['campid=5339198634','mkcid=1','mkrid=705-53470-19255-0','siteid=15','toolid=20014'])assert.match(row.destination,new RegExp(token));
  const asset=path.join(__dirname,'..','public',row.image.replace(/^\//,''));
  assert.ok(fs.existsSync(asset),`Missing official creative asset: ${row.image}`);
  const actual=dimensions(asset);assert.deepEqual(actual,{width:row.width,height:row.height},`Creative dimensions mismatch: ${row.image}`);
}
for(const row of rows)checkAsset(row);
for(const row of Object.values(registry.HEROES))checkAsset(row);
checkAsset(registry.TRADING_CARDS);
assert.ok(rows.every(row=>row.width>=700&&row.height>=400),'Category creatives must use high-resolution official assets');
assert.ok(!JSON.stringify(rows).includes('125x125'),'No 125x125 creative may be used by the v121.1 registry');

const legacy='<section class="section apg-amz-v41 apg-ebay-v11" data-ebay-epn-discovery="v1.2"><div class="wrap"><div class="apg-amz-v41-home-grid"><span class="apg-amz-v41-art">legacy giant blank promo art</span></div></div></section>';
const base=`<!doctype html><html><head><title>x</title></head><body><main>${legacy}</main></body></html>`;
const home=runtime.inject(base,'/');
assert.match(home,/data-ebay-official-version="121\.1"/);
assert.equal((home.match(/data-ebay-official-creative="(?:certifiedRefurbished|tech|homeGarden|motors|sportingGoods)"/g)||[]).length,5);
assert.match(home,/ebay-certified-refurbished-980x400\.jpg/);
assert.match(home,/ebay-certified-refurbished-700x400\.jpg/);
assert.match(home,/ebay-tech-700x400\.jpg/);
assert.match(home,/ebay-home-garden-700x400\.jpg/);
assert.match(home,/ebay-motors-700x400\.jpg/);
assert.match(home,/ebay-sporting-goods-700x400\.png/);
assert.doesNotMatch(home,/apg-amz-v41-home-grid|apg-amz-v41-art/,'Legacy oversized generic promo artwork must be removed from unified Home/Deals eBay discovery');
assert.equal((home.match(/data-ebay-epn-collection=/g)||[]).length,6,'Existing six governed eBay collection/promotion destinations must be preserved');
assert.match(home,/Paid eBay Australia links/i);
assert.match(home,/zero recommendation points/i);
assert.doesNotMatch(home,/exact listing verified|best deal|lowest price|sale ends|discount/i);

const deals=runtime.inject(base,'/deals/');
assert.equal((deals.match(/data-ebay-official-creative="(?:certifiedRefurbished|tech|homeGarden|motors|sportingGoods|fashion|sneakers|watches|collectibles)"/g)||[]).length,9);
assert.match(deals,/ebay-evergreen-980x400\.jpg/);
assert.match(deals,/ebay-trading-cards-general-970x250\.jpg/);
assert.match(deals,/data-ebay-official-creative="tradingCards"/);

const product=runtime.inject(base,'/products/sony-wh-1000xm6/');
assert.doesNotMatch(product,/data-ebay-official-creatives-v121="true"/,'Promotional Creative Gallery must not be injected into product pages');

const coffee=runtime.inject('<!doctype html><html><head></head><body><main>coffee</main></body></html>','/categories/coffee-machines/');
assert.match(coffee,/data-ebay-official-creative="homeGarden"/);
assert.doesNotMatch(coffee,/data-ebay-official-creative="motors"/);
const tyres=runtime.inject('<!doctype html><html><head></head><body><main>tyres</main></body></html>','/categories/tyre-inflators/');
assert.match(tyres,/data-ebay-official-creative="motors"/);
const smartwatches=runtime.inject('<!doctype html><html><head></head><body><main>watches</main></body></html>','/categories/smartwatches/');
assert.match(smartwatches,/data-ebay-official-creative="tech"/);
assert.doesNotMatch(smartwatches,/data-ebay-official-creative="watches"/,'Traditional Watches creative must not be inferred from Smartwatches');

for(const rendered of [home,deals,coffee,tyres]){
  assert.match(rendered,/loading="lazy"/);
  assert.match(rendered,/rel="sponsored nofollow noopener"/);
}
const css=fs.readFileSync(path.join(__dirname,'..','public','assets','ebay-official-creatives-v121.css'),'utf8');
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:700px\)[\s\S]*grid-template-columns:1fr/);
assert.match(css,/translateY\(-3px\)/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
assert.match(css,/aspect-ratio:7\/4/);
assert.doesNotMatch(css,/aspect-ratio:1\/1/);

console.log('EBAY_OFFICIAL_CREATIVES_V121_GREEN version=121.1 categoryAssets=9 home=5 deals=9 hero=980x400 tradingCards=970x250 legacyBlankPanel=removed productPages=excluded recommendationWeight=0 disclosure=PASS dimensions=PASS responsive=PASS');
