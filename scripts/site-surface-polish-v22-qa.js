const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {polishSiteSurfaces}=require('../lib/site-surface-polish-v22');

const fixture='<!doctype html><html><head><link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21"></head><body data-institutional-v9="true"><main><article class="product-card"><div class="product-card-body">Product</div></article><section class="workspace-panel">Workspace</section><div class="faq"><details><summary>Question</summary><p>Answer</p></details></div><div class="compare-wrap"><table class="compare"></table></div><nav class="policy-nav"><a href="#a">A</a></nav></main></body></html>';

const out=polishSiteSurfaces(fixture);
const twice=polishSiteSurfaces(out);
const css=fs.readFileSync(path.join(__dirname,'../public/assets/site-surface-polish-v22.css'),'utf8');
const api=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
const wrapper=fs.readFileSync(path.join(__dirname,'../lib/site-surface-polish-v22.js'),'utf8');
const authPath=path.join(__dirname,'../lib/auth-hardening-v23.js');
const auth=fs.existsSync(authPath)?fs.readFileSync(authPath,'utf8'):'';
const profilePath=path.join(__dirname,'../lib/account-profile-v24.js');
const profile=fs.existsSync(profilePath)?fs.readFileSync(profilePath,'utf8'):'';

assert(out.includes('data-surface-v22="true"'),'v22 body marker should be injected');
assert.strictEqual((twice.match(/data-surface-v22="true"/g)||[]).length,1,'v22 body marker should only appear once');
assert(out.includes('/assets/site-surface-polish-v22.css?v=22'),'v22 stylesheet should be injected');
assert.strictEqual((twice.match(/site-surface-polish-v22\.css\?v=22/g)||[]).length,1,'v22 stylesheet should only appear once');
assert(out.includes('/assets/mobile-menu-polish-v21.css?v=21'),'v21 mobile menu layer must remain present');

assert(css.includes('body[data-surface-v22="true"]'),'v22 CSS must remain scoped to the body marker');
assert(css.includes('--apg22-control:44px'),'shared action height token must remain 44px');
for(const selector of ['.product-card','.workspace-panel','.faq details','.compare-wrap','.policy-nav','.retailer-panel','.decision-form']){
  assert(css.includes(selector),`surface system should cover ${selector}`);
}
assert(css.includes('.difference-engine'),'signature Difference Engine preservation must remain explicit');
assert(css.includes('.apg-assistant-panel'),'Scout preservation must remain explicit');
assert(css.includes('prefers-reduced-motion'),'reduced-motion support must remain present');

const directV22=api.includes("require('../lib/site-surface-polish-v22')");
const viaV23=api.includes("require('../lib/auth-hardening-v23')")&&auth.includes("require('./site-surface-polish-v22')");
const viaV24=api.includes("require('../lib/account-profile-v24')")&&profile.includes("require('./auth-hardening-v23')")&&auth.includes("require('./site-surface-polish-v22')");
assert(directV22||viaV23||viaV24,'api entry point must preserve the v22 site-surface layer, directly or through the current wrapper chain');
assert(wrapper.includes("require('./mobile-menu-polish-v21')"),'v22 must compose over v21 rather than bypassing it');
assert(!wrapper.includes('recommendationScore')&&!wrapper.includes('affiliateCommission'),'v22 wrapper must remain presentation-only');

console.log('Site surface polish v22 QA passed');
