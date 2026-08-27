'use strict';

// APG Retailer Verification Refresh v109.
// This registry records narrowly verified, exact-model Australian retailer/manufacturer
// checks without rewriting the historical catalogue research date. It is evidence only:
// retailer participation and availability contribute zero recommendation points.
const VERSION='retailer-verifications-v109';

const records={
  'hisense-75u6sau-75-inch-u6s-uled-miniled-tv':{
    retailer:'Hisense Australia',
    model:'75U6SAU',
    url:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',
    price:2299,
    currency:'AUD',
    availability:'in-stock',
    checkedAt:'2026-08-26',
    reviewDue:'2026-09-09',
    exactModel:true,
    affiliate:false,
    sourceType:'manufacturer-direct-au',
    verificationBasis:'Official Hisense Australia exact-model product page displayed model 75U6SAU, A$2,299 including GST, In stock and Add to cart at the 26 August 2026 verification.',
    priceScope:'Manufacturer-direct observed price only; not a whole-of-market lowest-price claim.'
  },
  'sony-wh-1000xm6':{
    retailer:'JB Hi-Fi',
    model:'WH1000XM6S',
    retailerSku:'812875',
    url:'https://www.jbhifi.com.au/products/sony-wh-1000xm6-premium-noise-cancelling-over-ear-headphones-silver',
    price:null,
    currency:'AUD',
    availability:'listing-verified',
    checkedAt:'2026-08-27',
    reviewDue:'2026-09-10',
    exactModel:true,
    affiliate:false,
    sourceType:'independent-retailer-au',
    verificationBasis:'JB Hi-Fi exact product page rechecked 27 August 2026 for Sony WH-1000XM6 Silver, retailer model WH1000XM6S and SKU 812875. Delivery and Click & Collect pathways were displayed; APG does not treat that observation as a durable live-stock guarantee.',
    priceScope:'No retailer price is copied into this refresh. Current price, seller conditions, delivery and store availability remain live-at-retailer.'
  }
};

function recordFor(slug,offer={}){
  const record=records[String(slug||'')];
  if(!record)return null;
  if(offer&&offer.retailer&&record.retailer!==offer.retailer)return null;
  if(offer&&offer.url&&record.url!==offer.url)return null;
  return {...record};
}
function resolve(slug,offer={}){
  const record=recordFor(slug,offer);
  return record?{...offer,...record,retailerVerificationVersion:VERSION}:offer;
}

module.exports={VERSION,records,recordFor,resolve};
