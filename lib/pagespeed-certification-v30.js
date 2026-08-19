// APG PageSpeed Certification v30, reconciled onto Interaction Reliability v37.
// This is a narrow final-response layer: no product, retailer, ranking or journey logic changes.
const app=require('./interaction-reliability-v37');

const ORIGIN='https://australianproductguide.au';
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
`;

// Secondary homepage styles retain their source order but no longer block first paint.
// Critical shell, privacy, navigation, mobile-account and primary illustrative CSS stay blocking.
const HOME_NONBLOCKING_CSS=new Set([
  '/assets/national-experience.css',
  '/assets/semantic-v13.css',
  '/assets/platform-integrity-v15.css',
  '/assets/decision-intelligence-v4.css',
  '/assets/mobile-history-ux-v16.css',
  '/assets/homepage-decision-badge-v18.css',
  '/assets/site-surface-polish-v22.css',
  '/assets/platform-cohesion-v26.css',
  '/assets/evidence-commerce-depth-v27.css',
  '/assets/amazon-conversion-v29.css'
]);

// Secondary homepage scripts are delayed only where the SSR experience remains complete.
// v37 interaction recovery, privacy controls, navigation, search and Scout remain eager.
const HOME_IDLE_JS=new Set([
  '/assets/platform-integrity-v15.js',
  '/assets/mobile-history-ux-v16.js',
  '/assets/evidence-commerce-depth-v27.js',
  '/assets/trust-infrastructure-v28.js',
  '/assets/amazon-conversion-v29.js'
]);

function pathOf(raw){try{return new URL(raw,ORIGIN).pathname}catch{return String(raw||'').split('?')[0]}}
function escAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}

function makeCssNonBlocking(html){
  return html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(full,href)=>{
    if(!HOME_NONBLOCKING_CSS.has(pathOf(href)))return full;
    const safe=escAttr(href);
    return `<link rel="stylesheet" href="${safe}" media="print" onload="this.media='all';this.onload=null"><noscript><link rel="stylesheet" href="${safe}"></noscript>`;
  });
}

function idleScriptLoader(urls){
  if(!urls.length)return '';
  const list=JSON.stringify(urls).replace(/</g,'\\u003c');
  return `<script>(()=>{const q=${list};let done=false;const load=()=>{if(done)return;done=true;q.forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)})};['pointerover','focusin','touchstart'].forEach(t=>addEventListener(t,load,{once:true,passive:true}));addEventListener('load',()=>setTimeout(load,4500),{once:true})})();</script>`;
}
function deferSecondaryHomeJs(html){
  const urls=[];
  let out=html.replace(/<script src="([^"]+)" defer><\/script>/g,(full,src)=>{
    if(!HOME_IDLE_JS.has(pathOf(src)))return full;
    urls.push(src);
    return '';
  });
  if(urls.length&&out.includes('</body>'))out=out.replace('</body>',idleScriptLoader(urls)+'</body>');
  return out;
}

function stripTags(v){return String(v||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&[a-z]+;|&#\d+;/gi,' ').replace(/\s+/g,' ').trim()}
function labelServerButtons(html){
  return html.replace(/<button([^>]*)>([\s\S]*?)<\/button>/gi,(full,attrs,inner)=>{
    if(/\saria-label\s*=|\saria-labelledby\s*=/i.test(attrs)||stripTags(inner))return full;
    const hint=String(attrs).toLowerCase();
    let label='Interactive control';
    if(hint.includes('close')||hint.includes('dismiss'))label='Close';
    else if(hint.includes('menu')||hint.includes('toggle'))label='Open navigation menu';
    else if(hint.includes('clear'))label='Clear selection';
    else if(hint.includes('remove'))label='Remove item';
    else if(hint.includes('prev'))label='Previous';
    else if(hint.includes('next'))label='Next';
    else if(hint.includes('compare'))label='Compare';
    else if(hint.includes('assistant')||hint.includes('scout'))label='Open Scout';
    return `<button aria-label="${label}"${attrs}>${inner}</button>`;
  });
}

const DYNAMIC_BUTTON_GUARD=`
;(()=>{const text=n=>String(n?.textContent||'').replace(/\\s+/g,' ').trim();const label=b=>{if(!b||b.nodeType!==1||b.tagName!=='BUTTON')return;if(b.hasAttribute('aria-label')||b.hasAttribute('aria-labelledby')||text(b))return;const h=((b.id||'')+' '+(b.className||'')+' '+[...b.attributes].map(a=>a.name+' '+a.value).join(' ')).toLowerCase();let v='Interactive control';if(/close|dismiss/.test(h))v='Close';else if(/menu|toggle/.test(h))v='Open navigation menu';else if(/clear/.test(h))v='Clear selection';else if(/remove/.test(h))v='Remove item';else if(/prev/.test(h))v='Previous';else if(/next/.test(h))v='Next';else if(/compare/.test(h))v='Compare';else if(/assistant|scout/.test(h))v='Open Scout';b.setAttribute('aria-label',v)};const scan=r=>{if(r?.tagName==='BUTTON')label(r);r?.querySelectorAll?.('button').forEach(label)};scan(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.documentElement,{subtree:true,childList:true})})();`;

function transformHtml(html,path){
  let out=labelServerButtons(String(html||''));
  if(path==='/'){
    out=makeCssNonBlocking(out);
    out=deferSecondaryHomeJs(out);
  }
  return out;
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=transformHtml(body,path);if(next!==body){body=next;res.removeHeader('Content-Length')}
    }
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/site-optimised.css'){
      body+=FINAL_CSS;res.removeHeader('Content-Length');
    }
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/privacy-experience.js'){
      body+=DYNAMIC_BUTTON_GUARD;res.removeHeader('Content-Length');
    }
    return end(body,...args);
  };
  return app(req,res);
}

Object.assign(handler,app,{transformHtml});
module.exports=handler;
