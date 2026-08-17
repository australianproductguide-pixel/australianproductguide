const app=require('./editorial-compliance');
const {categories,products}=require('../data');
const {categoryMeta,categoryGlyph}=require('./brand-v7');

const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));
const DECISION_KEYS=['q','category','budget','brand'];
const specialGlyphs={
  televisions:'M10 14h44v31H10V14Zm16 39h12m-6-8v8',
  laptops:'M16 13h32v27H16V13Zm-6 34h44l-4 5H14l-4-5Z',
  'washing-machines':'M16 10h32v44H16V10Zm7 8h4m5 0h4m5 0h.1M32 28a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z',
  fridges:'M20 8h24v48H20V8Zm0 21h24M26 20v5m0 10v5',
  dishwashers:'M17 9h30v46H17V9Zm5 10h20M23 29h18m-16 8h14m-12 8h10M23 14h.1',
  smartphones:'M22 7h20v50H22V7Zm7 6h6M30 51h4'
};
const neutralGlyph='M16 18 32 10l16 8v28l-16 8-16-8V18Zm0 0 16 8 16-8M32 26v28';
function svgPath(d){return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;}
function glyph(slug){if(specialGlyphs[slug])return svgPath(specialGlyphs[slug]);if(categoryMeta[slug])return categoryGlyph(slug);return svgPath(neutralGlyph);}
function semanticIcon(slug,size='normal'){return `<span class="category-icon ${size}" aria-hidden="true">${glyph(slug)}</span>`;}
function maintainedCategory(slug){return !!categories[slug];}
function contextCategory(path){
  let m=path.match(/^\/products\/([^/]+)\/$/);if(m)return PRODUCT_BY_SLUG.get(m[1])?.category||null;
  m=path.match(/^\/categories\/([^/]+)(?:\/finder)?\/$/);if(m&&maintainedCategory(m[1]))return m[1];
  m=path.match(/^\/compare\/([^/]+)(?:\/[^/]+)?\/$/);if(m&&maintainedCategory(m[1]))return m[1];
  m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m&&maintainedCategory(m[1]))return m[1];
  return null;
}
function fixHeaderCompare(out){return out.replace(/<a class="header-action" href="\/categories\/" title="Build a comparison shortlist">/g,'<a class="header-action" href="/compare/" title="Open the comparison workspace">');}
function fallbackVisual(slug,size,modelPrefix=''){return `<div class="product-art art-v15-category" data-v15-category="${slug}"><span class="art-halo"></span>${semanticIcon(slug,size)}<span class="art-model">${modelPrefix}`;}
function fixProductVisuals(out,path){
  out=out.replace(/<div class="product-visual([^"]*)"([^>]*?)data-product-category="([^"]+)"([^>]*)><div class="product-art art-headphones"><span class="art-halo"><\/span><span class="category-icon (normal|large)" aria-hidden="true"><svg[\s\S]*?<\/svg><\/span><span class="art-model">/g,(match,classes,before,slug,after,size)=>{
    if(slug==='wireless-headphones')return match;
    return `<div class="product-visual${classes}"${before}data-product-category="${slug}"${after}>${fallbackVisual(slug,size)}`;
  });
  const slug=contextCategory(path);if(!slug||slug==='wireless-headphones')return out;
  return out.replace(/<div class="product-art art-headphones"><span class="art-halo"><\/span><span class="category-icon (normal|large)" aria-hidden="true"><svg[\s\S]*?<\/svg><\/span><span class="art-model">/g,(_,size)=>fallbackVisual(slug,size));
}
function improveDirectoryIcons(out,path){
  if(path==='/compare/')out=out.replace(/<article class="platform-hub-card">[\s\S]*?<\/article>/g,card=>{const m=card.match(/href="\/compare\/([^/]+)\/"/);if(!m)return card;const slug=m[1];if(!categoryMeta[slug]&&!specialGlyphs[slug])return card;return card.replace(/<span class="category-icon (normal|large)" aria-hidden="true"><svg[\s\S]*?<\/svg><\/span>/,(_,size)=>semanticIcon(slug,size));});
  if(path==='/categories/')out=out.replace(/<article class="category-card">[\s\S]*?<\/article>/g,card=>{const m=card.match(/href="\/categories\/([^/]+)\/"/);if(!m)return card;const slug=m[1];if(!specialGlyphs[slug])return card;return card.replace(/<span class="category-icon (normal|large)" aria-hidden="true"><svg[\s\S]*?<\/svg><\/span>/,(_,size)=>semanticIcon(slug,size));});
  return out;
}
function compareDirectoryTools(out,path){
  if(path!=='/compare/'||out.includes('data-v15-directory-tools'))return out;
  const tools=`<div class="v15-directory-tools" data-v15-directory-tools><div class="v15-directory-field"><label for="v15CompareCategorySearch">Find a category to compare</label><div><input id="v15CompareCategorySearch" type="search" autocomplete="off" placeholder="Try ‘TV’, ‘dishwasher’, ‘gaming’ or ‘coffee’" data-v15-directory-search><button type="button" data-v15-directory-clear hidden>Clear</button></div></div><p class="v15-directory-count" aria-live="polite"><strong data-v15-directory-visible>${Object.keys(categories).length}</strong><span>categories shown</span></p><p class="v15-directory-empty" data-v15-directory-empty hidden>No maintained category matches that search. Try a broader product type or use Decision Lab.</p></div>`;
  return out.replace('<div class="platform-hub-grid">',`${tools}<div class="platform-hub-grid" data-v15-directory-grid>`);
}
function decisionIndexing(out,path,url){
  const personalised=DECISION_KEYS.some(key=>url.searchParams.get(key));
  if(path==='/decision-lab/'&&!personalised)out=out.replace(/<meta\s+name=["']robots["']\s+content=["']noindex,follow["']\s*\/?>(?:\s*)?/i,'');
  return out;
}
function assets(out){if(!out.includes('/assets/platform-integrity-v15.css'))out=out.replace('</head>','<link rel="stylesheet" href="/assets/platform-integrity-v15.css?v=15"></head>');if(!out.includes('/assets/platform-integrity-v15.js'))out=out.replace('</body>','<script src="/assets/platform-integrity-v15.js?v=15" defer></script></body>');return out;}
function transform(html,url){const path=url.pathname;let out=String(html||'');out=fixHeaderCompare(out);out=fixProductVisuals(out,path);out=improveDirectoryIcons(out,path);out=compareDirectoryTools(out,path);out=decisionIndexing(out,path,url);out=assets(out);return out;}
module.exports=(req,res)=>{let url=new URL('https://australianproductguide.au/');try{url=new URL(req.url,'https://australianproductguide.au')}catch{}const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,url);return end(body,...args);};return app(req,res);};
module.exports.transform=transform;module.exports.contextCategory=contextCategory;module.exports.glyph=glyph;