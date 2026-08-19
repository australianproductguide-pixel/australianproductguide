'use strict';
const mapping=require('../data/amazon-au-mappings-v33');

function isAmazonQuestion(text){return /\bamazon(?: australia| au)?\b/i.test(String(text||''));}
function apply(core,text,pageContext,references,result){
  if(!isAmazonQuestion(text))return result;
  const product=core.resolveReference(text,references,pageContext);
  if(!product)return result;
  const record=mapping.getAmazonAuRecord(product);
  if(!record||record.retailer!=='Amazon Australia'||!record.url)return result;
  const productCard=core.card(product);
  const productAction={label:'View APG product page',url:`/products/${product.slug}/`,kind:'link',primary:false};
  if(record.linkType==='affiliate-direct'&&record.asin){
    const variant=record.modelMatch==='exact'?'exact product identity':'verified product variant';
    const checked=record.verifiedAt?` APG last verified this mapping on ${record.verifiedAt}.`:'';
    const note=record.note?String(record.note):'';
    return {...result,intent:'price_or_retailer_question',message:`Yes — APG has a verified Amazon Australia ${variant} for ${product.brand} ${product.name}.${checked} I won’t quote an Amazon price or stock level unless APG has a current verified observation.`,bullets:[note,record.variantMatch?`Verified Amazon variant: ${record.variantMatch}`:null,'Affiliate commission does not affect APG recommendation scoring.'].filter(Boolean),products:productCard?[productCard]:[],references:[product.slug],actions:[{label:'View on Amazon Australia',url:record.url,kind:'retailer',primary:true,external:true,affiliate:true},productAction],meta:{...(result.meta||{}),amazonAu:{linkType:record.linkType,matchStatus:record.matchStatus,verifiedAt:record.verifiedAt||null,affiliateTag:mapping.TAG,recommendationWeight:0}}};
  }
  const checked=record.verifiedAt?` The catalogue-wide Amazon mapping was last checked on ${record.verifiedAt}.`:'';
  return {...result,intent:'price_or_retailer_question',message:`APG does not currently have a verified exact Amazon Australia detail-page match for ${product.brand} ${product.name}, so I won’t invent an ASIN or direct listing.${checked} APG does maintain a model-specific Amazon Australia search fallback.`,bullets:[record.note||null,'The search fallback includes APG’s disclosed Associates tag, but the shopper must confirm the exact model, variant, seller, price and availability on Amazon before buying.','Affiliate availability contributes zero recommendation points.'].filter(Boolean),products:productCard?[productCard]:[],references:[product.slug],actions:[{label:'Search on Amazon Australia',url:record.url,kind:'retailer',primary:true,external:true,affiliate:true},productAction],meta:{...(result.meta||{}),amazonAu:{linkType:record.linkType,matchStatus:record.matchStatus,verifiedAt:record.verifiedAt||null,affiliateTag:mapping.TAG,recommendationWeight:0}}};
}

module.exports={isAmazonQuestion,apply,mapping};
