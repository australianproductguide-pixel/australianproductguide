'use strict';

// APG Search Console Opportunity v84.
// Search-demand-informed SEO refinement. This layer sharpens metadata for the
// consumer routes Google is already surfacing and adds lightweight contextual
// internal links from product/comparison pages back into category decision hubs.
// It does not alter suitability scoring, retailer ordering, affiliate logic,
// canonical URLs, indexability, structured-data claims or analytics collection.
const downstream=require('./footer-navigation-v83');
const {categories,products}=require('../data');
const {pairPages}=require('./routes');

const VERSION='84.0';
const ORIGIN='https://australianproductguide.au';

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function displayName(product){
  const brand=String(product&&product.brand||'').trim();
  const name=String(product&&product.name||'').trim();
  if(!brand)return name;
  if(name.toLocaleLowerCase('en-AU').startsWith(brand.toLocaleLowerCase('en-AU')))return name;
  return `${brand} ${name}`.trim();
}
function productForPath(path){const m=String(path||'').match(/^\/products\/([^/]+)\/$/);return m?products.find(p=>p.slug===m[1])||null:null;}
function pairForPath(path){return pairPages.find(pair=>pair.path===path)||null;}
function categoryForPath(path){const m=String(path||'').match(/^\/categories\/([^/]+)\/$/);return m?categories[m[1]]||null:null;}
function setTitle(html,title){const tag=`<title>${esc(title)}</title>`;return /<title>[\s\S]*?<\/title>/i.test(html)?html.replace(/<title>[\s\S]*?<\/title>/i,tag):html.replace('</head>',tag+'</head>');}
function setMeta(html,attr,name,content){
  const pattern=new RegExp(`<meta\\b(?=[^>]*\\b${escapeRegex(attr)}=["']${escapeRegex(name)}["'])[^>]*>`,'i');
  const tag=`<meta ${attr}="${esc(name)}" content="${esc(content)}">`;
  return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',tag+'</head>');
}
function patchSharedMetadata(html,title,description){
  let out=setTitle(String(html||''),title);
  out=setMeta(out,'name','description',description);
  out=setMeta(out,'property','og:title',title);
  out=setMeta(out,'property','og:description',description);
  out=setMeta(out,'name','twitter:title',title);
  out=setMeta(out,'name','twitter:description',description);
  return out;
}
function patchProductMetadata(html,product){
  const name=displayName(product);
  const title=`${name} Review Australia | Comparison & Buying Guide`;
  const description=`Desk-researched ${name} buying guide for Australia: who it suits, key trade-offs, maintained evidence, alternatives and retailer pathways.`;
  return patchSharedMetadata(html,title,description);
}
function patchPairMetadata(html,pair){
  const a=displayName(pair.a),b=displayName(pair.b);
  const title=`${a} vs ${b} Australia | Comparison & Key Differences`;
  const description=`${a} vs ${b}: compare who each suits, key differences, trade-offs and Australian retailer pathways using APG's desk-researched evidence.`;
  return patchSharedMetadata(html,title,description);
}
function patchCategoryMetadata(html,category){
  const title=`${category.label} Australia | Compare Products & Buying Guide`;
  const factors=(category.factors||[]).slice(0,3).map(x=>String(x).toLowerCase());
  const detail=factors.length?` by ${factors.join(', ')}`:'';
  const description=`Compare ${category.label.toLowerCase()} in Australia${detail}. Explore maintained products, trade-offs, a buying guide and Help Me Choose.`;
  return patchSharedMetadata(html,title,description);
}
function researchLinks(category){
  if(!category)return '';
  const label=category.label;
  const slug=category.slug;
  return `<section class="section apg-search-paths" aria-labelledby="apgSearchPaths"><div class="wrap"><div class="section-head"><div><p class="kicker">Keep researching</p><h2 id="apgSearchPaths">Explore ${esc(label.toLowerCase())} by decision</h2><p>Move between the category guide, buying guide, focused comparison and finder without losing the decision context.</p></div></div><div class="link-list"><a href="/categories/${esc(slug)}/">Compare ${esc(label.toLowerCase())} in Australia →</a><a href="/guides/${esc(slug)}-buying-guide/">${esc(label)} buying guide →</a><a href="/compare/${esc(slug)}/">Compare maintained models →</a><a href="/categories/${esc(slug)}/finder/">Help me choose →</a></div></div></section>`;
}
function patchResearchLinks(html,category){
  let out=String(html||'');
  if(!category||out.includes('class="section apg-search-paths"'))return out;
  const section=researchLinks(category);
  if(!section)return out;
  if(out.includes('<div id="where-to-buy"'))return out.replace('<div id="where-to-buy"',section+'<div id="where-to-buy"');
  if(out.includes('</main>'))return out.replace('</main>',section+'</main>');
  return out;
}
function optimiseHtml(html,path){
  const product=productForPath(path),pair=pairForPath(path),category=product?categories[product.category]:(pair?categories[pair.category]:categoryForPath(path));
  let out=String(html||'');
  if(product)out=patchProductMetadata(out,product);
  else if(pair)out=patchPairMetadata(out,pair);
  else if(category)out=patchCategoryMetadata(out,category);
  if((product||pair)&&category)out=patchResearchLinks(out,category);
  if(!out.includes('name="apg-search-console-optimisation"'))out=out.replace('</head>',`<meta name="apg-search-console-optimisation" content="v${VERSION}"></head>`);
  return out;
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Search-Console-Optimisation','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=optimiseHtml(original,path);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{SEARCH_CONSOLE_OPTIMISATION_VERSION:VERSION,searchConsoleProductForPath:productForPath,searchConsolePairForPath:pairForPath,searchConsoleCategoryForPath:categoryForPath,patchSearchConsoleProductMetadata:patchProductMetadata,patchSearchConsolePairMetadata:patchPairMetadata,patchSearchConsoleCategoryMetadata:patchCategoryMetadata,searchConsoleResearchLinks:researchLinks,patchSearchConsoleResearchLinks:patchResearchLinks,optimiseSearchConsoleHtml:optimiseHtml});
module.exports=handler;
