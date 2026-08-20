const clientJs=`(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const compareKey='apgCompare',recentKey='apgRecent',savedKey='apgSaved',searchKey='apgRecentSearches';
const read=(k,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??fallback}catch{return fallback}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
function normaliseRecentSearch(value){
 const raw=typeof value==='string'?value:(value&&typeof value==='object'?value.q:'');
 const term=String(raw||'').trim();
 if(!term||/^\\[object Object\\]$/i.test(term))return null;
 return {q:term,url:'/search/?q='+encodeURIComponent(term),ts:Number(value&&typeof value==='object'?value.ts:0)||0};
}
function recentSearches(){const rows=read(searchKey);return (Array.isArray(rows)?rows:[]).map(normaliseRecentSearch).filter(Boolean);}
function rememberSearch(term){
 const qv=String(term||'').trim();if(!qv||/^\\[object Object\\]$/i.test(qv))return;
 const rows=recentSearches().filter(x=>x.q!==qv);
 write(searchKey,[{q:qv,url:'/search/?q='+encodeURIComponent(qv),ts:Date.now()},...rows].slice(0,10));
}
function compareSlug(value){
 let raw='';
 if(typeof value==='string')raw=value;
 else if(value&&typeof value==='object')raw=value.slug||value.productSlug||value.id||value.url||value.path||'';
 raw=String(raw||'').trim();
 const productPath=raw.match(/^\\/?products\\/([^/?#]+)\\/?(?:[?#].*)?$/i);if(productPath)raw=productPath[1];
 try{raw=decodeURIComponent(raw)}catch{}
 raw=raw.trim().toLowerCase();
 return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw)?raw:'';
}
function normaliseCompare(values){
 const out=[];for(const raw of Array.isArray(values)?values:[]){const slug=compareSlug(raw);if(!slug||out.includes(slug))continue;out.push(slug);if(out.length===4)break;}return out;
}
let selected=normaliseCompare(read(compareKey));
write(compareKey,selected);
let saved=Array.isArray(read(savedKey))?read(savedKey).slice(0,50):[];
function announce(text){let n=q('#apgLive');if(!n){n=document.createElement('div');n.id='apgLive';n.className='sr-only';n.setAttribute('aria-live','polite');document.body.appendChild(n)}n.textContent='';setTimeout(()=>n.textContent=text,20)}
function renderCompare(){
 selected=normaliseCompare(selected);
 qa('[data-compare-product]').forEach(b=>{const id=compareSlug(b.dataset.compareProduct),on=!!id&&selected.includes(id);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'Added':'Compare';});
 const tray=q('#compareTray');if(!tray)return;const count=q('[data-compare-count]',tray),link=q('[data-compare-link]',tray),clear=q('[data-compare-clear]',tray);
 if(count)count.textContent=selected.length;tray.hidden=selected.length===0;
 if(link){link.href='/compare/custom/?products='+selected.map(encodeURIComponent).join(',');link.classList.toggle('disabled',selected.length<2);link.setAttribute('aria-disabled',String(selected.length<2));}
 if(clear)clear.onclick=()=>{selected=[];write(compareKey,selected);renderCompare();announce('Comparison shortlist cleared')};
}
function renderSaved(){qa('[data-save-product]').forEach(b=>{const id=b.dataset.saveProduct,on=saved.includes(id);b.classList.toggle('saved',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'♥':'♡';b.title=on?'Remove from saved products':'Save product on this device';});}
document.addEventListener('click',e=>{
 const compare=e.target.closest('[data-compare-product]');if(compare){const id=compareSlug(compare.dataset.compareProduct);if(!id)return;selected=normaliseCompare(selected);if(selected.includes(id)){selected=selected.filter(x=>x!==id);announce('Removed from comparison')}else if(selected.length<4){selected.push(id);announce('Added to comparison')}else{const msg=q('#compareMessage');if(msg){msg.textContent='Compare up to four products at a time.';setTimeout(()=>msg.textContent='',2200)}announce('Comparison limit is four products');return}selected=normaliseCompare(selected);write(compareKey,selected);renderCompare();return;}
 const save=e.target.closest('[data-save-product]');if(save){const id=save.dataset.saveProduct,on=saved.includes(id);saved=on?saved.filter(x=>x!==id):[id,...saved].slice(0,50);write(savedKey,saved);renderSaved();announce(on?'Removed from saved products':'Saved on this device');return;}
});
window.addEventListener('apg-workspace-synced',()=>{selected=normaliseCompare(read(compareKey));write(compareKey,selected);renderCompare();});
const header=q('[data-site-header]');if(header){const onScroll=()=>header.classList.toggle('is-scrolled',window.scrollY>8);onScroll();addEventListener('scroll',onScroll,{passive:true})}
function closeSearchSuggestions(root=document){qa('[data-search-suggestions]',root).forEach(box=>{box.hidden=true;box.innerHTML='';const shell=box.closest('[data-search-shell]'),input=shell&&q('[data-site-search]',shell);if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}})}
const mobile=q('[data-mobile-toggle]');function setMobile(open){if(!mobile)return;const nav=q('#mobileNav');mobile.setAttribute('aria-expanded',String(open));if(nav)nav.hidden=!open;document.documentElement.classList.toggle('mobile-nav-open',open);if(open&&nav)closeSearchSuggestions(nav)}
if(mobile)mobile.addEventListener('click',()=>setMobile(mobile.getAttribute('aria-expanded')!=='true'));
const megaTrigger=q('[data-mega-trigger]'),mega=q('[data-mega-menu]');let megaTimer;
function setMega(open,focusFirst=false){if(!mega||!megaTrigger)return;clearTimeout(megaTimer);mega.hidden=!open;megaTrigger.setAttribute('aria-expanded',String(open));document.body.classList.toggle('mega-open',open);if(open&&focusFirst)setTimeout(()=>q('a',mega)?.focus(),0)}
if(megaTrigger){
 megaTrigger.addEventListener('click',()=>setMega(megaTrigger.getAttribute('aria-expanded')!=='true'));
 megaTrigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setMega(true,true)}else if(e.key==='Escape'){setMega(false);megaTrigger.focus()}});
 megaTrigger.addEventListener('mouseenter',()=>{if(matchMedia('(hover:hover) and (min-width:921px)').matches)megaTimer=setTimeout(()=>setMega(true),90)});
}
if(mega){mega.addEventListener('mouseenter',()=>clearTimeout(megaTimer));mega.addEventListener('mouseleave',()=>{if(matchMedia('(hover:hover)').matches)megaTimer=setTimeout(()=>setMega(false),150)});mega.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setMega(false);megaTrigger?.focus()}})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMega(false);if(mobile?.getAttribute('aria-expanded')==='true'){setMobile(false);mobile.focus()}}});
document.addEventListener('click',e=>{if(mega&&!mega.hidden&&!mega.contains(e.target)&&!megaTrigger?.contains(e.target))setMega(false)});
let indexPromise=null;function getIndex(){if(!indexPromise)indexPromise=fetch('/assets/search-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]);return indexPromise;}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function matches(items,value){const n=norm(value),tokens=n.split(/\\s+/).filter(Boolean);if(!tokens.length)return[];return items.map(x=>{const hay=norm(x.label+' '+x.meta),score=tokens.reduce((s,t)=>s+(hay.includes(t)?2:0),0)+(hay.startsWith(n)?4:0)+(norm(x.label).startsWith(n)?3:0);return {x,score}}).filter(v=>v.score>0).sort((a,b)=>b.score-a.score||a.x.label.localeCompare(b.x.label)).slice(0,10).map(v=>v.x)}
function typeLabel(type){return ({product:'Products',category:'Categories',comparison:'Comparisons',guide:'Guides',brand:'Brands',recent:'Recent searches'})[type]||type.replace(/-/g,' ')}
function thumb(item){return item.type==='product'?'P':item.type==='category'?'C':item.type==='comparison'?'↔':item.type==='brand'?'B':item.type==='guide'?'G':'↗'}
function safe(s){return String(s||'').replace(/[<>&]/g,'')}
function renderSuggestions(input,box,items){const value=input.value.trim(),recent=recentSearches().slice(0,4);let list=value?matches(items,value):[];if(!value&&recent.length)list=recent.map(v=>({type:'recent',label:v.q,meta:'Recent search on this device',url:v.url}));if(!list.length&&value)list=[{type:'guide',label:'Search all maintained products',meta:'See full results and recovery suggestions',url:'/search/?q='+encodeURIComponent(value)}];if(!list.length){box.hidden=true;box.innerHTML='';input.setAttribute('aria-expanded','false');return}const grouped={};for(const item of list)(grouped[item.type]||(grouped[item.type]=[])).push(item);let i=0;box.innerHTML=Object.entries(grouped).map(([type,group])=>'<div class="suggest-group"><span class="suggest-label">'+safe(typeLabel(type))+'</span>'+group.map(item=>{const id=box.id+'Item'+i++;return '<a id="'+id+'" role="option" class="suggest-item" href="'+item.url+'"><span class="suggest-thumb type-'+safe(item.type)+'">'+thumb(item)+'</span><span><strong>'+safe(item.label)+'</strong><small>'+safe(item.meta||'')+'</small></span><span aria-hidden="true">→</span></a>'}).join('')+'</div>').join('');box.hidden=false;input.setAttribute('aria-expanded','true');input.removeAttribute('aria-activedescendant');}
qa('[data-search-shell]').forEach(shell=>{const input=q('[data-site-search]',shell),box=q('[data-search-suggestions]',shell);if(!input||!box)return;let active=-1;const links=()=>qa('.suggest-item',box);const setActive=n=>{const all=links();if(!all.length)return;active=(n+all.length)%all.length;all.forEach((a,i)=>a.classList.toggle('active',i===active));all[active].scrollIntoView({block:'nearest'});input.setAttribute('aria-activedescendant',all[active].id)};getIndex().then(items=>{
 input.addEventListener('input',()=>{active=-1;renderSuggestions(input,box,items)});input.addEventListener('focus',()=>renderSuggestions(input,box,items));
 input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if(box.hidden)renderSuggestions(input,box,items);setActive(active+1)}else if(e.key==='ArrowUp'){e.preventDefault();setActive(active-1)}else if(e.key==='Enter'&&active>=0){const a=links()[active];if(a){e.preventDefault();location.href=a.href}}else if(e.key==='Escape'){box.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}});
 shell.addEventListener('submit',()=>rememberSearch(input.value));
});});
document.addEventListener('click',e=>qa('[data-search-suggestions]').forEach(box=>{const shell=box.closest('[data-search-shell]');if(shell&&!shell.contains(e.target)){box.hidden=true;q('[data-site-search]',shell)?.setAttribute('aria-expanded','false')}}));
const current=document.body.dataset.productSlug;if(current)write(recentKey,[current,...read(recentKey).filter(x=>x!==current)].slice(0,6));
const recent=q('#recentlyViewed');if(recent){getIndex().then(items=>{const ids=read(recentKey),found=ids.map(id=>items.find(x=>x.slug===id&&x.type==='product')).filter(Boolean);if(found.length){recent.innerHTML='<div class="section-head"><div><p class="kicker">Your browsing</p><h2>Recently viewed on this device</h2><p>Stored locally in this browser. APG does not create an account from this history.</p></div></div><div class="rail">'+found.map(x=>'<a class="mini-card" href="'+x.url+'"><span>'+safe(x.meta)+'</span><strong>'+safe(x.label)+'</strong></a>').join('')+'</div>';recent.hidden=false}})}
qa('form[data-busy-form]').forEach(f=>f.addEventListener('submit',()=>{const b=q('button[type=submit]',f);if(b){b.dataset.old=b.textContent;b.textContent='Finding matches…';b.setAttribute('aria-busy','true')}}));
renderCompare();renderSaved();
})();`;
module.exports={clientJs};