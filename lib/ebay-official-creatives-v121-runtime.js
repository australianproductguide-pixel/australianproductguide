'use strict';

// APG official eBay Creative Gallery presentation v121.0.
// This is a visual retail-discovery layer only. It does not change recommendation logic,
// evidence, product identity, retailer ordering, commerce eligibility or ranking.
const creativeRegistry=require('../data/ebay-official-creatives-v121');

const VERSION='121.0';
const STYLE_HREF='/assets/ebay-official-creatives-v121.css';

function escHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function htmlHref(value){return String(value||'').replace(/&/g,'&amp;');}

function card(row){
  return `<a class="apg-ebay-official-v121-card" href="${htmlHref(row.destination)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="official-creative-gallery" data-affiliate-placement="ebay_official_creative_${escHtml(row.key)}" data-ebay-official-creative="${escHtml(row.key)}" data-ebay-exact-model="false"><img class="apg-ebay-official-v121-image" src="${escHtml(row.image)}" width="125" height="125" loading="lazy" decoding="async" alt="${escHtml(row.alt)}"><span class="apg-ebay-official-v121-copy"><strong>${escHtml(row.title)}</strong><span>Browse current eBay Australia results ↗</span></span></a>`;
}

function section(rows,{compact=false}={}){
  if(!rows.length)return '';
  const cls=compact?' apg-ebay-official-v121-compact':'';
  return `<section class="apg-ebay-official-v121${cls}" data-ebay-official-creatives-v121="true" aria-labelledby="apgEbayOfficialV121Title"><div class="apg-ebay-official-v121-head"><div><h3 id="apgEbayOfficialV121Title">Shop eBay Australia by category</h3><p>Official eBay creative, used as a retailer discovery aid. These paid retailer pathways are separate from APG recommendations and do not affect product rankings.</p></div><span class="apg-ebay-official-v121-badge">Official eBay creative</span></div><div class="apg-ebay-official-v121-grid">${rows.map(card).join('')}</div><p class="apg-ebay-official-v121-fine">Category links open current eBay Australia search results. APG does not verify an exact listing, live price, stock, seller, condition or warranty from these creative links. Confirm current details on eBay before buying.</p></section>`;
}

function ensureStyle(html){
  const out=String(html||'');
  if(out.includes(STYLE_HREF))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
}

function inject(html,path){
  let out=String(html||'');
  if(!out||!/<html|<!doctype/i.test(out))return out;
  if(out.includes('data-ebay-official-creatives-v121="true"'))return out;
  const rows=creativeRegistry.forPath(path);
  if(!rows.length)return out;

  out=ensureStyle(out);
  const block=section(rows,{compact:path!=='/'&&path!=='/deals/'});

  // Home and Deals: keep official eBay creative inside the existing governed eBay discovery
  // area so paid retailer imagery is clearly separated from APG editorial recommendations.
  if(path==='/'||path==='/deals/'){
    const ebaySection=/<section class="section apg-amz-v41 apg-ebay-v11"[^>]*data-ebay-epn-discovery=[^>]*>/i;
    if(ebaySection.test(out))return out.replace(ebaySection,match=>`${match}<div class="wrap">${block}</div>`);
    return out.replace(/<\/main>/i,`${block}</main>`);
  }

  // Category/guide/discovery routes only. Product pages are intentionally excluded by the
  // registry so retailer creative never becomes product evidence or a recommendation cue.
  return out.replace(/<\/main>/i,`${block}</main>`);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay official creative wrapper requires downstream handler');
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
      if(typeof res.setHeader==='function')res.setHeader('X-APG-eBay-Official-Creatives','v'+VERSION);
      return originalEnd(next,'utf8',cb);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{EBAY_OFFICIAL_CREATIVES_VERSION:VERSION,transformEbayOfficialCreatives:inject});
  return handler;
}

module.exports={VERSION,STYLE_HREF,card,section,ensureStyle,inject,wrap};
