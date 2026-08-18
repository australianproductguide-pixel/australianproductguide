#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const entry=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');

assert.ok(entry.includes("require('../lib/amazon-conversion-v29')"),'mobile visual fix must preserve Amazon conversion v29 as the application runtime');
assert.ok(entry.includes('id="apg-mobile-category-visual-fix"'),'targeted mobile visual fix marker missing');
assert.ok(entry.includes('@media(max-width:720px)'),'fix must remain restricted to the mobile/tablet certification breakpoint');
assert.ok(entry.includes('body[data-institutional-v9="true"] .pick-card>.product-visual.v7-semantic-product-visual'),'fix must target only institutional category Decision-shortcut product visuals');
assert.ok(entry.includes('margin-left:0!important'),'mobile shortcut visual must remove the negative left margin');
assert.ok(entry.includes('margin-right:0!important'),'mobile shortcut visual must remove the negative right margin');
assert.ok(entry.includes('width:100%!important'),'mobile shortcut visual must be contained to its card content width');
assert.ok(entry.includes('max-width:100%!important'),'mobile shortcut visual must not exceed its card content width');
assert.ok(entry.includes('box-sizing:border-box!important'),'mobile shortcut visual sizing must include its own padding/border');
assert.ok(!/overflow-x\s*:\s*hidden/i.test(entry),'do not mask document-width defects with global overflow-x hiding');
assert.ok(!/body[^\n{]*\{[^}]*overflow\s*:\s*hidden/i.test(entry),'do not hide page overflow globally');

console.log('Mobile category visual overflow QA passed: targeted 720px containment rule present; global overflow masking absent.');