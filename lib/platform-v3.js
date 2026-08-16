const {categories,products}=require('../data');
const {brands,pairPages,indexableRoutes}=require('./routes');
const {direct}=require('../data/retailers');
const {layout,hero,esc,categoryIcon,pill}=require('./ui');

const dateLabel=d=>{if(!d)return 'Not yet recorded';const [y,m,day]=String(d).split('-').map(Number);return new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Sydney'}).format(new Date(Date.UTC(y,m-1,day)));};
const attr=s=>esc(String(s||''));
const shareable=path=>path==='/'||path==='/categories/'||path==='/compare/'||path==='/guides/'||path==='/retailers/'||path==='/decision-lab/'||path==='/compare/custom/'||/^\/(products|categories|guides|compare|brands)\//.test(path);
function safeSharePath(path,u){
  if(path==='/decision-lab/'){
    const out=new URLSearchParams();for(const k of ['q','category','budget','brand']){const v=u?.searchParams?.get(k);if(v)out.set(k,v);}return path+(out.toString()?'?'+out.toString():'');
  }
  if(path==='/compare/custom/'){
    const allowed=new Set(products.map(p=>p.slug)),slugs=(u?.searchParams?.get('products')||'').split(',').filter(x=>allowed.has(x)).slice(0,4);return path+(slugs.length?`?products=${slugs.join(',')}`:'');
  }
  return path;
}
function shareControl(path,u,title='Share this APG page'){
  const url=safeSharePath(path,u);
  return `<div class="platform-sharebar wrap" data-share-surface data-share-url="${attr(url)}" data-share-title="${attr(title)}"><span class="share-context">Share this research</span><details class="share-menu"><summary aria-label="Share this page">Share</summary><div class="share-popover"><button type="button" data-native-share>Share on this device</button><button type="button" data-copy-share>Copy link</button><button type="button" data-share-channel="whatsapp">WhatsApp</button><button type="button" data-share-channel="facebook">Facebook</button><button type="button" data-share-channel="x">X</button><button type="button" data-share-channel="email">Email</button><span data-share-status aria-live="polite"></span></div></details></div>`;
}
function evidenceBadge(p){return p.evidenceTier==='starter'?`Starter evidence · checked ${dateLabel(p.lastSourceVerification)}`:`Deep evidence · reviewed ${dateLabel(p.lastSubstantiveReview||p.lastReviewed)}`;}
function freshnessPanel(p){
  const rows=[
    ['Evidence depth',p.evidenceTier==='starter'?'Starter evidence':'Deep evidence'],
    [p.evidenceTier==='starter'?'APG record created':'Substantive review',dateLabel(p.evidenceTier==='starter'?p.firstResearched:p.lastSubstantiveReview)],
    ['Source evidence checked',dateLabel(p.lastSourceVerification)],
    ['Retailer path checked',dateLabel(p.lastRetailerCheck)],
    ['Price checked',p.lastPriceCheck?dateLabel(p.lastPriceCheck):'Live price not maintained'],
    ['Image rights checked',dateLabel(p.lastImageVerification)],
    ['Next review due',dateLabel(p.nextReviewDue)]
  ];
  return `<section class="section freshness-section"><div class="wrap freshness-panel"><div><p class="kicker">Evidence freshness</p><h2>A date should tell you what was actually checked.</h2><p>${p.evidenceTier==='starter'?'This product is part of APG’s expanded starter catalogue. Product identity and retailer discovery are maintained; deeper manufacturer/specification evidence is still being built.':'This product has deeper specification research. APG still separates substantive review from retailer, source, image and price checks so freshness is not reduced to one artificial date.'}</p></div><dl>${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div></section>`;
}
function categoryEvidence(c){
  return c.evidenceTier==='starter'?`Starter evidence · ${c.products.length} maintained products · checked 16 Aug 2026`:`Deep evidence · ${c.products.length} maintained products · sources checked 16 Aug 2026`;
}
function replaceBetween(html,startNeedle,endNeedle,replacement){const s=html.indexOf(startNeedle);if(s<0)return html;const e=html.indexOf(endNeedle,s);if(e<0)return html;return html.slice(0,s)+replacement+html.slice(e);}
function platformMega(){
  const group=(title,items)=>`<div class="mega-group"><span class="mega-title">${esc(title)}</span>${items.map(([label,url,meta])=>`<a href="${url}"><span>${esc(label)}</span>${meta?`<small>${esc(meta)}</small>`:''}</a>`).join('')}</div>`;
  return `<div class="mega-menu" data-mega-menu hidden><div class="mega-surface platform-mega"><div class="mega-grid">${group('Home & kitchen',[['Coffee machines','/categories/coffee-machines/','Deep evidence'],['Air fryers','/categories/air-fryers/','Deep evidence'],['Robot vacuums','/categories/robot-vacuums/','Deep evidence'],['Stick vacuums','/categories/stick-vacuums/','Starter evidence'],['Air purifiers','/categories/air-purifiers/','Starter evidence'],['Kitchen & cooking','/categories/','Browse all 48 categories']])}${group('Tech & entertainment',[['Mesh Wi-Fi','/categories/mesh-wifi-systems/'],['Computer monitors','/categories/computer-monitors/'],['Tablets','/categories/tablets/'],['Wireless headphones','/categories/wireless-headphones/','Deep evidence'],['Earbuds','/categories/earbuds/'],['Projectors & gaming','/categories/','Explore the catalogue']])}${group('Work & lifestyle',[['Office chairs','/categories/office-chairs/'],['Standing desks','/categories/standing-desks/'],['Mechanical keyboards','/categories/mechanical-keyboards/'],['Computer mice','/categories/computer-mice/'],['Smartwatches','/categories/smartwatches/'],['Luggage','/categories/luggage/']])}${group('Decision tools',[['Decision Lab','/decision-lab/','Natural-language product matching'],['Compare','/compare/','Build and share a shortlist'],['Buying guides','/guides/','What matters before you buy'],['Brands','/brands/',`${brands.length} represented brands`],['My APG','/my-apg/','Private research workspace'],['Retailer approach','/retailers/','Amazon + retailer verification policy']])}<aside class="mega-feature"><div><p class="kicker">Full catalogue</p><h3>${products.length} maintained products across ${Object.keys(categories).length} categories.</h3><p>Deep and starter evidence are labelled separately so catalogue breadth never pretends to be research depth.</p></div><a class="button compact" href="/categories/">Explore all categories</a></aside></div></div></div>`;
}
function platformMobile(){
  const links=(title,items)=>`<details class="mobile-section"><summary>${esc(title)}</summary><div>${items.map(([l,u])=>`<a href="${u}">${esc(l)}<span aria-hidden="true">→</span></a>`).join('')}</div></details>`;
  return `<nav id="mobileNav" class="mobile-nav" hidden aria-label="Mobile"><div class="wrap mobile-nav-inner"><a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a>${links('Shop by category',[['All 48 categories','/categories/'],['Coffee machines','/categories/coffee-machines/'],['Robot vacuums','/categories/robot-vacuums/'],['Computer monitors','/categories/computer-monitors/'],['Office chairs','/categories/office-chairs/'],['Portable power','/categories/portable-power-stations/']])}${links('Research tools',[['Compare products','/compare/'],['Buying guides','/guides/'],['Brands','/brands/'],['My APG','/my-apg/'],['Retailer approach','/retailers/']])}${links('Trust & transparency',[['How we compare','/methodology/'],['Editorial standards','/editorial-standards/'],['Sources','/sources/'],['Coverage','/coverage/'],['Updates','/updates/'],['Privacy','/privacy/'],['Terms','/terms/']])}</div></nav>`;
}
function enhanceProductVisuals(html){
  for(const p of products){
    const needle=`aria-label="Australian Product Guide visual for ${attr(p.name)}"`;
    const rep=`${needle} data-product-category="${attr(p.category)}" data-category-label="${attr(p.categoryLabel)}" data-evidence-tier="${attr(p.evidenceTier||'deep')}"`;
    html=html.split(needle).join(rep);
    const save=`aria-label="Save ${attr(p.name)}">♡</button>`;
    const share=`${save}<button class="share-card" type="button" data-share-product="/products/${attr(p.slug)}/" data-share-product-title="${attr(p.brand+' '+p.name)}" aria-label="Share ${attr(p.name)}">↗</button>`;
    html=html.split(save).join(share);
  }
  return html;
}
function enhanceNavigation(html){
  html=html.replace(/<nav class="primary-nav" aria-label="Primary"><div class="wrap nav-inner">[\s\S]*?<\/div><\/nav>/,`<nav class="primary-nav" aria-label="Primary"><div class="wrap nav-inner"><button type="button" class="nav-trigger" data-mega-trigger aria-controls="megaProducts" aria-expanded="false">Products <span aria-hidden="true">⌄</span></button><a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a><a href="/compare/">Compare</a><a href="/guides/">Buying guides</a><a href="/brands/">Brands</a><a href="/my-apg/">My APG</a><a class="nav-trust" href="/methodology/">How we compare</a></div></nav>`);
  html=replaceBetween(html,'<div id="megaProducts">','<nav id="mobileNav"',`<div id="megaProducts">${platformMega()}</div>`);
  const mobileStart=html.indexOf('<nav id="mobileNav"');const mobileEnd=html.indexOf('</nav></header>',mobileStart);if(mobileStart>=0&&mobileEnd>=0)html=html.slice(0,mobileStart)+platformMobile()+html.slice(mobileEnd+6);
  html=html.replace('href="/compare/coffee-machines/">Popular comparisons','href="/compare/">Compare products').replace('href="/categories/">Buying guides','href="/guides/">Buying guides').replace('href="/#recentlyViewed">Recently viewed','href="/my-apg/">My APG workspace');
  return html;
}
function enhanceCounts(html){
  const routeCount=indexableRoutes.length;
  return html
    .split('37 maintained products').join(`${products.length} maintained products`)
    .split('56 prepared head-to-heads').join(`${pairPages.length} prepared head-to-heads`)
    .split('<strong>37</strong><span>maintained products</span>').join(`<strong>${products.length}</strong><span>maintained products</span>`)
    .split('<strong>4</strong><span>live decision categories</span>').join(`<strong>${Object.keys(categories).length}</strong><span>populated categories</span>`)
    .split('<strong>139</strong><span>canonical research routes</span>').join(`<strong>${routeCount}</strong><span>canonical research routes</span>`)
    .split('16 brands represented in the maintained catalogue').join(`${brands.length} brands represented in the maintained catalogue`)
    .split('Browse all categories','Browse all categories');
}
function enhanceEvidence(html,path){
  html=html.split('Reviewed 15/08/2026').join('Evidence checked 16/08/2026');
  html=html.split('Decision Engine v2').join('Decision Engine v3');
  html=html.split('Decision Engine v2 turns your needs').join('Decision Engine v3 turns your needs');
  if(path==='/categories/'){
    html=html.replace('Four categories are fully maintained today. Wider pathways stay out of search indexes until their evidence and maintenance workflow is ready.','All 48 APG category pathways now contain a maintained starting catalogue. Deep-evidence and starter-evidence hubs are labelled separately so shoppers can see how mature the research is.').replace('Research roadmap','Coverage map').replace('Research-queue pages are deliberately noindex until APG can support a credible Australian dataset.','Every pathway is now populated. Starter categories use a controlled five-product set while deeper evidence work continues category by category.');
  }
  const cm=path.match(/^\/categories\/([^/]+)\/$/);if(cm&&categories[cm[1]]){const c=categories[cm[1]];html=html.replace('<span class="independence-badge">Reviewed 15 Aug 2026</span>',`<span class="independence-badge evidence-${c.evidenceTier}">${esc(categoryEvidence(c))}</span>`);if(c.evidenceTier==='starter')html=html.replace(`This category contains ${c.products.length} maintained records reviewed against primary manufacturer evidence.`,`This category contains ${c.products.length} maintained starter-evidence product records. Product identity and retailer pathways were checked on 16 Aug 2026; deeper manufacturer/specification evidence is still being built.`);}
  const gm=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(gm&&categories[gm[1]]?.evidenceTier==='starter')html=html.split('Reviewed against primary manufacturer evidence.').join('Starter evidence: product identity and retailer discovery are maintained while deeper specification research is still being added.');
  const pm=path.match(/^\/products\/([^/]+)\/$/);if(pm){const p=products.find(x=>x.slug===pm[1]);if(p){html=html.replace('<span>Reviewed 15 Aug 2026</span>',`<span class="evidence-${p.evidenceTier}">${esc(evidenceBadge(p))}</span>`);html=html.replace('<div class="fact-card"><dt>Last reviewed</dt><dd>15 August 2026</dd></div>',`<div class="fact-card"><dt>${p.evidenceTier==='starter'?'Evidence depth':'Last substantive review'}</dt><dd>${esc(p.evidenceTier==='starter'?'Starter evidence':dateLabel(p.lastSubstantiveReview))}</dd></div>`);if(p.evidenceTier==='starter')html=html.split('These are documented characteristics, not a claim of hands-on performance testing.').join('These are starter classification signals, not hands-on performance claims. Deeper specification evidence is still being added.');html=html.replace('<div id="where-to-buy" class="wrap">',freshnessPanel(p)+'<div id="where-to-buy" class="wrap">');}}
  return html;
}
function enhanceWorkspace(html,path){
  if(path!=='/my-apg/')return html;
  const panel=`<section class="section soft-section full-bleed"><div class="wrap account-readiness"><div><p class="kicker">Optional account sync</p><h2>Local-first today. Cross-device when you choose.</h2><p>APG does not currently operate consumer accounts. The recommended next architecture is managed authentication plus row-level protected sync, with anonymous My APG remaining the default. Activation needs explicit approval because it introduces a new data processor and database.</p></div><div class="account-state"><span>Current</span><strong>No account data collected</strong><small>Saved research stays in this browser.</small></div><div class="account-state planned"><span>Planned</span><strong>Optional managed sync</strong><small>Minimal profile, deletion controls and privacy update before launch.</small></div></div></section><section class="section"><div class="wrap"><div class="workspace-grid workspace-more"><section class="workspace-panel" data-workspace-searches><div class="section-head compact-head"><div><p class="kicker">Search</p><h2>Recent searches</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel" data-workspace-comparisons><div class="section-head compact-head"><div><p class="kicker">Saved research</p><h2>Saved comparisons</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel" data-workspace-guides><div class="section-head compact-head"><div><p class="kicker">Editorial</p><h2>Saved guides</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel future-panel"><p class="kicker">Future</p><h2>Product & price alerts</h2><p>Reserved for a later opt-in service after retailer freshness and account infrastructure are approved.</p></section></div></div></section>`;
  return html.replace('</main>',panel+'</main>');
}
function enhancePolicy(html,path){
  if(!['/privacy/','/terms/'].includes(path))return html;
  const note=`<section class="section"><div class="wrap platform-policy-note"><p class="kicker">Platform v3 account status</p><h2>Consumer accounts are not active.</h2><p>My APG remains browser-local. APG has not activated a managed authentication service or server-side shopper profile database in this release. If optional account sync is approved later, Privacy and Terms must be updated before launch.</p></div></section>`;
  return html.replace('</main>',note+'</main>');
}
function enhance(html,path,u){
  if(!html)return html;
  html=html.replace('<body ','<body data-platform-v3="true" data-platform-page="'+attr(path)+'" ');
  html=enhanceCounts(html);html=enhanceEvidence(html,path);html=enhanceProductVisuals(html);html=enhanceNavigation(html);html=enhanceWorkspace(html,path);html=enhancePolicy(html,path);
  if(shareable(path))html=html.replace('<main id="main">','<main id="main">'+shareControl(path,u));
  if(path==='/guides/'||/^\/guides\//.test(path))html=html.replace('</div></section></main>','</div></section></main>');
  return html;
}
function compareHub(req){
  const body=hero('Compare products','Build a comparison around the decision','Choose a category, add products to the shortlist and share the resulting 2–4 product comparison without creating an account.')+`<section class="section"><div class="section-head"><div><p class="kicker">All comparison hubs</p><h2>${Object.keys(categories).length} populated categories</h2><p>Prepared editorial head-to-heads are deliberately limited. Dynamic shortlists remain noindex to avoid thin comparison permutations.</p></div></div><div class="platform-hub-grid">${Object.values(categories).map(c=>`<article class="platform-hub-card">${categoryIcon(c.icon)}<div><span class="evidence-chip evidence-${c.evidenceTier}">${c.evidenceTier==='deep'?'Deep evidence':'Starter evidence'}</span><h3>${esc(c.label)}</h3><p>${c.products.length} maintained products · ${pairPages.filter(x=>x.category===c.slug).length} prepared head-to-heads</p><div class="actions"><a class="button compact" href="/compare/${c.slug}/">Compare</a><a class="text-link" href="/categories/${c.slug}/">Browse →</a></div></div></article>`).join('')}</div></section>`;return layout(req,{title:'Compare Products Australia | Australian Product Guide',description:'Build transparent product comparisons across 48 Australian Product Guide categories.',path:'/compare/',body,crumbs:[{name:'Home',path:'/'},{name:'Compare',path:'/compare/'}]});
}
function guidesHub(req){
  const body=hero('Buying guides','Understand the category before the model','APG buying guides focus on the decisions that change suitability: budget, constraints, trade-offs and the factors worth comparing.')+`<section class="section"><div class="section-head"><div><p class="kicker">Decision-first guides</p><h2>${Object.keys(categories).length} category guides</h2></div></div><div class="platform-hub-grid">${Object.values(categories).map(c=>`<article class="platform-hub-card">${categoryIcon(c.icon)}<div><span class="evidence-chip evidence-${c.evidenceTier}">${c.evidenceTier==='deep'?'Deep evidence':'Starter evidence'}</span><h3><a href="/guides/${c.slug}-buying-guide/">${esc(c.label)}</a></h3><p>${esc(c.factors.slice(0,2).join(' · '))}</p><a class="text-link" href="/guides/${c.slug}-buying-guide/">Read guide →</a></div></article>`).join('')}</div></section>`;return layout(req,{title:'Australian Product Buying Guides | Australian Product Guide',description:'Decision-first Australian buying guides across APG’s maintained product categories.',path:'/guides/',body,crumbs:[{name:'Home',path:'/'},{name:'Buying guides',path:'/guides/'}]});
}
function retailersHub(req){
  const exact=Object.keys(direct).length,fallback=products.length-exact;
  const body=hero('Retailer discovery','Retailer links are a pathway, not a ranking signal','APG separates product suitability from where a product can be bought. Commission and retailer availability contribute zero recommendation points.')+`<section class="section"><div class="wrap trust-story"><div><p class="kicker">Amazon Australia</p><h2>${exact} exact individual product links verified</h2><p>${fallback} maintained products currently use transparent model-specific Amazon Australia search fallbacks rather than guessed ASINs. Every eligible Amazon destination carries APG’s Associates attribution.</p><p>Amazon product photography is not scraped. APG will only display Amazon Product Advertising Content after an authorised Amazon mechanism is connected and the returned identifier matches the verified product.</p></div><div class="trust-visual"><div><strong>${exact}</strong><span>verified exact Amazon links</span></div><div><strong>${fallback}</strong><span>model-search fallbacks</span></div><div><strong>0</strong><span>commercial scoring points</span></div><div><strong>Rights-first</strong><span>image provenance gate</span></div></div></div></section><section class="section soft-section full-bleed"><div class="wrap"><div class="section-head"><div><p class="kicker">Retailer roadmap</p><h2>Amazon is useful, but APG should not depend on one retailer.</h2><p>The next commercial-data phase should expand exact Australian retailer coverage, availability and lawful imagery feeds while preserving recommendation neutrality.</p></div></div></div></section>`;return layout(req,{title:'Retailer Discovery & Amazon Australia | Australian Product Guide',description:'How APG handles Amazon Australia, exact product links, affiliate attribution, image provenance and retailer neutrality.',path:'/retailers/',body,crumbs:[{name:'Home',path:'/'},{name:'Retailers',path:'/retailers/'}]});
}
module.exports={enhance,compareHub,guidesHub,retailersHub,safeSharePath,dateLabel};