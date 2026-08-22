'use strict';

const fs=require('fs');
const path=require('path');
const layer=require('../lib/brand-mark-missing-only-v73');

function assert(condition,message){if(!condition)throw new Error(message);}

assert(layer.BRAND_MARK_MISSING_ONLY_VERSION==='73.1','missing-logo layer version must be v73.1');
assert(Array.isArray(layer.MISSING_ONLY_SLUGS)&&layer.MISSING_ONLY_SLUGS.length>50,'expected substantial attachment-derived missing-only set');
assert(new Set(layer.MISSING_ONLY_SLUGS).size===layer.MISSING_ONLY_SLUGS.length,'missing-only set must not contain duplicates');

for(const slug of ['american-tourister','breville','samsung','philips','delonghi','dyson','electrolux','google','gopro','hisense','lenovo','microsoft','nintendo','razer','tcl','ugreen','xiaomi','zojirushi']){
  assert(layer.TARGETS.has(slug),`expected attachment-derived missing target ${slug}`);
}
for(const slug of ['amazon','apple','lg','eufy','ninja','tp-link','asus','bose','sony','sonos','sennheiser','iniu']){
  assert(!layer.TARGETS.has(slug),`known visible logo must remain outside missing-only scope: ${slug}`);
}

const invisible=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" opacity="0"><path d="M0 0h10v10H0z"/></svg>');
const visible=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>');
assert(layer.svgRenderable(invisible)===false,'opacity=0 SVG must be rejected');
assert(layer.svgRenderable(visible)===true,'ordinary visible SVG must be accepted');

const sample='<html><head></head><body><span data-brand-logo-shell><span class="brand-logo-text-fallback">Microsoft</span><img class="brand-card-logo" src="/assets/brand-marks/microsoft" loading="lazy"></span><img class="brand-card-logo" src="/assets/brand-marks/apple" loading="lazy"></body></html>';
const patched=layer.patchTargetedDirectoryHtml(sample,'/brands/');
assert(patched.includes('data-apg-missing-logo-target="microsoft"'),'targeted brand must be tagged for hydration');
assert(patched.includes('/assets/brand-marks/microsoft?v=73.1'),'targeted brand must use v73.1 cache key');
assert(patched.includes('src="/assets/brand-marks/microsoft?v=73.1" loading="eager"'),'targeted missing logo must be eager in server-rendered HTML');
assert(patched.includes('/assets/brand-missing-logo-loader-v73.js?v=73.1'),'brands directory must load CSP-safe missing-logo hydrator');
assert(!patched.includes('data-apg-missing-logo-target="apple"'),'known-good brand must remain untouched');
assert(patched.includes('src="/assets/brand-marks/apple" loading="lazy"'),'known-good brand must retain existing lazy-loading behaviour');

const api=fs.readFileSync(path.join(__dirname,'..','api','index.js'),'utf8');
assert(api.includes("module.exports=require('../lib/brand-mark-missing-only-v73')"),'v73 must be outermost public API layer');
const runtime=fs.readFileSync(path.join(__dirname,'..','public','assets','brand-missing-logo-loader-v73.js'),'utf8');
assert(runtime.includes("const VERSION='73.1'"),'runtime loader version must match v73.1');
assert(runtime.includes("img.loading='eager'"),'targeted missing marks must retain CSP-safe eager hydration');

console.log(`APG BRAND MISSING LOGO v73.1 QA PASSED: targets=${layer.MISSING_ONLY_SLUGS.length}; existing visible brands excluded; invisible SVG rejection active; server-eager + CSP-safe targeted hydration active.`);
