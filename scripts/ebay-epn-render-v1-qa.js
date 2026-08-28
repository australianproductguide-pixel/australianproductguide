'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../api/index');
const {products}=require('../data');
const ebay=require('../data/ebay-epn-interim-v1');
const surface=require('../lib/ebay-epn-surface-v1-runtime');

function render(url){return new Promise((resolve,reject)=>{
  const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
  const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},write(){return true;},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};
  try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}
});}
function fixture(key){return products.find(p=>ebay.selectCollection(p)?.key===key)||null;}
function syntheticProductFor(key){
  const map={hpRefurbished:{brand:'HP',name:'Synthetic renderer contract',slug:'synthetic-hp-contract',category:'laptops',categoryLabel:'Laptops'}};
  return map[key]||null;
}
function certifySynthetic(name,key,label){
  const product=syntheticProductFor(key);assert.ok(product,`${name} has no maintained catalogue fixture and requires an explicit synthetic renderer contract`);
  const row=ebay.ebayRetailerFor(product);assert.equal(row?.destinationKey,key);
  const raw=`<section class="retailer-panel"><a class="retailer-row apg112-retailer-row" href="${row.url.replace(/&/g,'&amp;')}" rel="sponsored nofollow noopener" target="_blank"><span class="apg112-retailer-status">Retailer pathway · paid link</span><small>Current stock not maintained by APG</small><span class="retailer-action">Open retailer ↗</span></a><div class="notice affiliate-disclosure-inline"><strong>Paid Amazon Associate links.</strong> As an Amazon Associate I earn from qualifying purchases.</div></section>`;
  const enhanced=surface.genericiseProductDisclosure(surface.enhanceEbayAnchor(raw,row));
  assert.ok(enhanced.includes(label));assert.match(enhanced,/data-ebay-exact-model="false"/);assert.match(enhanced,/Paid retailer links\.<\/strong>/);assert.match(enhanced,/Refurbished collection · paid link/);
  console.log(`EBAY_RENDER ${name}=PASS synthetic-contract reason=no-maintained-${name.toLowerCase()}-product`);
}

(async()=>{
  const definitions=[
    ['Sony','sonyRefurbished','Browse refurbished Sony options on eBay Australia'],
    ['Samsung','samsungRefurbishedSeasonal','Browse refurbished Samsung options on eBay Australia'],
    ['HP','hpRefurbished','Browse refurbished HP options on eBay Australia'],
    ['Dyson','dysonRefurbishedSeasonal','Browse refurbished Dyson options on eBay Australia'],
    ['laptop','refurbishedLaptops','Browse refurbished laptops on eBay Australia'],
    ['tablet','refurbishedTablets','Browse refurbished tablets on eBay Australia']
  ];
  let routeCases=0,syntheticCases=0;
  for(const [name,key,label] of definitions){
    const product=fixture(key);
    if(!product){certifySynthetic(name,key,label);syntheticCases++;continue;}
    const response=await render(`/products/${product.slug}/`);routeCases++;
    assert.equal(response.status,200,`${name} product route must render`);
    assert.match(response.body,/eBay Australia/i,`${name} must render an eBay retailer pathway`);
    assert.ok(response.body.includes(label),`${name} must honour its retailer-specific CTA`);
    assert.match(response.body,/data-ebay-exact-model="false"/,`${name} eBay CTA must explicitly remain non-exact`);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./,`${name} must render the generic proximal affiliate disclosure`);
    assert.doesNotMatch(response.body,/Paid Amazon Associate links\.<\/strong> As an Amazon Associate I earn from qualifying purchases\.<\/div>/,`${name} product surface must not remain Amazon-only`);
    assert.match(response.body,/rel="sponsored nofollow noopener"/,`${name} affiliate destination must retain sponsored/nofollow/noopener semantics`);
    console.log(`EBAY_RENDER ${name}=PASS slug=${product.slug}`);
  }

  const unrelated=products.find(p=>!ebay.selectCollection(p)&&p.slug!=='anker-power-bank-20000mah-22-5w');assert.ok(unrelated,'Unrelated negative-control product required');
  const negative=await render(`/products/${unrelated.slug}/`);assert.equal(negative.status,200);assert.doesNotMatch(negative.body,/data-ebay-epn-collection=/,'Unrelated product must not receive an eBay collection CTA');
  console.log(`EBAY_RENDER unrelated=PASS slug=${unrelated.slug}`);

  const affiliate=await render('/affiliate-disclosure/');assert.match(affiliate.body,/As an Amazon Associate I earn from qualifying purchases\./,'Required Amazon Associate statement must remain on detailed disclosure page');assert.match(affiliate.body,/eBay Partner Network/i,'Detailed affiliate disclosure must cover eBay Partner Network');
  const privacy=await render('/privacy/');assert.match(privacy.body,/eBay Partner Network/i,'Privacy disclosure must cover eBay attribution parameters');assert.match(privacy.body,/does not place personal information in eBay custom tracking IDs/i,'EPN custom tracking IDs must explicitly exclude personal information');

  const v112=fs.readFileSync(path.join(__dirname,'..','lib','premium-mobile-decision-commerce-v112-runtime.js'),'utf8');assert.match(v112,/@media\s*\([^)]*max-width/i,'v112 must retain an explicit mobile responsive contract');assert.match(v112,/apg112-retailer-row/,'Responsive v112 retailer-row styling must remain present');
  const source=fs.readFileSync(path.join(__dirname,'..','lib','ebay-epn-surface-v1-runtime.js'),'utf8');assert(!/user-agent|mobile\s*===|desktop\s*===/i.test(source),'eBay retailer truth must not fork by device/user agent');
  console.log(`EBAY_EPN_RENDER_V1_GREEN routeCases=${routeCases} syntheticContracts=${syntheticCases} negativeControl=1 desktopMobileSemanticParity=true disclosure=multi-retailer`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
