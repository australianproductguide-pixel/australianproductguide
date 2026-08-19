'use strict';

const VERIFIED='2026-08-20';
const NEXT_REVIEW='2026-09-19';
const VERSION='evidence-depth-v49-pass1';

const routerResearch={
  'tp-link-archer-ax12':{
    model:'Archer AX12',
    source:'https://www.tp-link.com/au/home-networking/wifi-router/archer-ax12/',
    summary:'An entry Wi-Fi 6 router for Australian households that need gigabit wired ports, straightforward dual-band coverage and a lower-cost step up from older Wi-Fi generations.',
    highlights:['AX1500 Wi-Fi 6 with 1201 Mbps on 5 GHz and 300 Mbps on 2.4 GHz','1× Gigabit WAN and 3× Gigabit LAN ports','Four fixed antennas with Beamforming and WPA3 support'],
    watch:'TP-Link positions this model for roughly 2–3 bedroom homes, but real coverage and throughput vary with building materials, client devices, interference and placement. It has gigabit rather than multi-gigabit Ethernet.',
    specs:[['Wi-Fi generation','Wi-Fi 6 (802.11ax)'],['Wireless class','AX1500'],['5 GHz stated link rate','1201 Mbps'],['2.4 GHz stated link rate','300 Mbps'],['Ethernet','1× Gigabit WAN + 3× Gigabit LAN'],['Antennas','4× fixed high-performance antennas'],['Working modes','Router / Access Point'],['Security','WPA3-Personal supported'],['Manufacturer range class','2–3 bedroom houses']],
    decisionAttributes:{wifiGeneration:6,wirelessClass:'AX1500',max5GHzMbps:1201,max24GHzMbps:300,multiGigEthernet:false,gigabitLanPorts:3,usb3:false,manufacturerRangeClass:'2-3-bedroom'},
    facts:{wifiGeneration:['Wi-Fi 6','Wi-Fi generation'],wirelessClass:['AX1500','Wireless class'],max5GHzMbps:[1201,'5 GHz stated link rate','Mbps'],max24GHzMbps:[300,'2.4 GHz stated link rate','Mbps'],ethernet:['1× Gigabit WAN + 3× Gigabit LAN','Ethernet'],antennaCount:[4,'Fixed high-performance antennas'],wpa3:[true,'WPA3 support'],manufacturerRangeClass:['2–3 bedroom houses','Manufacturer range class']}
  },
  'tp-link-archer-ax55':{
    model:'Archer AX55',
    source:'https://www.tp-link.com/au/home-networking/wifi-router/archer-ax55/',
    summary:'A balanced AX3000 Wi-Fi 6 router for households that want 160 MHz Wi-Fi, four gigabit LAN ports, USB 3.0 storage sharing and mesh expansion without paying for multi-gigabit Ethernet.',
    highlights:['AX3000 Wi-Fi 6 with 2402 Mbps on 5 GHz and 574 Mbps on 2.4 GHz','1× Gigabit WAN, 4× Gigabit LAN and 1× USB 3.0','Four high-performance antennas plus OneMesh and EasyMesh support'],
    watch:'Its wired network remains gigabit-class. Buyers with internet or NAS workflows above 1 Gbps should compare the AX55 Pro or Wi-Fi 7 alternatives with multi-gigabit Ethernet.',
    specs:[['Wi-Fi generation','Wi-Fi 6 (802.11ax)'],['Wireless class','AX3000'],['5 GHz stated link rate','2402 Mbps'],['2.4 GHz stated link rate','574 Mbps'],['Ethernet','1× Gigabit WAN + 4× Gigabit LAN'],['USB','1× USB 3.0'],['Antennas','4× fixed high-performance antennas'],['Mesh','OneMesh and EasyMesh supported'],['Manufacturer range class','3 bedroom houses']],
    decisionAttributes:{wifiGeneration:6,wirelessClass:'AX3000',max5GHzMbps:2402,max24GHzMbps:574,multiGigEthernet:false,gigabitLanPorts:4,usb3:true,easyMesh:true,oneMesh:true,manufacturerRangeClass:'3-bedroom'},
    facts:{wifiGeneration:['Wi-Fi 6','Wi-Fi generation'],wirelessClass:['AX3000','Wireless class'],max5GHzMbps:[2402,'5 GHz stated link rate','Mbps'],max24GHzMbps:[574,'2.4 GHz stated link rate','Mbps'],ethernet:['1× Gigabit WAN + 4× Gigabit LAN','Ethernet'],usb3:[true,'USB 3.0'],antennaCount:[4,'Fixed high-performance antennas'],easyMesh:[true,'EasyMesh support'],oneMesh:[true,'OneMesh support']}
  },
  'tp-link-archer-ax55-pro':{
    model:'Archer AX55 Pro',
    source:'https://www.tp-link.com/au/home-networking/wifi-router/archer-ax55-pro/',
    summary:'An AX3000 Wi-Fi 6 router for buyers who need a 2.5 Gbps wired path as well as 160 MHz Wi-Fi, USB 3.0 and mesh expansion.',
    highlights:['AX3000 Wi-Fi 6 with 2402 Mbps on 5 GHz and 574 Mbps on 2.4 GHz','1× 2.5 Gbps WAN/LAN plus 1× Gigabit WAN/LAN and 3× Gigabit LAN','Four high-gain antennas, USB 3.0, OneMesh and VPN client/server support'],
    watch:'Only one port is 2.5 Gbps, so households building an all-multi-gig wired network should compare models with several 2.5 Gbps ports. Wireless rates are theoretical link rates, not guaranteed internet throughput.',
    specs:[['Wi-Fi generation','Wi-Fi 6 (802.11ax)'],['Wireless class','AX3000'],['5 GHz stated link rate','2402 Mbps'],['2.4 GHz stated link rate','574 Mbps'],['Multi-gigabit Ethernet','1× 2.5 Gbps WAN/LAN'],['Other Ethernet','1× Gigabit WAN/LAN + 3× Gigabit LAN'],['USB','1× USB 3.0'],['Antennas','4× high-gain antennas'],['Mesh','OneMesh supported'],['Channel width','160 MHz on 5 GHz']],
    decisionAttributes:{wifiGeneration:6,wirelessClass:'AX3000',max5GHzMbps:2402,max24GHzMbps:574,multiGigEthernet:true,maxEthernetGbps:2.5,gigabitLanPorts:3,usb3:true,oneMesh:true,channelWidthMHz:160},
    facts:{wifiGeneration:['Wi-Fi 6','Wi-Fi generation'],wirelessClass:['AX3000','Wireless class'],max5GHzMbps:[2402,'5 GHz stated link rate','Mbps'],max24GHzMbps:[574,'2.4 GHz stated link rate','Mbps'],maxEthernetGbps:[2.5,'Fastest Ethernet port','Gbps'],ethernet:['1× 2.5 Gbps WAN/LAN + 1× Gigabit WAN/LAN + 3× Gigabit LAN','Ethernet'],usb3:[true,'USB 3.0'],antennaCount:[4,'High-gain antennas'],oneMesh:[true,'OneMesh support'],channelWidthMHz:[160,'5 GHz channel width','MHz']}
  },
  'tp-link-archer-ax72':{
    model:'Archer AX72',
    source:'https://www.tp-link.com/au/home-networking/wifi-router/archer-ax72/',
    summary:'A higher-throughput AX5400 Wi-Fi 6 router for households prioritising a fast 4×4 5 GHz radio, broader antenna array, USB sharing and OneMesh expansion while remaining on gigabit Ethernet.',
    highlights:['AX5400 Wi-Fi 6 with 4804 Mbps on 5 GHz and 574 Mbps on 2.4 GHz','Six fixed high-performance antennas with 4×4 MU-MIMO and OFDMA','1× Gigabit WAN, 4× Gigabit LAN and 1× USB 3.0'],
    watch:'The wireless tier is substantially higher than AX1500/AX3000 models, but every Ethernet port is still 1 Gbps. Buyers with multi-gig NBN, NAS or wired backhaul requirements should treat that as a hard constraint.',
    specs:[['Wi-Fi generation','Wi-Fi 6 (802.11ax)'],['Wireless class','AX5400'],['5 GHz stated link rate','4804 Mbps'],['2.4 GHz stated link rate','574 Mbps'],['Ethernet','1× Gigabit WAN + 4× Gigabit LAN'],['USB','1× USB 3.0'],['Antennas','6× fixed high-performance antennas'],['5 GHz radio','4T4R / 4×4 MU-MIMO'],['Mesh','OneMesh supported'],['Manufacturer range class','3 bedroom houses']],
    decisionAttributes:{wifiGeneration:6,wirelessClass:'AX5400',max5GHzMbps:4804,max24GHzMbps:574,multiGigEthernet:false,gigabitLanPorts:4,usb3:true,antennaCount:6,oneMesh:true,manufacturerRangeClass:'3-bedroom'},
    facts:{wifiGeneration:['Wi-Fi 6','Wi-Fi generation'],wirelessClass:['AX5400','Wireless class'],max5GHzMbps:[4804,'5 GHz stated link rate','Mbps'],max24GHzMbps:[574,'2.4 GHz stated link rate','Mbps'],ethernet:['1× Gigabit WAN + 4× Gigabit LAN','Ethernet'],usb3:[true,'USB 3.0'],antennaCount:[6,'Fixed high-performance antennas'],muMimo:['4×4','5 GHz MU-MIMO'],oneMesh:[true,'OneMesh support'],manufacturerRangeClass:['3 bedroom houses','Manufacturer range class']}
  },
  'tp-link-archer-be550':{
    model:'Archer BE550',
    source:'https://www.tp-link.com/au/home-networking/wifi-router/archer-be550/',
    summary:'A tri-band Wi-Fi 7 router for buyers who want 6 GHz, Multi-Link Operation and multi-gigabit wired connectivity across every Ethernet port.',
    highlights:['BE9300 tri-band Wi-Fi 7 with 6 GHz, 5 GHz and 2.4 GHz radios','1× 2.5 Gbps WAN plus 4× 2.5 Gbps LAN ports','Multi-Link Operation, 320 MHz channels, USB 3.0 and EasyMesh support'],
    watch:'TP-Link lists V1 and V2 hardware revisions with small specification differences, including the 2.4 GHz radio rate. Confirm the hardware revision being sold. Wi-Fi link-rate and coverage claims are theoretical/condition-dependent rather than guaranteed internet performance.',
    specs:[['Wi-Fi generation','Wi-Fi 7 (802.11be)'],['Wireless class','BE9300'],['6 GHz stated link rate','5760 Mbps'],['5 GHz stated link rate','2880 Mbps'],['2.4 GHz stated link rate','688 Mbps on current V2 page'],['Ethernet','1× 2.5 Gbps WAN + 4× 2.5 Gbps LAN'],['USB','1× USB 3.0'],['Advanced Wi-Fi 7','MLO / 320 MHz / 4K-QAM / Multi-RUs'],['Mesh','EasyMesh compatible'],['Manufacturer range class','4 bedroom houses']],
    decisionAttributes:{wifiGeneration:7,wirelessClass:'BE9300',triBand:true,max6GHzMbps:5760,max5GHzMbps:2880,max24GHzMbps:688,multiGigEthernet:true,maxEthernetGbps:2.5,multiGigLanPorts:4,usb3:true,easyMesh:true,mlo:true,channelWidthMHz:320,manufacturerRangeClass:'4-bedroom'},
    facts:{wifiGeneration:['Wi-Fi 7','Wi-Fi generation'],wirelessClass:['BE9300','Wireless class'],max6GHzMbps:[5760,'6 GHz stated link rate','Mbps'],max5GHzMbps:[2880,'5 GHz stated link rate','Mbps'],max24GHzMbps:[688,'2.4 GHz stated link rate on current V2 page','Mbps'],ethernet:['1× 2.5 Gbps WAN + 4× 2.5 Gbps LAN','Ethernet'],maxEthernetGbps:[2.5,'Ethernet port speed','Gbps'],mlo:[true,'Multi-Link Operation'],channelWidthMHz:[320,'Maximum Wi-Fi 7 channel width','MHz'],easyMesh:[true,'EasyMesh compatibility'],usb3:[true,'USB 3.0']}
  }
};

function cleanKey(value){return String(value||'field').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'field';}
function nonAmazonSource(url){return /^https:\/\//i.test(String(url||''))&&!/amazon\.com\.au/i.test(String(url||''));}
function explicitPrimarySource(p){
  if(!nonAmazonSource(p.source))return false;
  const text=String(p.sourceType||'').toLowerCase();
  return /manufacturer/.test(text)&&(/exact/.test(text)||/official australian/.test(text)||/primary/.test(text));
}
function ensureFacts(p){p.factEvidence=p.factEvidence&&typeof p.factEvidence==='object'?p.factEvidence:{};return p.factEvidence;}
function ensureSpecs(p){p.specs=Array.isArray(p.specs)?p.specs:[];return p.specs;}
function addFact(p,key,value,{label,unit,source,verifiedAt,sourceType='manufacturer-primary',applicability='exact-model',confidence='high',note}={}){
  if(value===undefined||value===null||value==='')return;
  const facts=ensureFacts(p);
  if(facts[key])return;
  facts[key]={value,...(unit?{unit}:{}),source:source||p.source||null,sourceType,verifiedAt:verifiedAt||p.lastSourceVerification||p.lastReviewed||VERIFIED,applicability,confidence,...(label?{label}:{}),...(note?{note}:{})};
}
function addSpec(p,label,value){
  if(value===undefined||value===null||value==='')return;
  const specs=ensureSpecs(p);
  if(!specs.some(row=>Array.isArray(row)&&String(row[0]).toLowerCase()===String(label).toLowerCase()))specs.push([label,String(value)]);
}
function promoteExistingPrimarySource(p){
  if(!explicitPrimarySource(p)||String(p.evidenceTier||'').toLowerCase()!=='deep')return false;
  const checked=p.lastSourceVerification||p.lastReviewed||p.firstResearched||VERIFIED;
  addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,{label:'Exact product identity',verifiedAt:checked,sourceType:'maintained-manufacturer-primary',note:'Structured in v49 from APG’s maintained exact-product manufacturer record; the original source-verification date is preserved.'});
  if(p.model)addFact(p,'exactModel',p.model,{label:'Exact model',verifiedAt:checked,sourceType:'maintained-manufacturer-primary'});
  addFact(p,'canonicalCategory',p.categoryLabel||p.category,{label:'Canonical APG category',verifiedAt:checked,sourceType:'apg-canonical-category',applicability:'canonical-product'});
  for(const [key,value] of Object.entries(p.decisionAttributes||{}))addFact(p,`decision_${cleanKey(key)}`,value,{label:`Decision attribute: ${key}`,verifiedAt:checked,sourceType:'maintained-manufacturer-primary',note:'Decision attribute retained from APG’s maintained manufacturer-backed product record.'});
  for(const row of ensureSpecs(p)){
    if(!Array.isArray(row)||row.length<2)continue;
    addFact(p,`spec_${cleanKey(row[0])}`,row[1],{label:String(row[0]),verifiedAt:checked,sourceType:'maintained-manufacturer-primary'});
  }
  (p.highlights||[]).slice(0,5).forEach((value,index)=>addFact(p,`verifiedClaim${index+1}`,value,{label:`Verified manufacturer claim ${index+1}`,verifiedAt:checked,sourceType:'maintained-manufacturer-primary',note:'Maintained APG highlight traced to the exact Australian manufacturer source.'}));
  p.evidenceClaims=(p.highlights||[]).slice(0,5).map((value,index)=>({key:`verifiedClaim${index+1}`,value,source:p.source,verifiedAt:checked,sourceType:'maintained-manufacturer-primary'}));
  p.evidenceDepthVersion=VERSION;
  p.evidenceDepthStructuredAt=VERIFIED;
  p.evidenceDepthStatus='primary-source-structured';
  return true;
}
function applyRouterResearch(p,row){
  const originalFirst=p.firstResearched;
  Object.assign(p,{
    model:row.model,source:row.source,summary:row.summary,highlights:row.highlights,watch:row.watch,
    sourceType:'Official TP-Link Australia exact-model product/specification page · independently reverified 20 Aug 2026',
    evidenceTier:'deep',evidenceLabel:'Manufacturer-verified Australian evidence',
    testingStatus:'Desk-researched against exact Australian manufacturer product/specification evidence; no hands-on testing claimed.',
    publicationStatus:'LIVE / MAINTAINED',firstResearched:originalFirst||VERIFIED,lastSubstantiveReview:VERIFIED,lastSourceVerification:VERIFIED,
    nextReviewDue:NEXT_REVIEW,freshnessStatus:'reviewed-this-month',specs:row.specs.map(x=>[...x]),decisionAttributes:{...row.decisionAttributes},
    evidenceDepthVersion:VERSION,evidenceDepthStructuredAt:VERIFIED,evidenceDepthStatus:'new-primary-research-v49'
  });
  p.tags=[...new Set([...(p.tags||[]),row.decisionAttributes.wifiGeneration===7?'wifi-7':'wifi-6',row.decisionAttributes.multiGigEthernet?'multi-gig':'gigabit'])];
  p.factEvidence={};
  addFact(p,'exactProductIdentity',`${p.brand} ${p.name}`,{label:'Exact product identity',verifiedAt:VERIFIED,sourceType:'manufacturer-au'});
  addFact(p,'exactModel',row.model,{label:'Exact model',verifiedAt:VERIFIED,sourceType:'manufacturer-au'});
  addFact(p,'canonicalCategory',p.categoryLabel||p.category,{label:'Canonical APG category',verifiedAt:VERIFIED,sourceType:'apg-canonical-category',applicability:'canonical-product'});
  for(const [key,tuple] of Object.entries(row.facts)){
    const [value,label,unit]=tuple;
    addFact(p,key,value,{label,unit,verifiedAt:VERIFIED,sourceType:'manufacturer-au'});
  }
  p.evidenceClaims=row.highlights.map((value,index)=>({key:`verifiedClaim${index+1}`,value,source:row.source,verifiedAt:VERIFIED,sourceType:'manufacturer-au'}));
  row.highlights.forEach((value,index)=>addFact(p,`verifiedClaim${index+1}`,value,{label:`Verified manufacturer claim ${index+1}`,verifiedAt:VERIFIED,sourceType:'manufacturer-au'}));
}
function apply({categoryMaps=[]}={}){
  const seen=new Set();
  let existingPrimaryStructured=0,newPrimaryResearch=0;
  const touched=[];
  for(const map of categoryMaps){
    for(const category of Object.values(map||{})){
      for(const p of category.products||[]){
        if(!p||seen.has(p.slug))continue;
        seen.add(p.slug);
        const row=routerResearch[p.slug];
        if(row){applyRouterResearch(p,row);newPrimaryResearch++;touched.push(p.slug);continue;}
        if(promoteExistingPrimarySource(p)){existingPrimaryStructured++;touched.push(p.slug);}
      }
    }
  }
  return{version:VERSION,verifiedAt:VERIFIED,existingPrimaryStructured,newPrimaryResearch,touched};
}

module.exports={VERSION,VERIFIED,NEXT_REVIEW,routerResearch,nonAmazonSource,explicitPrimarySource,apply};
