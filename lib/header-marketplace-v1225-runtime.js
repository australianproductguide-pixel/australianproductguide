'use strict';

// APG Header Marketplace Mobile Supermenu v122.5
// Screenshot-led refinement on 29 Aug 2026. This layer keeps the v122.4 semantic order
// (menu -> brand -> account) but pulls the APG lock-up closer to the hamburger while the
// account remains pinned to the far right. It also replaces the long mobile category-first
// drawer with an Amazon-inspired progressive-disclosure hierarchy: APG home, decision tools,
// About & trust, exploration, popular categories, then collapsed department browsing.
// Recommendation logic, evidence, retailer weighting and affiliate scoring are unchanged.
const previous=require('./header-marketplace-v1224-runtime');
const {categories}=require('../data');

const VERSION='122.5';
const CSS_PATH='/assets/header-marketplace-v1225.css';
const JS_PATH='/assets/header-marketplace-v1225.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const popular=['coffee-machines','air-fryers','robot-vacuums','wireless-headphones','televisions','laptops'];
const departments=[
  ['Home & kitchen',['coffee-machines','air-fryers','robot-vacuums','stick-vacuums','blenders']],
  ['Tech & entertainment',['televisions','wireless-headphones','earbuds','soundbars','tablets']],
  ['Work & study',['laptops','computer-monitors','office-chairs','standing-desks','mechanical-keyboards']],
  ['Everyday life',['smartwatches','fitness-trackers','luggage','home-security-cameras','smart-doorbells']],
  ['Tools & outdoors',['cordless-drills','pressure-washers','dash-cameras','portable-power-stations','tyre-inflators']]
];

function categoryRow(slug){
  const c=categories[slug];
  if(!c)return '';
  return `<a class="apg-drawer-link apg-drawer-link-v1225" href="/categories/${esc(slug)}/"><span>${esc(c.label||slug)}</span><span aria-hidden="true">›</span></a>`;
}

function departmentBlock(title,slugs){
  const rows=slugs.map(categoryRow).filter(Boolean).join('');
  if(!rows)return '';
  return `<details class="apg-drawer-department-v1225"><summary><span>${esc(title)}</span><span class="apg-drawer-chevron-v1225" aria-hidden="true">›</span></summary><div>${rows}</div></details>`;
}

function superDrawer(){
  const popularRows=popular.map(categoryRow).filter(Boolean).join('');
  const departmentRows=departments.map(([title,slugs])=>departmentBlock(title,slugs)).join('');
  const categoryCount=Object.values(categories).filter(Boolean).length;
  return `<aside id="apgAllDrawer" class="apg-all-drawer" data-apg-all-drawer data-apg-drawer-supermenu="v${VERSION}" hidden aria-label="Australian Product Guide navigation">
    <button class="apg-drawer-close-v1225" type="button" data-apg-drawer-trigger aria-controls="apgAllDrawer" aria-expanded="true" aria-label="Close navigation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <div class="apg-drawer-account"><a href="/my-apg/"><span class="apg-drawer-user-icon" aria-hidden="true">●</span><span><strong>Your Australian Product Guide</strong><small>Log in, join or open your account</small></span><span aria-hidden="true">›</span></a></div>
    <div class="apg-drawer-scroll">
      <section class="apg-drawer-home-v1225"><a href="/"><strong>Australian Product Guide home</strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3v-9.5Z"/></svg></a></section>
      <section class="apg-drawer-section apg-drawer-section-v1225" data-apg-supermenu-section="decide"><h3>Decide &amp; compare</h3><a class="apg-drawer-link apg-drawer-link-v1225 is-priority" href="/decision-lab/"><span>Decision Lab</span><span aria-hidden="true">›</span></a><button class="apg-drawer-link apg-drawer-link-v1225 apg-drawer-scout is-priority" type="button" data-apg-supermenu-scout><span>Ask Scout</span><span aria-hidden="true">›</span></button><a class="apg-drawer-link apg-drawer-link-v1225" href="/compare/"><span>Compare products</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/guides/"><span>Buying guides</span><span aria-hidden="true">›</span></a></section>
      <section class="apg-drawer-section apg-drawer-section-v1225" data-apg-supermenu-section="trust"><h3>About &amp; trust</h3><a class="apg-drawer-link apg-drawer-link-v1225" href="/about/"><span>About us</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/methodology/"><span>How we compare</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/sources/"><span>Sources &amp; provenance</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/editorial-standards/"><span>Editorial standards</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/corrections-policy/"><span>Corrections</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/contact/"><span>Contact us</span><span aria-hidden="true">›</span></a></section>
      <section class="apg-drawer-section apg-drawer-section-v1225" data-apg-supermenu-section="explore"><h3>Explore &amp; shop</h3><a class="apg-drawer-link apg-drawer-link-v1225" href="/brands/"><span>Brands</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/retailers/"><span>Retailers</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/deals/"><span>Deals &amp; shopping</span><span aria-hidden="true">›</span></a><a class="apg-drawer-link apg-drawer-link-v1225" href="/updates/"><span>Recently updated</span><span aria-hidden="true">›</span></a></section>
      <section class="apg-drawer-section apg-drawer-section-v1225" data-apg-supermenu-section="popular"><h3>Popular categories</h3>${popularRows}</section>
      <section class="apg-drawer-section apg-drawer-section-v1225 apg-drawer-departments-v1225" data-apg-supermenu-section="departments"><h3>Browse by department</h3>${departmentRows}<a class="apg-drawer-all-categories-v1225" href="/categories/"><span>See all ${categoryCount} categories</span><span aria-hidden="true">›</span></a></section>
    </div>
  </aside>`;
}

function replaceDrawer(html){
  const source=String(html||'');
  if(!source.includes('id="apgAllDrawer"'))return source;
  return source.replace(/<aside\b[^>]*id=["']apgAllDrawer["'][^>]*>[\s\S]*?<\/aside>/i,superDrawer());
}

function injectAssets(html){
  let out=replaceDrawer(String(html||''));
  if(!out.includes('name="apg-header-marketplace-mobile-supermenu"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-mobile-supermenu" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  if(!out.includes(`src="${JS_PATH}`))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Mobile Supermenu v122.5 */
@media(max-width:920px){
  /* Menu -> brand immediately beside it -> flexible breathing room -> account. */
  .site-header .masthead{
    grid-template-columns:44px auto minmax(0,1fr) 44px!important;
    grid-template-areas:"menu brand . account"!important;
    column-gap:3px!important;
    padding-left:8px!important;
    padding-right:10px!important;
  }
  .site-header .masthead>.mobile-toggle{grid-area:menu!important;grid-column:1!important;justify-self:start!important}
  .site-header .masthead>.brand{
    grid-area:brand!important;grid-column:2!important;justify-self:start!important;width:auto!important;
    max-width:calc(100vw - 126px)!important;min-width:0!important;margin-left:0!important;margin-right:0!important;
  }
  .site-header .masthead>.brand>.apg-brand-v32-lockup{width:auto!important;max-width:100%!important;margin-left:0!important}
  .site-header .masthead>.apg-mobile-account-v122{grid-area:account!important;grid-column:4!important;justify-self:end!important}

  /* The drawer behaves as a hierarchy, not an expanded catalogue directory. */
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"]{width:min(390px,90vw)!important;background:#fff!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account{position:relative;background:linear-gradient(135deg,#0f1a2d,#14364a)!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account>a{padding:18px 58px 18px 18px!important;min-height:88px!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account strong{font-size:16px!important;line-height:1.15!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account small{font-size:12px!important;line-height:1.3!important;margin-top:4px!important}
  .apg-drawer-close-v1225{
    position:absolute;z-index:3;top:12px;right:12px;width:44px;height:44px;display:grid;place-items:center;
    padding:0;border:0;border-radius:10px;background:rgba(255,255,255,.08);color:#fff;cursor:pointer;
  }
  .apg-drawer-close-v1225 svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
  .apg-drawer-close-v1225:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}
  .apg-drawer-home-v1225{border-bottom:8px solid #eef1f3;background:#fff}
  .apg-drawer-home-v1225>a{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:62px;padding:13px 20px;color:#111827;text-decoration:none;font-size:17px}
  .apg-drawer-home-v1225 svg{width:25px;height:25px;fill:none;stroke:#111827;stroke-width:1.9;stroke-linejoin:round}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-scroll{padding-bottom:max(28px,env(safe-area-inset-bottom))!important}
  .apg-drawer-section-v1225{padding:17px 0 10px!important;border-bottom:8px solid #eef1f3!important}
  .apg-drawer-section-v1225 h3{padding:0 20px 8px!important;font-size:18px!important;line-height:1.25!important;color:#111827!important;font-weight:850!important}
  .apg-drawer-link-v1225{min-height:50px!important;padding:10px 20px!important;color:#17212b!important;font-size:15px!important;line-height:1.25!important;background:#fff!important}
  .apg-drawer-link-v1225>span:last-child{color:#64748b!important;font-size:22px!important}
  .apg-drawer-link-v1225.is-priority{font-weight:760!important}
  .apg-drawer-link-v1225:hover,.apg-drawer-link-v1225:focus-visible,.apg-drawer-home-v1225>a:hover,.apg-drawer-home-v1225>a:focus-visible{background:#f4f7fb!important;color:#174ea6!important;outline:0}
  .apg-drawer-department-v1225{border-top:1px solid #e5e7eb;background:#fff}
  .apg-drawer-department-v1225>summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:54px;padding:11px 20px;color:#17212b;font-size:15px;font-weight:700;cursor:pointer}
  .apg-drawer-department-v1225>summary::-webkit-details-marker{display:none}
  .apg-drawer-department-v1225>summary:focus-visible{outline:3px solid #93c5fd;outline-offset:-3px}
  .apg-drawer-chevron-v1225{font-size:22px;color:#64748b;transition:transform .16s ease}
  .apg-drawer-department-v1225[open]>.apg-drawer-chevron-v1225,.apg-drawer-department-v1225[open]>summary .apg-drawer-chevron-v1225{transform:rotate(90deg)}
  .apg-drawer-department-v1225>div{padding:0 0 6px;background:#f8fafc}
  .apg-drawer-department-v1225>div .apg-drawer-link-v1225{min-height:46px!important;padding-left:30px!important;background:#f8fafc!important;font-size:14px!important}
  .apg-drawer-all-categories-v1225{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;padding:12px 20px;border-top:1px solid #dbe2e8;color:#174ea6;text-decoration:none;font-size:15px;font-weight:800;background:#fff}
  .apg-drawer-all-categories-v1225:hover,.apg-drawer-all-categories-v1225:focus-visible{background:#eef5ff;outline:0}
}

@media(max-width:390px){
  .site-header .masthead{grid-template-columns:42px auto minmax(0,1fr) 42px!important;column-gap:2px!important;padding-left:7px!important;padding-right:8px!important}
  .site-header .masthead>.brand{max-width:calc(100vw - 116px)!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"]{width:91vw!important}
  .apg-drawer-section-v1225 h3,.apg-drawer-link-v1225,.apg-drawer-home-v1225>a,.apg-drawer-department-v1225>summary,.apg-drawer-all-categories-v1225{padding-left:17px!important;padding-right:17px!important}
}

@media(prefers-reduced-motion:reduce){.apg-drawer-chevron-v1225{transition:none!important}}
`;

const JS=String.raw`
'use strict';(()=>{
  if(window.__APG_HEADER_SUPERMENU_V1225__)return;window.__APG_HEADER_SUPERMENU_V1225__='122.5';
  document.addEventListener('click',event=>{
    const trigger=event.target&&event.target.closest?event.target.closest('[data-apg-supermenu-scout]'):null;
    if(!trigger)return;
    event.preventDefault();
    const backdrop=document.querySelector('[data-apg-drawer-backdrop]:not([hidden])');
    if(backdrop)backdrop.click();
    setTimeout(()=>document.getElementById('apgAssistantLauncher')?.click(),0);
  });
})();`;

function sendAsset(req,res){
  const path=(()=>{try{return new URL(req.url||'/','https://australianproductguide.au').pathname}catch{return '/'}})();
  const isJs=path===JS_PATH;
  res.statusCode=200;
  res.setHeader('Content-Type',isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Mobile-Supermenu','v'+VERSION);
  return res.end(req.method==='HEAD'?'':(isJs?JS:CSS));
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.5 requires downstream handler');
  const baseDownstream=previous.wrap(downstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH||path===JS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=injectAssets(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-Marketplace-Mobile-Supermenu','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:VERSION,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_JS_PATH:JS_PATH,
    HEADER_MARKETPLACE_MOBILE_ORDER_VERSION:previous.VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,CSS,JS,superDrawer,replaceDrawer,injectAssets,wrap};
