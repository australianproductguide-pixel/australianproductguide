'use strict';

const fs=require('fs');
const path=require('path');
const {TAG,AMAZON_HOST,activeDestinations,assertRegistry}=require('../data/amazon-destinations-v39');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const BASE_ORIGIN=new URL(BASE).origin;
const OUT=process.env.OUTPUT_DIR||'artifacts/amazon-link-integrity-v51';
const TIMEOUT_MS=Number(process.env.DESTINATION_TIMEOUT_MS||18000);
const USER_AGENT=process.env.DESTINATION_USER_AGENT||'Mozilla/5.0 (compatible; AustralianProductGuideLinkIntegrity/1.0; +https://australianproductguide.au/)';
fs.mkdirSync(OUT,{recursive:true});

const NETWORK_POLICY='APG-origin-only';
const report={
  version:'v51',
  base:BASE,
  tag:TAG,
  checkedAt:new Date().toISOString(),
  networkPolicy:NETWORK_POLICY,
  automatedAmazonRequests:false,
  registry:[],
  livePage:null,
  external:[],
  hardFailures:[],
  warnings:[]
};

function hard(message,context={}){report.hardFailures.push({message,...context});}
function warn(message,context={}){report.warnings.push({message,...context});}
function allowedAmazonHost(hostname){return String(hostname||'').toLowerCase().replace(/^www\./,'')==='amazon.com.au';}

function assertAutomatedNetworkTargetAllowed(url){
  const target=new URL(String(url),BASE);
  if(target.origin!==BASE_ORIGIN){
    throw new Error(`Automated external retailer requests are prohibited by APG affiliate-compliance control: ${target.hostname}`);
  }
  return target;
}

async function fetchWithTimeout(url,options={}){
  const target=assertAutomatedNetworkTargetAllowed(url);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{return await fetch(target,{...options,signal:controller.signal});}
  finally{clearTimeout(timer);}
}

function validateRegistryItem(item){
  const result={key:item.key,status:'PASS',checks:[],destinationType:item.destination_type};
  try{
    const u=new URL(item.affiliate_url);
    if(u.protocol!=='https:')throw new Error('destination must use HTTPS');
    if(u.hostname!==AMAZON_HOST)throw new Error(`wrong Amazon marketplace ${u.hostname}`);
    if(!allowedAmazonHost(u.hostname))throw new Error(`unsupported Amazon host ${u.hostname}`);
    if(u.searchParams.get('tag')!==TAG)throw new Error('missing or incorrect APG Associates tag');
    if(u.searchParams.getAll('tag').length!==1)throw new Error('duplicate Associates tag');
    if(item.recommendation_weight!==0)throw new Error('commercial recommendation weight must remain zero');
    result.checks.push('https','amazon-au','tag','single-tag','neutrality','static-only');
  }catch(error){
    result.status='FAIL';result.error=error.message;hard(`${item.key}: ${error.message}`,{key:item.key});
  }
  return result;
}

function assertNoAmazonPrefetch(html){
  const links=String(html||'').match(/<link\b[^>]*>/gi)||[];
  for(const link of links){
    if(!/(?:amazon\.com\.au|amzn\.to|amazon-adsystem\.com|ssl-images-amazon\.com|media-amazon\.com|images-amazon\.com)/i.test(link))continue;
    const rel=(link.match(/\brel=["']([^"']+)["']/i)||[])[1]||'';
    if(/\b(prefetch|prerender|preconnect|dns-prefetch)\b/i.test(rel))throw new Error(`Amazon ${rel} directive is prohibited in automated-rendered APG HTML`);
  }
}

function hasCurrentDesktopDealsNav(html){
  const source=String(html||'');
  const navIndex=source.indexOf('primary-nav');
  if(navIndex<0)return false;
  const window=source.slice(navIndex,navIndex+12000);
  return /href=["']\/deals\/["'][^>]*>[^<]*Deals/i.test(window)||/>Deals<\/a>/i.test(window)&&/href=["']\/deals\/["']/i.test(window);
}

async function verifyLiveDealsPage(items){
  const result={url:`${BASE}/deals/`,status:'PASS',checks:[]};
  try{
    const res=await fetchWithTimeout(result.url,{headers:{'user-agent':USER_AGENT,'accept':'text/html'}});
    result.httpStatus=res.status;
    if(res.status!==200)throw new Error(`Deals hub returned HTTP ${res.status}`);
    const html=await res.text();
    if(!html.includes('Deals &amp; Shopping Discovery')&&!html.includes('Deals & Shopping Discovery'))throw new Error('Deals hub title missing');
    if(!html.includes('data-footer-shopping'))throw new Error('Deals footer shopping block missing');
    if(!html.includes('data-mobile-shopping'))throw new Error('mobile Deals navigation missing');
    if(!hasCurrentDesktopDealsNav(html))throw new Error('desktop Deals navigation missing');
    assertNoAmazonPrefetch(html);
    for(const item of items){
      if(!html.includes(`data-affiliate-destination="${item.key}"`))throw new Error(`live Deals hub missing destination ${item.key}`);
    }
    const tagged=(html.match(/tag=auproductguid-22/g)||[]).length;
    if(tagged<items.length)throw new Error(`live Deals hub exposes only ${tagged} APG-tagged Amazon destinations for ${items.length} governed destinations`);
    result.taggedDestinationOccurrences=tagged;
    result.checks.push('http-200','title','desktop-nav','mobile-nav','footer','all-governed-destinations','affiliate-tag','no-amazon-prefetch-or-preconnect','same-origin-network-only');
  }catch(error){
    result.status='FAIL';result.error=error.message;hard(`Production Deals hub: ${error.message}`);
  }
  report.livePage=result;
}

function recordNonRequestedExternalChecks(items){
  return items.map(item=>({
    key:item.key,
    status:'NOT_REQUESTED',
    reason:'Automated Amazon Australia requests are intentionally prohibited. Destination identity, host, tracking tag and neutrality are validated statically; live retailer navigation requires genuine user action or controlled human review.'
  }));
}

(async()=>{
  assertRegistry();
  const items=activeDestinations();
  report.registry=items.map(validateRegistryItem);
  await verifyLiveDealsPage(items);
  report.external=recordNonRequestedExternalChecks(items);

  report.summary={
    activeDestinations:items.length,
    registryPass:report.registry.filter(x=>x.status==='PASS').length,
    externalNotRequested:report.external.filter(x=>x.status==='NOT_REQUESTED').length,
    automatedAmazonRequests:0,
    hardFailures:report.hardFailures.length,
    warnings:report.warnings.length
  };
  report.status=report.hardFailures.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(OUT,'summary.txt'),[
    `APG Amazon link integrity ${report.status}`,
    `Checked: ${report.checkedAt}`,
    `Network policy: ${NETWORK_POLICY}`,
    'Automated Amazon requests: 0 (prohibited)',
    `Active governed destinations: ${report.summary.activeDestinations}`,
    `Registry pass: ${report.summary.registryPass}`,
    `External checks intentionally not requested: ${report.summary.externalNotRequested}`,
    `Warnings: ${report.summary.warnings}`,
    `Hard failures: ${report.summary.hardFailures}`
  ].join('\n')+'\n');

  console.log(`APG_AMAZON_LINK_INTEGRITY=${report.status}`);
  console.log(`AMAZON_LINK_INTEGRITY=${JSON.stringify(report.summary)}`);
  if(report.warnings.length)console.log(`AMAZON_LINK_WARNINGS=${JSON.stringify(report.warnings)}`);
  if(report.hardFailures.length)console.error(`AMAZON_LINK_FAILURES=${JSON.stringify(report.hardFailures)}`);
  if(report.status!=='PASS')process.exit(1);
})().catch(error=>{
  hard(`runner: ${error.message}`);
  report.status='FAIL';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.error(error);
  process.exit(1);
});
