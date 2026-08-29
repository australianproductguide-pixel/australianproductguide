'use strict';

// 29–30 Aug 2026 audit NEXT tranche: truthful filtered-result communication,
// compact mobile catalogue cards, and immediate custom-Compare refresh after removal.
// This is a presentation/continuity layer only. Existing SSR filtering and shortlist
// storage remain authoritative; structured-data category totals are deliberately untouched.
const VERSION='122.0';
const CSS_PATH='/assets/audit-shopping-clarity-v122.css';
const JS_PATH='/assets/audit-shopping-clarity-v122.js';

const CSS=String.raw`
.apg-filter-summary-v122{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0 18px;padding:12px 14px;border:1px solid #dbe4f0;border-radius:14px;background:#f8fafc;color:#334155}
.apg-filter-summary-v122 strong{color:#0f172a;font-size:15px}.apg-filter-chips-v122{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.apg-filter-chip-v122{display:inline-flex;align-items:center;min-height:34px;padding:6px 10px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:13px;font-weight:700}.apg-filter-clear-v122{display:inline-flex;align-items:center;min-height:34px;padding:6px 10px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:750;text-decoration:none}.apg-filter-clear-v122:hover{text-decoration:underline}
@media(max-width:720px){
 body[data-apg-route-family="category"] main#main .product-card{border-radius:16px!important}
 body[data-apg-route-family="category"] main#main .product-card .product-visual{min-height:138px!important;padding:14px!important}
 body[data-apg-route-family="category"] main#main .product-card-body{padding:14px!important}
 body[data-apg-route-family="category"] main#main .product-card-body h3{font-size:1.05rem!important;line-height:1.25!important;margin-bottom:7px!important}
 body[data-apg-route-family="category"] main#main .product-card .card-summary{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-block:7px!important}
 body[data-apg-route-family="category"] main#main .product-card .pills{gap:5px!important;margin-block:8px!important}
 body[data-apg-route-family="category"] main#main .product-card .pill{font-size:11px!important;padding:4px 7px!important}
 body[data-apg-route-family="category"] main#main .product-card .price-row{margin-block:8px!important}
 body[data-apg-route-family="category"] main#main .product-card .card-actions{gap:7px!important}
 .apg-filter-summary-v122{align-items:flex-start;padding:11px 12px;margin-top:10px}.apg-filter-chips-v122{width:100%}
}
`;

const JS=String.raw`
'use strict';(()=>{
 if(window.__APG_AUDIT_SHOPPING_CLARITY_V122__)return;window.__APG_AUDIT_SHOPPING_CLARITY_V122__='122.0';
 const path=location.pathname;
 function labelFor(select){const option=select&&select.selectedOptions&&select.selectedOptions[0];return option?option.textContent.trim():''}
 function enhanceFilters(){
  if(!/^\/categories\/[^/]+\/$/.test(path))return;
  const form=document.querySelector('main#main form.filter-bar');if(!form||form.dataset.apgFilterSummaryV122)return;
  form.dataset.apgFilterSummaryV122='true';
  const section=form.closest('section');const grid=form.nextElementSibling;if(!grid)return;
  const cards=Array.from(grid.children).filter(el=>el.matches&&el.matches('article.product-card'));
  const totalMatch=section&&section.querySelector('.section-head h2')?.textContent.match(/(\d+)\s+maintained products/i);const total=totalMatch?Number(totalMatch[1]):cards.length;
  const selected=Array.from(form.querySelectorAll('select[name]')).filter(s=>s.name!=='sort'&&s.value).map(s=>({name:s.name,label:labelFor(s)}));
  const summary=document.createElement('div');summary.className='apg-filter-summary-v122';summary.setAttribute('aria-live','polite');
  const count=document.createElement('strong');count.textContent=selected.length?cards.length+' of '+total+' products match':'Showing all '+total+' products';summary.appendChild(count);
  if(selected.length){const chips=document.createElement('div');chips.className='apg-filter-chips-v122';selected.forEach(item=>{const chip=document.createElement('span');chip.className='apg-filter-chip-v122';chip.textContent=item.label;chips.appendChild(chip)});const clear=document.createElement('a');clear.className='apg-filter-clear-v122';clear.href=path;clear.textContent='Clear all';clear.setAttribute('aria-label','Clear all product filters');chips.appendChild(clear);summary.appendChild(chips)}
  form.insertAdjacentElement('afterend',summary);
 }
 function compareRefresh(){
  if(path!=='/compare/custom/')return;
  document.addEventListener('click',event=>{
   const button=event.target.closest('button[data-compare-product][aria-pressed="true"]');if(!button)return;
   const before=new URLSearchParams(location.search).get('products')||document.body.dataset.apg112CompareProducts||'';
   const removed=button.getAttribute('data-compare-product');
   const remaining=before.split(',').map(v=>v.trim()).filter(Boolean).filter(v=>v!==removed);
   setTimeout(()=>{
    if(remaining.length>=2){const next='/compare/custom/?products='+encodeURIComponent(remaining.join(','));if(location.pathname+location.search!==next)location.replace(next)}
    else location.replace('/compare/');
   },80);
  },false);
 }
 enhanceFilters();compareRefresh();
})();`;

function inject(html){let out=String(html||'');if(!out.includes('name="apg-audit-shopping-clarity"'))out=out.replace('</head>',`<meta name="apg-audit-shopping-clarity" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);if(!out.includes(`src="${JS_PATH}`))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);return out}
function asset(req,res,path){const css=path===CSS_PATH;res.statusCode=200;res.setHeader('Content-Type',css?'text/css; charset=utf-8':'application/javascript; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Audit-Shopping-Clarity','v'+VERSION);return res.end(req.method==='HEAD'?'':css?CSS:JS)}
function wrap(downstream){if(typeof downstream!=='function')throw new TypeError('Audit shopping clarity v122 requires downstream handler');function handler(req,res){let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}if(path===CSS_PATH||path===JS_PATH)return asset(req,res,path);const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&(typeof body==='string'||Buffer.isBuffer(body))&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=inject(source);if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}}res.setHeader('X-APG-Audit-Shopping-Clarity','v'+VERSION);return end(body,...args)};return downstream(req,res)}Object.assign(handler,downstream,{VERSION,CSS_PATH,JS_PATH,CSS,JS,inject});return handler}
module.exports={VERSION,CSS_PATH,JS_PATH,CSS,JS,inject,wrap};