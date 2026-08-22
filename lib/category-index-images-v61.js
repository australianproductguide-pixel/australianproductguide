'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.5';
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
  // Replace it with the governed category image. v61.5 deliberately treats the
  // photograph as a small directory thumbnail beside the decision copy.
  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return card;
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return premiumReplaced;
    return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
  }

  // Older/base APG category cards use an icon-only first column. Keep the governed
  // photo in that same compact identification role and preserve all SSR copy.
  const figure=categoryImageFigure(slug,'base');
  if(!figure)return card;
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return baseReplaced;

  // Defensive fallback for later card-template changes: prepend the governed image.
  return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
}

function removeLegacyPathwayMap(html){
  return String(html||'').replace(/<section\b[^>]*class="[^"]*\bsoft-panel\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi,section=>{
    const duplicate=section.includes('Coverage map')&&section.includes('90 category pathways')&&section.includes('pathway-list');
    return duplicate?'':section;
  });
}

const CSS=`<style id="apg-category-index-images-v61">
/* v61.5: professional retail-directory hierarchy for the 90-category hub. */
.category-index-media{position:relative;z-index:1;margin:0;overflow:hidden;border:1px solid #e1e7e9;background:#f4f6f6;box-shadow:none;pointer-events:none}
.category-index-media>a:first-child{display:block;width:100%;height:100%;overflow:hidden;background:#f4f6f6}
.category-index-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}

body[data-apg-category-index-images="v61"] .category-grid{gap:12px!important}
body[data-apg-category-index-images="v61"] .category-grid .category-card{position:relative!important;overflow:hidden!important;background:#fff!important;border:1px solid #dde4e6!important;border-radius:12px!important;box-shadow:0 1px 2px rgba(20,31,35,.035)!important;transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease!important}
body[data-apg-category-index-images="v61"] .category-grid .category-card:hover{border-color:#b6c3c6!important;box-shadow:0 4px 12px rgba(20,31,35,.07)!important;transform:translateY(-1px)}
body[data-apg-category-index-images="v61"] .category-grid .category-card:focus-within{outline:2px solid #167c70!important;outline-offset:2px}
body[data-apg-category-index-images="v61"] .category-grid .category-card::after{content:'›';position:absolute;right:14px;top:50%;transform:translateY(-52%);font-size:24px;line-height:1;font-weight:400;color:#718185;pointer-events:none;z-index:2}

/* The title link owns the entire card hit area. No duplicate button chrome is needed. */
body[data-apg-category-index-images="v61"] .category-grid .category-card h3 a::after{content:"";position:absolute;inset:0;z-index:3}
body[data-apg-category-index-images="v61"] .category-grid .category-card h3 a:focus-visible{outline:none}
body[data-apg-category-index-images="v61"] .category-grid .category-card .card-actions{display:none!important}
body[data-apg-category-index-images="v61"] .category-grid .category-card .pills{display:none!important}

/* Premium cards become compact shopping-directory rows rather than image panels. */
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{display:grid!important;grid-template-columns:56px minmax(0,1fr) 18px!important;grid-template-rows:auto!important;align-items:center!important;column-gap:0!important;padding:12px 13px!important;min-height:92px!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:56px;height:56px;min-width:56px;min-height:56px;align-self:center;border-radius:10px}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{min-width:0;padding:2px 26px 2px 13px!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy .eyebrow{margin:0 0 3px!important;font-size:11px!important;line-height:1.25!important;letter-spacing:.02em!important;text-transform:none!important;color:#69777b!important}
body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy h3{font-size:17px!important;line-height:1.25!important;margin:0 0 4px!important;font-weight:700!important}

/* Supporting copy is deliberately short so shoppers can scan categories quickly. */
body[data-apg-category-index-images="v61"] .category-grid .category-card>div>p:not(.eyebrow){font-size:12.75px!important;line-height:1.4!important;margin:3px 0 0!important;color:#5f6d71!important;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}

/* Base cards use an even smaller thumbnail and the same restrained directory surface. */
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card){display:grid!important;grid-template-columns:48px minmax(0,1fr) 18px!important;align-items:center!important;column-gap:0!important;padding:11px 13px!important;min-height:78px!important}
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:48px;height:48px;min-width:48px;min-height:48px;align-self:center;border-radius:9px}
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>div:not(.category-index-media){min-width:0;padding:2px 26px 2px 12px!important}
body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card) h3{font-size:16px!important;line-height:1.25!important;margin:0!important}

@media (max-width:820px){
  body[data-apg-category-index-images="v61"] .category-grid{gap:10px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{grid-template-columns:50px minmax(0,1fr) 16px!important;padding:11px 12px!important;min-height:84px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:50px;height:50px;min-width:50px;min-height:50px;border-radius:9px}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{padding:2px 22px 2px 12px!important}
  body[data-apg-category-index-images="v61"] .category-grid .category-card::after{right:12px;font-size:22px}
}

@media (max-width:760px){
  body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card){grid-template-columns:44px minmax(0,1fr) 16px!important;padding:10px 11px!important;min-height:72px!important}
  body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>.category-index-media.is-base{width:44px;height:44px;min-width:44px;min-height:44px;border-radius:8px}
  body[data-apg-category-index-images="v61"] .category-grid .category-card:not(.v7-category-card)>div:not(.category-index-media){padding:2px 21px 2px 11px!important}
}

@media (max-width:560px){
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card{grid-template-columns:46px minmax(0,1fr) 14px!important;padding:10px!important;min-height:78px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.category-index-media.is-premium{width:46px;height:46px;min-width:46px;min-height:46px;border-radius:8px}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy{padding:2px 19px 2px 11px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy h3{font-size:16px!important}
  body[data-apg-category-index-images="v61"] .premium-category-grid .v7-category-card>.v7-category-card-copy .eyebrow{font-size:10.5px!important}
  body[data-apg-category-index-images="v61"] .category-grid .category-card>div>p:not(.eyebrow){font-size:12.25px!important;-webkit-line-clamp:1}
  body[data-apg-category-index-images="v61"] .category-grid .category-card::after{right:10px;font-size:21px}
}
</style>`;

function inject(html,path){
  let out=String(html||'');
  if(path!=='/categories/'||out.includes('apg-category-index-images-v61'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichCategoryCard);
  out=removeLegacyPathwayMap(out);
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
  CATEGORY_INDEX_IMAGES_VERSION,ORIGIN,categoryImageFigure,enrichCategoryCard,removeLegacyPathwayMap,inject,categoryEditorialImages,categories
});
module.exports=handler;
