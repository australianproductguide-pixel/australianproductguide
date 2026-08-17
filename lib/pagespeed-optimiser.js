const app=require('./account-release-reconcile');

const PRIMARY_ORIGIN='https://australianproductguide.au';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev')
  .replace(/[^a-zA-Z0-9_-]/g,'').slice(0,16)||'dev';
const OPTIMISED_CSS='/assets/site-optimised.css';
const CORE_CSS_PATHS=[
  '/assets/site.css',
  '/assets/assistant.css',
  '/assets/navigation-v8.css',
  '/assets/institutional-v9.css',
  '/assets/mobile-search-layer-fix.css',
  '/assets/footer-v11.css'
];
const ACCOUNT_CSS_PATH='/assets/account-platform.css';

const PERFORMANCE_CSS=`
/* APG PageSpeed + accessibility hardening */
.apg-logo-ink{color:#0b3044}.apg-logo-ink.is-dark{color:#f6fbfa}
body[data-institutional-v9=true] .global-search input::placeholder{color:#566a73!important;opacity:1!important}
body[data-institutional-v9=true] .mobile-toggle,body[data-institutional-v9=true] .mobile-toggle span{color:#294956!important}
@media(max-width:920px){
 body[data-institutional-v9=true] .apg-home-hero-note-v9{color:#465f69!important}
 body[data-institutional-v9=true] .apg-home-category-v9 small{color:#516872!important}
 body[data-institutional-v9=true] .apg-home-section-head-v9 p{color:#465f69!important}
}
`;

let coreCss=null;
let accountCss=null;

function fakeReq(path){return {url:path,method:'GET',headers:{host:'australianproductguide.au','x-forwarded-host':'australianproductguide.au'}};}
function captureAsset(path){
  let body='';
  const headers=new Map();
  const res={
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this;},
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){headers.delete(String(name).toLowerCase());},
    end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return body;}
  };
  app(fakeReq(path),res);
  if(res.statusCode!==200)throw new Error(`Unable to capture ${path}: ${res.statusCode}`);
  return body;
}
function cssBundle(scope='core'){
  if(!coreCss)coreCss=CORE_CSS_PATHS.map(captureAsset).join('\n')+PERFORMANCE_CSS;
  if(scope!=='account')return coreCss;
  if(!accountCss)accountCss=coreCss+'\n'+captureAsset(ACCOUNT_CSS_PATH);
  return accountCss;
}
function sendCss(req,res,scope){
  const body=cssBundle(scope);
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}
function assetVersion(url){return `${url}${url.includes('?')?'&':'?'}v=${encodeURIComponent(BUILD_ID)}`;}
function versionLocalAssets(html){
  return html.replace(/\b(src|href)="(\/assets\/(?!site-optimised\.css)[^"?#]+\.(?:js|svg))"/g,(m,attr,url)=>`${attr}="${assetVersion(url)}"`);
}
function fixSearchAria(html){
  return html.replace(/<input([^>]*\bdata-site-search\b[^>]*)>/g,(match,attrs)=>{
    const a=attrs.replace(/\srole="[^"]*"/g,'').replace(/\saria-haspopup="[^"]*"/g,'');
    return `<input role="combobox" aria-haspopup="listbox"${a}>`;
  });
}
function fixInlineStyles(html){
  return html
    .replace(/<g style="color:#0b3044">/g,'<g class="apg-logo-ink">')
    .replace(/<g style="color:#f6fbfa">/g,'<g class="apg-logo-ink is-dark">');
}
function delayGoogleTag(html){
  return html.replace(/<script async src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([A-Z0-9-]+)"><\/script><script>([\s\S]*?)<\/script>/,(all,id,config)=>{
    const safeId=String(id).replace(/[^A-Z0-9-]/g,'');
    return `<script>${config};(()=>{let loaded=false;const load=()=>{if(loaded)return;loaded=true;const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${safeId}';document.head.appendChild(s)};['pointerdown','keydown','touchstart'].forEach(type=>window.addEventListener(type,load,{once:true,passive:true}));if('requestIdleCallback'in window)window.addEventListener('load',()=>requestIdleCallback(load,{timeout:5000}),{once:true});else window.addEventListener('load',()=>setTimeout(load,3000),{once:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')load()},{once:true})})();</script>`;
  });
}
function removeHomeOnlyAssets(html,path){
  if(path!=='/')return html;
  return html
    .replace(/<script src="\/assets\/account-platform\.js" defer><\/script>/g,'')
    .replace(/<script src="\/assets\/amazon-associates\.js" defer><\/script>/g,'')
    .replace(/<link rel="stylesheet" href="\/assets\/account-platform\.css">/g,'');
}
function replaceCssLinks(html,path){
  const scope=path==='/my-apg/'?'account':'core';
  const linkPattern=/<link rel="stylesheet" href="\/assets\/(?:site|assistant|navigation-v8|institutional-v9|mobile-search-layer-fix|account-platform|footer-v11)\.css">/g;
  const out=html.replace(linkPattern,'');
  const href=`${OPTIMISED_CSS}?scope=${scope}&v=${encodeURIComponent(BUILD_ID)}`;
  return out.replace('</head>',`<link rel="stylesheet" href="${href}"></head>`);
}
function optimiseAppJs(body){
  return String(body||'')
    .replace("'<div class=\"suggest-group\"><span class=\"suggest-label\">'","'<div role=\"group\" class=\"suggest-group\"><span class=\"suggest-label\">'");
}
function transformHtml(body,path){
  let out=String(body||'');
  out=removeHomeOnlyAssets(out,path);
  out=fixSearchAria(out);
  out=fixInlineStyles(out);
  out=delayGoogleTag(out);
  out=replaceCssLinks(out,path);
  out=versionLocalAssets(out);
  return out;
}

module.exports=(req,res)=>{
  let parsed;
  try{parsed=new URL(req.url,PRIMARY_ORIGIN);}catch{parsed=new URL('/',PRIMARY_ORIGIN);}
  const path=parsed.pathname;
  if(path===OPTIMISED_CSS){
    const scope=parsed.searchParams.get('scope')==='account'?'account':'core';
    return sendCss(req,res,scope);
  }

  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Resource-Policy','same-site');
  res.setHeader('Origin-Agent-Cluster','?1');

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html'))body=transformHtml(body,path);
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/app.js')body=optimiseAppJs(body);
    if(path.startsWith('/assets/')&&parsed.searchParams.get('v')===BUILD_ID)res.setHeader('Cache-Control','public, max-age=31536000, immutable');
    return originalEnd(body,...args);
  };
  return app(req,res);
};

module.exports.cssBundle=cssBundle;
