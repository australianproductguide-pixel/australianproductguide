const {categories,pathways,products}=require('../data');
const trust=['about','contact','methodology','editorial-standards','sources','corrections-policy','affiliate-disclosure','privacy','terms','coverage','updates'];
const slugify=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const brands=[...new Set(products.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b));
const pairPages=[];
for(const c of Object.values(categories)){
  const pairs=[];
  for(let i=0;i<c.products.length;i++)for(let j=i+1;j<c.products.length;j++)pairs.push({category:c.slug,a:c.products[i],b:c.products[j]});
  pairPages.push(...pairs.slice(0,14).map(x=>({...x,slug:`${x.a.slug}-vs-${x.b.slug}`,path:`/compare/${c.slug}/${x.a.slug}-vs-${x.b.slug}/`})));
}
const indexableRoutes=[
  '/', '/categories/',
  ...Object.keys(categories).map(s=>`/categories/${s}/`),
  ...products.map(p=>`/products/${p.slug}/`),
  ...Object.keys(categories).flatMap(s=>[`/guides/${s}-buying-guide/`,`/categories/${s}/finder/`,`/compare/${s}/`]),
  ...trust.map(s=>`/${s}/`),
  '/brands/',
  ...brands.map(b=>`/brands/${slugify(b)}/`),
  ...pairPages.map(p=>p.path)
];
const noindexRoutes=['/search/','/sitemap/','/compare/custom/',...pathways.filter(p=>!p.maintained).map(p=>`/categories/${p.slug}/`)];
if(products.length!==37)throw new Error(`Expected 37 products, found ${products.length}`);
if(pathways.length!==48)throw new Error(`Expected 48 pathways, found ${pathways.length}`);
if(brands.length!==16)throw new Error(`Expected 16 brands, found ${brands.length}`);
if(pairPages.length!==56)throw new Error(`Expected 56 pair comparisons, found ${pairPages.length}`);
if(indexableRoutes.length!==139)throw new Error(`Expected 139 indexable routes, found ${indexableRoutes.length}`);
module.exports={trust,brands,pairPages,indexableRoutes,noindexRoutes,slugify};
