'use strict';

// APG Cross-Surface Product Imagery v33.1.
// Hardened identity association: a governed image is attached to a presentation surface only
// after that surface is first bound to its canonical maintained product. Mapping availability is
// checked second. This prevents a nearby mapped product from leaking into an unmapped sibling card.
// All image eligibility remains delegated to the v3 continuity/exact-model guard.

const base=require('./cross-surface-product-imagery-v33-runtime');

const VERSION='33.1';
const CSS_PATH=base.CSS_PATH;
const JS_PATH=base.JS_PATH;
const API_PATH=base.API_PATH;
const PRODUCT_MAP=base.PRODUCT_MAP;
const CSS=base.CSS;
const JS=base.JS.replace(/33\.0/g,VERSION);

function clean(value){return String(value==null?'':value).trim();}
function plainText(value){return String(value||'').replace(/&amp;/gi,'&').replace(/&#39;|&#x27;/gi,"'").replace(/&quot;/gi,'"').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().toLowerCase();}
function productLabel(slug){const p=PRODUCT_MAP.get(slug);return p?clean(`${p.brand||''} ${p.name||''}`):slug;}
function distanceToRange(index,start,end){return Math.min(Math.abs(index-start),Math.abs(index-end));}

function containingArticleBounds(source,start,end){
  const open=source.lastIndexOf('<article',start),previousClose=source.lastIndexOf('</article>',start);
  if(open<0||open<previousClose)return null;
  const close=source.indexOf('</article>',end);
  if(close<0||close-open>30000)return null;
  return {start:open,end:close+'</article>'.length};
}
function choosePlaceholderSlug(source,start,end,occurrences){
  const article=containingArticleBounds(source,start,end);
  if(article){
    const inside=[...new Set(occurrences.filter(x=>x.index>=article.start&&x.index<=article.end).map(x=>x.slug))];
    if(inside.length===1)return inside[0];
  }

  // Non-article surfaces (for example compact comparison cells) use a deliberately tight local
  // identity window. Mapping eligibility is NOT considered here: identity must be established
  // before availability of an image can influence presentation.
  const localStart=Math.max(0,start-1400),localEnd=Math.min(source.length,end+1400);
  const localText=plainText(source.slice(localStart,localEnd));
  const candidates=occurrences
    .filter(x=>x.index>=start-3500&&x.index<=end+3500)
    .map(x=>{
      const p=PRODUCT_MAP.get(x.slug);if(!p)return null;
      const name=clean(p.name).toLowerCase(),full=productLabel(x.slug).toLowerCase();
      const named=Boolean((full&&localText.includes(full))||(name&&localText.includes(name)));
      return {...x,named,distance:distanceToRange(x.index,start,end)};
    })
    .filter(Boolean)
    .sort((a,b)=>Number(b.named)-Number(a.named)||a.distance-b.distance);
  if(!candidates.length||!candidates[0].named)return null;
  if(candidates.length>1&&candidates[1].named&&candidates[1].distance===candidates[0].distance&&candidates[1].slug!==candidates[0].slug)return null;
  return candidates[0].slug;
}

function replaceBrandPlaceholders(html,mappings){
  const source=String(html||'');
  if(!source.includes('apg-product-brand-placeholder')||!mappings?.size)return source;
  const occurrences=base.slugOccurrences(source);let cursor=0,out='';
  const re=/<div\b[^>]*class=["'][^"']*\bapg-product-brand-placeholder\b[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;let match;
  while((match=re.exec(source))){
    out+=source.slice(cursor,match.index);
    const slug=choosePlaceholderSlug(source,match.index,re.lastIndex,occurrences);
    out+=slug&&mappings.has(slug)?base.photoMarkup(slug,mappings.get(slug)):match[0];
    cursor=re.lastIndex;
  }
  return out+source.slice(cursor);
}
function injectAssets(html){
  let out=String(html||'');
  if(out.includes('name="apg-cross-surface-product-imagery"'))return out;
  return out.replace('</head>',`<meta name="apg-cross-surface-product-imagery" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"><script src="${JS_PATH}?v=${VERSION}" defer></script></head>`);
}
function decorateHtml(html,mappings){
  return injectAssets(base.enrichProductArticles(replaceBrandPlaceholders(html,mappings),mappings));
}
function publicImage(slug,row){return {slug,url:row.imageUrl,alt:productLabel(slug),verifiedAt:row.observedAt,source:'governed-exact-retailer-image',recommendationWeight:0};}
function decorateSearchPayload(payload,mappings){
  if(!payload||typeof payload!=='object')return payload;
  if(mappings?.size){
    for(const key of ['products','closestProducts'])if(Array.isArray(payload[key]))payload[key]=payload[key].map(p=>p&&mappings.has(p.slug)?{...p,presentationImage:publicImage(p.slug,mappings.get(p.slug))}:p);
    if(payload.directCompare){for(const key of ['a','b']){const p=payload.directCompare[key];if(p&&mappings.has(p.slug))payload.directCompare[key]={...p,presentationImage:publicImage(p.slug,mappings.get(p.slug))};}}
    if(typeof payload.bodyHtml==='string')payload.bodyHtml=decorateHtml(payload.bodyHtml,mappings);
  }
  payload.crossSurfaceProductImagery={version:VERSION,commercialRecommendationWeight:0};
  return payload;
}
async function apiPayload(url,options={}){
  const payload=await base.apiPayload(url,options);
  return {...payload,version:VERSION,commercialRecommendationWeight:0};
}

function sendAsset(req,res,path){
  const isJs=path===JS_PATH,body=isJs?JS:CSS;
  res.statusCode=200;
  res.setHeader('Content-Type',isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);
  return res.end(req.method==='HEAD'?'':body);
}
async function sendApi(req,res,url){
  if(!['GET','HEAD'].includes(req.method||'GET')){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
  try{
    const payload=await apiPayload(url);
    res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);
    return res.end(req.method==='HEAD'?'':JSON.stringify(payload));
  }catch{
    res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
    return res.end(req.method==='HEAD'?'':JSON.stringify({version:VERSION,commercialRecommendationWeight:0,images:[],queryImages:{},status:'temporarily-unavailable'}));
  }
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Cross-surface product imagery v33.1 requires downstream handler');
  function handler(req,res){
    let url;try{url=new URL(req.url||'/','https://australianproductguide.au')}catch{url=new URL('/','https://australianproductguide.au')}
    if(url.pathname===CSS_PATH||url.pathname===JS_PATH)return sendAsset(req,res,url.pathname);
    if(url.pathname===API_PATH)return sendApi(req,res,url);

    const originalEnd=res.end.bind(res),originalWrite=typeof res.write==='function'?res.write.bind(res):null,chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));
      if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const body=Buffer.concat(chunks).toString('utf8'),type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'').toLowerCase();
      const finish=next=>{if(next!==body&&typeof res.removeHeader==='function')res.removeHeader('Content-Length');res.setHeader('X-APG-Cross-Surface-Product-Imagery','v'+VERSION);return originalEnd(next,'utf8',cb);};
      if(req.method==='HEAD')return finish(body);

      if(type.startsWith('application/json')&&url.pathname==='/search/'){
        let payload;try{payload=JSON.parse(body)}catch{return finish(body)}
        const slugs=base.uniqueSlugs([...(payload.products||[]).map(p=>p?.slug),...(payload.closestProducts||[]).map(p=>p?.slug),payload.directCompare?.a?.slug,payload.directCompare?.b?.slug]);
        base.currentMappings(slugs).then(mappings=>finish(JSON.stringify(decorateSearchPayload(payload,mappings)))).catch(()=>finish(body));
        return res;
      }

      const isHtml=type.startsWith('text/html')||/<html|<!doctype/i.test(body);if(!isHtml)return finish(body);
      const slugs=base.collectProductSlugs(body);
      base.currentMappings(slugs).then(mappings=>{base.patchResponseCsp(res);finish(decorateHtml(body,mappings));}).catch(()=>{base.patchResponseCsp(res);finish(injectAssets(body));});
      return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CROSS_SURFACE_PRODUCT_IMAGERY_VERSION:VERSION});
  return handler;
}
function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('Cross-surface product imagery v33.1 install requires a wrapper module');
  if(target.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V331_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return wrap(original(downstream));};
  target.__APG_CROSS_SURFACE_PRODUCT_IMAGERY_V331_INSTALLED=true;
  return target;
}

module.exports={...base,VERSION,CSS,JS,containingArticleBounds,choosePlaceholderSlug,replaceBrandPlaceholders,injectAssets,decorateHtml,publicImage,decorateSearchPayload,apiPayload,wrap,install};
