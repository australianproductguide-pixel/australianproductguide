(()=>{
const root=document.querySelector('[data-rv-root]');
const read=(k,fallback=[])=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??fallback}catch{return fallback}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const go=q=>{const value=String(q||'').trim();if(!value)return;const recent=Array.isArray(read('apgRecentSearches'))?read('apgRecentSearches'):[];write('apgRecentSearches',[value,...recent.filter(x=>x!==value)].slice(0,6));location.href='/search/?q='+encodeURIComponent(value)};
document.addEventListener('click',e=>{
  const refine=e.target.closest('[data-rv-refine]');
  if(refine){e.preventDefault();go(refine.dataset.rvRefine);return;}
  const compare=e.target.closest('[data-rv-compare]');
  if(compare){
    e.preventDefault();
    const ids=String(compare.dataset.rvCompare||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,4);
    if(ids.length<2)return;
    write('apgCompare',ids);
    location.href='/compare/custom/?products='+encodeURIComponent(ids.join(','));
  }
});
if(root){
  const form=root.querySelector('[data-rv-follow-form]');
  if(form)form.addEventListener('submit',e=>{
    e.preventDefault();
    const input=form.querySelector('input[name="follow"]'),follow=String(input?.value||'').trim(),base=String(root.dataset.rvQuery||'').trim();
    if(!follow){input?.focus();return;}
    go(base?base+'. Follow-up: '+follow:follow);
  });
}
})();
