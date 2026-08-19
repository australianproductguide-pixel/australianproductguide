'use strict';

const fs=require('fs');
const path=require('path');
const {TAG,AMAZON_HOST,activeDestinations,assertRegistry}=require('../data/amazon-destinations-v39');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/amazon-destination-health-v40';
const TIMEOUT_MS=Number(process.env.DESTINATION_TIMEOUT_MS||18000);
const USER_AGENT=process.env.DESTINATION_USER_AGENT||'Mozilla/5.0 (compatible; AustralianProductGuideLinkHealth/1.0; +https://australianproductguide.au/)';
fs.mkdirSync(OUT,{recursive:true});

const report={
  version:'v40',
  base:BASE,
  tag:TAG,
  checkedAt:new Date().toISOString(),
  registry:[],
  livePage:null,
  external:[],
  hardFailures:[],
  warnings:[]
};

function hard(message,context={}){report.hardFailures.push({message,...context});}
function warn(message,context={}){report.warnings.push({message,...context});}
function allowedAmazonHost(hostname){return String(hostname||'').toLowerCase().replace(/^www\./,'')==='amazon.com.au';}

async function fetchWithTimeout(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{return await fetch(url,{...options,signal:controller.signal});}
  finally{clearTimeout(timer);}
}

function validateRegistryItem(item){
  const result={key:item.key,affiliateUrl:item.affiliate_url,status:'PASS',checks:[]};
  try{
    const u=new URL(item.affiliate_url);
    if(u.protocol!=='https:')throw new Error('destination must use HTTPS');
    if(u.hostname!==AMAZON_HOST)throw new Error(`wrong Amazon marketplace ${u.hostname}`);
    if(u.searchParams.get('tag')!==TAG)throw new Error('missing or incorrect APG Associates tag');
    if(u.searchParams.getAll('tag').length!==1)throw new Error('duplicate Associates tag');
    if(item.recommendation_weight!==0)throw new Error('commercial recommendation weight must remain zero');
    result.checks.push('https','amazon-au','tag','single-tag','neutrality');
  }catch(error){
    result.status='FAIL';result.error=error.message;hard(`${item.key}: ${error.message}`,{key:item.key});
  }
  return result;
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
    if(!html.includes('apg-deals-link'))throw new Error('desktop Deals navigation missing');
    for(const item of items){
      if(!html.includes(`data-affiliate-destination="${item.key}"`))throw new Error(`live Deals hub missing destination ${item.key}`);
      if(!html.includes('tag=auproductguid-22'))throw new Error('live Deals hub missing APG Associates tag');
    }
    result.checks.push('http-200','title','desktop-nav','mobile-nav','footer','all-governed-destinations','affiliate-tag');
  }catch(error){
    result.status='FAIL';result.error=error.message;hard(`Production Deals hub: ${error.message}`);
  }
  report.livePage=result;
}

async function probeAmazon(item){
  const result={key:item.key,startUrl:item.affiliate_url,status:'UNKNOWN',attempts:[],finalUrl:null};
  let current=item.affiliate_url;
  const seen=new Set();
  try{
    for(let hop=0;hop<5;hop++){
      if(seen.has(current))throw new Error('redirect loop detected');
      seen.add(current);
      const u=new URL(current);
      if(!allowedAmazonHost(u.hostname))throw new Error(`redirected off Amazon Australia to ${u.hostname}`);
      const res=await fetchWithTimeout(current,{
        redirect:'manual',
        headers:{
          'user-agent':USER_AGENT,
          'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language':'en-AU,en;q=0.9'
        }
      });
      const attempt={hop,url:current,httpStatus:res.status,location:res.headers.get('location')||null};
      result.attempts.push(attempt);

      if(res.status>=300&&res.status<400&&attempt.location){
        const next=new URL(attempt.location,current).toString();
        if(!allowedAmazonHost(new URL(next).hostname))throw new Error(`redirected off Amazon Australia to ${new URL(next).hostname}`);
        current=next;
        continue;
      }

      result.finalUrl=current;
      if(res.status===200){
        const body=(await res.text()).slice(0,300000);
        if(/page not found|sorry! we couldn't find that page/i.test(body)){
          result.status='FAIL';
          hard(`${item.key}: Amazon returned a not-found page`,{key:item.key,httpStatus:res.status,finalUrl:current});
        }else{
          result.status='PASS';
        }
        return result;
      }

      if(res.status===404||res.status===410){
        result.status='FAIL';
        hard(`${item.key}: Amazon destination returned HTTP ${res.status}`,{key:item.key,httpStatus:res.status,finalUrl:current});
        return result;
      }

      if([400,422].includes(res.status)){
        result.status='FAIL';
        hard(`${item.key}: Amazon destination rejected as HTTP ${res.status}`,{key:item.key,httpStatus:res.status,finalUrl:current});
        return result;
      }

      if([401,403,429].includes(res.status)){
        result.status='INDETERMINATE';
        warn(`${item.key}: Amazon blocked or throttled automated health verification (HTTP ${res.status})`,{key:item.key,httpStatus:res.status,finalUrl:current});
        return result;
      }

      if(res.status>=500){
        result.status='INDETERMINATE';
        warn(`${item.key}: Amazon returned temporary/server HTTP ${res.status}`,{key:item.key,httpStatus:res.status,finalUrl:current});
        return result;
      }

      result.status='INDETERMINATE';
      warn(`${item.key}: unexpected Amazon HTTP ${res.status}`,{key:item.key,httpStatus:res.status,finalUrl:current});
      return result;
    }
    throw new Error('too many redirects');
  }catch(error){
    result.finalUrl=current;
    if(/redirected off Amazon Australia|redirect loop|too many redirects/.test(error.message)){
      result.status='FAIL';hard(`${item.key}: ${error.message}`,{key:item.key,finalUrl:current});
    }else{
      result.status='INDETERMINATE';warn(`${item.key}: network verification unavailable (${error.message})`,{key:item.key,finalUrl:current});
    }
    return result;
  }
}

(async()=>{
  assertRegistry();
  const items=activeDestinations();
  report.registry=items.map(validateRegistryItem);
  await verifyLiveDealsPage(items);

  for(const item of items){
    report.external.push(await probeAmazon(item));
    await new Promise(r=>setTimeout(r,900));
  }

  report.summary={
    activeDestinations:items.length,
    registryPass:report.registry.filter(x=>x.status==='PASS').length,
    externalPass:report.external.filter(x=>x.status==='PASS').length,
    externalIndeterminate:report.external.filter(x=>x.status==='INDETERMINATE').length,
    externalFail:report.external.filter(x=>x.status==='FAIL').length,
    hardFailures:report.hardFailures.length,
    warnings:report.warnings.length
  };
  report.status=report.hardFailures.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(OUT,'summary.txt'),[
    `APG Amazon destination health ${report.status}`,
    `Checked: ${report.checkedAt}`,
    `Active governed destinations: ${report.summary.activeDestinations}`,
    `Registry pass: ${report.summary.registryPass}`,
    `External pass: ${report.summary.externalPass}`,
    `External indeterminate: ${report.summary.externalIndeterminate}`,
    `External fail: ${report.summary.externalFail}`,
    `Warnings: ${report.summary.warnings}`,
    `Hard failures: ${report.summary.hardFailures}`
  ].join('\n')+'\n');

  console.log(`APG_AMAZON_DESTINATION_HEALTH=${report.status}`);
  console.log(`AMAZON_DESTINATIONS=${JSON.stringify(report.summary)}`);
  if(report.warnings.length)console.log(`AMAZON_HEALTH_WARNINGS=${JSON.stringify(report.warnings)}`);
  if(report.hardFailures.length)console.error(`AMAZON_HEALTH_FAILURES=${JSON.stringify(report.hardFailures)}`);
  if(report.status!=='PASS')process.exit(1);
})().catch(error=>{
  hard(`runner: ${error.message}`);
  report.status='FAIL';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.error(error);
  process.exit(1);
});
