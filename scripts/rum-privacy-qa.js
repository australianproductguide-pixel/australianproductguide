#!/usr/bin/env node
'use strict';
const fs=require('fs');

const rum=fs.readFileSync(require.resolve('../lib/rum-client.js'),'utf8');
const app=fs.readFileSync(require.resolve('../lib/app.js'),'utf8');
if(!rum.includes('location.pathname')) throw new Error('RUM path control missing');
if(rum.includes('location.search')) throw new Error('RUM must not collect query strings');
if(!rum.includes('navigator.webdriver')) throw new Error('Automated browser RUM exclusion missing');
if(!rum.includes('Math.random()>0.02')) throw new Error('RUM sampling must remain at the low-cost 2% rate');
if(!app.includes('APG_RUM')) throw new Error('RUM log marker missing');
if(!app.includes("path==='/api/rum'")) throw new Error('RUM endpoint missing');
if(/cookie|localStorage|user_id|email/i.test(rum)) throw new Error('RUM client must not collect persistent/user identifiers');
console.log('FIELD_WEB_VITALS_PRIVACY_COST_CONTROL=PASS');
