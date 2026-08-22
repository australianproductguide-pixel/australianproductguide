'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {products}=require('../data');
const {brands,slugify}=require('../lib/routes');
const officialDomains=require('../data/brand-official-domains-v62');

const quality=read('lib/brand-mark-quality-v65.js');
const placeholder=read('lib/product-brand-placeholder-v64.js');
const entry=read('api/index.js');

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

assert(entry.includes("module.exports=require('../lib/brand-mark-quality-v65')"),'public entrypoint must use current v65 brand mark quality layer');
assert(quality.includes("require('./product-brand-placeholder-v64')"),'v65 must preserve product placeholder v64 underneath');
assert(placeholder.includes('/assets/brand-marks/'),'product placeholders must resolve through the governed brand-mark endpoint');
assert(quality.includes("premium-vector")&&quality.includes("premium-raster"),'v65 must explicitly recognise premium vector/raster assets');
assert(quality.includes("High-quality official brand mark unavailable; use brand-name fallback"),'v65 must prefer text fallback over a poor logo');
assert(!quality.includes('google.com/s2/favicons'),'v65 must not use Google favicon resolver fallbacks');
assert(!quality.includes('icons.duckduckgo.com'),'v65 must not use DuckDuckGo favicon resolver fallbacks');
assert(quality.includes("if(/icon|ico/i.test(image.type)||kind==='site_icon')return null"),'v65 must reject favicon-quality raster icons');
assert(quality.includes("X-APG-Brand-Mark-Quality"),'v65 must expose brand mark quality for live verification');

console.log(`APG Brand Integrity v65 QA passed: ${products.length}/${products.length} products -> ${used.size}/${brands.length} canonical brands -> ${Object.keys(officialDomains).length} governed domains; low-quality favicon fallbacks disabled.`);
