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
  },
  'anker-nano-power-bank-10000mah-30w':{
    url:`https://www.amazon.com.au/Anker-Compact-Portable-Charger-Compatible/dp/B0C9CSG3B7?tag=${TAG}`,
    asin:'B0C9CSG3B7',
    verified:'2026-08-17',
    variant:'Anker Nano Power Bank 10,000mAh 30W with built-in USB-C cable, model A1259, Blue',
    confidence:'high',
    note:'Exact Anker Nano Power Bank 10,000mAh 30W Amazon Australia detail page verified against model A1259. The observed offer is Blue; shoppers should confirm colour and seller before checkout.'
  },
  'iniu-power-bank-20000mah-45w':{
    url:`https://www.amazon.com.au/INIU-20000mAh-Portable-Charging-Compatible/dp/B0DCYRXNFN?tag=${TAG}`,
    asin:'B0DCYRXNFN',
    verified:'2026-08-17',
    variant:'INIU Power Bank 20,000mAh 45W with built-in USB-C cable, model P51L, Black',
    confidence:'high',
    note:'Exact INIU 20,000mAh 45W Amazon Australia detail page verified against model P51L. Shoppers should confirm current seller, colour and offer details before checkout.'
  },
  'delonghi-kg200-electric-coffee-grinder':{
    url:`https://www.amazon.com.au/DeLonghi-KG200-Electric-Stainless-International/dp/B089NYQ9BV?tag=${TAG}`,
    asin:'B089NYQ9BV',
    verified:'2026-08-17',
    variant:"De'Longhi KG200 electric blade coffee grinder, black",
    confidence:'high',
    note:'Exact De’Longhi KG200 Amazon Australia detail page and ASIN verified. Shoppers should recheck the current seller, delivery terms and offer before checkout.'
  }
};
const direct={...base.direct,...additions};
function modelSearch(p){
  const brand=String(p.brand||'').trim(),name=String(p.name||'').trim();
  const term=brand&&name.toLocaleLowerCase('en-AU').startsWith(brand.toLocaleLowerCase('en-AU'))?name:`${brand} ${name}`.trim();
  return `https://www.amazon.com.au/s?k=${encodeURIComponent(term)}&tag=${TAG}`;
}
function retailersFor(p){
  const d=direct[p.slug];
  if(!d){
    const rows=base.retailersFor(p);
    return rows.map(r=>r.kind==='affiliate-search'?{...r,affiliateUrl:modelSearch(p),url:modelSearch(p)}:r);
  }
  return [{
    retailer:'Amazon Australia',productIdentifier:d.asin,asin:d.asin,kind:'affiliate-direct',exactUrl:d.url,affiliateUrl:d.url,url:d.url,
    imageUrl:null,imageSource:'Amazon Creators API — not yet connected',
    imageProvenance:'No Amazon image is displayed until authorised Creators API credentials are configured and the returned product identifier matches the verified ASIN.',
    imageVerified:false,verified:d.verified,variant:d.variant,availabilityConfidence:d.confidence,note:d.note
  }];
}
module.exports={...base,direct,retailersFor,additions,modelSearch};