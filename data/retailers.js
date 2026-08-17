const TAG='auproductguid-22';

const AMAZON_IMAGE_CHANNELS={
  manualApproved:{
    provider:'Amazon Associates approved manual display tools',
    marketplace:'www.amazon.com.au',
    partnerTag:TAG,
    status:'approved-source-record-required',
    active:true,
    imagePolicy:'Current pre-API pathway: only record product imagery obtained through an Amazon Associates-approved image/linking mechanism for the matching product. Do not scrape Amazon product pages, reverse-engineer image URLs, copy customer images or treat Amazon Program Content as APG-owned media.',
    reviewed:'2026-08-17'
  },
  futureApi:{
    provider:'Amazon Creators API / Product Advertising API capability',
    marketplace:'www.amazon.com.au',
    partnerTag:TAG,
    status:'credentials-required',
    active:false,
    imagePolicy:'Future pathway only. Use image content returned through an authorised Amazon API integration for the matching identifier and follow the applicable linking, caching and freshness rules. Do not fabricate credentials or API responses.',
    reviewed:'2026-08-17'
  }
};
const CREATORS_API=AMAZON_IMAGE_CHANNELS.futureApi;

const direct={
  'bose-quietcomfort-ultra-headphones':{url:`https://www.amazon.com.au/Bose-QuietComfort-Wireless-Cancelling-Headphones/dp/B0CCZ1HQ39?tag=${TAG}`,asin:'B0CCZ1HQ39',verified:'2026-08-16',variant:'QuietComfort Ultra Headphones',confidence:'high',note:'Exact Bose QuietComfort Ultra Amazon Australia individual product page verified; colour/offer may vary.'},
  'sennheiser-momentum-4-wireless':{url:`https://www.amazon.com.au/Sennheiser-Momentum-Special-Headphones-Metallic/dp/B0CCRZPKR1?tag=${TAG}`,asin:'B0CCRZPKR1',verified:'2026-08-16',variant:'MOMENTUM 4 Wireless special-edition offer',confidence:'high',note:'Exact MOMENTUM 4 Wireless product family verified on Amazon Australia; current offer may be an imported/special-edition variant.'},
  'philips-5000-series-dual-basket-na55100':{url:`https://www.amazon.com.au/Philips-Technology-Versatile-NA551-00/dp/B0DHS253VZ?tag=${TAG}`,asin:'B0DHS253VZ',verified:'2026-08-16',variant:'NA551/00 black/silver 9L Dual Basket + Steam',confidence:'high',note:'Exact Philips 5000 Series Dual Basket Airfryer NA551/00 Amazon Australia individual listing independently verified.'},
  'amazon-eero-max-7':{url:`https://www.amazon.com.au/eero-Ethernet-Coverage-Connect-devices/dp/B0CPKX85TD?tag=${TAG}`,asin:'B0CPKX85TD',verified:'2026-08-16',variant:'eero Max 7 one-pack',confidence:'high',note:'Exact eero Max 7 one-pack individual Amazon Australia listing independently verified.'},
  'anker-737-power-bank-24000mah-140w':{url:`https://www.amazon.com.au/Anker-PowerCore-Portable-Charger-Compatible/dp/B09VPHVT2Z?tag=${TAG}`,asin:'B09VPHVT2Z',verified:'2026-08-16',variant:'Anker 737 Power Bank / PowerCore 24K, model A1289',confidence:'high',note:'Exact Anker 737 Power Bank 24,000mAh 140W individual Amazon Australia listing independently verified.'},
  'amazon-kindle-paperwhite-signature-edition-32gb':{url:`https://www.amazon.com.au/All-new-Amazon-Kindle-Paperwhite-Signature/dp/B0CFPHSTDD?tag=${TAG}`,asin:'B0CFPHSTDD',verified:'2026-08-16',variant:'Kindle Paperwhite Signature Edition 32GB, 12th generation / 2024 release',confidence:'high',note:'Exact Kindle Paperwhite Signature Edition 32GB individual Amazon Australia listing independently verified.'},
  'tp-link-tapo-c500':{url:`https://www.amazon.com.au/TP-Link-Tapo-Detection-supported-C500/dp/B0BQJVKVQR?tag=${TAG}`,asin:'B0BQJVKVQR',verified:'2026-08-16',variant:'Tapo C500 outdoor pan/tilt camera',confidence:'high',note:'Exact Tapo C500 individual Amazon Australia listing verified. Shoppers should confirm the current seller, included plug and offer details before purchase.'},
  'tp-link-tapo-c410':{url:`https://www.amazon.com.au/Tapo-C410-Detection-Required-Compatible/dp/B0D3814FFN?tag=${TAG}`,asin:'B0D3814FFN',verified:'2026-08-16',variant:'Tapo C410 battery Wi-Fi camera',confidence:'high',note:'Exact Tapo C410 individual Amazon Australia listing verified.'},
  'reolink-argus-3-ultra':{url:`https://www.amazon.com.au/REOLINK-Solar-Argus-Ultra-Panel/dp/B0C53F5PY3?tag=${TAG}`,asin:'B0C53F5PY3',verified:'2026-08-16',variant:'Argus 3 Ultra with solar panel',confidence:'high',note:'Exact Reolink Argus 3 Ultra Amazon Australia listing verified; this offer includes a solar panel, so shoppers should confirm bundle contents.'},
  'eufy-eufycam-2c-pro-3-cam-kit':{url:`https://www.amazon.com.au/eufy-Security-Wireless-Resolution-Compatibility/dp/B08PP6DZCW?tag=${TAG}`,asin:'B08PP6DZCW',verified:'2026-08-16',variant:'eufyCam 2C Pro 3-Cam Kit',confidence:'high',note:'Exact eufyCam 2C Pro 3-Cam Kit Amazon Australia listing verified. The observed offer was an imported listing, so local warranty, plug and seller details should be checked.'},
  'apple-airpods-4-with-active-noise-cancellation':{url:`https://www.amazon.com.au/Apple-AirPods-Active-Noise-Cancellation/dp/B0DGJ8YC5N?tag=${TAG}`,asin:'B0DGJ8YC5N',verified:'2026-08-16',variant:'AirPods 4 with Active Noise Cancellation',confidence:'high',note:'Exact Apple AirPods 4 with Active Noise Cancellation configuration verified on Amazon Australia.'},
  'samsung-galaxy-tab-a9':{url:`https://www.amazon.com.au/Samsung-Galaxy-Tablet-Version-Graphite/dp/B0CSZ24PNN?tag=${TAG}`,asin:'B0CSZ24PNN',verified:'2026-08-16',variant:'Galaxy Tab A9+ 11-inch Wi-Fi, 4GB/64GB, Graphite, AU version',confidence:'high',note:'Exact Samsung Galaxy Tab A9+ Australian-version individual Amazon Australia listing verified; capacity/colour are variant-specific.'},
  'crucial-x9-pro-portable-ssd-1tb':{url:`https://www.amazon.com.au/Crucial-Portable-2000MB-1050MB-CT1000X9PROSSD902/dp/B0C9WKGXHD?tag=${TAG}`,asin:'B0C9WKGXHD',verified:'2026-08-16',variant:'Crucial X9 Pro Portable SSD 1TB',confidence:'high',note:'Exact Crucial X9 Pro Portable SSD 1TB Amazon Australia listing verified. The observed listing may be an imported offer, so current seller and warranty terms should be checked.'},
  'philips-oneblade-pro-qp6530-15':{url:`https://www.amazon.com.au/Rechargeable-14-Length-Precision-QP6530-15/dp/B09CB8W64F?tag=${TAG}`,asin:'B09CB8W64F',verified:'2026-08-16',variant:'Philips OneBlade Pro QP6530/15',confidence:'high',note:'Exact Philips OneBlade Pro QP6530/15 individual Amazon Australia listing verified.'},
  'jbl-wave-buds':{url:`https://www.amazon.com.au/JBL-Comfortable-surrounding-Hands-free-VoiceAware/dp/B0BHDMHHM9?tag=${TAG}`,asin:'B0BHDMHHM9',verified:'2026-08-16',variant:'JBL Wave Buds, black, model JBLWBUDSBLK',confidence:'high',note:'Exact JBL Wave Buds individual Amazon Australia listing verified. Do not confuse with the newer Wave Buds 2.'},
  'philips-pureprotect-mini-900-series-ac0950-10':{url:`https://www.amazon.com.au/Philips-PureProtect-Mini-Smart-Purifier/dp/B0D9YNY3DN?tag=${TAG}`,asin:'B0D9YNY3DN',verified:'2026-08-16',variant:'Philips PureProtect Mini 900 Series AC0950/10, Arctic White',confidence:'high',note:'Exact AC0950/10 Amazon Australia individual listing verified.'},
  'logitech-signature-k855':{url:`https://www.amazon.com.au/Logitech-Signature-Wireless-Mechanical-Keyboard/dp/B0BN6WJ1QZ?tag=${TAG}`,asin:'B0BN6WJ1QZ',verified:'2026-08-16',variant:'Logitech Signature K855 / 920-011074, Graphite',confidence:'high',note:'Exact Logitech Signature K855 individual Amazon Australia listing verified; observed offer uses the Graphite variant.'},
  'sony-wh-1000xm6':{url:`https://www.amazon.com.au/Sony-WH1000XM6-Cancelling-Wireless-Headphones/dp/B0F4DKKPN1?tag=${TAG}`,asin:'B0F4DKKPN1',verified:'2026-08-16',variant:'Sony WH-1000XM6, Platinum Silver',confidence:'high',note:'Exact Sony WH-1000XM6 Platinum Silver Amazon Australia individual listing verified against recent Australian listing references; shoppers should confirm colour and seller before purchase.'},
  'keychron-k2-pro':{url:`https://www.amazon.com.au/dp/B0BF65KYFM?tag=${TAG}`,asin:'B0BF65KYFM',verified:'2026-08-16',variant:'Keychron K2 Pro 75% wireless mechanical keyboard; switch/backlight option must be confirmed on listing',confidence:'high',note:'Exact Keychron K2 Pro Amazon Australia product page verified via a current Australian gear listing; APG does not assert a switch or backlight variant, so shoppers must confirm the selected option.'}
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
    imageSource:'No approved Amazon product-image mapping connected',
    imageSourceType:null,
    imageProvenance:'No Amazon image is displayed until it is obtained through a current Amazon Associates-approved manual image/linking mechanism for the matching product, or later through an authorised Amazon API. Product-page scraping and reverse-engineered image URLs are prohibited.',
    imageVerified:false,
    verified:d?.verified||'2026-08-16',
    variant:d?.variant||null,
    availabilityConfidence:d?.confidence||'unverified-exact-listing',
    note:d?.note||'Exact individual Amazon Australia listing was not independently verified in this review; model-specific Amazon search fallback retained to avoid a wrong-product link.'
  }];
}
module.exports={TAG,AMAZON_IMAGE_CHANNELS,CREATORS_API,direct,amazonSearch,retailersFor};
