'use strict';

// APG Brand Identity v62
// Premium brand discovery for /brands/ plus consistent brand identity on /brands/<brand>/.
// Logo resolution prioritises verified official-domain logo assets and structured data,
// then official site icons and finally a domain favicon. APG never fabricates an official mark.
const downstream=require('./category-index-images-v61');
const {products}=require('../data');
const {brands,slugify}=require('./routes');
const officialDomains=require('../data/brand-official-domains-v62');

const BRAND_INDEX_LOGOS_VERSION='62.4';
const ORIGIN='https://australianproductguide.au';
const LOGO_ROUTE_PREFIX='/assets/brand-marks/';
const MAX_IMAGE_BYTES=1024*1024;
const MAX_HTML_BYTES=384*1024;
const FETCH_TIMEOUT_MS=2600;

const RETAILER_HOSTS=[
  /(^|\.)amazon\./i,/(^|\.)jbhifi\.com\.au$/i,/(^|\.)officeworks\.com\.au$/i,
  /(^|\.)thegoodguys\.com\.au$/i,/(^|\.)harveynorman\.com\.au$/i,/(^|\.)bing\s*lee/i,
  /(^|\.)binglee\.com\.au$/i,/(^|\.)kogan\.com$/i,/(^|\.)catch\.com\.au$/i,
  /(^|\.)bigw\.com\.au$/i,/(^|\.)target\.com\.au$/i,/(^|\.)kmart\.com\.au$/i,
  /(^|\.)myer\.com\.au$/i,/(^|\.)davidjones\.com$/i,/(^|\.)bunnings\.com\.au$/i,
  /(^|\.)ebay\./i,/(^|\.)woolworths\.com\.au$/i,/(^|\.)coles\.com\.au$/i
];

function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function stripTags(value){
  return String(value||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
}

function safeSourceOrigin(value){
  try{
    const url=new URL(String(value||''));
    if(url.protocol!=='https:'&&url.protocol!=='http:')return null;
    const host=url.hostname.toLowerCase();
    if(!host||host==='localhost'||host.endsWith('.local'))return null;
    if(RETAILER_HOSTS.some(pattern=>pattern.test(host)))return null;
    return url.origin;
  }catch{return null;}
}

const brandBySlug=new Map(brands.map(brand=>[slugify(brand),brand]));
const sourceOriginByBrandSlug=new Map();
const brandStatsBySlug=new Map();
for(const brand of brands)brandStatsBySlug.set(slugify(brand),{count:0,categories:new Set()});
for(const product of products){
  const slug=slugify(product.brand||'');
  if(!slug||!brandBySlug.has(slug))continue;
  const stat=brandStatsBySlug.get(slug)||{count:0,categories:new Set()};
  stat.count+=1;
  if(product.category)stat.categories.add(String(product.category));
  brandStatsBySlug.set(slug,stat);
  if(!sourceOriginByBrandSlug.has(slug)){
    const source=safeSourceOrigin(product.source);
    if(source)sourceOriginByBrandSlug.set(slug,source);
  }
}

function brandMarkUrl(slug){return `${LOGO_ROUTE_PREFIX}${encodeURIComponent(slug)}`;}
function brandLetter(name){const c=String(name||'').trim().charAt(0).toUpperCase();return /^[A-Z]$/.test(c)?c:'#';}

function brandLogoShell(slug,brandName,className='brand-card-mark',size=48,lazy=true){
  const safeName=esc(brandName);
  return `<span class="${className}" data-brand-logo-shell><span class="brand-logo-text-fallback" aria-hidden="true">${safeName}</span><img class="brand-card-logo" src="${esc(brandMarkUrl(slug))}" alt="" width="${size}" height="${size}" loading="${lazy?'lazy':'eager'}" decoding="async" onerror="this.hidden=true"></span>`;
}

function brandDirectoryTile(brandName,{featured=false}={}){
  const slug=slugify(brandName);
  const stat=brandStatsBySlug.get(slug)||{count:0,categories:new Set()};
  const count=stat.count;
  const mark=brandLogoShell(slug,brandName,featured?'apg-featured-brand-mark':'brand-card-mark',featured?70:48,true);
  return `<a class="${featured?'apg-featured-brand-tile':'apg-brand-directory-tile'}" href="/brands/${esc(slug)}/" data-apg-brand-name="${esc(String(brandName).toLowerCase())}" data-apg-brand-letter="${esc(brandLetter(brandName))}">${mark}<span class="apg-brand-directory-copy"><strong>${esc(brandName)}</strong><small>${count} maintained ${count===1?'product':'products'}</small></span><span class="apg-brand-directory-arrow" aria-hidden="true">›</span></a>`;
}

function renderBrandDirectory(){
  const sorted=[...brands].sort((a,b)=>a.localeCompare(b,'en-AU',{sensitivity:'base'}));
  const featured=[...sorted].sort((a,b)=>{
    const delta=(brandStatsBySlug.get(slugify(b))?.count||0)-(brandStatsBySlug.get(slugify(a))?.count||0);
    return delta||a.localeCompare(b,'en-AU',{sensitivity:'base'});
  }).slice(0,12);
  const groups=new Map();
  for(const brand of sorted){const letter=brandLetter(brand);if(!groups.has(letter))groups.set(letter,[]);groups.get(letter).push(brand);}
  const letters=[...groups.keys()].sort((a,b)=>a==='#'?-1:b==='#'?1:a.localeCompare(b));
  const az=letters.map(letter=>`<a href="#brands-${letter==='#'?'other':letter.toLowerCase()}" data-apg-brand-letter-link="${esc(letter)}">${esc(letter)}</a>`).join('');
  const groupHtml=letters.map(letter=>{
    const id=`brands-${letter==='#'?'other':letter.toLowerCase()}`;
    return `<section class="apg-brand-letter-group" id="${id}" data-apg-brand-group="${esc(letter)}"><div class="apg-brand-letter-head"><h3>${esc(letter)}</h3><span>${groups.get(letter).length} ${groups.get(letter).length===1?'brand':'brands'}</span></div><div class="apg-brand-letter-grid">${groups.get(letter).map(brand=>brandDirectoryTile(brand)).join('')}</div></section>`;
  }).join('');
  return `<div class="apg-brand-directory" data-apg-brand-directory-v62>
    <section class="apg-brand-discovery-panel" aria-labelledby="apgBrandBrowseHeading">
      <div class="apg-brand-discovery-copy"><p class="kicker">Brand discovery</p><h2 id="apgBrandBrowseHeading">Find a brand</h2><p>Search ${brands.length} maintained brands or jump straight to a letter.</p></div>
      <label class="apg-brand-search"><span class="sr-only">Search brands</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg><input type="search" placeholder="Search brands" autocomplete="off" data-apg-brand-search></label>
      <nav class="apg-brand-az" aria-label="Browse brands alphabetically" id="apg-brand-az">${az}</nav>
      <p class="apg-brand-search-status" data-apg-brand-search-status aria-live="polite">${brands.length} brands</p>
    </section>
    <section class="apg-brand-featured" data-apg-brand-featured aria-labelledby="apgBrandFeaturedHeading">
      <div class="apg-brand-section-heading"><div><p class="kicker">Broadest APG coverage</p><h2 id="apgBrandFeaturedHeading">More extensively maintained brands</h2></div><p>Based only on the number of maintained APG products — not popularity, endorsement or affiliate value.</p></div>
      <div class="apg-brand-featured-grid">${featured.map(brand=>brandDirectoryTile(brand,{featured:true})).join('')}</div>
    </section>
    <section class="apg-brand-all" id="all-brands" aria-labelledby="apgAllBrandsHeading">
      <div class="apg-brand-section-heading"><div><p class="kicker">Complete directory</p><h2 id="apgAllBrandsHeading">All brands A–Z</h2></div><p>Every brand currently represented in Australian Product Guide’s maintained catalogue.</p></div>
      <div class="apg-brand-letter-groups">${groupHtml}</div>
      <div class="apg-brand-empty" data-apg-brand-empty hidden><strong>No matching brand found</strong><span>Try another spelling or browse the A–Z directory.</span></div>
    </section>
  </div>`;
}

function replaceBalancedBrandGrid(html,replacement){
  const marker='<div class="grid four">';
  let start=html.indexOf(marker);
  if(start<0)return html;
  const nearby=html.slice(start,start+2400);
  if(!nearby.includes('brand-card'))return html;
  const tag=/<\/?div\b[^>]*>/gi;
  tag.lastIndex=start;
  let depth=0,end=-1,match;
  while((match=tag.exec(html))){
    if(/^<div\b/i.test(match[0]))depth+=1;else depth-=1;
    if(depth===0){end=tag.lastIndex;break;}
  }
  if(end<0)return html;
  return html.slice(0,start)+replacement+html.slice(end);
}

function enrichBrandCard(card){return card;}

function enrichBrandDetail(html,path){
  const match=path.match(/^\/brands\/([^/]+)\/$/i);
  if(!match||path==='/brands/')return html;
  let slug='';try{slug=decodeURIComponent(match[1])}catch{return html;}
  const brandName=brandBySlug.get(slug);
  if(!brandName||html.includes('brand-hero-logo-shell'))return html;
  const heroMonogram=html.match(/<div\b[^>]*class="[^"]*\bbrand-monogram\b[^"]*"[^>]*>[\s\S]*?<\/div>/i);
  if(!heroMonogram)return html;
  const logo=`<div class="brand-hero-logo-panel" aria-label="${esc(brandName)} brand identity"><span class="brand-hero-logo-shell" data-brand-logo-shell><span class="brand-logo-text-fallback" aria-hidden="true">${esc(brandName)}</span><img class="brand-card-logo" src="${esc(brandMarkUrl(slug))}" alt="${esc(brandName)} logo" width="150" height="150" loading="eager" decoding="async" onerror="this.hidden=true"></span></div>`;
  return html.replace(heroMonogram[0],logo);
}

const CSS=`<style id="apg-brand-index-logos-v62">
/* APG Brands v62.4 — premium, dense A-Z discovery rather than a wall of catalogue cards. */
body[data-apg-brand-index-logos="v62"] .apg-brand-directory{display:grid;gap:38px;margin-top:4px}
body[data-apg-brand-index-logos="v62"] .apg-brand-discovery-panel{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,420px);gap:18px 28px;align-items:end;padding:28px;border:1px solid #dce5e9;border-radius:22px;background:linear-gradient(145deg,#f8fbfc,#fff);box-shadow:0 10px 32px rgba(15,23,42,.045)}
body[data-apg-brand-index-logos="v62"] .apg-brand-discovery-copy h2,body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading h2{margin:.18rem 0 .35rem;color:#0f172a;letter-spacing:-.025em}
body[data-apg-brand-index-logos="v62"] .apg-brand-discovery-copy p:last-child,body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading>p{margin:0;color:#60717d;line-height:1.55}
body[data-apg-brand-index-logos="v62"] .apg-brand-search{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border:1px solid #cfdbe0;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.03)}
body[data-apg-brand-index-logos="v62"] .apg-brand-search:focus-within{border-color:#315fd8;box-shadow:0 0 0 3px rgba(49,95,216,.1)}
body[data-apg-brand-index-logos="v62"] .apg-brand-search svg{width:19px;height:19px;fill:none;stroke:#637783;stroke-width:1.8;flex:0 0 auto}
body[data-apg-brand-index-logos="v62"] .apg-brand-search input{width:100%;height:100%;border:0!important;outline:0!important;background:transparent!important;color:#0f172a;font:inherit;box-shadow:none!important}
body[data-apg-brand-index-logos="v62"] .apg-brand-az{grid-column:1/-1;display:flex;gap:5px;overflow-x:auto;padding:8px 0 2px;scrollbar-width:thin}
body[data-apg-brand-index-logos="v62"] .apg-brand-az a{display:grid;place-items:center;flex:0 0 34px;height:34px;border:1px solid #dce5e9;border-radius:8px;background:#fff;color:#334155;font-size:.78rem;font-weight:760;text-decoration:none}
body[data-apg-brand-index-logos="v62"] .apg-brand-az a:hover{border-color:#9fb4be;color:#0b6a62;background:#f8fbfa}
body[data-apg-brand-index-logos="v62"] .apg-brand-search-status{grid-column:1/-1;margin:-4px 0 0!important;color:#71818b!important;font-size:.78rem!important}
body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:18px}
body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading>p{max-width:540px;font-size:.82rem;text-align:right}
body[data-apg-brand-index-logos="v62"] .apg-brand-featured-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:145px;padding:17px 12px;border:1px solid #dfe7eb;border-radius:15px;background:#fff;color:#0f172a;text-align:center;text-decoration:none;box-shadow:0 2px 8px rgba(15,23,42,.03);transition:border-color .17s ease,box-shadow .17s ease,transform .17s ease}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile:hover{border-color:#b9cbd2;box-shadow:0 8px 22px rgba(15,23,42,.065);transform:translateY(-1px)}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-mark{position:relative;display:grid;place-items:center;overflow:hidden;width:72px;height:72px;margin-bottom:11px;border:1px solid #e6ecef;border-radius:14px;background:#fff}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile .apg-brand-directory-copy{align-items:center}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile .apg-brand-directory-copy strong{font-size:.84rem}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile .apg-brand-directory-copy small{font-size:.67rem}
body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile .apg-brand-directory-arrow{display:none}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-groups{display:grid;gap:34px}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-group{scroll-margin-top:110px}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px;padding-bottom:9px;border-bottom:1px solid #e4ebee}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-head h3{margin:0;color:#0f172a;font-size:1.3rem;line-height:1}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-head span{color:#84919a;font-size:.72rem}
body[data-apg-brand-index-logos="v62"] .apg-brand-letter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-tile{position:relative;display:flex;align-items:center;gap:11px;min-width:0;min-height:70px;padding:10px 11px;border:1px solid #e1e8eb;border-radius:12px;background:#fff;color:#0f172a;text-decoration:none;transition:border-color .16s ease,background .16s ease,box-shadow .16s ease}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-tile:hover{border-color:#becdd3;background:#fbfdfd;box-shadow:0 5px 16px rgba(15,23,42,.045)}
body[data-apg-brand-index-logos="v62"] .brand-card-mark{position:relative;display:grid;place-items:center;overflow:hidden;width:46px;height:46px;min-width:46px;border:1px solid #e5ecef;border-radius:10px;background:#fff}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-copy{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0;text-align:left}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-copy strong{overflow:hidden;color:#0f172a;font-size:.82rem;font-weight:760;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-copy small{color:#73828c;font-size:.68rem;line-height:1.25}
body[data-apg-brand-index-logos="v62"] .apg-brand-directory-arrow{flex:0 0 auto;color:#98a6ae;font-size:1.15rem;line-height:1}
body[data-apg-brand-index-logos="v62"] .brand-logo-text-fallback{display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:5px;color:#475569;font-size:.52rem;font-weight:800;line-height:1.08;text-align:center;letter-spacing:-.02em;overflow-wrap:anywhere}
body[data-apg-brand-index-logos="v62"] .brand-card-logo,body[data-apg-brand-detail-logo="v62"] .brand-card-logo{position:absolute!important;inset:5px!important;display:block!important;width:calc(100% - 10px)!important;height:calc(100% - 10px)!important;object-fit:contain!important;object-position:center!important;background:#fff!important}
body[data-apg-brand-index-logos="v62"] .apg-brand-empty{padding:38px 20px;border:1px dashed #cad7dc;border-radius:14px;background:#fafcfc;text-align:center;color:#475569}
body[data-apg-brand-index-logos="v62"] .apg-brand-empty strong,body[data-apg-brand-index-logos="v62"] .apg-brand-empty span{display:block}body[data-apg-brand-index-logos="v62"] .apg-brand-empty span{margin-top:5px;font-size:.82rem;color:#768690}
/* Individual brand page — same resolved identity asset, presented like a premium category hero. */
body[data-apg-brand-detail-logo="v62"] .brand-hero-grid{align-items:center!important;gap:38px!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{display:flex!important;align-items:center!important;justify-content:center!important;min-height:205px!important;padding:26px!important;border:1px solid #dfe7eb!important;border-radius:22px!important;background:linear-gradient(145deg,#fff,#f8fafb)!important;box-shadow:0 12px 36px rgba(15,23,42,.055)!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell{position:relative!important;display:grid!important;place-items:center!important;overflow:hidden!important;width:164px!important;height:164px!important;border:1px solid #e3e9ec!important;border-radius:24px!important;background:#fff!important;box-shadow:0 5px 20px rgba(15,23,42,.04)!important}
body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell .brand-logo-text-fallback{padding:12px;font-size:.95rem!important;color:#334155!important}
@media (max-width:1100px){body[data-apg-brand-index-logos="v62"] .apg-brand-featured-grid{grid-template-columns:repeat(4,minmax(0,1fr))}body[data-apg-brand-index-logos="v62"] .apg-brand-letter-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:780px){body[data-apg-brand-index-logos="v62"] .apg-brand-directory{gap:30px}body[data-apg-brand-index-logos="v62"] .apg-brand-discovery-panel{grid-template-columns:1fr;padding:21px}body[data-apg-brand-index-logos="v62"] .apg-brand-az,body[data-apg-brand-index-logos="v62"] .apg-brand-search-status{grid-column:1}body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading{display:block}body[data-apg-brand-index-logos="v62"] .apg-brand-section-heading>p{max-width:none;margin-top:7px;text-align:left}body[data-apg-brand-index-logos="v62"] .apg-brand-featured-grid{grid-template-columns:repeat(3,minmax(0,1fr))}body[data-apg-brand-index-logos="v62"] .apg-brand-letter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{min-height:165px!important}}
@media (max-width:520px){body[data-apg-brand-index-logos="v62"] .apg-brand-discovery-panel{padding:18px;border-radius:17px}body[data-apg-brand-index-logos="v62"] .apg-brand-featured-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile{min-height:125px;padding:13px 8px}body[data-apg-brand-index-logos="v62"] .apg-featured-brand-mark{width:62px;height:62px}body[data-apg-brand-index-logos="v62"] .apg-brand-letter-grid{grid-template-columns:1fr;gap:8px}body[data-apg-brand-index-logos="v62"] .apg-brand-directory-tile{min-height:64px}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-panel{min-height:132px!important;padding:16px!important;border-radius:17px!important}body[data-apg-brand-detail-logo="v62"] .brand-hero-logo-shell{width:112px!important;height:112px!important;border-radius:18px!important}}
@media (prefers-reduced-motion:reduce){body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile,body[data-apg-brand-index-logos="v62"] .apg-brand-directory-tile{transition:none!important}body[data-apg-brand-index-logos="v62"] .apg-featured-brand-tile:hover{transform:none!important}}
</style>`;

const CLIENT=`<script id="apg-brand-directory-v62-script">(()=>{const root=document.querySelector('[data-apg-brand-directory-v62]');if(!root)return;const input=root.querySelector('[data-apg-brand-search]');const status=root.querySelector('[data-apg-brand-search-status]');const empty=root.querySelector('[data-apg-brand-empty]');const featured=root.querySelector('[data-apg-brand-featured]');const groups=[...root.querySelectorAll('[data-apg-brand-group]')];const tiles=[...root.querySelectorAll('.apg-brand-directory-tile')];if(!input)return;const apply=()=>{const q=input.value.trim().toLowerCase();let shown=0;for(const tile of tiles){const ok=!q||String(tile.dataset.apgBrandName||'').includes(q);tile.hidden=!ok;if(ok)shown++;}for(const group of groups){group.hidden=!group.querySelector('.apg-brand-directory-tile:not([hidden])');}if(featured)featured.hidden=!!q;if(empty)empty.hidden=shown!==0;if(status)status.textContent=q?(shown+' matching '+(shown===1?'brand':'brands')):('${brands.length} brands');};input.addEventListener('input',apply);})();</script>`;

function inject(html,path){
  let out=String(html||'');
  const isIndex=path==='/brands/';
  const isDetail=/^\/brands\/[^/]+\/$/i.test(path)&&!isIndex;
  if((!isIndex&&!isDetail)||out.includes('apg-brand-index-logos-v62'))return out;
  if(isIndex){
    out=replaceBalancedBrandGrid(out,renderBrandDirectory());
    if(!out.includes('data-apg-brand-directory-v62'))return out;
  }else{
    out=enrichBrandDetail(out,path);
    if(!out.includes('brand-hero-logo-shell'))return out;
  }
  out=out.replace('</head>',`${CSS}<meta name="apg-brand-index-logos" content="v${BRAND_INDEX_LOGOS_VERSION}"></head>`);
  out=out.replace(/<body(\s[^>]*)?>/i,(whole,attrs='')=>`<body${attrs||''} ${isIndex?'data-apg-brand-index-logos':'data-apg-brand-detail-logo'}="v62">`);
  if(isIndex)out=out.replace('</body>',`${CLIENT}</body>`);
  return out;
}

async function fetchImage(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/avif,image/webp,image/svg+xml,image/png,image/*,*/*;q=0.5'}});
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!type.startsWith('image/'))return null;
    const length=Number(response.headers.get('content-length')||0);if(length>MAX_IMAGE_BYTES)return null;
    const buffer=Buffer.from(await response.arrayBuffer());if(!buffer.length||buffer.length>MAX_IMAGE_BYTES)return null;
    return {buffer,type,source:url};
  }catch{return null;}finally{clearTimeout(timer);}
}

async function fetchHtml(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const response=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'text/html,application/xhtml+xml'}});
    if(!response.ok)return null;
    const type=String(response.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html')&&!type.includes('application/xhtml'))return null;
    const text=await response.text();
    return {text:text.length>MAX_HTML_BYTES?text.slice(0,MAX_HTML_BYTES):text,url:response.url||url};
  }catch{return null;}finally{clearTimeout(timer);}
}

function absoluteAsset(value,base){
  if(!value)return null;
  const clean=String(value).replace(/&amp;/g,'&').trim();
  if(!clean||clean.startsWith('data:'))return null;
  try{const url=new URL(clean,base);return (url.protocol==='https:'||url.protocol==='http:')?url.href:null;}catch{return null;}
}

function declaredLogoUrls(html,base,brandName=''){
  const found=[];const text=String(html||'');
  const push=value=>{const url=absoluteAsset(value,base);if(url&&!found.includes(url))found.push(url);};
  for(const match of text.matchAll(/"logo"\s*:\s*(?:\{[^}]*"url"\s*:\s*)?["']([^"']+)["']/gi))push(match[1]);
  for(const tag of text.match(/<meta\b[^>]*>/gi)||[]){const key=((tag.match(/\b(?:property|name)=["']([^"']+)["']/i)||[])[1]||'').toLowerCase();if(!/(logo|brand:image)/.test(key))continue;push((tag.match(/\bcontent=["']([^"']+)["']/i)||[])[1]);}
  const brandToken=String(brandName||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(' ')[0]||'';
  for(const tag of text.match(/<img\b[^>]*>/gi)||[]){
    const descriptor=((tag.match(/\b(?:alt|class|id)=["']([^"']+)["']/i)||[])[1]||'').toLowerCase();
    if(!/(logo|wordmark|brand)/.test(descriptor)&&!(brandToken&&descriptor.includes(brandToken)))continue;
    push((tag.match(/\bsrc=["']([^"']+)["']/i)||[])[1]);
    if(found.length>=6)break;
  }
  for(const tag of text.match(/<link\b[^>]*>/gi)||[]){
    const rel=((tag.match(/\brel=["']([^"']+)["']/i)||[])[1]||'').toLowerCase();
    if(!/(mask-icon|apple-touch-icon|shortcut icon|(^|\s)icon(\s|$))/.test(rel))continue;
    push((tag.match(/\bhref=["']([^"']+)["']/i)||[])[1]);
  }
  return found.slice(0,8);
}

async function imageFromOrigin(origin,brandName){
  if(!origin)return null;
  const page=await fetchHtml(origin+'/');
  if(page){
    const candidates=declaredLogoUrls(page.text,page.url,brandName);
    for(const url of candidates){const image=await fetchImage(url);if(image)return image;}
  }
  for(const path of ['/favicon.svg','/apple-touch-icon.png','/favicon.ico']){const image=await fetchImage(new URL(path,origin).href);if(image)return image;}
  return null;
}

async function resolveBrandMark(slug){
  const brandName=brandBySlug.get(slug)||slug;
  const origins=[];
  const official=officialDomains[slug];if(official)origins.push(`https://${official}`);
  const sourceOrigin=sourceOriginByBrandSlug.get(slug);if(sourceOrigin&&!origins.includes(sourceOrigin))origins.push(sourceOrigin);
  for(const origin of origins){const image=await imageFromOrigin(origin,brandName);if(image)return image;}
  const domain=official||(sourceOrigin?new URL(sourceOrigin).hostname:null);
  if(!domain)return null;
  for(const resolver of [`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`,`https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`]){const image=await fetchImage(resolver);if(image)return image;}
  return null;
}

function notFound(res){res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Cache-Control','public, max-age=300, s-maxage=1800');res.end('Brand mark unavailable');}

async function serveBrandMark(req,res,slug){
  if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
  if(!brandBySlug.has(slug))return notFound(res);
  const image=await resolveBrandMark(slug);if(!image)return notFound(res);
  res.statusCode=200;res.setHeader('Content-Type',image.type);res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Brand-Mark-Source','official-domain-resolver');res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();return res.end(image.buffer);
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const markMatch=path.match(/^\/assets\/brand-marks\/([^/]+)$/i);
  if(markMatch){let slug='';try{slug=decodeURIComponent(markMatch[1])}catch{}return serveBrandMark(req,res,slug);}
  res.setHeader('X-APG-Brand-Index-Logos','v'+BRAND_INDEX_LOGOS_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body,path);if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}}return end(body,...args);};
  return downstream(req,res);
}

Object.assign(handler,downstream,{BRAND_INDEX_LOGOS_VERSION,ORIGIN,LOGO_ROUTE_PREFIX,brandBySlug,sourceOriginByBrandSlug,brandStatsBySlug,officialDomains,brandMarkUrl,brandLogoShell,brandDirectoryTile,renderBrandDirectory,enrichBrandCard,enrichBrandDetail,inject,safeSourceOrigin,resolveBrandMark,serveBrandMark,declaredLogoUrls});
module.exports=handler;
