const brandPolish=require('./brand-polish');
const {categories,products}=require('../data');
const {brands}=require('./routes');
const {categoryGlyph}=require('./brand-v7');

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const groups=[
  ['Home & kitchen',[
    ['coffee-machines','Coffee machines'],['air-fryers','Air fryers'],['robot-vacuums','Robot vacuums'],['stick-vacuums','Stick vacuums'],['air-purifiers','Air purifiers'],['blenders','Blenders'],['portable-air-conditioners','Portable air conditioners']
  ]],
  ['Tech & entertainment',[
    ['computer-monitors','Computer monitors'],['mesh-wifi-systems','Mesh Wi-Fi'],['tablets','Tablets'],['wireless-headphones','Wireless headphones'],['earbuds','Earbuds'],['soundbars','Soundbars'],['projectors','Projectors']
  ]],
  ['Work & gaming',[
    ['office-chairs','Office chairs'],['standing-desks','Standing desks'],['mechanical-keyboards','Mechanical keyboards'],['computer-mice','Computer mice'],['gaming-monitors','Gaming monitors'],['gaming-headsets','Gaming headsets'],['webcams','Webcams']
  ]],
  ['Lifestyle & home',[
    ['smartwatches','Smartwatches'],['fitness-trackers','Fitness trackers'],['luggage','Luggage'],['home-security-cameras','Home security cameras'],['smart-doorbells','Smart doorbells'],['portable-power-stations','Portable power stations'],['home-fitness-equipment','Home fitness equipment']
  ]]
];

function productLink(slug,label){
  return `<a class="apg-mega-category" href="/categories/${esc(slug)}/"><span class="apg-mega-icon" aria-hidden="true">${categoryGlyph(slug)}</span><span>${esc(label)}</span></a>`;
}
function groupHtml([title,items]){
  return `<section class="apg-mega-group"><h3>${esc(title)}</h3><div class="apg-mega-links">${items.map(([slug,label])=>productLink(slug,label)).join('')}</div></section>`;
}
function megaHtml(){
  return `<div id="megaProducts" class="apg-discovery-menu" data-discovery-menu hidden><div class="apg-mega-shell"><div class="apg-mega-head"><div><span class="apg-mega-eyebrow">Browse products</span><strong>Find the right category faster</strong><small>Start with a product type, or use Decision Lab when your need matters more than the category.</small></div><div class="apg-mega-head-actions"><a href="/categories/">All ${Object.keys(categories).length} categories</a><a class="apg-mega-decision" href="/decision-lab/">Open Decision Lab <span aria-hidden="true">→</span></a></div></div><div class="apg-mega-grid">${groups.map(groupHtml).join('')}</div><div class="apg-mega-footer"><div class="apg-mega-stats"><strong>${products.length}</strong><span>maintained products</span><strong>${Object.keys(categories).length}</strong><span>populated categories</span><strong>${brands.length}</strong><span>brands</span></div><nav aria-label="More product research"><a href="/compare/">Compare products</a><a href="/guides/">Buying guides</a><a href="/brands/">Brands</a><a href="/retailers/">Retailer approach</a><a href="/methodology/">How we compare</a></nav></div></div></div>`;
}
function primaryNav(){
  return `<nav class="primary-nav apg-nav-v8" aria-label="Primary"><div class="wrap nav-inner"><button id="apgProductsMenuButton" type="button" class="nav-trigger apg-products-trigger" data-discovery-trigger aria-controls="megaProducts" aria-expanded="false">Products <span class="apg-nav-chevron" aria-hidden="true">⌄</span></button><a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a><a href="/compare/">Compare</a><a href="/guides/">Buying guides</a><a href="/brands/">Brands</a><a href="/retailers/">Retailers</a><a class="nav-trust" href="/methodology/">How we compare</a></div></nav>`;
}
function mobileSearch(){
  return `<form class="global-search apg-mobile-search" action="/search/" method="get" role="search" data-search-shell><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg><label class="sr-only" for="apgMobileSearchV8">Search Australian Product Guide</label><input id="apgMobileSearchV8" data-site-search name="q" type="search" placeholder="Search products, categories or comparisons" autocomplete="off" aria-autocomplete="list" aria-controls="apgMobileSearchV8Suggestions" aria-expanded="false"><button type="submit">Search</button><div id="apgMobileSearchV8Suggestions" class="search-suggestions" data-search-suggestions role="listbox" hidden></div></form>`;
}
function mobileSection(title,items){return `<details class="mobile-section"><summary>${esc(title)}</summary><div>${items.map(([label,url])=>`<a href="${url}">${esc(label)}<span aria-hidden="true">→</span></a>`).join('')}</div></details>`;}
function mobileNav(){
  return `<nav id="mobileNav" class="mobile-nav apg-mobile-v8" hidden aria-label="Mobile"><div class="wrap mobile-nav-inner">${mobileSearch()}<a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a>${mobileSection('Popular products',[["All categories","/categories/"],["Coffee machines","/categories/coffee-machines/"],["Robot vacuums","/categories/robot-vacuums/"],["Computer monitors","/categories/computer-monitors/"],["Wireless headphones","/categories/wireless-headphones/"],["Office chairs","/categories/office-chairs/"],["Smartwatches","/categories/smartwatches/"],["Portable power stations","/categories/portable-power-stations/"]])}${mobileSection('Research & compare',[["Compare products","/compare/"],["Buying guides","/guides/"],["Brands","/brands/"],["Retailer approach","/retailers/"],["My Australian Product Guide","/my-apg/"]])}${mobileSection('Trust & transparency',[["How we compare","/methodology/"],["Editorial standards","/editorial-standards/"],["Sources","/sources/"],["Coverage","/coverage/"],["Updates","/updates/"]])}</div></nav>`;
}
function replaceBetween(html,startNeedle,endNeedle,replacement){const start=html.indexOf(startNeedle);if(start<0)return html;const end=html.indexOf(endNeedle,start);if(end<0)return html;return html.slice(0,start)+replacement+html.slice(end);}
function upgradeNavigation(html){
  html=html.replace(/<nav class="primary-nav" aria-label="Primary"><div class="wrap nav-inner">[\s\S]*?<\/div><\/nav>/,primaryNav());
  html=replaceBetween(html,'<div id="megaProducts">','<nav id="mobileNav"',megaHtml());
  const mobileStart=html.indexOf('<nav id="mobileNav"');
  const mobileEnd=html.indexOf('</nav></header>',mobileStart);
  if(mobileStart>=0&&mobileEnd>=0)html=html.slice(0,mobileStart)+mobileNav()+html.slice(mobileEnd+6);
  return html;
}

const navigationCss=`
/* Australian Product Guide navigation platform v8 */
.global-search input,.global-search input:hover,.global-search input:focus,.global-search input:focus-visible{border:0!important;outline:0!important;box-shadow:none!important;border-radius:0!important;background:transparent!important;-webkit-appearance:none!important;appearance:none!important}
.global-search input::-webkit-search-decoration,.global-search input::-webkit-search-cancel-button{-webkit-appearance:none}
.global-search{overflow:visible!important}.global-search:focus-within{outline:0!important}
.site-header .global-search{grid-template-columns:38px minmax(0,1fr) auto!important;padding:4px!important;min-height:50px!important;border-radius:15px!important}
.site-header .global-search svg{margin-left:9px!important}.site-header .global-search input{padding:10px 8px!important;min-height:40px!important}.site-header .global-search button{margin:0!important;min-height:42px!important;border-radius:11px!important;padding:0 19px!important}
.home-hero .global-search,.hero .global-search{padding:4px!important}.home-hero .global-search button,.hero .global-search button{margin:0!important;border-radius:11px!important}
.apg-nav-v8{position:relative!important}.apg-nav-v8 .nav-inner{min-height:51px!important;gap:2px!important}.apg-nav-v8 .nav-inner>a,.apg-nav-v8 .nav-trigger{min-height:40px!important;display:inline-flex!important;align-items:center!important;padding:9px 13px!important;border-radius:9px!important;text-decoration:none!important;white-space:nowrap}.apg-nav-v8 .nav-inner>a:hover,.apg-nav-v8 .nav-trigger:hover,.apg-nav-v8 .nav-trigger[aria-expanded=true]{background:#e7f5f1!important;color:#08786f!important}.apg-nav-v8 .nav-trust{margin-left:auto!important}.apg-nav-chevron{font-size:15px;line-height:1;transition:transform .16s ease}.apg-products-trigger[aria-expanded=true] .apg-nav-chevron{transform:rotate(180deg)}
.apg-discovery-menu{position:absolute;left:0;right:0;top:100%;z-index:160;padding:0 20px 22px;background:transparent}.apg-discovery-menu[hidden]{display:none!important}.apg-mega-shell{width:min(1380px,calc(100vw - 32px));margin:0 auto;background:#fff;border:1px solid #d9e4e2;border-top:0;border-radius:0 0 24px 24px;box-shadow:0 30px 72px rgba(7,38,53,.19);overflow:hidden}.apg-mega-head{display:flex;align-items:center;justify-content:space-between;gap:30px;padding:20px 24px 18px;border-bottom:1px solid #e8efed;background:linear-gradient(90deg,#fbfdfc,#f5faf8)}.apg-mega-head>div:first-child{display:grid;gap:2px}.apg-mega-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.11em;font-weight:850;color:#08786f}.apg-mega-head strong{font-size:17px;color:#092b3d;letter-spacing:-.015em}.apg-mega-head small{font-size:11px;color:#60747b}.apg-mega-head-actions{display:flex;align-items:center;gap:9px;flex:0 0 auto}.apg-mega-head-actions a{display:inline-flex;align-items:center;min-height:38px;padding:8px 12px;border:1px solid #d6e3e0;border-radius:10px;background:#fff;color:#123f50;text-decoration:none;font-size:11.5px;font-weight:760}.apg-mega-head-actions a:hover{background:#e7f5f1;border-color:#b7d5cf}.apg-mega-head-actions .apg-mega-decision{background:#092b3d;color:#fff;border-color:#092b3d}.apg-mega-head-actions .apg-mega-decision:hover{background:#0e6264;color:#fff}
.apg-mega-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;padding:0!important}.apg-mega-group{padding:20px 18px 22px;min-width:0}.apg-mega-group+.apg-mega-group{border-left:1px solid #edf2f1}.apg-mega-group h3{margin:0 0 9px;padding:0 7px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5f7479}.apg-mega-links{display:grid;gap:2px}.apg-mega-category{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:9px;min-height:43px;padding:5px 7px;border-radius:11px;color:#123f50!important;text-decoration:none!important;font-size:12.5px;font-weight:690}.apg-mega-category:hover,.apg-mega-category:focus-visible{background:#edf7f4!important;color:#08786f!important}.apg-mega-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;background:#eef7f4;color:#08786f}.apg-mega-icon svg{width:22px;height:22px;stroke-width:2.5}.apg-mega-group:nth-child(2) .apg-mega-icon{background:#eef3f8;color:#276d97}.apg-mega-group:nth-child(3) .apg-mega-icon{background:#f1eef8;color:#6954a3}.apg-mega-group:nth-child(4) .apg-mega-icon{background:#fbf1df;color:#a5682c}
.apg-mega-footer{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:14px 24px;background:#f8faf9;border-top:1px solid #e6eeec}.apg-mega-stats{display:flex;align-items:baseline;gap:7px;color:#60747b;font-size:10.5px;white-space:nowrap}.apg-mega-stats strong{color:#092b3d;font-size:13px;margin-left:8px}.apg-mega-stats strong:first-child{margin-left:0}.apg-mega-footer nav{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.apg-mega-footer nav a{padding:6px 8px;border-radius:8px;color:#315463;text-decoration:none;font-size:10.5px;font-weight:720}.apg-mega-footer nav a:hover{background:#e7f5f1;color:#08786f}
body.apg-discovery-open{overflow-x:hidden}.apg-mobile-v8 .apg-mobile-search{margin:3px 0 14px}.apg-mobile-v8 .mobile-section a{font-weight:650}
@media(max-width:1120px){.apg-nav-v8 .nav-inner>a,.apg-nav-v8 .nav-trigger{padding-inline:10px!important;font-size:12.5px!important}.apg-mega-shell{width:calc(100vw - 24px)}.apg-mega-head small{display:none}.apg-mega-footer{align-items:flex-start;flex-direction:column}.apg-mega-footer nav{justify-content:flex-start}}
@media(max-width:920px){.apg-nav-v8,.apg-discovery-menu{display:none!important}.site-header .global-search{padding:3px!important}.apg-mobile-v8{display:block}.apg-mobile-v8[hidden]{display:none!important}}
@media(max-width:640px){.site-header .global-search{grid-template-columns:34px minmax(0,1fr) auto!important}.site-header .global-search button{padding-inline:14px!important}.apg-mobile-v8 .global-search button{font-size:12px!important}}
`;

const navigationJs=`(()=>{
const trigger=document.querySelector('[data-discovery-trigger]');
const menu=document.querySelector('[data-discovery-menu]');
if(!trigger||!menu)return;
let openTimer=0,closeTimer=0;
const desktop=()=>window.matchMedia('(min-width:921px)').matches;
const clearTimers=()=>{clearTimeout(openTimer);clearTimeout(closeTimer)};
function setOpen(open,focusFirst=false){
  clearTimers();
  if(!desktop())open=false;
  menu.hidden=!open;
  trigger.setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('apg-discovery-open',open);
  if(open&&focusFirst)setTimeout(()=>menu.querySelector('a')?.focus(),0);
}
function openSoon(){clearTimeout(closeTimer);clearTimeout(openTimer);openTimer=setTimeout(()=>setOpen(true),80)}
function closeSoon(){clearTimeout(openTimer);clearTimeout(closeTimer);closeTimer=setTimeout(()=>setOpen(false),190)}
trigger.addEventListener('click',event=>{event.preventDefault();setOpen(trigger.getAttribute('aria-expanded')!=='true')});
trigger.addEventListener('mouseenter',()=>{if(desktop())openSoon()});
trigger.addEventListener('mouseleave',event=>{if(!menu.contains(event.relatedTarget))closeSoon()});
trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();setOpen(true,true)}else if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.focus()}});
menu.addEventListener('mouseenter',()=>{clearTimeout(closeTimer)});
menu.addEventListener('mouseleave',event=>{if(!trigger.contains(event.relatedTarget))closeSoon()});
menu.addEventListener('focusin',()=>{clearTimeout(closeTimer);if(desktop())setOpen(true)});
menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.focus()}});
document.addEventListener('click',event=>{if(!menu.hidden&&!menu.contains(event.target)&&!trigger.contains(event.target))setOpen(false)});
window.addEventListener('resize',()=>{if(!desktop())setOpen(false)},{passive:true});
})();`;

function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);}
function injectAssets(body){
  if(!body.includes('/assets/navigation-v8.css'))body=body.replace('</head>','<link rel="stylesheet" href="/assets/navigation-v8.css"></head>');
  if(!body.includes('/assets/navigation-v8.js'))body=body.replace('</body>','<script src="/assets/navigation-v8.js" defer></script></body>');
  return body;
}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path==='/assets/navigation-v8.css')return sendAsset(req,res,'text/css; charset=utf-8',navigationCss);
  if(path==='/assets/navigation-v8.js')return sendAsset(req,res,'application/javascript; charset=utf-8',navigationJs);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=injectAssets(upgradeNavigation(body));
    return originalEnd(body,...args);
  };
  return brandPolish(req,res);
};

module.exports.upgradeNavigation=upgradeNavigation;
