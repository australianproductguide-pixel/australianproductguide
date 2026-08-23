(()=>{
'use strict';
if(window.__APG_FOOTER_NAVIGATION_V83__)return;
window.__APG_FOOTER_NAVIGATION_V83__='83.2';

function init(){
  const footer=document.querySelector('.apg-footer-v11');
  const launcher=document.getElementById('apgAssistantLauncher');
  if(!footer||!launcher)return;

  const apply=visible=>{
    launcher.classList.toggle('apg-footer-overlap-guard',!!visible);
  };

  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      apply(entries.some(entry=>entry.isIntersecting));
    },{root:null,threshold:0});
    observer.observe(footer);
    return;
  }

  let scheduled=false;
  const check=()=>{
    scheduled=false;
    const rect=footer.getBoundingClientRect();
    apply(rect.bottom>0&&rect.top<window.innerHeight);
  };
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(check);
  };
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  check();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
