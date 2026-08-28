'use strict';

// APG eBay EPN Surface v1.1
// Presentation augmentation for catalogue-wide model-search EPN pathways plus the six governed
// refurbished collection/promotion destinations. It does not score products, claim exact eBay
// listings, maintain eBay prices/stock, use scraped eBay imagery or alter canonical decision state.
const {products}=require('../data');
const ebay=require('../data/ebay-epn-interim-v1');

const VERSION='1.1';
const DISCLOSURE='<div class="notice affiliate-disclosure-inline" data-apg-multiretailer-disclosure="true"><strong>Paid retailer links.</strong> APG may earn a commission from qualifying purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.</div>';
const DETAIL='<p class="fine-inline" data-apg-multiretailer-detail="true">Paid retailer links are labelled. Product-search and collection pathways do not imply an exact listing, live price, stock, seller, condition grade or warranty. Verify the exact model or variant and current retailer details before purchase.</p>';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));

function escRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function escHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function productFromPath(path){const m=String(path||'').match(/^\/products\/([^/]+)\/$/);return m?PRODUCT_BY_SLUG.get(m[1])||null:null;}
function htmlHref(url){return String(url).replace(/&/g,'&amp;');}

function enhanceEbayAnchor(html,row){
  if(!row||!row.url)return html;
  const href=htmlHref(row.url);
  const pattern=new RegExp(`<a\\b([^>]*href=["']${escRegex(href)}["'][^>]*)>([\\s\\S]*?)<\\/a>`,'i');
  return String(html).replace(pattern,(full,attrs,inner)=>{
    const search=row.pathwayType==='product-search';
    const status=search?'Product search · paid link':'Collection · paid link';
    const sub=search?'Model-specific eBay search · exact listing, price and stock not maintained by APG':'Collection pathway only · exact listing, price and stock not maintained by APG';
    let body=inner;
    // v112 currently renders the retailer status as <small>; accept either element so
    // presentation augmentation remains compatible with earlier and later retailer markup.
    body=body.replace(/<(small|span) class="apg112-retailer-status">[\s\S]*?<\/\1>/i,`<small class="apg112-retailer-status">${status}</small>`);
    body=body.replace(/<small>(?:Current stock not maintained by APG|Listing identity verified · live stock not maintained)<\/small>/i,`<small>${sub}</small>`);
    body=body.replace(/<span class="retailer-action">[\s\S]*?<\/span>/i,`<span class="retailer-action">${escHtml(row.ctaLabel)} ↗</span>`);
    const extra=search
      ?` data-ebay-epn-pathway="product-search" data-ebay-identity-query="${escHtml(row.identityQuery)}" data-ebay-exact-model="false"`
      :` data-ebay-epn-pathway="collection" data-ebay-epn-collection="${escHtml(row.destinationKey)}" data-ebay-exact-model="false"`;
    return `<a${attrs}${attrs.includes('data-ebay-epn-pathway=')?'':extra}>${body}</a>`;
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

function promoIcon(key){
  if(/laptop|hp/i.test(key))return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14h36v27H14V14Zm-5 35h46l-4 5H13l-4-5Z"/></svg>';
  if(/tablet|samsung/i.test(key))return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="18" y="8" width="28" height="48" rx="4"/><path d="M28 14h8M31 49h2"/></svg>';
  if(/dyson/i.test(key))return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M38 9 28 43m3-1 13 4-3 8-17-6 3-7m11-25 8 3"/></svg>';
  return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 36a18 18 0 0 1 36 0v13h-9V35m-18 0v14h-9V36"/><path d="m46 11 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z"/></svg>';
}

function promoCard(record,index){
  const feature=index===0?' is-feature':'';
  const volatile=record.volatile?'Current promotion':'Refurbished discovery';
  return `<a class="apg-amz-v41-card${feature}" href="${htmlHref(record.url)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="${escHtml(record.kind)}" data-affiliate-placement="ebay_discovery_${escHtml(record.key)}" data-affiliate-context="shopping_creative" data-ebay-epn-collection="${escHtml(record.key)}" data-ebay-exact-model="false"><span class="apg-amz-v41-art apg-amz-v41-art-best" aria-hidden="true"><span class="apg-amz-v41-orbit orbit-a"></span><span class="apg-amz-v41-orbit orbit-b"></span>${promoIcon(record.key)}<span class="apg-amz-v41-chip chip-a"></span><span class="apg-amz-v41-chip chip-b"></span></span><span class="apg-amz-v41-copy"><span class="apg-amz-v41-eyebrow">${volatile}</span><strong>${escHtml(record.title)}</strong><span>${escHtml(record.description)}</span><span class="apg-amz-v41-cta">Explore on eBay Australia <span aria-hidden="true">↗</span></span><small>Paid eBay Australia link · APG may earn from qualifying purchases</small></span></a>`;
}

function discoverySection(){
  const rows=ebay.promotionRows();
  const cards=rows.map(promoCard);
  return `<section class="section apg-amz-v41 apg-ebay-v11" data-ebay-epn-discovery="v${VERSION}" aria-labelledby="apgEbayV11Title"><div class="wrap"><div class="apg-amz-v41-head"><div><p class="kicker">eBay Australia shopping discovery</p><h2 id="apgEbayV11Title">Refurbished options and current eBay promotions</h2><p>These retailer pathways are separate from APG recommendations. They can be useful for refurbished or alternative-marketplace shopping, but APG does not treat a collection or promotion as an exact product listing.</p></div><a class="text-link" href="/retailers/">How APG handles retailers →</a></div><div class="apg-amz-v41-home-grid">${cards[0]||''}<div class="apg-amz-v41-stack">${cards.slice(1).join('')}</div></div>${DISCLOSURE}<p class="fine-inline" data-ebay-discovery-detail="true">Collection and promotion destinations can change. Confirm the exact model or variant, seller, condition grade, warranty, delivery, current price and availability on eBay before purchase.</p></div></section>`;
}

function enhanceDiscovery(html,path){
  if(path!=='/'&&path!=='/deals/')return String(html);
  let out=String(html);
  if(out.includes('data-ebay-epn-discovery='))return out;
  const section=discoverySection();
  const amazon=/<section class="section apg-amz-v41[^>]*data-amazon-creative-v41=[\s\S]*?<\/section>/i;
  if(amazon.test(out))out=out.replace(amazon,match=>`${match}${section}`);
  else out=out.replace(/<\/main>/i,`${section}</main>`);
  if(!/name="apg-ebay-discovery"/i.test(out))out=out.replace(/<\/head>/i,`<meta name="apg-ebay-discovery" content="v${VERSION}"></head>`);
  return out;
}

function enhanceTrustDisclosure(html,path){
  let out=String(html);
  if(path==='/affiliate-disclosure/'&&!/eBay Partner Network/i.test(out)){
    const paragraph='<p data-apg-ebay-disclosure="true"><strong>eBay Partner Network.</strong> APG may earn a commission from qualifying purchases made after you follow eligible eBay Australia partner links. Product-search and collection links are retailer pathways, not APG verification of an individual eBay listing. Retailer participation and commission do not influence product suitability, ranking or recommendations.</p>';
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
  if(!out||!/<html|<!doctype/i.test(out))return out;
  const product=productFromPath(path);
  if(product){
    const row=ebay.ebayRetailerFor(product);
    if(row){out=enhanceEbayAnchor(out,row);out=genericiseProductDisclosure(out);}
    return out;
  }
  out=enhanceDiscovery(out,path);
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

module.exports={VERSION,DISCLOSURE,DETAIL,productFromPath,enhanceEbayAnchor,genericiseProductDisclosure,promoCard,discoverySection,enhanceDiscovery,enhanceTrustDisclosure,transform,wrap,install};
