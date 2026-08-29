(()=>{
'use strict';
// APG Account Journey v24.2 — validation-only companion for the consolidated My APG v123 flow.
// account-platform.js remains the sole login/signup mode and authentication state owner.
const q=(s,r=document)=>r.querySelector(s);

function setMessage(root,text){
  const el=q('[data-account-message]',root);if(!el)return;
  el.textContent=text||'';el.classList.toggle('is-error',!!text);
}
function enhanceForm(root){
  const form=q('[data-account-form]',root);if(!form)return;
  if(!q('[data-v242-confirm]',form)){
    const password=q('input[name="password"]',form),label=password?.closest('label');
    if(label)label.insertAdjacentHTML('afterend','<label data-v242-confirm hidden>Confirm password<input type="password" name="confirm_password" autocomplete="new-password" minlength="12" maxlength="200"></label>');
  }
  if(!q('[data-v242-account-terms]',form)){
    const actions=q('.apg-account-form-actions',form);
    if(actions)actions.insertAdjacentHTML('beforebegin','<p class="apg-account-note full" data-v242-account-terms hidden>By creating an account, you agree to the <a href="/terms/">Terms of use</a> and acknowledge the <a href="/privacy/">Privacy Policy</a>. Your Australian Consumer Law rights are not limited.</p>');
  }
  updateMode(root);
}
function updateMode(root){
  const signup=root.dataset.mode==='signup';
  const confirm=q('[data-v242-confirm]',root),terms=q('[data-v242-account-terms]',root),input=q('[data-v242-confirm] input',root);
  if(confirm)confirm.hidden=!signup;
  if(terms)terms.hidden=!signup;
  if(input){input.required=signup;if(!signup)input.value='';}
}
function validateSignup(root,event){
  if(root.dataset.mode!=='signup')return;
  const form=event.target;
  if(!form.matches('[data-account-form]'))return;
  const password=q('input[name="password"]',form)?.value||'';
  const confirm=q('input[name="confirm_password"]',form)?.value||'';
  const strong=password.length>=12&&/[a-z]/.test(password)&&/[A-Z]/.test(password)&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password);
  if(!strong){
    event.preventDefault();event.stopPropagation();
    setMessage(root,'Use at least 12 characters, including uppercase, lowercase, a number and a symbol.');
    q('input[name="password"]',form)?.focus();return;
  }
  if(password!==confirm){
    event.preventDefault();event.stopPropagation();
    setMessage(root,'Passwords do not match. Please enter the same password twice.');
    q('input[name="confirm_password"]',form)?.focus();
  }
}
function bind(root){
  root.addEventListener('click',event=>{
    if(event.target.closest('[data-account-tab]'))setTimeout(()=>updateMode(root),0);
  });
  root.addEventListener('submit',event=>validateSignup(root,event),true);
  const observer=new MutationObserver(()=>updateMode(root));
  observer.observe(root,{attributes:true,attributeFilter:['data-mode']});
}
function start(){
  let tries=0;const timer=setInterval(()=>{
    const root=q('[data-account-shell]');
    if(!root){if(++tries>100)clearInterval(timer);return;}
    clearInterval(timer);enhanceForm(root);bind(root);
  },40);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
