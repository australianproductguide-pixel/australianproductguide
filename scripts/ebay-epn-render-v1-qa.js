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
  const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},getHeaderNames(){return Object.keys(headers);},write(){return true;},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};
  try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}
});}
function escRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function distinctCategoryFixtures(limit=12){
  const seen=new Set(),rows=[];
  for(const product of products){
    if(ebay.exceptionFor(product))continue;
    const key=String(product.category||product.categoryLabel||'uncategorised');
    if(seen.has(key))continue;
    seen.add(key);rows.push(product);
    if(rows.length>=limit)break;
  }
  return rows;
}

(async()=>{
  assert.equal(surface.VERSION,'1.1');
  assert.equal(products.length,482);

  const fixtures=distinctCategoryFixtures(12);
  assert.equal(fixtures.length,12,'Renderer QA requires broad multi-category coverage');
  for(const product of fixtures){
    const row=ebay.ebayRetailerFor(product);assert.ok(row);
    const response=await render(`/products/${product.slug}/`);
    assert.equal(response.status,200,`${product.slug} route must render`);
    assert.equal(response.headers['x-apg-ebay-epn-surface'],'v1.1');
    assert.match(response.body,/eBay Australia/i,`${product.slug} must render eBay Australia`);
    assert.match(response.body,/data-ebay-epn-pathway="product-search"/,`${product.slug} must label the model-search pathway`);
    assert.match(response.body,/data-ebay-exact-model="false"/,`${product.slug} must explicitly remain non-exact listing evidence`);
    assert.match(response.body,/Product search · paid link/,`${product.slug} must expose the pathway type`);
    assert.match(response.body,/Model-specific eBay search · exact listing, price and stock not maintained by APG/,`${product.slug} must disclose search limitations`);
    assert.ok(response.body.includes(`Search eBay Australia for ${row.identityQuery}`),`${product.slug} must render its identity-bound CTA`);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./,`${product.slug} must render proximal multi-retailer disclosure`);
    const href=row.url.replace(/&/g,'&amp;');assert.ok(response.body.includes(href),`${product.slug} must preserve the governed EPN destination`);
    const anchorPattern=new RegExp(`<a[^>]+href=["']${escRegex(href)}["'][^>]+rel=["']sponsored nofollow noopener["']`,'i');
    assert.match(response.body,anchorPattern,`${product.slug} eBay link must retain sponsored/nofollow/noopener`);
    console.log(`EBAY_RENDER product=PASS slug=${product.slug} category=${product.category||product.categoryLabel}`);
  }

  const recallSlug=Object.keys(ebay.EXCEPTIONS)[0];
  const recalled=products.find(p=>p.slug===recallSlug);assert.ok(recalled,'Recall safety fixture must remain maintained');
  const recallResponse=await render(`/products/${recallSlug}/`);
  assert.equal(recallResponse.status,200);
  assert.doesNotMatch(recallResponse.body,/href=["']https:\/\/www\.ebay\.com\.au/i,'Recall/no-safe-purchase-path page must not expose an eBay purchase/search link');
  assert.doesNotMatch(recallResponse.body,/data-ebay-epn-pathway=/,'Recall/no-safe-purchase-path page must not expose an eBay pathway');

  for(const route of ['/','/deals/']){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-ebay-epn-surface'],'v1.1');
    assert.match(response.body,/data-ebay-epn-discovery="v1\.1"/,`${route} must expose visible eBay discovery`);
    assert.match(response.body,/eBay Australia shopping discovery/i);
    assert.match(response.body,/Refurbished options and current eBay promotions/i);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./);
    const cards=response.body.match(/data-affiliate-retailer="eBay Australia"/g)||[];
    assert.equal(cards.length,6,`${route} must render all six governed eBay promotion/collection cards`);
    for(const record of ebay.promotionRows()){
      const href=record.url.replace(/&/g,'&amp;');
      assert.ok(response.body.includes(href),`${route} must include ${record.key}`);
      assert.ok(response.body.includes(`data-ebay-epn-collection="${record.key}"`));
    }
    assert.doesNotMatch(response.body,/data-ebay-exact-model="true"/,`${route} discovery cards must never claim exact-model identity`);
    console.log(`EBAY_DISCOVERY route=${route} cards=6 PASS`);
  }

  const affiliate=await render('/affiliate-disclosure/');
  assert.match(affiliate.body,/As an Amazon Associate I earn from qualifying purchases\./,'Required Amazon Associate statement must remain on detailed disclosure page');
  assert.match(affiliate.body,/eBay Partner Network/i,'Detailed affiliate disclosure must cover eBay Partner Network');
  assert.match(affiliate.body,/Product-search and collection links are retailer pathways/i);
  const privacy=await render('/privacy/');
  assert.match(privacy.body,/eBay Partner Network/i,'Privacy disclosure must cover eBay attribution parameters');
  assert.match(privacy.body,/does not place personal information in eBay custom tracking IDs/i,'EPN custom tracking IDs must explicitly exclude personal information');

  const v112=fs.readFileSync(path.join(__dirname,'..','lib','premium-mobile-decision-commerce-v112-runtime.js'),'utf8');
  assert.match(v112,/apg112-retailer-row/,'Established v112 responsive retailer-row presentation must remain present');
  const source=fs.readFileSync(path.join(__dirname,'..','lib','ebay-epn-surface-v1-runtime.js'),'utf8');
  assert(!/user-agent|mobile\s*===|desktop\s*===/i.test(source),'eBay retailer truth must not fork by device/user agent');
  assert.doesNotMatch(source,/media-amazon|ebaystatic|i\.ebayimg/i,'eBay discovery must not use scraped or unauthorised retailer imagery');

  console.log(`EBAY_EPN_RENDER_V11_GREEN productRoutes=${fixtures.length} categories=${new Set(fixtures.map(p=>p.category||p.categoryLabel)).size} discoveryRoutes=2 promoCardsPerRoute=6 recallSafety=PASS deviceNeutralSSR=true responsiveLayer=v112 disclosure=multi-retailer`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
