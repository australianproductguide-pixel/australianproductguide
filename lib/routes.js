const {categories,pathways,products}=require('../data');
const trust=['about','contact','methodology','editorial-standards','sources','corrections-policy','affiliate-disclosure','privacy','terms','coverage','updates'];
const slugify=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const brandBySlug=new Map();for(const p of products){const s=slugify(p.brand);if(!brandBySlug.has(s))brandBySlug.set(s,p.brand);}
const brands=[...brandBySlug.values()].sort((a,b)=>a.localeCompare(b));

// Comparison SEO governance: pair pages are deliberately capped. Expanding these
// thresholds is an editorial/governance decision, never an automatic consequence
// of adding products. This prevents catalogue growth from becoming combinatorial
// template growth.
const MAX_CATEGORY_COMPARISONS=14;
const MAX_TOTAL_COMPARISONS=300;
function comparisonSignals(a,b){
  const aTags=new Set(a.tags||[]),bTags=new Set(b.tags||[]);
  const shared=[...aTags].filter(tag=>bTags.has(tag));
  const different=[...new Set([...aTags,...bTags])].filter(tag=>aTags.has(tag)!==bTags.has(tag));
  return {crossBrand:a.brand!==b.brand,sharedTags:shared,differentTags:different,distinctEditorialCopy:String(a.summary||'')!==String(b.summary||'')||String(a.watch||'')!==String(b.watch||'')};
}
function isMeaningfulPair(a,b){const s=comparisonSignals(a,b);return a.slug!==b.slug&&(s.crossBrand||s.differentTags.length>0||s.distinctEditorialCopy);}
const pairPages=[];
for(const c of Object.values(categories)){
  const limit=Number.isInteger(c.comparisonLimit)?c.comparisonLimit:2;
  if(limit<0||limit>MAX_CATEGORY_COMPARISONS)throw new Error(`Comparison limit for ${c.slug} must be 0-${MAX_CATEGORY_COMPARISONS}, found ${limit}`);
  const pairs=[];
  for(let i=0;i<c.products.length;i++)for(let j=i+1;j<c.products.length;j++){
    const candidate={category:c.slug,a:c.products[i],b:c.products[j]};
    if(isMeaningfulPair(candidate.a,candidate.b))pairs.push(candidate);
  }
  pairPages.push(...pairs.slice(0,limit).map(x=>({...x,slug:`${x.a.slug}-vs-${x.b.slug}`,path:`/compare/${c.slug}/${x.a.slug}-vs-${x.b.slug}/`,decisionSignals:comparisonSignals(x.a,x.b)})));
}
if(pairPages.length>MAX_TOTAL_COMPARISONS)throw new Error(`Comparison SEO governance cap exceeded: ${pairPages.length}/${MAX_TOTAL_COMPARISONS}. Curate or consolidate pair pages before increasing the cap.`);
const comparisonGovernance=Object.freeze({categoryCap:MAX_CATEGORY_COMPARISONS,totalCap:MAX_TOTAL_COMPARISONS,currentTotal:pairPages.length,policy:'Curated, decision-distinct pair pages only; catalogue growth must not automatically create every possible pair.'});

const indexableRoutes=[
  '/', '/categories/','/compare/','/decision-lab/','/guides/','/retailers/','/deals/',
  ...Object.keys(categories).map(s=>`/categories/${s}/`),
  ...products.map(p=>`/products/${p.slug}/`),
  ...Object.keys(categories).flatMap(s=>[`/guides/${s}-buying-guide/`,`/categories/${s}/finder/`,`/compare/${s}/`]),
  ...trust.map(s=>`/${s}/`),
  '/brands/',
  ...brands.map(b=>`/brands/${slugify(b)}/`),
  ...pairPages.map(p=>p.path)
];
const noindexRoutes=['/search/','/sitemap/','/compare/custom/','/my-apg/'];
const emptyPathways=pathways.filter(p=>!p.maintained);
const categoryCount=Object.keys(categories).length;
if(products.length<460)throw new Error(`Expected expanded catalogue of at least 460 maintained products, found ${products.length}`);
if(pathways.length!==categoryCount)throw new Error(`Pathway/category mismatch: ${pathways.length}/${categoryCount}`);
if(categoryCount<90)throw new Error(`Expected at least 90 populated categories, found ${categoryCount}`);
if(emptyPathways.length)throw new Error(`Expected zero empty category pathways, found ${emptyPathways.length}`);
if(pairPages.length<210)throw new Error(`Expected at least 210 curated pair comparisons, found ${pairPages.length}`);
const productSlugs=products.map(p=>p.slug),duplicateProducts=productSlugs.filter((s,i)=>productSlugs.indexOf(s)!==i);
if(duplicateProducts.length)throw new Error(`Duplicate product slugs detected: ${[...new Set(duplicateProducts)].join(', ')}`);
// Legacy V3 records pre-date the current APG-wide ID convention and can share short prefix IDs.
// Enforce uniqueness for the new APG-prefixed ID namespace without blocking historical records.
const apgIds=products.map(p=>p.id).filter(id=>String(id||'').startsWith('APG-')),duplicateApgIds=apgIds.filter((s,i)=>apgIds.indexOf(s)!==i);
if(duplicateApgIds.length)throw new Error(`Duplicate APG product IDs detected: ${[...new Set(duplicateApgIds)].join(', ')}`);
const routeCounts=indexableRoutes.reduce((m,r)=>(m[r]=(m[r]||0)+1,m),{}),duplicateRoutes=Object.entries(routeCounts).filter(([,n])=>n>1).map(([r,n])=>`${r} x${n}`);
if(duplicateRoutes.length)throw new Error(`Duplicate indexable routes detected: ${duplicateRoutes.join(', ')}`);
module.exports={trust,brands,pairPages,indexableRoutes,noindexRoutes,slugify,comparisonSignals,isMeaningfulPair,comparisonGovernance,MAX_CATEGORY_COMPARISONS,MAX_TOTAL_COMPARISONS};
