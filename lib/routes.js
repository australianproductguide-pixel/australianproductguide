const {categories,pathways,products}=require('../data');
const trust=['about','contact','methodology','editorial-standards','sources','corrections-policy','affiliate-disclosure','privacy','terms','coverage','updates'];
const slugify=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const brandBySlug=new Map();for(const p of products){const s=slugify(p.brand);if(!brandBySlug.has(s))brandBySlug.set(s,p.brand);}
const brands=[...brandBySlug.values()].sort((a,b)=>a.localeCompare(b));
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
const categoryCount=Object.keys(categories).length;
if(products.length<350)throw new Error(`Expected expanded catalogue of at least 350 maintained products, found ${products.length}`);
if(pathways.length!==categoryCount)throw new Error(`Pathway/category mismatch: ${pathways.length}/${categoryCount}`);
if(categoryCount<68)throw new Error(`Expected at least 68 populated categories, found ${categoryCount}`);
if(emptyPathways.length)throw new Error(`Expected zero empty category pathways, found ${emptyPathways.length}`);
if(pairPages.length<180)throw new Error(`Expected at least 180 curated pair comparisons, found ${pairPages.length}`);
const productSlugs=products.map(p=>p.slug),duplicateProducts=productSlugs.filter((s,i)=>productSlugs.indexOf(s)!==i);
if(duplicateProducts.length)throw new Error(`Duplicate product slugs detected: ${[...new Set(duplicateProducts)].join(', ')}`);
// Legacy V3 records pre-date the current APG-wide ID convention and can share short prefix IDs.
// Enforce uniqueness for the new APG-prefixed ID namespace without blocking historical records.
const apgIds=products.map(p=>p.id).filter(id=>String(id||'').startsWith('APG-')),duplicateApgIds=apgIds.filter((s,i)=>apgIds.indexOf(s)!==i);
if(duplicateApgIds.length)throw new Error(`Duplicate APG product IDs detected: ${[...new Set(duplicateApgIds)].join(', ')}`);
const routeCounts=indexableRoutes.reduce((m,r)=>(m[r]=(m[r]||0)+1,m),{}),duplicateRoutes=Object.entries(routeCounts).filter(([,n])=>n>1).map(([r,n])=>`${r} x${n}`);
if(duplicateRoutes.length)throw new Error(`Duplicate indexable routes detected: ${duplicateRoutes.join(', ')}`);
module.exports={trust,brands,pairPages,indexableRoutes,noindexRoutes,slugify};
