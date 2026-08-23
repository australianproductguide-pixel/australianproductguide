const coffee=require('./coffee');
const air=require('./air-fryers');
const robots=require('./robot-vacuums');
const headphones=require('./headphones');
const {categories:starterCategories}=require('./catalogue-v3');
const {categories:expandedCategories}=require('./catalogue-v4');
const {categories:searchCategories}=require('./catalogue-v5');
const {categories:nationalCategories}=require('./catalogue-national');
const {categories:authorityCategories}=require('./catalogue-authority-v1');
const consumerV13=require('./catalogue-consumer-v13');
const {retailersFor}=require('./retailers-v6');
const v41Depth=require('./catalogue-v41-depth');
const v42Priority=require('./catalogue-v42-priority');
const v27Retailers=require('./catalogue-v27-retailers');
const v27RetailersPass5=require('./catalogue-v27-retailers-pass5');
const v27RetailersPass6=require('./catalogue-v27-retailers-pass6');
const searchConsoleDepthV85=require('./search-console-depth-v85');
const REVIEWED='2026-08-18';
const DEEP_RESEARCHED='2026-08-15';
const NEXT_REVIEW='2026-09-16';
const deepCategories={
  'coffee-machines':{slug:'coffee-machines',label:'Coffee machines',title:'Coffee Machines Australia',icon:'coffee',aliases:['coffee machine','espresso machine','automatic coffee machine','manual coffee machine'],description:'Compare maintained home espresso machines by workflow, milk system, space, cold-coffee capability and the amount of technique you want to learn.',products:coffee,priorities:['beginner','hands-on','milk','cold','compact','value'],factors:['Manual, guided or one-touch workflow','Milk preparation and drink preferences','Bench space and machine dimensions','Budget and current Australian availability'],faqs:[['Manual or automatic?','Choose manual when control and technique are part of the appeal; choose one-touch when speed and consistency matter more. Guided machines sit between those extremes.'],['What matters most for milk drinks?','Look at whether milk texturing is manual, assisted or automatic, then consider how often several drinks need to be made back-to-back.'],['Should I buy on price alone?','No. Workflow fit, bench space and drink preferences can matter more than a discount on a machine you will dislike using.']],evidenceTier:'deep',comparisonLimit:14},
  'air-fryers':{slug:'air-fryers',label:'Air fryers',title:'Air Fryers Australia',icon:'air',aliases:['air fryer','dual air fryer','dual basket air fryer'],description:'Compare maintained air fryers by basket layout, household size, bench space and cooking versatility.',products:air,priorities:['family','compact','dual-zone','versatile','quiet','value'],factors:['Single, dual or stacked basket layout','Capacity for your household','Bench width and depth','Whether you need grill, steam or other cooking modes'],faqs:[['Do I need dual baskets?','Dual zones are most useful when cooking foods with different temperatures or timings. A larger single basket can be simpler for one main dish.'],['How much capacity is enough?','Capacity labels are useful but basket shape and the foods you cook matter too. Compare the actual layout rather than litres alone.'],['Is a multi-function model better?','Only if you will use the extra modes. Added steam or grill functions can be valuable, but they can also add cost and cleaning complexity.']],evidenceTier:'deep',comparisonLimit:14},
  'robot-vacuums':{slug:'robot-vacuums',label:'Robot vacuums',title:'Robot Vacuums Australia',icon:'robot',aliases:['robot vacuum','robot cleaner','robot mop'],description:'Compare maintained robot vacuums by mopping system, station automation, pet-hair handling and obstacle avoidance.',products:robots,priorities:['mopping','pets','low-maintenance','obstacle','premium','value'],factors:['Vacuum-only versus vacuum-and-mop','Dock emptying, washing and drying automation','Obstacle avoidance and navigation','Pet hair, carpets and threshold requirements'],faqs:[['Is more suction always better?','No. Navigation, brush design, carpet behaviour and dock automation can matter as much as a headline suction figure.'],['Do I need an Omni-style dock?','A full-service dock reduces routine emptying and mop maintenance, but takes more space and increases purchase cost.'],['What should pet owners prioritise?','Hair-management brushes, obstacle avoidance and reliable carpet transitions usually matter more than one specification in isolation.']],evidenceTier:'deep',comparisonLimit:14},
  'wireless-headphones':{slug:'wireless-headphones',label:'Wireless headphones',title:'Wireless Headphones Australia',icon:'headphones',aliases:['wireless headphones','headphones','noise cancelling headphones','anc headphones'],description:'Compare maintained wireless headphones by noise cancellation, battery life, ecosystem fit and listening priorities.',products:headphones,priorities:['anc','battery','travel','apple','bass','value'],factors:['Noise cancellation and transparency','Battery life and travel needs','Device and ecosystem compatibility','Sound preference, comfort and wired options'],faqs:[['What should travellers prioritise?','Strong ANC, long-wear comfort, battery life, folding/case design and easy multi-device switching.'],['Is longer battery always better?','Not if comfort, ANC or sound tuning are a worse match. Treat battery as one decision factor rather than the whole score.'],['Does ecosystem matter?','Yes for features such as spatial audio, TV integration or device switching. Cross-platform buyers should check what remains available outside the brand ecosystem.']],evidenceTier:'deep',comparisonLimit:14}
};
function canonicalBrand(value){
  const raw=String(value||'').trim();
  const key=raw.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'');
  const canonical={eufy:'eufy',delonghi:"De'Longhi",ghd:'GHD',nutribullet:'NutriBullet'};
  return canonical[key]||raw;
}
function deepProduct(p,c){const brand=canonicalBrand(p.brand);return {...p,brand,category:c.slug,categoryLabel:c.label,evidenceTier:'deep',firstResearched:DEEP_RESEARCHED,lastSubstantiveReview:DEEP_RESEARCHED,lastSourceVerification:REVIEWED,lastRetailerCheck:REVIEWED,lastPriceCheck:null,lastImageVerification:REVIEWED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',lastReviewed:DEEP_RESEARCHED,testingStatus:'Desk-researched / specification-based',retailers:retailersFor({...p,brand})};}
function maintainedProduct(p,c){
  const lastRetailerCheck=p.lastRetailerCheck||p.lastRetailerVerification||p.lastSourceVerification||REVIEWED;
  const x={...p,brand:canonicalBrand(p.brand),category:c.slug,categoryLabel:c.label,lastReviewed:p.lastSubstantiveReview,lastRetailerCheck,lastPriceCheck:p.lastPriceCheck??null,freshnessStatus:p.freshnessStatus||'reviewed-this-month'};
  return {...x,retailers:retailersFor(x)};
}
for(const c of Object.values(deepCategories))c.products=c.products.map(p=>deepProduct(p,c));
for(const c of Object.values(starterCategories))c.products=c.products.map(p=>maintainedProduct(p,c));
for(const c of Object.values(expandedCategories))c.products=c.products.map(p=>maintainedProduct(p,c));
for(const c of Object.values(searchCategories))c.products=c.products.map(p=>maintainedProduct(p,c));
for(const c of Object.values(nationalCategories))c.products=c.products.map(p=>maintainedProduct(p,c));
for(const c of Object.values(authorityCategories))c.products=c.products.map(p=>maintainedProduct(p,c));
for(const [slug,rows] of Object.entries(consumerV13)){
  const c=nationalCategories[slug];
  if(!c)continue;
  for(const row of rows)if(!c.products.some(p=>p.slug===row.slug))c.products.push(maintainedProduct(row,c));
}
v41Depth.apply({deepCategories,nationalCategories,maintainedProduct});
v42Priority.apply({nationalCategories,maintainedProduct});
searchConsoleDepthV85.apply({expandedCategories,retailersFor});
v27Retailers.apply({categoryMaps:[deepCategories,starterCategories,expandedCategories,searchCategories,nationalCategories,authorityCategories]});
v27RetailersPass5.apply({categoryMaps:[deepCategories,starterCategories,expandedCategories,searchCategories,nationalCategories,authorityCategories]});
v27RetailersPass6.apply({categoryMaps:[deepCategories,starterCategories,expandedCategories,searchCategories,nationalCategories,authorityCategories]});
const categories={...deepCategories,...starterCategories,...expandedCategories,...searchCategories,...nationalCategories,...authorityCategories};
const legacyPathways=[
['coffee-machines','Coffee machines'],['air-fryers','Air fryers'],['robot-vacuums','Robot vacuums'],['wireless-headphones','Wireless headphones'],
['home-security-cameras','Home security cameras'],['stick-vacuums','Stick vacuums'],['mesh-wifi-systems','Mesh Wi-Fi systems'],['earbuds','Earbuds'],['dash-cameras','Dash cameras'],['luggage','Luggage'],['portable-power-stations','Portable power stations'],['computer-monitors','Computer monitors'],['office-chairs','Office chairs'],['automatic-pet-feeders','Automatic pet feeders'],['standing-desks','Standing desks'],['mechanical-keyboards','Mechanical keyboards'],['home-fitness-equipment','Home fitness equipment'],['computer-mice','Computer mice'],['dehumidifiers','Dehumidifiers'],['air-purifiers','Air purifiers'],['cordless-drills','Cordless drills'],['pressure-washers','Pressure washers'],['smart-doorbells','Smart doorbells'],['baby-monitors','Baby monitors'],['smartwatches','Smartwatches'],['fitness-trackers','Fitness trackers'],['bluetooth-speakers','Bluetooth speakers'],['soundbars','Soundbars'],['projectors','Projectors'],['gaming-monitors','Gaming monitors'],['gaming-headsets','Gaming headsets'],['webcams','Webcams'],['microphones','Microphones'],['external-ssds','External SSDs'],['power-banks','Power banks'],['portable-monitors','Portable monitors'],['tablets','Tablets'],['e-readers','E-readers'],['electric-toothbrushes','Electric toothbrushes'],['hair-dryers','Hair dryers'],['electric-shavers','Electric shavers'],['kitchen-mixers','Kitchen mixers'],['blenders','Blenders'],['rice-cookers','Rice cookers'],['multicookers','Multicookers'],['vacuum-sealers','Vacuum sealers'],['water-filters','Water filters'],['portable-air-conditioners','Portable air conditioners']
];
const expandedPathways=Object.values(expandedCategories).map(c=>[c.slug,c.label]);
const searchPathways=Object.values(searchCategories).map(c=>[c.slug,c.label]);
const nationalPathways=Object.values(nationalCategories).map(c=>[c.slug,c.label]);
const authorityPathways=Object.values(authorityCategories).map(c=>[c.slug,c.label]);
const pathwayMap=new Map([...legacyPathways,...expandedPathways,...searchPathways,...nationalPathways,...authorityPathways].map(([slug,label])=>[slug,label]));
const pathways=[...pathwayMap].map(([slug,label])=>({slug,label,maintained:!!categories[slug],evidenceTier:categories[slug]?.evidenceTier||'unverified'}));
const products=Object.values(categories).flatMap(c=>c.products);
module.exports={categories,pathways,products,REVIEWED,DEEP_RESEARCHED,NEXT_REVIEW};
