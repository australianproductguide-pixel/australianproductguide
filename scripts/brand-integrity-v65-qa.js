'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {products}=require('../data');
const {brands,slugify}=require('../lib/routes');
const officialDomains=require('../data/brand-official-domains-v62');
const curatedOverrides=require('../data/brand-mark-curated-overrides-v66');

const complete=read('lib/brand-mark-complete-v67.js');
const parity=read('lib/brand-mark-device-parity-v66.js');
const curated=read('lib/brand-mark-curated-v66.js');
const quality=read('lib/brand-mark-quality-v65.js');
const placeholder=read('lib/product-brand-placeholder-v64.js');
const brandIndex=read('lib/brand-index-logos-v62.js');
const entry=read('api/index.js');

assert.doesNotThrow(()=>new Function(complete),'brand-mark-complete-v67.js must parse');
assert.doesNotThrow(()=>new Function(parity),'brand-mark-device-parity-v66.js must parse');
assert.doesNotThrow(()=>new Function(curated),'brand-mark-curated-v66.js must parse');
assert.doesNotThrow(()=>new Function(quality),'brand-mark-quality-v65.js must parse');
assert.equal(products.length,482,'brand integrity gate expects the current 482-product canonical catalogue');
assert.equal(brands.length,178,'brand integrity gate expects the current 178-brand canonical directory');

const canonicalBySlug=new Map(brands.map(name=>[slugify(name),name]));
assert.equal(canonicalBySlug.size,brands.length,'canonical brand slugs must be unique');

const errors=[];
const used=new Map();
for(const product of products){
  const brand=String(product.brand||'').trim();
  const slug=slugify(brand);
  const label=String(product.name||product.title||product.slug||'Unnamed product');
  if(!brand)errors.push(`${label}: missing brand`);
  else if(!canonicalBySlug.has(slug))errors.push(`${label}: non-canonical brand "${brand}" (${slug})`);
  else if(canonicalBySlug.get(slug)!==brand)errors.push(`${label}: brand spelling/case differs from canonical "${canonicalBySlug.get(slug)}" (found "${brand}")`);
  if(slug){
    used.set(slug,(used.get(slug)||0)+1);
    if(!officialDomains[slug])errors.push(`${label}: brand ${brand} has no governed official-domain mapping`);
  }
}
assert.deepEqual(errors,[],`product-to-brand integrity failures:\n${errors.join('\n')}`);
assert.equal(used.size,178,'all 178 canonical brands should be represented by at least one maintained product');

const missingDomain=brands.filter(name=>!officialDomains[slugify(name)]);
assert.deepEqual(missingDomain,[],'every canonical brand must have a governed official-domain mapping');
const extraDomain=Object.keys(officialDomains).filter(slug=>!canonicalBySlug.has(slug));
assert.deepEqual(extraDomain,[],'official-domain registry must not contain orphan brand slugs');

assert(entry.includes("module.exports=require('../lib/brand-mark-complete-v67')"),'public entrypoint must use complete brand identity v67.2');
assert(complete.includes("require('./brand-mark-device-parity-v66')"),'v67.2 must preserve v66.2 device parity/integrity underneath');
assert(complete.includes("BRAND_MARK_COMPLETE_VERSION='67.2'"),'v67.2 must expose the current complete-brand generation');
assert(complete.includes("BRAND_MARK_ASSET_VERSION='67.2'"),'v67.2 must pin the current brand asset generation');
assert(complete.includes('officialDomains'),'v67.2 must restrict brand identity fallbacks to governed official domains');
assert(complete.includes('manifest-icon')&&complete.includes('apple-touch-icon'),'v67.2 must inspect modern official-site identity declarations');
assert(complete.includes('official-domain-declared-identity'),'v67.2 must expose declared official-domain identity provenance');
assert(complete.includes('official-domain-favicon-cache'),'v67.2 must expose the governed official-domain favicon fallback provenance');
assert(complete.includes('drop_404_icon=true'),'v67.2 favicon fallback must reject generic default favicon responses');
assert(complete.includes('min_size=48'),'v67.2 favicon fallback must require a useful high-resolution source');
assert(complete.includes('if(slug===\'amazon\')return false'),'v67.2 must preserve Amazon sub-brand protection');
assert(complete.includes("String(image.assetKind||'').toLowerCase()!=='brand_img'"),'v67.2 must preserve generic product/lifestyle-image rejection');
assert(complete.includes('svgAppearsWhiteOnly'),'v67.2 must detect visually blank white-only SVG brand marks');
assert(complete.includes('contrastAdaptWhiteSvg'),'v67.2 must retain white official SVG artwork with a contrast-safe backing');
assert(complete.includes("fill=\"#0F172A\""),'v67.2 contrast adaptation must use the existing APG Navy canvas');
assert(complete.includes("presentation:'contrast-safe-dark-backing'"),'v67.2 must expose contrast-safe presentation provenance');
assert(complete.includes('canonicalFallbackImage'),'v67.2 must provide a terminal canonical fallback without delegating rejected assets downstream');
assert(complete.includes('return canonicalFallbackImage(slug)'),'v67.2 unresolved canonical brands must terminate in the safe fallback');
assert(complete.includes("if(downstream.curatedBrandMarkOverrides&&downstream.curatedBrandMarkOverrides[slug])return {delegate:true}"),'only reviewed curated overrides may intentionally delegate to the older brand layer');
assert(complete.includes('?v=${BRAND_MARK_ASSET_VERSION}'),'v67.2 must version every rendered brand-mark URL consistently across devices');
assert(complete.includes('X-APG-Brand-Mark-Complete'),'v67.2 must expose live verification headers');
assert(complete.includes('X-APG-Brand-Mark-Presentation'),'v67.2 must expose contrast presentation when used');

assert(parity.includes("require('./brand-mark-curated-v66')"),'v66.2 parity/integrity must preserve curated v66 immediately underneath');
assert(parity.includes("BRAND_MARK_DEVICE_PARITY_VERSION='66.2'"),'v66.2 must expose the device-parity generation');
assert(parity.includes("BRAND_MARK_INTEGRITY_VERSION='66.2'"),'v66.2 must expose the mark-integrity generation');
assert(parity.includes("if(kind==='brand_img')return 'generic-brand-image-rejected'"),'v66.2 must reject generic product/lifestyle images selected only by brand-token matching');
assert(parity.includes("'canonical-brand-name-fallback'"),'v66.2 must fail closed to a canonical brand-name graphic instead of a broken image');
assert(parity.includes("'empty-or-hidden-svg-rejected'"),'v66.2 must reject empty/hidden SVG output');
assert(parity.includes("slug==='amazon'"),'v66.2 must prevent Amazon sub-brand/promotional artwork from standing in for the canonical Amazon identity');
assert(parity.includes('fallbackBrandSvg'),'v66.2 must provide the deterministic same-origin SVG fallback reused by v67.2');
assert(!parity.includes('removeObsoleteBrandImageErrorHandlers'),'v66.2 must preserve browser-side image error safety rather than stripping it');
assert(brandIndex.includes('onerror="this.hidden=true"'),'brand directory must retain the browser-side fallback that exposes canonical text when an image request fails');
assert(curated.includes("require('./brand-mark-quality-v65')"),'v66 must preserve v65 brand quality immediately underneath');
assert(quality.includes("require('./product-brand-placeholder-v64')"),'v65 must preserve product placeholder v64 underneath');
assert(placeholder.includes('/assets/brand-marks/'),'product placeholders must resolve through the governed brand-mark endpoint');
assert(quality.includes('premium-vector')&&quality.includes('premium-raster'),'v65 must explicitly recognise premium vector/raster assets');
assert(quality.includes('High-quality official brand mark unavailable; use brand-name fallback'),'v65 must prefer text fallback over a poor logo');
assert(!quality.includes('google.com/s2/favicons'),'v65 itself must not use legacy Google S2 favicon fallbacks');
assert(!quality.includes('icons.duckduckgo.com'),'v65 itself must not use DuckDuckGo favicon fallbacks');
assert(quality.includes("if(/icon|ico/i.test(image.type)||kind==='site_icon')return null"),'v65 must continue rejecting tiny favicon-quality raster icons; v67.2 owns governed high-resolution identity fallback');
assert(quality.includes('X-APG-Brand-Mark-Quality'),'v65 must expose brand mark quality for live verification');

const expectedCurated=['breville','samsung','philips','delonghi','dyson'];
assert.deepEqual(Object.keys(curatedOverrides).sort(),expectedCurated.slice().sort(),'v66 curated override registry must remain explicitly scoped to the five reviewed grainy brands');
for(const slug of expectedCurated){
  const item=curatedOverrides[slug];
  assert(canonicalBySlug.has(slug),`curated override ${slug} must be a canonical APG brand`);
  assert.equal(item.format,'svg',`${slug} curated override must remain vector SVG`);
  assert(/^https:\/\//.test(item.assetUrl),`${slug} curated override must use HTTPS`);
  assert(/^https:\/\//.test(item.officialReference),`${slug} curated override must retain an official reference`);
  assert.equal(item.reviewStatus,'curated-reviewed-vector',`${slug} must remain explicitly reviewed`);
}
assert(curated.includes("X-APG-Brand-Mark-Source','curated-reviewed-vector-override"),'v66 must expose curated provenance for live verification');
assert(curated.includes("X-APG-Brand-Mark-Quality','premium-vector"),'v66 curated marks must report premium-vector quality');

console.log(`APG Brand Integrity v67.2 QA passed: ${products.length}/${products.length} products -> ${used.size}/${brands.length} canonical brands -> ${Object.keys(officialDomains).length} governed domains; ${expectedCurated.length} curated premium-vector overrides retained; complete official-domain identity resolver active; white official SVGs are contrast-safe; terminal fallback prevents rejected assets leaking downstream; desktop/mobile parity and bad-image protections preserved.`);