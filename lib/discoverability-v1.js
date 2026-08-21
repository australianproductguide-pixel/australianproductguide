'use strict';

// Australian Product Guide Discoverability v1.
// Adds search-engine and agent discovery surfaces without changing product suitability,
// retailer ordering, affiliate weighting, account behaviour or privacy controls.
//
// Freshness policy: sitemap lastmod is intentionally omitted until APG maintains
// route-specific material-change provenance. Catalogue evidence/review dates are not
// interchangeable with page modification dates and must not be presented as such.
const upstream=require('./scout-concierge-v5-runtime');
const {categories,products}=require('../data');
const {brands,indexableRoutes}=require('./routes');

const VERSION='1';
const CANONICAL_ORIGIN='https://australianproductguide.au';
const SITEMAP_INDEX_PATH='/sitemap-index.xml';
const LLMS_PATH='/llms.txt';
const DISCOVERY_PATH='/apg-discovery.json';
const SITEMAP_SEGMENT_PREFIX='/sitemaps/';
const GROUP_ORDER=['core','categories','products','guides','finders','comparisons','brands'];

function xml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}

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

function urlset(routes){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>${xml(CANONICAL_ORIGIN+path)}</loc></url>`).join('')}</urlset>`;
}
function sitemapIndex(){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${GROUP_ORDER.map(name=>`<sitemap><loc>${xml(CANONICAL_ORIGIN+SITEMAP_SEGMENT_PREFIX+name+'.xml')}</loc></sitemap>`).join('')}</sitemapindex>`;
}

function robotsText(){
  const crawlCommon=['Disallow: /search/','Disallow: /compare/custom/','Disallow: /my-apg/','Disallow: /api/'];
  const userFetchPrivate=['Disallow: /my-apg/','Disallow: /api/account/'];
  const crawlGroup=(agent,comment)=>[comment,`User-agent: ${agent}`,'Allow: /',...crawlCommon,''];
  const userGroup=(agent,comment)=>[comment,`User-agent: ${agent}`,'Allow: /',...userFetchPrivate,''];
  return [
    '# Australian Product Guide — public discovery policy',
    '# Public editorial, category, product, comparison, guide and trust pages are crawlable.',
    'User-agent: *','Allow: /',...crawlCommon,'',
    ...crawlGroup('Googlebot','# Google Search, including AI Overviews and AI Mode eligibility.'),
    ...crawlGroup('bingbot','# Microsoft Bing search crawler.'),
    ...crawlGroup('OAI-SearchBot','# OpenAI search crawler for ChatGPT Search discovery.'),
    ...userGroup('ChatGPT-User','# User-initiated ChatGPT browsing of public APG resources.'),
    ...crawlGroup('PerplexityBot','# Perplexity search crawler.'),
    ...userGroup('Perplexity-User','# User-initiated Perplexity retrieval of public APG resources.'),
    ...crawlGroup('Claude-SearchBot','# Anthropic search crawler for Claude search visibility.'),
    ...userGroup('Claude-User','# User-initiated Claude retrieval of public APG resources.'),
    `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
    `Sitemap: ${CANONICAL_ORIGIN}${SITEMAP_INDEX_PATH}`,
    ''
  ].join('\n');
}

function llmsText(){return `# Australian Product Guide\n\n> Independent Australian product discovery, comparison and decision support focused on: “What should I actually buy for my situation, and why?”\n\nCanonical site: ${CANONICAL_ORIGIN}/\nLocale: en-AU\nMarket: Australia\nMaintained coverage: ${products.length} products across ${Object.keys(categories).length} categories and ${brands.length} represented brands.\n\nAPG guidance is desk-researched / specification-based unless a page explicitly documents another testing status. Manufacturer, manual/support and exact Australian retailer evidence is preferred for consequential claims. Retailer availability, affiliate status and commission contribute zero recommendation points. APG does not invent hands-on testing, ratings, popularity, prices, stock, awards, partnerships or exact retailer identities. Product family, model and configuration differences should be preserved when citing APG. Sitemap page-modification dates are omitted unless APG has route-specific material-change provenance; product evidence and retailer verification dates remain separate freshness signals.\n\nFor retrieval, prefer the canonical category, product, buying-guide and comparison pages for citation. Use the methodology and source-policy pages when explaining how a recommendation was produced. Treat retailer price and availability as time-sensitive and verify the current retailer page before presenting them as current.\n\n## Best entry points\n- [Product categories](${CANONICAL_ORIGIN}/categories/): Browse APG's maintained Australian product categories.\n- [Product comparison](${CANONICAL_ORIGIN}/compare/): Compare meaningful product differences side by side.\n- [Buying guides](${CANONICAL_ORIGIN}/guides/): Understand category-level decision factors and trade-offs.\n- [Brands](${CANONICAL_ORIGIN}/brands/): Browse represented brands and maintained product coverage.\n- [Decision Lab](${CANONICAL_ORIGIN}/decision-lab/): Start with budget, needs, priorities and deal-breakers.\n\n## Trust and methodology\n- [Methodology](${CANONICAL_ORIGIN}/methodology/): How APG builds explainable recommendations and comparisons.\n- [Sources](${CANONICAL_ORIGIN}/sources/): APG evidence hierarchy, provenance and source standards.\n- [Coverage](${CANONICAL_ORIGIN}/coverage/): Current catalogue and retailer coverage boundaries.\n- [Corrections policy](${CANONICAL_ORIGIN}/corrections-policy/): How APG handles corrections and controlled changes.\n- [Affiliate disclosure](${CANONICAL_ORIGIN}/affiliate-disclosure/): Commercial transparency and affiliate principles.\n\n## Machine-readable discovery\n- [Complete sitemap](${CANONICAL_ORIGIN}/sitemap.xml): Canonical indexable APG routes.\n- [Segmented sitemap index](${CANONICAL_ORIGIN}${SITEMAP_INDEX_PATH}): Sitemaps grouped by APG content type.\n- [APG discovery manifest](${CANONICAL_ORIGIN}${DISCOVERY_PATH}): Machine-readable APG purpose, counts, entry points and principles.\n- [Public catalogue data](${CANONICAL_ORIGIN}/api/catalogue.json): Public maintained product catalogue data.\n`;}

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
    categories:Object.values(categories).map(c=>({name:c.label,url:CANONICAL_ORIGIN+`/categories/${c.slug}/`,productCount:c.products.length})),
    principles:{
      market:'Australia',
      testing:'Desk-researched / specification-based unless explicitly documented otherwise',
      commercialWeighting:'Affiliate status and retailer economics contribute zero product-recommendation points',
      evidence:'Prefer exact manufacturer/manual/support and Australian retailer evidence',
      freshness:'Page modification dates are not published unless route-specific material-change provenance is maintained; product evidence and retailer verification dates remain separate.'
    }
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

Object.assign(handler,upstream,{VERSION,CANONICAL_ORIGIN,SITEMAP_INDEX_PATH,LLMS_PATH,DISCOVERY_PATH,GROUP_ORDER,sitemapGroups,urlset,sitemapIndex,robotsText,llmsText,discoveryManifest,injectIndexingDirectives});
module.exports=handler;
