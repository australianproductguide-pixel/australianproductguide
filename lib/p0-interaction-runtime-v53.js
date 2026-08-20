'use strict';

// P0 interaction composition layer.
// Search v52 remains the authoritative outer Search runtime. Decision Lab v50.5
// adds only its dedicated assets and HTML injection while v50.4, already beneath
// Search v52, continues serving the isolated Decision Engine JSON contract.
const search=require('./search-reliability-v52-runtime');
const decision505=require('./decision-lab-resilience-v505-runtime');

function handler(req,res){
 let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}
 if(url.pathname===decision505.ASSET_PATH||url.pathname===decision505.CSS_PATH)return decision505(req,res);
 if(url.pathname==='/decision-lab/')res.setHeader('X-APG-Decision-Lab-Resilience',decision505.PATCH);
 const end=res.end.bind(res);
 res.end=(body,...args)=>{
  const type=String(res.getHeader('Content-Type')||'').toLowerCase();
  if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&url.pathname==='/decision-lab/'){
   const next=decision505.inject(body);if(next!==body){body=next;res.removeHeader('Content-Length')}
  }
  return end(body,...args);
 };
 return search(req,res);
}

Object.assign(handler,search,{
 VERSION:search.VERSION,
 PATCH:search.PATCH,
 SEARCH_VERSION:search.SEARCH_VERSION,
 DECISION_VERSION:decision505.VERSION,
 DECISION_PATCH:decision505.PATCH,
 decision505
});
module.exports=handler;
