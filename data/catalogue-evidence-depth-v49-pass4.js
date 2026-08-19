'use strict';

const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass4';

const records={
  'ghd-gold-styler':{
    model:'ghd gold styler',source:'https://www.ghdhair.com/au/hair-straighteners/ghd-gold-styler-hair-straightener-p-435',
    summary:'A 26 mm premium hair styler built around a fixed 185°C operating temperature, dual-zone heat sensing and a rounded barrel for straightening, waves and curls.',
    highlights:['Dual-zone technology with two heat sensors','26 mm floating plates maintained at 185°C','Automatic sleep mode after 30 minutes'],
    watch:'The temperature is deliberately fixed rather than user-adjustable. Buyers who specifically need lower or higher selectable heat settings should compare variable-temperature alternatives.',
    specs:[['Plate width','26 mm'],['Temperature','185°C fixed'],['Heating system','Dual-zone with two heat sensors'],['Plate design','Floating plates'],['Barrel','Rounded'],['Sleep mode','After 30 minutes'],['Voltage','Universal voltage'],['Warranty','2 years']],
    decisionAttributes:{plateWidthMm:26,temperatureC:185,variableTemperature:false,floatingPlates:true,roundedBarrel:true,sleepMinutes:30,universalVoltage:true}
  },
  'ghd-platinum-styler':{
    model:'ghd platinum+ styler',source:'https://www.ghdhair.com/au/hair-straighteners/ghd-platinum-plus-black-styler-hair-straightener-p-453',
    summary:'A premium fixed-temperature styler using ghd ultra-zone predictive heat technology for buyers prioritising heat consistency and fast readiness.',
    highlights:['Ultra-zone predictive technology monitors heat 250 times per second','26 mm plates maintained at 185°C','Approximately 20-second heat-up with 30-minute sleep mode'],
    watch:'It remains a fixed-185°C system despite the more advanced heat regulation. Shoppers wanting manual temperature selection should not infer adjustability from the predictive technology.',
    specs:[['Plate width','26 mm'],['Temperature','185°C fixed'],['Heat technology','Ultra-zone predictive'],['Heat monitoring','250 times per second'],['Heat-up','Approx. 20 seconds'],['Sleep mode','After 30 minutes'],['Voltage','Universal voltage'],['Warranty','3 years']],
    decisionAttributes:{plateWidthMm:26,temperatureC:185,variableTemperature:false,predictiveHeat:true,heatChecksPerSecond:250,heatUpSeconds:20,sleepMinutes:30,universalVoltage:true}
  },
  'dyson-corrale-hs07':{
    model:'Corrale HS07 family',source:'https://www.dyson.com.au/products/hair-care/hair-straighteners/corrale',
    summary:'A cordless-or-cabled premium straightener using flexing copper-alloy plates and intelligent heat control for buyers who value styling mobility.',
    highlights:['Cordless use for up to 30 minutes from a four-cell lithium-ion battery','Flexing manganese copper-alloy plates','Intelligent heat control measures temperature 100 times per second'],
    watch:'Cordless runtime and charging add an ownership trade-off that conventional corded irons avoid. Dyson lists Corrale HS03/HS07 within the same supported family, so exact colour/package should still be checked at purchase.',
    specs:[['Family','Dyson Corrale HS03 / HS07 supported family'],['Power mode','Cordless or cabled'],['Battery','4-cell lithium-ion'],['Cordless runtime','Up to 30 minutes'],['Full charge','Approx. 70 minutes'],['Plate material','Flexing manganese copper alloy'],['Heat control','Temperature measured 100 times per second'],['Styling','Straighten, curl or wave']],
    decisionAttributes:{cordless:true,cabledUse:true,runtimeMinutes:30,chargeMinutes:70,flexingPlates:true,heatChecksPerSecond:100,multiStyle:true}
  },
  'cloud-nine-original-iron':{
    model:'The Original Iron',source:'https://www.cloudninehair.com.au/products/the-new-original-iron-hair-straightener',
    summary:'A variable-temperature 1-inch straightener with eleven settings, Revive Mode and a 20-second heat-up for buyers wanting more heat control than fixed-temperature premium stylers.',
    highlights:['11 temperature settings from 100°C to 200°C','1-inch Sericite-infused plates with Revive Mode','20-second heat-up and 30-minute hibernation'],
    watch:'The wide temperature range is useful only if you will choose settings appropriate to your hair and styling task; more heat is not inherently better.',
    specs:[['Plate width','1 inch'],['Plate material','Sericite-infused'],['Temperature range','100–200°C'],['Temperature settings','11'],['Heat-up','20 seconds'],['Hibernation','After 30 minutes'],['Cord','3 m 360° swivel'],['Voltage','100–240 V'],['Weight','0.225 kg excluding cord'],['Warranty','3 years']],
    decisionAttributes:{plateWidthIn:1,variableTemperature:true,minTemperatureC:100,maxTemperatureC:200,temperatureSettings:11,reviveMode:true,heatUpSeconds:20,sleepMinutes:30,weightKg:0.225}
  },

  'renpho-elis-1-smart-body-scale':{
    model:'Elis 1 Smart Body Scale',source:'https://renpho.com/products/elis-1-smart-body-scale',
    summary:'A Bluetooth smart scale for households wanting app-based weight and body-composition trend tracking at an entry price point.',
    highlights:['Tracks 13 body metrics through the RENPHO Health ecosystem','Bluetooth app synchronisation','Supports trend tracking and multiple stored profiles in the companion app'],
    watch:'Body-composition values from consumer BIA scales are estimates and should be treated as trend/context data rather than medical measurements.',
    specs:[['Product family','Elis 1 Smart Body Scale'],['Body metrics','13'],['Connectivity','Bluetooth'],['Companion ecosystem','RENPHO Health app'],['Core metrics','Weight, BMI and body-composition estimates'],['Trend tracking','Yes in app'],['User profiles','Multiple profiles supported'],['Use case','Home wellness tracking; not medical diagnosis']],
    decisionAttributes:{bodyComposition:true,metricCount:13,bluetooth:true,wifi:false,app:'RENPHO Health',multiUser:true,medicalDevice:false}
  },
  'eufy-smart-scale-p2-pro':{
    model:'Smart Scale P2 Pro',source:'https://www.eufy.com/au/products/eufy-smart-scale-p2-pro-black',
    summary:'A Wi-Fi and Bluetooth body-composition scale with sixteen measurements, fine weight increments and multi-user app support.',
    highlights:['16 body measurements including weight, body fat, BMI and muscle metrics','Wi-Fi and Bluetooth connectivity with unlimited app users','50 g / 0.05 kg weight increments and 0.1–180 kg range'],
    watch:'Composition metrics are consumer BIA estimates and can vary with hydration and measurement conditions; use consistent conditions for trends rather than treating a single reading as clinical truth.',
    specs:[['Measurements','16'],['Weight range','0.1–180 kg'],['Weight increment','0.05 kg / 50 g'],['Connectivity','Wi-Fi + Bluetooth'],['Surface','ITO coating'],['Water resistance','IPX5'],['Users','Unlimited app users'],['Modes','Baby and pet modes'],['Power','4 × AAA batteries'],['Dimensions','280 × 280 × 26 mm'],['Weight','1.7 kg']],
    decisionAttributes:{bodyComposition:true,metricCount:16,wifi:true,bluetooth:true,maxWeightKg:180,incrementKg:0.05,multiUser:true,babyMode:true,petMode:true,ipx5:true}
  },
  'withings-body-smart':{
    model:'Body Smart',source:'https://www.withings.com/en-au/collections/body-smart',
    summary:'A connected body-composition scale for households wanting Wi-Fi/Bluetooth syncing, a colour display and multi-user health trends.',
    highlights:['Weight accuracy stated to within 50 g','Body-composition metrics including body fat, muscle and water','Wi-Fi and Bluetooth connectivity for up to eight users'],
    watch:'Body composition and derived metrics are estimates, not a substitute for clinical assessment. Withings modes and app insights are most useful when measurements are taken consistently over time.',
    specs:[['Weight precision','50 g stated accuracy'],['Composition','Body fat, muscle and water estimates'],['Additional metrics','Standing heart rate and BMR'],['Connectivity','Wi-Fi + Bluetooth'],['Display','High-resolution colour display'],['Users','Up to 8'],['Modes','Athlete / Pregnancy / Baby / Eyes Closed'],['Battery','More than 15 months stated']],
    decisionAttributes:{bodyComposition:true,weightPrecisionG:50,wifi:true,bluetooth:true,maxUsers:8,heartRate:true,bmr:true,athleteMode:true,pregnancyMode:true,babyMode:true}
  },
  'withings-body-comp':{
    model:'Body Comp',source:'https://www.withings.com/en-au/collections/body-comp',
    summary:'A higher-tier connected scale adding multi-frequency body composition and cardiovascular/nerve-health trend metrics to the Withings Wi-Fi/Bluetooth platform.',
    highlights:['Multi-frequency body composition with 50 g stated weight accuracy','Wi-Fi and Bluetooth connectivity for up to eight users','Adds vascular-age and nerve-health trend metrics within the Withings ecosystem'],
    watch:'Advanced health indicators are still consumer wellness measurements and should not be interpreted as diagnoses. Check the specific metric limitations in Withings guidance if using them to inform health decisions.',
    specs:[['Weight precision','50 g stated accuracy'],['Body composition','Multi-frequency BIA'],['Composition metrics','Body fat, bone and muscle estimates'],['Connectivity','Wi-Fi + Bluetooth'],['Display','High-resolution colour display'],['Users','Up to 8'],['Modes','Athlete / Pregnancy / Baby / Eyes Closed'],['Advanced trends','Vascular age and nerve health score']],
    decisionAttributes:{bodyComposition:true,multiFrequencyBia:true,weightPrecisionG:50,wifi:true,bluetooth:true,maxUsers:8,vascularAge:true,nerveHealth:true,athleteMode:true}
  },
  'xiaomi-body-composition-scale-s400':{
    model:'Xiaomi Body Composition Scale S400',source:'https://www.mi.com/au/product/xiaomi-body-composition-scale-s400/',
    summary:'A dual-frequency BIA scale with extensive body-composition indicators and large household profile support in Xiaomi Home.',
    highlights:['Dual-frequency BIA at 50 kHz and 250 kHz','25 body-composition indicators plus heart-rate measurement','Supports up to 36 family members with 0.1–150 kg measurement range'],
    watch:'Xiaomi explicitly states this is not a medical device and results are for reference only. Cloud synchronisation depends on the Xiaomi Home ecosystem and a Bluetooth gateway; it is not a Wi-Fi scale.',
    specs:[['BIA frequencies','50 kHz + 250 kHz'],['Indicators','25 body-composition indicators'],['Heart rate','Yes'],['Weight range','0.1–150 kg'],['Small-object precision','0.1 kg'],['Profiles','Up to 36 family members'],['App','Xiaomi Home / Mi Home'],['Connectivity','Bluetooth'],['Cloud sync','Via Bluetooth gateway'],['Power','3 × AAA batteries'],['Battery life','Up to 180 days stated'],['Medical device','No']],
    decisionAttributes:{bodyComposition:true,dualFrequencyBia:true,metricCount:25,heartRate:true,maxWeightKg:150,maxUsers:36,bluetooth:true,wifi:false,medicalDevice:false}
  },

  'hyperice-hypervolt-2':{
    model:'Hypervolt 2',source:'https://hyperice.com/products/hypervolt-2-black/',
    summary:'A full-size connected percussion massager with three speeds, pressure sensing and five attachments for buyers who value app guidance and longer sessions.',
    highlights:['Three speeds driven by a 60 W brushless motor','Up to 3-hour battery with five interchangeable attachments','Bluetooth connectivity and pressure-sensor feedback'],
    watch:'Massage guns are comfort/recovery tools, not substitutes for medical assessment of persistent pain or injury. Airline carriage rules can also matter because of the lithium-ion battery.',
    specs:[['Speeds','3'],['Motor','60 W brushless'],['Battery','Up to 3 hours stated'],['Weight','1.8 lb'],['Dimensions','7.5 × 2.5 × 9.5 in'],['Attachments','5'],['Connectivity','Bluetooth'],['Pressure sensor','Yes'],['Noise system','QuietGlide'],['Travel','TSA-friendly carry-on guidance']],
    decisionAttributes:{speeds:3,motorW:60,batteryHours:3,weightLb:1.8,attachments:5,bluetooth:true,pressureSensor:true,travelFriendly:true}
  },
  'renpho-active-massage-gun':{
    model:'Active Massage Gun +',source:'https://renpho.com/products/renpho-active-massage-gun?variant=32776294137941',
    summary:'A connected compact massage gun with five speeds, USB-C charging and app guidance in RENPHO’s current Active Massage Gun family.',
    highlights:['Five speeds spanning 1800–2800 rpm','10 mm amplitude with manufacturer spec-table stall force of 50 lb','Bluetooth/app support, USB-C charging and five heads'],
    watch:'RENPHO’s page uses slightly different force wording between marketing copy and the specification table; APG retains the 50 lb spec-table value rather than presenting it as independently measured performance.',
    specs:[['Current family','Active Massage Gun +'],['Speeds','5'],['Percussion rate','1800–2800 rpm'],['Amplitude','10 mm'],['Stall force','50 lb in manufacturer specification table'],['Noise','≤45 dB stated'],['Battery','Up to 3.5 hours stated'],['Attachments','5'],['Charging','USB-C'],['Connectivity','Bluetooth / app'],['Weight','Approx. 1.5 lb']],
    decisionAttributes:{speeds:5,minRpm:1800,maxRpm:2800,amplitudeMm:10,stallForceLb:50,batteryHours:3.5,attachments:5,usbC:true,bluetooth:true,weightLb:1.5}
  },
  'bob-and-brad-c2-pro-massage-gun':{
    model:'BADUSMSG-001-C2J-LX',source:'https://www.bobandbrad.com/products/bob-and-brad-c2-pro-massage-gun-with-heat-and-cold-therapy',
    summary:'A compact percussion massager distinguished by a heat-and-cold therapy head alongside conventional massage attachments.',
    highlights:['Five speeds from 2000–3200 percussions per minute','10 mm amplitude and manufacturer-stated >44 lb stall force','Dedicated heat-and-cold therapy capability with five heads'],
    watch:'Thermal and percussion features can feel useful for recovery, but they do not diagnose or treat an injury. Use temperature functions within manufacturer guidance and stop if symptoms worsen.',
    specs:[['SKU','BADUSMSG-001-C2J-LX'],['Speeds','5'],['Percussion range','2000–3200 per minute'],['Amplitude','10 mm'],['Stall force','>44 lb stated'],['Weight','1.5 lb / 0.68 kg'],['Attachments','5'],['Heat/cold therapy','Yes'],['Display','LED force/speed display'],['Extended warranty','2 years']],
    decisionAttributes:{speeds:5,minRpm:2000,maxRpm:3200,amplitudeMm:10,stallForceLb:44,heatCold:true,attachments:5,weightKg:0.68,forceDisplay:true}
  },

  'philips-3000-series-handheld-steamer-sth3000-20':{
    model:'STH3000/20',source:'https://www.philips.com.au/c-e/ho/ironing/handheld-steamer-3000.html',
    summary:'A foldable 1000 W handheld garment steamer for light travel and quick touch-ups without an ironing board.',
    highlights:['Up to 20 g/min continuous steam','Approximately 30-second heat-up','100 ml detachable tank in a foldable handheld design'],
    watch:'A small tank and modest steam output suit quick garments more than large ironing loads; frequent whole-household steaming may justify a larger upright or higher-output model.',
    specs:[['Model','STH3000/20'],['Power','1000 W'],['Steam output','Up to 20 g/min'],['Heat-up','Approx. 30 seconds'],['Water tank','100 ml detachable'],['Form factor','Foldable handheld'],['Cord','2 m'],['Ironing board','Not required'],['Fabric guidance','Safe on ironable garments']],
    decisionAttributes:{handheld:true,foldable:true,powerW:1000,steamGPerMin:20,heatUpSeconds:30,tankMl:100,cordM:2,travelFriendly:true}
  },
  'tefal-pure-pop-dt2020':{
    model:'DT2020',source:'https://www.tefal.com.au/products/tefal-pure-pop-garment-steamer-dt2020-marine-blue',
    summary:'A compact travel-oriented handheld steamer with fast heat-up and a reversible pad for steaming or lint/hair removal.',
    highlights:['Up to 20 g/min steam output','Approximately 15-second heat-up','Reversible velvet / lint-removal pad in a compact travel format'],
    watch:'The travel-first design prioritises portability over tank capacity and sustained high-output steaming; direct manufacturer stock status can change without changing the product’s category fit.',
    specs:[['Model','DT2020'],['Form factor','Handheld travel steamer'],['Steam output','Up to 20 g/min'],['Heat-up','Approx. 15 seconds'],['Pad','Reversible velvet / lint-removal side'],['Travel design','Compact'],['Use','Vertical garment steaming'],['Manufacturer category','Current Tefal Australia garment-steamer range']],
    decisionAttributes:{handheld:true,travelFriendly:true,steamGPerMin:20,heatUpSeconds:15,reversiblePad:true,lintRemoval:true}
  },

  'panasonic-er-gb62-beard-trimmer':{
    model:'ER-GB62-H541',source:'https://www.panasonic.com/au/consumer/personal-care/mens-grooming/beard-trimmers/er-gb62-h541.html',
    summary:'A cord/cordless beard and hair trimmer with a wide 39-setting range and three combs for buyers who want one adjustable grooming tool.',
    highlights:['39 cutting settings with 0.5 mm adjustment steps','Three comb attachments covering beard and hair ranges','Approximately 50-minute cordless runtime from a one-hour charge'],
    watch:'Its Ni-MH battery and conventional comb workflow are less travel-minimal than some newer USB-C grooming tools; choose around cutting range and reliability rather than feature count alone.',
    specs:[['Model','ER-GB62-H541'],['Blade','45° nano-polished'],['Settings','39'],['Bare minimum','0.5 mm without attachment'],['Beard range','0.5–10 mm'],['Hair range','11–20 mm'],['Adjustment interval','0.5 mm'],['Combs','3'],['Runtime','Approx. 50 min'],['Charge time','Approx. 1 hour'],['Power','Cord / cordless'],['Battery','Ni-MH'],['Voltage','100–240 V'],['Dimensions','180 × 52 × 43 mm'],['Weight','176 g']],
    decisionAttributes:{settings:39,minLengthMm:0.5,maxLengthMm:20,stepMm:0.5,combs:3,runtimeMinutes:50,chargeMinutes:60,corded:true,cordless:true,washable:true,weightG:176}
  },

  'philips-sonicare-power-flosser-3000-hx3826-33':{
    model:'HX3826/33',source:'https://www.philips.com.au/c-p/HX3826_33/cordless-power-flosser-3000-oral-irrigator',
    summary:'A cordless oral irrigator with Quad Stream and two cleaning modes for buyers prioritising compact bathroom storage and travel flexibility.',
    highlights:['Quad Stream nozzle with Clean and Deep Clean modes','Three pressure settings and 250 ml reservoir','Manufacturer-stated battery life up to 40 days'],
    watch:'Manufacturer plaque/gum-health claims come from its own test conditions and should not be treated as APG clinical endorsement. Oral irrigators complement rather than automatically replace professional dental advice.',
    specs:[['Model','HX3826/33'],['Modes','Clean / Deep Clean'],['Pressure settings','3'],['Reservoir','250 ml'],['Clean cycle','Approx. 60 sec'],['Deep Clean cycle','Up to 90 sec'],['Battery','Up to 40 days stated'],['Nozzles','F1 Standard + F3 Quad Stream'],['Charging','USB-A cable / wall adapter'],['Form factor','Cordless']],
    decisionAttributes:{cordless:true,modes:2,pressureSettings:3,reservoirMl:250,quadStream:true,batteryDays:40,standardNozzle:true,usbCharging:true}
  }
};

const unresolvedEntityCorrections=[
  {slug:'remington-shine-therapy-s8500au',reason:'Current Remington Australia catalogue did not surface S8500AU while newer S9350AU/S8648AU/S9100AU families are current; requires currentness reconciliation before certification.'},
  {slug:'therabody-theragun-mini',reason:'Current manufacturer product is Theragun Mini 3rd Gen; maintained generic entity has no generation and should not inherit current-gen specifications without reconciliation.'},
  {slug:'therabody-theragun-prime',reason:'Current manufacturer product is Theragun Prime 6th Gen; maintained generic entity has no generation and requires generation binding.'},
  {slug:'philips-5000-series-handheld-steamer-sth5030-80',reason:'Current Philips Australia 5000 Series product evidence resolves STH5030/20, not maintained STH5030/80; regional/model mismatch requires correction.'},
  {slug:'russell-hobbs-steam-genie-handheld-garment-steamer',reason:'Exact current Australian manufacturer product page was not established in this pass; keep below strong-depth rather than use retailer-only evidence.'},
  {slug:'steamery-cirrus-3-iron-steamer',reason:'Maintained product source/brand domain is unresolved in current research; exact official Australian manufacturer evidence must be established before certification.'},
  {slug:'philips-beardtrimmer-series-5000-bt5515-15',reason:'Current Philips Australia Series 5000 evidence surfaces different exact model numbers including BT5502/15 and BT5775/15; maintained BT5515/15 requires regional/currentness reconciliation.'},
  {slug:'braun-beard-trimmer-series-7-bt7420',reason:'Current Braun Australia range lists newer Beard Trimmer 7 variants such as BT7440; BT7420 appears in support compatibility but needs current-product status reconciliation.'},
  {slug:'wahl-stainless-steel-lithium-ion-beard-trimmer',reason:'Exact maintained Australian model identity was not bound to a current Wahl manufacturer page in this pass.'},
  {slug:'remington-style-series-b5-beard-trimmer',reason:'Maintained B5 entity was not surfaced in the current Remington Australia beard-trimmer catalogue; requires currentness or replacement review.'},
  {slug:'waterpik-cordless-advanced-water-flosser',reason:'Current Australian manufacturer range uses Cordless Advanced Pro 2.0 model identifiers; maintained generic entity must be bound to an exact current variant.'},
  {slug:'waterpik-aquarius-wp-660-water-flosser',reason:'Current Australian brand naming/model data presents WP-660/662 within Ultra Professional/Aquarius family; exact maintained entity naming must be reconciled before certification.'},
  {slug:'oral-b-aquacare-4-water-flosser',reason:'Oral-B Australia references Aquacare/Oxyjet, but an exact current Aquacare 4 product/specification page was not established in this pass.'},
  {slug:'panasonic-ew1511-water-flosser',reason:'Panasonic Australia exact EW1511 page is archived while newer EW-DJ66 family is current; treat EW1511 as archived/superseded until catalogue status is corrected.'}
];

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model-or-explicit-model-family',confidence:'high',label:label||k};}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,sourceType:'Official primary manufacturer product/specification evidence · independently reverified 20 Aug 2026',summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass4'});
  p.factEvidence={};addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,'Maintained APG product identity');addFact(p,'exactModel',row.model,'Exact model / explicit manufacturer family');addFact(p,'canonicalCategory',p.categoryLabel||p.category,'Canonical APG category');
  for(const spec of row.specs)addFact(p,`spec_${key(spec[0])}`,spec[1],spec[0]);
  row.highlights.forEach((value,i)=>addFact(p,`verifiedClaim${i+1}`,value,`Verified manufacturer claim ${i+1}`));
  p.evidenceClaims=row.highlights.map((value,i)=>({key:`verifiedClaim${i+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-primary'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set(),touched=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){if(!p||seen.has(p.slug))continue;seen.add(p.slug);if(records[p.slug]){applyOne(p,records[p.slug]);touched.push(p.slug);}}
  return{version:VERSION,verifiedAt:VERIFIED,newPrimaryResearch:touched.length,touched,unresolvedEntityCorrections};
}
module.exports={VERSION,VERIFIED,NEXT_REVIEW,records,unresolvedEntityCorrections,apply};
