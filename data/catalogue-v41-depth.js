const VERIFIED='2026-08-17';
const NEXT_REVIEW='2026-09-16';
const PRICE_REVIEW_DUE='2026-08-24';
const DEPTH_VERSION='decision-intelligence-v4.1';
const TARGET_CATEGORIES=['televisions','laptops','washing-machines','coffee-machines','robot-vacuums'];

function spec(p,label,value){
  if(value===undefined||value===null||value==='')return;
  p.specs=Array.isArray(p.specs)?p.specs:[];
  if(!p.specs.some(row=>Array.isArray(row)&&String(row[0]).toLowerCase()===String(label).toLowerCase()))p.specs.push([label,String(value)]);
}
function fact(p,key,value,{label,unit,source,sourceType='manufacturer-au',applicability='exact-model',confidence='high',note}={}){
  if(value===undefined||value===null||value==='')return;
  p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};
  p.factEvidence[key]={value,...(unit?{unit}:{}),source:source||p.source||null,sourceType,verifiedAt:VERIFIED,applicability,confidence,...(note?{note}:{} )};
  if(label)spec(p,label,unit?`${value} ${unit}`:value);
}
function attr(p,key,value){
  if(value===undefined||value===null||value==='')return;
  p.decisionAttributes=p.decisionAttributes&&typeof p.decisionAttributes==='object'?p.decisionAttributes:{};
  p.decisionAttributes[key]=value;
}
function documented(p,key,value,label,unit){
  attr(p,key,value);
  fact(p,key,value,{label,unit,sourceType:'apg-normalised-from-maintained-manufacturer-evidence',note:'Normalised by APG from the maintained exact-model manufacturer evidence for decision use.'});
}
function booleanText(v){return v?'Yes':'No';}
function parseInches(p){const m=String(`${p.name||''} ${p.model||''}`).match(/\b(\d{2,3})(?:-|\s)*(?:inch|inches)\b/i);return m?Number(m[1]):null;}
function parseKg(p){const m=String(`${p.name||''} ${(p.highlights||[]).join(' ')}`).match(/\b(\d+(?:\.\d+)?)\s*kg\b/i);return m?Number(m[1]):null;}
function parseRpm(p){const m=String((p.highlights||[]).join(' ')).match(/\b([1-2][,.]?\d{3})\s*rpm\b/i);return m?Number(m[1].replace(/,/g,'')):null;}
function parsePa(p){const m=String((p.highlights||[]).join(' ')).match(/\b([\d,]+)\s*Pa\b/i);return m?Number(m[1].replace(/,/g,'')):null;}
function hasTag(p,tag){return (p.tags||[]).includes(tag);}
function addTags(p,tags){p.tags=[...new Set([...(p.tags||[]),...tags])];}
function offer(p,row){
  p.offers=Array.isArray(p.offers)?p.offers:[];
  if(!p.offers.some(x=>x.url===row.url&&x.retailer===row.retailer))p.offers.push(row);
}
function identity(p){
  p.depthVersion=DEPTH_VERSION;
  if(p.model)fact(p,'exactModel',p.model,{label:'Exact Australian model',sourceType:'manufacturer-au'});
  fact(p,'category',p.category||p.categoryLabel,{sourceType:'apg-canonical-category',applicability:'canonical-product'});
}

function enrichTelevision(p){
  identity(p);
  const size=parseInches(p);if(size){documented(p,'screenSizeInches',size,'Screen size','in');addTags(p,[`${size}-inch`]);}
  const all=String(`${p.name||''} ${(p.highlights||[]).join(' ')} ${(p.tags||[]).join(' ')}`).toLowerCase();
  if(all.includes('oled'))documented(p,'panelClass','OLED','Panel class');
  else if(all.includes('mini-led')||all.includes('miniled'))documented(p,'panelClass','Mini LED','Panel class');
  documented(p,'brightRoomSignal',hasTag(p,'bright-room'),'Bright-room evidence signal');
  documented(p,'gamingSignal',hasTag(p,'gaming'),'Gaming evidence signal');
  if(/netflix|streaming/.test(all)||hasTag(p,'streaming'))documented(p,'streamingSignal',true,'Streaming evidence signal');
}
function enrichLaptop(p){
  identity(p);
  const size=parseInches(p);if(size)documented(p,'displaySizeInches',size,'Display size','in');
  if(hasTag(p,'macos'))documented(p,'operatingSystem','macOS','Operating system');
  else if(hasTag(p,'windows'))documented(p,'operatingSystem','Windows','Operating system');
  documented(p,'oledDisplay',hasTag(p,'oled'),'OLED display signal');
  documented(p,'portableSignal',hasTag(p,'portable'),'Portability signal');
  documented(p,'creatorSignal',hasTag(p,'creator'),'Creator-workflow signal');
  documented(p,'copilotPlusSignal',hasTag(p,'copilot-plus'),'Copilot+ signal');
}
function enrichWasher(p){
  identity(p);
  const kg=parseKg(p);if(kg)documented(p,'capacityKg',kg,'Load capacity','kg');
  const rpm=parseRpm(p);if(rpm)documented(p,'maxSpinRpm',rpm,'Maximum spin speed','rpm');
  documented(p,'autoDose',hasTag(p,'auto-dose'),'Automatic dosing');
  documented(p,'smartConnected',hasTag(p,'smart'),'Smart connectivity signal');
  documented(p,'energyEfficientSignal',hasTag(p,'energy-efficient'),'Energy-efficiency signal');
  documented(p,'quickWashSignal',hasTag(p,'quick-wash'),'Quick-wash signal');
}
function enrichCoffee(p){
  identity(p);
  if(p.workflow)documented(p,'workflow',p.workflow,'Workflow');
  if(p.milk)documented(p,'milkSystem',p.milk,'Milk preparation');
  if(typeof p.cold==='boolean')documented(p,'coldCoffee',p.cold,'Cold coffee capability');
  if(Number(p.width)>0)documented(p,'widthMm',Number(p.width),'Width','mm');
  if(Number(p.depth)>0)documented(p,'depthMm',Number(p.depth),'Depth','mm');
  if(p.learning)documented(p,'learningCurve',p.learning,'Learning curve');
  if(typeof p.beanSwitch==='boolean')documented(p,'beanSwitch',p.beanSwitch,'Bean switching');
  if(p.breadth)documented(p,'drinkBreadth',p.breadth,'Drink breadth');
}
function enrichRobot(p){
  identity(p);
  documented(p,'mopping',hasTag(p,'mopping'),'Mopping capability');
  documented(p,'petHairSignal',hasTag(p,'pets'),'Pet-hair signal');
  documented(p,'automatedDockSignal',hasTag(p,'low-maintenance'),'Automated-dock signal');
  documented(p,'obstacleAvoidanceSignal',hasTag(p,'obstacle'),'Obstacle-avoidance signal');
  const pa=parsePa(p);if(pa)documented(p,'statedSuctionPa',pa,'Manufacturer-stated suction','Pa');
}

const televisionRows=[
  {
    id:'APG-V41-TV-75U6SAU',slug:'hisense-75u6sau-75-inch-u6s-uled-miniled-tv',brand:'Hisense',name:'75-inch U6S ULED MiniLED 144Hz 4K TV',model:'75U6SAU',price:2299,
    summary:'A current 75-inch Australian Mini LED model that directly fits large-screen buyers seeking bright-room, sport, streaming and high-refresh capability within a verified A$2,500 ceiling at the 17 August 2026 check.',
    highlights:['75-inch Hi-QLED MiniLED display','Native 144Hz with VRR and AI Sports Mode','VIDAA U9 with Netflix, YouTube and Prime Video'],
    watch:'A$2,299 is the Hisense Australia direct price observed on 17 August 2026, not a whole-of-market lowest-price claim. Recheck price, stock and delivery before purchase.',
    source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',
    tags:['mini-led','75-inch','bright-room','sport','high-refresh','gaming','streaming','value','dolby-vision'],
    sourceType:'Official Hisense Australia exact-model product/specification and direct offer page',
    testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',publicationStatus:'LIVE / MAINTAINED',evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',
    firstResearched:VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,lastRetailerCheck:VERIFIED,lastPriceCheck:VERIFIED,lastImageVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,nextPriceReviewDue:PRICE_REVIEW_DUE,freshnessStatus:'reviewed-this-month',
    specs:[['Screen size','75 in'],['Display type','Hi-QLED MiniLED'],['Resolution','3840 x 2160'],['Refresh rate','144 Hz'],['HDR','HDR10 / HDR10+ / Dolby Vision'],['Smart OS','VIDAA U9'],['HDMI inputs','4'],['HDMI 2.1','HDMI 3 & 4'],['Warranty','3 years']],
    decisionAttributes:{screenSizeInches:75,panelClass:'Mini LED',refreshHz:144,brightRoomSignal:true,sportSignal:true,streamingSignal:true,gamingSignal:true,smartOs:'VIDAA U9'},
    factEvidence:{
      screenSizeInches:{value:75,unit:'in',source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},
      panelClass:{value:'Mini LED',source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},
      refreshHz:{value:144,unit:'Hz',source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},
      brightRoomSignal:{value:true,source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'Hisense explicitly positions U6S for bright living rooms and documents an ambient-light sensor.'},
      sportSignal:{value:true,source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'AI Sports Mode and smooth-motion features are documented by Hisense.'},
      streamingSignal:{value:true,source:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'Hisense lists Netflix, YouTube and Prime Video among streaming apps.'}
    },
    offers:[{retailer:'Hisense Australia',url:'https://hisense.com.au/product/75U6SAU/75%22-u6s-uled-miniled-144hz-4k-tv',price:2299,currency:'AUD',availability:'in-stock',checkedAt:VERIFIED,reviewDue:PRICE_REVIEW_DUE,exactModel:true,affiliate:false,sourceType:'manufacturer-direct-au',note:'Direct manufacturer price observed 17 Aug 2026; not a whole-of-market lowest-price claim.'}]
  },
  {
    id:'APG-V41-TV-75U7SAU',slug:'hisense-75u7sau-75-inch-u7s-uled-miniled-tv',brand:'Hisense',name:'75-inch U7S ULED MiniLED 165Hz 4K TV',model:'75U7SAU',price:null,
    summary:'A 75-inch 2026 Australian Mini LED model for buyers prioritising very high brightness, anti-reflection treatment, sport motion and high-refresh gaming.',
    highlights:['75-inch Hi-QLED MiniLED Pro','Up to 3,000 nits with Anti-Reflection & Glare-Free','Native 165Hz, four HDMI 2.1 inputs and VIDAA U9'],
    watch:'Hisense Australia listed A$2,999 direct at the 17 August check. APG does not use that single-retailer offer as a hard market-wide price basis because lower exact-model retailer offers may exist.',
    source:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',tags:['mini-led','75-inch','bright-room','sport','high-refresh','gaming','streaming','premium','dolby-vision'],
    sourceType:'Official Hisense Australia exact-model product/specification and direct offer page',testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',publicationStatus:'LIVE / MAINTAINED',evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',
    firstResearched:VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,lastRetailerCheck:VERIFIED,lastPriceCheck:VERIFIED,lastImageVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,nextPriceReviewDue:PRICE_REVIEW_DUE,freshnessStatus:'reviewed-this-month',
    specs:[['Screen size','75 in'],['Display type','Hi-QLED MiniLED Pro'],['Resolution','3840 x 2160'],['Refresh rate','165 Hz'],['Peak brightness','Up to 3000 nits'],['Reflection handling','Anti-Reflection & Glare-Free'],['HDR','Dolby Vision IQ / HDR10+ Adaptive / HDR10'],['Smart OS','VIDAA U9'],['HDMI 2.1','All 4 HDMI inputs']],
    decisionAttributes:{screenSizeInches:75,panelClass:'Mini LED',refreshHz:165,peakBrightnessNits:3000,antiReflection:true,brightRoomSignal:true,sportSignal:true,streamingSignal:true,gamingSignal:true,smartOs:'VIDAA U9'},
    factEvidence:{screenSizeInches:{value:75,unit:'in',source:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},refreshHz:{value:165,unit:'Hz',source:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},peakBrightnessNits:{value:3000,unit:'nits',source:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'Manufacturer claim: up to 3,000 nits.'},antiReflection:{value:true,source:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'}},
    offers:[{retailer:'Hisense Australia',url:'https://hisense.com.au/product/75U7SAU/75-u7s-uled-miniled-165hz-4k-tv',price:2999,currency:'AUD',availability:'in-stock',checkedAt:VERIFIED,reviewDue:PRICE_REVIEW_DUE,exactModel:true,affiliate:false,sourceType:'manufacturer-direct-au',note:'Direct manufacturer offer only; excluded from engine hard-budget price basis to avoid implying a market-low price.'}]
  },
  {
    id:'APG-V41-TV-75C7L',slug:'tcl-75c7l-75-inch-c7l-sqd-miniled-tv',brand:'TCL',name:'C7L 75-inch SQD-Mini LED TV',model:'75C7L',price:null,
    summary:'A current 75-inch Australian TCL Mini LED option with strong manufacturer brightness, low-reflection and high-refresh signals for bright-room sport, movies and gaming.',
    highlights:['75-inch SQD-Mini LED with 1,352 precise dimming zones','Up to HDR 3,000 nits and HVA 2.0 Pro low-reflection panel','4K 144Hz signal path with 288 VRR Game Accelerator and Google TV'],
    watch:'TCL lists an A$3,295 RRP. APG does not use RRP or an expired retailer promotion as a current hard-budget price basis.',
    source:'https://www.tcl.com/au/en/tvs/75c7l',tags:['mini-led','75-inch','bright-room','sport','high-refresh','gaming','streaming','premium','google-tv','dolby-vision'],
    sourceType:'Official TCL Australia exact-model product page',testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',publicationStatus:'LIVE / MAINTAINED',evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',
    firstResearched:VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,lastRetailerCheck:VERIFIED,lastPriceCheck:null,lastImageVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',
    specs:[['Screen size','75 in'],['Display type','SQD-Mini LED'],['Dimming zones','1,352'],['Peak brightness','Up to HDR 3000 nits'],['Panel','HVA 2.0 Pro with low-reflection film'],['High refresh','4K 144Hz signal path; 288 VRR Game Accelerator'],['Smart platform','Google TV']],
    decisionAttributes:{screenSizeInches:75,panelClass:'Mini LED',peakBrightnessNits:3000,dimmingZones:1352,antiReflection:true,refreshHz:144,brightRoomSignal:true,sportSignal:true,streamingSignal:true,gamingSignal:true,smartOs:'Google TV'},
    factEvidence:{screenSizeInches:{value:75,unit:'in',source:'https://www.tcl.com/au/en/tvs/75c7l',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},dimmingZones:{value:1352,source:'https://www.tcl.com/au/en/tvs/75c7l',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},peakBrightnessNits:{value:3000,unit:'nits',source:'https://www.tcl.com/au/en/tvs/75c7l',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'Manufacturer claim: up to HDR 3,000 nits.'},refreshHz:{value:144,unit:'Hz',source:'https://www.tcl.com/au/en/tvs/75c7l',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'TCL documents a 4K 144Hz signal path; 288Hz Game Accelerator has separate conditions.'},antiReflection:{value:true,source:'https://www.tcl.com/au/en/tvs/75c7l',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high',note:'TCL documents a low-reflection film on the HVA 2.0 Pro panel.'}}
  },
  {
    id:'APG-V41-TV-75QNED86BSA',slug:'lg-75qned86bsa-75-inch-qned86-miniled-tv',brand:'LG',name:'QNED86 75-inch Mini LED 4K Smart TV (2026)',model:'75QNED86BSA',price:null,
    summary:'A 75-inch 2026 Australian LG QNED Mini LED model for buyers wanting Dolby Vision, webOS and up to 144Hz VRR with strong gaming support.',
    highlights:['75-inch 4K QNED Mini LED with Precision Dimming','120Hz native with VRR up to 144Hz and AMD FreeSync Premium','Dolby Vision and current webOS platform'],
    watch:'No whole-of-market maintained price is assigned. Exact retailer offers can change quickly, so verify the current 75QNED86BSA offer before applying a hard budget ceiling.',
    source:'https://www.lg.com/au/tv-soundbars/qned-evo-tv/75qned86bsa/',tags:['mini-led','75-inch','high-refresh','gaming','streaming','dolby-vision','webos'],
    sourceType:'Official LG Australia exact-model product/specification page',testingStatus:'Desk-researched / manufacturer specification evidence; no hands-on testing claimed',publicationStatus:'LIVE / MAINTAINED',evidenceTier:'deep',evidenceLabel:'Manufacturer-verified evidence',
    firstResearched:VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,lastRetailerCheck:VERIFIED,lastPriceCheck:null,lastImageVerification:VERIFIED,nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',
    specs:[['Screen size','75 in'],['Display type','4K QNED MiniLED'],['Resolution','3840 x 2160'],['Refresh rate','120Hz native; VRR up to 144Hz'],['Dimming','Precision Dimming'],['HDR','Dolby Vision / HDR10 / HLG'],['Gaming','AMD FreeSync Premium, ALLM, VRR up to 144Hz'],['Smart OS','webOS']],
    decisionAttributes:{screenSizeInches:75,panelClass:'Mini LED',nativeRefreshHz:120,refreshHz:144,brightRoomSignal:false,sportSignal:true,streamingSignal:true,gamingSignal:true,smartOs:'webOS'},
    factEvidence:{screenSizeInches:{value:75,unit:'in',source:'https://www.lg.com/au/tv-soundbars/qned-evo-tv/75qned86bsa/',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},nativeRefreshHz:{value:120,unit:'Hz',source:'https://www.lg.com/au/tv-soundbars/qned-evo-tv/75qned86bsa/',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},refreshHz:{value:144,unit:'Hz VRR maximum',source:'https://www.lg.com/au/tv-soundbars/qned-evo-tv/75qned86bsa/',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'},dolbyVision:{value:true,source:'https://www.lg.com/au/tv-soundbars/qned-evo-tv/75qned86bsa/',sourceType:'manufacturer-au',verifiedAt:VERIFIED,applicability:'exact-model',confidence:'high'}}
  }
];

function addTelevisionRows(nationalCategories,maintainedProduct){
  const c=nationalCategories.televisions;if(!c)return;
  c.aliases=[...new Set([...(c.aliases||[]),'75 inch tv','75-inch tv','75 inch television'])];
  c.priorities=[...new Set([...(c.priorities||[]),'75-inch','sport','streaming','high-refresh'])];
  for(const row of televisionRows){if(c.products.some(p=>p.slug===row.slug||p.model===row.model))continue;c.products.push(maintainedProduct(row,c));}
}
function apply({deepCategories,nationalCategories,maintainedProduct}){
  addTelevisionRows(nationalCategories,maintainedProduct);
  for(const p of nationalCategories.televisions?.products||[])enrichTelevision(p);
  for(const p of nationalCategories.laptops?.products||[])enrichLaptop(p);
  for(const p of nationalCategories['washing-machines']?.products||[])enrichWasher(p);
  for(const p of deepCategories['coffee-machines']?.products||[])enrichCoffee(p);
  for(const p of deepCategories['robot-vacuums']?.products||[])enrichRobot(p);
  return {depthVersion:DEPTH_VERSION,targetCategories:TARGET_CATEGORIES};
}
module.exports={DEPTH_VERSION,TARGET_CATEGORIES,VERIFIED,NEXT_REVIEW,PRICE_REVIEW_DUE,apply};