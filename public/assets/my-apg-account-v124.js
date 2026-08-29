(()=>{
'use strict';
const VERSION='124.0';
if(window.__APG_MY_APG_CONSOLIDATED_V124__||location.pathname!=='/my-apg/')return;
window.__APG_MY_APG_CONSOLIDATED_V124__=VERSION;
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

function intro(){
  const node=document.createElement('div');
  node.className='apg-my-apg-entry-v124';
  node.dataset.apgMyApgIntro='v124';
  node.innerHTML=`<div class="apg-my-apg-entry-inner-v124">
    <nav class="apg-my-apg-crumbs-v124" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">My Australian Product Guide</span></nav>
    <div class="apg-my-apg-intro-v124">
      <p class="kicker">My Australian Product Guide</p>
      <h1>Your account and product workspace.</h1>
      <p>Sign in or create one optional account to sync selected saved products, comparisons and decision research across devices. You can still use APG locally without an account.</p>
      <div class="apg-my-apg-trust-v124" aria-label="Account principles"><span>Account optional</span><span>Protected cross-device sync</span><span>Deletion available</span></div>
    </div>
  </div>`;
  return node;
}
function privacy(){
  const p=document.createElement('p');
  p.className='apg-my-apg-privacy-v124';
  p.dataset.apgMyApgPrivacy='v124';
  p.innerHTML='Signed-out research remains on this browser. Account status and email preferences contribute zero points to product recommendations or retailer ranking. <a href="/privacy/">Privacy</a>';
  return p;
}
function workspaceHeading(){
  const node=document.createElement('div');
  node.className='apg-my-apg-workspace-head-v124';
  node.dataset.apgMyApgWorkspaceHead='v124';
  node.innerHTML='<p class="kicker">Your workspace</p><h2>Continue your product research</h2><p>Saved and recent research on this browser remains available whether or not you create an account.</p>';
  return node;
}
function removeLegacy(root){qa('[data-account-panel]',root).forEach(el=>el.remove());}
function removeOldIntro(main){
  qa(':scope > .section',main).forEach(section=>{if(section.querySelector('.v5-account-status'))section.remove()});
  qa(':scope > .wrap',main).forEach(wrap=>{if(wrap.querySelector('.crumbs')&&!wrap.closest('[data-apg-workspace]'))wrap.remove()});
  qa(':scope > .decision-hero.workspace-hero',main).forEach(el=>el.remove());
}
function consolidate(){
  const main=q('main#main')||q('main');
  const root=q('[data-apg-workspace]');
  if(!main||!root)return false;

  // Fail safe: do not alter the current working page until the existing server-mediated
  // account shell has initialised. If account-platform never loads, v124 leaves today's
  // My APG presentation untouched rather than creating a partial account experience.
  const shell=q('[data-account-shell]',root);
  if(!shell)return false;

  document.body.dataset.apgMyApgConsolidated=VERSION;
  removeOldIntro(main);
  removeLegacy(root);

  const section=root.closest('section.section')||root.parentElement;
  if(section&&section.parentElement===main&&main.firstElementChild!==section)main.insertBefore(section,main.firstElementChild);

  let introNode=q('[data-apg-my-apg-intro]',root);
  if(!introNode){introNode=intro();root.insertBefore(introNode,root.firstChild)}
  if(introNode.nextElementSibling!==shell)root.insertBefore(shell,introNode.nextElementSibling);

  const rail=q('.apg-system-rail');
  if(rail&&rail.parentElement!==root)root.insertBefore(rail,shell.nextElementSibling);

  let privacyNode=q('[data-apg-my-apg-privacy]',root);
  if(!privacyNode){privacyNode=privacy();root.insertBefore(privacyNode,shell.nextElementSibling)}
  if(privacyNode.previousElementSibling!==shell)root.insertBefore(privacyNode,shell.nextElementSibling);
  if(rail&&rail.previousElementSibling!==privacyNode)root.insertBefore(rail,privacyNode.nextElementSibling);

  let heading=q('[data-apg-my-apg-workspace-head]',root);
  if(!heading){heading=workspaceHeading();const grid=q('.workspace-grid',root);if(grid)root.insertBefore(heading,grid);else root.appendChild(heading)}

  root.dataset.apgAccountSurface='single';
  return true;
}
function start(){
  if(consolidate())return;
  const root=q('[data-apg-workspace]')||document.documentElement;
  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;scheduled=true;
    queueMicrotask(()=>{scheduled=false;if(consolidate())observer.disconnect()});
  });
  observer.observe(root,{childList:true,subtree:true});
  setTimeout(()=>{consolidate();observer.disconnect()},8000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
