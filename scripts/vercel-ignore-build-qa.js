'use strict';

const assert=require('assert');
const control=require('./vercel-ignore-build');

assert.strictEqual(control.canIgnore(['docs/APG-OPERATIONS.md']),true);
assert.strictEqual(control.canIgnore(['ops/certification/note.txt','.github/workflows/source-qa.yml']),true);
assert.strictEqual(control.canIgnore(['README.md','RELEASE']),true);
assert.strictEqual(control.canIgnore(['lib/runtime.js']),false);
assert.strictEqual(control.canIgnore(['docs/note.md','public/assets/app.js']),false);
assert.strictEqual(control.canIgnore([]),false);
assert.strictEqual(control.isSafePath('./docs/test.md'),true);
assert.strictEqual(control.isSafePath('vercel.json'),false);

console.log('VERCEL_IGNORE_BUILD_QA=PASS');
