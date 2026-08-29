'use strict';

// APG official eBay Creative Gallery presentation v121.1.
// Premium retailer-discovery presentation only. Recommendation/evidence/eligibility/ranking stay untouched.
const creativeRegistry=require('../data/ebay-official-creatives-v121');
const ebay=require('../data/ebay-epn-interim-v1');

const VERSION='121.1';
const STYLE_HREF='/assets/ebay-official-creatives-v121.css?v=121.1';

function escHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function htmlHref(value){return String(value||'').replace(/&/g,'&amp;');}
function affiliateAttrs(kind,key,placement){return `rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="${escHtml(kind)}" data-affiliate-placement="${escHtml(placement)}" data-ebay-exact-model="false" data-ebay-official-creative="${escHtml(key)}"`;}

function card(row){
  return `<a class="apg-ebay-official-v121-card" href="${htmlHref(row.destination)}" ${affiliateAttrs('official-creative-gallery',row.key,`ebay_official_creative_${row.key}`)}><span class="apg-ebay-official-v121-media"><img class="apg-ebay-official-v121-image" src="${escHtml(row.image)}" width="${row.width}" height="${row.height}" loading="lazy" decoding="async" alt="${escHtml(row.alt)}"></span><span class="apg-ebay-official-v121-copy"><span class="apg-ebay-official-v121-label">Official eBay creative</span><strong>${escHtml(row.title)}</strong><span>Browse on eBay Australia <span aria-hidden="true">↗</span></span></span></a>`;
}

function hero(row){
  if(!row)return '';
  return `<a class="apg-ebay-official-v121-hero" href="${htmlHref(row.destination)}" ${affiliateAttrs('official-creative-gallery-hero',row.key,`ebay_official_hero_${row.key}`)}><img src="${escHtml(row.image)}" width="${row.width}" height="${row.height}" loading="lazy" decoding="async" alt="${escHtml(row.alt)}"><span class="sr-only">${escHtml(row.title)} — paid eBay Australia retailer pathway</span></a>`;
}

function promotionCard(row){
  return `<a class="apg-ebay-official-v121-promo" href="${htmlHref(row.url)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="${escHtml(row.kind||'collection')}" data-affiliate-placement="ebay_discovery_${escHtml(row.key)}" data-ebay-epn-collection="${escHtml(row.key)}" data-ebay-exact-model="false"><span><strong>${escHtml(row.title)}</strong><small>${escHtml(row.description)}</small></span><span class="apg-ebay-official-v121-promo-cta">Browse on eBay Australia <span aria-hidden="true">↗</span></span></a>`;
}

function tradingBanner(){
  const row=creativeRegistry.TRADING_CARDS;
  return `<div class="apg-ebay-official-v121-banner-wrap"><a class="apg-ebay-official-v121-banner" href="${htmlHref(row.destination)}" ${affiliateAttrs('official-creative-gallery-banner',row.key,'ebay_official_trading_cards')}><img src="${escHtml(row.image)}" width="${row.width}" height="${row.height}" loading="lazy" decoding="async" alt="${escHtml(row.alt)}"><span class="sr-only">Browse Trading Cards on eBay Australia — paid retailer pathway</span></a></div>`;
}

function section(rows,{path='/',compact=false}={}){
  if(!rows.length)return '';
  const cls=compact?' apg-ebay-official-v121-compact':'';
  const primary=path==='/'||path==='/deals/';
  const promo=primary?ebay.promotionRows().map(promotionCard).join(''):'';
  const heading=compact?'More ways to browse on eBay Australia':'Shop eBay Australia with official creative';
  const intro=compact?'A relevant paid retailer-discovery pathway. It is separate from APG product recommendations and rankings.':'Official eBay Creative Gallery assets are used here as retailer discovery aids. Paid retailer pathways remain separate from APG recommendations and contribute zero recommendation points.';
  return `<section class="apg-ebay-official-v121${cls}" data-ebay-official-creatives-v121="true" data-ebay-official-version="${VERSION}" aria-labelledby="apgEbayOfficialV121Title"><div class="apg-ebay-official-v121-head"><div><p class="kicker">eBay Australia discovery</p><h2 id="apgEbayOfficialV121Title">${heading}</h2><p>${intro}</p></div><span class="apg-ebay-official-v121-badge">Official eBay creative</span></div>${primary?hero(creativeRegistry.heroForPath(path)):''}${primary?`<div class="apg-ebay-official-v121-promos" aria-label="eBay refurbished and marketplace pathways">${promo}</div>`:''}<div class="apg-ebay-official-v121-grid">${rows.map(card).join('')}</div>${path==='/deals/'?tradingBanner():''}<div class="apg-ebay-official-v121-disclosure"><strong>Paid eBay Australia links.</strong> APG may earn a commission from qualifying purchases. Retailer participation and commission do not affect suitability, ranking or recommendations.</div><p class="apg-ebay-official-v121-fine">Creative and collection links open eBay Australia discovery results or eBay collection pages. APG does not verify an exact listing, live price, stock, seller, condition grade or warranty from these promotional pathways. Confirm the exact item and current details on eBay before buying.</p></section>`;
}

function ensureStyle(html){
  const out=String(html||'');
  if(out.includes('/assets/ebay-official-creatives-v121.css'))return out;
  return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
}

function replaceLegacyDiscovery(out,block){
  const legacy=/<section class="section apg-amz-v41 apg-ebay-v11"[^>]*data-ebay-epn-discovery=[^>]*>[\s\S]*?<\/section>/i;
  if(legacy.test(out))return out.replace(legacy,`<section class="section apg-ebay-premium-v121-shell"><div class="wrap">${block}</div></section>`);
  return out.replace(/<\/main>/i,`<section class="section apg-ebay-premium-v121-shell"><div class="wrap">${block}</div></section></main>`);
}

function inject(html,path){
  let out=String(html||'');
  if(!out||!/<html|<!doctype/i.test(out))return out;
  if(out.includes('data-ebay-official-creatives-v121="true"'))return out;
  const rows=creativeRegistry.forPath(path);
  if(!rows.length)return out;
  out=ensureStyle(out);
  const primary=path==='/'||path==='/deals/';
  const block=section(rows,{path,compact:!primary});
  if(primary)return replaceLegacyDiscovery(out,block);
  return out.replace(/<\/main>/i,`<section class="section apg-ebay-premium-v121-shell"><div class="wrap">${block}</div></section></main>`);
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

module.exports={VERSION,STYLE_HREF,card,hero,promotionCard,tradingBanner,section,ensureStyle,replaceLegacyDiscovery,inject,wrap};
