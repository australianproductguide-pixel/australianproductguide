(()=>{
'use strict';

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileMode=window.matchMedia('(max-width: 780px)');
const rails=[...document.querySelectorAll('[data-apg-proof-rail]')];
const AUTO_DELAY=5000;
const SETTLE_DELAY=140;

function enhance(root){
  const track=root.querySelector('[data-proof-track]');
  const cards=[...root.querySelectorAll('[data-proof-card]')];
  const previous=root.querySelector('[data-proof-prev]');
  const next=root.querySelector('[data-proof-next]');
  const progress=root.querySelector('[data-proof-progress]');
  const current=root.querySelector('[data-proof-current]');
  const total=root.querySelector('[data-proof-total]');
  const dots=[...root.querySelectorAll('[data-proof-dot]')];
  if(!track||!cards.length||!previous||!next)return;

  let frame=0;
  let autoplayTimer=0;
  let settleTimer=0;
  let railVisible=true;
  let interacting=false;
  let normalising=false;
  let logicalIndexState=0;

  if(total)total.textContent=String(cards.length);

  const behaviour=()=>reduceMotion.matches?'auto':'smooth';
  const step=()=>{
    if(cards.length>1){
      const measured=cards[1].offsetLeft-cards[0].offsetLeft;
      if(measured>0)return measured;
    }
    return cards[0].getBoundingClientRect().width;
  };
  const originalStart=()=>cards[0].offsetLeft-track.offsetLeft;
  const cycleWidth=()=>step()*cards.length;
  const normaliseIndex=value=>((value%cards.length)+cards.length)%cards.length;
  const activeIndex=()=>{
    const cardStep=step();
    if(cardStep<=0)return logicalIndexState;
    return normaliseIndex(Math.round((track.scrollLeft-originalStart())/cardStep));
  };
  const scrollToLogical=(index,mode=behaviour())=>{
    const target=originalStart()+(normaliseIndex(index)*step());
    track.scrollTo({left:target,top:0,behavior:mode});
  };

  const makeClone=(card,position,index)=>{
    const clone=card.cloneNode(true);
    clone.removeAttribute('data-proof-card');
    clone.setAttribute('data-proof-clone',position);
    clone.setAttribute('data-proof-logical-index',String(index));
    clone.setAttribute('aria-hidden','true');
    clone.setAttribute('role','presentation');
    clone.removeAttribute('aria-label');
    clone.tabIndex=-1;
    return clone;
  };

  const before=cards.map((card,index)=>makeClone(card,'before',index));
  const after=cards.map((card,index)=>makeClone(card,'after',index));
  track.prepend(...before);
  track.append(...after);
  track.scrollTo({left:originalStart(),top:0,behavior:'auto'});

  const update=()=>{
    frame=0;
    const index=activeIndex();
    logicalIndexState=index;
    previous.disabled=false;
    next.disabled=false;
    previous.setAttribute('aria-disabled','false');
    next.setAttribute('aria-disabled','false');
    if(current)current.textContent=String(index+1);
    dots.forEach((dot,dotIndex)=>dot.classList.toggle('is-active',dotIndex===index));
    if(progress)progress.setAttribute('aria-label',`Proof ${index+1} of ${cards.length}`);
  };
  const requestUpdate=()=>{ if(!frame)frame=requestAnimationFrame(update); };

  const normaliseLoop=()=>{
    if(normalising)return;
    const cardStep=step();
    const width=cycleWidth();
    const start=originalStart();
    if(cardStep<=0||width<=0)return;
    const left=track.scrollLeft;
    let target=null;
    if(left<start-(cardStep*.5))target=left+width;
    else if(left>=start+width-(cardStep*.5))target=left-width;
    if(target===null)return;
    normalising=true;
    track.scrollTo({left:target,top:0,behavior:'auto'});
    requestAnimationFrame(()=>{ normalising=false; requestUpdate(); });
  };
  const scheduleNormalise=()=>{
    if(settleTimer)clearTimeout(settleTimer);
    settleTimer=window.setTimeout(normaliseLoop,SETTLE_DELAY);
  };
  const move=direction=>{
    track.scrollBy({left:direction*step(),top:0,behavior:behaviour()});
    requestUpdate();
    scheduleNormalise();
  };

  const clearAutoplay=()=>{
    if(autoplayTimer){ clearTimeout(autoplayTimer); autoplayTimer=0; }
  };
  const autoplayEligible=()=>mobileMode.matches&&!reduceMotion.matches&&railVisible&&!interacting&&document.visibilityState!=='hidden';
  const scheduleAutoplay=()=>{
    clearAutoplay();
    if(!autoplayEligible())return;
    autoplayTimer=window.setTimeout(()=>{
      autoplayTimer=0;
      move(1);
      scheduleAutoplay();
    },AUTO_DELAY);
  };
  const manualMove=direction=>{
    clearAutoplay();
    move(direction);
    scheduleAutoplay();
  };

  previous.addEventListener('click',()=>manualMove(-1));
  next.addEventListener('click',()=>manualMove(1));

  track.addEventListener('scroll',()=>{
    requestUpdate();
    scheduleNormalise();
  },{passive:true});
  if('onscrollend' in track)track.addEventListener('scrollend',normaliseLoop,{passive:true});

  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){
      event.preventDefault();
      manualMove(-1);
    }else if(event.key==='ArrowRight'){
      event.preventDefault();
      manualMove(1);
    }else if(event.key==='Home'){
      event.preventDefault();
      clearAutoplay();
      scrollToLogical(0);
      scheduleAutoplay();
    }else if(event.key==='End'){
      event.preventDefault();
      clearAutoplay();
      scrollToLogical(cards.length-1);
      scheduleAutoplay();
    }
  });

  root.addEventListener('pointerenter',()=>{ interacting=true; clearAutoplay(); });
  root.addEventListener('pointerleave',()=>{ interacting=false; scheduleAutoplay(); });
  root.addEventListener('focusin',()=>{ interacting=true; clearAutoplay(); });
  root.addEventListener('focusout',event=>{
    if(root.contains(event.relatedTarget))return;
    interacting=false;
    scheduleAutoplay();
  });
  track.addEventListener('touchstart',()=>{ interacting=true; clearAutoplay(); },{passive:true});
  track.addEventListener('touchend',()=>{
    interacting=false;
    scheduleNormalise();
    scheduleAutoplay();
  },{passive:true});
  track.addEventListener('touchcancel',()=>{
    interacting=false;
    scheduleNormalise();
    scheduleAutoplay();
  },{passive:true});

  if('IntersectionObserver' in window){
    const visibilityObserver=new IntersectionObserver(entries=>{
      const entry=entries[0];
      railVisible=Boolean(entry&&entry.isIntersecting&&entry.intersectionRatio>=0.25);
      scheduleAutoplay();
    },{threshold:[0,0.25,0.5,1]});
    visibilityObserver.observe(root);
  }

  document.addEventListener('visibilitychange',scheduleAutoplay);
  if(typeof reduceMotion.addEventListener==='function')reduceMotion.addEventListener('change',scheduleAutoplay);
  if(typeof mobileMode.addEventListener==='function')mobileMode.addEventListener('change',scheduleAutoplay);

  const realign=()=>{
    track.scrollTo({left:originalStart()+(logicalIndexState*step()),top:0,behavior:'auto'});
    requestUpdate();
  };
  if('ResizeObserver' in window){
    const observer=new ResizeObserver(realign);
    observer.observe(track);
  }else{
    window.addEventListener('resize',realign,{passive:true});
  }

  root.dataset.proofEnhanced='true';
  root.dataset.proofLoop='seamless';
  update();
  scheduleAutoplay();
}

rails.forEach(enhance);
})();
