'use strict';

// APG eBay family-variant guard v1.3.1
// Narrow follow-up control for product families where a base model and materially
// different suffixed variants share the same leading model token. This guard is
// deliberately explicit rather than adding generic words such as "5G", "PoE" or
// "Outdoor" to the global matcher, which could reject legitimate unrelated products.
// Recommendation/commercial weighting remains zero.

const VERSION='1.3.1';

const FAMILY_VARIANTS={
  'tp-link-deco-x50':[
    {suffix:'dsl',tokens:['x50dsl']},
    {suffix:'outdoor',tokens:['x50outdoor']},
    {suffix:'poe',tokens:['x50poe']},
    {suffix:'5g',tokens:['x505g']}
  ]
};

function clean(value){return String(value==null?'':value).trim();}
function compact(value){return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'');}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}

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

function applyToEnrichment(product,row){
  if(!row||typeof row!=='object'||!row.accepted)return row;
  const conflict=familyVariantConflict(product,row.accepted.title);
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
    familyGuard:{version:VERSION,rejectedItemId:rejected.itemId||null,reason:conflict.reason,suffix:conflict.suffix}
  };
}

module.exports={VERSION,FAMILY_VARIANTS,compact,familyVariantConflict,applyToEnrichment};
