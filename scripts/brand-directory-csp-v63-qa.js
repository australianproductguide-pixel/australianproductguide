#!/usr/bin/env node
'use strict';

const assert=require('assert');
const runtime=require('../lib/brand-directory-csp-v63');

const legacyStyle='<style id="apg-brand-index-logos-v62">.legacy{display:block}</style>';
const sample=`<html><head>${legacyStyle}</head><body data-apg-brand-index-logos="v62"><main>Brands</main></body></html>`;

const index=runtime.injectBrandDirectoryStylesheet(sample,'/brands/');
assert(!index.includes('id="apg-brand-index-logos-v62"'),'brands index must remove the superseded inline v62 style block');
assert(!/<style\b/i.test(index),'brands index fixture must not retain inline style elements');
assert(index.includes('/assets/brand-directory-v63.css?v=63.0'),'brands index must use the same-origin v63 stylesheet');
assert.equal((index.match(/brand-directory-v63\.css/g)||[]).length,1,'brands stylesheet must be injected exactly once');
assert(index.includes('apg-brand-directory-csp'),'brands index must expose the CSP presentation marker');

const alreadyLinked=`<html><head>${legacyStyle}<link rel="stylesheet" href="/assets/brand-directory-v63.css?v=63.0"></head><body></body></html>`;
const linked=runtime.injectBrandDirectoryStylesheet(alreadyLinked,'/brands/');
assert(!linked.includes('id="apg-brand-index-logos-v62"'),'legacy inline style must be removed even when v63 stylesheet is already linked');
assert.equal((linked.match(/brand-directory-v63\.css/g)||[]).length,1,'existing stylesheet must not be duplicated');

const detail=runtime.injectBrandDirectoryStylesheet(sample,'/brands/sony/');
assert(!detail.includes('id="apg-brand-index-logos-v62"'),'brand detail route must remove legacy inline v62 CSS');
assert(detail.includes('/assets/brand-directory-v63.css?v=63.0'),'brand detail route must use same-origin v63 CSS');

const nonBrand=runtime.injectBrandDirectoryStylesheet(sample,'/about/');
assert.equal(nonBrand,sample,'non-brand routes must remain untouched');

const singleQuoted=`<style class="legacy" id='apg-brand-index-logos-v62'>x{color:red}</style>`;
assert.equal(runtime.removeLegacyInlineBrandStyles(singleQuoted),'','legacy style remover must handle single-quoted ids');

console.log('BRAND_DIRECTORY_CSP_V63=PASS inline_style=removed external_stylesheet=preserved');
