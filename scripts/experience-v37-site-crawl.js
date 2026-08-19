'use strict';
const fs=require('fs');
const path=require('path');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/experience-v37';
const REQUIRE_V37=process.env.REQUIRE_V37!=='0';
const CONCURRENCY=Math.max(1,Math.min(24,Number(process.env.CRAWL_CONCURRENCY||12)));
fs.mkdirSync(OUT,{recursive:true});

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function fetchBounded(url,attempt=0){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const res=await fetch(url,{redirect:'follow',headers:{'User-Agent':'APG-v37-production-certification/1.0','Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},signal:controller.signal});
    if(res.status>=500&&attempt<1){await sleep(300);return fetchBounded(url,attempt+1);}
    return res;
  }finally{clearTimeout(timer);}
}
function canonicalFrom(html){const m=String(html).match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)||String(html).match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["']/i);return m&&m[1]||null;}
function normaliseUrl(raw){const u=new URL(raw,BASE);u.hash='';return u.href;}
async function main(){
  const sitemapRes=await fetchBounded(BASE+'/sitemap.xml');
  if(!sitemapRes.ok)throw new Error(`sitemap HTTP ${sitemapRes.status}`);
  const xml=await sitemapRes.text();
  const sitemapUrls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>normaliseUrl(m[1])).filter(u=>new URL(u).origin===BASE);
  const extras=[
    BASE+'/search/?q=Sony%20XM6',
    BASE+'/decision-lab/?q=quiet%20headphones%20for%20long%20flights',
    BASE+'/compare/custom/?products=sony-wh-1000xm6,bose-quietcomfort-ultra-headphones',
    BASE+'/my-apg/'
  ];
  const urls=[...new Set([...sitemapUrls,...extras.map(normaliseUrl)])];
  if(sitemapUrls.length<500)throw new Error(`sitemap unexpectedly small: ${sitemapUrls.length}`);
  const results=new Array(urls.length);let cursor=0;
  async function worker(){
    while(true){const i=cursor++;if(i>=urls.length)return;const url=urls[i];const started=Date.now();
      try{
        const res=await fetchBounded(url);const type=String(res.headers.get('content-type')||'');const text=type.includes('text/html')?await res.text():'';
        const issues=[];
        if(res.status<200||res.status>=400)issues.push(`HTTP ${res.status}`);
        if(type.includes('text/html')){
          if(!/<html[\s>]/i.test(text))issues.push('missing html root');
          const expected=new URL(url);expected.search='';expected.hash='';
          const canonical=canonicalFrom(text);
          if(!canonical)issues.push('missing canonical');
          else {const got=new URL(canonical,BASE);got.hash='';if(got.origin!==BASE||got.pathname!==expected.pathname)issues.push(`canonical mismatch ${canonical}`);}
          if(REQUIRE_V37&&!text.includes('/assets/interaction-reliability-v37.js'))issues.push('v37 reliability asset missing');
          if(!text.includes('Australian Product Guide'))issues.push('APG identity missing');
        }
        results[i]={url,status:res.status,finalUrl:res.url,contentType:type,durationMs:Date.now()-started,issues};
      }catch(error){results[i]={url,status:null,durationMs:Date.now()-started,issues:[String(error&&error.message||error)]};}
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},worker));
  const failures=results.filter(x=>x.issues.length);
  const report={base:BASE,sitemapCount:sitemapUrls.length,checkedCount:results.length,requireV37:REQUIRE_V37,failures,slowest:results.slice().sort((a,b)=>b.durationMs-a.durationMs).slice(0,20),finishedAt:new Date().toISOString()};
  fs.writeFileSync(path.join(OUT,'site-crawl-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({base:report.base,sitemapCount:report.sitemapCount,checkedCount:report.checkedCount,failureCount:failures.length,slowest:report.slowest.slice(0,5)},null,2));
  if(failures.length){console.error(JSON.stringify(failures.slice(0,30),null,2));process.exit(1);}
}
main().catch(error=>{console.error(error);process.exit(1);});
