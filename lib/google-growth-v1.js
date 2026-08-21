'use strict';

// APG Google Growth Intelligence v1
// Keyless Vercel -> Google authentication using Vercel OIDC + Google Workload
// Identity Federation. No service-account JSON key is stored or required.

const CONFIG=Object.freeze({
  projectId:process.env.GCP_PROJECT_ID||'serious-flight-364223',
  projectNumber:process.env.GCP_PROJECT_NUMBER||'4015856724',
  poolId:process.env.GCP_WORKLOAD_IDENTITY_POOL_ID||'apg-vercel-oidc',
  providerId:process.env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID||'apg-vercel',
  serviceAccountEmail:process.env.GCP_SERVICE_ACCOUNT_EMAIL||'apg-growth-automation@serious-flight-364223.iam.gserviceaccount.com',
  searchConsoleSite:process.env.GOOGLE_SEARCH_CONSOLE_SITE||'sc-domain:australianproductguide.au'
});

const SERVICE_ACCOUNT_SCOPES=[
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit'
];

let cachedAccessToken=null;
let cachedAccessTokenExpiry=0;

function providerAudience(){
  return `//iam.googleapis.com/projects/${CONFIG.projectNumber}/locations/global/workloadIdentityPools/${CONFIG.poolId}/providers/${CONFIG.providerId}`;
}

function vercelSubjectToken(){
  const token=process.env.VERCEL_OIDC_TOKEN;
  if(!token)throw new Error('VERCEL_OIDC_TOKEN is unavailable. Confirm Vercel OIDC federation is enabled for this deployment.');
  return token;
}

async function readJson(response,label){
  const text=await response.text();
  let data=null;
  try{data=text?JSON.parse(text):{};}catch{data={raw:text};}
  if(!response.ok){
    const message=data&&data.error&&data.error.message?data.error.message:(data&&data.error_description)||text||response.statusText;
    const error=new Error(`${label} failed (${response.status}): ${message}`);
    error.status=response.status;
    error.details=data;
    throw error;
  }
  return data;
}

async function exchangeFederatedToken(){
  const body=new URLSearchParams({
    audience:providerAudience(),
    grant_type:'urn:ietf:params:oauth:grant-type:token-exchange',
    requested_token_type:'urn:ietf:params:oauth:token-type:access_token',
    scope:'https://www.googleapis.com/auth/cloud-platform',
    subject_token_type:'urn:ietf:params:oauth:token-type:jwt',
    subject_token:vercelSubjectToken()
  });
  const response=await fetch('https://sts.googleapis.com/v1/token',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body
  });
  return readJson(response,'Google STS token exchange');
}

async function impersonateServiceAccount(federatedToken){
  const url=`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(CONFIG.serviceAccountEmail)}:generateAccessToken`;
  const response=await fetch(url,{
    method:'POST',
    headers:{
      authorization:`Bearer ${federatedToken}`,
      'content-type':'application/json'
    },
    body:JSON.stringify({scope:SERVICE_ACCOUNT_SCOPES,lifetime:'3600s'})
  });
  return readJson(response,'Google service-account impersonation');
}

async function getGoogleAccessToken(){
  if(cachedAccessToken&&Date.now()<cachedAccessTokenExpiry-60000)return cachedAccessToken;
  const federated=await exchangeFederatedToken();
  const impersonated=await impersonateServiceAccount(federated.access_token);
  cachedAccessToken=impersonated.accessToken;
  const expiresAt=Date.parse(impersonated.expireTime||'');
  cachedAccessTokenExpiry=Number.isFinite(expiresAt)?expiresAt:Date.now()+3300000;
  return cachedAccessToken;
}

async function googleFetch(url,options={}){
  const token=await getGoogleAccessToken();
  const headers=Object.assign({},options.headers||{}, {authorization:`Bearer ${token}`});
  const response=await fetch(url,Object.assign({},options,{headers}));
  return readJson(response,`Google API ${new URL(url).pathname}`);
}

async function listSearchConsoleSites(){
  const data=await googleFetch('https://www.googleapis.com/webmasters/v3/sites');
  return Array.isArray(data.siteEntry)?data.siteEntry:[];
}

async function listAnalyticsAccountSummaries(){
  const data=await googleFetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200');
  return Array.isArray(data.accountSummaries)?data.accountSummaries:[];
}

function flattenGaProperties(accountSummaries){
  const properties=[];
  for(const account of accountSummaries||[]){
    for(const property of account.propertySummaries||[]){
      properties.push({
        account:account.account,
        accountDisplayName:account.displayName,
        property:property.property,
        propertyId:String(property.property||'').replace(/^properties\//,''),
        displayName:property.displayName,
        propertyType:property.propertyType,
        parent:property.parent
      });
    }
  }
  return properties;
}

function selectGaProperty(properties){
  const explicit=process.env.GA4_PROPERTY_ID;
  if(explicit)return properties.find(item=>item.propertyId===String(explicit))||{property:`properties/${explicit}`,propertyId:String(explicit),displayName:'Configured GA4 property'};
  return properties.find(item=>/australian\s+product\s+guide|\bapg\b/i.test(String(item.displayName||'')))||properties[0]||null;
}

function isoDate(daysAgo){
  const date=new Date(Date.now()-daysAgo*86400000);
  return date.toISOString().slice(0,10);
}

async function searchConsoleSnapshot(siteUrl=CONFIG.searchConsoleSite){
  const body={
    startDate:isoDate(28),
    endDate:isoDate(1),
    dimensions:['query'],
    rowLimit:10,
    dataState:'final'
  };
  const data=await googleFetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
  });
  return {
    siteUrl,
    period:{startDate:body.startDate,endDate:body.endDate},
    topQueries:(data.rows||[]).map(row=>({query:row.keys&&row.keys[0],clicks:row.clicks,impressions:row.impressions,ctr:row.ctr,position:row.position}))
  };
}

async function analyticsSnapshot(propertyId){
  if(!propertyId)return null;
  const body={
    dateRanges:[{startDate:'28daysAgo',endDate:'yesterday'}],
    metrics:[{name:'activeUsers'},{name:'sessions'},{name:'engagedSessions'}]
  };
  const data=await googleFetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
  });
  const values=(data.rows&&data.rows[0]&&data.rows[0].metricValues)||[];
  return {
    propertyId:String(propertyId),
    period:'28daysAgo to yesterday',
    activeUsers:Number(values[0]&&values[0].value||0),
    sessions:Number(values[1]&&values[1].value||0),
    engagedSessions:Number(values[2]&&values[2].value||0)
  };
}

async function diagnose({includeSnapshots=true}={}){
  const [sites,accountSummaries]=await Promise.all([
    listSearchConsoleSites(),
    listAnalyticsAccountSummaries()
  ]);
  const properties=flattenGaProperties(accountSummaries);
  const selectedProperty=selectGaProperty(properties);
  const result={
    ok:true,
    auth:'vercel-oidc-google-wif-service-account',
    projectId:CONFIG.projectId,
    searchConsole:{
      configuredSite:CONFIG.searchConsoleSite,
      accessibleSites:sites.map(item=>({siteUrl:item.siteUrl,permissionLevel:item.permissionLevel}))
    },
    analytics:{
      accessibleProperties:properties,
      selectedProperty
    }
  };
  if(includeSnapshots){
    const site=sites.find(item=>item.siteUrl===CONFIG.searchConsoleSite)||sites[0];
    const [gsc,ga4]=await Promise.all([
      site?searchConsoleSnapshot(site.siteUrl):Promise.resolve(null),
      selectedProperty?analyticsSnapshot(selectedProperty.propertyId):Promise.resolve(null)
    ]);
    result.searchConsole.snapshot=gsc;
    result.analytics.snapshot=ga4;
  }
  return result;
}

module.exports={
  CONFIG,
  SERVICE_ACCOUNT_SCOPES,
  providerAudience,
  getGoogleAccessToken,
  googleFetch,
  listSearchConsoleSites,
  listAnalyticsAccountSummaries,
  flattenGaProperties,
  selectGaProperty,
  searchConsoleSnapshot,
  analyticsSnapshot,
  diagnose
};
