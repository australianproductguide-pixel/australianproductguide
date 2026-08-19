'use strict';
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
function fail(msg){throw new Error(msg)}
const registry=require('../data/category-editorial-images-v45');
const finalReview=require('../data/category-editorial-final-review-v45.json');
const {categories}=require('../data');
const slugs=Object.keys(categories).sort(),keys=Object.keys(registry).sort();
if(slugs.length!==90)fail(`Expected 90 maintained categories, found ${slugs.length}`);
if(keys.length!==90)fail(`Expected 90 category hero records, found ${keys.length}`);
if(JSON.stringify(slugs)!==JSON.stringify(keys))fail('Category editorial registry does not exactly match maintained category slugs');
const srcs=new Set(),sources=new Set();let bytes=0;
for(const slug of slugs){
  const x=registry[slug];if(!x||!x.src)fail(`Missing registry image for ${slug}`);
  if(!x.src.startsWith('/category-editorial/'))fail(`Non-local runtime image URL for ${slug}: ${x.src}`);
  if(srcs.has(x.src))fail(`Duplicate local hero src ${x.src}`);srcs.add(x.src);
  if(!String(x.sourcePage||'').startsWith('https://commons.wikimedia.org/wiki/'))fail(`Non-Commons provenance for ${slug}`);
  if(sources.has(x.sourcePage))fail(`Duplicate Commons source across categories: ${x.sourcePage}`);sources.add(x.sourcePage);
  if(!x.creator||!x.license||!x.licenseUrl)fail(`Incomplete attribution metadata for ${slug}`);
  if(!/cc0|public domain|cc by/i.test(x.license))fail(`Unexpected licence label for ${slug}: ${x.license}`);
  if(x.purpose!=='Decorative category-level editorial context only; not evidence of a specific reviewed or recommended APG product.')fail(`Editorial-purpose statement missing for ${slug}`);
  const local=path.join(root,'public',x.src.replace(/^\//,''));if(!fs.existsSync(local))fail(`Self-hosted asset missing for ${slug}: ${local}`);
  const size=fs.statSync(local).size;if(size<15000||size>3000000)fail(`Asset budget violation for ${slug}: ${size}`);bytes+=size;
}
if(bytes>60000000)fail(`Editorial asset bundle exceeds 60 MB: ${bytes}`);
if(finalReview.summary?.categories!==90||finalReview.categories?.length!==90)fail('Final review register is incomplete');
if((finalReview.summary?.reviewRequired||0)>0&&process.env.ALLOW_REVIEW_REQUIRED!=='1')fail(`${finalReview.summary.reviewRequired} category hero assets still require explicit curation before release`);
const pages=fs.readFileSync(path.join(root,'lib','pages.js'),'utf8');
if(!pages.includes("categoryEditorialImages=require('../data/category-editorial-images-v45')"))fail('Category image registry not wired into pages');
if(!pages.includes('function categoryHeroMedia(c)')||!pages.includes('${categoryHeroMedia(c)}'))fail('Category hero renderer not wired');
if(!pages.includes('Editorial category image — not a reviewed product.'))fail('Consumer-facing non-product disclaimer missing');
const css=fs.readFileSync(path.join(root,'lib','premium-css.js'),'utf8');
for(const token of ['.category-hero-media{','.category-hero-media-shade{','.category-hero-media-overlay{','.category-hero-media figcaption{'])if(!css.includes(token))fail(`Missing editorial hero CSS ${token}`);
console.log(JSON.stringify({version:'category-editorial-v45-qa',categories:90,uniqueSources:sources.size,selfHostedAssets:srcs.size,totalBytes:bytes,manualCurated:finalReview.summary.manualCurated,premiumAuto:finalReview.summary.premiumAuto,reviewRequired:finalReview.summary.reviewRequired,allowReviewRequired:process.env.ALLOW_REVIEW_REQUIRED==='1',failures:0},null,2));
