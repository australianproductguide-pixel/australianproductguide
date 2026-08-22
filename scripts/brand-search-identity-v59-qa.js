'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const runtime=read('lib/brand-search-identity-v59.js');
const discovery=read('lib/google-product-discovery-v60.js');
const categoryIndex=read('lib/category-index-images-v61.js');
const entry=read('api/index.js');
const favicon=read('public/favicon.svg');
const brandMark=read('public/assets/apg-brand-mark.svg');
const manifest=JSON.parse(read('public/site.webmanifest'));

assert.doesNotThrow(()=>new Function(runtime),'brand-search-identity-v59.js must parse');
assert(runtime.includes("require('./seo-optimisation-v58-runtime')"),'v59 must wrap SEO v58 rather than bypass it');
assert(entry.includes("module.exports=require('../lib/category-index-images-v61')"),'public entrypoint must use current v61 outer presentation layer');
assert(categoryIndex.includes("require('./google-product-discovery-v60')"),'v61 must preserve v60 immediately underneath rather than bypass product discovery');
assert(discovery.includes("require('./brand-search-identity-v59')"),'v60 must preserve v59 immediately underneath rather than bypass brand identity');
assert(runtime.includes('rel=\"icon\" type=\"image/svg+xml\" sizes=\"any\" href=\"${FAVICON}\"'),'final HTML must publish the new favicon');
assert(runtime.includes('rel=\"manifest\" href=\"${MANIFEST}\"'),'final HTML must publish the web manifest');
assert(runtime.includes('ImageObject'),'Organization logo must be promoted as an ImageObject');
assert(runtime.includes("path==='/favicon.ico'"),'legacy root favicon requests must be handled');
for(const source of [favicon,brandMark]){
  assert(source.includes('width="192" height="192" viewBox="0 0 192 192"'),'brand mark must expose a square 192x192 canvas');
  assert(source.includes('#0F172A'),'brand mark must use APG Navy');
  assert(source.includes('#2563EB'),'brand mark must use APG Blue');
  assert(source.includes('#FFFFFF'),'brand mark must retain the white decision arrow');
}
assert.equal(manifest.name,'Australian Product Guide');
assert.equal(manifest.short_name,'APG');
assert.equal(manifest.icons[0].src,'/assets/apg-brand-mark.svg');
assert.equal(manifest.icons[0].type,'image/svg+xml');
assert.equal(manifest.icons[0].sizes,'any');

console.log('APG Search Brand Identity v59 source QA passed beneath v60 and v61');
