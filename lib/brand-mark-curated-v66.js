'use strict';

// APG Brand Mark Curated v66
// Outermost delivery layer for specifically reviewed problem brand marks. Five brands
// that remained visibly grainy under automatic discovery receive a curated SVG override.
// All other brands pass through unchanged to Brand Mark Quality v65.
const downstream=require('./brand-mark-quality-v65');
const overrides=require('../data/brand-mark-curated-overrides-v66');

const BRAND_MARK_CURATED_VERSION='66.0';
const ORIGIN='https://australianproductguide.au';
const FETCH_TIMEOUT_MS=3000;
const MAX_SVG_BYTES=512*1024;
const CACHE_TTL_MS=7*24*60*60*1000;
const NEGATIVE_CACHE_TTL_MS=10*60*1000;
const cache=new Map();

function getCached(slug){
  const hit=cache.get(slug);
  if(!hit||hit.expiresAt<Date.now()){
    if(hit)cache.delete(slug);
    return undefined;
  }
  return hit.value;
}
function setCached(slug,value){
  cache.set(slug,{value,expiresAt:Date.now()+(value?CACHE_TTL_MS:NEGATIVE_CACHE_TTL_MS)});
}
function svgDimensions(text){
  const vb=String(text||'').match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if(vb)return {width:Math.round(Number(vb[1]))||null,height:Math.round(Number(vb[2]))||null};
  const w=parseFloat((String(text||'').match(/\bwidth=["']([\d.]+)/i)||[])[1]);
  const h=parseFloat((String(text||'').match(/\bheight=["']([\d.]+)/i)||[])[1]);
  return {width:Number.isFinite(w)?Math.round(w):null,height:Number.isFinite(h)?Math.round(h):null};
}
function looksLikeSvg(buffer){
  const text=buffer.toString('utf8',0,Math.min(buffer.length,128*1024));
  if(!/<svg\b/i.test(text)||buffer.length<120)return null;
  return {text,...svgDimensions(text)};
}
async function fetchCurated(slug){
  const cached=getCached(slug);
  if(cached!==undefined)return cached;
  const item=overrides[slug];
  if(!item)return null;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
  try{
    const response=await fetch(item.assetUrl,{
      redirect:'follow',signal:controller.signal,
      headers:{
        'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)',
        'Accept':'image/svg+xml,image/*;q=0.8,*/*;q=0.2'
      }
    });
    if(!response.ok){setCached(slug,null);return null;}
    const length=Number(response.headers.get('content-length')||0);
    if(length>MAX_SVG_BYTES){setCached(slug,null);return null;}
    const buffer=Buffer.from(await response.arrayBuffer());
    if(!buffer.length||buffer.length>MAX_SVG_BYTES){setCached(slug,null);return null;}
    const svg=looksLikeSvg(buffer);
    if(!svg){setCached(slug,null);return null;}
    const value={
      buffer,type:'image/svg+xml',quality:'premium-vector',assetKind:'curated-reviewed-vector',
      source:response.url||item.assetUrl,width:svg.width,height:svg.height,metadata:item
    };
    setCached(slug,value);
    return value;
  }catch{
    setCached(slug,null);return null;
  }finally{clearTimeout(timer);}
}
async function serveCurated(req,res,slug){
  const image=await fetchCurated(slug);
  if(!image)return downstream(req,res);
  res.statusCode=200;
  res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Brand-Mark-Source','curated-reviewed-vector-override');
  res.setHeader('X-APG-Brand-Mark-Quality','premium-vector');
  res.setHeader('X-APG-Brand-Mark-Asset-Kind','curated-reviewed-vector');
  res.setHeader('X-APG-Brand-Mark-Curated','v'+BRAND_MARK_CURATED_VERSION);
  res.setHeader('X-APG-Brand-Mark-Reference',image.metadata.officialReference);
  if(image.width&&image.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${image.width}x${image.height}`);
  res.setHeader('Content-Length',String(image.buffer.length));
  if(req.method==='HEAD')return res.end();
  return res.end(image.buffer);
}
function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const match=path.match(/^\/assets\/brand-marks\/([^/]+)$/i);
  if(match){
    let slug='';try{slug=decodeURIComponent(match[1])}catch{}
    res.setHeader('X-APG-Brand-Mark-Curated-Layer','v'+BRAND_MARK_CURATED_VERSION);
    if((req.method==='GET'||req.method==='HEAD')&&overrides[slug])return serveCurated(req,res,slug);
  }
  res.setHeader('X-APG-Brand-Mark-Curated-Layer','v'+BRAND_MARK_CURATED_VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{BRAND_MARK_CURATED_VERSION,curatedBrandMarkOverrides:overrides,fetchCurated,serveCurated});
module.exports=handler;
