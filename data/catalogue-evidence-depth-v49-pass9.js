'use strict';
const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass9';

const records={
  'petlibro-air-smart-feeder':{
    model:'PLAF108',
    source:'https://au.petlibro.com/products/air-wifi-feeder',
    summary:'A compact cordless smart feeder for cats and small pets where battery operation, app scheduling and a smaller 2 L hopper matter more than camera or RFID features.',
    highlights:['2 L hopper with app-controlled schedules for up to 10 meals or snacks per day','Rechargeable cordless design with up to 30 days manufacturer-stated battery life','PETLIBRO app control with dry-food portion scheduling'],
    watch:'The 30-day figure is a manufacturer claim and changes with Wi-Fi conditions, dispensing frequency and battery age. This is a dry-food feeder and the smaller hopper suits different households than the 5 L Granary models.',
    specs:[['Model','PLAF108'],['Capacity','2 L'],['Meals','Up to 10 per day'],['Portion range','1–16 portions per meal'],['Portion size','Approx. 10.4 mL'],['Food size','2–15 mm dry kibble'],['Power','Rechargeable cordless battery'],['Battery claim','Up to 30 days stated'],['Connectivity','Wi-Fi / PETLIBRO app'],['Dimensions','Approx. 310 × 265 × 180 mm'],['Weight','Approx. 1.3 kg'],['Warranty','24 months on current AU direct page']],
    decisionAttributes:{capacityL:2,mealsPerDay:10,portionMax:16,portionMl:10.4,cordless:true,rechargeable:true,batteryClaimDays:30,camera:false,rfid:false,app:true,dryFoodOnly:true}
  },
  'petlibro-granary-smart-feeder':{
    model:'PLAF103',
    source:'https://au.petlibro.com/products/petlibro-5g-wifi-automatic-pet-feeder',
    summary:'A 5 L app-connected dry-food feeder for households wanting larger hopper capacity, fine portion scheduling and dual-band Wi-Fi with battery backup for schedules.',
    highlights:['5 L hopper with 1–10 meals per day and 1–50 portions per meal','2.4 GHz and 5 GHz Wi-Fi with app feeding logs and maintenance alerts','DC power with three D-cell backup batteries; schedules continue during battery-only operation'],
    watch:'Battery backup preserves scheduled dispensing but disables Wi-Fi functions while running only on batteries. It does not provide a camera or pet-identity control.',
    specs:[['Model','PLAF103'],['Capacity','5 L'],['Meals','1–10 per day'],['Portions','1–50 per meal'],['Portion size','Approx. 20 mL'],['Food size','2–15 mm dry kibble'],['Connectivity','2.4/5 GHz Wi-Fi'],['Power','5 V DC'],['Backup power','3 × D alkaline batteries'],['Battery-only behaviour','Schedules continue; Wi-Fi functions unavailable'],['Dimensions','Approx. 340 × 190 × 190 mm'],['Weight','Approx. 2 kg'],['Bowl','Stainless steel']],
    decisionAttributes:{capacityL:5,mealsPerDay:10,portionMax:50,portionMl:20,dualBandWifi:true,batteryBackup:true,offlineSchedule:true,camera:false,rfid:false,app:true,dryFoodOnly:true}
  },
  'petlibro-one-rfid-smart-feeder':{
    model:'PLAF301',
    source:'https://au.petlibro.com/products/one-rfid-smart-feeder',
    summary:'A 3 L feeder designed to control food access for one tagged pet, making it materially different from open-bowl automatic feeders in multi-pet homes.',
    highlights:['RFID collar-tag access control with one tag paired to each feeder','3 L hopper with scheduling for up to 10 meals or snacks per day','2.4/5 GHz Wi-Fi plus emergency D-cell backup that retains feeding schedules'],
    watch:'It reads the supplied PETLIBRO collar tag, not a pet microchip or arbitrary third-party RFID tag. One feeder syncs with one tag, so multi-pet separation may require multiple feeders.',
    specs:[['Model','PLAF301'],['Capacity','3 L / about 13 cups stated'],['Meals','Up to 10 per day'],['Pet identification','PETLIBRO RFID collar tag'],['Tags per feeder','1'],['Microchip support','No'],['Food size','2–15 mm dry kibble'],['Connectivity','2.4/5 GHz Wi-Fi'],['Backup power','3 × D batteries'],['Battery-only behaviour','Schedules continue; Wi-Fi/reset unavailable'],['Feeder dimensions','Approx. 442 × 196 × 320 mm'],['Feeder weight','Approx. 2.80 kg'],['Tag weight','Approx. 4.2 g']],
    decisionAttributes:{capacityL:3,mealsPerDay:10,rfid:true,microchip:false,tagsPerFeeder:1,dualBandWifi:true,batteryBackup:true,offlineSchedule:true,camera:false,app:true,dryFoodOnly:true}
  },
  'petlibro-granary-smart-camera-feeder':{
    model:'PLAF203',
    source:'https://au.petlibro.com/products/petlibro-granary-automatic-pet-feeder-with-camera',
    summary:'A 5 L smart feeder adding a 1080p camera and two-way audio for owners who want feeding schedules plus remote visual monitoring.',
    highlights:['5 L hopper with 1–10 meals per day and 1–50 portions per meal','1080p camera with 145° wide-angle view, infrared night vision and two-way audio','2.4/5 GHz Wi-Fi with DC power and three D-cell backup batteries'],
    watch:'Camera monitoring is a convenience feature, not pet-identity control. Battery backup is for dispensing continuity and should not be assumed to power the complete connected-camera experience.',
    specs:[['Model','PLAF203'],['Capacity','5 L'],['Meals','1–10 per day'],['Portions','1–50 per meal'],['Portion size','Approx. 20 mL'],['Food size','2–15 mm dry kibble'],['Camera','1080p HD'],['Field of view','145°'],['Night vision','Infrared'],['Audio','Two-way'],['Connectivity','2.4/5 GHz Wi-Fi'],['Power','5 V DC + 3 × D backup'],['Dimensions','Approx. 358.9 × 185.4 × 350 mm'],['Weight','Approx. 1.7 kg']],
    decisionAttributes:{capacityL:5,mealsPerDay:10,portionMax:50,portionMl:20,camera:true,cameraResolution:'1080p',cameraFovDeg:145,nightVision:true,twoWayAudio:true,dualBandWifi:true,batteryBackup:true,rfid:false,app:true,dryFoodOnly:true}
  },
  'xiaomi-smart-pet-food-feeder':{
    model:'Xiaomi Smart Pet Food Feeder family',
    source:'https://www.mi.com/sg/product/xiaomi-smart-pet-food-feeder/specs/',
    evidenceSources:['https://www.mi.com/au/product-list/fitness/pets-care/'],
    summary:'Xiaomi’s current Australian-listed smart dry-food feeder family, combining a 3.6 L hopper, app scheduling and fault/low-food notifications in the Xiaomi Home ecosystem.',
    highlights:['3.6 L hopper in the official manufacturer hardware family','Xiaomi Home app scheduling with food-shortage and dispensing-error notifications','Compact 311 × 180 × 387 mm enclosure with 5.9 W rated power'],
    watch:'Xiaomi Australia currently lists the exact product family, while the manufacturer technical page exposes KR/US/EU/UK regional model suffixes rather than a distinct AU suffix. APG therefore verifies the product family but does not invent an Australian part number.',
    specs:[['Product family','Xiaomi Smart Pet Food Feeder'],['Capacity','3.6 L'],['Dimensions','311 × 180 × 387 mm'],['Weight','Approx. 3 kg'],['Rated input','5.9 V 1 A'],['Rated power','5.9 W'],['Power cord','Approx. 1.5 m'],['App','Xiaomi Home / Mi Home'],['Scheduling','App-controlled feeding schedules'],['Notifications','Low-food / dispensing-error notifications'],['Food type','Dry pet food'],['Australian identity','Current exact product family listed by Xiaomi Australia']],
    decisionAttributes:{capacityL:3.6,app:true,scheduling:true,lowFoodAlert:true,errorAlert:true,dryFoodOnly:true,regionalSkuExplicit:false,camera:false,rfid:false}
  },

  'logitech-signature-k855':{
    model:'Signature K855 / Y-R0078 / AU P/N 920-011074',
    source:'https://www.logitech.com/en-au/shop/p/k855-signature-wireless-mechanical-tkl.920-011074',
    evidenceSources:['https://support.logi.com/hc/en-au/articles/5216332584727-Specification-Signature-K855'],
    summary:'A compact wireless tenkeyless mechanical keyboard for productivity users wanting multi-device Bluetooth or Logi Bolt without backlighting or gaming-specific features.',
    highlights:['TTC Red linear mechanical switches in a tenkeyless layout','Bluetooth and included Logi Bolt receiver with Easy-Switch for up to three devices','Two AAA batteries with manufacturer-stated life up to 36 months'],
    watch:'It has no backlighting and its linear TTC Red switch is a specific typing preference. Battery life is a manufacturer estimate and varies with use.',
    specs:[['Model','Y-R0078'],['AU part number','920-011074'],['Layout','Tenkeyless'],['Switch','TTC Red linear mechanical'],['Connectivity','Bluetooth + Logi Bolt'],['Easy-Switch','Up to 3 devices'],['Wireless range','Up to 10 m stated'],['Battery','2 × AAA'],['Battery claim','Up to 36 months'],['Backlight','None'],['Total key travel','4.0 mm'],['Key durability','50 million presses stated'],['Dimensions','355.2 × 138.8 × 38.8 mm'],['Weight','692.4 g with batteries']],
    decisionAttributes:{layout:'TKL',mechanical:true,switch:'TTC Red linear',wireless:true,bluetooth:true,bolt:true,multiDevice:3,backlight:false,batteryMonths:36,weightG:692.4,gaming:false}
  },
  'logitech-mx-mechanical':{
    model:'MX Mechanical / YR0082',
    source:'https://www.logitech.com/en-au/shop/p/mx-mechanical',
    evidenceSources:['https://support.logi.com/hc/en-au/articles/5216332603799-Specification-MX-Mechanical'],
    summary:'A full-size low-profile wireless mechanical productivity keyboard with multi-device switching, smart backlighting and Bluetooth/Logi Bolt connectivity.',
    highlights:['Low-profile mechanical platform with Tactile Quiet, Clicky or Linear variants depending configuration','Bluetooth and Logi Bolt with switching across up to three devices','Smart white backlighting with manufacturer-stated battery up to 15 days lit or 10 months unlit'],
    watch:'Switch availability can vary by exact retail configuration. Backlighting materially reduces battery endurance versus using the keyboard unlit.',
    specs:[['Model','YR0082'],['Layout','Full-size'],['Switch family','Low-profile mechanical; Tactile Quiet / Clicky / Linear variants'],['Connectivity','Bluetooth + Logi Bolt'],['Devices','Up to 3'],['Backlight','Smart white illumination'],['Battery','1500 mAh Li-Po'],['Battery claim with backlight','Up to 15 days'],['Battery claim without backlight','Up to 10 months'],['Full charge','Approx. 4 hours'],['Actuation','1.3 mm'],['Total travel','3.2 mm'],['Actuation force','55 g'],['Dimensions','433.85 × 131.55 × 26.10 mm'],['Weight','828 g']],
    decisionAttributes:{layout:'full-size',mechanical:true,lowProfile:true,wireless:true,bluetooth:true,bolt:true,multiDevice:3,backlight:true,batteryLitDays:15,batteryUnlitMonths:10,weightG:828,gaming:false}
  },
  'razer-blackwidow-v4-75':{
    model:'Razer BlackWidow V4 75%',
    source:'https://www.razer.com/au-en/gaming-keyboards/razer-blackwidow-v4-75',
    summary:'A wired 75% enthusiast/gaming keyboard that prioritises hot-swappable mechanical switches, very high polling and per-key RGB in a compact layout that keeps arrows and the function row.',
    highlights:['75% layout with hot-swappable switch sockets','Up to 8000 Hz polling, N-key rollover and onboard profile support','Detachable USB-C connection, per-key Chroma RGB and media controls'],
    watch:'Its compact 75% layout drops the numpad and some dedicated navigation keys. The high polling ceiling is most relevant to latency-focused gaming, not ordinary office typing.',
    specs:[['Layout','75%'],['Switch sockets','Hot-swappable mechanical'],['Included switch family','Razer tactile mechanical on maintained base product'],['Connectivity','Wired detachable USB-C'],['Polling','Up to 8000 Hz'],['Rollover','N-key rollover'],['Onboard profiles','Up to 5'],['Lighting','Per-key Razer Chroma RGB'],['Media controls','Roller + buttons'],['Wrist rest','Magnetic'],['Dimensions','Approx. 321 × 155.5 × 24 mm'],['Weight','Approx. 815 g excluding wrist rest']],
    decisionAttributes:{layout:'75%',mechanical:true,hotSwap:true,wired:true,wireless:false,pollingHz:8000,nKeyRollover:true,onboardProfiles:5,rgb:true,weightG:815,gaming:true}
  },
  'corsair-k70-core-tkl':{
    model:'K70 CORE TKL family / CH-911911E',
    source:'https://www.corsair.com/ww/en/p/keyboards/ch-911911e-na/k70-core-tkl-rgb-mechanical-gaming-keyboard-ch-911911e-na',
    summary:'A wired tenkeyless gaming keyboard built around pre-lubricated linear mechanical switches, per-key RGB, onboard profiles and a multifunction dial.',
    highlights:['Tenkeyless wired mechanical layout with CORSAIR MLX Red v2 linear switches','1000 Hz polling, full key rollover/anti-ghosting and five onboard profiles','Per-key RGB, aluminium top plate and rotary multifunction dial'],
    watch:'CORSAIR exposes multiple regional key-layout SKUs for this product family and the current crawl does not expose a distinct Australian layout code. Buyers should verify the physical key layout of the local SKU before purchase.',
    specs:[['Product family','K70 CORE TKL'],['Representative family code','CH-911911E'],['Layout','Tenkeyless'],['Switch','CORSAIR MLX Red v2 linear'],['Connectivity','Wired'],['Cable','Detachable USB-C keyboard cable'],['Polling','1000 Hz'],['Rollover','Full-key NKRO / anti-ghosting'],['Onboard profiles','5'],['Onboard memory','8 MB'],['Lighting','Per-key RGB'],['Top plate','Aluminium'],['Control','Rotary multifunction dial'],['Weight','Approx. 0.743 kg'],['Warranty','2 years']],
    decisionAttributes:{layout:'TKL',mechanical:true,switch:'MLX Red v2 linear',wired:true,wireless:false,pollingHz:1000,nKeyRollover:true,onboardProfiles:5,rgb:true,weightKg:0.743,gaming:true,regionalLayoutVerify:true}
  },

  'logitech-g305-lightspeed':{
    model:'G305 LIGHTSPEED family',
    source:'https://www.logitechg.com/en-au/innovation/lightspeed.html',
    evidenceSources:['https://www.logitechg.com/en-us/products/gaming-mice/g305-lightspeed-wireless-gaming-mouse.910-005280.html'],
    summary:'A lightweight AA-powered wireless gaming mouse built around Logitech’s HERO sensor and 1 ms LIGHTSPEED connection rather than Bluetooth or rechargeable-battery features.',
    highlights:['HERO sensor with 200–12,000 DPI range','1000 Hz / 1 ms LIGHTSPEED wireless connection','Manufacturer-stated up to 250 hours on one AA battery at about 99 g'],
    watch:'The exact product family remains referenced by Logitech Australia, while the detailed product specification page is surfaced globally. APG treats current Australian availability separately and does not infer local stock from the global page.',
    specs:[['Product family','G305 LIGHTSPEED'],['Sensor','HERO'],['DPI','200–12,000'],['Max speed','>400 IPS stated'],['Max acceleration','>40 G stated'],['Polling','1000 Hz'],['Wireless','LIGHTSPEED 2.4 GHz'],['Bluetooth','No'],['Battery','1 × AA'],['Battery claim','Up to 250 hours'],['Weight','Approx. 99 g'],['Dimensions','116.6 × 62.15 × 38.2 mm'],['Onboard profiles','1'],['Warranty','2 years']],
    decisionAttributes:{gaming:true,wireless:true,lightspeed:true,bluetooth:false,rechargeable:false,dpiMax:12000,pollingHz:1000,batteryHours:250,weightG:99,onboardProfiles:1}
  },
  'logitech-lift-vertical-ergonomic-mouse':{
    model:'Logitech Lift Vertical Ergonomic Mouse family',
    source:'https://www.logitech.com/en-au/products/mice/lift-vertical-ergonomic-mouse-business.html',
    summary:'A small-to-medium-hand ergonomic mouse with a 57° vertical posture, quiet productivity controls and multi-device Bluetooth/Logi Bolt connectivity.',
    highlights:['57° vertical ergonomic angle designed for small-to-medium hands','Bluetooth Low Energy and Logi Bolt with switching across up to three devices','One AA battery with manufacturer-stated life up to 24 months'],
    watch:'The vertical shape is deliberately specialised and will not suit every grip or hand size. Right- and left-handed variants exist, so the exact local variant matters.',
    specs:[['Form','57° vertical ergonomic'],['Hand fit','Small-to-medium hands'],['Handedness','Right- and left-handed variants available'],['Connectivity','Bluetooth LE + Logi Bolt'],['Devices','Up to 3'],['Scroll','SmartWheel'],['Battery','1 × AA'],['Battery claim','Up to 24 months'],['Wireless range','Up to 10 m stated'],['Dimensions','Approx. 71 × 70 × 108 mm'],['Weight','Approx. 125 g'],['Software','Logi Options+']],
    decisionAttributes:{ergonomic:true,verticalAngleDeg:57,wireless:true,bluetooth:true,bolt:true,multiDevice:3,batteryMonths:24,weightG:125,gaming:false,leftHandVariant:true}
  },
  'razer-basilisk-v3':{
    model:'RZ01-04000100-R3M1 / Basilisk V3',
    source:'https://www.razer.com/au-en/gaming-mice/razer-basilisk-v3/RZ01-04000100-R3M1',
    summary:'A wired right-handed gaming mouse for buyers who value many programmable controls, a tilt/free-spin scroll wheel and onboard profiles more than wireless freedom.',
    highlights:['26,000 DPI optical sensor with 650 IPS / 50 G manufacturer-rated tracking','11 programmable buttons with five onboard profiles','Four-way HyperScroll tilt wheel and wired low-latency connection'],
    watch:'At roughly 101 g it is heavier than many current lightweight competitive mice. It is wired-only, which is a preference rather than a universal gaming advantage.',
    specs:[['Model','RZ01-04000100-R3M1'],['Handedness','Right-handed'],['Connectivity','Wired'],['Sensor','Optical'],['Max DPI','26,000'],['Max speed','650 IPS'],['Max acceleration','50 G'],['Programmable buttons','11'],['Switch','Razer Optical Mouse Switch Gen-2'],['Switch durability','70 million clicks stated'],['Onboard profiles','5'],['Wheel','4-way HyperScroll tilt'],['Dimensions','Approx. 130 × 75 × 42.5 mm'],['Weight','Approx. 101 g']],
    decisionAttributes:{gaming:true,wired:true,wireless:false,rightHanded:true,dpiMax:26000,ipsMax:650,accelerationG:50,buttons:11,onboardProfiles:5,tiltWheel:true,weightG:101}
  },
  'razer-cobra-pro':{
    model:'Razer Cobra Pro / RZ01-0466 family',
    source:'https://www.razer.com/au-en/gaming-mice/razer-cobra-pro',
    evidenceSources:['https://mysupport.razer.com/app/answers/detail/a_id/13096'],
    summary:'A lighter wireless gaming mouse offering HyperSpeed, Bluetooth and wired USB-C modes, strong onboard storage and optional 8000 Hz wireless polling hardware.',
    highlights:['Focus Pro 30K optical sensor with 750 IPS / 70 G manufacturer-rated tracking','HyperSpeed, Bluetooth and wired USB-C connectivity at about 77 g','Up to 100 h HyperSpeed at 1000 Hz or 170 h Bluetooth; optional hardware enables up to 8000 Hz wireless polling'],
    watch:'The 8000 Hz mode requires compatible optional HyperPolling hardware and cuts battery life materially. Wireless charging also requires optional accessories.',
    specs:[['Model family','RZ01-0466 / Cobra Pro'],['Shape','Right-handed symmetrical'],['Connectivity','HyperSpeed / Bluetooth / wired USB-C'],['Sensor','Focus Pro 30K'],['Max DPI','30,000'],['Max speed','750 IPS'],['Max acceleration','70 G'],['Programmable buttons','8 physical programmable buttons in support specification'],['Switch','Optical Mouse Switch Gen-3'],['Switch durability','90 million clicks stated'],['Onboard profiles','5'],['Standard polling','1000 Hz'],['Optional polling','Up to 8000 Hz with compatible accessory'],['Battery HyperSpeed','Up to 100 h at 1000 Hz stated'],['Battery Bluetooth','Up to 170 h stated'],['Weight','Approx. 77 g']],
    decisionAttributes:{gaming:true,wired:true,wireless:true,bluetooth:true,hyperspeed:true,dpiMax:30000,ipsMax:750,accelerationG:70,buttons:8,onboardProfiles:5,pollingHz:1000,optionalPollingHz:8000,batteryHours:100,bluetoothBatteryHours:170,weightG:77}
  },
  'logitech-mx-master-4':{
    model:'MX Master 4 family / business P/N 910-007619',
    source:'https://www.logitech.com/en-au/products/mice/mx-master-4-business.html',
    summary:'A premium productivity mouse focused on multi-device workflows, high-resolution Darkfield tracking, MagSpeed scrolling and haptic feedback rather than low-weight gaming use.',
    highlights:['Darkfield sensor adjustable from 200–8000 DPI','Bluetooth and Logi Bolt with multi-device workflow plus MagSpeed and thumb-wheel scrolling','650 mAh rechargeable battery with manufacturer-stated life up to 70 days and quick charging'],
    watch:'At about 150 g it is much heavier than gaming mice. The business page exposes a business part number, while APG treats the maintained consumer name as the shared hardware family rather than claiming that exact SKU for every retail package.',
    specs:[['Product family','MX Master 4'],['Business part number','910-007619'],['Sensor','Darkfield'],['DPI','200–8000 in 50 DPI increments'],['Buttons','8'],['Feedback','Haptic feedback'],['Scroll','MagSpeed vertical + horizontal thumb wheel'],['Connectivity','Bluetooth LE + Logi Bolt'],['Battery','650 mAh Li-Po rechargeable'],['Battery claim','Up to 70 days'],['Quick charge','1 minute for up to 3 hours stated'],['Wireless range','Up to 10 m'],['Dimensions','Approx. 128.2 × 88.4 × 50.8 mm'],['Weight','Approx. 150 g'],['Devices','Up to 3 in MX workflow']],
    decisionAttributes:{productivity:true,gaming:false,wireless:true,bluetooth:true,bolt:true,multiDevice:3,dpiMax:8000,buttons:8,haptic:true,rechargeable:true,batteryDays:70,weightG:150}
  }
};

const unresolvedEntityCorrections=[{
  slug:'keychron-k2-pro',
  reason:'Keychron Australia still exposes K2 Pro support/accessory documentation, but current Australian K Series and K Pro Series product collections no longer establish the K2 Pro as a current-sale keyboard. Treat as lifecycle/superseded until APG replaces the entity or explicitly classifies it as historical.'
}];

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model-or-explicit-model-family',confidence:'high',label:label||k};}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,evidenceSources:row.evidenceSources||[],sourceType:'Official primary manufacturer product/specification evidence · independently reverified 20 Aug 2026',summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass9'});
  p.factEvidence={};
  addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,'Maintained APG product identity');
  addFact(p,'exactModel',row.model,'Exact model / explicit manufacturer family');
  addFact(p,'canonicalCategory',p.categoryLabel||p.category,'Canonical APG category');
  for(const spec of row.specs)addFact(p,`spec_${key(spec[0])}`,spec[1],spec[0]);
  row.highlights.forEach((value,i)=>addFact(p,`verifiedClaim${i+1}`,value,`Verified manufacturer claim ${i+1}`));
  p.evidenceClaims=row.highlights.map((value,i)=>({key:`verifiedClaim${i+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-primary'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set(),touched=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){if(!p||seen.has(p.slug))continue;seen.add(p.slug);if(records[p.slug]){applyOne(p,records[p.slug]);touched.push(p.slug);}}
  return{version:VERSION,verifiedAt:VERIFIED,newPrimaryResearch:touched.length,touched,missing:Object.keys(records).filter(slug=>!touched.includes(slug)),unresolvedEntityCorrections};
}
module.exports={VERSION,VERIFIED,NEXT_REVIEW,records,unresolvedEntityCorrections,apply};
