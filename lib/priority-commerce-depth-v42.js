// APG priority commerce depth v42.
// Surfaces date-stamped exact-model retailer offers already held in product data.
// Affiliate status never changes recommendation order or suitability.
const app=require('./mobile-account-proof-v20');
const {products}=require('../data');

const bySlug=new Map(products.map(p=>[p.slug,p]));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number.isFinite(Number(n))?`A$${Number(n).toLocaleString('en-AU')}`:null;
const human=v=>String(v||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const auDate=v=>{const d=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return d?`${Number(d[3])} ${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d[2])]} ${d[1]}`:String(v||'');};

function verifiedOffers(p){
  return (Array.isArray(p?.offers)?p.offers:[]).filter(o=>o&&o.exactModel===true&&o.url&&o.retailer);
}
function offerRow(o){
  const facts=[];
  if(Number.isFinite(Number(o.price)))facts.push(money(o.price));
  if(o.availability&&o.availability!=='check-current')facts.push(human(o.availability));
  if(o.checkedAt)facts.push(`checked ${auDate(o.checkedAt)}`);
  return `<a class="retailer-row" href="${esc(o.url)}" rel="noopener" target="_blank"><span class="retailer-logo official-logo">✓</span><span><strong>${esc(o.retailer)}</strong><small>Verified exact-model retailer destination · non-affiliate</small>${facts.length?`<small>${esc(facts.join(' · '))}</small>`:''}${o.variant?`<small>Variant: ${esc(o.variant)}</small>`:''}</span><span class="retailer-action">View exact offer ↗</span></a>`;
}
function officialSourceRow(p){
  return `<a class="retailer-row" href="${esc(p.source)}" rel="noopener" target="_blank"><span class="retailer-logo official-logo">✓</span><span><strong>${esc(p.brand)} official product information</strong><small>Primary evidence source · non-affiliate</small></span><span class="retailer-action">Verify specs ↗</span></a>`;
}
function injectOffers(out,p){
  const offers=verifiedOffers(p);
  if(!offers.length)return out;
  const marker='<span class="independence-badge">Retailer status does not affect ranking</span></div>';
  if(!out.includes(marker))return out;
  if(offers.some(o=>o.url===p.source))out=out.replace(officialSourceRow(p),'');
  const block=`<div class="apg-exact-offers-v42"><p class="fine-inline"><strong>Verified retailer intelligence:</strong> these are exact-model destinations checked on the stated date. Observed price or stock is not a live feed or a whole-of-market lowest-price claim.</p>${offers.map(offerRow).join('')}</div>`;
  return out.replace(marker,marker+block);
}
function transform(html,path){
  let out=String(html||'');
  const m=path.match(/^\/products\/([^/]+)\/$/);
  if(!m)return out;
  const p=bySlug.get(m[1]);
  return p?injectOffers(out,p):out;
}

module.exports=(req,res)=>{
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,path);
    return end(body,...args);
  };
  return app(req,res);
};
module.exports.transform=transform;
module.exports.verifiedOffers=verifiedOffers;
