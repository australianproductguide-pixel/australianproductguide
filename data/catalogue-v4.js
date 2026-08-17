const slugify=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const CHECKED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const roleText={value:'Value starting point',balanced:'Balanced starting point',premium:'Higher-tier starting point',specialist:'Specialist starting point',compact:'Space-conscious starting point'};
const human=x=>String(x||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const amazonDiscovery=(brand,name)=>`https://www.amazon.com.au/s?k=${encodeURIComponent(`${brand} ${name}`)}`;
function makeProduct(category,label,index,row){
  const [brand,name,role,signals]=row,slug=slugify(`${brand}-${name}`);
  return {
    id:`APG-${category.toUpperCase().replace(/[^A-Z0-9]+/g,'-')}-${String(index+1).padStart(3,'0')}`,slug,brand,name,price:null,
    summary:`${brand} ${name} is a maintained starter-evidence product in APG's ${label.toLowerCase()} catalogue. It is included as a ${roleText[role].toLowerCase()} for Australian product discovery and comparison, not as a universal winner.`,
    highlights:[roleText[role],...signals.slice(0,2).map(human)],
    watch:'Starter evidence depth: verify the exact Australian variant, current specifications, price, seller, warranty and retailer availability before purchase.',
    source:amazonDiscovery(brand,name),
    sourceType:'Amazon Australia model discovery; exact listing and deeper manufacturer/specification evidence pending unless separately verified',
    tags:[role,...signals],evidenceTier:'starter',starterRole:role,testingStatus:'Starter evidence / desk-researched product identity',publicationStatus:'LIVE / MAINTAINED',
    firstResearched:CHECKED,lastSubstantiveReview:null,lastSourceVerification:CHECKED,lastRetailerCheck:CHECKED,lastPriceCheck:null,lastImageVerification:CHECKED,
    nextReviewDue:NEXT_REVIEW,freshnessStatus:'new-starter'
  };
}
function makeCategory(slug,label,icon,aliases,factors,priorities,rows){
  return {slug,label,title:`${label} Australia`,icon,aliases,description:`Compare a curated Australian starter set of ${label.toLowerCase()} by ${factors.slice(0,3).join(', ').toLowerCase()} and the trade-offs that matter to your situation.`,products:rows.map((r,i)=>makeProduct(slug,label,i,r)),priorities,factors,evidenceTier:'starter',comparisonLimit:2,faqs:[
    [`What should I compare first when choosing ${label.toLowerCase()}?`,`Start with ${factors[0].toLowerCase()} and ${factors[1].toLowerCase()}, then use price and secondary features to break close ties.`],
    ['Should I choose on price alone?','No. APG treats price as a constraint, not a substitute for fit. Verify the current Australian offer and exact variant before buying.'],
    ['How mature is this APG category?','This is a maintained starter-evidence category. Product identity, freshness and retailer pathways are maintained while deeper specification evidence and decision attributes continue to expand.']
  ]};
}
const categories={};
function add(slug,label,icon,aliases,factors,priorities,rows){categories[slug]=makeCategory(slug,label,icon,aliases,factors,priorities,rows);}

add('smart-plugs','Smart plugs','guide',['smart plug','wifi plug','wi-fi plug','smart socket'],['Platform and smart-home compatibility','Energy monitoring requirements','Plug size and adjacent-socket clearance','Schedules, automation and remote control'],['matter','energy-monitoring','apple-home','compact','value'],[
  ['TP-Link','Tapo P100','value',['compact','schedules']],
  ['TP-Link','Tapo P110','balanced',['energy-monitoring','schedules']],
  ['TP-Link','Tapo P110M','specialist',['matter','energy-monitoring']],
  ['Meross','Mini Smart Wi-Fi Plug','compact',['voice-control','compact']],
  ['Meross','Smart Wi-Fi Plug 4-Pack','specialist',['multi-pack','apple-home']]
]);

add('wifi-routers','Wi-Fi routers','guide',['wifi router','wi-fi router','wireless router','wifi 6 router','wifi 7 router'],['Internet speed and home size','Wi-Fi generation and client-device mix','Ethernet and multi-gigabit port requirements','Security, parental controls and mesh expansion'],['wifi-6','wifi-7','multi-gig','large-home','value'],[
  ['TP-Link','Archer AX12','value',['wifi-6','gigabit']],
  ['TP-Link','Archer AX55','balanced',['wifi-6','usb']],
  ['TP-Link','Archer AX55 Pro','specialist',['wifi-6','multi-gig']],
  ['TP-Link','Archer AX72','premium',['wifi-6','large-home']],
  ['TP-Link','Archer BE550','premium',['wifi-7','multi-gig']]
]);

add('usb-c-chargers','USB-C chargers','power',['usb c charger','usb-c charger','gan charger','laptop charger'],['Maximum USB-C power output','Number and mix of charging ports','Power sharing with multiple devices','Travel size, heat and plug format'],['65w','100w','multi-port','travel','value'],[
  ['Anker','Nano II 65W 3-Port Charger','value',['65w','multi-port']],
  ['Anker','Prime 100W GaN Wall Charger','premium',['100w','compact']],
  ['UGREEN','Nexode 65W 3-Port GaN Charger','balanced',['65w','multi-port']],
  ['UGREEN','Nexode 100W 4-Port GaN Charger','premium',['100w','multi-port']],
  ['Belkin','BoostCharge Pro 65W Dual USB-C GaN Charger','specialist',['65w','dual-usb-c']]
]);

add('wireless-chargers','Wireless chargers','power',['wireless charger','qi2 charger','magsafe charger','3 in 1 charger'],['Qi, Qi2 and device compatibility','Single-device versus multi-device charging','Stand, pad and travel form factor','Power adapters and cables included'],['qi2','3-in-1','travel','apple','value'],[
  ['Belkin','BoostCharge Pro Qi2 15W Wireless Charging Pad','value',['qi2','pad']],
  ['Belkin','BoostCharge Pro 3-in-1 Qi2 Charging Stand','premium',['qi2','3-in-1']],
  ['Anker','MagGo Qi2 Wireless Charger Pad','compact',['qi2','travel']],
  ['Anker','MagGo 3-in-1 Foldable Charging Station','balanced',['qi2','3-in-1']],
  ['ESR','Qi2 3-in-1 Travel Wireless Charging Set','specialist',['qi2','travel']]
]);

add('bluetooth-trackers','Bluetooth trackers','travel',['bluetooth tracker','item tracker','airtag','smart tag'],['Phone ecosystem and finding network','Precision finding and nearby direction features','Battery type and replacement cycle','Form factor, attachment and sharing'],['apple','android','cross-platform','replaceable-battery','travel'],[
  ['Apple','AirTag 4 Pack','premium',['apple','precision-finding']],
  ['Samsung','Galaxy SmartTag2','balanced',['android','replaceable-battery']],
  ['Tile','Mate','value',['cross-platform','compact']],
  ['Tile','Pro','specialist',['cross-platform','long-range']],
  ['Chipolo','ONE Point','compact',['android','find-my-device']]
]);

add('action-cameras','Action cameras','travel',['action camera','360 camera','gopro','insta360'],['Standard action versus 360-degree capture','Resolution, frame rate and stabilisation','Battery endurance and heat management','Waterproofing, mounts and editing workflow'],['360','waterproof','stabilisation','creator','value'],[
  ['DJI','Osmo Action 4','value',['waterproof','stabilisation']],
  ['DJI','Osmo Action 5 Pro','balanced',['waterproof','battery']],
  ['GoPro','HERO13 Black','premium',['creator','stabilisation']],
  ['Insta360','X4','specialist',['360','8k']],
  ['Insta360','X5','premium',['360','replaceable-lenses']]
]);

add('instant-cameras','Instant cameras','travel',['instant camera','instax','polaroid camera'],['Print format and film cost','Automatic versus creative exposure controls','Camera size and portability','Hybrid digital features and app connectivity'],['mini-film','wide-film','hybrid','creative','value'],[
  ['Fujifilm','Instax Mini 12','value',['mini-film','simple']],
  ['Fujifilm','Instax Mini 41','balanced',['mini-film','automatic']],
  ['Fujifilm','Instax Mini Evo','premium',['hybrid','creative']],
  ['Fujifilm','Instax Wide 400','specialist',['wide-film','group-photos']],
  ['Polaroid','Now+ Generation 2','specialist',['creative','full-size-film']]
]);

add('photo-printers','Portable photo printers','display',['photo printer','portable photo printer','phone photo printer','instax printer'],['Print size and print technology','Consumable cost and availability','Phone app and editing workflow','Portability, battery and connection method'],['portable','instax','dye-sub','large-print','value'],[
  ['Canon','SELPHY CP1500','balanced',['dye-sub','large-print']],
  ['Canon','SELPHY QX20','compact',['portable','square-print']],
  ['Fujifilm','Instax Mini Link 3','value',['instax','portable']],
  ['Fujifilm','Instax Link Wide','specialist',['instax','large-print']],
  ['Kodak','Mini 2 Retro','compact',['portable','dye-sub']]
]);

add('electric-kettles','Electric kettles','guide',['electric kettle','kettle','variable temperature kettle'],['Capacity and minimum-fill level','Fixed versus variable temperature control','Materials, weight and pouring ergonomics','Keep-warm, noise and cleaning features'],['variable-temperature','stainless-steel','compact','premium','value'],[
  ['Russell Hobbs','RHK510 Addison Kettle','balanced',['variable-temperature','keep-warm']],
  ['Russell Hobbs','RHK82BRU Carlton Kettle','value',['stainless-steel','simple']],
  ['Philips','Series 5000 HD9395/90 Kettle','specialist',['double-wall','touch-control']],
  ['Breville','the Soft Top Pure BKE700','compact',['simple','soft-open-lid']],
  ['Breville','the Smart Kettle BKE825','premium',['variable-temperature','keep-warm']]
]);

add('toasters','Toasters','guide',['toaster','2 slice toaster','4 slice toaster'],['Two-slice versus four-slice capacity','Slot width and bread types','Browning control consistency','Lift, defrost, reheat and cleaning features'],['2-slice','4-slice','wide-slots','premium','value'],[
  ['Russell Hobbs','RHT82BRU Carlton 2 Slice Toaster','value',['2-slice','wide-slots']],
  ['Breville','the Bit More 2 Slice BTA435','balanced',['2-slice','lift-look']],
  ['Breville','the Smart Toast 4 Slice BTA845','premium',['4-slice','motorised']],
  ['Sunbeam','Alinea Select 2 Slice Toaster','compact',['2-slice','browning-control']],
  ['DeLonghi','Icona Capitals 2 Slice Toaster','specialist',['2-slice','design']]
]);

add('food-processors','Food processors','guide',['food processor','kitchen food processor','chopper processor'],['Bowl capacity and batch size','Slicing, grating, chopping and dough attachments','Motor power and heavy-load use','Storage, cleaning and replacement parts'],['compact','large-bowl','dough','premium','value'],[
  ['Breville','the Kitchen Wizz 8 BFP580','value',['compact','slicing']],
  ['Breville','the Kitchen Wizz 15 Pro BFP800','premium',['large-bowl','dough']],
  ['KitchenAid','7 Cup Food Processor 5KFP0719','balanced',['medium-bowl','easy-storage']],
  ['Ninja','Professional Food Processor BN650','specialist',['high-power','dough']],
  ['Cuisinart','8 Cup Food Processor','compact',['medium-bowl','simple']]
]);

add('slow-cookers','Slow cookers','guide',['slow cooker','crock pot','searing slow cooker'],['Capacity and household size','Searing capability and removable pot material','Manual versus digital timer controls','Keep-warm, cleaning and bench storage'],['family','searing','digital','compact','value'],[
  ['Russell Hobbs','RHSC650BLK 6L Searing Slow Cooker','value',['family','searing']],
  ['Crock-Pot','TimeSelect 5.6L Digital Slow Cooker','balanced',['digital','family']],
  ['Breville','the Searing Slow Cooker LSC650','specialist',['searing','family']],
  ['Sunbeam','SecretChef Electronic Sear and Slow Cooker HP8555','premium',['searing','digital']],
  ['Crock-Pot','Traditional 4.5L Slow Cooker','compact',['simple','compact']]
]);

add('ice-cream-makers','Ice cream makers','guide',['ice cream maker','gelato maker','frozen dessert maker','creami'],['Pre-freeze bowl versus compressor or processed-pint workflow','Batch capacity and preparation time','Texture modes and dietary flexibility','Machine size, noise and cleaning'],['creami','compressor','compact','family','value'],[
  ['Ninja','CREAMi NC300ANZ','balanced',['creami','multi-mode']],
  ['Ninja','CREAMi Deluxe NC501','premium',['creami','large-pints']],
  ['Cuisinart','Ice Cream Maker ICE-30BC','value',['pre-freeze','simple']],
  ['Cuisinart','Ice Cream and Gelato Professional ICE-100','premium',['compressor','gelato']],
  ['Breville','the Smart Scoop BCI600','specialist',['compressor','automatic-hardness']]
]);

add('garment-steamers','Garment steamers','guide',['garment steamer','clothes steamer','handheld steamer'],['Handheld versus upright steaming','Steam output and heat-up time','Water tank size and refill frequency','Travel size, plate design and fabric use'],['handheld','travel','high-steam','compact','value'],[
  ['Philips','3000 Series Handheld Steamer STH3000/20','value',['handheld','compact']],
  ['Philips','5000 Series Handheld Steamer STH5030/80','balanced',['handheld','high-steam']],
  ['Tefal','Pure Pop DT2020','compact',['travel','handheld']],
  ['Russell Hobbs','Steam Genie Handheld Garment Steamer','specialist',['handheld','large-tank']],
  ['Steamery','Cirrus 3 Iron Steamer','premium',['travel','heated-plate']]
]);

add('hair-straighteners','Hair straighteners','guide',['hair straightener','hair iron','ghd','styler'],['Plate size and hair length','Temperature control and heat consistency','Cordless versus corded use','Hair type, styling speed and damage-management features'],['temperature-control','cordless','premium','thick-hair','value'],[
  ['Remington','Shine Therapy S8500AU','value',['temperature-control','ceramic']],
  ['ghd','Gold Styler','balanced',['premium','rounded-barrel']],
  ['ghd','Platinum+ Styler','premium',['predictive-heat','premium']],
  ['Dyson','Corrale HS07','specialist',['cordless','flexing-plates']],
  ['Cloud Nine','Original Iron','premium',['temperature-control','ceramic']]
]);

add('beard-trimmers','Beard trimmers','guide',['beard trimmer','trimmer','grooming kit'],['Minimum and maximum cutting length','Comb adjustment and precision control','Wet and dry use plus cleaning','Battery runtime, charging and travel'],['precision','wet-dry','long-runtime','multi-groom','value'],[
  ['Philips','Beardtrimmer Series 5000 BT5515/15','balanced',['precision','long-runtime']],
  ['Braun','Beard Trimmer Series 7 BT7420','premium',['precision','multi-groom']],
  ['Panasonic','ER-GB62 Beard Trimmer','specialist',['wet-dry','multi-groom']],
  ['Wahl','Stainless Steel Lithium Ion+ Beard Trimmer','premium',['long-runtime','multi-groom']],
  ['Remington','Style Series B5 Beard Trimmer','value',['precision','washable']]
]);

add('water-flossers','Water flossers','guide',['water flosser','oral irrigator','waterpik'],['Cordless versus countertop format','Pressure settings and pulse control','Reservoir size and refill frequency','Tips, braces suitability and bathroom storage'],['cordless','countertop','braces','compact','value'],[
  ['Waterpik','Cordless Advanced Water Flosser','balanced',['cordless','travel']],
  ['Waterpik','Aquarius WP-660 Water Flosser','premium',['countertop','large-reservoir']],
  ['Philips','Sonicare Power Flosser 3000 HX3826/33','specialist',['cordless','quad-stream']],
  ['Oral-B','Aquacare 4 Water Flosser','value',['cordless','sensitive']],
  ['Panasonic','EW1511 Water Flosser','compact',['cordless','ultrasonic']]
]);

add('massage-guns','Massage guns','fitness',['massage gun','percussion massager','muscle massager'],['Amplitude, force and speed range','Weight, handle ergonomics and portability','Noise and battery runtime','Attachment range, app guidance and travel case'],['compact','quiet','high-force','travel','value'],[
  ['Therabody','Theragun Mini','compact',['travel','compact']],
  ['Therabody','Theragun Prime','premium',['high-force','app-guidance']],
  ['Hyperice','Hypervolt 2','balanced',['quiet','ergonomic']],
  ['RENPHO','Active Massage Gun','value',['multi-speed','travel']],
  ['Bob and Brad','C2 Pro Massage Gun','specialist',['compact','heated-cold-head']]
]);

add('smart-scales','Smart scales','fitness',['smart scale','body composition scale','bluetooth scale'],['Weight-only versus body-composition metrics','App ecosystem and multi-user support','Wi-Fi versus Bluetooth syncing','Display, trend tracking and privacy'],['body-composition','wifi','multi-user','athlete','value'],[
  ['RENPHO','Elis 1 Smart Body Scale','value',['body-composition','bluetooth']],
  ['Eufy','Smart Scale P2 Pro','balanced',['body-composition','multi-user']],
  ['Withings','Body Smart','premium',['wifi','body-composition']],
  ['Withings','Body Comp','premium',['wifi','advanced-metrics']],
  ['Xiaomi','Body Composition Scale S400','specialist',['body-composition','multi-user']]
]);

add('streaming-devices','Streaming devices','display',['streaming device','streaming stick','fire tv','apple tv'],['Supported streaming apps and Australian services','4K, HDR and audio format support','Wi-Fi, Ethernet and storage requirements','Remote control, voice assistant and ecosystem'],['4k','dolby-vision','ethernet','apple','value'],[
  ['Amazon','Fire TV Stick HD','value',['1080p','compact']],
  ['Amazon','Fire TV Stick 4K','balanced',['4k','dolby-vision']],
  ['Amazon','Fire TV Stick 4K Max','premium',['4k','wifi-6e']],
  ['Apple','Apple TV 4K 3rd Generation','specialist',['apple','ethernet']],
  ['NVIDIA','SHIELD TV Pro','premium',['4k','local-media']]
]);

module.exports={categories,CHECKED,NEXT_REVIEW};
