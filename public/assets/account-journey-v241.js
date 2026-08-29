(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s);

function loadConsolidatedV124(){
  if(location.pathname!=='/my-apg/'||document.querySelector('[data-apg-my-apg-v124-loader]'))return;
  const marker=document.createElement('meta');marker.dataset.apgMyApgV124Loader='true';marker.content='124.0';document.head.appendChild(marker);
  if(!document.querySelector('link[href^="/assets/my-apg-account-v124.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/my-apg-account-v124.css?v=124.0';document.head.appendChild(link);
  }
  if(!document.querySelector('script[src^="/assets/my-apg-account-v124.js"]')){
    const script=document.createElement('script');script.src='/assets/my-apg-account-v124.js?v=124.0';script.async=false;document.head.appendChild(script);
  }
}
loadConsolidatedV124();

function setMessage(root,text){
  const el=q('[data-account-message]',root);if(!el)return;
  el.textContent=text||'';el.classList.toggle('is-error',!!text);
}
function requestedMode(){
  try{const v=new URLSearchParams(location.search).get('account');return v==='signup'||v==='login'?v:''}catch{return ''}
}
function clearAccountParam(){
  try{const u=new URL(location.href);if(!u.searchParams.has('account'))return;u.searchParams.delete('account');history.replaceState(null,'',u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'')+u.hash)}catch{}
}
function enhanceForm(root){
  const form=q('[data-account-form]',root);if(!form)return;
  if(!q('[data-v241-confirm]',form)){
    const password=q('input[name="password"]',form),label=password?.closest('label');
    if(label)label.insertAdjacentHTML('afterend','<label data-v241-confirm hidden>Confirm password<input type="password" name="confirm_password" autocomplete="new-password" minlength="8"></label>');
  }
  if(!q('[data-v241-account-terms]',form)){
    const actions=q('.apg-account-form-actions',form);
    if(actions)actions.insertAdjacentHTML('beforebegin','<p class="apg-account-note full" data-v241-account-terms hidden>By creating an account, you agree to the <a href="/terms/">Terms of use</a> and acknowledge the <a href="/privacy/">Privacy Policy</a>. Your Australian Consumer Law rights are not limited.</p>');
  }
  updateMode(root);
}
function updateMode(root){
  const signup=root.dataset.mode==='signup';
  const confirm=q('[data-v241-confirm]',root),terms=q('[data-v241-account-terms]',root),input=q('[data-v241-confirm] input',root);
  if(confirm)confirm.hidden=!signup;if(terms)terms.hidden=!signup;
  if(input){input.required=signup;if(!signup)input.value='';}
}
function activateRequestedMode(root){
  const mode=requestedMode();if(!mode)return;
  const button=q(`[data-account-tab="${mode}"]`,root);if(button){button.click();updateMode(root);setTimeout(()=>q('[data-account-form] input[name="email"]',root)?.focus(),0)}
  clearAccountParam();
}
function bind(root){
  root.addEventListener('click',event=>{if(event.target.closest('[data-account-tab]'))setTimeout(()=>updateMode(root),0)});
  root.addEventListener('submit',event=>{
    if(!event.target.matches('[data-account-form]')||root.dataset.mode!=='signup')return;
    const password=q('input[name="password"]',event.target)?.value||'',confirm=q('input[name="confirm_password"]',event.target)?.value||'';
    if(password!==confirm){event.preventDefault();event.stopPropagation();setMessage(root,'Passwords do not match. Please enter the same password twice.');q('input[name="confirm_password"]',event.target)?.focus();return;}
    if(password.length<8){event.preventDefault();event.stopPropagation();setMessage(root,'Use a password of at least 8 characters.');q('input[name="password"]',event.target)?.focus();}
  },true);
}
function start(){
  let tries=0;const timer=setInterval(()=>{
    const root=q('[data-account-shell]');
    if(!root){if(++tries>100)clearInterval(timer);return;}
    clearInterval(timer);enhanceForm(root);bind(root);activateRequestedMode(root);
  },40);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
