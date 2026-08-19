'use strict';

const downstream=require('./amazon-shopping-final-v39');
const creative=require('./amazon-shopping-creative-v41');
const CSS_PATH='/assets/amazon-shopping-creative-v41.css';

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function withCss(html){
  const body=String(html||'');
  if(body.includes(CSS_PATH))return body;
  return body.includes('</head>')?body.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=41"></head>`):body;
}

function finalCreativeHtml(html,req){
  return withCss(creative.enhance(String(html||''),req));
}

module.exports=(req,res)=>{
  const u=requestUrl(req);
  if(u.pathname===CSS_PATH){
    res.statusCode=200;
    res.setHeader('Content-Type','text/css; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600');
    return res.end(req.method==='HEAD'?'':creative.css);
  }
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=finalCreativeHtml(body,req);
    }
    return originalEnd(body,...args);
  };
  return downstream(req,res);
};

module.exports.finalCreativeHtml=finalCreativeHtml;
module.exports.withCss=withCss;
module.exports.CSS_PATH=CSS_PATH;
