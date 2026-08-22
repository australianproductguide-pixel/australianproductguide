'use strict';

// APG Product Brand Placeholder v64
// Interim visual layer for products that do not yet have governed, verified product
// photography. It replaces APG-authored category/decision placeholder artwork with the
// product's respective brand identity while leaving verified product photography intact.
const downstream=require('./brand-directory-csp-v63');
const {slugify}=require('./routes');

const PRODUCT_BRAND_PLACEHOLDER_VERSION='64.0';
const STYLESHEET='/assets/product-brand-placeholder-v64.css?v=64.0';

function decodeText(value){
  return String(value||'')
    .replace(/&amp;/g,'&')
    .replace(/&#39;/g,"'")
    .replace(/&quot;/g,'"')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>');
}

function brandPlaceholderMarkup(brandHtml){
  const brand=decodeText(brandHtml).trim();
  const slug=slugify(brand);
  if(!brand||!slug)return null;
  return `<div class="apg-product-brand-placeholder" aria-hidden="true"><span class="apg-product-brand-placeholder-badge">Brand identity</span><span class="apg-product-brand-logo-shell"><span class="apg-product-brand-logo-fallback">${brandHtml}</span><img class="apg-product-brand-logo" src="/assets/brand-marks/${slug}" alt="" width="154" height="100" loading="lazy" decoding="async" onerror="this.hidden=true"></span></div>`;
}

function enrichProductBrandPlaceholders(html){
  let out=String(html||'');
  // Only APG's non-photo placeholder visuals contain product-art/art-model. Verified
  // photography renders as <figure class="product-photo..."> and is therefore untouched.
  out=out.replace(/<div class="product-visual([^\"]*)"([^>]*)>(<div class="product-art\b[^\"]*"[^>]*>[\s\S]*?<span class="art-model">([^<]*)<\/span><\/div>)(<div class="visual-copy">)/g,
    (full,visualClasses,visualAttrs,_oldArt,brandHtml,visualCopy)=>{
      const placeholder=brandPlaceholderMarkup(brandHtml);
      if(!placeholder)return full;
      let attrs=String(visualAttrs||'');
      if(/data-apg-product-brand-placeholder=/.test(attrs))return full;
      attrs+=` data-apg-product-brand-placeholder="v64"`;
      return `<div class="product-visual${visualClasses}"${attrs}>${placeholder}${visualCopy}`;
    });
  // Make the distinction explicit in consumer-facing copy wherever the old APG
  // illustration note is present. This is not a claim that the logo depicts the product.
  out=out.replace(/APG visual · genuine product photography pending verified rights/g,'Brand identity placeholder · genuine product photography pending verified rights');
  out=out.replace(/Australian Product Guide visual · genuine product photography pending verified rights/g,'Brand identity placeholder · genuine product photography pending verified rights');
  return out;
}

function injectStylesheet(html){
  let out=String(html||'');
  if(out.includes('product-brand-placeholder-v64.css'))return out;
  return out.replace('</head>',`<link rel="stylesheet" href="${STYLESHEET}"><meta name="apg-product-brand-placeholder" content="v${PRODUCT_BRAND_PLACEHOLDER_VERSION}"></head>`);
}

function handler(req,res){
  res.setHeader('X-APG-Product-Brand-Placeholder','v'+PRODUCT_BRAND_PLACEHOLDER_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      let next=enrichProductBrandPlaceholders(body);
      next=injectStylesheet(next);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  PRODUCT_BRAND_PLACEHOLDER_VERSION,
  PRODUCT_BRAND_PLACEHOLDER_STYLESHEET:STYLESHEET,
  enrichProductBrandPlaceholders,
  injectProductBrandPlaceholderStylesheet:injectStylesheet
});
module.exports=handler;
