// APG membership actions + truthful homepage proof band v19.
// Uses maintained catalogue counts only. It must not imply unmeasured customers, sales or decisions assisted.
const app=require('./homepage-decision-badge-v18');
const {categories,products}=require('../data');

const CSS='/assets/membership-proof-v19.css?v=19';
const JS='/assets/membership-proof-v19.js?v=19';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function memberActions(){return `<div class="apg-member-actions-v19" data-apg-member-actions-v19 aria-label="Australian Product Guide account"><a class="apg-member-login-v19" data-v19-login href="/my-apg/?account=login">Log in</a><a class="apg-member-join-v19" data-v19-join href="/my-apg/?account=signup">Join free</a></div>`;}
function counter(value){return `<span class="apg-counter-v19" aria-label="${esc(value)}">${String(value).split('').map(d=>`<span aria-hidden="true">${esc(d)}</span>`).join('')}</span>`;}
function proofBand(){const productCount=products.length,categoryCount=Object.keys(categories).length;return `<section class="apg-proof-band-v19" aria-label="Australian Product Guide maintained catalogue coverage"><div class="wrap apg-proof-band-inner-v19"><span class="apg-proof-spark-v19" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 34 27 46 50 18"/><path d="M14 14h16M14 22h10M39 44h11"/></svg></span><div class="apg-proof-copy-v19"><strong>Australian buying research, built to help you choose with confidence.</strong>${counter(productCount)}<span>maintained products across <strong>${categoryCount} categories</strong></span><small class="apg-proof-sub-v19">Evidence-led · Australian context · affiliate economics contribute zero recommendation points</small></div></div></section>`;}
function injectHeaderActions(out){if(out.includes('data-apg-member-actions-v19'))return out;const re=/<a class="header-action apg-workspace-link"[\s\S]*?<\/a>/;return re.test(out)?out.replace(re,memberActions()):out;}
function transform(html,path){let out=String(html||'');if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);out=injectHeaderActions(out);if(path==='/'&&!out.includes('apg-proof-band-v19'))out=out.replace('</header>',`</header>${proofBand()}`);if(!out.includes(JS))out=out.replace('</body>',`<script src="${JS}" defer></script></body>`);return out;}

module.exports=(req,res)=>{let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,path);return end(body,...args);};return app(req,res);};
module.exports.transform=transform;
