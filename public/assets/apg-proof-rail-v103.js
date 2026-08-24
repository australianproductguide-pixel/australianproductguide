(()=>{
'use strict';

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileMode=window.matchMedia('(max-width: 780px)');
const rails=[...document.querySelectorAll('[data-apg-proof-rail]')];
const AUTO_DELAY=5000;
const SWIPE_THRESHOLD=42;

function enhance(root){
  const track=root.querySelector('[data-proof-track]');
  const cards=[...root.querySelectorAll('[data-proof-card]')];
  const previous=root.querySelector('[data-proof-prev]');
  const next=root.querySelector('[data-proof-next]');
  const progress=root.querySelector('[data-proof-progress]');
  const current=root.querySelector('[data-proof-current]');
  const total=root.querySelector('[data-proof-total]');
  const dots=[...root.querySelectorAll('[data-proof-dot]')];
  const autoplayToggle=root.querySelector('[data-proof-autoplay-toggle]');
  if(!track||!cards.length||!previous||!next)return;

  let frame=0;
  let autoplayTimer=0;
  let autoplayPaused=false;
  let railVisible=true;
  let interacting=false;
  let touchStartX=null;
  let touchStartedAtStart=false;
  let touchStartedAtEnd=false;

  if(total)total.textContent=String(cards.length);

  const behaviour=()=>reduceMotion.matches?'auto':'smooth';
  const maxScroll=()=>Math.max(0,track.scrollWidth-track.clientWidth);
  const atStart=()=>track.scrollLeft<=2;
  const atEnd=()=>track.scrollLeft>=maxScroll()-2;
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
  const updateAutoplayControl=()=>{
    if(!autoplayToggle)return;
    const eligibleMode=mobileMode.matches&&!reduceMotion.matches;
    autoplayToggle.hidden=!eligibleMode;
    autoplayToggle.classList.toggle('is-paused',autoplayPaused);
    autoplayToggle.setAttribute('aria-pressed',String(autoplayPaused));
    autoplayToggle.setAttribute('aria-label',autoplayPaused?'Resume automatic proof rotation':'Pause automatic proof rotation');
  };
  const update=()=>{
    frame=0;
    const index=activeIndex();
    previous.disabled=false;
    next.disabled=false;
    previous.setAttribute('aria-disabled','false');
    next.setAttribute('aria-disabled','false');
    if(current)current.textContent=String(index+1);
    dots.forEach((dot,dotIndex)=>dot.classList.toggle('is-active',dotIndex===index));
    if(progress)progress.setAttribute('aria-label',`Proof ${index+1} of ${cards.length}`);
  };
  const requestUpdate=()=>{
    if(!frame)frame=requestAnimationFrame(update);
  };
  const moveTo=edge=>{
    const left=edge==='end'?maxScroll():0;
    track.scrollTo({left,top:0,behavior:behaviour()});
    requestUpdate();
  };
  const move=direction=>{
    if(direction>0&&atEnd()){
      moveTo('start');
      return;
    }
    if(direction<0&&atStart()){
      moveTo('end');
      return;
    }
    track.scrollBy({left:direction*step(),top:0,behavior:behaviour()});
    requestUpdate();
  };

  const clearAutoplay=()=>{
    if(autoplayTimer){
      clearTimeout(autoplayTimer);
      autoplayTimer=0;
    }
  };
  const autoplayEligible=()=>mobileMode.matches&&!reduceMotion.matches&&!autoplayPaused&&railVisible&&!interacting&&document.visibilityState!=='hidden';
  const scheduleAutoplay=()=>{
    clearAutoplay();
    updateAutoplayControl();
    if(!autoplayEligible())return;
    autoplayTimer=window.setTimeout(()=>{
      autoplayTimer=0;
      move(1);
      scheduleAutoplay();
    },AUTO_DELAY);
  };
  const resetAutoplay=()=>{
    clearAutoplay();
    scheduleAutoplay();
  };

  previous.addEventListener('click',()=>{
    move(-1);
    resetAutoplay();
  });
  next.addEventListener('click',()=>{
    move(1);
    resetAutoplay();
  });
  if(autoplayToggle){
    autoplayToggle.addEventListener('click',()=>{
      autoplayPaused=!autoplayPaused;
      scheduleAutoplay();
    });
  }

  track.addEventListener('scroll',requestUpdate,{passive:true});
  track.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){
      event.preventDefault();
      move(-1);
      resetAutoplay();
    }else if(event.key==='ArrowRight'){
      event.preventDefault();
      move(1);
      resetAutoplay();
    }else if(event.key==='Home'){
      event.preventDefault();
      moveTo('start');
      resetAutoplay();
    }else if(event.key==='End'){
      event.preventDefault();
      moveTo('end');
      resetAutoplay();
    }
  });

  root.addEventListener('pointerenter',()=>{
    interacting=true;
    clearAutoplay();
  });
  root.addEventListener('pointerleave',()=>{
    interacting=false;
    scheduleAutoplay();
  });
  root.addEventListener('focusin',()=>{
    interacting=true;
    clearAutoplay();
  });
  root.addEventListener('focusout',event=>{
    if(root.contains(event.relatedTarget))return;
    interacting=false;
    scheduleAutoplay();
  });

  track.addEventListener('touchstart',event=>{
    if(!event.touches||!event.touches.length)return;
    interacting=true;
    clearAutoplay();
    touchStartX=event.touches[0].clientX;
    touchStartedAtStart=atStart();
    touchStartedAtEnd=atEnd();
  },{passive:true});
  track.addEventListener('touchend',event=>{
    const touch=event.changedTouches&&event.changedTouches[0];
    if(touch&&touchStartX!==null){
      const delta=touch.clientX-touchStartX;
      if(touchStartedAtEnd&&delta<=-SWIPE_THRESHOLD){
        moveTo('start');
      }else if(touchStartedAtStart&&delta>=SWIPE_THRESHOLD){
        moveTo('end');
      }
    }
    touchStartX=null;
    touchStartedAtStart=false;
    touchStartedAtEnd=false;
    interacting=false;
    scheduleAutoplay();
  },{passive:true});
  track.addEventListener('touchcancel',()=>{
    touchStartX=null;
    touchStartedAtStart=false;
    touchStartedAtEnd=false;
    interacting=false;
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

  if('ResizeObserver' in window){
    const observer=new ResizeObserver(()=>{
      requestUpdate();
      scheduleAutoplay();
    });
    observer.observe(track);
  }else{
    window.addEventListener('resize',()=>{
      requestUpdate();
      scheduleAutoplay();
    },{passive:true});
  }

  root.dataset.proofEnhanced='true';
  update();
  scheduleAutoplay();
}

rails.forEach(enhance);
})();
