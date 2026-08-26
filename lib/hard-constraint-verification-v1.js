'use strict';

// APG hard-constraint verification v1.
// Recognition and proof are separate states. A parsed requirement is RECOGNISED at the
// decision level; each candidate is then VERIFIED, UNVERIFIED or FAILED against maintained
// evidence. Absence of a positive signal is never treated as proof that an excluded feature
// is absent.

const VERSION='1.1';
const STATES=Object.freeze({RECOGNISED:'RECOGNISED',VERIFIED:'VERIFIED',UNVERIFIED:'UNVERIFIED',FAILED:'FAILED'});
const NEGATIVE_VALUES=new Set(['false','no','none','not supported','unsupported','not available','n/a']);
const TAG_ALIASES={
  'usb-c':['usb-c','usb c','type c'],
  anc:['anc','active noise cancellation','active noise cancelling','noise cancellation','noise cancelling'],
  battery:['battery','battery life'],
  quiet:['quiet','silent','low noise'],
  comfort:['comfort','comfortable','long wear','long-wear'],
  compact:['compact','small','small space'],
  value:['value','affordable','cheap','lower price'],
  premium:['premium','flagship','high end'],
  pets:['pet','pets','pet hair','dog hair','cat hair'],
  mopping:['mop','mopping'],
  streaming:['streaming','netflix'],
  'bright-room':['bright room','bright living room','sunny room','glare'],
  'high-refresh':['high refresh','refresh rate','120hz','144hz','165hz','sport','sports','motion'],
  gaming:['gaming','gamer'],
  travel:['travel','flight','flying','commute'],
  family:['family','household'],
  'auto-dose':['auto dose','automatic dosing','auto dispense'],
  'low-maintenance':['low maintenance','hands off','automatic dock'],
  ethernet:['ethernet','wired backhaul'],
  oled:['oled'],
  'mini-led':['mini led','mini-led'],
  camera:['camera','photo','photography'],
  portable:['portable','lightweight'],
  'local-storage':['local storage','micro sd','microsd'],
  'subscription-free':['no subscription','subscription free'],
  milk:['milk','flat white','latte','cappuccino'],
  beginner:['beginner','easy','simple'],
  'hands-on':['hands on','manual control'],
  cold:['cold coffee','iced coffee','cold brew']
};

function norm(value){return String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function human(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function aliases(tag){return uniq([tag,String(tag||'').replace(/-/g,' '),...(TAG_ALIASES[tag]||[])]).map(norm).filter(Boolean);}
function includesAny(text,terms){const hay=` ${norm(text)} `;return terms.some(term=>hay.includes(` ${term} `)||hay.includes(` ${term}:`)||hay.includes(`${term} `));}
function negativeValue(value){return NEGATIVE_VALUES.has(norm(value));}
function specRows(product){return (product&&Array.isArray(product.specs)?product.specs:[]).filter(Array.isArray);}
function explicitNegativeTagEvidence(product,tag){
  const terms=aliases(tag);
  for(const row of specRows(product)){
    const label=row[0],value=row[1];
    if(includesAny(label,terms)&&negativeValue(value))return {source:'structured-spec',label:String(label||''),value:String(value??''),state:'EXPLICIT_ABSENCE'};
  }
  const evidence=product&&product.factEvidence&&typeof product.factEvidence==='object'?product.factEvidence:{};
  for(const [key,row] of Object.entries(evidence)){
    const value=row&&typeof row==='object'&&Object.prototype.hasOwnProperty.call(row,'value')?row.value:row;
    if(includesAny(key,terms)&&negativeValue(value))return {source:'fact-evidence',label:key,value:String(value??''),state:'EXPLICIT_ABSENCE'};
  }
  return null;
}
function hasText(rows,text){const x=norm(text);return (rows||[]).some(row=>norm(row).includes(x));}
function setUnverified(row){if(row.eligibility==='eligible')row.eligibility='unverified';}
function applyConstraintEvidence(input,intent={}){
  const row={...input,reasons:[...(input.reasons||[])],gaps:[...(input.gaps||[])],conflicts:[...(input.conflicts||[])],hardFailures:[...(input.hardFailures||[])],verificationNeeds:[...(input.verificationNeeds||[])]};
  for(const tag of intent.requiredTags||[]){
    const label=human(tag).toLowerCase();
    const alreadyVerified=hasText(row.reasons,`supports required ${label}`);
    const alreadyFailed=hasText(row.hardFailures,label);
    if(!alreadyVerified&&!alreadyFailed){
      const absent=explicitNegativeTagEvidence(row.p,tag);
      if(absent){
        row.eligibility='ineligible';
        row.hardFailures.push(`Maintained evidence explicitly shows required ${label} is not supported`);
        row.conflicts.push(`Your required ${label} is explicitly unavailable in the maintained evidence`);
        row.verificationNeeds=row.verificationNeeds.filter(x=>!norm(x).includes(norm(`required ${label}`)));
      }
    }
  }
  for(const tag of intent.hardExcludedTags||[]){
    const label=human(tag).toLowerCase();
    const failed=hasText(row.hardFailures,label)||hasText(row.conflicts,label);
    if(failed)continue;
    const absent=explicitNegativeTagEvidence(row.p,tag);
    if(!absent){
      setUnverified(row);
      row.verificationNeeds.push(`Maintained evidence does not verify that excluded ${label} is absent`);
    }
  }
  row.reasons=uniq(row.reasons);row.gaps=uniq(row.gaps);row.conflicts=uniq(row.conflicts);row.hardFailures=uniq(row.hardFailures);row.verificationNeeds=uniq(row.verificationNeeds);
  return row;
}
function recognisedConstraints(intent={}){
  const out=[];
  if(intent.budgetHard&&Number(intent.budget)>0)out.push({key:'budget-ceiling',type:'budget',label:'Maximum budget',requirement:`A$${Number(intent.budget).toLocaleString('en-AU')} maximum`,state:STATES.RECOGNISED});
  for(const tag of intent.requiredTags||[])out.push({key:`required:${tag}`,type:'required-capability',label:`Must have ${human(tag)}`,requirement:'Required',state:STATES.RECOGNISED});
  for(const tag of intent.hardExcludedTags||[])out.push({key:`excluded:${tag}`,type:'excluded-capability',label:`Must not have ${human(tag)}`,requirement:'Excluded',state:STATES.RECOGNISED});
  for(const brand of intent.excludedBrands||[])out.push({key:`excluded-brand:${norm(brand).replace(/\s+/g,'-')}`,type:'excluded-brand',label:`Exclude ${brand}`,requirement:'Excluded',state:STATES.RECOGNISED});
  for(const brand of intent.requiredBrands||[])out.push({key:`required-brand:${norm(brand).replace(/\s+/g,'-')}`,type:'required-brand',label:`Must be ${brand}`,requirement:'Required brand',state:STATES.RECOGNISED});
  for(const c of intent.numericConstraints||[])if(c&&c.hard)out.push({key:`numeric:${c.key}`,type:'numeric',label:human(c.label||c.key),requirement:`${c.mode} ${c.value}${c.unit==='in'?' in':c.unit?` ${c.unit}`:''}`,state:STATES.RECOGNISED});
  return out;
}
function constraintVerification(row,intent={}){
  const out=[];
  const add=(key,type,label,requirement,state,observed,reason,evidence=null)=>out.push({key,type,label,requirement,state,observed:observed??null,reason:reason||null,evidence});
  const price=Number(row?.p?.price)>0?Number(row.p.price):null;
  if(intent.budgetHard&&Number(intent.budget)>0){
    const limit=Number(intent.budget),state=price==null?STATES.UNVERIFIED:price<=limit?STATES.VERIFIED:STATES.FAILED;
    add('budget-ceiling','budget','Maximum budget',`A$${limit.toLocaleString('en-AU')} maximum`,state,price==null?'Maintained exact price unavailable':`A$${price.toLocaleString('en-AU')}`,state===STATES.UNVERIFIED?'Current exact budget compliance cannot be confirmed from maintained pricing.':state===STATES.FAILED?'Known maintained price basis exceeds the hard ceiling.':'Known maintained price basis is within the hard ceiling.');
  }
  for(const tag of intent.requiredTags||[]){
    const label=human(tag),needle=label.toLowerCase(),failed=hasText(row.hardFailures,needle),verified=hasText(row.reasons,`supports required ${needle}`),absent=explicitNegativeTagEvidence(row.p,tag);
    const state=failed||absent?STATES.FAILED:verified?STATES.VERIFIED:STATES.UNVERIFIED;
    add(`required:${tag}`,'required-capability',`Must have ${label}`,'Required',state,absent?`${absent.label}: ${absent.value}`:verified?'Supported by maintained product evidence':'Not established',state===STATES.FAILED?'Maintained evidence conflicts with this must-have.':state===STATES.VERIFIED?'Maintained evidence verifies this must-have.':'Maintained evidence is insufficient to confirm this must-have.',absent);
  }
  for(const tag of intent.hardExcludedTags||[]){
    const label=human(tag),needle=label.toLowerCase(),failed=hasText(row.hardFailures,needle)||hasText(row.conflicts,needle),absent=explicitNegativeTagEvidence(row.p,tag);
    const state=failed?STATES.FAILED:absent?STATES.VERIFIED:STATES.UNVERIFIED;
    add(`excluded:${tag}`,'excluded-capability',`Must not have ${label}`,'Excluded',state,failed?'Present/conflicting':absent?`${absent.label}: ${absent.value}`:'Absence not established',state===STATES.FAILED?'Maintained evidence shows the excluded capability is present.':state===STATES.VERIFIED?'Maintained evidence explicitly verifies the excluded capability is absent.':'APG does not treat missing positive evidence as proof of absence.',absent);
  }
  for(const brand of intent.excludedBrands||[]){
    const failed=norm(row?.p?.brand)===norm(brand),state=failed?STATES.FAILED:STATES.VERIFIED;
    add(`excluded-brand:${norm(brand).replace(/\s+/g,'-')}`,'excluded-brand',`Exclude ${brand}`,'Excluded',state,row?.p?.brand||null,failed?'Product brand conflicts with the explicit exclusion.':'Maintained product identity verifies a different brand.');
  }
  for(const brand of intent.requiredBrands||[]){
    const verified=norm(row?.p?.brand)===norm(brand),state=verified?STATES.VERIFIED:STATES.FAILED;
    add(`required-brand:${norm(brand).replace(/\s+/g,'-')}`,'required-brand',`Must be ${brand}`,'Required brand',state,row?.p?.brand||null,verified?'Maintained product identity verifies the required brand.':'Product brand conflicts with the explicit required-brand constraint.');
  }
  for(const c of intent.numericConstraints||[]){
    if(!c||!c.hard)continue;
    const label=human(c.label||c.key),needle=norm(c.label||c.key),failed=(row.hardFailures||[]).some(x=>norm(x).includes(needle)),verified=(row.reasons||[]).some(x=>norm(x).includes(needle)&&/verified|satisfies/i.test(String(x)));
    const state=failed?STATES.FAILED:verified?STATES.VERIFIED:STATES.UNVERIFIED;
    add(`numeric:${c.key}`,'numeric',label,`${c.mode} ${c.value}${c.unit==='in'?' in':c.unit?` ${c.unit}`:''}`,state,verified?'Verified maintained value':failed?'Conflicting maintained value':'Maintained value unavailable',state===STATES.FAILED?'Maintained numeric evidence conflicts with the hard requirement.':state===STATES.VERIFIED?'Maintained numeric evidence satisfies the hard requirement.':'Maintained numeric evidence is insufficient to confirm this hard requirement.');
  }
  return out;
}
function summary(rows=[]){return {recognised:rows.length,verified:rows.filter(x=>x.state===STATES.VERIFIED).length,unverified:rows.filter(x=>x.state===STATES.UNVERIFIED).length,failed:rows.filter(x=>x.state===STATES.FAILED).length};}

module.exports={VERSION,STATES,TAG_ALIASES,negativeValue,explicitNegativeTagEvidence,applyConstraintEvidence,recognisedConstraints,constraintVerification,summary};
