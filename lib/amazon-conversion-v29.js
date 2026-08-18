// APG Amazon Affiliate Conversion v29.
// Adds a prominent, affiliate-neutral purchase layer on top of the verified v28 stack.
// Retailer availability and affiliate economics remain downstream of recommendation logic.
const app=require('./trust-infrastructure-v28');
const {products}=require('../data');
const {TAG}=require('../data/retailers-v6');

const VERSION='amazon-conversion-v29';
const CHECKED='2026-08-18';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const JS_PATH='/assets/amazon-conversion-v29.js';
const CSS_PATH='/assets/amazon-conversion-v29.css';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function urlOf(raw){try{return new URL(raw||'/',PRIMARY_ORIGIN)}catch{return new URL('/',PRIMARY_ORIGIN)}}

function amazonRetailer(product){
  return (product?.retailers||[]).find(row=>row?.retailer==='Amazon Australia')||null;
}
function amazonRecord(product){
  const retailer=amazonRetailer(product);
  if(!retailer)return null;
  const url=retailer.affiliateUrl||retailer.url||'';
  const exact=retailer.kind==='affiliate-direct';
  return {
    product_slug:product.slug,
    category:product.category||'',
    amazon_link_type:exact?'EXACT VERIFIED':'SEARCH FALLBACK',
    amazon_url:url,
    amazon_verified:exact&&Boolean(retailer.asin)&&Boolean(retailer.verified),
    amazon_verified_date:retailer.verified||null,
    amazon_model_match:exact?'exact':'model-specific-search',
    amazon_variant_match:exact?(retailer.variant||'exact product family; verify selected variant'):'not-asserted',
    amazon_asin:exact?(retailer.asin||null):null,
    recommendation_weight:0
  };
}
const recordBySlug=new Map(products.map(p=>[p.slug,amazonRecord(p)]).filter(([,r])=>r));

function commerceSnapshot(){
  const records=[...recordBySlug.values()];
  const exact=records.filter(r=>r.amazon_link_type==='EXACT VERIFIED');
  const fallbacks=records.filter(r=>r.amazon_link_type==='SEARCH FALLBACK');
  return {
    version:VERSION,
    checkedAt:CHECKED,
    amazonAssociatesTag:TAG,
    maintainedProducts:products.length,
    productsWithAmazonPath:records.length,
    exactVerified:exact.length,
    searchFallbacks:fallbacks.length,
    missingAmazonPath:products.length-records.length,
    recommendationWeight:0,
    policy:'Determine the product fit first; attach verified retailer destinations afterwards. Exact Amazon ASINs are never guessed.'
  };
}

function ctaLabel(record,compact=false){
  if(record.amazon_link_type==='EXACT VERIFIED')return compact?'View on Amazon AU':'View on Amazon Australia';
  return compact?'Search this model on Amazon AU':'Search this model on Amazon Australia';
}
function affiliateAttrs(record,placement,context=''){
  const kind=record.amazon_link_type==='EXACT VERIFIED'?'direct':'search';
  return `data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="${kind}" data-affiliate-placement="${esc(placement)}" data-affiliate-context="${esc(context||placement)}" data-affiliate-category="${esc(record.category)}" data-product-slug="${esc(record.product_slug)}"`;
}
function purchaseLink(record,{placement='commerce_cta',context='',className='button apg-amazon-cta',compact=false}={}){
  if(!record?.amazon_url)return '';
  return `<a class="${esc(className)}" href="${esc(record.amazon_url)}" rel="sponsored nofollow noopener" target="_blank" ${affiliateAttrs(record,placement,context)}>${esc(ctaLabel(record,compact))}<span aria-hidden="true"> ↗</span></a>`;
}
function paidNote(record){
  const identity=record.amazon_link_type==='EXACT VERIFIED'?'Exact Amazon product destination verified.':'Transparent model-specific search fallback; no ASIN guessed.';
  return `<small class="apg-commerce-disclosure"><strong>Paid Amazon Associate link.</strong> ${identity} Retailer status contributes zero points to APG recommendations.</small>`;
}
function productSlugFromPath(path){return /^\/products\/([^/]+)\/$/.exec(path)?.[1]||null;}

function decorateProductHero(html,path){
  const slug=productSlugFromPath(path),record=slug&&recordBySlug.get(slug);
  if(!record||html.includes('data-apg-primary-amazon'))return html;
  const old='<a class="button" href="#where-to-buy">Where to buy</a>';
  if(!html.includes(old))return html;
  const replacement=`<span class="apg-primary-purchase" data-apg-primary-amazon>${purchaseLink(record,{placement:'product_hero',context:'product_page_primary'})}${paidNote(record)}</span><a class="button secondary apg-retailer-jump" href="#where-to-buy">Compare retailer options</a>`;
  return html.replace(old,replacement).replace(/<body([^>]*)>/i,(m,a)=>{
    if(/data-product-category=/.test(m))return m;
    return `<body${a} data-product-category="${esc(record.category)}" data-amazon-link-type="${record.amazon_link_type==='EXACT VERIFIED'?'exact':'search'}">`;
  });
}
function decorateProductCards(html){
  return html.replace(/(<div class="card-actions"><a class="button secondary" href="\/products\/([^/]+)\/">View product<\/a>)/g,(full,lead,slug)=>{
    const record=recordBySlug.get(slug);
    if(!record)return full;
    return `${lead}${purchaseLink(record,{placement:'product_card',context:'catalogue_card',className:'apg-card-purchase',compact:true})}`;
  });
}
function decorateIntentSurfaces(html,path){
  let out=html;
  if(path==='/search/'){
    out=out.replace(/(<a class="apg-rv-open-v43" href="\/products\/([^/]+)\/">Inspect product evidence →<\/a>)/g,(full,lead,slug)=>{
      const record=recordBySlug.get(slug);
      if(!record)return full;
      return `${lead}${purchaseLink(record,{placement:'search_research_view',context:'research_view_recommendation',className:'apg-context-purchase apg-intent-purchase',compact:true})}`;
    });
  }
  if(path.startsWith('/categories/')){
    out=out.replace(/(<a class="text-link" href="\/products\/([^/]+)\/">See why it fits →<\/a>)/g,(full,lead,slug)=>{
      const record=recordBySlug.get(slug);
      if(!record)return full;
      return `${lead}${purchaseLink(record,{placement:'category_decision_shortcut',context:'category_decision_shortcut',className:'apg-context-purchase apg-intent-purchase',compact:true})}`;
    });
  }
  return out;
}
function decorateDecisionResults(html,path){
  if(path!=='/decision-lab/')return html;
  return html.replace(/(<div class="actions"><a class="button" href="\/products\/([^/]+)\/">Inspect decision guide<\/a>)/g,(full,lead,slug)=>{
    const record=recordBySlug.get(slug);
    if(!record)return full;
    return `${lead}${purchaseLink(record,{placement:'decision_lab_result',context:'decision_lab_shortlist',className:'button apg-amazon-cta'})}`;
  });
}
function decoratePairComparisons(html,path){
  if(!path.startsWith('/compare/'))return html;
  return html.replace(/(<a href="\/products\/([^/]+)\/" class="button secondary">Open product guide<\/a>)/g,(full,lead,slug)=>{
    const record=recordBySlug.get(slug);
    if(!record)return full;
    return `${lead}${purchaseLink(record,{placement:'comparison_result',context:'head_to_head',className:'button apg-amazon-cta'})}`;
  });
}
function decorateRetailerCopy(html){
  return html.replace(/(<strong>Amazon Australia<\/strong>[\s\S]{0,900}?<span class="retailer-action">)View exact product( ↗<\/span>)/g,'$1View on Amazon Australia$2')
    .replace(/(<strong>Amazon Australia<\/strong>[\s\S]{0,900}?<span class="retailer-action">)Search retailer( ↗<\/span>)/g,'$1Search this model on Amazon Australia$2');
}
function mobilePurchase(record){
  return `<aside class="apg-mobile-purchase" data-mobile-amazon-cta aria-label="Amazon Australia purchase option"><div><strong>${record.amazon_link_type==='EXACT VERIFIED'?'Ready to check the exact product?':'Ready to look for this model?'}</strong><small>${record.amazon_link_type==='EXACT VERIFIED'?'Verified destination · paid Amazon Associate link':'Model-specific search · paid Amazon Associate link'}</small></div>${purchaseLink(record,{placement:'product_mobile_sticky',context:'product_page_mobile_sticky',className:'button apg-amazon-cta',compact:true})}</aside>`;
}
function injectMobilePurchase(html,path){
  const slug=productSlugFromPath(path),record=slug&&recordBySlug.get(slug);
  if(!record||html.includes('data-mobile-amazon-cta'))return html;
  return html.includes('</main>')?html.replace('</main>',`${mobilePurchase(record)}</main>`):html;
}

const clientJs=`
;(()=>{
const commercePath='/api/intelligence/affiliate-commerce';
const cache=new Map();
function slugFromLink(a){const m=(a?.getAttribute('href')||'').match(/^\\/products\\/([^/]+)\\//);return m&&m[1]||'';}
function requestRecord(slug){
  if(!slug)return Promise.resolve(null);
  if(cache.has(slug))return Promise.resolve(cache.get(slug));
  return fetch(commercePath+'?slug='+encodeURIComponent(slug),{credentials:'same-origin',cache:'force-cache'}).then(r=>r.ok?r.json():null).then(x=>{const record=x&&x.record||null;if(record)cache.set(slug,record);return record}).catch(()=>null);
}
function linkFor(record,placement,context,compact){
  if(!record?.amazon_url)return null;
  const a=document.createElement('a');
  a.className='apg-context-purchase';a.href=record.amazon_url;a.target='_blank';a.rel='sponsored nofollow noopener';
  a.dataset.affiliateLink='';a.dataset.affiliateRetailer='Amazon Australia';a.dataset.affiliateKind=record.amazon_link_type==='EXACT VERIFIED'?'direct':'search';
  a.dataset.affiliatePlacement=placement;a.dataset.affiliateContext=context;a.dataset.affiliateCategory=record.category||'';a.dataset.productSlug=record.product_slug;
  a.textContent=record.amazon_link_type==='EXACT VERIFIED'?(compact?'View on Amazon AU ↗':'View on Amazon Australia ↗'):(compact?'Search model on Amazon AU ↗':'Search this model on Amazon Australia ↗');
  return a;
}
async function decorateScout(){
  for(const card of document.querySelectorAll('.scout-card:not([data-apg-commerce-ready])')){
    const productLink=card.querySelector('a.scout-card-link[href^="/products/"]');const slug=slugFromLink(productLink);if(!slug)continue;
    card.dataset.apgCommerceReady='pending';const record=await requestRecord(slug);if(!record){card.dataset.apgCommerceReady='none';continue;}
    const target=productLink?.parentElement||card.querySelector('.scout-card-main')||card;const a=linkFor(record,'scout_recommendation','scout_result',true);if(a){a.classList.add('scout-purchase-link');target.appendChild(a);}
    card.dataset.apgCommerceReady='true';
  }
}
async function decorateWorkspace(){
  if(location.pathname!='/my-apg/')return;
  for(const item of document.querySelectorAll('.workspace-item[href^="/products/"]:not([data-apg-commerce-ready])')){
    const slug=slugFromLink(item);if(!slug)continue;item.dataset.apgCommerceReady='pending';const record=await requestRecord(slug);if(!record){item.dataset.apgCommerceReady='none';continue;}
    const host=item.parentElement;if(host&&!host.querySelector('[data-apg-workspace-buy="'+slug+'"]')){const a=linkFor(record,'my_apg_saved','my_apg_workspace',true);if(a){a.dataset.apgWorkspaceBuy=slug;host.insertBefore(a,item.nextSibling);}}
    item.dataset.apgCommerceReady='true';
  }
}
async function decorateCompare(){
  if(!location.pathname.startsWith('/compare/'))return;
  for(const button of document.querySelectorAll('[data-compare-product]:not([data-apg-commerce-ready])')){
    const slug=button.dataset.compareProduct;if(!slug)continue;button.dataset.apgCommerceReady='pending';const record=await requestRecord(slug);if(!record){button.dataset.apgCommerceReady='none';continue;}
    const host=button.closest('article')||button.closest('td');if(host&&!host.querySelector('[data-apg-compare-buy="'+slug+'"]')){const a=linkFor(record,'comparison_result','comparison_table_or_shortlist',true);if(a){a.dataset.apgCompareBuy=slug;host.appendChild(a);}}
    button.dataset.apgCommerceReady='true';
  }
}
function decorate(){decorateScout();decorateWorkspace();decorateCompare();}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
})();
`;

const css=`
.apg-primary-purchase{display:flex;flex-direction:column;gap:6px;min-width:min(100%,300px)}
.apg-amazon-cta{background:#0b5f68!important;border-color:#0b5f68!important;color:#fff!important;box-shadow:0 8px 24px rgba(7,71,78,.15)}
.apg-amazon-cta:hover{background:#084f57!important;border-color:#084f57!important;transform:translateY(-1px)}
.apg-commerce-disclosure{display:block;max-width:410px;color:#60757b;font-size:10px;line-height:1.35}.apg-commerce-disclosure strong{color:#344f57}
.apg-retailer-jump{align-self:flex-start}
.apg-card-purchase,.apg-context-purchase{display:inline-flex;align-items:center;justify-content:center;gap:4px;border:1px solid #9dbfba;border-radius:10px;padding:8px 10px;color:#0b655f;background:#f5fbf9;font-size:11px;font-weight:850;text-decoration:none;line-height:1.25}
.apg-card-purchase:hover,.apg-context-purchase:hover{border-color:#087c76;background:#eaf6f2;color:#075c57}
.card-actions .apg-card-purchase{flex:1 1 100%}
.apg-rv-card-v43 .apg-intent-purchase,.pick-card .apg-intent-purchase{display:flex;width:100%;box-sizing:border-box;margin-top:8px;text-align:center}
.winner-card .apg-amazon-cta,.decision-result .apg-amazon-cta{margin-left:6px}
.scout-purchase-link{margin:8px 0 0 8px;font-size:10px;padding:7px 9px}.workspace-list+.apg-context-purchase{margin-top:8px}
.apg-mobile-purchase{display:none}
@media(max-width:700px){
  .product-hero .actions{align-items:stretch}.apg-primary-purchase{width:100%}.apg-primary-purchase .apg-amazon-cta,.apg-retailer-jump{width:100%;box-sizing:border-box;text-align:center;justify-content:center}
  .decision-result .actions .apg-amazon-cta,.winner-card .apg-amazon-cta{margin-left:0}
  .apg-mobile-purchase{position:fixed;left:10px;right:82px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:83;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 8px 8px 11px;border:1px solid #b9d3cf;border-radius:16px;background:rgba(255,255,255,.97);box-shadow:0 12px 34px rgba(5,35,48,.18);backdrop-filter:blur(9px)}
  .apg-mobile-purchase>div{min-width:0}.apg-mobile-purchase strong,.apg-mobile-purchase small{display:block}.apg-mobile-purchase strong{font-size:10.5px;color:#153740;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.apg-mobile-purchase small{font-size:8.5px;color:#60757b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.apg-mobile-purchase .button{font-size:10px;min-height:38px;padding:8px 10px;white-space:nowrap}
  body.scout-open .apg-mobile-purchase,body:has(#compareTray:not([hidden])) .apg-mobile-purchase{display:none}
}
@media(max-width:420px){.apg-mobile-purchase{right:76px}.apg-mobile-purchase>div{display:none}.apg-mobile-purchase .button{width:100%}}
@media(min-width:701px){.winner-card .apg-amazon-cta,.decision-result .apg-amazon-cta{display:inline-flex}}
`;

function injectAssets(html){
  let out=html;
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=29"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=29" defer></script></body>`);
  return out;
}
function enhance(html,pathOrUrl){
  const url=urlOf(pathOrUrl),path=url.pathname;
  let out=String(html||'');
  if(!/^<!doctype html>/i.test(out)&&!/<html[\s>]/i.test(out))return out;
  if(!out.includes('data-amazon-conversion-v29="true"'))out=out.replace(/<body([^>]*)>/i,(m,a)=>`<body${a} data-amazon-conversion-v29="true">`);
  out=decorateProductHero(out,path);
  out=decorateProductCards(out);
  out=decorateIntentSurfaces(out,path);
  out=decorateDecisionResults(out,path);
  out=decoratePairComparisons(out,path);
  out=decorateRetailerCopy(out);
  out=injectMobilePurchase(out,path);
  return injectAssets(out);
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return enhance(base,pathOrUrl);
}
function sendAsset(req,res,type,body){
  res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Commerce',VERSION);return res.end(req.method==='HEAD'?'':body);
}
function sendJson(req,res,payload){
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=300');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Commerce',VERSION);return res.end(req.method==='HEAD'?'':JSON.stringify(payload));
}

module.exports=(req,res)=>{
  const url=urlOf(req.url),path=url.pathname;
  if(path===JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
  if(path===CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',css);
  if(['/api/intelligence/affiliate-commerce','/api/intelligence/affiliate-commerce/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    const slug=url.searchParams.get('slug');
    if(slug){const record=recordBySlug.get(slug)||null;return sendJson(req,res,{version:VERSION,checkedAt:CHECKED,record});}
    return sendJson(req,res,commerceSnapshot());
  }
  res.setHeader('X-APG-Commerce',VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=enhance(body,url.href);
    res.setHeader('X-APG-Commerce',VERSION);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.VERSION=VERSION;
module.exports.CHECKED=CHECKED;
module.exports.amazonRecord=amazonRecord;
module.exports.commerceSnapshot=commerceSnapshot;
module.exports.purchaseLink=purchaseLink;
module.exports.enhance=enhance;
module.exports.transform=transform;
module.exports.recordBySlug=recordBySlug;
module.exports.clientJs=clientJs;
module.exports.css=css;