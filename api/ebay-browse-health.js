'use strict';

const client=require('../lib/ebay-browse-api-v1');

function fail(error){
  return {
    ok:false,
    code:error&&error.code?String(error.code):'EBAY_BROWSE_CHECK_FAILED',
    status:error&&Number.isFinite(Number(error.status))?Number(error.status):null
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');

  if(process.env.VERCEL_ENV!=='preview'){
    return res.status(404).json({ok:false,status:'preview-only'});
  }
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return res.status(405).json({ok:false,status:'method-not-allowed'});
  }

  const d=client.diagnostics();
  const output={
    ok:false,
    status:'validation',
    previewOnly:true,
    configured:d.configured,
    clientIdConfigured:d.clientIdConfigured,
    clientSecretConfigured:d.clientSecretConfigured,
    environment:d.environment,
    marketplaceId:d.marketplaceId,
    campaignConfigured:d.campaignConfigured,
    recommendationWeight:0,
    checks:{}
  };

  if(!d.configured){
    output.status='not-configured';
    return res.status(503).json(output);
  }

  try{
    const token=await client.getApplicationToken();
    output.checks.oauth={ok:Boolean(token),tokenPresent:Boolean(token)};
  }catch(error){
    output.checks.oauth=fail(error);
    output.status='oauth-failed';
    return res.status(502).json(output);
  }

  try{
    const result=await client.searchItems({q:'drone',limit:1});
    const items=Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[];
    const first=items[0]||null;
    output.checks.browse={
      ok:true,
      total:Number.isFinite(Number(result&&result.total))?Number(result.total):null,
      samplePresent:Boolean(first),
      sampleTitle:first&&first.title?String(first.title).slice(0,120):null,
      sampleImagePresent:Boolean(first&&first.image&&first.image.imageUrl),
      samplePricePresent:Boolean(first&&first.price&&first.price.value)
    };
  }catch(error){
    output.checks.browse=fail(error);
    output.status='browse-failed';
    return res.status(502).json(output);
  }

  output.ok=true;
  output.status='authenticated';
  return res.status(200).json(output);
};
