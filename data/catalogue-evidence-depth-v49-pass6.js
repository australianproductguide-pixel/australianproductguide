'use strict';

const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass6';

const records={
  'sony-wh-1000xm6':{
    model:'WH-1000XM6',source:'https://www.sony.com.au/electronics/support/wireless-headphones-bluetooth-headphones/wh-1000xm6/specifications',
    summary:'Sony flagship over-ear ANC headphones for buyers prioritising adaptive noise cancellation, multipoint, LDAC/LC3 support and a travel-friendly wired option.',
    highlights:['30 mm drivers with 4 Hz–40 kHz stated wired frequency response','Up to 30 hours music playback with noise cancelling on','Bluetooth 5.3 with multipoint plus SBC, AAC, LDAC and LC3 codecs'],
    watch:'Battery and wireless performance vary with codec, noise-cancelling state and usage. Headline frequency-response figures are manufacturer specifications rather than an APG sound-quality score.',
    specs:[['Model','WH-1000XM6'],['Weight','Approx. 254 g'],['Driver','30 mm'],['ANC','Adaptive NC Optimizer'],['Battery with NC','Up to 30 hours'],['Battery without NC','Up to 40 hours'],['Charge time','Approx. 3.5 hours'],['Bluetooth','5.3'],['Codecs','SBC / AAC / LDAC / LC3'],['Multipoint','Yes'],['Wired input','3.5 mm stereo mini jack'],['Ambient mode','Yes']],
    decisionAttributes:{anc:true,batteryAncHours:30,batteryMaxHours:40,weightG:254,driverMm:30,bluetooth:5.3,multipoint:true,ldac:true,lc3:true,wired:true}
  },
  'sony-ult-wear-wh-ult900n':{
    model:'WH-ULT900N',source:'https://www.sony.com.au/electronics/support/wireless-headphones-bluetooth-headphones/wh-ult900n/specifications',
    summary:'Bass-focused over-ear ANC headphones with Sony ULT modes for buyers wanting long battery life and multipoint below the flagship tier.',
    highlights:['40 mm dynamic drivers with dedicated ULT sound control','Up to 30 hours playback with noise cancelling on and 50 hours off','Bluetooth 5.2 with SBC, AAC and LDAC plus passive wired operation'],
    watch:'The ULT tuning is intentionally bass-forward, which is a preference rather than a universal advantage. Compare tuning, comfort and ANC needs instead of battery life alone.',
    specs:[['Model','WH-ULT900N'],['Weight','Approx. 255 g'],['Driver','40 mm'],['ANC','Digital noise cancelling'],['Battery with NC','Up to 30 hours'],['Battery without NC','Up to 50 hours'],['Charge time','Approx. 3.5 hours'],['Bluetooth','5.2'],['Codecs','SBC / AAC / LDAC'],['Passive wired operation','Yes'],['Ambient mode','Yes'],['ULT button','Yes']],
    decisionAttributes:{anc:true,batteryAncHours:30,batteryMaxHours:50,weightG:255,driverMm:40,bluetooth:5.2,ldac:true,wired:true,bassFocus:true}
  },
  'bose-quietcomfort-ultra-headphones':{
    model:'QCUH-HEADPHONEARN family',source:'https://www.bose.com.au/p/headphones/bose-quietcomfort-ultra-headphones/QCUH-HEADPHONEARN.html',
    summary:'First-generation Bose QuietComfort Ultra over-ear headphones combining adaptive ANC, Immersive Audio and multipoint for premium travel listening.',
    highlights:['Active noise cancellation with Quiet, Aware and Immersion modes','Up to 24 hours battery life with 15-minute quick charge for up to 3 hours','Bluetooth 5.3 multipoint connection to two source devices'],
    watch:'Bose now also sells QuietComfort Ultra Headphones (2nd Gen) with a longer stated battery and additional features. This maintained entry is the original Ultra generation and should not inherit 2nd Gen specifications.',
    specs:[['Model family','QCUH-HEADPHONEARN'],['Fit','Around-ear circumaural'],['Weight','Approx. 0.25 kg'],['ANC','Yes'],['Listening modes','Quiet / Aware / Immersion'],['Battery','Up to 24 hours'],['Charge time','Up to 3 hours'],['Quick charge','15 min for up to 3 hours'],['Bluetooth','5.3'],['Bluetooth range','Up to 9 m'],['Multipoint','Two devices'],['USB audio','No'],['Audio cable','3.5 mm to 2.5 mm included']],
    decisionAttributes:{anc:true,batteryHours:24,weightKg:0.25,bluetooth:5.3,multipoint:true,multipointDevices:2,immersiveAudio:true,usbAudio:false,wired:true,generation:1}
  },
  'sennheiser-momentum-5-wireless':{
    model:'MOMENTUM 5 Wireless',source:'https://au.sennheiser-hearing.com/products/momentum-5-wireless',
    summary:'Current Sennheiser premium over-ear model combining hybrid adaptive ANC, high-resolution codec support and a user-replaceable battery.',
    highlights:['42 mm dynamic drivers with Bluetooth 5.4 and aptX Lossless/Adaptive support','Up to 57 hours stated music playback with ANC on','User-replaceable 700 mAh battery with 10-minute charge for up to 7 hours'],
    watch:'It is not IP-rated, so buyers prioritising sweat or weather protection should treat that as a limitation. Codec benefits depend on compatible source hardware.',
    specs:[['Model','MOMENTUM 5 Wireless'],['Driver','42 mm dynamic'],['ANC','Hybrid adaptive'],['Microphones','8 beamforming microphones'],['Battery with ANC','Up to 57 hours'],['Battery','User-replaceable 700 mAh Li-ion'],['Full charge','Approx. 2 hours'],['Quick charge','10 min for up to 7 hours'],['Bluetooth','5.4'],['Codecs','SBC / AAC / aptX HD / aptX Lossless / aptX Adaptive'],['Weight','Approx. 290 g'],['Water resistance','Not IP rated'],['USB-C hi-res audio','Yes']],
    decisionAttributes:{anc:true,batteryAncHours:57,driverMm:42,bluetooth:5.4,userReplaceableBattery:true,weightG:290,aptxLossless:true,usbAudio:true,ipRated:false}
  },
  'sennheiser-momentum-4-wireless':{
    model:'MOMENTUM 4 Wireless',source:'https://au.sennheiser-hearing.com/collections/noise-cancelling/products/momentum-4-wireless',
    summary:'Established premium Sennheiser over-ear headphones for buyers prioritising unusually long ANC battery life and broad aptX codec support.',
    highlights:['42 mm dynamic drivers with Hybrid Adaptive ANC','Up to 60 hours stated Bluetooth music playback with ANC','Bluetooth 5.2 with SBC, AAC, aptX and aptX Adaptive'],
    watch:'MOMENTUM 5 is now the newer generation. MOMENTUM 4 can still be a valid current product, but compare generation-specific battery, codec, repairability and pricing rather than treating the names as interchangeable.',
    specs:[['Model','MOMENTUM 4 Wireless'],['Driver','42 mm dynamic'],['ANC','Hybrid Adaptive ANC'],['Battery with ANC','Up to 60 hours'],['Battery','Built-in 700 mAh Li-ion'],['Full charge','Approx. 2 hours'],['Quick charge','5 min for up to 4 hours'],['Bluetooth','5.2'],['Codecs','SBC / AAC / aptX / aptX Adaptive'],['Wired audio','Audio cable included'],['USB-C charging','Yes'],['App','Sennheiser Smart Control Plus']],
    decisionAttributes:{anc:true,batteryAncHours:60,driverMm:42,bluetooth:5.2,userReplaceableBattery:false,aptxAdaptive:true,wired:true,usbCCharging:true,generation:4}
  },
  'jbl-tour-one-m3-smart-tx':{
    model:'TOUR ONE M3 TX',source:'https://www.jbl.com.au/over-ear-headphones/TOUR-ONE-M3-TX.html',
    summary:'Premium JBL ANC headphones bundled with the Smart Tx transmitter for buyers who regularly connect to non-Bluetooth or awkward source devices.',
    highlights:['40 mm drivers, 10 microphones and True Adaptive Noise Cancelling 2.0','Up to 70 hours music playback with ANC off or 40 hours with ANC on','Smart Tx transmitter included with Bluetooth 5.3 headphones'],
    watch:'The Smart Tx bundle is most valuable when you actually use external or legacy audio sources. Buyers who only stream from a phone may not need the transmitter-specific premium.',
    specs:[['Model','TOUR ONE M3 TX'],['Driver','40 mm'],['Microphones','10'],['ANC','True Adaptive Noise Cancelling 2.0'],['Weight','278 g'],['Bluetooth','5.3'],['Battery ANC off','Up to 70 hours'],['Battery ANC on','Up to 40 hours'],['Talk time','Up to 38 hours'],['Charge time','2 hours'],['Frequency response','10 Hz–40 kHz'],['Smart Tx transmitter','Included']],
    decisionAttributes:{anc:true,batteryAncHours:40,batteryMaxHours:70,driverMm:40,microphones:10,weightG:278,bluetooth:5.3,smartTx:true}
  },
  'sonos-ace':{
    model:'Sonos Ace',source:'https://www.sonos.com/en-au/shop/sonos-ace',
    summary:'Premium ANC headphones for buyers who value spatial audio, lossless-capable connections and TV Audio Swap with compatible Sonos soundbars.',
    highlights:['40 mm dynamic drivers with eight microphones and adaptive ANC','Up to 30 hours listening with ANC or Aware mode enabled','Bluetooth 5.4 plus USB-C lossless support and compatible Sonos TV Audio Swap'],
    watch:'The strongest ecosystem features depend on compatible Sonos home-theatre hardware. Do not pay for TV Audio Swap if you do not own or plan to own a supported Sonos soundbar.',
    specs:[['Model','Sonos Ace'],['Driver','40 mm dynamic'],['Microphones','8'],['ANC','Yes'],['Aware mode','Yes'],['Weight','0.312 kg'],['Bluetooth','5.4'],['Battery','Up to 30 hours listening'],['Call time','Up to 24 hours'],['Battery capacity','1060 mAh'],['Rapid charge','3 min for up to 3 hours'],['Full charge','Up to 3 hours'],['USB-C lossless audio','Supported'],['TV Audio Swap','Compatible Sonos soundbars']],
    decisionAttributes:{anc:true,batteryHours:30,driverMm:40,microphones:8,weightKg:0.312,bluetooth:5.4,usbLossless:true,tvAudioSwap:true,sonosEcosystem:true}
  },
  'marshall-monitor-iii-anc':{
    model:'Monitor III A.N.C.',source:'https://www.marshall.com/au/en/product/monitor-iii-anc?color=black',
    summary:'Marshall over-ear ANC headphones prioritising very long wireless playback, foldability and the brand’s bass/mid/treble tuning controls.',
    highlights:['Up to 70 hours wireless playtime with ANC or 100 hours without','15-minute quick charge provides up to 12 hours','Bluetooth 5.3 with multipoint, Transparency mode and LE Audio readiness'],
    watch:'Spatial Soundstage and Adaptive Loudness are DSP features, not proof of universally better sound. The value case depends on whether Marshall tuning, battery endurance and foldability suit you.',
    specs:[['Model','Monitor III A.N.C.'],['ANC','Yes'],['Transparency mode','Yes'],['Battery with ANC','Up to 70 hours'],['Battery without ANC','Up to 100 hours'],['Quick charge','15 min for up to 12 hours'],['Bluetooth','5.3'],['Bluetooth multipoint','Yes'],['LE Audio ready','Yes'],['Soundstage spatial audio','Yes'],['Adaptive Loudness','Yes'],['Foldable','Yes'],['App','Marshall Bluetooth']],
    decisionAttributes:{anc:true,batteryAncHours:70,batteryMaxHours:100,bluetooth:5.3,multipoint:true,leAudioReady:true,spatialAudio:true,foldable:true}
  },
  'apple-airpods-max-2':{
    model:'AirPods Max 2',source:'https://www.apple.com/au/airpods-max/specs/',
    summary:'Apple flagship over-ear headphones for buyers prioritising Apple ecosystem integration, H2 processing, spatial audio and USB-C lossless/low-latency modes.',
    highlights:['Apple H2 chip in each ear cup with eight ANC microphones','Up to 20 hours listening on a charge with ANC enabled','Bluetooth 5.3 and lossless plus ultra-low-latency audio via USB-C'],
    watch:'At 386.2 g these are substantially heavier than many premium ANC rivals, and their ecosystem value is strongest with Apple devices. Compare comfort and platform flexibility before buying.',
    specs:[['Model','AirPods Max 2'],['Chip','Apple H2 in each ear cup'],['Microphones','9 total / 8 for ANC'],['ANC','Yes'],['Battery with ANC','Up to 20 hours'],['Bluetooth','5.3'],['Weight','386.2 g'],['USB-C lossless audio','Yes'],['USB-C ultra-low-latency audio','Yes'],['Spatial audio','Yes'],['Sensors','Optical / position / case-detect / accelerometer / gyroscope'],['Case','Smart Case included']],
    decisionAttributes:{anc:true,batteryAncHours:20,weightG:386.2,bluetooth:5.3,h2:true,usbLossless:true,lowLatencyUsb:true,appleEcosystem:true}
  },
  'dyson-ontrac':{
    model:'Dyson OnTrac family',source:'https://www.dyson.com.au/ontrac-headphones-cnc-aluminium',
    summary:'Heavy premium ANC headphones differentiated by long battery life, high attenuation claims and swappable cosmetic caps/cushions.',
    highlights:['Up to 55 hours battery life with ANC','Eight noise-cancelling microphones with manufacturer-stated attenuation up to 40 dB','6 Hz–21 kHz stated frequency response with customisable outer caps and cushions'],
    watch:'At around 451 g, weight is a significant comfort trade-off versus many competitors. Dyson attenuation and frequency-response numbers are manufacturer specifications, not independent ranking scores.',
    specs:[['Model family','Dyson OnTrac'],['Weight','0.451 kg'],['ANC microphones','8'],['Telephony microphones','1'],['Attenuation','Up to 40 dB stated'],['Frequency response','6 Hz–21 kHz'],['Battery with ANC','Up to 55 hours'],['Quick charge','10 min for up to 2.5 hours'],['30-minute charge','Up to 9 hours'],['Bluetooth','5.0'],['Bluetooth range','Up to 9 m'],['Charging','USB-C'],['Customisable caps/cushions','Yes']],
    decisionAttributes:{anc:true,batteryAncHours:55,weightKg:0.451,ancMics:8,attenuationDb:40,bluetooth:5.0,customisable:true,usbCCharging:true}
  },

  'ninja-foodi-dual-zone-air-fryer-76l':{
    model:'AF300',source:'https://ninjakitchen.com.au/collections/cooking/products/ninja-foodi-dual-zone-air-fryer',
    summary:'A 7.6 L dual-drawer air fryer for households wanting two independently controlled cooking zones without moving to Ninja’s larger 9.5 L footprint.',
    highlights:['Two independent 3.8 L baskets with 7.6 L total capacity','Smart Finish and Match Cook DualZone controls','Six cooking functions across a 40°C–240°C temperature range'],
    watch:'The two side-by-side drawers require more bench width than stacked designs. Capacity should be judged against the shape and amount of food you normally cook, not litres alone.',
    specs:[['Model','AF300'],['Capacity','7.6 L'],['Baskets','2 × 3.8 L'],['Cooking functions','6'],['Functions','Max Crisp / Air Fry / Roast / Bake / Reheat / Dehydrate'],['Temperature range','40–240°C'],['Weight','8.26 kg'],['Dimensions','36 D × 39 W × 32 H cm'],['Wattage','1670 W'],['Cord','0.8 m'],['Smart Finish','Yes'],['Match Cook','Yes']],
    decisionAttributes:{capacityL:7.6,drawers:2,drawerCapacityL:3.8,functions:6,minTempC:40,maxTempC:240,weightKg:8.26,wattageW:1670,dualZone:true,smartFinish:true}
  },
  'ninja-foodi-max-xxxl-dual-zone-air-fryer-95l':{
    model:'AF400',source:'https://ninjakitchen.com.au/collections/air-fryers/products/ninja-foodi-max-xxxl-dual-zone-air-fryer-af400',
    summary:'A larger 9.5 L dual-drawer Ninja air fryer for family-sized meals with independent zones and high-temperature Max Crisp cooking.',
    highlights:['Two 4.75 L drawers with 9.5 L total capacity','Six cooking functions with 40°C–240°C temperature range','Smart Finish and Match Cook for independent or mirrored zone cooking'],
    watch:'The larger side-by-side body increases bench footprint and weight. Compare the 9.5 L capacity benefit against stacked alternatives if bench width is constrained.',
    specs:[['Model','AF400'],['Capacity','9.5 L'],['Baskets','2 × 4.75 L'],['Cooking functions','6'],['Functions','Max Crisp / Air Fry / Roast / Bake / Reheat / Dehydrate'],['Temperature range','40–240°C'],['Weight','8.8 kg'],['Dimensions','33 D × 41.5 W × 38 H cm'],['Wattage','1670 W'],['Cord','0.76 m'],['Smart Finish','Yes'],['Match Cook','Yes']],
    decisionAttributes:{capacityL:9.5,drawers:2,drawerCapacityL:4.75,functions:6,minTempC:40,maxTempC:240,weightKg:8.8,wattageW:1670,dualZone:true,smartFinish:true}
  },
  'ninja-doublestack-xxxl-95l':{
    model:'SL400',source:'https://ninjakitchen.com.au/products/ninja-doublestack-xxxl-9-5l-2-drawer-air-fryer',
    summary:'A vertically stacked 9.5 L dual-drawer air fryer designed to preserve capacity while using less bench width than side-by-side dual-zone layouts.',
    highlights:['Two 4.75 L stacked drawers with 9.5 L total capacity','Stacked meal racks allow up to four foods to cook at once','Six cooking functions with Smart Finish and Match Cook'],
    watch:'The vertical layout saves width but increases height/depth demands. Check overhead cabinetry and bench depth rather than assuming “space saving” means smaller in every dimension.',
    specs:[['Model','SL400'],['Capacity','9.5 L'],['Drawers','2 × 4.75 L'],['Layout','Vertically stacked dual drawer'],['Cooking functions','6'],['Stacked meal racks','2 included'],['Crisper plates','2 included'],['Foods at once','Up to 4'],['Family capacity','Manufacturer states up to 8 people'],['Chicken capacity','Up to two 2.3 kg chickens'],['Smart Finish','Yes'],['Match Cook','Yes']],
    decisionAttributes:{capacityL:9.5,drawers:2,drawerCapacityL:4.75,stacked:true,functions:6,cookFoodsAtOnce:4,servesUpTo:8,smartFinish:true,matchCook:true}
  },
  'philips-3000-series-dual-basket-na35310':{
    model:'NA353/10',source:'https://www.philips.com.au/c-p/NA353_10/3000-series-dual-basket-airfryer',
    summary:'A 9 L dual-basket Philips air fryer with unequal 6 L and 3 L drawers for main-and-side cooking and synchronised finish times.',
    highlights:['9 L combined capacity split into 6 L and 3 L baskets','Eight presets with SyncFinish and Copy functions','2750 W Rapid Air system with temperature up to 200°C'],
    watch:'Unequal baskets suit a main-and-side workflow but are less symmetric than two equal drawers. The 2750 W rated power is also higher than many alternatives, so kitchen circuit/load considerations may matter.',
    specs:[['Model','NA353/10'],['Capacity','9 L'],['Basket split','6 L + 3 L'],['Basket type','Dual basket'],['Programs','8 presets'],['Power','2750 W'],['Maximum temperature','200°C'],['Technology','Rapid Air'],['Dimensions','382.5 × 443.9 × 314.2 mm'],['Weight','7.85 kg'],['SyncFinish','Yes'],['Dishwasher safe','Yes']],
    decisionAttributes:{capacityL:9,bigBasketL:6,smallBasketL:3,drawers:2,presets:8,wattageW:2750,maxTempC:200,syncFinish:true,weightKg:7.85}
  },
  'philips-5000-series-dual-basket-na55100':{
    model:'NA551/00',source:'https://www.philips.com.au/c-p/NA551_00/5000-series',
    summary:'A 9 L dual-basket Philips model that adds steam, steam-and-air-fry and steam-clean functions to conventional air-frying workflows.',
    highlights:['9 L dual basket with 6 L main drawer and 3 L side drawer','RapidAir Plus and Air Steam technology with steam-capable large basket','12 presets and 19 cooking methods across 40°C–200°C'],
    watch:'Steam broadens the cooking system but also adds cleaning and water-management complexity. Choose it for actual steam use rather than treating extra modes as an automatic quality advantage.',
    specs:[['Model','NA551/00'],['Capacity','9 L'],['Basket split','6 L + 3 L'],['Power','2300 W'],['Temperature range','40–200°C'],['Programs','12 presets'],['Cooking methods','19'],['Technology','RapidAir Plus + Air Steam'],['Steam function','Yes'],['Steam Clean','Yes'],['Dimensions','Approx. 383 × 444 × 352 mm'],['Weight','8.75 kg'],['Dishwasher safe','Yes']],
    decisionAttributes:{capacityL:9,bigBasketL:6,smallBasketL:3,drawers:2,wattageW:2300,minTempC:40,maxTempC:200,presets:12,cookingMethods:19,steam:true,steamClean:true,weightKg:8.75}
  },
  'tefal-dual-easy-fry-flex-ey9228':{
    model:'EY9228',source:'https://www.tefal.com.au/products/tefal-dual-easy-fry-flex-black-air-fryer-ey9228',
    summary:'A flexible 9 L Tefal air fryer that converts between two independent zones and one large GiantZone using a removable divider.',
    highlights:['9 L total capacity converts between 5.5 L + 3.5 L dual zones and one GiantZone','Two independent heating elements with synchronised finish','Seven modes plus removable viewing window and dishwasher-safe drawer/grids/divider'],
    watch:'The convertible chamber is useful for oversized dishes, but it is a different workflow from two permanently separate drawers. Direct stock can fluctuate without changing the underlying product evidence.',
    specs:[['Model','EY9228'],['Capacity','9 L'],['Dual-zone split','5.5 L + 3.5 L'],['Single-zone mode','9 L GiantZone'],['Heating elements','2 independent'],['Modes','7'],['Dimensions','36.4 × 47.4 × 30.7 cm'],['Weight','7.67 kg'],['Power','1910–2280 W'],['Cord','0.9 m'],['Dishwasher safe','Drawer, grids and divider'],['Viewing window','Removable']],
    decisionAttributes:{capacityL:9,bigZoneL:5.5,smallZoneL:3.5,convertibleSingleZone:true,heatingElements:2,modes:7,weightKg:7.67,maxWattageW:2280,syncFinish:true}
  },
  'tefal-easy-fry-silence-essential-ey551h':{
    model:'EY551H',source:'https://www.tefal.com.au/products/tefal-easy-fry-silence-essential-air-fryer-5l',
    summary:'A compact single-basket 5 L air fryer designed around lower operating noise and simple touch-control cooking.',
    highlights:['5 L single-basket capacity with Tefal Silent Technology','10 presets with adjustable 40°C–220°C temperature range','1400–1670 W rated power and dishwasher-safe basket/components'],
    watch:'A single basket is simpler and narrower but cannot independently cook two foods at different temperatures. “Most silent” is a manufacturer test claim tied to specified test conditions.',
    specs:[['Model','EY551H'],['Capacity','5 L'],['Basket','Single'],['Programs','10 presets'],['Temperature range','40–220°C'],['Silent Technology','Yes'],['Dimensions','39.5 × 28 × 35 cm'],['Weight','4.8 kg'],['Power','1400–1670 W'],['Dishwasher safe','Yes'],['Interface','Touch controls'],['Extra Crisp','Yes']],
    decisionAttributes:{capacityL:5,drawers:1,presets:10,minTempC:40,maxTempC:220,silentTechnology:true,weightKg:4.8,maxWattageW:1670,compact:true}
  },
  'tefal-easy-fry-grill-and-steam-xxl-fw2018':{
    model:'FW2018',source:'https://www.tefal.com.au/products/tefal-easy-fry-grill-and-steam-xxl-3-in-1-air-fryer-fw2018',
    summary:'A 6.9 L multi-function Tefal cooker combining air frying, grilling and steaming in one single-zone appliance.',
    highlights:['Three cooking technologies: air fry, grill and steam','6.9 L capacity with 1.1 L water tank and up to 85 minutes stated steam autonomy','Seven automatic programs with adjustable 80°C–200°C temperature range'],
    watch:'This is not a dual-zone model. Its value is multi-function versatility, while shoppers mainly wanting simultaneous independent foods should prefer a true dual-basket design.',
    specs:[['Model','FW2018'],['Capacity','6.9 L'],['Functions','Air fry / grill / steam'],['Automatic programs','7'],['Water tank','1.1 L'],['Steam autonomy','Up to 85 minutes stated'],['Temperature range','80–200°C'],['Power','1900 W'],['Dimensions','32.4 × 40.7 × 39.9 cm'],['Weight','7.9 kg'],['Grill plate','Die-cast aluminium'],['Dual zone','No']],
    decisionAttributes:{capacityL:6.9,drawers:1,airFry:true,grill:true,steam:true,programs:7,waterTankL:1.1,steamMinutes:85,minTempC:80,maxTempC:200,wattageW:1900,dualZone:false}
  }
};

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model-or-explicit-model-family',confidence:'high',label:label||k};}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,sourceType:'Official Australian/current primary manufacturer product or specification evidence · independently reverified 20 Aug 2026',summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass6'});
  p.factEvidence={};addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,'Maintained APG product identity');addFact(p,'exactModel',row.model,'Exact model / explicit manufacturer family');addFact(p,'canonicalCategory',p.categoryLabel||p.category,'Canonical APG category');
  for(const spec of row.specs)addFact(p,`spec_${key(spec[0])}`,spec[1],spec[0]);
  row.highlights.forEach((value,i)=>addFact(p,`verifiedClaim${i+1}`,value,`Verified manufacturer claim ${i+1}`));
  p.evidenceClaims=row.highlights.map((value,i)=>({key:`verifiedClaim${i+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-primary'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set(),touched=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){if(!p||seen.has(p.slug))continue;seen.add(p.slug);if(records[p.slug]){applyOne(p,records[p.slug]);touched.push(p.slug);}}
  const missing=Object.keys(records).filter(slug=>!seen.has(slug));
  return{version:VERSION,verifiedAt:VERIFIED,newPrimaryResearch:touched.length,touched,missing};
}
module.exports={VERSION,VERIFIED,NEXT_REVIEW,records,apply};
