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

if(count(out,'class="category-index-media"')!==90)fail(`Expected 90 category index images, found ${count(out,'class="category-index-media"')}`);
if(count(out,'loading="lazy"')!==90)fail('Every category index image must lazy-load');
if(count(out,'decoding="async"')!==90)fail('Every category index image must decode asynchronously');
if(count(out,'Editorial category image')!==90)fail('Every category image must retain a visible editorial-image label');
if(count(out,'>Source</a>')!==90)fail('Every category image must expose its governed source attribution link');
if(!out.includes('id="apg-category-index-images-v61"'))fail('Responsive category image CSS was not injected');
if(!out.includes('data-apg-category-index-images="v61"'))fail('Category-index runtime marker was not injected');
if(!out.includes('name="apg-category-index-images" content="v61.1"'))fail('Category-index version metadata missing');
for(const slug of slugs){
  const src=registry[slug].src;
  if(!out.includes(`src="${src}"`))fail(`Rendered hub is missing governed image for ${slug}`);
}

// Current premium cards must replace the superseded illustrative scene rather than
// create a three-child image + scene + copy layout.
const premiumCard='<article class="category-card v7-category-card" data-v7-category="coffee-machines"><div class="v7-category-scene" data-v7-category="coffee-machines"><span class="v7-scene-glow"></span><span class="v7-scene-icon"><svg><path d="M0 0"></path></svg></span><span class="v7-scene-copy"><small>Kitchen</small><strong>Coffee machines</strong></span></div><div class="v7-category-card-copy"><h3><a href="/categories/coffee-machines/">Coffee machines</a></h3></div></article>';
const premiumOut=layer.enrichCategoryCard(premiumCard);
if(!premiumOut.includes('class="category-index-media"'))fail('Premium category card must receive its governed image');
if(premiumOut.includes('v7-category-scene'))fail('Premium illustrative scene must be replaced by the governed category image');
if(count(premiumOut,'class="category-index-media"')!==1)fail('Premium category card must contain exactly one governed image figure');
if(!premiumOut.includes('v7-category-card-copy'))fail('Premium category decision copy must be preserved');

if(layer.inject(html,'/search/')!==html)fail('Category image layer must not alter non-category-index pages');
if(layer.inject(out,'/categories/')!==out)fail('Category image layer must be idempotent');

console.log(JSON.stringify({
  version:'category-index-images-v61.1-qa',
  categories:slugs.length,
  governedImages:imageSlugs.length,
  renderedImages:count(out,'class="category-index-media"'),
  lazyLoaded:count(out,'loading="lazy"'),
  responsiveCss:true,
  attributionLinks:count(out,'>Source</a>'),
  premiumSceneReplaced:true,
  routeScoped:true,
  idempotent:true,
  failures:0
},null,2));
