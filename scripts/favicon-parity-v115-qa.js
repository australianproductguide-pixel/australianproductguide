'use strict';
const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const favicon=require('../lib/favicon-parity-v115-runtime');

function count(haystack,needle){
  return haystack.split(needle).length-1;
}

function gitBlobSha(buffer){
  return crypto.createHash('sha1').update(Buffer.from(`blob ${buffer.length}\0`)).update(buffer).digest('hex');
}

function pngDimensions(path){
  const data=fs.readFileSync(path);
  assert(data.length>=24,`${path} must be a complete PNG`);
  assert(data.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),`${path} must have a PNG signature`);
  assert.equal(data.toString('ascii',12,16),'IHDR',`${path} must begin with an IHDR chunk`);
  return [data.readUInt32BE(16),data.readUInt32BE(20)];
}

function icoDimensions(path){
  const data=fs.readFileSync(path);
  assert(data.length>=6,`${path} must be a complete ICO`);
  assert.equal(data.readUInt16LE(0),0,'ICO reserved field must be zero');
  assert.equal(data.readUInt16LE(2),1,'ICO type must be icon');
  const count=data.readUInt16LE(4);
  assert(count>=1,'ICO must contain at least one image');
  assert(data.length>=6+(count*16),'ICO directory must be complete');
  const sizes=[];
  for(let i=0;i<count;i++){
    const offset=6+(i*16);
    const width=data[offset]||256;
    const height=data[offset+1]||256;
    sizes.push(`${width}x${height}`);
  }
  return sizes;
}

assert.equal(favicon.VERSION,'115.0');

const sample='<!doctype html><html><head><link rel="shortcut icon" href="/old.ico"><link rel="apple-touch-icon-precomposed" href="/old-touch.png"><link rel="icon" href="/favicon-v105.svg"><link rel="manifest" href="/legacy.webmanifest"><title>APG</title></head><body></body></html>';
const out=favicon.inject(sample);
for(const token of [
  'name="apg-favicon-parity" content="v115.0"',
  'rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any"',
  'rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48"',
  'rel="shortcut icon" href="/favicon.ico"',
  'rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"',
  'rel="manifest" href="/site.webmanifest"'
]) assert(out.includes(token),`missing favicon contract: ${token}`);
for(const legacy of ['/favicon-v105.svg','/old.ico','/old-touch.png','/legacy.webmanifest']) assert(!out.includes(legacy),`legacy rendered-head reference should be removed: ${legacy}`);
assert.equal(count(out,'name="apg-favicon-parity"'),1,'favicon parity marker should be singular');
assert.equal((out.match(/rel="manifest"/g)||[]).length,1,'manifest link should be canonical and singular');
assert.equal((out.match(/rel="apple-touch-icon"/g)||[]).length,1,'Apple touch icon should be canonical and singular');
assert.equal(favicon.inject(out),out,'favicon injection must be idempotent and preserve its managed links on a second pass');
assert.equal(favicon.inject('<html><body>no head</body></html>'),'<html><body>no head</body></html>','documents without a head must be left unchanged');

const stableHrefs=[...favicon.ICON_LINKS.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(stableHrefs,['/favicon.svg','/favicon-48x48.png','/favicon.ico','/apple-touch-icon.png','/site.webmanifest'],'managed discovery URLs must remain explicit and stable');
for(const href of stableHrefs) assert(!/[?#]/.test(href),`favicon discovery URL must not be cache-busted: ${href}`);

const manifest=JSON.parse(fs.readFileSync('public/site.webmanifest','utf8'));
const icons=manifest.icons||[];
assert.deepEqual(icons.map(({src,sizes,type,purpose})=>({src,sizes,type,purpose})),[
  {src:'/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
  {src:'/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
  {src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}
],'manifest must publish only the conservative canonical APG icon set');
for(const icon of icons){
  assert(!/[?#]/.test(icon.src),`manifest icon URL must remain stable: ${icon.src}`);
  assert.equal(icon.purpose,'any',`maskable must not be claimed without a dedicated safe-area asset: ${icon.src}`);
}

for(const path of ['public/favicon.svg','public/favicon-48x48.png','public/favicon.ico','public/apple-touch-icon.png','public/icon-192.png','public/icon-512.png']) assert(fs.existsSync(path),`favicon asset missing: ${path}`);
const svg=fs.readFileSync('public/favicon.svg');
assert.equal(gitBlobSha(svg),'90919fb8f9996499a830c99abf2eeb0483544fa9','approved canonical favicon.svg artwork must remain byte-for-byte unchanged');
assert.deepEqual(pngDimensions('public/favicon-48x48.png'),[48,48],'Search/browser PNG fallback must be exactly 48x48');
assert.deepEqual(pngDimensions('public/apple-touch-icon.png'),[180,180],'Apple touch icon must be exactly 180x180');
assert.deepEqual(pngDimensions('public/icon-192.png'),[192,192],'PWA icon must be exactly 192x192');
assert.deepEqual(pngDimensions('public/icon-512.png'),[512,512],'PWA icon must be exactly 512x512');
const icoSizes=icoDimensions('public/favicon.ico');
for(const expected of ['16x16','32x32','48x48']) assert(icoSizes.includes(expected),`ICO must contain ${expected}`);

const apiIndex=fs.readFileSync('api/index.js','utf8');
assert(apiIndex.includes("const faviconParity=require('../lib/favicon-parity-v115-runtime')"),'API entrypoint must load favicon parity');
assert(apiIndex.includes('const wholeSiteHandler=wholeSiteExperience.wrap(premiumMobileHandler);'),'Whole-Site v109 must remain the semantic layer immediately inside favicon parity');
assert(apiIndex.includes('const handler=faviconParity.wrap(wholeSiteHandler);'),'favicon parity must wrap the finished Whole-Site HTML');
assert(apiIndex.indexOf('const handler=faviconParity.wrap(wholeSiteHandler);')<apiIndex.indexOf('module.exports=handler;'),'favicon parity wrapper must be installed before final export');
assert.equal((apiIndex.match(/faviconParity\.wrap\(/g)||[]).length,1,'favicon parity must have one outer wrapper only');

console.log('FAVICON_PARITY_V115=PASS');
