'use strict';

// Read-only Production QA endpoint for APG's governed brand identity system.
// Returns metadata only: no secrets, no image bytes and no user data.
// It exists so releases can verify the complete 178-brand catalogue instead of
// relying on screenshots or a handful of spot checks.
const resolver=require('../lib/brand-mark-complete-v67');
const {brands,slugify}=require('../lib/routes');

const AUDIT_VERSION='1.1';
const MAX_BATCH=20;

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
  return {
    source:'curated-reviewed-vector-override',
    kind:'curated-reviewed-vector',
    quality:'premium-vector',
    reference:item.officialReference||null,
    presentation:null,
    fallback:false
  };
}

async function probeLowOfficialIcon(slug){
  const domain=resolver.officialDomains&&resolver.officialDomains[slug];
  if(!domain)return {available:false,reason:'no-governed-domain'};
  const page=`https://${domain}/`;
  const iconUrl='https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&drop_404_icon=true&check_seen=true&size=128&min_size=16&max_size=256&fallback_opts=TYPE,SIZE,URL&url='+encodeURIComponent(page);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
  try{
    const response=await fetch(iconUrl,{redirect:'follow',signal:controller.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/png,image/webp,image/jpeg,image/*,*/*;q=0.2'}});
    if(!response.ok)return {available:false,status:response.status,reason:'not-found'};
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!type.startsWith('image/'))return {available:false,status:response.status,reason:'not-image',type};
    const buffer=Buffer.from(await response.arrayBuffer());
    if(!buffer.length)return {available:false,status:response.status,reason:'empty-image'};
    const meta=typeof resolver.dimensions==='function'?(resolver.dimensions(buffer,type)||{}):{};
    return {available:true,status:response.status,type,width:Number(meta.width||0)||null,height:Number(meta.height||0)||null,bytes:buffer.length};
  }catch(error){
    return {available:false,reason:'probe-error',error:String(error&&error.message||error)};
  }finally{clearTimeout(timer);}
}

async function inspectBrand(name,probeLow){
  const slug=slugify(name);
  const curated=curatedMetadata(slug);
  if(curated)return {brand:name,slug,...curated};
  try{
    const image=await resolver.resolveCompleteBrandMark(slug);
    const base=!image
      ? {brand:name,slug,source:'unresolved',kind:null,quality:null,reference:null,presentation:null,fallback:true}
      : {
          brand:name,
          slug,
          source:image.resolverSource||'unknown',
          kind:image.assetKind||null,
          quality:image.quality||null,
          reference:image.officialReference||null,
          presentation:image.presentation||null,
          fallback:Boolean(image.terminalFallback||image.resolverSource==='canonical-brand-name-fallback'||image.assetKind==='canonical-brand-name')
        };
    if(probeLow&&base.fallback)base.lowOfficialIcon=await probeLowOfficialIcon(slug);
    return base;
  }catch(error){
    const base={brand:name,slug,source:'audit-error',kind:null,quality:null,reference:null,presentation:null,fallback:true,error:String(error&&error.message||error)};
    if(probeLow)base.lowOfficialIcon=await probeLowOfficialIcon(slug);
    return base;
  }
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){
    res.setHeader('Allow','GET');
    return json(res,405,{error:'Method not allowed'});
  }
  let url;
  try{url=new URL(req.url,'https://australianproductguide.au');}catch{return json(res,400,{error:'Invalid request URL'});}
  const offset=Math.max(0,Math.min(brands.length,Number.parseInt(url.searchParams.get('offset')||'0',10)||0));
  const requested=Number.parseInt(url.searchParams.get('limit')||String(MAX_BATCH),10)||MAX_BATCH;
  const limit=Math.max(1,Math.min(MAX_BATCH,requested));
  const probeLow=url.searchParams.get('probeLow')==='1';
  const slice=brands.slice(offset,offset+limit);
  const results=await Promise.all(slice.map(name=>inspectBrand(name,probeLow)));
  const fallbacks=results.filter(item=>item.fallback);
  const sources={};
  for(const item of results)sources[item.source]=(sources[item.source]||0)+1;
  const lowAvailable=fallbacks.filter(item=>item.lowOfficialIcon&&item.lowOfficialIcon.available);
  return json(res,200,{
    auditVersion:AUDIT_VERSION,
    brandMarkVersion:resolver.BRAND_MARK_COMPLETE_VERSION||null,
    totalCanonicalBrands:brands.length,
    offset,
    limit,
    returned:results.length,
    nextOffset:offset+results.length<brands.length?offset+results.length:null,
    sourceCounts:sources,
    fallbackCount:fallbacks.length,
    fallbackSlugs:fallbacks.map(item=>item.slug),
    lowOfficialIconAvailableCount:probeLow?lowAvailable.length:null,
    lowOfficialIconAvailableSlugs:probeLow?lowAvailable.map(item=>item.slug):null,
    results
  });
};
