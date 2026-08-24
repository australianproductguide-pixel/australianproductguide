'use strict';

const VERSION='action4-decision-evidence-v96';
const SCHEMA_VERSION='category-decision-schema-v2';
const DEPTH_STANDARD_VERSION='evidence-depth-standard-v2';
const VERIFIED_AT='2026-08-24';

const ENTITY_STATUS=Object.freeze({
  CURRENT:'CURRENT',SUPERSEDED:'SUPERSEDED',REPLACEMENT_REQUIRED:'REPLACEMENT_REQUIRED',HISTORICAL:'HISTORICAL',DISCONTINUED:'DISCONTINUED',REGIONAL_MISMATCH:'REGIONAL_MISMATCH',GENERATION_AMBIGUOUS:'GENERATION_AMBIGUOUS',VARIANT_AMBIGUOUS:'VARIANT_AMBIGUOUS',UNVERIFIED:'UNVERIFIED'
});
const RECOMMENDATION_ELIGIBILITY=Object.freeze({
  CURRENT_RECOMMENDABLE:'CURRENT_RECOMMENDABLE',CURRENT_NICHE:'CURRENT_NICHE',SUPERSEDED_NOT_PRIMARY:'SUPERSEDED_NOT_PRIMARY',HISTORICAL:'HISTORICAL',ENTITY_UNVERIFIED_EXCLUDE:'ENTITY_UNVERIFIED_EXCLUDE'
});
const CURRENTNESS=Object.freeze({CURRENT_VERIFIED:'CURRENT_VERIFIED',CURRENT_REVIEW_DUE:'CURRENT_REVIEW_DUE',HISTORICAL:'HISTORICAL',SUPERSEDED:'SUPERSEDED',CONFLICTING:'CONFLICTING',UNVERIFIED:'UNVERIFIED'});
const CONFIDENCE=Object.freeze({HIGH:'high',MEDIUM:'medium',LOW:'low',UNKNOWN:'unknown'});
const CONTROLLED_SCALE=Object.freeze({excellent:1,strong:.8,average:.5,limited:.25,poor:0,unknown:null});

function criterion(key,label,type,scale,evidenceRequirement,opts={}){
  return {key,label,type,scale,evidenceRequirement,usedByEngine:opts.usedByEngine!==false,aliases:opts.aliases||[],factKeys:opts.factKeys||[],interpretationRule:opts.interpretationRule||null,explanationRule:opts.explanationRule||'Only describe a ranking effect when trace evidence is known and the score contribution is non-zero.'};
}

const categorySchemas={
  'wireless-headphones':{
    label:'Wireless headphones',
    criteria:[
      criterion('anc-quality','ANC quality','decision','excellent|strong|average|limited|poor|unknown','Independent exact-model performance evidence; manufacturer ANC support alone is insufficient for a quality tier.',{aliases:['anc','noise cancelling','noise canceling']}),
      criterion('comfort','Long-wear comfort','decision','excellent|strong|average|limited|poor|unknown','Two credible independent exact-model observations where practical; conflicting observations lower confidence.',{aliases:['comfort','comfortable','long wear','long-wear']}),
      criterion('travel','Travel suitability','decision','excellent|strong|average|limited|poor|unknown','Rule-derived only from maintained exact-model ANC, battery, weight, wired/fold/case evidence; unknown inputs remain unknown.',{aliases:['travel','flight','flying','commute'],interpretationRule:'Strong requires maintained ANC plus >=20 h stated battery and at least one portability/wired signal.'}),
      criterion('battery-hours','Battery life','fact','hours','Exact-model manufacturer/manual source.',{aliases:['battery'],factKeys:['spec_battery']}),
      criterion('weight-g','Weight','fact','grams','Exact-model manufacturer/manual source.',{usedByEngine:false,factKeys:['spec_weight']}),
      criterion('microphone-quality','Microphone/call quality','decision','excellent|strong|average|limited|poor|unknown','Credible independent exact-model assessment; manufacturer microphone presence is not quality evidence.',{usedByEngine:false}),
      criterion('codec-support','Codec support','fact','controlled list','Exact-model manufacturer/manual/support source.',{usedByEngine:false}),
      criterion('multipoint','Multipoint','fact','boolean/devices','Exact-model manufacturer/manual/support source.',{usedByEngine:false,factKeys:['spec_multipoint']}),
      criterion('wired-mode','Wired mode','fact','boolean','Exact-model manufacturer/manual/support source.',{usedByEngine:false,factKeys:['spec_audio_cable']}),
      criterion('usb-audio','USB audio','fact','boolean','Exact-model manufacturer/manual/support source.',{usedByEngine:false,factKeys:['spec_usb_audio']}),
      criterion('foldability','Foldability','fact','boolean','Exact-model manufacturer/manual/product source.',{usedByEngine:false}),
      criterion('case','Protective case','fact','boolean/type','Exact-model manufacturer/manual/product source.',{usedByEngine:false}),
      criterion('office','Office suitability','decision','excellent|strong|average|limited|poor|unknown','Derived from maintained ANC, comfort and multipoint evidence; unknown inputs remain unknown.',{usedByEngine:false}),
      criterion('exercise','Exercise suitability','decision','excellent|strong|average|limited|poor|unknown','Independent fit/stability evidence plus ingress protection where relevant.',{usedByEngine:false}),
      criterion('ecosystem','Platform/ecosystem fit','decision','controlled','Exact feature compatibility from manufacturer/support documentation.',{usedByEngine:false})
    ],
    strongDepthRequired:['anc-quality','comfort','battery-hours','travel']
  },
  'robot-vacuums':{
    label:'Robot vacuums',
    criteria:[
      criterion('pet-hair','Pet-hair suitability','decision','excellent|strong|average|limited|poor|unknown','Exact-model maintained evidence; independent cleaning evidence preferred for performance claims.',{aliases:['pets','pet hair'],factKeys:['petHairSignal']}),
      criterion('hard-floor','Hard-floor suitability','decision','excellent|strong|average|limited|poor|unknown','Exact-model cleaning system evidence; independent performance evidence preferred.',{aliases:['hard floor','hard floors']}),
      criterion('obstacle-avoidance','Obstacle avoidance','decision','excellent|strong|average|limited|poor|unknown','Exact-model documented avoidance/object-recognition capability; quality claims require independent evidence.',{aliases:['obstacle','obstacle avoidance'],factKeys:['obstacleAvoidanceSignal']}),
      criterion('mopping','Mopping','decision','excellent|strong|average|limited|poor|unknown','Exact-model maintained mopping evidence; quality tier requires mechanism/performance evidence.',{aliases:['mopping','mop'],factKeys:['mopping']}),
      criterion('dock-automation','Dock automation','decision','excellent|strong|average|limited|poor|unknown','Exact-model dock empty/wash/dry capability.',{aliases:['low-maintenance','low maintenance','hands off'],factKeys:['automatedDockSignal']}),
      criterion('mapping','Mapping/navigation','decision','controlled','Exact-model manufacturer/manual plus independent evidence for quality claims.',{usedByEngine:false}),
      criterion('multi-floor','Multi-floor mapping','fact','boolean','Exact-model manufacturer/app documentation.',{usedByEngine:false}),
      criterion('mop-lifting','Mop lifting','fact','boolean','Exact-model manufacturer/manual.',{usedByEngine:false}),
      criterion('edge-cleaning','Edge cleaning','decision','controlled','Exact-model mechanism plus credible performance evidence.',{usedByEngine:false}),
      criterion('furniture-clearance','Furniture clearance','fact','mm','Exact product dimensions.',{usedByEngine:false}),
      criterion('maintenance-burden','Maintenance burden','decision','excellent|strong|average|limited|poor|unknown','Derived from dock, brush, consumable and cleaning requirements.',{usedByEngine:false}),
      criterion('app-ecosystem','App/ecosystem','decision','controlled','Exact current app/platform support.',{usedByEngine:false})
    ],
    strongDepthRequired:['pet-hair','obstacle-avoidance','mopping','dock-automation']
  },
  'laptops':{
    label:'Laptops',
    criteria:[
      criterion('portable','Portability','decision','excellent|strong|average|limited|poor|unknown','Derived from exact weight/dimensions and maintained portability evidence.',{aliases:['portable','lightweight'],factKeys:['portableSignal']}),
      criterion('gaming','Gaming fit','decision','excellent|strong|average|limited|poor|unknown','Exact CPU/GPU/display evidence; do not infer from marketing family alone.',{aliases:['gaming','gamer'],factKeys:['gamingSignal']}),
      criterion('university','University fit','decision','excellent|strong|average|limited|poor|unknown','Derived from battery, weight, platform and general productivity evidence.',{aliases:['university','uni','student']}),
      criterion('office','Office fit','decision','excellent|strong|average|limited|poor|unknown','Derived from battery, webcam, ports, keyboard and portability evidence.',{usedByEngine:false}),
      criterion('creative','Creative-work fit','decision','excellent|strong|average|limited|poor|unknown','Exact CPU/GPU/memory/display evidence.',{usedByEngine:false,factKeys:['creatorSignal']}),
      criterion('memory','Memory','fact','GB','Exact Australian configuration.',{usedByEngine:false}),
      criterion('storage','Storage','fact','GB/TB','Exact Australian configuration.',{usedByEngine:false}),
      criterion('display','Display','fact','size/resolution/panel/brightness','Exact Australian configuration.',{usedByEngine:false,factKeys:['displaySizeInches']}),
      criterion('battery','Battery','fact','Wh/hours','Exact model manufacturer claim; use proportional wording.',{aliases:['battery']}),
      criterion('ports','Ports','fact','controlled list','Exact Australian configuration.',{usedByEngine:false}),
      criterion('upgradeability','Upgradeability','fact','controlled','Manual/support/teardown evidence.',{usedByEngine:false}),
      criterion('repairability','Repairability','decision','controlled','Reliable support/repairability evidence only.',{usedByEngine:false})
    ],
    strongDepthRequired:['portable','battery','memory','storage']
  },
  'coffee-machines':{
    label:'Coffee machines',
    criteria:[
      criterion('beginner','Beginner workflow','decision','excellent|strong|average|limited|poor|unknown','Derived from documented workflow/automation; not from marketing category alone.',{aliases:['beginner','easy','simple'],factKeys:['workflow','learningCurve']}),
      criterion('hands-on','Manual control','decision','excellent|strong|average|limited|poor|unknown','Derived from documented workflow/manual control.',{aliases:['hands-on','hands on','manual control'],factKeys:['workflow']}),
      criterion('milk','Milk workflow','decision','excellent|strong|average|limited|poor|unknown','Exact milk-system evidence; quality claims require stronger evidence.',{aliases:['milk','latte','flat white','cappuccino'],factKeys:['milkSystem']}),
      criterion('cold','Cold-drink capability','fact','boolean','Exact-model manufacturer/manual.',{aliases:['cold','cold coffee','iced coffee','cold brew'],factKeys:['coldCoffee']}),
      criterion('compact','Footprint','decision','excellent|strong|average|limited|poor|unknown','Derived from exact dimensions.',{aliases:['compact','small space'],factKeys:['widthMm','depthMm']}),
      criterion('grinder','Integrated grinder','fact','boolean/adjustment','Exact-model manufacturer/manual.',{usedByEngine:false}),
      criterion('heat-up','Heat-up time','fact','seconds','Exact-model manufacturer/manual.',{usedByEngine:false}),
      criterion('temperature-control','Temperature control','fact','controlled','Exact-model manufacturer/manual.',{usedByEngine:false}),
      criterion('cleaning','Cleaning burden','decision','excellent|strong|average|limited|poor|unknown','Documented cleaning/descaling workflow; ownership interpretation must be explicit.',{usedByEngine:false}),
      criterion('household','Household suitability','decision','controlled','Derived from workflow, tank, drink throughput and milk system.',{usedByEngine:false})
    ],
    strongDepthRequired:['beginner','hands-on','milk','cleaning']
  },
  'televisions':{
    label:'Televisions',
    criteria:[
      criterion('bright-room','Bright-room suitability','decision','excellent|strong|average|limited|poor|unknown','Exact brightness/reflection/ambient-light evidence.',{aliases:['bright-room','bright room','bright living room'],factKeys:['brightRoomSignal','peakBrightnessNits','antiReflection']}),
      criterion('sport','Sport/motion suitability','decision','excellent|strong|average|limited|poor|unknown','Exact refresh/motion evidence.',{aliases:['sport','sports','motion'],factKeys:['sportSignal','refreshHz']}),
      criterion('high-refresh','High refresh','fact','Hz','Exact-model manufacturer specification.',{aliases:['high-refresh','120hz','144hz','165hz'],factKeys:['refreshHz']}),
      criterion('gaming','Gaming fit','decision','excellent|strong|average|limited|poor|unknown','Exact refresh/VRR/HDMI evidence.',{aliases:['gaming','gamer'],factKeys:['gamingSignal','refreshHz']}),
      criterion('streaming','Streaming fit','decision','excellent|strong|average|limited|poor|unknown','Exact platform/app support.',{aliases:['streaming','netflix'],factKeys:['streamingSignal']}),
      criterion('panel','Panel class','fact','controlled','Exact-model manufacturer specification.',{usedByEngine:false,factKeys:['panelClass']}),
      criterion('screen-size','Screen size','fact','inches','Exact-model manufacturer specification.',{usedByEngine:false,factKeys:['screenSizeInches']})
    ],
    strongDepthRequired:['bright-room','sport','streaming','screen-size']
  }
};

// Subjective signals are deliberately sparse. Unknown is preferable to guessing.
// Each maintained record below is exact-generation bound and carries multiple independent sources where available.
const independentDecisionEvidence={
  'bose-quietcomfort-ultra-headphones':{
    comfort:{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[
      {url:'https://www.rtings.com/headphones/reviews/bose/quietcomfort-ultra-headphones-wireless',title:'RTINGS Bose QuietComfort Ultra Headphones Wireless review',type:'credible-independent',scope:'original-generation'},
      {url:'https://www.soundguys.com/bose-quietcomfort-headphones-review-103901/',title:'SoundGuys Bose QuietComfort Ultra Headphones review',type:'credible-independent',scope:'original-generation'}
    ],note:'Both independent sources describe the original-generation maintained model as very/extremely comfortable for extended wear; APG normalises this to excellent without claiming universal fit.'},
    'anc-quality':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[
      {url:'https://www.rtings.com/headphones/reviews/bose/quietcomfort-ultra-headphones-wireless',title:'RTINGS Bose QuietComfort Ultra Headphones Wireless review',type:'credible-independent',scope:'original-generation'},
      {url:'https://www.soundguys.com/bose-quietcomfort-headphones-review-103901/',title:'SoundGuys Bose QuietComfort Ultra Headphones review',type:'credible-independent',scope:'original-generation'}
    ],note:'Independent evidence consistently supports a top-tier ANC signal for the original maintained generation.'}
  },
  'sony-wh-1000xm6':{
    comfort:{value:'average',confidence:'medium',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[
      {url:'https://www.rtings.com/headphones/reviews/sony/wh-1000xm6',title:'RTINGS Sony WH-1000XM6 review',type:'credible-independent',scope:'exact-model'},
      {url:'https://www.soundguys.com/sony-wh-1000xm6-vs-bose-quietcomfort-ultra-headphones-137869/',title:'SoundGuys Sony WH-1000XM6 vs Bose QuietComfort Ultra',type:'credible-independent',scope:'exact-model'}
    ],note:'Sources differ: RTINGS reports a comfortable lightweight fit, while SoundGuys identifies shallower padding/ear-contact disadvantages versus Bose. APG records the conflict conservatively as average with medium confidence.'},
    'anc-quality':{value:'excellent',confidence:'high',currentness:'CURRENT_VERIFIED',market:'GLOBAL_SAME_PRODUCT',verifiedAt:VERIFIED_AT,sources:[
      {url:'https://www.rtings.com/headphones/reviews/sony/wh-1000xm6',title:'RTINGS Sony WH-1000XM6 review',type:'credible-independent',scope:'exact-model'},
      {url:'https://www.soundguys.com/sony-wh-1000xm6-vs-bose-quietcomfort-ultra-headphones-137869/',title:'SoundGuys Sony WH-1000XM6 vs Bose QuietComfort Ultra',type:'credible-independent',scope:'exact-model'}
    ],note:'Independent evidence supports a top-tier ANC signal; exact use conditions still affect performance.'}
  }
};

const entityCorrections=[
  {slug:'meross-mini-smart-wi-fi-plug',status:ENTITY_STATUS.REPLACEMENT_REQUIRED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'exact-model-not-bound',resolution:'OPEN',note:'Current Australian evidence exposes MSS315-AU/MSS305-AU variants; do not guess which replaces the maintained generic entity.'},
  {slug:'meross-smart-wi-fi-plug-4-pack',status:ENTITY_STATUS.VARIANT_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'pack-sku-not-bound',resolution:'OPEN',note:'No exact current Australian 4-pack SKU is established.'},
  {slug:'esr-qi2-3-in-1-travel-wireless-charging-set',status:ENTITY_STATUS.VARIANT_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'au-plug-variant-not-bound',resolution:'OPEN'},
  {slug:'chipolo-one-point',status:ENTITY_STATUS.DISCONTINUED,eligibility:RECOMMENDATION_ELIGIBILITY.SUPERSEDED_NOT_PRIMARY,issueType:'discontinued',resolution:'RESOLVED_BY_LIFECYCLE_STATUS',note:'Manufacturer states ONE Point was discontinued in 2025; retained only for historical/search value.'},
  {slug:'polaroid-now-generation-2',status:ENTITY_STATUS.SUPERSEDED,eligibility:RECOMMENDATION_ELIGIBILITY.SUPERSEDED_NOT_PRIMARY,issueType:'superseded-generation',resolution:'RESOLVED_BY_LIFECYCLE_STATUS'},
  {slug:'breville-the-kitchen-wizz-8-bfp580',status:ENTITY_STATUS.DISCONTINUED,eligibility:RECOMMENDATION_ELIGIBILITY.HISTORICAL,issueType:'manufacturer-discontinued',resolution:'RESOLVED_BY_LIFECYCLE_STATUS'},
  {slug:'breville-the-kitchen-wizz-15-pro-bfp800',status:ENTITY_STATUS.DISCONTINUED,eligibility:RECOMMENDATION_ELIGIBILITY.HISTORICAL,issueType:'manufacturer-discontinued',resolution:'RESOLVED_BY_LIFECYCLE_STATUS'},
  {slug:'remington-shine-therapy-s8500au',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'currentness-unverified',resolution:'OPEN'},
  {slug:'therabody-theragun-mini',status:ENTITY_STATUS.GENERATION_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'generation-not-bound',resolution:'OPEN',note:'Current manufacturer product is generation-specific; generic entity must not inherit current-generation specifications.'},
  {slug:'therabody-theragun-prime',status:ENTITY_STATUS.GENERATION_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'generation-not-bound',resolution:'OPEN'},
  {slug:'philips-5000-series-handheld-steamer-sth5030-80',correctedSlug:'philips-5000-series-handheld-steamer-sth5030-20',status:ENTITY_STATUS.CURRENT,eligibility:RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE,issueType:'regional-model-correction',resolution:'RESOLVED_IN_V85',note:'Corrected to exact Philips Australia STH5030/20 with legacy redirect retained.'},
  {slug:'russell-hobbs-steam-genie-handheld-garment-steamer',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'exact-au-product-not-established',resolution:'OPEN'},
  {slug:'steamery-cirrus-3-iron-steamer',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'official-source-not-established',resolution:'OPEN'},
  {slug:'philips-beardtrimmer-series-5000-bt5515-15',status:ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'au-model-mismatch',resolution:'OPEN'},
  {slug:'braun-beard-trimmer-series-7-bt7420',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'lifecycle-currentness-unverified',resolution:'OPEN'},
  {slug:'wahl-stainless-steel-lithium-ion-beard-trimmer',status:ENTITY_STATUS.VARIANT_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'exact-model-not-bound',resolution:'OPEN'},
  {slug:'remington-style-series-b5-beard-trimmer',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'currentness-unverified',resolution:'OPEN'},
  {slug:'waterpik-cordless-advanced-water-flosser',status:ENTITY_STATUS.GENERATION_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'generation-model-not-bound',resolution:'OPEN'},
  {slug:'waterpik-aquarius-wp-660-water-flosser',status:ENTITY_STATUS.VARIANT_AMBIGUOUS,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'family-model-naming-ambiguous',resolution:'OPEN'},
  {slug:'oral-b-aquacare-4-water-flosser',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'exact-current-product-not-established',resolution:'OPEN'},
  {slug:'panasonic-ew1511-water-flosser',status:ENTITY_STATUS.SUPERSEDED,eligibility:RECOMMENDATION_ELIGIBILITY.SUPERSEDED_NOT_PRIMARY,issueType:'archived-superseded',resolution:'RESOLVED_BY_LIFECYCLE_STATUS'},
  {slug:'anker-solix-c300',status:ENTITY_STATUS.REGIONAL_MISMATCH,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'au-market-binding-unverified',resolution:'OPEN'},
  {slug:'keychron-k2-pro',status:ENTITY_STATUS.HISTORICAL,eligibility:RECOMMENDATION_ELIGIBILITY.HISTORICAL,issueType:'no-longer-current-sale',resolution:'RESOLVED_BY_LIFECYCLE_STATUS'},
  {slug:'audio-technica-atr2100x-usb',status:ENTITY_STATUS.UNVERIFIED,eligibility:RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,issueType:'au-lifecycle-binding-unverified',resolution:'OPEN'}
];

const demandPriorityPolicy={
  version:'action4-enrichment-priority-v1',
  weights:{consumerDemand:30,searchOpportunity:25,decisionUsage:20,evidenceDebt:15,entityRisk:10,commercialReadiness:0},
  missingDataRule:'A missing measured input is NOT_YET_MEASURED and is not silently converted to zero or inferred from affiliate value.',
  rationale:'Consumer demand, Search opportunity and actual decision usage dominate. Evidence debt and entity integrity then determine research urgency. Commercial/affiliate economics contribute zero until a future governance-approved model demonstrates consumer-value relevance without recommendation bias.',
  certifiedMeasurementContext:{ga4:'53 active users / 135 sessions / 83 engaged sessions over the 28-day Action 2 baseline ending 2026-08-22',searchConsole:'14 clicks / 928 impressions / 1.51% CTR / average position 40.84 for 2026-07-26 to 2026-08-22',perCategoryGa4:'NOT_YET_MEASURED',perCategoryScout:'NOT_YET_MEASURED',perCategoryDecisionLab:'NOT_YET_MEASURED',perCategoryComparison:'NOT_YET_MEASURED'},
  firstWave:[
    {category:'wireless-headphones',tier:'P1',why:'Live P1 comfort trace defect plus complete strong-depth source base makes criterion-parity remediation immediately testable.'},
    {category:'robot-vacuums',tier:'P1',why:'Only 4/9 products meet legacy strong depth and the category has high decision complexity around pets, hard floors, obstacles and dock automation.'},
    {category:'laptops',tier:'P1',why:'100% legacy strong depth but category-specific university/portability/performance reasoning is more decision-critical than generic specification count.'},
    {category:'coffee-machines',tier:'P1',why:'100% legacy strong depth but ownership workflow, beginner fit, milk workflow and cleaning burden drive the real decision.'},
    {category:'televisions',tier:'P1',why:'100% legacy strong depth and an existing benchmark requires bright-room, sport and streaming decision traceability.'}
  ]
};

module.exports={VERSION,SCHEMA_VERSION,DEPTH_STANDARD_VERSION,VERIFIED_AT,ENTITY_STATUS,RECOMMENDATION_ELIGIBILITY,CURRENTNESS,CONFIDENCE,CONTROLLED_SCALE,categorySchemas,independentDecisionEvidence,entityCorrections,demandPriorityPolicy};
