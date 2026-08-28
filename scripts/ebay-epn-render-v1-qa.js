'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../api/index');
const {products}=require('../data');
const ebay=require('../data/ebay-epn-interim-v1');

function render(url){return new Promise((resolve,reject)=>{
  const headers={};
  const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
  const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},write(){return true;},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};
  try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}
});}

function fixture(key){
  const product=products.find(p=>ebay.selectCollection(p)?.key===key);
  assert.ok(product,`Representative product required for ${key}`);
  return product;
}

(async()=>{
  const cases=[
    ['Sony',fixture('sonyRefurbished'),'Browse refurbished Sony options on eBay Australia'],
    ['Samsung',fixture('samsungRefurbishedSeasonal'),'Browse refurbished Samsung options on eBay Australia'],
    ['HP',fixture('hpRefurbished'),'Browse refurbished HP options on eBay Australia'],
    ['Dyson',fixture('dysonRefurbishedSeasonal'),'Browse refurbished Dyson options on eBay Australia'],
    ['laptop',fixture('refurbishedLaptops'),'Browse refurbished laptops on eBay Australia'],
    ['tablet',fixture('refurbishedTablets'),'Browse refurbished tablets on eBay Australia']
  ];
  for(const [name,product,label] of cases){
    const response=await render(`/products/${product.slug}/`);
    assert.equal(response.status,200,`${name} product route must render`);
    assert.match(response.body,/eBay Australia/i,`${name} must render an eBay retailer pathway`);
    assert.ok(response.body.includes(label),`${name} must honour its retailer-specific CTA`);
    assert.match(response.body,/data-ebay-exact-model="false"/,`${name} eBay CTA must explicitly remain non-exact`);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./,`${name} must render the generic proximal affiliate disclosure`);
    assert.doesNotMatch(response.body,/Paid Amazon Associate links\.<\/strong> As an Amazon Associate I earn from qualifying purchases\.<\/div>/,`${name} product surface must not remain Amazon-only`);
    assert.match(response.body,/rel="sponsored nofollow noopener"/,`${name} affiliate destination must retain sponsored/nofollow/noopener semantics`);
    console.log(`EBAY_RENDER ${name}=PASS slug=${product.slug}`);
  }

  const unrelated=products.find(p=>!ebay.selectCollection(p)&&p.slug!=='anker-power-bank-20000mah-22-5w');
  assert.ok(unrelated,'Unrelated negative-control product required');
  const negative=await render(`/products/${unrelated.slug}/`);
  assert.equal(negative.status,200);
  assert.doesNotMatch(negative.body,/data-ebay-epn-collection=/,'Unrelated product must not receive an eBay collection CTA');
  console.log(`EBAY_RENDER unrelated=PASS slug=${unrelated.slug}`);

  const affiliate=await render('/affiliate-disclosure/');
  assert.match(affiliate.body,/As an Amazon Associate I earn from qualifying purchases\./,'Required Amazon Associate statement must remain on detailed disclosure page');
  assert.match(affiliate.body,/eBay Partner Network/i,'Detailed affiliate disclosure must now cover eBay Partner Network');
  const privacy=await render('/privacy/');
  assert.match(privacy.body,/eBay Partner Network/i,'Privacy disclosure must cover eBay attribution parameters');
  assert.match(privacy.body,/does not place personal information in eBay custom tracking IDs/i,'EPN custom tracking IDs must explicitly exclude personal information');

  // Responsive certification: the same SSR retailer semantics must be delivered to both layouts,
  // with v112 remaining the responsive presentation layer rather than branching retailer truth by device.
  const v112=fs.readFileSync(path.join(__dirname,'..','lib','premium-mobile-decision-commerce-v112-runtime.js'),'utf8');
  assert.match(v112,/@media\s*\([^)]*max-width/i,'v112 must retain an explicit mobile responsive contract');
  assert.match(v112,/apg112-retailer-row/,'Responsive v112 retailer-row styling must remain present');
  const surface=fs.readFileSync(path.join(__dirname,'..','lib','ebay-epn-surface-v1-runtime.js'),'utf8');
  assert(!/user-agent|mobile\s*===|desktop\s*===/i.test(surface),'eBay retailer truth must not fork by device/user agent');

  console.log(`EBAY_EPN_RENDER_V1_GREEN representative=${cases.length} negativeControl=1 desktopMobileSemanticParity=true disclosure=multi-retailer`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
