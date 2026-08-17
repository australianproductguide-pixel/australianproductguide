const {catalogueJson}=require('../lib/catalogue-export');
const {brands}=require('../lib/routes');

const data=catalogueJson();
const canonicalSlugs=new Set(brands.map(brand=>require('../lib/routes').slugify(brand)));

if(data.brandCount!==brands.length){
  throw new Error(`Catalogue brandCount ${data.brandCount} does not match canonical brand registry ${brands.length}`);
}
if(canonicalSlugs.size!==brands.length){
  throw new Error(`Canonical brand registry contains duplicate slugs: ${canonicalSlugs.size}/${brands.length}`);
}
console.log(`CANONICAL_BRAND_RECONCILIATION=PASS brandCount=${brands.length}`);
