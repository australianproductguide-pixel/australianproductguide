'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const layer=require('../lib/indexnow-key-v1');

assert(/^[A-Za-z0-9-]{8,128}$/.test(layer.INDEXNOW_KEY),'IndexNow key must satisfy protocol character/length constraints');
assert.strictEqual(layer.INDEXNOW_KEY_PATH,`/${layer.INDEXNOW_KEY}.txt`,'IndexNow key file must live at canonical host root');

const headers={};let body=null;
const res={statusCode:0,setHeader:(k,v)=>{headers[String(k).toLowerCase()]=String(v);},end:v=>{body=v;return v;}};
layer({url:layer.INDEXNOW_KEY_PATH,method:'GET'},res);
assert.strictEqual(res.statusCode,200,'IndexNow key endpoint must return 200');
assert.strictEqual(body,layer.INDEXNOW_KEY,'IndexNow key endpoint body must exactly match the key');
assert(headers['content-type'].startsWith('text/plain'),'IndexNow key must be served as text/plain');
assert.strictEqual(headers['x-robots-tag'],'noindex','verification key must not be a search-result landing page');

const notifier=fs.readFileSync(path.join(__dirname,'indexnow-submit-v1.js'),'utf8');
assert(notifier.includes("process.env.APG_INDEXNOW_SUBMIT!=='CONFIRM'"),'IndexNow notifier must remain explicit-confirmation gated');
assert(notifier.includes("https://api.indexnow.org/indexnow"),'IndexNow notifier must use the protocol global endpoint');
assert(notifier.includes("endpoint.searchParams.set('url',url)"),'IndexNow notifier must submit one URL per request');
assert(notifier.includes("endpoint.searchParams.set('key',INDEXNOW_KEY)"),'IndexNow notifier must authenticate single-URL requests with the public verification key');
assert(notifier.includes('https.get(endpoint'),'IndexNow transport must use individual GET notifications');
assert(!notifier.includes('urlList:'),'IndexNow notifier must not submit a batch urlList payload');
assert(!notifier.includes("method:'POST'"),'IndexNow notifier must not use batch POST transport');
assert(notifier.includes('STREAM_DELAY_MS'),'IndexNow notifier must pace individual notifications');
assert(!notifier.includes('APG_INDEXNOW_SUBMIT=CONFIRM node'),'build source must not contain an auto-submit command');

console.log(`APG IndexNow v2 QA PASSED: verification path ${layer.INDEXNOW_KEY_PATH}; transport=single-url-stream; outbound submission remains explicit-confirmation gated.`);
