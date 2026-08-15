const {categories,pathways,products}=require('../data');
const {trust,brands,pairPages,indexableRoutes,slugify}=require('./routes');
const pages=require('./pages');
const coffeeFinder=require('./coffee-finder');
const {origin,css,logoSvg,socialSvg}=require('./ui');
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
}
function send(req,res,status,type,body,extra={}){res.statusCode=status;res.setHeader('Content-Type',type);for(const [k,v] of Object.entries(extra))res.setHeader(k,v);return res.end(req.method==='HEAD'?'':body);}
function xmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
module.exports=(req,res)=>{
  headers(res);
  let u;try{u=new URL(req.url,'https://example.invalid')}catch{return send(req,res,400,'text/plain; charset=utf-8','Bad request')}
  let path=decodeURIComponent(u.pathname).replace(/\/{2,}/g,'/');
  if(redirects[path]){res.statusCode=308;res.setHeader('Location',redirects[path]);return res.end();}
  if(path==='/assets/site.css')return send(req,res,200,'text/css; charset=utf-8',css,{'Cache-Control':'public, max-age=3600'});
  if(path==='/assets/logo.svg')return send(req,res,200,'image/svg+xml; charset=utf-8',logoSvg,{'Cache-Control':'public, max-age=86400'});
  if(path==='/assets/social.svg')return send(req,res,200,'image/svg+xml; charset=utf-8',socialSvg,{'Cache-Control':'public, max-age=86400'});
  if(path==='/robots.txt')return send(req,res,200,'text/plain; charset=utf-8',`User-agent: *\nAllow: /\nDisallow: /search/\nSitemap: ${origin(req)}/sitemap.xml\n`);
  if(path==='/sitemap.xml'){
    const o=origin(req),body='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+indexableRoutes.map(x=>`<url><loc>${xmlEscape(o+x)}</loc><lastmod>2026-08-15</lastmod></url>`).join('')+'</urlset>';
    return send(req,res,200,'application/xml; charset=utf-8',body);
  }
  if(path!=='/'&&!path.endsWith('/')){res.statusCode=308;res.setHeader('Location',path+'/'+u.search);return res.end();}
  let html=null;
  if(path==='/')html=pages.home(req);
  else if(path==='/categories/')html=pages.categoriesIndex(req);
  else if(path==='/search/')html=pages.searchPage(req,u);
  else if(path==='/sitemap/')html=pages.sitemapHtml(req);
  else if(path==='/brands/')html=pages.brandsIndex(req);
  else {
    const trustSlug=path.slice(1,-1);if(trust.includes(trustSlug))html=pages.trustPage(req,trustSlug);
  }
  if(!html){
    let m=path.match(/^\/categories\/([^/]+)\/$/);
    if(m){const c=categories[m[1]];if(c)html=pages.categoryPage(req,c);else{const p=pathways.find(x=>x.slug===m[1]);if(p)html=pages.pathwayPage(req,p);}}
  }
  if(!html){const m=path.match(/^\/categories\/([^/]+)\/finder\/$/);if(m&&categories[m[1]])html=m[1]==='coffee-machines'?coffeeFinder.render(req,u):pages.finderPage(req,categories[m[1]],u);}
  if(!html){const m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m&&categories[m[1]])html=pages.guidePage(req,categories[m[1]]);}
  if(!html){const m=path.match(/^\/compare\/([^/]+)\/$/);if(m&&categories[m[1]])html=pages.compareIndex(req,categories[m[1]]);}
  if(!html){const x=pairPages.find(x=>x.path===path);if(x)html=pages.pairPage(req,x);}
  if(!html){const m=path.match(/^\/products\/([^/]+)\/$/);if(m){const p=products.find(x=>x.slug===m[1]);if(p)html=pages.productPage(req,p);}}
  if(!html){const m=path.match(/^\/brands\/([^/]+)\/$/);if(m){const b=brands.find(x=>slugify(x)===m[1]);if(b)html=pages.brandPage(req,b);}}
  if(html)return send(req,res,200,'text/html; charset=utf-8',html);
  return send(req,res,404,'text/html; charset=utf-8',pages.notFound(req),{'X-Robots-Tag':'noindex,follow'});
};
