'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
// v61.6 deliberately loads its presentation from a same-origin stylesheet because
// Production enforces a strict `style-src 'self'` Content Security Policy.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.6';
const ORIGIN='https://australianproductguide.au';
const STYLESHEET='/assets/category-directory-v61.css?v=61.6';
const FALLBACK_THUMBNAIL_PX=40;

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function categoryImageFigure(slug,variant='base'){
  const image=categoryEditorialImages[slug];
  const category=categories[slug];
  if(!image||!category)return '';
  const variantClass=variant==='premium'?' is-premium':' is-base';
  // The width/height attributes intentionally describe the compact rendered slot,
  // not the source photograph. This prevents a 1280px source asset from ever
  // expanding across the card if presentation CSS is unavailable or delayed.
  return `<figure class="category-index-media${variantClass}"><a href="/categories/${esc(slug)}/" tabindex="-1" aria-hidden="true"><img src="${esc(image.src)}" alt="" width="${FALLBACK_THUMBNAIL_PX}" height="${FALLBACK_THUMBNAIL_PX}" loading="lazy" decoding="async"></a></figure>`;
}

function enrichCategoryCard(card){
  if(card.includes('category-index-media'))return card;
  const match=card.match(/href="\/categories\/([^/"?#]+)\//i);
  if(!match)return card;
  const slug=match[1];

  // Premium v7 category cards originally contained a large illustrative scene.
  // Replace it with the same governed compact thumbnail used by every other card
  // so all 90 directory tiles share one predictable visual hierarchy.
  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return card;
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return premiumReplaced;
    return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
  }

  // Older/base APG category cards use an icon-only first column. Replace that
  // icon with the governed 40px fallback thumbnail and preserve all SSR copy/actions.
  const figure=categoryImageFigure(slug,'base');
  if(!figure)return card;
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return baseReplaced;

  return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
}

function removeLegacyPathwayMap(html){
  return String(html||'').replace(/<section\b[^>]*class="[^"]*\bsoft-panel\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi,section=>{
    const duplicate=section.includes('Coverage map')&&section.includes('90 category pathways')&&section.includes('pathway-list');
    return duplicate?'':section;
  });
}

function inject(html,path){
  let out=String(html||'');
  if(path!=='/categories/'||out.includes('apg-category-index-images'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichCategoryCard);
  out=removeLegacyPathwayMap(out);
  if(!out.includes('category-index-media'))return out;
  out=out.replace('</head>',`<link rel="stylesheet" href="${STYLESHEET}"><meta name="apg-category-index-images" content="v${CATEGORY_INDEX_IMAGES_VERSION}"></head>`);
  out=out.replace(/<body(\s[^>]*)?>/i,(whole,attrs='')=>`<body${attrs||''} data-apg-category-index-images="v61">`);
  return out;
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Category-Index-Images','v'+CATEGORY_INDEX_IMAGES_VERSION);
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
  CATEGORY_INDEX_IMAGES_VERSION,
  CATEGORY_INDEX_STYLESHEET:STYLESHEET,
  FALLBACK_THUMBNAIL_PX,
  ORIGIN,
  categoryImageFigure,
  enrichCategoryCard,
  removeLegacyPathwayMap,
  inject,
  categoryEditorialImages,
  categories
});
module.exports=handler;
