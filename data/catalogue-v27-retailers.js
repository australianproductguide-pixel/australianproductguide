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
  ],
  'tp-link-tapo-c500':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/tp-link-tapo-outdoor-pan-tilt-wifi-security-camera',variant:'TAPO-C500 · SKU 631856',note:'Exact Tapo C500 Australian retailer listing verified. APG does not copy the retailer ticket price or imply live stock.'})
  ],
  'apple-airpods-4-with-active-noise-cancellation':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/apple-airpods-4-with-active-noise-cancellation',variant:'AirPods 4 with Active Noise Cancellation · current JB model MXP93ZA/A · SKU 754745',note:'Exact AirPods 4 with Active Noise Cancellation retailer destination verified. Retailer model coding can change over time, so APG records the current observed retailer identity and leaves price and stock live-at-retailer.'})
  ],
  'dji-osmo-action-5-pro':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/dji-osmo-action-5-pro-adventure-combo',variant:'Osmo Action 5 Pro Adventure Combo · CP.OS.00000350.01 · SKU 786705',note:'Exact Osmo Action 5 Pro Adventure Combo retailer variant verified. APG guidance is family-level, so consumers should confirm Standard versus Adventure Combo contents before purchase.'})
  ],
  'logitech-signature-k855':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/logitech-k855-wireless-mechanical-tkl-keyboard-blue-grey-linear',variant:'Signature K855 · 920-011221(K855) · Blue/Grey Linear',note:'Exact Logitech K855 Australian retailer variant verified. Switch and colour variants can differ, so APG records the verified Blue/Grey linear-switch configuration.'})
  ],
  'tp-link-archer-be550':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/tp-link-archer-be550-wi-fi-7-router',variant:'ARCHER-BE550 · SKU 686660',note:'Exact Archer BE550 Australian retailer listing verified. APG leaves current price and orderability live-at-retailer.'})
  ],
  'philips-5000-series-dual-basket-na55100':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/philips-5000-series-9-litre-xxl-dual-basket-steam-airfryer-black-na55100',variant:'NA551/00 · 9L XXL Dual Basket Steam Airfryer · Black/Silver',note:'Exact NA551/00 Australian retailer listing verified. APG leaves current promotional price and stock live-at-retailer.'})
  ],
  'philips-pureprotect-mini-900-series-ac0950-10':[
    exactListing({retailer:'The Good Guys',url:'https://www.thegoodguys.com.au/philips-900i-series-air-purifier-white-ac095010',variant:'AC0950/10 · 900i Series · Arctic White',note:'Exact AC0950/10 Australian retailer listing verified. Product naming differs between APG and retailer copy, so the model number is the identity control.'})
  ],
  'samsung-galaxy-tab-a9':[
    exactListing({retailer:'Officeworks',url:'https://www.officeworks.com.au/shop/officeworks/p/samsung-galaxy-tab-a9-wifi-128gb-graphite-samtaba915',variant:'Galaxy Tab A9+ Wi-Fi 128GB Graphite · SM-X210NZAEXSA · SAMTABA915',note:'Exact Galaxy Tab A9+ Wi-Fi 128GB Australian retailer configuration verified. APG guidance is family-level, so cellular, storage and memory configuration must be confirmed before purchase.'})
  ],
  'amazon-kindle-2024':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/kindle-11th-gen-6-16gb-black2024',variant:'Kindle 11th Gen 6-inch 16GB Black [2024] · B0CP31L73X · SKU 749550',note:'Exact 2024 16GB Black Kindle retailer variant verified. Colour variants may use different retailer model identifiers.'})
  ],
  'amazon-kindle-paperwhite-signature-edition-32gb':[
    exactListing({retailer:'JB Hi-Fi',url:'https://www.jbhifi.com.au/products/kindle-paperwhite-12th-gen-7-signature-edition-32gb',variant:'Kindle Paperwhite 12th Gen 7-inch Signature Edition 32GB · B0CFPHTMDX · SKU 778670',note:'Exact current 32GB Signature Edition Australian retailer destination verified. APG records the retailer generation/variant explicitly rather than generalising it to older Paperwhite generations.'})
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
