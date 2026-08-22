'use strict';

// APG Category Index Images v61
// Presentation-only enrichment for /categories/. Reuses the governed 90-category
// editorial image registry already used by each individual category page.
// v61.8 adds a department-first retail directory, A-Z catalogue ordering and
// simplified card metadata while preserving the CSP-safe v61 architecture.
const downstream=require('./google-product-discovery-v60');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {categories}=require('../data');

const CATEGORY_INDEX_IMAGES_VERSION='61.8';
const ORIGIN='https://australianproductguide.au';
const STYLESHEET='/assets/category-directory-v61.css?v=61.8';
const FALLBACK_THUMBNAIL_PX=40;

const POPULAR_CATEGORY_SLUGS=[
  'coffee-machines','air-fryers','robot-vacuums','televisions','laptops','smartphones'
];

// Curated presentation groups only. These do not replace the canonical 90-category
// catalogue taxonomy; they simply give shoppers a faster broad-to-specific route.
const CATEGORY_DEPARTMENTS=[
  {key:'kitchen',label:'Kitchen & cooking',image:'coffee-machines',links:['coffee-machines','air-fryers','blenders','food-processors','multicookers']},
  {key:'home',label:'Home & cleaning',image:'robot-vacuums',links:['robot-vacuums','stick-vacuums','air-purifiers','dehumidifiers','portable-air-conditioners']},
  {key:'computing',label:'Computers & gaming',image:'laptops',links:['laptops','computer-monitors','gaming-monitors','mechanical-keyboards','gaming-controllers']},
  {key:'entertainment',label:'TV, audio & entertainment',image:'televisions',links:['televisions','wireless-headphones','earbuds','soundbars','streaming-devices']},
  {key:'smart-home',label:'Smart home & connectivity',image:'home-security-cameras',links:['home-security-cameras','mesh-wifi-systems','wifi-routers','smart-plugs','smart-light-bulbs']},
  {key:'personal',label:'Personal care & fitness',image:'smartwatches',links:['smartwatches','fitness-trackers','electric-toothbrushes','hair-dryers','massage-guns']},
  {key:'lifestyle',label:'Pets, travel & outdoors',image:'luggage',links:['luggage','automatic-pet-feeders','pet-water-fountains','portable-power-stations','portable-fridges']},
  {key:'appliances',label:'Major appliances & mobile',image:'washing-machines',links:['washing-machines','fridges','dishwashers','smartphones','microwave-ovens']}
];

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

function polishCategoryCard(card){
  return String(card||'')
    .replace(/Maintained comparison\s*·\s*/g,'')
    .replace(/>Explore category<\/a>/g,'>Browse category</a>');
}

function enrichCategoryCard(card){
  if(card.includes('category-index-media'))return polishCategoryCard(card);
  const match=card.match(/href="\/categories\/([^/"?#]+)\//i);
  if(!match)return card;
  const slug=match[1];

  if(/\bv7-category-card\b/i.test(card)){
    const figure=categoryImageFigure(slug,'premium');
    if(!figure)return polishCategoryCard(card);
    const premiumReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div\b[^>]*class="[^"]*\bv7-category-scene\b[^"]*"[^>]*>[\s\S]*?<\/div>/i,`$1${figure}`);
    if(premiumReplaced!==card)return polishCategoryCard(premiumReplaced);
    return polishCategoryCard(card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`));
  }

  const figure=categoryImageFigure(slug,'base');
  if(!figure)return polishCategoryCard(card);
  const baseReplaced=card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)\s*<div>\s*<span\b[^>]*class="[^"]*\bcategory-icon\b[^"]*"[\s\S]*?<\/span>\s*<\/div>/i,`$1${figure}`);
  if(baseReplaced!==card)return polishCategoryCard(baseReplaced);
  return polishCategoryCard(card.replace(/(<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>)/i,`$1${figure}`));
}

function removeLegacyPathwayMap(html){
  return String(html||'').replace(/<section\b[^>]*class="[^"]*\bsoft-panel\b[^"]*"[^>]*>[\s\S]*?<\/section>/gi,section=>{
    const duplicate=section.includes('Coverage map')&&section.includes('90 category pathways')&&section.includes('pathway-list');
    return duplicate?'':section;
  });
}

function retailDirectoryTools(){
  const popular=POPULAR_CATEGORY_SLUGS.map(slug=>`<a href="/categories/${esc(slug)}/">${esc(categories[slug]?.label||slug)}</a>`).join('');
  return `<nav class="apg-category-retail-tools" aria-label="Popular categories and decision tools"><div class="apg-category-retail-tools-inner"><div class="apg-category-quick"><span>Popular</span>${popular}</div><div class="apg-category-task-links"><a href="/decision-lab/">Decision Lab</a><a href="/compare/">Compare products</a><a href="/brands/">Browse brands</a></div></div></nav>`;
}

function departmentDirectory(){
  const cards=CATEGORY_DEPARTMENTS.map(department=>{
    const image=categoryEditorialImages[department.image];
    const links=department.links.map(slug=>`<a href="/categories/${esc(slug)}/">${esc(categories[slug]?.label||slug)}</a>`).join('');
    return `<article class="apg-category-department-card" data-apg-department="${esc(department.key)}"><div class="apg-category-department-title"><img src="${esc(image?.src||'')}" alt="" width="44" height="44"><div><span>Department</span><h3>${esc(department.label)}</h3></div></div><div class="apg-category-department-links">${links}</div></article>`;
  }).join('');
  return `<section class="apg-category-departments" aria-labelledby="apgCategoryDepartmentsHeading"><div class="apg-category-departments-head"><div><p class="kicker">Browse by department</p><h2 id="apgCategoryDepartmentsHeading">Find your area faster</h2></div><p>Start broad, then open a category to compare maintained products or use Help Me Choose.</p></div><div class="apg-category-department-grid">${cards}</div></section>`;
}

function heroProof(){
  return `<div class="apg-category-hero-proof" aria-label="Australian Product Guide category directory"><span><strong>${Object.keys(categories).length}</strong> maintained categories</span><span>Australian-focused research</span><span>Affiliate commission never affects recommendations</span></div>`;
}

function sortCategoryGridAlphabetically(html){
  let out=String(html||'');
  const marker='<div class="category-grid premium-category-grid">';
  const start=out.indexOf(marker);
  if(start<0)return out;
  const contentStart=start+marker.length;
  const endMarker='</div></section>';
  const end=out.indexOf(endMarker,contentStart);
  if(end<0)return out;
  const inner=out.slice(contentStart,end);
  const cards=inner.match(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi)||[];
  if(cards.length!==Object.keys(categories).length)return out;
  cards.sort((a,b)=>{
    const slugA=(a.match(/href="\/categories\/([^/"?#]+)\//i)||[])[1]||'';
    const slugB=(b.match(/href="\/categories\/([^/"?#]+)\//i)||[])[1]||'';
    const labelA=categories[slugA]?.label||slugA;
    const labelB=categories[slugB]?.label||slugB;
    return labelA.localeCompare(labelB,'en-AU',{sensitivity:'base'});
  });
  return out.slice(0,contentStart)+cards.join('')+out.slice(end);
}

function polishDirectoryShell(html){
  let out=String(html||'');
  out=out.replace('<p class="kicker">Product discovery</p>','<p class="kicker">Product categories</p>');
  out=out.replace('<h1>Browse product categories</h1>','<h1>Browse by category</h1>');
  out=out.replace('All 90 Australian Product Guide category pathways now contain a maintained starting catalogue. Deep-evidence and starter-evidence hubs are labelled separately so shoppers can see how mature the research is.','Start with a department, search all 90 maintained categories, or use Help Me Choose when you want APG to narrow the options for your situation.');
  out=out.replace('Start with a department, search all 90 maintained categories, or use Help Me Choose when you want APG to narrow the options for your situation.</p>','Start with a department, search all 90 maintained categories, or use Help Me Choose when you want APG to narrow the options for your situation.</p>'+heroProof());
  out=out.replace('<p class="kicker">Current coverage</p><h2>90 populated comparison categories</h2>','<p class="kicker">Complete directory</p><h2>All categories A–Z</h2>');
  out=out.replace(/class="apg-v12-catalogue" data-v12-catalogue hidden/g,'class="apg-v12-catalogue" data-v12-catalogue');
  out=out.replace('placeholder="Try ‘kitchen’, ‘gaming’, ‘travel’ or a product type"','placeholder="Search categories — try air fryer, gaming, travel or pet"');
  if(!out.includes('apg-category-retail-tools')){
    out=out.replace(/(<section class="hero-shell">[\s\S]*?<\/section>)/i,`$1${retailDirectoryTools()}${departmentDirectory()}`);
  }
  return out;
}

function inject(html,path){
  let out=String(html||'');
  if(path!=='/categories/'||out.includes('apg-category-index-images'))return out;
  out=out.replace(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/gi,enrichCategoryCard);
  out=removeLegacyPathwayMap(out);
  out=polishDirectoryShell(out);
  out=sortCategoryGridAlphabetically(out);
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
  POPULAR_CATEGORY_SLUGS,
  CATEGORY_DEPARTMENTS,
  categoryImageFigure,
  polishCategoryCard,
  enrichCategoryCard,
  removeLegacyPathwayMap,
  retailDirectoryTools,
  departmentDirectory,
  heroProof,
  sortCategoryGridAlphabetically,
  polishDirectoryShell,
  inject,
  categoryEditorialImages,
  categories
});
module.exports=handler;
