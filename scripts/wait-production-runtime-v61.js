#!/usr/bin/env node
'use strict';

const BASE_URL=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const SHA=(process.env.APG_EXPECTED_SHA||process.env.GITHUB_SHA||'').trim();
const EXPECTED=SHA.slice(0,16).toLowerCase();
const ATTEMPTS=Number(process.env.APG_RUNTIME_ATTEMPTS||30);
const DELAY_MS=Number(process.env.APG_RUNTIME_DELAY_MS||5000);
const TIMEOUT_MS=Number(process.env.APG_RUNTIME_TIMEOUT_MS||30000);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const excerpt=(v,n=220)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);

function assetMarkers(html){
  const out=new Set();
  for(const match of String(html).matchAll(/(?:src|href)=["'][^"']*[?&]v=([0-9a-f]{8,40})(?:[&#"']|$)/gi)) out.add(match[1].toLowerCase());
  return [...out];
}

async function probe(attempt){
  const started=Date.now();
  try{
    const response=await fetch(`${BASE_URL}/`,{
      redirect:'follow',
      signal:AbortSignal.timeout(TIMEOUT_MS),
      headers:{'user-agent':'APGProductionRuntimeReconciliation/61','accept':'text/html'}
    });
    const body=await response.text();
    const markers=assetMarkers(body);
    const exact=EXPECTED && markers.some(marker=>marker===EXPECTED||SHA.toLowerCase().startsWith(marker)||marker.startsWith(EXPECTED));
    const result={attempt,status:response.status,finalUrl:response.url,markers,exact,ms:Date.now()-started};
    console.log(`RUNTIME_PROBE attempt=${attempt} status=${result.status} final=${result.finalUrl} expected=${EXPECTED||'missing'} observed=${markers.join(',')||'none'} exact=${exact} ms=${result.ms}`);
    if(response.status!==200) return {...result,failureClass:'http',detail:`Expected HTTP 200, received ${response.status}; body=${excerpt(body)}`};
    if(new URL(response.url).hostname!=='australianproductguide.au') return {...result,failureClass:'redirect',detail:`Expected canonical apex, received ${response.url}`};
    if(!EXPECTED) return {...result,failureClass:'configuration',detail:'APG_EXPECTED_SHA/GITHUB_SHA was not supplied'};
    if(!markers.length) return {...result,failureClass:'runtime',detail:'No versioned first-party asset markers were found in the Production document'};
    if(!exact) return {...result,failureClass:'runtime',detail:`Expected release marker ${EXPECTED}; observed ${markers.join(',')}`};
    return result;
  }catch(error){
    const result={attempt,status:null,finalUrl:null,markers:[],exact:false,ms:Date.now()-started,failureClass:'network',detail:error?.message||String(error)};
    console.log(`RUNTIME_PROBE attempt=${attempt} status=transport-error expected=${EXPECTED||'missing'} error=${result.detail} ms=${result.ms}`);
    return result;
  }
}

(async()=>{
  let last=null;
  for(let attempt=1;attempt<=ATTEMPTS;attempt++){
    last=await probe(attempt);
    if(last.exact&&last.status===200){
      console.log(`RUNTIME_RECONCILIATION=PASS sha=${SHA} marker=${EXPECTED} url=${last.finalUrl}`);
      return;
    }
    if(attempt<ATTEMPTS) await sleep(DELAY_MS);
  }
  console.error(`RUNTIME_RECONCILIATION=FAIL class=${last?.failureClass||'unknown'} expected=${EXPECTED||'missing'} actual=${last?.detail||'unknown failure'}`);
  process.exit(1);
})().catch(error=>{console.error(`RUNTIME_RECONCILIATION=FAIL class=runner error=${error?.stack||error}`);process.exit(1)});
