(()=>{
'use strict';

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const rails=[...document.querySelectorAll('[data-apg-proof-rail]')];

function enhance(root){
  const track=root.querySelector('[data-proof-track]');
  const cards=[...root.querySelectorAll('[data-proof-card]')];
  const previous=root.querySelector('[data-proof-prev]');
  const next=root.querySelector('[data-proof-next]');
  const progress=root.querySelector('[data-proof-progress]');
  const current=root.querySelector('[data-proof-current]');
  const total=root.querySelector('[data-proof-total]');
  if(!track||!cards.length||!previous||!next)return;

  let frame=0;
  if(total)total.textContent=String(cards.length);

  const behaviour=()=>reduceMotion.matches?'auto':'smooth';
  const maxScroll=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const activeIndex=()=>{
    const left=track.scrollLeft;
    let best=0;
    let distance=Infinity;
    cards.forEach((card,index)=>{
      const delta=Math.abs(card.offsetLeft-track.offsetLeft-left);
      if(delta<distance){distance=delta;best=index;}
    });
    return best;
  };
  const step=()=>{
    if(cards.length>1){
      const measured=cards[1].offsetLeft-cards[0].offsetLeft;
      if(measured>0)return measured;
    }
    return cards[0].getBoundingClientRect().width;
  };
  const update=()=>{
    frame=0;
    const index=activeIndex();
    const max=maxScroll();
    const atStart=track.scrollLeft<=2;
    const atEnd=track.scrollLeft>=max-2;
    previous.disabled=atStart;
    next.disabled=atEnd;
    previous.setAttribute('aria-disabled',String(atStart));
    next.setAttribute('aria-disabled',String(atEnd));
    if(current)current.textContent=String(index+1);
    if(progress)progress.setAttribute('aria-label',`Proof ${index+1} of ${cards.length}`);
  };
  const requestUpdate=()=>{
    if(!frame)frame=requestAnimationFrame(update);
  };
  const move=direction=>{
    track.scrollBy({left:direction*step(),top:0,behavior:behaviour()});
    requestUpdate();
  };
  const moveTo=edge=>{
    const left=edge==='end'?maxScroll():0;
    track.scrollTo({left,top:0,behavior:behaviour()});
    requestUpdate();
  };

  previous.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  track.addEventListener('scroll',requestUpdate,{passive:true});
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){
      event.preventDefault();
      move(-1);
    }else if(event.key==='ArrowRight'){
      event.preventDefault();
      move(1);
    }else if(event.key==='Home'){
      event.preventDefault();
      moveTo('start');
    }else if(event.key==='End'){
      event.preventDefault();
      moveTo('end');
    }
  });

  if('ResizeObserver' in window){
    const observer=new ResizeObserver(requestUpdate);
    observer.observe(track);
  }else{
    window.addEventListener('resize',requestUpdate,{passive:true});
  }

  root.dataset.proofEnhanced='true';
  update();
}

rails.forEach(enhance);
})();
