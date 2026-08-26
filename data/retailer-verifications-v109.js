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
