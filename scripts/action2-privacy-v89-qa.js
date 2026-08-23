'use strict';
const fs=require('fs');
const assert=require('assert');

const source=fs.readFileSync(require.resolve('../lib/google-platform.js'),'utf8');
assert(source.includes("page_location:cleanUrl(window.location.href)"),'GA page_location must be path-only');
assert(source.includes("page_referrer:cleanUrl(document.referrer)"),'GA page_referrer must be path-only');
assert(source.includes("window.location.pathname==='/search/'?'Search | Australian Product Guide':document.title"),'Search page_title sanitisation missing');
assert(source.includes("allow_google_signals:false"),'Google Signals must remain disabled');
assert(source.includes("allow_ad_personalization_signals:false"),'Ad personalisation signals must remain disabled');
assert(source.includes("analytics_storage:'denied'"),'Analytics consent must default denied');
assert(source.includes("ad_storage:'denied'"),'Ad storage must default denied');
assert(source.includes("ad_user_data:'denied'"),'Ad user data must default denied');
assert(source.includes("ad_personalization:'denied'"),'Ad personalisation consent must default denied');
assert(!/page_(?:location|referrer):window\.location\.href/.test(source),'Raw URL must never be passed to GA');
console.log('ACTION2_PRIVACY_V89_OK');