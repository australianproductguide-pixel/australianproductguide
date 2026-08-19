const VERIFIED='2026-08-20';
const OFFER_REVIEW_DUE='2026-08-27';

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

// Pass 6 deliberately targets maintained categories that previously had zero
// exact Australian destinations. Identity is controlled at exact model level;
// prices, stock and delivery remain live-at-retailer and are not copied into APG.
const OFFERS={
  'steelcase-series-2':[
    exactListing({
      retailer:'Steelcase Australia',
      url:'https://au.steelcase.com/products/series-2',
      variant:'Steelcase Series 2 ergonomic office chair · Australian direct store',
      sourceType:'manufacturer-direct-au',
      note:'Exact Steelcase Series 2 Australian manufacturer destination verified. Configuration, price, lead time and availability can change, so APG leaves those values live at Steelcase Australia.'
    })
  ],
  'ergotune-joobie':[
    exactListing({
      retailer:'ErgoTune Australia',
      url:'https://au.ergotune.com/products/ergotune-joobie',
      variant:'ErgoTune Joobie ergonomic office chair · Australian direct store',
      sourceType:'manufacturer-direct-au',
      note:'Exact ErgoTune Joobie Australian manufacturer destination verified. Colour, footpad configuration, price and delivery remain live at ErgoTune Australia.'
    })
  ],
  'secretlab-magnus-pro':[
    exactListing({
      retailer:'Secretlab Australia',
      url:'https://secretlabchairs.com.au/pages/magnus-pro',
      variant:'Secretlab MAGNUS Pro sit-to-stand metal desk · Australia',
      sourceType:'manufacturer-direct-au',
      note:'Exact Secretlab MAGNUS Pro Australian manufacturer shopping destination verified. Size, finish, accessory configuration, price and availability remain live at Secretlab Australia.'
    })
  ],
  'r-de-nt-usb':[
    exactListing({
      retailer:'JB Hi-Fi',
      url:'https://www.jbhifi.com.au/products/rode-nt-usb-professional-usb-microphone',
      variant:'RØDE NT-USB+ professional USB microphone',
      note:'Exact RØDE NT-USB+ Australian retailer destination verified. APG does not copy the current ticket price, promotion or location-specific availability.'
    })
  ],
  'asus-zenscreen-mb16acv':[
    exactListing({
      retailer:'Scorptec',
      url:'https://www.scorptec.com.au/product/monitors/22-inch-and-below/90477-mb16acv',
      variant:'ASUS ZenScreen MB16ACV 15.6-inch FHD portable USB-C monitor · model MB16ACV',
      note:'Exact ASUS MB16ACV Australian retailer model verified. APG leaves current price, delivery and store availability live at Scorptec.'
    })
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
      product.retailerCoverageVersion='evidence-commerce-depth-v27-pass6';
    }
  }
  return {offersAdded,productsExpanded,verifiedRetailers:[...retailerSet].sort()};
}

module.exports={VERIFIED,OFFER_REVIEW_DUE,OFFERS,exactListing,apply};
