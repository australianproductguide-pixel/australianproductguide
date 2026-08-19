'use strict';
const upstream=require('./scout-concierge-v5');
const guard=require('./scout-session-guard-v5');
const GUARD_PATH='/assets/scout-session-guard-v5.js';

function sendAsset(res){res.statusCode=200;res.setHeader('Content-Type','application/javascript; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Scout-Session-Guard','v5');return res.end(guard.js);}
function inject(html){const source=String(html||'');if(source.includes(GUARD_PATH))return source;return source.replace('</body>',`<script src="${GUARD_PATH}?v=${guard.VERSION}" defer></script></body>`);}
function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===GUARD_PATH)return sendAsset(res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length');}}
    return end(body,...args);
  };
  return upstream(req,res);
}
Object.assign(handler,upstream,{GUARD_PATH,guard,injectSessionGuard:inject});
module.exports=handler;
