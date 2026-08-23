'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');

const funnel=require('../lib/analytics-funnel-v79');
const source=fs.readFileSync(path.join(__dirname,'../lib/analytics-funnel-v79.js'),'utf8');

assert.equal(funnel.ANALYTICS_FUNNEL_VERSION,'79.0');
assert.equal(funnel.ANALYTICS_FUNNEL_ASSET_PATH,'/assets/analytics-funnel-v79.js');
assert.equal(funnel.VERSION,'52.0','Search v52 must remain the outer protected API contract');
assert(source.includes("const downstream=require('./footer-country-removal-v78')"));
assert(source.includes('window.__apgAnalyticsAllowed=false'));
assert(source.includes("payload.analytics_storage==='granted'"));
assert(source.includes("payload.analytics_storage==='denied'"));
assert(source.includes("window.apgTrackEvent=function"));
assert(source.includes("track('site_search'"));
assert(source.includes("track('product_view'"));
assert(source.includes("track('comparison_started'"));
assert(source.includes("track('decision_lab_submitted'"));
assert(source.includes("track('finder_submitted'"));
assert(source.includes("track(wasSaved?'product_unsaved':'product_saved'"));
assert(!funnel.analyticsClientJs.includes('location.search'),'funnel events must not transmit raw URL query strings');
assert(!funnel.analyticsClientJs.includes('search_term:'),'funnel events must not transmit typed search terms');
assert(!funnel.analyticsClientJs.includes('decision_query:'),'funnel events must not transmit Decision Lab descriptions');
assert(!funnel.analyticsClientJs.includes('message_text:'),'funnel events must not transmit Scout message content');

const sample='<!doctype html><html><head><title>APG</title></head><body></body></html>';
const transformed=funnel.injectAnalyticsFunnel(sample);
assert(transformed.includes('<meta name="apg-analytics-funnel" content="v79.0">'));
assert(transformed.includes('data-apg-analytics-consent-guard="v79.0"'));
assert(transformed.includes('/assets/analytics-funnel-v79.js?v=79.0'));
assert.equal((funnel.injectAnalyticsFunnel(transformed).match(/data-apg-analytics-funnel="v79\.0"/g)||[]).length,1,'analytics funnel injection must be idempotent');

new Function(funnel.analyticsClientJs);
new Function(funnel.consentGuardJs);

console.log('APG Analytics Funnel v79 QA passed');
