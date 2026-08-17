// APG mobile search/history UX v16: keep mobile navigation usable and make local browsing history controllable.
const app=require('./decision-intelligence-v4');
const {products}=require('../data');

const CSS_PATH='/assets/mobile-history-ux-v16.css';
const JS_PATH='/assets/mobile-history-ux-v16.js';

const css=`
/* Mobile navigation should never be obscured simply because the search field receives focus. */
.apg-mobile-history-tools{display:none}
.apg-recent-remove,.apg-recent-clear,.apg-viewed-clear,.apg-viewed-remove{border:0;background:transparent;color:#315463;font:inherit;font-weight:800;cursor:pointer}
.apg-recent-remove,.apg-viewed-remove{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:19px;line-height:1}
.apg-recent-remove:hover,.apg-recent-remove:focus-visible,.apg-recent-clear:hover,.apg-recent-clear:focus-visible,.apg-viewed-remove:hover,.apg-viewed-remove:focus-visible,.apg-viewed-clear:hover,.apg-viewed-clear:focus-visible{background:#e7f5f1;color:#08786f}
.suggest-group[data-apg-recent-group]>.suggest-label{display:flex;align-items:center;justify-content:space-between;gap:12px}
.apg-recent-option{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:2px;align-items:center}
.apg-recent-option .suggest-item{min-width:0}
.apg-viewed-actions{margin-left:auto;display:flex;align-items:center}
.apg-viewed-clear{min-height:38px;padding:7px 10px;border:1px solid #d6e3e0;border-radius:10px;background:#fff;font-size:11.5px}
.apg-viewed-card{position:relative;min-width:0}
.apg-viewed-card>.mini-card{height:100%;padding-right:42px}
.apg-viewed-card>.apg-viewed-remove{position:absolute;right:5px;top:5px;background:rgba(255,255,255,.92);border:1px solid #dce7e4}
@media(max-width:920px){
  .apg-mobile-v8{max-height:calc(100dvh - 72px)!important;overflow-y:auto!important;overscroll-behavior:contain}
  .apg-mobile-search .search-suggestions{position:relative!important;left:auto!important;right:auto!important;top:auto!important;margin:8px 0 0!important;max-height:min(42dvh,330px)!important;box-shadow:0 10px 28px rgba(7,38,53,.10)!important;border-radius:13px!important;z-index:1!important}
  .apg-mobile-history-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:-6px 0 13px;padding:0 2px}
  .apg-mobile-history-tools button{min-height:38px;border:1px solid #d6e3e0;border-radius:10px;background:#fff;color:#315463;padding:7px 10px;font-size:11.5px;font-weight:800;cursor:pointer}
  .apg-mobile-history-tools button:hover,.apg-mobile-history-tools button:focus-visible{background:#edf7f4;border-color:#b7d5cf;color:#08786f}
  .apg-mobile-history-tools [data-apg-history-clear][hidden]{display:none!important}
}
@media(max-width:520px){.apg-recent-option{grid-template-columns:minmax(0,1fr) 36px}.apg-viewed-actions{width:100%;margin:8px 0 0}.apg-viewed-clear{width:100%}}
`;

const js=`(()=>{
const SEARCH_KEY='apgRecentSearches',VIEW_KEY='apgRecent';
const read=k=>{try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const clean=s=>String(s||'').trim();
const text=s=>String(s||'').replace(/[<>&]/g,'');
const attr=s=>text(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const mobile=()=>matchMedia('(max-width:920px)').matches;
const announce=value=>{let n=document.querySelector('#apgHistoryLive');if(!n){n=document.createElement('span');n.id='apgHistoryLive';n.className='sr-only';n.setAttribute('aria-live','polite');document.body.appendChild(n)}n.textContent='';setTimeout(()=>n.textContent=value,20)};
let allowMobileRecents=false;
function setExpanded(input,box,on){if(!box)return;box.hidden=!on;input?.setAttribute('aria-expanded',String(on));if(!on)input?.removeAttribute('aria-activedescendant')}
function recentRow(box,v,i){return '<div class="apg-recent-option"><a role="option" class="suggest-item" id="'+box.id+'Recent'+i+'" href="/search/?q='+encodeURIComponent(v)+'"><span class="suggest-thumb type-recent">↗</span><span><strong>'+text(v)+'</strong><small>Recent search on this device</small></span><span aria-hidden="true">→</span></a><button type="button" class="apg-recent-remove" data-apg-remove-recent="'+attr(v)+'" aria-label="Remove '+attr(v)+' from recent searches">×</button></div>'}
function renderOwnRecents(shell){
 const input=shell.querySelector('[data-site-search]'),box=shell.querySelector('[data-search-suggestions]');if(!input||!box)return;
 const rows=read(SEARCH_KEY).slice(0,6);if(!rows.length){box.innerHTML='';setExpanded(input,box,false);return;}
 box.innerHTML='<div class="suggest-group" data-apg-recent-group><span class="suggest-label"><span>Recent searches</span><button type="button" class="apg-recent-clear" data-apg-clear-all>Clear all</button></span>'+rows.map((v,i)=>recentRow(box,v,i)).join('')+'</div>';
 setExpanded(input,box,true);
}
function decorateNative(box){
 if(!box)return;const label=[...box.querySelectorAll('.suggest-label')].find(x=>clean(x.textContent).toLowerCase().startsWith('recent searches'));if(!label)return;
 const group=label.closest('.suggest-group');if(!group||group.dataset.apgRecentGroup)return;group.dataset.apgRecentGroup='true';
 label.innerHTML='<span>Recent searches</span><button type="button" class="apg-recent-clear" data-apg-clear-all>Clear all</button>';
 [...group.querySelectorAll('.suggest-item')].forEach(a=>{const value=clean(a.querySelector('strong')?.textContent);if(!value||a.closest('.apg-recent-option'))return;const wrap=document.createElement('div');wrap.className='apg-recent-option';a.parentNode.insertBefore(wrap,a);wrap.appendChild(a);const b=document.createElement('button');b.type='button';b.className='apg-recent-remove';b.dataset.apgRemoveRecent=value;b.setAttribute('aria-label','Remove '+value+' from recent searches');b.textContent='×';wrap.appendChild(b)});
}
function enforceMobileState(shell){if(!mobile())return;const input=shell.querySelector('[data-site-search]'),box=shell.querySelector('[data-search-suggestions]');if(!input||!box)return;if(!clean(input.value)&&!allowMobileRecents)setExpanded(input,box,false)}
function mobileTools(){
 const form=document.querySelector('.apg-mobile-v8 .apg-mobile-search');if(!form||form.nextElementSibling?.classList.contains('apg-mobile-history-tools'))return;
 const wrap=document.createElement('div');wrap.className='apg-mobile-history-tools';wrap.innerHTML='<button type="button" data-apg-history-show>Recent searches</button><button type="button" data-apg-history-clear>Clear recent</button>';form.insertAdjacentElement('afterend',wrap);
 const refresh=()=>{wrap.querySelector('[data-apg-history-clear]').hidden=!read(SEARCH_KEY).length};refresh();
 wrap.querySelector('[data-apg-history-show]').addEventListener('click',()=>{allowMobileRecents=true;renderOwnRecents(form);form.querySelector('[data-site-search]')?.focus();refresh()});
 wrap.querySelector('[data-apg-history-clear]').addEventListener('click',()=>{write(SEARCH_KEY,[]);allowMobileRecents=false;const box=form.querySelector('[data-search-suggestions]');if(box){box.innerHTML='';setExpanded(form.querySelector('[data-site-search]'),box,false)}refresh();announce('Recent searches cleared')});
 form.querySelector('[data-site-search]')?.addEventListener('input',e=>{if(clean(e.target.value))allowMobileRecents=false;else if(!allowMobileRecents)enforceMobileState(form)});
 form.querySelector('[data-site-search]')?.addEventListener('focus',()=>setTimeout(()=>enforceMobileState(form),0));
 const box=form.querySelector('[data-search-suggestions]');if(box)new MutationObserver(()=>{decorateNative(box);enforceMobileState(form);refresh()}).observe(box,{childList:true,subtree:true});
}
function decorateViewed(){
 const section=document.querySelector('#recentlyViewed');if(!section||section.dataset.apgHistoryControls==='true'||section.hidden)return;
 const cards=[...section.querySelectorAll('.mini-card')];if(!cards.length)return;section.dataset.apgHistoryControls='true';
 const head=section.querySelector('.section-head');if(head){const actions=document.createElement('div');actions.className='apg-viewed-actions';actions.innerHTML='<button type="button" class="apg-viewed-clear" data-apg-clear-viewed>Clear recently viewed</button>';head.appendChild(actions)}
 cards.forEach(a=>{const m=(a.getAttribute('href')||'').match(/^\\/products\\/([^/]+)\\/?/);if(!m)return;const wrap=document.createElement('div');wrap.className='apg-viewed-card';a.parentNode.insertBefore(wrap,a);wrap.appendChild(a);const b=document.createElement('button');b.type='button';b.className='apg-viewed-remove';b.dataset.apgRemoveViewed=m[1];b.setAttribute('aria-label','Remove '+clean(a.querySelector('strong')?.textContent||'product')+' from recently viewed');b.textContent='×';wrap.appendChild(b)});
}
document.addEventListener('click',e=>{
 const remove=e.target.closest('[data-apg-remove-recent]');if(remove){e.preventDefault();e.stopPropagation();const value=clean(remove.dataset.apgRemoveRecent);write(SEARCH_KEY,read(SEARCH_KEY).filter(x=>x!==value));const shell=remove.closest('[data-search-shell]');if(shell){if(mobile()&&shell.closest('.apg-mobile-v8')){allowMobileRecents=true;renderOwnRecents(shell)}else{const row=remove.closest('.apg-recent-option');row?.remove();if(!shell.querySelector('[data-apg-recent-group] .apg-recent-option'))setExpanded(shell.querySelector('[data-site-search]'),shell.querySelector('[data-search-suggestions]'),false)}}announce('Recent search removed');return;}
 const clear=e.target.closest('[data-apg-clear-all]');if(clear){e.preventDefault();e.stopPropagation();write(SEARCH_KEY,[]);const shell=clear.closest('[data-search-shell]'),box=clear.closest('[data-search-suggestions]');if(box)box.innerHTML='';if(shell)setExpanded(shell.querySelector('[data-site-search]'),box,false);allowMobileRecents=false;announce('Recent searches cleared');return;}
 const viewed=e.target.closest('[data-apg-remove-viewed]');if(viewed){e.preventDefault();const slug=viewed.dataset.apgRemoveViewed;write(VIEW_KEY,read(VIEW_KEY).filter(x=>x!==slug));viewed.closest('.apg-viewed-card')?.remove();const section=document.querySelector('#recentlyViewed');if(section&&!section.querySelector('.apg-viewed-card'))section.hidden=true;announce('Recently viewed product removed');return;}
 if(e.target.closest('[data-apg-clear-viewed]')){e.preventDefault();write(VIEW_KEY,[]);const section=document.querySelector('#recentlyViewed');if(section){section.innerHTML='';section.hidden=true}announce('Recently viewed products cleared')}
});
[...document.querySelectorAll('[data-search-suggestions]')].forEach(box=>new MutationObserver(()=>decorateNative(box)).observe(box,{childList:true,subtree:true}));
const viewed=document.querySelector('#recentlyViewed');if(viewed)new MutationObserver(decorateViewed).observe(viewed,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
mobileTools();decorateViewed();
})();`;

function pathOf(req){try{return new URL(req.url,'https://australianproductguide.au').pathname}catch{return '/'}}
function send(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body)}
function transform(html){
 let out=String(html||'');
 // Keep transient catalogue scale out of navigation chrome. Exact live counts remain on dedicated coverage/proof surfaces.
 out=out.replace(/<div class="apg-mega-stats"><strong>\d+<\/strong><span>maintained products<\/span>/,`<div class="apg-mega-stats"><strong>Growing</strong><span>maintained product catalogue</span>`);
 if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=16"></head>`);
 if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=16" defer></script></body>`);
 return out;
}
module.exports=(req,res)=>{
 const path=pathOf(req);if(path===CSS_PATH)return send(req,res,'text/css; charset=utf-8',css);if(path===JS_PATH)return send(req,res,'application/javascript; charset=utf-8',js);
 const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body);return end(body,...args)};return app(req,res);
};
module.exports.transform=transform;
module.exports.PRODUCT_COUNT=products.length;
