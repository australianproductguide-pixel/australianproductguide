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
  'sonos-beam-gen-2':[
    exactListing({
      retailer:'The Good Guys',
      url:'https://www.thegoodguys.com.au/sonos-beam-gen-2-beam2au1blk',
      variant:'Sonos Beam Gen 2 · Black · BEAM2AU1BLK',
      note:'Exact BEAM2AU1BLK Australian retailer model verified. APG leaves current promotional price, delivery and stock live-at-retailer.'
    }),
    exactListing({
      retailer:'Harvey Norman',
      url:'https://www.harveynorman.com.au/sonos-beam-gen-2-smart-soundbar-black.html',
      variant:'Sonos Beam Gen 2 · Black · BEAM2AU1BLK · GTIN 840136802389',
      note:'A second independent Australian destination for the same BEAM2AU1BLK variant is verified using model and GTIN identity controls. Price and availability remain live-at-retailer.'
    })
  ],
  'benq-gv50':[
    exactListing({
      retailer:'Umart',
      url:'https://www.umart.com.au/product/benq-gv50-1080p-laser-portable-projector-13bqgv50-85506',
      variant:'BenQ GV50 · 1080p Laser Portable Projector · 13BQGV50',
      note:'Exact 13BQGV50 Australian retailer model verified. APG does not copy the current ticket price or location-specific availability.'
    }),
    exactListing({
      retailer:'Scorptec',
      url:'https://www.scorptec.com.au/product/projectors/projectors/116716-gv50',
      variant:'BenQ GV50 · 1080p Laser DLP Portable Projector · GV50',
      note:'Exact GV50 Australian retailer destination independently verified. APG leaves changing price, delivery and store availability live-at-retailer.'
    })
  ],
  'alienware-aw2725dm':[
    exactListing({
      retailer:'Dell Australia',
      url:'https://www.dell.com/en-au/shop/alienware-27-qhd-gaming-monitor-aw2725dm/apd/210-bqqj/monitors-monitor-accessories',
      variant:'Alienware AW2725DM · Dell part 210-BQQJ · Manufacturer part K7F0V',
      sourceType:'manufacturer-direct-au',
      note:'Exact Australian Dell product destination verified. Orderability can change, so APG records the identity-controlled destination without copying a live price or stock claim.'
    })
  ],
  'corsair-hs55-stereo':[
    exactListing({
      retailer:'JB Hi-Fi',
      url:'https://www.jbhifi.com.au/products/corsair-hs55-stereo-gaming-headset-carbon',
      variant:'Corsair HS55 Stereo · Carbon · CA-9011260-AP · SKU 640943',
      note:'Exact CA-9011260-AP Australian retailer variant verified. This is the Stereo model, not the separate HS55 Surround or Wireless variants.'
    }),
    exactListing({
      retailer:'Umart',
      url:'https://www.umart.com.au/product/corsair-hs55-stereo-gaming-headset-carbon-ca-9011260-ap-64909',
      variant:'Corsair HS55 Stereo · Carbon · CA-9011260-AP',
      note:'A second independent destination for exact model CA-9011260-AP is verified. APG leaves ticket price and stock live-at-retailer.'
    })
  ],
  'logitech-brio-4k-webcam':[
    exactListing({
      retailer:'Umart',
      url:'https://www.umart.com.au/product/logitech-brio-4k-uhd-webcam-with-windows-hello-support-960-001723-87003',
      variant:'Logitech Brio 4K UHD Webcam · 960-001723',
      note:'Exact Logitech part 960-001723 Australian retailer destination verified. APG leaves price and location-specific stock live-at-retailer.'
    }),
    exactListing({
      retailer:'MediaForm',
      url:'https://www.mediaform.com.au/logitech-brio-4k-webcam-windows-hello-supported/',
      variant:'Logitech Brio 4K Webcam · 960-001723',
      note:'A second independent Australian destination for Logitech part 960-001723 is verified. APG does not copy the retailer price or stock state.'
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
      product.retailerCoverageVersion='evidence-commerce-depth-v27-pass5';
    }
  }
  return {offersAdded,productsExpanded,verifiedRetailers:[...retailerSet].sort()};
}

module.exports={VERIFIED,OFFER_REVIEW_DUE,OFFERS,exactListing,apply};
