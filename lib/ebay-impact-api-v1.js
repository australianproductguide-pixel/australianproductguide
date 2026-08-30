'use strict';

// APG eBay Partner Network / impact.com API client v1.0.
//
// SECURITY / GOVERNANCE
// - Server-side only. Credentials are read from process.env and are never embedded in source.
// - Affiliate/commission data must never contribute recommendation weight.
// - This client does not make an eBay listing an APG-verified product match. Canonical identity,
//   variant matching, freshness and evidence gates remain separate concerns.
// - This is the impact.com/EPN connection. Live eBay AU listing/product data belongs to the
//   separate eBay Buy Browse API integration.

const VERSION='1.0';
const API_ORIGIN='https://api.impact.com';
const DEFAULT_TIMEOUT_MS=8000;
const MAX_TIMEOUT_MS=20000;
const ENV_KEYS=Object.freeze({
  accountSid:'EBAY_EPN_ACCOUNT_SID',
  authToken:'EBAY_EPN_AUTH_TOKEN',
  apiVersion:'EBAY_EPN_API_VERSION'
});

class EbayImpactApiError extends Error{
  constructor(message,{status=null,code='EBAY_IMPACT_API_ERROR'}={}){
    super(message);
    this.name='EbayImpactApiError';
    this.status=status;
    this.code=code;
  }
}

function clean(value){return String(value==null?'':value).trim();}
function positiveInt(value,{min=1,max=200}={}){
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)throw new TypeError(`Expected integer between ${min} and ${max}`);
  return n;
}
function identifier(value,label='identifier'){
  const out=clean(value);
  if(!out||out.length>160||!/^[A-Za-z0-9_.:-]+$/.test(out))throw new TypeError(`Invalid ${label}`);
  return out;
}
function configuration(env=process.env){
  const accountSid=clean(env[ENV_KEYS.accountSid]);
  const authToken=clean(env[ENV_KEYS.authToken]);
  const apiVersion=clean(env[ENV_KEYS.apiVersion]||'16');
  return {accountSid,authToken,apiVersion};
}
function diagnostics(env=process.env){
  const cfg=configuration(env);
  return Object.freeze({
    version:VERSION,
    origin:API_ORIGIN,
    apiVersion:cfg.apiVersion,
    accountSidConfigured:Boolean(cfg.accountSid),
    authTokenConfigured:Boolean(cfg.authToken),
    configured:Boolean(cfg.accountSid&&cfg.authToken),
    credentialsServerSideOnly:true,
    recommendationWeight:0,
    browseApiSeparate:true
  });
}
function requireConfiguration(env=process.env){
  const cfg=configuration(env);
  const missing=[];
  if(!cfg.accountSid)missing.push(ENV_KEYS.accountSid);
  if(!cfg.authToken)missing.push(ENV_KEYS.authToken);
  if(missing.length)throw new EbayImpactApiError(`eBay EPN API is not configured: missing ${missing.join(', ')}`,{code:'EBAY_IMPACT_NOT_CONFIGURED'});
  return cfg;
}
function basicAuthorization(cfg){
  return `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.authToken}`,'utf8').toString('base64')}`;
}
function addQuery(url,query={}){
  for(const [key,raw] of Object.entries(query||{})){
    if(raw==null||raw==='')continue;
    const values=Array.isArray(raw)?raw:[raw];
    for(const value of values){
      if(value==null||value==='')continue;
      url.searchParams.append(key,String(value));
    }
  }
  return url;
}
function timeoutValue(value){
  if(value==null)return DEFAULT_TIMEOUT_MS;
  const n=Number(value);
  if(!Number.isFinite(n)||n<1000||n>MAX_TIMEOUT_MS)throw new TypeError(`timeoutMs must be between 1000 and ${MAX_TIMEOUT_MS}`);
  return Math.round(n);
}
function endpoint(cfg,relativePath,query){
  if(typeof relativePath!=='string'||!relativePath.startsWith('/')||relativePath.includes('..')||relativePath.includes('://')){
    throw new TypeError('Invalid impact.com API path');
  }
  const base=`${API_ORIGIN}/Mediapartners/${encodeURIComponent(cfg.accountSid)}`;
  return addQuery(new URL(base+relativePath),query);
}
async function request(relativePath,{method='GET',query={},timeoutMs,env=process.env}={}){
  const cfg=requireConfiguration(env);
  const upper=clean(method||'GET').toUpperCase();
  if(upper!=='GET'&&upper!=='POST')throw new TypeError('Only GET and governed tracking-link POST requests are supported');
  if(upper==='POST'&&!/^\/Programs\/[A-Za-z0-9_.:-]+\/TrackingLinks$/.test(relativePath)){
    throw new TypeError('POST is restricted to impact.com tracking-link creation');
  }
  const url=endpoint(cfg,relativePath,query);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutValue(timeoutMs));
  try{
    const response=await fetch(url,{method:upper,headers:{Accept:'application/json',Authorization:basicAuthorization(cfg)},signal:controller.signal,redirect:'error'});
    const text=await response.text();
    let payload=null;
    if(text){try{payload=JSON.parse(text);}catch{payload=text;}}
    if(!response.ok){
      throw new EbayImpactApiError(`impact.com API request failed with HTTP ${response.status}`,{status:response.status,code:'EBAY_IMPACT_HTTP_ERROR'});
    }
    return payload;
  }catch(error){
    if(error instanceof EbayImpactApiError)throw error;
    if(error&&error.name==='AbortError')throw new EbayImpactApiError('impact.com API request timed out',{code:'EBAY_IMPACT_TIMEOUT'});
    throw new EbayImpactApiError('impact.com API request failed',{code:'EBAY_IMPACT_NETWORK_ERROR'});
  }finally{
    clearTimeout(timer);
  }
}

// Programs were historically called Campaigns in the impact.com Partner API. The campaign
// collection remains the canonical read endpoint used by program objects.
function listPrograms(query={},options={}){return request('/Campaigns',{...options,query});}
function retrieveProgram(programId,options={}){return request(`/Campaigns/${identifier(programId,'program id')}`,options);}
function listAds(query={},options={}){return request('/Ads',{...options,query});}
function listCatalogs(query={},options={}){return request('/Catalogs',{...options,query});}
function retrieveCatalog(catalogId,options={}){return request(`/Catalogs/${identifier(catalogId,'catalog id')}`,options);}
function listCatalogItems(catalogId,query={},options={}){return request(`/Catalogs/${identifier(catalogId,'catalog id')}/Items`,{...options,query});}
function searchCatalogItems(query={},options={}){return request('/Catalogs/ItemSearch',{...options,query});}
function retrieveCatalogItem(catalogId,itemId,options={}){
  return request(`/Catalogs/${identifier(catalogId,'catalog id')}/Items/${identifier(itemId,'catalog item id')}`,options);
}
function listPromotions(query={},options={}){return request('/Promotions',{...options,query});}
function retrievePromotion(promotionId,options={}){return request(`/Promotions/${identifier(promotionId,'promotion id')}`,options);}
function listDeals(programId,query={},options={}){return request(`/Campaigns/${identifier(programId,'program id')}/Deals`,{...options,query});}
function retrieveDeal(programId,dealId,options={}){return request(`/Campaigns/${identifier(programId,'program id')}/Deals/${identifier(dealId,'deal id')}`,options);}
function listReports(options={}){return request('/Reports',options);}
function retrieveReportMetadata(reportId,options={}){return request(`/Reports/${identifier(reportId,'report id')}/MetaData`,options);}
function exportClicks(query={},options={}){return request('/ClickExport',{...options,query});}

function ebayAuDeepLink(value){
  const raw=clean(value);
  if(!raw)return null;
  let url;
  try{url=new URL(raw);}catch{throw new TypeError('DeepLink must be a valid URL');}
  const host=url.hostname.toLowerCase().replace(/\.$/,'');
  if(url.protocol!=='https:'||!(host==='ebay.com.au'||host.endsWith('.ebay.com.au'))){
    throw new TypeError('DeepLink must be an HTTPS eBay Australia URL');
  }
  url.username='';url.password='';url.hash='';
  return url.toString();
}
function attributionValue(value,label){
  const out=clean(value);
  if(!out)return null;
  if(out.length>120||!/^[A-Za-z0-9._:-]+$/.test(out))throw new TypeError(`Invalid ${label}`);
  return out;
}
function createTrackingLink(programId,{deepLink,mediaPartnerPropertyId,subId1,subId2,subId3,sharedId,type='Regular'}={},options={}){
  const program=identifier(programId,'program id');
  const link=ebayAuDeepLink(deepLink);
  const linkType=clean(type||'Regular');
  if(!/^(Regular|Vanity)$/i.test(linkType))throw new TypeError('Tracking-link type must be Regular or Vanity');
  const query={Type:/^vanity$/i.test(linkType)?'Vanity':'Regular'};
  if(link)query.DeepLink=link;
  if(mediaPartnerPropertyId)query.MediaPartnerPropertyId=identifier(mediaPartnerPropertyId,'media property id');
  const a1=attributionValue(subId1,'subId1');if(a1)query.subId1=a1;
  const a2=attributionValue(subId2,'subId2');if(a2)query.subId2=a2;
  const a3=attributionValue(subId3,'subId3');if(a3)query.subId3=a3;
  const shared=attributionValue(sharedId,'sharedId');if(shared)query.sharedId=shared;
  return request(`/Programs/${program}/TrackingLinks`,{...options,method:'POST',query});
}

function safeProductProjection(item){
  if(!item||typeof item!=='object')return null;
  return Object.freeze({
    impactId:clean(item.Id)||null,
    catalogId:clean(item.CatalogId)||null,
    campaignId:clean(item.CampaignId)||null,
    catalogItemId:clean(item.CatalogItemId)||null,
    name:clean(item.Name)||null,
    description:clean(item.Description)||null,
    manufacturer:clean(item.Manufacturer)||null,
    destinationUrl:clean(item.Url)||null,
    imageUrl:clean(item.ImageUrl)||null,
    additionalImageUrls:Array.isArray(item.AdditionalImageUrls)?item.AdditionalImageUrls.map(clean).filter(Boolean):[],
    currentPrice:clean(item.CurrentPrice)||null,
    originalPrice:clean(item.OriginalPrice)||null,
    currency:clean(item.Currency)||null,
    stockAvailability:clean(item.StockAvailability)||null,
    gtin:clean(item.Gtin)||null,
    gtinType:clean(item.GtinType)||null,
    mpn:clean(item.Mpn)||null,
    category:clean(item.Category)||null,
    subCategory:clean(item.SubCategory)||null,
    condition:clean(item.Condition)||null,
    promotionIds:Array.isArray(item.PromotionIds)?item.PromotionIds.map(clean).filter(Boolean):[],
    source:'impact.com EPN catalog',
    exactModel:false,
    recommendationWeight:0
  });
}

module.exports={
  VERSION,API_ORIGIN,ENV_KEYS,EbayImpactApiError,configuration,diagnostics,requireConfiguration,
  listPrograms,retrieveProgram,listAds,listCatalogs,retrieveCatalog,listCatalogItems,searchCatalogItems,
  retrieveCatalogItem,listPromotions,retrievePromotion,listDeals,retrieveDeal,listReports,retrieveReportMetadata,
  exportClicks,createTrackingLink,safeProductProjection,ebayAuDeepLink
};
