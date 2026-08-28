'use strict';

// APG eBay EPN Surface v1.0
// Narrow presentation-only augmentation for the approved collection-level EPN interim model.
// It does not score or rank products, claim exact eBay listings, maintain eBay prices/stock,
// or alter canonical decision state. Whole-Site v109 remains the final outer HTML layer.
const {products}=require('../data');
const ebay=require('../data/ebay-epn-interim-v1');

const VERSION='1.0';
const DISCLOSURE='<div class="notice affiliate-disclosure-inline" data-apg-multiretailer-disclosure="true"><strong>Paid retailer links.</strong> APG may earn a commission from qualifying purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.</div>';
const DETAIL='<p class="fine-inline" data-apg-multiretailer-detail="true">Paid retailer links are labelled. Collection links do not imply an exact listing, live price, stock, seller, condition grade or warranty. Verify the exact model or variant and current retailer details before purchase.</p>';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));

function escRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function productFromPath(path){const m=String(path||'').match(/^\/products\/([^/]+)\/$/);return m?PRODUCT_BY_SLUG.get(m[1])||null:null;}
function htmlHref(url){return String(url).replace(/&/g,'&amp;');}

function enhanceEbayAnchor(html,row){
  if(!row||!row.url)return html;
  const href=htmlHref(row.url);
  const pattern=new RegExp(`<a\\b([^>]*href=["']${escRegex(href)}["'][^>]*)>([\\s\\S]*?)<\\/a>`,'i');
  return String(html).replace(pattern,(full,attrs,inner)=>{
    let body=inner;
    body=body.replace(/<span class="apg112-retailer-status">[\s\S]*?<\/span>/i,'<span class="apg112-retailer-status">Refurbished collection · paid link</span>');
    body=body.replace(/<small>Current stock not maintained by APG<\/small>/i,'<small>Collection pathway only · exact listing, price and stock not maintained by APG</small>');
    body=body.replace(/<span class="retailer-action">[\s\S]*?<\/span>/i,`<span class="retailer-action">${row.ctaLabel} ↗</span>`);
    const extra=` data-ebay-epn-collection="${row.destinationKey}" data-ebay-exact-model="false"`;
    return `<a${attrs}${attrs.includes('data-ebay-epn-collection=')?'':extra}>${body}</a>`;
  });
}

function genericiseProductDisclosure(html){
  let out=String(html);
  out=out.replace(/<div class="notice affiliate-disclosure-inline">[\s\S]*?<\/div>/i,DISCLOSURE);
  if(!out.includes('data-apg-multiretailer-disclosure="true"')){
    const marker=/<section class="retailer-panel\b[^>]*>/i;
    out=out.replace(marker,match=>`${match}${DISCLOSURE}`);
  }
  out=out.replace(/<p class="fine-inline">Amazon links are paid links\.[\s\S]*?<\/p>/i,DETAIL);
  return out;
}

function enhanceTrustDisclosure(html,path){
  let out=String(html);
  if(path==='/affiliate-disclosure/'&&!/eBay Partner Network/i.test(out)){
    const paragraph='<p data-apg-ebay-disclosure="true"><strong>eBay Partner Network.</strong> APG may earn a commission from qualifying purchases made after you follow eligible eBay Australia partner links. Retailer participation and commission do not influence product suitability, ranking or recommendations.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  if(path==='/privacy/'&&!/eBay Partner Network/i.test(out)){
    const paragraph='<p data-apg-ebay-privacy="true"><strong>Retailer attribution.</strong> Eligible outbound retailer links, including eBay Partner Network links, may contain affiliate attribution parameters so a retailer can attribute a qualifying referral or purchase. APG does not place personal information in eBay custom tracking IDs.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  return out;
}

function transform(html,path){
  let out=String(html||'');
  if(!out||!/text\/html|<html|<!doctype/i.test(out))return out;
  const product=productFromPath(path);
  if(product){
    const row=ebay.ebayRetailerFor(product);
    if(row){out=enhanceEbayAnchor(out,row);out=genericiseProductDisclosure(out);}
    return out;
  }
  return enhanceTrustDisclosure(out,path);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay EPN surface requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    const contentType=()=>String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');
    const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null;
    const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8');
      const html=/text\/html/i.test(contentType())||/<html|<!doctype/i.test(body);
      const next=html?transform(body,path):body;
      if(typeof res.setHeader==='function')res.setHeader('X-APG-eBay-EPN-Surface','v'+VERSION);
      return originalEnd(next,'utf8',cb);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{EBAY_EPN_SURFACE_VERSION:VERSION,transformEbayEpnSurface:transform});
  return handler;
}

function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('eBay EPN surface install requires the v112 wrapper module');
  if(target.__APG_EBAY_EPN_V1_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return wrap(original(downstream));};
  target.__APG_EBAY_EPN_V1_INSTALLED=true;
  return target;
}

module.exports={VERSION,DISCLOSURE,DETAIL,productFromPath,enhanceEbayAnchor,genericiseProductDisclosure,enhanceTrustDisclosure,transform,wrap,install};
