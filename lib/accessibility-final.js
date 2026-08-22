const app=require('./pagespeed-optimiser');

const EXTRA_CSS=`
/* Final APG Lighthouse accessibility hardening */
body[data-institutional-v9=true] .apg-home-hero-note-v9{color:#465f69!important}
body[data-institutional-v9=true] .apg-home-category-v9 small{color:#465f69!important}
body[data-institutional-v9=true] .apg-home-section-head-v9 p{color:#465f69!important}
body[data-institutional-v9=true] .apg-home-decision-panel-v9 small{color:#d7e5e4!important}
body[data-institutional-v9=true] .apg-home-panel-label-v9{color:#f4c76f!important}
body[data-institutional-v9=true] .apg-home-proof-v9 span{color:#dce9e8!important}
body[data-institutional-v9=true] .v7-logo-type small{color:#566a73!important}

/* Action 1 Production accessibility control: retain a safe >4.5:1 neutral on light surfaces.
   Explicit opacity prevents presentation layers from blending these small labels below WCAG AA.
   Product selectors mirror the exact card DOM exercised by production-accessibility-v61. */
.crumbs span[aria-current="page"],
.v6-diff-card>div>small,
.decision-form-actions>span,
body[data-decision-v4=true] .decision-summary span>small,
.apg-account-consent>span>small,
.apg-account-note,
.workspace-item small,
.workspace-empty,
body[data-evidence-commerce-v27="true"] main .share-context,
body[data-evidence-commerce-v27="true"] main .product-visual>.visual-copy>small,
body[data-evidence-commerce-v27="true"] main .product-card-body>.card-meta>span,
body[data-evidence-commerce-v27="true"] main .product-card-body>.card-meta>.freshness,
body[data-evidence-commerce-v27="true"] main .product-card-body>.best-for>span,
body[data-evidence-commerce-v27="true"] main .fact-card>dt{color:#455a63!important;opacity:1!important}

/* Action 1 Compare control: on desktop/tablet the shortlist tray is moved ahead of main
   content by the app hardener and behaves as a sticky in-flow control. This prevents the
   selected-product tray from covering the next product's Compare action. Mobile retains
   the compact bottom tray because the critical touch journey does not exhibit the overlap. */
@media(min-width:761px){
  .compare-tray[data-action1-in-flow="true"]{
    position:sticky!important;
    left:auto!important;
    right:auto!important;
    top:174px!important;
    bottom:auto!important;
    transform:none!important;
    margin:10px auto!important;
    width:min(680px,calc(100% - 32px))!important;
    z-index:110!important;
  }
}
@media(min-width:761px) and (max-width:1050px){
  .compare-tray[data-action1-in-flow="true"]{top:82px!important}
}

/* National-grade mobile assistant hardening: keep the floating entry point useful without obscuring decision content. */
@media(max-width:640px){
  body[data-institutional-v9=true] .apg-assistant-launcher{
    width:52px!important;
    min-width:52px!important;
    height:52px!important;
    padding:0!important;
    border-radius:999px!important;
    right:max(12px,env(safe-area-inset-right))!important;
    bottom:max(12px,env(safe-area-inset-bottom))!important;
    justify-content:center!important;
    gap:0!important;
  }
  body[data-institutional-v9=true] .apg-assistant-launcher-copy{
    position:absolute!important;
    width:1px!important;
    height:1px!important;
    padding:0!important;
    margin:-1px!important;
    overflow:hidden!important;
    clip:rect(0,0,0,0)!important;
    white-space:nowrap!important;
    border:0!important;
  }
  body[data-institutional-v9=true] .apg-assistant-launcher-icon{margin:0!important}
  body[data-institutional-v9=true] .apg-assistant-panel{
    left:8px!important;
    right:8px!important;
    width:auto!important;
    max-width:none!important;
    bottom:calc(72px + env(safe-area-inset-bottom))!important;
    max-height:min(78vh,680px)!important;
  }
}
`;

function hardenHtml(html){
  let out=String(html||'');
  out=out.replace(/<button([^>]*class="[^"]*mobile-toggle[^"]*"[^>]*)>/g,(m,attrs)=>{
    if(/\saria-label=/.test(attrs)||/\saria-labelledby=/.test(attrs))return m;
    return `<button aria-label="Open navigation menu"${attrs}>`;
  });
  out=out.replace(/<div([^>]*data-search-suggestions[^>]*)>/g,(m,attrs)=>{
    if(/\saria-label=/.test(attrs)||/\saria-labelledby=/.test(attrs))return m;
    return `<div aria-label="Search suggestions"${attrs}>`;
  });
  return out;
}

function hardenAppJs(js){
  let out=String(js||'');
  out=out.replace("'<div role=\"group\" class=\"suggest-group\"><span class=\"suggest-label\">'","'<div role=\"presentation\" class=\"suggest-group\"><span aria-hidden=\"true\" class=\"suggest-label\">'");
  out+=`;(()=>{const labelButton=b=>{if(!b||b.nodeType!==1||b.tagName!=='BUTTON')return;if(b.getAttribute('aria-label')||b.getAttribute('aria-labelledby')||String(b.textContent||'').trim())return;const c=String(b.className||'');const id=String(b.id||'');const data=[...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+' '+a.value).join(' ');const hint=(c+' '+id+' '+data).toLowerCase();let label='Interactive control';if(hint.includes('close'))label='Close';else if(hint.includes('menu')||hint.includes('toggle'))label='Open navigation menu';else if(hint.includes('clear'))label='Clear selection';else if(hint.includes('remove'))label='Remove item';else if(hint.includes('previous')||hint.includes('prev'))label='Previous';else if(hint.includes('next'))label='Next';else if(hint.includes('compare'))label='Compare';else if(hint.includes('assistant'))label='Shopping assistant control';b.setAttribute('aria-label',label)};const scan=root=>{if(root&&root.querySelectorAll)root.querySelectorAll('button').forEach(labelButton);if(root&&root.tagName==='BUTTON')labelButton(root)};scan(document);new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(scan))).observe(document.documentElement,{childList:true,subtree:true})})();`;
  out+=`;(()=>{const tray=document.getElementById('compareTray'),main=document.getElementById('main');if(!tray||!main||matchMedia('(max-width:760px)').matches)return;tray.dataset.action1InFlow='true';main.before(tray)})();`;
  return out;
}

function hardenAccountJs(js){
  let out=String(js||'');
  out=out.replace('class="apg-account-tabs" role="tablist"','class="apg-account-tabs" role="group" aria-label="Account access mode"');
  out=out.replace(/aria-selected=/g,'aria-pressed=');
  out=out.replace(/setAttribute\('aria-selected'/g,"setAttribute('aria-pressed'");
  return out;
}

module.exports=(req,res)=>{
  let path='/';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html'))body=hardenHtml(body);
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/app.js')body=hardenAppJs(body);
    if(req.method!=='HEAD'&&typeof body==='string'&&path==='/assets/account-platform.js')body=hardenAccountJs(body);
    if(req.method!=='HEAD'&&typeof body==='string'&&(path==='/assets/site-optimised.css'||path==='/assets/product-brand-placeholder-v64.css'))body+=EXTRA_CSS;
    return originalEnd(body,...args);
  };
  return app(req,res);
};