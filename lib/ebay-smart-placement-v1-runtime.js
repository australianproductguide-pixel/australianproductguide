'use strict';

// APG eBay Smart Placement pilot v1.3
//
// v1.0 was hidden at narrow widths. v1.1 exposed the APG shell but the eBay placement remained
// blank in the owner's desktop browser. v1.2 improved the third-party load path, but the customer
// experience still depended on eBay successfully painting a remote widget.
//
// v1.3 changes that contract. /deals/ now has a premium, server-rendered eBay Australia marketplace
// spotlight high in the page using APG's owner-supplied official eBay Tech creative and governed EPN
// destination. The third-party Smart Placement remains progressive enhancement only: it is staged
// off-canvas, observed for real content and promoted into view only after paint is detected. If eBay
// does not deliver the widget, customers still receive a complete, attractive and actionable surface.
// Retailer participation and commission continue to contribute zero recommendation/ranking points.

const official=require('../data/ebay-official-creatives-v121');

const VERSION='1.3';
const CONFIG_ID='001370a99f586b44ba848056';
const SMART_TOOLS_SRC='https://epnt.ebay.com/static/epn-smart-tools.js';
const CSS_PATH='/assets/ebay-smart-placement-v1.css';
const LOADER_PATH='/assets/ebay-smart-placement-v1.js';
const TECH=official.CREATIVES.tech;

function esc(value){return String(value==null?'':value).replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));}

const CSS=`
.apg-ebay-smart-placement{padding:28px 0 34px}
.apg-ebay-smart-placement__shell{position:relative;overflow:hidden;border:1px solid rgba(37,99,235,.17);border-radius:26px;background:linear-gradient(135deg,#f8fbff 0%,#eef6ff 52%,#ffffff 100%);box-shadow:0 22px 58px rgba(15,23,42,.10),0 2px 8px rgba(37,99,235,.07)}
.apg-ebay-smart-placement__shell:before{content:"";position:absolute;width:360px;height:360px;border-radius:999px;right:-130px;top:-190px;background:radial-gradient(circle,rgba(56,164,243,.20),rgba(56,164,243,0) 68%);pointer-events:none}
.apg-ebay-smart-placement__static{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(340px,.96fr);gap:30px;align-items:center;padding:30px}
.apg-ebay-smart-placement__copy{max-width:690px}
.apg-ebay-smart-placement__eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 10px;font-size:.76rem;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#1d4ed8}
.apg-ebay-smart-placement__eyebrow:before{content:"";width:9px;height:9px;border-radius:999px;background:#22a6f2;box-shadow:0 0 0 5px rgba(34,166,242,.10)}
.apg-ebay-smart-placement__copy h2{margin:0;color:#0f172a;font-size:clamp(2rem,3.2vw,3.15rem);line-height:1.02;letter-spacing:-.045em;max-width:720px}
.apg-ebay-smart-placement__copy>p{margin:15px 0 0;max-width:650px;color:#475569;font-size:1.02rem;line-height:1.65}
.apg-ebay-smart-placement__actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:21px}
.apg-ebay-smart-placement__cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:12px;background:#2563eb;color:#fff!important;text-decoration:none!important;font-weight:800;box-shadow:0 10px 24px rgba(37,99,235,.20);transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.apg-ebay-smart-placement__cta:hover{background:#1d4ed8;transform:translateY(-1px);box-shadow:0 14px 30px rgba(37,99,235,.25)}
.apg-ebay-smart-placement__trust{display:inline-flex;align-items:center;gap:7px;color:#64748b;font-size:.82rem;line-height:1.35}
.apg-ebay-smart-placement__trust:before{content:"✓";display:grid;place-items:center;width:18px;height:18px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-weight:900}
.apg-ebay-smart-placement__creative{position:relative;display:block;padding:10px;border:1px solid rgba(15,23,42,.08);border-radius:18px;background:#fff;box-shadow:0 16px 36px rgba(15,23,42,.10);text-decoration:none!important;transform:rotate(.25deg);transition:transform .18s ease,box-shadow .18s ease}
.apg-ebay-smart-placement__creative:hover{transform:translateY(-2px) rotate(0);box-shadow:0 20px 42px rgba(15,23,42,.14)}
.apg-ebay-smart-placement__creative img{display:block;width:100%;height:auto;object-fit:contain;border-radius:12px;background:#fff}
.apg-ebay-smart-placement__creative-meta{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 4px 2px;color:#475569;font-size:.78rem;line-height:1.35}
.apg-ebay-smart-placement__creative-meta strong{color:#0f172a}
.apg-ebay-smart-placement__micro{position:relative;z-index:1;display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin:0 30px 24px;padding-top:16px;border-top:1px solid rgba(37,99,235,.11);color:#64748b;font-size:.78rem;line-height:1.5}
.apg-ebay-smart-placement__micro a{font-weight:700;color:#2563eb;text-decoration:none}
.apg-ebay-smart-placement__dynamic{position:absolute!important;left:-10000px!important;top:0!important;width:900px!important;min-height:220px!important;overflow:hidden!important;visibility:hidden!important;pointer-events:none!important}
.apg-ebay-smart-placement__frame{max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;padding:6px 0;min-height:220px}
.apg-ebay-smart-placement__unit{display:block;width:900px;min-width:900px;min-height:220px;max-width:none;margin:0 auto}
.apg-ebay-smart-placement[data-apg-ebay-load-state="paint-detected"] .apg-ebay-smart-placement__static{display:none}
.apg-ebay-smart-placement[data-apg-ebay-load-state="paint-detected"] .apg-ebay-smart-placement__dynamic{position:relative!important;left:auto!important;top:auto!important;width:auto!important;min-height:220px!important;overflow:visible!important;visibility:visible!important;pointer-events:auto!important;padding:22px 30px 8px}
.apg-ebay-smart-placement[data-apg-ebay-load-state="paint-detected"] .apg-ebay-smart-placement__micro{margin-top:2px}
@media(max-width:900px){
 .apg-ebay-smart-placement{padding:20px 0 26px}
 .apg-ebay-smart-placement__static{grid-template-columns:1fr;gap:22px;padding:23px}
 .apg-ebay-smart-placement__creative{transform:none;max-width:680px}
 .apg-ebay-smart-placement__micro{display:block;margin:0 23px 20px}
 .apg-ebay-smart-placement__micro a{display:inline-block;margin-top:7px}
 .apg-ebay-smart-placement[data-apg-ebay-load-state="paint-detected"] .apg-ebay-smart-placement__dynamic{padding:18px 23px 6px}
}
@media(max-width:540px){
 .apg-ebay-smart-placement__shell{border-radius:20px}
 .apg-ebay-smart-placement__static{padding:20px}
 .apg-ebay-smart-placement__copy h2{font-size:clamp(1.8rem,9vw,2.35rem)}
 .apg-ebay-smart-placement__actions{align-items:stretch;flex-direction:column}
 .apg-ebay-smart-placement__cta{width:100%}
 .apg-ebay-smart-placement__micro{margin:0 20px 18px}
 .apg-ebay-smart-placement[data-apg-ebay-load-state="paint-detected"] .apg-ebay-smart-placement__dynamic{padding:16px 20px 4px}
}
@media(prefers-reduced-motion:reduce){.apg-ebay-smart-placement__cta,.apg-ebay-smart-placement__creative{transition:none}.apg-ebay-smart-placement__cta:hover,.apg-ebay-smart-placement__creative:hover{transform:none}}
`;

const LOADER=`'use strict';(function(){
  function boot(){
    var root=document.querySelector('[data-apg-ebay-smart-placement="v${VERSION}"]');
    if(!root)return;
    var unit=root.querySelector('.epn-placement[data-config-id="${CONFIG_ID}"]');
    if(!unit)return;
    var observer;
    var painted=false;
    function hasPaint(){
      try{
        if(unit.shadowRoot&&unit.shadowRoot.childNodes&&unit.shadowRoot.childNodes.length)return true;
        if(unit.querySelector&&unit.querySelector('iframe,img,a,article,section,div'))return true;
        if(unit.children&&unit.children.length)return true;
        return String(unit.innerHTML||'').replace(/\\s+/g,'').length>30;
      }catch{return false;}
    }
    function promote(){
      if(painted||!hasPaint())return false;
      painted=true;
      root.setAttribute('data-apg-ebay-load-state','paint-detected');
      if(observer)observer.disconnect();
      return true;
    }
    root.setAttribute('data-apg-ebay-load-state','placement-ready');
    try{observer=new MutationObserver(promote);observer.observe(unit,{childList:true,subtree:true,attributes:true});}catch{}
    var checks=[300,900,1800,3500,7000,12000];
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

function section(){
  const destination=esc(TECH.destination),image=esc(TECH.image),alt=esc(TECH.alt);
  return `<section class="section apg-ebay-smart-placement" data-apg-ebay-smart-placement="v${VERSION}" data-apg-ebay-load-state="ssr-ready" aria-labelledby="apgEbaySmartPlacementTitle"><div class="wrap"><div class="apg-ebay-smart-placement__shell"><div class="apg-ebay-smart-placement__static" data-apg-ebay-smart-static="official-tech"><div class="apg-ebay-smart-placement__copy"><p class="apg-ebay-smart-placement__eyebrow">eBay Australia marketplace spotlight</p><h2 id="apgEbaySmartPlacementTitle">Explore electronics on eBay Australia</h2><p>Browse current technology listings across eBay Australia, then use APG’s independent research, comparisons and Decision Lab to work out what actually suits you.</p><div class="apg-ebay-smart-placement__actions"><a class="apg-ebay-smart-placement__cta" href="${destination}" target="_blank" rel="sponsored nofollow noopener" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="affiliate-search" data-affiliate-placement="ebay_smart_spotlight_tech" data-affiliate-context="marketplace_spotlight" data-affiliate-destination="tech">Browse electronics on eBay Australia <span aria-hidden="true">↗</span></a><span class="apg-ebay-smart-placement__trust">Marketplace discovery, not an APG recommendation</span></div></div><a class="apg-ebay-smart-placement__creative" href="${destination}" target="_blank" rel="sponsored nofollow noopener" data-affiliate-link data-affiliate-retailer="eBay Australia" data-affiliate-kind="affiliate-search" data-affiliate-placement="ebay_smart_spotlight_creative" data-affiliate-context="marketplace_spotlight" data-affiliate-destination="tech" aria-label="Browse electronics on eBay Australia"><img src="${image}" alt="${alt}" loading="eager" decoding="async"><span class="apg-ebay-smart-placement__creative-meta"><strong>Official eBay creative</strong><span>Current marketplace results ↗</span></span></a></div><div class="apg-ebay-smart-placement__dynamic" data-apg-ebay-smart-dynamic="true" aria-label="Live eBay Australia Smart Placement"><div class="apg-ebay-smart-placement__frame"><ins class="epn-placement apg-ebay-smart-placement__unit" data-config-id="${CONFIG_ID}"></ins></div></div><div class="apg-ebay-smart-placement__micro"><span><strong>Paid retailer content.</strong> APG may earn a commission from qualifying eBay purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.</span><a href="/retailers/">How APG handles retailers →</a></div></div></div></section>`;
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
    const paragraph='<p data-apg-ebay-smart-disclosure="true"><strong>Embedded eBay marketplace content.</strong> Selected retailer-discovery pages may include an eBay Smart Placement. When eBay does not deliver the dynamic placement, APG may show an owner-supplied official eBay category creative and governed EPN destination instead. These retailer surfaces are paid content, are not APG recommendations, and contribute zero points to APG product suitability or retailer ranking.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  if(path==='/privacy/'&&!out.includes('data-apg-ebay-smart-privacy=')){
    const paragraph='<p data-apg-ebay-smart-privacy="true"><strong>Embedded eBay marketplace content.</strong> On selected retailer-discovery pages, APG may load an eBay Partner Network Smart Placement supplied by eBay. When that third-party content loads, eBay may process technical browser, device and interaction information under its own privacy practices to deliver and measure the marketplace content. APG does not pass a signed-in account identifier, search query, Decision Lab answers or other APG decision-state fields to the Smart Placement configuration. If the dynamic placement is not delivered, APG retains a static official eBay category creative. Neither state influences APG recommendation or retailer ranking logic.</p>';
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
  res.setHeader('Cache-Control','public, max-age=60');
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

module.exports={VERSION,CONFIG_ID,SMART_TOOLS_SRC,CSS_PATH,LOADER_PATH,CSS,LOADER,TECH,extendCsp,section,enhanceDeals,enhanceTrust,transform,wrap};
