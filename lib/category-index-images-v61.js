'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.1';
const ORIGIN='https://australianproductguide.au';

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function categoryImageFigure(slug){
  const image=categoryEditorialImages[slug];
  const category=categories[slug];
  if(!image||!category)return '';
  const label=category.label||slug.replace(/-/g,' ');
  return `<figure class="category-index-media"><a href="/categories/${esc(slug)}/" tabindex="-1" aria-hidden="true"><img src="${esc(image.src)}" alt="" width="${Number(image.width)||1200}" height="${Number(image.height)||800}" loading="lazy" decoding="async"></a><figcaption><span>Editorial category image</span><a href="${esc(image.sourcePage)}" target="_blank" rel="noopener noreferrer" aria-label="Image source for ${esc(label)}">Source</a></figcaption></figure>`;
}

function enrichCategoryCard(card){
  if(card.includes('category-index-media'))return card;
  const match=card.match(/href="\/categories\/([^/"?#]+)\//i);
  if(!match)return card;
  const slug=match[1];
  const figure=categoryImageFigure(slug);
  if(!figure)return card;

  // Current premium v7 category cards contain an illustrative scene before the
  // decision copy. The governed editorial photograph supersedes that scene so
  // every card remains a clean two-part image + copy layout.
  const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
  if(premiumReplaced!==card)return premiumReplaced;

  // Older/base APG category cards begin with an icon-only visual wrapper.
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return baseReplaced;

  // Defensive fallback for later card-template changes: prepend the image rather
  // than silently dropping it. Deployment QA covers the known card shapes.
  return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
}

const CSS=`<style id="apg-category-index-images-v61">
.category-index-media{position:relative;align-self:start;margin:0;overflow:hidden;border:1px solid var(--apg-line,var(--line,#dce6e9));border-radius:18px;background:#f4f8f7;box-shadow:0 5px 18px rgba(13,33,52,.06)}
.category-index-media>a:first-child{display:block;aspect-ratio:4/3;overflow:hidden;background:#eef5f4}
.category-index-media img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .22s ease}
.category-card:hover .category-index-media img{transform:scale(1.025)}
.category-index-media figcaption{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 8px;background:#fff;color:#6b7d8a;font-size:9px;line-height:1.2}
.category-index-media figcaption span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.category-index-media figcaption a{font-weight:800;text-decoration:none;color:var(--apg-teal-dark,var(--teal2,#075e58))}
body[data-apg-category-index-images="v61"] .premium-category-grid .category-card,body[data-apg-category-index-images="v61"] .category-grid .category-card{grid-template-columns:minmax(150px,34%) minmax(0,1fr);align-items:start}
@media (max-width:780px){body[data-apg-category-index-images="v61"] .premium-category-grid .category-card,body[data-apg-category-index-images="v61"] .category-grid .category-card{grid-template-columns:112px minmax(0,1fr);gap:14px;padding:16px}.category-index-media{border-radius:14px}.category-index-media figcaption{display:none}}
@media (max-width:520px){body[data-apg-category-index-images="v61"] .premium-category-grid .category-card,body[data-apg-category-index-images="v61"] .category-grid .category-card{grid-template-columns:1fr}.category-index-media>a:first-child{aspect-ratio:16/9}.category-index-media figcaption{display:flex}}
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
