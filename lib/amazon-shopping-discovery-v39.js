'use strict';

const ui=require('./ui');
const {categories}=require('../data');
const {
  TAG,VERIFIED_AT,destinations,watchlist,categorySearch,activeDestinations
}=require('../data/amazon-destinations-v39');

const esc=ui.esc;

const anchorByKey=Object.freeze({
  todayDeals:'today-deals',
  bestSellers:'best-sellers',
  under25:'under-25',
  subscribeSave:'subscribe-save',
  everydayEssentials:'everyday-essentials',
  globalStore:'global-store',
  newReleases:'new-releases'
});

function extAttrs(item,placement){
  return `href="${esc(item.affiliate_url)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-placement="${esc(placement)}" data-affiliate-context="shopping_discovery" data-affiliate-destination="${esc(item.key)}"`;
}

function internalCard(key,title,copy){
  return `<a class="apg-shopping-mini" href="/deals/#${esc(anchorByKey[key]||key)}"><span class="apg-shopping-mini-icon" aria-hidden="true">${shoppingIcon(key)}</span><span><strong>${esc(title)}</strong><small>${esc(copy)}</small></span><span aria-hidden="true">→</span></a>`;
}

function shoppingIcon(key){
  const icons={
    todayDeals:'<path d="M7 11h10v8H7z"/><path d="M9 11V8a3 3 0 0 1 6 0v3M5 15h2m10 0h2"/>',
    bestSellers:'<path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"/>',
    under25:'<path d="M5 6h14v12H5z"/><path d="M8 9h8M8 15h8M12 8v8"/>',
    subscribeSave:'<path d="M7 7h8l2 2-2 2H9a4 4 0 0 0 0 8h5"/><path d="m14 16 3 3-3 3M10 8 7 5l3-3"/>',
    everydayEssentials:'<path d="M7 4h10l2 5-2 11H7L5 9z"/><path d="M5 9h14M9 4v5m6-5v5"/>',
    globalStore:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    newReleases:'<path d="M5 5h14v14H5z"/><path d="M8 12h8M12 8v8"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[key]||icons.todayDeals}</svg>`;
}

function destinationCard(item){
  const id=anchorByKey[item.key]||item.key;
  return `<article id="${esc(id)}" class="apg-shopping-card"><div class="apg-shopping-card-head"><span class="apg-shopping-icon" aria-hidden="true">${shoppingIcon(item.key)}</span><div><span class="apg-shopping-state">${esc(item.lifecycle)} · verified ${esc(VERIFIED_AT)}</span><h2>${esc(item.title)}</h2></div></div><p>${esc(item.description)}</p>${item.consumer_note?`<p class="apg-shopping-note">${esc(item.consumer_note)}</p>`:''}<div class="apg-shopping-card-actions"><a class="button" ${extAttrs(item,`deals_${item.key}`)}>Explore on Amazon Australia <span aria-hidden="true">↗</span></a><span class="apg-paid-label">Paid Amazon Australia link</span></div></article>`;
}

function dealsPage(req){
  const active=activeDestinations();
  const body=`
<section class="apg-shopping-hero"><div class="wrap"><div class="apg-shopping-hero-grid"><div><p class="kicker">Deals &amp; shopping discovery</p><h1>Explore shopping opportunities, then decide what actually suits you.</h1><p class="lede">Australian Product Guide keeps retailer merchandising separate from product suitability. Use these verified Amazon Australia destinations to browse what is popular, discounted or easy to replenish — then come back to APG to compare the trade-offs.</p><div class="actions"><a class="button" href="#shopping-destinations">Explore shopping destinations</a><a class="button secondary" href="/decision-lab/">Use Decision Lab</a></div></div><aside class="apg-shopping-principles" aria-label="How this page works"><strong>APG remains the decision engine</strong><ul><li>Deals and popularity contribute zero recommendation points.</li><li>APG does not copy volatile Amazon prices onto this page.</li><li>External Amazon links are paid links and open on Amazon Australia.</li><li>Destinations are centrally governed and freshness dated.</li></ul></aside></div></div></section>
<section id="shopping-destinations" class="section apg-shopping-section"><div class="wrap"><div class="section-head"><div><p class="kicker">Current destinations</p><h2>Useful Amazon Australia shopping routes</h2><p>These are shopping-discovery routes rather than APG endorsements of the products Amazon chooses to merchandise.</p></div><span class="apg-shopping-verified">Last verified ${esc(VERIFIED_AT)}</span></div><div class="apg-shopping-grid">${active.map(destinationCard).join('')}</div></div></section>
<section class="section apg-shopping-bridge"><div class="wrap"><div class="apg-shopping-bridge-shell"><div><p class="kicker">Turn discovery into a decision</p><h2>Seen something interesting? Check whether it fits your situation.</h2><p>Popularity, a lower price or a promotional badge can be useful signals, but they do not tell you whether a product is the right fit. APG’s comparison tools stay independent of retailer commission.</p></div><div class="apg-shopping-bridge-actions"><a class="button" href="/decision-lab/">Open Decision Lab</a><a class="button secondary" href="/compare/">Compare products</a><a class="text-link" href="/search/">Search APG →</a></div></div></div></section>
<section class="section apg-shopping-governance"><div class="wrap"><div class="section-head"><div><p class="kicker">Freshness &amp; commercial transparency</p><h2>Volatile promotions are not treated as permanent content</h2></div></div><div class="apg-shopping-governance-grid"><div><strong>Evergreen routes</strong><p>Deals, Best Sellers, New Releases and search-led discovery can remain available while their destination is valid.</p></div><div><strong>Seasonal controls</strong><p>Sale events require an active status and expiry date before APG can surface them as current.</p></div><div><strong>Not automatically published</strong><p>Amazon Haul, vouchers and campaign-specific resale promotions stay off permanent APG navigation until a stable, current destination is verified.</p></div><div><strong>Affiliate independence</strong><p>Amazon referral availability and commission contribute zero points to APG recommendations.</p></div></div><p class="apg-shopping-watch">Current watchlist: ${Object.values(watchlist).map(x=>`${esc(x.title)} — ${esc(x.status)}`).join(' · ')}.</p><p class="apg-shopping-disclosure"><strong>As an Amazon Associate I earn from qualifying purchases.</strong> APG may earn commission when you use eligible Amazon Australia links. This does not change suitability rankings or recommendations.</p></div></section>`;
  return ui.layout(req,{
    title:'Deals & Shopping Discovery | Australian Product Guide',
    description:'Explore verified Amazon Australia deals, Best Sellers, value searches, recurring-purchase discovery and other shopping routes, then use APG to decide what suits you.',
    path:'/deals/',
    body,
    schemas:[{'@context':'https://schema.org','@type':'CollectionPage',name:'Deals & Shopping Discovery',description:'Australian Product Guide shopping-discovery hub for verified Amazon Australia destinations.',isPartOf:{'@type':'WebSite',name:'Australian Product Guide',url:ui.origin(req)+'/'} }],
    crumbs:[{name:'Home',path:'/'},{name:'Deals & shopping',path:'/deals/'}]
  });
}

function homeSection(){
  return `<section class="section apg-shopping-home" aria-labelledby="apgShoppingHomeTitle"><div class="wrap"><div class="section-head"><div><p class="kicker">Shopping discovery</p><h2 id="apgShoppingHomeTitle">Explore current shopping opportunities</h2><p>Start with a useful Amazon Australia destination, then use APG to compare what actually fits.</p></div><a class="text-link" href="/deals/">All deals &amp; shopping →</a></div><div class="apg-shopping-mini-grid">${internalCard('todayDeals',"Today's Deals",'Browse the current Amazon Australia deals destination.')}${internalCard('bestSellers','Best Sellers','See what is popular, without treating popularity as a recommendation.')}${internalCard('under25','Under $25','Explore a lower-price Amazon Australia search route.')}${internalCard('subscribeSave','Subscribe & Save','Explore recurring-purchase options and verify eligibility on Amazon.')}</div></div></section>`;
}

function categorySection(slug){
  const route=categorySearch(slug);
  const c=categories[slug];
  if(!route||!c)return '';
  return `<section class="section apg-category-shopping" aria-label="Amazon Australia shopping for ${esc(c.label)}"><div class="wrap"><div class="apg-category-shopping-shell"><div><p class="kicker">Retailer discovery</p><h2>Browse ${esc(c.label.toLowerCase())} on Amazon Australia</h2><p>Use this as a broader shopping route when you want to see more options. APG’s recommendations remain based on suitability, not affiliate availability or retailer promotions.</p></div><div class="apg-category-shopping-actions"><a class="button secondary" href="${esc(route.affiliate_url)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-placement="category_amazon_discovery" data-affiliate-context="category_discovery" data-affiliate-destination="${esc(route.key)}">Browse on Amazon Australia <span aria-hidden="true">↗</span></a><span class="apg-paid-label">Paid Amazon Australia link · verify model, seller, price and availability</span></div></div></div></section>`;
}

function dealIntent(q){
  const text=String(q||'').toLowerCase().trim();
  if(!text)return null;
  if(/subscribe\s*(?:&|and)?\s*save|recurring|replenish/.test(text))return destinations.subscribeSave;
  if(/best\s*seller|bestseller|popular\s+on\s+amazon/.test(text))return destinations.bestSellers;
  if(/under\s*\$?25|less\s+than\s*\$?25/.test(text))return destinations.under25;
  if(/global\s*store|international\s+amazon/.test(text))return destinations.globalStore;
  if(/new\s+release|new\s+on\s+amazon/.test(text))return destinations.newReleases;
  if(/amazon.*(?:deal|sale|offer)|(?:deal|sale|offer).*amazon|today'?s\s+deals/.test(text))return destinations.todayDeals;
  return null;
}

function searchSection(q){
  const item=dealIntent(q);
  if(!item)return '';
  return `<section class="section apg-search-shopping" aria-label="Amazon Australia shopping result"><div class="wrap"><div class="apg-search-shopping-shell"><span class="apg-shopping-icon" aria-hidden="true">${shoppingIcon(item.key)}</span><div><p class="kicker">Shopping intent</p><h2>${esc(item.title)}</h2><p>${esc(item.description)}</p><p class="apg-shopping-note">This shopping route is separate from APG product ranking.</p></div><div class="apg-search-shopping-actions"><a class="button" href="/deals/#${esc(anchorByKey[item.key]||item.key)}">Open APG shopping hub</a><a class="text-link" ${extAttrs(item,`search_${item.key}`)}>Go to Amazon Australia ↗</a><span class="apg-paid-label">Paid Amazon Australia link</span></div></div></div></section>`;
}

function injectBeforeMainEnd(html,section){
  if(!section||!html||!html.includes('</main>'))return html;
  return html.replace('</main>',section+'</main>');
}

function enhance(html,path,u){
  if(!html)return html;
  let out=html;
  if(path==='/')out=injectBeforeMainEnd(out,homeSection());
  const categoryMatch=String(path||'').match(/^\/categories\/([^/]+)\/$/);
  if(categoryMatch)out=injectBeforeMainEnd(out,categorySection(categoryMatch[1]));
  if(path==='/search/')out=injectBeforeMainEnd(out,searchSection(u?.searchParams?.get('q')||''));
  return out;
}

const css=`
/* APG Amazon Australia shopping discovery v39 */
.apg-shopping-hero{padding:54px 0 44px;background:linear-gradient(135deg,#f5faf8 0%,#eef5f7 55%,#fbf8f0 100%);border-bottom:1px solid #dfe9e6}.apg-shopping-hero-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.75fr);gap:38px;align-items:center}.apg-shopping-hero h1{max-width:850px;margin:8px 0 14px;font-size:clamp(38px,5vw,68px);line-height:.98;letter-spacing:-.055em;color:#092b3d}.apg-shopping-hero .lede{max-width:810px;font-size:18px;line-height:1.6;color:#46636d}.apg-shopping-principles{padding:24px;border:1px solid #d7e4e1;border-radius:22px;background:rgba(255,255,255,.86);box-shadow:0 18px 50px rgba(9,43,61,.08)}.apg-shopping-principles strong{display:block;margin-bottom:10px;color:#092b3d;font-size:17px}.apg-shopping-principles ul{margin:0;padding-left:20px;color:#526b73;line-height:1.55;font-size:13px}.apg-shopping-section{padding-top:54px}.apg-shopping-verified{align-self:flex-start;padding:8px 11px;border-radius:999px;background:#e8f4f0;color:#08786f;font-size:11px;font-weight:800;white-space:nowrap}.apg-shopping-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.apg-shopping-card{scroll-margin-top:120px;display:flex;flex-direction:column;min-height:300px;padding:23px;border:1px solid #dbe6e3;border-radius:20px;background:#fff;box-shadow:0 10px 28px rgba(12,54,66,.055)}.apg-shopping-card-head{display:flex;gap:13px;align-items:flex-start}.apg-shopping-icon,.apg-shopping-mini-icon{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border-radius:13px;background:#e9f5f1;color:#08786f}.apg-shopping-icon svg,.apg-shopping-mini-icon svg{width:24px;height:24px}.apg-shopping-state{display:block;margin-bottom:4px;color:#708086;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.apg-shopping-card h2{margin:0;font-size:21px;letter-spacing:-.025em;color:#0b3445}.apg-shopping-card>p{color:#556d75;font-size:13px;line-height:1.55}.apg-shopping-note{padding:10px 11px;border-radius:10px;background:#f7f9f8;color:#5d6e73!important;font-size:11.5px!important}.apg-shopping-card-actions{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:auto;padding-top:14px}.apg-paid-label{display:block;color:#79888d;font-size:9.5px;line-height:1.35}.apg-shopping-bridge{padding-top:28px}.apg-shopping-bridge-shell{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:30px;align-items:center;padding:30px;border-radius:24px;background:#092b3d;color:#fff}.apg-shopping-bridge-shell h2{margin:5px 0 8px;color:#fff}.apg-shopping-bridge-shell p{max-width:760px;margin-bottom:0;color:#c9d8dc}.apg-shopping-bridge-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.apg-shopping-bridge .text-link{color:#fff}.apg-shopping-governance{padding-top:28px}.apg-shopping-governance-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.apg-shopping-governance-grid>div{padding:18px;border:1px solid #e0e8e6;border-radius:15px;background:#fafcfb}.apg-shopping-governance-grid strong{display:block;margin-bottom:6px;color:#123d4e}.apg-shopping-governance-grid p{margin:0;color:#60747b;font-size:12px;line-height:1.5}.apg-shopping-watch,.apg-shopping-disclosure{margin-top:14px;padding:14px 16px;border-radius:12px;background:#f5f8f7;color:#60747b;font-size:11px;line-height:1.55}.apg-shopping-disclosure{background:#fff8ea;color:#55472e}.apg-shopping-home{border-top:1px solid #e4ecea;background:linear-gradient(180deg,#fff,#f8fbfa)}.apg-shopping-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.apg-shopping-mini{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:16px;border:1px solid #dce7e4;border-radius:16px;background:#fff;color:#143f50;text-decoration:none;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}.apg-shopping-mini:hover,.apg-shopping-mini:focus-visible{transform:translateY(-2px);border-color:#abd1c9;box-shadow:0 10px 24px rgba(10,62,73,.08)}.apg-shopping-mini strong{display:block;font-size:13px}.apg-shopping-mini small{display:block;margin-top:3px;color:#667a80;font-size:10.5px;line-height:1.35}.apg-shopping-mini-icon{width:38px;height:38px;border-radius:11px}.apg-shopping-mini-icon svg{width:21px;height:21px}.apg-category-shopping{padding-top:20px}.apg-category-shopping-shell,.apg-search-shopping-shell{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center;padding:22px;border:1px solid #dce7e4;border-radius:18px;background:linear-gradient(100deg,#f7fbf9,#fff)}.apg-category-shopping-shell h2,.apg-search-shopping-shell h2{margin:4px 0 7px;color:#123d4e}.apg-category-shopping-shell p,.apg-search-shopping-shell p{margin:0;max-width:760px;color:#60747b;font-size:12.5px;line-height:1.5}.apg-category-shopping-actions,.apg-search-shopping-actions{display:flex;flex-direction:column;align-items:flex-end;gap:7px}.apg-search-shopping{padding:16px 0 4px}.apg-search-shopping-shell{grid-template-columns:auto minmax(0,1fr) auto}.apg-search-shopping-actions .text-link{font-size:12px}.apg-shopping-card:target{outline:3px solid rgba(8,120,111,.18);outline-offset:4px}
@media(max-width:980px){.apg-shopping-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.apg-shopping-governance-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.apg-shopping-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.apg-shopping-hero-grid{grid-template-columns:1fr}.apg-shopping-principles{max-width:720px}.apg-shopping-bridge-shell{grid-template-columns:1fr}.apg-shopping-bridge-actions{justify-content:flex-start}}
@media(max-width:680px){.apg-shopping-hero{padding:34px 0 28px}.apg-shopping-hero h1{font-size:42px}.apg-shopping-hero .lede{font-size:15px}.apg-shopping-grid,.apg-shopping-governance-grid,.apg-shopping-mini-grid{grid-template-columns:1fr}.apg-shopping-card{min-height:0}.apg-category-shopping-shell,.apg-search-shopping-shell{grid-template-columns:1fr;gap:16px}.apg-search-shopping-shell>.apg-shopping-icon{display:none}.apg-category-shopping-actions,.apg-search-shopping-actions{align-items:stretch}.apg-category-shopping-actions .button,.apg-search-shopping-actions .button{text-align:center}.apg-shopping-verified{white-space:normal}.apg-shopping-bridge-shell{padding:24px 20px}}
`;

module.exports={TAG,VERIFIED_AT,dealsPage,homeSection,categorySection,searchSection,dealIntent,enhance,css,anchorByKey};
