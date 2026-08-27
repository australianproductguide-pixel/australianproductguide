'use strict';

// APG Customer Journey Programme v114.1 composition adapter.
// Keeps Whole-Site v109 as the final public HTML communication layer while installing
// the already-certified v114 category/search/filter/continuity transform inside it.
// Only the four decision surfaces touched by v114 are transformed; unrelated routes
// such as Deals remain byte-for-byte outside this tranche.
const base=require('./customer-journey-programme-v114-runtime');

const VERSION='114.1';
const ORIGIN='https://australianproductguide.au';
const TARGET_HTML=path=>/^\/categories\/[^/]+\/$/.test(path)||path==='/search/'||path.startsWith('/compare/')||path==='/decision-lab/';
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function sendJson(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return res.end(JSON.stringify(payload));}
function suggestions(req,res,u){
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{error:'method_not_allowed'});
  const query=(u.searchParams.get('q')||'').slice(0,160),items=base.searchSuggestions(query,7),payload={version:VERSION,queryLength:query.trim().length,count:items.length,items};
  return req.method==='HEAD'?sendJson(res,200,{...payload,items:[]}):sendJson(res,200,payload);
}
function quality(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD')return sendJson(res,405,{error:'method_not_allowed'});
  const payload=base.categoryQualityRegister(),versioned={...payload,version:VERSION};
  return req.method==='HEAD'?sendJson(res,200,{version:VERSION,summary:payload.summary}):sendJson(res,200,versioned);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('customer journey programme v114.1 requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),path=u.pathname;
    if(path==='/api/search-suggest')return suggestions(req,res,u);
    if(path==='/api/intelligence/category-quality')return quality(req,res);
    if(!TARGET_HTML(path))return downstream(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase(),textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=base.transformHtml(source,path,u);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CUSTOMER_JOURNEY_PROGRAMME_VERSION:VERSION,CATEGORY_QUALITY_REGISTER_VERSION:VERSION,SEARCH_SUGGEST_VERSION:VERSION});
  return handler;
}
function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v114.1 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.CUSTOMER_JOURNEY_V1141_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function customerJourneyAwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.CUSTOMER_JOURNEY_V1141_INSTALLED=true;
  wholeSiteExperience.CUSTOMER_JOURNEY_PROGRAMME_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={...base,VERSION,TARGET_HTML,wrap,install};
