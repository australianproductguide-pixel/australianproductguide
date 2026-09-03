'use strict';

// APG public governed product-image lookup v1.0.
// Read-only, same-origin support for non-blocking product-hero enhancement. This endpoint reads
// APG's RLS-protected Supabase image registry only; it makes zero eBay API calls. It returns only
// the image URL and maintained APG alt text for a row that is already verified and still passes the
// exact same current identity/safety guard as the product renderer and second-pass worker.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');

const VERSION='1.0';
const LOOKUP_TIMEOUT_MS=2500;
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));

function clean(value){return String(value==null?'':value).trim();}
function safeSlug(value){const slug=clean(value);return /^[a-z0-9][a-z0-9-]{1,160}$/.test(slug)&&PRODUCT_MAP.has(slug)?slug:'';}
function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, max-age=60, stale-while-revalidate=300');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-APG-eBay-Product-Image-Public','v'+VERSION);
  return res.end(JSON.stringify(payload));
}

async function handler(req,res){
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.setHeader('Allow','GET, HEAD');
    return send(res,405,{ok:false,version:VERSION,status:'method-not-allowed',zeroEbayNetwork:true});
  }
  let url;
  try{url=new URL(req.url,'https://australianproductguide.au');}catch{return send(res,400,{ok:false,version:VERSION,status:'bad-request',zeroEbayNetwork:true});}
  const slug=safeSlug(url.searchParams.get('slug'));
  if(!slug)return send(res,200,{ok:true,version:VERSION,slug:null,image:null,zeroEbayNetwork:true});

  try{
    const state=await supabase.imageState(slug,{timeoutMs:LOOKUP_TIMEOUT_MS});
    const mapping=continuity.stateToMapping(state);
    if(!mapping||!continuity.guardEligible(slug,mapping,Date.now())){
      return send(res,200,{ok:true,version:VERSION,slug,image:null,zeroEbayNetwork:true});
    }
    const product=PRODUCT_MAP.get(slug);
    const image={
      url:mapping.imageUrl,
      alt:product.brand?`${product.brand} ${product.name}`:product.name,
      source:'eBay Australia',
      verifiedAt:mapping.observedAt||null
    };
    if(req.method==='HEAD'){
      res.statusCode=200;
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.setHeader('Cache-Control','private, max-age=60, stale-while-revalidate=300');
      res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
      res.setHeader('X-APG-eBay-Product-Image-Public','v'+VERSION);
      return res.end('');
    }
    return send(res,200,{ok:true,version:VERSION,slug,image,zeroEbayNetwork:true});
  }catch{
    // Fail closed. A transient registry miss never turns into a shopper-facing error and never
    // triggers an eBay call; the already-rendered APG placeholder remains authoritative fallback.
    return send(res,200,{ok:true,version:VERSION,slug,image:null,zeroEbayNetwork:true});
  }
}

module.exports=handler;
module.exports.VERSION=VERSION;
module.exports.LOOKUP_TIMEOUT_MS=LOOKUP_TIMEOUT_MS;
