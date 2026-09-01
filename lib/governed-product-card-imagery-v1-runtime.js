'use strict';

// APG governed product-card imagery v1.0.
// Extends the existing exact-model, freshness-gated image registry to category and comparison
// surfaces without creating another image source or recommendation signal. The wrapper is invoked
// only for eligible category/compare routes by api/index.js, keeping Home and unrelated responses
// outside asynchronous image presentation logic.
const {products}=require('../data');
const continuity=require('./ebay-product-image-continuity-v3-runtime');

const VERSION='1.0';
const STYLE_HREF='/assets/governed-product-card-imagery-v1.css';
const ORIGIN='https://australianproductguide.au';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));

function clean(value){return String(value==null?'':value).trim();}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function eligiblePath(pathname){
  const path=clean(pathname);
  return /^\/categories\/[a-z0-9][a-z0-9-]{1,160}\/$/.test(path)||
    /^\/compare\/(?:custom\/|[a-z0-9][a-z0-9-]{1,160}\/)(?:.*)?$/.test(path);
}
function productSlugsInHtml(html){
  const found=[];const seen=new Set();const pattern=/href=["']\/products\/([a-z0-9][a-z0-9-]{1,160})\/["']/gi;
  let match;while((match=pattern.exec(String(html||'')))){const slug=match[1];if(PRODUCT_MAP.has(slug)&&!seen.has(slug)){seen.add(slug);found.push(slug);}}
  return found;
}
function ensureStyle(html){
  const out=String(html||'');if(out.includes(STYLE_HREF))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
}
function imageLinkMarkup(slug,row){
  const product=PRODUCT_MAP.get(slug);if(!product)return '';
  const label=product.brand?`${product.brand} ${product.name}`:product.name;
  return `<a class="apg-governed-product-image-v1" data-apg-governed-product-image="v${VERSION}" data-apg-governed-product-slug="${esc(slug)}" href="/products/${esc(slug)}/" aria-label="View ${esc(label)} product profile"><span class="apg-governed-product-image-v1__media"><img class="apg-governed-product-image-v1__img" src="${esc(row.imageUrl)}" alt="${esc(label)}" width="320" height="320" loading="lazy" decoding="async"></span><span class="apg-governed-product-image-v1__source">Verified exact-model retailer image</span></a>`;
}
function injectBeforeFirstProductLink(html,slug,row){
  let out=String(html||'');
  if(out.includes(`data-apg-governed-product-slug="${slug}"`))return out;
  const escapedSlug=slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const anchor=new RegExp(`(<a\\b[^>]*href=["']\\/products\\/${escapedSlug}\\/["'][^>]*>)`,'i');
  if(!anchor.test(out))return out;
  return out.replace(anchor,`${imageLinkMarkup(slug,row)}$1`);
}
async function inject(html,pathname,options={}){
  const original=String(html||'');
  if(!eligiblePath(pathname)||!original||!/<html|<!doctype/i.test(original))return {html:original,usedGovernedImages:false,reason:'inactive-route',slugs:[]};
  const slugs=productSlugsInHtml(original);
  if(!slugs.length)return {html:original,usedGovernedImages:false,reason:'no-product-links',slugs:[]};
  const states=await Promise.all(slugs.map(async slug=>{
    try{return [slug,await continuity.currentMapping(slug,options)];}catch{return [slug,null];}
  }));
  let out=original;const used=[];
  for(const [slug,row] of states){
    if(!row)continue;
    const next=injectBeforeFirstProductLink(out,slug,row);
    if(next!==out){out=next;used.push(slug);}
  }
  if(!used.length)return {html:original,usedGovernedImages:false,reason:'no-current-governed-image-state',slugs:[]};
  return {html:ensureStyle(out),usedGovernedImages:true,reason:'governed-exact-model-product-card-imagery',slugs:used};
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('governed product-card imagery wrapper requires downstream handler');
  function handler(req,res){
    let pathname='/';try{pathname=new URL(req&&req.url||'/',ORIGIN).pathname;}catch{}
    if(!eligiblePath(pathname))return downstream(req,res);
    const originalEnd=res.end.bind(res);
    res.end=function(body,encoding,cb){
      const type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');
      const isHtml=/text\/html/i.test(type)||(typeof body==='string'&&/<html|<!doctype/i.test(body));
      if(req.method==='HEAD'||res.statusCode!==200||!isHtml||!(typeof body==='string'||Buffer.isBuffer(body)))return originalEnd(body,encoding,cb);
      const wasBuffer=Buffer.isBuffer(body);const source=wasBuffer?body.toString('utf8'):body;
      inject(source,pathname).then(result=>{
        let next=result.html;
        if(result.usedGovernedImages){
          continuity.patchResponseCsp(res);
          if(typeof res.setHeader==='function'){
            res.setHeader('X-APG-Governed-Product-Card-Imagery','v'+VERSION);
            res.setHeader('X-APG-Governed-Product-Card-Images',String(result.slugs.length));
          }
          if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');
        }
        if(wasBuffer)next=Buffer.from(next,'utf8');
        return originalEnd(next,encoding,cb);
      }).catch(()=>originalEnd(body,encoding,cb));
      return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    GOVERNED_PRODUCT_CARD_IMAGERY_VERSION:VERSION,
    GOVERNED_PRODUCT_CARD_IMAGERY_STYLE:STYLE_HREF,
    eligibleGovernedProductCardImagePath:eligiblePath,
    transformGovernedProductCardImagery:inject
  });
  return handler;
}

module.exports={VERSION,STYLE_HREF,PRODUCT_MAP,eligiblePath,productSlugsInHtml,ensureStyle,imageLinkMarkup,injectBeforeFirstProductLink,inject,wrap};
