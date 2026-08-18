// APG Brand Fidelity v32.1 compatibility and final-polish layer.
// Keeps the v32 visual reconciliation while preserving the mature application
// helper/export surface used by long-lived regression controls.
const upstream=require('./brand-fidelity-v32');
const v29=require('./amazon-conversion-v29');
const v30=require('./premium-brand-v30');
const v31=require('./premium-theme-v31');
const v311=require('./premium-theme-v311');

const VERSION='32.1';
const CSS_PATH='/assets/brand-fidelity-v321.css';
const css=`
/* Brand Fidelity v32.1 responsive fidelity correction. */
@media(max-width:390px){
  .site-header .brand{min-width:96px!important;max-width:101px!important}
  .site-header .apg-brand-v32-monogram{display:inline-flex!important;width:56px!important;height:26px!important}
  .site-header .apg-brand-v32-mark{width:31px!important;height:27px!important}
}
@media(max-width:350px){
  .site-header .brand{min-width:36px!important;max-width:40px!important}
  .site-header .apg-brand-v32-monogram{display:none!important}
  .site-header .apg-brand-v32-mark{width:36px!important;height:30px!important}
}
`;

function finalPolish(html){
  let out=String(html||'');
  // Decision Intelligence has long used this stable server-rendered SVG anchor
  // to prove Scout is graphical rather than a text-only fallback. Preserve it
  // on the new board-faithful Scout mark.
  if(!out.includes('id="scoutHat"')){
    out=out.replace(/(<span class="apg-brand-v32-scout"[^>]*>[\s\S]*?<svg class="apg-brand-v32-symbol apg-brand-v32-symbol-mono")/, '$1 id="scoutHat"');
  }
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  return out;
}

function transform(html,pathOrUrl){
  let out=v29.transform?v29.transform(String(html||''),pathOrUrl):String(html||'');
  out=v30.injectBrand?v30.injectBrand(out):out;
  out=v31.injectTheme?v31.injectTheme(out):out;
  out=v311.injectPolish?v311.injectPolish(out):out;
  out=upstream.inject?upstream.inject(out):out;
  return finalPolish(out);
}

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

function handler(req,res){
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendAsset(req,res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=finalPolish(body);
    return end(body,...args);
  };
  return upstream(req,res);
}

// Preserve mature v29 helper exports as well as v32 presentation helpers so
// adding a presentation layer never narrows the application module contract.
Object.assign(handler,v29,upstream,{VERSION,CSS_PATH,css,transform,finalPolish});
module.exports=handler;
