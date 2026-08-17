// Preserve public URL continuity where an authority-depth record renames the same exact model.
const app=require('./authority-v14');
const redirects={
  '/products/ooni-koda-12-gas-powered-pizza-oven/':'/products/ooni-koda-12/',
  '/products/ooni-koda-16-gas-powered-pizza-oven/':'/products/ooni-koda-16/',
  '/products/gozney-roccbox-portable-pizza-oven/':'/products/gozney-roccbox/',
  '/products/breville-the-smart-oven-pizzaiolo-bpz820/':'/products/breville-smart-oven-pizzaiolo-bpz820/'
};
module.exports=(req,res)=>{
  let path='/';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const target=redirects[path];
  if(target){res.statusCode=308;res.setHeader('Location',target);res.setHeader('Cache-Control','public, max-age=3600');return res.end();}
  return app(req,res);
};
