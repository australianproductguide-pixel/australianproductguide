const TAG='auproductguid-22';
const CREATORS_API={
  provider:'Amazon Creators API',
  marketplace:'www.amazon.com.au',
  partnerTag:TAG,
  status:'credentials-required',
  imagePolicy:'Use only image URLs returned through an authorised Amazon Creators API integration for the matching ASIN. Do not scrape, copy or permanently host Amazon product-page imagery.',
  reviewed:'2026-08-16'
};

const direct={
  'bose-quietcomfort-ultra-headphones':{
    url:`https://www.amazon.com.au/Bose-QuietComfort-Wireless-Cancelling-Headphones/dp/B0CCZ1HQ39?tag=${TAG}`,
    asin:'B0CCZ1HQ39',verified:'2026-08-16',variant:'QuietComfort Ultra Headphones',confidence:'high',
    note:'Exact Bose QuietComfort Ultra Amazon Australia individual product page verified; colour/offer may vary.'
  },
  'sennheiser-momentum-4-wireless':{
    url:`https://www.amazon.com.au/Sennheiser-Momentum-Special-Headphones-Metallic/dp/B0CCRZPKR1?tag=${TAG}`,
    asin:'B0CCRZPKR1',verified:'2026-08-16',variant:'MOMENTUM 4 Wireless special-edition offer',confidence:'high',
    note:'Exact MOMENTUM 4 Wireless product family verified on Amazon Australia; current offer may be an imported/special-edition variant.'
  },
  'philips-5000-series-dual-basket-na55100':{
    url:`https://www.amazon.com.au/Philips-Technology-Versatile-NA551-00/dp/B0DHS253VZ?tag=${TAG}`,
    asin:'B0DHS253VZ',verified:'2026-08-16',variant:'NA551/00 black/silver 9L Dual Basket + Steam',confidence:'high',
    note:'Exact Philips 5000 Series Dual Basket Airfryer NA551/00 Amazon Australia individual listing independently verified.'
  }
};

function amazonSearch(p){return `https://www.amazon.com.au/s?k=${encodeURIComponent(`${p.brand} ${p.name}`)}&tag=${TAG}`;}
function retailersFor(p){
  const d=direct[p.slug];
  return [{
    retailer:'Amazon Australia',
    productIdentifier:d?.asin||null,
    asin:d?.asin||null,
    kind:d?'affiliate-direct':'affiliate-search',
    exactUrl:d?.url||null,
    affiliateUrl:d?.url||amazonSearch(p),
    url:d?.url||amazonSearch(p),
    imageUrl:null,
    imageSource:d?'Amazon Creators API — not yet connected':'No approved product-image source connected',
    imageProvenance:'No Amazon image is displayed until authorised Creators API credentials are configured and the returned product identifier matches the verified ASIN.',
    imageVerified:false,
    verified:d?.verified||'2026-08-16',
    variant:d?.variant||null,
    availabilityConfidence:d?.confidence||'unverified-exact-listing',
    note:d?.note||'Exact individual Amazon Australia listing was not independently verified in this review; model-specific Amazon search fallback retained to avoid a wrong-product link.'
  }];
}
module.exports={TAG,CREATORS_API,direct,amazonSearch,retailersFor};
