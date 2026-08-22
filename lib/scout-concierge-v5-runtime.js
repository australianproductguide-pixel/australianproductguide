'use strict';
const upstream=require('./scout-concierge-v5');
const guard=require('./scout-session-guard-v5');
const health=require('./scout-health-v5');
const GUARD_PATH='/assets/scout-session-guard-v5.js';
const HEALTH_PATH='/api/scout/health';
const CLIENT_JS_PATH='/assets/assistant.js';
const CLIENT_CSS_PATH='/assets/scout-concierge-v5.css';
const BROKEN_BRAND_SELECTOR='.apg-assistant-brand span:last-child';
const FIXED_BRAND_SELECTOR='.apg-assistant-brand > span:last-child';
const METHODOLOGY_WORK_RE=/\bhow do (?:apg )?recommendations? work\b/i;

// Action 1 Production control: the core classifier already understands methodology
// questions, but the natural APG wording "How do APG recommendations work?" fell
// through to category discovery. The runtime is loaded before the outer delivery
// chain, so harden that single intent without changing unrelated Scout behaviour.
const baseClassifyIntent=upstream.core&&upstream.core.classifyIntent;
if(typeof baseClassifyIntent==='function'&&!upstream.core.__action1MethodologyHardened){
  upstream.core.classifyIntent=(text,pageContext={})=>METHODOLOGY_WORK_RE.test(String(text||''))?'methodology_question':baseClassifyIntent(text,pageContext);
  Object.defineProperty(upstream.core,'__action1MethodologyHardened',{value:true,enumerable:false,configurable:false,writable:false});
}

const MOBILE_LAYOUT_CSS=String.raw`
/* Scout v5 mobile open-state repair — screenshot regression 2026-08-19. */
@media(max-width:640px){
  body[data-scout-v5="true"] .apg-assistant-panel{
    position:fixed!important;
    inset:0!important;
    z-index:1000!important;
    width:100vw!important;
    max-width:none!important;
    height:100dvh!important;
    max-height:none!important;
    margin:0!important;
    border:0!important;
    border-radius:0!important;
    box-shadow:none!important;
  }
  body[data-scout-v5="true"] .apg-assistant-head{
    position:relative!important;
    z-index:2!important;
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    width:100%!important;
    min-height:72px!important;
    padding:max(12px,env(safe-area-inset-top)) 14px 12px!important;
    flex:0 0 auto!important;
  }
  body[data-scout-v5="true"] .apg-assistant-brand{
    display:flex!important;
    align-items:center!important;
    gap:10px!important;
    flex:1 1 auto!important;
    min-width:0!important;
  }
  body[data-scout-v5="true"] .apg-assistant-brand>span:last-child{
    display:block!important;
    min-width:0!important;
    flex:1 1 auto!important;
  }
  body[data-scout-v5="true"] .apg-assistant-brand>span:last-child strong,
  body[data-scout-v5="true"] .apg-assistant-brand>span:last-child small{
    display:block!important;
    white-space:normal!important;
  }
  body[data-scout-v5="true"] .apg-assistant-avatar{
    display:grid!important;
    place-items:center!important;
    width:42px!important;
    height:42px!important;
    flex:0 0 42px!important;
    overflow:visible!important;
  }
  body[data-scout-v5="true"] .apg-assistant-body{
    width:100%!important;
    min-width:0!important;
    min-height:0!important;
    flex:1 1 auto!important;
    overflow:auto!important;
  }
  body[data-scout-v5="true"] .scout-v5-thread,
  body[data-scout-v5="true"] .scout-v5-row,
  body[data-scout-v5="true"] .scout-v5-bubble{
    min-width:0!important;
  }
  body[data-scout-v5="true"] .scout-v5-composer{
    position:relative!important;
    z-index:2!important;
    width:100%!important;
    flex:0 0 auto!important;
    padding-bottom:max(10px,env(safe-area-inset-bottom))!important;
    background:#fff!important;
  }
}
`;

function sendAsset(res){res.statusCode=200;res.setHeader('Content-Type','application/javascript; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Scout-Session-Guard','v5');return res.end(guard.js);}
function sendHealth(res){const result=health.run(upstream);res.statusCode=result.ok?200:503;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Scout','scout-concierge-v5-health');return res.end(JSON.stringify(result));}
function inject(html){const source=String(html||'');if(source.includes(GUARD_PATH))return source;return source.replace('</body>',`<script src="${GUARD_PATH}?v=${guard.VERSION}" defer></script></body>`);}
function patchClientJs(source){const text=String(source||'');return text.includes(BROKEN_BRAND_SELECTOR)?text.replace(BROKEN_BRAND_SELECTOR,FIXED_BRAND_SELECTOR):text;}
function patchClientCss(source){const text=String(source||'');return text.includes('Scout v5 mobile open-state repair')?text:text+'\n'+MOBILE_LAYOUT_CSS;}
function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===GUARD_PATH)return sendAsset(res);
  if(path===HEALTH_PATH&&req.method==='GET')return sendHealth(res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(path===CLIENT_JS_PATH&&type.startsWith('application/javascript')){const next=patchClientJs(body);if(next!==body){body=next;res.removeHeader('Content-Length');}}
      else if(path===CLIENT_CSS_PATH&&type.startsWith('text/css')){const next=patchClientCss(body);if(next!==body){body=next;res.removeHeader('Content-Length');}}
      else if(type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length');}}
    }
    return end(body,...args);
  };
  return upstream(req,res);
}
Object.assign(handler,upstream,{GUARD_PATH,HEALTH_PATH,CLIENT_JS_PATH,CLIENT_CSS_PATH,BROKEN_BRAND_SELECTOR,FIXED_BRAND_SELECTOR,METHODOLOGY_WORK_RE,MOBILE_LAYOUT_CSS,guard,health,patchClientJs,patchClientCss,injectSessionGuard:inject});
module.exports=handler;