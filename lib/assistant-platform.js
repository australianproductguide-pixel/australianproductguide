const googlePlatform=require('./google-platform');

const PRIMARY_HOST='australianproductguide.au';

const assistantCss=`
/* APG Shopping Assistant — lightweight, evidence-backed conversational guidance */
.apg-assistant-launcher{position:fixed;right:22px;bottom:22px;z-index:85;display:flex;align-items:center;gap:10px;border:1px solid rgba(9,43,61,.14);background:var(--v7-ink,#092b3d);color:#fff;border-radius:999px;padding:10px 15px 10px 10px;box-shadow:0 16px 42px rgba(9,43,61,.22);cursor:pointer;font:inherit;transition:transform .18s ease,box-shadow .18s ease}
.apg-assistant-launcher:hover{transform:translateY(-2px);box-shadow:0 20px 48px rgba(9,43,61,.28)}
.apg-assistant-launcher:focus-visible,.apg-assistant-panel button:focus-visible,.apg-assistant-panel input:focus-visible,.apg-assistant-panel a:focus-visible{outline:3px solid rgba(244,180,95,.92);outline-offset:3px}
.apg-assistant-launcher-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--v7-signal,#f4b45f);color:var(--v7-ink,#092b3d);font-weight:900;letter-spacing:-.04em}
.apg-assistant-launcher-copy{display:flex;flex-direction:column;text-align:left;line-height:1.15}.apg-assistant-launcher-copy strong{font-size:14px}.apg-assistant-launcher-copy small{font-size:11px;opacity:.78;margin-top:2px}
.apg-assistant-panel[hidden]{display:none!important}.apg-assistant-panel{position:fixed;right:22px;bottom:84px;z-index:86;width:min(420px,calc(100vw - 28px));max-height:min(720px,calc(100vh - 112px));display:flex;flex-direction:column;background:#fff;border:1px solid var(--v7-line,#d9e4e2);border-radius:24px;box-shadow:0 24px 70px rgba(9,43,61,.22);overflow:hidden;color:var(--v7-text,#142d37)}
.apg-assistant-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 17px;background:linear-gradient(135deg,var(--v7-ink,#092b3d),var(--v7-ink-2,#123f50));color:#fff}
.apg-assistant-brand{display:flex;align-items:center;gap:10px;min-width:0}.apg-assistant-avatar{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--v7-signal,#f4b45f);color:var(--v7-ink,#092b3d);font-size:12px;font-weight:900;letter-spacing:-.03em}.apg-assistant-brand strong{display:block;font-size:15px}.apg-assistant-brand small{display:block;font-size:11px;opacity:.72;margin-top:2px}
.apg-assistant-close{width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;cursor:pointer}
.apg-assistant-body{padding:16px;overflow:auto;overscroll-behavior:contain;background:linear-gradient(#fbfcfb,#fff);min-height:330px}
.apg-assistant-message{display:flex;margin:0 0 10px}.apg-assistant-message.is-user{justify-content:flex-end}.apg-assistant-bubble{max-width:88%;padding:11px 13px;border-radius:16px;font-size:14px;line-height:1.45;background:var(--v7-mint,#e7f5f1);color:var(--v7-ink,#092b3d)}.apg-assistant-message.is-user .apg-assistant-bubble{background:var(--v7-ink,#092b3d);color:#fff;border-bottom-right-radius:5px}.apg-assistant-message.is-bot .apg-assistant-bubble{border-bottom-left-radius:5px}
.apg-assistant-options{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}.apg-assistant-option{border:1px solid var(--v7-line-strong,#bdd2ce);background:#fff;color:var(--v7-ink,#092b3d);border-radius:999px;padding:9px 11px;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.apg-assistant-option:hover{border-color:var(--v7-teal,#08786f);background:var(--v7-mint,#e7f5f1)}
.apg-assistant-search{margin:11px 0 2px}.apg-assistant-search label{display:block;font-size:11px;font-weight:800;color:var(--v7-muted,#60747b);margin-bottom:6px}.apg-assistant-search input{width:100%;box-sizing:border-box;border:1px solid var(--v7-line,#d9e4e2);border-radius:14px;padding:11px 12px;font:inherit;font-size:14px;color:var(--v7-text,#142d37);background:#fff}.apg-assistant-search-results{display:grid;gap:6px;margin-top:8px}.apg-assistant-search-results button{width:100%;text-align:left;border:1px solid var(--v7-line,#d9e4e2);border-radius:12px;background:#fff;padding:9px 10px;font:inherit;font-size:12px;font-weight:700;color:var(--v7-ink,#092b3d);cursor:pointer}
.apg-assistant-result-list{display:grid;gap:10px;margin-top:12px}.apg-assistant-result{border:1px solid var(--v7-line,#d9e4e2);border-radius:16px;padding:12px;background:#fff;box-shadow:0 5px 16px rgba(9,43,61,.05)}.apg-assistant-result-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.apg-assistant-result h4{margin:2px 0 4px;font-size:14px;color:var(--v7-ink,#092b3d);line-height:1.25}.apg-assistant-result-brand{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:var(--v7-muted,#60747b)}.apg-assistant-match{white-space:nowrap;border-radius:999px;padding:5px 7px;background:var(--v7-mint,#e7f5f1);color:var(--v7-teal,#08786f);font-size:10px;font-weight:900}.apg-assistant-result ul{margin:8px 0 7px;padding-left:17px;color:var(--v7-text,#142d37);font-size:11.5px;line-height:1.45}.apg-assistant-result-gap{margin:7px 0 0;font-size:10.5px;color:var(--v7-muted,#60747b)}.apg-assistant-result a{display:inline-flex;margin-top:5px;color:var(--v7-teal,#08786f);font-weight:850;font-size:12px;text-decoration:none}
.apg-assistant-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.apg-assistant-action{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;padding:9px 11px;font-size:11.5px;font-weight:850;text-decoration:none;border:1px solid var(--v7-line-strong,#bdd2ce);background:#fff;color:var(--v7-ink,#092b3d);cursor:pointer;font-family:inherit}.apg-assistant-action.primary{background:var(--v7-teal,#08786f);border-color:var(--v7-teal,#08786f);color:#fff}
.apg-assistant-status{font-size:12px;color:var(--v7-muted,#60747b);padding:8px 0}.apg-assistant-note{margin:11px 0 0;font-size:10.5px;line-height:1.45;color:var(--v7-muted,#60747b)}
.apg-assistant-foot{padding:10px 15px;border-top:1px solid var(--v7-line,#d9e4e2);background:#fff;color:var(--v7-muted,#60747b);font-size:10px;line-height:1.4}.apg-assistant-foot strong{color:var(--v7-ink,#092b3d)}
@media(max-width:640px){.apg-assistant-launcher{right:12px;bottom:12px}.apg-assistant-launcher-copy small{display:none}.apg-assistant-panel{right:8px;bottom:72px;width:calc(100vw - 16px);max-height:calc(100vh - 86px);border-radius:22px}.apg-assistant-body{min-height:300px;padding:14px}.apg-assistant-bubble{max-width:92%}}
@media(prefers-reduced-motion:reduce){.apg-assistant-launcher{transition:none}}
`;

const assistantHtml=`<button type="button" id="apgAssistantLauncher" class="apg-assistant-launcher" aria-expanded="false" aria-controls="apgAssistantPanel"><span class="apg-assistant-launcher-icon" aria-hidden="true">APG</span><span class="apg-assistant-launcher-copy"><strong>Ask APG</strong><small>Find a better fit</small></span></button><section id="apgAssistantPanel" class="apg-assistant-panel" role="dialog" aria-label="APG Shopping Assistant" hidden><header class="apg-assistant-head"><div class="apg-assistant-brand"><span class="apg-assistant-avatar" aria-hidden="true">APG</span><span><strong>Shopping Assistant</strong><small>Evidence-backed product matching</small></span></div><button type="button" class="apg-assistant-close" data-apg-assistant-close aria-label="Close shopping assistant">×</button></header><div id="apgAssistantBody" class="apg-assistant-body" aria-live="polite"></div><footer class="apg-assistant-foot"><strong>How it works:</strong> matches come from maintained APG product data and your selected needs. Affiliate relationships contribute zero recommendation points.</footer></section>`;

const assistantClientJs=`(()=>{
const launcher=document.getElementById('apgAssistantLauncher');
const panel=document.getElementById('apgAssistantPanel');
const body=document.getElementById('apgAssistantBody');
if(!launcher||!panel||!body)return;
const quick=[
 {slug:'coffee-machines',label:'Coffee machines'},
 {slug:'air-fryers',label:'Air fryers'},
 {slug:'robot-vacuums',label:'Robot vacuums'},
 {slug:'wireless-headphones',label:'Wireless headphones'},
 {slug:'home-security-cameras',label:'Security cameras'},
 {slug:'stick-vacuums',label:'Stick vacuums'}
];
const priorities={
 'coffee-machines':[{id:'easy',label:'Easy to use',query:'easy simple beginner'},{id:'milk',label:'Milk drinks',query:'milk latte flat white cappuccino'},{id:'compact',label:'Compact',query:'compact small kitchen'},{id:'value',label:'Best value',query:'value budget affordable'}],
 'air-fryers':[{id:'value',label:'Best value',query:'value budget affordable'},{id:'dual',label:'Dual-zone cooking',query:'dual zone two basket'},{id:'versatile',label:'Versatility',query:'versatile multi function grill steam'},{id:'large',label:'Larger batches',query:'large batch family'}],
 'robot-vacuums':[{id:'pets',label:'Pet hair',query:'pets pet hair'},{id:'mopping',label:'Vacuum + mop',query:'mopping vacuum and mop'},{id:'easy',label:'Low maintenance',query:'low maintenance automatic dock hands off cleaning'},{id:'obstacle',label:'Navigation',query:'obstacle avoidance navigation'}],
 'wireless-headphones':[{id:'anc',label:'Noise cancelling',query:'anc noise cancellation'},{id:'battery',label:'Battery life',query:'battery long battery'},{id:'travel',label:'Travel',query:'travel commute'},{id:'value',label:'Best value',query:'value budget affordable'}],
 'home-security-cameras':[{id:'local',label:'Local storage',query:'local storage microsd no subscription'},{id:'free',label:'No subscription',query:'subscription free no subscription'},{id:'outdoor',label:'Outdoor use',query:'outdoor weatherproof'},{id:'value',label:'Best value',query:'value budget affordable'}],
 'stick-vacuums':[{id:'pets',label:'Pet hair',query:'pets pet hair'},{id:'battery',label:'Battery life',query:'battery long battery'},{id:'light',label:'Lightweight',query:'lightweight easy to carry'},{id:'value',label:'Best value',query:'value budget affordable'}],
 'mesh-wifi-systems':[{id:'wifi7',label:'Wi‑Fi 7',query:'wifi 7'},{id:'ethernet',label:'Wired backhaul',query:'ethernet wired backhaul'},{id:'value',label:'Best value',query:'value budget affordable'},{id:'premium',label:'Premium',query:'premium high end'}],
 'earbuds':[{id:'anc',label:'Noise cancelling',query:'anc noise cancellation'},{id:'battery',label:'Battery life',query:'battery long battery'},{id:'travel',label:'Travel',query:'travel commute'},{id:'value',label:'Best value',query:'value budget affordable'}],
 'office-chairs':[{id:'ergonomic',label:'Ergonomics',query:'ergonomic ergonomics'},{id:'lumbar',label:'Back support',query:'lumbar back support'},{id:'value',label:'Best value',query:'value budget affordable'},{id:'premium',label:'Premium',query:'premium high end'}],
 'air-purifiers':[{id:'hepa',label:'Allergies / HEPA',query:'hepa allergies pollen'},{id:'quiet',label:'Quiet running',query:'quiet low noise'},{id:'smart',label:'Smart controls',query:'smart app control'},{id:'value',label:'Best value',query:'value budget affordable'}]
};
const generic=[{id:'value',label:'Best value',query:'value budget affordable'},{id:'easy',label:'Easy to live with',query:'easy simple beginner'},{id:'compact',label:'Compact',query:'compact small space'},{id:'premium',label:'Premium',query:'premium high end'}];
const budgets=[{value:'250',label:'Under A$250'},{value:'500',label:'Under A$500'},{value:'1000',label:'Under A$1,000'},{value:'2000',label:'Under A$2,000'},{value:'',label:'No set budget'}];
const state={step:'category',category:null,budget:'',priority:null,messages:[],categories:[]};
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function push(who,text){state.messages.push({who,text});}
function messagesHtml(){return state.messages.map(m=>'<div class="apg-assistant-message '+(m.who==='user'?'is-user':'is-bot')+'"><div class="apg-assistant-bubble">'+esc(m.text)+'</div></div>').join('');}
function buttons(items,attr){return '<div class="apg-assistant-options">'+items.map(x=>'<button type="button" class="apg-assistant-option" '+attr+'="'+esc(x.slug||x.value||x.id)+'">'+esc(x.label)+'</button>').join('')+'</div>';}
function scrollEnd(){requestAnimationFrame(()=>{body.scrollTop=body.scrollHeight;});}
function reset(){state.step='category';state.category=null;state.budget='';state.priority=null;state.messages=[];push('bot','Hi — I can narrow down what to buy using APG’s maintained product data. What are you shopping for?');render();loadCategories();}
function render(){let html=messagesHtml();
 if(state.step==='category'){
   html+=buttons(quick,'data-apg-assistant-cat');
   html+='<div class="apg-assistant-search"><label for="apgAssistantCategorySearch">Or search APG categories</label><input id="apgAssistantCategorySearch" type="search" autocomplete="off" placeholder="e.g. office chairs, air purifiers"><div id="apgAssistantCategoryResults" class="apg-assistant-search-results"></div></div>';
 }else if(state.step==='budget')html+=buttons(budgets,'data-apg-assistant-budget');
 else if(state.step==='priority')html+=buttons(priorities[state.category.slug]||generic,'data-apg-assistant-priority');
 else if(state.step==='loading')html+='<div class="apg-assistant-status">Matching your needs against the maintained APG catalogue…</div>';
 body.innerHTML=html;scrollEnd();
 const search=document.getElementById('apgAssistantCategorySearch');if(search)search.addEventListener('input',()=>renderCategorySearch(search.value));
}
function loadCategories(){if(state.categories.length)return;fetch('/assets/search-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():[]).then(items=>{state.categories=items.filter(x=>x.type==='category').map(x=>({slug:(x.url||'').split('/').filter(Boolean).pop()||'',label:x.label})).filter(x=>x.slug&&x.label);}).catch(()=>{});}
function renderCategorySearch(value){const target=document.getElementById('apgAssistantCategoryResults');if(!target)return;const n=String(value||'').toLowerCase().trim();if(n.length<2){target.innerHTML='';return;}const hits=state.categories.filter(x=>x.label.toLowerCase().includes(n)||x.slug.replace(/-/g,' ').includes(n)).slice(0,6);target.innerHTML=hits.map(x=>'<button type="button" data-apg-assistant-cat="'+esc(x.slug)+'" data-apg-cat-label="'+esc(x.label)+'">'+esc(x.label)+'</button>').join('')||'<span class="apg-assistant-note">No category match yet. Try a broader product type.</span>';}
function selectCategory(slug,label){const found=state.categories.find(x=>x.slug===slug)||quick.find(x=>x.slug===slug)||{slug,label:label||slug.replace(/-/g,' ')};state.category=found;push('user',found.label);push('bot','What budget ceiling should I work with?');state.step='budget';render();}
function selectBudget(value,label){state.budget=value;push('user',label);push('bot','And what matters most for this purchase?');state.step='priority';render();}
function selectPriority(id){const list=priorities[state.category.slug]||generic;const p=list.find(x=>x.id===id)||generic[0];state.priority=p;push('user',p.label);push('bot','Got it. I’ll show suggested matches and the reasons behind them.');state.step='loading';render();runDecision();}
function runDecision(){const params=new URLSearchParams();params.set('category',state.category.slug);if(state.budget)params.set('budget',state.budget);if(state.priority&&state.priority.query)params.set('q',state.category.label+' '+state.priority.query);fetch('/api/decision?'+params.toString(),{headers:{Accept:'application/json'},cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('decision');return r.json();}).then(showResults).catch(showError);}
function showResults(data){const results=Array.isArray(data.results)?data.results.slice(0,3):[];let html=messagesHtml();if(!results.length){html+='<div class="apg-assistant-message is-bot"><div class="apg-assistant-bubble">I could not form a reliable shortlist from those choices yet.</div></div>';html+=fallbackActions();body.innerHTML=html;scrollEnd();return;}
 html+='<div class="apg-assistant-result-list">'+results.map(r=>'<article class="apg-assistant-result"><div class="apg-assistant-result-top"><div><div class="apg-assistant-result-brand">'+esc(r.brand)+'</div><h4>'+esc(r.name)+'</h4></div><span class="apg-assistant-match">'+esc(r.match)+'</span></div>'+(r.reasons&&r.reasons.length?'<ul>'+r.reasons.slice(0,2).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+(r.gaps&&r.gaps.length?'<p class="apg-assistant-result-gap"><strong>Watch:</strong> '+esc(r.gaps[0])+'</p>':'')+'<a href="'+esc(r.url)+'">View product →</a></article>').join('')+'</div>';
 const slugs=results.map(r=>r.slug).slice(0,2);const q=encodeURIComponent(state.category.label+' '+(state.priority?state.priority.query:''));html+='<div class="apg-assistant-actions">'+(slugs.length>1?'<a class="apg-assistant-action primary" href="/compare/custom/?products='+slugs.join(',')+'">Compare top 2</a>':'')+'<a class="apg-assistant-action" href="/categories/'+esc(state.category.slug)+'/finder/">Open full finder</a><a class="apg-assistant-action" href="/decision-lab/?category='+esc(state.category.slug)+(state.budget?'&budget='+encodeURIComponent(state.budget):'')+'&q='+q+'">Refine in Decision Lab</a><button type="button" class="apg-assistant-action" data-apg-assistant-restart>Start over</button></div><p class="apg-assistant-note">These are fit suggestions from maintained APG evidence and stated preferences — not hands-on test scores. Check retailer price and availability before buying.</p>';
 body.innerHTML=html;scrollEnd();}
function fallbackActions(){return '<div class="apg-assistant-actions"><a class="apg-assistant-action primary" href="/categories/'+esc(state.category.slug)+'/finder/">Open category finder</a><button type="button" class="apg-assistant-action" data-apg-assistant-restart>Start over</button></div>';}
function showError(){let html=messagesHtml()+'<div class="apg-assistant-message is-bot"><div class="apg-assistant-bubble">The matching service is temporarily unavailable, but the category finder is still ready.</div></div>'+fallbackActions();body.innerHTML=html;scrollEnd();}
function setOpen(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open){if(!state.messages.length)reset();setTimeout(()=>panel.querySelector('[data-apg-assistant-close]')?.focus(),0);}else launcher.focus();}
launcher.addEventListener('click',()=>setOpen(panel.hidden));
panel.addEventListener('click',e=>{const close=e.target.closest('[data-apg-assistant-close]');if(close){setOpen(false);return;}const restart=e.target.closest('[data-apg-assistant-restart]');if(restart){reset();return;}const cat=e.target.closest('[data-apg-assistant-cat]');if(cat){selectCategory(cat.getAttribute('data-apg-assistant-cat'),cat.getAttribute('data-apg-cat-label'));return;}const budget=e.target.closest('[data-apg-assistant-budget]');if(budget){selectBudget(budget.getAttribute('data-apg-assistant-budget'),budget.textContent.trim());return;}const priority=e.target.closest('[data-apg-assistant-priority]');if(priority){selectPriority(priority.getAttribute('data-apg-assistant-priority'));return;}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)setOpen(false);});
})();`;

function host(req){return String(req.headers['x-forwarded-host']||req.headers.host||'').toLowerCase().split(':')[0];}
function sendAsset(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);}
function injectAssistant(body){
  if(body.includes('id="apgAssistantLauncher"'))return body;
  if(body.includes('</head>'))body=body.replace('</head>','<link rel="stylesheet" href="/assets/assistant.css"></head>');
  if(body.includes('</body>'))body=body.replace('</body>',assistantHtml+'<script src="/assets/assistant.js" defer></script></body>');
  return body;
}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,'https://'+PRIMARY_HOST).pathname;}catch{}
  const h=host(req);
  const canonicalRedirect=process.env.VERCEL_ENV==='production'&&(h.endsWith('.vercel.app')||h==='www.'+PRIMARY_HOST);
  if(!canonicalRedirect&&path==='/assets/assistant.css')return sendAsset(req,res,'text/css; charset=utf-8',assistantCss);
  if(!canonicalRedirect&&path==='/assets/assistant.js')return sendAsset(req,res,'application/javascript; charset=utf-8',assistantClientJs);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&body.includes('</body>'))body=injectAssistant(body);
    return originalEnd(body,...args);
  };
  return googlePlatform(req,res);
};

module.exports.assistantCss=assistantCss;
module.exports.assistantClientJs=assistantClientJs;
