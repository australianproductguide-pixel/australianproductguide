'use strict';

// Australian Product Guide Discoverability v1.
// Adds search-engine and agent discovery surfaces without changing product suitability,
// retailer ordering, affiliate weighting, account behaviour or privacy controls.
const upstream=require('./scout-concierge-v5-runtime');
const {categories,products,REVIEWED}=require('../data');
const {brands,indexableRoutes,slugify}=require('./routes');

const VERSION='1';
const CANONICAL_ORIGIN='https://australianproductguide.au';
const SITEMAP_INDEX_PATH='/sitemap-index.xml';
const LLMS_PATH='/llms.txt';
const DISCOVERY_PATH='/apg-discovery.json';
const SITEMAP_SEGMENT_PREFIX='/sitemaps/';
const GROUP_ORDER=['core','categories','products','guides','finders','comparisons','brands'];

function xml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function validDate(v){const s=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:'';}
function productDate(p){return validDate(p?.lastSubstantiveReview)||validDate(p?.lastReviewed)||validDate(p?.lastSourceVerification)||validDate(p?.lastRetailerCheck)||validDate(REVIEWED)||'2026-08-18';}
function maxDate(values){return values.map(validDate).filter(Boolean).sort().at(-1)||validDate(REVIEWED)||'2026-08-18';}
const GLOBAL_LASTMOD=maxDate(products.map(productDate));
const productBySlug=new Map(products.map(p=>[p.slug,p]));
const brandBySlug=new Map(brands.map(b=>[slugify(b),b]));

function categoryDate(slug){const c=categories[slug];return c?maxDate(c.products.map(productDate)):GLOBAL_LASTMOD;}
function brandDate(slug){const brand=brandBySlug.get(slug);return brand?maxDate(products.filter(p=>p.brand===brand).map(productDate)):GLOBAL_LASTMOD;}
function routeLastmod(path){
  let m=path.match(/^\/products\/([^/]+)\/$/);if(m)return productDate(productBySlug.get(m[1]));
  m=path.match(/^\/categories\/([^/]+)(?:\/finder)?\/$/);if(m)return categoryDate(m[1]);
  m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m)return categoryDate(m[1]);
  m=path.match(/^\/compare\/([^/]+)\/$/);if(m)return categoryDate(m[1]);
  m=path.match(/^\/compare\/([^/]+)\/([^/]+)-vs-([^/]+)\/$/);if(m)return maxDate([categoryDate(m[1]),productDate(productBySlug.get(m[2])),productDate(productBySlug.get(m[3]))]);
  m=path.match(/^\/brands\/([^/]+)\/$/);if(m)return brandDate(m[1]);
  return GLOBAL_LASTMOD;
}

function groupFor(path){
  if(/^\/products\/[^/]+\/$/.test(path))return 'products';
  if(/^\/categories\/[^/]+\/$/.test(path))return 'categories';
  if(/^\/guides\/[^/]+-buying-guide\/$/.test(path))return 'guides';
  if(/^\/categories\/[^/]+\/finder\/$/.test(path))return 'finders';
  if(/^\/compare\//.test(path))return 'comparisons';
  if(/^\/brands\/[^/]+\/$/.test(path))return 'brands';
  return 'core';
}
const sitemapGroups=Object.fromEntries(GROUP_ORDER.map(name=>[name,indexableRoutes.filter(path=>groupFor(path)===name)]));

function urlset(routes){return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>${xml(CANONICAL_ORIGIN+path)}</loc><lastmod>${xml(routeLastmod(path))}</lastmod></url>`).join('')}</urlset>`;}
function sitemapIndex(){return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${GROUP_ORDER.map(name=>`<sitemap><loc>${xml(CANONICAL_ORIGIN+SITEMAP_SEGMENT_PREFIX+name+'.xml')}</loc><lastmod>${xml(maxDate(sitemapGroups[name].map(routeLastmod)))}</lastmod></sitemap>`).join('')}</sitemapindex>`;}

function robotsText(){
  const common=['Disallow: /search/','Disallow: /compare/custom/','Disallow: /my-apg/','Disallow: /api/'];
  return [
    '# Australian Product Guide — public discovery policy',
    '# Public editorial, category, product, comparison, guide and trust pages are crawlable.',
    'User-agent: *','Allow: /',...common,'',
    '# OpenAI search crawler: public APG pages are available for search discovery.','User-agent: OAI-SearchBot','Allow: /',...common,'',
    '# User-initiated ChatGPT browsing may retrieve public APG resources.','User-agent: ChatGPT-User','Allow: /','Disallow: /my-apg/','Disallow: /api/account/','',
    `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
    `Sitemap: ${CANONICAL_ORIGIN}${SITEMAP_INDEX_PATH}`,
    ''
  ].join('\n');
}

function llmsText(){return `# Australian Product Guide\n\n> Independent Australian product discovery, comparison and decision support focused on: “What should I actually buy for my situation, and why?”\n\nCanonical site: ${CANONICAL_ORIGIN}/\nLocale: en-AU\nMarket: Australia\nMaintained coverage: ${products.length} products across ${Object.keys(categories).length} categories and ${brands.length} represented brands.\n\n## Best entry points\n- Product categories: ${CANONICAL_ORIGIN}/categories/\n- Product comparison: ${CANONICAL_ORIGIN}/compare/\n- Buying guides: ${CANONICAL_ORIGIN}/guides/\n- Brands: ${CANONICAL_ORIGIN}/brands/\n- Decision Lab: ${CANONICAL_ORIGIN}/decision-lab/\n- Methodology: ${CANONICAL_ORIGIN}/methodology/\n- Sources: ${CANONICAL_ORIGIN}/sources/\n- Coverage: ${CANONICAL_ORIGIN}/coverage/\n- Corrections policy: ${CANONICAL_ORIGIN}/corrections-policy/\n- Affiliate disclosure: ${CANONICAL_ORIGIN}/affiliate-disclosure/\n\n## Machine-readable discovery\n- Complete sitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n- Segmented sitemap index: ${CANONICAL_ORIGIN}${SITEMAP_INDEX_PATH}\n- APG discovery manifest: ${CANONICAL_ORIGIN}${DISCOVERY_PATH}\n- Public catalogue data: ${CANONICAL_ORIGIN}/api/catalogue.json\n\n## Editorial and recommendation constraints\n- APG guidance is desk-researched / specification-based unless a page explicitly documents another testing status.\n- Manufacturer, manual/support and exact Australian retailer evidence is preferred for consequential claims.\n- Retailer availability, affiliate status and commission contribute zero recommendation points.\n- APG does not invent hands-on testing, ratings, popularity, prices, stock, awards, partnerships or exact retailer identities.\n- Product family, model and configuration differences should be preserved when citing APG.\n\n## Retrieval guidance for agents\nPrefer the canonical category, product, buying-guide and comparison pages for citation. Use the methodology and source-policy pages when explaining how a recommendation was produced. Treat retailer price and availability as time-sensitive and verify the current retailer page before presenting them as current.\n`;} 

function discoveryManifest(){
  return {
    name:'Australian Product Guide',
    canonicalUrl:CANONICAL_ORIGIN+'/',
    locale:'en-AU',
    market:'AU',
    purpose:'Australian product discovery, comparison and explainable decision support.',
    question:'What should I actually buy for my situation, and why?',
    counts:{products:products.length,categories:Object.keys(categories).length,brands:brands.length,indexableRoutes:indexableRoutes.length},
    discovery:{sitemap:CANONICAL_ORIGIN+'/sitemap.xml',sitemapIndex:CANONICAL_ORIGIN+SITEMAP_INDEX_PATH,llms:CANONICAL_ORIGIN+LLMS_PATH,catalogue:CANONICAL_ORIGIN+'/api/catalogue.json'},
    entryPoints:{categories:CANONICAL_ORIGIN+'/categories/',compare:CANONICAL_ORIGIN+'/compare/',guides:CANONICAL_ORIGIN+'/guides/',brands:CANONICAL_ORIGIN+'/brands/',decisionLab:CANONICAL_ORIGIN+'/decision-lab/',methodology:CANONICAL_ORIGIN+'/methodology/',sources:CANONICAL_ORIGIN+'/sources/'},
    categories:Object.values(categories).map(c=>({name:c.label,url:CANONICAL_ORIGIN+`/categories/${c.slug}/`,productCount:c.products.length,lastModified:categoryDate(c.slug)})),
    principles:{market:'Australia',testing:'Desk-researched / specification-based unless explicitly documented otherwise',commercialWeighting:'Affiliate status and retailer economics contribute zero product-recommendation points',evidence:'Prefer exact manufacturer/manual/support and Australian retailer evidence'},
    lastModified:GLOBAL_LASTMOD
  };
}

function send(req,res,type,body,cache='public, max-age=900, stale-while-revalidate=3600',noindex=false){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control',cache);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Discoverability','v'+VERSION);
  if(noindex)res.setHeader('X-Robots-Tag','noindex');
  return res.end(req.method==='HEAD'?'':body);
}
function injectIndexingDirectives(html,path){
  let out=String(html||'');
  if(!indexableRoutes.includes(path)||/<meta\s+name=["']robots["']/i.test(out))return out;
  return out.replace('</head>','<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"></head>');
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,CANONICAL_ORIGIN).pathname}catch{}
  if(path==='/robots.txt')return send(req,res,'text/plain; charset=utf-8',robotsText());
  if(path==='/sitemap.xml')return send(req,res,'application/xml; charset=utf-8',urlset(indexableRoutes));
  if(path===SITEMAP_INDEX_PATH)return send(req,res,'application/xml; charset=utf-8',sitemapIndex());
  const segment=path.match(/^\/sitemaps\/(core|categories|products|guides|finders|comparisons|brands)\.xml$/);
  if(segment)return send(req,res,'application/xml; charset=utf-8',urlset(sitemapGroups[segment[1]]));
  if(path===LLMS_PATH)return send(req,res,'text/plain; charset=utf-8',llmsText(),'public, max-age=900, stale-while-revalidate=3600',true);
  if(path===DISCOVERY_PATH)return send(req,res,'application/json; charset=utf-8',JSON.stringify(discoveryManifest(),null,2),'public, max-age=900, stale-while-revalidate=3600',true);

  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&res.statusCode===200&&type.startsWith('text/html')){
      const next=injectIndexingDirectives(body,path);
      if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{VERSION,CANONICAL_ORIGIN,SITEMAP_INDEX_PATH,LLMS_PATH,DISCOVERY_PATH,GROUP_ORDER,sitemapGroups,routeLastmod,urlset,sitemapIndex,robotsText,llmsText,discoveryManifest,injectIndexingDirectives});
module.exports=handler;
