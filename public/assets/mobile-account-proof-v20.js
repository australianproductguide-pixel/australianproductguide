(()=>{
const all=(s,r=document)=>[...r.querySelectorAll(s)];
async function state(){try{const r=await fetch('/api/account/me',{credentials:'same-origin',headers:{Accept:'application/json'}});return r.ok?await r.json():{authenticated:false};}catch{return {authenticated:false}}}
function apply(root,s){const login=root.querySelector('[data-v20-login]'),join=root.querySelector('[data-v20-join]');if(!login||!join)return;if(s.authenticated){login.textContent='My APG';login.href='/my-apg/';join.textContent='Sign out';join.href='#';join.dataset.v20Signout='true';join.classList.remove('is-primary');}else{login.textContent=login.dataset.signedoutLabel||'Log in';login.href='/my-apg/?account=login';join.textContent=join.dataset.signedoutLabel||'Join free';join.href='/my-apg/?account=signup';join.classList.add('is-primary');delete join.dataset.v20Signout;}}
async function update(){const s=await state();all('[data-apg-member-v20]').forEach(r=>apply(r,s));}
document.addEventListener('click',async e=>{const a=e.target.closest('[data-v20-signout]');if(!a)return;e.preventDefault();a.setAttribute('aria-busy','true');try{await fetch('/api/account/logout',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});location.href='/';}catch{a.removeAttribute('aria-busy');}});
update();
})();
