'use strict';

// APG Image SEO Phase 1 v74
//
// Crawler-facing image semantics layered ABOVE the current v73.1 presentation stack.
// The central rule is intentionally strict:
//   * Product.image = verified exact/same-model product photography only.
//   * Brand marks = Brand.logo / visual placeholder only; never Product.image.
//   * Category editorial imagery = Collection/WebPage context; never product evidence.
//
// This layer enriches SSR HTML, JSON-LD, social metadata and the XML sitemap while
// preserving APG's existing provenance, rights and brand-logo governance.
const downstream=require('./brand-mark-missing-only-v73');
const registry=require('../data/image-seo-registry-v74');
const {categories,products,brands}=registry;
const {slugify}=require('./routes');

const IMAGE_SEO_PHASE1_VERSION='74.0';
const ORIGIN=registry.ORIGIN;
const IMAGE_SITEMAP_NS='http://www.google.com/schemas/sitemap-image/1.1';
const productBySlug=new Map(products.map(product=>[product.slug,product]));
const brandBySlug=new Map(brands.map(brand=>[slugify(brand),brand]));
const RESTRICTIONS=Object.freeze({
  ...(downstream.BRAND_LOGO_USE_RESTRICTIONS||{}),
  ...(downstream.ADDITIONAL_LOGO_USE_RESTRICTIONS||{})
});

function json(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function htmlEscape(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function xmlEscape(value){return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');}
function absolute(value){return registry.absolute(value);}
function pathOnly(value){try{return new URL(String(value||''),ORIGIN).pathname}catch{return String(value||'').split('?')[0]}}
function types(node){const type=node&&node['@type'];return Array.isArray(type)?type:[type].filter(Boolean);}
function pageTitle(html){
  const match=String(html||'').match(/<title>([\s\S]*?)<\/title>/i);
  return match?match[1].replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim():'';
}
function canonical(path){return ORIGIN+(String(path||'/').startsWith('/')?String(path||'/'):'/'+String(path||'/'));}
function productForPath(path){
  const match=String(path||'').match(/^\/products\/([^/]+)\/?$/i);
  return match?productBySlug.get(match[1])||null:null;
}
function brandForPath(path){
  const match=String(path||'').match(/^\/brands\/([^/]+)\/?$/i);
  return match?brandBySlug.get(match[1])||null:null;
}
function categorySlugForPath(path){
  const value=String(path||'');
  let match=value.match(/^\/categories\/([^/]+)(?:\/|$)/i);
  if(match&&categories[match[1]])return match[1];
  match=value.match(/^\/guides\/([^/]+)-buying-guide\/?$/i);
  if(match&&categories[match[1]])return match[1];
  match=value.match(/^\/compare\/([^/]+)(?:\/|$)/i);
  if(match&&categories[match[1]])return match[1];
  const product=productForPath(value);
  return product&&categories[product.category]?product.category:null;
}
function brandRecordForName(name){return registry.brandRecord(name,{restrictions:RESTRICTIONS});}
function brandEntity(name){
  const record=brandRecordForName(name),slug=slugify(name||'');
  if(!record||!slug)return null;
  const entity={'@type':'Brand','@id':`${ORIGIN}/brands/${slug}/#brand`,name:String(name),url:`${ORIGIN}/brands/${slug}/`};
  if(record.eligibleBrandLogo)entity.logo=imageObject(record,{representative:false,idSuffix:'brand-logo'});
  return entity;
}
function imageObject(record,options={}){
  if(!record||!record.imageUrl)return null;
  const object={
    '@type':'ImageObject',
    '@id':`${record.imageUrl}#${options.idSuffix||'apg-image'}`,
    url:record.imageUrl,
    contentUrl:record.imageUrl,
    caption:record.caption||record.title||record.alt,
    description:record.purpose||record.caption||record.alt,
    encodingFormat:record.format||undefined
  };
  if(options.representative!==false)object.representativeOfPage=true;
  if(Number(record.width)>0)object.width=Number(record.width);
  if(Number(record.height)>0)object.height=Number(record.height);
  if(record.creator)object.creditText=record.creator;
  if(record.licenceUrl)object.license=record.licenceUrl;
  return Object.fromEntries(Object.entries(object).filter(([,value])=>value!==undefined&&value!==null&&value!==''));
}
function preferredPageRecord(path){
  const product=productForPath(path);
  if(product)return registry.verifiedProductRecord(product)||registry.categoryContextForProduct(product);
  const brand=brandForPath(path);
  if(brand){const record=brandRecordForName(brand);return record&&record.eligiblePreferredPageImage?record:null;}
  const categorySlug=categorySlugForPath(path);
  return categorySlug?registry.categoryRecord(categorySlug):null;
}
function socialRecord(path){
  const record=preferredPageRecord(path);
  // Raster category/product imagery is a strong social preview. SVG brand marks are
  // retained in structured Brand.logo but not forced into social cards, because many
  // social crawlers handle SVG previews inconsistently.
  return record&&record.imageType!=='brand_logo'?record:null;
}
function enrichItemList(node,path){
  if(!node||!Array.isArray(node.itemListElement))return node;
  if(path==='/categories/'||path==='/categories'){
    return {...node,itemListElement:node.itemListElement.map(row=>{
      const raw=String(row&&((row.item&&row.item.url)||row.url||row.item)||'');
      const match=raw.match(/\/categories\/([^/]+)\/?$/i),slug=match&&match[1];
      const category=slug&&categories[slug],record=category&&registry.categoryRecord(slug);
      if(!category||!record)return row;
      return {...row,item:{'@type':'CollectionPage','@id':`${ORIGIN}/categories/${slug}/#collection`,name:category.label,url:`${ORIGIN}/categories/${slug}/`,image:imageObject(record)}};
    })};
  }
  if(path==='/brands/'||path==='/brands'){
    return {...node,itemListElement:node.itemListElement.map(row=>{
      const raw=String(row&&((row.item&&row.item.url)||row.url||row.item)||'');
      const match=raw.match(/\/brands\/([^/]+)\/?$/i),brand=match&&brandBySlug.get(match[1]);
      if(!brand)return row;
      return {...row,item:brandEntity(brand)};
    })};
  }
  return node;
}
function enrichSchemaNode(node,path,state){
  if(!node||typeof node!=='object')return node;
  if(Array.isArray(node))return node.map(item=>enrichSchemaNode(item,path,state));
  let next={...node};
  if(Array.isArray(next['@graph']))next['@graph']=next['@graph'].map(item=>enrichSchemaNode(item,path,state));
  const nodeTypes=types(next);
  if(nodeTypes.includes('Product')){
    const product=productForPath(path);
    if(product){
      const entity=brandEntity(product.brand);if(entity)next.brand=entity;
      const verified=registry.verifiedProductRecord(product);
      if(verified)next.image=[verified.imageUrl];
      else if(next.image)delete next.image; // fail closed: never allow logo/category placeholder to become Product.image
      state.product=true;
    }
  }
  if(nodeTypes.includes('ItemList'))next=enrichItemList(next,path);
  const pageLike=nodeTypes.some(type=>['WebPage','CollectionPage','Article','TechArticle'].includes(type));
  if(pageLike){
    const record=preferredPageRecord(path);
    if(record){
      const image=imageObject(record);
      next.image=image;
      if(nodeTypes.includes('WebPage')||nodeTypes.includes('CollectionPage'))next.primaryImageOfPage=image;
      state.pageImage=true;
    }
    const brand=brandForPath(path);if(brand)next.about=brandEntity(brand);
  }
  if(nodeTypes.includes('Brand')){
    const brand=brandForPath(path);
    if(brand){const entity=brandEntity(brand);if(entity){next={...next,...entity};state.brand=true;}}
  }
  return next;
}
function patchJsonLd(html,path){
  const state={product:false,pageImage:false,brand:false};
  let out=String(html||'');
  out=out.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(whole,attrs,payload)=>{
    try{return `<script${attrs}>${json(enrichSchemaNode(JSON.parse(payload),path,state))}</script>`;}catch{return whole;}
  });
  const record=preferredPageRecord(path),product=productForPath(path),brand=brandForPath(path),categorySlug=categorySlugForPath(path);
  if(record&&!state.pageImage){
    const image=imageObject(record),pageType=(categorySlug&&!product)?'CollectionPage':'WebPage';
    const page={
      '@context':'https://schema.org','@type':pageType,'@id':`${canonical(path)}#webpage`,url:canonical(path),
      name:pageTitle(out)||(product?registry.productDisplayName(product):brand||categories[categorySlug]?.label||'Australian Product Guide'),
      image,primaryImageOfPage:image
    };
    if(product)page.about={'@type':'Product',name:registry.productDisplayName(product),brand:brandEntity(product.brand)};
    if(brand)page.about=brandEntity(brand);
    out=out.replace('</head>',`<script type="application/ld+json" data-apg-image-seo="v${IMAGE_SEO_PHASE1_VERSION}">${json(page)}</script></head>`);
  }
  if(brand&&!state.brand){
    const entity=brandEntity(brand);
    if(entity)out=out.replace('</head>',`<script type="application/ld+json" data-apg-image-seo-brand="v${IMAGE_SEO_PHASE1_VERSION}">${json({'@context':'https://schema.org',...entity})}</script></head>`);
  }
  return out;
}
function removeMeta(html,key,value){
  const escaped=String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return String(html||'').replace(new RegExp(`<meta\\s+[^>]*${key}=["']${escaped}["'][^>]*>`,`gi`),'');
}
function patchSocial(html,path){
  const record=socialRecord(path);if(!record)return html;
  let out=String(html||'');
  for(const [key,value] of [
    ['property','og:image'],['property','og:image:secure_url'],['property','og:image:type'],['property','og:image:width'],['property','og:image:height'],['property','og:image:alt'],
    ['name','twitter:image'],['name','twitter:image:alt']
  ])out=removeMeta(out,key,value);
  const tags=[
    `<meta property="og:image" content="${htmlEscape(record.imageUrl)}">`,
    `<meta property="og:image:secure_url" content="${htmlEscape(record.imageUrl)}">`,
    `<meta property="og:image:type" content="${htmlEscape(record.format)}">`,
    Number(record.width)>0?`<meta property="og:image:width" content="${Number(record.width)}">`:'',
    Number(record.height)>0?`<meta property="og:image:height" content="${Number(record.height)}">`:'',
    `<meta property="og:image:alt" content="${htmlEscape(record.alt)}">`,
    `<meta name="twitter:image" content="${htmlEscape(record.imageUrl)}">`,
    `<meta name="twitter:image:alt" content="${htmlEscape(record.alt)}">`
  ].filter(Boolean).join('');
  return out.replace('</head>',tags+'</head>');
}
function setAttr(tag,name,value){
  const re=new RegExp(`\\s${name}=["'][^"']*["']`,'i');
  if(re.test(tag))return tag.replace(re,` ${name}="${htmlEscape(value)}"`);
  return tag.replace(/^<img\b/i,`<img ${name}="${htmlEscape(value)}"`);
}
function removeAttr(tag,name){return tag.replace(new RegExp(`\\s${name}=["'][^"']*["']`,'gi'),'');}
function imageSrc(tag){return ((String(tag).match(/\bsrc=["']([^"']+)["']/i)||[])[1]||'').trim();}
function patchImageTags(html,path){
  const categorySlug=categorySlugForPath(path),pageCategory=categorySlug&&registry.categoryRecord(categorySlug);
  const categoryRecords=registry.allCategoryRecords();
  const categoryByUrl=new Map();
  for(const record of categoryRecords){
    categoryByUrl.set(record.imageUrl,record);
    categoryByUrl.set(pathOnly(record.imageUrl),record);
  }
  return String(html||'').replace(/<img\b[^>]*>/gi,tag=>{
    const src=imageSrc(tag);if(!src)return tag;
    const brandMatch=src.match(/^\/assets\/brand-marks\/([^?"']+)/i);
    if(brandMatch){
      let slug='';try{slug=decodeURIComponent(brandMatch[1]).toLowerCase()}catch{}
      const name=brandBySlug.get(slug);
      if(!name)return tag;
      let next=setAttr(tag,'alt',`${name} brand logo`);
      next=setAttr(next,'decoding','async');
      return next;
    }
    const absoluteSrc=absolute(src),record=categoryByUrl.get(absoluteSrc)||categoryByUrl.get(pathOnly(src));
    if(record){
      let next=setAttr(tag,'alt',record.alt);
      if(Number(record.width)>0)next=setAttr(next,'width',String(Number(record.width)));
      if(Number(record.height)>0)next=setAttr(next,'height',String(Number(record.height)));
      next=setAttr(next,'decoding','async');
      const isPrimary=pageCategory&&pageCategory.imageUrl===record.imageUrl&&/^\/categories\/[^/]+\/?$/i.test(path);
      if(isPrimary){next=setAttr(removeAttr(next,'loading'),'loading','eager');next=setAttr(next,'fetchpriority','high');}
      else if(!/\bloading=/i.test(next))next=setAttr(next,'loading','lazy');
      return next;
    }
    const product=productForPath(path),verified=product&&registry.verifiedProductRecord(product);
    if(verified&&absoluteSrc===verified.imageUrl){
      let next=setAttr(tag,'alt',verified.alt);next=setAttr(next,'decoding','async');
      if(!/\bloading=/i.test(next))next=setAttr(next,'loading','eager');
      return next;
    }
    return tag;
  });
}
function injectMeta(html){
  const text=String(html||'');
  if(text.includes('name="apg-image-seo-phase1"'))return text;
  return text.replace('</head>',`<meta name="apg-image-seo-phase1" content="v${IMAGE_SEO_PHASE1_VERSION}"></head>`);
}
function patchHtml(html,path){
  let out=String(html||'');
  if(!/<head[\s>]/i.test(out))return out;
  out=patchJsonLd(out,path);
  out=patchSocial(out,path);
  out=patchImageTags(out,path);
  out=injectMeta(out);
  return out;
}
function sitemapRecordsForPath(path){
  const p=String(path||'');
  if(p==='/categories/'||p==='/categories')return registry.allCategoryRecords().filter(record=>record.eligibleImageSitemap);
  if(p==='/brands/'||p==='/brands')return registry.allBrandRecords({restrictions:RESTRICTIONS}).filter(record=>record.eligibleImageSitemap);
  const product=productForPath(p);
  if(product){const record=registry.verifiedProductRecord(product);return record&&record.eligibleImageSitemap?[record]:[];}
  const brand=brandForPath(p);
  if(brand){const record=brandRecordForName(brand);return record&&record.eligibleImageSitemap?[record]:[];}
  const categorySlug=categorySlugForPath(p);
  if(categorySlug){const record=registry.categoryRecord(categorySlug);return record&&record.eligibleImageSitemap?[record]:[];}
  return [];
}
function patchImageSitemap(xml){
  let out=String(xml||'');if(!/<urlset\b/i.test(out))return out;
  if(!/xmlns:image=/.test(out))out=out.replace(/<urlset\b([^>]*)>/i,`<urlset$1 xmlns:image="${IMAGE_SITEMAP_NS}">`);
  return out.replace(/<url>([\s\S]*?)<\/url>/gi,(whole,inner)=>{
    if(/<image:image>/i.test(inner))return whole;
    const loc=(inner.match(/<loc>([\s\S]*?)<\/loc>/i)||[])[1];if(!loc)return whole;
    let path='/';try{path=new URL(String(loc).replace(/&amp;/g,'&')).pathname}catch{return whole;}
    const records=sitemapRecordsForPath(path),seen=new Set(),images=[];
    for(const record of records){if(!record||!record.imageUrl||seen.has(record.imageUrl))continue;seen.add(record.imageUrl);images.push(`<image:image><image:loc>${xmlEscape(record.imageUrl)}</image:loc></image:image>`);if(images.length>=1000)break;}
    return images.length?`<url>${inner}${images.join('')}</url>`:whole;
  });
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Image-SEO-Phase1','v'+IMAGE_SEO_PHASE1_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))){
      const type=String(res.getHeader('Content-Type')||'').toLowerCase(),wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      let next=original;
      if(type.startsWith('text/html'))next=patchHtml(original,path);
      else if(path==='/sitemap.xml'&&(type.includes('xml')||type.includes('text/plain')))next=patchImageSitemap(original);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  IMAGE_SEO_PHASE1_VERSION,IMAGE_SITEMAP_NS,IMAGE_SEO_RESTRICTIONS:RESTRICTIONS,imageSeoRegistry:registry,
  imageObject,productForPath,brandForPath,categorySlugForPath,preferredPageRecord,socialRecord,brandEntity,
  patchJsonLd,patchSocial,patchImageTags,patchHtml,sitemapRecordsForPath,patchImageSitemap
});
module.exports=handler;
