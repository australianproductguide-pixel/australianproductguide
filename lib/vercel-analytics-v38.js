'use strict';

// APG Vercel Web Analytics v38.
// Narrow final-response layer over the certified consumer runtime. It keeps APG's
// SSR-first architecture, uses Vercel's first-party analytics intake, strips all
// query/hash data before transmission, excludes the private My APG workspace and
// suppresses automated browser certification from consumer analytics.
const app=require('./pagespeed-certification-v30');

const LEGACY_SCRIPT='/_vercel/insights/script.js';
const SDK_NAME='@vercel/analytics/apg-ssr';
const SDK_VERSION='2.0.1';

function safePath(value,fallback=''){
  const raw=String(value||'').trim();
  if(!raw)return fallback;
  if(/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(raw))return raw;
  return fallback;
}

function observabilityConfig(){
  const raw=process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  if(!raw)return {};
  try{
    const analytics=JSON.parse(raw)?.analytics||{};
    return {
      scriptSrc:safePath(analytics.scriptSrc,LEGACY_SCRIPT),
      viewEndpoint:safePath(analytics.viewEndpoint,''),
      eventEndpoint:safePath(analytics.eventEndpoint,'')
    };
  }catch{return {};}
}

function escAttr(value){
  return String(value||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function analyticsTag(){
  const cfg=observabilityConfig();
  const scriptSrc=cfg.scriptSrc||LEGACY_SCRIPT;
  const attrs=[
    `src="${escAttr(scriptSrc)}"`,
    'defer',
    `data-sdkn="${escAttr(SDK_NAME)}"`,
    `data-sdkv="${escAttr(SDK_VERSION)}"`
  ];
  if(cfg.viewEndpoint)attrs.push(`data-view-endpoint="${escAttr(cfg.viewEndpoint)}"`);
  if(cfg.eventEndpoint)attrs.push(`data-event-endpoint="${escAttr(cfg.eventEndpoint)}"`);
  return `<script>
window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
window.va('beforeSend',function(event){
  try{
    if(navigator.webdriver)return null;
    const url=new URL(event&&event.url?event.url:location.href,location.origin);
    if(url.pathname==='/my-apg/'||url.pathname.startsWith('/my-apg/'))return null;
    url.search='';url.hash='';
    return Object.assign({},event,{url:url.origin+url.pathname});
  }catch{return event;}
});
</script><script ${attrs.join(' ')}></script>`;
}

function inject(html){
  const source=String(html||'');
  if(source.includes('data-sdkn="'+SDK_NAME+'"'))return source;
  if(!source.includes('</head>'))return source;
  return source.replace('</head>',analyticsTag()+'</head>');
}

function handler(req,res){
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=inject(body);
      if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return app(req,res);
}

Object.assign(handler,app,{LEGACY_SCRIPT,SDK_NAME,SDK_VERSION,observabilityConfig,analyticsTag,inject});
module.exports=handler;
