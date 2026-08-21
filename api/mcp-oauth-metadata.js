'use strict';
const auth=require('../lib/apg-mcp-auth-v1');
module.exports=function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=300');
  if(req.method==='HEAD')return res.end();
  res.end(JSON.stringify(auth.protectedResourceMetadata()));
};
