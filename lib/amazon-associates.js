const navigationPlatform=require('./navigation-platform');
const {products}=require('../data');
const {images}=require('../data/product-images');
const {imageStatus}=require('../data/image-provenance');

const REQUIRED_STATEMENT='As an Amazon Associate I earn from qualifying purchases.';
const ASSET_PATH='/assets/amazon-associates.js';
const productBySlug=new Map(products.map(product=>[product.slug,product]));

const amazonClientJs=`
;(()=>{
function closestAffiliate(target){
  if(!(target instanceof Element))return null;
  return target.closest('a[data-affiliate-link]');
}
document.addEventListener('click',event=>{
  const link=closestAffiliate(event.target);
  if(!link)return;
  const href=link.getAttribute('href')||'';
  let linkKind=link.dataset.affiliateKind||'unknown';
  if(linkKind==='unknown')linkKind=href.includes('/dp/')?'direct':href.includes('/s?')?'search':'other';
  const payload={
    event_category:'affiliate_commerce',
    retailer:link.dataset.affiliateRetailer||'Amazon Australia',
    link_kind:linkKind,
    product_slug:link.dataset.productSlug||document.body?.dataset?.productSlug||'',
    placement:link.dataset.affiliatePlacement||'retailer_panel',
    page_path:location.pathname
  };
  try{if(typeof window.gtag==='function')window.gtag('event','affiliate_click',payload)}catch{}
},{capture:true});
})();
`;

function escAttr(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function decodeAttr(value){return String(value||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}

function amazonImageLookup(){
  const lookup=new Map();
  for(const slug of Object.keys(images)){
    const product=productBySlug.get(slug);
    if(!product)continue;
    const image=imageStatus(product);
    if(!image.productPhotography||!image.amazonProgramContent||!image.displayUrl||!image.imageLinkUrl)continue;
    lookup.set(image.displayUrl,{href:image.imageLinkUrl,label:`View ${product.brand} ${product.name} at Amazon Australia`,slug:product.slug});
  }
  return lookup;
}

function linkAmazonProgramImages(html){
  const lookup=amazonImageLookup();
  if(!lookup.size)return String(html||'');
  return String(html||'').replace(/<figure class="product-photo([^"]*)">([\s\S]*?)<\/figure>/gi,full=>{
    const match=full.match(/<img\b[^>]*\bsrc="([^"]+)"/i);
    if(!match)return full;
    const image=lookup.get(decodeAttr(match[1]));
    if(!image)return full;
    return `<a class="product-image-link amazon-product-image-link" href="${escAttr(image.href)}" rel="sponsored nofollow noopener" target="_blank" aria-label="${escAttr(image.label)}" data-affiliate-placement="product_image" data-product-slug="${escAttr(image.slug)}">${full}</a>`;
  });
}

function decorateAmazonLinks(html){
  return String(html||'').replace(/<a\b([^>]*?)href="(https:\/\/www\.amazon\.com\.au\/[^\"]+)"([^>]*)>/gi,(full,before,href,after)=>{
    if(!/\brel="[^"]*\bsponsored\b[^"]*"/i.test(full)||/\bdata-affiliate-link\b/i.test(full))return full;
    const kind=href.includes('/dp/')?'direct':href.includes('/s?')?'search':'other';
    const explicitPlacement=/\bdata-affiliate-placement="([^"]+)"/i.exec(full)?.[1]||null;
    const placementAttribute=explicitPlacement?'':` data-affiliate-placement="retailer_panel"`;
    return `<a${before}href="${href}"${after} data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="${kind}"${placementAttribute}>`;
  });
}

function applyAssociatesStandard(html){
  let body=String(html||'');
  body=body.replace(/As an Amazon Associate,\s*Australian Product Guide may earn from qualifying purchases\./g,REQUIRED_STATEMENT);
  body=body.replace(/Affiliate paid link\s*·/g,'Paid link · Amazon Associate ·');
  body=body.replace(/maintained price basis\s*·\s*recheck before purchase/g,'APG-maintained price context · not a live retailer price · recheck before purchase');
  const marker='<span class="independence-badge">Retailer status does not affect ranking</span></div>';
  if(body.includes(marker)&&body.includes('https://www.amazon.com.au/')){
    body=body.replace(marker,marker+`<div class="notice affiliate-disclosure-inline"><strong>Paid Amazon Associate links.</strong> ${REQUIRED_STATEMENT} Retailer commission contributes zero points to Australian Product Guide suitability or ranking.</div>`);
  }
  body=body.replace(/<p class="fine-inline">Paid retailer links are labelled\. Prices, sellers, variants and availability can change after you leave (?:APG|Australian Product Guide)\.<\/p>/g,'<p class="fine-inline">Amazon links are paid links. APG-maintained price context is not a live Amazon price. Amazon sellers, prices, variants and availability can change after you leave Australian Product Guide.</p>');
  body=linkAmazonProgramImages(body);
  return decorateAmazonLinks(body);
}

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':amazonClientJs);
}

function injectClient(body){
  if(body.includes(ASSET_PATH))return body;
  return body.includes('</body>')?body.replace('</body>',`<script src="${ASSET_PATH}" defer></script></body>`):body;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
  if(path===ASSET_PATH)return sendAsset(req,res);

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=injectClient(applyAssociatesStandard(body));
    }
    return originalEnd(body,...args);
  };
  return navigationPlatform(req,res);
};

module.exports.REQUIRED_STATEMENT=REQUIRED_STATEMENT;
module.exports.applyAssociatesStandard=applyAssociatesStandard;
module.exports.amazonClientJs=amazonClientJs;
module.exports.linkAmazonProgramImages=linkAmazonProgramImages;
