'use strict';

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

const cards=slugs.map(slug=>`<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><h3><a href="/categories/${slug}/">${categories[slug].label}</a></h3></div></article>`).join('');
const html=`<!doctype html><html><head><title>Categories</title></head><body><main><div class="category-grid premium-category-grid">${cards}</div></main></body></html>`;
const out=layer.inject(html,'/categories/');

if(count(out,'class="category-index-media is-base"')!==90)fail(`Expected 90 base category index images, found ${count(out,'class="category-index-media is-base"')}`);
if(count(out,'loading="lazy"')!==90)fail('Every category index image must lazy-load');
if(count(out,'decoding="async"')!==90)fail('Every category index image must decode asynchronously');
if(out.includes('<figcaption'))fail('Category hub tiles must not render image-caption/source bars inside compact image slots');
if(!out.includes('id="apg-category-index-images-v61"'))fail('Responsive category image CSS was not injected');
if(!out.includes('data-apg-category-index-images="v61"'))fail('Category-index runtime marker was not injected');
if(!out.includes('name="apg-category-index-images" content="v61.3"'))fail('Category-index v61.3 version metadata missing');
for(const slug of slugs){
  const src=registry[slug].src;
  if(!out.includes(`src="${src}"`))fail(`Rendered hub is missing governed image for ${slug}`);
}

// Guard the intentionally calm v61.3 hierarchy: photographs are compact visual
// identifiers beside the text, never full-width editorial panels.
const cssChecks=[
  ['premium horizontal card','grid-template-columns:80px minmax(0,1fr)!important;grid-template-rows:auto!important'],
  ['premium desktop 80px thumbnail','width:80px;height:80px;min-width:80px;min-height:80px'],
  ['premium tablet 72px thumbnail','width:72px;height:72px;min-width:72px;min-height:72px'],
  ['premium mobile 64px thumbnail','width:64px;height:64px;min-width:64px;min-height:64px'],
  ['base desktop 64px thumbnail','width:64px;height:64px;min-width:64px;min-height:64px'],
  ['base mobile 52px thumbnail','width:52px;height:52px;min-width:52px;min-height:52px'],
  ['two-line supporting copy','-webkit-line-clamp:2']
];
for(const [label,needle] of cssChecks){if(!out.includes(needle))fail(`Missing ${label} rule`);}
for(const retired of [
  'height:172px;min-height:172px',
  'height:145px;min-height:145px',
  'width:126px;height:100%;min-height:100%',
  'transform:scale(1.02)',
  'minmax(150px,34%)',
  'aspect-ratio:4/3',
  'grid-template-columns:112px'
]){
  if(out.includes(retired))fail(`Retired image-dominant category rule still present: ${retired}`);
}

// Current premium cards must replace the old scene, preserve decision copy, and
// contain exactly one governed image. CSS then turns it into the compact thumbnail.
const premiumCard='<article class="category-card v7-category-card" data-v7-category="coffee-machines"><div class="v7-category-scene" data-v7-category="coffee-machines"><span class="v7-scene-glow"></span><span class="v7-scene-icon"><svg><path d="M0 0"></path></svg></span><span class="v7-scene-copy"><small>Kitchen</small><strong>Coffee machines</strong></span></div><div class="v7-category-card-copy"><h3><a href="/categories/coffee-machines/">Coffee machines</a></h3><p>Choose a coffee machine for the way you actually make coffee.</p></div></article>';
const premiumOut=layer.enrichCategoryCard(premiumCard);
if(!premiumOut.includes('class="category-index-media is-premium"'))fail('Premium category card must receive its governed image in the premium slot');
if(premiumOut.includes('v7-category-scene'))fail('Premium illustrative scene must be replaced by the governed category image');
if(count(premiumOut,'category-index-media')!==1)fail('Premium category card must contain exactly one governed image figure');
if(!premiumOut.includes('v7-category-card-copy'))fail('Premium category decision copy must be preserved');
if(premiumOut.includes('<figcaption'))fail('Premium category tile must not include a caption/source bar');

const baseCard='<article class="category-card"><div><span class="category-icon large"><svg><path d="M0 0"></path></svg></span></div><div><h3><a href="/categories/smart-plugs/">Smart plugs</a></h3></div></article>';
const baseOut=layer.enrichCategoryCard(baseCard);
if(!baseOut.includes('class="category-index-media is-base"'))fail('Base category card must receive its governed image in the original icon slot');
if(baseOut.includes('category-icon large'))fail('Base category icon must be replaced rather than retained beside the image');
if(count(baseOut,'category-index-media')!==1)fail('Base category card must contain exactly one governed image figure');

if(layer.inject(html,'/search/')!==html)fail('Category image layer must not alter non-category-index pages');
if(layer.inject(out,'/categories/')!==out)fail('Category image layer must be idempotent');

console.log(JSON.stringify({
  version:'category-index-images-v61.3-qa',
  categories:slugs.length,
  governedImages:imageSlugs.length,
  renderedImages:count(out,'class="category-index-media is-base"'),
  lazyLoaded:count(out,'loading="lazy"'),
  visualHierarchy:'compact-horizontal-thumbnail',
  premiumDesktopThumbnailPx:80,
  premiumTabletThumbnailPx:72,
  premiumMobileThumbnailPx:64,
  baseDesktopThumbnailPx:64,
  baseMobileThumbnailPx:52,
  legacyBannerGeometryRemoved:true,
  supportingCopyClamped:true,
  premiumSceneReplaced:true,
  hubCaptionsRemoved:true,
  routeScoped:true,
  idempotent:true,
  failures:0
},null,2));
