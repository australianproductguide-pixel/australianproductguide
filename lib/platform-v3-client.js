const platformV3ClientJs=`
;(()=>{
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const read=(k,f=[])=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const safe=s=>String(s||'').replace(/[<>&"']/g,'');
const absolute=u=>new URL(u||location.pathname+location.search,location.origin).href;
const keys={searches:'apgRecentSearches',comparisons:'apgSavedComparisons',guides:'apgSavedGuides'};
function sharePayload(surface){return {url:absolute(surface?.dataset.shareUrl||location.pathname+location.search),title:surface?.dataset.shareTitle||document.title,text:surface?.dataset.shareTitle||document.title};}
async function copyUrl(url,status){try{await navigator.clipboard.writeText(url);if(status)status.textContent='Link copied.'}catch{if(status)status.textContent='Copy the URL from your browser address bar.'}}
function channelUrl(channel,p){const u=encodeURIComponent(p.url),t=encodeURIComponent(p.title);if(channel==='whatsapp')return 'https://wa.me/?text='+t+'%20'+u;if(channel==='facebook')return 'https://www.facebook.com/sharer/sharer.php?u='+u;if(channel==='x')return 'https://x.com/intent/post?text='+t+'&url='+u;if(channel==='email')return 'mailto:?subject='+t+'&body='+encodeURIComponent(p.title+'\\n\\n'+p.url);return null;}
document.addEventListener('click',async e=>{
  const product=e.target.closest('[data-share-product]');if(product){const p={url:absolute(product.dataset.shareProduct),title:product.dataset.shareProductTitle||document.title,text:product.dataset.shareProductTitle||document.title};if(navigator.share){try{await navigator.share(p)}catch{}}else await copyUrl(p.url,null);return;}
  const surface=e.target.closest('[data-share-surface]')||q('[data-share-surface]');if(!surface)return;const p=sharePayload(surface),status=q('[data-share-status]',surface);
  if(e.target.closest('[data-native-share]')){if(navigator.share){try{await navigator.share(p);if(status)status.textContent='Shared.'}catch(err){if(err?.name!=='AbortError'&&status)status.textContent='Sharing was not completed.'}}else await copyUrl(p.url,status);return;}
  if(e.target.closest('[data-copy-share]')){await copyUrl(p.url,status);return;}
  const ch=e.target.closest('[data-share-channel]')?.dataset.shareChannel;if(ch){const target=channelUrl(ch,p);if(target){if(ch==='email')location.href=target;else window.open(target,'_blank','noopener,noreferrer');}}
});
function recordSearch(){if(location.pathname!=='/search/')return;const term=new URLSearchParams(location.search).get('q')?.trim();if(!term)return;const now=Date.now(),items=read(keys.searches).filter(x=>x&&x.q!==term);write(keys.searches,[{q:term,url:'/search/?q='+encodeURIComponent(term),ts:now},...items].slice(0,10));}
function saveResearch(kind,url,title){const key=kind==='guide'?keys.guides:keys.comparisons,items=read(key).filter(x=>x&&x.url!==url);write(key,[{url,title,ts:Date.now()},...items].slice(0,12));}
function installSaveResearch(){const surface=q('[data-share-surface]');if(!surface)return;const path=location.pathname,kind=path.startsWith('/guides/')?'guide':path==='/compare/custom/'?'comparison':null;if(!kind)return;const pop=q('.share-popover',surface);if(!pop||q('[data-save-research]',pop))return;const b=document.createElement('button');b.type='button';b.dataset.saveResearch=kind;b.textContent=kind==='guide'?'Save guide to My APG':'Save comparison to My APG';pop.insertBefore(b,q('[data-share-status]',pop));b.addEventListener('click',()=>{saveResearch(kind,surface.dataset.shareUrl||location.pathname+location.search,document.title);const status=q('[data-share-status]',surface);if(status)status.textContent=kind==='guide'?'Guide saved to My APG.':'Comparison saved to My APG.';});}
function rows(items,empty){if(!items.length)return '<div class="workspace-empty">'+safe(empty)+'</div>';return '<div class="workspace-list">'+items.map(x=>'<a class="workspace-item" href="'+safe(x.url)+'"><span><strong>'+safe(x.title||x.q)+'</strong><small>'+new Date(x.ts||Date.now()).toLocaleDateString('en-AU')+'</small></span><span aria-hidden="true">→</span></a>').join('')+'</div>';}
function renderWorkspaceV3(){const root=q('[data-apg-workspace]');if(!root)return;const searches=q('[data-workspace-searches] [data-workspace-content]'),comparisons=q('[data-workspace-comparisons] [data-workspace-content]'),guides=q('[data-workspace-guides] [data-workspace-content]');if(searches)searches.innerHTML=rows(read(keys.searches),'Search APG and your recent queries will appear here on this device.');if(comparisons)comparisons.innerHTML=rows(read(keys.comparisons),'Save a shareable comparison and it will appear here.');if(guides)guides.innerHTML=rows(read(keys.guides),'Save a buying guide from its Share menu to keep it here.');}
const clear=q('[data-clear-workspace]');if(clear)clear.addEventListener('click',()=>setTimeout(()=>{[keys.comparisons,keys.guides].forEach(k=>localStorage.removeItem(k));renderWorkspaceV3();},50));
recordSearch();installSaveResearch();renderWorkspaceV3();
})();
`;
module.exports={platformV3ClientJs};