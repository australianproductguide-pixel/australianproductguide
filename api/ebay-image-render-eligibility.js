'use strict';

// Read-only operational diagnostic for APG governed eBay product imagery.
// Compares the currently deployed product-page renderer guard with the independent
// second-pass worker guard over the same RLS-protected image-state registry.
// No eBay API call is made here and no state is mutated.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const rendererGuard=require('../lib/ebay-product-hero-exact-guard-v2');
const workerGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='1.0';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const PRODUCT_SLUGS=[...PRODUCT_MAP.keys()];

function clean(value){return String(value==null?'':value).trim();}
function chunk(values,size){const rows=[];for(let i=0;i<values.length;i+=size)rows.push(values.slice(i,i+size));return rows;}
function bump(map,key){const safe=clean(key)||'unknown';map.set(safe,(map.get(safe)||0)+1);}
function sortedCounts(map){return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([reason,count])=>({reason,count}));}
function stagedRow(mapping){return continuity.toGuardRow(mapping);}

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
    const gapReasons=new Map();
    const rendererEligible=[];
    const workerEligible=[];
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
        workerRejected.push({slug,reason:'missing-product-or-mapping'});
        continue;
      }
      const staged=stagedRow(mapping);
      const renderer=rendererGuard.evaluate(product,staged,products,{now});
      const worker=workerGuard.evaluate(product,staged,products,{now});
      if(renderer.eligible===true)rendererEligible.push(slug);else bump(rendererReasons,renderer.reason);
      if(worker.eligible===true)workerEligible.push(slug);else{
        bump(workerReasons,worker.reason);
        workerRejected.push({slug,reason:worker.reason});
      }
      if(worker.eligible===true&&renderer.eligible!==true){
        const reason=clean(renderer.reason)||'unknown';
        bump(gapReasons,reason);
        gaps.push({slug,rendererReason:reason,workerReason:clean(worker.reason)||'eligible'});
      }
    }

    return res.status(200).json({
      ok:true,
      version:VERSION,
      generatedAt:new Date().toISOString(),
      zeroEbayNetwork:true,
      productRegistryCount:PRODUCT_SLUGS.length,
      imageStateRows:states.length,
      verifiedRegistryRows:verified.length,
      currentRenderer:{guardVersion:rendererGuard.VERSION,eligible:rendererEligible.length,rejected:verified.length-rendererEligible.length,reasons:sortedCounts(rendererReasons)},
      workerPolicy:{guardVersion:workerGuard.VERSION,eligible:workerEligible.length,rejected:verified.length-workerEligible.length,reasons:sortedCounts(workerReasons)},
      rendererWorkerGap:{count:gaps.length,reasons:sortedCounts(gapReasons),rows:gaps.slice(0,100)},
      workerRejected:workerRejected.slice(0,100)
    });
  }catch(error){
    return res.status(500).json({ok:false,status:'diagnostic-failed',code:clean(error&&error.code)||'EBAY_IMAGE_RENDER_DIAGNOSTIC_ERROR'});
  }
}

module.exports=handler;
module.exports.VERSION=VERSION;
