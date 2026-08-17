const slugify=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const CHECKED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const roleText={value:'Value starting point',balanced:'Balanced starting point',premium:'Higher-tier starting point',specialist:'Specialist starting point',compact:'Space-conscious starting point'};
const human=x=>String(x||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const amazonDiscovery=(brand,name)=>`https://www.amazon.com.au/s?k=${encodeURIComponent(`${brand} ${name}`)}`;
function makeProduct(category,label,index,row){
  const [brand,name,role,signals]=row,slug=slugify(`${brand}-${name}`);
  return {
    id:`APG-SEARCH-${category.toUpperCase().replace(/[^A-Z0-9]+/g,'-')}-${String(index+1).padStart(3,'0')}`,
    slug,brand,name,price:null,
    summary:`${brand} ${name} is a maintained starter-evidence product in APG's ${label.toLowerCase()} catalogue. It is included as a ${roleText[role].toLowerCase()} for Australian product discovery and comparison, not as a universal winner.`,
    highlights:[roleText[role],...signals.slice(0,2).map(human)],
    watch:'Starter evidence depth: verify the exact Australian variant, current specifications, price, seller, warranty and retailer availability before purchase.',
    source:amazonDiscovery(brand,name),
    sourceType:'Amazon Australia model discovery; exact listing and deeper manufacturer/specification evidence pending unless separately verified',
    tags:[role,...signals],evidenceTier:'starter',starterRole:role,
    testingStatus:'Starter evidence / desk-researched product identity',publicationStatus:'LIVE / MAINTAINED',
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

add('coffee-grinders','Coffee grinders','coffee',['coffee grinder','burr grinder','espresso grinder','coffee bean grinder'],['Burr type and grind consistency','Espresso versus filter grind range','Dosing workflow and retention','Noise, size and cleaning'],['espresso','filter','low-retention','compact','value'],[
  ["De'Longhi",'KG200 Electric Coffee Grinder','value',['compact','blade']],
  ['Breville','the Smart Grinder Pro BCG820','balanced',['espresso','dosing']],
  ['Baratza','Encore ESP','specialist',['espresso','filter']],
  ['Fellow','Opus Conical Burr Grinder','premium',['low-retention','filter']],
  ['Sunbeam','GrindFresh Coffee Grinder','compact',['compact','home-coffee']]
]);

add('microwave-ovens','Microwave ovens','guide',['microwave','microwave oven','flatbed microwave','inverter microwave'],['Internal capacity and external dimensions','Flatbed versus turntable layout','Power and inverter control','Grill, convection and sensor features'],['compact','family','flatbed','inverter','value'],[
  ['Panasonic','NN-ST34NB 25L Microwave','value',['compact','turntable']],
  ['Panasonic','NN-SF564W Flatbed Microwave','balanced',['flatbed','inverter']],
  ['LG','NeoChef MS4296OSS Microwave','premium',['inverter','family']],
  ['Russell Hobbs','30L Microwave','specialist',['family','large-capacity']],
  ['Sharp','R350E Microwave','compact',['compact','simple']]
]);

add('bread-makers','Bread makers','guide',['bread maker','bread machine','automatic bread maker','sourdough bread maker'],['Loaf size and household needs','Bread, dough and specialty programs','Automatic ingredient dispensing','Timer, cleaning and bench footprint'],['sourdough','gluten-free','automatic-dispenser','compact','value'],[
  ['Panasonic','SD-YR2550 Bread Maker','premium',['automatic-dispenser','sourdough']],
  ['Panasonic','SD-R2530 Bread Maker','balanced',['automatic-dispenser','gluten-free']],
  ['Breville','the Custom Loaf BBM800','specialist',['custom-programs','large-loaf']],
  ['Sunbeam','Bakehouse Bread Maker','value',['family','simple']],
  ['Russell Hobbs','Classics Breadmaker','compact',['compact','value']]
]);

add('juicers','Juicers','guide',['juicer','slow juicer','cold press juicer','centrifugal juicer'],['Slow-press versus centrifugal workflow','Feed chute and preparation effort','Juice yield and pulp handling','Cleaning effort and machine footprint'],['slow-juicer','fast','easy-clean','whole-fruit','value'],[
  ['Breville','the Juice Fountain Cold BJE430','balanced',['fast','whole-fruit']],
  ['Breville','the Juice Fountain Compact BJE200','compact',['fast','compact']],
  ['Kuvings','EVO820 Whole Slow Juicer','premium',['slow-juicer','whole-fruit']],
  ['Hurom','H310A Slow Juicer','specialist',['slow-juicer','compact']],
  ['Nutribullet','Juicer','value',['fast','easy-clean']]
]);

add('smart-light-bulbs','Smart light bulbs','guide',['smart light bulb','smart bulb','matter bulb','colour smart bulb'],['Smart-home platform and protocol','Brightness and white-temperature range','Colour capability and scenes','Hub requirements and automation'],['matter','hue','apple-home','colour','value'],[
  ['Philips Hue','White and Colour Ambiance A60 E27','premium',['hue','colour']],
  ['TP-Link','Tapo L530E Smart Wi-Fi Light Bulb','value',['colour','wifi']],
  ['TP-Link','Tapo L535E Matter Smart Bulb','balanced',['matter','colour']],
  ['Nanoleaf','Essentials Matter Smart Bulb A60 E27','specialist',['matter','apple-home']],
  ['LIFX','Colour A60 E27 Smart Bulb','premium',['colour','wifi']]
]);

add('smart-displays','Smart displays','display',['smart display','echo show','nest hub','alexa display','google smart display'],['Voice-assistant and smart-home ecosystem','Screen size and placement','Camera and video-call requirements','Privacy controls, speakers and home controls'],['alexa','google-home','video-calls','smart-home','compact'],[
  ['Amazon','Echo Show 5 (3rd Gen)','compact',['alexa','compact']],
  ['Amazon','Echo Show 8 (3rd Gen)','balanced',['alexa','video-calls']],
  ['Amazon','Echo Show 15','premium',['alexa','large-screen']],
  ['Google','Nest Hub (2nd Gen)','value',['google-home','compact']],
  ['Google','Nest Hub Max','specialist',['google-home','video-calls']]
]);

add('usb-c-hubs-docks','USB-C hubs and docks','display',['usb c hub','usb-c hub','usb c dock','docking station','laptop dock'],['Host-device and operating-system compatibility','Display outputs and resolution requirements','USB-C power delivery and charging','Ethernet, card-reader and data-port needs'],['4k','ethernet','100w','multi-monitor','value'],[
  ['UGREEN','Revodok 107 USB-C Hub','balanced',['4k','ethernet','100w']],
  ['UGREEN','Revodok 1071 USB-C Hub','value',['4k','100w']],
  ['UGREEN','Revodok Pro 106 USB-C Hub','specialist',['4k','ethernet']],
  ['Anker','10-in-1 USB-C Hub','premium',['multi-port','ethernet']],
  ['Anker','547 USB-C Hub (7-in-2)','compact',['multi-port','compact']]
]);

add('home-printers','Home printers','guide',['home printer','inkjet printer','tank printer','wireless printer','all in one printer'],['Ink or toner running cost','Print, scan and copy requirements','Automatic duplex and paper handling','Wi-Fi, mobile printing and footprint'],['tank-ink','home-office','photo','duplex','value'],[
  ['Epson','EcoTank ET-1810','value',['tank-ink','compact']],
  ['Epson','EcoTank ET-2850','balanced',['tank-ink','duplex']],
  ['Canon','PIXMA G3670 MegaTank','specialist',['tank-ink','home-office']],
  ['Canon','PIXMA TS7760','compact',['photo','compact']],
  ['Brother','MFC-J4440DW','premium',['home-office','duplex']]
]);

add('document-scanners','Document scanners','guide',['document scanner','sheetfed scanner','receipt scanner','photo scanner'],['Sheet-fed versus flat or portable workflow','Duplex scanning and document speed','Automatic document feeder capacity','Wi-Fi, software and document-management needs'],['duplex','wifi','receipts','photos','portable'],[
  ['ScanSnap','iX1600 Document Scanner','premium',['duplex','wifi']],
  ['Epson','WorkForce ES-580W Scanner','balanced',['duplex','wifi']],
  ['Brother','ADS-1800W Compact Document Scanner','compact',['portable','wifi']],
  ['Canon','imageFORMULA R10 Portable Document Scanner','value',['portable','duplex']],
  ['Epson','FastFoto FF-680W Photo Scanner','specialist',['photos','wifi']]
]);

add('gaming-controllers','Gaming controllers','guide',['gaming controller','game controller','xbox controller','ps5 controller','switch controller'],['Console and PC compatibility','Wireless versus wired connection','Stick technology and input layout','Back buttons, remapping and charging'],['xbox','playstation','switch','hall-effect','value'],[
  ['Microsoft','Xbox Wireless Controller','balanced',['xbox','wireless']],
  ['Sony','DualSense Wireless Controller','premium',['playstation','wireless']],
  ['Nintendo','Switch Pro Controller','specialist',['switch','wireless']],
  ['8BitDo','Ultimate Bluetooth Controller','value',['switch','multi-platform']],
  ['GameSir','G7 SE Wired Controller','specialist',['xbox','hall-effect']]
]);

add('pet-water-fountains','Pet water fountains','guide',['pet water fountain','cat water fountain','dog water fountain','wireless pet fountain'],['Water capacity and number of pets','Filter system and replacement availability','Pump noise and cleaning effort','Corded, battery and app-connected operation'],['cat','multi-pet','battery','app','quiet'],[
  ['PETLIBRO','Dockstream Battery-Operated Water Fountain','balanced',['battery','cat']],
  ['PETLIBRO','Dockstream App Monitoring Water Fountain','premium',['app','cat']],
  ['Catit','PIXI Smart Fountain','specialist',['app','quiet']],
  ['Catit','Flower Fountain','value',['cat','simple']],
  ['PetSafe','Drinkwell Platinum Pet Fountain','specialist',['multi-pet','large-capacity']]
]);

add('automatic-litter-boxes','Automatic litter boxes','guide',['automatic litter box','self cleaning litter box','robot litter box','cat litter robot'],['Cat size and entry design','Open-top versus enclosed chamber','Waste-bin capacity and odour control','Safety sensors, app features and cleaning'],['open-top','multi-cat','app','odour-control','value'],[
  ['Whisker','Litter-Robot 4','premium',['multi-cat','app']],
  ['PETKIT','Pura Max 2','balanced',['app','odour-control']],
  ['Neakasa','M1 Open-Top Self-Cleaning Litter Box','specialist',['open-top','large-cat']],
  ['CATLINK','Scooper Pro-X','value',['app','multi-cat']],
  ['PetSafe','ScoopFree SmartSpin Self-Cleaning Litter Box','specialist',['app','odour-control']]
]);

add('car-jump-starters','Car jump starters','travel',['jump starter','car jump starter','battery jump starter','portable jump pack'],['Engine-size and starting-current requirements','Battery chemistry and safety protections','Pack size and storage conditions','USB charging, lights and accessory functions'],['large-engine','compact','usb-c','battery-bank','value'],[
  ['NOCO','Boost Plus GB40','value',['compact','battery-bank']],
  ['NOCO','Boost X GBX45','balanced',['usb-c','compact']],
  ['NOCO','Boost HD GB70','premium',['large-engine','battery-bank']],
  ['GOOLOO','GP4000 Jump Starter','specialist',['large-engine','battery-bank']],
  ['HULKMAN','Alpha85 Jump Starter','specialist',['large-engine','display']]
]);

add('tyre-inflators','Tyre inflators','travel',['tyre inflator','tire inflator','portable air compressor','car air pump'],['Maximum pressure and inflation speed','Cordless battery versus 12V power','Gauge accuracy and automatic shut-off','Size, hose storage and accessory use'],['cordless','car','bike','compact','value'],[
  ['Xiaomi','Portable Electric Air Compressor 2','compact',['cordless','compact']],
  ['Bosch','EasyPump Cordless Pneumatic Pump','balanced',['cordless','bike']],
  ['AstroAI','Portable Air Compressor','value',['car','12v']],
  ['Makita','DMP180Z 18V Inflator','premium',['cordless','tool-battery']],
  ['Ryobi','18V ONE+ High Pressure Inflator','specialist',['cordless','tool-battery']]
]);

add('portable-fridges','Portable fridges','travel',['portable fridge','car fridge','camping fridge','12v fridge freezer'],['Storage capacity and physical size','Single-zone versus dual-zone cooling','12V, mains and battery power options','Vehicle fit, insulation and temperature control'],['camping','dual-zone','compact','12v','value'],[
  ['Dometic','CFX3 35 Portable Fridge/Freezer','premium',['camping','12v']],
  ['Engel','MT45F-S Portable Fridge/Freezer','balanced',['camping','12v']],
  ['BougeRV','CR35 Portable Fridge','value',['camping','12v']],
  ['Alpicool','C20 Portable Fridge','compact',['compact','12v']],
  ['Brass Monkey','22L Portable Fridge/Freezer','specialist',['compact','camping']]
]);

add('pizza-ovens','Pizza ovens','guide',['pizza oven','outdoor pizza oven','gas pizza oven','portable pizza oven'],['Gas, wood or electric heat source','Stone size and maximum pizza diameter','Heat-up, recovery and temperature control','Outdoor portability versus indoor convenience'],['gas','wood','portable','large-pizza','indoor'],[
  ['Ooni','Koda 12 Gas Powered Pizza Oven','value',['gas','portable']],
  ['Ooni','Koda 16 Gas Powered Pizza Oven','premium',['gas','large-pizza']],
  ['Gozney','Roccbox Portable Pizza Oven','balanced',['gas','portable']],
  ['Breville','the Smart Oven Pizzaiolo BPZ820','specialist',['indoor','electric']],
  ['Ninja','Woodfire Outdoor Oven','specialist',['outdoor','multi-function']]
]);

module.exports={categories,CHECKED,NEXT_REVIEW};
