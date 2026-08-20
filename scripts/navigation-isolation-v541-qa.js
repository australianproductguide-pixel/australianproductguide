'use strict';
const assert=require('assert');
const fs=require('fs');
const handler=require('../lib/navigation-isolation-v541-runtime');

assert.equal(handler.VERSION,'52.0','existing Search outer VERSION contract must remain unchanged');
assert.equal(handler.DECISION_VERSION,'50.6','existing Decision Lab outer contract must remain unchanged');
assert.equal(handler.NAV_VERSION,'54.1');
assert.equal(handler.NAV_ASSET_PATH,'/assets/navigation-isolation-v541.js');
assert.equal(handler.NAV_PATCH,'navigation-p0-2026-08-21-native-link-isolation-r1');
new Function(handler.navClientJs);

const api=fs.readFileSync(require.resolve('../api/index.js'),'utf8');
assert(api.includes("module.exports=require('../lib/navigation-isolation-v541-runtime')"),'API must expose navigation isolation as the outer wrapper');

const base='<head><script src="/assets/search-reliability-v52.js?v=52.0" defer></script><script src="/assets/app.js?v=x" defer></script></head>';
const injected=handler.injectNavigation(base);
assert(injected.includes('/assets/navigation-isolation-v541.js?v=54.1'),'navigation isolation asset must be injected');
assert(injected.indexOf('/assets/navigation-isolation-v541.js')<injected.indexOf('/assets/search-reliability-v52.js'),'navigation isolation must register before Search and legacy app handlers');
assert.equal(handler.injectNavigation(injected),injected,'navigation isolation injection must be idempotent');

class FakeElement{
 constructor({href='',inMain=false,compare=false,target='' }={}){this.href=href;this.inMain=inMain;this.compare=compare;this.target=target;}
 closest(sel){if(sel==='a[href]')return this;if(sel==='main#main')return this.inMain?{}:null;return null;}
 matches(sel){return sel==='a[data-compare-link]'&&this.compare;}
 hasAttribute(){return false;}
}
function install(pathname){
 const listeners={};
 const window={addEventListener:(type,fn)=>{listeners[type]=fn}};
 const document={body:{dataset:{}}};
 const location={pathname,href:'https://australianproductguide.au'+pathname,origin:'https://australianproductguide.au'};
 new Function('window','Element','document','location',handler.navClientJs)(window,FakeElement,document,location);
 assert.equal(typeof listeners.click,'function','capture click handler must register');
 return {click:listeners.click,document,location};
}
function eventFor(target,extra={}){return {button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,target,stopped:false,prevented:false,stopImmediatePropagation(){this.stopped=true},preventDefault(){this.prevented=true},...extra};}

{
 const t=install('/search/'),a=new FakeElement({href:'https://australianproductguide.au/products/oppo-find-x9/',inMain:true}),e=eventFor(a);
 t.click(e);
 assert(e.stopped,'Search product click must stop later legacy click handlers');
 assert(!e.prevented,'Search product click must keep native browser navigation');
 assert.equal(t.document.body.dataset.apgNativeNavigation,'search-product');
}
{
 const t=install('/products/oppo-find-x9/'),a=new FakeElement({href:'https://australianproductguide.au/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26',compare:true}),e=eventFor(a);
 t.click(e);
 assert(e.stopped,'ready Compare tray click must stop later legacy navigation fallbacks');
 assert(!e.prevented,'ready Compare tray click must keep native browser navigation');
 assert.equal(t.document.body.dataset.apgNativeNavigation,'compare-tray');
}
{
 const t=install('/products/oppo-find-x9/'),a=new FakeElement({href:'https://australianproductguide.au/compare/custom/?products=oppo-find-x9',compare:true}),e=eventFor(a);
 t.click(e);
 assert(!e.stopped,'Compare tray with fewer than two products must not be isolated as a ready comparison');
}
{
 const t=install('/search/'),a=new FakeElement({href:'https://example.com/products/test/',inMain:true}),e=eventFor(a);
 t.click(e);
 assert(!e.stopped,'external links must remain untouched');
}
{
 const t=install('/search/'),a=new FakeElement({href:'https://australianproductguide.au/products/oppo-find-x9/',inMain:true}),e=eventFor(a,{metaKey:true});
 t.click(e);
 assert(!e.stopped,'modified clicks must preserve normal browser behaviour');
}

console.log('NAVIGATION_ISOLATION_V54_1=PASS');
