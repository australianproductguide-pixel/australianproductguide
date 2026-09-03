'use strict';

// Read-only operational diagnostic for APG governed eBay product imagery.
// Compares the actual public continuity/render policy with the independent second-pass worker
// guard over the same RLS-protected image-state registry, and optionally probes the bounded
// single-product Supabase lookup used by product pages. No eBay API call is made and no state
// is mutated.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const legacyBaseGuard=require('../lib/ebay-product-hero-exact-guard-v2');
const workerGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='1.1';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const PRODUCT_SLUGS=[...PRODUCT_MAP.keys()];
const DEFAULT_PROBE_SLUG='kodak-mini-2-retro';
const DEFAULT_PROBE_TIMEOUT_MS=850;

function clean(value){return String(value==null?'':value).trim();}
function chunk(values,size){const rows=[];for(let i=0;i<values.length;i+=size)rows.push(values.slice(i,i+size));return rows;}
function bump(map,key){const safe=clean(key)||'unknown';map.set(safe,(map.get(safe)||0)+1);}
function sortedCounts(map){return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([reason,count])=>({reason,count}));}
function stagedRow(mapping){return continuity.toGuardRow(mapping);}
function safeSlug(value){const slug=clean(value);return PRODUCT_MAP.has(slug)?slug:DEFAULT_PROBE_SLUG;}
function safeTimeout(value){const n=Number(value);return Number.isFinite(n)?Math.max(250,Math.min(2500,Math.round(n))):DEFAULT_PROBE_TIMEOUT_MS;}

async function probeSingleLookup(slug,timeoutMs){
  const started=Date.now();
  try{
    const state=await supabase.imageState(slug,{timeoutMs});
    const durationMs=Date.now()-started;
    const mapping=continuity.stateToMapping(state);
    return {
      slug,timeoutMs,durationMs,found:Boolean(state),status:clean(state&&state.status)||null,
      guardEligible:Boolean(mapping&&continuity.guardEligible(slug,mapping,Date.now())),error:null
    };
  }catch(error){
    return {
      slug,timeoutMs,durationMs:Date.now()-started,found:false,status:null,guardEligible:false,
      error:clean(error&&error.code)||'APG_IMAGE_STATE_LOOKUP_ERROR'
    };
  }
}

async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  try{
    const batches=chunk(PRODUCT_SLUGS,100);
    const states=[];
    for(const slugs of batches){
      const rows=await supabase.imageStates(slugs,{timeoutMs:4000});
      if(Array.isArray(rows))states.push(...rows);
    }
    const verified=states.filter(row=>clean(row&&row.status)==='verified');
    const rendererReasons=new Map();
    const workerReasons=new Map();
    const legacyReasons=new Map();
    const gapReasons=new Map();
    const rendererEligible=[];
    const workerEligible=[];
    const legacyEligible=[];
    const gaps=[];
    const workerRejected=[];
    const now=Date.now();

    for(const state of verified){
      const slug=clean(state&&state.slug);
      const product=PRODUCT_MAP.get(slug);
      const mapping=continuity.stateToMapping(state);
      if(!product||!mapping){
        bump(rendererReasons,'missing-product-or-mapping');
        bump(workerReasons,'missing-product-or-mapping');
        bump(legacyReasons,'missing-product-or-mapping');
        workerRejected.push({slug,reason:'missing-product-or-mapping'});
        continue;
      }
      const staged=stagedRow(mapping);
      const rendererOk=continuity.guardEligible(slug,mapping,now);
      const worker=workerGuard.evaluate(product,staged,products,{now});
      const legacy=legacyBaseGuard.evaluate(product,staged,products,{now});
      if(rendererOk)rendererEligible.push(slug);else bump(rendererReasons,worker.reason||'renderer-rejected');
      if(worker.eligible===true)workerEligible.push(slug);else{
        bump(workerReasons,worker.reason);
        workerRejected.push({slug,reason:worker.reason});
      }
      if(legacy.eligible===true)legacyEligible.push(slug);else bump(legacyReasons,legacy.reason);
      if(worker.eligible===true!==rendererOk){
        const reason=rendererOk?'worker-rejected-renderer-eligible':(worker.reason||'renderer-worker-divergence');
        bump(gapReasons,reason);
        gaps.push({slug,rendererEligible:rendererOk,workerEligible:worker.eligible===true,workerReason:clean(worker.reason)||null});
      }
    }

    let requestUrl=null;
    try{requestUrl=new URL(req.url,'https://australianproductguide.au');}catch{}
    const probeSlug=safeSlug(requestUrl&&requestUrl.searchParams.get('slug'));
    const probeTimeoutMs=safeTimeout(requestUrl&&requestUrl.searchParams.get('timeoutMs'));
    const singleLookup=await probeSingleLookup(probeSlug,probeTimeoutMs);

    return res.status(200).json({
      ok:true,
      version:VERSION,
      generatedAt:new Date().toISOString(),
      zeroEbayNetwork:true,
      productRegistryCount:PRODUCT_SLUGS.length,
      imageStateRows:states.length,
      verifiedRegistryRows:verified.length,
      currentRenderer:{continuityVersion:continuity.VERSION,guardVersion:workerGuard.VERSION,eligible:rendererEligible.length,rejected:verified.length-rendererEligible.length,reasons:sortedCounts(rendererReasons)},
      workerPolicy:{guardVersion:workerGuard.VERSION,eligible:workerEligible.length,rejected:verified.length-workerEligible.length,reasons:sortedCounts(workerReasons)},
      rendererWorkerGap:{count:gaps.length,reasons:sortedCounts(gapReasons),rows:gaps.slice(0,100)},
      legacyBaseGuard:{guardVersion:legacyBaseGuard.VERSION,eligible:legacyEligible.length,rejected:verified.length-legacyEligible.length,reasons:sortedCounts(legacyReasons)},
      workerRejected:workerRejected.slice(0,100),
      singleLookup
    });
  }catch(error){
    return res.status(500).json({ok:false,status:'diagnostic-failed',code:clean(error&&error.code)||'EBAY_IMAGE_RENDER_DIAGNOSTIC_ERROR'});
  }
}

module.exports=handler;
module.exports.VERSION=VERSION;
