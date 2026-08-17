const base=require('./scout-v4');
const {mascot}=require('./scout-v13');

const marker="const state={busy:false,last:null,decisionState:null,budget:null,category:null};";
const mascotInit=`${marker}const scoutMascot=${JSON.stringify(mascot)};const launcherIcon=launcher.querySelector('.apg-assistant-launcher-icon');if(launcherIcon)launcherIcon.innerHTML=scoutMascot;const launcherCopy=launcher.querySelector('.apg-assistant-launcher-copy');if(launcherCopy)launcherCopy.innerHTML='<strong>Ask Scout</strong><small>What should I buy?</small>';const avatar=panel.querySelector('.apg-assistant-avatar');if(avatar)avatar.innerHTML=scoutMascot;`;
let js=String(base.js||'');
if(!js.includes(marker))throw new Error('Scout state marker changed; review mascot integration before release.');
js=js.replace(marker,mascotInit);
const botMarker=`function bot(t){return '<div class="scout-row"><div class="scout-bubble">'+t+'</div></div>'}`;
if(!js.includes(botMarker))throw new Error('Scout bot marker changed; review mascot integration before release.');
js=js.replace(botMarker,`function bot(t){return '<div class="scout-row"><span class="scout-mini" aria-hidden="true">'+scoutMascot+'</span><div class="scout-bubble">'+t+'</div></div>'}`);
module.exports={js,mascot};
