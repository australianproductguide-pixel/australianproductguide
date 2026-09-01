'use strict';

// APG governed product-card imagery v1.4.
// Reuses the existing exact-model governed image registry across maintained product-result surfaces.
// Home is deliberately ineligible before any response interception. Image availability remains
// presentation-only and contributes zero recommendation weight.
const {products}=require('../data');
const continuity=require('./ebay-product-image-continuity-v3-runtime');
const supabase=require('./apg-supabase-public-v1');

const VERSION='1.4';
const STYLE_HREF='/assets/governed-product-card-imagery-v1.css';
const ORIGIN='https://australianproductguide.au';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const CARD_CLASSES=new Set(['product-card','feature-card','apg112-product-card','comparison-card','compare-card','result-card','search-result-card','decision-result-card','winner-card']);

function clean(value){return String(value==null?'':value).trim();}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function eligiblePath(pathname){
  const path=clean(pathname);
  return /^\/categories\/[a-z0-9][a-z0-9-]{1,160}\/(?:finder\/)?$/.test(path)||
    /^\/compare\/(?:.*)?$/.test(path)||path==='/search/'||path==='/search'||path==='/decision-lab/'||path==='/decision-lab';
}
function productSlugsInHtml(html){
  const found=[];const seen=new Set();const pattern=/href=["']\/products\/([a-z0-9][a-z0-9-]{1,160})\/["']/gi;
  let match;while((match=pattern.exec(String(html||'')))){const slug=match[1];if(PRODUCT_MAP.has(slug)&&!seen.has(slug)){seen.add(slug);found.push(slug);}}
  return found;
}
function ensureStyle(html){const out=String(html||'');if(out.includes(STYLE_HREF))return out;return out.replace(/<\/head>/i,`<link rel="stylesheet" href="${STYLE_HREF}?v=${VERSION}"></head>`);}
function imageLinkMarkup(slug,row){
  const product=PRODUCT_MAP.get(slug);if(!product)return '';
  const label=product.brand?`${product.brand} ${product.name}`:product.name;
  return `<a class="apg-governed-product-image-v1" data-apg-governed-product-image="v${VERSION}" data-apg-governed-product-slug="${esc(slug)}" href="/products/${esc(slug)}/" aria-label="View ${esc(label)} product profile"><span class="apg-governed-product-image-v1__media"><img class="apg-governed-product-image-v1__img" src="${esc(row.imageUrl)}" alt="${esc(label)}" width="320" height="320" loading="lazy" decoding="async"></span><span class="apg-governed-product-image-v1__source">Verified exact-model retailer image</span></a>`;
}
function hasCardClass(openingTag){const match=String(openingTag||'').match(/\bclass=["']([^"']+)["']/i);if(!match)return false;return match[1].split(/\s+/).some(name=>CARD_CLASSES.has(name));}
function nearestCardOpening(html,anchorIndex){const prefix=String(html||'').slice(0,anchorIndex);const tag=/<(?:article|li|div)\b[^>]*>/gi;let match,last=null;while((match=tag.exec(prefix))){if(hasCardClass(match[0]))last={index:match.index,end:tag.lastIndex,tag:match[0]};}return last;}
function productVisualBounds(html,anchorIndex){
  const source=String(html||'');const prefix=source.slice(0,anchorIndex);const re=/<div\b[^>]*class=["'][^"']*\bproduct-visual\b[^"']*["'][^>]*>/gi;let match,last=null;
  while((match=re.exec(prefix)))last={index:match.index,end:re.lastIndex,tag:match[0]};
  if(!last)return null;let depth=1;const token=/<div\b[^>]*>|<\/div>/gi;token.lastIndex=last.end;let part;
  while((part=token.exec(source))){if(/^<div\b/i.test(part[0]))depth++;else depth--;if(depth===0)return {start:last.index,end:token.lastIndex};}
  return null;
}
function injectForProduct(html,slug,row){
  const out=String(html||'');if(out.includes(`data-apg-governed-product-slug="${slug}"`))return out;
  const escapedSlug=slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const anchor=new RegExp(`<a\\b[^>]*href=["']\\/products\\/${escapedSlug}\\/["'][^>]*>`,'i');const match=anchor.exec(out);if(!match)return out;
  const markup=imageLinkMarkup(slug,row);if(!markup)return out;
  const visual=productVisualBounds(out,match.index);if(visual)return out.slice(0,visual.start)+markup+out.slice(visual.end);
  const card=nearestCardOpening(out,match.index);if(card)return out.slice(0,card.end)+markup+out.slice(card.end);
  return out.slice(0,match.index)+markup+out.slice(match.index);
}
function mappingFromState(slug,state,now){const row=continuity.stateToMapping(state);return continuity.guardEligible(slug,row,now)?row:null;}
async function governedMappings(slugs,options={}){
  const now=typeof options.now==='function'?Number(options.now()):Date.now();
  if(typeof options.fetchStates==='function'){
    const rows=await options.fetchStates(slugs);return new Map((rows||[]).map(state=>[clean(state.slug),mappingFromState(clean(state.slug),state,now)]));
  }
  const resolved=new Map();
  try{
    const rows=await supabase.imageStates(slugs,{timeoutMs:1800});const bySlug=new Map(rows.map(state=>[clean(state.slug),state]));
    for(const slug of slugs){const row=mappingFromState(slug,bySlug.get(slug),now);if(row)resolved.set(slug,row);}
  }catch{}
  // Batch reads are preferred, but a missing/partial batch row must not suppress a known-good
  // governed state. Resolve only unresolved slugs through the already-hardened continuity reader.
  const unresolved=slugs.filter(slug=>!resolved.has(slug));
  if(unresolved.length){
    const fallback=await Promise.all(unresolved.map(async slug=>{try{return [slug,await continuity.currentMapping(slug,options)];}catch{return [slug,null];}}));
    for(const [slug,row] of fallback)if(row)resolved.set(slug,row);
  }
  return resolved;
}
async function inject(html,pathname,options={}){
  const original=String(html||'');
  if(!eligiblePath(pathname)||!original||!/<html|<!doctype/i.test(original))return {html:original,usedGovernedImages:false,reason:'inactive-route',slugs:[],matchedSlugs:0,mappedSlugs:0};
  const slugs=productSlugsInHtml(original);if(!slugs.length)return {html:original,usedGovernedImages:false,reason:'no-product-links',slugs:[],matchedSlugs:0,mappedSlugs:0};
  const mappings=await governedMappings(slugs,options);let out=original;const used=[];
  for(const slug of slugs){const row=mappings.get(slug);if(!row)continue;const next=injectForProduct(out,slug,row);if(next!==out){out=next;used.push(slug);}}
  if(!used.length)return {html:original,usedGovernedImages:false,reason:mappings.size?'mapped-images-not-injected':'no-current-governed-image-state',slugs:[],matchedSlugs:slugs.length,mappedSlugs:mappings.size};
  return {html:ensureStyle(out),usedGovernedImages:true,reason:'governed-exact-model-product-card-imagery',slugs:used,matchedSlugs:slugs.length,mappedSlugs:mappings.size};
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('governed product-card imagery wrapper requires downstream handler');
  function handler(req,res){
    let pathname='/';try{pathname=new URL(req&&req.url||'/',ORIGIN).pathname;}catch{}
    if(!eligiblePath(pathname))return downstream(req,res);
    const originalEnd=res.end.bind(res);const originalWrite=typeof res.write==='function'?res.write.bind(res):null;const chunks=[];
    if(originalWrite)res.write=function(chunk,encoding,cb){if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(typeof cb==='function')cb();return true;};
    res.end=function(chunk,encoding,cb){
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),encoding));if(!chunks.length)return originalEnd(chunk,encoding,cb);
      const source=Buffer.concat(chunks).toString('utf8');const type=String((typeof res.getHeader==='function'&&res.getHeader('Content-Type'))||'');const isHtml=/text\/html/i.test(type)||/<html|<!doctype/i.test(source);
      if(req.method==='HEAD'||res.statusCode!==200||!isHtml)return originalEnd(source,'utf8',cb);
      inject(source,pathname).then(result=>{
        if(typeof res.setHeader==='function'){
          res.setHeader('X-APG-Governed-Product-Card-Imagery','v'+VERSION);
          res.setHeader('X-APG-Governed-Product-Card-Reason',result.reason);
          res.setHeader('X-APG-Governed-Product-Links',String(result.matchedSlugs||0));
          res.setHeader('X-APG-Governed-Product-Mappings',String(result.mappedSlugs||0));
          res.setHeader('X-APG-Governed-Product-Card-Images',String(result.slugs.length));
        }
        if(result.usedGovernedImages){continuity.patchResponseCsp(res);if(typeof res.removeHeader==='function')res.removeHeader('Content-Length');}
        return originalEnd(result.html,'utf8',cb);
      }).catch(()=>originalEnd(source,'utf8',cb));return res;
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{GOVERNED_PRODUCT_CARD_IMAGERY_VERSION:VERSION,GOVERNED_PRODUCT_CARD_IMAGERY_STYLE:STYLE_HREF,eligibleGovernedProductCardImagePath:eligiblePath,transformGovernedProductCardImagery:inject});return handler;
}
module.exports={VERSION,STYLE_HREF,PRODUCT_MAP,CARD_CLASSES,eligiblePath,productSlugsInHtml,ensureStyle,imageLinkMarkup,hasCardClass,nearestCardOpening,productVisualBounds,injectForProduct,mappingFromState,governedMappings,inject,wrap};