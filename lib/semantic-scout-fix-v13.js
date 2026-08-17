const app=require('./consumer-readability-v13');

const semanticJs=`(()=>{
const glyphs={
 televisions:'<rect x="9" y="13" width="46" height="31" rx="3"/><path d="M24 52h16m-8-8v8"/>',
 laptops:'<path d="M14 13h36v27H14V13Zm-5 35h46l-4 5H13l-4-5Z"/>',
 'washing-machines':'<rect x="14" y="9" width="36" height="46" rx="4"/><circle cx="32" cy="35" r="12"/><path d="M20 17h8m7 0h9"/>',
 fridges:'<rect x="19" y="6" width="27" height="52" rx="4"/><path d="M19 31h27M39 18v7m0 12v7"/>',
 dishwashers:'<rect x="13" y="8" width="38" height="48" rx="4"/><path d="M13 20h38M20 31h24M22 39c6-5 14-5 20 0M22 47h20"/>',
 smartphones:'<rect x="20" y="7" width="24" height="50" rx="6"/><path d="M28 13h8M31 50h2"/>'
};
const make=s=>'<span class="apg-v13-semantic-icon" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">'+glyphs[s]+'</svg></span>';
function fix(){document.querySelectorAll('.product-visual[data-product-category]').forEach(v=>{const s=v.dataset.productCategory;if(!glyphs[s])return;const art=v.querySelector('.product-art');if(art){art.className='product-art art-'+s+' apg-v13-semantic-art';art.dataset.semanticCategory=s;}const old=v.querySelector('.category-icon,.v7-scene-icon,.apg-v13-semantic-icon');if(old)old.outerHTML=make(s);});}
fix();new MutationObserver(fix).observe(document.body,{childList:true,subtree:true});
})();`;
const css=`.apg-v13-semantic-art{background:linear-gradient(145deg,#eaf6f3 0%,#f9fbfa 70%)!important;color:#087c76!important}.apg-v13-semantic-icon{width:54px;height:54px;display:grid;place-items:center;color:#087c76;position:relative;z-index:2}.apg-v13-semantic-icon svg{width:44px;height:44px;display:block}.product-card .apg-v13-semantic-icon{width:46px;height:46px}.product-card .apg-v13-semantic-icon svg{width:36px;height:36px}@media(max-width:640px){.apg-v13-semantic-icon{width:46px;height:46px}.apg-v13-semantic-icon svg{width:36px;height:36px}}`;
function path(req){try{return new URL(req.url,'https://australianproductguide.au').pathname}catch{return '/'}}
function send(req,res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body)}
module.exports=(req,res)=>{const p=path(req);if(p==='/assets/semantic-v13.css')return send(req,res,'text/css; charset=utf-8',css);if(p==='/assets/semantic-v13.js')return send(req,res,'application/javascript; charset=utf-8',semanticJs);const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){body=body.replace('</head>','<link rel="stylesheet" href="/assets/assistant.css"><link rel="stylesheet" href="/assets/semantic-v13.css"></head>');body=body.replace('</body>','<script src="/assets/semantic-v13.js" defer></script></body>');}return end(body,...args)};return app(req,res)};
