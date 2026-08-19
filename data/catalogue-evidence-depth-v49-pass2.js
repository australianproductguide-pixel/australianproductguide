'use strict';

const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass2';

const records={
  'tp-link-tapo-p100':{
    model:'Tapo P100',source:'https://www.tp-link.com/au/home-networking/smart-plug/tapo-p100/',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Compact 10A Wi-Fi smart plug for schedules, remote switching and mainstream voice-assistant control without a separate hub.',
    highlights:['2.4 GHz Wi-Fi with Bluetooth-assisted setup','10A / 2300W maximum load on the Australian specification','Alexa, Google Assistant and Samsung SmartThings support'],
    watch:'This is the switching-focused model rather than the energy-monitoring P110/P110M. TP-Link documents multiple hardware versions, so confirm the Australian hardware revision when matching a retailer listing.',
    specs:[['Wireless','2.4 GHz Wi-Fi; Bluetooth used for setup'],['Maximum load','2300 W / 10 A'],['Input','220–240 V AC, 50/60 Hz'],['Dimensions','76.5 × 43.5 × 42 mm'],['Hub required','No'],['Voice / platform support','Alexa, Google Assistant, Samsung SmartThings']],
    decisionAttributes:{energyMonitoring:false,matter:false,maxLoadW:2300,maxCurrentA:10,wifiBandGHz:2.4,hubRequired:false,schedules:true}
  },
  'tp-link-tapo-p110':{
    model:'Tapo P110',source:'https://www.tp-link.com/au/home-networking/smart-plug/tapo-p110/',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Energy-monitoring 10A Tapo smart plug for households that want remote switching, schedules and appliance energy-use visibility without a hub.',
    highlights:['Energy monitoring with usage tracking and bill estimation','10A / 2300W maximum load','Alexa, Google Assistant and Samsung SmartThings support'],
    watch:'P110 adds energy monitoring but is not the Matter model; choose P110M where cross-platform Matter control is a priority.',
    specs:[['Wireless','2.4 GHz Wi-Fi'],['Maximum load','2300 W / 10 A'],['Input','220–240 V AC'],['Dimensions','76.5 × 43.5 × 42 mm'],['Energy monitoring','Yes'],['Australian compliance','RCM / SAA / RoHS'],['Hub required','No']],
    decisionAttributes:{energyMonitoring:true,matter:false,maxLoadW:2300,maxCurrentA:10,wifiBandGHz:2.4,hubRequired:false,schedules:true}
  },
  'tp-link-tapo-p110m':{
    model:'Tapo P110M',source:'https://www.tp-link.com/au/home-networking/smart-plug/tapo-p110m/',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Matter-certified Tapo smart plug combining energy monitoring with broader smart-home interoperability and standard Tapo scheduling features.',
    highlights:['Matter-certified smart-home interoperability','Energy monitoring and electricity-bill estimation','10A / 2300W maximum load'],
    watch:'Package quantities and hardware revisions vary. Match the exact Australian P110M variant and pack size before purchase.',
    specs:[['Wireless','2.4 GHz Wi-Fi; Bluetooth used for setup'],['Maximum load','2300 W / 10 A'],['Input','220–240 V AC'],['Dimensions','76.5 × 43.5 × 42 mm'],['Matter','Certified'],['Energy monitoring','Yes'],['Platform support','Apple Home, Alexa, Google Assistant, Samsung SmartThings via Matter'],['Australian compliance','RCM / RoHS']],
    decisionAttributes:{energyMonitoring:true,matter:true,maxLoadW:2300,maxCurrentA:10,wifiBandGHz:2.4,hubRequired:false,schedules:true,appleHome:true}
  },

  'anker-nano-ii-65w-3-port-charger':{
    model:'A2668',source:'https://www.anker.com/au/products/a2668',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Three-port 65W GaN wall charger, sold by Anker Australia as the Anker 735 Charger and also associated with the Nano II 65W naming in Anker’s Australian range.',
    highlights:['65W maximum output with one USB-C device','Two USB-C ports plus one USB-A port','PowerIQ 4.0 dynamic power distribution and ActiveShield 2.0'],
    watch:'Anker Australia currently presents model A2668 as the Anker 735 Charger (65W, 3 Ports, GaN); APG retains the starter alias for continuity. Multi-device use shares the 65W total, and current direct stock can change.',
    specs:[['Model','A2668'],['Maximum output','65 W'],['Ports','2 × USB-C + 1 × USB-A'],['USB-C single-port output','65 W max'],['USB-A single-port output','22.5 W max'],['Input','100–240 V'],['Dimensions','38 × 29 × 66 mm'],['Weight','132 g']],
    decisionAttributes:{maxOutputW:65,usbCPorts:2,usbAPorts:1,totalPorts:3,gan:true,powerSharing:true,travelVoltage:true}
  },
  'anker-prime-100w-gan-wall-charger':{
    model:'A2688',source:'https://www.anker.com/au/products/a2688-anker-prime-charger-100w-3-ports-gan',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Compact three-port GaN charger with up to 100W from either USB-C port and multi-device power sharing.',
    highlights:['100W maximum single-port USB-C output','Two USB-C ports plus one USB-A port','100W maximum across two ports and 89W maximum across three ports'],
    watch:'The 100W headline is the single-port ceiling; total available power changes with multiple connected devices. Use an E-Marker cable for optimal 100W charging.',
    specs:[['Model','A2688'],['Total wattage','100 W'],['Ports','2 × USB-C + 1 × USB-A'],['USB-C single-port output','100 W max'],['USB-A single-port output','22.5 W max'],['Two-port total','100 W max'],['Three-port total','89 W max'],['Technology','GaN / ActiveShield temperature control']],
    decisionAttributes:{maxOutputW:100,usbCPorts:2,usbAPorts:1,totalPorts:3,gan:true,powerSharing:true}
  },
  'ugreen-nexode-65w-3-port-gan-charger':{
    model:'25113',source:'https://www.ugreen.com/en-au/products/au-25113',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'65W three-port GaN II charger for laptops, tablets and phones with two USB-C ports, one USB-A port and shared multi-device charging.',
    highlights:['65W maximum single-device charging','Two USB-C ports plus one USB-A port','GaN II design with smart power distribution'],
    watch:'Power is shared when several devices are connected. Device-specific fast-charging performance depends on supported protocols and the cable used.',
    specs:[['SKU','25113'],['Maximum wattage','65 W'],['Ports','2 × USB-C + 1 × USB-A'],['Total USB ports','3'],['Input voltage','240 V'],['Technology','GaN II'],['Samsung charging','45 W Super Fast Charging 2.0 supported on compatible models']],
    decisionAttributes:{maxOutputW:65,usbCPorts:2,usbAPorts:1,totalPorts:3,gan:true,powerSharing:true,samsung45W:true}
  },
  'ugreen-nexode-100w-4-port-gan-charger':{
    model:'25377',source:'https://www.ugreen.com/en-au/products/au-25377',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'100W four-port Nexode GaN II wall charger for charging a laptop alongside phones, tablets and accessories.',
    highlights:['100W maximum single USB-C output','Three USB-C ports plus one USB-A port','Dynamic temperature sensing and intelligent power management'],
    watch:'APG binds this starter entry to wall-charger SKU 25377, not the separate Nexode 100W desktop charger SKU 15613. Multi-port output is shared.',
    specs:[['SKU','25377'],['Maximum wattage','100 W'],['Ports','3 × USB-C + 1 × USB-A'],['Total USB ports','4'],['Input voltage','240 V'],['Maximum current','5 A'],['Dimensions','77 × 68 × 31 mm'],['Technology','GaN II']],
    decisionAttributes:{maxOutputW:100,usbCPorts:3,usbAPorts:1,totalPorts:4,gan:true,powerSharing:true}
  },
  'belkin-boostcharge-pro-65w-dual-usb-c-gan-charger':{
    model:'WCH013',source:'https://www.belkin.com/au/p/dual-usb-c-gan-wall-charger-with-pps-65w/P-WCH013.html',
    sourceType:'Official Australian manufacturer exact-model family product and specification page',
    summary:'Dual-USB-C 65W GaN wall charger with USB PD 3.0 and PPS, designed for either one higher-power device or two-device charging.',
    highlights:['65W maximum with one USB-C port','45W + 20W split when both USB-C ports are used','USB PD 3.0, PPS and GaN technology'],
    watch:'WCH013 has colour-specific Australian SKUs such as WCH013auBK and WCH013auWH. Cables are not included in the standalone package and live stock varies by colour.',
    specs:[['Model family','WCH013'],['Maximum wattage','65 W'],['Ports','2 × USB-C'],['Dual-port allocation','45 W + 20 W'],['Charging protocols','USB-C PD 3.0 + PPS'],['Dimensions','39.1 × 40.4 × 69.1 mm'],['Technology','GaN'],['Warranty','2 years']],
    decisionAttributes:{maxOutputW:65,usbCPorts:2,usbAPorts:0,totalPorts:2,gan:true,pps:true,powerSharing:true}
  },

  'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad':{
    model:'WIA011',source:'https://www.belkin.com/au/p/magnetic-wireless-charging-pad-with-qi2-15w/WIA011fqBK.html',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Compact Qi2 magnetic charging pad with 15W wireless charging, a pop-up stand and a tethered two-metre USB-C cable.',
    highlights:['Qi2-certified magnetic charging up to 15W','Pop-up stand for hands-free viewing','2 m tethered USB-C cable and cases up to 3 mm supported'],
    watch:'A USB-C power supply is not represented as included on this pad page. Wireless speed depends on the connected device, case and power source.',
    specs:[['SKU','WIA011fqBK'],['Qi standard','Qi2'],['Wireless output','15 W max'],['Cable','2 m tethered USB-C'],['Dimensions','60 × 60 × 13 mm'],['Case support','Up to 3 mm'],['MagSafe compatibility','Yes'],['Warranty','2 years']],
    decisionAttributes:{qi2:true,maxWirelessW:15,deviceCount:1,popUpStand:true,cableIncluded:true,cableLengthM:2,travel:true}
  },
  'belkin-boostcharge-pro-3-in-1-qi2-charging-stand':{
    model:'WIZ023',source:'https://www.belkin.com/au/p/3-in-1-magnetic-wireless-charging-stand-with-qi2-15w/WIZ023auBK.html',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Three-device Qi2 charging stand for an iPhone/Qi2 phone, Apple Watch and wireless earbuds, with an adjustable magnetic phone pad.',
    highlights:['Qi2 phone charging up to 15W','Simultaneous phone, Apple Watch and earbuds charging','36W power supply included with attached USB-C cable'],
    watch:'Phone output depends on Qi2/device support; Apple’s mini iPhone variants are documented at a lower ceiling. The stand is oriented toward Apple Watch users rather than cross-platform watches.',
    specs:[['Model','WIZ023'],['Phone wireless output','15 W max Qi2'],['Apple Watch output','5 W'],['Earbuds output','5 W'],['Devices at once','3'],['Tilt','90° adjustable'],['Power supply','36 W included'],['Dimensions','118.11 × 118.11 × 121.84 mm']],
    decisionAttributes:{qi2:true,maxWirelessW:15,deviceCount:3,appleWatch:true,earbuds:true,powerSupplyIncluded:true,stand:true}
  },
  'anker-maggo-qi2-wireless-charger-pad':{
    model:'A25M0',source:'https://service.anker.com/product-description/a08J1000000YcHlIAK/anker-maggo-wireless-charger-15w-pad',
    sourceType:'Official manufacturer exact-model support specification page; Australian Qi2 range corroborates product family',
    summary:'Qi2 magnetic charging pad identified by Anker support as model A25M0, delivering up to 15W through the Qi2 magnetic power profile.',
    highlights:['Qi2 magnetic power profile up to 15W','Model A25M0 exact support documentation','Designed for magnetic phone cases'],
    watch:'Anker’s Australian collection confirms the MagGo Qi2 family, while the exact A25M0 specification is maintained on Anker support. Match the AU retail package and included power adapter before buying.',
    specs:[['Model','A25M0'],['Wireless standard','Qi 2.0 MPP'],['Maximum output','15 W'],['Input','9 V / 2.5 A'],['Compatible case type','Magnetic phone cases'],['Form factor','Magnetic charging pad']],
    decisionAttributes:{qi2:true,maxWirelessW:15,deviceCount:1,magnetic:true,travel:true}
  },
  'anker-maggo-3-in-1-foldable-charging-station':{
    model:'A2557',source:'https://www.anker.com/au/products/a2557-maggo-qi2-wireless-charging-station-magsafe-compatible',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Foldable three-in-one Qi2 travel charging station for iPhone, Apple Watch and wireless earbuds with an included 40W USB-C charger.',
    highlights:['15W Qi2 phone charging plus 5W Watch and 5W earbuds outputs','Folded footprint 89 × 60 × 25 mm at 195.6 g','40W USB-C charger and 1.5 m cable included'],
    watch:'The 25W total is distributed across three charging surfaces. Best fit is Apple-centric travel; magnetic cases are recommended and thick/non-magnetic cases can interfere.',
    specs:[['Model','A2557'],['Total wattage','25 W'],['Phone output','15 W max Qi2'],['Apple Watch output','5 W'],['Earbuds output','5 W'],['Folded dimensions','89 × 60 × 25 mm'],['Weight','195.6 g'],['Included power supply','40 W USB-C']],
    decisionAttributes:{qi2:true,maxWirelessW:15,totalW:25,deviceCount:3,appleWatch:true,earbuds:true,foldable:true,powerSupplyIncluded:true,travel:true}
  },

  'apple-airtag-4-pack':{
    model:'AirTag (2nd generation, 2026) — 4 pack',source:'https://support.apple.com/en-au/126203',
    sourceType:'Official Australian manufacturer exact-generation technical specification page; Australian 4-pack storefront corroborated',
    summary:'Current four-pack of second-generation AirTag item finders using Apple Find My, second-generation UWB for Precision Finding and user-replaceable CR2032 batteries.',
    highlights:['Second-generation UWB chip with expanded Precision Finding','User-replaceable CR2032 battery and IP67 resistance','Bluetooth proximity finding plus NFC Lost Mode'],
    watch:'AirTag is Apple-ecosystem specific and requires a compatible iPhone/iPad and Apple Account. Precision Finding device/region support varies; no attachment loop is built into AirTag itself.',
    specs:[['Generation','2nd generation (2026)'],['Diameter','31.9 mm'],['Height','8.0 mm'],['Weight','11.8 g'],['Water / dust resistance','IP67'],['Battery','User-replaceable CR2032'],['Connectivity','Bluetooth + 2nd-generation UWB + NFC'],['Pack size','4']],
    decisionAttributes:{ecosystem:'Apple Find My',uwb:true,precisionFinding:true,replaceableBattery:true,batteryType:'CR2032',ipRating:'IP67',packSize:4}
  },
  'samsung-galaxy-smarttag2':{
    model:'EI-T5600',source:'https://www.samsung.com/au/mobile-accessories/galaxy-smarttag2-black-ei-t5600bbegau/',
    sourceType:'Official Australian manufacturer exact-model product and specification page',
    summary:'Galaxy-focused item tracker with BLE 5.3, UWB on compatible Galaxy devices, a replaceable CR2032 battery and IP67 resistance.',
    highlights:['BLE range stated up to 120 m','UWB support for compatible Galaxy devices','Replaceable CR2032 battery with up to 500-day manufacturer-rated life'],
    watch:'Core tracking is tied to compatible Samsung Galaxy devices; UWB features require a UWB-enabled Galaxy. Battery-life figures are Samsung lab estimates and vary with use.',
    specs:[['Model','EI-T5600'],['Bluetooth','BLE 5.3'],['UWB','Yes'],['BLE range','Up to 120 m'],['Battery','Replaceable CR2032'],['Battery life','Up to 500 days'],['Dimensions','28.8 × 52.44 × 8.0 mm'],['Weight','13.75 g'],['Water / dust resistance','IP67']],
    decisionAttributes:{ecosystem:'Samsung SmartThings Find',uwb:true,maxBluetoothRangeM:120,replaceableBattery:true,batteryType:'CR2032',ipRating:'IP67'}
  },
  'tile-mate':{
    model:'T1801 (2024)',source:'https://support.life360.com/hc/en-us/articles/30583020129047-Tile-Models',
    sourceType:'Official manufacturer primary exact-model specification table; current Australian Life360 storefront corroborates product',
    summary:'Cross-platform Life360/Tile Bluetooth tracker for keys and bags with an integrated attachment hole and a sealed three-year battery.',
    highlights:['Up to 350 ft / about 106 m manufacturer-rated Bluetooth range','100 dB stated ring volume','IP68 resistance and three-year non-replaceable battery'],
    watch:'The 2024 Mate/T1801 battery is not user-replaceable. Tile uses the Life360/Tile finding ecosystem rather than Apple Find My or Google Find Hub.',
    specs:[['Model','T1801 (2024)'],['Bluetooth range','Up to 350 ft / 106 m'],['Ring volume','100 dB'],['Battery','3-year non-replaceable'],['Water / dust resistance','IP68'],['Dimensions','37.6 × 37.6 × 7.4 mm'],['Weight','8 g'],['SOS capability','Yes via Life360 on 2024 model']],
    decisionAttributes:{ecosystem:'Life360 / Tile',crossPlatform:true,maxBluetoothRangeM:106,replaceableBattery:false,ipRating:'IP68',sos:true}
  },
  'tile-pro':{
    model:'T1701 (2024)',source:'https://www.life360.com/en-au/tile-trackers/product/white-pro',
    sourceType:'Official Australian manufacturer exact-model product page; official support specification table corroborates model',
    summary:'Long-range Life360/Tile Bluetooth tracker with a loud ring, replaceable battery, IP68 protection and built-in attachment hole.',
    highlights:['Up to 500 ft / about 152 m manufacturer-rated Bluetooth range','110 dB stated ring volume','One-year replaceable battery and IP68 resistance'],
    watch:'Tile Pro does not use Apple Find My or Google Find Hub; its crowd-location and safety features centre on Life360/Tile. Manufacturer range is an ideal maximum, not guaranteed real-world distance.',
    specs:[['Model','T1701 (2024)'],['Bluetooth range','Up to 500 ft / 152 m'],['Ring volume','110 dB'],['Battery','1-year replaceable'],['Water / dust resistance','IP68'],['Weight','12 g'],['Official support dimensions','34 × 52.1 × 7.5 mm'],['SOS capability','Yes via Life360 on 2024 model']],
    decisionAttributes:{ecosystem:'Life360 / Tile',crossPlatform:true,maxBluetoothRangeM:152,replaceableBattery:true,ipRating:'IP68',sos:true}
  },

  'dji-osmo-action-4':{
    model:'Osmo Action 4',source:'https://www.dji.com/osmo-action-4/specs',
    sourceType:'Official manufacturer exact-model specification page; DJI Australian product page corroborates local model',
    summary:'Rugged 4K action camera built around a 1/1.3-inch sensor, 4K/120fps capture, strong electronic stabilisation and 18 m case-free waterproofing.',
    highlights:['1/1.3-inch CMOS sensor with 155° field of view','4K/120fps recording and RockSteady/HorizonSteady stabilisation','18 m waterproof without case; 60 m with waterproof case'],
    watch:'The stated 160-minute runtime is a controlled 1080p/24 test with Wi-Fi and screens off; high-resolution capture and cold conditions can materially reduce it.',
    specs:[['Sensor','1/1.3-inch CMOS'],['Maximum standard video','4K/120fps'],['Field of view','155°'],['Waterproof','18 m without case / 60 m with case'],['Weight','145 g'],['Battery','1770 mAh'],['Rated operating time','160 min under DJI test conditions'],['microSD','Up to 512 GB']],
    decisionAttributes:{captureType:'standard-action',maxVideo:'4K120',sensor:'1/1.3-inch',waterproofM:18,weightG:145,batteryMah:1770,stabilisation:true}
  },
  'dji-osmo-action-5-pro':{
    model:'Osmo Action 5 Pro',source:'https://www.dji.com/osmo-action-5-pro/specs',
    sourceType:'Official manufacturer exact-model specification page; DJI Australian support corroborates local model',
    summary:'Higher-end DJI action camera with 1/1.3-inch sensor, 4K/120fps, subject tracking, SuperNight, 47 GB usable built-in storage and longer rated battery life.',
    highlights:['4K/120fps with RockSteady/HorizonSteady stabilisation','20 m waterproof without case; 60 m with waterproof case','64 GB built-in storage with 47 GB available plus microSD expansion'],
    watch:'DJI’s 240-minute runtime is a controlled 1080p/24 test with screens and Wi-Fi off; real runtime varies by resolution, temperature, screen use and wireless features.',
    specs:[['Sensor','1/1.3-inch CMOS'],['Maximum standard video','4K/120fps'],['Maximum photo','Approx. 40 MP'],['Waterproof','20 m without case / 60 m with case'],['Weight','146 g'],['Battery','1950 mAh'],['Rated operating time','240 min under DJI test conditions'],['Built-in storage','64 GB / 47 GB available'],['microSD','Up to 1 TB']],
    decisionAttributes:{captureType:'standard-action',maxVideo:'4K120',sensor:'1/1.3-inch',waterproofM:20,weightG:146,batteryMah:1950,builtInStorageGB:47,subjectTracking:true,lowLightMode:true,stabilisation:true}
  },
  'gopro-hero13-black':{
    model:'CHDHX-131 (HERO13 Black)',source:'https://gopro.com/en/au/shop/cameras/buy/hero13black/CHDHX-131-master.html',
    sourceType:'Official Australian manufacturer exact-model product page',
    summary:'GoPro flagship-style action camera with 5.3K-class capture, HB-Series lens auto-detection, magnetic mounting, GPS and a higher-capacity Enduro battery.',
    highlights:['HB-Series lens and filter auto-detection','1900 mAh Enduro battery with more than 2.5 hours at 1080p30 in GoPro testing','GPS/data overlay, Wi-Fi 6 and Burst Slo-Mo up to 400fps at 720p'],
    watch:'Specialty HB-Series lenses are separate accessories. Runtime claims depend strongly on resolution, frame rate, temperature and enabled features.',
    specs:[['Model','HERO13 Black / CHDHX-131'],['Battery','1900 mAh Enduro'],['Rated 1080p30 runtime','More than 2.5 hours'],['Rated 4K30 / 5.3K30 runtime','More than 1.5 hours'],['Connectivity','Wi-Fi 6 + GPS'],['Burst Slo-Mo','Up to 400 fps at 720p'],['HDR','10-bit HLG HDR'],['Lens system','HB-Series auto-detect accessories supported']],
    decisionAttributes:{captureType:'standard-action',maxVideo:'5.3K',batteryMah:1900,gps:true,wifi6:true,lensMods:true,burstSlowMoFps:400}
  },
  'insta360-x4':{
    model:'Insta360 X4',source:'https://store.insta360.com/AU/product/x4',
    sourceType:'Official Australian manufacturer exact-model product page; official hardware manual corroborates specifications',
    summary:'8K 360-degree action camera designed around capture-first/reframe-later workflows, invisible-selfie-stick effects and software-assisted editing.',
    highlights:['8K 360 video capture','Dual 1/2-inch sensors with f/1.9 lenses','10 m waterproof camera body and FlowState/360 horizon-lock stabilisation'],
    watch:'360 cameras demand reframing/editing and protect two exposed lenses. Insta360’s manual lists roughly 75 minutes at 8K30 and 135 minutes at 5.7K30 under lab conditions.',
    specs:[['Capture type','360°'],['Maximum 360 video','8K30fps'],['Sensor','Dual 1/2-inch'],['Aperture','f/1.9'],['Weight','203 g'],['Dimensions','123.6 × 46 × 26.3 mm excluding lenses'],['Waterproof','10 m camera-only'],['Rated battery life','Approx. 75 min at 8K30 / 135 min at 5.7K30']],
    decisionAttributes:{captureType:'360',maxVideo:'8K30',sensor:'dual-1/2-inch',waterproofM:10,weightG:203,reframeWorkflow:true,replaceableLenses:false}
  },
  'insta360-x5':{
    model:'Insta360 X5',source:'https://store.insta360.com/au/product/x5',
    sourceType:'Official Australian manufacturer exact-model product page and official hardware specification documentation',
    summary:'Flagship 360 action camera with dual 1/1.28-inch sensors, 8K30 capture, replaceable lenses, improved low-light processing and 15 m case-free waterproofing.',
    highlights:['8K30fps 360 video with dual 1/1.28-inch sensors','User-replaceable lens design and PureVideo low-light mode','15 m waterproof camera body and up to 208 min 5.7K24 Endurance Mode runtime in lab testing'],
    watch:'The longest runtime figure is tied to 5.7K24 Endurance Mode, not 8K30. 360 capture still requires lens care and post-capture reframing for conventional framing.',
    specs:[['Capture type','360°'],['Maximum 360 video','8K30fps'],['Sensor','Dual 1/1.28-inch'],['Weight','200 g'],['Waterproof','15 m camera-only / 60 m with dive case'],['Battery','2400 mAh'],['Rated 8K30 runtime','Approx. 93–100 min depending firmware/test mode'],['Rated 5.7K24 Endurance runtime','Up to 208 min'],['Lenses','User-replaceable']],
    decisionAttributes:{captureType:'360',maxVideo:'8K30',sensor:'dual-1/1.28-inch',waterproofM:15,weightG:200,batteryMah:2400,reframeWorkflow:true,replaceableLenses:true,lowLightMode:true}
  }
};

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){
  p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};
  p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',label:label||k};
}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,sourceType:row.sourceType,summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass2'});
  p.factEvidence={};
  addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,'Exact product identity');
  addFact(p,'exactModel',row.model,'Exact model / family');
  addFact(p,'canonicalCategory',p.categoryLabel||p.category,'Canonical APG category');
  for(const spec of row.specs)addFact(p,`spec_${key(spec[0])}`,spec[1],spec[0]);
  row.highlights.forEach((value,i)=>addFact(p,`verifiedClaim${i+1}`,value,`Verified manufacturer claim ${i+1}`));
  p.evidenceClaims=row.highlights.map((value,i)=>({key:`verifiedClaim${i+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-primary'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set(),touched=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){if(!p||seen.has(p.slug))continue;seen.add(p.slug);if(records[p.slug]){applyOne(p,records[p.slug]);touched.push(p.slug);}}
  return{version:VERSION,verifiedAt:VERIFIED,newPrimaryResearch:touched.length,touched,unresolvedEntityCorrections:[
    {slug:'meross-mini-smart-wi-fi-plug',reason:'Starter name does not bind an exact current Australian Meross model; current AU primary catalogue exposes MSS315-AU/MSS305-AU variants.'},
    {slug:'meross-smart-wi-fi-plug-4-pack',reason:'Starter pack name is not an exact current AU model/pack identity; do not infer a current 4-pack SKU.'},
    {slug:'esr-qi2-3-in-1-travel-wireless-charging-set',reason:'Official ESR evidence confirms the Qi2 product family, but the crawled exact variant is not yet conclusively bound to an AU-plug SKU.'},
    {slug:'chipolo-one-point',reason:'Manufacturer states ONE Point was discontinued in 2025 and replaced by newer universal trackers; requires catalogue entity replacement rather than a false current-product upgrade.'}
  ]};
}

module.exports={VERSION,VERIFIED,NEXT_REVIEW,records,apply};
