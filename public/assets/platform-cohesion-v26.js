(()=>{
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const scoutTrigger=event=>event.target&&event.target.closest?event.target.closest('[data-v26-scout-open]'):null;

  function openScout(trigger){
    const launcher=q('#apgAssistantLauncher');
    const panel=q('#apgAssistantPanel');
    if(!launcher||!panel)return;
    const mobile=q('[data-mobile-toggle][aria-expanded="true"]');
    if(mobile)mobile.click();
    if(panel.hidden){
      if(window.apgScout&&typeof window.apgScout.open==='function'){
        try{void window.apgScout.open();}catch{launcher.click();}
      }else launcher.click();
    }
    window.setTimeout(()=>{
      const current=q('#apgAssistantPanel');
      const focusable=current&&q('input,button,[href],[tabindex]:not([tabindex="-1"])',current);
      if(focusable&&current&&!current.hidden)focusable.focus({preventScroll:true});
    },40);
    if(trigger)trigger.setAttribute('aria-expanded',String(!panel.hidden));
  }

  // The head bootstrap owns Scout activation before deferred/body-end scripts can
  // attach legacy capture handlers. Publish the real opener as soon as this bridge
  // arrives, then honour any tap that the bootstrap safely queued during parsing.
  window.__apgOpenScoutV26=openScout;
  window.__APG_SCOUT_BRIDGE_READY_V26__=true;
  const pendingScout=window.__apgScoutPendingV26;
  if(pendingScout){
    window.__apgScoutPendingV26=null;
    window.setTimeout(()=>openScout(pendingScout),0);
  }

  function labelComparisonTables(){
    let enhanced=false;
    qa('table.compare').forEach(table=>{
      const headers=qa('thead th',table).map(x=>x.textContent.trim());
      if(headers.length<2)return;
      qa('tbody tr',table).forEach(row=>{
        let column=0;
        qa(':scope > td',row).forEach((cell,index)=>{
          const span=Math.max(1,Number(cell.getAttribute('colspan')||1));
          if(index===0)cell.dataset.label=headers[0]||'Decision point';
          else if(span>1)cell.dataset.label='Both products';
          else cell.dataset.label=headers[column]||headers[index]||'Product';
          column+=span;
        });
      });
      table.dataset.v26MobileReady='true';
      enhanced=true;
    });
    if(enhanced)document.body.dataset.v26CompareEnhanced='true';
  }

  function protectExternalLinks(){
    qa('a[target="_blank"]').forEach(link=>{
      const rel=new Set(String(link.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      link.setAttribute('rel',[...rel].join(' '));
    });
  }

  // Full-runtime fallback for documents that pre-date the early head bootstrap.
  // Current pages are intercepted earlier by the first-registered window listener.
  const stopScoutPreactivation=event=>{
    if(!scoutTrigger(event))return;
    event.stopImmediatePropagation();
  };
  ['pointerdown','mousedown','touchstart','pointerup','touchend'].forEach(type=>{
    window.addEventListener(type,stopScoutPreactivation,true);
  });
  window.addEventListener('keydown',event=>{
    if(!scoutTrigger(event)||(event.key!=='Enter'&&event.key!==' '))return;
    event.stopImmediatePropagation();
  },true);
  window.addEventListener('click',event=>{
    const trigger=scoutTrigger(event);
    if(!trigger)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openScout(trigger);
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const panel=q('#apgAssistantPanel');
    if(!panel||panel.hidden)return;
    const close=q('[data-apg-assistant-close]',panel);
    if(close)close.click();
  });

  labelComparisonTables();
  protectExternalLinks();
})();
