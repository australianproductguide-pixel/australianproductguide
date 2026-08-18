(()=>{
'use strict';
const NEW_MIN=12,LOGIN_MIN=8;
const q=(s,r=document)=>r.querySelector(s);
function setMin(input,min,title){
  if(!input)return;
  if(input.minLength!==min)input.minLength=min;
  if(title&&input.title!==title)input.title=title;
}
function apply(){
  const shell=q('[data-account-shell]');
  if(shell){
    const selected=q('[data-account-tab="signup"][aria-selected="true"]',shell);
    const signup=shell.dataset.mode==='signup'||!!selected;
    setMin(q('[data-account-form] input[name="password"]',shell),signup?NEW_MIN:LOGIN_MIN,signup?'Use at least 12 characters for a new password.':'Enter your account password.');
    setMin(q('[data-password-form] input[name="password"]',shell),NEW_MIN,'Use at least 12 characters for a new password.');
  }
  const profile=q('[data-profile-v24]');
  if(profile){
    setMin(q('[data-profile-password-form] input[name="password"]',profile),NEW_MIN,'Use at least 12 characters for a new password.');
    const note=q('.apg-profile-form-note-v24',profile);
    if(note&&/Use at least \d+ characters\./.test(note.textContent||''))note.textContent='Use at least 12 characters. Australian Product Guide does not store your password in its own database.';
  }
}
let queued=false;
function queueApply(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
document.addEventListener('click',event=>{if(event.target.closest('[data-account-tab]'))setTimeout(apply,0);});
new MutationObserver(queueApply).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-selected','data-mode']});
})();
