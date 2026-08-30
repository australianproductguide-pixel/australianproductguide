'use strict';

// APG eBay family-variant guard v1.3.2
// Narrow follow-up control for product families where the generic matcher can prove a
// shared base token while still missing a material family designation. Controls stay
// explicit per APG product so generic words such as Pro, V2, 360, 5G, PoE and Outdoor
// never become unsafe global rejection rules. Recommendation/commercial weighting = 0.

const VERSION='1.3.2';

const FAMILY_VARIANTS={
  'tp-link-deco-x50':[
    {suffix:'dsl',tokens:['x50dsl']},
    {suffix:'outdoor',tokens:['x50outdoor']},
    {suffix:'poe',tokens:['x50poe']},
    {suffix:'5g',tokens:['x505g']}
  ]
};

// Each group is mandatory. At least one compact token in every group must be present
// in the accepted title or detailed model evidence before an exact mapping can survive.
const REQUIRED_FAMILY_MARKERS={
  'sihoo-doro-c300-pro-v2':[
    {label:'c300-pro',tokens:['c300pro']},
    {label:'v2',tokens:['c300prov2','prov2','version2']}
  ],
  'winix-zero-360-5-stage-air-purifier':[
    {label:'zero-360',tokens:['zero360']}
  ],
  'winix-zero-pro-5-stage-air-purifier':[
    {label:'zero-pro',tokens:['zeropro']}
  ]
};

function clean(value){return String(value==null?'':value).trim();}
function compact(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'');}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function acceptedEvidenceText(accepted){
  const model=accepted&&accepted.verificationEvidence&&Array.isArray(accepted.verificationEvidence.model)
    ?accepted.verificationEvidence.model:[];
  return [accepted&&accepted.title,...model].filter(Boolean).join(' ');
}

function familyVariantConflict(product,title){
  const slug=clean(product&&product.slug);
  const variants=FAMILY_VARIANTS[slug]||[];
  if(!variants.length)return {conflict:false};
  const productFlat=compact([product&&product.model,product&&product.name,slug].filter(Boolean).join(' '));
  const titleFlat=compact(title);
  for(const variant of variants){
    for(const token of variant.tokens){
      if(titleFlat.includes(token)&&!productFlat.includes(token)){
        return {conflict:true,reason:`family-model-variant-mismatch:${variant.suffix}`,suffix:variant.suffix,token};
      }
    }
  }
  return {conflict:false};
}

function requiredFamilyMarkerConflict(product,evidenceText){
  const slug=clean(product&&product.slug);
  const groups=REQUIRED_FAMILY_MARKERS[slug]||[];
  if(!groups.length)return {conflict:false};
  const flat=compact(evidenceText);
  for(const group of groups){
    if(!group.tokens.some(token=>flat.includes(compact(token)))){
      return {conflict:true,reason:`required-family-marker-missing:${group.label}`,marker:group.label};
    }
  }
  return {conflict:false};
}

function applyToEnrichment(product,row){
  if(!row||typeof row!=='object'||!row.accepted)return row;
  const variant=familyVariantConflict(product,row.accepted.title);
  const required=variant.conflict?{conflict:false}:requiredFamilyMarkerConflict(product,acceptedEvidenceText(row.accepted));
  const conflict=variant.conflict?variant:required;
  if(!conflict.conflict)return row;
  const rejected={
    ...row.accepted,
    status:'reject',
    detailVerified:false,
    flags:uniq([...(row.accepted.flags||[]),conflict.reason])
  };
  const candidates=(Array.isArray(row.candidates)?row.candidates:[]).map(candidate=>{
    if(candidate&&candidate.itemId===rejected.itemId)return rejected;
    return candidate;
  });
  const review=candidates.find(candidate=>candidate&&candidate.status==='review')||null;
  return {
    ...row,
    status:review?'review':'no-match',
    accepted:null,
    review,
    candidates,
    familyGuard:{
      version:VERSION,
      rejectedItemId:rejected.itemId||null,
      reason:conflict.reason,
      suffix:conflict.suffix||null,
      marker:conflict.marker||null
    }
  };
}

module.exports={VERSION,FAMILY_VARIANTS,REQUIRED_FAMILY_MARKERS,compact,acceptedEvidenceText,familyVariantConflict,requiredFamilyMarkerConflict,applyToEnrichment};
