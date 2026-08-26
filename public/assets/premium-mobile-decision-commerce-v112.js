(()=>{'use strict';
const VERSION='112.0',COMPARE_KEY='apgCompare',MAX_COMPARE=4;
const body=document.body;if(!body||body.dataset.apgPremiumMobileCommerce!==`v${VERSION}`)return;
const safeJSON=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
const readCompare=()=>{const rows=safeJSON(localStorage.getItem(COMPARE_KEY),[]);return Array.isArray(rows)?rows.filter(Boolean).slice(0,MAX_COMPARE):[]};
const writeCompare=rows=>{localStorage.setItem(COMPARE_KEY,JSON.stringify(rows.slice(0,MAX_COMPARE)));window.dispatchEvent(new CustomEvent('apg-workspace-synced',{detail:{type:'compare'}}));};

function initHomeCategories(){
 const grid=document.querySelector('[data-apg112-home-categories]');if(!grid)return;
 let button=document.querySelector('[data-apg112-show-categories]');
 if(!button){button=document.createElement('button');button.type='button';button.className='button secondary apg112-show-categories';button.dataset.apg112ShowCategories='';button.setAttribute('aria-expanded','false');button.textContent='Show all categories';grid.insertAdjacentElement('afterend',button);}
 const sync=()=>{if(window.innerWidth<=720){if(button.getAttribute('aria-expanded')!=='true')grid.dataset.apg112Collapsed='true';button.hidden=false;}else{delete grid.dataset.apg112Collapsed;button.hidden=true;}};
 button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));button.textContent=expanded?'Show all categories':'Show fewer categories';if(expanded)grid.dataset.apg112Collapsed='true';else delete grid.dataset.apg112Collapsed;});
 window.addEventListener('resize',sync,{passive:true});sync();
}
function comparableRows(){
 const selectors=['[data-compare-row]','.comparison-table tbody tr','.comparison-table .row','.compare-table tbody tr','.comparison-spec-row','.comparison-row','.spec-comparison-row'];
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
function initScoutContext(){
 const launcher=document.querySelector('#scout-v5-launcher,[data-scout-v5-launcher]');if(!launcher)return;
 const product=body.dataset.apg112Product,category=body.dataset.apg112Category,compared=(body.dataset.apg112CompareProducts||'').split(',').filter(Boolean);
 const label=product?`Scout knows you’re viewing this product.`:compared.length?`Scout knows the ${compared.length} products in this comparison.`:category?`Scout knows you’re browsing this category.`:'';
 const enhance=()=>{
   const panel=document.querySelector('#scout-v5-panel,[data-scout-v5-panel]');if(!panel)return;
   if(label&&!panel.querySelector('.apg112-scout-context')){const cue=document.createElement('p');cue.className='apg112-scout-context';cue.textContent=label;const target=panel.querySelector('header,.scout-v5-head,.scout-head')||panel.firstElementChild;target?target.insertAdjacentElement('afterend',cue):panel.prepend(cue);}
   panel.querySelectorAll('a[href^="/products/"]').forEach(link=>{const match=link.getAttribute('href').match(/^\/products\/([^/]+)\//);if(!match)return;const card=link.closest('article,.scout-card,.scout-v5-card,[data-product-card]')||link.parentElement;if(!card||card.querySelector(`[data-apg112-scout-compare="${match[1]}"]`))return;const button=document.createElement('button');button.type='button';button.className='button secondary';button.dataset.apg112ScoutCompare=match[1];button.textContent='Compare';button.addEventListener('click',()=>{const current=readCompare();if(!current.includes(match[1])){if(current.length>=MAX_COMPARE)current.shift();current.push(match[1]);writeCompare(current);}button.textContent='Added to compare';button.setAttribute('aria-pressed','true');});card.append(button);});
 };
 launcher.addEventListener('click',()=>{[80,280,650].forEach(ms=>window.setTimeout(enhance,ms));});
}
function initScoutCollision(){
 const launcher=document.querySelector('#scout-v5-launcher,[data-scout-v5-launcher]');if(!launcher)return;
 let queued=false;
 const calculate=()=>{queued=false;if(document.documentElement.classList.contains('apg-footer-overlap-guard')||body.classList.contains('apg-footer-overlap-guard')){document.documentElement.style.setProperty('--apg112-scout-lift','0px');return;}
   const vw=window.innerWidth,vh=window.innerHeight,lr=launcher.getBoundingClientRect();let lift=0;
   document.querySelectorAll('[data-compare-tray],.compare-tray,[data-sticky-actions],.sticky-actions,.mobile-sticky-actions').forEach(el=>{if(el===launcher||el.contains(launcher))return;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return;const r=el.getBoundingClientRect();if(r.width<40||r.height<20||r.bottom<vh-180||r.right<vw*.55)return;const overlaps=!(lr.right<r.left||lr.left>r.right||lr.bottom<r.top||lr.top>r.bottom);if(overlaps||r.bottom>=vh-8)lift=Math.max(lift,Math.min(190,r.height+12));});
   document.documentElement.style.setProperty('--apg112-scout-lift',`${Math.round(lift)}px`);
 };
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(calculate)};
 ['resize','scroll'].forEach(evt=>window.addEventListener(evt,schedule,{passive:true}));window.addEventListener('apg-workspace-synced',schedule);launcher.addEventListener('click',schedule);schedule();
}
function syncActionStates(){
 const compared=readCompare();document.querySelectorAll('[data-compare-product]').forEach(btn=>btn.setAttribute('aria-pressed',String(compared.includes(btn.dataset.compareProduct))));
}
initHomeCategories();initDifferences();initScoutContext();initScoutCollision();syncActionStates();window.addEventListener('apg-workspace-synced',syncActionStates);
})();
