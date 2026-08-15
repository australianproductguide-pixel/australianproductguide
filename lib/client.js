const clientJs=`(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const key='apgCompare',recentKey='apgRecent';
let selected=[];try{selected=JSON.parse(localStorage.getItem(key)||'[]')}catch{}
selected=Array.isArray(selected)?selected.slice(0,4):[];
function save(){localStorage.setItem(key,JSON.stringify(selected));renderCompare();}
function renderCompare(){
  qa('[data-compare-product]').forEach(b=>{const id=b.dataset.compareProduct,on=selected.includes(id);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'Added to compare':'Add to compare';});
  const tray=q('#compareTray');if(!tray)return;
  const count=q('[data-compare-count]',tray),link=q('[data-compare-link]',tray),clear=q('[data-compare-clear]',tray);
  if(count)count.textContent=selected.length;
  tray.hidden=selected.length===0;
  if(link){link.href='/compare/custom/?products='+selected.join(',');link.classList.toggle('disabled',selected.length<2);link.setAttribute('aria-disabled',String(selected.length<2));}
  if(clear)clear.onclick=()=>{selected=[];save()};
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-compare-product]');if(!b)return;const id=b.dataset.compareProduct;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<4)selected.push(id);else{const msg=q('#compareMessage');if(msg){msg.textContent='Compare up to four products at a time.';setTimeout(()=>msg.textContent='',2200)}return}save();});
const mobile=q('[data-mobile-toggle]');if(mobile)mobile.addEventListener('click',()=>{const nav=q('#mobileNav'),open=mobile.getAttribute('aria-expanded')==='true';mobile.setAttribute('aria-expanded',String(!open));nav.hidden=open;});
async function searchIndex(){try{return await fetch('/assets/search-index.json',{cache:'force-cache'}).then(r=>r.ok?r.json():[])}catch{return[]}}
const searches=qa('[data-site-search]');if(searches.length){searchIndex().then(items=>{const list=q('#site-search-suggestions');if(list)list.innerHTML=items.slice(0,120).map(x=>'<option value="'+String(x.label).replace(/"/g,'&quot;')+'"></option>').join('')});}
const current=document.body.dataset.productSlug;if(current){let recent=[];try{recent=JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{};recent=[current,...recent.filter(x=>x!==current)].slice(0,6);localStorage.setItem(recentKey,JSON.stringify(recent));}
const recent=q('#recentlyViewed');if(recent){searchIndex().then(items=>{let ids=[];try{ids=JSON.parse(localStorage.getItem(recentKey)||'[]')}catch{};const found=ids.map(id=>items.find(x=>x.slug===id&&x.type==='product')).filter(Boolean);if(found.length){recent.innerHTML='<div class="section-head"><div><p class="kicker">Your browsing</p><h2>Recently viewed</h2></div></div><div class="rail">'+found.map(x=>'<a class="mini-card" href="'+x.url+'"><span>'+x.meta+'</span><strong>'+x.label+'</strong></a>').join('')+'</div>';recent.hidden=false;}})}
qa('form[data-busy-form]').forEach(f=>f.addEventListener('submit',()=>{const b=q('button[type=submit]',f);if(b){b.dataset.old=b.textContent;b.textContent='Finding matches…';b.setAttribute('aria-busy','true')}}));
renderCompare();
})();`;
module.exports={clientJs};
