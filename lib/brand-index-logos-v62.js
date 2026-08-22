'use strict';

// APG Brand Identity v62
// Presentation enrichment for /brands/ and /brands/<brand>/.
// Brand marks resolve from a governed official-domain registry first, then maintained
// manufacturer sources. Failed/unavailable marks preserve an accessible initial fallback.
const downstream=require('./category-index-images-v61');
const {products}=require('../data');
const {brands,slugify}=require('./routes');
const officialDomains=require('../data/brand-official-domains-v62');

const BRAND_INDEX_LOGOS_VERSION='62.3';
const ORIGIN='https://australianproductguide.au';
const LOGO_ROUTE_PREFIX='/assets/brand-marks/';
const MAX_IMAGE_BYTES=768*1024;
const MAX_HTML_BYTES=256*1024;
const FETCH_TIMEOUT_MS=3000;

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

function stripTags(value){
  return String(value||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
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

function brandLogoShell(slug,brandName,className='brand-card-mark',size=40){
  const initial=esc(String(brandName||'').charAt(0).toUpperCase());
  return `<span class="${className}" data-brand-logo-shell><span class="brand-card-fallback">${initial}</span><img class="brand-card-logo" src="${esc(brandMarkUrl(slug))}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" onerror="this.hidden=true"></span>`;
}

function enrichBrandCard(card){
  if(card.includes('brand-card-title-row'))return card;
  const href=card.match(/href="\/brands\/([^/"?#]+)\//i);
  if(!href)return card;
  const slug=decodeURIComponent(href[1]);
  const brandName=brandBySlug.get(slug);
  if(!brandName)return card;

  const initialMatch=card.match(/<span\b([^>]*class="[^"]*\bbrand-initial\b[^"]*"[^>]*)>([\s\S]*?)<\/span>/i);
  const headingMatch=card.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i);
  if(!headingMatch)return card;

  const mark=brandLogoShell(slug,brandName);
  let out=card;
  if(initialMatch)out=out.replace(initialMatch[0],'');
  out=out.replace(headingMatch[0],`<div class="brand-card-title-row">${mark}${headingMatch[0]}</div>`);

  const meta=out.match(/<p>([^<]*maintained product[s]?)<\/p>/i);
  const pills=out.match(/<div\b[^>]*class="[^"]*\bpills\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  let categoryNames=[];
  if(pills){
    categoryNames=[...pills[1].matchAll(/<span\b[^>]*class="[^"]*\bpill\b[^"]*"[^>]*>([\s\S]*?)<\/span>/gi)]
      .map(match=>stripTags(match[1])).filter(Boolean);
  }

  if(meta){
    const suffix=categoryNames.length?` · ${categoryNames.length} ${categoryNames.length===1?'category':'categories'}`:'';
    out=out.replace(meta[0],`<p class="brand-card-meta">${esc(stripTags(meta[1]))}${suffix}</p>`);
  }

  if(pills){
    const primary=categoryNames[0]||'';
    const remainder=Math.max(0,categoryNames.length-1);
    const summary=primary?`<div class="brand-card-categories" aria-label="Product categories"><span class="brand-card-category-primary">${esc(primary)}</span>${remainder?`<span class="brand-card-category-more">+${remainder} more</span>`:''}</div>`:'';
    out=out.replace(pills[0],summary);
  }

  out=out.replace(/(<a\b[^>]*class="[^"]*\btext-link\b[^"]*"[^>]*>)[\s\S]*?(<\/a>)/i,'$1View brand <span aria-hidden="true">→</span>$2');
  return out;
}

function enrichBrandDetail(html,path){
  const match=path.match(/^\/brands\/([^/]+)\/$/i);
  if(!match||path==='/brands/')return html;
  let slug='';try{slug=decodeURIComponent(match[1])}catch{return html;}
  const brandName=brandBySlug.get(slug);
  if(!brandName||html.includes('brand-hero-logo-shell'))return html;
  const heroMonogram=html.match(/<div\b[^>]*class="[^"]*\bbrand-monogram\b[^"]*"[^>]*>[\s\S]*?<\/div>/i);
  if(!heroMonogram)return html;
  const logo=`<div class="brand-hero-logo-panel" aria-label="${esc(brandName)} brand mark"><span class="brand-hero-logo-shell" data-brand-logo-shell><span class="brand-card-fallback">${esc(String(brandName).charAt(0).toUpperCase())}</span><img class="brand-card-logo" src="${esc(brandMarkUrl(slug))}" alt="${esc(brandName)} logo" width="112" height="112" loading="eager" decoding="async" onerror="this.hidden=true"></span></div>`;
  return html.replace(heroMonogram[0],logo);
}

const CSS=`<style id="apg-brand-index-logos-v62">
/* Brand directory: calm, compact institutional hierarchy. */
body[data-apg-brand-index-logos="v62"] main>.section>.grid.four{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:16px!important;align-items:stretch!important}
body[data-apg-brand-index-logos="v62"] .brand-card{position:relative!important;display:flex!important;flex-direction:column!important;min-width:0!important;min-height:176px!important;padding:20px!important;border:1px solid #dde6ea!important;border-radius:16px!important;background:#fff!important;box-shadow:0 2px 9px rgba(15,23,42,.035)!important;transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease!important}
body[data-apg-brand-index-logos="v62"] .brand-card:hover{border-color:#cbd9df!important;box-shadow:0 8px 24px rgba(15,23,42,.07)!important;transform:translateY(-1px)!important}
body[data-apg-brand-index-logos="v62"] .brand-card-title-row{display:flex!important;align-items:center!important;gap:12px!important;min-width:0!important;margin:0 0 12px!important}
body[data-apg-brand-index-logos="v62"] .brand-card-mark{position:relative!important;display:grid!important;place-items:center!important;overflow:hidden!important;width:46px!important;height:46px!important;min-width:46px!important;border:1px solid #e3e9ec!important;border-radius:11px!important;background:#fff!important;color:#315fd8!important}
body[data-apg-brand-index-logos="v62"] .brand-card-fallback{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;background:#f7f9fa!important;font-weight:800!important;font-size:.95rem!important;line-height:1!important;color:#52606d!important}
body[data-apg-brand-index-logos="v62"] .brand-card-logo,body[data-apg-brand-detail-logo="v62"] .brand-card-logo{position:absolute!important;inset:4px!important;display:block!important;width:calc(100% - 8px)!important;height:calc(100% - 8px)!important;object-fit:contain!important;object-position:center!important;background:#fff!important}
body[data-apg-brand-index-logos="v62"] .brand-card h2{min-width:0!important;margin:0!important;font-size:1.02rem!important;line-height:1.22!important;letter-spacing:-.015em!important}
body[data-apg-brand-index-logos="v62"] .brand-card h2 a{color:#0f172a!important;text-decoration:none!important;font-weight:780!important}
body[data-apg-brand-index-logos="v62"] .brand-card h2 a:hover{text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:3px!important}
body[data-apg-brand-index-logos="v62"] .brand-card-meta{margin:0 0 12px!important;color:#60717d!important;font-size:.82rem!important;line-height:1.35!important}
body[data-apg-brand-index-logos="v62"] .brand-card-categories{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;margin:0 0 16px!important}
body[data-apg-brand-index-logos="v62"] .brand-card-category-primary{min-width:0!important;max-width:75%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;padding:5px 9px!important;border:1px solid #e4ebee!important;border-radius:999px!important;background:#f7faf9!important;color:#40545f!important;font-size:.73rem!important;font-weight:650!important;line-height:1.15!important}
body[data-apg-brand-index-logos="v62"] .brand-card-category-more{white-space:nowrap!important;color:#71818b!important;font-size:.74rem!important;font-weight:650!important}
body[data-apg-brand-index-logos="v62"] .brand-card>.text-link{margin-top:auto!important;align-self:flex-start!important;color:#0b6a62!important;font-size:.78rem!important;font-weight:760!important;text-decoration:none!important}
body[data-apg-brand-index-logos="v62"] .brand-card>.text-link:hover{text-decoration:underline!important;text-underline-offset:3px!important}
/* Individual brand page: use the same verified identity asset as the directory. */
body[data-apg-brand-detail-logo="v62"] .brand-hero-grid{align-items:center!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{display:flex!important;align-items:center!important;justify-content:center!important;min-height:190px!important;padding:24px!important;border:1px solid #dfe7eb!important;border-radius:22px!important;background:linear-gradient(145deg,#fff,#f8fafb)!important;box-shadow:0 12px 36px rgba(15,23,42,.055)!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell{position:relative!important;display:grid!important;place-items:center!important;overflow:hidden!important;width:148px!important;height:148px!important;border:1px solid #e3e9ec!important;border-radius:24px!important;background:#fff!important;box-shadow:0 4px 18px rgba(15,23,42,.04)!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell .brand-card-fallback{font-size:2rem!important;background:#f7f9fa!important;color:#52606d!important}
@media (max-width:980px){body[data-apg-brand-index-logos="v62"] main>.section>.grid.four{grid-template-columns:repeat(2,minmax(0,1fr))!important}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{min-height:160px!important}}
@media (max-width:640px){body[data-apg-brand-index-logos="v62"] main>.section>.grid.four{grid-template-columns:1fr!important;gap:12px!important}body[data-apg-brand-index-logos="v62"] .brand-card{min-height:154px!important;padding:17px!important;border-radius:14px!important}body[data-apg-brand-index-logos="v62"] .brand-card-title-row{gap:11px!important;margin-bottom:10px!important}body[data-apg-brand-index-logos="v62"] .brand-card-mark{width:42px!important;height:42px!important;min-width:42px!important;border-radius:10px!important}body[data-apg-brand-index-logos="v62"] .brand-card-categories{margin-bottom:14px!important}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{min-height:128px!important;padding:16px!important;border-radius:17px!important}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell{width:104px!important;height:104px!important;border-radius:18px!important}}
@media (prefers-reduced-motion:reduce){body[data-apg-brand-index-logos="v62"] .brand-card{transition:none!important}body[data-apg-brand-index-logos="v62"] .brand-card:hover{transform:none!important}}
</style>`;

function inject(html,path){
  let out=String(html||'');
  const isIndex=path==='/brands/';
  const isDetail=/^\/brands\/[^/]+\/$/i.test(path)&&!isIndex;
  if((!isIndex&&!isDetail)||out.includes('apg-brand-index-logos-v62'))return out;
  if(isIndex){
    out=out.replace(/<article\b[^>]*class="[^"]*\bbrand-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichBrandCard);
    if(!out.includes('brand-card-title-row'))return out;
  }else{
    out=enrichBrandDetail(out,path);
    if(!out.includes('brand-hero-logo-shell'))return out;
  }
  out=out.replace('</head>',`${CSS}<meta name="apg-brand-index-logos" content="v${BRAND_INDEX_LOGOS_VERSION}"></head>`);
  out=out.replace(/<body(\s[^>]*)?>/i,(whole,attrs='')=>`<body${attrs||''} ${isIndex?'data-apg-brand-index-logos':'data-apg-brand-detail-logo'}="v62">`);
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

async function fetchHtml(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'text/html,application/xhtml+xml'}});
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html')&&!type.includes('application/xhtml'))return null;
    const text=await response.text();
    return text.length>MAX_HTML_BYTES?text.slice(0,MAX_HTML_BYTES):text;
  }catch{return null;}finally{clearTimeout(timer);}
}

function declaredIconUrls(html,base){
  const found=[];
  const tags=String(html||'').match(/<link\b[^>]*>/gi)||[];
  for(const tag of tags){
    const rel=(tag.match(/\brel=["']([^"']+)["']/i)||[])[1]||'';
    if(!/(^|\s)(icon|shortcut icon|apple-touch-icon)(\s|$)/i.test(rel))continue;
    const href=(tag.match(/\bhref=["']([^"']+)["']/i)||[])[1];
    if(!href)continue;
    try{
      const url=new URL(href,base);
      if(url.protocol==='https:'||url.protocol==='http:')found.push(url.href);
    }catch{}
  }
  return [...new Set(found)].slice(0,4);
}

async function imageFromOrigin(origin){
  if(!origin)return null;
  const html=await fetchHtml(origin+'/');
  if(html){
    const declared=declaredIconUrls(html,origin+'/');
    for(const url of declared){const image=await fetchImage(url);if(image)return image;}
  }
  return fetchImage(new URL('/favicon.ico',origin).href);
}

async function resolveBrandMark(slug){
  const origins=[];
  const official=officialDomains[slug];
  if(official)origins.push(`https://${official}`);
  const sourceOrigin=sourceOriginByBrandSlug.get(slug);
  if(sourceOrigin&&!origins.includes(sourceOrigin))origins.push(sourceOrigin);
  for(const origin of origins){
    const image=await imageFromOrigin(origin);
    if(image)return image;
  }
  const domain=official||(sourceOrigin?new URL(sourceOrigin).hostname:null);
  if(!domain)return null;
  const resolver=`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
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
  BRAND_INDEX_LOGOS_VERSION,ORIGIN,LOGO_ROUTE_PREFIX,brandBySlug,sourceOriginByBrandSlug,officialDomains,
  brandMarkUrl,brandLogoShell,enrichBrandCard,enrichBrandDetail,inject,safeSourceOrigin,resolveBrandMark,serveBrandMark,declaredIconUrls
});
module.exports=handler;
