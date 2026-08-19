'use strict';

// APG entity discovery v1.
// Normalises existing JSON-LD onto stable canonical entity identifiers and enriches
// product identity only with fields APG already maintains (internal ID + exact primary source).
const upstream=require('./indexnow-key-v1');
const {products}=require('../data');

const ORIGIN='https://australianproductguide.au';
const productBySlug=new Map(products.map(p=>[p.slug,p]));

function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function normaliseSchema(schema,path){
  if(!schema||typeof schema!=='object'||Array.isArray(schema))return schema;
  if(path==='/'&&schema['@type']==='WebSite'){
    return {...schema,'@id':ORIGIN+'/#website',url:ORIGIN+'/',inLanguage:'en-AU',publisher:{'@id':ORIGIN+'/#organization'}};
  }
  if(path==='/'&&schema['@type']==='Organization'){
    return {...schema,'@id':ORIGIN+'/#organization',name:'Australian Product Guide',alternateName:'APG',url:ORIGIN+'/',logo:ORIGIN+'/assets/logo.svg',areaServed:{'@type':'Country',name:'Australia'},description:'Independent Australian product discovery, comparison and explainable decision support.'};
  }
  const m=path.match(/^\/products\/([^/]+)\/$/);
  if(m&&schema['@type']==='Product'){
    const p=productBySlug.get(m[1]);
    if(!p)return schema;
    const canonical=ORIGIN+path;
    const out={...schema,'@id':canonical+'#product',url:canonical,mainEntityOfPage:canonical};
    if(p.id)out.sku=p.id;
    if(p.categoryLabel)out.category=p.categoryLabel;
    if(/^https:\/\//.test(String(p.source||'')))out.sameAs=p.source;
    return out;
  }
  return schema;
}

function enrichSchemas(html,path){
  return String(html||'').replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(whole,payload)=>{
    try{
      const parsed=JSON.parse(payload);
      const next=normaliseSchema(parsed,path);
      return `<script type="application/ld+json">${safeJson(next)}</script>`;
    }catch{return whole;}
  });
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=enrichSchemas(body,path);
      if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{ORIGIN,normaliseSchema,enrichSchemas});
module.exports=handler;
