(()=>{'use strict';
const VERSION='112.0',COMPARE_KEY='apgCompare',SAVED_KEY='apgSaved',MAX_COMPARE=4,MAX_SAVED=50;
const body=document.body;if(!body||body.dataset.apgPremiumMobileCommerce!==`v${VERSION}`)return;
const safeJSON=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const readList=(key,limit)=>{const rows=safeJSON(localStorage.getItem(key),[]);return Array.isArray(rows)?[...new Set(rows.filter(Boolean))].slice(0,limit):[]};
const readCompare=()=>readList(COMPARE_KEY,MAX_COMPARE),readSaved=()=>readList(SAVED_KEY,MAX_SAVED);
const scoutLauncher=()=>document.querySelector('#apgAssistantLauncher,#scout-v5-launcher,[data-scout-v5-launcher]');
const scoutPanel=()=>document.querySelector('#apgAssistantPanel,#scout-v5-panel,[data-scout-v5-panel]');

function initHomeCategories(){
 const grid=document.querySelector('[data-apg112-home-categories]');if(!grid)return;
 let button=document.querySelector('[data-apg112-show-categories]');
 if(!button){button=document.createElement('button');button.type='button';button.className='button secondary apg112-show-categories';button.dataset.apg112ShowCategories='';button.setAttribute('aria-expanded','false');button.textContent='Show all categories';grid.insertAdjacentElement('afterend',button);}
 const sync=()=>{if(window.innerWidth<=720){if(button.getAttribute('aria-expanded')!=='true')grid.dataset.apg112Collapsed='true';button.hidden=false;}else{delete grid.dataset.apg112Collapsed;button.hidden=true;}};
 button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));button.textContent=expanded?'Show all categories':'Show fewer categories';if(expanded)grid.dataset.apg112Collapsed='true';else delete grid.dataset.apg112Collapsed;});
 window.addEventListener('resize',sync,{passive:true});sync();
}
function comparableRows(){
 const selectors=['[data-compare-row]','table.compare tbody tr','.comparison-table tbody tr','.comparison-table .row','.compare-table tbody tr','.comparison-spec-row','.comparison-row','.spec-comparison-row'];
 return [...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))].filter(row=>!row.closest('[data-apg112-compare-toolbar]'));
}
function rowValues(row){
 const cells=[...row.querySelectorAll('td,[data-compare-value],.value,.spec-value')];
 if(cells.length>=2)return cells.slice(-2).map(x=>x.textContent.replace(/\s+/g,' ').trim().toLowerCase());
 const children=[...row.children].filter(x=>x.offsetParent!==null);if(children.length>=3)return children.slice(-2).map(x=>x.textContent.replace(/\s+/g,' ').trim().toLowerCase());
 return [];
}
function initDifferences(){
 const toggle=document.querySelector('[data-apg112-differences]');if(!toggle)return;
 const rows=comparableRows();rows.forEach(row=>{const values=rowValues(row);row.dataset.apg112Identical=String(values.length>=2&&values[0]&&values.every(v=>v===values[0]));});
 const apply=()=>{const only=toggle.getAttribute('aria-pressed')==='true';rows.forEach(row=>{row.hidden=only&&row.dataset.apg112Identical==='true';});toggle.innerHTML=`<span aria-hidden="true">≠</span> ${only?'Only differences':'Show all details'}`;};
 toggle.addEventListener('click',()=>{toggle.setAttribute('aria-pressed',String(toggle.getAttribute('aria-pressed')!=='true'));apply();});apply();
}
// APG's canonical /assets/app.js owns delegated Compare/Save mutations. v112 only
// mirrors state for newly inserted surfaces; it must never bind a second mutation handler.
function syncActionStates(){
 const compared=readCompare(),saved=readSaved();
 document.querySelectorAll('[data-compare-product]').forEach(btn=>{const active=compared.includes(btn.dataset.compareProduct);btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));btn.textContent=active?'Added':'Compare';});
 document.querySelectorAll('[data-save-product]').forEach(btn=>{const active=saved.includes(btn.dataset.saveProduct);btn.classList.toggle('saved',active);btn.setAttribute('aria-pressed',String(active));btn.textContent=active?'♥':'♡';btn.title=active?'Remove from saved products':'Save product on this device';});
}
function initCardActions(){syncActionStates();}
function initScoutContext(){
 const launcher=scoutLauncher();if(!launcher)return;
 const product=body.dataset.apg112Product,category=body.dataset.apg112Category,compared=(body.dataset.apg112CompareProducts||'').split(',').filter(Boolean);
 const label=product?'Scout knows the product on this page and can explain fit, trade-offs or alternatives.':compared.length?`Scout knows the ${compared.length} products in this comparison and can explain the deciding differences.`:category?'Scout knows this category and its maintained decision criteria.':'';
 const enhance=()=>{
   const panel=scoutPanel();if(!panel)return;
   if(label&&!panel.querySelector('.apg112-scout-context')){const cue=document.createElement('p');cue.className='apg112-scout-context';cue.textContent=label;const target=panel.querySelector('header,.scout-v5-head,.scout-head')||panel.firstElementChild;target?target.insertAdjacentElement('afterend',cue):panel.prepend(cue);}
   panel.querySelectorAll('a[href^="/products/"]').forEach(link=>{
     const match=link.getAttribute('href').match(/^\/products\/([^/]+)\//);if(!match)return;const slug=match[1];
     const card=link.closest('article,.scout-card,.scout-v5-card,[data-product-card]')||link.parentElement;if(!card||card.querySelector(`[data-apg112-scout-actions="${slug}"]`))return;
     const actions=document.createElement('div');actions.className='apg112-scout-actions';actions.dataset.apg112ScoutActions=slug;
     const compare=document.createElement('button');compare.type='button';compare.className='button secondary';compare.dataset.compareProduct=slug;compare.dataset.apg112ScoutCompare=slug;compare.setAttribute('aria-pressed','false');compare.textContent='Compare';
     const save=document.createElement('button');save.type='button';save.className='button secondary';save.dataset.saveProduct=slug;save.dataset.apg112ScoutSave=slug;save.setAttribute('aria-pressed','false');save.textContent='♡';save.setAttribute('aria-label','Save product');
     actions.append(compare,save);card.append(actions);syncActionStates();
   });
 };
 launcher.addEventListener('click',()=>{[80,280,650].forEach(ms=>window.setTimeout(enhance,ms));});
}
function initScoutCollision(){
 const launcher=scoutLauncher();if(!launcher)return;
 let queued=false;
 const setLift=lift=>{const px=Math.max(0,Math.min(190,Math.round(lift)));document.documentElement.style.setProperty('--apg112-scout-lift',`${px}px`);const mobile=innerWidth<=720;launcher.style.setProperty('bottom',mobile?`calc(14px + env(safe-area-inset-bottom, 0px) + ${px}px)`:`calc(18px + ${px}px)`,'important');};
 const calculate=()=>{queued=false;if(document.documentElement.classList.contains('apg-footer-overlap-guard')||body.classList.contains('apg-footer-overlap-guard')){setLift(0);return;}
   const vw=window.innerWidth,vh=window.innerHeight,lr=launcher.getBoundingClientRect();let lift=0;
   document.querySelectorAll('[data-compare-tray],.compare-tray,[data-sticky-actions],.sticky-actions,.mobile-sticky-actions').forEach(el=>{if(el===launcher||el.contains(launcher))return;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return;const r=el.getBoundingClientRect();if(r.width<40||r.height<20||r.bottom<vh-180||r.right<vw*.55)return;const overlaps=!(lr.right<r.left||lr.left>r.right||lr.bottom<r.top||lr.top>r.bottom);if(overlaps||r.bottom>=vh-8)lift=Math.max(lift,r.height+12);});setLift(lift);
 };
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(calculate)};
 ['resize','scroll'].forEach(evt=>window.addEventListener(evt,schedule,{passive:true}));window.addEventListener('apg-workspace-synced',()=>{syncActionStates();schedule();});launcher.addEventListener('click',schedule);schedule();
}
initHomeCategories();initDifferences();initCardActions();initScoutContext();initScoutCollision();window.addEventListener('apg-workspace-synced',syncActionStates);
})();
