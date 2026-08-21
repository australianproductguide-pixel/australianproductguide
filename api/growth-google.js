'use strict';

const growth=require('../lib/google-growth-v1');

function send(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.end(JSON.stringify(payload));
}

function authorised(req){
  // Preview is protected by Vercel's deployment protection and is used for the
  // initial federation proof. Production detailed data stays closed until
  // APG_GROWTH_API_TOKEN is deliberately configured for a private caller/MCP layer.
  if(process.env.VERCEL_ENV!=='production')return true;
  const expected=process.env.APG_GROWTH_API_TOKEN;
  if(!expected)return false;
  const auth=String(req.headers.authorization||'');
  return auth===`Bearer ${expected}`;
}

async function health(){
  const [sites,accounts]=await Promise.all([
    growth.listSearchConsoleSites(),
    growth.listAnalyticsAccountSummaries()
  ]);
  const properties=growth.flattenGaProperties(accounts);
  return {
    ok:true,
    auth:'vercel-oidc-google-wif-service-account',
    searchConsoleConnected:sites.length>0,
    searchConsoleSiteCount:sites.length,
    analyticsConnected:properties.length>0,
    analyticsPropertyCount:properties.length
  };
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return send(res,405,{ok:false,error:'method_not_allowed'});
  }
  try{
    const mode=String(req.query&&req.query.mode||'').toLowerCase();
    if(mode==='health')return send(res,200,await health());
    if(!authorised(req))return send(res,503,{ok:false,error:'growth_api_not_enabled_for_public_production'});
    const includeSnapshots=String(req.query&&req.query.snapshots||'1')!=='0';
    const result=await growth.diagnose({includeSnapshots});
    return send(res,200,result);
  }catch(error){
    console.error('[APG Google Growth]',error&&error.message,error&&error.details||'');
    return send(res,502,{
      ok:false,
      error:'google_growth_connection_failed',
      message:error&&error.message||'Unknown Google integration error',
      status:error&&error.status||null
    });
  }
};
