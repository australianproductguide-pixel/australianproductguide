'use strict';

const downstream=require('./vercel-analytics-v38');
const shoppingShell=require('./amazon-shopping-shell-v39');

module.exports=(req,res)=>{
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=shoppingShell.enhance(body);
    }
    return originalEnd(body,...args);
  };
  return downstream(req,res);
};
