'use strict';

const v96=require('./action4-decision-evidence-v96');

const VERSION='97.0';
const SCHEMA_VERSION='category-decision-schema-v2.1';
const DEPTH_STANDARD_VERSION='evidence-depth-standard-v2.1';
const VERIFIED_AT='2026-08-24';
const REVIEW_DUE='2026-08-31';

const categorySchemas=Object.fromEntries(Object.entries(v96.categorySchemas).map(([slug,schema])=>[
  slug,
  {...schema,version:SCHEMA_VERSION,strongDepthRequired:[...(schema.strongDepthRequired||[])]}
]));
categorySchemas['robot-vacuums']={...categorySchemas['robot-vacuums'],strongDepthRequired:['pet-hair','hard-floor','obstacle-avoidance','mopping','dock-automation']};

const categoryNouns={
  'laptops':['laptop','laptops','notebook','notebooks','computer laptop'],
  'robot-vacuums':['robot vacuum','robot vacuums','robotic vacuum','robotic vacuums','robot cleaner','robot cleaners'],
  'wireless-headphones':['headphone','headphones','wireless headphone','wireless headphones','noise cancelling headphones'],
  'coffee-machines':['coffee machine','coffee machines','espresso machine','espresso machines'],
  'televisions':['tv','tvs','television','televisions','smart tv','smart tvs']
};

const entityOverrides=[
  {
    slug:'meross-mini-smart-wi-fi-plug',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Smart Wi-Fi Plug with Energy Monitor MSS315 AU',correctedModel:'MSS315 AU',region:'AU',issueType:'replacement-required',resolution:'RESOLVED_CURRENT_AU_REPLACEMENT',
    authoritativeSource:'https://www.meross.com/Detail/',sourceType:'manufacturer-product-index',
    note:'Meross currently lists MSS315 AU as the Australian Smart Wi-Fi Plug with Energy Monitor. The APG generic mini-plug entity is corrected to the current Australian model rather than borrowing US/EU/UK MSS315 specifications.'
  },
  {
    slug:'meross-smart-wi-fi-plug-4-pack',status:v96.ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,
    correctedName:'Meross MSS315 4-Pack (US Version)',correctedModel:'MSS315 4-Pack US',region:'US',issueType:'regional-mismatch',resolution:'RESOLVED_NON_AU_4_PACK',
    authoritativeSource:'https://shop.meross.com/products/matter-smart-plug-mss315-us',sourceType:'manufacturer-store',
    note:'The maintained four-pack currently resolves to Meross MSS315 4-Pack (US Version). APG must not present that pack as an Australian plug variant.'
  },
  {
    slug:'esr-qi2-3-in-1-travel-wireless-charging-set',status:v96.ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,
    correctedName:'ESR Qi2 3-in-1 Travel Wireless Charging Set - US Plug',correctedModel:'Qi2 3-in-1 Travel - US Plug',region:'US',issueType:'regional-mismatch',resolution:'RESOLVED_NON_AU_QI2_VARIANT',
    authoritativeSource:'https://au.esrtech.com/products/qi2-3-in-1-travel-wireless-charging-set-brown-us-plug',sourceType:'manufacturer-au-storefront',
    note:'ESR’s Australian storefront currently identifies the Qi2 travel set as a US-plug variant. A separate non-Qi2 travel set has an AU plug; APG must not substitute that sibling product.'
  },
  {
    slug:'remington-shine-therapy-s8500au',status:v96.ENTITY_STATUS.HISTORICAL,eligibility:v96.RECOMMENDATION_ELIGIBILITY.HISTORICAL,
    correctedName:'Remington Shine Therapy S8500AU',correctedModel:'S8500AU',region:'AU',issueType:'currentness',resolution:'RESOLVED_HISTORICAL',
    authoritativeSource:'https://www.remington-products.com.au/',sourceType:'manufacturer-au-current-range-check',
    note:'Exact S8500AU identity is retained for historical/search value, but it is not treated as a current primary Australian recommendation because it is not in the current Remington Australia straightener range checked for Action 4.1.'
  },
  {
    slug:'therabody-theragun-mini',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Theragun Mini (3rd Gen)',correctedModel:'Theragun Mini 3rd Gen',generation:'3rd Gen',region:'AU',issueType:'generation-ambiguous',resolution:'RESOLVED_GENERATION_3',
    authoritativeSource:'https://www.therabody.com/products/theragun-mini-gen-3',sourceType:'manufacturer-primary',
    note:'Current Therabody documentation identifies Theragun Mini as 3rd Gen. Generation-specific specifications must remain bound to this generation.'
  },
  {
    slug:'therabody-theragun-prime',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Theragun Prime (6th Gen)',correctedModel:'Theragun Prime 6th Gen',generation:'6th Gen',region:'AU',issueType:'generation-ambiguous',resolution:'RESOLVED_GENERATION_6',
    authoritativeSource:'https://www.therabody.com/pages/get-started-theragun-prime',sourceType:'manufacturer-primary',
    note:'Current Therabody support identifies Theragun Prime as 6th Gen. APG must not mix specifications with earlier Prime generations.'
  },
  {
    slug:'steamery-cirrus-3-iron-steamer',status:v96.ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,
    correctedName:'Steamery Cirrus 3 Iron Steamer',correctedModel:'Cirrus 3',region:'NON_AU',issueType:'regional-mismatch',resolution:'RESOLVED_NO_AU_VARIANT_IN_OFFICIAL_MARKET_LIST',
    authoritativeSource:'https://steamery.co.uk/cirrus-3-iron-steamer',sourceType:'manufacturer-primary',
    note:'Official Cirrus 3 market/voltage documentation lists multiple regional variants but not Australia. APG therefore does not bind another region’s electrical variant to the Australian catalogue.'
  },
  {
    slug:'philips-beardtrimmer-series-5000-bt5515-15',status:v96.ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,
    correctedName:'Philips Beardtrimmer Series 5000 BT5515/15',correctedModel:'BT5515/15',region:'NON_AU_BINDING',issueType:'regional-mismatch',resolution:'RESOLVED_NON_AU_BINDING',
    authoritativeSource:'https://www.philips.com/c-p/BT5515_15/beardtrimmer-series-5000-beard-hair-trimmer',sourceType:'manufacturer-global',
    note:'Exact BT5515/15 product specifications are documented globally, but an exact current Philips Australia product binding was not established. Multi-voltage compatibility is not equivalent to Australian-market identity.'
  },
  {
    slug:'braun-beard-trimmer-series-7-bt7420',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Braun Beard Trimmer 7 BT7420',correctedModel:'BT7420',region:'AU',issueType:'unverified',resolution:'RESOLVED_AU_SERVICE_BINDING',
    authoritativeSource:'https://au.braun.com/en-au/service/products/parts/5806/80761296',sourceType:'manufacturer-au-service',
    note:'Braun Australia service documentation explicitly lists BT7420 as compatible with the Australian 5V AU power plug, providing an Australian-market binding for the exact model.'
  },
  {
    slug:'remington-style-series-b5-beard-trimmer',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Remington Style Series B5 Beard Trimmer',correctedModel:'MB6000AU',region:'AU',issueType:'unverified',resolution:'RESOLVED_EXACT_AU_MODEL',
    authoritativeSource:'https://cdn-img.remington-europe.com/manager/remington/files/mb6000au_ifu.pdf',sourceType:'manufacturer-au-manual',
    note:'The Australian B5 Style Series Beard Trimmer is bound to model MB6000AU from the Australian instruction manual rather than a generic overseas B5 identifier.'
  },
  {
    slug:'waterpik-cordless-advanced-water-flosser',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Waterpik Cordless Advanced 2.0',correctedModel:'WP-580 series',generation:'2.0',region:'GLOBAL_SAME_PRODUCT',issueType:'generation-ambiguous',resolution:'RESOLVED_CURRENT_GENERATION',
    authoritativeSource:'https://www.waterpik.com/pdfs/wp-580-instruction-manual.pdf',sourceType:'manufacturer-manual',
    note:'The maintained entity is corrected to current Cordless Advanced 2.0 / WP-580 series. Retailer and Amazon destinations remain subject to exact Australian offer revalidation.'
  },
  {
    slug:'waterpik-aquarius-wp-660-water-flosser',status:v96.ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,
    correctedName:'Waterpik Aquarius Professional WP-660',correctedModel:'WP-660',region:'NORTH_AMERICA',issueType:'regional-mismatch',resolution:'RESOLVED_NORTH_AMERICA_ONLY',
    authoritativeSource:'https://www.waterpik.com/oral-health/products/dental-water-flosser/WP-660/',sourceType:'manufacturer-primary',
    note:'WP-660 is a North-American electrical model. It must not be treated as an Australian electrical product merely because the Aquarius family is sold internationally.'
  },
  {
    slug:'oral-b-aquacare-4-water-flosser',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Oral-B AquaCare 4 Water Flosser',correctedModel:'80340868',region:'AU',issueType:'unverified',resolution:'RESOLVED_EXACT_AU_RETAIL_BINDING',
    authoritativeSource:'https://www.bigw.com.au/product/oral-b-aquacare-4-water-flosser/p/80340868',sourceType:'exact-au-retailer',
    note:'Exact Australian retail binding established for AquaCare 4 model/product code 80340868. Recommendation remains evidence-led and retailer participation contributes zero points.'
  },
  {
    slug:'anker-solix-c300',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Anker SOLIX C300 Portable Power Station',correctedModel:'SOLIX C300',region:'AU',issueType:'regional-mismatch',resolution:'RESOLVED_CURRENT_AU_MODEL',
    authoritativeSource:'https://www.anker.com/au/products/a1722',sourceType:'manufacturer-au',
    note:'Anker’s Australian SOLIX range distinguishes C300 from C300 DC. The APG entity is bound to the C300 AC/DC portable power station and must not inherit C300 DC specifications.'
  },
  {
    slug:'audio-technica-atr2100x-usb',status:v96.ENTITY_STATUS.CURRENT,eligibility:v96.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,
    correctedName:'Audio-Technica ATR2100x-USB',correctedModel:'ATR2100x-USB',region:'AU_RETAIL_BOUND',issueType:'unverified',resolution:'RESOLVED_EXACT_MODEL_WITH_AU_DISTRIBUTION',
    authoritativeSource:'https://docs.audio-technica.com/us/p52830_atr2100x_usb_um.pdf',sourceType:'manufacturer-manual',
    note:'Exact ATR2100x-USB model specifications are manufacturer-documented and the exact model has Australian distribution/retail evidence. No hands-on APG testing is claimed.'
  }
];

const priceEvidence={
  'apple-macbook-air-13-inch-m5':{price:1799,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.apple.com/au/shop/buy-mac/macbook-air/13-inch-midnight-m5-chip-10-core-cpu-10-core-gpu-16gb-memory-512gb-storage',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-direct-starting-price-exact-base-configuration'},
  'microsoft-surface-laptop-13-8-inch-8th-edition':{price:2391.70,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.microsoft.com/en-au/store/configure/surface-laptop-13-8-inch-8th-edition/8mzbmmcjzpmf/wzqw',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-direct-sale-price-16gb-512gb'},
  'asus-zenbook-a14-ux3407':{price:1497,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.binglee.com.au/products/14-sdrag-x-plus-16g512g-grey-ux3407qa-qd105w',sourceType:'exact-au-retailer',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-exact-sku-ux3407qa-qd105w'},
  'dell-xps-13-2026':{price:1399.20,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.dell.com/en-au/shop/dell-laptops/new-xps-13-laptop-2026/spd/xps13dx13260laptop',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-direct-base-configuration-dx13260-8gb-512gb'},
  'eufy-robot-vacuum-omni-c28':{price:899.95,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.eufy.com/au/collections/robot-vacuums',sourceType:'manufacturer-au-current-sale',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-official-sale-exact-model'},
  'eufy-x10-pro-omni':{price:899.95,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.eufy.com/au/collections/robot-vacuums',sourceType:'manufacturer-au-current-sale',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-official-sale-exact-model'},
  'eufy-robot-vacuum-omni-e25':{price:1799.95,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.eufy.com/au/collections/robot-vacuums',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-official-price-exact-model'},
  'eufy-robot-vacuum-omni-e28':{price:1199.95,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.eufy.com/au/collections/robot-vacuums',sourceType:'manufacturer-au-current-sale',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-official-sale-exact-model'},
  'ecovacs-deebot-t80s-omni':{price:1799,currency:'AUD',status:'CURRENT_VERIFIED',source:'https://www.ecovacs.com/au/shop/deebot-robotic-vacuum-cleaner/deebot-t80s-omni',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,reviewDue:REVIEW_DUE,basis:'current-direct-price-exact-au-model'}
};

const factEvidenceAdditions={
  'apple-macbook-air-13-inch-m5':{
    batteryHours:{value:18,unit:'hours',source:'https://www.apple.com/au/macbook-air/',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'exact-model-family',confidence:'high',note:'Manufacturer-rated maximum; real battery life varies by use.'},
    memoryGB:{value:16,unit:'GB',source:priceEvidence['apple-macbook-air-13-inch-m5'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'exact-base-configuration',confidence:'high'},
    storageGB:{value:512,unit:'GB',source:priceEvidence['apple-macbook-air-13-inch-m5'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'exact-base-configuration',confidence:'high'}
  },
  'microsoft-surface-laptop-13-8-inch-8th-edition':{
    batteryHours:{value:20,unit:'hours-local-video',source:priceEvidence['microsoft-surface-laptop-13-8-inch-8th-edition'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'exact-generation',confidence:'high',note:'Microsoft also states up to 16 hours active web usage; battery varies materially by use and configuration.'},
    memoryGB:{value:16,unit:'GB',source:priceEvidence['microsoft-surface-laptop-13-8-inch-8th-edition'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'priced-configuration',confidence:'high'},
    storageGB:{value:512,unit:'GB',source:priceEvidence['microsoft-surface-laptop-13-8-inch-8th-edition'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'priced-configuration',confidence:'high'}
  },
  'asus-zenbook-a14-ux3407':{
    batteryHours:{value:32,unit:'hours-manufacturer-up-to',source:'https://www.asus.com/au/laptops/for-home/zenbook/asus-zenbook-a14-ux3407/where-to-buy/',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'UX3407-family-upper-bound',confidence:'medium',note:'ASUS states up to 32 hours for the UX3407 family; APG does not present this as measured runtime for every sub-configuration.'},
    memoryGB:{value:16,unit:'GB',source:priceEvidence['asus-zenbook-a14-ux3407'].source,sourceType:'exact-au-retailer',verifiedAt:VERIFIED_AT,applicability:'UX3407QA-QD105W',confidence:'high'},
    storageGB:{value:512,unit:'GB',source:priceEvidence['asus-zenbook-a14-ux3407'].source,sourceType:'exact-au-retailer',verifiedAt:VERIFIED_AT,applicability:'UX3407QA-QD105W',confidence:'high'}
  },
  'dell-xps-13-2026':{
    batteryHours:{value:17,unit:'hours-manufacturer-up-to',source:'https://www.dell.com/en-au/lp/xps',sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'DX13260',confidence:'high',note:'Manufacturer-rated maximum; real battery life varies by use and configuration.'},
    memoryGB:{value:8,unit:'GB',source:priceEvidence['dell-xps-13-2026'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'base-configuration',confidence:'high'},
    storageGB:{value:512,unit:'GB',source:priceEvidence['dell-xps-13-2026'].source,sourceType:'manufacturer-au',verifiedAt:VERIFIED_AT,applicability:'base-configuration',confidence:'high'}
  }
};

const decisionEvidenceAdditions={
  'apple-macbook-air-13-inch-m5':{
    battery:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.apple.com/au/macbook-air/',title:'Apple Australia MacBook Air',type:'manufacturer-au',scope:'M5-generation'}],note:'Manufacturer rates up to 18 hours; APG normalises this to strong battery suitability without claiming measured APG runtime.'},
    university:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['apple-macbook-air-13-inch-m5'].source,title:'Apple Australia exact base configuration',type:'manufacturer-au',scope:'13-inch M5 16GB/512GB'}],note:'Rule-derived from 16GB/512GB base configuration, portable form factor and manufacturer-rated battery; software/course compatibility remains user-specific.'}
  },
  'microsoft-surface-laptop-13-8-inch-8th-edition':{
    battery:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['microsoft-surface-laptop-13-8-inch-8th-edition'].source,title:'Microsoft Australia Surface Laptop 13.8-inch 8th Edition',type:'manufacturer-au',scope:'8th-edition'}],note:'Up to 20 hours local-video / 16 hours active-web manufacturer rating; not APG measured runtime.'},
    university:{value:'strong',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['microsoft-surface-laptop-13-8-inch-8th-edition'].source,title:'Microsoft Australia exact generation and configuration',type:'manufacturer-au',scope:'16GB/512GB'}],note:'Rule-derived from documented portability, 16GB/512GB configuration and battery. Windows-on-Arm software/peripheral compatibility can materially change fit.'}
  },
  'asus-zenbook-a14-ux3407':{
    battery:{value:'strong',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.asus.com/au/laptops/for-home/zenbook/asus-zenbook-a14-ux3407/where-to-buy/',title:'ASUS Australia Zenbook A14 UX3407',type:'manufacturer-au',scope:'UX3407-family'}],note:'ASUS states up to 32 hours for the UX3407 family; APG uses a conservative strong signal because actual runtime varies by exact configuration and workload.'},
    university:{value:'excellent',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['asus-zenbook-a14-ux3407'].source,title:'Bing Lee UX3407QA-QD105W exact Australian SKU',type:'exact-au-retailer',scope:'UX3407QA-QD105W'},{url:'https://www.asus.com/au/laptops/for-home/zenbook/asus-zenbook-a14-ux3407/where-to-buy/',title:'ASUS Australia UX3407 family',type:'manufacturer-au',scope:'UX3407-family'}],note:'Rule-derived from exact 16GB/512GB Australian SKU, sub-1kg chassis and strong manufacturer battery claim. Specialist Windows-on-Arm software compatibility still requires checking.'}
  },
  'dell-xps-13-2026':{
    battery:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.dell.com/en-au/lp/xps',title:'Dell Australia XPS family',type:'manufacturer-au',scope:'DX13260'}],note:'Dell states up to 17 hours for XPS 13 DX13260; not APG measured runtime.'},
    university:{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['dell-xps-13-2026'].source,title:'Dell Australia XPS 13 DX13260 base configuration',type:'manufacturer-au',scope:'8GB/512GB base'}],note:'Rule-derived: excellent portability and good manufacturer battery rating, but the current under-A$1,500 base configuration is 8GB RAM, providing less long-term multitasking headroom than 16GB alternatives.'}
  },
  'eufy-robot-vacuum-omni-c28':{
    'hard-floor':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/eufy-omni-c28-review/',title:'Vacuum Wars Eufy Omni C28 review',type:'credible-independent',scope:'exact-model'}],note:'Independent purchased-unit testing reports strong debris pickup across hard floors and carpets, with minor edge scattering.'},
    'pet-hair':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/eufy-omni-c28-review/',title:'Vacuum Wars Eufy Omni C28 review',type:'credible-independent',scope:'exact-model'}],note:'Vacuum Wars reports 100% embedded pet-hair pickup and 0% long-hair wrap in its tests.'},
    'obstacle-avoidance':{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/eufy-omni-c28-review/',title:'Vacuum Wars Eufy Omni C28 review',type:'credible-independent',scope:'exact-model'}],note:'15 of 24 obstacle-test objects avoided, slightly below that source’s tested average.'},
    mopping:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/eufy-omni-c28-review/',title:'Vacuum Wars Eufy Omni C28 review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing rated the HydroJet roller-mop performance strongly relative to peers.'},
    'dock-automation':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.eufy.com/au/products/eufy-robot-vacuum-omni-c28',title:'eufy Australia C28',type:'manufacturer-au',scope:'exact-model'}],note:'Official 5-in-1 Omni station documents dust emptying, mop washing, refilling, hot-air drying and wastewater collection.'}
  },
  'eufy-x10-pro-omni':{
    'hard-floor':{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/reviews/eufy/x10-pro-omni',title:'RTINGS eufy X10 Pro Omni review',type:'credible-independent',scope:'exact-model'}],note:'RTINGS describes hard-floor debris pickup as mediocre/passable, with fine debris scatter and pathing gaps.'},
    'pet-hair':{value:'limited',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/reviews/eufy/x10-pro-omni',title:'RTINGS eufy X10 Pro Omni review',type:'credible-independent',scope:'exact-model'}],note:'RTINGS reports poor pet-hair pickup on carpet and hair tangling.'},
    'obstacle-avoidance':{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/reviews/eufy/x10-pro-omni',title:'RTINGS eufy X10 Pro Omni review',type:'credible-independent',scope:'exact-model'}],note:'Obstacle avoidance is effective on hard floors but materially weaker on carpet.'},
    mopping:{value:'limited',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/reviews/eufy/x10-pro-omni',title:'RTINGS eufy X10 Pro Omni review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing reports weak dried-stain removal.'},
    'dock-automation':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.eufy.com/au/products/eufy-x10-pro-omni',title:'eufy Australia X10 Pro Omni',type:'manufacturer-au',scope:'exact-model'}],note:'Official all-in-one station handles dust emptying, mop washing/drying and water refilling.'}
  },
  'eufy-robot-vacuum-omni-e25':{
    'hard-floor':{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.techgearlab.com/reviews/smart-home/robot-vacuum/eufy-omni-e25',title:'TechGearLab Eufy Omni E25 review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing describes hard-floor cleaning as decent but below expectations for the price, with some debris/stains left behind.'},
    'pet-hair':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.techgearlab.com/reviews/smart-home/robot-vacuum/eufy-omni-e25',title:'TechGearLab Eufy Omni E25 review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing identifies pet-hair pickup and anti-tangle behaviour as a major strength.'},
    'obstacle-avoidance':{value:'strong',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.techgearlab.com/reviews/smart-home/robot-vacuum/eufy-omni-e25',title:'TechGearLab Eufy Omni E25 review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing reports generally reliable obstacle handling, though navigation in tight spaces can still be inefficient.'},
    mopping:{value:'average',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.techgearlab.com/reviews/smart-home/robot-vacuum/eufy-omni-e25',title:'TechGearLab Eufy Omni E25 review',type:'credible-independent',scope:'exact-model'}],note:'Roller-mop workflow is useful, but independent testing found stubborn dried stains were not fully removed.'},
    'dock-automation':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.eufy.com/au/robot-vacuum-e25',title:'eufy Australia E25',type:'manufacturer-au',scope:'exact-model'}],note:'Official station provides self-emptying, refilling, washing, hot-air drying, wastewater collection and detergent dispensing.'}
  },
  'eufy-robot-vacuum-omni-e28':{
    'hard-floor':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/tools/compare/eufy-omni-e28-vs-eufy-x10-pro-omni/97128/49887',title:'RTINGS E28 vs X10 Pro Omni',type:'credible-independent',scope:'exact-model'}],note:'RTINGS reports the E28 performs better than X10 Pro Omni on hard floors.'},
    'pet-hair':{value:'limited',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/tools/compare/eufy-omni-e28-vs-eufy-x10-pro-omni/97128/49887',title:'RTINGS E28 vs X10 Pro Omni',type:'credible-independent',scope:'exact-model'}],note:'RTINGS reports both E28 and X10 Pro Omni struggle with carpet pet-hair pickup.'},
    'obstacle-avoidance':{value:'average',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.rtings.com/robot-vacuum/tools/compare/eufy-omni-e28-vs-eufy-x10-pro-omni/97128/49887',title:'RTINGS E28 vs X10 Pro Omni',type:'credible-independent',scope:'exact-model'}],note:'Obstacle avoidance remains a documented capability; APG keeps the performance signal conservative pending deeper exact-model obstacle testing.'},
    mopping:{value:'strong',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.eufy.com/au/robot-vacuum-e25',title:'eufy Australia E25/E28 comparison',type:'manufacturer-au',scope:'exact-model-family'}],note:'HydroJet roller mopping and real-time mop washing are documented; this signal does not claim APG hands-on testing.'},
    'dock-automation':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:'https://www.eufy.com/au/robot-vacuum-e25',title:'eufy Australia E25/E28 comparison',type:'manufacturer-au',scope:'exact-model'}],note:'All-in-one station functions are manufacturer documented.'}
  },
  'ecovacs-deebot-t80s-omni':{
    'hard-floor':{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/ecovacs-deebot-t80s-omni-review/',title:'Vacuum Wars ECOVACS DEEBOT T80S Omni review',type:'credible-independent',scope:'exact-model'}],note:'Purchased-unit testing reports strong floor cleaning across hard floors and carpet.'},
    'pet-hair':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/ecovacs-deebot-t80s-omni-review/',title:'Vacuum Wars ECOVACS DEEBOT T80S Omni review',type:'credible-independent',scope:'exact-model'}],note:'Vacuum Wars reports 100% flattened pet-hair pickup and 0% long-hair tangles.'},
    'obstacle-avoidance':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/ecovacs-deebot-t80s-omni-review/',title:'Vacuum Wars ECOVACS DEEBOT T80S Omni review',type:'credible-independent',scope:'exact-model'}],note:'21 of 24 obstacle-test objects avoided in independent testing, materially above that source’s average.'},
    mopping:{value:'strong',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[{url:'https://vacuumwars.com/ecovacs-deebot-t80s-omni-review/',title:'Vacuum Wars ECOVACS DEEBOT T80S Omni review',type:'credible-independent',scope:'exact-model'}],note:'Independent testing reports above-average stain removal and low residual water from the OZMO Roller 2.0 system.'},
    'dock-automation':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'DIRECT_AU',verifiedAt:VERIFIED_AT,sources:[{url:priceEvidence['ecovacs-deebot-t80s-omni'].source,title:'ECOVACS Australia T80S OMNI',type:'manufacturer-au',scope:'exact-au-model'}],note:'Australian exact-model dock documents hot-water washing, hot-air drying and automated station functions.'}
  }
};

const benchmarkScenarios={
  laptopUniversity:'University use, good battery, lightweight and portable, under $1,500.',
  robotPetHardFloor:'Robot vacuum for pet hair and hard floors under $1,000.',
  headphoneComfort:'Premium travel headphones. Comfort is the highest priority.',
  headphoneAnc:'Strong ANC for commuting under $500.',
  televisionBrightSport:'TV for a bright living room, sport and streaming.',
  coffeeBeginner:'Coffee machine for a beginner who wants good espresso without a complicated workflow.'
};

module.exports={
  ...v96,VERSION,SCHEMA_VERSION,DEPTH_STANDARD_VERSION,VERIFIED_AT,REVIEW_DUE,
  categorySchemas,categoryNouns,entityOverrides,priceEvidence,factEvidenceAdditions,decisionEvidenceAdditions,benchmarkScenarios
};
