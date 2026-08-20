'use strict';

// P0 interaction composition layer.
// Search v52 remains the authoritative outer Search runtime. Decision Lab v50.6
// adds only its dedicated assets and HTML injection while v50.4, already beneath
// Search v52, continues serving the isolated Decision Engine JSON contract.
const search=require('./search-reliability-v52-runtime');
const decision506=require('./decision-lab-resilience-v506-runtime');

function handler(req,res){
 let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}
 if(url.pathname===decision506.ASSET_PATH||url.pathname===decision506.CSS_PATH)return decision506(req,res);
 if(url.pathname==='/decision-lab/')res.setHeader('X-APG-Decision-Lab-Resilience',decision506.PATCH);
 const end=res.end.bind(res);
 res.end=(body,...args)=>{
  const type=String(res.getHeader('Content-Type')||'').toLowerCase();
  if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&url.pathname==='/decision-lab/'){
   const next=decision506.inject(body);if(next!==body){body=next;res.removeHeader('Content-Length')}
  }
  return end(body,...args);
 };
 return search(req,res);
}

Object.assign(handler,search,{
 VERSION:search.VERSION,
 PATCH:search.PATCH,
 SEARCH_VERSION:search.SEARCH_VERSION,
 DECISION_VERSION:decision506.VERSION,
 DECISION_PATCH:decision506.PATCH,
 decision506
});
module.exports=handler;
