'use strict';

const ui=require('./ui');
const {categories}=require('../data');
const {destinations,amazonSearch,TAG}=require('../data/amazon-destinations-v39');
const shopping=require('./amazon-shopping-discovery-v39');
const {categoryGlyph}=require('./brand-v7');

const esc=ui.esc;
const VERSION='v41';
const CREATIVE_SOURCE='APG_ORIGINAL';

function affiliateAttrs(item,placement){
  const href=item&&item.affiliate_url?item.affiliate_url:'';
  return `href="${esc(href)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="${esc(item?.destination_type||'other')}" data-affiliate-placement="${esc(placement)}" data-affiliate-context="shopping_creative" data-affiliate-destination="${esc(item?.key||'amazon-shopping')}" data-amazon-creative-source="${CREATIVE_SOURCE}"`;
}

function artSvg(kind,slug=''){
  if(kind==='category'&&slug){
    let glyph='';
    try{glyph=categoryGlyph(slug)||'';}catch{}
    return `<span class="apg-amz-v41-art apg-amz-v41-art-category" aria-hidden="true"><span class="apg-amz-v41-orbit orbit-a"></span><span class="apg-amz-v41-orbit orbit-b"></span><span class="apg-amz-v41-glyph">${glyph}</span><span class="apg-amz-v41-chip chip-a"></span><span class="apg-amz-v41-chip chip-b"></span></span>`;
  }
  const paths={
    deals:'<path d="M20 22h24l-2 27H22l-2-27Z"/><path d="M26 22v-4a6 6 0 0 1 12 0v4"/><path d="m45 12 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z"/>',
    best:'<path d="m32 10 6.5 13.2 14.5 2.1-10.5 10.2 2.5 14.5L32 43.2 19 50l2.5-14.5L11 25.3l14.5-2.1L32 10Z"/>',
    value:'<path d="M13 20h38v28H13V20Z"/><path d="M20 27h24M20 40h24"/><circle cx="32" cy="34" r="5"/>',
    repeat:'<path d="M19 20h23l5 5-5 5H25a9 9 0 0 0 0 18h11"/><path d="m36 42 6 6-6 6M25 23l-6-6 6-6"/>',
    new:'<path d="M17 16h30v32H17V16Z"/><path d="M23 26h18M32 22v18"/><path d="m46 10 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z"/>'
  };
  return `<span class="apg-amz-v41-art apg-amz-v41-art-${esc(kind)}" aria-hidden="true"><span class="apg-amz-v41-orbit orbit-a"></span><span class="apg-amz-v41-orbit orbit-b"></span><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${paths[kind]||paths.deals}</svg><span class="apg-amz-v41-chip chip-a"></span><span class="apg-amz-v41-chip chip-b"></span></span>`;
}

function visualLink(item,{placement,eyebrow,title,copy,kind='deals',className='',slug=''}){
  return `<a class="apg-amz-v41-card ${esc(className)}" ${affiliateAttrs(item,placement)}>${artSvg(kind,slug)}<span class="apg-amz-v41-copy"><span class="apg-amz-v41-eyebrow">${esc(eyebrow)}</span><strong>${esc(title)}</strong><span>${esc(copy)}</span><span class="apg-amz-v41-cta">Explore on Amazon Australia <span aria-hidden="true">↗</span></span><small>Paid Amazon Australia link · APG may earn from qualifying purchases</small></span></a>`;
}

function homeCreative(){
  return `<section class="section apg-amz-v41 apg-amz-v41-home" data-amazon-creative-v41="home" aria-labelledby="apgAmzV41HomeTitle"><div class="wrap"><div class="apg-amz-v41-head"><div><p class="kicker">Amazon Australia shopping discovery</p><h2 id="apgAmzV41HomeTitle">A more visual way to browse shopping opportunities</h2><p>These retailer links are separate from APG recommendations. Explore what Amazon Australia is merchandising, then use APG to compare what actually suits you.</p></div><a class="text-link" href="/deals/">Open the APG Deals hub →</a></div><div class="apg-amz-v41-home-grid">${visualLink(destinations.todayDeals,{placement:'home_visual_today_deals',eyebrow:'Shopping now',title:"Explore Today's Deals",copy:'Open Amazon Australia’s current Deals destination. Prices, eligibility and expiry can change on Amazon.',kind:'deals',className:'is-feature'})}<div class="apg-amz-v41-stack">${visualLink(destinations.bestSellers,{placement:'home_visual_best_sellers',eyebrow:'Popular on Amazon',title:'Browse Best Sellers',copy:'Use popularity as discovery context — not as an APG suitability score.',kind:'best'})}${visualLink(destinations.under25,{placement:'home_visual_under_25',eyebrow:'Lower-price browsing',title:'Explore items under $25',copy:'A price-filtered Amazon Australia shopping route; not a claim that every item is discounted.',kind:'value'})}${visualLink(destinations.subscribeSave,{placement:'home_visual_subscribe_save',eyebrow:'Repeat purchases',title:'Explore Subscribe & Save',copy:'Check current eligibility, delivery settings and any applicable saving on Amazon.',kind:'repeat'})}</div></div></div></section>`;
}

function dealsCreative(){
  return `<section class="section apg-amz-v41 apg-amz-v41-deals" data-amazon-creative-v41="deals" aria-labelledby="apgAmzV41DealsTitle"><div class="wrap"><div class="apg-amz-v41-head"><div><p class="kicker">Visual shopping shortcuts</p><h2 id="apgAmzV41DealsTitle">Browse the Amazon Australia routes people commonly look for</h2><p>APG does not reproduce volatile Amazon prices or manufacture promotional claims. These visual shortcuts open governed Amazon Australia destinations with APG’s Associate tag.</p></div></div><div class="apg-amz-v41-deals-grid">${visualLink(destinations.todayDeals,{placement:'deals_visual_today_deals',eyebrow:'Current deals destination',title:"Today's Deals",copy:'Browse Amazon Australia’s Deals destination and verify current terms on Amazon.',kind:'deals',className:'is-wide'})}${visualLink(destinations.bestSellers,{placement:'deals_visual_best_sellers',eyebrow:'Discovery signal',title:'Best Sellers',copy:'See what Amazon currently presents as popular.',kind:'best'})}${visualLink(destinations.newReleases,{placement:'deals_visual_new_releases',eyebrow:'Discovery signal',title:'New Releases',copy:'Explore newer marketplace listings without treating newness as a quality score.',kind:'new'})}${visualLink(destinations.under25,{placement:'deals_visual_under_25',eyebrow:'Price-filtered route',title:'Under $25',copy:'Browse an Amazon Australia price-filtered search route.',kind:'value'})}</div></div></section>`;
}

function categoryRoute(slug){
  const c=categories[slug];
  if(!c)return null;
  const affiliate_url=amazonSearch({keywords:c.label});
  return {key:`category-${slug}`,affiliate_url,destination_type:'amazon-search'};
}

function categoryCreative(slug){
  const c=categories[slug],item=categoryRoute(slug);
  if(!c||!item)return '';
  return `<section class="section apg-amz-v41 apg-amz-v41-category" data-amazon-creative-v41="category" data-amazon-creative-category="${esc(slug)}" aria-label="Amazon Australia ${esc(c.label)} shopping shortcut"><div class="wrap">${visualLink(item,{placement:`category_visual_${slug}`,eyebrow:'Retailer discovery',title:`Browse ${c.label} on Amazon Australia`,copy:`Explore a broader Amazon Australia search for ${c.label.toLowerCase()}. APG recommendations remain independent of affiliate availability and retailer promotion.`,kind:'category',className:'is-category',slug})}</div></section>`;
}

function searchCreative(q){
  const item=shopping.dealIntent(q);
  if(!item)return '';
  const kinds={todayDeals:'deals',bestSellers:'best',under25:'value',subscribeSave:'repeat',newReleases:'new'};
  return `<section class="section apg-amz-v41 apg-amz-v41-search" data-amazon-creative-v41="search" aria-label="Amazon Australia shopping shortcut"><div class="wrap">${visualLink(item,{placement:`search_visual_${item.key}`,eyebrow:'Retailer shopping intent',title:item.title,copy:'Open the relevant Amazon Australia shopping destination. This remains separate from APG product suitability ranking.',kind:kinds[item.key]||'deals',className:'is-search'})}</div></section>`;
}

function insertBefore(html,marker,section){
  if(!section||!html||html.includes(section.match(/data-amazon-creative-v41="([^"]+)/)?.[0]||'__never__'))return html;
  const i=html.indexOf(marker);
  if(i<0)return html;
  return html.slice(0,i)+section+html.slice(i);
}

function insertAfterSection(html,classToken,section){
  if(!section||!html)return html;
  const start=html.indexOf(classToken);
  if(start<0)return html;
  const sectionStart=html.lastIndexOf('<section',start);
  if(sectionStart<0)return html;
  const end=html.indexOf('</section>',start);
  if(end<0)return html;
  const at=end+'</section>'.length;
  return html.slice(0,at)+section+html.slice(at);
}

function enhance(html,req){
  let out=String(html||'');
  let u;try{u=new URL(req?.url||'/','https://australianproductguide.au');}catch{u=new URL('https://australianproductguide.au/');}
  let path;try{path=decodeURIComponent(u.pathname).replace(/\/{2,}/g,'/');}catch{path=u.pathname||'/';}
  if(path==='/'&&!out.includes('data-amazon-creative-v41="home"'))out=insertBefore(out,'<section class="section apg-shopping-home"',homeCreative());
  if(path==='/deals/'&&!out.includes('data-amazon-creative-v41="deals"'))out=insertAfterSection(out,'apg-shopping-hero',dealsCreative());
  const m=path.match(/^\/categories\/([^/]+)\/$/);
  if(m&&!out.includes('data-amazon-creative-v41="category"')){
    const section=categoryCreative(m[1]);
    if(section){
      const marker='<section class="section apg-category-shopping"';
      out=out.includes(marker)?insertBefore(out,marker,section):out.replace('</main>',section+'</main>');
    }
  }
  if(path==='/search/'&&!out.includes('data-amazon-creative-v41="search"')){
    const section=searchCreative(u.searchParams.get('q')||'');
    if(section)out=out.replace('</main>',section+'</main>');
  }
  return out;
}

const css=`
/* APG Amazon shopping creative layer v41 — original APG artwork, no Amazon Program Content */
.apg-amz-v41{position:relative}.apg-amz-v41-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:20px}.apg-amz-v41-head h2{margin:4px 0 8px;color:#0b3445;letter-spacing:-.035em}.apg-amz-v41-head p{max-width:760px;color:#587078}.apg-amz-v41-home{padding-top:36px}.apg-amz-v41-home-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(360px,.75fr);gap:18px}.apg-amz-v41-stack{display:grid;gap:12px}.apg-amz-v41-card{position:relative;isolation:isolate;overflow:hidden;display:grid;grid-template-columns:minmax(180px,.78fr) minmax(0,1.22fr);min-height:220px;padding:28px;border:1px solid #d5e4e1;border-radius:24px;background:linear-gradient(135deg,#f7fbfa 0%,#eef6f4 46%,#e8f2f7 100%);box-shadow:0 18px 48px rgba(9,43,61,.09);text-decoration:none;color:#0b3445;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.apg-amz-v41-card:hover{transform:translateY(-2px);box-shadow:0 22px 56px rgba(9,43,61,.14);border-color:#b9d9d2}.apg-amz-v41-card:focus-visible{outline:3px solid #2563eb;outline-offset:3px}.apg-amz-v41-card.is-feature{min-height:500px;grid-template-columns:1fr;align-content:end;background:linear-gradient(150deg,#e9f7f2 0%,#eaf2fb 52%,#f8f2e7 100%)}.apg-amz-v41-card.is-feature .apg-amz-v41-art{position:absolute;right:5%;top:7%;width:min(52%,390px);height:62%}.apg-amz-v41-card.is-feature .apg-amz-v41-copy{max-width:72%;position:relative;z-index:2}.apg-amz-v41-stack .apg-amz-v41-card{min-height:150px;grid-template-columns:118px 1fr;padding:20px}.apg-amz-v41-deals-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.apg-amz-v41-deals-grid .apg-amz-v41-card{grid-template-columns:1fr;min-height:330px;align-content:end}.apg-amz-v41-deals-grid .apg-amz-v41-card.is-wide{grid-column:span 2;grid-template-columns:minmax(220px,.8fr) minmax(0,1.2fr)}.apg-amz-v41-copy{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;position:relative;z-index:2}.apg-amz-v41-eyebrow{display:inline-flex;margin-bottom:8px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.74);border:1px solid rgba(36,99,235,.12);font-size:9.5px;font-weight:850;letter-spacing:.085em;text-transform:uppercase;color:#08786f}.apg-amz-v41-copy strong{font-size:clamp(21px,2.4vw,34px);line-height:1.04;letter-spacing:-.04em}.apg-amz-v41-copy>span:not(.apg-amz-v41-eyebrow):not(.apg-amz-v41-cta){margin-top:10px;color:#506971;font-size:13px;line-height:1.55}.apg-amz-v41-cta{margin-top:17px;display:inline-flex;align-items:center;gap:7px;padding:10px 13px;border-radius:11px;background:#0f172a;color:#fff;font-size:12px;font-weight:800}.apg-amz-v41-copy small{margin-top:8px;color:#718289;font-size:9.5px;line-height:1.35}.apg-amz-v41-art{position:relative;display:grid;place-items:center;min-height:150px;color:#0b6e69}.apg-amz-v41-art svg{position:relative;z-index:2;width:86px;height:86px;padding:17px;border-radius:24px;background:rgba(255,255,255,.84);box-shadow:0 14px 35px rgba(15,23,42,.12)}.apg-amz-v41-orbit{position:absolute;border-radius:999px;border:1px solid rgba(8,120,111,.15);background:rgba(255,255,255,.32)}.apg-amz-v41-orbit.orbit-a{width:140px;height:140px}.apg-amz-v41-orbit.orbit-b{width:190px;height:190px;border-style:dashed;transform:rotate(18deg)}.apg-amz-v41-chip{position:absolute;z-index:1;width:38px;height:38px;border-radius:12px;background:rgba(37,99,235,.14);box-shadow:0 8px 20px rgba(15,23,42,.08)}.apg-amz-v41-chip.chip-a{left:12%;top:18%;transform:rotate(-14deg)}.apg-amz-v41-chip.chip-b{right:8%;bottom:18%;background:rgba(8,120,111,.17);transform:rotate(16deg)}.apg-amz-v41-glyph{position:relative;z-index:2;display:grid;place-items:center;width:96px;height:96px;padding:18px;border-radius:27px;background:rgba(255,255,255,.88);box-shadow:0 14px 35px rgba(15,23,42,.12)}.apg-amz-v41-glyph svg{width:60px;height:60px;padding:0;border:0;border-radius:0;background:none;box-shadow:none}.apg-amz-v41-category{padding-top:18px;padding-bottom:12px}.apg-amz-v41-category .apg-amz-v41-card{grid-template-columns:minmax(200px,.55fr) minmax(0,1.45fr);min-height:250px;background:linear-gradient(125deg,#eef8f5,#f4f8fc 54%,#fbf7ed)}.apg-amz-v41-category .apg-amz-v41-copy strong{font-size:clamp(23px,3vw,38px)}.apg-amz-v41-search{padding-top:18px}.apg-amz-v41-search .apg-amz-v41-card{min-height:240px}.apg-amz-v41-deals{padding-top:34px;padding-bottom:8px}
@media(max-width:900px){.apg-amz-v41-head{align-items:start;flex-direction:column}.apg-amz-v41-home-grid{grid-template-columns:1fr}.apg-amz-v41-card.is-feature{min-height:420px}.apg-amz-v41-card.is-feature .apg-amz-v41-copy{max-width:86%}.apg-amz-v41-deals-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.apg-amz-v41-deals-grid .apg-amz-v41-card.is-wide{grid-column:span 2}.apg-amz-v41-category .apg-amz-v41-card{grid-template-columns:180px 1fr}}
@media(max-width:620px){.apg-amz-v41{padding-top:24px}.apg-amz-v41-home-grid,.apg-amz-v41-deals-grid{display:grid;grid-template-columns:1fr}.apg-amz-v41-card,.apg-amz-v41-card.is-feature,.apg-amz-v41-deals-grid .apg-amz-v41-card,.apg-amz-v41-deals-grid .apg-amz-v41-card.is-wide,.apg-amz-v41-category .apg-amz-v41-card,.apg-amz-v41-search .apg-amz-v41-card{grid-column:auto;grid-template-columns:1fr;min-height:0;padding:20px}.apg-amz-v41-card.is-feature .apg-amz-v41-art{position:relative;right:auto;top:auto;width:100%;height:190px}.apg-amz-v41-card.is-feature .apg-amz-v41-copy{max-width:none}.apg-amz-v41-stack .apg-amz-v41-card{grid-template-columns:92px 1fr;padding:17px}.apg-amz-v41-stack .apg-amz-v41-art{min-height:96px}.apg-amz-v41-art{min-height:160px}.apg-amz-v41-copy strong{font-size:23px}.apg-amz-v41-category .apg-amz-v41-art{min-height:150px}.apg-amz-v41-cta{min-height:44px}.apg-amz-v41-copy small{font-size:10px}}
`;

module.exports={VERSION,CREATIVE_SOURCE,TAG,homeCreative,dealsCreative,categoryCreative,searchCreative,categoryRoute,visualLink,enhance,css};
