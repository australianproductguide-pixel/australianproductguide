'use strict';

const downstream=require('./amazon-shopping-final-v39');
const creative=require('./amazon-shopping-creative-v41');

function finalCreativeHtml(html,req){
  return creative.enhance(String(html||''),req);
}

module.exports=(req,res)=>{
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
