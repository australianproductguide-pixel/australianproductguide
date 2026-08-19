'use strict';

require('./scout-concierge-v5-runtime');
const next=require('./vercel-analytics-v38');

function send(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex');
  res.end(JSON.stringify(body));
}

module.exports=async function editorialImagePreview(req,res){
  let u;
  try{u=new URL(req.url,'https://preview.invalid')}catch{return send(res,400,{error:'Bad request'})}
  if(u.pathname!=='/api/editorial-image-research')return next(req,res);
  if(process.env.VERCEL_ENV==='production')return send(res,404,{error:'Not found'});
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return send(res,405,{error:'Method not allowed'});}
  const q=String(u.searchParams.get('q')||'coffee machine').trim().slice(0,120);
  if(!q)return send(res,400,{error:'Missing q'});
  const upstream=`https://stocksnap.io/api/search-photos/${encodeURIComponent(q)}/relevance/desc/1`;
  try{
    const r=await fetch(upstream,{headers:{'User-Agent':'AustralianProductGuide/1.0 (temporary editorial research; https://australianproductguide.au/about/)','Accept':'application/json'}});
    const text=await r.text();
    let data=null;try{data=JSON.parse(text)}catch{}
    const rows=Array.isArray(data?.results)?data.results.slice(0,5):[];
    return send(res,r.ok?200:502,{query:q,upstreamStatus:r.status,count:rows.length,keys:rows[0]?Object.keys(rows[0]):[],results:rows});
  }catch(error){return send(res,502,{query:q,error:String(error&&error.message||error)});}
};
