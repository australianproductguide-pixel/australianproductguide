'use strict';
const assert=require('assert');
const scout=require('../lib/scout-concierge-v5');
const {core,amazon}=scout;

const verifiedSlugs=Object.keys(amazon.mapping.VERIFIED||{}).filter(slug=>core.PRODUCT_BY_SLUG.has(slug));
assert(verifiedSlugs.length,'Scout Amazon QA needs at least one verified maintained mapping');
const directProduct=core.PRODUCT_BY_SLUG.get(verifiedSlugs[0]);
const directBase=core.buildResponse({text:'Is this on Amazon Australia?',pageContext:{path:`/products/${directProduct.slug}/`}});
const direct=amazon.apply(core,'Is this on Amazon Australia?',directBase.pageContext,directBase.references,directBase);
assert.strictEqual(direct.intent,'price_or_retailer_question');
const directAction=direct.actions.find(x=>x&&x.external&&x.affiliate);
assert(directAction,'verified Amazon mapping must return a retailer action');
assert(/^https:\/\/www\.amazon\.com\.au\/dp\/[A-Z0-9]+\?tag=auproductguid-22$/.test(directAction.url),'verified mapping must use the authoritative tagged Amazon AU direct URL');
assert(['EXACT_VERIFIED','VARIANT_VERIFIED'].includes(direct.meta.amazonAu.matchStatus),'verified Amazon mapping must preserve exact/variant status');
assert.strictEqual(direct.meta.amazonAu.recommendationWeight,0,'Amazon availability must contribute zero recommendation weight');
assert(/won.t quote an Amazon price or stock level/i.test(direct.message),'Scout must not imply live Amazon price or stock without a current verified observation');

const fallbackProduct=[...core.PRODUCT_BY_SLUG.values()].find(p=>!amazon.mapping.VERIFIED[p.slug]);
assert(fallbackProduct,'Scout Amazon QA needs a maintained fallback product');
const fallbackBase=core.buildResponse({text:'Can I buy this on Amazon Australia?',pageContext:{path:`/products/${fallbackProduct.slug}/`}});
const fallback=amazon.apply(core,'Can I buy this on Amazon Australia?',fallbackBase.pageContext,fallbackBase.references,fallbackBase);
const fallbackAction=fallback.actions.find(x=>x&&x.external&&x.affiliate);
assert(fallbackAction,'fallback product must retain an Amazon AU pathway');
assert(fallbackAction.url.startsWith('https://www.amazon.com.au/s?k='),'unverified product must use model-specific Amazon AU search rather than an invented detail page');
assert(fallbackAction.url.includes('tag=auproductguid-22'),'fallback search must retain APG Associates tag');
assert.strictEqual(fallback.meta.amazonAu.matchStatus,'SEARCH_FALLBACK');
assert.strictEqual(fallback.meta.amazonAu.recommendationWeight,0);
assert(/won.t invent an ASIN/i.test(fallback.message),'fallback language must explicitly reject fabricated ASINs');

console.log('APG Scout Amazon v5 QA passed');
