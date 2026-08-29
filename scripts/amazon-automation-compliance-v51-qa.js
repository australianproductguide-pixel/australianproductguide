'use strict';

const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const SELF=path.resolve(__filename);
const DESTINATION_HEALTH=path.join(ROOT,'scripts','amazon-destination-health-v40.js');
const VISUAL_CERT=path.join(ROOT,'scripts','amazon-shopping-visual-cert-v40.js');
const WORKFLOW=path.join(ROOT,'.github','workflows','amazon-shopping-assurance-v40.yml');

function read(file){return fs.readFileSync(file,'utf8');}
function filesUnder(dir,extensions){const out=[];for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...filesUnder(full,extensions));else if(extensions.some(ext=>entry.name.endsWith(ext)))out.push(full);}return out;}
function rel(file){return path.relative(ROOT,file).replace(/\\/g,'/');}

const destination=read(DESTINATION_HEALTH);
assert.ok(destination.includes("NETWORK_POLICY='APG-origin-only'"),'destination-health must declare the APG-origin-only network policy');
assert.ok(destination.includes('assertAutomatedNetworkTargetAllowed'),'destination-health must enforce the same-origin network allowlist');
assert.ok(destination.includes('target.origin!==BASE_ORIGIN'),'destination-health allowlist must reject non-APG origins');
assert.ok(destination.includes('Automated external retailer requests are prohibited'),'destination-health must fail closed for external retailer automation');
assert.ok(destination.includes('automatedAmazonRequests:0'),'destination-health report must prove zero automated Amazon requests');
assert.ok(destination.includes("status:'NOT_REQUESTED'"),'external Amazon destination checks must remain intentionally not requested');
assert.ok(destination.includes('preconnect|dns-prefetch'),'destination-health must reject Amazon prefetch/prerender/preconnect hints');
assert.ok(!/\bprobeAmazon\s*\(/.test(destination),'legacy automated Amazon probing must not return');
assert.ok(!/fetchWithTimeout\s*\(\s*item\.(?:affiliate_url|destination_url)/.test(destination),'tagged Amazon destinations must never be passed to the network client');

const visual=read(VISUAL_CERT);
assert.ok(/(?:const|let)\s+first\s*=\s*await\s+page\.\$eval\s*\(/.test(visual),'visual certification must inspect the Amazon CTA in-page rather than navigate it');
assert.ok(visual.includes('page.setRequestInterception(true)'),'visual certification must enable request interception before loading APG');
assert.ok(/function\s+isAmazonHost\s*\(/.test(visual),'visual certification must identify and block Amazon network hosts');
assert.ok(/req\.abort\(['"]blockedbyclient['"]\)/.test(visual),'visual certification must abort Amazon network requests');
assert.ok(!/page\.goto\s*\([^\n;]{0,240}(?:amazon\.com\.au|first\.href|firstLink\.href|affiliate_url|affiliateUrl)/i.test(visual),'visual certification must not navigate to Amazon or an affiliate href');
assert.ok(!/page\.(?:click|tap)\s*\([^\n;]{0,240}(?:amazon|affiliate)/i.test(visual),'visual certification must not click an Amazon/affiliate target');
assert.ok(visual.includes("isAmazonHost(new URL(req.url()).hostname)"),'request interception must apply the Amazon-host block to each browser request');

const workflow=read(WORKFLOW);
assert.ok(workflow.includes('amazon-automation-compliance-v51-qa.js'),'Amazon shopping assurance workflow must run the compliance regression gate');
assert.ok(!/\b(?:curl|wget)\b[^\n]*amazon\.com\.au/i.test(workflow),'GitHub workflow must not request Amazon Australia directly');
assert.ok(!/\b(?:curl|wget)\b[^\n]*(?:tag=auproductguid-22|affiliate_url|affiliateUrl)/i.test(workflow),'GitHub workflow must not request tagged affiliate destinations');

const executable=[...filesUnder(path.join(ROOT,'scripts'),['.js']),...filesUnder(path.join(ROOT,'.github','workflows'),['.yml','.yaml'])].filter(file=>path.resolve(file)!==SELF);
const forbidden=[
{name:'legacy Amazon probe function',re:/\bprobeAmazon\s*\(/i},
{name:'direct fetch of an Amazon URL',re:/\bfetch\s*\([^\n;]{0,320}https?:\\?\/\\?\/(?:www\\?\.)?amazon\\?\.com\\?\.au/i},
{name:'direct HTTP client request to Amazon',re:/\bhttps?\.(?:get|request)\s*\([^\n;]{0,320}amazon\\?\.com\\?\.au/i},
{name:'browser navigation to Amazon',re:/\bpage\.goto\s*\([^\n;]{0,320}amazon\\?\.com\\?\.au/i},
{name:'tagged affiliate URL passed to fetch',re:/\bfetch(?:WithTimeout)?\s*\([^\n;]{0,320}(?:affiliate_url|affiliateUrl|amazon_url|amazonUrl)/i},
{name:'tagged affiliate URL passed to browser navigation',re:/\bpage\.goto\s*\([^\n;]{0,320}(?:affiliate_url|affiliateUrl|amazon_url|amazonUrl)/i},
{name:'curl/wget request to Amazon',re:/\b(?:curl|wget)\b[^\n]*amazon\\?\.com\\?\.au/i}
];
const violations=[];for(const file of executable){const source=read(file);for(const rule of forbidden){if(rule.re.test(source))violations.push(`${rel(file)}: ${rule.name}`);}}
assert.deepEqual(violations,[],`Amazon automation compliance violations:\n${violations.join('\n')}`);
console.log(`Amazon automation compliance v51 QA passed across ${executable.length} executable scripts/workflows: automated Amazon affiliate requests are prohibited; Amazon links are validated statically; browser QA inspects without clicking and blocks Amazon network hosts.`);
