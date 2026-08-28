'use strict';

// APG About & Trust Navigation v116.0.
// Presentation-only navigation layer. It promotes APG company, methodology, evidence,
// accountability and contact routes into a dedicated desktop/mobile navigation family.
// It does not change product eligibility, recommendation scoring, retailer ranking,
// catalogue evidence or shopper decision state.
const VERSION='116.0';
const CSS_PATH='/assets/about-trust-navigation-v116.css';
const JS_PATH='/assets/about-trust-navigation-v116.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

const TRUST_ROUTES='(?:about|contact|methodology|editorial-standards|sources|corrections-policy|affiliate-disclosure|coverage|updates)';

function trustLink(label,href,extra=''){
  return `<a${extra?` class="${esc(extra)}"`:''} href="${esc(href)}"><span>${esc(label)}</span><span aria-hidden="true">→</span></a>`;
}
function desktopAboutTrust(){
  return `<details class="apg-about-trust-menu" data-apg-about-trust><summary>About &amp; trust <span class="apg-about-trust-chevron" aria-hidden="true">⌄</span></summary><div class="apg-about-trust-popover" role="group" aria-label="About and trust"><div class="apg-about-trust-intro"><span>About Australian Product Guide</span><strong>See how APG works — and how to reach us.</strong><small>Methodology, evidence standards, corrections and commercial transparency remain easy to inspect while you shop.</small></div><div class="apg-about-trust-grid"><div class="apg-about-trust-column"><section><h3>About APG</h3>${trustLink('About us','/about/')}</section><section><h3>How we work</h3>${trustLink('How we compare','/methodology/')}${trustLink('Editorial standards','/editorial-standards/')}</section></div><div class="apg-about-trust-column"><section><h3>Evidence &amp; transparency</h3>${trustLink('Sources & provenance','/sources/')}${trustLink('Coverage','/coverage/')}${trustLink('Recently updated','/updates/')}</section></div><div class="apg-about-trust-column"><section><h3>Accountability</h3>${trustLink('Corrections','/corrections-policy/')}${trustLink('Commercial transparency','/affiliate-disclosure/')}</section><section class="apg-about-trust-contact"><h3>Talk to us</h3>${trustLink('Contact us','/contact/','apg-about-trust-contact-link')}</section></div></div></div></details>`;
}
function mobileItem(label,href,{scout=false,account=false}={}){
  if(scout)return `<button type="button" class="apg-mobile-nav-action" data-apg-system-scout><span>${esc(label)}</span><span aria-hidden="true">→</span></button>`;
  return `<a${account?' class="apg-mobile-account-entry"':''} href="${esc(href)}"><span>${esc(label)}</span><span aria-hidden="true">→</span></a>`;
}
function mobileSection(title,items){
  return `<details class="mobile-section"><summary>${esc(title)}</summary><div>${items.map(item=>mobileItem(item[0],item[1],item[2]||{})).join('')}</div></details>`;
}
function mobileNavigationContent(searchForm=''){
  return `${searchForm}${mobileSection('Shop & decide',[
    ['Browse products','/categories/'],
    ['Decision Lab','/decision-lab/'],
    ['Ask Scout','',{scout:true}],
    ['Compare','/compare/'],
    ['Buying guides','/guides/']
  ])}${mobileSection('Explore',[
    ['Brands','/brands/'],
    ['Retailers','/retailers/'],
    ['Deals','/deals/']
  ])}${mobileSection('About & trust',[
    ['About us','/about/'],
    ['How we compare','/methodology/'],
    ['Editorial standards','/editorial-standards/'],
    ['Sources','/sources/'],
    ['Coverage','/coverage/'],
    ['Recently updated','/updates/'],
    ['Corrections','/corrections-policy/'],
    ['Contact us','/contact/']
  ])}${mobileSection('Your APG',[
    ['My APG','/my-apg/',{account:true}],
    ['Log in / Join','/my-apg/',{account:true}]
  ])}`;
}

function stripProductTrust(html){
  const source=String(html||''),start=source.search(/<div\b[^>]*id=["']megaProducts["'][^>]*>/i);
  if(start<0)return source;
  let end=source.search(/<nav\b[^>]*id=["']mobileNav["'][^>]*>/i);
  if(end<0||end<=start)end=source.indexOf('</header>',start);
  if(end<0||end<=start)return source;
  let mega=source.slice(start,end);
  mega=mega.replace(/<section\b[^>]*>[\s\S]*?<h3\b[^>]*>\s*Trust\s*&(?:amp;)?\s*transparency\s*<\/h3>[\s\S]*?<\/section>/gi,'');
  mega=mega.replace(new RegExp(`<a\\b[^>]*href=["']\\/${TRUST_ROUTES}\\/["'][^>]*>[\\s\\S]*?<\\/a>`,'gi'),'');
  return source.slice(0,start)+mega+source.slice(end);
}
function enhanceDesktop(html){
  return String(html||'').replace(/(<nav\b[^>]*class=["'][^"']*\bprimary-nav\b[^"']*["'][^>]*>[\s\S]*?<div\b[^>]*class=["'][^"']*\bnav-inner\b[^"']*["'][^>]*>)([\s\S]*?)(<\/div>\s*<\/nav>)/i,(match,open,inner,close)=>{
    if(/data-apg-about-trust/i.test(inner))return match;
    let next=inner.replace(/<a\b[^>]*href=["']\/methodology\/["'][^>]*>[\s\S]*?How we compare[\s\S]*?<\/a>/gi,'');
    next=next.replace(/\s+$/,'');
    return `${open}${next}${desktopAboutTrust()}${close}`;
  });
}
function enhanceMobile(html){
  return String(html||'').replace(/(<nav\b[^>]*id=["']mobileNav["'][^>]*>)([\s\S]*?)(<\/nav>)/i,(match,open,inside,close)=>{
    if(/data-apg-about-trust-mobile/i.test(inside))return match;
    const search=(inside.match(/<form\b[^>]*class=["'][^"']*\bapg-mobile-search\b[^"']*["'][^>]*>[\s\S]*?<\/form>/i)||[])[0]||'';
    const wrapOpen=(inside.match(/<div\b[^>]*class=["'][^"']*\bmobile-nav-inner\b[^"']*["'][^>]*>/i)||[])[0]||'<div class="wrap mobile-nav-inner">';
    return `${open}${wrapOpen}<div data-apg-about-trust-mobile="v${VERSION}">${mobileNavigationContent(search)}</div></div>${close}`;
  });
}
function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-about-trust-navigation"'))out=out.replace('</head>',`<meta name="apg-about-trust-navigation" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function transformHtml(html){
  let out=String(html||'');
  if(!out||out.includes('name="apg-about-trust-navigation"'))return out;
  out=stripProductTrust(out);
  out=enhanceDesktop(out);
  out=enhanceMobile(out);
  return injectAssets(out);
}

const css=String.raw`
/* APG About & Trust Navigation v116.0 */
.apg-about-trust-menu{position:relative;margin-left:auto;min-width:0;color:#102f4a}
.apg-about-trust-menu>summary{list-style:none;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:9px 13px;border-radius:9px;color:inherit;font:inherit;font-weight:700;white-space:nowrap;cursor:pointer;user-select:none}
.apg-about-trust-menu>summary::-webkit-details-marker{display:none}
.apg-about-trust-menu>summary:hover,.apg-about-trust-menu>summary:focus-visible,.apg-about-trust-menu[open]>summary{background:#eff6ff!important;color:#1d4ed8!important}
.apg-about-trust-menu>summary:focus-visible{outline:3px solid rgba(37,99,235,.3)!important;outline-offset:2px}
.apg-about-trust-chevron{font-size:15px;line-height:1;transition:transform .16s ease}
.apg-about-trust-menu[open] .apg-about-trust-chevron{transform:rotate(180deg)}
.apg-about-trust-popover{position:absolute;right:0;top:calc(100% + 7px);z-index:190;width:min(720px,calc(100vw - 32px));overflow:hidden;border:1px solid #dbe5ef;border-radius:18px;background:#fff;box-shadow:0 24px 70px rgba(15,47,74,.2)}
.apg-about-trust-intro{display:grid;gap:3px;padding:18px 20px;border-bottom:1px solid #e5edf5;background:linear-gradient(100deg,#f8fbff,#fff)}
.apg-about-trust-intro>span,.apg-about-trust-column h3{font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#1d4ed8}
.apg-about-trust-intro>strong{font-size:16px;letter-spacing:-.01em;color:#102f4a}
.apg-about-trust-intro>small{font-size:11px;line-height:1.45;color:#64748b;max-width:610px}
.apg-about-trust-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0}
.apg-about-trust-column{padding:15px 14px 17px;min-width:0}
.apg-about-trust-column+.apg-about-trust-column{border-left:1px solid #edf2f7}
.apg-about-trust-column section+section{margin-top:15px;padding-top:13px;border-top:1px solid #edf2f7}
.apg-about-trust-column h3{margin:0 0 7px;padding:0 6px;color:#64748b}
.apg-about-trust-column a{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:42px;padding:8px 9px;border-radius:10px;color:#1e3a52;text-decoration:none;font-size:12px;font-weight:720;line-height:1.25}
.apg-about-trust-column a:hover,.apg-about-trust-column a:focus-visible{background:#eff6ff;color:#1d4ed8}
.apg-about-trust-column a:focus-visible{outline:2px solid #2563eb;outline-offset:1px}
.apg-about-trust-contact-link{margin-top:3px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8!important}
.apg-about-trust-contact-link:hover,.apg-about-trust-contact-link:focus-visible{border-color:#93c5fd;background:#dbeafe!important}
.apg-mobile-v8 [data-apg-about-trust-mobile]{display:contents}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:10px 12px;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;font-weight:650;text-align:left;cursor:pointer}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:hover,.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:focus-visible,.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:active{background:#eff6ff!important;color:#1d4ed8!important}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:focus-visible{outline:2px solid #2563eb!important;outline-offset:-2px!important}
@media(max-width:1120px){.apg-about-trust-menu>summary{padding-inline:10px;font-size:12.5px}.apg-about-trust-popover{width:min(680px,calc(100vw - 24px))}}
@media(max-width:920px){.apg-about-trust-menu{display:none!important}}
@media(prefers-reduced-motion:reduce){.apg-about-trust-chevron{transition:none}}
`;

const clientJs=String.raw`(()=>{
'use strict';
if(window.__APG_ABOUT_TRUST_NAV_V116__)return;window.__APG_ABOUT_TRUST_NAV_V116__='${VERSION}';
const trust=document.querySelector('[data-apg-about-trust]');
if(!trust)return;
const productsTrigger=document.querySelector('[data-discovery-trigger]');
const productsMenu=document.querySelector('[data-discovery-menu]');
function closeTrust(){if(trust.open)trust.open=false}
function closeProducts(){if(productsMenu)productsMenu.hidden=true;if(productsTrigger)productsTrigger.setAttribute('aria-expanded','false');document.body.classList.remove('apg-discovery-open')}
trust.addEventListener('toggle',()=>{if(trust.open)closeProducts()});
productsTrigger?.addEventListener('click',()=>closeTrust());
document.addEventListener('click',event=>{if(trust.open&&!trust.contains(event.target))closeTrust()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&trust.open){event.preventDefault();closeTrust();trust.querySelector('summary')?.focus()}});
})();`;

function sendAsset(req,res,type,body){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-About-Trust-Navigation','v'+VERSION);
  return res.end(req.method==='HEAD'?'':body);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('about/trust navigation requires downstream handler');
  function handler(req,res){
    let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',css);
    if(path===JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformHtml(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-About-Trust-Navigation','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{ABOUT_TRUST_NAVIGATION_VERSION:VERSION,ABOUT_TRUST_NAVIGATION_CSS_PATH:CSS_PATH,ABOUT_TRUST_NAVIGATION_JS_PATH:JS_PATH});
  return handler;
}
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v116 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.ABOUT_TRUST_NAVIGATION_V116_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function aboutTrustAwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.ABOUT_TRUST_NAVIGATION_V116_INSTALLED=true;
  wholeSiteExperience.ABOUT_TRUST_NAVIGATION_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={VERSION,CSS_PATH,JS_PATH,desktopAboutTrust,mobileNavigationContent,stripProductTrust,enhanceDesktop,enhanceMobile,injectAssets,transformHtml,css,clientJs,wrap,install};
