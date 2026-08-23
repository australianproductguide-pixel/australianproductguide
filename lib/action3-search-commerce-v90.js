'use strict';

// APG Action 3 Search Commerce v90.
// Confidence-gated retailer actions for Search only. Recommendation/ranking remains
// upstream and affiliate economics contribute zero recommendation points.
const downstream=require('./pagespeed-performance-v88');
const {products}=require('../data');
const {getAmazonAuRecord}=require('../data/amazon-au-mappings-v33');

const VERSION='90.0';
const ASSET_PATH='/assets/action3-search-commerce-v90.css';
const productBySlug=new Map(products.map(p=>[p.slug,p]));

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function retailerState(product){
  if(!product)return {status:'UNAVAILABLE'};
  const r=getAmazonAuRecord(product);
  if(!r||!r.url)return {status:'UNAVAILABLE'};
  if(r.matchStatus==='EXACT_VERIFIED')return {status:'EXACT_VERIFIED',label:'View on Amazon Australia',url:r.url,kind:'direct',destination:'direct_asin',variant:r.variantMatch||'',asin:r.asin||''};
  if(r.matchStatus==='VARIANT_VERIFIED')return {status:'VARIANT_VERIFIED',label:'View available variant on Amazon Australia',url:r.url,kind:'direct',destination:'verified_variant',variant:r.variantMatch||'',asin:r.asin||''};
  if(r.matchStatus==='SEARCH_FALLBACK')return {status:'SEARCH_FALLBACK',label:'Search this model on Amazon Australia',url:r.url,kind:'search',destination:'search_fallback',variant:'',asin:''};
  return {status:'UNAVAILABLE'};
}

function exactIntent(payload){
  const u=payload&&payload.queryUnderstanding||{};
  return Boolean(payload&&Array.isArray(payload.products)&&payload.products.length===1&&Number(u.modelMatchCount)===1&&!u.modelAmbiguous);
}

function enrichPayload(payload){
  if(!payload||typeof payload!=='object'||!Array.isArray(payload.products))return payload;
  const high=exactIntent(payload);
  payload.products=payload.products.map(dto=>{
    const product=productBySlug.get(dto.slug);
    const retail=high?retailerState(product):{status:'UNAVAILABLE'};
    return {...dto,retailerAction:retail.status==='UNAVAILABLE'?null:retail};
  });
  payload.action3={version:VERSION,intentClass:high?'EXACT_PRODUCT':'DECISION_SUPPORT',commercialRecommendationWeight:0};
  if(typeof payload.bodyHtml==='string')payload.bodyHtml=decorateSearchHtml(payload.bodyHtml,payload);
  return payload;
}

function compareButton(p){return `<button class="compare-button apg-search-compare" type="button" data-compare-product="${esc(p.slug)}" aria-pressed="false">Compare</button>`;}
function retailerLink(p,a){
  if(!a||!a.url)return '';
  const variantNote=a.status==='VARIANT_VERIFIED'&&a.variant?`<small class="apg-search-retailer-note">Verified offer: ${esc(a.variant)}. Check the selected variant before purchase.</small>`:'';
  return `<span class="apg-search-retailer-wrap"><a class="apg-context-purchase apg-search-retailer" href="${esc(a.url)}" target="_blank" rel="sponsored nofollow noopener" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="${esc(a.kind)}" data-affiliate-placement="search_result" data-affiliate-context="search_exact_product" data-affiliate-category="${esc(p.category||'')}" data-product-slug="${esc(p.slug)}" data-affiliate-destination="${esc(a.destination)}" aria-label="${esc(a.label+' for '+p.brand+' '+p.name)}">${esc(a.label)} <span aria-hidden="true">↗</span></a>${variantNote}</span>`;
}
function actionRow(p){
  const a=p.retailerAction;
  return `<div class="actions apg-search-actions"><a class="button secondary" href="${esc(p.url)}">Open APG guide</a>${compareButton(p)}${a?retailerLink(p,a):''}</div>`;
}
function decorateSearchHtml(html,payload){
  if(!exactIntent(payload)||!payload.products.length)return html;
  const p=payload.products[0];
  const marker=`<div class="actions"><a class="button secondary" href="${esc(p.url)}">Open product guide</a></div>`;
  if(!html.includes(marker))return html;
  return html.replace(marker,actionRow(p));
}

function decorateHtmlBody(body,path,q=''){
  if(path!=='/search/'||!String(q||'').trim())return body;
  try{
    const search=require('./search');
    const r=search.searchSite(q);
    const payload={queryUnderstanding:r.queryUnderstanding||{},products:(r.products||[]).slice(0,12).map(p=>({slug:p.slug,name:p.name,brand:p.brand,category:p.category,url:`/products/${p.slug}/`}))};
    if(!exactIntent(payload))return body;
    const p=payload.products[0],product=productBySlug.get(p.slug),retailerAction=retailerState(product);
    p.retailerAction=retailerAction.status==='UNAVAILABLE'?null:retailerAction;
    return decorateSearchHtml(body,payload);
  }catch{return body;}
}

const css=`
.apg-search-actions{display:flex;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-top:16px}
.apg-search-actions .button,.apg-search-actions .compare-button,.apg-search-retailer{min-height:44px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box}
.apg-search-retailer-wrap{display:flex;flex-direction:column;gap:5px;max-width:100%}
.apg-search-retailer{border:1px solid #9dbfba;border-radius:10px;padding:10px 12px;color:#0b655f;background:#f5fbf9;font-size:12px;font-weight:850;text-decoration:none;line-height:1.25}
.apg-search-retailer:hover{border-color:#087c76;background:#eaf6f2;color:#075c57}
.apg-search-retailer:focus-visible{outline:3px solid currentColor;outline-offset:3px}
.apg-search-retailer-note{max-width:340px;color:#60757b;font-size:10px;line-height:1.35}
@media(max-width:700px){.apg-search-actions{display:grid;grid-template-columns:1fr;align-items:stretch}.apg-search-actions .button,.apg-search-actions .compare-button,.apg-search-retailer{width:100%;min-height:48px}.apg-search-retailer-wrap{width:100%}}
`;

function sendCss(req,res){res.statusCode=200;res.setHeader('Content-Type','text/css; charset=utf-8');res.setHeader('Cache-Control','public, max-age=3600');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':css);}
function injectCss(body){return body.includes(ASSET_PATH)?body:body.replace('</head>',`<link rel="stylesheet" href="${ASSET_PATH}"></head>`);}

function handler(req,res){
  let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('/','https://australianproductguide.au')}
  const path=url.pathname,q=url.searchParams.get('q')||'';
  if(path===ASSET_PATH)return sendCss(req,res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(path==='/search/'&&type.startsWith('application/json')){
        try{body=JSON.stringify(enrichPayload(JSON.parse(body)));res.removeHeader('Content-Length');}catch{}
      }else if(type.startsWith('text/html')){
        body=injectCss(decorateHtmlBody(body,path,q));try{res.removeHeader('Content-Length')}catch{}
      }
    }
    res.setHeader('X-APG-Action3-Search-Commerce','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{VERSION,ASSET_PATH,retailerState,exactIntent,enrichPayload,decorateSearchHtml,decorateHtmlBody});
module.exports=handler;
