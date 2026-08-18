#!/usr/bin/env node
'use strict';
const fs=require('fs');
const amazon=require('../data/retailers-v6');

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
function candidatesFrom(payload,{verifiedAt=new Date().toISOString().slice(0,10)}={}){
  const exact=exactAmazonMap(),out={};
  for(const item of itemsFrom(payload)){
    const asin=String(asinOf(item)||'').toUpperCase(),imageUrl=primaryImage(item);
    if(!asin||!imageUrl||!exact.has(asin))continue;
    const {slug,row}=exact.get(asin);
    out[slug]={
      asin,
      variant:row.variant||null,
      amazon_url:row.url,
      amazon_affiliate_url:row.url,
      image_url:imageUrl,
      image_source:'Amazon Creators API (AU)',
      image_source_type:'amazon_associates_approved',
      image_rights_basis:'Amazon Associates Program Content delivered through the Amazon Creators API. Publication remains subject to current Associates terms and APG canonical image-registry review.',
      image_verified:false,
      image_verified_at:verifiedAt,
      image_product_match:'exact',
      image_status:'needs_review',
      image_alt:null,
      image_link_url:row.url,
      image_notes:'Candidate only. Do not publish until APG verifies that the returned image corresponds to the exact maintained product/variant and records final rights/compliance review.'
    };
  }
  return out;
}
function report(payload,opts={}){
  const candidates=candidatesFrom(payload,opts);
  return {
    version:'amazon-creators-image-import-v28',
    marketplace:'www.amazon.com.au',
    exactAmazonIdentityCount:exactAmazonMap().size,
    candidateCount:Object.keys(candidates).length,
    automaticPublication:false,
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

module.exports={itemsFrom,asinOf,primaryImage,exactAmazonMap,candidatesFrom,report};
