'use strict';
const assert=require('assert');
const fs=require('fs');
const favicon=require('../lib/favicon-parity-v115-runtime');

assert.equal(favicon.VERSION,'115.0');
const sample='<!doctype html><html><head><link rel="icon" href="/favicon-v105.svg"><link rel="manifest" href="/site.webmanifest"><title>APG</title></head><body></body></html>';
const out=favicon.inject(sample);
for(const token of [
  'name="apg-favicon-parity" content="v115.0"',
  'rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"',
  'rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48"',
  'rel="shortcut icon" href="/favicon.ico"',
  'rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"',
  'rel="manifest" href="/site.webmanifest"'
]) assert(out.includes(token),`missing favicon contract: ${token}`);
assert(!out.includes('/favicon-v105.svg'),'legacy favicon reference should be removed from rendered head');
assert.equal((out.match(/rel="manifest"/g)||[]).length,1,'manifest link should be canonical and singular');

const manifest=JSON.parse(fs.readFileSync('public/site.webmanifest','utf8'));
const icons=manifest.icons||[];
for(const [src,sizes,type] of [
  ['/favicon.svg','any','image/svg+xml'],
  ['/icon-192.png','192x192','image/png'],
  ['/icon-512.png','512x512','image/png']
]){
  const icon=icons.find(x=>x.src===src);
  assert(icon,`manifest icon missing: ${src}`);
  assert.equal(icon.sizes,sizes,`manifest sizes mismatch for ${src}`);
  assert.equal(icon.type,type,`manifest type mismatch for ${src}`);
  assert.equal(icon.purpose,'any',`manifest purpose must remain conservative for ${src}`);
}
for(const path of ['public/favicon.svg','public/favicon-48x48.png','public/favicon.ico','public/apple-touch-icon.png','public/icon-192.png','public/icon-512.png']) assert(fs.existsSync(path),`favicon asset missing: ${path}`);
console.log('FAVICON_PARITY_V115=PASS');
