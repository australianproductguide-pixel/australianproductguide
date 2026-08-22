'use strict';

// Read-only Production QA endpoint for APG's governed brand identity system.
// Returns metadata only: no secrets, no image bytes and no user data.
// It verifies all 178 canonical brands against the current outer completion layer and
// distinguishes unresolved fallbacks from deliberate rights/policy fallbacks.
const resolver=require('../lib/brand-mark-official-completion-v69');
const {brands,slugify}=require('../lib/routes');

const AUDIT_VERSION='1.4';
const MAX_BATCH=20;
const DEBUG_HTML_LIMIT=640*1024;

function json(res,status,payload){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Audit','v'+AUDIT_VERSION);
  return res.end(JSON.stringify(payload));
}
function curatedMetadata(slug){
  const item=resolver.curatedBrandMarkOverrides&&resolver.curatedBrandMarkOverrides[slug];
  if(!item)return null;
  return {source:'curated-reviewed-vector-override',kind:'curated-reviewed-vector',quality:'premium-vector',reference:item.officialReference||null,sourceUrl:item.assetUrl||null,presentation:null,fallback:false,policyFallback:false};
}
async function inspectBrand(name){
  const slug=slugify(name),curated=curatedMetadata(slug);
  if(curated)return {brand:name,slug,...curated};
  try{
    const image=await resolver.resolveCompleteBrandMark(slug);
    if(!image)return {brand:name,slug,source:'unresolved',kind:null,quality:null,reference:null,sourceUrl:null,presentation:null,fallback:true,policyFallback:false};
    const fallback=Boolean(image.terminalFallback||image.resolverSource==='canonical-brand-name-fallback'||image.resolverSource==='brand-name-policy-fallback'||image.assetKind==='canonical-brand-name');
    const policyFallback=Boolean(image.intentionalPolicyFallback||image.resolverSource==='brand-name-policy-fallback');
    return {
      brand:name,slug,source:image.resolverSource||'unknown',kind:image.assetKind||null,quality:image.quality||null,
      reference:image.officialReference||null,sourceUrl:image.source||null,presentation:image.presentation||null,
      fallback,policyFallback,policyReason:image.policyReason||null,policyReference:image.policyReference||null
    };
  }catch(error){return {brand:name,slug,source:'audit-error',kind:null,quality:null,reference:null,sourceUrl:null,presentation:null,fallback:true,policyFallback:false,error:String(error&&error.message||error)};}
}
async function debugOfficialCandidates(slug){
  const domain=resolver.officialDomains&&resolver.officialDomains[slug];
  if(!domain||typeof resolver.explicitLogoCandidates!=='function')return {domain:domain||null,pageUrl:null,status:null,candidates:[]};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
  try{
    const response=await fetch(`https://${domain}/`,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'text/html,application/xhtml+xml'}});
    if(!response.ok)return {domain,pageUrl:response.url||`https://${domain}/`,status:response.status,candidates:[]};
    const text=(await response.text()).slice(0,DEBUG_HTML_LIMIT);
    return {domain,pageUrl:response.url||`https://${domain}/`,status:response.status,candidates:resolver.explicitLogoCandidates(text,response.url||`https://${domain}/`).map(item=>({url:item.url,kind:item.kind,score:item.score}))};
  }catch(error){return {domain,pageUrl:null,status:null,candidates:[],error:String(error&&error.message||error)};}finally{clearTimeout(timer);}
}
module.exports=async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return json(res,405,{error:'Method not allowed'});}
  let url;try{url=new URL(req.url,'https://australianproductguide.au');}catch{return json(res,400,{error:'Invalid request URL'});}
  const offset=Math.max(0,Math.min(brands.length,Number.parseInt(url.searchParams.get('offset')||'0',10)||0));
  const requested=Number.parseInt(url.searchParams.get('limit')||String(MAX_BATCH),10)||MAX_BATCH;
  const limit=Math.max(1,Math.min(MAX_BATCH,requested));
  const debug=url.searchParams.get('debug')==='1';
  const slice=brands.slice(offset,offset+limit),results=await Promise.all(slice.map(inspectBrand));
  const fallbacks=results.filter(item=>item.fallback),policyFallbacks=fallbacks.filter(item=>item.policyFallback),unresolved=fallbacks.filter(item=>!item.policyFallback);
  if(debug)await Promise.all(unresolved.map(async item=>{item.officialCandidateDebug=await debugOfficialCandidates(item.slug);}));
  const sources={};for(const item of results)sources[item.source]=(sources[item.source]||0)+1;
  return json(res,200,{
    auditVersion:AUDIT_VERSION,
    brandMarkVersion:resolver.BRAND_MARK_OFFICIAL_COMPLETION_VERSION||resolver.BRAND_MARK_COMPLETION_VERSION||resolver.BRAND_MARK_COMPLETE_VERSION||null,
    totalCanonicalBrands:brands.length,offset,limit,returned:results.length,nextOffset:offset+results.length<brands.length?offset+results.length:null,
    sourceCounts:sources,
    fallbackCount:fallbacks.length,fallbackSlugs:fallbacks.map(item=>item.slug),
    policyFallbackCount:policyFallbacks.length,policyFallbackSlugs:policyFallbacks.map(item=>item.slug),
    unresolvedFallbackCount:unresolved.length,unresolvedFallbackSlugs:unresolved.map(item=>item.slug),
    results
  });
};
