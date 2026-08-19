'use strict';

const VERSION='evidence-depth-v49-pass5';
const STRUCTURED_AT='2026-08-20';

const targetSlugs=[
  'apple-iphone-17','samsung-galaxy-s26','google-pixel-10','oppo-find-x9','honor-magic8-pro',
  'apple-iphone-17-pro','samsung-galaxy-s26-ultra','google-pixel-10-pro','samsung-galaxy-z-flip7',
  'lg-530l-slim-french-door-fridge','samsung-495l-french-door-fridge-non-plumbed-dispenser','fisher-and-paykel-series-7-498l-quad-door-fridge-ice-and-water','westinghouse-619l-french-door-fridge','lg-508l-slim-french-door-instaview-fridge',
  'bosch-series-6-60cm-freestanding-dishwasher','fisher-and-paykel-series-11-integrated-tall-double-dishdrawer','lg-14-place-quadwash-built-under-dishwasher','electrolux-60cm-built-under-dishwasher-comfortlift','westinghouse-60cm-15-place-freestanding-dishwasher',
  'fisher-paykel-wh1260h5-series-11-12kg-front-loader','miele-wq-1000-wps-nova-edition','asko-w4104c-w-au-10kg-washing-machine'
];
const targetSet=new Set(targetSlugs);

const human=v=>String(v||'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const displayValue=v=>typeof v==='boolean'?(v?'Yes':'No'):Array.isArray(v)?v.join(', '):typeof v==='object'&&v!==null?JSON.stringify(v):String(v);
const primaryFact=row=>row&&/manufacturer/i.test(String(row.sourceType||''))&&/^https:\/\//i.test(String(row.source||''))&&!/amazon\.com\.au/i.test(String(row.source||''));

function buildStructuredSpecs(p){
  const specs=[];
  const seen=new Set();
  const add=(label,value)=>{if(value===undefined||value===null||value==='')return;const k=String(label).toLowerCase();if(seen.has(k))return;seen.add(k);specs.push([String(label),displayValue(value)]);};
  for(const row of p.specs||[])if(Array.isArray(row)&&row.length>=2)add(row[0],row[1]);
  for(const [key,value] of Object.entries(p.decisionAttributes||{}))add(human(key),value);
  for(const [key,row] of Object.entries(p.factEvidence||{})){
    if(['exactProductIdentity','exactModel','canonicalCategory'].includes(key)||!primaryFact(row))continue;
    add(row.label||human(key),row.unit?`${displayValue(row.value)} ${row.unit}`:row.value);
  }
  (p.highlights||[]).forEach((value,index)=>add(`Verified manufacturer claim ${index+1}`,value));
  return specs;
}

function apply({categoryMaps=[]}={}){
  const seenProducts=new Set(),touched=[],failures=[];
  for(const map of categoryMaps)for(const category of Object.values(map||{}))for(const p of category.products||[]){
    if(!p||seenProducts.has(p.slug)){continue;}seenProducts.add(p.slug);if(!targetSet.has(p.slug))continue;
    const before=p.lastSourceVerification||null;
    const primaryFacts=Object.values(p.factEvidence||{}).filter(primaryFact).length;
    if(!/^https:\/\//i.test(String(p.source||''))||/amazon\.com\.au/i.test(String(p.source||''))||primaryFacts<5){failures.push({slug:p.slug,reason:'Target did not retain the established exact-primary evidence floor'});continue;}
    p.specs=buildStructuredSpecs(p);
    if(p.specs.length<3){failures.push({slug:p.slug,reason:'Unable to materialise at least three structured specifications'});continue;}
    p.evidenceDepthVersion=VERSION;
    p.evidenceDepthStatus='maintained-primary-evidence-structured-v49-pass5';
    p.evidenceDepthStructuredAt=STRUCTURED_AT;
    p.lastSourceVerification=before;
    touched.push(p.slug);
  }
  const missing=targetSlugs.filter(slug=>!seenProducts.has(slug));
  for(const slug of missing)failures.push({slug,reason:'Maintained target product not found'});
  return{version:VERSION,structuredAt:STRUCTURED_AT,targetCount:targetSlugs.length,structuredPrimaryRecords:touched.length,touched,failures,newPrimaryResearch:0,provenancePolicy:'Structure existing exact manufacturer evidence without rewriting the original source-verification date or claiming new research.'};
}

module.exports={VERSION,STRUCTURED_AT,targetSlugs,buildStructuredSpecs,apply};
