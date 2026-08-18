// APG Brand Fidelity v32.2 final visual corrections.
// Keeps the approved v32 identity and historical yellow treatment while fixing
// the two remaining rendered-brand issues found by exact Production screenshots:
// (1) the navy P in the mobile APG monogram disappeared on the navy header; and
// (2) Scout's client runtime replaced the APG symbol with a legacy face mascot.
const upstream=require('./brand-fidelity-v321');
const v29=require('./amazon-conversion-v29');
const v32=require('./brand-fidelity-v32');

const VERSION='32.2';
const CSS_PATH='/assets/brand-fidelity-v322.css';
const JS_PATH='/assets/brand-fidelity-v322.js';

const css=`
/* Brand Fidelity v32.2 — final responsive and Scout identity corrections. */
@media(max-width:920px){
  .site-header .apg-brand-v32-monogram-svg path:nth-of-type(2){fill:#FFFFFF!important}
}
.apg-assistant-launcher-icon [data-apg-v322-scout],
.apg-assistant-avatar [data-apg-v322-scout],
.scout-mini [data-apg-v322-scout]{display:grid!important;width:100%!important;height:100%!important;place-items:center!important}
.apg-assistant-launcher-icon [data-apg-v322-scout] svg,
.apg-assistant-avatar [data-apg-v322-scout] svg{width:100%!important;height:100%!important;display:block!important}
.scout-mini [data-apg-v322-scout]{width:28px!important;height:28px!important}
.scout-mini [data-apg-v322-scout] svg{width:28px!important;height:28px!important;display:block!important}
`;

function scoutMarkup(){
  // Brand-board Scout relationship: APG master mark, white on APG Blue.
  return `<span data-apg-v322-scout="true" aria-hidden="true"><svg viewBox="0 0 64 64" role="img" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#2563EB"/><g transform="translate(3 10) scale(.34)" fill="#FFFFFF"><path d="M54 81 86 83 105 51 123 83 154 83 125 32 83 33Z"/><path d="M81 96 48 96 26 135 59 137Z"/><path d="M128 97 151 137 182 136 159 95Z"/><path d="M104 87 76 136 106 126 132 137Z"/></g></svg></span>`;
}

const clientJs=`(()=>{
  const mark=${JSON.stringify(scoutMarkup())};
  const apply=()=>{
    document.querySelectorAll('.apg-assistant-launcher-icon,.apg-assistant-avatar,.scout-mini').forEach(el=>{
      if(!el.querySelector('[data-apg-v322-scout="true"]'))el.innerHTML=mark;
    });
    const panel=document.getElementById('apgAssistantPanel');
    if(panel)panel.dataset.apgScoutBrand='v32.2';
    const launcher=document.getElementById('apgAssistantLauncher');
    if(launcher)launcher.dataset.apgScoutBrand='v32.2';
  };
  const boot=()=>{
    apply();
    const panel=document.getElementById('apgAssistantPanel');
    if(panel)new MutationObserver(()=>apply()).observe(panel,{subtree:true,childList:true});
    const launcher=document.getElementById('apgAssistantLauncher');
    if(launcher)new MutationObserver(()=>apply()).observe(launcher,{subtree:true,childList:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

function inject(html){
  let out=String(html||'');
  if(out.includes('data-brand-fidelity-v322="true"'))return out;
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-fidelity-v322="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}

function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}

function transform(html,pathOrUrl){
  let out=upstream.transform?upstream.transform(String(html||''),pathOrUrl):String(html||'');
  return inject(out);
}

function handler(req,res){
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path===JS_PATH)return send(res,req,clientJs,'application/javascript; charset=utf-8');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,v29,v32,upstream,{VERSION,CSS_PATH,JS_PATH,css,clientJs,scoutMarkup,inject,transform});
module.exports=handler;
