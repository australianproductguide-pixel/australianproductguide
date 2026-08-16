const {products}=require('../data');
const {lockup,categoryScene,categoryMeta}=require('./brand-v7');
const productCategory=new Map(products.map(p=>[p.slug,p.category]));

function replaceLockups(html){
  const light=lockup({dark:false});
  const dark=lockup({dark:true});
  html=html.replace(/<span class="logo-lockup">[\s\S]*?<\/span><\/span>/g,light);
  html=html.replace(/(<a class="brand footer-logo"[^>]*>)[\s\S]*?(<\/a>)/g,`$1${dark}$2`);
  return html;
}
function enrichCategoryCards(html){
  return html.replace(/<article class="category-card">([\s\S]*?)<\/article>/g,(block,inside)=>{
    const m=inside.match(/href="\/categories\/([^/]+)\/"/);
    if(!m||!categoryMeta[m[1]])return block;
    const slug=m[1];
    const scene=categoryScene(slug);
    const upgraded=inside.replace(/^<div>[\s\S]*?<\/div><div>/,`${scene}<div class="v7-category-card-copy">`);
    return `<article class="category-card v7-category-card" data-v7-category="${slug}">${upgraded}</article>`;
  });
}
function enrichProductCards(html){
  return html.replace(/<article class="product-card([^\"]*)">([\s\S]*?)<\/article>/g,(block,classes,inside)=>{
    const m=inside.match(/href="\/products\/([^/]+)\/"/);
    if(!m)return block;
    const category=productCategory.get(m[1]);
    if(!category||!categoryMeta[category])return block;
    let upgraded=inside.replace(/<span class="category-icon[^>]*>[\s\S]*?<\/span>/,categoryScene(category,{compact:true}));
    upgraded=upgraded.replace(/class="product-art art-[^"]+"/,`class="product-art art-${category} v7-product-art" data-v7-category="${category}"`);
    return `<article class="product-card${classes} v7-product-card" data-v7-category="${category}">${upgraded}</article>`;
  });
}
function enrichProductDetail(html,path){
  const m=path.match(/^\/products\/([^/]+)\/$/);
  if(!m)return html;
  const category=productCategory.get(m[1]);
  if(!category||!categoryMeta[category])return html;
  html=html.replace(/(<div class="product-visual large"[^>]*>[\s\S]*?<div class="product-art )art-[^"]+("[^>]*>)([\s\S]*?)(<\/div><div class="visual-copy">)/,(all,start,q,art,end)=>{
    const clean=art.replace(/<span class="category-icon[^>]*>[\s\S]*?<\/span>/,categoryScene(category,{compact:true}));
    return `${start}art-${category} v7-product-art${q}${clean}${end}`;
  });
  html=html.replace(/(<div class="product-visual large")/,`$1 data-v7-category="${category}"`);
  return html;
}
function addPageScene(html,path){
  const categoryMatch=path.match(/^\/categories\/([^/]+)\/(?:finder\/)?$/);
  if(categoryMatch&&categoryMeta[categoryMatch[1]]){
    const scene=categoryScene(categoryMatch[1]);
    html=html.replace(/(<section class="hero-shell"[^>]*><div class="wrap"><div class="hero">)/,`$1<div class="v7-page-scene">${scene}</div>`);
  }
  if(path==='/decision-lab/')html=html.replace(/(<section class="hero-shell"[^>]*><div class="wrap"><div class="hero">)/,`$1<div class="v7-signature-illustration v7-decision-art" aria-hidden="true"><span></span><span></span><span></span><b></b></div>`);
  if(path==='/my-apg/')html=html.replace(/(<section class="hero-shell"[^>]*><div class="wrap"><div class="hero">)/,`$1<div class="v7-signature-illustration v7-workspace-art" aria-hidden="true"><span></span><span></span><span></span></div>`);
  return html;
}
function enhanceHome(html){
  const visual=`<div class="v7-hero-visual" aria-label="Australian Product Guide decision journey"><div class="v7-hero-orbit"><span class="v7-orbit-card one">Search</span><span class="v7-orbit-card two">Compare</span><span class="v7-orbit-card three">Evidence</span><span class="v7-orbit-card four">Retailers</span><div class="v7-choice-core">${lockup({compact:true})}<strong>Your best-fit path</strong><small>Needs → differences → confidence</small></div></div></div>`;
  html=html.replace(/(<section class="home-hero[^>]*>[\s\S]*?<div class="home-hero-grid">)([\s\S]*?)(<\/div><\/section>)/,(all,start,content,end)=>{
    if(content.includes('v7-hero-visual'))return all;
    return `${start}${content}${visual}${end}`;
  });
  return html;
}
function enhanceEditorial(html,path){
  if(/^\/(about|methodology|editorial-standards|sources|corrections-policy|affiliate-disclosure|privacy|terms|coverage|updates|contact|sitemap)\/$/.test(path))html=html.replace('<main id="main">','<main id="main" class="v7-editorial-main">');
  return html;
}
function enhance(html,path='/',u){
  if(!html)return html;
  html=html.replace('<body ','<body data-platform-v7="true" ');
  html=replaceLockups(html);
  html=enrichCategoryCards(html);
  html=enrichProductCards(html);
  html=enrichProductDetail(html,path);
  html=addPageScene(html,path);
  html=enhanceEditorial(html,path);
  if(path==='/')html=enhanceHome(html);
  html=html.replace('Independent Australian product decision support','Independent Australian product guidance · evidence before hype');
  return html;
}
module.exports={enhance};
