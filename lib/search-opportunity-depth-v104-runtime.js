'use strict';

// APG Search Opportunity Depth Runtime v104.0
// Outermost SSR transformation for deliberately selected high-intent category,
// guide and comparison routes plus About/Updates reconciliation. It preserves
// all recommendation, retailer, account, analytics and existing SEO behaviour.
const downstream=require('./apg-proof-rail-runtime-v103');
const depth=require('./search-opportunity-depth-v104');

const ORIGIN='https://australianproductguide.au';

function shouldTransform(path){
  return path==='/about/'||path==='/updates/'||!!depth.depthForPath(path)?.depth;
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(!shouldTransform(path))return downstream(req,res);

  res.setHeader('X-APG-Search-Opportunity-Depth','v'+depth.VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=depth.transformHtml(original,path);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  SEARCH_OPPORTUNITY_DEPTH_VERSION:depth.VERSION,
  searchOpportunityDepthForPath:depth.depthForPath,
  transformSearchOpportunityDepthHtml:depth.transformHtml
});

module.exports=handler;
