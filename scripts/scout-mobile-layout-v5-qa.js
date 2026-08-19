const assert=require('assert');
const runtime=require('../lib/scout-concierge-v5-runtime');

const clientJs=runtime.patchClientJs(runtime.client.js);
const clientCss=runtime.patchClientCss(runtime.client.css+'\n'+runtime.brand.css);

assert(!clientJs.includes("panel.querySelector('.apg-assistant-brand span:last-child')"),'Scout must not target a nested avatar span when updating brand copy');
assert(clientJs.includes("panel.querySelector('.apg-assistant-brand > span:last-child')"),'Scout brand copy must target only the direct text child, preserving the illustrated avatar');
assert(clientCss.includes('Scout v5 mobile open-state repair'),'mobile Scout repair CSS must be present in the served bundle');
assert(/@media\(max-width:640px\)[\s\S]*\.apg-assistant-panel\{[\s\S]*position:fixed!important;[\s\S]*inset:0!important;[\s\S]*z-index:1000!important;/m.test(clientCss),'mobile Scout panel must cover the site header in its own top-level stacking layer');
assert(clientCss.includes('.apg-assistant-brand>span:last-child'),'mobile Scout must retain a dedicated brand-copy column beside the avatar');
assert(clientCss.includes('flex:0 0 42px!important'),'mobile Scout avatar must keep a stable non-collapsing width');
assert(clientCss.includes('.scout-v5-composer'),'mobile Scout composer must remain a first-class fixed layout region');

console.log('APG Scout mobile layout v5 QA passed');
