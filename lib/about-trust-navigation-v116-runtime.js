'use strict';

// APG About & Trust Navigation v116.6.
// Presentation-only navigation layer. It promotes APG company, methodology, evidence,
// accountability and contact routes into a dedicated desktop/mobile navigation family.
// v116.6 aligns the mobile Scout launcher to the exact mobile-link row geometry and
// typography while preserving Scout behaviour and all recommendation/commerce logic.
// It does not change product eligibility, recommendation scoring, retailer ranking,
// catalogue evidence or shopper decision state.
const VERSION='116.6';
const CSS_PATH='/assets/about-trust-navigation-v116.css';
const JS_PATH='/assets/about-trust-navigation-v116.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

const TRUST_ROUTES='(?:about|contact|methodology|editorial-standards|sources|corrections-policy|affiliate-disclosure|coverage|updates)';
const MOBILE_SOCIAL_PROFILES=Object.freeze([
  ['Facebook','https://www.facebook.com/share/1CdD3Vdfrm/?mibextid=wwXIfr','facebook'],
  ['Instagram','https://www.instagram.com/australianproductguide/','instagram'],
  ['Threads','https://www.threads.net/@australianproductguide','threads'],
  ['X','https://x.com/AusProductGuide','x'],
  ['Pinterest','https://www.pinterest.com/AustralianProductGuide/','pinterest'],
  ['LinkedIn','https://www.linkedin.com/company/australian-product-guide/','linkedin']
]);
const SOCIAL_ICONS=Object.freeze({
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-7.3h2.5l.4-3h-2.9V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.2H8v3h2.5V21h3.2Z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
  threads:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.2l3.7 5.1L17.3 4H20l-5.8 6.8L20.5 20h-4.2l-4-5.6L7.5 20H4.8l6.1-7.3L5 4Zm3 1.8 9.2 12.4h1.3L9.3 5.8H8Z"/></svg>',
  pinterest:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5A2.5 2.5 0 1 1 5 8.5 2.5 2.5 0 0 1 5 3.5ZM3 10h4v11H3V10Zm6.5 0h3.8v1.5h.1c.5-1 1.9-2 3.9-2 4.2 0 4.9 2.7 4.9 6.3V21h-4v-4.6c0-2.2 0-3.7-2.3-3.7-2.3 0-2.6 1.8-2.6 3.6V21h-4V10Z"/></svg>'
});

function trustLink(label,href,extra=''){
  return `<a${extra?` class="${esc(extra)}"`:''} href="${esc(href)}"><span>${esc(label)}</span><span aria-hidden="true">→</span></a>`;
}
function desktopAboutTrust(){
  return `<details class="apg-about-trust-menu" data-apg-about-trust><summary>About &amp; trust <span class="apg-about-trust-chevron" aria-hidden="true">⌄</span></summary><div class="apg-about-trust-popover" role="group" aria-label="About and trust"><div class="apg-about-trust-intro"><span>About Australian Product Guide</span><strong>See how APG works — and how to reach us.</strong><small>Methodology, evidence standards, corrections and commercial transparency remain easy to inspect while you shop.</small></div><div class="apg-about-trust-grid"><div class="apg-about-trust-column"><section><h3>About APG</h3>${trustLink('About us','/about/')}</section><section><h3>How we work</h3>${trustLink('How we compare','/methodology/')}${trustLink('Editorial standards','/editorial-standards/')}</section></div><div class="apg-about-trust-column"><section><h3>Evidence &amp; transparency</h3>${trustLink('Sources & provenance','/sources/')}${trustLink('Coverage','/coverage/')}${trustLink('Recently updated','/updates/')}</section></div><div class="apg-about-trust-column"><section><h3>Accountability</h3>${trustLink('Corrections','/corrections-policy/')}${trustLink('Commercial transparency','/affiliate-disclosure/')}</section><section class="apg-about-trust-contact"><h3>Talk to us</h3>${trustLink('Contact us','/contact/','apg-about-trust-contact-link')}</section></div></div></div></details>`;
}
function mobileItem(label,href,{scout=false,account=false}={}){
  if(scout)return `<button type="button" class="apg-mobile-nav-action" data-apg-system-scout aria-label="Ask Scout"><span>${esc(label)}</span><span aria-hidden="true">→</span></button>`;
  return `<a${account?' class="apg-mobile-account-entry"':''} href="${esc(href)}"><span>${esc(label)}</span><span aria-hidden="true">→</span></a>`;
}
function mobileSection(title,items){
  return `<details class="mobile-section"><summary>${esc(title)}</summary><div>${items.map(item=>mobileItem(item[0],item[1],item[2]||{})).join('')}</div></details>`;
}
function socialIcon(key){return SOCIAL_ICONS[key]||'';}
function mobileSocial(){
  return `<section class="apg-mobile-social-v56" aria-labelledby="apgMobileSocialHeading"><div class="apg-mobile-social-v56-head"><strong id="apgMobileSocialHeading">Follow APG</strong><small>Buying tips and fresh product research.</small></div><div class="apg-mobile-social-v56-list">${MOBILE_SOCIAL_PROFILES.map(([label,href,key])=>`<a class="apg-mobile-social-v56-link is-${key}" href="${esc(href)}" target="_blank" rel="me noopener noreferrer" aria-label="Australian Product Guide on ${esc(label)} (opens in a new tab)"><span class="apg-mobile-social-v56-icon" aria-hidden="true">${socialIcon(key)}</span><span class="apg-mobile-social-v56-name">${esc(label)}</span><span class="apg-mobile-social-v56-external" aria-hidden="true">↗</span></a>`).join('')}</div></section>`;
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
  ])}${mobileSocial()}`;
}

function stripProductTrust(html){
  const source=String(html||''),start=source.search(/<div\b[^>]*id=["']megaProducts["'][^>]*>/i);
  if(start<0)return source;
  let end=source.search(/<nav\b[^>]*id=["']mobileNav["'][^>]*>/i);
  if(end<0||end<=start)end=source.indexOf('</header>',start);
  if(end<0||end<=start)return source;
  let mega=source.slice(start,end);
  mega=mega.replace(/<section\b[^>]*>\s*<h3\b[^>]*>\s*Trust\s*&(?:amp;)?\s*transparency\s*<\/h3>[\s\S]*?<\/section>/gi,'');
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
/* APG About & Trust Navigation v116.6 */
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
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action{-webkit-appearance:none!important;appearance:none!important;display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;min-height:44px;padding:8px 0!important;margin:0!important;border:0;border-radius:8px;background:transparent!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-family:inherit!important;font-size:16px!important;font-style:normal!important;font-weight:750!important;line-height:inherit!important;letter-spacing:normal!important;text-transform:none!important;text-align:left;opacity:1!important;cursor:pointer;box-sizing:border-box}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action span{color:inherit!important;-webkit-text-fill-color:inherit!important;font:inherit!important;letter-spacing:inherit!important;text-transform:inherit!important;opacity:1!important}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:hover{background:transparent!important;color:#2563eb!important;-webkit-text-fill-color:#2563eb!important}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:focus-visible{background:transparent!important;color:#2563eb!important;-webkit-text-fill-color:#2563eb!important;outline:3px solid var(--focus)!important;outline-offset:2px!important}
.apg-mobile-v8 .mobile-section .apg-mobile-nav-action:active{background:transparent!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
.apg-mobile-v8 [data-apg-about-trust-mobile] .mobile-section button.apg-mobile-nav-action[data-apg-system-scout]{padding:8px 0!important;margin:0!important;border-radius:8px!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-family:inherit!important;font-size:16px!important;font-style:normal!important;font-weight:750!important;line-height:inherit!important;letter-spacing:normal!important;text-transform:none!important}
.apg-mobile-v8 [data-apg-about-trust-mobile] .mobile-section button.apg-mobile-nav-action[data-apg-system-scout]>span{color:inherit!important;-webkit-text-fill-color:inherit!important;font:inherit!important;letter-spacing:inherit!important;text-transform:inherit!important;opacity:1!important}
.apg-mobile-v8 .apg-mobile-social-v56{order:999;margin:14px 0 4px;padding:14px;border:1px solid #dbe5ef;border-radius:16px;background:#f8fafc}
.apg-mobile-v8 .apg-mobile-social-v56-head{display:grid;gap:2px;margin:0 0 10px;padding:0 2px}
.apg-mobile-v8 .apg-mobile-social-v56-head strong{color:#0f172a;font-size:14px;font-weight:850;line-height:1.3}
.apg-mobile-v8 .apg-mobile-social-v56-head small{color:#64748b;font-size:11px;font-weight:600;line-height:1.4}
.apg-mobile-v8 .apg-mobile-social-v56-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
.apg-mobile-v8 .apg-mobile-social-v56-link{display:grid!important;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:48px;padding:9px 10px!important;border:1px solid #e2e8f0!important;border-radius:12px!important;background:#fff!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;font-size:12px;font-weight:800;line-height:1.2;text-decoration:none!important;box-shadow:none!important}
.apg-mobile-v8 .apg-mobile-social-v56-link:hover,.apg-mobile-v8 .apg-mobile-social-v56-link:focus-visible,.apg-mobile-v8 .apg-mobile-social-v56-link:active{background:#eff6ff!important;color:#1d4ed8!important;-webkit-text-fill-color:#1d4ed8!important;border-color:#bfdbfe!important}
.apg-mobile-v8 .apg-mobile-social-v56-link:focus-visible{outline:2px solid #2563eb!important;outline-offset:2px!important}
.apg-mobile-v8 .apg-mobile-social-v56-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:#eef3f8;color:#173a59;-webkit-text-fill-color:#173a59}
.apg-mobile-v8 .apg-mobile-social-v56-link:hover .apg-mobile-social-v56-icon,.apg-mobile-v8 .apg-mobile-social-v56-link:focus-visible .apg-mobile-social-v56-icon{background:#dbeafe;color:#1d4ed8;-webkit-text-fill-color:#1d4ed8}
.apg-mobile-v8 .apg-mobile-social-v56-icon svg{display:block;width:18px;height:18px;fill:currentColor;overflow:visible}
.apg-mobile-v8 .apg-mobile-social-v56-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit!important;-webkit-text-fill-color:currentColor!important}
.apg-mobile-v8 .apg-mobile-social-v56-external{font-size:12px;color:#64748b!important;-webkit-text-fill-color:#64748b!important}
@media(max-width:1120px){.apg-about-trust-menu>summary{padding-inline:10px;font-size:12.5px}.apg-about-trust-popover{width:min(680px,calc(100vw - 24px))}}
@media(max-width:920px){.apg-about-trust-menu{display:none!important}}
@media(max-width:350px){.apg-mobile-v8 .apg-mobile-social-v56-list{grid-template-columns:minmax(0,1fr)!important}}
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

module.exports={VERSION,CSS_PATH,JS_PATH,desktopAboutTrust,mobileNavigationContent,mobileSocial,socialIcon,stripProductTrust,enhanceDesktop,enhanceMobile,injectAssets,transformHtml,css,clientJs,wrap,install};