'use strict';

// APG Premium Mobile Decision-Commerce v112.1
// Narrow compatibility layer over v112.0. It closes server-rendered product-card parity
// for legacy multi-class catalogue cards and Search product result cards, and preserves
// the established exact-retailer visual certification marker. It does not score, rank,
// select retailers, persist shopper state, or alter canonical decision data.
const v112=require('./premium-mobile-decision-commerce-v112-runtime');

const VERSION='112.1';
const HEADER='X-APG-Premium-Mobile-Card-Parity';
const STRICT_NO_MATCH='No maintained product can currently be verified against every hard constraint';
const attr=value=>String(value||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const nameKey=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

function articleClasses(article){const m=String(article||'').match(/<article\b[^>]*\bclass="([^"]*)"[^>]*>/i);return m?m[1].split(/\s+/).filter(Boolean):[];}
function productSlug(article){const m=String(article||'').match(/href="\/products\/([^/?#"]+)\/?(?:[?#][^"]*)?"/i);return m?m[1]:null;}
function isMaintainedProductArticle(article){const slug=productSlug(article);return Boolean(slug&&v112.PRODUCT_BY_SLUG.has(slug));}
function isStrictNoMatch(html,path){return path==='/search/'&&String(html||'').includes(STRICT_NO_MATCH);}
function shouldUpgradeArticle(article,path){
  if(String(article||'').includes('data-apg112-product-card='))return false;
  const classes=articleClasses(article),slug=productSlug(article);
  if(!slug||!v112.PRODUCT_BY_SLUG.has(slug))return false;
  if(classes.includes('product-card'))return true;
  return path==='/search/'&&classes.includes('feature-card');
}
function consumerProductName(product){
  const name=String(product?.name||'').trim(),brand=String(product?.brand||'').trim();
  if(!brand)return name;
  if(!name)return brand;
  const nk=nameKey(name),bk=nameKey(brand);
  return nk===bk||nk.startsWith(`${bk} `)?name:`${brand} ${name}`;
}
function productCardV1121(product,{query=''}={}){
  const card=v112.productCardV2(product,{query});
  const anchor=`<h3><a href="/products/${product.slug}/">`;
  const labelled=`<h3><a href="/products/${product.slug}/" aria-label="${attr(`Open product guide: ${consumerProductName(product)}`)}">`;
  return card.replace(anchor,labelled);
}
function removeConflictingProductArticles(html){
  return String(html||'').replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,article=>isMaintainedProductArticle(article)?'':article);
}
function upgradeProductArticles(html,path,u){
  const query=path==='/search/'?u.searchParams.get('q')||'':'';
  return String(html||'').replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi,article=>{
    if(!shouldUpgradeArticle(article,path))return article;
    const product=v112.PRODUCT_BY_SLUG.get(productSlug(article));
    return product?productCardV1121(product,{query}):article;
  });
}
function preserveExactRetailerVisualContract(html){
  const source=String(html||'');
  if(!source.includes('data-apg112-offer-layer="true"')||!source.includes('data-apg112-retailer-state="exact"'))return source;
  if(source.includes('apg-exact-offers-v42'))return source;
  return source.replace(/<section class="retailer-panel apg112-offer-panel" data-apg112-offer-layer="true">/, '<section class="retailer-panel apg112-offer-panel apg-exact-offers-v42" data-apg112-offer-layer="true">');
}
function markBody(html){
  const source=String(html||'');
  if(source.includes(`data-apg-premium-card-parity="v${VERSION}"`))return source;
  return source.replace(/<body\b([^>]*)>/i,`<body data-apg-premium-card-parity="v${VERSION}"$1>`);
}
function transform(html,path,u){
  let out=String(html||'');if(!out)return out;
  // Hard-constraint Search is fail-closed. v112/v112.1 must never re-merchandise
  // maintained products once the governed Search layer has declared that none can be
  // verified against every hard constraint. Remove any legacy or already-upgraded product
  // articles, while retaining the no-match explanation and non-product recovery guidance.
  if(isStrictNoMatch(out,path))out=removeConflictingProductArticles(out);
  else out=upgradeProductArticles(out,path,u);
  out=preserveExactRetailerVisualContract(out);
  out=markBody(out);
  return out;
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('v112.1 card parity requires downstream handler');
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader('Content-Type')||'').toLowerCase();
      if(req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')&&(typeof body==='string'||Buffer.isBuffer(body))){
        const original=Buffer.isBuffer(body)?body.toString('utf8'):body;let u;
        try{u=new URL(req.url,'https://australianproductguide.au');}catch{u=new URL('https://australianproductguide.au/');}
        const next=transform(original,u.pathname,u);if(next!==original){body=next;res.removeHeader('Content-Length');}
        res.setHeader(HEADER,`v${VERSION}`);
      }
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    PREMIUM_MOBILE_CARD_PARITY_VERSION:VERSION,
    transformPremiumMobileCardParity:transform
  });
  return handler;
}

module.exports={VERSION,HEADER,STRICT_NO_MATCH,articleClasses,productSlug,isMaintainedProductArticle,isStrictNoMatch,shouldUpgradeArticle,consumerProductName,productCardV1121,removeConflictingProductArticles,upgradeProductArticles,preserveExactRetailerVisualContract,transform,wrap};
