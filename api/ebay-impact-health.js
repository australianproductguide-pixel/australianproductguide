'use strict';

const client=require('../lib/ebay-impact-api-v1');

function collection(payload,keys){
  if(Array.isArray(payload))return payload;
  if(!payload||typeof payload!=='object')return [];
  for(const key of keys){
    const value=payload[key];
    if(Array.isArray(value))return value;
    if(value&&typeof value==='object'&&Array.isArray(value.Items))return value.Items;
  }
  return [];
}

function countCollection(payload,keys){
  const rows=collection(payload,keys);
  if(rows.length)return rows.length;
  if(!payload||typeof payload!=='object')return Array.isArray(payload)?payload.length:null;
  for(const key of keys){
    const value=payload[key];
    if(value&&typeof value==='object'&&Number.isFinite(Number(value.TotalCount)))return Number(value.TotalCount);
  }
  for(const key of ['TotalCount','TotalResults','Count']){
    if(Number.isFinite(Number(payload[key])))return Number(payload[key]);
  }
  return rows.length;
}

function clean(value){return String(value==null?'':value).trim();}
function firstValue(object,keys){
  if(!object||typeof object!=='object')return null;
  for(const key of keys){
    const value=clean(object[key]);
    if(value)return value;
  }
  return null;
}
function safeProgramProjection(program){
  if(!program||typeof program!=='object')return null;
  return {
    id:firstValue(program,['Id','CampaignId','ProgramId','CampaignID','ProgramID']),
    name:firstValue(program,['Name','CampaignName','ProgramName']),
    state:firstValue(program,['State','Status','CampaignState']),
    contractStatus:firstValue(program,['ContractStatus','ContractState']),
    advertiserName:firstValue(program,['AdvertiserName','CompanyName'])
  };
}
function safeFailure(error){
  return {
    ok:false,
    code:error&&error.code?String(error.code):'EBAY_IMPACT_CHECK_FAILED',
    status:error&&Number.isFinite(Number(error.status))?Number(error.status):null
  };
}
async function checked(fn,countKeys){
  try{
    const payload=await fn();
    return {ok:true,count:countCollection(payload,countKeys),payload};
  }catch(error){
    return {...safeFailure(error),payload:null};
  }
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

  const programs=await checked(()=>client.listPrograms({PageSize:50}),['Campaigns','Programs']);
  const programRows=collection(programs.payload,['Campaigns','Programs']);
  const firstProgram=safeProgramProjection(programRows[0]);
  output.checks.programs={ok:programs.ok,count:programs.count,first:firstProgram};

  const catalogs=await checked(()=>client.listCatalogs({PageSize:50}),['Catalogs']);
  output.checks.catalogs={ok:catalogs.ok,count:catalogs.count};

  const ads=await checked(()=>client.listAds({PageSize:50}),['Ads']);
  output.checks.ads={ok:ads.ok,count:ads.count};

  const promotions=await checked(()=>client.listPromotions({PageSize:50}),['Promotions']);
  output.checks.promotions={ok:promotions.ok,count:promotions.count};

  const reports=await checked(()=>client.listReports(),['Reports']);
  output.checks.reports={ok:reports.ok,count:reports.count};

  if(firstProgram&&firstProgram.id){
    const deals=await checked(()=>client.listDeals(firstProgram.id,{PageSize:50}),['Deals']);
    output.checks.deals={ok:deals.ok,count:deals.count};
  }

  if(String(req.query&&req.query.tracking||'')==='1'){
    if(!firstProgram||!firstProgram.id){
      output.checks.trackingLink={ok:false,code:'NO_PROGRAM_ID'};
    }else{
      try{
        const result=await client.createTrackingLink(firstProgram.id,{
          deepLink:'https://www.ebay.com.au/',
          subId1:'apg-api-validation'
        });
        const candidate=firstValue(result,['TrackingURL','TrackingUrl','Url','URL']);
        let host=null;
        if(candidate){try{host=new URL(candidate).hostname;}catch{host=null;}}
        output.checks.trackingLink={ok:Boolean(candidate),trackingUrlPresent:Boolean(candidate),host};
      }catch(error){
        output.checks.trackingLink=safeFailure(error);
      }
    }
  }

  output.ok=Boolean(output.checks.programs&&output.checks.programs.ok);
  output.status=output.ok?'authenticated':'api-check-failed';
  return res.status(output.ok?200:502).json(output);
};
