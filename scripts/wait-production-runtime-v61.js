#!/usr/bin/env node
'use strict';

const BASE_URL=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const SHA=(process.env.APG_EXPECTED_SHA||process.env.GITHUB_SHA||'').trim();
const EXPECTED=SHA.slice(0,16).toLowerCase();
const ATTEMPTS=Number(process.env.APG_RUNTIME_ATTEMPTS||40);
const DELAY_MS=Number(process.env.APG_RUNTIME_DELAY_MS||5000);
const STABLE_DELAY_MS=Number(process.env.APG_RUNTIME_STABLE_DELAY_MS||2000);
const STABLE_ROUNDS=Number(process.env.APG_RUNTIME_STABLE_ROUNDS||5);
const TIMEOUT_MS=Number(process.env.APG_RUNTIME_TIMEOUT_MS||30000);
const STABLE_ROUTES=Object.freeze(['/','/my-apg/']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const excerpt=(v,n=220)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,n);

function assetMarkers(html){
  const out=new Set();
  for(const match of String(html).matchAll(/(?:src|href)=["'][^"']*[?&]v=([0-9a-f]{8,40})(?:[&#"']|$)/gi))out.add(match[1].toLowerCase());
  return [...out];
}

async function probeRoute(attempt,route){
  const started=Date.now();
  try{
    const response=await fetch(`${BASE_URL}${route}`,{
      redirect:'follow',
      signal:AbortSignal.timeout(TIMEOUT_MS),
      headers:{
        'user-agent':'APGProductionRuntimeReconciliation/61',
        'accept':'text/html',
        'cache-control':'no-cache',
        'pragma':'no-cache'
      }
    });
    const body=await response.text();
    const markers=assetMarkers(body);
    const exact=EXPECTED&&markers.some(marker=>marker===EXPECTED||SHA.toLowerCase().startsWith(marker)||marker.startsWith(EXPECTED));
    const final=new URL(response.url);
    const canonical=final.hostname==='australianproductguide.au'&&final.pathname===route;
    const result={attempt,route,status:response.status,finalUrl:response.url,markers,exact,canonical,ms:Date.now()-started};
    console.log(`RUNTIME_ROUTE_PROBE attempt=${attempt} route=${route} status=${result.status} final=${result.finalUrl} expected=${EXPECTED||'missing'} observed=${markers.join(',')||'none'} exact=${exact} canonical=${canonical} ms=${result.ms}`);
    if(response.status!==200)return {...result,ok:false,failureClass:'http',detail:`${route}: expected HTTP 200, received ${response.status}; body=${excerpt(body)}`};
    if(!canonical)return {...result,ok:false,failureClass:'redirect',detail:`${route}: expected canonical apex path, received ${response.url}`};
    if(!EXPECTED)return {...result,ok:false,failureClass:'configuration',detail:'APG_EXPECTED_SHA/GITHUB_SHA was not supplied'};
    if(!markers.length)return {...result,ok:false,failureClass:'runtime',detail:`${route}: no versioned first-party asset markers were found`};
    if(!exact)return {...result,ok:false,failureClass:'runtime',detail:`${route}: expected release marker ${EXPECTED}; observed ${markers.join(',')}`};
    return {...result,ok:true};
  }catch(error){
    const result={attempt,route,status:null,finalUrl:null,markers:[],exact:false,canonical:false,ok:false,ms:Date.now()-started,failureClass:'network',detail:error?.message||String(error)};
    console.log(`RUNTIME_ROUTE_PROBE attempt=${attempt} route=${route} status=transport-error expected=${EXPECTED||'missing'} error=${result.detail} ms=${result.ms}`);
    return result;
  }
}

async function probeRound(attempt){
  const routes=[];
  for(const route of STABLE_ROUTES)routes.push(await probeRoute(attempt,route));
  const ok=routes.every(row=>row.ok);
  const failure=routes.find(row=>!row.ok)||null;
  console.log(`RUNTIME_STABILITY_ROUND attempt=${attempt} ok=${ok} routes=${routes.filter(row=>row.ok).length}/${STABLE_ROUTES.length}`);
  return {attempt,ok,routes,failure};
}

(async()=>{
  if(!Number.isInteger(STABLE_ROUNDS)||STABLE_ROUNDS<2)throw new Error(`APG_RUNTIME_STABLE_ROUNDS must be an integer of at least 2, received ${STABLE_ROUNDS}`);
  let last=null;
  let consecutive=0;
  for(let attempt=1;attempt<=ATTEMPTS;attempt+=1){
    last=await probeRound(attempt);
    if(last.ok)consecutive+=1;
    else consecutive=0;
    console.log(`RUNTIME_STABILITY_STATE attempt=${attempt} consecutive=${consecutive}/${STABLE_ROUNDS}`);
    if(consecutive>=STABLE_ROUNDS){
      console.log(`RUNTIME_RECONCILIATION=PASS sha=${SHA} marker=${EXPECTED} stableRounds=${consecutive} routes=${STABLE_ROUTES.length}`);
      return;
    }
    if(attempt<ATTEMPTS)await sleep(last.ok?STABLE_DELAY_MS:DELAY_MS);
  }
  console.error(`RUNTIME_RECONCILIATION=FAIL class=${last?.failure?.failureClass||'stability'} expected=${EXPECTED||'missing'} consecutive=${consecutive}/${STABLE_ROUNDS} actual=${last?.failure?.detail||'stable window was not reached'}`);
  process.exit(1);
})().catch(error=>{console.error(`RUNTIME_RECONCILIATION=FAIL class=runner error=${error?.stack||error}`);process.exit(1)});
