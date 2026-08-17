const assert=require('node:assert/strict');
const app=require('../api/index');
const {categories,products}=require('../data');
const {brands,pairPages,slugify,trust}=require('../lib/routes');

function render(url){return new Promise((resolve,reject)=>{const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}});}
function htmlOk(x,path){assert.equal(x.status,200,`${path} status ${x.status}`);assert.match(x.headers['content-type']||'',/text\/html/i,`${path} content type`);assert.match(x.body,/<html|<!doctype html/i,`${path} HTML shell`);assert.match(x.body,/Australian Product Guide/i,`${path} APG identity`);assert.doesNotMatch(x.body,/37 products across four categories|139 canonical research routes|56 prepared head-to-heads/i,`${path} stale catalogue copy`);}
(async()=>{
 const all=Object.values(categories),deepProduct=products.find(p=>p.evidenceTier==='deep'),starterProduct=products.find(p=>p.evidenceTier==='starter');
 assert.ok(deepProduct&&starterProduct,'deep and starter products required');
 const deepCategory=categories[deepProduct.category]||all.find(c=>c.products.some(p=>p.slug===deepProduct.slug));
 const starterCategory=all.find(c=>c.products.length&&c.products.every(p=>(p.evidenceTier||c.evidenceTier)==='starter'))||categories[starterProduct.category]||all[0];
 assert.ok(deepCategory&&starterCategory&&pairPages[0]&&brands[0],'representative route fixtures required');
 const routes=[
  ['homepage','/'],['categories index','/categories/'],['deep category',`/categories/${deepCategory.slug}/`],['starter category',`/categories/${starterCategory.slug}/`],
  ['deep product',`/products/${deepProduct.slug}/`],['starter product',`/products/${starterProduct.slug}/`],['finder',`/categories/${deepCategory.slug}/finder/`],
  ['comparison hub',`/compare/${deepCategory.slug}/`],['comparison pair',pairPages[0].path],['guide',`/guides/${deepCategory.slug}-buying-guide/`],
  ['brands','/brands/'],['brand',`/brands/${slugify(brands[0])}/`],['retailers','/retailers/'],['my apg','/my-apg/'],['decision lab','/decision-lab/']
 ];
 for(const [name,path] of routes){const x=await render(path);htmlOk(x,path);console.log(`RENDER ${name}: PASS ${path}`);}
 for(const slug of trust){const path=`/${slug}/`,x=await render(path);htmlOk(x,path);console.log(`RENDER trust ${slug}: PASS`);}
 const starter=await render(`/products/${starterProduct.slug}/`);assert.match(starter.body,/Source identity checked|starter-evidence decision signals|Research starting point/i,'starter evidence disclosure');
 const affiliate=await render('/affiliate-disclosure/');assert.match(affiliate.body,/As an Amazon Associate I earn from qualifying purchases\./,'exact Amazon statement');assert.match(affiliate.body,/paid link/i,'affiliate paid-link disclosure');
 const privacy=await render('/privacy/');assert.match(privacy.body,/Google Analytics is opt-in/i,'privacy analytics disclosure');assert.match(privacy.body,/advertising storage and personalisation remain off/i,'privacy ad personalisation disclosure');
 console.log(`RENDERED_ROUTE_QA=PASS routes=${routes.length+trust.length}`);
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
