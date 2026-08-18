// APG Brand Fidelity v32.4 final mobile-menu reconciliation.
// Manual review of the exact Production matrix found that later client behaviour
// could visually duplicate Decision Lab and displace Ask Scout in the mobile menu.
// This presentation-only layer restores one Decision Lab primary action followed
// by one clearly differentiated Ask Scout action, then the existing menu sections.
const upstream=require('./brand-fidelity-v323');
const v29=require('./amazon-conversion-v29');
const v32=require('./brand-fidelity-v32');

const VERSION='32.4';
const CSS_PATH='/assets/brand-fidelity-v324.css';
const JS_PATH='/assets/brand-fidelity-v324.js';

const css=`
/* Brand Fidelity v32.4 — intentional mobile decision-tool hierarchy. */
@media(max-width:920px){
  body[data-brand-fidelity-v324="true"] #mobileNav .apg-v324-decision-mobile{
    background:linear-gradient(135deg,#172554,#2563EB)!important;
    border:1px solid #2563EB!important;
    color:#FFFFFF!important;
  }
  body[data-brand-fidelity-v324="true"] #mobileNav .apg-v324-scout-mobile{
    background:#EFF6FF!important;
    border:1px solid #BFDBFE!important;
    color:#1D4ED8!important;
  }
  body[data-brand-fidelity-v324="true"] #mobileNav .apg-v324-scout-mobile:hover,
  body[data-brand-fidelity-v324="true"] #mobileNav .apg-v324-scout-mobile:focus-visible{
    background:#DBEAFE!important;
    border-color:#93C5FD!important;
    color:#1E40AF!important;
  }
}
`;

const clientJs=`(()=>{
  let applying=false;
  const label=(el,text)=>{
    if(!el)return;
    const expected=text+' →';
    if(el.textContent.replace(/\\s+/g,' ').trim()!==expected){
      el.innerHTML=text+' <span aria-hidden="true">→</span>';
    }
  };
  const reconcile=()=>{
    if(applying)return;
    const nav=document.getElementById('mobileNav');
    const inner=nav&&nav.querySelector('.mobile-nav-inner');
    if(!inner)return;
    applying=true;
    try{
      const decision=[...inner.querySelectorAll('a[href="/decision-lab/"]')].find(el=>el.classList.contains('mobile-power'))||inner.querySelector('a[href="/decision-lab/"]');
      const scout=inner.querySelector('[data-v26-scout-mobile],[data-v26-scout-open].mobile-power');
      if(decision){
        decision.classList.add('mobile-power','apg-v324-decision-mobile');
        label(decision,'Decision Lab');
      }
      if(scout){
        scout.classList.add('mobile-power','apg-v324-scout-mobile');
        label(scout,'Ask Scout');
        if(decision&&decision.nextElementSibling!==scout)decision.insertAdjacentElement('afterend',scout);
      }
      [...inner.querySelectorAll('.mobile-power')].forEach(el=>{
        if(el!==decision&&el!==scout&&el.textContent.replace(/\\s+/g,' ').trim().startsWith('Decision Lab'))el.remove();
      });
      inner.dataset.apgV324Menu='true';
    }finally{applying=false;}
  };
  const boot=()=>{
    reconcile();
    const nav=document.getElementById('mobileNav');
    if(nav)new MutationObserver(reconcile).observe(nav,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',reconcile,{passive:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

function inject(html){
  let out=String(html||'');
  if(out.includes('data-brand-fidelity-v324="true"'))return out;
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-fidelity-v324="true"$1>');
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
Object.assign(handler,v29,v32,upstream,{VERSION,CSS_PATH,JS_PATH,css,clientJs,inject,transform});
module.exports=handler;
