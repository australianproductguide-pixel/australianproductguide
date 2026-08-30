'use strict';

const client=require('../lib/ebay-impact-api-v1');

function countCollection(payload,keys){
  if(Array.isArray(payload))return payload.length;
  if(!payload||typeof payload!=='object')return null;
  for(const key of keys){
    const value=payload[key];
    if(Array.isArray(value))return value.length;
    if(value&&typeof value==='object'){
      if(Array.isArray(value.Items))return value.Items.length;
      if(Number.isFinite(Number(value.TotalCount)))return Number(value.TotalCount);
    }
  }
  for(const key of ['TotalCount','TotalResults','Count']){
    if(Number.isFinite(Number(payload[key])))return Number(payload[key]);
  }
  return null;
}

function safeFailure(error){
  return {
    ok:false,
    code:error&&error.code?String(error.code):'EBAY_IMPACT_CHECK_FAILED',
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

  const diagnostics=client.diagnostics();
  const output={
    ok:false,
    status:'validation',
    previewOnly:true,
    configured:diagnostics.configured,
    accountSidConfigured:diagnostics.accountSidConfigured,
    authTokenConfigured:diagnostics.authTokenConfigured,
    apiVersion:diagnostics.apiVersion,
    recommendationWeight:0,
    checks:{}
  };

  if(!diagnostics.configured){
    output.status='not-configured';
    return res.status(503).json(output);
  }

  try{
    const programs=await client.listPrograms({PageSize:50});
    output.checks.programs={
      ok:true,
      count:countCollection(programs,['Campaigns','Programs'])
    };
  }catch(error){
    output.checks.programs=safeFailure(error);
  }

  try{
    const catalogs=await client.listCatalogs({PageSize:50});
    output.checks.catalogs={
      ok:true,
      count:countCollection(catalogs,['Catalogs'])
    };
  }catch(error){
    output.checks.catalogs=safeFailure(error);
  }

  output.ok=Boolean(output.checks.programs&&output.checks.programs.ok&&output.checks.catalogs&&output.checks.catalogs.ok);
  output.status=output.ok?'authenticated':'api-check-failed';
  return res.status(output.ok?200:502).json(output);
};
