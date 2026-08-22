'use strict';

// APG Search Image Intelligence v67
// Search-engine image semantics across products, brands and categories.
// Important governance rule: Product.image is reserved for verified genuine product
// photography. A brand logo is Brand.logo, and a category editorial image may be the
// representative WebPage image for a product research page when verified product
// photography is not yet available. This keeps APG image-rich without misdescribing
// a logo or category scene as a photograph of the exact product.
const downstream=require('./brand-mark-curated-v66');
const seo=require('./seo-optimisation-v58-runtime');
const {products,categories}=require('../data');
const categoryImages=require('../data/category-editorial-images-v45');
const curatedBrandMarks=require('../data/brand-mark-curated-overrides-v66');
const {brands,slugify}=require('./routes');

const SEARCH_IMAGE_INTELLIGENCE_VERSION='67.0';
const ORIGIN='https://australianproductguide.au';
const IMAGE_SITEMAP_NS='http://www.google.com/schemas/sitemap-image/1.1';

const productBySlug=new Map(products.map(product=>[product.slug,product]));
const brandBySlug=new Map(brands.map(brand=>[slugify(brand),brand]));
const categoryByProductSlug=new Map();
for(const category of Object.values(categories)){
  for(const product of category.products||[])categoryByProductSlug.set(product.slug,category);
}

function json(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function absolute(value){
  if(!value)return null;
  try{return new URL(String(value),ORIGIN).href;}catch{return null;}
}
function xmlEscape(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function imageMime(src){
  const path=String(src||'').split('?')[0].toLowerCase();
  if(path.endsWith('.png'))return 'image/png';
  if(path.endsWith('.webp'))return 'image/webp';
  if(path.endsWith('.svg'))return 'image/svg+xml';
  if(path.endsWith('.avif'))return 'image/avif';
  return 'image/jpeg';
}
function categoryForProduct(product){return product&&(categories[product.category]||categoryByProductSlug.get(product.slug))||null;}
function productForPath(path){
  const match=String(path||'').match(/^\/products\/([^/]+)\/?$/i);
  return match?productBySlug.get(match[1])||null:null;
}
function categorySlugForPath(path){
  const p=String(path||'');
  let match=p.match(/^\/categories\/([^/]+)(?:\/|$)/i);
  if(match&&categories[match[1]])return match[1];
  match=p.match(/^\/guides\/([^/]+)-buying-guide\/?$/i);
  if(match&&categories[match[1]])return match[1];
  match=p.match(/^\/compare\/([^/]+)(?:\/|$)/i);
  if(match&&categories[match[1]])return match[1];
  const product=productForPath(p);
  return product&&categoryForProduct(product)?.slug||null;
}
function categoryImageObject(category,context={}){
  if(!category)return null;
  const image=categoryImages[category.slug];if(!image||!image.src)return null;
  const contentUrl=absolute(image.src);if(!contentUrl)return null;
  const product=context.product||null;
  const label=category.label||category.title||category.slug;
  const caption=product
    ?`${label} editorial context for ${seo.productDisplayName(product)} — not product photography`
    :`${label} — Australian Product Guide editorial category image`;
  const result={
    '@type':'ImageObject',
    '@id':contentUrl+'#apg-image',
    url:contentUrl,
    contentUrl,
    caption,
    description:product
      ?`Representative ${label} editorial context for this product research page. This image is not photography of the exact product.`
      :`Governed editorial image representing the ${label} product category on Australian Product Guide.`,
    representativeOfPage:true,
    encodingFormat:imageMime(image.src)
  };
  if(Number(image.width)>0)result.width=Number(image.width);
  if(Number(image.height)>0)result.height=Number(image.height);
  if(image.creator)result.creditText=String(image.creator);
  if(image.licenseUrl)result.license=String(image.licenseUrl);
  return result;
}
function verifiedProductImageObject(product){
  if(!product)return null;
  const image=seo.verifiedProductSocialImage(product);
  if(!image||!image.src)return null;
  const contentUrl=absolute(image.src);if(!contentUrl)return null;
  const result={
    '@type':'ImageObject',
    '@id':contentUrl+'#apg-product-image',
    url:contentUrl,
    contentUrl,
    caption:`${seo.productDisplayName(product)} — verified product image`,
    representativeOfPage:true,
    encodingFormat:imageMime(image.src)
  };
  if(Number(image.width)>0)result.width=Number(image.width);
  if(Number(image.height)>0)result.height=Number(image.height);
  return result;
}
function curatedBrandLogoObject(brand){
  const slug=slugify(brand||'');
  if(!slug||!curatedBrandMarks[slug])return null;
  const contentUrl=`${ORIGIN}/assets/brand-marks/${encodeURIComponent(slug)}`;
  return {
    '@type':'ImageObject',
    '@id':contentUrl+'#brand-logo',
    url:contentUrl,
    contentUrl,
    caption:`${brandBySlug.get(slug)||brand} logo`,
    encodingFormat:'image/svg+xml'
  };
}
function brandEntity(brand){
  const slug=slugify(brand||'');
  const name=brandBySlug.get(slug)||String(brand||'').trim();
  if(!slug||!name)return null;
  const entity={'@type':'Brand',name,url:`${ORIGIN}/brands/${slug}/`};
  const logo=curatedBrandLogoObject(name);if(logo)entity.logo=logo;
  return entity;
}
function pageImageForPath(path){
  const product=productForPath(path);
  if(product)return verifiedProductImageObject(product)||categoryImageObject(categoryForProduct(product),{product});
  const categorySlug=categorySlugForPath(path);
  if(categorySlug)return categoryImageObject(categories[categorySlug]);
  const brandMatch=String(path||'').match(/^\/brands\/([^/]+)\/?$/i);
  if(brandMatch&&brandBySlug.has(brandMatch[1]))return curatedBrandLogoObject(brandBySlug.get(brandMatch[1]));
  return null;
}
function pageName(html){
  const match=String(html||'').match(/<title>([\s\S]*?)<\/title>/i);
  return match?match[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim():null;
}
function canonicalForPath(path){return ORIGIN+(String(path||'/').startsWith('/')?String(path||'/'):'/'+String(path||'/'));}
function types(value){const t=value&&value['@type'];return Array.isArray(t)?t:[t].filter(Boolean);}
function enrichItemList(value,path){
  if(!value||value['@type']!=='ItemList'||!Array.isArray(value.itemListElement))return value;
  if(path==='/categories/'||path==='/categories'){
    return {...value,itemListElement:value.itemListElement.map(row=>{
      const url=String(row.url||row.item?.url||row.item||'');
      const match=url.match(/\/categories\/([^/]+)\/?$/i);const category=match&&categories[match[1]];
      if(!category)return row;
      return {...row,item:{'@type':'CollectionPage',name:category.label||row.name,url:absolute(url),image:categoryImageObject(category)}};
    })};
  }
  if(path==='/brands/'||path==='/brands'){
    return {...value,itemListElement:value.itemListElement.map(row=>{
      const url=String(row.url||row.item?.url||row.item||'');
      const match=url.match(/\/brands\/([^/]+)\/?$/i);const brand=match&&brandBySlug.get(match[1]);
      if(!brand)return row;
      return {...row,item:brandEntity(brand)};
    })};
  }
  return value;
}
function enrichSchemaValue(value,path,state){
  if(!value||typeof value!=='object')return value;
  if(Array.isArray(value))return value.map(item=>enrichSchemaValue(item,path,state));
  let next={...value};
  if(Array.isArray(next['@graph']))next['@graph']=next['@graph'].map(item=>enrichSchemaValue(item,path,state));
  const nodeTypes=types(next);
  if(nodeTypes.includes('Product')){
    const product=productForPath(path);
    if(product){
      const brand=brandEntity(product.brand);if(brand)next.brand=brand;
      // Deliberately do not add or replace Product.image here. Google Product image
      // semantics remain governed by v60 verified genuine product photography only.
      state.productSeen=true;
    }
  }
  if(nodeTypes.includes('ItemList'))next=enrichItemList(next,path);
  const pageLike=nodeTypes.some(type=>['WebPage','CollectionPage','Article','TechArticle'].includes(type));
  if(pageLike){
    const image=pageImageForPath(path);
    if(image){
      next.image=image;
      if(nodeTypes.includes('WebPage')||nodeTypes.includes('CollectionPage'))next.primaryImageOfPage=image;
      state.pageImageLinked=true;
    }
    const brandMatch=String(path||'').match(/^\/brands\/([^/]+)\/?$/i);
    if(brandMatch&&brandBySlug.has(brandMatch[1]))next.about=brandEntity(brandBySlug.get(brandMatch[1]));
  }
  return next;
}
function patchJsonLd(html,path){
  const state={productSeen:false,pageImageLinked:false};
  let out=String(html||'');
  out=out.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(whole,attrs,payload)=>{
    try{
      const parsed=JSON.parse(payload);const enriched=enrichSchemaValue(parsed,path,state);
      return `<script${attrs}>${json(enriched)}</script>`;
    }catch{return whole;}
  });
  const product=productForPath(path);
  const image=pageImageForPath(path);
  if(product&&image&&!state.pageImageLinked){
    const page={
      '@context':'https://schema.org','@type':'WebPage','@id':canonicalForPath(path)+'#webpage',
      url:canonicalForPath(path),name:pageName(out)||seo.productDisplayName(product),
      image,primaryImageOfPage:image,about:{'@type':'Product',name:seo.productDisplayName(product),brand:brandEntity(product.brand)}
    };
    out=out.replace('</head>',`<script type="application/ld+json" data-apg-search-image-intelligence="v${SEARCH_IMAGE_INTELLIGENCE_VERSION}">${json(page)}</script></head>`);
  }
  return out;
}
function removeMeta(html,key,value){
  const safe=value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(`<meta\\s+[^>]*${key}=["']${safe}["'][^>]*>`,`gi`);
  return html.replace(re,'');
}
function socialImageTags(image,alt){
  if(!image||!image.contentUrl)return '';
  const width=Number(image.width||0),height=Number(image.height||0),type=image.encodingFormat||imageMime(image.contentUrl);
  return [
    `<meta property="og:image" content="${image.contentUrl}">`,
    `<meta property="og:image:secure_url" content="${image.contentUrl}">`,
    `<meta property="og:image:type" content="${type}">`,
    width?`<meta property="og:image:width" content="${width}">`:'',
    height?`<meta property="og:image:height" content="${height}">`:'',
    `<meta property="og:image:alt" content="${String(alt||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">`,
    `<meta name="twitter:image" content="${image.contentUrl}">`,
    `<meta name="twitter:image:alt" content="${String(alt||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">`
  ].filter(Boolean).join('');
}
function patchProductSocialFallback(html,path){
  const product=productForPath(path);if(!product||verifiedProductImageObject(product))return html;
  const image=categoryImageObject(categoryForProduct(product),{product});if(!image)return html;
  let out=String(html||'');
  for(const [key,value] of [
    ['property','og:image'],['property','og:image:secure_url'],['property','og:image:type'],['property','og:image:width'],['property','og:image:height'],['property','og:image:alt'],
    ['name','twitter:image'],['name','twitter:image:alt']
  ])out=removeMeta(out,key,value);
  const alt=`${seo.productDisplayName(product)} — ${categoryForProduct(product)?.label||'product category'} editorial context`;
  return out.replace('</head>',socialImageTags(image,alt)+'</head>');
}
function patchCategoryHubAltText(html,path){
  if(path!=='/categories/'&&path!=='/categories')return html;
  return String(html||'').replace(/(<article\b[^>]*data-v7-category="([^"]+)"[\s\S]*?<img\b[^>]*src="\/category-editorial\/[^\"]+"[^>]*?)alt=""/gi,(whole,prefix,slug)=>{
    const category=categories[slug];if(!category)return whole;
    return `${prefix}alt="${String(category.label||slug).replace(/&/g,'&amp;').replace(/"/g,'&quot;')} editorial category image"`;
  }).replace(/(<article\bclass="category-card"[\s\S]*?<a href="\/categories\/([^/]+)\/"[\s\S]*?<img\b[^>]*src="\/category-editorial\/[^\"]+"[^>]*?)alt=""/gi,(whole,prefix,slug)=>{
    const category=categories[slug];if(!category)return whole;
    return `${prefix}alt="${String(category.label||slug).replace(/&/g,'&amp;').replace(/"/g,'&quot;')} editorial category image"`;
  });
}
function injectHtml(html,path){
  let out=String(html||'');
  if(!/<head[\s>]/i.test(out)||out.includes('name="apg-search-image-intelligence"'))return out;
  out=patchJsonLd(out,path);
  out=patchProductSocialFallback(out,path);
  out=patchCategoryHubAltText(out,path);
  out=out.replace('</head>',`<meta name="apg-search-image-intelligence" content="v${SEARCH_IMAGE_INTELLIGENCE_VERSION}"></head>`);
  return out;
}
function sitemapImagesForPath(path){
  const p=String(path||'');
  if(p==='/categories/'||p==='/categories')return Object.values(categories).map(category=>categoryImageObject(category)).filter(Boolean).map(image=>image.contentUrl);
  if(p==='/brands/'||p==='/brands')return Object.keys(curatedBrandMarks).map(slug=>`${ORIGIN}/assets/brand-marks/${encodeURIComponent(slug)}`);
  const product=productForPath(p);
  if(product){
    const primary=verifiedProductImageObject(product)||categoryImageObject(categoryForProduct(product),{product});
    const brandLogo=curatedBrandLogoObject(product.brand);
    return [primary&&primary.contentUrl,brandLogo&&brandLogo.contentUrl].filter(Boolean);
  }
  const categorySlug=categorySlugForPath(p);
  if(categorySlug){const image=categoryImageObject(categories[categorySlug]);return image?[image.contentUrl]:[];}
  const brandMatch=p.match(/^\/brands\/([^/]+)\/?$/i);
  if(brandMatch&&curatedBrandMarks[brandMatch[1]])return [`${ORIGIN}/assets/brand-marks/${encodeURIComponent(brandMatch[1])}`];
  return [];
}
function patchImageSitemap(xml){
  let out=String(xml||'');
  if(!/<urlset\b/i.test(out))return out;
  if(!/xmlns:image=/.test(out))out=out.replace(/<urlset\b([^>]*)>/i,`<urlset$1 xmlns:image="${IMAGE_SITEMAP_NS}">`);
  out=out.replace(/<url>([\s\S]*?)<\/url>/gi,(whole,inner)=>{
    if(/<image:image>/i.test(inner))return whole;
    const locMatch=inner.match(/<loc>([\s\S]*?)<\/loc>/i);if(!locMatch)return whole;
    let loc=locMatch[1].replace(/&amp;/g,'&').trim();
    let path='/';try{path=new URL(loc).pathname}catch{return whole;}
    const images=[...new Set(sitemapImagesForPath(path))].slice(0,1000);
    if(!images.length)return whole;
    const imageXml=images.map(url=>`<image:image><image:loc>${xmlEscape(url)}</image:loc></image:image>`).join('');
    return `<url>${inner}${imageXml}</url>`;
  });
  return out;
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Search-Image-Intelligence','v'+SEARCH_IMAGE_INTELLIGENCE_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))){
      const type=String(res.getHeader('Content-Type')||'').toLowerCase();
      const originalBuffer=Buffer.isBuffer(body);let text=originalBuffer?body.toString('utf8'):body;let next=text;
      if(type.startsWith('text/html'))next=injectHtml(text,path);
      else if(path==='/sitemap.xml'&&(type.includes('xml')||type.includes('text/plain')))next=patchImageSitemap(text);
      if(next!==text){body=originalBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  SEARCH_IMAGE_INTELLIGENCE_VERSION,IMAGE_SITEMAP_NS,categoryImageObject,verifiedProductImageObject,
  curatedBrandLogoObject,brandEntity,pageImageForPath,categorySlugForPath,productForPath,injectHtml,
  patchImageSitemap,sitemapImagesForPath,products,categories,categoryImages,curatedBrandMarks
});
module.exports=handler;
