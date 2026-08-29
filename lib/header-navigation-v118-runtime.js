'use strict';

// APG Header Navigation v118.0
// Consumer-navigation enhancement inspired by familiar marketplace interaction patterns,
// while retaining APG branding, SSR-first architecture and independent recommendation logic.
// Adds: two-tier desktop alignment, category-aware search selector, accessible left drawer,
// and compact account placement. No recommendation, retailer or evidence scoring is changed.
const {categories}=require('../data');

const VERSION='118.0';
const CSS_PATH='/assets/header-navigation-v118.css';
const JS_PATH='/assets/header-navigation-v118.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const allCategories=Object.values(categories).filter(Boolean).sort((a,b)=>String(a.label||a.slug).localeCompare(String(b.label||b.slug),'en-AU'));
const popular=['coffee-machines','air-fryers','robot-vacuums','wireless-headphones','televisions','earbuds','smartwatches','laptops','tablets','stick-vacuums','air-purifiers','office-chairs'];
const sections=[
  ['Home & kitchen',['coffee-machines','air-fryers','robot-vacuums','stick-vacuums','air-purifiers','blenders','kitchen-mixers','rice-cookers','multicookers','water-filters','portable-air-conditioners']],
  ['Tech & entertainment',['televisions','computer-monitors','wireless-headphones','earbuds','soundbars','projectors','bluetooth-speakers','tablets','e-readers','webcams','microphones','external-ssds','power-banks','portable-monitors']],
  ['Work & gaming',['office-chairs','standing-desks','mechanical-keyboards','computer-mice','gaming-monitors','gaming-headsets','mesh-wifi-systems']],
  ['Lifestyle & home',['smartwatches','fitness-trackers','luggage','home-security-cameras','smart-doorbells','portable-power-stations','home-fitness-equipment','automatic-pet-feeders','baby-monitors','electric-toothbrushes','hair-dryers','electric-shavers']],
  ['Tools & outdoors',['cordless-drills','pressure-washers','dash-cameras','vacuum-sealers','dehumidifiers']]
];

function categoryRow(slug){const c=categories[slug];if(!c)return '';return `<a class="apg-drawer-link" href="/categories/${esc(slug)}/"><span>${esc(c.label||slug)}</span><span aria-hidden="true">›</span></a>`;}
function categoryOptions(){return [`<option value="">All</option>`,...allCategories.map(c=>`<option value="${esc(c.slug)}">${esc(c.label||c.slug)}</option>`)].join('');}
function drawer(){
  const popularRows=popular.map(categoryRow).filter(Boolean).join('');
  const grouped=sections.map(([title,slugs])=>{const rows=slugs.map(categoryRow).filter(Boolean).join('');return rows?`<section class="apg-drawer-section"><h3>${esc(title)}</h3>${rows}</section>`:'';}).join('');
  return `<div class="apg-drawer-backdrop" data-apg-drawer-backdrop hidden></div><aside id="apgAllDrawer" class="apg-all-drawer" data-apg-all-drawer hidden aria-label="All Australian Product Guide navigation"><div class="apg-drawer-account"><a href="/my-apg/"><span class="apg-drawer-user-icon" aria-hidden="true">●</span><span><strong>Your APG</strong><small>Log in, join or open your account</small></span><span aria-hidden="true">›</span></a></div><div class="apg-drawer-scroll"><section class="apg-drawer-section"><h3>Popular now</h3>${popularRows}</section>${grouped}<section class="apg-drawer-section"><h3>Research & compare</h3><a class="apg-drawer-link" href="/decision-lab/"><span>Decision Lab</span><span aria-hidden="true">›</span></a><button class="apg-drawer-link apg-drawer-scout" type="button" data-apg-system-scout><span>Ask Scout</span><span aria-hidden="true">›</span></button><a class="apg-drawer-link" href="/compare/"><span>Compare products</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/guides/"><span>Buying guides</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/brands/"><span>Brands</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/retailers/"><span>Retailers</span><span aria-hidden="true">›</span></a></section><section class="apg-drawer-section"><h3>About & trust</h3><a class="apg-drawer-link" href="/about/"><span>About us</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/methodology/"><span>How we compare</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/editorial-standards/"><span>Editorial standards</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/sources/"><span>Sources</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link" href="/contact/"><span>Contact us</span><span aria-hidden="true">›</span></a></section><section class="apg-drawer-section apg-drawer-all"><h3>All categories</h3>${allCategories.map(c=>categoryRow(c.slug)).join('')}</section></div></aside>`;
}

function enhanceSearch(html){
  return String(html||'').replace(/(<div\b[^>]*class=["'][^"']*\bheader-search\b[^"']*["'][^>]*>[\s\S]*?<form\b[^>]*class=["'][^"']*\bglobal-search\b[^"']*["'][^>]*>)/i,(match)=>{
    if(/data-apg-search-category/.test(match))return match;
    return match+`<label class="sr-only" for="apgHeaderSearchCategory">Search category</label><select id="apgHeaderSearchCategory" class="apg-search-category" data-apg-search-category aria-label="Search category">${categoryOptions()}</select>`;
  });
}
function enhancePrimaryNav(html){
  let out=String(html||'');
  out=out.replace(/<button\b([^>]*?)data-discovery-trigger([^>]*)>([\s\S]*?)<\/button>/i,(m,a,b)=>`<button${a}data-apg-drawer-trigger${b} aria-controls="apgAllDrawer" aria-expanded="false"><span class="apg-all-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>All</span></button>`);
  out=out.replace(/<button\b([^>]*?)class=["']nav-trigger["']([^>]*?)data-mega-trigger([^>]*)>([\s\S]*?)<\/button>/i,(m,a,b,c)=>`<button${a}class="nav-trigger apg-all-trigger"${b}data-apg-drawer-trigger${c} aria-controls="apgAllDrawer" aria-expanded="false"><span class="apg-all-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>All</span></button>`);
  out=out.replace(/<button\b([^>]*?)class=["'][^"']*apg-products-trigger[^"']*["']([^>]*)>([\s\S]*?)<\/button>/i,(m,a,b)=>`<button${a}class="nav-trigger apg-all-trigger"${b.replace(/data-discovery-trigger/g,'data-apg-drawer-trigger')} aria-controls="apgAllDrawer" aria-expanded="false"><span class="apg-all-icon" aria-hidden="true"><i></i><i></i><i></i></span><span>All</span></button>`);
  return out;
}
function hideLegacyMega(html){return String(html||'').replace(/<div\b([^>]*?)id=["']megaProducts["']([^>]*)>/i,'<div$1id="megaProducts"$2 data-apg-legacy-mega>');}
function injectDrawer(html){let out=String(html||'');if(out.includes('data-apg-all-drawer'))return out;return out.replace('</header>',`</header>${drawer()}`);}
function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-navigation"')){
    const assets=`<meta name="apg-header-navigation" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}">`;
    const scout='<link rel="stylesheet" href="/assets/scout-navigator-v7-global.css?v=7.1">';
    out=out.includes(scout)?out.replace(scout,assets+scout):out.replace('</head>',assets+'</head>');
  }
  if(!out.includes(`src="${JS_PATH}`))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function transform(html){return injectAssets(injectDrawer(hideLegacyMega(enhancePrimaryNav(enhanceSearch(html)))));}

const CSS=String.raw`
/* APG Header Navigation v118.0 */
:root{--apg-header-navy:#071d2c;--apg-header-navy-2:#0b2b3d;--apg-header-blue:#2563eb;--apg-header-line:rgba(255,255,255,.14)}
body.apg-drawer-open{overflow:hidden}
.site-header .masthead{display:grid!important;grid-template-columns:minmax(188px,240px) minmax(320px,1fr) auto!important;align-items:center!important;gap:18px!important;min-height:72px!important;padding-top:10px!important;padding-bottom:10px!important}
.site-header .header-search{min-width:0!important;align-self:center!important}
.site-header .header-search .global-search{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;gap:0!important;padding:0!important;min-height:48px!important;border-radius:11px!important;overflow:visible!important;background:#fff!important;border:2px solid transparent!important;box-shadow:0 5px 18px rgba(0,0,0,.16)!important}
.site-header .header-search .global-search:focus-within{border-color:#f2b84b!important;box-shadow:0 0 0 2px rgba(242,184,75,.24)!important}
.site-header .header-search .global-search>svg{display:none!important}
.site-header .header-search .apg-search-category{appearance:auto!important;width:auto!important;max-width:165px!important;min-width:72px!important;min-height:44px!important;margin:0!important;padding:0 28px 0 12px!important;border:0!important;border-right:1px solid #d7dee3!important;border-radius:9px 0 0 9px!important;background:#f3f4f6!important;color:#334155!important;font:inherit!important;font-size:12px!important;font-weight:700!important;outline:0!important;cursor:pointer!important}
.site-header .header-search .global-search>input[type="search"]{min-height:44px!important;padding:0 14px!important;font-size:14px!important;font-weight:560!important;color:#0f172a!important;background:#fff!important}
.site-header .header-search .global-search>button[type="submit"]{min-width:54px!important;min-height:44px!important;padding:0 15px!important;border:0!important;border-radius:0 9px 9px 0!important;background:#f2b84b!important;color:#071d2c!important;font-size:0!important;box-shadow:none!important;position:relative!important}
.site-header .header-search .global-search>button[type="submit"]:after{content:"⌕";font-size:25px;font-weight:800;line-height:1}
.site-header .header-search .global-search>button[type="submit"]:hover{background:#e9a92e!important;transform:none!important}
.site-header .apg-member-actions-v19,.site-header .header-actions{align-self:center!important;margin:0!important}
.site-header .apg-member-actions-v19{gap:5px!important}.site-header .apg-member-actions-v19 a{min-height:42px!important;padding:0 11px!important;background:transparent!important;border-color:transparent!important;color:#fff!important;box-shadow:none!important}.site-header .apg-member-actions-v19 a:hover{background:rgba(255,255,255,.09)!important;border-color:var(--apg-header-line)!important}.site-header .apg-member-join-v19{font-weight:850!important}
.site-header .primary-nav{background:var(--apg-header-navy-2)!important;border-top:1px solid rgba(255,255,255,.08)!important}.site-header .primary-nav .nav-inner{justify-content:flex-start!important;gap:2px!important;overflow-x:auto!important;scrollbar-width:none}.site-header .primary-nav .nav-inner::-webkit-scrollbar{display:none}.site-header .primary-nav a,.site-header .primary-nav button,.site-header .apg-about-trust-menu>summary{color:#fff!important}
.site-header .apg-all-trigger,[data-apg-drawer-trigger]{display:inline-flex!important;align-items:center!important;gap:7px!important;font-weight:850!important}.apg-all-icon{display:inline-grid;gap:3px;width:17px}.apg-all-icon i{display:block;height:2px;background:currentColor;border-radius:2px;width:17px}
[data-apg-legacy-mega]{display:none!important}
.apg-drawer-backdrop{position:fixed;inset:0;z-index:1980;background:rgba(3,12,18,.66);backdrop-filter:blur(1px)}.apg-drawer-backdrop[hidden],.apg-all-drawer[hidden]{display:none!important}
.apg-all-drawer{position:fixed;z-index:1990;inset:0 auto 0 0;width:min(390px,92vw);background:#fff;color:#17212b;box-shadow:18px 0 55px rgba(0,0,0,.25);display:flex;flex-direction:column;transform:translateX(0)}
.apg-drawer-account{background:linear-gradient(135deg,#082735,#0e4856);color:#fff}.apg-drawer-account>a{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:10px;padding:18px 20px;color:#fff;text-decoration:none}.apg-drawer-user-icon{width:31px;height:31px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;font-size:9px;color:#fff}.apg-drawer-account strong{display:block;font-size:17px}.apg-drawer-account small{display:block;margin-top:2px;color:#d9e7eb;font-size:11px}
.apg-drawer-scroll{overflow:auto;overscroll-behavior:contain;padding-bottom:30px}.apg-drawer-section{padding:16px 0 9px;border-bottom:1px solid #e5e7eb}.apg-drawer-section h3{margin:0;padding:0 22px 9px;color:#182433;font-size:15px;font-weight:850}.apg-drawer-link{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:9px 22px;border:0;background:#fff;color:#24313b;text-align:left;text-decoration:none;font:inherit;font-size:13px;cursor:pointer}.apg-drawer-link:hover,.apg-drawer-link:focus-visible{background:#f3f6f8;color:#0b5f88;outline:0}.apg-drawer-link>span:last-child{color:#64748b;font-size:20px}.apg-drawer-scout{font-weight:760}.apg-drawer-all{padding-bottom:22px}
@media(max-width:1120px){.site-header .masthead{grid-template-columns:185px minmax(260px,1fr) auto!important;gap:10px!important}.site-header .header-search .apg-search-category{max-width:125px!important}.site-header .apg-member-actions-v19 a{padding-inline:8px!important}}
@media(max-width:920px){.site-header .masthead{display:flex!important;min-height:auto!important}.site-header .header-search{display:none!important}.site-header .primary-nav{display:none!important}.site-header .apg-member-actions-v19{display:none!important}.apg-all-drawer{width:min(370px,94vw)}}
@media(max-width:520px){.apg-all-drawer{width:94vw}.apg-drawer-account>a{padding:16px}.apg-drawer-section h3,.apg-drawer-link{padding-left:18px;padding-right:18px}}
@media(prefers-reduced-motion:reduce){.apg-all-drawer,.apg-drawer-backdrop{transition:none!important}}
`;

const JS=String.raw`
'use strict';(()=>{
  if(window.__APG_HEADER_NAV_V118__)return;window.__APG_HEADER_NAV_V118__='${VERSION}';
  const drawer=document.querySelector('[data-apg-all-drawer]'),backdrop=document.querySelector('[data-apg-drawer-backdrop]');
  const triggers=[...document.querySelectorAll('[data-apg-drawer-trigger]')];
  let lastTrigger=null;
  function focusables(){return drawer?[...drawer.querySelectorAll('a[href],button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]:[]}
  function setOpen(open,trigger){if(!drawer||!backdrop)return;if(open){lastTrigger=trigger||document.activeElement;drawer.hidden=false;backdrop.hidden=false;document.body.classList.add('apg-drawer-open');triggers.forEach(t=>t.setAttribute('aria-expanded','true'));setTimeout(()=>focusables()[0]?.focus(),0)}else{drawer.hidden=true;backdrop.hidden=true;document.body.classList.remove('apg-drawer-open');triggers.forEach(t=>t.setAttribute('aria-expanded','false'));lastTrigger?.focus?.()}}
  triggers.forEach(t=>t.addEventListener('click',e=>{e.preventDefault();setOpen(drawer?.hidden!==false,t)}));
  backdrop?.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{if(drawer?.hidden!==false)return;if(e.key==='Escape'){e.preventDefault();setOpen(false);return}if(e.key==='Tab'){const items=focusables();if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
  drawer?.addEventListener('click',e=>{const target=e.target.closest('a[href]');if(target)setOpen(false)});
  const select=document.querySelector('.site-header [data-apg-search-category]');
  const form=select?.closest('form[data-search-shell]');
  const input=form?.querySelector('[data-site-search],input[name="q"]');
  if(select&&form&&input){
    const label=()=>select.options[select.selectedIndex]?.text||'All';
    const basePlaceholder=input.getAttribute('placeholder')||'Search Australian Product Guide';
    select.addEventListener('change',()=>{input.placeholder=select.value?('Search '+label()):basePlaceholder;input.focus()});
    const contextualise=()=>{if(!select.value)return;const l=label();const q=String(input.value||'').trim();if(q&&!q.toLowerCase().includes(l.toLowerCase()))input.value=l+' '+q};
    form.querySelector('button[type="submit"]')?.addEventListener('click',contextualise,{capture:true});
    input.addEventListener('keydown',e=>{if(e.key==='Enter')contextualise()},{capture:true});
  }
})();`;

function send(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Header-Navigation','v'+VERSION);return res.end(req.method==='HEAD'?'':body);}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Navigation requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return send(req,res,'text/css; charset=utf-8',CSS);
    if(path===JS_PATH)return send(req,res,'application/javascript; charset=utf-8',JS);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transform(source);if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}}res.setHeader('X-APG-Header-Navigation','v'+VERSION);return end(body,...args)};
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{HEADER_NAVIGATION_VERSION:VERSION,HEADER_NAVIGATION_CSS_PATH:CSS_PATH,HEADER_NAVIGATION_JS_PATH:JS_PATH});
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,CSS,JS,transform,wrap};