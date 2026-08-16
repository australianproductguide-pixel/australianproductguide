const {categories,pathways,products}=require('../data');
const trust=['about','contact','methodology','editorial-standards','sources','corrections-policy','affiliate-disclosure','privacy','terms','coverage','updates'];
const slugify=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const brands=[...new Set(products.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b));
const pairPages=[];
for(const c of Object.values(categories)){
  const pairs=[];
  for(let i=0;i<c.products.length;i++)for(let j=i+1;j<c.products.length;j++)pairs.push({category:c.slug,a:c.products[i],b:c.products[j]});
  const limit=Number.isInteger(c.comparisonLimit)?c.comparisonLimit:2;
  pairPages.push(...pairs.slice(0,limit).map(x=>({...x,slug:`${x.a.slug}-vs-${x.b.slug}`,path:`/compare/${c.slug}/${x.a.slug}-vs-${x.b.slug}/`})));
}
const indexableRoutes=[
  '/', '/categories/','/compare/','/guides/','/retailers/',
  ...Object.keys(categories).map(s=>`/categories/${s}/`),
  ...products.map(p=>`/products/${p.slug}/`),
  ...Object.keys(categories).flatMap(s=>[`/guides/${s}-buying-guide/`,`/categories/${s}/finder/`,`/compare/${s}/`]),
  ...trust.map(s=>`/${s}/`),
  '/brands/',
  ...brands.map(b=>`/brands/${slugify(b)}/`),
  ...pairPages.map(p=>p.path)
];
const noindexRoutes=['/search/','/sitemap/','/compare/custom/','/decision-lab/','/my-apg/'];
const emptyPathways=pathways.filter(p=>!p.maintained);
if(products.length!==257)throw new Error(`Expected 257 maintained products for Platform v3, found ${products.length}`);
if(pathways.length!==48)throw new Error(`Expected 48 pathways, found ${pathways.length}`);
if(Object.keys(categories).length!==48)throw new Error(`Expected 48 populated categories, found ${Object.keys(categories).length}`);
if(emptyPathways.length)throw new Error(`Expected zero empty category pathways, found ${emptyPathways.length}`);
if(pairPages.length!==144)throw new Error(`Expected 144 curated pair comparisons, found ${pairPages.length}`);
if(new Set(indexableRoutes).size!==indexableRoutes.length)throw new Error('Duplicate indexable routes detected');
module.exports={trust,brands,pairPages,indexableRoutes,noindexRoutes,slugify};