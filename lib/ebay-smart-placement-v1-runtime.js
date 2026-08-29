'use strict';

// APG eBay Smart Placement pilot v1.0
// Narrow retailer-discovery experiment for /deals/ only. This surface is separate from APG
// recommendations and contributes zero recommendation points. The supplied eBay configuration
// is loaded only on desktop-width viewports to avoid forcing a fixed 900x220 unit into APG's
// mobile decision journeys. No customer identifier or APG decision state is passed to eBay.
const VERSION='1.0';
const CONFIG_ID='001370a99f586b44ba848056';
const SMART_TOOLS_SRC='https://epnt.ebay.com/static/epn-smart-tools.js';
const CSS_PATH='/assets/ebay-smart-placement-v1.css';
const LOADER_PATH='/assets/ebay-smart-placement-v1.js';

const CSS=`
.apg-ebay-smart-placement{padding-top:0}
.apg-ebay-smart-placement .apg-ebay-smart-placement__head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:18px}
.apg-ebay-smart-placement .apg-ebay-smart-placement__head>div{max-width:760px}
.apg-ebay-smart-placement .apg-ebay-smart-placement__frame{max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;-webkit-overflow-scrolling:touch;padding:2px 0 8px}
.apg-ebay-smart-placement .apg-ebay-smart-placement__unit{display:block;width:900px;min-height:220px;max-width:none;margin:0 auto}
.apg-ebay-smart-placement .apg-ebay-smart-placement__note{margin-top:12px}
@media(max-width:959px){.apg-ebay-smart-placement{display:none}}
`;

const LOADER=`'use strict';(function(){
  var root=document.querySelector('[data-apg-ebay-smart-placement="v1.0"]');
  if(!root)return;
  if(!window.matchMedia||!window.matchMedia('(min-width: 960px)').matches)return;
  if(document.querySelector('script[data-apg-ebay-smart-tools="true"]'))return;
  var s=document.createElement('script');
  s.async=true;
  s.src='${SMART_TOOLS_SRC}';
  s.setAttribute('data-apg-ebay-smart-tools','true');
  document.head.appendChild(s);
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
  csp=addSourceToDirective(csp,'img-src','https://i.ebayimg.com');
  csp=addSourceToDirective(csp,'img-src','https://*.ebayimg.com');
  return csp;
}

function section(){
  return `<section class="section apg-ebay-smart-placement" data-apg-ebay-smart-placement="v${VERSION}" aria-labelledby="apgEbaySmartPlacementTitle"><div class="wrap"><div class="apg-ebay-smart-placement__head"><div><p class="kicker">eBay Australia marketplace discovery</p><h2 id="apgEbaySmartPlacementTitle">More electronics options on eBay Australia</h2><p>This marketplace panel is separate from APG recommendations. It can surface current eBay listings related to electronics, but APG does not treat the banner as evidence that a listing is the best choice, an exact product match, or the best available price.</p></div><a class="text-link" href="/retailers/">How APG handles retailers →</a></div><div class="apg-ebay-smart-placement__frame" aria-label="eBay Australia Smart Placement"><ins class="epn-placement apg-ebay-smart-placement__unit" data-config-id="${CONFIG_ID}"></ins></div><div class="notice affiliate-disclosure-inline apg-ebay-smart-placement__note"><strong>Paid marketplace content.</strong> APG may earn a commission from qualifying eBay purchases. eBay participation and commission do not influence APG product suitability, ranking or recommendations.</div><p class="fine-inline">The embedded marketplace content is supplied by eBay and can change independently of APG. Confirm the exact model or variant, seller, condition, warranty, delivery, price and availability on eBay before purchase.</p></div></section>`;
}

function addHeadAssets(html){
  let out=String(html);
  if(!out.includes(`href="${CSS_PATH}"`))out=out.replace(/<\/head>/i,`<link rel="stylesheet" href="${CSS_PATH}"><script src="${LOADER_PATH}" defer></script></head>`);
  return out;
}

function enhanceDeals(html,path){
  if(path!=='/deals/')return String(html);
  let out=String(html);
  if(!out.includes('data-apg-ebay-smart-placement='))out=out.replace(/<\/main>/i,`${section()}</main>`);
  return addHeadAssets(out);
}

function enhanceTrust(html,path){
  let out=String(html);
  if(path==='/affiliate-disclosure/'&&!out.includes('data-apg-ebay-smart-disclosure=')){
    const paragraph='<p data-apg-ebay-smart-disclosure="true"><strong>Embedded eBay marketplace content.</strong> Selected retailer-discovery pages may include an eBay Smart Placement. These marketplace listings are paid retailer content, are not APG recommendations, and contribute zero points to APG product suitability or retailer ranking.</p>';
    out=out.replace(/<\/main>/i,`${paragraph}</main>`);
  }
  if(path==='/privacy/'&&!out.includes('data-apg-ebay-smart-privacy=')){
    const paragraph='<p data-apg-ebay-smart-privacy="true"><strong>Embedded eBay marketplace content.</strong> On selected retailer-discovery pages, APG may load an eBay Partner Network Smart Placement supplied by eBay. When that third-party content loads, eBay may process technical browser, device and interaction information under its own privacy practices to deliver and measure the marketplace content. APG does not pass a signed-in account identifier, search query, Decision Lab answers or other APG decision-state fields to the Smart Placement configuration. The placement does not influence APG recommendation or retailer ranking logic.</p>';
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
  res.setHeader('Cache-Control','public, max-age=3600');
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

module.exports={VERSION,CONFIG_ID,SMART_TOOLS_SRC,CSS_PATH,LOADER_PATH,CSS,LOADER,extendCsp,section,enhanceDeals,enhanceTrust,transform,wrap};
