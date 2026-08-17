const VERIFIED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const OFFER_REVIEW_DUE='2026-08-24';

function exactOffer({retailer,url,price=null,availability='check-current',variant,note,sourceType='manufacturer-direct-au'}){
  return {retailer,url,price,currency:'AUD',availability,checkedAt:VERIFIED,reviewDue:OFFER_REVIEW_DUE,exactModel:true,affiliate:false,sourceType,variant:variant||null,note};
}

function addProduct(category,maintainedProduct,row){
  if(!category||category.products.some(p=>p.slug===row.slug))return false;
  category.products.push(maintainedProduct({
    ...row,
    price:null,
    sourceType:'Official Australian manufacturer product/specification page · exact product family or model verified 17 Aug 2026',
    evidenceTier:'deep',
    evidenceLabel:'Manufacturer-verified evidence',
    testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',
    publicationStatus:'LIVE / MAINTAINED',
    firstResearched:VERIFIED,
    lastSubstantiveReview:VERIFIED,
    lastSourceVerification:VERIFIED,
    lastRetailerCheck:VERIFIED,
    lastPriceCheck:row.offers?.some(x=>Number.isFinite(x.price))?VERIFIED:null,
    lastImageVerification:VERIFIED,
    nextReviewDue:NEXT_REVIEW,
    nextPriceReviewDue:row.offers?.some(x=>Number.isFinite(x.price))?OFFER_REVIEW_DUE:null,
    freshnessStatus:'reviewed-this-month'
  },category));
  return true;
}

function apply({nationalCategories,maintainedProduct}){
  const phones=nationalCategories['smartphones'];
  const washers=nationalCategories['washing-machines'];

  const phoneRows=[
    {
      id:'APG-V42-PHONE-IP17PRO',slug:'apple-iphone-17-pro',brand:'Apple',name:'iPhone 17 Pro',model:'iPhone 17 Pro 6.3-inch',
      summary:'Apple’s 6.3-inch Pro iPhone for buyers who want iOS, the A19 Pro platform, a three-camera 48MP Pro Fusion system and faster USB 3 connectivity.',
      highlights:['6.3-inch Super Retina XDR OLED with ProMotion up to 120Hz','A19 Pro chip with 6-core GPU','48MP Pro Fusion Main, Ultra Wide and Telephoto cameras with USB 3 up to 10Gbps'],
      watch:'The Pro model carries a substantial premium over the standard iPhone 17. Choose it for its camera, sustained-performance and connectivity advantages rather than the Pro badge alone.',
      source:'https://www.apple.com/au/iphone-17-pro/specs/',tags:['iphone','ios','camera','premium','120hz','usb3'],
      decisionAttributes:{ecosystem:'iOS',displayInches:6.3,refreshHz:120,proCamera:true,usb3:true},
      offers:[exactOffer({retailer:'Apple Australia',url:'https://www.apple.com/au/shop/buy-iphone/iphone-17-pro/6.3-inch-display-256gb-cosmic-orange',price:1999,availability:'available-to-order',variant:'iPhone 17 Pro 6.3-inch, 256GB, Cosmic Orange',note:'Apple Australia direct offer observed 17 Aug 2026. Price is for the specified 256GB colour variant, not a whole-of-market lowest-price claim.'})]
    },
    {
      id:'APG-V42-PHONE-S26U',slug:'samsung-galaxy-s26-ultra',brand:'Samsung',name:'Galaxy S26 Ultra',model:'Galaxy S26 Ultra',
      summary:'Samsung’s 6.9-inch flagship for buyers prioritising a large anti-reflective display, S Pen productivity, the 200MP main camera system and premium Galaxy AI features.',
      highlights:['6.9-inch display with built-in Privacy Display','200MP wide, 50MP ultra-wide and 50MP telephoto camera system','5,000mAh battery and Snapdragon 8 Elite Gen 5 for Galaxy'],
      watch:'It is large and expensive. Buyers who do not need S Pen, the Ultra camera system or the 6.9-inch display should compare the smaller S26 models and competing flagships.',
      source:'https://www.samsung.com/au/smartphones/galaxy-s26-ultra/',tags:['android','camera','premium','large-screen','galaxy-ai','s-pen'],
      decisionAttributes:{ecosystem:'Android',displayInches:6.9,batteryMah:5000,mainCameraMp:200,stylus:true},
      offers:[exactOffer({retailer:'Samsung Australia',url:'https://www.samsung.com/au/smartphones/galaxy-s26-ultra/buy/?modelCode=SM-S948BZWAATS',price:2199,availability:'available-to-order',variant:'Galaxy S26 Ultra 256GB / 12GB, White, SM-S948BZWAATS',note:'Samsung Australia direct price for the specified 256GB White variant observed 17 Aug 2026. Trade-in promotions are excluded from APG’s maintained price observation.'})]
    },
    {
      id:'APG-V42-PHONE-P10PRO',slug:'google-pixel-10-pro',brand:'Google',name:'Pixel 10 Pro',model:'Pixel 10 Pro 6.3-inch',
      summary:'Google’s compact Pro flagship for buyers prioritising Pixel software, a 1–120Hz LTPO display, the Pro triple-camera system, Qi2/Pixelsnap charging and long software support.',
      highlights:['6.3-inch Super Actua LTPO OLED with 1–120Hz refresh','50MP wide, 48MP ultra-wide and 48MP telephoto Pro camera system','Tensor G5 platform, Qi2-certified Pixelsnap charging and seven years of updates from launch'],
      watch:'Charging speed and battery size trail some larger Android flagships, and the best fit depends heavily on whether Google’s software and AI experience is what you want long term.',
      source:'https://store.google.com/au/product/pixel_10_pro_specs?hl=en-GB',tags:['android','camera','premium','compact','qi2','google-ai'],
      decisionAttributes:{ecosystem:'Android',displayInches:6.3,refreshHz:120,batteryMah:4870,qi2:true,proCamera:true},
      offers:[exactOffer({retailer:'Google Store Australia',url:'https://store.google.com/au/config/pixel_10_pro?hl=en-GB&sku=_pixel_10_pro_obsidian_128gb_unlocked',price:1299,availability:'available-to-order',variant:'Pixel 10 Pro, Obsidian, 128GB, unlocked',note:'Google Store Australia configured offer observed 17 Aug 2026. Pricing can change after the source check; APG does not represent this as the market’s lowest price.'})]
    },
    {
      id:'APG-V42-PHONE-ZFLIP7',slug:'samsung-galaxy-z-flip7',brand:'Samsung',name:'Galaxy Z Flip7',model:'Galaxy Z Flip7',
      summary:'A compact foldable Android flagship for buyers who value pocketability, a large cover display and FlexCam-style use more than a conventional slab-phone design.',
      highlights:['4.1-inch FlexWindow cover display with up to 120Hz refresh','50MP main camera and FlexCam use cases','4,300mAh battery with 12GB memory and 256GB or 512GB storage options'],
      watch:'Foldables introduce a hinge, flexible display and different durability trade-offs. Compare long-term ownership, repair considerations and camera priorities against conventional flagships.',
      source:'https://www.samsung.com/au/smartphones/galaxy-z-flip7/',tags:['android','foldable','compact','camera','galaxy-ai','premium'],
      decisionAttributes:{ecosystem:'Android',foldable:true,coverDisplayInches:4.1,batteryMah:4300,mainCameraMp:50},
      offers:[exactOffer({retailer:'Samsung Australia',url:'https://www.samsung.com/au/smartphones/galaxy-z/galaxy-z-flip7-coralred-256gb-sm-f766bzraats/buy/',availability:'available-to-configure',variant:'Galaxy Z Flip7 256GB / 12GB, Coralred, SM-F766BZRAATS',note:'Exact Samsung Australia product variant destination verified 17 Aug 2026. APG intentionally does not retain an observed price because the surfaced Samsung page included an expired promotion.'})]
    }
  ];

  const washerRows=[
    {
      id:'APG-V42-WASH-WH1260H5',slug:'fisher-paykel-wh1260h5-series-11-12kg-front-loader',brand:'Fisher & Paykel',name:'Series 11 12kg Front Loader Washer FlexiDose',model:'WH1260H5',
      summary:'A premium 12kg smart front loader for large households wanting high capacity, FlexiDose auto dosing, fibre-specific care and a 7-inch touchscreen.',
      highlights:['12kg capacity with 1,400rpm maximum spin','FlexiDose, load/soil/colour sensing and care for 15 fibre types','5-star energy and 5-star WELS water ratings'],
      watch:'The large capacity and premium control system come at a high purchase price. Check physical depth and whether your normal loads justify 12kg before paying for capacity you may not use.',
      source:'https://www.fisherpaykel.com/au/laundry/washing-machines/front-load/12kg-series-11-contemporary-front-loader-washer-flexidose-wh1260h5-92318.html',tags:['12kg','auto-dose','smart','energy-efficient','large-family','premium'],
      decisionAttributes:{capacityKg:12,spinRpm:1400,energyStars:5,waterStars:5,autoDose:true,widthMm:602,depthMm:661},
      offers:[exactOffer({retailer:'Fisher & Paykel Australia',url:'https://www.fisherpaykel.com/au/laundry/washing-machines/front-load/12kg-series-11-contemporary-front-loader-washer-flexidose-wh1260h5-92318.html',price:3899,availability:'available-to-order',variant:'WH1260H5, White',note:'Fisher & Paykel Australia direct price observed 17 Aug 2026. This is a manufacturer-direct offer, not a whole-of-market lowest-price claim.'})]
    },
    {
      id:'APG-V42-WASH-MIELE-WQ1000',slug:'miele-wq-1000-wps-nova-edition',brand:'Miele',name:'WQ 1000 WPS Nova Edition',model:'WQ 1000 WPS Nova Edition',
      summary:'A premium 9kg Miele W2 front loader for buyers prioritising fabric care, TwinDos automatic dispensing, SmartMatic automation and a high 1,600rpm spin speed.',
      highlights:['9kg capacity and 1,600rpm maximum spin','InfinityCare honeycomb drum and SmartMatic automatic programme','TwinDos automatic detergent dispensing and M Touch Pro display'],
      watch:'This is a very high-priced 9kg washer. Its case rests on premium fabric-care and automation features rather than capacity-per-dollar, so compare those benefits against simpler alternatives.',
      source:'https://www.miele.com.au/domestic/washing-machines-1566.htm?info=accessory&mat=12695700&name=WQ_1000_WPS_Nova_Edition',tags:['9kg','auto-dose','premium','fabric-care','1600rpm','smart'],
      decisionAttributes:{capacityKg:9,spinRpm:1600,autoDose:true,premiumCare:true},
      offers:[exactOffer({retailer:'Miele Australia',url:'https://www.shop.miele.com.au/WFS/Miele-AU-Site/en_AU/-/AUD/laundry/washing-machines/wq-1000-wps-nova-edition-zid12695700/',price:5499,availability:'in-stock',variant:'WQ 1000 WPS Nova Edition',note:'Miele Australia shop price and in-stock status observed 17 Aug 2026. Recheck at purchase because price and stock can change.'})]
    },
    {
      id:'APG-V42-WASH-ASKO-W4104',slug:'asko-w4104c-w-au-10kg-washing-machine',brand:'ASKO',name:'Steel Seal 10kg Washing Machine',model:'W4104C.W.AU',
      summary:'A 10kg front loader for buyers wanting a large drum, hygienic Steel Seal door construction, Quattro vibration control and a broad 22-program set.',
      highlights:['10kg capacity and 1,400rpm maximum spin','Steel Seal door and Quattro Construction','22 programs with 5-star energy and water ratings on the Australian product page'],
      watch:'It is a premium appliance without the auto-dose emphasis of some rivals. Decide whether build, hygiene and vibration-control features matter more to you than dosing automation or a lower purchase price.',
      source:'https://au.asko.com/products/laundry/washing-machines/logic/WASHER-WM85-14000-W4104C-W-AU-ASK/p/000000000000592078?tab=overview',tags:['10kg','family','premium','quiet','hygiene','1400rpm'],
      decisionAttributes:{capacityKg:10,spinRpm:1400,energyStars:5,waterStars:5,steelSeal:true},
      offers:[exactOffer({retailer:'ASKO Australia',url:'https://au.asko.com/products/laundry/washing-machines/logic/WASHER-WM85-14000-W4104C-W-AU-ASK/p/000000000000592078?tab=overview',price:2799,availability:'in-stock',variant:'W4104C.W.AU, White',note:'ASKO Australia direct price and in-stock status observed 17 Aug 2026. Recheck current availability before purchase.'})]
    }
  ];

  let added=0;
  for(const row of phoneRows)if(addProduct(phones,maintainedProduct,row))added++;
  for(const row of washerRows)if(addProduct(washers,maintainedProduct,row))added++;
  if(phones)phones.comparisonLimit=Math.max(phones.comparisonLimit||0,10);
  if(washers)washers.comparisonLimit=Math.max(washers.comparisonLimit||0,10);
  return {added,phoneCount:phones?.products.length||0,washerCount:washers?.products.length||0};
}

module.exports={VERIFIED,NEXT_REVIEW,OFFER_REVIEW_DUE,exactOffer,apply};
