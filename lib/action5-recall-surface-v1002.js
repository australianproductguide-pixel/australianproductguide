'use strict';

// APG Action 5 recalled-product consumer-surface closure v100.2.
// v100 suppressed affiliate purchase/search actions for Anker A1647. Production QA then
// found two residual historical references on the recalled product page: a non-affiliate
// Amazon model-discovery link and Product JSON-LD sameAs. This layer removes those Amazon
// references and replaces recall-page provenance/navigation with the authoritative Anker
// Australia recall source. Other products and alternative-product retailer links are untouched.
const downstream=require('./action5-demand-ranking-v1001');

const VERSION='100.2';
const RECALL_SLUG=downstream.RECALL_SLUG;
const RECALL_PATH=`/products/${RECALL_SLUG}/`;
const RECALL_URL='https://www.anker.com/au/a1647-recall';
const OLD_AMAZON_URL='https://www.amazon.com.au/s?k=Anker%20Power%20Bank%2020000mAh%2022.5W';

function sanitiseRecallPageHtml(body,path){
  if(typeof body!=='string'||path!==RECALL_PATH)return body;
  let out=body;
  // Structured Product identity must not imply Amazon is an authoritative sameAs source
  // for a model APG has intentionally placed into a no-safe-purchase state.
  out=out.replace(new RegExp(',?\\"sameAs\\":\\"'+OLD_AMAZON_URL.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\"','g'),'');
  // Replace only the recalled model's exact historical search URL. Alternative products on
  // the same page keep their independently governed retailer links.
  const escaped=OLD_AMAZON_URL.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  out=out.replace(new RegExp(`<a\\b([^>]*?)href=\\"${escaped}\\"([^>]*)>[\\s\\S]*?<\\/a>`,'gi'),`<a$1href="${RECALL_URL}"$2 rel="noopener" target="_blank">Anker Australia recall information ↗</a>`);
  out=out.replace('data-amazon-link-type="search"','data-amazon-link-type="suppressed"');
  out=out.replace(/<div class="notice affiliate-disclosure-inline"><strong>Paid Amazon Associate links\.<\/strong>[\s\S]*?<\/div>/i,'<div class="notice"><strong>No purchase pathway is provided for this product.</strong> APG has resolved this record to recalled Anker model A1647 and has suppressed retailer purchase/search actions.</div>');
  out=out.replace(/<p class="fine-inline">Amazon links are paid links\.[\s\S]*?<\/p>/i,'<p class="fine-inline">This product is subject to an Australian recall. Follow the manufacturer recall process rather than retailer availability.</p>');
  // Do not leave copy that falsely describes the suppressed record as an active search fallback.
  out=out.replace(/<small class="apg-commerce-disclosure"><strong>Paid Amazon Associate link\.<\/strong> Transparent model-specific search fallback; no ASIN guessed\. Retailer status contributes zero points to APG recommendations\.<\/small>/i,'<small class="apg-commerce-disclosure"><strong>Retailer pathway suppressed.</strong> Product safety/currentness takes priority over retailer availability and affiliate coverage.</small>');
  out=out.replace(/<p class="fine-inline">Amazon uses a model-specific search fallback because an exact individual listing has not been verified\.<\/p>/i,'<p class="fine-inline">APG has resolved this product to recalled Anker model A1647 and does not provide a retailer search or purchase pathway.</p>');
  return out;
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=function(name,value){if(String(name).toLowerCase()==='x-apg-action5-strategic-closure')return originalSetHeader(name,'v'+VERSION);return originalSetHeader(name,value);};
  originalSetHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&type.startsWith('text/html')&&typeof body==='string'){
      const next=sanitiseRecallPageHtml(body,path);
      if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{ACTION5_RECALL_SURFACE_VERSION:VERSION,sanitiseRecallPageHtml,RECALL_PATH,RECALL_URL,OLD_AMAZON_URL});
module.exports=handler;
