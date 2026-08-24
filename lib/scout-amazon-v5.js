'use strict';
const mapping=require('../data/amazon-au-mappings-v33');
const shopping=require('../data/amazon-destinations-v39');

const anchors={
  todayDeals:'today-deals',bestSellers:'best-sellers',under25:'under-25',subscribeSave:'subscribe-save',
  everydayEssentials:'everyday-essentials',globalStore:'global-store',newReleases:'new-releases'
};

function isAmazonQuestion(text){return /\bamazon(?: australia| au)?\b/i.test(String(text||''));}
function discoveryRecord(text){
  const s=String(text||'').toLowerCase();
  const mentionsAmazon=isAmazonQuestion(s);
  if(/subscribe\s*(?:&|and)?\s*save/.test(s))return shopping.destinations.subscribeSave;
  if(!mentionsAmazon)return null;
  if(/best\s*seller|bestseller|popular/.test(s))return shopping.destinations.bestSellers;
  if(/under\s*\$?25|less\s+than\s*\$?25|budget\s+find/.test(s))return shopping.destinations.under25;
  if(/global\s*store|international/.test(s))return shopping.destinations.globalStore;
  if(/new\s+release|new\s+product/.test(s))return shopping.destinations.newReleases;
  if(/everyday\s+essential|household\s+essential|replenish/.test(s))return shopping.destinations.everydayEssentials;
  if(/deal|sale|offer|discount|promotion/.test(s))return shopping.destinations.todayDeals;
  return null;
}
function discoveryResult(result,item){
  const anchor=anchors[item.key]||item.key;
  return {...result,
    intent:'amazon_shopping_discovery',
    message:`I can take you to APG’s verified ${item.title} shopping route. ${item.description}`,
    bullets:[item.consumer_note||null,'I won’t invent a price, discount percentage, expiry date or stock level.','Amazon merchandising, popularity and affiliate commission contribute zero points to APG recommendation scoring.'].filter(Boolean),
    products:[],
    references:[],
    actions:[
      {label:`Explore ${item.title} on APG`,url:`/deals/#${anchor}`,kind:'link',primary:true,external:false,affiliate:false},
      {label:'Open Amazon Australia',url:item.affiliate_url,kind:'retailer',primary:false,external:true,affiliate:true}
    ],
    meta:{...(result.meta||{}),amazonAu:{linkType:item.destination_type,matchStatus:'shopping-destination',verifiedAt:item.verified_at||shopping.VERIFIED_AT,affiliateTag:shopping.TAG,destinationKey:item.key,recommendationWeight:0}}
  };
}
function apply(core,text,pageContext,references,result){
  const discovery=discoveryRecord(text);
  if(discovery)return discoveryResult(result,discovery);
  if(!isAmazonQuestion(text))return result;
  const product=core.resolveReference(text,references,pageContext);
  if(!product)return result;
  const record=mapping.getAmazonAuRecord(product);
  if(!record||record.retailer!=='Amazon Australia'||!record.url)return result;
  const productCard=core.card(product);
  const productAction={label:'View APG product page',url:`/products/${product.slug}/`,kind:'link',primary:false};
  if(record.linkType==='affiliate-direct'&&record.asin){
    const isExact=record.matchStatus==='EXACT_VERIFIED';
    const variant=isExact?'exact product identity':'verified product variant';
    const checked=record.verifiedAt?` APG last verified this mapping on ${record.verifiedAt}.`:'';
    const note=record.note?String(record.note):'';
    const retailerLabel=isExact?'View on Amazon Australia':'View available variant on Amazon Australia';
    return {...result,intent:'price_or_retailer_question',message:`Yes — APG has a verified Amazon Australia ${variant} for ${product.brand} ${product.name}.${checked} I won’t quote an Amazon price or stock level unless APG has a current verified observation.`,bullets:[note,record.variantMatch?`Verified Amazon variant: ${record.variantMatch}`:null,'Affiliate commission does not affect APG recommendation scoring.'].filter(Boolean),products:productCard?[productCard]:[],references:[product.slug],actions:[{label:retailerLabel,url:record.url,kind:'retailer',primary:true,external:true,affiliate:true},productAction],meta:{...(result.meta||{}),amazonAu:{linkType:record.linkType,matchStatus:record.matchStatus,verifiedAt:record.verifiedAt||null,affiliateTag:mapping.TAG,recommendationWeight:0}}};
  }
  const checked=record.verifiedAt?` The catalogue-wide Amazon mapping was last checked on ${record.verifiedAt}.`:'';
  return {...result,intent:'price_or_retailer_question',message:`APG does not currently have a verified exact Amazon Australia detail-page match for ${product.brand} ${product.name}, so I won’t invent an ASIN or direct listing.${checked} APG does maintain a model-specific Amazon Australia search fallback.`,bullets:[record.note||null,'The search fallback includes APG’s disclosed Associates tag, but the shopper must confirm the exact model, variant, seller, price and availability on Amazon before buying.','Affiliate availability contributes zero recommendation points.'].filter(Boolean),products:productCard?[productCard]:[],references:[product.slug],actions:[{label:'Search this model on Amazon Australia',url:record.url,kind:'retailer',primary:true,external:true,affiliate:true},productAction],meta:{...(result.meta||{}),amazonAu:{linkType:record.linkType,matchStatus:record.matchStatus,verifiedAt:record.verifiedAt||null,affiliateTag:mapping.TAG,recommendationWeight:0}}};
}

module.exports={isAmazonQuestion,discoveryRecord,apply,mapping,shopping};
