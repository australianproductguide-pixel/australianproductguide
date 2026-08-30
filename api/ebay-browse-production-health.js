'use strict';

const client=require('../lib/ebay-browse-api-v1');

function safeFailure(error){
  return {
    ok:false,
    code:error&&error.code?String(error.code):'EBAY_BROWSE_CHECK_FAILED',
    status:error&&Number.isFinite(Number(error.status))?Number(error.status):null,
    retryAt:error&&Number.isFinite(Number(error.retryAt))?Number(error.retryAt):null
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');

  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false,status:'method-not-allowed'});
  }

  const d=client.diagnostics();
  const output={
    ok:false,
    status:'validation',
    clientVersion:d.version,
    configured:d.configured,
    environment:d.environment,
    marketplaceId:d.marketplaceId,
    campaignConfigured:d.campaignConfigured,
    recommendationWeight:0,
    checks:{}
  };

  if(!d.configured||d.environment!=='production'){
    output.status='not-configured-for-production';
    return res.status(503).json(output);
  }

  try{
    const token=await client.getApplicationToken();
    output.checks.oauth={ok:Boolean(token)};
  }catch(error){
    output.checks.oauth=safeFailure(error);
    output.status='oauth-failed';
    return res.status(502).json(output);
  }

  // Query eBay Developer Analytics before spending a Browse call. This gives APG an
  // authoritative quota/usage/reset signal and prevents health checks from hammering an
  // already-exhausted Browse allowance.
  try{
    const quotaRaw=await client.getRateLimits({apiName:'browse',apiContext:'buy',timeoutMs:6000});
    const quota=client.summariseRateLimits(quotaRaw,{apiName:'browse',apiContext:'buy'});
    output.checks.quota={
      ok:true,
      found:quota.found,
      exhausted:quota.exhausted,
      lowestRemaining:quota.lowestRemaining,
      resetAt:quota.resetAt,
      resources:quota.resources
    };
    if(quota.exhausted===true){
      output.status='browse-quota-exhausted';
      return res.status(429).json(output);
    }
  }catch(error){
    output.checks.quota=safeFailure(error);
    output.status='quota-check-failed';
    return res.status(502).json(output);
  }

  try{
    const result=await client.searchItems({q:'Breville Barista Express Impress BES876',limit:3},{referenceId:'apg-production-validation'});
    const rows=Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[];
    output.checks.browse={
      ok:true,
      total:Number.isFinite(Number(result&&result.total))?Number(result.total):null,
      returned:rows.length,
      samples:rows.map(item=>({
        itemId:item&&item.itemId?String(item.itemId):null,
        title:item&&item.title?String(item.title).slice(0,140):null,
        imagePresent:Boolean(item&&item.image&&item.image.imageUrl),
        pricePresent:Boolean(item&&item.price&&item.price.value),
        affiliateUrlPresent:Boolean(item&&item.itemAffiliateWebUrl)
      }))
    };
  }catch(error){
    output.checks.browse=safeFailure(error);
    output.status='browse-failed';
    return res.status(error&&Number(error.status)===429?429:502).json(output);
  }

  output.ok=true;
  output.status='authenticated';
  return res.status(200).json(output);
};