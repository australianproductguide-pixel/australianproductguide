'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
// v61.7 keeps the CSP-safe external stylesheet introduced in v61.6 and adds a
// calmer retail-directory shell: compact hero, visible category search, quick-browse
// links and decision-tool shortcuts without changing the underlying category pages.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.7';
const ORIGIN='https://australianproductguide.au';
const STYLESHEET='/assets/category-directory-v61.css?v=61.7';
const FALLBACK_THUMBNAIL_PX=40;

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function categoryImageFigure(slug,variant='base'){
  const image=categoryEditorialImages[slug];
  const category=categories[slug];
  if(!image||!category)return '';
  const variantClass=variant==='premium'?' is-premium':' is-base';
  return `<figure class="category-index-media${variantClass}"><a href="/categories/${esc(slug)}/" tabindex="-1" aria-hidden="true"><img src="${esc(image.src)}" alt="" width="${FALLBACK_THUMBNAIL_PX}" height="${FALLBACK_THUMBNAIL_PX}" loading="lazy" decoding="async"></a></figure>`;
}

function enrichCategoryCard(card){
  if(card.includes('category-index-media'))return card;
  const match=card.match(/href="\/categories\/([^/"?#]+)\//i);
  if(!match)return card;
  const slug=match[1];

  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return card;
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return premiumReplaced;
    return card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`);
  }

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

function retailDirectoryTools(){
  return `<nav class="apg-category-retail-tools" aria-label="Category browsing shortcuts"><div class="apg-category-retail-tools-inner"><div class="apg-category-quick"><span>Quick browse</span><a href="/categories/coffee-machines/">Coffee machines</a><a href="/categories/air-fryers/">Air fryers</a><a href="/categories/robot-vacuums/">Robot vacuums</a><a href="/categories/televisions/">Televisions</a><a href="/categories/laptops/">Laptops</a><a href="/categories/smartphones/">Smartphones</a></div><div class="apg-category-task-links"><a href="/decision-lab/">Decision Lab</a><a href="/compare/">Compare products</a><a href="/brands/">Browse brands</a></div></div></nav>`;
}

function polishDirectoryShell(html){
  let out=String(html||'');
  out=out.replace('<p class="kicker">Product discovery</p>','<p class="kicker">Product categories</p>');
  out=out.replace('All 90 Australian Product Guide category pathways now contain a maintained starting catalogue. Deep-evidence and starter-evidence hubs are labelled separately so shoppers can see how mature the research is.','Explore 90 maintained product categories, compare your options and use Help Me Choose when you want a recommendation for your situation.');
  out=out.replace('<p class="kicker">Current coverage</p><h2>90 populated comparison categories</h2>','<p class="kicker">Browse the catalogue</p><h2>All product categories</h2>');
  out=out.replace(/class="apg-v12-catalogue" data-v12-catalogue hidden/g,'class="apg-v12-catalogue" data-v12-catalogue');
  out=out.replace('placeholder="Try ‘kitchen’, ‘gaming’, ‘travel’ or a product type"','placeholder="Search 90 categories — e.g. kitchen, gaming, travel"');
  if(!out.includes('apg-category-retail-tools')){
    out=out.replace(/(<section class="hero-shell">[\s\S]*?<\/section>)/i,`$1${retailDirectoryTools()}`);
  }
  return out;
}

function inject(html,path){
  let out=String(html||'');
  if(path!=='/categories/'||out.includes('apg-category-index-images'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichCategoryCard);
  out=removeLegacyPathwayMap(out);
  out=polishDirectoryShell(out);
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
  retailDirectoryTools,
  polishDirectoryShell,
  inject,
  categoryEditorialImages,
  categories
});
module.exports=handler;
