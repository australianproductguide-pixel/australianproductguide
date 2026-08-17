// Australian Product Guide consumer experience v10
// Readability, semantic national-category visuals, conversational Scout assistant,
// richer evidence, verified multi-retailer pathways and deeper national categories.
const data=require('../data');
const {retailersFor}=require('../data/retailers-v6');

const REVIEWED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const slugify=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function addNationalProduct(categorySlug,row){
  const c=data.categories[categorySlug];
  if(!c||data.products.some(p=>p.slug===row.slug))return;
  const p={
    id:row.id||`APG-V10-${categorySlug.toUpperCase()}-${row.slug}`,
    slug:row.slug||slugify(`${row.brand}-${row.name}`),brand:row.brand,name:row.name,model:row.model,price:null,
    summary:row.summary,highlights:row.highlights,watch:row.watch,source:row.source,
    sourceType:'Official Australian manufacturer product/specification page · exact family/model identity checked 17 Aug 2026',
    tags:row.tags,evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',
    testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',
    publicationStatus:'LIVE / MAINTAINED',firstResearched:REVIEWED,lastSubstantiveReview:REVIEWED,lastSourceVerification:REVIEWED,
    lastRetailerCheck:REVIEWED,lastPriceCheck:null,lastImageVerification:REVIEWED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',
    lastReviewed:REVIEWED,category:categorySlug,categoryLabel:c.label
  };
  p.retailers=retailersFor(p);
  c.products.push(p);data.products.push(p);
}

// Depth before breadth: four additional manufacturer-backed products in the two
// highest-intent national categories. Family pages are labelled as such where
// configuration varies; APG does not turn family specifications into SKU claims.
addNationalProduct('televisions',{
  slug:'lg-oled-b6-55-inch-oled55b6psa',brand:'LG',name:'OLED B6 55-inch (OLED55B6PSA)',model:'OLED55B6PSA',
  summary:'A 55-inch 2026 OLED entry point for buyers who want OLED black levels and modern gaming support without automatically stepping up to the C6 tier.',
  highlights:['55-inch 4K OLED panel','120Hz native refresh with VRR up to 144Hz','Dolby Vision, NVIDIA G-Sync and AMD FreeSync support'],
  watch:'The B6 uses a different processor and lower-tier positioning than the C6; compare brightness, processing and the real price gap before assuming the cheaper OLED is the better value.',
  source:'https://www.lg.com/au/tv-soundbars/oled-tv/oled55b6psa/',tags:['oled','55-inch','gaming','dolby-vision','value']
});
addNationalProduct('televisions',{
  slug:'samsung-s90h-55-inch-oled-qa55s90hawxxy',brand:'Samsung',name:'S90H 55-inch OLED 4K Vision AI TV',model:'QA55S90HAWXXY',
  summary:'A 55-inch 2026 Samsung OLED for buyers prioritising strong gaming refresh capability, Glare Free treatment and the Tizen ecosystem.',
  highlights:['55-inch 4K OLED display','Up to 165Hz VRR with Motion Xcelerator','Glare Free treatment and NQ4 AI Gen3 processor'],
  watch:'Samsung supports HDR10+ rather than Dolby Vision. Compare HDR format preference, bright-room reflections and actual OLED panel behaviour before choosing it over C6 or Mini LED alternatives.',
  source:'https://www.samsung.com/au/tvs/oled-tv/s90h-55-inch-4k-smart-tv-qa55s90hawxxy/',tags:['oled','55-inch','gaming','bright-room','tizen']
});
addNationalProduct('laptops',{
  slug:'asus-zenbook-s16-um5606',brand:'ASUS',name:'Zenbook S16 (UM5606)',model:'UM5606',
  summary:'A thin 16-inch OLED Copilot+ laptop family for buyers who want a larger premium display without moving to a conventional heavy workstation.',
  highlights:['16-inch 3K 120Hz OLED touchscreen family','Approximately 1.1cm thin and 1.5kg','AMD Ryzen AI configurations with up to 50 TOPS NPU'],
  watch:'UM5606 configurations vary in processor, memory and operating system. Verify the complete Australian part number rather than buying from family-level specifications alone.',
  source:'https://www.asus.com/au/laptops/for-home/zenbook/asus-zenbook-s-16-um5606/',tags:['windows','oled','creator','portable','copilot-plus']
});
addNationalProduct('laptops',{
  slug:'lenovo-yoga-pro-7i-gen10-aura-14',brand:'Lenovo',name:'Yoga Pro 7i Gen 10 Aura Edition 14-inch',model:'Yoga Pro 7i Gen 10 Aura Edition 14-inch',
  summary:'A creator-oriented 14.5-inch Windows laptop family for buyers prioritising a high-resolution OLED display, stronger sustained performance and a broader port mix.',
  highlights:['14.5-inch 3K OLED PureSight Pro display family','120Hz refresh on the highlighted OLED configuration','Intel Core Ultra platform with Lenovo X Power positioning'],
  watch:'This is a configurable family. Processor, memory, display and graphics options can vary, so confirm the exact Australian configuration code before purchase.',
  source:'https://www.lenovo.com/au/en/p/laptops/yoga/yoga-pro-series/lenovo-yoga-pro-7i-gen-10-aura-edition-14-inch-intel/len101y0058',tags:['windows','oled','creator','120hz','premium']
});

const base=require('./national-experience');

const exactRetailerEvidence={
  'lg-oled-evo-c6-55-inch-oled55c6psa':[
    {name:'The Good Guys',url:'https://www.thegoodguys.com.au/lg-55-inches-oled-evo-ai-c6-4k-smart-tv-2026-oled55c6psa',detail:'OLED55C6PSA exact Australian product page',checked:'17 Aug 2026'},
    {name:'Bing Lee',url:'https://www.binglee.com.au/products/55-oledc6-evo-ai-4k-smart-tv-2026-oled55c6psa',detail:'OLED55C6PSA exact Australian product page',checked:'17 Aug 2026'}
  ],
  'apple-macbook-air-13-inch-m5':[
    {name:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/apple-macbook-air-13-inch-with-m5-chip-512gb-16gb-sky-blue',detail:'13-inch M5 · 16GB / 512GB · Sky Blue exact configuration',checked:'17 Aug 2026'},
    {name:'Officeworks',url:'https://www.officeworks.com.au/shop/officeworks/p/macbook-air-13-m5-10-core-cpu-8-core-gpu-16-512gb-silver-mbam5ts5sr',detail:'13-inch M5 · 16GB / 512GB · Silver exact configuration',checked:'17 Aug 2026'}
  ],
  'bosch-series-6-9kg-front-loader':[
    {name:'Appliances Online',url:'https://www.appliancesonline.com.au/product/bosch-series-6-9kg-front-load-washing-machine-with-i-dos-wgg244f0au/',detail:'WGG244F0AU exact Australian product page',checked:'17 Aug 2026'},
    {name:'e&s',url:'https://www.eands.com.au/bosch-wgg244f0au-9kg-front-load-washing-machine',detail:'WGG244F0AU exact Australian product page',checked:'17 Aug 2026'}
  ]
};

const independentEvidence={
  'lg-oled-evo-c6-55-inch-oled55c6psa':[
    {name:'RTINGS',url:'https://www.rtings.com/tv/reviews/lg/c6-oled-2026',detail:'Independent instrumented C6 family review; 55-inch results are stated as applicable. AU regional suffix can differ.'},
    {name:'TechRadar',url:'https://www.techradar.com/televisions/lg-c6-review',detail:'Independent hands-on C6 family review; use alongside the exact Australian manufacturer page.'}
  ],
  'apple-macbook-air-13-inch-m5':[
    {name:'WIRED',url:'https://www.wired.com/review/macbook-air-m5',detail:'Independent MacBook Air M5 family review; configuration-specific performance can vary.'},
    {name:'The Verge',url:'https://www.theverge.com/tech/894866/apple-macbook-air-m5-15-2026-laptop-review',detail:'Independent M5 Air review; 15-inch test context is not treated as exact 13-inch evidence.'}
  ],
  'apple-iphone-17':[
    {name:'The Independent',url:'https://www.the-independent.com/extras/indybest/gadgets-tech/phones-accessories/apple-iphone-17-review-b2829052.html',detail:'Independent iPhone 17 review; APG keeps retailer/customer star ratings out of suitability scoring.'}
  ]
};

const css=`
/* APG Consumer Experience v10 — final contrast, readability and national visuals */
body[data-institutional-v9=true] .apg-home-panel-label-v9{background:#f3b548!important;color:#082735!important;text-shadow:none!important;font-size:11px!important;line-height:1.25!important;letter-spacing:.055em!important;padding:8px 11px!important}
body[data-institutional-v9=true] .apg-home-decision-panel-v9 li small{color:#d3e0e1!important;font-size:12px!important;line-height:1.45!important}
body[data-institutional-v9=true] .apg-home-decision-panel-v9>a{font-size:13px!important;text-decoration-thickness:1px!important;text-underline-offset:3px}
body[data-institutional-v9=true] .apg-home-proof-v9 span{color:#c6d5d6!important;font-size:11px!important}
body[data-institutional-v9=true] .apg-home-category-v9 small,body[data-institutional-v9=true] .apg-home-governance-grid-v9 span{color:#526a72!important;font-size:11px!important;line-height:1.45!important}
body[data-institutional-v9=true] .apg-home-journey-v9 p,body[data-institutional-v9=true] .apg-home-research-v9 p{color:#506871!important;font-size:12.5px!important}
body[data-institutional-v9=true] .apg-home-trust-points-v9 p{color:#c4d3d5!important;font-size:12px!important;line-height:1.5!important}
body[data-institutional-v9=true] .apg-home-trust-copy-v9>p:not(.kicker){color:#d0dcdd!important}
body[data-institutional-v9=true] .utility{font-size:11.5px!important}
body[data-institutional-v9=true] a:focus-visible,body[data-institutional-v9=true] button:focus-visible,body[data-institutional-v9=true] input:focus-visible{outline:3px solid #b87800!important;outline-offset:3px!important}

/* Replace the historic headphone fallback with a truthful category scene. */
.product-visual[data-product-category="televisions"] .category-icon svg,
.product-visual[data-product-category="laptops"] .category-icon svg,
.product-visual[data-product-category="washing-machines"] .category-icon svg,
.product-visual[data-product-category="fridges"] .category-icon svg,
.product-visual[data-product-category="dishwashers"] .category-icon svg,
.product-visual[data-product-category="smartphones"] .category-icon svg{display:none!important}
.product-visual[data-product-category="televisions"] .product-art,.product-visual[data-product-category="laptops"] .product-art,.product-visual[data-product-category="washing-machines"] .product-art,.product-visual[data-product-category="fridges"] .product-art,.product-visual[data-product-category="dishwashers"] .product-art,.product-visual[data-product-category="smartphones"] .product-art{background:linear-gradient(150deg,#e7f4f1,#f8fbfa)!important;color:#087c76!important}
.apg-v10-glyph{width:44px;height:44px;display:grid;place-items:center;color:#087c76}.apg-v10-glyph svg{width:36px;height:36px;display:block!important}

.apg-v10-retailers,.apg-v10-independent{margin:18px 0 0;border:1px solid #d9e4e2;border-radius:14px;background:#f8fbfa;padding:16px}
.apg-v10-retailers h3,.apg-v10-independent h3{margin:0 0 5px!important;font-size:15px!important;color:#082735!important}.apg-v10-retailers>p,.apg-v10-independent>p{font-size:11.5px!important;color:#536b73!important;margin:0 0 11px!important}
.apg-v10-evidence-list{display:grid;gap:8px}.apg-v10-evidence-link{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid #dbe6e4;border-radius:11px;background:#fff;text-decoration:none;color:#082735}.apg-v10-evidence-link:hover{border-color:#8fb7b1;background:#f3faf8}.apg-v10-evidence-mark{width:34px;height:34px;border-radius:10px;background:#e8f4f1;color:#087c76;display:grid;place-items:center;font-weight:900}.apg-v10-evidence-link strong{font-size:12.5px}.apg-v10-evidence-link small{display:block;margin-top:2px;color:#5a7078;font-size:10.5px;line-height:1.35}.apg-v10-evidence-link b{font-size:11px;color:#087c76;white-space:nowrap}

/* National category icons in category cards and search hubs. */
.apg-v10-category-glyph{width:58px;height:58px;border-radius:16px;background:#eaf5f2;color:#087c76;display:grid;place-items:center}.apg-v10-category-glyph svg{width:36px;height:36px}

@media(max-width:640px){body[data-institutional-v9=true] .apg-home-panel-label-v9{font-size:10.5px!important;max-width:100%;white-space:normal}.apg-v10-evidence-link{grid-template-columns:36px minmax(0,1fr)}.apg-v10-evidence-link>b{grid-column:2}.apg-v10-retailers,.apg-v10-independent{padding:13px}}
@media(forced-colors:active){body[data-institutional-v9=true] .apg-home-panel-label-v9{border:2px solid ButtonText}.apg-v10-evidence-link{border:1px solid ButtonText}}
`;

const glyphs={
  televisions:'<rect x="9" y="13" width="46" height="31" rx="3"/><path d="M25 52h14m-7-8v8"/>',
  laptops:'<rect x="13" y="10" width="38" height="29" rx="3"/><path d="M7 45h50l-4 8H11l-4-8Zm18 0 2 3h10l2-3"/>',
  'washing-machines':'<rect x="13" y="8" width="38" height="48" rx="5"/><circle cx="32" cy="35" r="13"/><circle cx="32" cy="35" r="8"/><path d="M20 16h10m8 0h5"/>',
  fridges:'<rect x="19" y="6" width="27" height="52" rx="4"/><path d="M19 31h27M39 19v7m0 11v7"/>',
  dishwashers:'<rect x="13" y="8" width="38" height="48" rx="4"/><path d="M13 20h38M20 30h24M22 38c6-5 14-5 20 0M22 47h20"/>',
  smartphones:'<rect x="20" y="5" width="24" height="54" rx="6"/><path d="M28 11h8M31 52h2"/><circle cx="38" cy="15" r="2"/>'
};
const glyphSvg=slug=>`<span class="apg-v10-glyph" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${glyphs[slug]||''}</svg></span>`;

const clientJs=`(()=>{
const glyphs=${JSON.stringify(glyphs)};
const svg=s=>'<span class="apg-v10-glyph" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">'+(glyphs[s]||'')+'</svg></span>';
function fixProductVisuals(){document.querySelectorAll('.product-visual[data-product-category]').forEach(v=>{const s=v.getAttribute('data-product-category');if(!glyphs[s])return;const icon=v.querySelector('.category-icon');if(icon)icon.outerHTML=svg(s);const art=v.querySelector('.product-art');if(art){art.className='product-art art-'+s;art.setAttribute('data-v10-category',s);}});}
function fixCategoryCards(){document.querySelectorAll('.category-card').forEach(card=>{const a=card.querySelector('a[href^="/categories/"]');if(!a)return;const m=a.getAttribute('href').match(/^\\/categories\\/([^/]+)\\//);const s=m&&m[1];if(!glyphs[s])return;const old=card.querySelector('.category-icon');if(old){const el=document.createElement('span');el.className='apg-v10-category-glyph';el.setAttribute('aria-hidden','true');el.innerHTML='<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">'+glyphs[s]+'</svg>';old.replaceWith(el);}});}
function tightenSearch(){if(!location.pathname.startsWith('/search/'))return;const interpretation=[...document.querySelectorAll('.search-interpretation .pill')].map(x=>x.textContent.trim().toLowerCase());const map={televisions:'televisions',laptops:'laptops','washing machines':'washing-machines',fridges:'fridges',dishwashers:'dishwashers',smartphones:'smartphones'};const slug=interpretation.map(x=>map[x]).find(Boolean);if(!slug)return;const cards=[...document.querySelectorAll('.search-groups .product-card')];let kept=0;cards.forEach(card=>{const v=card.querySelector('.product-visual[data-product-category]');if(v&&v.getAttribute('data-product-category')!==slug)card.hidden=true;else kept++;});const heading=document.querySelector('.search-groups section .section-head h2');if(heading&&kept)heading.textContent=kept+' highly relevant maintained products';}
fixProductVisuals();fixCategoryCards();tightenSearch();
})();`;

function pathOf(req){try{return new URL(req.url,'https://australianproductguide.au').pathname}catch{return '/'}}
function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body)}
function injectHead(body){if(!body.includes('/assets/consumer-v10.css'))body=body.replace('</head>','<link rel="stylesheet" href="/assets/consumer-v10.css"></head>');return body}
function injectBody(body){if(!body.includes('/assets/consumer-v10.js'))body=body.replace('</body>','<script src="/assets/consumer-v10.js" defer></script></body>');return body}
function productSlug(path){const m=path.match(/^\/products\/([^/]+)\/?$/);return m?m[1]:null}
function retailerBlock(slug){const rows=exactRetailerEvidence[slug];if(!rows)return '';return `<section class="apg-v10-retailers" aria-label="Verified Australian retailer options"><h3>Verified Australian retailer options</h3><p>Exact model/configuration pages checked independently. These links are non-affiliate unless explicitly labelled otherwise; retailer presence contributes zero recommendation points.</p><div class="apg-v10-evidence-list">${rows.map(r=>`<a class="apg-v10-evidence-link" href="${r.url}" rel="nofollow noopener" target="_blank"><span class="apg-v10-evidence-mark">AU</span><span><strong>${r.name}</strong><small>${r.detail} · checked ${r.checked}</small></span><b>View exact page ↗</b></a>`).join('')}</div></section>`}
function independentBlock(slug){const rows=independentEvidence[slug];if(!rows)return '';return `<section class="apg-v10-independent" aria-label="Independent evidence"><h3>Independent evidence</h3><p>Manufacturer evidence establishes the exact Australian model. Independent reviews are shown separately and never converted into an APG hands-on-testing claim.</p><div class="apg-v10-evidence-list">${rows.map(r=>`<a class="apg-v10-evidence-link" href="${r.url}" rel="noopener" target="_blank"><span class="apg-v10-evidence-mark">i</span><span><strong>${r.name}</strong><small>${r.detail}</small></span><b>Review evidence ↗</b></a>`).join('')}</div></section>`}
function enrichProduct(body,slug){const add=retailerBlock(slug)+independentBlock(slug);if(!add)return body;const retailer=/<section class="retailer-panel">[\s\S]*?<\/section>/;if(retailer.test(body))return body.replace(retailer,m=>m+add);const evidence=/<aside class="evidence-box">[\s\S]*?<\/aside>/;if(evidence.test(body))return body.replace(evidence,m=>m+add);return body}

module.exports=(req,res)=>{
  const path=pathOf(req);
  if(path==='/assets/consumer-v10.css')return sendAsset(req,res,'text/css; charset=utf-8',css);
  if(path==='/assets/consumer-v10.js')return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){body=injectHead(body);body=injectBody(body);const slug=productSlug(path);if(slug)body=enrichProduct(body,slug);}return end(body,...args)};
  return base(req,res);
};
module.exports.css=css;module.exports.clientJs=clientJs;
