'use strict';

// APG Whole-Site Experience v109.0
// Outermost presentation/communication layer. It does not score, rank or persist shopper
// intent. The underlying Decision Engine, evidence, retailer and account runtimes remain
// authoritative. This layer makes every rendered page feel like one coherent APG system.
const {categories,products}=require('../data');

const VERSION='109.0';
const CSS_PATH='/assets/whole-site-experience-v109.css';
const JS_PATH='/assets/whole-site-experience-v109.js';

function platformFacts(){
  const populated=Object.values(categories).filter(c=>Array.isArray(c.products)&&c.products.length>0);
  const brands=new Set(products.map(p=>String(p.brand||'').trim()).filter(Boolean));
  return Object.freeze({productCount:products.length,categoryCount:populated.length,brandCount:brands.size});
}
const FACTS=platformFacts();

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function href(path,params={}){const u=new URL(path,'https://australianproductguide.au');for(const [key,value] of Object.entries(params)){if(value!==undefined&&value!==null&&String(value).trim())u.searchParams.set(key,String(value).trim());}return u.pathname+(u.search||'');}
function productForPath(path){const m=String(path).match(/^\/products\/([^/]+)\/$/);return m?products.find(p=>p.slug===m[1])||null:null;}
function categoryFromPath(path){const value=String(path||'');let m=value.match(/^\/categories\/([^/]+)(?:\/finder)?\/$/);if(m&&categories[m[1]])return m[1];m=value.match(/^\/compare\/([^/]+)\/$/);if(m&&categories[m[1]])return m[1];m=value.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m&&categories[m[1]])return m[1];const p=productForPath(value);return p?.category||'';}
function trustPath(path){return /^\/(?:methodology|sources|corrections-policy|affiliate-disclosure|privacy|terms|coverage|updates|about|contact|editorial-standards)\/$/.test(path);}
function routeFamily(path){
  if(path==='/')return 'home';
  if(path==='/search/')return 'search';
  if(path==='/decision-lab/')return 'decision-lab';
  if(path==='/my-apg/')return 'my-apg';
  if(path==='/categories/'||/^\/categories\//.test(path))return /^\/categories\/[^/]+\/finder\/$/.test(path)?'finder':path==='/categories/'?'categories':'category';
  if(path==='/compare/'||/^\/compare\//.test(path))return 'compare';
  if(path==='/guides/'||/^\/guides\//.test(path))return 'guide';
  if(path==='/products/'||/^\/products\//.test(path))return 'product';
  if(path==='/brands/'||/^\/brands\//.test(path))return 'brand';
  if(path==='/retailers/')return 'retailers';
  if(path==='/deals/')return 'deals';
  if(trustPath(path))return 'trust';
  if(path==='/sitemap/')return 'sitemap';
  return 'other';
}
function routeContext(path,u){
  const family=routeFamily(path),category=categoryFromPath(path),q=u?.searchParams?.get('q')||'',budget=u?.searchParams?.get('budget')||'',brand=u?.searchParams?.get('brand')||'';
  const decisionHref=href('/decision-lab/',{q,category,budget,brand});
  const compareHref=category?`/compare/${encodeURIComponent(category)}/`:'/compare/';
  const common={family,category};
  const map={
    home:{stage:'Start',title:'One connected product-decision system',summary:'Search, Scout, Decision Lab and Compare use the same maintained APG product evidence and customer-first rules.',actions:[['Search products','/search/',true],['Build a buying brief','/decision-lab/'],['Ask Scout','#scout']]},
    search:{stage:'Explore',title:'Turn intent into a buying decision',summary:'Keep the same need as you move from discovery into a structured brief, comparison or Scout conversation.',actions:[['Continue in Decision Lab',decisionHref,true],['Browse categories','/categories/'],['Ask Scout','#scout']]},
    categories:{stage:'Explore',title:'Start with the decision, not the specification list',summary:'Choose a category, understand what matters and carry that context into comparison or a buying brief.',actions:[['Browse buying guides','/guides/',true],['Open Decision Lab','/decision-lab/'],['Ask Scout','#scout']]},
    category:{stage:'Understand',title:'Understand the category before choosing the model',summary:'Evidence, decision factors, products and retailer pathways stay connected as you narrow the shortlist.',actions:[['Compare this category',compareHref,true],['Use Decision Lab',decisionHref],['Ask Scout','#scout']]},
    finder:{stage:'Narrow',title:'Translate priorities into a shortlist',summary:'The finder is one view of the same APG evidence. You can continue into Compare, Decision Lab or Scout without changing the underlying rules.',actions:[['Compare options',compareHref,true],['Continue in Decision Lab',decisionHref],['Ask Scout','#scout']]},
    product:{stage:'Evaluate',title:'Judge fit, evidence and trade-offs together',summary:'Use the product page as a decision checkpoint, then compare alternatives or apply your broader buying brief.',actions:[['Compare alternatives',compareHref,true],['Apply my situation',decisionHref],['Ask Scout','#scout']]},
    compare:{stage:'Compare',title:'Compare the differences that can change the purchase',summary:'Keep the shortlist connected to your priorities, evidence quality and the next decision step.',actions:[['Apply my situation',decisionHref,true],['Open My APG','/my-apg/'],['Ask Scout','#scout']]},
    'decision-lab':{stage:'Decide',title:'Make the recommendation explainable',summary:'Budget, needs, priorities and deal-breakers drive suitability. Retailer economics contribute zero recommendation points.',actions:[['Compare candidates',compareHref,true],['Open My APG','/my-apg/'],['Ask Scout','#scout']]},
    'my-apg':{stage:'Return',title:'Pick up the decision without starting again',summary:'Saved research, comparisons and recent activity are a return point into the same APG decision journey.',actions:[['Search products','/search/',true],['Open Compare','/compare/'],['Ask Scout','#scout']]},
    guide:{stage:'Learn',title:'Learn what matters, then apply it',summary:'Buying-guide context should lead naturally into the category, comparison and recommendation tools.',actions:[['Compare options',compareHref,true],['Use Decision Lab',decisionHref],['Ask Scout','#scout']]},
    brand:{stage:'Explore',title:'Explore the brand without treating brand as a recommendation',summary:'Brand pages organise maintained products. Suitability still depends on the customer situation and evidence.',actions:[['Search products','/search/',true],['Browse categories','/categories/'],['Ask Scout','#scout']]},
    retailers:{stage:'Buy with context',title:'Retailer pathways come after product fit',summary:'Exact, verified-variant and search-fallback retailer states stay distinct. Commission never changes the recommendation.',actions:[['Search products','/search/',true],['How APG compares','/methodology/'],['Ask Scout','#scout']]},
    deals:{stage:'Discover',title:'Treat a deal as a price signal, not a recommendation',summary:'A discount can change value, but it does not override product identity, fit, evidence or retailer verification.',actions:[['Search products','/search/',true],['Retailer principles','/retailers/'],['Ask Scout','#scout']]},
    trust:{stage:'Trust',title:'See how the APG system earns confidence',summary:'Methodology, sources, corrections, commercial disclosure and coverage rules are part of the product—not footer fine print.',actions:[['Methodology','/methodology/',true],['Sources','/sources/'],['Ask Scout','#scout']]},
    sitemap:{stage:'Navigate',title:'Every route should lead to a useful next decision',summary:'Use the site map to recover a destination, then continue through the same connected APG tools.',actions:[['Browse categories','/categories/',true],['Search products','/search/'],['Ask Scout','#scout']]},
    other:{stage:'Continue',title:'Stay inside the APG decision journey',summary:'Find the right page or ask Scout what to do next without losing the wider product-decision context.',actions:[['Search products','/search/',true],['Browse categories','/categories/'],['Ask Scout','#scout']]}
  };
  return {...common,...(map[family]||map.other)};
}
function actionHtml([label,target,primary]){if(target==='#scout')return `<button type="button" class="apg-system-action${primary?' primary':''}" data-apg-system-scout>${esc(label)}</button>`;return `<a class="apg-system-action${primary?' primary':''}" href="${esc(target)}">${esc(label)}</a>`;}
function rail(context){return `<nav class="apg-system-rail" data-apg-system-stage="${esc(context.stage)}" aria-label="Australian Product Guide decision journey"><div class="wrap apg-system-rail-inner"><div class="apg-system-rail-copy"><span class="apg-system-eyebrow">${esc(context.stage)} · APG decision system</span><strong>${esc(context.title)}</strong><span>${esc(context.summary)}</span></div><div class="apg-system-actions">${context.actions.map(actionHtml).join('')}</div></div></nav>`;}

function reconcilePlatformFacts(html,path){
  let out=String(html||'');
  // Only reconcile consumer-facing current-state pages. Historical update content is left untouched.
  if(!['/','/about/','/coverage/','/categories/','/brands/'].includes(path))return out;
  const replacements=[
    [/\b257(?=\s+(?:maintained\s+)?products\b)/gi,String(FACTS.productCount)],
    [/\b37(?=\s+(?:maintained\s+)?products\b)/gi,String(FACTS.productCount)],
    [/\b48(?=\s+(?:(?:populated|maintained|live)\s+)?(?:category|categories|category\s+pathways)\b)/gi,String(FACTS.categoryCount)],
    [/\b16(?=\s+brands\s+represented\b)/gi,String(FACTS.brandCount)]
  ];
  for(const [pattern,value] of replacements)out=out.replace(pattern,value);
  out=out.replace(/Four categories are fully maintained today\. Wider pathways stay out of search indexes until their evidence and maintenance workflow is ready\./gi,`${FACTS.categoryCount} populated categories are available today. Category depth and decision-grade maturity are disclosed separately rather than implied by catalogue size.`);
  out=out.replace(/<strong>4<\/strong><span>live decision categories<\/span>/gi,`<strong>${FACTS.categoryCount}</strong><span>populated categories</span>`);
  out=out.replace(/<strong>37<\/strong><span>maintained products<\/span>/gi,`<strong>${FACTS.productCount}</strong><span>maintained products</span>`);
  out=out.replace(/<h2>\s*\d+ brands represented in the maintained catalogue<\/h2>/gi,`<h2>${FACTS.brandCount} brands represented in the maintained catalogue</h2>`);
  return out;
}

const css=String.raw`
/* APG Whole-Site Experience v109.0 */
:root{--apg109-navy:#102f4a;--apg109-blue:#2563eb;--apg109-blue-deep:#1d4ed8;--apg109-ink:#152536;--apg109-muted:#5f7082;--apg109-line:#dce6ef;--apg109-soft:#f6f9fd;--apg109-card:#fff;--apg109-radius:20px;--apg109-shadow:0 10px 34px rgba(15,47,74,.075)}
body[data-apg-experience-v109="true"]{background:linear-gradient(180deg,#fff 0,#fbfdff 42%,#fff 100%);color:var(--apg109-ink)}
body[data-apg-experience-v109="true"] main{isolation:isolate}
body[data-apg-experience-v109="true"] main :where(h1,h2,h3){text-wrap:balance}
body[data-apg-experience-v109="true"] main :where(p,li,dd){text-wrap:pretty}
body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.decision-card,.winner-card,.retailer-panel,.evidence-box,.soft-panel,.ci47-panel,.ci47-handoff,.editorial-card,.need-card){border-color:var(--apg109-line);box-shadow:0 5px 22px rgba(15,47,74,.045)}
body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.decision-card,.winner-card,.retailer-panel,.evidence-box,.soft-panel,.ci47-panel,.ci47-handoff,.editorial-card,.need-card){transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.editorial-card,.need-card):has(a:hover){border-color:#c7d8e8;box-shadow:var(--apg109-shadow);transform:translateY(-2px)}
body[data-apg-experience-v109="true"] main :where(.section-head,.journey-intro)>div:first-child{max-width:820px}
body[data-apg-experience-v109="true"] main .section-head h2{max-width:900px}
body[data-apg-experience-v109="true"] main :where(.kicker,.eyebrow){color:var(--apg109-blue-deep)}
body[data-apg-experience-v109="true"] main :where(.button,.compare-button,.save-button){border-radius:12px;font-weight:800;letter-spacing:-.01em}
body[data-apg-experience-v109="true"] main :where(.button,.compare-button):not(.secondary){box-shadow:0 7px 18px rgba(37,99,235,.16)}
body[data-apg-experience-v109="true"] main :where(.fine,.meta,.card-meta,.product-meta,.image-provenance){color:var(--apg109-muted)}
body[data-apg-experience-v109="true"] main :where(table,.compare){border-color:var(--apg109-line)}
body[data-apg-experience-v109="true"] footer{border-top-color:var(--apg109-line)}
body[data-apg-experience-v109="true"] :where(a,button,input,select,textarea,summary):focus-visible{outline:3px solid rgba(37,99,235,.3);outline-offset:3px}

.apg-system-rail{position:relative;z-index:30;border-top:1px solid rgba(220,230,239,.8);border-bottom:1px solid var(--apg109-line);background:rgba(248,251,255,.94);backdrop-filter:saturate(150%) blur(12px)}
.apg-system-rail-inner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:24px;padding-top:12px;padding-bottom:12px}
.apg-system-rail-copy{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:baseline;column-gap:12px;row-gap:2px;min-width:0}
.apg-system-eyebrow{grid-row:1 / span 2;align-self:center;color:var(--apg109-blue-deep);font-size:10.5px;font-weight:900;letter-spacing:.075em;text-transform:uppercase;white-space:nowrap}
.apg-system-rail-copy strong{min-width:0;color:var(--apg109-navy);font-size:13px;line-height:1.35}
.apg-system-rail-copy>span:last-child{min-width:0;color:var(--apg109-muted);font-size:11.5px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.apg-system-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap}
.apg-system-action{display:inline-flex;align-items:center;justify-content:center;min-height:36px;border:1px solid #cfdeea;border-radius:999px;background:#fff;color:var(--apg109-navy);padding:7px 11px;font:inherit;font-size:11px;font-weight:800;line-height:1.2;text-decoration:none;cursor:pointer;white-space:nowrap}
.apg-system-action:hover{border-color:#a9c4dc;background:#fff;box-shadow:0 4px 12px rgba(15,47,74,.08)}
.apg-system-action.primary{border-color:#c5d8ff;background:#edf4ff;color:var(--apg109-blue-deep)}
body[data-apg-route-family="trust"] .apg-system-rail{background:#fbfcfe}
body[data-apg-route-family="product"] .apg-system-rail-copy strong,body[data-apg-route-family="compare"] .apg-system-rail-copy strong,body[data-apg-route-family="decision-lab"] .apg-system-rail-copy strong{font-size:13.5px}

@media(max-width:980px){
  .apg-system-rail-inner{grid-template-columns:1fr;gap:9px;padding-top:11px;padding-bottom:11px}
  .apg-system-actions{justify-content:flex-start}
  .apg-system-rail-copy>span:last-child{white-space:normal;overflow:visible;text-overflow:clip}
}
@media(max-width:760px){
  .apg-system-rail{backdrop-filter:none}
  .apg-system-rail-inner{gap:10px;padding-top:13px;padding-bottom:13px}
  .apg-system-rail-copy{grid-template-columns:1fr;gap:3px}
  .apg-system-eyebrow{grid-row:auto;font-size:10px;white-space:normal}
  .apg-system-rail-copy strong{font-size:13.5px;line-height:1.35}
  .apg-system-rail-copy>span:last-child{font-size:12px;line-height:1.45}
  .apg-system-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;gap:7px}
  .apg-system-action{min-height:44px;padding:8px 8px;font-size:11.5px;white-space:normal;text-align:center}
  body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.decision-card,.winner-card,.retailer-panel,.evidence-box,.soft-panel,.ci47-panel,.ci47-handoff,.editorial-card,.need-card){box-shadow:0 3px 16px rgba(15,47,74,.04)}
  body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.editorial-card,.need-card):has(a:hover){transform:none}
}
@media(max-width:380px){
  .apg-system-actions{grid-template-columns:1fr 1fr}
  .apg-system-action:last-child{grid-column:1 / -1}
  .apg-system-rail-copy>span:last-child{font-size:11.5px}
}
@media(prefers-reduced-motion:reduce){body[data-apg-experience-v109="true"] main :where(.feature-card,.comparison-card,.brand-card,.product-card,.category-card,.editorial-card,.need-card){transition:none!important;transform:none!important}}
`;

const clientJs=String.raw`(()=>{
'use strict';
if(window.__APG_WHOLE_SITE_V109__)return;window.__APG_WHOLE_SITE_V109__='${VERSION}';
const body=document.body;if(!body)return;body.dataset.apgExperienceV109='true';
function currentPath(){return location.pathname.endsWith('/')?location.pathname:location.pathname+'/'}
function markCurrentNavigation(){const path=currentPath();document.querySelectorAll('header a[href],nav a[href],footer a[href]').forEach(link=>{let target;try{target=new URL(link.getAttribute('href'),location.origin)}catch{return}if(target.origin!==location.origin)return;const p=target.pathname.endsWith('/')?target.pathname:target.pathname+'/';const exact=p===path;const family=p!=='/'&&path.startsWith(p)&&['/categories/','/brands/','/guides/','/compare/'].includes(p);if(exact||family)link.setAttribute('aria-current','page');else if(link.closest('.apg-system-rail'))link.removeAttribute('aria-current')})}
function bindScout(){document.querySelectorAll('[data-apg-system-scout]').forEach(button=>{if(button.dataset.apgScoutBound)return;button.dataset.apgScoutBound='true';button.addEventListener('click',()=>{const launcher=document.getElementById('apgAssistantLauncher');if(launcher)launcher.click();else location.href='/search/'})})}
function ready(){markCurrentNavigation();bindScout();body.dataset.apgExperienceReady='true'}
ready();window.addEventListener('pageshow',ready);const observer=new MutationObserver(()=>bindScout());observer.observe(document.body,{subtree:true,childList:true});
})();`;

function inject(html,path='/',u=new URL(path,'https://australianproductguide.au')){
  let out=reconcilePlatformFacts(String(html||''),path);if(!out)return out;
  const context=routeContext(path,u);
  if(!out.includes('name="apg-whole-site-experience"'))out=out.replace('</head>',`<meta name="apg-whole-site-experience" content="v${VERSION}"><meta name="apg-platform-facts" content="products=${FACTS.productCount}; categories=${FACTS.categoryCount}; brands=${FACTS.brandCount}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes('class="apg-system-rail"')&&/<main\b/i.test(out))out=out.replace(/<main\b/i,rail(context)+'<main');
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  if(!/data-apg-experience-v109=/.test(out))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-experience-v109="true" data-apg-route-family="${esc(context.family)}"$1>`);
  return out;
}
function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Whole-Site-Experience','v'+VERSION);return res.end(req.method==='HEAD'?'':body);}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('whole-site experience requires downstream handler');
  function handler(req,res){
    let u,path='/';try{u=new URL(req.url,'https://australianproductguide.au');path=u.pathname}catch{u=new URL('https://australianproductguide.au/')}
    if(path===CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',css);
    if(path===JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body,path,u);if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}res.setHeader('X-APG-Whole-Site-Experience','v'+VERSION);res.setHeader('X-APG-Platform-Facts',`products=${FACTS.productCount}; categories=${FACTS.categoryCount}; brands=${FACTS.brandCount}`)}return end(body,...args)};
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{WHOLE_SITE_EXPERIENCE_VERSION:VERSION,WHOLE_SITE_EXPERIENCE_CSS_PATH:CSS_PATH,WHOLE_SITE_EXPERIENCE_JS_PATH:JS_PATH,APG_PLATFORM_FACTS:FACTS,wholeSiteExperienceCss:css,wholeSiteExperienceClientJs:clientJs,injectWholeSiteExperience:inject});
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,FACTS,platformFacts,routeFamily,routeContext,reconcilePlatformFacts,css,clientJs,inject,wrap};
