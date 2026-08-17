// APG mobile account discoverability + homepage proof hierarchy v20.
// Keeps account actions obvious on mobile and consolidates homepage coverage proof below the hero.
const app=require('./membership-proof-v19');
const {categories,products}=require('../data');
const {brands}=require('./routes');

const CSS='/assets/mobile-account-proof-v20.css?v=20';
const JS='/assets/mobile-account-proof-v20.js?v=20';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function counter(value){return `<span class="apg-counter-v20" aria-label="${esc(value)}">${String(value).split('').map(d=>`<span aria-hidden="true">${esc(d)}</span>`).join('')}</span>`;}
function mobileTopActions(){return `<div class="apg-mobile-member-top-v20" data-apg-member-v20 aria-label="Australian Product Guide account"><a data-v20-login data-signedout-label="Log in" href="/my-apg/?account=login">Log in</a><a class="is-primary" data-v20-join data-signedout-label="Join" href="/my-apg/?account=signup">Join</a></div>`;}
function mobileMenuActions(){return `<section class="apg-mobile-account-v20" data-apg-member-v20 aria-label="Australian Product Guide account options"><span>Your APG account</span><a data-v20-login data-signedout-label="Log in" href="/my-apg/?account=login">Log in</a><a class="is-primary" data-v20-join data-signedout-label="Join free" href="/my-apg/?account=signup">Join free</a></section>`;}
function proofBand(){const p=products.length,c=Object.keys(categories).length,b=brands.length;return `<section class="apg-proof-band-v20" aria-label="Australian Product Guide maintained research coverage"><div class="wrap apg-proof-inner-v20"><span class="apg-proof-kicker-v20">Maintained Australian research</span><div class="apg-proof-main-v20">${counter(p)}<strong>maintained products across ${c} categories</strong></div><span class="apg-proof-trust-v20">${b} brands represented · Affiliate commission never affects recommendations</span></div></section>`;}

function injectMobileAccount(out){
  if(!out.includes('data-apg-member-v20')){
    out=out.replace('<button aria-label="Open navigation menu"',`${mobileTopActions()}<button aria-label="Open navigation menu"`);
    out=out.replace('</form><a class="mobile-power"',`</form>${mobileMenuActions()}<a class="mobile-power"`);
  }
  return out;
}
function reframeHomepage(out,path){
  if(path!=='/')return out;
  out=out.replace(/<section class="apg-proof-band-v19"[\s\S]*?<\/section>/,'');
  out=out.replace(/<section class="apg-home-proof-v9"[\s\S]*?<\/section>/,proofBand());
  out=out.replace(/affiliate economics contribute zero recommendation points/gi,'affiliate commission never affects recommendations');
  return out;
}
function transform(html,path){
  let out=String(html||'');
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  out=injectMobileAccount(out);
  out=reframeHomepage(out,path);
  if(!out.includes(JS))out=out.replace('</body>',`<script src="${JS}" defer></script></body>`);
  return out;
}

module.exports=(req,res)=>{
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,path);
    return end(body,...args);
  };
  return app(req,res);
};
module.exports.transform=transform;
