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

const cards=slugs.map(slug=>`<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><p class="eyebrow">Maintained comparison · 5 products</p><h3><a href="/categories/${slug}/">${categories[slug].label}</a></h3><p>Useful category guidance for Australian shoppers.</p><div class="pills"><span class="pill">example</span></div><div class="card-actions"><a class="button secondary" href="/categories/${slug}/">Explore category</a><a class="text-link" href="/categories/${slug}/finder/">Help me choose →</a></div></div></article>`).join('');
const duplicatePathwayMap='<section class="section soft-panel"><div class="section-head"><div><p class="kicker">Coverage map</p><h2>90 category pathways</h2><p>Every pathway is now populated.</p></div><a href="/coverage/" class="text-link">Coverage policy →</a></div><ul class="pathway-list"><li><a href="/categories/coffee-machines/">Coffee machines</a></li></ul></section>';
const html=`<!doctype html><html><head><title>Categories</title></head><body><main><div class="category-grid premium-category-grid">${cards}</div>${duplicatePathwayMap}</main></body></html>`;
const out=layer.inject(html,'/categories/');

if(count(out,'class="category-index-media is-base"')!==90)fail(`Expected 90 base category index images, found ${count(out,'class="category-index-media is-base"')}`);
if(count(out,'loading="lazy"')!==90)fail('Every category index image must lazy-load');
if(count(out,'decoding="async"')!==90)fail('Every category index image must decode asynchronously');
if(count(out,'width="40" height="40"')!==90)fail('Every category image needs a compact 40x40 HTML fallback size');
if(out.includes('<figcaption'))fail('Category hub tiles must not render image-caption/source bars');
if(out.includes('<style id="apg-category-index-images-v61"'))fail('Category directory CSS must not be inline under Production CSP');
if(!out.includes('href="/assets/category-directory-v61.css?v=61.6"'))fail('CSP-safe category directory stylesheet link missing');
if(!out.includes('data-apg-category-index-images="v61"'))fail('Category-index runtime marker missing');
if(!out.includes('name="apg-category-index-images" content="v61.6"'))fail('Category-index v61.6 metadata missing');
if(out.includes('90 category pathways')||out.includes('pathway-list'))fail('Duplicated legacy 90-category pathway map must be removed');
if(!html.includes('90 category pathways'))fail('QA fixture must contain the legacy duplicated pathway map before enrichment');
for(const slug of slugs){
  const src=registry[slug].src;
  if(!out.includes(`src="${src}"`))fail(`Rendered hub is missing governed image for ${slug}`);
}

const cssPath=path.join(__dirname,'..','public','assets','category-directory-v61.css');
if(!fs.existsSync(cssPath))fail('CSP-safe category directory stylesheet file missing');
const css=fs.readFileSync(cssPath,'utf8');
const cssChecks=[
  ['two-column desktop directory','grid-template-columns:repeat(2,minmax(0,1fr))!important'],
  ['single-column responsive directory','grid-template-columns:1fr!important'],
  ['unified card geometry','grid-template-columns:42px minmax(0,1fr)!important'],
  ['strict desktop thumbnail cap','max-width:42px!important'],
  ['strict desktop thumbnail height cap','max-height:42px!important'],
  ['strict mobile thumbnail cap','max-width:36px!important'],
  ['strict mobile thumbnail height cap','max-height:36px!important'],
  ['image cover crop','object-fit:cover!important'],
  ['clear category title','font-size:16px!important'],
  ['two-line supporting copy','-webkit-line-clamp:2!important'],
  ['category pills suppressed','.category-grid .category-card .pills'],
  ['actions visible','.category-grid .category-card .card-actions'],
  ['primary category action','.card-actions .button.secondary'],
  ['finder text action','.card-actions .text-link'],
  ['no whole-card overlay','h3 a::after'],
  ['no decorative card chevron','.category-grid .category-card::after']
];
for(const [label,needle] of cssChecks){if(!css.includes(needle))fail(`Missing ${label} CSS contract`);}
if(!css.includes('display:flex!important'))fail('Card actions must be visibly restored');
if(!css.includes('content:none!important'))fail('Whole-card overlay/chevron chrome must be disabled');

for(const retired of [
  'height:172px',
  'height:145px',
  'width:126px',
  'width:112px',
  'width:80px',
  'height:80px',
  'width:72px',
  'height:72px',
  'width:64px',
  'height:64px',
  'width:56px',
  'height:56px',
  'transform:scale(1.02)',
  'minmax(150px,34%)',
  'aspect-ratio:4/3'
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
if(!premiumOut.includes('class="card-actions"'))fail('Premium category actions must remain in SSR markup and be visible via external CSS');

const baseCard='<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><p class="eyebrow">Maintained comparison · 5 products</p><h3><a href="/categories/smart-plugs/">Smart plugs</a></h3><p>Choose a smart plug for your setup.</p><div class="card-actions"><a class="button secondary" href="/categories/smart-plugs/">Explore category</a><a class="text-link" href="/categories/smart-plugs/finder/">Help me choose →</a></div></div></article>';
const baseOut=layer.enrichCategoryCard(baseCard);
if(!baseOut.includes('class="category-index-media is-base"'))fail('Base category card must receive governed image');
if(baseOut.includes('category-icon large'))fail('Base category icon must be replaced');
if(count(baseOut,'category-index-media')!==1)fail('Base category card must contain exactly one governed image figure');
if(!baseOut.includes('width="40" height="40"'))fail('Base image must carry compact HTML fallback geometry');

const unrelatedSoftPanel='<section class="section soft-panel"><h2>Useful buying guidance</h2><p>Keep me.</p></section>';
if(layer.removeLegacyPathwayMap(unrelatedSoftPanel)!==unrelatedSoftPanel)fail('Unrelated soft panels must not be removed');
if(layer.removeLegacyPathwayMap(duplicatePathwayMap).trim()!=='')fail('Legacy duplicated pathway map removal must be exact');
if(layer.inject(html,'/search/')!==html)fail('Category image layer must not alter non-category-index pages');
if(layer.inject(out,'/categories/')!==out)fail('Category image layer must be idempotent');

console.log(JSON.stringify({
  version:'category-index-images-v61.6-qa',
  categories:slugs.length,
  governedImages:imageSlugs.length,
  renderedImages:count(out,'class="category-index-media is-base"'),
  lazyLoaded:count(out,'loading="lazy"'),
  cspSafeExternalStylesheet:true,
  htmlFallbackThumbnailPx:40,
  desktopThumbnailPx:42,
  mobileThumbnailPx:36,
  desktopColumns:2,
  mobileColumns:1,
  supportingCopyClamped:true,
  categoryPillsVisuallySuppressed:true,
  categoryActionsVisible:true,
  wholeCardOverlayRemoved:true,
  duplicatePathwayMapRemoved:true,
  premiumAndBaseGeometryUnified:true,
  routeScoped:true,
  idempotent:true,
  failures:0
},null,2));
