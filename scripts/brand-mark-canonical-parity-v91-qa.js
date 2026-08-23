'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const layer=require('../lib/brand-mark-canonical-parity-v91');
const curated=require('../data/brand-mark-curated-overrides-v66');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

function response(){
  const headers=new Map();
  return {
    statusCode:200,body:null,ended:false,
    setHeader(k,v){headers.set(String(k).toLowerCase(),String(v));},
    getHeader(k){return headers.get(String(k).toLowerCase());},
    removeHeader(k){headers.delete(String(k).toLowerCase());},
    end(body=''){this.body=Buffer.isBuffer(body)?body:Buffer.from(String(body));this.ended=true;return this;},
    headers
  };
}
async function invoke(url,userAgent){
  const req={method:'GET',url,headers:{'user-agent':userAgent}};
  const res=response();
  await layer(req,res);
  return res;
}

(async()=>{
  assert.equal(layer.BRAND_MARK_CANONICAL_PARITY_VERSION,'91.0','canonical parity must be v91.0');
  assert(layer.BRAND_MARK_CANONICAL_PARITY_TARGETS.has('amazon'),'Amazon must be a v91 parity target');
  assert(layer.BRAND_MARK_CANONICAL_PARITY_TARGETS.has('breville'),'Breville must be a v91 parity target');

  const amazon=layer.amazonIdentity();
  assert(Buffer.isBuffer(amazon.buffer),'Amazon identity must be generated as deterministic bytes');
  assert(String(amazon.type).includes('svg'),'Amazon directory identity must be a vector treatment');
  assert.equal(amazon.assetKind,'canonical-brand-name','Amazon must fail closed to canonical brand-name treatment');
  assert.equal(amazon.resolverSource,'amazon-associates-brand-name-fallback','Amazon must expose the Associates-safe source reason');
  assert(amazon.policyReference&&amazon.policyReference.includes('affiliate-program.amazon.com.au'),'Amazon policy reference must point to Associates Central AU');
  const amazonText=amazon.buffer.toString('utf8');
  assert(/Amazon/i.test(amazonText),'Amazon vector must identify the canonical brand');
  assert(!/<image\b/i.test(amazonText),'Amazon vector must not embed product/lifestyle imagery');
  assert(!/(shirt|t-shirt|product|model|haul)/i.test(amazonText),'Amazon vector must not contain known product/sub-brand leakage');

  const desktop=await invoke('/assets/brand-marks/amazon?v=91.0','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36');
  const mobile=await invoke('/assets/brand-marks/amazon?v=91.0','Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1');
  assert.equal(desktop.statusCode,200,'desktop Amazon endpoint must return 200');
  assert.equal(mobile.statusCode,200,'mobile Amazon endpoint must return 200');
  assert.equal(sha(desktop.body),sha(mobile.body),'Amazon endpoint bytes must be identical across desktop/mobile user agents');
  assert.equal(desktop.getHeader('x-apg-brand-mark-canonical-parity'),'v91.0','Amazon endpoint must expose v91 header');
  assert.equal(desktop.getHeader('x-apg-brand-mark-source'),'amazon-associates-brand-name-fallback','Amazon endpoint must not leak an older resolver source');
  assert(String(desktop.getHeader('content-type')).includes('svg'),'Amazon endpoint must not serve PNG/JPEG/WebP product imagery');

  assert(curated.breville,'Breville reviewed override must exist');
  assert.equal(curated.breville.format,'svg','Breville reviewed override must remain SVG');
  assert.equal(curated.breville.reviewStatus,'curated-reviewed-vector','Breville must remain an explicitly reviewed vector');
  assert(curated.breville.assetUrl.includes('Breville_logo.svg'),'Breville v91 must be anchored to the reviewed clean vector asset');

  const source=read('lib/brand-mark-canonical-parity-v91.js');
  assert(source.includes("curated.fetchCurated('breville')"),'Breville v91 must request the reviewed curated override before any fallback');
  assert(source.includes("return canonicalNameImage('breville'"),'Breville must fail closed rather than fall back to the known low-resolution raster');
  assert(source.includes("const TARGETS=new Set(['amazon','breville'])"),'v91 scope must remain narrow and explicit');

  const sample='<html><head></head><body><img src="/assets/brand-marks/amazon?v=70.2"><img src="/assets/brand-marks/breville?v=73.1"><img src="/assets/brand-marks/samsung?v=73.1"></body></html>';
  const patched=layer.versionTargetUrls(sample);
  assert(patched.includes('/assets/brand-marks/amazon?v=91.0'),'Amazon HTML must invalidate historical brand caches');
  assert(patched.includes('/assets/brand-marks/breville?v=91.0'),'Breville HTML must invalidate historical brand caches');
  assert(patched.includes('/assets/brand-marks/samsung?v=73.1'),'unrelated brand URLs must remain untouched');

  const api=read('api/index.js');
  assert(api.includes("module.exports=require('../lib/brand-mark-canonical-parity-v91')"),'v91 must be the public outermost runtime layer');
  assert(api.includes("module.exports=require('../lib/action3-search-commerce-v90')"),'v91 entrypoint history must preserve Action 3 v90 immediately underneath');
  assert.equal(layer.VERSION,'52.0','Search v52 protected export must survive v91');
  assert.equal(layer.DECISION_VERSION,'50.6','Decision Lab v50.6 protected export must survive v91');

  const pkg=JSON.parse(read('package.json'));
  assert(pkg.scripts['qa:brand-canonical-parity']==='node scripts/brand-mark-canonical-parity-v91-qa.js','package must expose v91 QA command');
  assert(pkg.scripts['qa:deploy'].startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js &&'),'v91 must be the first deploy gate');
  assert(pkg.scripts['qa:full'].startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js &&'),'v91 must be the first full-source gate');

  console.log(`BRAND_MARK_CANONICAL_PARITY_V91=PASS targets=2 amazonDesktopMobileHash=${sha(desktop.body).slice(0,16)} breville=reviewed-vector cacheVersion=91.0 search=${layer.VERSION} decision=${layer.DECISION_VERSION}`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
