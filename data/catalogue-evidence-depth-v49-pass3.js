'use strict';

const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass3';

const records={
  'fujifilm-instax-mini-12':{
    model:'INSTAX mini 12',source:'https://www.instax.com.au/cameras/mini-12/',
    summary:'Simple automatic instant camera using INSTAX mini film, with close-up mode and a selfie mirror for low-friction everyday shooting.',
    highlights:['INSTAX mini film with 62 × 46 mm image area','Automatic exposure with built-in flash','Close-up mode for 0.3–0.5 m subjects'],
    watch:'Film is an ongoing consumable cost. The Mini 12 is intentionally simple: buyers wanting digital preview, selective printing or effects should compare the Mini Evo.',
    specs:[['Film','Fujifilm INSTAX mini instant film'],['Picture size','62 × 46 mm'],['Lens','60 mm, f/12.7'],['Shooting range','0.3 m and beyond'],['Close-up range','0.3–0.5 m'],['Shutter','1/2 to 1/250 sec automatic'],['Film sensitivity','ISO 800'],['Power','2 × AA alkaline batteries'],['Rated capacity','Approx. 100 exposures / 10 film packs'],['Dimensions','104 × 122 × 66.6 mm'],['Weight','306 g excluding batteries, strap and film']],
    decisionAttributes:{format:'instax-mini',hybrid:false,automaticExposure:true,closeUp:true,selfieMirror:true,batteryType:'2xAA',weightG:306}
  },
  'fujifilm-instax-mini-41':{
    model:'INSTAX mini 41',source:'https://www.instax.com.au/cameras/mini-41/',
    summary:'Automatic INSTAX mini camera with close-up framing correction and selfie mirror in a more classic-looking body.',
    highlights:['INSTAX mini film and automatic exposure','Close-up mode with parallax correction','Selfie mirror and built-in flash'],
    watch:'Like the Mini 12, it does not provide digital preview or selective printing; its appeal is straightforward analogue-style instant capture.',
    specs:[['Film','Fujifilm INSTAX mini instant film'],['Picture size','62 × 46 mm'],['Lens','60 mm, f/12.7'],['Shooting range','0.3 m and beyond'],['Close-up range','0.3–0.5 m'],['Shutter','1/2 to 1/250 sec automatic'],['Film sensitivity','ISO 800'],['Power','2 × AA alkaline batteries'],['Rated capacity','Approx. 100 exposures / 10 film packs'],['Dimensions','104.5 × 122.5 × 67.5 mm'],['Weight','345 g excluding batteries, strap and film']],
    decisionAttributes:{format:'instax-mini',hybrid:false,automaticExposure:true,closeUp:true,parallaxCorrection:true,selfieMirror:true,batteryType:'2xAA',weightG:345}
  },
  'fujifilm-instax-mini-evo':{
    model:'INSTAX mini Evo',source:'https://www.instax.com.au/cameras/mini-evo/',
    summary:'Hybrid digital/instant camera that lets users preview shots, apply creative effects and choose which images to print on INSTAX mini film.',
    highlights:['Hybrid digital capture with selective INSTAX mini printing','10 lens effects × 10 film effects for 100 combinations','Smartphone printing and app connectivity'],
    watch:'The digital sensor is small and the value proposition is creative instant printing rather than competing with a modern phone or dedicated camera for pure image quality.',
    specs:[['Film','Fujifilm INSTAX mini instant film'],['Image sensor','1/5-inch CMOS'],['Digital image size','2560 × 1920 pixels'],['Lens','28 mm equivalent, f/2'],['Minimum focus','10 cm'],['Internal storage','Approx. 45 images'],['microSD capacity','Approx. 850 images per 1 GB'],['Print time','Approx. 16 sec'],['Print resolution','318 dpi app / 635 × 318 dpi camera mode'],['Display','3-inch LCD, approx. 460k dots'],['Battery','Internal lithium-ion'],['Rated prints','Approx. 100 per charge'],['Dimensions','87 × 122.9 × 36 mm'],['Weight','285 g']],
    decisionAttributes:{format:'instax-mini',hybrid:true,digitalPreview:true,selectivePrinting:true,appPrinting:true,creativeCombinations:100,weightG:285}
  },
  'fujifilm-instax-wide-400':{
    model:'INSTAX WIDE 400',source:'https://www.instax.com.au/cameras/wide-400/',
    summary:'Dedicated wide-format instant camera for group shots and scenes where the larger INSTAX WIDE image area matters more than compactness.',
    highlights:['INSTAX WIDE film with 99 × 62 mm image area','Automatic exposure and built-in flash','Self-timer plus included close-up lens and angle accessory'],
    watch:'At roughly 616 g before batteries/film and using four AA cells, it is substantially bulkier than mini-film models; film format should be a deliberate choice.',
    specs:[['Film','Fujifilm INSTAX WIDE instant film'],['Picture size','99 × 62 mm'],['Lens','95 mm, f/14'],['Normal range','0.9–3 m'],['Landscape range','3 m and beyond'],['Close-up lens range','0.4–0.5 m'],['Shutter','1/64 to 1/200 sec automatic'],['Film sensitivity','ISO 800'],['Self-timer','4 / 6 / 8 / 10 sec'],['Power','4 × AA alkaline batteries'],['Rated capacity','Approx. 100 exposures / 10 film packs'],['Dimensions','162 × 98 × 123 mm'],['Weight','616 g excluding batteries, strap and film']],
    decisionAttributes:{format:'instax-wide',hybrid:false,automaticExposure:true,selfTimer:true,batteryType:'4xAA',weightG:616,wideFormat:true}
  },

  'canon-selphy-cp1500':{
    model:'SELPHY CP1500',source:'https://www.canon.com.au/printers/selphy-cp1500',
    summary:'Compact dye-sublimation photo printer for postcard-size and smaller prints, with Wi-Fi, USB-C and SD-card workflows.',
    highlights:['Dye-sublimation printing at 300 × 300 dpi','Postcard-size prints in about 41 seconds','Wi-Fi, USB-C and SD-card connectivity'],
    watch:'SELPHY media uses matched paper/ink consumable sets, so ongoing cost and availability matter. Portability does not mean pocket-sized; it is a compact tabletop printer.',
    specs:[['Print technology','Dye sublimation'],['Resolution','300 × 300 dpi'],['Postcard paper','148 × 100 mm'],['L-size paper','119 × 89 mm'],['Card paper','86 × 54 mm'],['Square label paper','54 × 54 mm'],['Paper capacity','18 sheets'],['Postcard print time','Approx. 41 sec'],['Connectivity','Wi-Fi, USB-C, SD card'],['Consumable examples','RP-108 / KC-18IS / KC-36IP']],
    decisionAttributes:{technology:'dye-sub',maxPrint:'postcard',wifi:true,usbC:true,sdCard:true,portableDesktop:true,postcardSeconds:41}
  },
  'canon-selphy-qx20':{
    model:'SELPHY QX20',source:'https://www.canon.com.au/printers/selphy-square-qx20',
    summary:'Battery-powered compact dye-sublimation printer aimed at smartphone users who value small square/card prints and adhesive-backed media.',
    highlights:['Dye-sublimation printing at 287 × 287 dpi','Supports square XS and card-size XC media','Wi-Fi smartphone workflow through SELPHY Photo Layout'],
    watch:'The QX20 is optimised for smaller portable prints rather than CP1500 postcard output; compare intended print size before choosing between them.',
    specs:[['Print technology','Dye sublimation'],['Resolution','287 × 287 dpi'],['XS media','72 × 85 mm, max image 68 × 68 mm'],['XC media','86 × 54 mm, max image 70 × 54 mm'],['Paper capacity','20 sheets'],['Connectivity','Wi-Fi'],['Compatible media','XS-20L / XC-20L / XC-60L'],['App','SELPHY Photo Layout']],
    decisionAttributes:{technology:'dye-sub',portable:true,wifi:true,squarePrint:true,cardPrint:true,maxSheets:20}
  },
  'fujifilm-instax-mini-link-3':{
    model:'INSTAX mini Link 3',source:'https://www.instax.com.au/printers/mini-link-3/',
    summary:'Pocketable smartphone printer using INSTAX mini film, built around Bluetooth app printing and creative overlays/effects.',
    highlights:['INSTAX mini film output at 318 dpi','Approx. 15 sec image exposure/print ejection','Approx. 100 prints per battery charge'],
    watch:'The image develops after ejection and film cost is recurring. It is best viewed as a social instant-print device rather than a low-cost conventional photo printer.',
    specs:[['Film','Fujifilm INSTAX mini instant film'],['Picture size','62 × 46 mm'],['Resolution','318 dpi'],['Colour levels','256 levels per RGB colour'],['Accepted files','JPEG / PNG / HEIF / DNG'],['Print time','Approx. 15 sec'],['Rated prints','Approx. 100 per charge'],['Battery','Internal lithium-ion'],['Charge time','Approx. 1.5–2 hours'],['Dimensions','90 × 37.3 × 125 mm'],['Weight','210 g']],
    decisionAttributes:{technology:'instant-film',format:'instax-mini',portable:true,battery:true,printsPerCharge:100,printSeconds:15,weightG:210}
  },
  'fujifilm-instax-link-wide':{
    model:'INSTAX Link WIDE',source:'https://www.instax.com.au/printers/link-wide/',
    summary:'Smartphone instant printer for larger INSTAX WIDE film, trading pocketability for a substantially bigger image area.',
    highlights:['INSTAX WIDE film with 99 × 62 mm image area','318 dpi output and Bluetooth connection','Approx. 12 sec image exposure/print ejection'],
    watch:'It is larger and heavier than Mini Link models and uses different WIDE film; choose it specifically for larger physical prints.',
    specs:[['Film','Fujifilm INSTAX WIDE instant film'],['Picture size','99 × 62 mm'],['Digital image size','800 × 1260 dots'],['Resolution','318 dpi'],['Connectivity','Bluetooth 4.2'],['Accepted files','JPEG / PNG / HEIF / DNG'],['Print time','Approx. 12 sec'],['Rated prints','Approx. 100 per charge'],['Charge time','Approx. 80–120 min'],['Dimensions','139 × 127.5 × 33.7 mm'],['Weight','340 g']],
    decisionAttributes:{technology:'instant-film',format:'instax-wide',portable:true,battery:true,printsPerCharge:100,printSeconds:12,weightG:340,wideFormat:true}
  },
  'kodak-mini-2-retro':{
    model:'P210R',source:'https://kodakphotoprinter.com/products/best-photo-printer-printer-kodak-mini-2-retro',
    summary:'Rechargeable Bluetooth pocket photo printer producing credit-card-size 2.1 × 3.4-inch dye-sublimation prints.',
    highlights:['4PASS dye-sublimation printing','291 × 300 dpi resolution','Bluetooth printing from iOS and Android'],
    watch:'The Kodak brand is licensed on this printer platform. Consumable availability and per-print cost should be checked alongside the compact hardware price.',
    specs:[['Model','P210R'],['Print technology','4PASS dye sublimation'],['Resolution','291 × 300 dpi'],['Photo size','2.1 × 3.4 in'],['Paper','Single-sided non-sticky photo paper'],['Connectivity','Bluetooth'],['Mobile support','iOS and Android'],['Battery','Rechargeable'],['Dimensions','132.4 × 78.2 × 25.8 mm'],['Weight','255 g'],['Warranty','1 year']],
    decisionAttributes:{technology:'dye-sub',portable:true,battery:true,bluetooth:true,ios:true,android:true,weightG:255,printWidthIn:2.1,printHeightIn:3.4}
  },

  'russell-hobbs-rhk510-addison-kettle':{
    model:'RHK510',source:'https://au.russellhobbs.com/product/addison-digital-kettle-brushed-RHK510%C2%A0',
    summary:'1.7 L variable-temperature digital kettle with five beverage presets and keep-warm functionality.',
    highlights:['Five presets: 70°C, 80°C, 90°C, 95°C and 100°C','1.7 L capacity','Keep-warm function and illuminated digital controls'],
    watch:'Useful for temperature-sensitive tea and coffee, but buyers who only need boiling water can choose a simpler kettle with fewer controls.',
    specs:[['Model','RHK510'],['Capacity','1.7 L'],['Temperature settings','70 / 80 / 90 / 95 / 100 °C'],['Presets','Green tea / White tea / Oolong / Coffee / Black tea'],['Keep warm','Yes'],['Material','Stainless steel'],['Water level indicator','Yes'],['Auto shut-off','Yes'],['Filter','Removable washable anti-scale filter'],['Warranty','2 years']],
    decisionAttributes:{capacityL:1.7,variableTemperature:true,temperatureSettings:5,keepWarm:true,stainlessSteel:true,autoShutoff:true}
  },
  'russell-hobbs-rhk82bru-carlton-kettle':{
    model:'RHK82BRU',source:'https://au.russellhobbs.com/product/carlton-kettle-RHK82BRU',
    summary:'Straightforward 1.7 L stainless-steel kettle with visible water gauge, 360-degree base and boil-dry protection.',
    highlights:['1.7 L capacity','Perfect Pour spout and visible water gauge','Auto cut-off / boil-dry protection'],
    watch:'This is a fixed-boil model rather than a variable-temperature kettle; that simplicity is a benefit only if temperature presets are not needed.',
    specs:[['Model','RHK82BRU'],['Capacity','1.7 L'],['Finish','Brushed stainless steel'],['Lid','Push-to-open'],['Water gauge','Yes'],['Filter','Removable and washable'],['Safety','Auto cut-off / boil-dry protection'],['Base','360° swivel'],['Cord storage','Yes'],['Warranty','2 years']],
    decisionAttributes:{capacityL:1.7,variableTemperature:false,stainlessSteel:true,boilDryProtection:true,waterGauge:true,swivelBase:true}
  },
  'philips-series-5000-hd9395-90-kettle':{
    model:'HD9395/90',source:'https://www.philips.com.au/c-p/HD9395_90/double-walled-kettle-5000-double-walled-kettle-5000-series',
    summary:'1.7 L double-wall stainless-steel kettle designed to keep the exterior cooler while retaining heat inside.',
    highlights:['Double-wall insulated construction','1.7 L capacity with cup indicator','Strix controller with automatic shut-off / boil-dry protection'],
    watch:'Despite the starter tag, Philips describes this as a fixed-boil kettle rather than a user-selectable temperature-control model; APG should not infer variable temperatures.',
    specs:[['Model','HD9395/90'],['Capacity','1.7 L'],['Material','Metal / food-grade stainless-steel inner pot'],['Power','1850–2200 W'],['Voltage','220–240 V'],['Frequency','50–60 Hz'],['Automatic shut-off','Yes'],['Base','360°'],['Dimensions','15.5 × 23.05 × 25.2 cm'],['Weight','1183.5 g'],['Warranty','2 years']],
    decisionAttributes:{capacityL:1.7,doubleWall:true,variableTemperature:false,powerMaxW:2200,autoShutoff:true,stainlessSteelInner:true}
  },
  'breville-the-soft-top-pure-bke700':{
    model:'BKE700BSS',source:'https://www.breville.com/en-au/product/bke700?sku=BKE700BSS',
    summary:'1.7 L stainless-steel fast-boil kettle with a soft-opening lid, dual water windows and removable scale filter.',
    highlights:['1.7 L cordless jug','Soft-opening lid designed to reduce splashing','Dual water windows and removable scale filter'],
    watch:'It is a simple boiling kettle without selectable brew temperatures or keep-warm logic; choose the Smart Kettle if those controls matter.',
    specs:[['Model','BKE700BSS'],['Capacity','1.7 L'],['Material','Stainless steel'],['Water windows','Dual-sided'],['Lid','Soft-opening push-button lid'],['Heating element','Concealed'],['Filter','Removable scale filter'],['Base','360° cordless base'],['Automatic shut-off','Yes'],['Dimensions','23.8 × 16 × 24.5 cm']],
    decisionAttributes:{capacityL:1.7,variableTemperature:false,softOpenLid:true,dualWaterWindow:true,removableFilter:true,stainlessSteel:true}
  },
  'breville-the-smart-kettle-bke825':{
    model:'BKE825BSS',source:'https://www.breville.com/en-au/product/bke825',
    summary:'1.7 L variable-temperature kettle with five beverage presets and a 20-minute keep-warm mode.',
    highlights:['Five temperature presets for teas and French press coffee','20-minute keep-warm function','2400 W rapid-boil power'],
    watch:'Some colour-specific BKE825 variants are discontinued while the brushed-stainless BKE825BSS is currently presented for sale; APG binds this record to that current AU variant.',
    specs:[['Model','BKE825BSS'],['Capacity','1.7 L / 7 cups'],['Temperature settings','5'],['Presets','Green / White / Oolong / Black tea / Coffee'],['Keep warm','20 minutes'],['Power','2400 W'],['Voltage','220–240 V'],['Material','Stainless steel'],['Lid','Soft Top'],['Base','360° cordless'],['Warranty','2 years']],
    decisionAttributes:{capacityL:1.7,variableTemperature:true,temperatureSettings:5,keepWarmMinutes:20,powerW:2400,softOpenLid:true}
  },

  'russell-hobbs-rht82bru-carlton-2-slice-toaster':{
    model:'RHT82BRU',source:'https://au.russellhobbs.com/product/carlton-2-slice-toaster-brushed-RHT82BRU',
    summary:'Value-focused two-slice stainless-steel toaster with wide self-centring slots, high lift and seven browning settings.',
    highlights:['Two wide self-centring slots','Seven-setting variable browning control','Defrost, reheat and cancel functions with high lift'],
    watch:'It is a conventional manual toaster without bread-type intelligence or motorised lowering; that simplicity suits buyers prioritising value and straightforward controls.',
    specs:[['Model','RHT82BRU'],['Capacity','2 slices'],['Slots','Wide self-centring'],['Browning settings','7'],['Functions','Cancel / Defrost / Reheat'],['High lift','Yes'],['Cord storage','Yes'],['Crumb tray','Yes'],['Housing','Brushed stainless steel with chrome accents'],['Warranty','2 years']],
    decisionAttributes:{slices:2,browningSettings:7,wideSlots:true,selfCentering:true,highLift:true,defrost:true,reheat:true}
  },
  'breville-the-bit-more-2-slice-bta435':{
    model:'BTA435BSS',source:'https://www.breville.com/en-au/product/bta435',
    summary:'Two-slice toaster with extra-wide/deep slots, six browning levels and Breville’s Lift & Look and A Bit More functions.',
    highlights:['A Bit More adds 30 seconds','Lift & Look checks progress without cancelling','Two extra-deep and wide slots with six browning levels'],
    watch:'Two-slice capacity is compact but can be limiting for larger households; compare a four-slice model if simultaneous throughput matters.',
    specs:[['Model','BTA435BSS'],['Capacity','2 slices'],['Slots','2 extra-long, wide and deep slots'],['Browning settings','6'],['A Bit More','Adds 30 sec'],['Lift & Look','Yes'],['Power','840–1000 W'],['Voltage','220–240 V 50 Hz'],['Dimensions','29.2 × 17.4 × 19.3 cm'],['Material','Brushed stainless-steel design'],['Warranty','1 year replacement']],
    decisionAttributes:{slices:2,browningSettings:6,wideSlots:true,liftLook:true,bitMoreSeconds:30,powerMaxW:1000}
  },
  'breville-the-smart-toast-4-slice-bta845':{
    model:'BTA845BSS',source:'https://www.breville.com/en-au/product/bta845?sku=BTA845BSS',
    summary:'Premium four-slice motorised toaster with extra-wide slots, LED progress indication and one-touch bread functions.',
    highlights:['Four extra-wide slots','Motorised one-touch lowering','A Bit More, Lift & Look, Bagel/Fruit Bread and Frozen functions'],
    watch:'It is materially larger and more expensive than manual two-slice models; its value comes from throughput and automated controls rather than basic toasting alone.',
    specs:[['Model','BTA845BSS'],['Capacity','4 slices'],['Slots','4 extra-wide slots'],['Functions','Fruit Bread / A Bit More / Lift & Look / Defrost / Bagel'],['Lowering','Motorised one-touch'],['Progress','LED browning indicator'],['Power','1680–2000 W'],['Voltage','220–240 V 50 Hz'],['Dimensions','19.7 × 28.7 × 30 cm'],['Body','Brushed die-cast metal'],['Warranty','2 years']],
    decisionAttributes:{slices:4,wideSlots:true,motorised:true,liftLook:true,bitMore:true,bagel:true,defrost:true,powerMaxW:2000}
  },
  'sunbeam-alinea-select-2-slice-toaster':{
    model:'TA2820 family (TA2820K verified)',source:'https://www.sunbeam.com.au/alineatm-select-2-slice-toaster-black-classics',
    summary:'Two-slice toaster with bread-type selection, dedicated gluten-free timing, QuickCheck and nine browning levels.',
    highlights:['Six bread-type selections including sourdough and crumpet','Dedicated gluten-free button','Nine browning settings and QuickCheck progress view'],
    watch:'APG binds the generic Alinea Select 2 Slice record to the current TA2820 family; colour suffixes vary. This model adds bread-profile controls rather than simply more slots.',
    specs:[['Verified variant','TA2820K Black Classics'],['Capacity','2 slices'],['Bread types','White / Grain / Brown-Rye / Sourdough / Crumpet / Fruit'],['Gluten-free mode','Yes'],['Browning settings','1–9'],['QuickCheck','Yes'],['Slots','Self-centring'],['Power','820–980 W'],['Dimensions','195 × 195 × 370 mm'],['Weight','1.5 kg'],['Warranty','12 months']],
    decisionAttributes:{slices:2,breadProfiles:6,glutenFreeMode:true,browningSettings:9,quickCheck:true,selfCentering:true,powerMaxW:980}
  },
  'delonghi-icona-capitals-2-slice-toaster':{
    model:'CTOC2003 family (CTOC2003.BK verified)',source:'https://www.delonghi.com/en-au/p/icona-capitals-toasters-icona-capitals-toaster-ctoc2003.bk/CTOC2003.BK.html',
    summary:'Design-led two-slice toaster with 900 W heating, six browning positions, extra-wide slots and dedicated Bagel, Defrost and Reheat modes.',
    highlights:['900 W heating on current AU 2-slice variants','Six-position browning control','Bagel, Defrost, Reheat and Cancel modes with extra lift'],
    watch:'The CTOC2003 family has multiple colour suffixes and pricing; APG treats colour as a variant rather than a performance distinction.',
    specs:[['Verified variant','CTOC2003.BK'],['Capacity','2 slices'],['Power','900 W'],['Browning settings','6'],['Slots','Extra-wide and deep'],['Functions','Bagel / Defrost / Reheat / Cancel'],['High lift','Yes'],['Crumb tray','Removable'],['Body','Stainless steel'],['Cord storage','Integrated']],
    decisionAttributes:{slices:2,powerW:900,browningSettings:6,wideSlots:true,bagel:true,defrost:true,reheat:true,highLift:true}
  },

  'kitchenaid-7-cup-food-processor-5kfp0719':{
    model:'KFP0719 / AU 5KFP0719 variants',source:'https://kitchenaid.com.au/products/kitchenaid-7-cup-food-processor-kfp0719-1',
    summary:'Mid-size 7-cup food processor with in-bowl accessory storage, two speeds plus pulse, slicing/shredding discs and dough blade.',
    highlights:['7-cup / 1.7 L BPA-free work bowl','Two speeds plus pulse','Accessories store inside the bowl'],
    watch:'Its 250 W motor and 7-cup capacity target everyday meal prep rather than the heavy/high-volume workloads of larger premium processors.',
    specs:[['Model family','KFP0719 / 5KFP0719 AU variants'],['Bowl','7 cup / 1.7 L'],['Power','250 W'],['Speeds','2 + Pulse'],['Bowl material','BPA-free'],['Storage','In-bowl'],['Dimensions','39 × 24.5 × 20 cm'],['Net weight','3 kg'],['Included blades','Multi-purpose + dough'],['Discs','Reversible medium slicing/shredding + thick slicing'],['Warranty','2 years']],
    decisionAttributes:{bowlCups:7,bowlL:1.7,powerW:250,speeds:2,pulse:true,doughBlade:true,inBowlStorage:true,bpaFree:true}
  },
  'ninja-professional-food-processor-bn650':{
    model:'BN650',source:'https://ninjakitchen.com.au/products/ninja-professional-food-processor-bn650',
    summary:'850 W, 2.1 L food processor with four Auto-iQ programs, chopping and dough blades plus reversible slicing/shredding disc.',
    highlights:['850 W motor','2.1 L / 9-cup processing bowl','Four Auto-iQ programs: Chop, Puree, Slice and Mix'],
    watch:'Preset automation is useful, but the 2.1 L bowl and fixed disc set should be compared with larger processors or adjustable slicing systems for heavy batch prep.',
    specs:[['Model','BN650'],['Bowl','2.1 L / 9 cup'],['Power','850 W'],['Programs','4 Auto-iQ'],['Program names','Chop / Puree / Slice / Mix'],['Weight','3.24 kg'],['Dimensions','40.5 × 17 × 17 cm'],['Cord','0.9 m'],['Motor speed','1600 RPM'],['Included tools','Chopping blade / Dough blade / Reversible slicing-shredding disc'],['Dishwasher-safe parts','Yes'],['BPA-free parts','Yes']],
    decisionAttributes:{bowlL:2.1,bowlCups:9,powerW:850,autoIqPrograms:4,doughBlade:true,reversibleDisc:true,dishwasherSafe:true,bpaFree:true}
  },
  'cuisinart-8-cup-food-processor':{
    model:'FP-8GMA (Australian Elemental 8 Cup)',source:'https://cuisinart.com.au/products/elemental-8-cup-food-processor-gma',
    summary:'Current Australian 8-cup Elemental processor with 350 W motor, high/low/pulse controls and two reversible slicing/grating discs.',
    highlights:['8-cup processing bowl','350 W motor','Two reversible stainless-steel slicing/grating discs'],
    watch:'Cuisinart’s US FP-8 variants show different lifecycle states; APG binds this product to the current Australian FP-8GMA listing rather than assuming global availability.',
    specs:[['Australian model','FP-8GMA'],['Bowl','8 cup'],['Power','350 W'],['Voltage','240 V'],['Controls','High / Low / Pulse'],['Blade','Stainless-steel chopping/processing'],['Discs','2 reversible stainless-steel medium/fine slicing-grating discs'],['Feed tube','Integrated'],['Dishwasher-safe removable parts','Yes'],['Plastics','BPA-free'],['Warranty','3 years'],['Barcode','9313803468269']],
    decisionAttributes:{bowlCups:8,powerW:350,speeds:2,pulse:true,reversibleDiscs:2,dishwasherSafe:true,bpaFree:true,warrantyYears:3}
  }
};

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model-or-explicit-model-family',confidence:'high',label:label||k};}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,sourceType:'Official primary manufacturer product/specification evidence · independently reverified 20 Aug 2026',summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass3'});
  p.factEvidence={};addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,'Maintained APG product identity');addFact(p,'exactModel',row.model,'Exact model / explicit AU model family');addFact(p,'canonicalCategory',p.categoryLabel||p.category,'Canonical APG category');
  for(const spec of row.specs)addFact(p,`spec_${key(spec[0])}`,spec[1],spec[0]);
  row.highlights.forEach((value,i)=>addFact(p,`verifiedClaim${i+1}`,value,`Verified manufacturer claim ${i+1}`));
  p.evidenceClaims=row.highlights.map((value,i)=>({key:`verifiedClaim${i+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-primary'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set(),touched=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){if(!p||seen.has(p.slug))continue;seen.add(p.slug);if(records[p.slug]){applyOne(p,records[p.slug]);touched.push(p.slug);}}
  return{version:VERSION,verifiedAt:VERIFIED,newPrimaryResearch:touched.length,touched,unresolvedEntityCorrections:[
    {slug:'polaroid-now-generation-2',reason:'Current Polaroid Australia catalogue has moved to Now+ Generation 3; Gen 2 should be treated as superseded/replaced rather than silently certified as a current recommendation.'},
    {slug:'breville-the-kitchen-wizz-8-bfp580',reason:'Breville Australia currently marks the BFP580 Kitchen Wizz 8 Plus as discontinued; requires current-category replacement or historical classification.'},
    {slug:'breville-the-kitchen-wizz-15-pro-bfp800',reason:'Breville Australia currently marks BFP800 Kitchen Wizz 15 Pro as discontinued; requires current-category replacement or historical classification.'}
  ]};
}
module.exports={VERSION,VERIFIED,NEXT_REVIEW,records,apply};
