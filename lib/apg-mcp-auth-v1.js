'use strict';

const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const MCP_RESOURCE='https://australianproductguide.au/mcp';
const AUTH_SERVER=`${SUPABASE_URL}/auth/v1`;
const RESOURCE_METADATA='https://australianproductguide.au/.well-known/oauth-protected-resource/mcp';

function bearer(req){
  const raw=String(req.headers.authorization||'');
  return raw.startsWith('Bearer ')?raw.slice(7).trim():'';
}
function decodePayload(token){
  try{
    const part=String(token||'').split('.')[1];
    if(!part)return null;
    const padded=part.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((part.length+3)%4);
    return JSON.parse(Buffer.from(padded,'base64').toString('utf8'));
  }catch{return null;}
}
async function jsonFetch(url,options){
  const response=await fetch(url,options);
  const text=await response.text();
  let data={};
  try{data=text?JSON.parse(text):{};}catch{data={raw:text};}
  return {ok:response.ok,status:response.status,data};
}
async function validateOperatorToken(token){
  if(!token)return {ok:false,status:401,error:'missing_bearer_token'};
  const user=await jsonFetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}});
  if(!user.ok||!user.data||!user.data.id)return {ok:false,status:401,error:'invalid_or_expired_token'};
  const claims=decodePayload(token)||{};
  if(!claims.client_id)return {ok:false,status:403,error:'oauth_client_token_required'};
  const operator=await jsonFetch(`${SUPABASE_URL}/rest/v1/apg_mcp_operators?user_id=eq.${encodeURIComponent(user.data.id)}&enabled=eq.true&select=user_id,enabled`,{headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${token}`}});
  if(!operator.ok||!Array.isArray(operator.data)||!operator.data.length)return {ok:false,status:403,error:'apg_mcp_operator_not_authorised'};
  if(claims.apg_mcp===true&&claims.aud!==MCP_RESOURCE)return {ok:false,status:403,error:'invalid_mcp_resource_audience'};
  return {ok:true,user:{id:user.data.id,email:user.data.email||''},claims};
}
function challenge(res,status=401,error='invalid_token'){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('WWW-Authenticate',`Bearer resource_metadata="${RESOURCE_METADATA}", error="${error}"`);
  res.end(JSON.stringify({error,resource:MCP_RESOURCE}));
}
function protectedResourceMetadata(){
  return {
    resource:MCP_RESOURCE,
    authorization_servers:[AUTH_SERVER],
    bearer_methods_supported:['header'],
    scopes_supported:['openid','email','profile'],
    resource_name:'Australian Product Guide Growth Intelligence'
  };
}
module.exports={SUPABASE_URL,SUPABASE_KEY,MCP_RESOURCE,AUTH_SERVER,RESOURCE_METADATA,bearer,decodePayload,jsonFetch,validateOperatorToken,challenge,protectedResourceMetadata};
