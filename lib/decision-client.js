const decisionClientJs=`
;(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const keys={compare:'apgCompare',saved:'apgSaved',recent:'apgRecent',decisions:'apgDecisionHistory',searches:'apgRecentSearches'};
const read=(k,f=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const safe=s=>String(s||'').replace(/[<>&]/g,'');
function compareSlug(value){let raw='';if(typeof value==='string')raw=value;else if(value&&typeof value==='object')raw=value.slug||value.productSlug||value.id||value.url||value.path||'';raw=String(raw||'').trim();const productPath=raw.match(/^\\/?products\\/([^/?#]+)\\/?(?:[?#].*)?$/i);if(productPath)raw=productPath[1];try{raw=decodeURIComponent(raw)}catch{}raw=raw.trim().toLowerCase();return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)?raw:'';}
function normaliseCompare(values){const out=[];for(const raw of Array.isArray(values)?values:[]){const slug=compareSlug(raw);if(!slug||out.includes(slug))continue;out.push(slug);if(out.length===4)break;}return out;}
function compareState(){const current=normaliseCompare(read(keys.compare));write(keys.compare,current);return current;}

function installNavigation(){
  const nav=q('.primary-nav .nav-inner');
  if(nav&&!q('[data-decision-nav]',nav)){
    const a=document.createElement('a');a.href='/decision-lab/';a.textContent='Decision Lab';a.dataset.decisionNav='';a.className='apg-power-link';
    const brands=[...nav.querySelectorAll('a')].find(x=>x.textContent.trim()==='Brands');nav.insertBefore(a,brands||null);
  }
  const mobile=q('#mobileNav .mobile-nav-inner');
  if(mobile&&!q('[data-decision-nav]',mobile)){
    const a=document.createElement('a');a.href='/decision-lab/';a.dataset.decisionNav='';a.className='mobile-recent apg-power-link';a.innerHTML='Decision Lab <span aria-hidden="true">→</span>';
    const recent=q('.mobile-recent',mobile);mobile.insertBefore(a,recent||null);
  }
  const actions=q('.header-actions');
  if(actions){
    const links=qa('.header-action',actions),workspace=links[1];
    if(workspace){workspace.href='/my-apg/';workspace.classList.add('apg-workspace-link');const label=q('span',workspace);if(label)label.textContent='My APG';workspace.title='Open your private APG decision workspace';}
  }
  updateWorkspaceBadge();
}

function workspaceCount(){return new Set([...compareState(),...read(keys.saved)]).size;}
function updateWorkspaceBadge(){
  const a=q('.apg-workspace-link');if(!a)return;let b=q('.apg-workspace-badge',a),n=workspaceCount();
  if(!n){if(b)b.remove();return}if(!b){b=document.createElement('span');b.className='apg-workspace-badge';a.appendChild(b)}b.textContent=n>99?'99+':String(n);b.setAttribute('aria-label',n+' saved or shortlisted products');
}

document.addEventListener('click',e=>{if(e.target.closest('[data-compare-product],[data-save-product]'))setTimeout(updateWorkspaceBadge,0)});

function saveDecisionHistory(){
  const query=document.body.dataset.decisionQuery||'',url=document.body.dataset.decisionUrl||'';if(!query.trim()||!url)return;
  const current=read(keys.decisions).filter(x=>x&&x.url!==url&&x.q!==query.trim());
  write(keys.decisions,[{q:query.trim(),url,ts:Date.now()},...current].slice(0,8));
}

function renderDecisionHistory(){
  const root=q('#decisionHistory');if(!root)return;const items=read(keys.decisions);if(!items.length)return;
  root.innerHTML='<div class="section-head"><div><p class="kicker">Your recent Decision Lab sessions</p><h2>Continue a decision on this device</h2><p>Stored only in this browser.</p></div><a class="text-link" href="/my-apg/">Open My APG →</a></div><div class="workspace-list">'+items.slice(0,4).map(x=>'<a class="workspace-item" href="'+safe(x.url)+'"><span><strong>'+safe(x.q)+'</strong><small>Decision Lab</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>';
  root.hidden=false;
}

const copy=q('[data-copy-decision]');if(copy)copy.addEventListener('click',async()=>{const status=q('[data-copy-status]');try{await navigator.clipboard.writeText(location.href);if(status)status.textContent='Decision link copied.'}catch{if(status)status.textContent='Copy the URL from your browser address bar.'}});

function loadIndex(){return fetch('/assets/search-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[])}
function productMap(items){return new Map(items.filter(x=>x.type==='product').map(x=>[x.slug,x]));}
function productRows(ids,map,empty){const found=ids.map(id=>map.get(id)).filter(Boolean);if(!found.length)return '<div class="workspace-empty">'+safe(empty)+'</div>';return '<div class="workspace-list">'+found.map(x=>'<a class="workspace-item" href="'+safe(x.url)+'"><span><strong>'+safe(x.label)+'</strong><small>'+safe(x.meta)+'</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>'}
function decisionRows(items){if(!items.length)return '<div class="workspace-empty">No Decision Lab sessions saved on this device yet.</div>';return '<div class="workspace-list">'+items.map(x=>'<a class="workspace-item" href="'+safe(x.url)+'"><span><strong>'+safe(x.q)+'</strong><small>Explainable shortlist</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>'}

async function renderWorkspace(){
  const root=q('[data-apg-workspace]');if(!root)return;const items=await loadIndex(),map=productMap(items);
  const compare=compareState(),saved=read(keys.saved).slice(0,50),recent=read(keys.recent).slice(0,6),decisions=read(keys.decisions).slice(0,8);
  q('[data-workspace-compare] [data-workspace-content]',root).innerHTML=productRows(compare,map,'Your comparison shortlist is empty. Add products using Compare anywhere on APG.');
  if(compare.length>=2)q('[data-workspace-compare] [data-workspace-content]',root).insertAdjacentHTML('beforeend','<a class="button compact" href="/compare/custom/?products='+compare.map(encodeURIComponent).join(',')+'">Compare '+compare.length+' products</a>');
  q('[data-workspace-saved] [data-workspace-content]',root).innerHTML=productRows(saved,map,'You have not saved any products on this device yet.');
  q('[data-workspace-recent] [data-workspace-content]',root).innerHTML=productRows(recent,map,'No recently viewed products are stored on this device.');
  q('[data-workspace-decisions] [data-workspace-content]',root).innerHTML=decisionRows(decisions);
}

const clear=q('[data-clear-workspace]');if(clear)clear.addEventListener('click',()=>{if(!confirm('Clear saved products, comparison shortlist, recent products and Decision Lab history from this browser?'))return;[keys.compare,keys.saved,keys.recent,keys.decisions,keys.searches].forEach(k=>localStorage.removeItem(k));const status=q('[data-workspace-status]');if(status)status.textContent='My APG local history cleared.';updateWorkspaceBadge();renderWorkspace();});

document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){const target=e.target;if(target&&/input|textarea|select/i.test(target.tagName))return;e.preventDefault();q('[data-site-search]')?.focus();}});
window.addEventListener('apg-workspace-synced',()=>{updateWorkspaceBadge();renderWorkspace();});

installNavigation();saveDecisionHistory();renderDecisionHistory();renderWorkspace();
})();
`;
module.exports={decisionClientJs};