#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {runtimeChainIncludes}=require('./runtime-chain-qa');

const entry=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../public/assets/evidence-commerce-depth-v27.css'),'utf8');

assert.ok(runtimeChainIncludes('amazon-conversion-v29'),'application entry point must preserve Amazon conversion v29 through the active recursive runtime wrapper chain');
assert.ok(!entry.includes('apg-mobile-category-visual-fix'),'do not inject an inline style that APG style-src self CSP will reject');
assert.ok(css.includes('@media(max-width:720px)'),'fix must remain restricted to the mobile/tablet certification breakpoint');
assert.ok(css.includes('body[data-evidence-commerce-v27="true"] .pick-card>.product-visual.v7-semantic-product-visual'),'fix must target only category Decision-shortcut product visuals within the v27 evidence layer');
assert.ok(css.includes('margin-left:0!important'),'mobile shortcut visual must remove the negative left margin');
assert.ok(css.includes('margin-right:0!important'),'mobile shortcut visual must remove the negative right margin');
assert.ok(css.includes('width:100%!important'),'mobile shortcut visual must be contained to its card content width');
assert.ok(css.includes('max-width:100%!important'),'mobile shortcut visual must not exceed its card content width');
assert.ok(css.includes('min-width:0!important'),'mobile shortcut visual must be allowed to shrink with its card');
assert.ok(css.includes('box-sizing:border-box!important'),'mobile shortcut visual sizing must include its own padding/border');
assert.ok(!/overflow-x\s*:\s*hidden/i.test(css),'do not mask document-width defects with global overflow-x hiding');
assert.ok(!/body[^\n{]*\{[^}]*overflow\s*:\s*hidden/i.test(css),'do not hide page overflow globally');

console.log('Mobile category visual overflow QA passed: CSP-safe first-party containment is present; global overflow masking is absent.');