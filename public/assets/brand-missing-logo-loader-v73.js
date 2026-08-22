(()=>{
  'use strict';
  const VERSION='73.1';
  const SELECTOR='img[data-apg-missing-logo-target]';

  function shellFor(img){return img.closest('[data-brand-logo-shell]')||img.parentElement;}
  function markLoaded(img){
    img.hidden=false;
    const shell=shellFor(img);
    if(shell){shell.dataset.apgBrandLogoState='loaded';}
  }
  function markFallback(img){
    img.hidden=true;
    const shell=shellFor(img);
    if(shell){shell.dataset.apgBrandLogoState='fallback';}
  }
  function retry(img){
    if(img.dataset.apgMissingLogoRetried==='1')return false;
    img.dataset.apgMissingLogoRetried='1';
    try{
      const u=new URL(img.currentSrc||img.src,window.location.href);
      u.searchParams.set('v',VERSION);
      u.searchParams.set('retry','1');
      img.hidden=false;
      img.src=u.pathname+u.search;
      return true;
    }catch{return false;}
  }
  function hydrate(img){
    if(img.dataset.apgMissingLogoHydrated==='1')return;
    img.dataset.apgMissingLogoHydrated='1';
    img.loading='eager';
    img.decoding='async';
    img.addEventListener('load',()=>{
      if(img.naturalWidth>0&&img.naturalHeight>0)markLoaded(img);
      else if(!retry(img))markFallback(img);
    });
    img.addEventListener('error',()=>{
      if(!retry(img))markFallback(img);
    });
    if(img.complete){
      if(img.naturalWidth>0&&img.naturalHeight>0)markLoaded(img);
      else if(!retry(img))markFallback(img);
    }
  }
  function hydrateAll(){document.querySelectorAll(SELECTOR).forEach(hydrate);}
  hydrateAll();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateAll,{once:true});
  window.addEventListener('beforeprint',()=>{
    document.querySelectorAll(SELECTOR).forEach(img=>{
      img.loading='eager';
      if(img.hidden&&img.dataset.apgMissingLogoRetried!=='1')retry(img);
    });
  });
})();
