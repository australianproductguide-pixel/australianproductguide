'use strict';

// APG eBay Buy Browse API client v1.2
// Server-side only. Client secrets and minted OAuth tokens must never reach browser code or logs.
// Retailer availability and affiliate relationships have zero recommendation weight.

const VERSION='1.2';
const DEFAULT_SCOPE='https://api.ebay.com/oauth/api_scope';
const DEFAULT_TIMEOUT_MS=10000;
const MAX_TIMEOUT_MS=20000;
const DEFAULT_RATE_LIMIT_BACKOFF_MS=15*60*1000;
const MAX_RATE_LIMIT_BACKOFF_MS=24*60*60*1000;
const ENV_KEYS=Object.freeze({
  clientId:'EBAY_BROWSE_CLIENT_ID',
  clientSecret:'EBAY_BROWSE_CLIENT_SECRET',
  environment:'EBAY_BROWSE_ENVIRONMENT',
  marketplaceId:'EBAY_BROWSE_MARKETPLACE_ID',
  campaignId:'EBAY_EPN_CAMPAIGN_ID'
});

let tokenCache=null;
let rateLimitUntil=0;

class EbayBrowseApiError extends Error{
  constructor(message,{status=null,code='EBAY_BROWSE_API_ERROR',retryAt=null}={}){
    super(message);
    this.name='EbayBrowseApiError';
    this.status=status;
    this.code=code;
    this.retryAt=retryAt;
  }
}

function clean(value){return String(value==null?'':value).trim();}
function environment(value,vercelEnv){
  const runtime=clean(vercelEnv).toLowerCase();
  // Vercel environment is authoritative. This prevents a stale/mistyped config
  // value from ever sending Production credentials to Sandbox or vice versa.
  if(runtime==='production')return 'production';
  if(runtime==='preview')return 'sandbox';
  const out=clean(value||'sandbox').toLowerCase();
  if(['production','prod','prd'].includes(out))return 'production';
  if(['sandbox','sbx','preview','test'].includes(out))return 'sandbox';
  throw new TypeError('EBAY_BROWSE_ENVIRONMENT must resolve to sandbox or production');
}
function configuration(env=process.env){
  return {
    clientId:clean(env[ENV_KEYS.clientId]),
    clientSecret:clean(env[ENV_KEYS.clientSecret]),
    environment:environment(env[ENV_KEYS.environment],env.VERCEL_ENV),
    marketplaceId:clean(env[ENV_KEYS.marketplaceId]||'EBAY_AU'),
    campaignId:clean(env[ENV_KEYS.campaignId]||'')
  };
}
function origins(cfg){
  const root=cfg.environment==='sandbox'?'https://api.sandbox.ebay.com':'https://api.ebay.com';
  return {root,oauth:`${root}/identity/v1/oauth2/token`,browse:`${root}/buy/browse/v1`};
}
function diagnostics(env=process.env){
  const cfg=configuration(env);
  const base=origins(cfg);
  return Object.freeze({
    version:VERSION,
    environment:cfg.environment,
    marketplaceId:cfg.marketplaceId,
    clientIdConfigured:Boolean(cfg.clientId),
    clientSecretConfigured:Boolean(cfg.clientSecret),
    configured:Boolean(cfg.clientId&&cfg.clientSecret),
    campaignConfigured:Boolean(cfg.campaignId),
    oauthOrigin:new URL(base.oauth).origin,
    browseOrigin:new URL(base.browse).origin,
    credentialsServerSideOnly:true,
    recommendationWeight:0,
    rateLimitBackoffActive:Date.now()<rateLimitUntil,
    rateLimitRetryAt:rateLimitUntil||null
  });
}
function requireConfiguration(env=process.env){
  const cfg=configuration(env);
  const missing=[];
  if(!cfg.clientId)missing.push(ENV_KEYS.clientId);
  if(!cfg.clientSecret)missing.push(ENV_KEYS.clientSecret);
  if(missing.length)throw new EbayBrowseApiError(`eBay Browse API is not configured: missing ${missing.join(', ')}`,{code:'EBAY_BROWSE_NOT_CONFIGURED'});
  return cfg;
}
function timeoutValue(value){
  if(value==null)return DEFAULT_TIMEOUT_MS;
  const n=Number(value);
  if(!Number.isFinite(n)||n<1000||n>MAX_TIMEOUT_MS)throw new TypeError(`timeoutMs must be between 1000 and ${MAX_TIMEOUT_MS}`);
  return Math.round(n);
}
async function fetchWithTimeout(url,options={},timeoutMs){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutValue(timeoutMs));
  try{return await fetch(url,{...options,signal:controller.signal,redirect:'error'});}
  catch(error){
    if(error&&error.name==='AbortError')throw new EbayBrowseApiError('eBay API request timed out',{code:'EBAY_BROWSE_TIMEOUT'});
    throw new EbayBrowseApiError('eBay API network request failed',{code:'EBAY_BROWSE_NETWORK_ERROR'});
  }finally{clearTimeout(timer);}
}
function basicAuthorization(cfg){
  return `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`,'utf8').toString('base64')}`;
}
async function getApplicationToken({env=process.env,scope=DEFAULT_SCOPE,timeoutMs,forceRefresh=false}={}){
  const cfg=requireConfiguration(env);
  const key=`${cfg.environment}:${cfg.clientId}:${scope}`;
  const now=Date.now();
  if(!forceRefresh&&tokenCache&&tokenCache.key===key&&tokenCache.expiresAt-now>60000)return tokenCache.token;
  const {oauth}=origins(cfg);
  const body=new URLSearchParams({grant_type:'client_credentials',scope:clean(scope)||DEFAULT_SCOPE});
  const response=await fetchWithTimeout(oauth,{
    method:'POST',
    headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded',Authorization:basicAuthorization(cfg)},
    body:body.toString()
  },timeoutMs);
  const text=await response.text();
  let payload=null;
  if(text){try{payload=JSON.parse(text);}catch{payload=null;}}
  if(!response.ok||!payload||!clean(payload.access_token)){
    throw new EbayBrowseApiError(`eBay OAuth request failed with HTTP ${response.status}`,{status:response.status,code:'EBAY_BROWSE_OAUTH_ERROR'});
  }
  const expiresIn=Math.max(60,Number(payload.expires_in)||7200);
  tokenCache={key,token:payload.access_token,expiresAt:now+(expiresIn*1000)};
  return payload.access_token;
}
function addQuery(url,query={}){
  for(const [key,raw] of Object.entries(query||{})){
    if(raw==null||raw==='')continue;
    const values=Array.isArray(raw)?raw:[raw];
    for(const value of values){if(value!=null&&value!=='')url.searchParams.append(key,String(value));}
  }
  return url;
}
function safePath(path){
  const out=clean(path);
  if(!out.startsWith('/')||out.includes('..')||out.includes('://'))throw new TypeError('Invalid eBay Browse API path');
  return out;
}
function affiliateContext(cfg,{referenceId,contextualLocation}={}){
  const parts=[];
  if(cfg.campaignId)parts.push(`affiliateCampaignId=${cfg.campaignId}`);
  const ref=clean(referenceId);
  if(ref&&/^[A-Za-z0-9._:-]{1,120}$/.test(ref))parts.push(`affiliateReferenceId=${ref}`);
  const loc=clean(contextualLocation);
  if(loc)parts.push(`contextualLocation=${loc}`);
  return parts.join(',');
}
function retryAfterDelay(response,now=Date.now()){
  const raw=response&&response.headers&&typeof response.headers.get==='function'?clean(response.headers.get('retry-after')):'';
  if(!raw)return DEFAULT_RATE_LIMIT_BACKOFF_MS;
  if(/^\d+$/.test(raw))return Math.min(MAX_RATE_LIMIT_BACKOFF_MS,Math.max(60000,Number(raw)*1000));
  const at=Date.parse(raw);
  if(Number.isFinite(at))return Math.min(MAX_RATE_LIMIT_BACKOFF_MS,Math.max(60000,at-Number(now)));
  return DEFAULT_RATE_LIMIT_BACKOFF_MS;
}
function activeRateLimitBackoff(now=Date.now()){
  const t=Number(now);
  return Number.isFinite(t)&&rateLimitUntil>t?rateLimitUntil:0;
}
function noteRateLimit(response,now=Date.now()){
  const t=Number(now);
  const delay=retryAfterDelay(response,t);
  rateLimitUntil=Math.max(rateLimitUntil,t+delay);
  return rateLimitUntil;
}
function clearRateLimitBackoff(){rateLimitUntil=0;}
async function request(path,{query={},env=process.env,timeoutMs,referenceId,contextualLocation}={}){
  const cfg=requireConfiguration(env);
  const blockedUntil=activeRateLimitBackoff();
  if(cfg.environment==='production'&&blockedUntil){
    throw new EbayBrowseApiError('eBay Browse API rate-limit backoff is active',{status:429,code:'EBAY_BROWSE_RATE_LIMITED',retryAt:blockedUntil});
  }
  const {browse}=origins(cfg);
  const token=await getApplicationToken({env,timeoutMs});
  const url=addQuery(new URL(`${browse}${safePath(path)}`),query);
  const headers={Accept:'application/json',Authorization:`Bearer ${token}`,'X-EBAY-C-MARKETPLACE-ID':cfg.marketplaceId};
  const endUserCtx=affiliateContext(cfg,{referenceId,contextualLocation});
  if(endUserCtx)headers['X-EBAY-C-ENDUSERCTX']=endUserCtx;
  let response=await fetchWithTimeout(url,{method:'GET',headers},timeoutMs);
  if(response.status===401){
    const refreshed=await getApplicationToken({env,timeoutMs,forceRefresh:true});
    headers.Authorization=`Bearer ${refreshed}`;
    response=await fetchWithTimeout(url,{method:'GET',headers},timeoutMs);
  }
  const text=await response.text();
  let payload=null;
  if(text){try{payload=JSON.parse(text);}catch{payload=text;}}
  if(!response.ok){
    if(response.status===429){
      const retryAt=noteRateLimit(response);
      throw new EbayBrowseApiError('eBay Browse API rate limit reached',{status:429,code:'EBAY_BROWSE_RATE_LIMITED',retryAt});
    }
    throw new EbayBrowseApiError(`eBay Browse API request failed with HTTP ${response.status}`,{status:response.status,code:'EBAY_BROWSE_HTTP_ERROR'});
  }
  if(cfg.environment==='production')clearRateLimitBackoff();
  return payload;
}
function searchItems({q,gtin,epid,categoryIds,limit=20,filter,aspectFilter,sort}={},options={}){
  const query={limit};
  if(clean(q))query.q=clean(q);
  if(clean(gtin))query.gtin=clean(gtin);
  if(clean(epid))query.epid=clean(epid);
  if(clean(categoryIds))query.category_ids=clean(categoryIds);
  if(clean(filter))query.filter=clean(filter);
  if(clean(aspectFilter))query.aspect_filter=clean(aspectFilter);
  if(clean(sort))query.sort=clean(sort);
  if(!query.q&&!query.gtin&&!query.epid&&!query.category_ids)throw new TypeError('Browse search requires q, gtin, epid or categoryIds');
  return request('/item_summary/search',{...options,query});
}
function getItem(itemId,options={}){
  const id=clean(itemId);
  if(!id||id.length>300)throw new TypeError('Invalid eBay item id');
  return request(`/item/${encodeURIComponent(id)}`,options);
}
function safeImageUrl(value){
  const raw=clean(value);
  if(!raw)return null;
  try{const u=new URL(raw);return u.protocol==='https:'?u.toString():null;}catch{return null;}
}
function safeItemProjection(item){
  if(!item||typeof item!=='object')return null;
  const additional=Array.isArray(item.additionalImages)?item.additionalImages.map(x=>safeImageUrl(x&&x.imageUrl)).filter(Boolean):[];
  return Object.freeze({
    itemId:clean(item.itemId)||null,
    legacyItemId:clean(item.legacyItemId)||null,
    title:clean(item.title)||null,
    shortDescription:clean(item.shortDescription)||null,
    categoryPath:clean(item.categoryPath)||null,
    condition:clean(item.condition)||null,
    price:item.price&&typeof item.price==='object'?{value:clean(item.price.value)||null,currency:clean(item.price.currency)||null}:null,
    imageUrl:safeImageUrl(item.image&&item.image.imageUrl),
    additionalImageUrls:additional,
    itemWebUrl:clean(item.itemWebUrl)||null,
    itemAffiliateWebUrl:clean(item.itemAffiliateWebUrl)||null,
    buyingOptions:Array.isArray(item.buyingOptions)?item.buyingOptions.map(clean).filter(Boolean):[],
    itemEndDate:clean(item.itemEndDate)||null,
    source:'eBay Buy Browse API',
    exactModel:false,
    recommendationWeight:0
  });
}

module.exports={
  VERSION,ENV_KEYS,DEFAULT_SCOPE,DEFAULT_RATE_LIMIT_BACKOFF_MS,MAX_RATE_LIMIT_BACKOFF_MS,EbayBrowseApiError,
  configuration,diagnostics,requireConfiguration,getApplicationToken,retryAfterDelay,activeRateLimitBackoff,noteRateLimit,clearRateLimitBackoff,
  request,searchItems,getItem,safeItemProjection
};
