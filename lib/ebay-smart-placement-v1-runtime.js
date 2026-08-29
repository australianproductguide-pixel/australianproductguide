'use strict';

// APG eBay Smart Placement pilot v1.4
//
// v1.3 proved the server-rendered fallback concept, but the owner captured a Production state where
// the new HTML was present while a stale/unapplied stylesheet left the component visually raw and
// the staged 900x220 eBay unit occupied customer-facing space. v1.4 therefore makes presentation
// fail-safe as well as content fail-safe:
// - a new cache-busted asset path prevents stale v1.3 CSS/JS reuse;
// - critical component CSS is emitted with the SSR component itself;
// - the dynamic eBay unit has an inline off-canvas guard, so it cannot create blank page space even
//   if every APG stylesheet fails;
// - official 125px eBay creatives are used at an appropriate native scale inside a premium APG
//   marketplace panel rather than stretched as hero photography;
// - successful Smart Placement paint augments the APG-designed spotlight instead of replacing it.
// Retailer participation and commission continue to contribute zero recommendation/ranking points.

const official=require('../data/ebay-official-creatives-v121');

const VERSION='1.4';
const CONFIG_ID='001370a99f586b44ba848056';
const SMART_TOOLS_SRC='https://epnt.ebay.com/static/epn-smart-tools.js';
const CSS_PATH='/assets/ebay-smart-placement-v14.css';
const LOADER_PATH='/assets/ebay-smart-placement-v14.js';
const FEATURED=[
  official.CREATIVES.tech,
  official.CREATIVES.certifiedRefurbished,
  official.CREATIVES.homeGarden
];

function esc(value){return String(value==null?'':value).replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));}

const CSS=`
.apg-ebay-smart-placement{padding:24px 0 34px}
.apg-ebay-smart-placement__shell{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(96,165,250,.34);border-radius:28px;background:radial-gradient(circle at 83% 12%,rgba(56,189,248,.30),transparent 31%),radial-gradient(circle at 12% 100%,rgba(37,99,235,.24),transparent 34%),linear-gradient(135deg,#07152f 0%,#0b2550 50%,#103b73 100%);box-shadow:0 24px 64px rgba(15,23,42,.18),0 4px 16px rgba(37,99,235,.10);color:#fff}
.apg-ebay-smart-placement__shell:before,.apg-ebay-smart-placement__shell:after{content:"";position:absolute;z-index:-1;border-radius:999px;pointer-events:none}
.apg-ebay-smart-placement__shell:before{width:420px;height:420px;right:-205px;top:-230px;border:1px solid rgba(255,255,255,.12)}
.apg-ebay-smart-placement__shell:after{width:260px;height:260px;right:-75px;top:-128px;border:1px solid rgba(255,255,255,.09)}
.apg-ebay-smart-placement__static{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(390px,.92fr);gap:38px;align-items:center;padding:38px 40px 30px}
.apg-ebay-smart-placement__copy{max-width:720px}
.apg-ebay-smart-placement__eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 14px;padding:7px 11px;border:1px solid rgba(186,230,253,.24);border-radius:999px;background:rgba(255,255,255,.08);color:#dbeafe;font-size:.74rem;font-weight:850;letter-spacing:.09em;text-transform:uppercase;line-height:1}
.apg-ebay-smart-placement__eyebrow:before{content:"";width:8px;height:8px;border-radius:999px;background:#38bdf8;box-shadow:0 0 0 4px rgba(56,189,248,.13)}
.apg-ebay-smart-placement__copy h2{margin:0;max-width:720px;color:#fff;font-size:clamp(2.15rem,3.55vw,3.65rem);font-weight:850;line-height:1.01;letter-spacing:-.047em;text-wrap:balance}
.apg-ebay-smart-placement__copy>p{margin:16px 0 0;max-width:650px;color:#dbe7f6;font-size:1.03rem;line-height:1.65}
.apg-ebay-smart-placement__actions{display:flex;align-items:center;flex-wrap:wrap;gap:11px;margin-top:23px}
.apg-ebay-smart-placement__cta,.apg-ebay-smart-placement__secondary{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:12px;text-decoration:none!important;font-weight:800;transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.apg-ebay-smart-placement__cta{background:#fff;color:#0f2c57!important;box-shadow:0 12px 28px rgba(2,8,23,.22)}
.apg-ebay-smart-placement__cta:hover{transform:translateY(-1px);box-shadow:0 16px 34px rgba(2,8,23,.27);background:#f8fbff}
.apg-ebay-smart-placement__secondary{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);color:#fff!important}
.apg-ebay-smart-placement__secondary:hover{transform:translateY(-1px);background:rgba(255,255,255,.11)}
.apg-ebay-smart-placement__trust{display:flex;align-items:center;gap:8px;margin-top:17px;color:#bfdbfe;font-size:.81rem;line-height:1.45}
.apg-ebay-smart-placement__trust:before{content:"✓";display:grid;place-items:center;flex:0 0 auto;width:19px;height:19px;border-radius:999px;background:rgba(56,189,248,.16);color:#7dd3fc;font-weight:900}
.apg-ebay-smart-placement__visual{position:relative;padding:18px;border:1px solid rgba(255,255,255,.68);border-radius:22px;background:rgba(255,255,255,.96);box-shadow:0 22px 48px rgba(2,8,23,.24);backdrop-filter:blur(12px)}
.apg-ebay-smart-placement__visual-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
.apg-ebay-smart-placement__visual-head strong{display:block;color:#0f172a;font-size:.98rem;line-height:1.25}
.apg-ebay-smart-placement__visual-head span{display:block;margin-top:3px;color:#64748b;font-size:.73rem;line-height:1.35}
.apg-ebay-smart-placement__badge{flex:0 0 auto!important;margin:0!important;padding:6px 9px;border-radius:999px;background:#eff6ff;color:#1d4ed8!important;font-size:.66rem!important;font-weight:850;letter-spacing:.04em;text-transform:uppercase}
.apg-ebay-smart-placement__tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.apg-ebay-smart-placement__tile{display:flex;min-width:0;flex-direction:column;align-items:center;gap:8px;padding:10px 8px 9px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;text-align:center;text-decoration:none!important;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
.apg-ebay-smart-placement__tile:hover{transform:translateY(-2px);border-color:#93c5fd;box-shadow:0 10px 24px rgba(15,23,42,.09)}
.apg-ebay-smart-placement__tile img{display:block;width:94px;height:94px;max-width:100%;object-fit:contain;border-radius:9px;background:#fff}
.apg-ebay-smart-placement__tile strong{display:block;min-height:2.35em;color:#0f172a;font-size:.76rem;line-height:1.18}
.apg-ebay-smart-placement__visual-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding:11px 2px 0;border-top:1px solid #e2e8f0;color:#64748b;font-size:.72rem;line-height:1.35}
.apg-ebay-smart-placement__visual-foot a{color:#2563eb!important;font-weight:800;text-decoration:none!important}
.apg-ebay-smart-placement__dynamic{margin:0 40px 24px;padding:18px;border:1px solid rgba(255,255,255,.72);border-radius:20px;background:#fff;color:#0f172a;box-shadow:0 16px 38px rgba(2,8,23,.20)}
.apg-ebay-smart-placement__dynamic-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.apg-ebay-smart-placement__dynamic-head strong{font-size:.91rem}.apg-ebay-smart-placement__dynamic-head span{color:#64748b;font-size:.72rem}
.apg-ebay-smart-placement__frame{max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;min-height:220px}
.apg-ebay-smart-placement__unit{display:block;width:900px;min-width:900px;min-height:220px;max-width:none;margin:0 auto}
.apg-ebay-smart-placement__micro{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin:0 40px 22px;padding-top:15px;border-top:1px solid rgba(219,234,254,.17);color:#b7c8df;font-size:.75rem;line-height:1.5}
.apg-ebay-smart-placement__micro strong{color:#eaf3ff}.apg-ebay-smart-placement__micro a{flex:0 0 auto;color:#dbeafe!important;font-weight:800;text-decoration:none!important}
@media(max-width:980px){.apg-ebay-smart-placement__static{grid-template-columns:1fr;gap:27px}.apg-ebay-smart-placement__visual{max-width:680px}.apg-ebay-smart-placement__copy h2{max-width:800px}}
@media(max-width:620px){
 .apg-ebay-smart-placement{padding:18px 0 26px}
 .apg-ebay-smart-placement__shell{border-radius:22px}
 .apg-ebay-smart-placement__static{padding:23px 20px 21px;gap:23px}
 .apg-ebay-smart-placement__copy h2{font-size:clamp(1.95rem,9.5vw,2.65rem)}
 .apg-ebay-smart-placement__copy>p{font-size:.96rem}
 .apg-ebay-smart-placement__actions{align-items:stretch;flex-direction:column}
 .apg-ebay-smart-placement__cta,.apg-ebay-smart-placement__secondary{width:100%}
 .apg-ebay-smart-placement__visual{padding:13px;border-radius:18px}
 .apg-ebay-smart-placement__visual-head{display:block}.apg-ebay-smart-placement__badge{display:inline-block!important;margin-top:8px!important}
 .apg-ebay-smart-placement__tiles{gap:7px}
 .apg-ebay-smart-placement__tile{padding:8px 5px 7px;border-radius:12px}.apg-ebay-smart-placement__tile img{width:76px;height:76px}.apg-ebay-smart-placement__tile strong{font-size:.68rem}
 .apg-ebay-smart-placement__visual-foot{display:block}.apg-ebay-smart-placement__visual-foot a{display:inline-block;margin-top:5px}
 .apg-ebay-smart-placement__dynamic{margin:0 20px 18px;padding:13px}
 .apg-ebay-smart-placement__micro{display:block;margin:0 20px 18px}.apg-ebay-smart-placement__micro a{display:inline-block;margin-top:7px}
}
@media(prefers-reduced-motion:reduce){.apg-ebay-smart-placement__cta,.apg-ebay-smart-placement__secondary,.apg-ebay-smart-placement__tile{transition:none}.apg-ebay-smart-placement__cta:hover,.apg-ebay-smart-placement__secondary:hover,.apg-ebay-smart-placement__tile:hover{transform:none}}
`;

const LOADER=`'use strict';(function(){
  function boot(){
    var root=document.querySelector('[data-apg-ebay-smart-placement="v${VERSION}"]');
    if(!root)return;
    var dynamic=root.querySelector('[data-apg-ebay-smart-dynamic="true"]');
    var unit=root.querySelector('.epn-placement[data-config-id="${CONFIG_ID}"]');
    if(!dynamic||!unit)return;
    var observer;
    var painted=false;
    function hasPaint(){
      try{
        if(unit.shadowRoot&&unit.shadowRoot.querySelector&&unit.shadowRoot.querySelector('iframe,a[href],img[src]'))return true;
        if(unit.querySelector&&unit.querySelector('iframe'))return true;
        if(unit.querySelector&&unit.querySelector('a[href],img[src]'))return true;
        return unit.childElementCount>1&&String(unit.textContent||'').replace(/\\s+/g,' ').trim().length>20;
      }catch{return false;}
    }
    function promote(){
      if(painted||!hasPaint())return false;
      painted=true;
      dynamic.style.cssText='position:relative;left:auto;top:auto;width:auto;min-height:0;overflow:visible;visibility:visible;pointer-events:auto';
      dynamic.setAttribute('aria-hidden','false');
      root.setAttribute('data-apg-ebay-load-state','paint-detected');
      if(observer)observer.disconnect();
      return true;
    }
    root.setAttribute('data-apg-ebay-load-state','placement-ready');
    try{observer=new MutationObserver(promote);observer.observe(unit,{childList:true,subtree:true,attributes:true});}catch{}
    var checks=[350,900,1800,3500,7000,12000];
    function scheduleChecks(){checks.forEach(function(ms){window.setTimeout(function(){if(!promote()&&ms===7000&&!painted)root.setAttribute('data-apg-ebay-load-state','static-fallback');},ms);});}
    var existing=document.querySelector('script[data-apg-ebay-smart-tools="true"]');
    if(existing){scheduleChecks();return;}
    var s=document.createElement('script');
    s.async=true;
    s.src='${SMART_TOOLS_SRC}';
    s.setAttribute('data-apg-ebay-smart-tools','true');
    s.onload=function(){if(!painted)root.setAttribute('data-apg-ebay-load-state','script-loaded');scheduleChecks();};
    s.onerror=function(){if(!painted)root.setAttribute('data-apg-ebay-load-state','static-fallback');};
    document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

function addSourceToDirective(csp,directive,source){
  const re=new RegExp(`(^|;\\s*)${directive}\\s+([^;]*)`,'i');
  if(!re.test(csp))return csp;
  return csp.replace(re,(match,prefix,sources)=>{
    const values=String(sources).trim().split(/\\s+/).filter(Boolean);
    if(!values.includes(source))values.push(source);
    return `${prefix}${directive} ${values.join(' ')}`;
  });
}

function extendCsp(value,path){
  let csp=String(value||'');
  if(path!=='/deals/')return csp;
  csp=addSourceToDirective(csp,'script-src','https://epnt.ebay.com');
  csp=addSourceToDirective(csp,'connect-src','https://epnt.ebay.com');
  csp=addSourceToDirective(csp,'connect-src','https://*.ebay.com');
  csp=addSourceToDirective(csp,'connect-src','https://*.ebay.com.au');
  csp=addSourceToDirective(csp,'img-src','https://epnt.ebay.com');
  csp=addSourceToDirective(csp,'img-src','https://i.ebayimg.com');
  csp=addSourceToDirective(csp,'img-src','https://*.ebayimg.com');
  csp=addSourceToDirective(csp,'img-src','https://*.ebaystatic.com');
  csp=addSourceToDirective(csp,'style-src',"'unsafe-inline'");
  csp=addSourceToDirective(csp,'style-src','https://epnt.ebay.com');
  csp=addSourceToDirective(csp,'frame-src','https://epnt.ebay.com');
  csp=addSourceToDirective(csp,'frame-src','https://www.ebay.com.au');
  csp=addSourceToDirective(csp,'frame-src','https://*.ebay.com.au');
  return csp;
}

function tile(creative){
  return `<a class="apg-ebay-smart-placement__tile" href="${esc(creative.destination)}" target="_blank" rel="sponsored nofollow noopener" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="official-creative-spotlight" data-affiliate-placement="ebay_smart_spotlight_${esc(creative.key)}" data-affiliate-context="marketplace_spotlight" data-affiliate-destination="${esc(creative.key)}"><img src="${esc(creative.image)}" alt="${esc(creative.alt)}" width="125" height="125" loading="eager" decoding="async"><strong>${esc(creative.title)}</strong></a>`;
}

function section(){
  const tech=official.CREATIVES.tech;
  return `<style data-apg-ebay-smart-critical="v${VERSION}">${CSS}</style><section class="section apg-ebay-smart-placement" data-apg-ebay-smart-placement="v${VERSION}" data-apg-ebay-load-state="ssr-ready" aria-labelledby="apgEbaySmartPlacementTitle"><div class="wrap"><div class="apg-ebay-smart-placement__shell"><div class="apg-ebay-smart-placement__static" data-apg-ebay-smart-static="premium-marketplace"><div class="apg-ebay-smart-placement__copy"><p class="apg-ebay-smart-placement__eyebrow">eBay Australia · marketplace discovery</p><h2 id="apgEbaySmartPlacementTitle">Explore eBay Australia. Decide with APG.</h2><p>Browse current eBay marketplace options, including tech and refurbished categories, then use Australian Product Guide’s independent research and decision tools to work out what actually fits your needs.</p><div class="apg-ebay-smart-placement__actions"><a class="apg-ebay-smart-placement__cta" href="${esc(tech.destination)}" target="_blank" rel="sponsored nofollow noopener" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="affiliate-search" data-affiliate-placement="ebay_smart_spotlight_primary" data-affiliate-context="marketplace_spotlight" data-affiliate-destination="tech">Browse eBay Australia <span aria-hidden="true">↗</span></a><a class="apg-ebay-smart-placement__secondary" href="/decision-lab/">Check what suits you in Decision Lab <span aria-hidden="true">→</span></a></div><span class="apg-ebay-smart-placement__trust">Marketplace availability and commission never increase an APG recommendation score.</span></div><aside class="apg-ebay-smart-placement__visual" aria-label="Browse eBay Australia categories"><div class="apg-ebay-smart-placement__visual-head"><div><strong>Browse current eBay categories</strong><span>Retailer discovery shortcuts using official eBay creative.</span></div><span class="apg-ebay-smart-placement__badge">Official eBay creative</span></div><div class="apg-ebay-smart-placement__tiles">${FEATURED.map(tile).join('')}</div><div class="apg-ebay-smart-placement__visual-foot"><span>Current marketplace results can change.</span><a href="/retailers/">How APG handles retailers →</a></div></aside></div><div class="apg-ebay-smart-placement__dynamic" data-apg-ebay-smart-dynamic="true" aria-hidden="true" aria-label="Live eBay Australia Smart Placement" style="position:absolute!important;left:-10000px!important;top:0!important;width:900px!important;min-height:220px!important;overflow:hidden!important;visibility:hidden!important;pointer-events:none!important"><div class="apg-ebay-smart-placement__dynamic-head"><strong>Live eBay marketplace discovery</strong><span>Supplied dynamically by eBay Australia</span></div><div class="apg-ebay-smart-placement__frame"><ins class="epn-placement apg-ebay-smart-placement__unit" data-config-id="${CONFIG_ID}"></ins></div></div><div class="apg-ebay-smart-placement__micro"><span><strong>Paid retailer content.</strong> APG may earn a commission from qualifying eBay purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.</span><a href="/affiliate-disclosure/">Commercial transparency →</a></div></div></div></section>`;
}

function addHeadAssets(html){
  let out=String(html);
  if(!out.includes(`href="${CSS_PATH}"`))out=out.replace(/<\/head>/i,`<link rel="stylesheet" href="${CSS_PATH}"><script src="${LOADER_PATH}" defer data-apg-ebay-smart-loader="v${VERSION}"></script></head>`);
  return out;
}

function enhanceDeals(html,path){
  if(path!=='/deals/')return String(html);
  let out=String(html);
  if(!out.includes('data-apg-ebay-smart-placement=')){
    const highAnchor='<section class="section apg-amz-v41 apg-amz-v41-deals"';
    const fallbackAnchor='<section id="shopping-destinations"';
    if(out.includes(highAnchor))out=out.replace(highAnchor,`${section()}${highAnchor}`);
    else if(out.includes(fallbackAnchor))out=out.replace(fallbackAnchor,`${section()}${fallbackAnchor}`);
    else out=out.replace(/<\/main>/i,`${section()}</main>`);
  }
  return addHeadAssets(out);
}

function enhanceTrust(html,path){
  let out=String(html);
  if(path==='/affiliate-disclosure/'&&!out.includes('data-apg-ebay-smart-disclosure=')){
    const paragraph='<p data-apg-ebay-smart-disclosure="true"><strong>Embedded eBay marketplace content.</strong> Selected retailer-discovery pages may include an eBay Smart Placement supplied dynamically by eBay. APG also keeps a server-rendered marketplace spotlight using owner-supplied official eBay category creative so the customer experience does not depend on the third-party widget loading. These retailer surfaces are paid content, are not APG recommendations, and contribute zero points to APG product suitability or retailer ranking.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  if(path==='/privacy/'&&!out.includes('data-apg-ebay-smart-privacy=')){
    const paragraph='<p data-apg-ebay-smart-privacy="true"><strong>Embedded eBay marketplace content.</strong> On selected retailer-discovery pages, APG may load an eBay Partner Network Smart Placement supplied by eBay. When that third-party content loads, eBay may process technical browser, device and interaction information under its own privacy practices to deliver and measure the marketplace content. APG does not pass a signed-in account identifier, search query, Decision Lab answers or other APG decision-state fields to the Smart Placement configuration. APG retains a server-rendered official eBay category-creative spotlight when the dynamic placement is unavailable. Neither state influences APG recommendation or retailer ranking logic.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  return out;
}

function transform(html,path){
  let out=String(html||'');
  if(!out||!/<html|<!doctype/i.test(out))return out;
  out=enhanceDeals(out,path);
  return enhanceTrust(out,path);
}

function assetResponse(req,res,path){
  if(path!==CSS_PATH&&path!==LOADER_PATH)return false;
  if(!['GET','HEAD'].includes(String(req.method||'GET').toUpperCase())){
    res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.setHeader('Cache-Control','no-store');res.end('');return true;
  }
  const isCss=path===CSS_PATH;
  const body=isCss?CSS:LOADER;
  res.statusCode=200;
  res.setHeader('Content-Type',isCss?'text/css; charset=utf-8':'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.end(String(req.method).toUpperCase()==='HEAD'?'':body);
  return true;
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay Smart Placement requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
    if(assetResponse(req,res,path))return;
    const originalSetHeader=typeof res.setHeader==='function'?res.setHeader.bind(res):null;
    if(originalSetHeader)res.setHeader=function(name,value){
      if(String(name).toLowerCase()==='content-security-policy')value=extendCsp(value,path);
      return originalSetHeader(name,value);
    };
    const contentType=()=>String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');
    const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null;
    const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8');
      const html=/text\/html/i.test(contentType())||/<html|<!doctype/i.test(body);
      const next=html?transform(body,path):body;
      if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');
      if(typeof res.setHeader==='function'&&html)res.setHeader('X-APG-eBay-Smart-Placement','v'+VERSION);
      return originalEnd(next,'utf8',cb);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{EBAY_SMART_PLACEMENT_VERSION:VERSION,transformEbaySmartPlacement:transform});
  return handler;
}

module.exports={VERSION,CONFIG_ID,SMART_TOOLS_SRC,CSS_PATH,LOADER_PATH,CSS,LOADER,FEATURED,extendCsp,tile,section,enhanceDeals,enhanceTrust,transform,wrap};
