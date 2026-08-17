const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {polishMobileNav}=require('../lib/mobile-menu-polish-v21');

const fixture=`<!doctype html><html><head></head><body><header><nav id="mobileNav" class="mobile-nav apg-mobile-v8"><div class="wrap mobile-nav-inner"><form class="global-search apg-mobile-search"><input placeholder="Search products, categories or comparisons"></form><section class="apg-mobile-account-v20"><span>Your Australian Product Guide account</span><a href="/my-apg/?account=login">Log in</a><a class="is-primary" href="/my-apg/?account=signup">Join free</a></section><a class="mobile-power" href="/decision-lab/">Decision Lab <span>→</span></a><a class="mobile-power" href="/decision-lab/">Decision Lab <span>→</span></a><details class="mobile-section"><summary>Popular products</summary></details></div></nav></header></body></html>`;

const out=polishMobileNav(fixture);
const css=fs.readFileSync(path.join(__dirname,'../public/assets/mobile-menu-polish-v21.css'),'utf8');

assert(out.includes('/assets/mobile-menu-polish-v21.css?v=21'),'v21 stylesheet should be injected');
assert.strictEqual((out.match(/mobile-menu-polish-v21\.css\?v=21/g)||[]).length,1,'stylesheet should be injected once');
assert(out.includes('placeholder="Search products or categories"'),'mobile search placeholder should be concise');
assert(!out.includes('Search products, categories or comparisons'),'old long mobile placeholder should be removed');
assert(out.includes('<span>Your APG account</span>'),'account heading should be concise');
assert(out.includes('>Log in</a>')&&out.includes('>Join free</a>'),'both account actions must remain available');
assert.strictEqual((out.match(/class="mobile-power"/g)||[]).length,1,'mobile Decision Lab CTA should not be duplicated');
assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'account actions should use two equal grid columns');
assert(css.includes('width:100%!important')&&css.includes('height:44px!important'),'menu account actions should be equal-sized controls');
assert(css.includes('.apg-mobile-member-top-v20 a{'),'top account controls should have a shared rule');
assert(css.includes('width:72px!important')&&css.includes('height:42px!important'),'top Log in and Join controls should share dimensions');

console.log('Mobile menu polish v21 QA passed');
