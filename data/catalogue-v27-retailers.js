const VERIFIED='2026-08-18';
const OFFER_REVIEW_DUE='2026-08-25';

function exactListing({retailer,url,variant,sourceType='independent-retailer-au',note}){
  return {
    retailer,
    url,
    price:null,
    currency:'AUD',
    availability:'listing-verified',
    checkedAt:VERIFIED,
    reviewDue:OFFER_REVIEW_DUE,
    exactModel:true,
    affiliate:false,
    sourceType,
    variant:variant||null,
    note:note||'Exact Australian listing destination verified. APG does not maintain a live price or stock claim for this listing.'
  };
}

const OFFERS={
  'breville-barista-express-impress-bes876':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/breville-the-barista-express-impress-bes876bss4ian1',variant:'BES876BSS4IAN1 · Brushed Stainless Steel',note:'Exact BES876 Australian retailer variant verified. Price and stock are intentionally left live-at-retailer rather than copied into APG.'})
  ],
  'delonghi-rivelia-auto-milk-exam44055b':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/delonghi-rivelia-fully-automatic-coffee-machine-black-exam44055b',variant:'EXAM44055B · Onyx Black',note:'Exact EXAM44055B Australian retailer listing verified. APG does not treat a retailer ticket price as a whole-of-market price.'})
  ],
  'eufy-x10-pro-omni':[
    exactListing({retailer:'eufy Australia',url:'https://www.eufy.com/au/products/eufy-x10-pro-omni',variant:'X10 Pro Omni',sourceType:'manufacturer-direct-au',note:'Exact Australian eufy X10 Pro Omni store destination verified. Current orderability and price remain retailer-controlled and should be rechecked.'})
  ],
  'sony-wh-1000xm6':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/sony-wh-1000xm6-premium-noise-cancelling-over-ear-headphones-silver',variant:'WH1000XM6S · Silver',note:'Exact WH-1000XM6 Silver Australian retailer variant verified. Other colour variants can differ in price or availability.'})
  ],
  'sennheiser-momentum-5-wireless':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/sennheiser-momentum-5-over-ear-anc-wireless-headphones-denim',variant:'800080 · Denim',note:'Exact MOMENTUM 5 Denim retailer variant verified. APG keeps price and stock live-at-retailer.'})
  ],
  'sonos-ace':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/sonos-ace-active-noise-cancelling-over-ear-headphones-black',variant:'ACEG1R21BLK · Black',note:'Exact Sonos Ace Black retailer variant verified. APG keeps price and stock live-at-retailer.'})
  ],
  'apple-macbook-air-13-inch-m5':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/apple-macbook-air-13-inch-with-m5-chip-512gb-16gb-sky-blue',variant:'13-inch M5 · 16GB / 512GB · Sky Blue',note:'Exact 13-inch M5 MacBook Air configuration verified. APG product guidance is family-level, so consumers should confirm memory, storage, GPU and colour before purchase.'})
  ],
  'asus-zenbook-a14-ux3407':[
    exactListing({retailer:'Officeworks',url:'https://www.officeworks.com.au/shop/officeworks/p/asus-zenbook-a14-ai-laptop-snapdragon-x-elite-16-512gb-aszbqd105w',variant:'UX3407QA-QD105W · 16GB / 512GB',note:'Exact UX3407QA-QD105W Australian retailer configuration verified. APG product guidance covers the UX3407 family, so processor, memory and storage must be confirmed.'})
  ],
  'hisense-75u6sau-75-inch-u6s-uled-miniled-tv':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/hisense-75-inches-u6sau-4k-uled-miniled-hi-qled-144hz-smart-ai-tv-2026-75u6sau',variant:'75U6SAU',note:'Exact 75U6SAU Australian retailer listing verified. APG keeps current retailer price and stock live-at-retailer because promotional pricing changes frequently.'})
  ],
  'hisense-75u7sau-75-inch-u7s-uled-miniled-tv':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/hisense-uled-miniled-75-inches-4k-165hz-tv-2026-75u7sau',variant:'75U7SAU',note:'Exact 75U7SAU Australian retailer listing verified. APG keeps current retailer price and stock live-at-retailer because promotional pricing changes frequently.'})
  ]
};

function apply({categoryMaps=[]}={}){
  const products=[];
  for(const map of categoryMaps){
    for(const category of Object.values(map||{}))for(const product of category?.products||[])products.push(product);
  }
  let offersAdded=0,productsExpanded=0;
  const retailerSet=new Set();
  for(const product of products){
    const additions=OFFERS[product.slug];
    if(!additions?.length)continue;
    product.offers=Array.isArray(product.offers)?product.offers:[];
    let changed=false;
    for(const row of additions){
      retailerSet.add(row.retailer);
      if(product.offers.some(x=>x&&x.url===row.url&&x.retailer===row.retailer))continue;
      product.offers.push({...row});
      offersAdded++;
      changed=true;
    }
    if(changed){
      productsExpanded++;
      product.lastRetailerCheck=VERIFIED;
      product.retailerCoverageVersion='evidence-commerce-depth-v27';
    }
  }
  return {offersAdded,productsExpanded,verifiedRetailers:[...retailerSet].sort()};
}

module.exports={VERIFIED,OFFER_REVIEW_DUE,OFFERS,exactListing,apply};
