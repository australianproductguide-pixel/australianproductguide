'use strict';

// APG Homepage Situation Images v71.1.
// Prefer a real, governed exact-model product from the linked maintained collection.
// Existing curated category editorial imagery remains the fail-closed fallback where a
// suitable governed product image has not yet been selected or the retailer image cannot load.
const downstream=require('./related-decisions-ui-v69');
const categoryImages=require('../data/category-editorial-images-v45');
const featuredProducts=require('../data/category-featured-product-images-v1');

const HOMEPAGE_SITUATION_IMAGES_VERSION='71.1';
const CSS_PATH='/assets/homepage-situation-images-v70.css';
const CARD_RE=/<article class="apg-v12-card"[^>]*>[\s\S]*?<\/article>/gi;
const CATEGORY_HREF_RE=/href="\/categories\/([a-z0-9-]+)\/"/i;
const ART_OPEN='<span class="apg-v12-art">';
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';

const CSS=`
/* APG Homepage Situation Images v71.1 */
body[data-platform-page="/"] .apg-v12-card .apg-v12-art{position:relative!important;overflow:hidden!important;isolation:isolate!important;background:#F8FAFC!important}
body[data-platform-page="/"] .apg-v12-card .apg-v70-situation-image{position:absolute!important;inset:0!important;z-index:0!important;display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important}
body[data-platform-page="/"] .apg-v12-card .apg-v70-situation-image[data-apg-image-kind="verified-product"]{object-fit:contain!important;padding:10px!important;box-sizing:border-box!important;background:linear-gradient(135deg,#fff 0%,#f4f7fb 100%)!important}
body[data-platform-page="/"] .apg-v12-card .apg-v12-art::after{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;pointer-events:none!important;background:linear-gradient(180deg,rgba(15,23,42,.015) 0%,rgba(15,23,42,.07) 100%)!important}
body[data-platform-page="/"] .apg-v12-card .apg-v12-icon,body[data-platform-page="/"] .apg-v12-card .apg-v12-art>small{position:relative!important;z-index:2!important}
`;

function escAttr(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function requestUrl(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function withEbayImageCsp(value){
  const csp=String(value||'').trim();
  if(!csp||csp.includes(EBAY_IMAGE_ORIGIN))return csp;
  if(!/(^|;)\s*img-src\s+/i.test(csp))return csp;
  return csp.replace(/((?:^|;)\s*img-src\s+)([^;]*)/i,(all,prefix,sources)=>`${prefix}${sources.trim()} ${EBAY_IMAGE_ORIGIN}`);
}
function imageForCategory(slug){
  const product=featuredProducts[slug];
  if(product&&product.src)return {...product,kind:'verified-product'};
  const editorial=categoryImages[slug];
  return editorial&&editorial.src?{...editorial,kind:'editorial-fallback'}:null;
}
function enhanceSituationCards(html){
  const text=String(html||'');
  if(!text.includes('apg-v12-situations')||!text.includes(ART_OPEN))return text;
  return text.replace(CARD_RE,card=>{
    if(card.includes('data-apg-situation-image='))return card;
    const match=card.match(CATEGORY_HREF_RE);if(!match)return card;
    const slug=String(match[1]||'').toLowerCase(),image=imageForCategory(slug);if(!image)return card;
    const productSlug=image.productSlug?` data-apg-featured-product="${escAttr(image.productSlug)}"`:'';
    const editorial=categoryImages[slug];
    const fallbackSrc=image.kind==='verified-product'&&editorial&&editorial.src?` data-apg-fallback-src="${escAttr(editorial.src)}" onerror="this.onerror=null;this.dataset.apgImageKind='editorial-fallback';this.src=this.dataset.apgFallbackSrc"`:'';
    const img=`<img class="apg-v70-situation-image" data-apg-situation-image="${escAttr(slug)}" data-apg-image-kind="${escAttr(image.kind)}"${productSlug}${fallbackSrc} src="${escAttr(image.src)}" alt="" loading="lazy" decoding="async">`;
    return card.replace(ART_OPEN,`${ART_OPEN}${img}`);
  });
}
function injectHomepageSituationAssets(html){let out=String(html||'');if(!out.includes('apg-v12-situations'))return out;if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${HOMEPAGE_SITUATION_IMAGES_VERSION}"><meta name="apg-homepage-situation-images" content="v${HOMEPAGE_SITUATION_IMAGES_VERSION}"></head>`);return out;}
function transformHomepage(html,url){const original=String(html||'');if(url.pathname!=='/'||!original.includes('apg-v12-situations'))return original;return injectHomepageSituationAssets(enhanceSituationCards(original));}
async function handler(req,res){
  const url=requestUrl(req);res.setHeader('X-APG-Homepage-Situation-Images','v'+HOMEPAGE_SITUATION_IMAGES_VERSION);
  if(url.pathname===CSS_PATH){res.statusCode=200;res.setHeader('Content-Type','text/css; charset=utf-8');res.setHeader('Cache-Control','public, max-age=3600');return res.end(req.method==='HEAD'?'':CSS);}
  // Home-only synchronous CSP allowance. No async lookup, response wait or product-registry call.
  // This prevents the blank-card failure seen when verified i.ebayimg.com images were present in
  // the HTML but the browser correctly blocked that origin under the existing Home CSP.
  if(url.pathname==='/'&&res&&typeof res.setHeader==='function'){
    const originalSetHeader=res.setHeader.bind(res);
    res.setHeader=function(name,value){
      if(String(name||'').toLowerCase()==='content-security-policy'&&!Array.isArray(value))value=withEbayImageCsp(value);
      return originalSetHeader(name,value);
    };
  }
  const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body,next=transformHomepage(original,url);if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}}return end(body,...args);};return downstream(req,res);
}
Object.assign(handler,downstream,{HOMEPAGE_SITUATION_IMAGES_VERSION,CSS_PATH,CSS,CARD_RE,CATEGORY_HREF_RE,EBAY_IMAGE_ORIGIN,withEbayImageCsp,imageForCategory,enhanceSituationCards,injectHomepageSituationAssets,transformHomepage});
module.exports=handler;
