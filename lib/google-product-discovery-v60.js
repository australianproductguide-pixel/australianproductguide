'use strict';

// APG Google Product Discovery v60
// Outermost crawler/browser enrichment layer for Google editorial product discovery.
// APG remains an editorial comparison/decision-support publisher, not the merchant
// of record. v60 enriches the existing canonical Product entity rather than creating
// a second Product entity. No Offer, price, stock, aggregateRating or fabricated
// reviewRating fields are emitted.
const downstream=require('./brand-search-identity-v59');
const seo=require('./seo-optimisation-v58-runtime');
const {products}=require('../data');

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
function enrichProductSchema(schema,product){
  const next={...schema,review:reviewSchema(product)};
  if(product.model&&!next.model)next.model=String(product.model).trim();
  const image=productImage(product);if(image)next.image=[image];
  return next;
}
function enrichSchemaValue(value,product){
  if(!value||typeof value!=='object')return {value,changed:false};
  if(Array.isArray(value)){
    let changed=false;
    const next=value.map(item=>{const result=enrichSchemaValue(item,product);changed=changed||result.changed;return result.value;});
    return {value:next,changed};
  }
  if(value['@type']==='Product')return {value:enrichProductSchema(value,product),changed:true};
  if(Array.isArray(value['@graph'])){
    let changed=false;
    const graph=value['@graph'].map(item=>{const result=enrichSchemaValue(item,product);changed=changed||result.changed;return result.value;});
    return {value:changed?{...value,'@graph':graph}:value,changed};
  }
  return {value,changed:false};
}
function inject(html,path){
  const product=productForPath(path);
  let out=String(html||'');
  if(!product||!/<head[\\s>]/i.test(out)||out.includes('data-apg-google-product-discovery='))return out;
  let enriched=false;
  out=out.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(whole,payload)=>{
    try{
      const parsed=JSON.parse(payload);
      const result=enrichSchemaValue(parsed,product);
      if(!result.changed)return whole;
      enriched=true;
      return `<script type="application/ld+json" data-apg-google-product-discovery="v${GOOGLE_PRODUCT_DISCOVERY_VERSION}">${json(result.value)}</script>`;
    }catch{return whole;}
  });
  if(enriched&&!out.includes('name="apg-google-product-discovery"')){
    out=out.replace('</head>',`<meta name="apg-google-product-discovery" content="v${GOOGLE_PRODUCT_DISCOVERY_VERSION}"></head>`);
  }
  return out;
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
  reviewSchema,enrichProductSchema,enrichSchemaValue,inject,products
});
module.exports=handler;
