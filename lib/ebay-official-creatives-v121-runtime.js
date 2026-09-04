'use strict';

// APG eBay Australia category shopping presentation v133.1.
// Historical filename retained for integration compatibility. The shopper-facing category tiles
// use owner-supplied official eBay Creative Gallery images from governed local APG asset paths,
// while retaining the cleaner v133 card/carousel structure and disclosure treatment. These
// retailer promotional assets are not APG product evidence or recommendation inputs.
const categoryRegistry=require('../data/ebay-official-creatives-v121');

const VERSION='133.1';
const STYLE_HREF='/assets/ebay-category-shopping-v133.css';

function escHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function htmlHref(value){return String(value||'').replace(/&/g,'&amp;');}

function card(row){
  const key=escHtml(row.key);
  const image=htmlHref(row.image);
  return `<a class="apg-ebay-category-v133-card" href="${htmlHref(row.destination)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="ebay-category" data-affiliate-placement="ebay_category_${key}" data-ebay-category="${key}" data-ebay-exact-model="false"><span class="apg-ebay-category-v133-art is-${key}"><img class="apg-ebay-category-v133-creative" src="${image}" alt="" loading="lazy" decoding="async"></span><span class="apg-ebay-category-v133-copy"><strong>${escHtml(row.title)}</strong><span class="apg-ebay-category-v133-cta">Browse on eBay <b aria-hidden="true">↗</b></span></span></a>`;
}

function section(rows,{compact=false}={}){
  if(!rows.length)return '';
  const cls=compact?' apg-ebay-category-v133-compact':'';
  return `<section class="apg-ebay-category-v133${cls}" data-ebay-category-shopping-v133="true" data-ebay-official-creatives-v121="true" data-ebay-category-creative-mode="official-local" aria-labelledby="apgEbayCategoryV133Title"><div class="apg-ebay-category-v133-head"><div><h3 id="apgEbayCategoryV133Title">Shop eBay Australia by category</h3><p>Browse current eBay Australia category results as a retailer discovery path. These retailer links are separate from APG recommendations and do not influence product rankings.</p></div><a class="apg-ebay-category-v133-link" href="/retailers/">How APG handles retailers →</a></div><div class="apg-ebay-category-v133-grid">${rows.map(card).join('')}</div><p class="apg-ebay-category-v133-fine"><strong>Paid retailer links.</strong><span>APG may earn a commission from qualifying purchases.</span><span>Category links open live eBay Australia results. Confirm seller, condition, warranty, price and availability on eBay before purchase.</span></p></section>`;
}

function ensureStyle(html){
  const out=String(html||'');
  if(out.includes(STYLE_HREF))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}?v=${VERSION}"></head>`);
}

function inject(html,path){
  let out=String(html||'');
  if(!out||!/<html|<!doctype/i.test(out))return out;
  if(out.includes('data-ebay-category-shopping-v133="true"'))return out;

  // eBay Smart Placement owns /deals/. Keep this replacement scoped to Home and the matched
  // category/guide discovery routes historically owned by the gallery wrapper.
  if(path==='/deals/')return out;

  const rows=categoryRegistry.forPath(path);
  if(!rows.length)return out;

  out=ensureStyle(out);
  const block=section(rows,{compact:path!=='/'&&path!=='/deals/'});

  // Home: keep retailer category discovery inside the existing governed eBay area, distinct from
  // APG editorial recommendations and the separate refurbished/promotion discovery block.
  if(path==='/'){
    const ebaySection=/<section class="section apg-amz-v41 apg-ebay-v11"[^>]*data-ebay-epn-discovery=[^>]*>/i;
    if(ebaySection.test(out))return out.replace(ebaySection,match=>`${match}<div class="wrap">${block}</div>`);
    return out.replace(/<\/main>/i,`${block}</main>`);
  }

  // Product pages remain excluded by the registry: category shopping is never product evidence.
  return out.replace(/<\/main>/i,`${block}</main>`);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay category shopping wrapper requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    const contentType=()=>String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');
    const originalEnd=res.end.bind(res);
    const originalWrite=typeof res.write==='function'?res.write.bind(res):null;
    const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8');
      const isHtml=/text\/html/i.test(contentType())||/<html|<!doctype/i.test(body);
      const next=isHtml?inject(body,path):body;
      if(typeof res.setHeader==='function'){
        res.setHeader('X-APG-eBay-Category-Shopping','v'+VERSION);
        res.setHeader('X-APG-eBay-Official-Creatives','v121-local-assets-in-v'+VERSION);
      }
      return originalEnd(next,'utf8',cb);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    EBAY_CATEGORY_SHOPPING_VERSION:VERSION,
    EBAY_OFFICIAL_CREATIVES_VERSION:VERSION,
    transformEbayOfficialCreatives:inject,
    transformEbayCategoryShopping:inject
  });
  return handler;
}

module.exports={VERSION,STYLE_HREF,card,section,ensureStyle,inject,wrap};
