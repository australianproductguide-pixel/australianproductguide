'use strict';

// APG SEO Optimisation v58
// Final-response SEO layer. It deliberately runs outside the existing social and
// discoverability layers so metadata reflects the fully rendered public page.
// It does not change recommendation scoring, retailer ordering or affiliate logic.
const downstream=require('./social-integration-v56-runtime');
const {categories,products}=require('../data');
const {pairPages}=require('./routes');
const categoryEditorialImages=require('../data/category-editorial-images-v45');
const {imageFor,validationErrors}=require('../data/product-images');

const VERSION='58.0';
const ORIGIN='https://australianproductguide.au';

const THEME_GROUPS=Object.freeze({
  floorHome:['robot-vacuums','stick-vacuums','air-purifiers','dehumidifiers','washing-machines','dishwashers','garment-steamers','water-filters'],
  smartHome:['robot-vacuums','home-security-cameras','smart-doorbells','smart-plugs','smart-light-bulbs','smart-displays','mesh-wifi-systems','wifi-routers','baby-monitors'],
  petHome:['robot-vacuums','automatic-pet-feeders','pet-water-fountains','automatic-litter-boxes'],
  kitchen:['coffee-machines','coffee-grinders','air-fryers','electric-kettles','toasters','food-processors','kitchen-mixers','blenders','rice-cookers','multicookers','vacuum-sealers','microwave-ovens','bread-makers','juicers','ice-cream-makers','pizza-ovens'],
  computing:['laptops','computer-monitors','portable-monitors','mechanical-keyboards','computer-mice','webcams','microphones','external-ssds','usb-c-hubs-docks','home-printers','document-scanners','usb-c-chargers','power-banks'],
  audio:['wireless-headphones','earbuds','bluetooth-speakers','soundbars','gaming-headsets','microphones'],
  mobile:['smartphones','tablets','smartwatches','fitness-trackers','power-banks','usb-c-chargers','wireless-chargers','bluetooth-trackers'],
  imaging:['action-cameras','instant-cameras','photo-printers'],
  personalCare:['electric-toothbrushes','hair-dryers','electric-shavers','hair-straighteners','beard-trimmers','water-flossers','massage-guns','smart-scales','home-fitness-equipment'],
  travelAuto:['luggage','dash-cameras','car-jump-starters','tyre-inflators','portable-fridges','portable-power-stations'],
  entertainment:['televisions','projectors','streaming-devices','gaming-monitors','gaming-headsets','gaming-controllers','bluetooth-speakers','soundbars'],
  homeOffice:['standing-desks','office-chairs','laptops','computer-monitors','mechanical-keyboards','computer-mice','webcams'],
  toolsOutdoor:['cordless-drills','pressure-washers','portable-power-stations','portable-fridges','pizza-ovens']
});

const RELATED_OVERRIDES=Object.freeze({
  'robot-vacuums':['stick-vacuums','air-purifiers','automatic-litter-boxes','smart-plugs','smart-displays','home-security-cameras']
});

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function brandDisplay(brand){return String(brand||'').toLowerCase()==='eufy'?'eufy':String(brand||'').trim();}
function productDisplayName(product){
  const brand=brandDisplay(product&&product.brand),name=String(product&&product.name||'').trim();
  if(!brand)return name;
  if(name.toLocaleLowerCase('en-AU').startsWith(brand.toLocaleLowerCase('en-AU')))return name;
  return `${brand} ${name}`.trim();
}
function productForPath(path){const m=String(path||'').match(/^\/products\/([^/]+)\/$/);return m?products.find(p=>p.slug===m[1])||null:null;}
function pairForPath(path){return pairPages.find(pair=>pair.path===path)||null;}
function categoryForPath(path){
  const value=String(path||'');
  let m=value.match(/^\/categories\/([^/]+)\/$/);if(m)return categories[m[1]]||null;
  m=value.match(/^\/categories\/([^/]+)\/finder\/$/);if(m)return categories[m[1]]||null;
  m=value.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m)return categories[m[1]]||null;
  m=value.match(/^\/compare\/([^/]+)(?:\/[^/]+)?\/$/);if(m)return categories[m[1]]||null;
  return null;
}
function setTitle(html,title){const tag=`<title>${esc(title)}</title>`;return /<title>[\s\S]*?<\/title>/i.test(html)?html.replace(/<title>[\s\S]*?<\/title>/i,tag):html.replace('</head>',tag+'</head>');}
function setMeta(html,attr,name,content){
  const pattern=new RegExp(`<meta\\b(?=[^>]*\\b${escapeRegex(attr)}=["']${escapeRegex(name)}["'])[^>]*>`,'i');
  const tag=`<meta ${attr}="${esc(name)}" content="${esc(content)}">`;
  return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',tag+'</head>');
}
function removeMeta(html,attr,name){const pattern=new RegExp(`<meta\\b(?=[^>]*\\b${escapeRegex(attr)}=["']${escapeRegex(name)}["'])[^>]*>`,`ig`);return html.replace(pattern,'');}
function patchProductMetadata(html,product){
  const name=productDisplayName(product);
  const title=`${name} Australia | Decision Guide & Comparison`;
  let out=setTitle(String(html||''),title);
  out=setMeta(out,'property','og:title',title);
  out=setMeta(out,'name','twitter:title',title);
  out=setMeta(out,'name','description',`Who ${name} suits, key trade-offs, alternatives, evidence and Australian retailer pathways.`);
  out=setMeta(out,'property','og:description',`Who ${name} suits, key trade-offs, alternatives, evidence and Australian retailer pathways.`);
  return out;
}
function patchPairMetadata(html,pair){
  const a=productDisplayName(pair.a),b=productDisplayName(pair.b),title=`${a} vs ${b} Australia | Which Fits You?`;
  let out=setTitle(String(html||''),title);
  out=setMeta(out,'property','og:title',title);
  out=setMeta(out,'name','twitter:title',title);
  out=setMeta(out,'name','description',`Compare ${a} and ${b} by use case, strengths, compromises, price context and retailer pathway.`);
  out=setMeta(out,'property','og:description',`Compare ${a} and ${b} by use case, strengths, compromises, price context and retailer pathway.`);
  return out;
}
function mimeFor(src){return /\.png(?:$|\?)/i.test(src)?'image/png':'image/jpeg';}
function verifiedProductSocialImage(product){
  const image=imageFor(product);
  if(!image||image.imageStatus!=='verified'||!image.imageVerified||!image.imageUrl)return null;
  if(!['exact','same_model_immaterial_variant'].includes(image.imageProductMatch))return null;
  if(validationErrors(product,image).length)return null;
  return {src:image.imageUrl,alt:image.imageAlt||productDisplayName(product),width:null,height:null};
}
function categorySocialImage(category){
  const image=category&&categoryEditorialImages[category.slug];
  if(!image||!image.src||image.reviewStatus!=='MANUAL_CURATED'||!image.license||!image.sourcePage)return null;
  return {src:image.src.startsWith('http')?image.src:ORIGIN+image.src,alt:`${category.label} — Australian Product Guide editorial category image`,width:image.width||null,height:image.height||null};
}
function patchSocialImage(html,image){
  if(!image)return String(html||'');
  let out=String(html||'');
  for(const [attr,name] of [['property','og:image'],['property','og:image:secure_url'],['name','twitter:image']])out=setMeta(out,attr,name,image.src);
  out=setMeta(out,'property','og:image:alt',image.alt);
  out=setMeta(out,'name','twitter:image:alt',image.alt);
  out=setMeta(out,'property','og:image:type',mimeFor(image.src));
  out=removeMeta(out,'property','og:image:width');out=removeMeta(out,'property','og:image:height');
  if(image.width)out=setMeta(out,'property','og:image:width',String(image.width));
  if(image.height)out=setMeta(out,'property','og:image:height',String(image.height));
  return out;
}
function categoryTokens(category){return new Set([...(category.priorities||[]),...(category.products||[]).flatMap(p=>p.tags||[])]);}
function tokenOverlap(a,b){let total=0;for(const token of a)if(b.has(token))total++;return total;}
function relatedCategories(category,n=6){
  const override=RELATED_OVERRIDES[category.slug];
  if(override)return override.map(slug=>categories[slug]).filter(Boolean).slice(0,n);
  const sourceTokens=categoryTokens(category);
  const sourceGroups=Object.values(THEME_GROUPS).filter(group=>group.includes(category.slug));
  return Object.values(categories).filter(candidate=>candidate.slug!==category.slug).map(candidate=>{
    const sharedGroups=sourceGroups.filter(group=>group.includes(candidate.slug)).length;
    const overlap=tokenOverlap(sourceTokens,categoryTokens(candidate));
    return {candidate,score:(sharedGroups*20)+Math.min(overlap,6)};
  }).filter(row=>row.score>0).sort((a,b)=>b.score-a.score||a.candidate.label.localeCompare(b.candidate.label)).slice(0,n).map(row=>row.candidate);
}
function relatedSection(category,productMode=false){
  const related=relatedCategories(category,productMode?4:6);if(!related.length)return '';
  const id=productMode?'apgProductRelatedDecisions':'apgRelatedCategories';
  const kicker=productMode?'Explore adjacent decisions':'Keep comparing';
  const title=productMode?'Related buying decisions':'Related Australian buying categories';
  const copy=productMode?'Useful adjacent categories selected for shopping relevance — not generic catalogue proximity.':'Explore genuinely adjacent decisions selected for shopping relevance, not broad catalogue proximity.';
  return `<section class="section apg-seo-related${productMode?' apg-seo-product-related':''}" aria-labelledby="${id}"><div class="section-head"><div><p class="kicker">${kicker}</p><h2 id="${id}">${title}</h2><p>${copy}</p></div></div><div class="category-grid">${related.map(item=>`<a class="category-card" href="/categories/${item.slug}/"><span class="eyebrow">${esc(item.products.length)} maintained products</span><h3>${esc(item.label)}</h3><p>${esc(item.description)}</p><strong>Compare ${esc(item.label.toLowerCase())} →</strong></a>`).join('')}</div></section>`;
}
function patchSemanticLinks(html,path,product,category){
  let out=String(html||'');
  if(/^\/categories\/[^/]+\/$/.test(path)&&category){
    const section=relatedSection(category,false);
    const pattern=/<section class="section apg-seo-related"[\s\S]*?<\/section>/i;
    if(pattern.test(out))out=out.replace(pattern,section);
    else if(section&&out.includes('<aside class="evidence-box">'))out=out.replace('<aside class="evidence-box">',section+'<aside class="evidence-box">');
  }
  if(product&&category&&!out.includes('apg-seo-product-related')){
    const section=relatedSection(category,true);
    if(section&&out.includes('<div id="where-to-buy"'))out=out.replace('<div id="where-to-buy"',section+'<div id="where-to-buy"');
  }
  return out;
}
function optimiseHtml(html,path){
  const product=productForPath(path),pair=pairForPath(path),category=product?categories[product.category]:categoryForPath(path);
  let out=String(html||'');
  if(product)out=patchProductMetadata(out,product);
  else if(pair)out=patchPairMetadata(out,pair);
  const productImage=product?verifiedProductSocialImage(product):null;
  const categoryImage=!product&&category?categorySocialImage(category):null;
  out=patchSocialImage(out,productImage||categoryImage);
  out=patchSemanticLinks(out,path,product,category);
  if(!out.includes('name="apg-seo-runtime"'))out=out.replace('</head>',`<meta name="apg-seo-runtime" content="v${VERSION}"></head>`);
  return out;
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-SEO','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=optimiseHtml(body,path);if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{SEO_VERSION:VERSION,ORIGIN,THEME_GROUPS,RELATED_OVERRIDES,productDisplayName,productForPath,pairForPath,categoryForPath,verifiedProductSocialImage,categorySocialImage,relatedCategories,relatedSection,patchProductMetadata,patchPairMetadata,patchSocialImage,patchSemanticLinks,optimiseHtml});
module.exports=handler;
