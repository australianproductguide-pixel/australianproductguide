'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const runtime=read('lib/brand-search-identity-v59.js');
const discovery=read('lib/google-product-discovery-v60.js');
const categoryIndex=read('lib/category-index-images-v61.js');
const brandIndex=read('lib/brand-index-logos-v62.js');
const brandCsp=read('lib/brand-directory-csp-v63.js');
const productBrandPlaceholder=read('lib/product-brand-placeholder-v64.js');
const brandMarkQuality=read('lib/brand-mark-quality-v65.js');
const brandMarkCurated=read('lib/brand-mark-curated-v66.js');
const brandMarkDeviceParity=read('lib/brand-mark-device-parity-v66.js');
const productBrandPlaceholderCss=read('public/assets/product-brand-placeholder-v64.css');
const entry=read('api/index.js');
const favicon=read('public/favicon.svg');
const brandMark=read('public/assets/apg-brand-mark.svg');
const manifest=JSON.parse(read('public/site.webmanifest'));

assert.doesNotThrow(()=>new Function(runtime),'brand-search-identity-v59.js must parse');
assert.doesNotThrow(()=>new Function(brandCsp),'brand-directory-csp-v63.js must parse');
assert.doesNotThrow(()=>new Function(productBrandPlaceholder),'product-brand-placeholder-v64.js must parse');
assert.doesNotThrow(()=>new Function(brandMarkQuality),'brand-mark-quality-v65.js must parse');
assert.doesNotThrow(()=>new Function(brandMarkCurated),'brand-mark-curated-v66.js must parse');
assert.doesNotThrow(()=>new Function(brandMarkDeviceParity),'brand-mark-device-parity-v66.js must parse');
assert(runtime.includes("require('./seo-optimisation-v58-runtime')"),'v59 must wrap SEO v58 rather than bypass it');
assert(entry.includes("module.exports=require('../lib/brand-mark-device-parity-v66')"),'public entrypoint must use current v66.2 brand-mark parity/integrity layer');
assert(brandMarkDeviceParity.includes("require('./brand-mark-curated-v66')"),'v66.2 parity/integrity must preserve curated v66 immediately underneath');
assert(brandMarkDeviceParity.includes("BRAND_MARK_DEVICE_PARITY_VERSION='66.2'"),'v66.2 must expose the current desktop/mobile parity generation');
assert(brandMarkDeviceParity.includes("BRAND_MARK_INTEGRITY_VERSION='66.2'"),'v66.2 must expose the current brand-integrity generation');
assert(brandMarkDeviceParity.includes("'canonical-brand-name-fallback'"),'v66.2 must prevent unresolved marks from becoming broken-image UI');
assert(brandMarkDeviceParity.includes("if(kind==='brand_img')return 'generic-brand-image-rejected'"),'v66.2 must reject product/lifestyle imagery selected merely by brand-token matching');
assert(brandIndex.includes('onerror="this.hidden=true"'),'brand UI must preserve its browser-side canonical text fallback');
assert(brandMarkCurated.includes("require('./brand-mark-quality-v65')"),'v66 must preserve v65 immediately underneath');
assert(brandMarkQuality.includes("require('./product-brand-placeholder-v64')"),'v65 must preserve v64 immediately underneath');
assert(productBrandPlaceholder.includes("require('./brand-directory-csp-v63')"),'v64 must preserve v63 immediately underneath rather than bypass CSP-safe brand presentation');
assert(productBrandPlaceholder.includes('/assets/product-brand-placeholder-v64.css?v=64.0'),'v64 must load its same-origin product placeholder stylesheet');
assert(productBrandPlaceholder.includes('im.displayUrl')===false,'v64 must not independently override governed image provenance logic');
assert(productBrandPlaceholder.includes('product-art')&&productBrandPlaceholder.includes('art-model'),'v64 must target only existing APG non-photo product artwork');
assert(productBrandPlaceholder.includes('/assets/brand-marks/'),'v64 must resolve product placeholders through the governed brand mark endpoint');
assert(productBrandPlaceholderCss.includes('data-apg-product-brand-placeholder="v64"'),'v64 stylesheet must be explicitly scoped to transformed product placeholders');
assert(brandCsp.includes("require('./brand-index-logos-v62')"),'v63 must preserve v62 immediately underneath rather than bypass brand identity');
assert(brandCsp.includes('/assets/brand-directory-v63.css?v=63.0'),'v63 must load the same-origin brand directory stylesheet');
assert(brandIndex.includes("require('./category-index-images-v61')"),'v62 must preserve v61 immediately underneath rather than bypass category imagery');
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

console.log('APG Search Brand Identity v59 source QA passed beneath v60, v61, v62, CSP-safe v63, product brand placeholder v64, brand mark quality v65, curated brand mark v66 and desktop/mobile parity + integrity v66.2');
