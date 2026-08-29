'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../api/index');
const {products}=require('../data');
const ebay=require('../data/ebay-epn-interim-v1');
const commerce=require('../data/commerce-eligibility-v114');
const surface=require('../lib/ebay-epn-surface-v1-runtime');

function render(url){return new Promise((resolve,reject)=>{
  const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
  const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},getHeaderNames(){return Object.keys(headers);},write(){return true;},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};
  try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}
});}
function escRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function htmlHref(value){return String(value||'').replace(/&/g,'&amp;');}
function offerPanel(html){const m=String(html||'').match(/<section class="retailer-panel apg112-offer-panel"[\s\S]*?<\/section>/i);return m?m[0]:'';}
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
async function assertSuppressedRoute(slug,label){
  const product=products.find(p=>p.slug===slug);assert.ok(product,`${label} fixture must remain maintained`);
  assert.equal(product.commerceSuppressed,true,`${label} fixture must be commerce-suppressed`);
  assert.deepEqual(product.retailers,[],`${label} fixture must have no retailer rows`);
  const response=await render(`/products/${slug}/`);
  assert.equal(response.status,200);
  assert.doesNotMatch(response.body,/href=["']https:\/\/www\.ebay\.com\.au/i,`${label} page must not expose an eBay purchase/search link`);
  assert.doesNotMatch(response.body,/data-ebay-epn-pathway=/,`${label} page must not expose an eBay pathway`);
  return response;
}

(async()=>{
  assert.equal(surface.VERSION,'1.2');
  assert.equal(products.length,482);

  const fixtures=distinctCategoryFixtures(12);
  assert.equal(fixtures.length,12,'Renderer QA requires broad multi-category coverage');
  for(const product of fixtures){
    const row=ebay.ebayRetailerFor(product);assert.ok(row);
    const response=await render(`/products/${product.slug}/`);
    assert.equal(response.status,200,`${product.slug} route must render`);
    assert.equal(response.headers['x-apg-ebay-epn-surface'],'v1.2');
    assert.match(response.body,/eBay Australia/i,`${product.slug} must render eBay Australia`);
    assert.match(response.body,/data-ebay-epn-pathway="product-search"/,`${product.slug} must label the model-search pathway`);
    assert.match(response.body,/data-ebay-exact-model="false"/,`${product.slug} must explicitly remain non-exact listing evidence`);
    assert.match(response.body,/Product search · paid link/,`${product.slug} must expose the pathway type`);
    assert.match(response.body,/Model-specific eBay search · exact listing, price and stock not maintained by APG/,`${product.slug} must disclose search limitations`);
    assert.ok(response.body.includes(`Search eBay Australia for ${row.identityQuery}`),`${product.slug} must render its identity-bound CTA`);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./,`${product.slug} must render proximal multi-retailer disclosure`);
    const href=htmlHref(row.url);assert.ok(response.body.includes(href),`${product.slug} must preserve the governed EPN destination`);
    const anchorPattern=new RegExp(`<a[^>]+href=["']${escRegex(href)}["'][^>]+rel=["']sponsored nofollow noopener["']`,'i');
    assert.match(response.body,anchorPattern,`${product.slug} eBay link must retain sponsored/nofollow/noopener`);
    console.log(`EBAY_RENDER product=PASS slug=${product.slug} category=${product.category||product.categoryLabel}`);
  }

  const safetySlug=Object.keys(commerce.SAFETY_EXCLUSIONS)[0];
  const identitySlug=Object.keys(commerce.IDENTITY_EXCLUSIONS)[0];
  const safetyResponse=await assertSuppressedRoute(safetySlug,'recall/no-safe-purchase-path');
  await assertSuppressedRoute(identitySlug,'entity/market/lifecycle-excluded');

  if(safetySlug==='anker-power-bank-20000mah-22-5w'){
    assert.match(safetyResponse.body,/data-apg-official-source="verified-first-party"/,'Recall page must mark the first-party safety source');
    assert.match(safetyResponse.body,/href="https:\/\/www\.anker\.com\/au\/a1647-recall"/,'Recall page must use the verified Anker Australia recall source');
    assert.match(safetyResponse.body,/Anker official safety and recall information/,'Recall page must label the safety source truthfully');
    assert.doesNotMatch(safetyResponse.body,/class="retailer-row apg112-retailer-row official-source" href="https:\/\/www\.amazon\.com\.au\/s\?/,'Amazon search must never be labelled as official Anker information');
  }

  const sony=products.find(p=>p.slug==='sony-wh-1000xm6');assert.ok(sony,'Sony WH-1000XM6 fixture missing');
  const sonyRows=surface.canonicalRetailerRows(sony);
  const jb=sonyRows.find(r=>r.retailer==='JB Hi-Fi'),amazon=sonyRows.find(r=>r.retailer==='Amazon Australia'),ebayRow=sonyRows.find(r=>r.retailer==='eBay Australia');
  assert.ok(jb&&amazon&&ebayRow,'Sony merged retailer benchmark requires JB Hi-Fi, Amazon and eBay');
  const sonyResponse=await render('/products/sony-wh-1000xm6/'),panel=offerPanel(sonyResponse.body);
  assert.ok(panel,'Sony visible retailer panel must render');
  const jbIndex=panel.indexOf(htmlHref(jb.affiliateUrl||jb.url||jb.exactUrl));
  const amazonIndex=panel.indexOf(htmlHref(amazon.affiliateUrl||amazon.url||amazon.exactUrl));
  const ebayIndex=panel.indexOf(htmlHref(ebayRow.affiliateUrl||ebayRow.url||ebayRow.exactUrl));
  assert.ok(jbIndex>=0&&amazonIndex>=0&&ebayIndex>=0,'Sony visible retailer panel must contain JB Hi-Fi, Amazon and eBay destinations');
  assert.ok(jbIndex<amazonIndex&&amazonIndex<ebayIndex,'Sony visible retailer panel order must be exact JB Hi-Fi > verified Amazon variant > eBay product search');

  for(const route of ['/','/deals/']){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-ebay-epn-surface'],'v1.2');
    assert.match(response.body,/data-ebay-epn-discovery="v1\.2"/,`${route} must expose visible eBay discovery`);
    assert.match(response.body,/eBay Australia shopping discovery/i);
    assert.match(response.body,/Refurbished options and current eBay promotions/i);
    assert.match(response.body,/Paid retailer links\.<\/strong> APG may earn a commission from qualifying purchases\./);
    // Count only the six legacy governed collection/promotion cards. Official Creative Gallery
    // category-discovery cards are a distinct v121 surface and deliberately share the retailer
    // identity/disclosure contract without becoming collection records.
    const cards=response.body.match(/data-ebay-epn-collection="[^"]+"/g)||[];
    assert.equal(cards.length,6,`${route} must render all six governed eBay promotion/collection cards`);
    for(const record of ebay.promotionRows()){
      const href=htmlHref(record.url);
      assert.ok(response.body.includes(href),`${route} must include ${record.key}`);
      assert.ok(response.body.includes(`data-ebay-epn-collection="${record.key}"`));
    }
    assert.doesNotMatch(response.body,/data-ebay-exact-model="true"/,`${route} discovery cards must never claim exact-model identity`);
    if(route==='/deals/'){
      assert.doesNotMatch(response.body,/verified Amazon Australia destinations/i,'Deals hero/governance language must not imply Amazon-only retailer verification');
      assert.doesNotMatch(response.body,/Useful Amazon Australia shopping routes/i,'Deals navigation must not frame the whole shopping surface as Amazon-only');
    }
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
  assert.match(source,/base\.install\(target\)/,'Final eBay presentation boundary must retain the governed v1.2 base installer');
  assert.match(source,/officialCreatives\.wrap\(original\(downstream\)\)/,'Official Creative Gallery must remain an additional presentation-only wrapper at the established eBay merchandising boundary');
  assert(!/user-agent|mobile\s*===|desktop\s*===/i.test(source),'eBay retailer truth must not fork by device/user agent');
  assert.doesNotMatch(source,/media-amazon|ebaystatic|i\.ebayimg/i,'eBay discovery must not use scraped or unauthorised retailer imagery');

  console.log(`EBAY_EPN_RENDER_V12_GREEN productRoutes=${fixtures.length} categories=${new Set(fixtures.map(p=>p.category||p.categoryLabel)).size} discoveryRoutes=2 promoCardsPerRoute=6 identitySafetySuppression=PASS mergedRetailerOrder=PASS officialSourceIntegrity=PASS dealsNeutrality=PASS deviceNeutralSSR=true responsiveLayer=v112 disclosure=multi-retailer`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});