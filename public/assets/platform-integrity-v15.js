(()=>{
  const tools=document.querySelector('[data-v15-directory-tools]');
  const grid=document.querySelector('[data-v15-directory-grid]');
  if(!tools||!grid)return;
  const input=tools.querySelector('[data-v15-directory-search]');
  const clear=tools.querySelector('[data-v15-directory-clear]');
  const visible=tools.querySelector('[data-v15-directory-visible]');
  const empty=tools.querySelector('[data-v15-directory-empty]');
  const cards=[...grid.querySelectorAll('.platform-hub-card')];
  const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const apply=()=>{
    const q=norm(input?.value),tokens=q.split(/\s+/).filter(Boolean);let count=0;
    cards.forEach(card=>{const hay=norm(card.textContent),show=!tokens.length||tokens.every(token=>hay.includes(token));card.hidden=!show;if(show)count++;});
    if(visible)visible.textContent=String(count);
    if(clear)clear.hidden=!q;
    if(empty)empty.hidden=count!==0;
  };
  input?.addEventListener('input',apply);
  input?.addEventListener('search',apply);
  clear?.addEventListener('click',()=>{input.value='';apply();input.focus();});
  apply();
})();
