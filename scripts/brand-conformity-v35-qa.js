#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const runtime=require('../lib/brand-conformity-v35');

const api=fs.readFileSync(require.resolve('../api/index.js'),'utf8');
assert(api.includes("require('../lib/brand-conformity-v35')")||api.includes("require('../lib/brand-conformity-v351')"),'api/index.js must activate v35 directly or through the governing v35.1 wrapper');
assert.strictEqual(runtime.VERSION,'35');
assert(runtime.css.includes('--apg35-blue:#2563EB'));
assert(runtime.css.includes('--apg35-navy:#0F172A'));
assert(runtime.css.includes('--apg35-teal:#06B6D4'));
assert(runtime.css.includes('--apg35-green:#10B981'));
assert(runtime.css.includes('.apg-rv-v43'),'v35 must govern Research View v43');
assert(runtime.css.includes('--rv-teal:#2563EB'),'Research View primary accent must resolve to APG Blue');
assert(!/#087c76|#075e5a|#dff3ee|#def2ec|#99cfc2|#0c837a|#08716b/i.test(runtime.css),'v35 stylesheet must not reintroduce historical teal/mint values');
const sample='<!doctype html><html><head><meta property="og:image" content="https://australianproductguide.au/assets/social.svg"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/old.svg"></head><body><main>Sample</main></body></html>';
const out=runtime.inject(sample);
assert(out.includes('data-brand-conformity-v35="true"'));
assert(out.includes('/assets/favicon.svg?v=35'));
assert(out.includes('/assets/apg-social-card.png?v=35'));
assert(out.includes('property="og:image:type" content="image/png"'));
assert(out.includes('property="og:image:width" content="1200"'));
assert(out.includes('name="twitter:image"'));
assert(out.includes('/assets/apple-touch-icon.png?v=35'));
assert(out.includes('/site.webmanifest?v=35'));
assert(!out.includes('assets/social.svg'));
for(const [name,buf] of [['social',runtime.makeSocialPng()],['icon192',runtime.makeIconPng(192)],['icon512',runtime.makeIconPng(512)]]){
  assert(Buffer.isBuffer(buf),`${name} must be a Buffer`);
  assert(buf.length>100,`${name} PNG unexpectedly small`);
  assert.strictEqual(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${name} must have PNG signature`);
}
const manifest=JSON.parse(runtime.manifest);
assert.strictEqual(manifest.theme_color,'#0F172A');
assert.strictEqual(manifest.icons.length,2);
console.log('APG v35 source QA PASS');
