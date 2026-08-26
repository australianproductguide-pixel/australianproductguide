'use strict';

// APG Vercel Speed Insights v112.
// Framework-agnostic, SSR-first integration for APG's custom Node runtime.
// Vercel's Next.js <SpeedInsights /> component is deliberately not used because
// APG is not a Next.js application. This layer injects the first-party Speed
// Insights bootstrap and script into successful HTML responses only.

const DEFAULT_SCRIPT='/_vercel/speed-insights/script.js';
const SDK_NAME='@vercel/speed-insights/apg-ssr';
const SDK_VERSION='2.0.0';

function safePath(value,fallback=''){
  const raw=String(value||'').trim();
  if(!raw)return fallback;
  if(/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(raw))return raw;
  if(/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9._~!$&'()*+,;=:@%/?#-]*$/.test(raw))return raw;
  return fallback;
}

function speedInsightsConfig(){
  const raw=process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  if(!raw)return {};
  try{
    const speedInsights=JSON.parse(raw)?.speedInsights||{};
    return {
      scriptSrc:safePath(speedInsights.scriptSrc,DEFAULT_SCRIPT),
      endpoint:safePath(speedInsights.endpoint,'')
    };
  }catch{return {};}
}

function escAttr(value){
  return String(value||'')
    .replace(/&/g,'&amp;')
    .replace(/"/g,'&quot;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

function speedInsightsTag(){
  const cfg=speedInsightsConfig();
  const attrs=[
    `src="${escAttr(cfg.scriptSrc||DEFAULT_SCRIPT)}"`,
    'defer',
    `data-sdkn="${escAttr(SDK_NAME)}"`,
    `data-sdkv="${escAttr(SDK_VERSION)}"`
  ];
  if(cfg.endpoint)attrs.push(`data-endpoint="${escAttr(cfg.endpoint)}"`);
  return `<script>window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};</script><script ${attrs.join(' ')}></script>`;
}

function inject(html){
  const source=String(html||'');
  if(source.includes('data-sdkn="'+SDK_NAME+'"')||source.includes('/speed-insights/script.js'))return source;
  if(!source.includes('</head>'))return source;
  return source.replace('</head>',speedInsightsTag()+'</head>');
}

function wrap(app){
  if(typeof app!=='function')throw new TypeError('Vercel Speed Insights requires an HTTP handler');
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
  Object.assign(handler,app,{
    VERCEL_SPEED_INSIGHTS_VERSION:'112.0',
    VERCEL_SPEED_INSIGHTS_SCRIPT:DEFAULT_SCRIPT
  });
  return handler;
}

module.exports={
  VERSION:'112.0',
  DEFAULT_SCRIPT,
  SDK_NAME,
  SDK_VERSION,
  speedInsightsConfig,
  speedInsightsTag,
  inject,
  wrap
};
