'use strict';

// APG eBay Australia category shopping presentation v133.0.
// Historical filename retained for integration compatibility. The customer-facing v121 official-
// creative gallery is superseded: category destinations remain governed by the existing EPN
// registry, but presentation now uses stable APG-rendered category artwork rather than fragile
// promotional image files. This layer changes presentation and truthful analytics semantics only;
// it does not change recommendation logic, evidence, product identity, retailer ordering,
// commerce eligibility or ranking.
const categoryRegistry=require('../data/ebay-official-creatives-v121');

const VERSION='133.0';
const STYLE_HREF='/assets/ebay-category-shopping-v133.css';

function escHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function htmlHref(value){return String(value||'').replace(/&/g,'&amp;');}

function categoryIcon(key){
  switch(String(key||'')){
    case 'certifiedRefurbished':
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="14" width="36" height="28" rx="3"/><path d="M24 50h16M32 42v8M24 28a10 10 0 0 1 17-7l3 3M44 17v7h-7M40 30a10 10 0 0 1-17 7l-3-3M20 41v-7h7"/></svg>';
    case 'tech':
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="13" width="34" height="26" rx="3"/><path d="M20 47h12M26 39v8"/><rect x="43" y="23" width="12" height="27" rx="3"/><path d="M47 27h4M48 46h2"/></svg>';
    case 'homeGarden':
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 31 32 13l22 18M16 27v25h32V27M25 52V37h14v15"/><path d="M45 18c4-6 9-7 12-6-1 6-4 10-10 11"/></svg>';
    case 'motors':
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 37h36l-4-12a7 7 0 0 0-7-5H25a7 7 0 0 0-7 5l-4 12Z"/><path d="M10 37v10h5m39-10v10h-5M20 47h24M18 34h28"/><circle cx="20" cy="39" r="2"/><circle cx="44" cy="39" r="2"/></svg>';
    case 'sportingGoods':
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 24v16M20 20v24M44 20v24M50 24v16M20 32h24"/><path d="M9 28h5v8H9zM50 28h5v8h-5z"/></svg>';
    default:
      return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 18h36v32H14zM22 26h20M22 34h14M22 42h18"/></svg>';
  }
}

function card(row){
  const key=escHtml(row.key);
  return `<a class="apg-ebay-category-v133-card" href="${htmlHref(row.destination)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="ebay-category" data-affiliate-placement="ebay_category_${key}" data-ebay-category="${key}" data-ebay-exact-model="false"><span class="apg-ebay-category-v133-art is-${key}" aria-hidden="true"><span class="apg-ebay-category-v133-market">eBay Australia</span><span class="apg-ebay-category-v133-icon">${categoryIcon(row.key)}</span></span><span class="apg-ebay-category-v133-copy"><strong>${escHtml(row.title)}</strong><span class="apg-ebay-category-v133-cta">Browse on eBay <b aria-hidden="true">↗</b></span></span></a>`;
}

function section(rows,{compact=false}={}){
  if(!rows.length)return '';
  const cls=compact?' apg-ebay-category-v133-compact':'';
  return `<section class="apg-ebay-category-v133${cls}" data-ebay-category-shopping-v133="true" data-ebay-official-creatives-v121="true" aria-labelledby="apgEbayCategoryV133Title"><div class="apg-ebay-category-v133-head"><div><h3 id="apgEbayCategoryV133Title">Shop eBay Australia by category</h3><p>Browse current eBay Australia category results as a retailer discovery path. These retailer links are separate from APG recommendations and do not influence product rankings.</p></div><a class="apg-ebay-category-v133-link" href="/retailers/">How APG handles retailers →</a></div><div class="apg-ebay-category-v133-grid">${rows.map(card).join('')}</div><p class="apg-ebay-category-v133-fine"><strong>Paid retailer links.</strong><span>APG may earn a commission from qualifying purchases.</span><span>Category links open live eBay Australia results. Confirm seller, condition, warranty, price and availability on eBay before purchase.</span></p></section>`;
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
        res.setHeader('X-APG-eBay-Official-Creatives','superseded-by-v'+VERSION);
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

module.exports={VERSION,STYLE_HREF,categoryIcon,card,section,ensureStyle,inject,wrap};
