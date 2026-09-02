'use strict';

const fs=require('fs');
const path=require('path');
const layer=require('../lib/category-index-images-v61');
const {categories}=require('../data');
const registry=require('../data/category-editorial-images-v45');

function fail(message){throw new Error(message);}
function count(haystack,needle){return String(haystack).split(needle).length-1;}

const slugs=Object.keys(categories).sort();
const imageSlugs=Object.keys(registry).sort();
if(slugs.length!==90)fail(`Expected 90 maintained categories, found ${slugs.length}`);
if(imageSlugs.length!==90)fail(`Expected 90 governed category images, found ${imageSlugs.length}`);
if(JSON.stringify(slugs)!==JSON.stringify(imageSlugs))fail('Category image registry is not exactly aligned to the maintained 90-category catalogue');

if(layer.CATEGORY_DEPARTMENTS.length!==8)fail(`Expected 8 presentation departments, found ${layer.CATEGORY_DEPARTMENTS.length}`);
if(layer.QUICK_BROWSE_SLUGS.length!==6)fail(`Expected 6 quick-browse categories, found ${layer.QUICK_BROWSE_SLUGS.length}`);
for(const slug of layer.QUICK_BROWSE_SLUGS){
  if(!categories[slug]||!registry[slug])fail(`Quick-browse category is not governed: ${slug}`);
}
for(const department of layer.CATEGORY_DEPARTMENTS){
  if(!department.key||!department.label)fail('Every presentation department needs a key and label');
  if(!categories[department.image]||!registry[department.image])fail(`Department image is not governed: ${department.image}`);
  if(department.links.length!==5)fail(`Department ${department.key} must expose 5 concise category links`);
  for(const slug of department.links){
    if(!categories[slug]||!registry[slug])fail(`Department ${department.key} references an ungoverned category: ${slug}`);
  }
}

const cards=slugs.map(slug=>`<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><p class="eyebrow">Maintained comparison · 5 products</p><h3><a href="/categories/${slug}/">${categories[slug].label}</a></h3><p>Useful category guidance for Australian shoppers.</p><div class="pills"><span class="pill">example</span></div><div class="card-actions"><a class="button secondary" href="/categories/${slug}/">Explore category</a><a class="text-link" href="/categories/${slug}/finder/">Help me choose →</a></div></div></article>`).join('');
const duplicatePathwayMap='<section class="section soft-panel"><div class="section-head"><div><p class="kicker">Coverage map</p><h2>90 category pathways</h2><p>Every pathway is now populated.</p></div><a href="/coverage/" class="text-link">Coverage policy →</a></div><ul class="pathway-list"><li><a href="/categories/coffee-machines/">Coffee machines</a></li></ul></section>';
const hero='<section class="hero-shell"><div class="wrap"><div class="hero"><p class="kicker">Product discovery</p><h1>Browse product categories</h1><p class="lede">All 90 Australian Product Guide category pathways now contain a maintained starting catalogue. Deep-evidence and starter-evidence hubs are labelled separately so shoppers can see how mature the research is.</p></div></div></section>';
const catalogueSearch='<div class="apg-v12-catalogue" data-v12-catalogue hidden><div><label for="apgV12CategorySearch">Find a category</label><input id="apgV12CategorySearch" type="search" placeholder="Try ‘kitchen’, ‘gaming’, ‘travel’ or a product type" data-v12-category-search></div><div class="apg-v12-count"><strong data-v12-visible>90</strong><span>categories shown</span></div><button type="button" data-v12-clear hidden>Clear search</button></div>';
const html=`<!doctype html><html><head><title>Categories</title></head><body><main id="main">${hero}<section class="section"><div class="section-head"><div><p class="kicker">Current coverage</p><h2>90 populated comparison categories</h2></div></div>${catalogueSearch}<div class="category-grid premium-category-grid">${cards}</div>${duplicatePathwayMap}</section></main></body></html>`;
const out=layer.inject(html,'/categories/');

if(count(out,'class="category-index-media is-base"')!==90)fail(`Expected 90 base category index images, found ${count(out,'class="category-index-media is-base"')}`);
if(count(out,'width="40" height="40"')!==90)fail('Every category card image needs a compact 40x40 HTML fallback size');
if(count(out,'class="apg-category-department-card"')!==8)fail('Department-first browse layer must render exactly 8 department cards');
if(count(out,'width="44" height="44"')!==8)fail('Department imagery must remain compact at 44x44');
if(out.includes('<figcaption'))fail('Category hub tiles must not render image-caption/source bars');
if(out.includes('<style id="apg-category-index-images-v61"'))fail('Category directory CSS must not be inline under Production CSP');
if(!out.includes('href="/assets/category-directory-v61.css?v=61.8"'))fail('CSP-safe category directory v61.8 stylesheet link missing');
if(!out.includes('data-apg-category-index-images="v61"'))fail('Category-index runtime marker missing');
if(!out.includes('name="apg-category-index-images" content="v61.8"'))fail('Category-index v61.8 metadata missing');
if(out.includes('90 category pathways')||out.includes('pathway-list'))fail('Duplicated legacy 90-category pathway map must be removed');
if(!html.includes('90 category pathways'))fail('QA fixture must contain the legacy duplicated pathway map before enrichment');
for(const slug of slugs){
  const src=registry[slug].src;
  if(!out.includes(`src="${src}"`))fail(`Rendered hub is missing governed image for ${slug}`);
}

// v61.8 composition contracts: marketplace orientation first, decision tools second,
// then a complete searchable A-Z directory. No unsupported popularity claim.
if(!out.includes('class="apg-category-retail-tools"'))fail('Retail browse toolbar missing');
if(!out.includes('<span>Quick browse</span>'))fail('Evidence-safe quick-browse label missing');
if(out.includes('<span>Popular</span>'))fail('Category hub must not make an unsupported popularity claim');
if(!out.includes('class="apg-category-departments"'))fail('Department browse section missing');
if(!out.includes('<p class="kicker">Browse by department</p>'))fail('Department browse kicker missing');
if(!out.includes('<h2 id="apgCategoryDepartmentsHeading">Find your area faster</h2>'))fail('Department browse heading missing');
if(!out.includes('<h1>Browse by category</h1>'))fail('Category hero heading not reconciled');
if(!out.includes('<h2 id="apgAllCategories">All categories A–Z</h2>'))fail('A-Z directory heading missing');
if(!out.includes('class="apg-category-hero-proof"'))fail('Trust/proof strip missing from category hero');
if(!out.includes('<strong>90</strong> maintained categories'))fail('Maintained category count proof missing');
if(!out.includes('Affiliate commission never affects recommendations'))fail('Recommendation independence proof missing');
if(out.includes('class="apg-v12-catalogue" data-v12-catalogue hidden'))fail('Category search must be visible in SSR presentation');
if(!out.includes('placeholder="Search categories — try air fryer, gaming, travel or pet"'))fail('Marketplace category search prompt missing');
if(!out.includes('>Browse category</a>'))fail('Category cards must use the clearer browse action label');
if(out.includes('>Explore category</a>'))fail('Retired category action label remains');
for(const href of ['/decision-lab/','/compare/','/brands/']){
  if(!out.includes(`href="${href}"`))fail(`Decision/navigation shortcut missing: ${href}`);
}

const gridMatch=out.match(/<div class="category-grid premium-category-grid">([\s\S]*?)<\/div>\s*<\/section>/i);
if(!gridMatch)fail('Unable to isolate A-Z category grid after enrichment');
const renderedSlugs=[...gridMatch[1].matchAll(/<article\b[^>]*class="[^"]*\bcategory-card\b[^"]*"[^>]*>[\s\S]*?href="\/categories\/([^/"?#]+)\//gi)].map(m=>m[1]);
if(renderedSlugs.length!==90)fail(`Expected 90 A-Z category cards, found ${renderedSlugs.length}`);
const expectedAtoZ=[...slugs].sort((a,b)=>categories[a].label.localeCompare(categories[b].label,'en-AU',{sensitivity:'base'}));
if(JSON.stringify(renderedSlugs)!==JSON.stringify(expectedAtoZ))fail('Complete category directory is not sorted A-Z by shopper-facing label');

const cssPath=path.join(__dirname,'..','public','assets','category-directory-v61.css');
if(!fs.existsSync(cssPath))fail('CSP-safe category directory stylesheet file missing');
const css=fs.readFileSync(cssPath,'utf8');
const cssChecks=[
  ['marketplace page background','main#main{\n  background:#f3f4f4!important'],
  ['category sharebar removal','.platform-sharebar{\n  display:none!important'],
  ['compact white hero','.hero-shell{\n  margin:0!important;\n  padding:22px 0 20px!important;\n  background:#fff!important'],
  ['hero trust proof','.apg-category-hero-proof{'],
  ['retail shortcut toolbar','.apg-category-retail-tools{'],
  ['department directory','.apg-category-departments{'],
  ['four-column department grid','grid-template-columns:repeat(4,minmax(0,1fr))!important'],
  ['compact department image','max-width:44px!important'],
  ['visible search shell','.apg-v12-catalogue{'],
  ['prominent search input','.apg-v12-catalogue input[type="search"]'],
  ['three-column desktop directory','grid-template-columns:repeat(3,minmax(0,1fr))!important'],
  ['two-column intermediate directory','grid-template-columns:repeat(2,minmax(0,1fr))!important'],
  ['single-column responsive directory','grid-template-columns:1fr!important'],
  ['unified card geometry','grid-template-columns:40px minmax(0,1fr)!important'],
  ['strict desktop thumbnail cap','max-width:40px!important'],
  ['strict desktop thumbnail height cap','max-height:40px!important'],
  ['strict mobile thumbnail cap','max-width:36px!important'],
  ['strict mobile thumbnail height cap','max-height:36px!important'],
  ['image cover crop','object-fit:cover!important'],
  ['two-line supporting copy','-webkit-line-clamp:2!important'],
  ['category pills suppressed','.category-grid .category-card .pills'],
  ['actions visible','.category-grid .category-card .card-actions'],
  ['primary category action','.card-actions .button.secondary'],
  ['finder text action','.card-actions .text-link'],
  ['no whole-card overlay','h3 a::after'],
  ['no decorative card chevron','.category-grid .category-card::after']
];
for(const [label,needle] of cssChecks){if(!css.includes(needle))fail(`Missing ${label} CSS contract`);}
if(!css.includes('content:none!important'))fail('Whole-card overlay/chevron chrome must be disabled');

for(const retired of [
  'height:172px','height:145px','width:126px','width:112px','width:80px','height:80px',
  'width:72px','height:72px','width:64px','height:64px','width:56px','height:56px',
  'transform:scale(1.02)','minmax(150px,34%)','aspect-ratio:4/3'
]){
  if(css.includes(retired))fail(`Retired oversized category geometry still present in CSP-safe stylesheet: ${retired}`);
}

const premiumCard='<article class="category-card v7-category-card" data-v7-category="coffee-machines"><div class="v7-category-scene" data-v7-category="coffee-machines"><span class="v7-scene-glow"></span><span class="v7-scene-icon"><svg><path d="M0 0"></path></svg></span><span class="v7-scene-copy"><small>Kitchen</small><strong>Coffee machines</strong></span></div><div class="v7-category-card-copy"><p class="eyebrow">Maintained comparison · 10 products</p><h3><a href="/categories/coffee-machines/">Coffee machines</a></h3><p>Choose a coffee machine for the way you actually make coffee.</p><div class="pills"><span class="pill">beginner</span></div><div class="card-actions"><a class="button secondary" href="/categories/coffee-machines/">Explore category</a><a class="text-link" href="/categories/coffee-machines/finder/">Help me choose →</a></div></div></article>';
const premiumOut=layer.enrichCategoryCard(premiumCard);
if(!premiumOut.includes('class="category-index-media is-premium"'))fail('Premium category card must receive governed image');
if(premiumOut.includes('v7-category-scene'))fail('Premium illustrative scene must be replaced');
if(count(premiumOut,'category-index-media')!==1)fail('Premium category card must contain exactly one governed image figure');
if(!premiumOut.includes('width="40" height="40"'))fail('Premium image must carry compact HTML fallback geometry');
if(!premiumOut.includes('v7-category-card-copy'))fail('Premium category decision copy must be preserved');
if(!premiumOut.includes('>Browse category</a>'))fail('Premium category action label must be reconciled');

const baseCard='<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><p class="eyebrow">Maintained comparison · 5 products</p><h3><a href="/categories/smart-plugs/">Smart plugs</a></h3><p>Choose a smart plug for your setup.</p><div class="card-actions"><a class="button secondary" href="/categories/smart-plugs/">Explore category</a><a class="text-link" href="/categories/smart-plugs/finder/">Help me choose →</a></div></div></article>';
const baseOut=layer.enrichCategoryCard(baseCard);
if(!baseOut.includes('class="category-index-media is-base"'))fail('Base category card must receive governed image');
if(baseOut.includes('category-icon large'))fail('Base category icon must be replaced');
if(count(baseOut,'category-index-media')!==1)fail('Base category card must contain exactly one governed image figure');
if(!baseOut.includes('width="40" height="40"'))fail('Base image must carry compact HTML fallback geometry');
if(!baseOut.includes('>Browse category</a>'))fail('Base category action label must be reconciled');

const unrelatedSoftPanel='<section class="section soft-panel"><h2>Useful buying guidance</h2><p>Keep me.</p></section>';
if(layer.removeLegacyPathwayMap(unrelatedSoftPanel)!==unrelatedSoftPanel)fail('Unrelated soft panels must not be removed');
if(layer.removeLegacyPathwayMap(duplicatePathwayMap).trim()!=='')fail('Legacy duplicated pathway map removal must be exact');
if(layer.inject(html,'/search/')!==html)fail('Category image layer must not alter non-category-index pages');
if(layer.inject(out,'/categories/')!==out)fail('Category image layer must be idempotent');

console.log(JSON.stringify({
  version:'category-index-images-v61.8-qa',
  categories:slugs.length,
  governedImages:imageSlugs.length,
  renderedCategoryImages:count(out,'class="category-index-media is-base"'),
  departments:layer.CATEGORY_DEPARTMENTS.length,
  departmentLinks:layer.CATEGORY_DEPARTMENTS.reduce((sum,d)=>sum+d.links.length,0),
  quickBrowseShortcuts:layer.QUICK_BROWSE_SLUGS.length,
  decisionToolShortcuts:3,
  cspSafeExternalStylesheet:true,
  htmlFallbackThumbnailPx:40,
  departmentThumbnailPx:44,
  desktopThumbnailPx:40,
  mobileThumbnailPx:36,
  desktopColumns:3,
  intermediateColumns:2,
  mobileColumns:1,
  departmentFirstMarketplaceShell:true,
  aToZDirectory:true,
  searchVisibleServerSide:true,
  unsupportedPopularityClaims:false,
  recommendationIndependenceProof:true,
  duplicatePathwayMapRemoved:true,
  routeScoped:true,
  idempotent:true,
  failures:0
},null,2));