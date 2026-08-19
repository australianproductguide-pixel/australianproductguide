'use strict';
const VERSION='5.0';
const js=String.raw`(()=>{
'use strict';
if(window.__apgScoutSessionGuardV5)return;window.__apgScoutSessionGuardV5=true;
let sessionChanged=false;
const guarded=/\/api\/account\/(?:login|logout|session|delete)(?:\?|$)/;
const clearScout=()=>{
  sessionChanged=true;
  try{sessionStorage.removeItem('apg_scout_v5_state')}catch{}
  const panel=document.getElementById('apgAssistantPanel'),body=document.getElementById('apgAssistantBody'),launcher=document.getElementById('apgAssistantLauncher');
  if(body)body.replaceChildren();
  if(panel)panel.hidden=true;
  if(launcher)launcher.setAttribute('aria-expanded','false');
  document.body.classList.remove('scout-v5-open');
};
const originalFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const response=await originalFetch(input,init);
  try{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(response.ok&&guarded.test(new URL(url,location.origin).pathname))clearScout();
  }catch{}
  return response;
};
window.addEventListener('apg-workspace-synced',clearScout);
document.addEventListener('click',event=>{
  const launcher=event.target.closest&&event.target.closest('#apgAssistantLauncher');
  if(!launcher||!sessionChanged)return;
  event.preventDefault();event.stopImmediatePropagation();
  location.reload();
},true);
})();`;
module.exports={VERSION,js};
