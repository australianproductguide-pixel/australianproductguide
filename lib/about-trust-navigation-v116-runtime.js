'use strict';

// APG About & Trust Navigation v116.8.
// Adds About/Contact/Methodology/Trust access to the global desktop mega menu
// and the native mobile menu while preserving the existing v115 navigation
// architecture, route contracts and mobile interaction model.

const previous=require('./retailer-pages-v115-runtime');
const catalogue=require('../data');
const { escapeHtml, SITE_ORIGIN }=require('./app-core');
const { socialProfiles }=require('../data/social-profiles-v57');

const VERSION='116.8';
const REVIEWED_AT='2026-08-29';

const ABOUT_LINKS=Object.freeze([
  Object.freeze({label:'About APG',href:'/about/',description:'Why Australian Product Guide exists and how the platform is maintained.'}),
  Object.freeze({label:'How APG works',href:'/methodology/',description:'How products are researched, compared and recommended.'}),
  Object.freeze({label:'Editorial standards',href:'/editorial-policy/',description:'The evidence, independence and review rules behind APG guidance.'}),
  Object.freeze({label:'Sources & evidence',href:'/sources/',description:'How source quality, provenance and evidence depth are handled.'}),
  Object.freeze({label:'Coverage',href:'/coverage/',description:'What APG covers today, what is still maturing and how gaps are disclosed.'}),
  Object.freeze({label:'Updates',href:'/updates/',description:'Recent improvements to the catalogue, evidence and decision tools.'}),
  Object.freeze({label:'Corrections',href:'/corrections/',description:'How to report an error and how APG corrects published information.'}),
  Object.freeze({label:'Affiliate disclosure',href:'/affiliate-disclosure/',description:'How retailer links support APG without affecting recommendations.'})
]);

const CONTACT_LINKS=Object.freeze([
  Object.freeze({label:'Contact APG',href:'/contact/',description:'Questions, feedback, source suggestions and general enquiries.'}),
  Object.freeze({label:'Report a correction',href:'/corrections/',description:'Flag a product fact, retailer destination or guidance issue.'}),
  Object.freeze({label:'Privacy',href:'/privacy/',description:'How APG handles privacy and site data.'}),
  Object.freeze({label:'Terms',href:'/terms/',description:'The terms that apply when using Australian Product Guide.'})
]);

const SHOPPING_LINKS=Object.freeze([
  Object.freeze({label:'Deals & offers',href:'/deals/'}),
  Object.freeze({label:'Amazon Australia deals',href:'/deals/#amazon-deals'}),
  Object.freeze({label:'Amazon best sellers',href:'/deals/#amazon-best-sellers'}),
  Object.freeze({label:'eBay Australia offers',href:'/deals/#ebay-offers'}),
  Object.freeze({label:'Browse retailers',href:'/retailers/'})
]);

const SOCIAL_LINKS=Object.freeze(socialProfiles.map((profile)=>Object.freeze({
  label:profile.label,
  href:profile.url,
  network:profile.network,
  handle:profile.handle
})));

function routeIs(pathname,prefix){
  return pathname===prefix || pathname.startsWith(prefix.endsWith('/')?prefix:`${prefix}/`);
}

function trustNavigationState(pathname='/'){
  return Object.freeze({
    active: routeIs(pathname,'/about/') ||
      routeIs(pathname,'/methodology/') ||
      routeIs(pathname,'/editorial-policy/') ||
      routeIs(pathname,'/sources/') ||
      routeIs(pathname,'/coverage/') ||
      routeIs(pathname,'/updates/') ||
      routeIs(pathname,'/corrections/') ||
      routeIs(pathname,'/affiliate-disclosure/') ||
      routeIs(pathname,'/contact/') ||
      routeIs(pathname,'/privacy/') ||
      routeIs(pathname,'/terms/'),
    aboutLinks:ABOUT_LINKS,
    contactLinks:CONTACT_LINKS,
    shoppingLinks:SHOPPING_LINKS,
    socialLinks:SOCIAL_LINKS
  });
}

function desktopTrustMenu(){
  const about=ABOUT_LINKS.slice(0,4).map((item)=>`<a class="trust-menu-card" href="${escapeHtml(item.href)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('');
  const contact=CONTACT_LINKS.slice(0,2).map((item)=>`<a class="trust-menu-card" href="${escapeHtml(item.href)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('');
  return `<div class="nav-dropdown trust-nav-dropdown" data-trust-menu><button class="nav-link nav-link-dropdown" type="button" data-trust-menu-toggle aria-haspopup="true" aria-expanded="false">About &amp; trust <span aria-hidden="true">⌄</span></button><div class="nav-menu trust-nav-menu" data-trust-menu-panel><div class="trust-menu-intro"><span class="eyebrow">Independent Australian product research</span><strong>Understand how APG reaches a recommendation.</strong><p>Evidence, trade-offs and uncertainty stay visible. Retailer relationships contribute zero recommendation points.</p></div><div class="trust-menu-grid">${about}${contact}</div><div class="trust-menu-footer"><a href="/about/">About APG</a><a href="/coverage/">Coverage</a><a href="/updates/">Updates</a><a href="/affiliate-disclosure/">Affiliate disclosure</a><a href="/contact/">Contact</a></div></div></div>`;
}

function mobileItem(label,href){
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

function mobileSection(label,items){
  return `<details class="mobile-section"><summary>${escapeHtml(label)}</summary><div>${items.map((item)=>mobileItem(item[0],item[1])).join('')}</div></details>`;
}

function mobileShoppingSection(){
  return `<details class="mobile-section" data-mobile-shopping><summary>Deals &amp; offers</summary><div>${SHOPPING_LINKS.map((item)=>mobileItem(item.label,item.href)).join('')}</div></details>`;
}

function mobileNavigationContent(){
  return `<div class="mobile-menu-head"><div><strong>Australian Product Guide</strong><span>Independent Australian product research</span></div><button type="button" data-mobile-menu-close aria-label="Close menu">×</button></div><div class="mobile-menu-search"><a href="/search/">Search products</a><a href="/compare/">Compare products</a></div><div class="mobile-menu-sections">${mobileSection('Choose',[['Decision Lab','/decision-lab/'],['Ask Scout','/scout/'],['Buying guides','/buying-guides/']])}${mobileSection('Browse',[['Products','/products/'],['Categories','/categories/'],['Collections','/collections/']])}${mobileShoppingSection()}${mobileSection('Explore',[['Brands','/brands/'],['Retailers','/retailers/']])}${mobileSection('About & trust',[['About APG','/about/'],['How APG works','/methodology/'],['Editorial standards','/editorial-policy/'],['Sources & evidence','/sources/'],['Coverage','/coverage/'],['Updates','/updates/'],['Affiliate disclosure','/affiliate-disclosure/']])}${mobileSection('Help & policies',[['Contact APG','/contact/'],['Report a correction','/corrections/'],['Privacy','/privacy/'],['Terms','/terms/']])}</div><div class="mobile-menu-social" aria-label="APG social profiles">${SOCIAL_LINKS.map((item)=>`<a href="${escapeHtml(item.href)}" rel="me noopener noreferrer" target="_blank">${escapeHtml(item.label)}</a>`).join('')}</div>`;
}

function footerTrustPanel(){
  return `<section class="footer-trust-panel" aria-label="About Australian Product Guide"><div><span class="eyebrow">Built for better buying decisions</span><strong>Independent research. Australian context. Commercial neutrality.</strong><p>APG explains product fit, trade-offs, evidence quality and uncertainty before asking you to follow a retailer link.</p></div><div class="footer-trust-actions"><a href="/about/">About APG</a><a href="/methodology/">How APG works</a><a href="/contact/">Contact</a></div></section>`;
}

function styleBlock(){
  return `<style id="apg-about-trust-navigation-v116">
  .trust-nav-dropdown{position:relative}
  .trust-nav-menu{left:auto;right:0;width:min(780px,calc(100vw - 40px));padding:18px;grid-template-columns:minmax(220px,.8fr) minmax(0,1.5fr);gap:18px}
  .trust-nav-dropdown.open .trust-nav-menu{display:grid}
  .trust-menu-intro{padding:18px;border-radius:18px;background:linear-gradient(145deg,#eef8f5,#f7fbfa);border:1px solid #d8e8e2}
  .trust-menu-intro strong{display:block;font-size:20px;line-height:1.18;color:#163c35;margin:7px 0 8px}
  .trust-menu-intro p{margin:0;color:#50655f;font-size:13px;line-height:1.55}
  .trust-menu-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .trust-menu-card{display:flex;flex-direction:column;gap:4px;padding:13px 14px;border-radius:14px;border:1px solid #e3ebe8;background:#fff;text-decoration:none;color:#183c35;box-shadow:0 8px 22px rgba(18,58,50,.05)}
  .trust-menu-card:hover{border-color:#b9d4cb;transform:translateY(-1px)}
  .trust-menu-card strong{font-size:13px}.trust-menu-card span{font-size:11px;line-height:1.45;color:#687b75}
  .trust-menu-footer{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;padding-top:2px}
  .trust-menu-footer a{font-size:11px;font-weight:800;color:#2b6458;text-decoration:none;padding:7px 10px;border-radius:999px;background:#f1f7f5}
  .footer-trust-panel{max-width:1180px;margin:0 auto 24px;padding:22px 24px;border:1px solid #dbe8e4;border-radius:22px;background:linear-gradient(145deg,#f8fbfa,#eef7f4);display:flex;align-items:center;justify-content:space-between;gap:24px}
  .footer-trust-panel strong{display:block;font-size:18px;color:#183d35;margin:5px 0 6px}.footer-trust-panel p{margin:0;max-width:760px;color:#61736d;font-size:13px;line-height:1.5}
  .footer-trust-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.footer-trust-actions a{white-space:nowrap;text-decoration:none;font-size:12px;font-weight:800;color:#235a4f;padding:9px 12px;border:1px solid #cfe0da;border-radius:999px;background:#fff}
  .mobile-menu-social{display:flex;flex-wrap:wrap;gap:7px;padding:14px 16px 18px;border-top:1px solid #e8eeec}.mobile-menu-social a{font-size:11px;font-weight:800;color:#315f55;text-decoration:none;padding:7px 9px;border-radius:999px;background:#eef6f3}
  @media(max-width:980px){.trust-nav-dropdown{display:none}.footer-trust-panel{margin:0 14px 20px;padding:18px;align-items:flex-start;flex-direction:column}.footer-trust-actions{justify-content:flex-start}}
  </style>`;
}

function scriptBlock(){
  return `<script id="apg-about-trust-navigation-v116-js">(function(){var d=document,root=d.querySelector('[data-trust-menu]'),toggle=d.querySelector('[data-trust-menu-toggle]');if(root&&toggle){function close(){root.classList.remove('open');toggle.setAttribute('aria-expanded','false')}toggle.addEventListener('click',function(e){e.stopPropagation();var open=root.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false')});d.addEventListener('click',function(e){if(!root.contains(e.target))close()});d.addEventListener('keydown',function(e){if(e.key==='Escape')close()})}})();</script>`;
}

function replaceMobileMenu(html){
  const open='<aside class="mobile-menu" id="mobileMenu" aria-hidden="true">';
  const start=html.indexOf(open);
  if(start<0)return html;
  const contentStart=start+open.length;
  const end=html.indexOf('</aside>',contentStart);
  if(end<0)return html;
  return html.slice(0,contentStart)+mobileNavigationContent()+html.slice(end);
}

function transformHtml(html){
  let out=String(html||'');
  if(!out || out.includes('data-about-trust-navigation-v116="true"'))return out;
  out=out.replace('<body','<body data-about-trust-navigation-v116="true"');
  if(out.includes('<nav class="main-nav" aria-label="Primary">')){
    out=out.replace('<nav class="main-nav" aria-label="Primary">','<nav class="main-nav" aria-label="Primary">'+desktopTrustMenu());
  }
  out=replaceMobileMenu(out);
  if(out.includes('<footer class="site-footer">'))out=out.replace('<footer class="site-footer">','<footer class="site-footer">'+footerTrustPanel());
  if(out.includes('</head>'))out=out.replace('</head>',styleBlock()+'</head>');
  if(out.includes('</body>'))out=out.replace('</body>',scriptBlock()+'</body>');
  return out;
}

function platformState(){
  return Object.freeze({
    version:VERSION,
    reviewedAt:REVIEWED_AT,
    status:'ACTIVE',
    desktopAboutTrustMenu:true,
    mobileAboutTrustSection:true,
    mobileShoppingSection:true,
    mobileShoppingLinkCount:SHOPPING_LINKS.length,
    footerTrustPanel:true,
    contactPromoted:true,
    methodologyPromoted:true,
    socialProfilesPromoted:true,
    commercialRecommendationWeight:0
  });
}

function install(app){
  const installed=previous.install(app);
  const original=installed.handler;
  installed.handler=async function aboutTrustNavigationV116Handler(req,res){
    const pathname=new URL(req.url||'/',SITE_ORIGIN).pathname;
    if(pathname==='/api/about-trust-navigation'){
      res.statusCode=200;
      res.setHeader('content-type','application/json; charset=utf-8');
      res.setHeader('cache-control','public, max-age=0, s-maxage=300');
      res.end(JSON.stringify({version:VERSION,reviewedAt:REVIEWED_AT,navigation:trustNavigationState('/'),platform:platformState(),catalogue:{products:catalogue.products.length,categories:catalogue.categories.length}}));
      return;
    }
    const capture={chunks:[],statusCode:200,headers:{}};
    const proxy={
      set statusCode(value){capture.statusCode=value},
      get statusCode(){return capture.statusCode},
      setHeader(name,value){capture.headers[String(name).toLowerCase()]=value},
      getHeader(name){return capture.headers[String(name).toLowerCase()]},
      end(chunk){if(chunk!==undefined)capture.chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk)))},
      write(chunk){if(chunk!==undefined)capture.chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk)));return true}
    };
    await original(req,proxy);
    res.statusCode=capture.statusCode;
    for(const [name,value] of Object.entries(capture.headers))res.setHeader(name,value);
    const type=String(capture.headers['content-type']||'');
    if(type.includes('text/html')){
      const body=Buffer.concat(capture.chunks).toString('utf8');
      const transformed=transformHtml(body);
      res.setHeader('content-length',Buffer.byteLength(transformed));
      res.end(transformed);
      return;
    }
    res.end(Buffer.concat(capture.chunks));
  };
  return installed;
}

module.exports={VERSION,REVIEWED_AT,ABOUT_LINKS,CONTACT_LINKS,SHOPPING_LINKS,SOCIAL_LINKS,trustNavigationState,mobileNavigationContent,transformHtml,platformState,install};
