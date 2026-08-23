'use strict';

// APG Action 2 Measurement Truth v87.
// Narrow remediation only: dynamically rendered Scout Amazon links previously bypassed
// the governed affiliate listener because they were created after server-side link
// decoration. This layer enriches Scout affiliate actions with structured, non-personal
// measurement metadata and decorates the client-rendered anchors so the existing
// affiliate_click / amazon_shopping_click listener remains the single commerce path.
const downstream=require('./category-page-polish-v86');
const {products}=require('../data');

const VERSION='87.0';
const productBySlug=new Map(products.map(product=>[product.slug,product]));
const CLIENT_PATH='/assets/assistant.js';
const SCOUT_API_PATH='/api/account/scout';

function escAttr(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function classifyAmazonLink(url,amazonMeta={}){
  const linkType=String(amazonMeta.linkType||'').toLowerCase();
  if(linkType==='affiliate-direct'||/\/dp\//.test(String(url||'')))return {kind:'direct',destination:'direct_asin'};
  if(linkType.includes('search')||/\/s\?/.test(String(url||'')))return {kind:'search',destination:'search_fallback'};
  return {kind:'other',destination:String(amazonMeta.destinationKey||linkType||'amazon_shopping')};
}

function enrichScoutPayload(payload){
  if(!payload||typeof payload!=='object'||!Array.isArray(payload.actions))return payload;
  const amazonMeta=payload.meta&&payload.meta.amazonAu&&typeof payload.meta.amazonAu==='object'?payload.meta.amazonAu:{};
  const slug=Array.isArray(payload.references)&&payload.references.length?String(payload.references[0]||''):'';
  const product=productBySlug.get(slug);
  payload.actions=payload.actions.map(action=>{
    if(!action||!action.affiliate||!/^https:\/\/www\.amazon\.com\.au\//i.test(String(action.url||'')))return action;
    const classified=classifyAmazonLink(action.url,amazonMeta);
    return {...action,measurement:{
      retailer:'Amazon Australia',
      linkKind:classified.kind,
      productSlug:product?product.slug:slug,
      category:product?product.category:'',
      placement:'scout_recommendation',
      referralContext:'scout',
      destinationKey:String(amazonMeta.destinationKey||classified.destination)
    }};
  });
  return payload;
}

const OLD_RENDER="function renderActions(items){if(!Array.isArray(items)||!items.length)return '';return '<div class=\"scout-v5-actions\">'+items.map(a=>{if(!a)return '';const cls='scout-v5-action'+(a.primary?' primary':'');if(a.url){const ext=a.external?' target=\"_blank\" rel=\"'+(a.affiliate?'nofollow sponsored noopener':'noopener')+'\"':'';return '<a class=\"'+cls+'\" href=\"'+esc(a.url)+'\"'+ext+'>'+esc(a.label)+'</a>';}return '<button type=\"button\" class=\"'+cls+'\" data-scout-v5-ask=\"'+esc(a.label)+'\">'+esc(a.label)+'</button>';}).join('')+'</div>';};";

const NEW_RENDER="function renderActions(items){if(!Array.isArray(items)||!items.length)return '';return '<div class=\"scout-v5-actions\">'+items.map(a=>{if(!a)return '';const cls='scout-v5-action'+(a.primary?' primary':'');if(a.url){const ext=a.external?' target=\"_blank\" rel=\"'+(a.affiliate?'nofollow sponsored noopener':'noopener')+'\"':'';const m=a.measurement&&typeof a.measurement==='object'?a.measurement:null;const affiliate=a.affiliate&&m?' data-affiliate-link data-affiliate-retailer=\"'+esc(m.retailer||'Amazon Australia')+'\" data-affiliate-kind=\"'+esc(m.linkKind||'other')+'\" data-product-slug=\"'+esc(m.productSlug||'')+'\" data-affiliate-category=\"'+esc(m.category||'')+'\" data-affiliate-placement=\"'+esc(m.placement||'scout_recommendation')+'\" data-affiliate-context=\"'+esc(m.referralContext||'scout')+'\" data-affiliate-destination=\"'+esc(m.destinationKey||'')+'\"':'';return '<a class=\"'+cls+'\" href=\"'+esc(a.url)+'\"'+ext+affiliate+'>'+esc(a.label)+'</a>';}return '<button type=\"button\" class=\"'+cls+'\" data-scout-v5-ask=\"'+esc(a.label)+'\">'+esc(a.label)+'</button>';}).join('')+'</div>';};";

function patchClient(source){
  const text=String(source||'');
  if(text.includes('data-affiliate-destination')&&text.includes('scout_recommendation'))return text;
  if(!text.includes(OLD_RENDER))return text;
  return text.replace(OLD_RENDER,NEW_RENDER);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(path===CLIENT_PATH&&type.startsWith('application/javascript')){
        const next=patchClient(body);if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
      }else if(path===SCOUT_API_PATH&&type.startsWith('application/json')&&res.statusCode>=200&&res.statusCode<300){
        try{const parsed=JSON.parse(body);body=JSON.stringify(enrichScoutPayload(parsed));try{res.removeHeader('Content-Length')}catch{}}catch{}
      }
    }
    return end(body,...args);
  };
  res.setHeader('X-APG-Measurement-Truth','v'+VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{VERSION,CLIENT_PATH,SCOUT_API_PATH,classifyAmazonLink,enrichScoutPayload,patchClient,escAttr});
module.exports=handler;
