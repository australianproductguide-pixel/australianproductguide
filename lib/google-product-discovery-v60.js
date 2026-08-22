'use strict';

// APG Google Product Discovery v60
// Outermost crawler/browser layer for Google product discovery. APG remains an
// editorial comparison/decision-support publisher, not the merchant of record.
// Product structured data is therefore deliberately editorial: no Offer,
// price, stock, aggregateRating or fabricated reviewRating fields are emitted.
const downstream=require('./brand-search-identity-v59');
const seo=require('./seo-optimisation-v58-runtime');
const {categories,products}=require('../data');

const GOOGLE_PRODUCT_DISCOVERY_VERSION='60.0';
const ORIGIN='https://australianproductguide.au';

function json(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function productForPath(path){return seo.productForPath(path);}
function productDisplayName(product){return seo.productDisplayName(product);}
function listItems(values){
  return (Array.isArray(values)?values:[]).map(v=>String(v||'').trim()).filter(Boolean).slice(0,8).map((name,index)=>({
    '@type':'ListItem',
    position:index+1,
    name
  }));
}
function productImage(product){
  const image=seo.verifiedProductSocialImage(product);
  return image&&image.src?image.src:null;
}
function reviewSchema(product){
  const name=productDisplayName(product);
  const positive=listItems(product.highlights);
  const watchValues=Array.isArray(product.watch)?product.watch:[product.watch];
  const negative=listItems(watchValues);
  const review={
    '@type':'Review',
    name:`${name} decision guide`,
    author:{'@type':'Team',name:'Australian Product Guide',url:ORIGIN+'/'},
    reviewBody:String(product.summary||`Australian Product Guide decision guide for ${name}.`).trim()
  };
  if(product.lastSubstantiveReview)review.dateModified=product.lastSubstantiveReview;
  if(positive.length)review.positiveNotes={'@type':'ItemList',itemListElement:positive};
  if(negative.length)review.negativeNotes={'@type':'ItemList',itemListElement:negative};
  return review;
}
function editorialProductSchema(product){
  const url=`${ORIGIN}/products/${product.slug}/`;
  const category=categories[product.category];
  const schema={
    '@type':'Product',
    '@id':url+'#product',
    name:productDisplayName(product),
    url,
    mainEntityOfPage:{'@type':'WebPage','@id':url},
    description:String(product.summary||'').trim(),
    brand:{'@type':'Brand',name:String(product.brand||'').trim()},
    review:reviewSchema(product)
  };
  if(product.model)schema.model=String(product.model).trim();
  if(category&&category.label)schema.category=category.label;
  const image=productImage(product);if(image)schema.image=[image];
  return schema;
}
function breadcrumbSchema(product){
  const name=productDisplayName(product);
  const category=categories[product.category];
  const items=[
    {'@type':'ListItem',position:1,name:'Australian Product Guide',item:ORIGIN+'/'},
    {'@type':'ListItem',position:2,name:category?.label||product.categoryLabel||'Products',item:category?`${ORIGIN}/categories/${category.slug}/`:`${ORIGIN}/categories/`},
    {'@type':'ListItem',position:3,name,item:`${ORIGIN}/products/${product.slug}/`}
  ];
  return {'@type':'BreadcrumbList',itemListElement:items};
}
function graphForProduct(product){
  return {'@context':'https://schema.org','@graph':[editorialProductSchema(product),breadcrumbSchema(product)]};
}
function schemaTag(product){
  return `<script type="application/ld+json" data-apg-google-product-discovery="v${GOOGLE_PRODUCT_DISCOVERY_VERSION}">${json(graphForProduct(product))}</script>`;
}
function inject(html,path){
  const product=productForPath(path);
  let out=String(html||'');
  if(!product||!/<head[\\s>]/i.test(out)||out.includes('data-apg-google-product-discovery='))return out;
  const marker=`<meta name="apg-google-product-discovery" content="v${GOOGLE_PRODUCT_DISCOVERY_VERSION}">`;
  return out.replace('</head>',schemaTag(product)+marker+'</head>');
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Google-Product-Discovery','v'+GOOGLE_PRODUCT_DISCOVERY_VERSION);
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
  GOOGLE_PRODUCT_DISCOVERY_VERSION,ORIGIN,productForPath,productDisplayName,listItems,productImage,
  reviewSchema,editorialProductSchema,breadcrumbSchema,graphForProduct,schemaTag,inject,products
});
module.exports=handler;
