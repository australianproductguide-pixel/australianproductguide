const slugify=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SEARCH=(brand,name)=>`https://www.amazon.com.au/s?k=${encodeURIComponent(`${brand} ${name}`)}`;
const TODAY='2026-08-16';
const roleText={value:'Value-oriented',balanced:'Mainstream all-rounder',premium:'Higher-tier',specialist:'Specialist/use-case',compact:'Space/portability-oriented'};
const human=x=>String(x||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
function product(category,label,i,row){
  const [brand,name,role,signals=[],asin=null]=row,slug=slugify(`${brand}-${name}`),tags=[role,...signals];
  return {
    id:`V3-${category.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,'0')}`,slug,brand,name,price:null,
    summary:`${brand} ${name} is a verified Australian-market discovery record in APG's ${label.toLowerCase()} starter set. It is positioned as a ${roleText[role].toLowerCase()} option for structured comparison, not as a universal winner.`,
    highlights:[`${roleText[role]} starting point`,...signals.slice(0,2).map(human)],
    watch:'Starter evidence depth: confirm the exact Australian variant, current specifications, price and retailer availability before purchase.',
    source:SEARCH(brand,name),sourceType:'Amazon Australia discovery / listing verification',
    tags,evidenceTier:'starter',starterRole:role,firstResearched:TODAY,lastSubstantiveReview:null,sourceVerified:TODAY,priceChecked:null,imageChecked:TODAY,
    amazon:asin?{asin,url:`https://www.amazon.com.au/dp/${asin}`,verified:TODAY,variant:name,confidence:'high'}:null
  };
}
function category(slug,label,icon,aliases,factors,priorities,rows){
  const products=rows.map((r,i)=>product(slug,label,i,r));
  return {slug,label,title:`${label} Australia`,icon,aliases,description:`Compare a curated Australian starter set of ${label.toLowerCase()} by ${factors.slice(0,3).join(', ').toLowerCase()} and the trade-offs that matter to your use case.`,products,priorities,factors,evidenceTier:'starter',comparisonLimit:2,faqs:[
    [`What should I compare first when choosing ${label.toLowerCase()}?`,`Start with ${factors[0].toLowerCase()} and ${factors[1].toLowerCase()}, then use price and secondary features to break close ties.`],
    ['Should I choose on price alone?','No. APG treats price as a constraint, not a substitute for fit. Check the exact variant and current Australian offer before buying.'],
    ['How mature is this APG category?','This is a maintained starter category. Product identity and retailer pathways are maintained, while deeper specification evidence and category-specific decision attributes continue to expand.']
  ]};
}

const categories={};
function add(...args){const c=category(...args);categories[c.slug]=c;}

add('home-security-cameras','Home security cameras','security',['security camera','home camera','outdoor camera','cctv'],['Wired versus battery power','Indoor, outdoor and weather exposure','Local storage versus subscription services','Detection, privacy and smart-home compatibility'],['battery','outdoor','local-storage','subscription','value'],[
['TP-Link','Tapo C500','value',['outdoor','pan-tilt'], 'B0BQJVKVQR'],['TP-Link','Tapo C410','compact',['battery','outdoor'],'B0D3814FFN'],['TP-Link','Tapo TC82 KIT','balanced',['battery','solar'],'B0D7H7S355'],['Reolink','Argus 3 Ultra','specialist',['battery','local-storage'],'B0C53F5PY3'],['eufy','eufyCam 2C Pro 3-Cam Kit','premium',['multi-camera','local-storage'],'B08PP6DZCW']]);

add('stick-vacuums','Stick vacuums','cleaning',['stick vacuum','cordless vacuum','handstick vacuum'],['Floor mix and carpet load','Pet hair and brush design','Weight, stairs and storage','Battery, bin and maintenance'],['pets','lightweight','hard-floors','carpet','premium'],[
['Dyson','V8','value',['lightweight','mixed-floors'],'B0B4N9ZR2Q'],['Dyson','V11 Advanced','balanced',['carpet','battery'],'B0D7MQP6L6'],['Shark','Stratos IZ400ANZ','specialist',['pets','mixed-floors'],'B0B42KZTH2'],['Dyson','Gen5detect Absolute','premium',['hard-floors','filtration'],'B0BWM9XK82'],['Dyson','V15s Detect Submarine','compact',['wet-cleaning','hard-floors'],'B0D7MLR1ZG']]);

add('mesh-wifi-systems','Mesh Wi-Fi systems','network',['mesh wifi','mesh wi-fi','whole home wifi','whole-home wi-fi'],['Home size and node placement','Wi-Fi generation and device load','Ethernet backhaul and wired ports','Setup, parental controls and subscriptions'],['wifi-6','wifi-7','large-home','ethernet','value'],[
['Amazon','eero 6+','value',['wifi-6','easy-setup']],['TP-Link','Deco X50','balanced',['wifi-6','ethernet']],['Amazon','eero Pro 6E','specialist',['wifi-6e','large-home']],['TP-Link','Deco BE65','premium',['wifi-7','multi-gig']],['Amazon','eero Max 7','compact',['wifi-7','multi-gig'],'B0CPKX85TD']]);

add('earbuds','Earbuds','audio',['earbuds','ear buds','true wireless','tws'],['Noise cancellation and transparency','Fit, comfort and exercise use','Battery and charging case','Phone ecosystem and multipoint'],['anc','battery','exercise','apple','value'],[
['JBL','Wave Buds','value',['battery','compact'],'B0BHDMHHM9'],['Bose','QuietComfort Earbuds','balanced',['anc','comfort'],'B0D8BZDPXB'],['Samsung','Galaxy Buds2','compact',['android','anc'],'B09BL3X87B'],['Sony','WF-1000XM5','premium',['anc','multipoint'],'B0C345M3T7'],['Apple','AirPods 4 with Active Noise Cancellation','specialist',['apple','anc'],'B0DGJ8YC5N']]);

add('dash-cameras','Dash cameras','travel',['dash cam','dashcam','car camera'],['Front-only versus multi-channel coverage','Resolution and night capture','Parking surveillance requirements','Storage, GPS and app connectivity'],['front-rear','parking','night','compact','value'],[
['KAWA','Mini 3','compact',['front-only','value'],'B0D47HHJWF'],['70mai','Dash Cam 4K Omni','balanced',['parking','night'],'B0DYJWV1TL'],['Vantrue','N4 Pro','premium',['front-rear','night'],'B0C58NWF29'],['VIOFO','A229 Pro','specialist',['front-rear','parking']],['Garmin','Dash Cam Mini 3','value',['compact','front-only']]]);

add('luggage','Luggage','travel',['luggage','suitcase','carry on','carry-on'],['Cabin versus checked size','Hard-shell versus soft-shell construction','Weight and wheel design','Warranty, expansion and internal organisation'],['carry-on','lightweight','hard-shell','premium','value'],[
['Amazon Basics','Hardside Expandable Spinner 55cm','value',['carry-on','hard-shell']],['American Tourister','Light Max Spinner 55cm','compact',['carry-on','lightweight']],['American Tourister','Airconic Spinner 55cm','balanced',['hard-shell','lightweight']],['American Tourister','Curio 2 Spinner 55cm','specialist',['carry-on','expandable']],['Samsonite','C-Lite Spinner 55cm','premium',['carry-on','lightweight']]]);

add('portable-power-stations','Portable power stations','power',['portable power station','battery generator','solar generator'],['Usable battery capacity','Continuous and surge output','Recharge speed and solar input','Port mix, weight and expansion'],['compact','high-output','solar','fast-charge','value'],[
['BLUETTI','AC2A','value',['compact','solar']],['EcoFlow','RIVER 3','compact',['fast-charge','portable']],['Anker','SOLIX C300','balanced',['compact','usb-c']],['EcoFlow','RIVER 2 Max','specialist',['solar','fast-charge']],['EcoFlow','DELTA 2','premium',['high-output','expandable']]]);

add('computer-monitors','Computer monitors','display',['computer monitor','monitor','office monitor','4k monitor'],['Screen size and resolution','Colour, brightness and panel type','USB-C, docking and connectivity','Refresh rate and ergonomic adjustment'],['4k','usb-c','office','gaming','value'],[
['Dell','S2721D','value',['office','qhd'],'B08FRJ1QCN'],['LG','27GS85Q-B','balanced',['qhd','gaming'],'B0CX43BT9F'],['LG','27UP850K-W','specialist',['4k','usb-c']],['Dell','S2725QS','compact',['4k','office']],['Samsung','ViewFinity S70D 27-inch','premium',['4k','productivity']]]);

add('office-chairs','Office chairs','office',['office chair','desk chair','ergonomic chair'],['Seat and lumbar adjustability','Body-size fit and seat depth','Arm, headrest and recline controls','Materials, warranty and assembly'],['ergonomic','lumbar','mesh','premium','value'],[
['Artiss','Ergonomic Office Chair','value',['mesh','lumbar'],'B09Q5TH532'],['SIHOO','M18 Ergonomic Office Chair','balanced',['mesh','lumbar'],'B07GNDDNMW'],['SIHOO','M57 Ergonomic Office Chair','compact',['mesh','adjustable']],['Hbada','E3 Ergonomic Office Chair','specialist',['headrest','adjustable']],['SIHOO','Doro C300 Ergonomic Office Chair','premium',['dynamic-lumbar','mesh']]]);

add('automatic-pet-feeders','Automatic pet feeders','pet',['automatic pet feeder','cat feeder','dog feeder','smart pet feeder'],['Food type and hopper capacity','Portion and schedule control','App connectivity and offline operation','Cleaning, backup power and pet-proofing'],['smart','offline','large-capacity','compact','value'],[
['WOPET','Automatic Pet Feeder','value',['scheduled','compact']],['Xiaomi','Smart Pet Food Feeder','balanced',['smart','scheduled']],['PETLIBRO','Granary Smart Feeder','specialist',['smart','portion-control']],['Catit','PIXI Smart Feeder','compact',['smart','cat']],['PetSafe','Smart Feed 2.0','premium',['smart','large-capacity']]]);

add('standing-desks','Standing desks','office',['standing desk','sit stand desk','sit-stand desk','electric desk'],['Desktop size and room footprint','Height range and stability','Single versus dual motor','Memory controls, cable management and load'],['compact','dual-motor','memory','large-desk','value'],[
['Artiss','120 x 60cm Electric Standing Desk','value',['compact','electric'],'B09PV4DT7L'],['FlexiSpot','EC1 Electric Standing Desk','balanced',['electric','memory']],['Ergomaker','Electric Standing Desk','compact',['electric','compact']],['Artiss','Dual Motor Electric Standing Desk','specialist',['dual-motor','large-desk']],['FlexiSpot','E7 Pro Standing Desk','premium',['dual-motor','memory'],'B0DKT8JHSP']]);

add('mechanical-keyboards','Mechanical keyboards','office',['mechanical keyboard','gaming keyboard','keyboard'],['Layout and desk footprint','Switch feel and noise','Wired, Bluetooth and receiver connectivity','Gaming features, programmability and keycaps'],['wireless','compact','gaming','quiet','value'],[
['Logitech','Signature K855','value',['wireless','compact'],'B0BN6WJ1QZ'],['Keychron','K2 Pro','balanced',['wireless','compact']],['Logitech','MX Mechanical','specialist',['wireless','productivity']],['Razer','BlackWidow V4 75%','compact',['gaming','compact']],['Corsair','K70 RGB Pro','premium',['gaming','wired']]]);

add('home-fitness-equipment','Home fitness equipment','fitness',['home gym','fitness equipment','treadmill','dumbbells','rowing machine'],['Training goal and movement type','Available floor and storage space','User weight and adjustment range','Noise, subscriptions and ongoing motivation'],['compact','cardio','strength','premium','value'],[
['Everfit','Walking Pad Treadmill','value',['cardio','compact'],'B0CT582139'],['Bowflex','SelectTech 552 Adjustable Dumbbells','balanced',['strength','compact']],['Everfit','Electric Treadmill','compact',['cardio','folding']],['Schwinn','IC4 Indoor Cycling Bike','specialist',['cardio','indoor-bike']],['Concept2','RowErg','premium',['cardio','rowing']]]);

add('computer-mice','Computer mice','office',['computer mouse','wireless mouse','gaming mouse'],['Hand size, grip and ergonomics','Office versus gaming responsiveness','Bluetooth, receiver and wired connectivity','Buttons, scrolling and multi-device use'],['wireless','ergonomic','gaming','multi-device','value'],[
['Logitech','G305 LIGHTSPEED','value',['wireless','gaming']],['Razer','Basilisk V3','balanced',['gaming','wired']],['Logitech','Lift Vertical Ergonomic Mouse','compact',['wireless','ergonomic']],['Razer','DeathAdder V3','specialist',['gaming','lightweight']],['Logitech','MX Master 3S','premium',['wireless','multi-device']]]);

add('dehumidifiers','Dehumidifiers','air',['dehumidifier','moisture remover'],['Room size and extraction capacity','Climate and operating temperature','Tank drainage and continuous drain','Noise, laundry modes and power use'],['compact','laundry','large-room','quiet','value'],[
['Breville','the Re-Fresha Mini Dehumidifier LAD208','compact',['small-room','value']],['Ionmax','ION610 Desiccant Dehumidifier','balanced',['cool-climate','laundry']],['DeLonghi','Tasciugo AriaDry DEXD214F','specialist',['laundry','quiet'],'B093BWL9NZ'],['Ionmax','ION632 Compressor Dehumidifier','value',['large-room','continuous-drain']],['Ausclimate','NWT Supreme All Seasons 50L Dehumidifier','premium',['large-room','laundry']]]);

add('air-purifiers','Air purifiers','air',['air purifier','hepa purifier'],['Room size and clean-air delivery','Filter type and replacement cost','Noise and sleep use','Sensors, automation and app features'],['hepa','large-room','quiet','compact','value'],[
['Breville','the AirRounder Connect LAP308','value',['compact','hepa']],['Philips','PureProtect Mini 900 AC0950/10','compact',['hepa','small-room'],'B0D9YNY3DN'],['Winix','Zero','balanced',['hepa','medium-room'],'B07PNJQMK6'],['Winix','Zero+ 360','specialist',['hepa','large-room'],'B0CH9VV895'],['Winix','Zero+ Pro AUS-1250AZPU','premium',['hepa','large-room'],'B07PPPK6KD']]);

add('cordless-drills','Cordless drills','tools',['cordless drill','drill driver','hammer drill'],['Drill-driver versus hammer-drill use','Battery platform and included batteries','Chuck, torque and speed range','Weight, ergonomics and job frequency'],['compact','hammer','trade','battery-platform','value'],[
['Ryobi','ONE+ HP 18V Drill Driver','value',['battery-platform','diy']],['Makita','DHP485 18V Brushless Hammer Driver Drill','balanced',['hammer','battery-platform']],['Bosch Professional','GSB 18V-55','compact',['hammer','trade']],['DeWalt','DCD796 18V XR Brushless Combi Drill','specialist',['hammer','trade']],['Milwaukee','M18 FPD3 Fuel Percussion Drill','premium',['hammer','trade']]]);

add('pressure-washers','Pressure washers','tools',['pressure washer','high pressure cleaner'],['Cleaning task and required pressure','Flow rate and hose reach','Nozzle, detergent and patio accessories','Storage, weight and service network'],['compact','car','patio','high-power','value'],[
['Gerni','3600 High Pressure Washer','value',['car','compact']],['Karcher','K4 Power Control','balanced',['patio','car']],['Bosch','AdvancedAquatak 150','specialist',['high-power','patio'],'B0BG1LNXSQ'],['Gerni','5000 High Pressure Washer','compact',['patio','storage']],['Karcher','K5 Premium Smart Control','premium',['high-power','smart']]]);

add('smart-doorbells','Smart doorbells','security',['video doorbell','smart doorbell','doorbell camera'],['Battery versus wired installation','Field of view and package visibility','Local versus cloud recording','Subscription cost and smart-home integration'],['battery','wired','local-storage','package','value'],[
['Ring','Battery Video Doorbell','value',['battery','cloud']],['TP-Link','Tapo D235 Video Doorbell','balanced',['battery','local-storage']],['eufy','Video Doorbell E340','specialist',['dual-camera','local-storage']],['Google','Nest Doorbell (Battery)','compact',['battery','google-home']],['Ring','Battery Video Doorbell Plus','premium',['battery','package']]]);

add('baby-monitors','Baby monitors','baby',['baby monitor','baby camera','nursery monitor'],['Dedicated parent unit versus app use','Video quality and night visibility','Connection range and internet dependence','Sleep analytics, alerts and privacy'],['offline','app','multi-camera','analytics','value'],[
['VTech','VM3250 Video Baby Monitor','value',['offline','parent-unit'],'B0BX6GB6LL'],['eufy','SpaceView Pro E210','balanced',['offline','parent-unit'],'B08G8MBWZ8'],['Babysense','5.5-inch Full HD 2-Camera Baby Monitor','specialist',['multi-camera','offline'],'B0D2LF45YD'],['CuboAi','Smart Baby Monitor 3','compact',['app','analytics'],'B0D6GCYT5X'],['Nanit','Pro Smart Baby Monitor','premium',['app','analytics']]]);

add('smartwatches','Smartwatches','wearable',['smartwatch','smart watch','gps watch'],['Phone ecosystem and compatibility','Fitness, health and GPS requirements','Battery life and charging','Size, durability and cellular options'],['apple','android','gps','battery','value'],[
['Samsung','Galaxy Watch7','value',['android','health']],['Apple','Watch Series 10','balanced',['apple','health']],['Garmin','vivoactive 6','compact',['gps','battery']],['Garmin','Forerunner 265','specialist',['gps','running'],'B0BS1T9J4Y'],['Garmin','Forerunner 965','premium',['gps','running'],'B0C1P49WKF']]);

add('fitness-trackers','Fitness trackers','wearable',['fitness tracker','activity tracker','smart band'],['Core activity and sleep tracking','Screen size and wearable comfort','Battery life','Subscription requirements and ecosystem'],['battery','sleep','subscription-free','compact','value'],[
['Xiaomi','Smart Band 9','value',['battery','compact'],'B0D8WQ94W5'],['Samsung','Galaxy Fit3','balanced',['battery','android'],'B0CVN3NK42'],['Garmin','vivosmart 5','compact',['battery','fitness']],['Fitbit','Charge 6','specialist',['health','google']],['WHOOP','4.0','premium',['subscription','recovery'],'B0BWSF6H4Q']]);

add('bluetooth-speakers','Bluetooth speakers','audio',['bluetooth speaker','portable speaker','wireless speaker'],['Portable size versus room-filling output','Battery life','Water and dust resistance','Stereo pairing and ecosystem features'],['compact','waterproof','battery','large','value'],[
['JBL','Go Essential','value',['compact','waterproof'],'B09NCFVNK9'],['JBL','Flip 7','balanced',['waterproof','portable']],['Bose','SoundLink Flex (2nd Gen)','compact',['portable','waterproof']],['Marshall','Emberton III','specialist',['battery','portable']],['JBL','Charge 6','premium',['battery','large']]]);

add('soundbars','Soundbars','audio',['soundbar','tv soundbar','dolby atmos soundbar'],['TV size and room layout','Standalone bar versus subwoofer/rears','Dolby Atmos and surround requirements','HDMI eARC, music and ecosystem fit'],['compact','subwoofer','atmos','ecosystem','value'],[
['Samsung','HW-B400F Soundbar','value',['compact','tv']],['Sony','HT-G700 Soundbar','balanced',['subwoofer','atmos']],['Sonos','Beam (Gen 2)','compact',['atmos','ecosystem']],['Bose','Smart Soundbar','specialist',['atmos','ecosystem']],['Bose','Smart Ultra Soundbar','premium',['atmos','premium']]]);

add('projectors','Projectors','display',['projector','home projector','portable projector'],['Room brightness and throw distance','Resolution, contrast and screen size','Portable versus installed use','Streaming, speakers and gaming latency'],['portable','4k','bright-room','gaming','value'],[
['XGIMI','MoGo 2 Pro','value',['portable','streaming'],'B0CZ6VY99T'],['Anker','Nebula Capsule 3','compact',['portable','streaming']],['XGIMI','Halo+','balanced',['portable','1080p']],['BenQ','GV50','specialist',['portable','home-cinema']],['BenQ','AH700ST','premium',['bright-room','gaming']]]);

add('gaming-monitors','Gaming monitors','display',['gaming monitor','esports monitor','oled gaming monitor'],['Resolution and GPU load','Refresh rate and response requirements','OLED versus LCD trade-offs','Adaptive sync, ports and console support'],['qhd','oled','high-refresh','console','value'],[
['Alienware','AW2725DM','value',['qhd','high-refresh'],'B0F2KBZ7WQ'],['ASUS','TUF Gaming VG27AQL3A','balanced',['qhd','high-refresh']],['Samsung','Odyssey G6 G65B 27-inch','compact',['qhd','high-refresh']],['LG','27GS95QE-B','specialist',['oled','high-refresh']],['Alienware','AW3425DW','premium',['oled','ultrawide']]]);

add('gaming-headsets','Gaming headsets','audio',['gaming headset','pc headset','playstation headset','xbox headset'],['Platform compatibility','Wireless latency and battery','Microphone quality','Comfort, weight and spatial audio'],['wireless','multiplatform','microphone','lightweight','value'],[
['HyperX','Cloud III Wireless','value',['wireless','battery']],['SteelSeries','Arctis Nova 7 Wireless','balanced',['wireless','multiplatform']],['Razer','BlackShark V2 Pro','compact',['wireless','microphone']],['Audeze','Maxwell Wireless Gaming Headset','specialist',['wireless','planar']],['SteelSeries','Arctis Nova Pro Wireless','premium',['wireless','multiplatform']]]);

add('webcams','Webcams','creator',['webcam','4k webcam','video conference camera'],['Resolution and frame rate','Low-light and autofocus performance','Field of view and framing','Microphone, mounting and privacy shutter'],['4k','streaming','conference','compact','value'],[
['Logitech','C920s HD Pro Webcam','value',['conference','1080p']],['Logitech','Brio 4K Webcam','balanced',['4k','conference']],['Elgato','Facecam MK.2','compact',['streaming','1080p']],['Insta360','Link 2','specialist',['tracking','4k']],['Logitech','MX Brio 4K Webcam','premium',['4k','conference']]]);

add('microphones','Microphones','creator',['microphone','usb microphone','podcast microphone','streaming mic'],['USB versus XLR workflow','Dynamic versus condenser pickup','Room acoustics and background noise','Monitoring, gain control and mounting'],['usb','xlr','dynamic','streaming','value'],[
['Audio-Technica','ATR2100x-USB','value',['usb','dynamic']],['Rode','PodMic USB','balanced',['usb','xlr']],['Blue','Yeti USB Microphone','compact',['usb','streaming']],['Rode','NT-USB+','specialist',['usb','condenser']],['Shure','MV7+','premium',['usb','xlr']]]);

add('external-ssds','External SSDs','storage',['external ssd','portable ssd','usb c ssd'],['Capacity and sustained speed','USB interface and host compatibility','Ruggedness and portability','Encryption, warranty and workload'],['rugged','fast','compact','creator','value'],[
['Crucial','X9 Pro Portable SSD 1TB','value',['compact','creator'],'B0C9WKGXHD'],['Samsung','T7 Shield Portable SSD','balanced',['rugged','compact']],['SanDisk','Extreme Portable SSD','compact',['rugged','portable']],['Samsung','T9 Portable SSD','specialist',['fast','creator']],['Crucial','X10 Pro Portable SSD','premium',['fast','creator']]]);

add('power-banks','Power banks','power',['power bank','portable charger','battery bank'],['Battery capacity','USB-C input/output wattage','Laptop versus phone charging','Size, airline limits and display'],['compact','laptop','high-capacity','fast-charge','value'],[
['Anker','Nano Power Bank 10000mAh 30W','compact',['fast-charge','phone'],'B0C9CSG3B7'],['Anker','Power Bank 20000mAh 22.5W','value',['high-capacity','phone'],'B0CC1CS6J4'],['INIU','Power Bank 20000mAh 45W','balanced',['fast-charge','high-capacity'],'B0DCYRXNFN'],['UGREEN','Nexode Power Bank 12000mAh 100W','specialist',['laptop','fast-charge'],'B0CXJ1F1M7'],['Anker','737 Power Bank 24000mAh 140W','premium',['laptop','high-capacity'],'B09VPHVT2Z']]);

add('portable-monitors','Portable monitors','display',['portable monitor','travel monitor','usb c monitor'],['Screen size and travel weight','Resolution, refresh rate and colour','Single-cable USB-C compatibility','Kickstand, speakers and VESA support'],['compact','high-refresh','2.5k','usb-c','value'],[
['ARZOPA','A1M 17.3-inch Portable Monitor','value',['usb-c','portable']],['UPERFECT','17.3-inch 144Hz Portable Gaming Monitor','balanced',['high-refresh','usb-c'],'B0BPLT8BLD'],['ViewSonic','VG1655 Portable Monitor','compact',['usb-c','portable']],['ARZOPA','Z1RC 16-inch 2.5K Portable Monitor','specialist',['2.5k','usb-c']],['ASUS','ZenScreen MB16ACV','premium',['usb-c','portable']]]);

add('tablets','Tablets','display',['tablet','ipad','android tablet'],['Operating system and app ecosystem','Screen size and portability','Keyboard and stylus support','Storage, cellular and performance'],['apple','android','stylus','compact','value'],[
['Samsung','Galaxy Tab A9+','value',['android','large-screen'],'B0CJH97F1M'],['Lenovo','Tab M11','balanced',['android','stylus']],['Apple','iPad (A16, 2025) 128GB','compact',['apple','tablet'],'B0DZ83GRYX'],['Samsung','Galaxy Tab S10 FE','specialist',['android','stylus']],['Apple','iPad Air 11-inch (M3)','premium',['apple','performance']]]);

add('e-readers','E-readers','display',['e-reader','ereader','kindle','kobo'],['Screen size and front lighting','Water resistance','Store, library and file ecosystem','Colour, note-taking and storage'],['compact','waterproof','colour','notes','value'],[
['Amazon','Kindle (2024)','value',['compact','kindle'],'B0CP31QS6R'],['Amazon','Kindle Paperwhite 16GB','balanced',['waterproof','kindle'],'B09TMK7QFX'],['Kobo','Clara Colour','compact',['colour','kobo']],['Kobo','Libra Colour','specialist',['colour','notes']],['Amazon','Kindle Paperwhite Signature Edition','premium',['waterproof','wireless-charge'],'B0CFPHSTDD']]);

add('electric-toothbrushes','Electric toothbrushes','wellness',['electric toothbrush','sonic toothbrush','oral b toothbrush'],['Cleaning action and brush-head ecosystem','Pressure sensor and timer guidance','Travel and battery needs','App coaching and replacement-head cost'],['pressure-sensor','app','travel','sonic','value'],[
['Oral-B','Pro 2500X','value',['pressure-sensor','timer'],'B0D5LGDRWH'],['Philips Sonicare','3100 Series','balanced',['sonic','timer']],['Oclean','X Pro Elite','compact',['sonic','app'],'B095X23HDH'],['Philips Sonicare','7400 Series','specialist',['sonic','pressure-sensor']],['Oral-B','iO Series 6','premium',['app','pressure-sensor']]]);

add('hair-dryers','Hair dryers','wellness',['hair dryer','blow dryer'],['Hair type and heat sensitivity','Drying speed and airflow control','Attachments and styling needs','Weight, noise and storage'],['lightweight','curly','styling','heat-control','value'],[
['Panasonic','nanoe Hair Dryer EH-NA98','value',['heat-control','hair-care']],['GHD','Helios Professional Hair Dryer','balanced',['styling','airflow']],['Shark','SpeedStyle RapidGloss Finisher Hair Dryer','compact',['styling','lightweight']],['Parlux','Alyon Hair Dryer','specialist',['lightweight','professional']],['Dyson','Supersonic Nural Hair Dryer','premium',['heat-control','styling']]]);

add('electric-shavers','Electric shavers','wellness',['electric shaver','mens shaver','beard trimmer'],['Rotary versus foil shaving style','Wet and dry use','Skin sensitivity and closeness','Cleaning station, attachments and travel'],['wet-dry','sensitive','grooming','premium','value'],[
['Philips','Shaver 3000X X3021/00','value',['wet-dry','rotary'],'B0CQCHPY8S'],['Philips','5000X Series X5012/05','balanced',['wet-dry','rotary'],'B0CVQZB832'],['Philips','OneBlade Pro QP6530/15','compact',['grooming','travel'],'B09CB8W64F'],['Braun','Series 7 71-S4200cs','specialist',['foil','wet-dry']],['Braun','Series 9 Pro+ 9567cc','premium',['foil','cleaning-station']]]);

add('kitchen-mixers','Kitchen mixers','kitchen',['stand mixer','kitchen mixer','planetary mixer'],['Bowl size and batch volume','Bread dough versus general baking','Motor, gearing and stability','Attachments, bench space and storage'],['compact','bread','large-batch','attachments','value'],[
['Sunbeam','Mixmaster HeatSoft Planetary Stand Mixer MXM7000WH','value',['baking','heatsoft']],['KitchenAid','Artisan 4.8L Stand Mixer KSM195','balanced',['attachments','baking']],['Kenwood','Titanium Chef Baker XL KVL85','specialist',['large-batch','weighing']],['KitchenAid','Artisan Bowl-Lift Stand Mixer KSM70','premium',['large-batch','bread']],['Kenwood','kMix Stand Mixer KMX751','compact',['baking','compact']]]);

add('blenders','Blenders','kitchen',['blender','smoothie blender','personal blender'],['Personal versus full-size jug','Ice, frozen ingredients and nut processing','Cup and jug capacity','Cleaning, storage and accessories'],['personal','ice','large-jug','portable','value'],[
['Breville','Blend Active VBL246','value',['personal','smoothie'],'B0B2KPCBJZ'],['Ninja','QB3001 Personal Blender','compact',['personal','smoothie'],'B08HSFT6LB'],['NutriBullet','Portable Blender NBP003','specialist',['portable','personal'],'B0CPRBL4DW'],['NutriBullet','Ultra 1200 Blender','balanced',['personal','ice']],['Vitamix','Explorian E310','premium',['large-jug','ice']]]);

add('rice-cookers','Rice cookers','kitchen',['rice cooker','rice box'],['Household serving capacity','White, brown, sushi and specialty rice','Fuzzy-logic versus simple cook control','Steam, porridge, timer and keep-warm functions'],['compact','large-capacity','fuzzy-logic','multifunction','value'],[
['Breville','the Rice Box Pro BRC470','value',['large-capacity','steam']],['Breville','the Smart Rice Box LRC480','balanced',['fuzzy-logic','large-capacity']],['Panasonic','SR-DF181 Rice Cooker','compact',['fuzzy-logic','rice']],['Tiger','JAX-S10A Rice Cooker','specialist',['multifunction','fuzzy-logic']],['Zojirushi','NS-ZCC10 Rice Cooker','premium',['fuzzy-logic','rice']]]);

add('multicookers','Multicookers','kitchen',['multicooker','multi cooker','pressure cooker','instant pot'],['Pressure, slow-cook and sauté functions','Capacity and household size','Air-fry or steam-combi capability','Control simplicity, lid design and storage'],['pressure','air-fry','large-capacity','smart','value'],[
['Instant Pot','Duo 7-in-1 5.7L','value',['pressure','slow-cook'],'B00OP26T4K'],['Philips','All-in-One Cooker HD2237/72','balanced',['pressure','slow-cook']],['Breville','the Fast Slow GO BPR680','compact',['pressure','slow-cook']],['Instant Pot','Pro Plus WiFi','specialist',['pressure','smart']],['Ninja','Foodi MAX 15-in-1 SmartLid','premium',['pressure','air-fry']]]);

add('vacuum-sealers','Vacuum sealers','kitchen',['vacuum sealer','food sealer','sous vide sealer'],['Occasional versus batch sealing','Dry, moist and pulse controls','Built-in roll storage and cutter','Accessory port, bag cost and storage'],['compact','moist','roll-storage','sous-vide','value'],[
['Bonsenkitchen','Vacuum Sealer Machine','value',['compact','dry-moist']],['INKBIRD','INK-VS01 Vacuum Sealer','balanced',['moist','sous-vide']],['FoodSaver','VS3198 Controlled Multi Seal','specialist',['roll-storage','moist'],'B0BWZ3GB8V'],['Anova Culinary','Precision Vacuum Sealer Pro','compact',['sous-vide','moist']],['FoodSaver','VS7850 Food Preservation System','premium',['roll-storage','accessory-port']]]);

add('water-filters','Water filters','kitchen',['water filter','water filter jug','reverse osmosis'],['Contaminant reduction claim and certification','Jug, dispenser or reverse-osmosis format','Filter replacement cost and lifespan','Bench or fridge space and output volume'],['jug','reverse-osmosis','large-capacity','compact','value'],[
['BRITA','Marella XL Water Filter Jug','value',['jug','compact']],['BRITA','Style XL Water Filter Jug','balanced',['jug','filter-indicator']],['ZeroWater','12 Cup Ready-Pour Water Filter Jug','compact',['jug','dissolved-solids']],['BRITA','Flow Water Filter Tank 8.2L','specialist',['large-capacity','dispenser']],['Philips','Reverse Osmosis Water Purification Station ADD6901HBK01/79','premium',['reverse-osmosis','benchtop'],'B0DHFR9F86']]);

add('portable-air-conditioners','Portable air conditioners','air',['portable air conditioner','portable ac','pinguino'],['Room volume and cooling capacity','Single-hose installation and window sealing','Noise for bedroom use','Dehumidification, Wi-Fi and storage'],['compact','quiet','wifi','large-room','value'],[
['DeLonghi','Pinguino PAC EM82K','value',['compact','cooling']],['Dimplex','DCP26FS Portable Air Conditioner','balanced',['cooling','medium-room']],['Rinnai','RPC26MCWF Portable Air Conditioner','compact',['wifi','cooling']],['Olimpia Splendid','Dolceclima Compact','specialist',['compact','cooling']],['DeLonghi','Pinguino PAC EL112 CST WIFI','premium',['wifi','large-room'],'B0CDM9XH11']]);

module.exports={categories,TODAY};
