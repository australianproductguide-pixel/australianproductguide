const base=require('./retailers');
const {TAG}=base;
const additions={
  'amazon-kindle-2024':{
    url:`https://www.amazon.com.au/New-Amazon-Kindle-2024-release/dp/B0CP31QS6R?tag=${TAG}`,
    asin:'B0CP31QS6R',
    verified:'2026-08-16',
    variant:'Amazon Kindle newest generation / 2024 family, 16GB, Matcha colour offer',
    confidence:'high',
    note:'Exact Amazon Kindle 2024/newest-generation 16GB Amazon Australia detail page verified. The linked ASIN is the Matcha colour variant; Amazon also exposes a Black colour variant under a different ASIN, so shoppers should confirm colour before checkout.'
  }
};
const direct={...base.direct,...additions};
function retailersFor(p){
  const d=direct[p.slug];
  if(!d)return base.retailersFor(p);
  return [{
    retailer:'Amazon Australia',productIdentifier:d.asin,asin:d.asin,kind:'affiliate-direct',exactUrl:d.url,affiliateUrl:d.url,url:d.url,
    imageUrl:null,imageSource:'Amazon Creators API — not yet connected',
    imageProvenance:'No Amazon image is displayed until authorised Creators API credentials are configured and the returned product identifier matches the verified ASIN.',
    imageVerified:false,verified:d.verified,variant:d.variant,availabilityConfidence:d.confidence,note:d.note
  }];
}
module.exports={...base,direct,retailersFor,additions};
