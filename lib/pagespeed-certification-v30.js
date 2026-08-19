// APG PageSpeed Certification v30, reconciled onto Interaction Reliability v37.
// Narrow final-response layer: no product, retailer, ranking or journey logic changes.
const app=require('./interaction-reliability-v37');

const ORIGIN='https://australianproductguide.au';
const BUILD_ID=String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.VERCEL_GIT_COMMIT_REF||'dev').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,16)||'dev';
const FINAL_CSS_PATH='/assets/pagespeed-certification-v30.css';
const FINAL_CSS=`
/* PageSpeed Certification v30 - scoped contrast hardening. */
body[data-institutional-v9=true] .apg-account-nudge-note{color:#52636b!important}
body[data-institutional-v9=true] .apg-v12-copy>span{color:#465f69!important}
body[data-institutional-v9=true] .apg-v12-art small{color:#173746!important}
body[data-institutional-v9=true] .apg-national-v10 .apg-national-intro{color:#465f69!important}
body[data-institutional-v9=true] .apg-national-v10 .apg-national-card p{color:#465f69!important}
body[data-institutional-v9=true] .apg-national-v10 .apg-national-card span,
body[data-institutional-v9=true] .apg-national-v10 .apg-national-card b{color:#06645f!important}
body[data-institutional-v9=true] .apg-commerce-disclosure{color:#52636b!important}
body[data-institutional-v9=true] .apg-proof-kicker-v20{color:#173746!important}
body[data-institutional-v9=true] .apg-proof-trust-v20{color:#294c57!important}
`;

// Secondary homepage styles keep their source order, preload promptly, then apply without
// blocking first paint. The shell, privacy, core consumer layout and base brand layers stay blocking.
const HOME_NONBLOCKING_CSS=new Set([
  '/assets/national-experience.css','/assets/semantic-v13.css','/assets/platform-integrity-v15.css',
  '/assets/decision-intelligence-v4.css','/assets/mobile-history-ux-v16.css','/assets/homepage-decision-badge-v18.css',
  '/assets/site-surface-polish-v22.css','/assets/platform-cohesion-v26.css','/assets/evidence-commerce-depth-v27.css',
  '/assets/amazon-conversion-v29.css','/assets/premium-theme-v311.css','/assets/brand-fidelity-v321.css',
  '/assets/brand-fidelity-v322.css','/assets/brand-fidelity-v323.css','/assets/brand-fidelity-v324.css',
  '/assets/brand-fidelity-v325.css','/assets/brand-conformity-v34.css','/assets/brand-conformity-v35.css',
  '/assets/brand-conformity-v351.css','/assets/ux-remediation-v36.css','/assets/brand-conformity-v352.css',
  '/assets/scout-concierge-v5.css'
]);

// Non-core visual/commerce scripts wait for genuine user intent or a late idle slot. Search,
// privacy, navigation, Scout session guard and v37 reliability remain eager.
const HOME_IDLE_JS=new Set([
  '/assets/platform-integrity-v15.js','/assets/mobile-history-ux-v16.js','/assets/evidence-commerce-depth-v27.js',
  '/assets/trust-infrastructure-v28.js','/assets/amazon-conversion-v29.js','/assets/brand-fidelity-v322.js',
  '/assets/brand-fidelity-v324.js','/assets/brand-fidelity-v325.js','/assets/brand-conformity-v34.js'
]);

function pathOf(raw){try{return new URL(raw,ORIGIN).pathname}catch{return String(raw||'').split('?')[0]}}
function escAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}

function makeCssNonBlocking(html){
  return html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(full,href)=>{
    if(!HOME_NONBLOCKING_CSS.has(pathOf(href)))return full;
    const safe=escAttr(href);
    return `<link rel="preload" as="style" href="${safe}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${safe}"></noscript>`;
  });
}
function idleScriptLoader(urls){
  if(!urls.length)return '';
  const list=JSON.stringify(urls).replace(/</g,'\\u003c');
  return `<script>(()=>{const q=${list};let done=false;const load=()=>{if(done)return;done=true;q.forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)})};['pointerdown','keydown','touchstart','focusin'].forEach(t=>addEventListener(t,load,{once:true,passive:true}));addEventListener('load',()=>{if('requestIdleCallback'in window)requestIdleCallback(load,{timeout:9000});else setTimeout(load,9000)},{once:true})})();</script>`;
}
function deferSecondaryHomeJs(html){
  const urls=[];
  let out=html.replace(/<script src="([^"]+)" defer><\/script>/g,(full,src)=>{
    if(!HOME_IDLE_JS.has(pathOf(src)))return full;
    urls.push(src);return '';
  });
  return urls.length&&out.includes('</body>')?out.replace('</body>',idleScriptLoader(urls)+'</body>'):out;
}

function stripTags(v){return String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&[a-z]+;|&#\d+;/gi,' ').replace(/\s+/g,' ').trim()}
function labelServerButtons(html){
  return html.replace(/<button([^>]*)>([\s\S]*?)<\/button>/gi,(full,attrs,inner)=>{
    if(/\saria-label\s*=|\saria-labelledby\s*=/i.test(attrs)||stripTags(inner))return full;
    const hint=String(attrs).toLowerCase();let label='Interactive control';
    if(hint.includes('close')||hint.includes('dismiss'))label='Close';
    else if(hint.includes('menu')||hint.includes('toggle'))label='Open navigation menu';
    else if(hint.includes('clear'))label='Clear selection';else if(hint.includes('remove'))label='Remove item';
    else if(hint.includes('prev'))label='Previous';else if(hint.includes('next'))label='Next';
    else if(hint.includes('compare'))label='Compare';else if(hint.includes('assistant')||hint.includes('scout'))label='Open Scout';
    return `<button aria-label="${label}"${attrs}>${inner}</button>`;
  });
}
function fixGenericAriaLabels(html){
  return html.replace(/<div(?![^>]*\brole=)([^>]*\baria-label="[^"]+"[^>]*)>/gi,'<div role="group"$1>');
}
function injectFinalCss(html){
  if(html.includes(FINAL_CSS_PATH))return html;
  const href=`${FINAL_CSS_PATH}?v=${encodeURIComponent(BUILD_ID)}`;
  return html.replace('</head>',`<link rel="preload" as="style" href="${href}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript></head>`);
}

const DYNAMIC_BUTTON_GUARD=`
;(()=>{const text=n=>String(n?.textContent||'').replace(/\\s+/g,' ').trim();const label=b=>{if(!b||b.nodeType!==1||b.tagName!=='BUTTON')return;if(b.hasAttribute('aria-label')||b.hasAttribute('aria-labelledby')||text(b))return;const h=((b.id||'')+' '+(b.className||'')+' '+[...b.attributes].map(a=>a.name+' '+a.value).join(' ')).toLowerCase();let v='Interactive control';if(/close|dismiss/.test(h))v='Close';else if(/menu|toggle/.test(h))v='Open navigation menu';else if(/clear/.test(h))v='Clear selection';else if(/remove/.test(h))v='Remove item';else if(/prev/.test(h))v='Previous';else if(/next/.test(h))v='Next';else if(/compare/.test(h))v='Compare';else if(/assistant|scout/.test(h))v='Open Scout';b.setAttribute('aria-label',v)};const scan=r=>{if(r?.tagName==='BUTTON')label(r);r?.querySelectorAll?.('button').forEach(label)};scan(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.documentElement,{subtree:true,childList:true})})();`;

function transformHtml(html,path){
  let out=String(html||'');out=labelServerButtons(out);out=fixGenericAriaLabels(out);
  if(path==='/'){out=makeCssNonBlocking(out);out=deferSecondaryHomeJs(out)}
  out=injectFinalCss(out);return out;
}
function sendFinalCss(req,res){
  res.statusCode=200;res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':FINAL_CSS);
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===FINAL_CSS_PATH)return sendFinalCss(req,res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=transformHtml(body,path);if(next!==body){body=next;res.removeHeader('Content-Length')}
    }
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/privacy-experience.js'){
      body+=DYNAMIC_BUTTON_GUARD;res.removeHeader('Content-Length');
    }
    return end(body,...args);
  };
  return app(req,res);
}
Object.assign(handler,app,{transformHtml,FINAL_CSS_PATH});
module.exports=handler;
