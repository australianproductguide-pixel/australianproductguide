'use strict';

// APG Desktop Header Search v122.7
// Presentation + same-origin autocomplete preview only. Search v52 remains authoritative
// for ranking, full results, query handling and zero-result behaviour. Category selection
// only scopes the preview list; it does not change recommendation scoring.
const VERSION='122.7';
const CSS_PATH='/assets/header-desktop-search-v1227.css';
const JS_PATH='/assets/header-desktop-search-v1227.js';

const CSS=String.raw`
/* APG Desktop Header Search v122.7 */
@media(min-width:921px){
  /* Homepage already has a persistent masthead Search. Keep the hero focused on decisions. */
  body[data-apg-route-family="home"] main#main .apg-home-search-v9{display:none!important}

  /* Preserve the category selector on the left while making the control read as one field. */
  .site-header .header-search .global-search{
    min-height:52px!important;
    height:52px!important;
    padding:0!important;
    gap:0!important;
    overflow:visible!important;
    border:0!important;
    border-radius:11px!important;
    background:#fff!important;
    box-shadow:none!important;
    align-items:stretch!important;
  }
  .site-header .header-search .global-search:focus-within{border:0!important;box-shadow:none!important}
  .site-header .header-search .global-search>.apg-search-category{
    flex:0 0 auto!important;
    min-width:64px!important;
    max-width:132px!important;
    height:52px!important;
    margin:0!important;
    padding:0 28px 0 12px!important;
    border:0!important;
    border-right:1px solid #D7DEE8!important;
    border-radius:11px 0 0 11px!important;
    outline:0!important;
    background:#F3F4F6!important;
    color:#334155!important;
    font:inherit!important;
    font-size:12px!important;
    font-weight:700!important;
    cursor:pointer!important;
  }
  .site-header .header-search .global-search>svg{display:none!important}
  .site-header .header-search .global-search>input[type="search"]{
    flex:1 1 auto!important;
    width:auto!important;
    min-width:0!important;
    height:52px!important;
    min-height:52px!important;
    margin:0!important;
    padding:0 14px!important;
    border:0!important;
    border-radius:0!important;
    outline:0!important;
    background:#fff!important;
    box-shadow:none!important;
    font-size:14px!important;
    font-weight:590!important;
    line-height:52px!important;
  }
  .site-header .header-search .global-search>button[type="submit"]{
    position:relative!important;
    flex:0 0 58px!important;
    width:58px!important;
    min-width:58px!important;
    height:52px!important;
    min-height:52px!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-radius:0 11px 11px 0!important;
    outline:0!important;
    background:#FBBF24!important;
    color:#0F172A!important;
    box-shadow:none!important;
    font-size:0!important;
    line-height:0!important;
    cursor:pointer!important;
  }
  .site-header .header-search .global-search>button[type="submit"]::before{
    content:""!important;
    position:absolute!important;
    left:50%!important;
    top:50%!important;
    width:17px!important;
    height:17px!important;
    border:3px solid currentColor!important;
    border-radius:50%!important;
    transform:translate(-58%,-58%)!important;
    box-sizing:border-box!important;
  }
  .site-header .header-search .global-search>button[type="submit"]::after{
    content:""!important;
    position:absolute!important;
    left:50%!important;
    top:50%!important;
    width:10px!important;
    height:3px!important;
    border-radius:2px!important;
    background:currentColor!important;
    transform:translate(3px,7px) rotate(45deg)!important;
    transform-origin:left center!important;
  }
  .site-header .header-search .global-search>button[type="submit"]:hover{background:#F59E0B!important}
  .site-header .header-search .global-search>button[type="submit"]:focus-visible{outline:3px solid #93C5FD!important;outline-offset:2px!important}

  .site-header .header-search .search-suggestions{
    position:absolute!important;
    top:calc(100% + 6px)!important;
    left:0!important;
    right:0!important;
    width:100%!important;
    max-height:min(430px,62vh)!important;
    overflow:auto!important;
    margin:0!important;
    padding:8px!important;
    border:1px solid #D7DEE8!important;
    border-radius:12px!important;
    background:#fff!important;
    box-shadow:0 18px 44px rgba(15,23,42,.22)!important;
    z-index:900!important;
  }
  .site-header .header-search .search-suggestions[hidden]{display:none!important}
  .site-header .header-search .apg-desktop-suggest-group-v1227+.apg-desktop-suggest-group-v1227{margin-top:6px!important;padding-top:6px!important;border-top:1px solid #EEF2F7!important}
  .site-header .header-search .apg-desktop-suggest-label-v1227{display:block!important;padding:5px 9px!important;color:#64748B!important;font-size:11px!important;font-weight:800!important;letter-spacing:.05em!important;text-transform:uppercase!important}
  .site-header .header-search .apg-desktop-suggest-item-v1227{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;min-height:50px!important;padding:9px 10px!important;border-radius:9px!important;color:#0F172A!important;text-decoration:none!important}
  .site-header .header-search .apg-desktop-suggest-item-v1227:hover,.site-header .header-search .apg-desktop-suggest-item-v1227.is-active{background:#EFF6FF!important}
  .site-header .header-search .apg-desktop-suggest-item-v1227 strong{display:block!important;font-size:14px!important;line-height:1.25!important}
  .site-header .header-search .apg-desktop-suggest-item-v1227 small{display:block!important;margin-top:2px!important;color:#64748B!important;font-size:12px!important;line-height:1.25!important}
  .site-header .header-search .apg-desktop-suggest-meta-v1227{color:#2563EB!important;font-size:11px!important;font-weight:800!important;white-space:nowrap!important}
  .site-header .header-search .apg-desktop-suggest-all-v1227{border-top:1px solid #E2E8F0!important;margin-top:5px!important;padding-top:8px!important}
}
`;

const JS=String.raw`
;(()=>{
'use strict';
if(window.__APG_HEADER_DESKTOP_SEARCH_V1227__)return;
window.__APG_HEADER_DESKTOP_SEARCH_V1227__='122.7';
const root=document.querySelector('.site-header .header-search form[data-search-shell]');
if(!root)return;
const input=root.querySelector('[data-site-search]');
const box=root.querySelector('[data-search-suggestions]');
const category=root.querySelector('[data-apg-search-category]');
if(!input||!box)return;
let timer=0,controller=null,serial=0,active=-1;
const clean=v=>String(v||'').trim().replace(/\s+/g,' ').slice(0,160);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selectedCategory=()=>clean(category&&category.value||'');
function close(){box.hidden=true;box.innerHTML='';active=-1;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}
function items(){return [...box.querySelectorAll('a.apg-desktop-suggest-item-v1227')]}
function setActive(next){const rows=items();if(!rows.length){active=-1;return}rows.forEach(x=>x.classList.remove('is-active'));active=((next%rows.length)+rows.length)%rows.length;rows[active].classList.add('is-active');rows[active].id=rows[active].id||'apgDesktopSuggestV1227-'+active;input.setAttribute('aria-activedescendant',rows[active].id)}
function productRow(p){return '<a class="apg-desktop-suggest-item-v1227" role="option" href="'+esc(p.url)+'"><span><strong>'+esc(p.name)+'</strong><small>'+esc([p.brand,p.categoryLabel||p.category].filter(Boolean).join(' · '))+'</small></span><span class="apg-desktop-suggest-meta-v1227">Product</span></a>'}
function categoryRow(c){return '<a class="apg-desktop-suggest-item-v1227" role="option" href="'+esc(c.url)+'"><span><strong>'+esc(c.label)+'</strong><small>'+esc((c.productCount||0)+' maintained products')+'</small></span><span class="apg-desktop-suggest-meta-v1227">Category</span></a>'}
function allRow(q){return '<div class="apg-desktop-suggest-all-v1227"><a class="apg-desktop-suggest-item-v1227" role="option" href="/search/?q='+encodeURIComponent(q)+'"><span><strong>Search all results for “'+esc(q)+'”</strong><small>Open the full APG Search results</small></span><span class="apg-desktop-suggest-meta-v1227">Search</span></a></div>'}
function render(payload,q){
  const scope=selectedCategory();
  let products=Array.isArray(payload.products)?payload.products.slice():[];
  let categories=Array.isArray(payload.categories)?payload.categories.slice():[];
  if(scope){products=products.filter(p=>p.category===scope);categories=categories.filter(c=>c.slug===scope)}
  products=products.slice(0,6);categories=categories.slice(0,3);
  let html='';
  if(products.length)html+='<div class="apg-desktop-suggest-group-v1227"><span class="apg-desktop-suggest-label-v1227">Products'+(scope?' in selected category':'')+'</span>'+products.map(productRow).join('')+'</div>';
  if(categories.length)html+='<div class="apg-desktop-suggest-group-v1227"><span class="apg-desktop-suggest-label-v1227">Categories</span>'+categories.map(categoryRow).join('')+'</div>';
  html+=allRow(q);
  box.innerHTML=html;box.hidden=false;input.setAttribute('aria-expanded','true');active=-1;
}
async function load(){
  const q=clean(input.value);if(q.length<2){close();return}
  const token=++serial;if(controller)controller.abort();controller=new AbortController();
  const u=new URL('/search/',location.origin);u.searchParams.set('q',q);
  try{
    const r=await fetch(u.href,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','X-APG-Search-JSON':'1'},signal:controller.signal});
    if(!r.ok)throw new Error('http_'+r.status);const payload=await r.json();if(token!==serial)return;
    if(!payload||payload.version!=='search-ranking-v4'){close();return}render(payload,q);
  }catch(e){if(e&&e.name==='AbortError')return;close()}
}
function schedule(){clearTimeout(timer);timer=setTimeout(load,120)}
input.addEventListener('input',schedule);
input.addEventListener('focus',()=>{if(clean(input.value).length>=2)schedule()});
category&&category.addEventListener('change',()=>{if(clean(input.value).length>=2)load()});
input.addEventListener('keydown',e=>{
  if(box.hidden)return;
  if(e.key==='ArrowDown'){e.preventDefault();setActive(active+1)}
  else if(e.key==='ArrowUp'){e.preventDefault();setActive(active-1)}
  else if(e.key==='Escape'){e.preventDefault();close()}
  else if(e.key==='Enter'&&active>=0){const row=items()[active];if(row){e.preventDefault();location.assign(row.href)}}
});
box.addEventListener('pointerdown',e=>{const a=e.target.closest('a[href]');if(a)e.stopPropagation()});
document.addEventListener('pointerdown',e=>{if(!root.contains(e.target))close()});
})();
`;

function inject(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-desktop-search"')){
    out=out.replace('</head>',`<meta name="apg-header-desktop-search" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"><script src="${JS_PATH}?v=${VERSION}" defer></script></head>`);
  }
  return out;
}
function asset(req,res,path){
  const isJs=path===JS_PATH;
  res.statusCode=200;
  res.setHeader('Content-Type',isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Desktop-Search','v'+VERSION);
  return res.end(req.method==='HEAD'?'':isJs?JS:CSS);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Desktop Search v122.7 requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH||path===JS_PATH)return asset(req,res,path);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      if(req.method!=='HEAD'&&(typeof body==='string'||Buffer.isBuffer(body))&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const was=Buffer.isBuffer(body),source=was?body.toString('utf8'):body,next=inject(source);
        if(next!==source){body=was?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-Desktop-Search','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{HEADER_DESKTOP_SEARCH_VERSION:VERSION});
  return handler;
}
module.exports={VERSION,CSS_PATH,JS_PATH,CSS,JS,inject,wrap};
