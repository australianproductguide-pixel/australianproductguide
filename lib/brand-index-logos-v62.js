'use strict';

// APG Brand Index Logos v62
// Presentation-only enrichment for /brands/. Each maintained brand card receives a
// same-origin image request resolved from that brand's maintained manufacturer source.
// The browser never guesses a domain and never receives a retailer logo by mistake:
// unresolved/failed marks keep the existing initial-letter fallback.
const downstream=require('./category-index-images-v61');
const {products}=require('../data');
const {brands,slugify}=require('./routes');

const BRAND_INDEX_LOGOS_VERSION='62.1';
const ORIGIN='https://australianproductguide.au';
const LOGO_ROUTE_PREFIX='/assets/brand-marks/';
const MAX_IMAGE_BYTES=512*1024;
const FETCH_TIMEOUT_MS=2400;

const RETAILER_HOSTS=[
  /(^|\.)amazon\./i,/(^|\.)jbhifi\.com\.au$/i,/(^|\.)officeworks\.com\.au$/i,
  /(^|\.)thegoodguys\.com\.au$/i,/(^|\.)harveynorman\.com\.au$/i,/(^|\.)bing\s*lee/i,
  /(^|\.)binglee\.com\.au$/i,/(^|\.)kogan\.com$/i,/(^|\.)catch\.com\.au$/i,
  /(^|\.)bigw\.com\.au$/i,/(^|\.)target\.com\.au$/i,/(^|\.)kmart\.com\.au$/i,
  /(^|\.)myer\.com\.au$/i,/(^|\.)davidjones\.com$/i,/(^|\.)bunnings\.com\.au$/i,
  /(^|\.)ebay\./i,/(^|\.)woolworths\.com\.au$/i,/(^|\.)coles\.com\.au$/i
];

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function safeSourceOrigin(value){
  try{
    const url=new URL(String(value||''));
    if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
    const host=url.hostname.toLowerCase();
    if(!host||host==='localhost'||host.endsWith('.local'))return null;
    if(RETAILER_HOSTS.some(pattern=>pattern.test(host)))return null;
    return url.origin;
  }catch{return null;}
}

const brandBySlug=new Map(brands.map(brand=>[slugify(brand),brand]));
const sourceOriginByBrandSlug=new Map();
for(const product of products){
  const slug=slugify(product.brand||'');
  if(!slug||!brandBySlug.has(slug)||sourceOriginByBrandSlug.has(slug))continue;
  const source=safeSourceOrigin(product.source);
  if(source)sourceOriginByBrandSlug.set(slug,source);
}

function brandMarkUrl(slug){
  return `${LOGO_ROUTE_PREFIX}${encodeURIComponent(slug)}`;
}

function enrichBrandCard(card){
  if(card.includes('brand-card-logo'))return card;
  const href=card.match(/href="\/brands\/([^/"?#]+)\//i);
  if(!href)return card;
  const slug=decodeURIComponent(href[1]);
  if(!brandBySlug.has(slug))return card;
  return card.replace(
    /<span\b([^>]*class="[^"]*\bbrand-initial\b[^"]*"[^>]*)>([\s\S]*?)<\/span>/i,
    (whole,attrs,fallback)=>`<span${attrs} data-brand-logo-shell><span class="brand-card-fallback">${fallback}</span><img class="brand-card-logo" src="${esc(brandMarkUrl(slug))}" alt="" width="44" height="44" loading="lazy" decoding="async" onerror="this.hidden=true"></span>`
  );
}

const CSS=`<style id="apg-brand-index-logos-v62">
body[data-apg-brand-index-logos="v62"] .brand-initial[data-brand-logo-shell]{position:relative!important;display:grid!important;place-items:center!important;overflow:hidden!important;width:58px!important;height:58px!important;min-width:58px!important;border:1px solid #e2e8f0!important;border-radius:16px!important;background:#fff!important;color:#2563eb!important;box-shadow:0 3px 12px rgba(15,23,42,.05)!important}
body[data-apg-brand-index-logos="v62"] .brand-card-fallback{display:grid;place-items:center;width:100%;height:100%;font-weight:850;font-size:1rem;line-height:1;color:#2563eb}
body[data-apg-brand-index-logos="v62"] .brand-card-logo{position:absolute;inset:7px;display:block;width:44px;height:44px;object-fit:contain;object-position:center;background:#fff}
body[data-apg-brand-index-logos="v62"] .brand-card:hover .brand-initial[data-brand-logo-shell]{border-color:#bfdbfe!important;box-shadow:0 5px 16px rgba(37,99,235,.09)!important}
@media (max-width:640px){body[data-apg-brand-index-logos="v62"] .brand-initial[data-brand-logo-shell]{width:54px!important;height:54px!important;min-width:54px!important;border-radius:15px!important}body[data-apg-brand-index-logos="v62"] .brand-card-logo{inset:7px;width:40px;height:40px}}
@media (prefers-reduced-motion:reduce){body[data-apg-brand-index-logos="v62"] .brand-initial[data-brand-logo-shell]{transition:none!important}}
</style>`;

function inject(html,path){
  let out=String(html||'');
  if(path!=='/brands/'||out.includes('apg-brand-index-logos-v62'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bbrand-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichBrandCard);
  if(!out.includes('brand-card-logo'))return out;
  out=out.replace('</head>',`${CSS}<meta name="apg-brand-index-logos" content="v${BRAND_INDEX_LOGOS_VERSION}"></head>`);
  out=out.replace(/<body(\s[^>]*)?>/i,(whole,attrs='')=>`<body${attrs||''} data-apg-brand-index-logos="v62">`);
  return out;
}

async function fetchImage(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const response=await fetch(url,{
      redirect:'follow',signal:controller.signal,
      headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/avif,image/webp,image/svg+xml,image/png,image/*,*/*;q=0.5'}
    });
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!type.startsWith('image/'))return null;
    const length=Number(response.headers.get('content-length')||0);
    if(length>MAX_IMAGE_BYTES)return null;
    const buffer=Buffer.from(await response.arrayBuffer());
    if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return null;
    return {buffer,type};
  }catch{return null;}finally{clearTimeout(timer);}
}

async function resolveBrandMark(slug){
  const sourceOrigin=sourceOriginByBrandSlug.get(slug);
  if(!sourceOrigin)return null;
  // First prefer the maintained manufacturer's own conventional favicon. If it is
  // unavailable, Google's domain-favicon resolver is used only with that already-
  // verified manufacturer origin; no brand/domain guessing is performed.
  const direct=await fetchImage(new URL('/favicon.ico',sourceOrigin).href);
  if(direct)return direct;
  const resolver=`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(sourceOrigin)}&sz=128`;
  return fetchImage(resolver);
}

function notFound(res){
  res.statusCode=404;
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=1800');
  res.end('Brand mark unavailable');
}

async function serveBrandMark(req,res,slug){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');
  }
  if(!brandBySlug.has(slug))return notFound(res);
  const image=await resolveBrandMark(slug);
  if(!image)return notFound(res);
  res.statusCode=200;
  res.setHeader('Content-Type',image.type);
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();
  return res.end(image.buffer);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const markMatch=path.match(/^\/assets\/brand-marks\/([^/]+)$/i);
  if(markMatch){
    let slug='';try{slug=decodeURIComponent(markMatch[1])}catch{}
    return serveBrandMark(req,res,slug);
  }
  res.setHeader('X-APG-Brand-Index-Logos','v'+BRAND_INDEX_LOGOS_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=inject(body,path);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  BRAND_INDEX_LOGOS_VERSION,ORIGIN,LOGO_ROUTE_PREFIX,brandBySlug,sourceOriginByBrandSlug,
  brandMarkUrl,enrichBrandCard,inject,safeSourceOrigin,resolveBrandMark,serveBrandMark
});
module.exports=handler;
