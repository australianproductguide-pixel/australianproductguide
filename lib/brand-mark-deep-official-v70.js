'use strict';

// APG Brand Mark Deep Official Discovery v70.2
// Recovers full corporate marks missed by ordinary homepage parsing by inspecting
// explicit logo/wordmark URLs embedded in official HTML and linked first-party CSS,
// plus first-party images whose accessible name exactly identifies the canonical brand.
// Runs only for weak/icon/text/suspicious outcomes. Rights-policy fallbacks are never
// overridden. Social, payment, marketplace and platform logos are explicitly rejected
// unless that platform itself is the canonical APG brand being resolved.
const downstream=require('./brand-mark-visual-completion-v69');
const VERSION='70.2';
const MAX=1024*1024,CACHE_MS=14*864e5,NEG_MS=45*60e3;
const cache=new Map();
const FOREIGN_MARKS=['youtube','facebook','instagram','tiktok','linkedin','pinterest','twitter','threads','whatsapp','paypal','visa','mastercard','amex','afterpay','klarna','shopify','google-pay','apple-pay'];
function get(k){const x=cache.get(k);if(!x||x.e<Date.now()){cache.delete(k);return undefined;}return x.v;}
function set(k,v){cache.set(k,{v,e:Date.now()+(v?CACHE_MS:NEG_MS)});return v;}
function restricted(i){return !!(i&&(i.intentionalPolicyFallback||i.policyReason||i.resolverSource==='brand-name-policy-fallback'));}
function foreignMarkInText(text,slug){const t=String(text||'').toLowerCase();return FOREIGN_MARKS.some(mark=>mark!==slug&&t.includes(mark));}
function suspicious(i,slug){if(!i||!i.buffer)return false;const type=String(i.type||'').toLowerCase();if(!type.includes('svg'))return false;const sample=i.buffer.toString('utf8',0,12000);return foreignMarkInText(sample,slug);}
function weak(i,slug){if(!i||restricted(i))return false;const s=String(i.resolverSource||'').toLowerCase(),k=String(i.assetKind||'').toLowerCase();return suspicious(i,slug)||!!i.terminalFallback||k==='canonical-brand-name'||k.includes('favicon')||k.includes('icon')||s.includes('favicon')||s.includes('declared-identity')||s==='canonical-brand-name-fallback';}
function url(v,b){try{const u=new URL(String(v||'').replace(/&amp;/g,'&'),b);return /^https?:$/.test(u.protocol)?u.href:null}catch{return null}}
function attr(tag,name){return ((String(tag||'').match(new RegExp('\\b'+name+'=["\\\']([^"\\\']+)["\\\']','i'))||[])[1]||'').trim();}
function norm(v){return String(v||'').toLowerCase().replace(/&amp;/g,'&').replace(/[®™©]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function brandName(slug){const map=downstream.brandBySlug;return map&&typeof map.get==='function'?(map.get(slug)||slug):slug;}
function exactBrandDescriptor(value,slug){
  const d=norm(value),b=norm(brandName(slug)),s=norm(slug);
  if(!d||!b)return false;
  const accepted=new Set([b,s,`${b} logo`,`${b} wordmark`,`${b} home`,`${b} homepage`,`${b} brand`,`${b} official`,`${b} official site`,`${b} official website`]);
  return accepted.has(d);
}
function productishDescriptor(value){return /(?:product|model|hero|banner|gallery|lifestyle|recipe|collection|shop|buy|tile|card|thumbnail|promo|campaign)/i.test(String(value||''));}
async function text(u,ms=3500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,{redirect:'follow',signal:c.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)'}});if(!r.ok)return null;const x=await r.text();return {x:x.slice(0,MAX),u:r.url||u}}catch{return null}finally{clearTimeout(t)}}
async function image(u){const c=new AbortController(),t=setTimeout(()=>c.abort(),2800);try{const r=await fetch(u,{redirect:'follow',signal:c.signal,headers:{'User-Agent':'AustralianProductGuide/1.0 (+https://australianproductguide.au/about/)','Accept':'image/svg+xml,image/png,image/webp,image/jpeg,image/*'}});if(!r.ok)return null;const n=Number(r.headers.get('content-length')||0);if(n>MAX)return null;const b=Buffer.from(await r.arrayBuffer());if(!b.length||b.length>MAX)return null;let type=String(r.headers.get('content-type')||'').split(';')[0].toLowerCase();if(!type.startsWith('image/')&&/<svg\b/i.test(b.toString('utf8',0,4096)))type='image/svg+xml';if(!type.startsWith('image/'))return null;return {buffer:b,type,source:r.url||u}}catch{return null}finally{clearTimeout(t)}}
function candidates(src,base,slug,kind='deep-official-logo'){
  const out=[],seen=new Set();
  const add=(v,score,candidateKind=kind,allowOpaque=false)=>{const u=url(v,base);if(!u||seen.has(u))return;const l=u.toLowerCase();if(foreignMarkInText(l,slug))return;if(!allowOpaque&&!/(logo|wordmark|brand[-_]?mark|brand[-_]?logo)/.test(l))return;if(/(?:product|hero|banner|gallery|lifestyle|recipe|collection)/.test(l)&&!/(logo|wordmark)/.test(l)&&!allowOpaque)return;seen.add(u);out.push({u,score,kind:candidateKind})};
  for(const m of String(src||'').matchAll(/(?:src|href|content|data-src|data-image)\s*=\s*["']([^"']*(?:logo|wordmark|brand[-_]?mark)[^"']*)["']/gi))add(m[1],170);
  for(const m of String(src||'').matchAll(/["']([^"']{1,500}(?:logo|wordmark|brand[-_]?mark)[^"']{0,300}\.(?:svg|png|webp|jpe?g)(?:\?[^"']*)?)["']/gi))add(m[1],160);
  for(const m of String(src||'').matchAll(/url\(\s*["']?([^"')]*(?:logo|wordmark|brand[-_]?mark)[^"')]+)["']?\s*\)/gi))add(m[1],155);
  // Modern commerce/corporate sites often use opaque CDN asset names. Accept those only
  // when the element itself names the canonical brand exactly and is not product-like.
  for(const tag of String(src||'').match(/<img\b[^>]*>/gi)||[]){
    const descriptor=[attr(tag,'alt'),attr(tag,'title'),attr(tag,'aria-label')].filter(Boolean).join(' ');
    const exact=[attr(tag,'alt'),attr(tag,'title'),attr(tag,'aria-label')].some(v=>exactBrandDescriptor(v,slug));
    const context=[descriptor,attr(tag,'class'),attr(tag,'id')].join(' ');
    if(!exact||productishDescriptor(context)||foreignMarkInText(context,slug))continue;
    for(const n of ['src','data-src','data-lazy-src','data-original','data-image'])add(attr(tag,n),205,'official-exact-brand-image',true);
    for(const n of ['srcset','data-srcset'])for(const piece of String(attr(tag,n)||'').split(',')){const raw=piece.trim().split(/\s+/)[0];add(raw,202,'official-exact-brand-image',true);}
  }
  // Also accept an image inside a home-link whose anchor has an exact brand aria-label,
  // but only when the child is not labelled as a different entity.
  for(const block of String(src||'').match(/<a\b[^>]*>[\s\S]{0,1200}?<img\b[^>]*>[\s\S]{0,300}?<\/a>/gi)||[]){
    const a=(block.match(/^<a\b[^>]*>/i)||[])[0]||'',img=(block.match(/<img\b[^>]*>/i)||[])[0]||'';
    const anchorExact=[attr(a,'aria-label'),attr(a,'title')].some(v=>exactBrandDescriptor(v,slug));
    const child=[attr(img,'alt'),attr(img,'title'),attr(img,'aria-label')].filter(Boolean).join(' ');
    if(!anchorExact||productishDescriptor(block.slice(0,500))||foreignMarkInText(child,slug))continue;
    for(const n of ['src','data-src','data-lazy-src','data-original','data-image'])add(attr(img,n),198,'official-exact-brand-home-image',true);
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,48);
}
function stylesheets(html,base){const a=[];for(const m of String(html||'').matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>|<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)){const u=url(m[1]||m[2],base);if(u&&!a.includes(u))a.push(u)}return a.slice(0,8)}
function assess(raw,slug,kind){if(!raw)return null;const svg=raw.type.includes('svg')||/<svg\b/i.test(raw.buffer.toString('utf8',0,4096));if(svg){const sample=raw.buffer.toString('utf8',0,12000);if(foreignMarkInText(sample,slug))return null;if(typeof downstream.visibleSvgBody==='function'&&!downstream.visibleSvgBody(raw.buffer))return null;return {...raw,type:'image/svg+xml',quality:'premium-vector',assetKind:kind&&kind.includes('exact-brand')?'official-exact-brand-logo':'official-deep-wordmark'}}const d=typeof downstream.dimensions==='function'?(downstream.dimensions(raw.buffer,raw.type)||{}):{},w=Number(d.width||0),h=Number(d.height||0);if(!w||!h||Math.max(w,h)<96||Math.min(w,h)<20)return null;return {...raw,width:w,height:h,quality:Math.max(w,h)>=180?'high-raster':'official-raster',assetKind:kind&&kind.includes('exact-brand')?'official-exact-brand-logo':'official-deep-wordmark'}}
async function discover(slug){const key='deep:'+slug,h=get(key);if(h!==undefined)return h;const domain=downstream.officialDomains&&downstream.officialDomains[slug];if(!domain)return set(key,null);const page=await text(`https://${domain}/`);if(!page)return set(key,null);let list=candidates(page.x,page.u,slug);const css=await Promise.all(stylesheets(page.x,page.u).map(u=>text(u,2600)));for(const c of css.filter(Boolean))list=list.concat(candidates(c.x,c.u,slug,'official-css-wordmark'));const uniq=[],seen=new Set();for(const c of list.sort((a,b)=>b.score-a.score)){if(!seen.has(c.u)){seen.add(c.u);uniq.push(c)}}for(let i=0;i<Math.min(uniq.length,48);i+=5){const wave=await Promise.all(uniq.slice(i,i+5).map(async c=>({c,a:assess(await image(c.u),slug,c.kind)})));const good=wave.filter(x=>x.a).sort((a,b)=>(b.c.score-a.c.score)||((b.a.quality==='premium-vector'?2:1)-(a.a.quality==='premium-vector'?2:1)));if(good[0])return set(key,{...good[0].a,resolverSource:good[0].c.kind.includes('exact-brand')?'official-domain-exact-brand-logo':'official-domain-deep-logo',officialReference:`https://${domain}/`,terminalFallback:false})}return set(key,null)}
function safeFallback(slug,base){if(base&&!suspicious(base,slug))return base;const svg=typeof downstream.fallbackBrandSvg==='function'?downstream.fallbackBrandSvg(slug):null;if(!svg)return base;return {buffer:Buffer.from(svg,'utf8'),type:'image/svg+xml',resolverSource:'canonical-brand-name-fallback',assetKind:'canonical-brand-name',quality:'text-fallback-svg',officialReference:(downstream.officialDomains&&downstream.officialDomains[slug])?`https://${downstream.officialDomains[slug]}/`:null,terminalFallback:true};}
async function resolve(slug){const base=await downstream.resolveVisualBrandMark(slug);if(restricted(base)||!weak(base,slug))return base;return await discover(slug)||safeFallback(slug,base)}
function serve(req,res,i){res.statusCode=200;res.setHeader('Content-Type',i.type||'image/png');res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');res.setHeader('X-APG-Brand-Mark-Deep-Official','v'+VERSION);res.setHeader('X-APG-Brand-Mark-Source',i.resolverSource||'governed-brand-identity');res.setHeader('X-APG-Brand-Mark-Quality',i.quality||'governed');res.setHeader('X-APG-Brand-Mark-Asset-Kind',i.assetKind||'governed-brand-identity');if(i.officialReference)res.setHeader('X-APG-Brand-Mark-Reference',i.officialReference);if(i.policyReason)res.setHeader('X-APG-Brand-Mark-Policy-Reason',i.policyReason);if(i.policyReference)res.setHeader('X-APG-Brand-Mark-Policy-Reference',i.policyReference);if(i.width&&i.height)res.setHeader('X-APG-Brand-Mark-Dimensions',`${i.width}x${i.height}`);res.setHeader('Content-Length',String(i.buffer.length));return req.method==='HEAD'?res.end():res.end(i.buffer)}
function version(html){return String(html||'').replace(/(\/assets\/brand-marks\/[^\s"'<>?&]+)(?:\?v=[^\s"'<>]*)?/gi,`$1?v=${VERSION}`)}
async function handler(req,res){let p='/';try{p=new URL(req.url,'https://australianproductguide.au').pathname}catch{}res.setHeader('X-APG-Brand-Mark-Deep-Official','v'+VERSION);const m=p.match(/^\/assets\/brand-marks\/([^/]+)\/?$/i);if(m&&(req.method==='GET'||req.method==='HEAD')){let s='';try{s=decodeURIComponent(m[1]).toLowerCase()}catch{}const i=await resolve(s);if(i)return serve(req,res,i)}const end=res.end.bind(res);res.end=(body,...args)=>{const ct=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&ct.startsWith('text/html')){const was=Buffer.isBuffer(body),o=was?body.toString('utf8'):body;let n=version(o);if(!n.includes('name="apg-brand-mark-deep-official"'))n=n.replace('</head>',`<meta name="apg-brand-mark-deep-official" content="v${VERSION}"></head>`);if(n!==o){body=was?Buffer.from(n):n;try{res.removeHeader('Content-Length')}catch{}}}return end(body,...args)};return downstream(req,res)}
Object.assign(handler,downstream,{BRAND_MARK_DEEP_OFFICIAL_VERSION:VERSION,discoverDeepOfficialLogo:discover,resolveDeepOfficialBrandMark:resolve,exactBrandDescriptor});module.exports=handler;
