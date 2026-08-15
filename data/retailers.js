const TAG='auproductguid-22';
const direct={
  'bose-quietcomfort-ultra-headphones':{
    url:`https://www.amazon.com.au/Bose-QuietComfort-Wireless-Cancelling-Headphones/dp/B0CCZ1HQ39?tag=${TAG}`,
    asin:'B0CCZ1HQ39',verified:'2026-08-16',note:'Exact Bose QuietComfort Ultra Amazon Australia product page verified; colour/offer may vary.'
  },
  'sennheiser-momentum-4-wireless':{
    url:`https://www.amazon.com.au/Sennheiser-Momentum-Special-Headphones-Metallic/dp/B0CCRZPKR1?tag=${TAG}`,
    asin:'B0CCRZPKR1',verified:'2026-08-16',note:'Exact MOMENTUM 4 Wireless product page verified on Amazon Australia; current offer may be an imported/special-edition variant.'
  }
};
function amazonSearch(p){return `https://www.amazon.com.au/s?k=${encodeURIComponent(`${p.brand} ${p.name}`)}&tag=${TAG}`;}
function retailersFor(p){
  const d=direct[p.slug];
  return [{
    retailer:'Amazon Australia',
    kind:d?'affiliate-direct':'affiliate-search',
    url:d?d.url:amazonSearch(p),
    verified:d?.verified||'2026-08-16',
    asin:d?.asin||null,
    note:d?.note||'Exact individual Amazon Australia listing was not independently verified in this review; model-specific Amazon search fallback retained to avoid a wrong-product link.'
  }];
}
module.exports={TAG,direct,amazonSearch,retailersFor};
