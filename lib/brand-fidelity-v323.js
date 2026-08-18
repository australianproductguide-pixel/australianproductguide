// APG Brand Fidelity v32.3 final proof-banner accessibility polish.
// Fixes two defects found in the manually inspected exact-Production screenshots:
// the independence copy inherited a light legacy colour on yellow, and the wide
// floating Scout launcher could cover that copy at the initial desktop viewport.
const upstream=require('./brand-fidelity-v322');
const v29=require('./amazon-conversion-v29');
const v32=require('./brand-fidelity-v32');

const VERSION='32.3';
const CSS_PATH='/assets/brand-fidelity-v323.css';
const css=`
/* Brand Fidelity v32.3 — final maintained-research contrast and floating-UI clearance. */
body[data-brand-fidelity-v323="true"] .apg-proof-band-v20 .apg-proof-trust-v20{
  color:#2B4B56!important;
  font-weight:800!important;
  text-shadow:none!important;
}
@media(min-width:921px){
  body[data-brand-fidelity-v323="true"] .apg-assistant-launcher{
    width:58px!important;
    min-width:58px!important;
    max-width:58px!important;
    height:58px!important;
    min-height:58px!important;
    padding:6px!important;
    border-radius:999px!important;
    justify-content:center!important;
    gap:0!important;
  }
  body[data-brand-fidelity-v323="true"] .apg-assistant-launcher-copy{display:none!important}
  body[data-brand-fidelity-v323="true"] .apg-assistant-launcher-icon{
    width:44px!important;
    height:44px!important;
    flex:0 0 44px!important;
  }
}
`;

function inject(html){
  let out=String(html||'');
  if(out.includes('data-brand-fidelity-v323="true"'))return out;
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-fidelity-v323="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
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
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);
    return end(body,...args);
  };
  return upstream(req,res);
}
Object.assign(handler,v29,v32,upstream,{VERSION,CSS_PATH,css,inject,transform});
module.exports=handler;
