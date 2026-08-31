'use strict';

// APG read-mostly Supabase client for server-rendered operational state.
// Public product pages use only RLS-protected reads. Material image-state mutations are routed
// through the dedicated Supabase Edge Function, whose allowlist and short-lived worker capability
// keep the built-in service role completely outside Vercel, browsers and repository source.

const VERSION='1.1';
const DEFAULT_URL='https://gozovvhofdsshjuixcys.supabase.co';
const DEFAULT_PUBLISHABLE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const DEFAULT_TIMEOUT_MS=1200;
const STATE_FUNCTION='/functions/v1/apg-ebay-image-state';
const IMAGE_STATE_SELECT='slug,product_name,status,detail_verified,exact_model,verification_level,verification_evidence,item_id,legacy_item_id,title,condition,price_value,price_currency,image_url,image_source,item_web_url,item_affiliate_web_url,match_score,match_reasons,match_flags,recommendation_weight,last_verified_at,next_refresh_at,consecutive_failures,recovery_required,last_error_code';
const IMAGE_STATE_BATCH_SIZE=40;

function clean(value){return String(value==null?'':value).trim();}
function validSlug(value){return /^[a-z0-9][a-z0-9-]{1,160}$/.test(clean(value));}
function configuration(env=process.env){
  return {
    url:clean(env.APG_SUPABASE_URL||DEFAULT_URL).replace(/\/+$/,''),
    publishableKey:clean(env.APG_SUPABASE_PUBLISHABLE_KEY||DEFAULT_PUBLISHABLE_KEY)
  };
}
function timeoutValue(value){
  const n=Number(value==null?DEFAULT_TIMEOUT_MS:value);
  return Number.isFinite(n)?Math.max(250,Math.min(10000,Math.round(n))):DEFAULT_TIMEOUT_MS;
}
async function request(path,{method='GET',body=null,timeoutMs=DEFAULT_TIMEOUT_MS,fetchImpl=global.fetch,headers={}}={}){
  if(typeof fetchImpl!=='function')throw new TypeError('Supabase request requires fetch');
  const cfg=configuration();
  const relative=clean(path);
  if(!relative.startsWith('/'))throw new TypeError('Supabase path must be relative');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutValue(timeoutMs));
  try{
    const response=await fetchImpl(cfg.url+relative,{
      method,
      headers:{Accept:'application/json',apikey:cfg.publishableKey,...(body==null?{}:{'Content-Type':'application/json'}),...headers},
      body:body==null?undefined:JSON.stringify(body),
      signal:controller.signal,
      redirect:'error'
    });
    const text=await response.text();
    let payload=null;
    if(text){try{payload=JSON.parse(text);}catch{payload=text;}}
    if(!response.ok){
      const error=new Error(`APG Supabase request failed with HTTP ${response.status}`);
      error.code='APG_SUPABASE_HTTP_ERROR';error.status=response.status;error.payload=payload;throw error;
    }
    return payload;
  }catch(error){
    if(error&&error.name==='AbortError'){
      const timeout=new Error('APG Supabase request timed out');timeout.code='APG_SUPABASE_TIMEOUT';throw timeout;
    }
    throw error;
  }finally{clearTimeout(timer);}
}
async function rpc(name,args,options={}){
  const safe=clean(name);
  if(!/^[a-z0-9_]{3,100}$/.test(safe))throw new TypeError('Invalid Supabase RPC name');
  const payload=await request(STATE_FUNCTION,{...options,method:'POST',body:{rpc:safe,args:args||{}}});
  if(!payload||payload.ok!==true){
    const error=new Error('APG image-state operation was rejected');
    error.code='APG_IMAGE_STATE_OPERATION_REJECTED';throw error;
  }
  return payload.data;
}
async function imageState(slug,options={}){
  const value=clean(slug);
  if(!validSlug(value))return null;
  const rows=await request(`/rest/v1/apg_ebay_image_state?slug=eq.${encodeURIComponent(value)}&select=${encodeURIComponent(IMAGE_STATE_SELECT)}&limit=1`,options);
  return Array.isArray(rows)&&rows.length?rows[0]:null;
}
async function imageStates(slugs,options={}){
  const values=[...new Set((Array.isArray(slugs)?slugs:[]).map(clean).filter(validSlug))];
  if(!values.length)return [];
  const rows=[];
  for(let index=0;index<values.length;index+=IMAGE_STATE_BATCH_SIZE){
    const chunk=values.slice(index,index+IMAGE_STATE_BATCH_SIZE);
    const filter=encodeURIComponent(`in.(${chunk.join(',')})`);
    const payload=await request(`/rest/v1/apg_ebay_image_state?slug=${filter}&select=${encodeURIComponent(IMAGE_STATE_SELECT)}`,options);
    if(Array.isArray(payload))rows.push(...payload);
  }
  return rows;
}

module.exports={VERSION,DEFAULT_URL,DEFAULT_PUBLISHABLE_KEY,DEFAULT_TIMEOUT_MS,STATE_FUNCTION,IMAGE_STATE_SELECT,IMAGE_STATE_BATCH_SIZE,configuration,request,rpc,imageState,imageStates};
