const experience=require('./consumer-experience-v10');
const scout=require('./scout-assistant-v10');
function pathOf(req){try{return new URL(req.url,'https://australianproductguide.au').pathname}catch{return '/'}}
function send(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body)}
module.exports=(req,res)=>{const path=pathOf(req);if(path==='/assets/assistant.css')return send(req,res,'text/css; charset=utf-8',scout.css);if(path==='/assets/assistant.js')return send(req,res,'application/javascript; charset=utf-8',scout.clientJs);return experience(req,res);};
