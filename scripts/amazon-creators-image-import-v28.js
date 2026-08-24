#!/usr/bin/env node
'use strict';
const fs=require('fs');
const amazon=require('../data/retailers-v6');

const AMAZON_IMAGE_LINK_MAX_AGE_MS=24*60*60*1000;

function itemsFrom(payload){
  if(Array.isArray(payload))return payload;
  return payload?.itemsResult?.items||payload?.ItemsResult?.Items||payload?.items||payload?.Items||[];
}
function asinOf(item){return item?.asin||item?.ASIN||item?.itemInfo?.asin||null;}
function primaryImage(item){
  const images=item?.images||item?.Images||{};
  const primary=images.primary||images.Primary||{};
  const large=primary.large||primary.Large||{};
  const medium=primary.medium||primary.Medium||{};
  const small=primary.small||primary.Small||{};
  return large.url||large.URL||medium.url||medium.URL||small.url||small.URL||null;
}
function exactAmazonMap(){
  const out=new Map();
  for(const [slug,row] of Object.entries(amazon.direct||{}))if(row?.asin)out.set(String(row.asin).toUpperCase(),{slug,row});
  return out;
}
function candidatesFrom(payload,{acquiredAt=new Date().toISOString()}={}){
  const exact=exactAmazonMap(),out={};
  const acquiredMs=Date.parse(acquiredAt);
  if(Number.isNaN(acquiredMs))throw new Error(`Invalid acquiredAt timestamp: ${acquiredAt}`);
  const expiresAt=new Date(acquiredMs+AMAZON_IMAGE_LINK_MAX_AGE_MS).toISOString();
  for(const item of itemsFrom(payload)){
    const asin=String(asinOf(item)||'').toUpperCase(),imageUrl=primaryImage(item);
    if(!asin||!imageUrl||!exact.has(asin))continue;
    const {slug,row}=exact.get(asin);
    out[slug]={
      asin,
      variant:row.variant||'Exact Amazon listing variant; confirm visible image variant during APG review',
      amazon_url:row.url,
      amazon_affiliate_url:row.url,
      image_url:imageUrl,
      image_source:'Amazon Creators API (AU)',
      image_source_type:'amazon_associates_approved',
      image_source_reference:`Amazon Creators API response for ASIN ${asin}`,
      image_rights_basis:'Amazon Associates Program Content delivered through the Amazon Creators API. Publication remains subject to current Associates terms, matching destination requirements and APG canonical image-registry review.',
      image_rights_licence:'Amazon Associates Program IP Licence / Creators API Licence',
      image_rights_url:'https://affiliate-program.amazon.com.au/help/operating/policies',
      image_acquired_at:acquiredAt,
      image_url_expires_at:expiresAt,
      image_verified:false,
      image_verified_at:acquiredAt,
      image_product_match:'exact',
      image_status:'needs_review',
      image_alt:null,
      image_attribution_required:false,
      image_attribution_text:null,
      image_link_url:row.url,
      image_amazon_restrictions:'Do not scrape or download/copy Amazon image content. Product Advertising Content image links are ephemeral and must be refreshed within 24 hours. Every use must link to the relevant Amazon Australia page using the matching APG Associates destination.',
      image_notes:'Candidate only. Do not publish until APG verifies the returned image corresponds to the exact maintained product/variant. Refresh/reacquire the image link before the recorded expiry; never promote a stale candidate into the static registry.'
    };
  }
  return out;
}
function report(payload,opts={}){
  const candidates=candidatesFrom(payload,opts);
  return {
    version:'amazon-creators-image-import-v28-action6',
    marketplace:'www.amazon.com.au',
    exactAmazonIdentityCount:exactAmazonMap().size,
    candidateCount:Object.keys(candidates).length,
    automaticPublication:false,
    amazonImageLinkMaxAgeHours:24,
    policy:'Amazon image links are treated as ephemeral Program Content. Candidates expire after 24 hours and require exact-product human/controlled review before any publication.',
    candidates
  };
}

if(require.main===module){
  const file=process.argv[2];
  if(!file){console.error('Usage: node scripts/amazon-creators-image-import-v28.js <creators-api-response.json> [output.json]');process.exit(2);}
  const payload=JSON.parse(fs.readFileSync(file,'utf8'));
  const output=JSON.stringify(report(payload),null,2)+'\n';
  if(process.argv[3])fs.writeFileSync(process.argv[3],output);else process.stdout.write(output);
}

module.exports={AMAZON_IMAGE_LINK_MAX_AGE_MS,itemsFrom,asinOf,primaryImage,exactAmazonMap,candidatesFrom,report};
