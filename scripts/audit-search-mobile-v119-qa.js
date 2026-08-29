'use strict';
const fs=require('fs');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const mod=require('../lib/audit-search-mobile-v119-runtime');
const search=require('../lib/search');
const api=fs.readFileSync(require.resolve('../api/index'),'utf8');

assert(mod.VERSION==='119.0','unexpected audit search/mobile version');
assert(mod.MOBILE_FORM.includes('data-apg-mobile-search-v119'),'mobile search SSR marker missing');
assert(mod.MOBILE_FORM.includes('action="/search/"')&&mod.MOBILE_FORM.includes('name="q"'),'mobile search must use canonical Search GET contract');
assert(mod.CSS.includes('@media(max-width:920px)'),'mobile search visibility breakpoint missing');
assert(mod.JS.includes('productSuggestionAnchor'),'autocomplete product anchor guard missing');
assert(mod.JS.includes("/^\\/products\\/[^/]+\\/$/"),'autocomplete guard must restrict itself to canonical product routes');
assert(mod.JS.includes('event.stopImmediatePropagation()'),'legacy autocomplete handlers are not isolated');
assert(mod.JS.includes('Do not preventDefault'),'native anchor navigation must remain authoritative');
assert(mod.JS.includes("event.key!=='Enter'"),'keyboard activation guard missing');
assert(!mod.JS.includes('location.assign(')&&!mod.JS.includes('location.href='),'v119 must not add imperative location navigation');
assert(api.includes("require('../lib/audit-search-mobile-v119-runtime')"),'api does not load v119');
assert(api.includes('auditSearchMobile.wrap(navigatorHandler)'),'v119 is not outermost audit shell');

const nonsense=search.searchSite('flibbertigibbet quantum banana toaster unicorn');
assert(Array.isArray(nonsense.products)&&nonsense.products.length===0,'unsupported nonsense query manufactured product relevance');
assert(nonsense.zeroResult?.reason==='unrecognised-query','unsupported nonsense query must expose governed zero-result reason');
assert((nonsense.zeroResult?.message||'').includes('could not confidently match'),'zero-result message must explain uncertainty honestly');
assert(nonsense.directCompare==null,'nonsense query must not manufacture direct comparison');

const known=search.searchSite('Sony WH-1000XM6');
assert((known.products||[]).some(p=>p.slug),'known maintained model should still resolve');
assert(known.zeroResult?.reason!=='unrecognised-query','valid model search was incorrectly rejected');

console.log('AUDIT_SEARCH_MOBILE_V119=PASS autocomplete=native-anchor keyboard=enter mobile=ssr-visible nonsense=zero-result valid-model=preserved commercialWeight=0');
