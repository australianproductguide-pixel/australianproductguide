const {categories,pathways,products}=require('../data');
const {trust,brands,pairPages,indexableRoutes,slugify}=require('./routes');
const pages=require('./pages');
const decisionPages=require('./decision-page');
const platformPages=require('./platform-v3');
const {enhance:enhancePlatformV3}=require('./platform-v3-runtime');
const {enhance:enhancePlatformV5}=require('./platform-v5-runtime');
const {enhance:enhancePlatformV7}=require('./platform-v7-runtime');
const {enhanceAccountPolicy}=require('./account-policy');
const coffeeFinder=require('./coffee-finder');
const {searchIndex}=require('./search');
const {publicDecision}=require('./decision-engine');
const {catalogueCsv,catalogueJson}=require('./catalogue-export');
const {clientJs}=require('./client');
const {decisionClientJs}=require('./decision-client');
const {platformV3ClientJs}=require('./platform-v3-client');
const {accountSyncClientJs}=require('./account-sync-client');
const {rumClientJs}=require('./rum-client');
const {decisionCss}=require('./decision-css');
const {platformV3Css}=require('./platform-v3-css');
const {platformV5Css}=require('./platform-v5-css');
const {platformV6Css}=require('./platform-v6-css');
const {platformV7Css}=require('./platform-v7-css');
const {platformV7RichCss}=require('./platform-v7-rich-css');
const {origin,css}=require('./ui');
const {logoSvg,logoDarkSvg,socialSvg}=require('./brand-v7');
const redirects={
  '/coffee-machines':'/categories/coffee-machines/',
  '/coffee-machines/finder':'/categories/coffee-machines/finder/',
  '/coffee-machines/compare':'/compare/coffee-machines/',
  '/coffee-machines/manual-vs-automatic':'/guides/coffee-machines-buying-guide/',
  '/coffee-machines/best-for-beginners':'/categories/coffee-machines/finder/',
  '/coffee-machines/best-for-milk-drinks':'/categories/coffee-machines/finder/'
};
function headers(res){
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data: https://*.media-amazon.com https://m.media-amazon.com; connect-src 'self' https://gozovvhofdsshjuixcys.supabase.co; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests");
}
function send(req,res,status,type,body,extra={}){res.statusCode=status;res.setHeader('Content-Type',type);for(const [k,v] of Object.entries(extra))res.setHeader(k,v);return res.end(req.method==='HEAD'?'':body);}
function readOnly(req,res){if(['GET','HEAD'].includes(req.method))return false;res.setHeader('Allow','GET, HEAD');send(req,res,405,'application/json; charset=utf-8',JSON.stringify({error:'Method not allowed'}),{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'});return true;}
function xmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function rumBody(req,done){let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>4096){raw='';req.destroy();}});req.on('end',()=>{let data={};try{data=JSON.parse(raw||'{}')}catch{}const path=typeof data.path==='string'&&/^\/[a-z0-9/_-]*$/i.test(data.path)?data.path.slice(0,180):'/';const viewport=['mobile','tablet','desktop'].includes(data.viewport)?data.viewport:'unknown';const nav=['navigate','reload','back_forward','prerender'].includes(data.nav)?data.nav:'unknown';const metrics={};for(const k of ['LCP','CLS','INP','FCP','TTFB']){const v=Number(data.metrics?.[k]);if(Number.isFinite(v)&&v>=0&&v<120000)metrics[k]=v;}console.log('APG_RUM '+JSON.stringify({path,viewport,nav,metrics}));done();});req.on('error',done);}
function enhanceDecisionShell(html){
  if(!html)return html;
  return html
    .replace('<a href="/categories/">Categories</a><a href="/compare/coffee-machines/">Compare</a>','<a href="/categories/">Categories</a><a href="/decision-lab/" data-decision-nav class="apg-power-link">Decision Lab</a><a href="/compare/coffee-machines/">Compare</a>')
    .replace('<a class="header-action" href="/#recentlyViewed" title="Saved and recently viewed on this device">','<a class="header-action apg-workspace-link" href="/my-apg/" title="Open your private APG decision workspace">')
    .replace('<span>Saved</span></a></div>','<span>My APG</span></a></div>')
    .replace('<a class="mobile-recent" href="/#recentlyViewed">Saved & recently viewed <span aria-hidden="true">→</span></a>','<a class="mobile-recent apg-power-link" data-decision-nav href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a><a class="mobile-recent" href="/my-apg/">My APG <span aria-hidden="true">→</span></a>')
    .replace('<a href="/search/">Search</a><a href="/#recentlyViewed">Recently viewed</a>','<a href="/search/">Search</a><a href="/decision-lab/">Decision Lab</a><a href="/my-apg/">My APG</a>');
}
function renderV7(html,path,u){return enhancePlatformV7(enhancePlatformV5(enhancePlatformV3(enhanceDecisionShell(html),path,u),path,u),path,u);}
module.exports=(req,res)=>{
  headers(res);
  let u;try{u=new URL(req.url,'https://example.invalid')}catch{return send(req,res,400,'text/plain; charset=utf-8','Bad request')}
  let path;try{path=decodeURIComponent(u.pathname).replace(/\/{2,}/g,'/')}catch{return send(req,res,400,'text/plain; charset=utf-8','Bad request')}
  if(redirects[path]){res.statusCode=308;res.setHeader('Location',redirects[path]);return res.end();}
  if(path==='/api/rum'||path==='/api/rum/'){
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(req,res,405,'application/json; charset=utf-8',JSON.stringify({error:'Method not allowed'}),{'Cache-Control':'no-store','X-Robots-Tag':'noindex'});}
    return rumBody(req,()=>send(req,res,204,'text/plain; charset=utf-8','',{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}));
  }
  if(path==='/api/decision'||path==='/api/decision/'){
    if(readOnly(req,res))return;
    const result=publicDecision(u.searchParams.get('q')||'',{category:u.searchParams.get('category')||'',budget:u.searchParams.get('budget')||'',brand:u.searchParams.get('brand')||''});
    return send(req,res,200,'application/json; charset=utf-8',JSON.stringify(result),{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex'});
  }
  if(path==='/api/catalogue.csv'){
    if(readOnly(req,res))return;
    return send(req,res,200,'text/csv; charset=utf-8',catalogueCsv(),{'Cache-Control':'public, max-age=3600','X-Robots-Tag':'noindex','Content-Disposition':'inline; filename="apg-platform-v7-catalogue.csv"'});
  }
  if(path==='/api/catalogue.json'){
    if(readOnly(req,res))return;
    return send(req,res,200,'application/json; charset=utf-8',JSON.stringify(catalogueJson()),{'Cache-Control':'public, max-age=3600','X-Robots-Tag':'noindex'});
  }
  if(path==='/assets/site.css')return send(req,res,200,'text/css; charset=utf-8',css+decisionCss+platformV3Css+platformV5Css+platformV6Css+platformV7Css+platformV7RichCss,{'Cache-Control':'public, max-age=3600'});
  if(path==='/assets/app.js')return send(req,res,200,'application/javascript; charset=utf-8',clientJs+decisionClientJs+platformV3ClientJs+accountSyncClientJs+rumClientJs,{'Cache-Control':'public, max-age=3600'});
  if(path==='/assets/search-index.json')return send(req,res,200,'application/json; charset=utf-8',JSON.stringify(searchIndex()),{'Cache-Control':'public, max-age=3600'});
  if(path==='/assets/logo.svg')return send(req,res,200,'image/svg+xml; charset=utf-8',logoSvg,{'Cache-Control':'public, max-age=86400'});
  if(path==='/assets/logo-dark.svg')return send(req,res,200,'image/svg+xml; charset=utf-8',logoDarkSvg,{'Cache-Control':'public, max-age=86400'});
  if(path==='/assets/social.svg')return send(req,res,200,'image/svg+xml; charset=utf-8',socialSvg,{'Cache-Control':'public, max-age=86400'});
  if(path==='/robots.txt')return send(req,res,200,'text/plain; charset=utf-8',`User-agent: *\nAllow: /\nDisallow: /search/\nDisallow: /compare/custom/\nDisallow: /my-apg/\nSitemap: ${origin(req)}/sitemap.xml\n`);
  if(path==='/sitemap.xml'){
    const o=origin(req),body='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/sitemap/0.9">'+indexableRoutes.map(x=>`<url><loc>${xmlEscape(o+x)}</loc><lastmod>2026-08-16</lastmod></url>`).join('')+'</urlset>';
    return send(req,res,200,'application/xml; charset=utf-8',body);
  }
  if(path!=='/'&&!path.endsWith('/')){res.statusCode=308;res.setHeader('Location',path+'/'+u.search);return res.end();}
  let html=null;
  if(path==='/')html=pages.home(req);
  else if(path==='/categories/')html=pages.categoriesIndex(req);
  else if(path==='/compare/')html=platformPages.compareHub(req);
  else if(path==='/guides/')html=platformPages.guidesHub(req);
  else if(path==='/retailers/')html=platformPages.retailersHub(req);
  else if(path==='/decision-lab/')html=decisionPages.decisionLab(req,u);
  else if(path==='/my-apg/')html=decisionPages.workspace(req);
  else if(path==='/search/')html=pages.searchPage(req,u);
  else if(path==='/sitemap/')html=pages.sitemapHtml(req);
  else if(path==='/brands/')html=pages.brandsIndex(req);
  else if(path==='/compare/custom/')html=pages.customCompare(req,u);
  else {const trustSlug=path.slice(1,-1);if(trust.includes(trustSlug))html=pages.trustPage(req,trustSlug);}
  if(!html){const m=path.match(/^\/categories\/([^/]+)\/$/);if(m){const c=categories[m[1]];if(c)html=pages.categoryPage(req,c,u);else{const p=pathways.find(x=>x.slug===m[1]);if(p)html=pages.pathwayPage(req,p);}}}
  if(!html){const m=path.match(/^\/categories\/([^/]+)\/finder\/$/);if(m&&categories[m[1]])html=m[1]==='coffee-machines'?coffeeFinder.render(req,u):pages.finderPage(req,categories[m[1]],u);}
  if(!html){const m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m&&categories[m[1]])html=pages.guidePage(req,categories[m[1]]);}
  if(!html){const m=path.match(/^\/compare\/([^/]+)\/$/);if(m&&categories[m[1]])html=pages.compareIndex(req,categories[m[1]]);}
  if(!html){const x=pairPages.find(x=>x.path===path);if(x)html=pages.pairPage(req,x);}
  if(!html){const m=path.match(/^\/products\/([^/]+)\/$/);if(m){const p=products.find(x=>x.slug===m[1]);if(p)html=pages.productPage(req,p);}}
  if(!html){const m=path.match(/^\/brands\/([^/]+)\/$/);if(m){const b=brands.find(x=>slugify(x)===m[1]);if(b)html=pages.brandPage(req,b);}}
  if(html){html=enhanceAccountPolicy(html,path);return send(req,res,200,'text/html; charset=utf-8',renderV7(html,path,u));}
  return send(req,res,404,'text/html; charset=utf-8',renderV7(pages.notFound(req),path,u),{'X-Robots-Tag':'noindex,follow'});
};
