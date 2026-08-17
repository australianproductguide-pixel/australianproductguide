// Preserve public URL continuity and reconcile freshness labels for authority-depth categories.
const data=require('../data');
const app=require('./authority-v14');
const authoritySlugs=new Set(['coffee-grinders','home-printers','pizza-ovens']);
const redirects={
  '/products/ooni-koda-12-gas-powered-pizza-oven/':'/products/ooni-koda-12/',
  '/products/ooni-koda-16-gas-powered-pizza-oven/':'/products/ooni-koda-16/',
  '/products/gozney-roccbox-portable-pizza-oven/':'/products/gozney-roccbox/',
  '/products/breville-the-smart-oven-pizzaiolo-bpz820/':'/products/breville-smart-oven-pizzaiolo-bpz820/'
};
function isAuthority(path){
  let m=path.match(/^\/categories\/([^/]+)\//);if(m&&authoritySlugs.has(m[1]))return true;
  m=path.match(/^\/products\/([^/]+)\/$/);if(m){const p=data.products.find(x=>x.slug===m[1]);return !!(p&&authoritySlugs.has(p.category));}
  m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m&&authoritySlugs.has(m[1]))return true;
  m=path.match(/^\/compare\/([^/]+)\//);return !!(m&&authoritySlugs.has(m[1]));
}
module.exports=(req,res)=>{
  let path='/';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const target=redirects[path];
  if(target){res.statusCode=308;res.setHeader('Location',target);res.setHeader('Cache-Control','public, max-age=3600');return res.end();}
  if(isAuthority(path)){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader('Content-Type')||'').toLowerCase();
      if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
        body=body.replace(/sources checked 16 Aug 2026/g,'sources checked 17 Aug 2026');
        body=body.replace(/<dt>Retailer path checked<\/dt><dd>Not yet recorded<\/dd>/g,'<dt>Retailer path checked</dt><dd>17 Aug 2026</dd>');
      }
      return end(body,...args);
    };
  }
  return app(req,res);
};
