'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.2';
const ORIGIN='https://australianproductguide.au';

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function categoryImageFigure(slug,variant='base'){
  const image=categoryEditorialImages[slug];
  const category=categories[slug];
  if(!image||!category)return '';
  const variantClass=variant==='premium'?' is-premium':' is-base';
  return `<figure class="category-index-media${variantClass}"><a href="/categories/${esc(slug)}/" tabindex="-1" aria-hidden="true"><img src="${esc(image.src)}" alt="" width="${Number(image.width)||1200}" height="${Number(image.height)||800}" loading="lazy" decoding="async"></a></figure>`;
}

function enrichCategoryCard(card){
  if(card.includes('category-index-media'))return card;
  const match=card.match(/href="\/categories\/([^/"?#]+)\//i);
  if(!match)return card;
  const slug=match[1];

  // Current premium v7 category cards contain an illustrative scene before the
  // decision copy. Replace that scene with the governed image while preserving
  // the scene's original layout footprint at every breakpoint.
  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return card;
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return premiumReplaced;
    return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
  }

  // Older/base APG category cards use an icon-only first column. Keep that exact
  // compact footprint rather than turning the image into an editorial panel.
  const figure=categoryImageFigure(slug,'base');
  if(!figure)return card;
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return baseReplaced;

  // Defensive fallback for later card-template changes: prepend the governed image.
  return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
}

const CSS=`<style id="apg-category-index-images-v61">
/* The hub image is a replacement for the former card illustration/icon, not a new editorial panel. */
.category-index-media{position:relative;margin:0;overflow:hidden;border:1px solid var(--apg-line,var(--line,#dce6e9));background:#f1f5f4;box-shadow:none}
.category-index-media>a:first-child{display:block;width:100%;height:100%;overflow:hidden;background:#eef5f4}
.category-index-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .18s ease}
.category-card:hover .category-index-media img{transform:scale(1.02)}

/* Premium v7 cards: exactly replace the former 172px category scene. */
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:100%;height:172px;min-height:172px;align-self:stretch;border-radius:20px}

/* Base cards: exactly replace the former 74px large category icon inside the 86px visual column. */
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:74px;height:74px;min-width:74px;min-height:74px;align-self:start;border-radius:17px}

@media (max-width:820px){
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{height:145px;min-height:145px;border-radius:18px}
}

@media (max-width:760px){
  body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:58px;height:58px;min-width:58px;min-height:58px;border-radius:16px}
}

@media (max-width:560px){
  /* The original mobile v7 card is a 126px visual column plus copy. Preserve it exactly. */
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:126px;height:100%;min-height:100%;align-self:stretch;border-radius:17px}
}

@media (prefers-reduced-motion:reduce){.category-index-media img{transition:none}.category-card:hover .category-index-media img{transform:none}}
</style>`;

function inject(html,path){
  let out=String(html||'');
  if(path!=='/categories/'||out.includes('apg-category-index-images-v61'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichCategoryCard);
  if(!out.includes('category-index-media'))return out;
  out=out.replace('</head>',`${CSS}<meta name="apg-category-index-images" content="v${CATEGORY_INDEX_IMAGES_VERSION}"></head>`);
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
  CATEGORY_INDEX_IMAGES_VERSION,ORIGIN,categoryImageFigure,enrichCategoryCard,inject,categoryEditorialImages,categories
});
module.exports=handler;
