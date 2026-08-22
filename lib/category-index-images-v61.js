'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.3';
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

  // Premium v7 category cards originally contained a large illustrative scene.
  // Replace that scene with the governed category image, then let the v61.3 CSS
  // treat the photograph as a restrained visual identifier rather than a banner.
  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return card;
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return premiumReplaced;
    return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
  }

  // Older/base APG category cards use an icon-only first column. Keep the image
  // in that compact visual role and preserve the existing copy and navigation.
  const figure=categoryImageFigure(slug,'base');
  if(!figure)return card;
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return baseReplaced;

  // Defensive fallback for later card-template changes: prepend the governed image.
  return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
}

const CSS=`<style id="apg-category-index-images-v61">
/* Category photography is a quiet navigation cue on the 90-category hub, not editorial hero art. */
.category-index-media{position:relative;margin:0;overflow:hidden;border:1px solid var(--apg-line,var(--line,#dce6e9));background:#f1f5f4;box-shadow:none}
.category-index-media>a:first-child{display:block;width:100%;height:100%;overflow:hidden;background:#eef5f4}
.category-index-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}

/* Premium cards: replace the former full-width 172px scene with a compact horizontal thumbnail. */
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{grid-template-columns:80px minmax(0,1fr)!important;grid-template-rows:auto!important;align-items:center!important;padding:10px!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:80px;height:80px;min-width:80px;min-height:80px;align-self:center;border-radius:14px}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{min-width:0;padding:12px 12px 12px 16px!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy h3{font-size:18px!important;line-height:1.25!important;margin-bottom:6px!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy p:not(.eyebrow){font-size:13.5px!important;line-height:1.45!important;margin-top:4px!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy .card-actions{padding-top:10px!important}

/* Base cards keep the same icon-like role, made slightly quieter for a dense index page. */
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:64px;height:64px;min-width:64px;min-height:64px;align-self:start;border-radius:14px}

@media (max-width:820px){
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{grid-template-columns:72px minmax(0,1fr)!important;padding:9px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:72px;height:72px;min-width:72px;min-height:72px;border-radius:13px}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{padding:11px 11px 11px 14px!important}
}

@media (max-width:760px){
  body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:52px;height:52px;min-width:52px;min-height:52px;border-radius:12px}
}

@media (max-width:560px){
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{grid-template-columns:64px minmax(0,1fr)!important;padding:8px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:64px;height:64px;min-width:64px;min-height:64px;border-radius:12px}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{padding:10px 10px 10px 13px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy h3{font-size:17px!important}
}
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
