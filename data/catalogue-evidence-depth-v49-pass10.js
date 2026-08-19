'use strict';
const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass10';

const records={
  'crucial-x9-pro-1tb':{
    model:'CT1000X9PROSSD9',
    source:'https://eu.crucial.com/ssd/x9-pro/CT1000X9PROSSD9',
    evidenceSources:['https://www.crucial.com/content/dam/crucial/ssd-products/x9-pro/flyer/crucial-X9-productflyer.pdf','https://www.crucial.com/support/ssd-support/x9-pro-support'],
    summary:'A palm-sized 1 TB USB-C SSD for creators and mobile work where ~1 GB/s transfer performance, IP55 resistance and very low weight matter more than 20 Gbps-class peak speed.',
    highlights:['Up to 1,050 MB/s sequential read and write; up to 975 MB/s sustained write manufacturer claim','USB 3.2 Gen 2 10 Gbps Type-C interface','IP55 resistance, up to 2 m stated drop durability and five-year limited warranty'],
    watch:'Crucial performance figures are controlled-test maxima and depend on the host, cable, workload and thermals. X9 Pro is a 10 Gbps-class drive; buyers needing ~2 GB/s should compare X10 Pro/T9-class 20 Gbps alternatives.',
    specs:[['Model','CT1000X9PROSSD9'],['Capacity','1 TB'],['Interface','USB 3.2 Gen 2 Type-C (10 Gbps)'],['Sequential read','Up to 1,050 MB/s stated'],['Sequential write','Up to 1,050 MB/s stated'],['Sustained write','Up to 975 MB/s stated'],['Durability','IP55'],['Drop rating','Up to 2 m stated'],['Dimensions','Approx. 65 × 50 mm'],['Weight','Approx. 38 g'],['Security','Password protection support'],['Warranty','5-year limited']],
    decisionAttributes:{capacityTb:1,interfaceGbps:10,readMbps:1050,writeMbps:1050,sustainedWriteMbps:975,ipRating:'IP55',dropM:2,weightG:38,warrantyYears:5}
  },
  'samsung-t7-shield-1tb':{
    model:'MU-PE1T0S/WW',
    source:'https://www.samsung.com/au/memory-storage/portable-ssd/t7-shield-1tb-black-external-storage-nvme-1050-mbs-mu-pe1t0s-ww/',
    evidenceSources:['https://download.semiconductor.samsung.com/resources/data-sheet/Samsung_Portable_SSD_T7_Shield_Datasheet_Rev.2.0.pdf'],
    summary:'A rugged 1 TB Samsung portable SSD for travel and field use, combining 10 Gbps USB, IP65 resistance and hardware encryption with ~1 GB/s-class performance.',
    highlights:['Up to 1,050 MB/s read and 1,000 MB/s write over USB 3.2 Gen 2','IP65 water/dust resistance and up to 3 m manufacturer-tested drop resistance','AES 256-bit hardware encryption and Samsung Magician support'],
    watch:'The speed and durability figures are manufacturer test results and vary with the host and environment. It is 10 Gbps-class, so it cannot match a fully supported 20 Gbps T9/X10 Pro path.',
    specs:[['Model','MU-PE1T0S/WW'],['Capacity','1 TB'],['Interface','USB 3.2 Gen 2 (10 Gbps)'],['Sequential read','Up to 1,050 MB/s'],['Sequential write','Up to 1,000 MB/s'],['Dimensions','59 × 88 × 13 mm'],['Weight','98 g stated'],['Durability','IP65'],['Drop rating','Up to 3 m stated'],['Encryption','AES 256-bit hardware'],['Software','Samsung Magician / Portable SSD'],['Warranty','3-year limited']],
    decisionAttributes:{capacityTb:1,interfaceGbps:10,readMbps:1050,writeMbps:1000,ipRating:'IP65',dropM:3,weightG:98,hardwareEncryption:true,warrantyYears:3}
  },
  'sandisk-extreme-portable-ssd-1tb':{
    model:'SDSSDE61 1 TB family',
    source:'https://www.sandisk.com/en-au/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-1T00-G25M',
    summary:'A compact 1 TB USB-C NVMe portable SSD with IP65 resistance and broad phone/tablet/computer compatibility for travel and field storage.',
    highlights:['Up to 1,050 MB/s read and 1,000 MB/s write','USB 3.2 Gen 2 with USB-C cable and USB-A adapter included','IP65 resistance, up to 3 m stated drop protection and five-year limited warranty'],
    watch:'SanDisk now also sells newer Extreme generations; this APG record is explicitly the SDSSDE61 family. Performance is host-dependent and the durability ratings do not make the drive waterproof or indestructible.',
    specs:[['Family','SDSSDE61'],['1 TB examples','SDSSDE61-1T00-G25B / G25M'],['Capacity','1 TB'],['Interface','USB 3.2 Gen 2'],['Sequential read','Up to 1,050 MB/s'],['Sequential write','Up to 1,000 MB/s'],['Dimensions','100.8 × 52.55 × 9.6 mm'],['Durability','IP65'],['Drop rating','Up to 3 m stated'],['Connection','USB-C; USB-A adapter included'],['Compatibility','Windows / macOS / iOS / Android supported'],['Warranty','5-year limited']],
    decisionAttributes:{capacityTb:1,interfaceGbps:10,readMbps:1050,writeMbps:1000,ipRating:'IP65',dropM:3,usbC:true,usbAAdapter:true,warrantyYears:5}
  },
  'samsung-t9-portable-ssd-1tb':{
    model:'MU-PG1T0B/WW',
    source:'https://www.samsung.com/au/memory-storage/portable-ssd/portable-ssd-t9-1tb-black-mu-pg1t0b-ww/',
    summary:'A 20 Gbps 1 TB portable SSD for buyers whose host supports USB 3.2 Gen 2x2 and who can benefit from roughly 2 GB/s-class sequential transfers.',
    highlights:['Up to 2,000 MB/s sequential read and write with a compatible USB 3.2 Gen 2x2 host','Up to 3 m manufacturer-tested drop resistance and five-year limited warranty','122 g body with Dynamic Thermal Guard and Samsung Magician support'],
    watch:'The headline 2,000 MB/s requires a USB 3.2 Gen 2x2 host and suitable cable; many laptops and Apple devices do not expose that exact 20 Gbps mode, so interface compatibility is a hard constraint.',
    specs:[['Model','MU-PG1T0B/WW'],['Capacity','1 TB'],['Interface','USB 3.2 Gen 2x2 (20 Gbps)'],['Sequential read','Up to 2,000 MB/s'],['Sequential write','Up to 2,000 MB/s'],['Dimensions','Approx. 88 × 60 × 14 mm'],['Weight','122 g stated'],['Drop rating','Up to 3 m stated'],['Thermal management','Dynamic Thermal Guard'],['Software','Samsung Magician'],['Cables','USB-C to C and USB-C to A'],['Warranty','5-year limited']],
    decisionAttributes:{capacityTb:1,interfaceGbps:20,readMbps:2000,writeMbps:2000,dropM:3,weightG:122,thermalGuard:true,warrantyYears:5}
  },
  'crucial-x10-pro-1tb':{
    model:'CT1000X10PROSSD9',
    source:'https://uk.crucial.com/ssd/x10-pro/ct1000x10prossd9',
    evidenceSources:['https://www.crucial.com/content/dam/crucial/ssd-products/x10-pro/flyer/crucial-X10-productflyer.pdf','https://www.crucial.com/support/ssd-support/x10-pro-support'],
    summary:'A very small 20 Gbps portable SSD aimed at creator workflows that can use ~2 GB/s-class reads and writes while retaining IP55 field durability.',
    highlights:['Up to 2,100 MB/s sequential read and approximately 2,000 MB/s write manufacturer performance class','USB 3.2 Gen 2x2 Type-C 20 Gbps interface','IP55 resistance, up to 2 m stated drop durability and ~42 g body'],
    watch:'Full performance requires a 20 Gbps USB 3.2 Gen 2x2 Type-C host; many otherwise fast USB-C/Thunderbolt systems negotiate a different mode. Crucial’s flyer currently states a three-year warranty for this family.',
    specs:[['Model','CT1000X10PROSSD9'],['Capacity','1 TB'],['Interface','USB 3.2 Gen 2x2 Type-C (20 Gbps)'],['Sequential read','Up to 2,100 MB/s'],['Sequential write','Up to 2,000 MB/s family claim'],['Dimensions','Approx. 65 × 50 mm'],['Weight','Approx. 42 g'],['Durability','IP55'],['Drop rating','Up to 2 m stated'],['Connection','USB-C to USB-C cable'],['Compatibility','Windows / macOS / Linux / Android / iPad / consoles'],['Warranty','3-year manufacturer-flyer statement']],
    decisionAttributes:{capacityTb:1,interfaceGbps:20,readMbps:2100,writeMbps:2000,ipRating:'IP55',dropM:2,weightG:42,warrantyYears:3}
  },

  'logitech-c920s-hd-pro':{
    model:'C920s HD Pro / 960-001252 family',
    source:'https://www.logitech.com/en-ae/products/webcams/c920s-pro-hd-webcam.960-001252.html',
    evidenceSources:['https://www.logitech.com/en-au/collections/ergo-keyboard-mouse-headset-webcam-combo.html','https://www.logitech.com/en-au/software/capture.html'],
    summary:'A mature 1080p webcam with autofocus, stereo microphones and a privacy shutter for video calls and basic streaming where 4K or 60 fps is unnecessary.',
    highlights:['1080p at 30 fps and 720p at 30 fps','Autofocus glass lens with 78° diagonal field of view','Dual stereo microphones, USB-A connection and external privacy shutter'],
    watch:'C920s is limited to 30 fps at 1080p and lacks USB-C/4K. Logitech Australia still references the exact C920s in current creator/ergonomic software and bundle surfaces even when storefront stock varies.',
    specs:[['Model family','C920s HD Pro'],['Representative part number','960-001252'],['Maximum video','1080p/30 fps'],['720p','30 fps'],['Camera sensor','3 MP family specification'],['Focus','Autofocus'],['Lens','Glass'],['Field of view','78° diagonal'],['Microphones','Dual stereo'],['Connection','USB-A'],['Privacy shutter','Included'],['Tripod ready','Yes']],
    decisionAttributes:{maxResolution:'1080p',maxFpsAt1080:30,autofocus:true,fovDeg:78,stereoMics:true,usbC:false,privacyShutter:true,tripodReady:true}
  },
  'logitech-brio-4k':{
    model:'Brio 4K current AU family',
    source:'https://www.logitech.com/en-au/shop/p/brio4kwebcam.960-001196',
    evidenceSources:['https://www.logitech.com/en-au/products/webcams/brio-4k-hdr-webcam.html'],
    summary:'A 4K meeting webcam with HDR, Windows Hello and flexible field-of-view choices for users who need sharper conferencing and high-frame-rate lower-resolution modes.',
    highlights:['4K/30, 1080p up to 60 fps and 720p up to 90 fps','Selectable 65° / 78° / 90° diagonal field of view with up to 5× digital zoom','RightLight 3 HDR, autofocus and dual noise-cancelling omnidirectional microphones'],
    watch:'4K capture is capped at 30 fps; 90 fps is available only at lower resolution. Logitech’s AU consumer and business surfaces expose multiple Brio 4K package/part numbers, so APG binds the current Brio 4K hardware family rather than inventing one universal SKU.',
    specs:[['Family','Brio 4K'],['Maximum video','4K 2160p/30 fps'],['1080p','30 or 60 fps'],['720p','30 / 60 / 90 fps'],['Field of view','65° / 78° / 90°'],['Digital zoom','Up to 5×'],['Focus','Autofocus'],['Light correction','RightLight 3 with HDR'],['Microphones','2 omnidirectional noise-cancelling'],['Connection','USB-A plug-and-play; USB-C supported'],['Windows Hello','Yes'],['Privacy shutter','Attachable']],
    decisionAttributes:{maxResolution:'4K',maxFpsAt4K:30,maxFpsAt1080:60,maxFpsAt720:90,autofocus:true,fovDegMax:90,digitalZoomX:5,hdr:true,windowsHello:true,usbCCompatible:true}
  },
  'elgato-facecam-mk2':{
    model:'Facecam MK.2',
    source:'https://help.elgato.com/hc/en-us/articles/24162700661517-Elgato-Facecam-MK-2-Technical-Specifications',
    evidenceSources:['https://www.elgato.com/ww/en/p/facecam-mk2'],
    summary:'A streaming-focused 1080p webcam that prioritises uncompressed high-frame-rate output, manual camera control and a larger fixed-focus range rather than built-in microphones.',
    highlights:['Uncompressed 1080p60 plus 720p120 over USB 3.0','Sony STARVIS 1/2.5-inch sensor with 84° field of view','Prime fixed-focus f/2.4 lens and USB-C/UVC 1.5 interface'],
    watch:'Facecam MK.2 is deliberately camera-first: fixed focus and no built-in microphone are trade-offs, not defects. USB 2.0 operation falls back to MJPEG rather than the full uncompressed mode.',
    specs:[['Model','Facecam MK.2'],['Maximum uncompressed video','1080p60'],['High frame rate','720p120 / 540p120'],['Sensor','Sony STARVIS CMOS 1/2.5-inch'],['Field of view','84°'],['Focus','Fixed'],['Focus range','30–120 cm'],['Aperture','f/2.4'],['Focal length','24 mm full-frame equivalent'],['Connection','USB-C'],['UVC','1.5'],['Dimensions','84 × 38 × 61 mm without mount'],['Weight','90 g without mount / 136 g with mount']],
    decisionAttributes:{maxResolution:'1080p',maxFpsAt1080:60,maxFpsAt720:120,sensor:'1/2.5-inch STARVIS',autofocus:false,fovDeg:84,usbC:true,builtInMic:false,weightG:90}
  },
  'insta360-link-2':{
    model:'Insta360 Link 2',
    source:'https://store.insta360.com/au/product/link-2',
    evidenceSources:['https://onlinemanual.insta360.com/link2/en-us/faq/specs/hardware'],
    summary:'A 4K AI webcam with a physical gimbal, larger 1/2-inch sensor and auto-framing/tracking for presenters who move around rather than remaining centred at a desk.',
    highlights:['4K webcam with AI Tracking and Auto Framing','1/2-inch sensor with physical gimbal yaw ±141° and pitch ±90°','Australian direct-store current product with magnetic mount and USB-C cable'],
    watch:'The physical gimbal is the key distinction versus fixed webcams and Link 2C. Tracking behaviour is software/scene dependent, and the Australian direct-store price/stock is not a recommendation input.',
    specs:[['Model','Insta360 Link 2'],['Maximum class','4K webcam'],['Sensor','1/2-inch'],['AI tracking','Yes'],['Auto framing','Yes'],['Gimbal yaw','±141°'],['Gimbal pitch','±90°'],['Dimensions','71.3 × 58.9 × 38 mm'],['Weight','101.5 g without magnetic mount'],['Weight with mount','166.5 g'],['Connection','USB-C cable; USB-A adapter included'],['Australian direct store','Current product']],
    decisionAttributes:{maxResolution:'4K',sensor:'1/2-inch',aiTracking:true,autoFraming:true,gimbal:true,yawDeg:141,pitchDeg:90,usbC:true,weightG:101.5}
  },
  'logitech-mx-brio':{
    model:'MX Brio / AU P/N 960-001561',
    source:'https://www.logitech.com/en-au/shop/p/mx-brio-4k-webcam.960-001561',
    evidenceSources:['https://www.logitech.com/en-au/products/webcams/mx-brio-705-for-business.960-001531.html'],
    summary:'Logitech’s premium 4K creator/collaboration webcam with 1080p60, a larger sensor, advanced image controls and Show Mode for desk demonstrations.',
    highlights:['4K/30 or 1080p/60 with Logitech’s largest current MX webcam sensor','AI face-based image enhancement and fine manual image controls','Show Mode with 65° / 78° / 90° framing family and USB-C connection'],
    watch:'The consumer AU MX Brio and business MX Brio 705 share the current hardware family but use different part numbers and software/certification packaging. APG does not merge them into a single SKU or infer stock status.',
    specs:[['Model','MX Brio'],['AU consumer part number','960-001561'],['Maximum video','4K/30 fps'],['1080p','Up to 60 fps'],['Field of view family','65° / 78° / 90°'],['Image enhancement','AI face-based'],['Show Mode','Yes'],['Manual controls','Exposure / white balance / ISO / shutter / colour controls'],['Connection','USB-C family'],['Business sibling sensor','8.5 MP Sony STARVIS'],['Dimensions family','Approx. 43.6 × 98 × 36.2 mm webcam'],['Weight family','Approx. 137 g webcam']],
    decisionAttributes:{maxResolution:'4K',maxFpsAt4K:30,maxFpsAt1080:60,fovDegMax:90,aiEnhancement:true,showMode:true,usbC:true,manualControls:true,creator:true}
  },

  'blue-yeti-usb-microphone':{
    model:'Yeti Multi-Pattern USB Microphone with Blue VO!CE',
    source:'https://www.logitech.com/en-au/creators/products-creators.html',
    evidenceSources:['https://secure.logitech.com/en-au/shop/c/streaming','https://www.logitech.com/en-us/shop/c/microphones.html','https://www.logitechg.com/shop/p/yeticaster-pro-streaming-microphone-bundle'],
    summary:'A desk USB condenser microphone that remains current in Logitech Australia’s creator/streaming catalogue and is distinguished by four selectable pickup patterns rather than single-pattern speech-only operation.',
    highlights:['Four pickup-pattern family: cardioid, omnidirectional, bidirectional and stereo','48 kHz USB recording family with manufacturer-stated maximum SPL of 120 dB','Blue VO!CE processing available through Logitech G HUB'],
    watch:'The original Yeti is current in Logitech Australia’s catalogue but may be out of stock at the direct store, and it is a physically large desk condenser mic rather than a close-talk dynamic broadcast mic. Do not substitute Yeti X/GX/Orb specifications.',
    specs:[['Product','Yeti Multi-Pattern USB Microphone'],['Transducer','Condenser USB microphone family'],['Pickup patterns','Cardioid / omnidirectional / bidirectional / stereo'],['Pattern count','4'],['Sample rate','48 kHz family specification'],['Maximum SPL','120 dB manufacturer specification'],['Connection','USB'],['Monitoring','Headphone monitoring/control family'],['Software','Logitech G HUB / Blue VO!CE'],['Australian catalogue','Current exact Yeti listing'],['Direct-store status','Availability/stock tracked separately'],['Positioning','Multi-source / multi-pattern desktop recording']],
    decisionAttributes:{condenser:true,dynamic:false,patternCount:4,cardioid:true,omni:true,bidirectional:true,stereo:true,sampleRateKhz:48,maxSplDb:120,usb:true,xlr:false,blueVoice:true}
  },
  'rode-podmic-usb':{
    model:'PodMic USB',
    source:'https://rode.com/en-au/products/podmic-usb',
    evidenceSources:['https://edge.rode.com/pdf/products/1045/PodMic-USB_Datasheet_FA.pdf'],
    summary:'A close-talk dynamic broadcast microphone with both XLR and USB-C, onboard DSP and direct headphone monitoring for podcasting, streaming and speech.',
    highlights:['Dynamic cardioid end-address capsule with 20 Hz–20 kHz frequency range','XLR and USB-C outputs plus 3.5 mm zero-latency headphone monitoring','148 dB maximum SPL with onboard APHEX processing and Revolution preamp in USB mode'],
    watch:'Its -57 dBV/Pa sensitivity means XLR setups benefit from adequate interface gain. USB mode adds RØDE DSP/preamp functionality that is not present on the passive XLR signal path.',
    specs:[['Model','PodMic USB'],['Acoustic principle','Dynamic'],['Polar pattern','Cardioid'],['Address','End-address'],['Frequency range','20 Hz–20 kHz'],['Maximum SPL','148 dB SPL'],['XLR impedance','460 Ω'],['Sensitivity','-57 dB re 1 V/Pa'],['Outputs','3-pin XLR / USB-C / 3.5 mm headphone'],['Equivalent noise analogue','26 dBA'],['Equivalent noise digital','19 dBA'],['DSP','APHEX processing in USB workflow']],
    decisionAttributes:{dynamic:true,condenser:false,cardioid:true,xlr:true,usbC:true,headphone:true,maxSplDb:148,frequencyMinHz:20,frequencyMaxHz:20000,onboardDsp:true}
  },
  'rode-nt-usb':{
    model:'NT-USB+',
    source:'https://rode.com/en-au/products/nt-usb-plus',
    summary:'A side-address USB condenser microphone for vocals, instruments and spoken content where simple USB-C operation, high-resolution conversion and onboard APHEX processing are priorities.',
    highlights:['Pressure-gradient cardioid condenser with 20 Hz–20 kHz response','24-bit / 48 kHz USB-C conversion with Revolution preamp','118 dB input SPL at 10% THD plus zero-latency headphone output and APHEX DSP'],
    watch:'This is a sensitive condenser rather than a close-talk dynamic microphone, so untreated-room noise and keyboard/room reflections can matter more. The maintained APG slug is legacy; the current product identity is NT-USB+.',
    specs:[['Model','NT-USB+'],['Acoustic principle','Pressure gradient condenser'],['Polar pattern','Cardioid'],['Frequency range','20 Hz–20 kHz'],['Input SPL','118 dB at 10% THD'],['Dynamic range','97 dB at 10% THD'],['Bit depth','24-bit'],['Sample rate','48 kHz'],['Connection','USB-C'],['Headphone output','3.5 mm'],['Power','5 V / 500 mA USB bus'],['DSP','APHEX via RØDE software']],
    decisionAttributes:{dynamic:false,condenser:true,cardioid:true,xlr:false,usbC:true,headphone:true,maxSplDb:118,bitDepth:24,sampleRateKhz:48,onboardDsp:true}
  },
  'shure-mv7':{
    model:'MV7+',
    source:'https://www.shure.com/en-US/docs/guide/MV7plus',
    evidenceSources:['https://www.shure.com/en-ASIA/products/microphones/mv7'],
    summary:'A hybrid USB-C/XLR dynamic podcast microphone with automatic level tools and onboard DSP for users who want both direct-computer convenience and an upgrade path to an audio interface.',
    highlights:['Dynamic cardioid capsule with USB-C and XLR outputs','16/24-bit 48 kHz conversion, 50 Hz–16 kHz response and 128 dB USB maximum SPL','Onboard Auto Level, digital pop reduction, denoiser, EQ/tone, reverb, compressor, limiter and high-pass filter'],
    watch:'The current product is MV7+, even though APG’s maintained slug remains `shure-mv7`. Some digital features only apply to the USB-C path; XLR behaviour depends on the external interface/preamp.',
    specs:[['Model','MV7+'],['Transducer','Dynamic moving coil'],['Polar pattern','Cardioid'],['Frequency response','50 Hz–16 kHz'],['Conversion','16 or 24-bit / 48 kHz'],['USB gain range','0 to +36 dB'],['USB maximum SPL','128 dB SPL'],['XLR sensitivity','-55 dBV/Pa'],['USB-C sensitivity','-33 dBV/Pa'],['Connections','USB-C / XLR / 3.5 mm headphone'],['DSP','Auto Level / Popper Stopper / denoiser / tone / reverb / compressor / limiter / HPF'],['MFi certified','Yes']],
    decisionAttributes:{dynamic:true,condenser:false,cardioid:true,xlr:true,usbC:true,headphone:true,maxSplDb:128,bitDepth:24,sampleRateKhz:48,onboardDsp:true,autoLevel:true}
  }
};

const unresolvedEntityCorrections=[{
  slug:'audio-technica-atr2100x-usb',
  reason:'Exact current manufacturer manual/specification evidence exists for ATR2100x-USB, but a clean current Audio-Technica Australia product-catalogue/current-sale binding was not established in this pass. Keep below current-Australian strong-depth certification until regional lifecycle status is reconciled.'
}];

function key(v){return String(v||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,70)||'field';}
function addFact(p,k,value,label){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};p.factEvidence[k]={value,source:p.source,sourceType:'manufacturer-primary',verifiedAt:VERIFIED,applicability:'exact-model-or-explicit-model-family',confidence:'high',label:label||k};}
function applyOne(p,row){
  const first=p.firstResearched;
  Object.assign(p,{model:row.model,source:row.source,evidenceSources:row.evidenceSources||[],sourceType:'Official primary manufacturer product/specification evidence · independently reverified 20 Aug 2026',summary:row.summary,highlights:[...row.highlights],watch:row.watch,specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',testingStatus:'Desk-researched against exact primary manufacturer product/specification evidence; no hands-on testing claimed.',publicationStatus:'LIVE / MAINTAINED',firstResearched:first||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',evidenceDepthVersion:VERSION,evidenceDepthStatus:'new-primary-research-v49-pass10'});
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
