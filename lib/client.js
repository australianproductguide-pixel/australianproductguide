const clientJs=`(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const compareKey='apgCompare',recentKey='apgRecent',savedKey='apgSaved',searchKey='apgRecentSearches';
const read=(k,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??fallback}catch{return fallback}};
let selected=Array.isArray(read(compareKey))?read(compareKey).slice(0,4):[];
let saved=Array.isArray(read(savedKey))?read(savedKey).slice(0,50):[];
function renderCompare(){
  qa('[data-compare-product]').forEach(b=>{const id=b.dataset.compareProduct,on=selected.includes(id);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'Added':'Compare';});
  const tray=q('#compareTray');if(!tray)return;const count=q('[data-compare-count]',tray),link=q('[data-compare-link]',tray),clear=q('[data-compare-clear]',tray);
  if(count)count.textContent=selected.length;tray.hidden=selected.length===0;
  if(link){link.href='/compare/custom/?products='+selected.join(',');link.classList.toggle('disabled',selected.length<2);link.setAttribute('aria-disabled',String(selected.length<2));}
  if(clear)clear.onclick=()=>{selected=[];localStorage.setItem(compareKey,JSON.stringify(selected));renderCompare()};
}
function renderSaved(){qa('[data-save-product]').forEach(b=>{const id=b.dataset.saveProduct,on=saved.includes(id);b.classList.toggle('saved',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'♥':'♡';});}
document.addEventListener('click',e=>{
  const compare=e.target.closest('[data-compare-product]');if(compare){const id=compare.dataset.compareProduct;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<4)selected.push(id);else{const msg=q('#compareMessage');if(msg){msg.textContent='Compare up to four products at a time.';setTimeout(()=>msg.textContent='',2200)}return}localStorage.setItem(compareKey,JSON.stringify(selected));renderCompare();return;}
  const save=e.target.closest('[data-save-product]');if(save){const id=save.dataset.saveProduct;saved=saved.includes(id)?saved.filter(x=>x!==id):[id,...saved].slice(0,50);localStorage.setItem(savedKey,JSON.stringify(saved));renderSaved();return;}
});
const mobile=q('[data-mobile-toggle]');if(mobile)mobile.addEventListener('click',()=>{const nav=q('#mobileNav'),open=mobile.getAttribute('aria-expanded')==='true';mobile.setAttribute('aria-expanded',String(!open));nav.hidden=open;if(!open)setTimeout(()=>q('[data-site-search]',nav)?.focus(),0)});
const megaTrigger=q('[data-mega-trigger]'),mega=q('[data-mega-menu]');function setMega(open){if(!mega||!megaTrigger)return;mega.hidden=!open;megaTrigger.setAttribute('aria-expanded',String(open));}
if(megaTrigger){megaTrigger.addEventListener('click',()=>setMega(megaTrigger.getAttribute('aria-expanded')!=='true'));megaTrigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();setMega(true);q('a',mega)?.focus()}});}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMega(false);if(mobile&&mobile.getAttribute('aria-expanded')==='true'){mobile.click();mobile.focus()}}});document.addEventListener('click',e=>{if(mega&&!mega.hidden&&!mega.contains(e.target)&&!megaTrigger.contains(e.target))setMega(false)});
let indexPromise=null;function getIndex(){if(!indexPromise)indexPromise=fetch('/assets/search-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():[]).catch(()=>[]);return indexPromise;}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function matches(items,value){const n=norm(value),tokens=n.split(/\\s+/).filter(Boolean);if(!tokens.length)return[];return items.map(x=>{const hay=norm(x.label+' '+x.meta),score=tokens.reduce((s,t)=>s+(hay.includes(t)?2:0),0)+(hay.startsWith(n)?4:0);return {x,score}}).filter(v=>v.score>0).sort((a,b)=>b.score-a.score||a.x.label.localeCompare(b.x.label)).slice(0,8).map(v=>v.x)}
function thumb(item){return item.type==='product'?'P':item.type==='category'?'C':item.type==='guide'?'G':'↗'}
function renderSuggestions(shell,input,box,items){const value=input.value.trim(),recent=read(searchKey).slice(0,4);let list=value?matches(items,value):[];if(!value&&recent.length)list=recent.map(v=>({type:'recent',label:v,meta:'Recent search',url:'/search/?q='+encodeURIComponent(v)}));if(!list.length){box.hidden=true;box.innerHTML='';return}const grouped={};for(const item of list)(grouped[item.type]||(grouped[item.type]=[])).push(item);box.innerHTML=Object.entries(grouped).map(([type,group])=>'<div class="suggest-group"><span class="suggest-label">'+type.replace('-', ' ')+'</span>'+group.map(item=>'<a class="suggest-item" href="'+item.url+'"><span class="suggest-thumb">'+thumb(item)+'</span><span><strong>'+item.label.replace(/[<>&]/g,'')+'</strong><small>'+String(item.meta||'').replace(/[<>&]/g,'')+'</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>').join('');box.hidden=false;}
qa('[data-search-shell]').forEach(shell=>{const input=q('[data-site-search]',shell),box=q('[data-search-suggestions]',shell);if(!input||!box)return;getIndex().then(items=>{input.addEventListener('input',()=>renderSuggestions(shell,input,box,items));input.addEventListener('focus',()=>renderSuggestions(shell,input,box,items));shell.addEventListener('submit',()=>{const v=input.value.trim();if(v){const recent=[v,...read(searchKey).filter(x=>x!==v)].slice(0,6);localStorage.setItem(searchKey,JSON.stringify(recent));}});});});
document.addEventListener('click',e=>qa('[data-search-suggestions]').forEach(box=>{if(!box.closest('[data-search-shell]').contains(e.target))box.hidden=true}));
const current=document.body.dataset.productSlug;if(current){const recent=[current,...read(recentKey).filter(x=>x!==current)].slice(0,6);localStorage.setItem(recentKey,JSON.stringify(recent));}
const recent=q('#recentlyViewed');if(recent){getIndex().then(items=>{const ids=read(recentKey),found=ids.map(id=>items.find(x=>x.slug===id&&x.type==='product')).filter(Boolean);if(found.length){recent.innerHTML='<div class="section-head"><div><p class="kicker">Your browsing</p><h2>Recently viewed on this device</h2><p>Stored locally in your browser and not presented as an APG account.</p></div></div><div class="rail">'+found.map(x=>'<a class="mini-card" href="'+x.url+'"><span>'+x.meta+'</span><strong>'+x.label+'</strong></a>').join('')+'</div>';recent.hidden=false;}})}
qa('form[data-busy-form]').forEach(f=>f.addEventListener('submit',()=>{const b=q('button[type=submit]',f);if(b){b.dataset.old=b.textContent;b.textContent='Finding matches…';b.setAttribute('aria-busy','true')}}));
renderCompare();renderSaved();
})();`;
module.exports={clientJs};
