const VERSION='5.0';

const css=String.raw`
/* Scout v5 — conversational APG concierge */
body[data-scout-v5="true"] .apg-assistant-panel{width:min(470px,calc(100vw - 28px));max-height:min(760px,calc(100dvh - 108px));border-radius:22px;box-shadow:0 24px 80px rgba(15,23,42,.24)}
body[data-scout-v5="true"] .apg-assistant-head{min-height:72px;padding:14px 15px;gap:10px}
body[data-scout-v5="true"] .apg-assistant-brand{flex:1}
body[data-scout-v5="true"] .apg-assistant-brand small{opacity:.82}
body[data-scout-v5="true"] .scout-v5-head-actions{display:flex;align-items:center;gap:6px}
body[data-scout-v5="true"] .scout-v5-new{border:1px solid rgba(255,255,255,.22);background:transparent;color:#fff;border-radius:999px;padding:7px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
body[data-scout-v5="true"] .apg-assistant-body{min-height:360px;padding:0;overflow:auto;background:#f8fafc;scrollbar-gutter:stable;overscroll-behavior:contain}
body[data-scout-v5="true"] .scout-v5-thread{padding:16px 15px 18px;display:grid;gap:11px}
body[data-scout-v5="true"] .scout-v5-row{display:flex;gap:8px;align-items:flex-start}
body[data-scout-v5="true"] .scout-v5-row.user{justify-content:flex-end}
body[data-scout-v5="true"] .scout-v5-mini{width:25px;height:25px;flex:0 0 25px;border-radius:9px;overflow:hidden;margin-top:2px}
body[data-scout-v5="true"] .scout-v5-mini svg{display:block;width:100%;height:100%}
body[data-scout-v5="true"] .scout-v5-bubble{max-width:88%;border:1px solid #dbe4ee;border-radius:16px 16px 16px 5px;background:#fff;padding:11px 12px;color:#172033;font-size:13.5px;line-height:1.5;box-shadow:0 3px 12px rgba(15,23,42,.035)}
body[data-scout-v5="true"] .scout-v5-row.user .scout-v5-bubble{background:#0f172a;color:#fff;border-color:#0f172a;border-radius:16px 16px 5px 16px;box-shadow:none}
body[data-scout-v5="true"] .scout-v5-bubble strong{color:inherit}
body[data-scout-v5="true"] .scout-v5-kicker{display:block;margin-bottom:5px;color:#2563eb;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
body[data-scout-v5="true"] .scout-v5-welcome{font-size:15px;line-height:1.45}
body[data-scout-v5="true"] .scout-v5-suggestions{display:flex;flex-wrap:wrap;gap:7px;margin:1px 0 4px 33px}
body[data-scout-v5="true"] .scout-v5-chip{border:1px solid #cbd8ea;background:#fff;color:#1e3a5f;border-radius:999px;padding:8px 10px;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;text-align:left}
body[data-scout-v5="true"] .scout-v5-chip:hover{border-color:#2563eb;background:#eff6ff}
body[data-scout-v5="true"] .scout-v5-list{margin:7px 0 0;padding-left:18px;display:grid;gap:5px}
body[data-scout-v5="true"] .scout-v5-list li{padding-left:1px}
body[data-scout-v5="true"] .scout-v5-products{display:grid;gap:9px;margin-left:33px}
body[data-scout-v5="true"] .scout-v5-card{border:1px solid #dbe4ee;border-radius:16px;background:#fff;padding:12px;box-shadow:0 5px 17px rgba(15,23,42,.045)}
body[data-scout-v5="true"] .scout-v5-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
body[data-scout-v5="true"] .scout-v5-card-brand{display:block;font-size:9.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;color:#64748b}
body[data-scout-v5="true"] .scout-v5-card h4{margin:3px 0 2px;color:#0f172a;font-size:14px;line-height:1.28}
body[data-scout-v5="true"] .scout-v5-card-price{white-space:nowrap;font-size:10.5px;font-weight:850;color:#334155}
body[data-scout-v5="true"] .scout-v5-card-meta{margin-top:5px;color:#64748b;font-size:10px;font-weight:700}
body[data-scout-v5="true"] .scout-v5-card-copy{margin:8px 0 0;color:#334155;font-size:11.5px;line-height:1.45}
body[data-scout-v5="true"] .scout-v5-card-watch{margin:7px 0 0;padding:7px 8px;border-radius:10px;background:#f8fafc;color:#526174;font-size:10.5px;line-height:1.4}
body[data-scout-v5="true"] .scout-v5-card-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
body[data-scout-v5="true"] .scout-v5-card-actions a,body[data-scout-v5="true"] .scout-v5-card-actions button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd8ea;background:#fff;color:#1e3a5f;border-radius:10px;padding:7px 9px;font:inherit;font-size:10.5px;font-weight:850;text-decoration:none;cursor:pointer}
body[data-scout-v5="true"] .scout-v5-actions{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 2px 33px}
body[data-scout-v5="true"] .scout-v5-action{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cbd8ea;background:#fff;color:#1e3a5f;border-radius:11px;padding:8px 10px;font:inherit;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}
body[data-scout-v5="true"] .scout-v5-action.primary{background:#2563eb;border-color:#2563eb;color:#fff}
body[data-scout-v5="true"] .scout-v5-feedback{display:flex;gap:6px;margin:-3px 0 2px 33px;align-items:center;color:#718096;font-size:10px}
body[data-scout-v5="true"] .scout-v5-feedback button{border:0;background:transparent;color:#526174;font:inherit;font-size:10px;text-decoration:underline;cursor:pointer;padding:3px}
body[data-scout-v5="true"] .scout-v5-status{display:flex;align-items:center;gap:8px;margin-left:33px;color:#64748b;font-size:11px;padding:2px 0}
body[data-scout-v5="true"] .scout-v5-dot{width:7px;height:7px;border-radius:50%;background:#2563eb;animation:scoutV5Pulse 1s infinite alternate}
@keyframes scoutV5Pulse{to{opacity:.25;transform:scale(.82)}}
body[data-scout-v5="true"] .scout-v5-composer{border-top:1px solid #dbe4ee;background:#fff;padding:10px 12px 11px}
body[data-scout-v5="true"] .scout-v5-form{display:flex;align-items:center;gap:8px}
body[data-scout-v5="true"] .scout-v5-input{flex:1;min-width:0;border:1px solid #cbd5e1;border-radius:13px;padding:11px 12px;font:inherit;font-size:13px;color:#0f172a;background:#fff}
body[data-scout-v5="true"] .scout-v5-input:focus{border-color:#2563eb;outline:3px solid rgba(37,99,235,.14)}
body[data-scout-v5="true"] .scout-v5-send{width:39px;height:39px;flex:0 0 39px;border:0;border-radius:12px;background:#2563eb;color:#fff;font-size:18px;font-weight:900;cursor:pointer}
body[data-scout-v5="true"] .scout-v5-send:disabled{opacity:.5;cursor:default}
body[data-scout-v5="true"] .scout-v5-helper{margin:6px 2px 0;color:#718096;font-size:9.5px;line-height:1.35}
body[data-scout-v5="true"] .apg-assistant-foot{padding:8px 13px;font-size:9.5px;line-height:1.35;background:#fff}
body.scout-v5-open{overflow:hidden}
@media(min-width:641px){body.scout-v5-open{overflow:auto}}
@media(max-width:640px){
 body[data-scout-v5="true"] .apg-assistant-launcher{right:10px;bottom:10px}
 body[data-scout-v5="true"] .apg-assistant-panel{inset:0!important;width:100vw!important;height:100dvh!important;max-height:none!important;border-radius:0!important;border:0!important;box-shadow:none!important}
 body[data-scout-v5="true"] .apg-assistant-head{padding-top:max(12px,env(safe-area-inset-top));flex:0 0 auto}
 body[data-scout-v5="true"] .apg-assistant-body{min-height:0;flex:1 1 auto}
 body[data-scout-v5="true"] .scout-v5-thread{padding:14px 12px 16px}
 body[data-scout-v5="true"] .scout-v5-bubble{max-width:90%;font-size:13px}
 body[data-scout-v5="true"] .scout-v5-suggestions,body[data-scout-v5="true"] .scout-v5-products,body[data-scout-v5="true"] .scout-v5-actions,body[data-scout-v5="true"] .scout-v5-feedback,body[data-scout-v5="true"] .scout-v5-status{margin-left:0}
 body[data-scout-v5="true"] .scout-v5-composer{padding-bottom:max(10px,env(safe-area-inset-bottom));flex:0 0 auto}
 body[data-scout-v5="true"] .apg-assistant-foot{display:none}
}
@media(prefers-reduced-motion:reduce){body[data-scout-v5="true"] .scout-v5-dot{animation:none}}
`;

const js=String.raw`(()=>{
'use strict';
const launcher=document.getElementById('apgAssistantLauncher'),panel=document.getElementById('apgAssistantPanel'),body=document.getElementById('apgAssistantBody');
if(!launcher||!panel||!body)return;
panel.dataset.scoutV5='true';panel.setAttribute('aria-label','Scout — Australian Product Guide shopping assistant');
const brand=panel.querySelector('.apg-assistant-brand span:last-child');if(brand)brand.innerHTML='<strong>Scout</strong><small>Shopping assistant & APG guide</small>';
const launcherCopy=launcher.querySelector('.apg-assistant-launcher-copy');if(launcherCopy)launcherCopy.innerHTML='<strong>Ask Scout</strong><small>Products, comparisons & APG</small>';
const foot=panel.querySelector('.apg-assistant-foot');if(foot)foot.innerHTML='<strong>Grounded in APG.</strong> Product facts, retailer links and recommendations come from maintained Australian Product Guide data. Affiliate commission never improves ranking.';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n)>0?'A$'+Number(n).toLocaleString('en-AU'):'';
const state={ready:false,busy:false,decisionState:null,references:[],account:null,turns:0};
const STORE='apg_scout_v5_state';
try{const saved=JSON.parse(sessionStorage.getItem(STORE)||'null');if(saved&&typeof saved==='object'){state.decisionState=saved.decisionState||null;state.references=Array.isArray(saved.references)?saved.references.slice(0,5):[];}}catch{}
function persist(){try{sessionStorage.setItem(STORE,JSON.stringify({decisionState:state.decisionState,references:state.references.slice(0,5)}));}catch{}}
function clearPersisted(){state.decisionState=null;state.references=[];try{sessionStorage.removeItem(STORE);}catch{}}
function pageContext(){
 const path=location.pathname,parts=path.split('/').filter(Boolean),u=new URL(location.href),out={path,pageType:'other',productSlug:null,categorySlug:null,comparisonProductSlugs:[],currentSearchQuery:u.searchParams.get('q')||'',currentFilters:{}};
 if(parts[0]==='products'&&parts[1]){out.pageType='product';out.productSlug=parts[1];}
 else if(parts[0]==='categories'&&parts[1]){out.pageType=parts[2]==='finder'?'finder':'category';out.categorySlug=parts[1];}
 else if(parts[0]==='guides'&&parts[1]){out.pageType='guide';out.categorySlug=parts[1].replace(/-buying-guide$/,'');}
 else if(path==='/decision-lab/')out.pageType='decision-lab';else if(path==='/search/')out.pageType='search';else if(path==='/my-apg/')out.pageType='my-apg';else if(parts[0]==='compare')out.pageType='comparison';else if(path==='/')out.pageType='home';
 const compared=(u.searchParams.get('products')||'').split(',').filter(Boolean);out.comparisonProductSlugs=compared.slice(0,4);return out;
}
function track(name,extra){try{if(typeof window.gtag==='function')window.gtag('event',name,Object.assign({scout_version:'5',page_type:pageContext().pageType},extra||{}));}catch{}}
function mini(){const avatar=panel.querySelector('.apg-assistant-avatar');return avatar?avatar.innerHTML:'';}
function thread(){let t=body.querySelector('.scout-v5-thread');if(!t){body.innerHTML='<div class="scout-v5-thread"></div>';t=body.firstElementChild;}return t;}
function botHtml(inner){return '<div class="scout-v5-row bot"><span class="scout-v5-mini" aria-hidden="true">'+mini()+'</span><div class="scout-v5-bubble">'+inner+'</div></div>';}
function userHtml(text){return '<div class="scout-v5-row user"><div class="scout-v5-bubble">'+esc(text)+'</div></div>';}
function scrollEnd(){requestAnimationFrame(()=>{body.scrollTop=body.scrollHeight;});}
function suggestions(){
 const c=pageContext(),items=[];
 if(c.pageType==='product'){items.push(['Is this worth it?','Is this worth it for most buyers?'],['Compare this','Compare this with the closest alternatives'],['Where can I buy it?','Where can I buy this product?'],['Save this','Save this product for me']);}
 else if(c.pageType==='comparison')items.push(['Which suits me?','Which one would you pick for my priorities?'],['Explain differences','What are the meaningful differences here?']);
 else if(c.pageType==='category'||c.pageType==='finder')items.push(['Help me choose','Help me choose the best option for my needs'],['Best value','I want the best value in this category'],['Buying guide','Show me the buying guide for this category']);
 else if(c.pageType==='my-apg')items.push(['My saved products','What have I saved?'],['How does My APG work?','How does My APG work?']);
 else items.push(['Help me choose','I need help choosing a product'],['What is APG?','What is Australian Product Guide?'],['How recommendations work','How do you decide what to recommend?'],['Find Methodology','Where is your methodology?']);
 return '<div class="scout-v5-suggestions">'+items.map(x=>'<button type="button" class="scout-v5-chip" data-scout-v5-ask="'+esc(x[1])+'">'+esc(x[0])+'</button>').join('')+'</div>';
}
function welcome(){
 const a=state.account||{},name=a.displayName?esc(a.displayName):'',saved=Number(a.savedCount)||0,hasState=!!state.decisionState;
 let hello=a.authenticated?(name?'Hi '+name+' — welcome back.':'Welcome back — I’m Scout.'):'Hi — I’m Scout, Australian Product Guide’s shopping assistant.';
 let detail='Ask me about a product, comparison or anything on APG.';
 if(a.authenticated&&saved)detail+=' You have '+saved+' saved product'+(saved===1?'':'s')+' in My APG.';
 if(hasState)detail+=' I’ve kept your shopping brief for this browser tab, without storing the chat transcript.';
 body.innerHTML='<div class="scout-v5-thread">'+botHtml('<span class="scout-v5-kicker">Your APG shopping assistant</span><div class="scout-v5-welcome"><strong>'+hello+'</strong><br>'+esc(detail)+'</div>')+suggestions()+'</div>';scrollEnd();
}
function ensureComposer(){
 if(panel.querySelector('.scout-v5-composer'))return;
 const c=document.createElement('div');c.className='scout-v5-composer';c.innerHTML='<form class="scout-v5-form" data-scout-v5-form><label class="sr-only" for="scoutV5Input">Ask Scout</label><input id="scoutV5Input" class="scout-v5-input" type="search" autocomplete="off" maxlength="2000" placeholder="Ask about products, comparisons or APG"><button class="scout-v5-send" type="submit" aria-label="Send to Scout">↑</button></form><p class="scout-v5-helper">Try natural language — e.g. “robot vacuum under $800 for pet hair” or “where is your affiliate disclosure?”</p>';
 panel.insertBefore(c,foot||null);
 c.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const input=c.querySelector('input'),value=input.value.trim();if(value){input.value='';ask(value);}});
}
function ensureHeadActions(){
 const head=panel.querySelector('.apg-assistant-head');if(!head||head.querySelector('.scout-v5-head-actions'))return;
 const close=head.querySelector('[data-apg-assistant-close]'),wrap=document.createElement('div');wrap.className='scout-v5-head-actions';wrap.innerHTML='<button type="button" class="scout-v5-new" data-scout-v5-new>New chat</button>';if(close){head.insertBefore(wrap,close);wrap.appendChild(close);}else head.appendChild(wrap);
 wrap.querySelector('[data-scout-v5-new]').addEventListener('click',()=>{clearPersisted();state.turns=0;welcome();track('scout_new_chat');panel.querySelector('.scout-v5-input')?.focus();});
}
async function bootstrap(){
 if(state.ready)return;body.innerHTML='<div class="scout-v5-thread"><div class="scout-v5-status" role="status"><span class="scout-v5-dot"></span><span>Opening Scout…</span></div></div>';
 try{const r=await fetch('/api/account/scout',{headers:{Accept:'application/json'},credentials:'same-origin'});if(!r.ok)throw new Error('bootstrap');const d=await r.json();state.account=d.account||{authenticated:false};state.ready=true;welcome();}
 catch{state.account={authenticated:false};state.ready=true;welcome();}
}
function setBusy(on){state.busy=on;const input=panel.querySelector('.scout-v5-input'),send=panel.querySelector('.scout-v5-send');if(input)input.disabled=on;if(send)send.disabled=on;body.setAttribute('aria-busy',on?'true':'false');const old=thread().querySelector('[data-scout-v5-status]');if(old)old.remove();if(on){const s=document.createElement('div');s.className='scout-v5-status';s.dataset.scoutV5Status='true';s.setAttribute('role','status');s.innerHTML='<span class="scout-v5-dot"></span><span>Scout is checking APG…</span>';thread().appendChild(s);scrollEnd();}}
function renderProducts(items){if(!Array.isArray(items)||!items.length)return '';return '<div class="scout-v5-products">'+items.map(p=>'<article class="scout-v5-card"><div class="scout-v5-card-head"><div><span class="scout-v5-card-brand">'+esc(p.brand)+'</span><h4>'+esc(p.name)+'</h4></div>'+(p.referencePrice?'<span class="scout-v5-card-price">Ref. '+esc(money(p.referencePrice))+'</span>':'')+'</div><div class="scout-v5-card-meta">'+esc(p.category||'')+(p.evidence?' · '+esc(p.evidence):'')+'</div>'+(p.reason?'<p class="scout-v5-card-copy"><strong>Why it fits:</strong> '+esc(p.reason)+'</p>':'')+(p.tradeoff?'<p class="scout-v5-card-watch"><strong>Check:</strong> '+esc(p.tradeoff)+'</p>':'')+'<div class="scout-v5-card-actions"><a href="'+esc(p.url)+'">View product</a><button type="button" data-scout-v5-ask="Save '+esc(p.brand)+' '+esc(p.name)+' for me">Save</button></div></article>').join('')+'</div>';}
function renderActions(items){if(!Array.isArray(items)||!items.length)return '';return '<div class="scout-v5-actions">'+items.map(a=>{if(!a)return '';const cls='scout-v5-action'+(a.primary?' primary':'');if(a.url){const ext=a.external?' target="_blank" rel="'+(a.affiliate?'nofollow sponsored noopener':'noopener')+'"':'';return '<a class="'+cls+'" href="'+esc(a.url)+'"'+ext+'>'+esc(a.label)+'</a>';}return '<button type="button" class="'+cls+'" data-scout-v5-ask="'+esc(a.label)+'">'+esc(a.label)+'</button>';}).join('')+'</div>';}
function renderResponse(d){
 let inner='<strong>'+esc(d.message||'I’m ready to help.')+'</strong>';
 if(Array.isArray(d.bullets)&&d.bullets.length)inner+='<ul class="scout-v5-list">'+d.bullets.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 thread().insertAdjacentHTML('beforeend',botHtml(inner)+renderProducts(d.products)+renderActions(d.actions));
 if(d.intent!=='general_conversation')thread().insertAdjacentHTML('beforeend','<div class="scout-v5-feedback"><span>Was this helpful?</span><button type="button" data-scout-v5-feedback="helpful">Helpful</button><button type="button" data-scout-v5-feedback="not_helpful">Not helpful</button></div>');
 state.decisionState=d.decisionState!==undefined?d.decisionState:state.decisionState;if(Array.isArray(d.references)&&d.references.length)state.references=d.references.slice(0,5);if(d.account)state.account=d.account;persist();state.turns++;track('scout_response',{scout_intent:d.intent||'unknown'});scrollEnd();
}
async function ask(text){
 text=String(text||'').trim();if(!text||state.busy)return;thread().insertAdjacentHTML('beforeend',userHtml(text));scrollEnd();setBusy(true);track('scout_message',{conversation_turn:state.turns+1});
 try{const r=await fetch('/api/account/scout',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',body:JSON.stringify({text,pageContext:pageContext(),decisionState:state.decisionState,references:state.references})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'request');setBusy(false);renderResponse(d);}
 catch{setBusy(false);thread().insertAdjacentHTML('beforeend',botHtml('<strong>I couldn’t load Scout’s APG data just now.</strong><br>You can still use Search or Decision Lab — I won’t invent a recommendation to hide the error.')+renderActions([{label:'Search APG',url:'/search/',primary:true},{label:'Open Decision Lab',url:'/decision-lab/'}]));track('scout_error');scrollEnd();}
 finally{const input=panel.querySelector('.scout-v5-input');if(input&&!panel.hidden)input.focus();}
}
async function open(){panel.hidden=false;launcher.setAttribute('aria-expanded','true');document.body.classList.add('scout-v5-open');ensureComposer();ensureHeadActions();await bootstrap();track('scout_opened');requestAnimationFrame(()=>panel.querySelector('.scout-v5-input')?.focus());}
function close(){panel.hidden=true;launcher.setAttribute('aria-expanded','false');document.body.classList.remove('scout-v5-open');launcher.focus();track('scout_closed');}
launcher.addEventListener('click',()=>panel.hidden?open():close());panel.querySelector('[data-apg-assistant-close]')?.addEventListener('click',close);
document.addEventListener('click',e=>{const askBtn=e.target.closest('[data-scout-v5-ask]');if(askBtn&&panel.contains(askBtn)){e.preventDefault();ask(askBtn.dataset.scoutV5Ask||askBtn.textContent);}const feedback=e.target.closest('[data-scout-v5-feedback]');if(feedback&&panel.contains(feedback)){track('scout_feedback',{feedback:feedback.dataset.scoutV5Feedback});const wrap=feedback.closest('.scout-v5-feedback');if(wrap)wrap.innerHTML='<span>Thanks for the feedback.</span>';}});
document.querySelectorAll('[data-v26-scout-open]').forEach(btn=>{if(btn!==launcher)btn.addEventListener('click',e=>{e.preventDefault();if(panel.hidden)open();});});
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(x=>x.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
window.apgScout={open,close,ask,newChat:()=>{clearPersisted();welcome();}};
})();`;

module.exports={VERSION,css,js};
