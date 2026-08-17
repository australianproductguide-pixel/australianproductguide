const CHECKED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const testing='Desk-researched against exact Australian manufacturer product/specification evidence; no hands-on testing claimed.';
const sourceType='Exact Australian manufacturer model identity and specifications verified 17 Aug 2026.';

function product(category,categoryLabel,row){
  return {
    id:row.id,
    slug:row.slug,
    model:row.model,
    brand:row.brand,
    name:row.name,
    category,
    categoryLabel,
    summary:row.summary,
    highlights:row.highlights,
    watch:row.watch,
    source:row.source,
    sourceType,
    evidenceSources:row.evidenceSources||[],
    verifiedRetailers:row.verifiedRetailers||[],
    tags:row.tags,
    specs:row.specs||[],
    testingStatus:testing,
    evidenceTier:'deep',
    publicationStatus:'live',
    maintenanceStatus:'maintained',
    firstResearched:CHECKED,
    lastSubstantiveReview:CHECKED,
    lastSourceVerification:CHECKED,
    lastRetailerVerification:CHECKED,
    lastImageVerification:CHECKED,
    nextReviewDue:NEXT_REVIEW,
    imageRightsStatus:'No third-party product image published until APG has an authorised delivery source or explicit reusable rights.',
    imageUrl:null,
    imageVerified:false
  };
}

function category(slug,label,title,description,icon,factors,priorities,faqs,rows,relatedCategories){
  return {
    slug,label,title,description,icon,factors,priorities,faqs,
    evidenceTier:'deep',
    evidenceLabel:'Manufacturer-verified Australian evidence',
    authorityIntro:'Exact Australian model identity, primary-source specifications and retailer pathways are maintained separately so product fit is not influenced by commercial relationships.',
    relatedCategories,
    comparisonLimit:6,
    products:rows.map(row=>product(slug,label,row))
  };
}

const coffeeGrinders=category(
  'coffee-grinders','Coffee grinders','Coffee Grinders Australia',
  'Compare coffee grinders sold to Australian shoppers by burr type, espresso capability, adjustment range, dosing workflow, hopper size and benchtop footprint.',
  'coffee',
  ['Burr type and grind consistency','Espresso-to-filter adjustment range','Dosing workflow and portafilter fit','Retention, cleaning and day-to-day use'],
  ['espresso','filter','all-purpose','value','compact','dosing-control'],
  [
    ['Blade or burr grinder?','Blade grinders are simpler and cheaper but do not offer the controlled particle-size adjustment of a burr grinder. For espresso, adjustable burr geometry is usually the more relevant starting point.'],
    ['How many grind settings do I need?','The number alone is not a quality score. What matters is whether the adjustment range gives enough usable resolution around your brew method, especially espresso.'],
    ['Does a grinder need to match my espresso machine?','Check portafilter size, dosing workflow and whether the grinder can adjust finely enough for the coffee and basket you use.'],
    ['Why does APG separate retailer links from the evidence?','Manufacturer specifications establish product identity and documented capability. Retailer availability is checked separately and contributes zero recommendation points.']
  ],
  [
    {
      id:'APG-AUTHORITY-COFFEE-GRINDERS-001',slug:'delonghi-kg200-electric-coffee-grinder',model:'KG200',brand:"De'Longhi",name:"De'Longhi KG200 Electric Coffee Bean and Spice Grinder",
      summary:'A compact stainless-steel blade grinder for shoppers prioritising simple push-to-grind operation and a lower-cost entry point rather than espresso-grade burr adjustment.',
      highlights:['Stainless-steel blade grinding mechanism','90 g bean hopper with cup selector for up to 12 cups','Push-to-grind control keeps the workflow deliberately simple'],
      watch:'This is a blade grinder with manual grind control, not an adjustable burr grinder. Shoppers dialling in espresso should compare burr-based alternatives first.',
      tags:['value','compact','blade','simple'],
      specs:[['Grinding mechanism','Stainless-steel blade'],['Adjustment','Manual push-to-grind'],['Bean hopper','90 g'],['Cup selector','Up to 12 cups'],['Dimensions','130 x 110 x 250 mm'],['Weight','1 kg'],['Voltage','220-240 V']],
      source:'https://www.delonghi.com/en-au/p/coffee-grinders-kg200-electric-coffee-and-spice-grinder/KG200.html',
      verifiedRetailers:[{retailer:"De'Longhi Australia",url:'https://www.delonghi.com/en-au/p/coffee-grinders-kg200-electric-coffee-and-spice-grinder/KG200.html',kind:'brand-direct',note:'Official Australian store; exact KG200 model page verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-COFFEE-GRINDERS-002',slug:'breville-the-smart-grinder-pro-bcg820',model:'BCG820BSS',brand:'Breville',name:'Breville the Smart Grinder Pro BCG820',
      summary:'A programmable conical-burr grinder with 60 settings and 0.2-second dosing adjustments for shoppers moving between espresso and filter workflows.',
      highlights:['60 grind settings from espresso through French press','Dosing iQ adjusts programmed grind time in 0.2-second increments','Grinds into a portafilter, grinds container or filter basket'],
      watch:'The broad feature set adds controls and bench footprint. Shoppers who prefer a simpler manual workflow may not need the display and programmable dosing system.',
      tags:['espresso','filter','all-purpose','dosing-control','premium'],
      specs:[['Model','BCG820BSS'],['Burrs','Stainless-steel conical burrs'],['Grind settings','60'],['Dose adjustment','0.2-second increments'],['Dimensions (W x D x H)','21.4 x 16 x 38.9 cm'],['Portafilter cradles','50-54 mm and 58 mm'],['Display','LCD']],
      source:'https://www.breville.com/en-au/product/bcg820?sku=BCG820BSS',
      verifiedRetailers:[{retailer:'Breville Australia',url:'https://www.breville.com/en-au/product/bcg820?sku=BCG820BSS',kind:'brand-direct',note:'Official Australian store; BCG820BSS exact variant verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-COFFEE-GRINDERS-003',slug:'baratza-encore-esp',model:'ZCG495',brand:'Baratza',name:'Baratza Encore ESP ZCG495',
      summary:'An espresso-capable 40 mm conical-burr grinder that dedicates settings 1-20 to higher-resolution espresso adjustment and 21-40 to filter, French press and cold brew.',
      highlights:['40 mm M2 conical steel burrs with quick-release mount','Dual-range 40-step adjustment with espresso-focused settings 1-20','300 g hopper and included dosing cup support home espresso workflows'],
      watch:'Adjustment remains stepped rather than stepless. Shoppers who want extremely fine continuous adjustment or timed electronic dosing should compare specialist alternatives.',
      tags:['espresso','filter','all-purpose','compact','maintenance'],
      specs:[['Model family','ZCG495'],['Burrs','40 mm M2 conical steel'],['Adjustment','40 steps; 1-20 espresso, 21-40 filter/coarser'],['Bean hopper','300 g'],['Grounds bin','120 g'],['Burr speed','550 RPM no-load'],['Grinding speed','1.3 g/s at setting 10 to 2.2 g/s at setting 30'],['Dimensions (W x D x H)','13 x 15 x 34 cm'],['Power','70 W, 220-240 V'],['Warranty','2 years manufacturer']],
      source:'https://www.baratza.com/en-au/product/encoretm-esp-zcg495',
      verifiedRetailers:[{retailer:'Baratza Australia',url:'https://www.baratza.com/en-au/product/encoretm-esp-zcg495',kind:'brand-direct',note:'Official Australian store; ZCG495 family page verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-COFFEE-GRINDERS-004',slug:'fellow-opus-conical-burr-grinder',model:'Opus',brand:'Fellow',name:'Fellow Opus Conical Burr Grinder',
      summary:'An all-purpose grinder sold through Fellow Coffee Australia with a 40 mm conical burr set and 41+ settings spanning espresso through cold brew.',
      highlights:['41+ settings across espresso, pour-over, drip, French press and cold brew','40 mm stainless-steel conical burr set','Official Australian store lists a two-year warranty and free-Australia-shipping pathway'],
      watch:'Opus uses an outer adjustment plus an inner range mechanism, so fine tuning is less immediately visible than on a single external stepped dial.',
      tags:['espresso','filter','all-purpose','design','dosing-control'],
      specs:[['Model','Opus Conical Burr Grinder'],['Burrs','40 mm stainless-steel conical'],['Grind settings','41+'],['Grind range','Espresso through cold brew'],['Body material','Plastic'],['Warranty','2 years on Australian store']],
      source:'https://fellowproducts.com.au/collections/new-arrivals/products/opus-coffee-grinder',
      verifiedRetailers:[{retailer:'Fellow Coffee Australia',url:'https://fellowproducts.com.au/collections/new-arrivals/products/opus-coffee-grinder',kind:'brand-direct',note:'Official Australian store; Opus product page verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-COFFEE-GRINDERS-005',slug:'sunbeam-grindfresh-coffee-grinder',model:'EM0440',brand:'Sunbeam',name:'Sunbeam GrindFresh Coffee Grinder EM0440',
      summary:'An Australian-designed conical-burr grinder with 25 settings, a 250 g hopper and direct-to-group-handle grinding for shoppers wanting a straightforward espresso-to-filter workflow.',
      highlights:['25 grind settings from filter coffee through espresso','Conical burr grinder with direct-to-handle workflow','250 g hopper and commercial/domestic group-handle locators'],
      watch:'The 25-step range is less granular than some espresso-focused rivals, and the manufacturer lists a 12-month replacement warranty.',
      tags:['espresso','filter','value','dosing-control','australian-designed'],
      specs:[['Model','EM0440'],['Grinder','Conical burr'],['Grind settings','25'],['Bean hopper','250 g'],['Dimensions','382 x 135 x 262 mm'],['Weight','2.4 kg'],['Warranty','12-month replacement'],['Design','Designed and engineered in Australia']],
      source:'https://www.sunbeam.com.au/sunbeam-grind-fresh',
      verifiedRetailers:[{retailer:'Myer',url:'https://www.myer.com.au/p/grindfresh-burr-grinder-em0440-129180430',kind:'retailer-direct',note:'Exact Sunbeam EM0440 Australian retailer page verified 17 Aug 2026; check current stock and price at retailer.'}]
    }
  ],
  ['coffee-machines','kettles','milk-frothers','water-filters','kitchen-scales']
);

const homePrinters=category(
  'home-printers','Home printers','Home Printers Australia',
  'Compare current Australian home printers by ink system, print speed, scan/copy capability, duplexing, paper handling, connectivity and ongoing refill format.',
  'printer',
  ['Ink tank versus cartridge running model','Print, scan, copy and fax needs','Duplex and paper handling','Wireless, mobile and wired connectivity'],
  ['ink-tank','all-in-one','home-office','duplex','value','high-yield'],
  [
    ['Ink tank or cartridge printer?','Ink tanks suit shoppers expecting higher print volumes and willing to pay more upfront; cartridge models can make more sense for lighter use where purchase cost and compactness matter more.'],
    ['Do I need an automatic document feeder?','An ADF matters when you regularly scan or copy multi-page documents. A flatbed-only printer is simpler but requires each page to be placed manually.'],
    ['Is automatic duplex worth prioritising?','If you frequently print documents, automatic two-sided printing reduces manual handling and paper use. It matters less for occasional single-page or photo printing.'],
    ['Why are current prices not used as recommendation scores?','Retail pricing changes quickly. APG separates product capability from current retailer offers so a temporary discount does not make an unsuitable printer rank higher.']
  ],
  [
    {
      id:'APG-AUTHORITY-HOME-PRINTERS-001',slug:'epson-ecotank-et-1910',model:'C11CL65501',brand:'Epson',name:'Epson EcoTank ET-1910',
      summary:'A current Australian refillable-tank print-only model for households that do not need scanning or copying and want a simple 100-sheet wireless EcoTank workflow.',
      highlights:['Current Epson Australia ET-1910 product code C11CL65501','11 ISO ppm black and 6 ISO ppm colour printing','Bundled 522 ink is rated by Epson for up to 3,600 black and 6,500 colour pages under its stated methodology'],
      watch:'This is a print-only model: there is no scanner, copier or automatic document feeder. Choose an all-in-one if digitising documents is part of the job.',
      tags:['ink-tank','value','high-yield','wireless','print-only'],
      specs:[['Product code','C11CL65501'],['Functions','Print'],['Maximum print resolution','5760 x 1440 dpi'],['ISO print speed','11 ppm black / 6 ppm colour'],['Paper input','100-sheet rear feed'],['Ink','Epson 522 bottles'],['Bundled ink yield','Up to 3,600 black / 6,500 colour pages (Epson methodology)'],['Connectivity','USB, Wi-Fi, Wi-Fi Direct'],['Stored dimensions','361 x 317 x 152 mm'],['Weight','3.1 kg']],
      source:'https://www.epson.com.au/products/printers-for-home/ecotank/ET-1910',
      verifiedRetailers:[{retailer:'Epson Australia',url:'https://www.epson.com.au/products/printers-for-home/ecotank/ET-1910/wtb',kind:'brand-direct',note:'Official Australian Shop Now / dealer page for exact ET-1910 verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-HOME-PRINTERS-002',slug:'epson-ecotank-et-2910',model:'C11CL62501',brand:'Epson',name:'Epson EcoTank ET-2910',
      summary:'A current Australian EcoTank all-in-one that adds flatbed scanning and copying to the ET-1910-class refillable tank and wireless print platform.',
      highlights:['Print, copy and flatbed scan functions','11 ISO ppm black and 6 ISO ppm colour printing','100-sheet rear feed, Wi-Fi and Wi-Fi Direct connectivity'],
      watch:'The ET-2910 does not add an automatic document feeder, so multi-page scanning is a page-by-page flatbed task. Office-heavy users should compare an ADF-equipped model.',
      tags:['ink-tank','all-in-one','high-yield','wireless','home'],
      specs:[['Product code','C11CL62501'],['Functions','Print, copy, scan'],['Maximum print resolution','5760 x 1440 dpi'],['ISO print speed','11 ppm black / 6 ppm colour'],['Scanner','Flatbed, 1200 x 2400 dpi'],['Paper input','100-sheet rear feed'],['Ink','Epson 522 bottles'],['Bundled ink yield','Up to 3,600 black / 6,500 colour pages (Epson methodology)'],['Connectivity','USB, Wi-Fi, Wi-Fi Direct'],['Stored dimensions','361 x 317 x 162 mm'],['Weight','4.1 kg']],
      source:'https://www.epson.com.au/products/printers-for-home/ecotank/ET-2910',
      verifiedRetailers:[{retailer:'Epson Australia',url:'https://www.epson.com.au/products/printers-for-home/ecotank/ET-2910/wtb',kind:'brand-direct',note:'Official Australian Shop Now / dealer page for exact ET-2910 verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-HOME-PRINTERS-003',slug:'canon-pixma-g3670-megatank',model:'G3670',brand:'Canon',name:'Canon PIXMA G3670 MegaTank',
      summary:'A refillable MegaTank 3-in-1 for Australian households prioritising high-yield ink, straightforward print/copy/scan capability and wireless/mobile printing.',
      highlights:['Print, copy and scan with refillable GI-61 ink bottles','11 ipm black and 6 ipm colour document speed','Canon states up to 6,000 black and 7,700 colour pages from the applicable high-yield ink setup'],
      watch:'There is no automatic document feeder or automatic duplex specification in the maintained G3670 data. Document-heavy home-office users should compare models built around those workflows.',
      tags:['ink-tank','all-in-one','high-yield','wireless','value'],
      specs:[['Model','G3670'],['Functions','Print, copy, scan'],['Print resolution','4800 x 1200 dpi'],['Document speed','11 ipm black / 6 ipm colour'],['Paper input','100 sheets plain paper'],['Ink','GI-61BK/C/M/Y bottles'],['Published ink yield','Up to 6,000 black / 7,700 colour pages'],['Display','1.35-inch LCD'],['Connectivity','Wi-Fi, Camera Direct, USB-B']],
      source:'https://www.canon.com.au/printers/pixma-g3670-megatank',
      verifiedRetailers:[{retailer:'Costco Australia',url:'https://www.costco.com.au/c/Canon-PIXMA-G3670-MegaTank/p/262147',kind:'retailer-direct',note:'Exact Canon G3670 Australian retailer page verified 17 Aug 2026; membership, stock and price conditions can change.'}]
    },
    {
      id:'APG-AUTHORITY-HOME-PRINTERS-004',slug:'canon-pixma-ts7760',model:'TS7760',brand:'Canon',name:'Canon PIXMA TS7760 HOME',
      summary:'A cartridge-based wireless 3-in-1 with automatic duplexing, a 2.7-inch touchscreen and two-way paper feeding for lower-volume home printing where convenience matters.',
      highlights:['15 ipm black and 10 ipm colour document printing','Automatic duplex plus rear and cassette paper feeds','2.7-inch colour touch LCD and Wi-Fi connectivity'],
      watch:'It uses PG-585/CL-586 cartridges rather than refillable tanks. Households with heavy page volumes should compare total ink economics against tank models.',
      tags:['all-in-one','duplex','wireless','home','compact'],
      specs:[['Model','TS7760'],['Functions','Print, copy, scan'],['Document speed','15 ipm black / 10 ipm colour'],['Automatic duplex','Yes'],['Paper input','Rear: 100 plain sheets; cassette: 100 plain sheets'],['Display','2.7-inch colour touch LCD'],['Ink','PG-585 black / CL-586 colour'],['Connectivity','Wi-Fi, USB-B'],['Manufacturer warranty','2 years']],
      source:'https://www.canon.com.au/printers/pixma-ts7760',
      verifiedRetailers:[{retailer:'Harvey Norman',url:'https://www.harveynorman.com.au/canon-home-pixma-ts7760-printer.html',kind:'retailer-direct',note:'Exact Canon TS7760 Australian retailer page verified 17 Aug 2026; check current stock and price at retailer.'}]
    },
    {
      id:'APG-AUTHORITY-HOME-PRINTERS-005',slug:'brother-mfc-j4440dw',model:'MFC-J4440DW',brand:'Brother',name:'Brother MFC-J4440DW INKvestment',
      summary:'A home-office-oriented multifunction inkjet with print, scan, copy and fax, a 20-sheet ADF, automatic duplex printing and Ethernet/NFC alongside wireless connectivity.',
      highlights:['20 ipm mono and 19 ipm colour print speeds','20-sheet automatic document feeder and up to 150-sheet paper capacity','Wi-Fi, Wi-Fi Direct, NFC, Ethernet and USB connectivity'],
      watch:'This is physically and functionally more office-oriented than a basic home printer. Shoppers who rarely scan batches or use wired networking may be paying for capability they do not need.',
      tags:['home-office','all-in-one','duplex','adf','connectivity'],
      specs:[['Model','MFC-J4440DW'],['Functions','Print, scan, copy, fax'],['Print speed','20 ipm mono / 19 ipm colour'],['Duplex print speed','Up to 11 ipm mono / 10 ipm colour'],['ADF','20 sheets'],['Paper capacity','Up to 150 sheets'],['Connectivity','Wi-Fi, Wi-Fi Direct, NFC, Ethernet, USB'],['Dimensions (W x D x H)','435 x 360 x 180 mm'],['Weight','8.8 kg'],['Warranty','2-year Return to Base']],
      source:'https://www.brother.com.au/en/printers/all-printers/mfc-j4440dw',
      verifiedRetailers:[{retailer:'Brother Australia',url:'https://www.brother.com.au/en/printers/all-printers/mfc-j4440dw',kind:'brand-direct',note:'Official Australian exact MFC-J4440DW commerce page verified 17 Aug 2026.'}]
    }
  ],
  ['document-scanners','laptops','usb-c-hubs-docks','external-ssds','office-chairs']
);

const pizzaOvens=category(
  'pizza-ovens','Pizza ovens','Pizza Ovens Australia',
  'Compare pizza ovens available to Australian shoppers by fuel, maximum temperature, pizza size, preheat/cook workflow, portability, electrical requirements and outdoor-use constraints.',
  'pizza',
  ['Gas, electric or optional wood-fuel workflow','Maximum temperature and pizza size','Portability, footprint and storage','Outdoor-only versus benchtop installation'],
  ['gas','electric','portable','high-heat','large-pizza','multi-purpose'],
  [
    ['Gas or electric pizza oven?','Gas models prioritise fast outdoor high-heat control and need a compatible gas bottle. Electric models trade live flame for plug-in control and can suit shoppers who want preset or multi-purpose cooking.'],
    ['Does 500°C automatically mean a better pizza oven?','No. Maximum temperature is one input. Stone recovery, burner pattern, opening size, control, insulation and the pizza style you cook also affect the workflow.'],
    ['Can these ovens be used indoors?','Do not infer indoor suitability from size. Follow the exact manufacturer installation and use instructions for the model. Several high-heat gas models in this set are intended for outdoor domestic use.'],
    ['Why does APG show both product evidence and retailers?','The manufacturer source establishes the model and specifications. Retailer links are availability pathways only and contribute zero points to suitability.']
  ],
  [
    {
      id:'APG-AUTHORITY-PIZZA-OVENS-001',slug:'ooni-koda-12',model:'Koda 12',brand:'Ooni',name:'Ooni Koda 12',
      summary:'A compact LPG outdoor pizza oven for up to 12-inch pizzas, with a 9.2 kg-class body and a manufacturer-stated peak of 500°C.',
      highlights:['12-inch gas-powered outdoor format','Manufacturer states up to 500°C and a roughly 15-minute high-heat preheat','Foldable legs and 9.2 kg listed unboxed weight support portability'],
      watch:'The Australian model is designed for LPG-compatible standard gas bottles and is not suitable for natural-gas connection or conversion. It is a smaller 12-inch cooking platform.',
      tags:['gas','portable','high-heat','compact','outdoor'],
      specs:[['Model','Koda 12'],['Fuel','LPG gas'],['Maximum temperature','500°C'],['Pizza size','Up to 12 inches'],['Unboxed dimensions','62 x 39 x 29 cm'],['Unboxed weight','9.2 kg'],['Cordierite stone','10 mm'],['Installation note','Not suitable for natural-gas connection/conversion']],
      source:'https://au.ooni.com/products/ooni-koda',
      verifiedRetailers:[{retailer:'Ooni Australia',url:'https://au.ooni.com/products/ooni-koda',kind:'brand-direct',note:'Official Australian exact Koda 12 store page verified 17 Aug 2026; current stock and price can change.'}]
    },
    {
      id:'APG-AUTHORITY-PIZZA-OVENS-002',slug:'ooni-koda-16',model:'Koda 16',brand:'Ooni',name:'Ooni Koda 16',
      summary:'A larger LPG outdoor Ooni with a 16-inch cooking area, L-shaped burner and 15 mm cordierite stone for shoppers who value space over the Koda 12’s portability.',
      highlights:['Up to 16-inch pizza capacity','L-shaped gas burner designed to spread heat around the larger cooking area','Manufacturer states up to 500°C with an 18.2 kg unboxed weight'],
      watch:'It is substantially larger and heavier than the Koda 12 and the Australian model is LPG-only, not natural-gas convertible. Check current availability before planning a purchase.',
      tags:['gas','large-pizza','high-heat','outdoor','hosting'],
      specs:[['Model','Koda 16'],['Fuel','LPG gas'],['Maximum temperature','500°C'],['Pizza size','Up to 16 inches'],['Burner','L-shaped'],['Unboxed dimensions','63 x 58 x 37 cm'],['Unboxed weight','18.2 kg'],['Cordierite stone','15 mm'],['Installation note','Not suitable for natural-gas connection/conversion']],
      source:'https://au.ooni.com/collections/ovens/products/ooni-koda-16',
      verifiedRetailers:[{retailer:'Ooni Australia',url:'https://au.ooni.com/collections/ovens/products/ooni-koda-16',kind:'brand-direct',note:'Official Australian exact Koda 16 store page verified 17 Aug 2026; retailer availability can change.'}]
    },
    {
      id:'APG-AUTHORITY-PIZZA-OVENS-003',slug:'gozney-roccbox',model:'Roccbox',brand:'Gozney',name:'Gozney Roccbox',
      summary:'A portable 12-inch stone-floor outdoor oven supplied with a propane burner, with an optional wood burner and dense insulation for repeated high-heat cooking.',
      highlights:['12-inch stone-floor portable format','Propane burner supplied; optional detachable wood burner supports dual-fuel use','Manufacturer states temperatures up to 500°C and an extended five-year warranty after eligible registration'],
      watch:'The oven weighs just under 20 kg before packaging, so “portable” still means a meaningful lift. The Australian product is certified for domestic outdoor use.',
      tags:['gas','portable','multi-fuel-option','high-heat','outdoor'],
      specs:[['Model','Roccbox'],['Fuel','Propane supplied; optional wood burner'],['Maximum temperature','Up to 500°C'],['Pizza size','Up to 12 inches'],['Assembled dimensions','473 H x 413 W x 540 D mm'],['Unboxed weight','Just under 20 kg'],['Oven stone','310 W x 340 D mm'],['Warranty','1 year standard; up to 5 years after eligible registration'],['Use classification (AU/NZ)','Domestic outdoors']],
      source:'https://au.gozney.com/products/roccbox',
      evidenceSources:[{label:'Gozney AU Roccbox dimensions',url:'https://help.gozney.com/hc/en-au/articles/4463368463249-What-are-the-dimensions-of-Roccbox'},{label:'Gozney AU/NZ certification guidance',url:'https://help.gozney.com/hc/en-au/articles/40219486870929-What-certification-do-your-products-hold'}],
      verifiedRetailers:[{retailer:'Gozney Australia',url:'https://au.gozney.com/products/roccbox',kind:'brand-direct',note:'Official Australian exact Roccbox store page verified 17 Aug 2026; page availability can change.'}]
    },
    {
      id:'APG-AUTHORITY-PIZZA-OVENS-004',slug:'breville-smart-oven-pizzaiolo-bpz820',model:'BPZ820BSS4JAN1',brand:'Breville',name:'Breville the Smart Oven Pizzaiolo BPZ820',
      summary:'A 240 V benchtop electric pizza oven that reaches 400°C, accommodates a 30 cm pizza and combines seven presets with a manual heat-control mode.',
      highlights:['Electric benchtop format reaches 400°C','Seven presets plus manual mode for deck/top heat control','30 cm pizza capacity with included pizza peel and pan'],
      watch:'It is an indoor benchtop-style electric appliance rather than a portable gas oven, and its 30 cm pizza capacity is smaller than 16-inch outdoor models.',
      tags:['electric','benchtop','dosing-control','high-heat','indoor'],
      specs:[['Model','BPZ820BSS4JAN1'],['Fuel / power','Electric, 240 V'],['Maximum temperature','400°C'],['Pizza capacity','30 cm'],['Settings','7 presets plus Manual Mode'],['Dimensions (W x D x H)','47.2 x 46.5 x 27.3 cm'],['Power','1735-2065 W'],['Construction','Stainless steel'],['Warranty','2-year replacement']],
      source:'https://www.breville.com/en-au/product/bpz820?sku=BPZ820BSS4JAN1',
      verifiedRetailers:[{retailer:'Breville Australia',url:'https://www.breville.com/en-au/product/bpz820?sku=BPZ820BSS4JAN1',kind:'brand-direct',note:'Official Australian store; BPZ820BSS4JAN1 exact variant verified 17 Aug 2026.'}]
    },
    {
      id:'APG-AUTHORITY-PIZZA-OVENS-005',slug:'ninja-woodfire-outdoor-oven',model:'OO101',brand:'Ninja',name:'Ninja Woodfire Outdoor Oven OO101',
      summary:'An electric outdoor oven with eight cooking functions, 25-370°C control and a pellet smoke box for shoppers who want pizza plus roasting, smoking and dehydrating from one appliance.',
      highlights:['Eight cooking functions including Pizza, Smoker, Bake and Dehydrate','25-370°C electric temperature range with integrated pellet smoke box','Fits a 30 cm pizza and includes pizza stone, peel, Pro-Heat pan and roast rack'],
      watch:'Its 370°C ceiling is lower than the 400-500°C specialist ovens in this set. Choose it for multi-purpose outdoor cooking rather than assuming the broader function list makes it the strongest pure pizza specialist.',
      tags:['electric','multi-purpose','outdoor','smoking','value'],
      specs:[['Model','OO101'],['Power','1760 W electric'],['Temperature range','25-370°C'],['Functions','Pizza, Max Roast, Gourmet Roast, Top Heat, Bake, Smoker, Dehydrate, Keep Warm'],['Pizza settings','Artisan, Thin Crust, New York, Deep Pan, Calzone'],['Pizza capacity','30 cm'],['Dimensions','54.6 D x 45.7 W x 38.4 H cm'],['Weight','14.7 kg'],['Cord length','1.4 m'],['Warranty','2 years']],
      source:'https://ninjakitchen.com.au/collections/kitchen-appliances/products/ninja-woodfire-outdoor-oven',
      verifiedRetailers:[{retailer:'Ninja Kitchen Australia',url:'https://ninjakitchen.com.au/collections/kitchen-appliances/products/ninja-woodfire-outdoor-oven',kind:'brand-direct',note:'Official Australian exact OO101 store page verified 17 Aug 2026; current stock and price can change.'}]
    }
  ],
  ['air-fryers','portable-fridges','bread-makers','kitchen-mixers','microwave-ovens']
);

const categories={
  'coffee-grinders':coffeeGrinders,
  'home-printers':homePrinters,
  'pizza-ovens':pizzaOvens
};

module.exports={categories,CHECKED,NEXT_REVIEW};
