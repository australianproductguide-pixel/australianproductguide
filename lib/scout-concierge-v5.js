// Scout Concierge v5 — conversational interface over APG's existing trusted intelligence.
// This layer adds no paid model dependency. Facts remain in APG data/tools; account actions
// remain server-authorised against the current HttpOnly Supabase session.
const upstream=require('./auth-password-policy-v361');
const core=require('./scout-concierge-v5-core');
const client=require('./scout-concierge-v5-client');
const brand=require('./scout-concierge-v5-brand');
const amazon=require('./scout-amazon-v5');
const socials=require('./social-profiles-v56');

const VERSION='5.0';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const SUPABASE_URL='https://gozovvhofdsshjuixcys.supabase.co';
const SUPABASE_KEY='sb_publishable_QbtKhLET0nhWNLqMxKCo7g_a85ZIoK7';
const ACCESS_COOKIE='apg_at';
const REFRESH_COOKIE='apg_rt';
const CSS_PATH='/assets/scout-concierge-v5.css';
const API_PATH='/api/account/scout';
const ACCOUNT_SENSITIVE_INTENTS=new Set(['saved_products','save_product','remove_saved_product','account_help']);

function cookies(req){
  const out={};String(req.headers&&req.headers.cookie||'').split(';').forEach(part=>{const i=part.indexOf('=');if(i<0)return;const k=part.slice(0,i).trim(),v=part.slice(i+1).trim();try{out[k]=decodeURIComponent(v)}catch{out[k]=v}});return out;
}
function appendCookie(res,value){const current=res.getHeader('Set-Cookie');if(!current)res.setHeader('Set-Cookie',[value]);else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);}
function setSessionCookies(res,data){if(!data||!data.access_token||!data.refresh_token)return;const accessAge=Math.max(300,Number(data.expires_in)||3600);appendCookie(res,`${ACCESS_COOKIE}=${encodeURIComponent(data.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${accessAge}`);appendCookie(res,`${REFRESH_COOKIE}=${encodeURIComponent(data.refresh_token)}; Path=/api/account; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);}
function clearSessionCookies(res){appendCookie(res,`${ACCESS_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);appendCookie(res,`${REFRESH_COOKIE}=; Path=/api/account; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);}
function allowedOrigin(req){const origin=String(req.headers&&req.headers.origin||'');return !origin||origin===PRIMARY_ORIGIN||process.env.VERCEL_ENV!=='production';}
function sendJson(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Scout','scout-concierge-v5');return res.end(JSON.stringify(payload));}
function sendAsset(res,type,body){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Scout','scout-concierge-v5');return res.end(body);}
async function readJson(req,limit=120000){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=chunk;if(raw.length>limit){reject(new Error('Request too large'));req.destroy();}});req.on('end',()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject);});}
async function supabase(path,{method='GET',token,body,headers={}}={}){const h={apikey:SUPABASE_KEY,...headers};if(token)h.Authorization=`Bearer ${token}`;if(body!==undefined)h['Content-Type']='application/json';const r=await fetch(SUPABASE_URL+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});const text=await r.text();let data=null;if(text){try{data=JSON.parse(text)}catch{data=text}}return {ok:r.ok,status:r.status,data,headers:r.headers};}
async function refreshSession(req,res){const c=cookies(req);if(!c[REFRESH_COOKIE])return null;const r=await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:c[REFRESH_COOKIE]}});if(!r.ok){clearSessionCookies(res);return null;}setSessionCookies(res,r.data);return r.data;}
async function authContext(req,res){const c=cookies(req);let token=c[ACCESS_COOKIE];if(token){const u=await supabase('/auth/v1/user',{token});if(u.ok&&u.data&&u.data.id)return {token,user:u.data};}const refreshed=await refreshSession(req,res);if(!refreshed||!refreshed.access_token)return null;const u=await supabase('/auth/v1/user',{token:refreshed.access_token});return u.ok&&u.data&&u.data.id?{token:refreshed.access_token,user:u.data}:null;}

async function savedProducts(auth){
  if(!auth)return [];
  const id=encodeURIComponent(auth.user.id),r=await supabase(`/rest/v1/apg_workspace_items?user_id=eq.${id}&item_type=eq.saved_product&select=item_key,payload,updated_at&order=updated_at.desc`,{token:auth.token});
  if(!r.ok||!Array.isArray(r.data))return [];
  const seen=new Set(),out=[];for(const row of r.data){const slug=String(row&&row.item_key||row&&row.payload&&row.payload.slug||'').trim();if(!slug||seen.has(slug)||!core.PRODUCT_BY_SLUG.has(slug))continue;seen.add(slug);out.push({slug,updatedAt:row.updated_at||null});if(out.length>=50)break;}return out;
}
async function accountContext(auth,includeSaved=true){const saved=includeSaved?await savedProducts(auth):[];return {authenticated:!!auth,displayName:auth?core.displayName(auth.user):null,savedCount:saved.length,savedProducts:saved};}
function publicAccount(account){return {authenticated:!!account.authenticated,displayName:account.displayName||null,savedCount:Number(account.savedCount)||0};}

function socialResponse(text){
  const value=String(text||'').toLowerCase();
  const socialIntent=/(linkedin|instagram|threads|facebook|pinterest|social media|social profiles|social channels|where can i follow|follow apg|follow australian product guide|twitter|on x\b|x account|x profile)/i.test(value);
  if(!socialIntent)return null;
  let key=null;
  if(/linkedin/.test(value))key='linkedin';
  else if(/instagram/.test(value))key='instagram';
  else if(/threads/.test(value))key='threads';
  else if(/facebook/.test(value))key='facebook';
  else if(/pinterest/.test(value))key='pinterest';
  else if(/twitter|on x\b|x account|x profile/.test(value))key='x';
  if(key){
    const item=socials.socialProfiles[key];
    if(item&&item.verified&&item.url)return {intent:'apg_social',message:`Yes — Australian Product Guide is on ${item.platform}${item.handle?` as ${item.handle}`:''}.`,actions:[{label:`Open APG on ${item.platform}`,url:item.url,kind:'link',primary:true}]};
    if(item&&item.active)return {intent:'apg_social',message:`Australian Product Guide has an active ${item.platform} presence, but its exact public Page URL is still being independently verified before APG publishes an outbound link. The verified social links are available in the APG website footer.`,actions:[{label:'About APG',url:'/about/#follow-apg',kind:'link',primary:true}]};
  }
  const names=socials.verifiedEntries().map(item=>item.platform);
  return {intent:'apg_social',message:`Australian Product Guide currently has verified public links for ${names.join(', ')}. Facebook is also active, with its exact public Page URL still pending independent verification. You can use the official links in the APG website footer.`,actions:[{label:'About APG','url':'/about/#follow-apg',kind:'link',primary:true}]};
}

async function mutateSaved(auth,action,slug){
  if(!auth)return {ok:false,status:401,error:'Sign in to save products to My APG.'};
  const p=core.PRODUCT_BY_SLUG.get(String(slug||''));if(!p)return {ok:false,status:400,error:'That product is not in the maintained APG catalogue.'};
  const userId=auth.user.id,itemKey=p.slug;
  if(action==='save'){
    const row={user_id:userId,item_type:'saved_product',item_key:itemKey,payload:{slug:itemKey},updated_at:new Date().toISOString()};
    const r=await supabase('/rest/v1/apg_workspace_items?on_conflict=user_id,item_type,item_key',{method:'POST',token:auth.token,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[row]});
    return r.ok?{ok:true,product:p}:{ok:false,status:502,error:'I could not save that product just now. My APG was not changed.'};
  }
  if(action==='remove'){
    const q=`/rest/v1/apg_workspace_items?user_id=eq.${encodeURIComponent(userId)}&item_type=eq.saved_product&item_key=eq.${encodeURIComponent(itemKey)}`;
    const r=await supabase(q,{method:'DELETE',token:auth.token,headers:{Prefer:'return=minimal'}});
    return r.ok?{ok:true,product:p}:{ok:false,status:502,error:'I could not remove that saved product just now. My APG was not changed.'};
  }
  return {ok:false,status:400,error:'Unsupported Scout account action.'};
}

function inject(html){
  let out=String(html||'');
  if(!out.includes('data-scout-v5="true"'))out=out.replace(/<body\b([^>]*)>/i,'<body data-scout-v5="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  return out;
}

async function handleScoutApi(req,res){
  if(req.method!=='GET'&&req.method!=='POST')return sendJson(res,405,{error:'Method not allowed.'});
  if(req.method==='POST'&&!allowedOrigin(req))return sendJson(res,403,{error:'Request origin not allowed.'});
  try{
    if(req.method==='GET'){
      const auth=await authContext(req,res),account=await accountContext(auth,true);
      return sendJson(res,200,{version:core.VERSION,account:publicAccount(account),privacy:{chatTranscriptPersisted:false,structuredDecisionStateSessionOnly:true},capabilities:['product-search','recommendation','comparison','product-facts','retailers','amazon-au','site-navigation','apg-knowledge','official-social-profiles','authenticated-saved-products']});
    }
    const body=await readJson(req),text=String(body.text||'').trim();if(!text||text.length>2000)return sendJson(res,400,{error:'Ask Scout a question of up to 2,000 characters.'});
    const pageContext=core.validatePageContext(body.pageContext||{}),social=socialResponse(text);
    if(social)return sendJson(res,200,{version:core.VERSION,pageContext,...social});
    const intent=core.classifyIntent(text,pageContext),needsAccount=ACCOUNT_SENSITIVE_INTENTS.has(intent);
    const auth=needsAccount?await authContext(req,res):null,includeSaved=intent==='saved_products'||intent==='save_product'||intent==='remove_saved_product';
    const account=needsAccount?await accountContext(auth,includeSaved):{authenticated:false,displayName:null,savedCount:0,savedProducts:[]};
    let result=core.buildResponse({text,pageContext,decisionState:body.decisionState,references:body.references,account});
    result=amazon.apply(core,text,pageContext,body.references,result);
    if(result.accountAction){
      if(!auth){result={...result,message:'You’ll need to sign in before I can change saved products in My APG. You can keep comparing products here without an account.',accountAction:null,actions:[{label:'Log in',url:'/my-apg/?account=login',kind:'link',primary:true},{label:'Keep shopping',url:'/categories/',kind:'link',primary:false}]};}
      else{
        const change=await mutateSaved(auth,result.accountAction.action,result.accountAction.slug);
        if(!change.ok)return sendJson(res,change.status||502,{error:change.error});
        const refreshed=await accountContext(auth,true),verb=result.accountAction.action==='save'?'added to':'removed from';
        result={...result,message:`Done — ${change.product.brand} ${change.product.name} has been ${verb} My APG.`,accountAction:null,products:[core.card(change.product)],references:[change.product.slug],actions:[{label:'Open My APG',url:'/my-apg/',kind:'link',primary:true}],account:publicAccount(refreshed)};
      }
    }else if(intent==='saved_products')result.account=publicAccount(account);
    return sendJson(res,200,result);
  }catch(err){return sendJson(res,500,{error:'Scout could not complete that request safely. Please try again or use APG Search / Decision Lab.'});}
}

async function handler(req,res){
  let path='/';try{path=new URL(req.url,PRIMARY_ORIGIN).pathname}catch{}
  if(path===API_PATH)return handleScoutApi(req,res);
  if(path==='/assets/assistant.js')return sendAsset(res,'application/javascript; charset=utf-8',client.js);
  if(path===CSS_PATH)return sendAsset(res,'text/css; charset=utf-8',client.css+'\n'+brand.css);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length');}res.setHeader('X-APG-Scout','scout-concierge-v5');}
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{VERSION,API_PATH,CSS_PATH,ACCOUNT_SENSITIVE_INTENTS,inject,authContext,savedProducts,accountContext,publicAccount,socialResponse,mutateSaved,handleScoutApi,core,client,brand,amazon,socials});
module.exports=handler;
