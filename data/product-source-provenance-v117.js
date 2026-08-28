'use strict';

// APG product-source provenance v117.
// This is a pure provenance resolver over already-maintained catalogue evidence. It never upgrades
// a retailer/search URL into a manufacturer source merely because it helped identify a product.
// First-party status requires a URL-domain match to APG's governed brand-domain register.
const officialDomains=require('./brand-official-domains-v62');
const commerce=require('./commerce-eligibility-v114');

const VERSION='product-source-provenance-v117';
const REVIEWED_AT='2026-08-29';
const arr=value=>Array.isArray(value)?value.filter(Boolean):[];

function compactBrand(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/ø/g,'o').replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');}
function officialDomainForBrand(brand){
  const target=compactBrand(brand),aliases={rode:'r-de'};
  const alias=aliases[target];if(alias&&officialDomains[alias])return officialDomains[alias];
  for(const [key,domain] of Object.entries(officialDomains))if(compactBrand(key)===target)return domain;
  return null;
}
function hostMatchesDomain(url,domain){
  if(!url||!domain)return false;
  try{const host=new URL(url).hostname.toLowerCase().replace(/^www\./,''),expected=String(domain).toLowerCase().replace(/^www\./,'');return host===expected||host.endsWith(`.${expected}`);}catch{return false;}
}
function validHttpUrl(value){try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:';}catch{return false;}}
function entityStateFor(product){
  if(!product||!product.slug)return null;
  return [...commerce.currentEntityState.values()].find(row=>row.slug===product.slug||row.correctedSlug===product.slug)||null;
}
function evidenceSourceValues(product){
  return arr(product&&product.evidenceSources).flatMap(item=>{
    if(typeof item==='string')return [item];
    if(!item||typeof item!=='object')return [];
    return [item.url,item.source,item.href,item.sourceUrl].filter(Boolean);
  });
}
function candidateSources(product){
  if(!product)return [];
  const exception=commerce.exceptionFor(product),entity=entityStateFor(product);
  return [...new Set([
    exception&&exception.authoritativeSource,
    entity&&entity.authoritativeSource,
    product.officialSource,
    product.manufacturerSource,
    product.primarySource,
    product.source,
    ...evidenceSourceValues(product)
  ].filter(validHttpUrl))];
}
function firstPartySource(product){
  if(!product)return null;
  const officialDomain=officialDomainForBrand(product.brand);if(!officialDomain)return null;
  const url=candidateSources(product).find(value=>hostMatchesDomain(value,officialDomain));
  if(!url)return null;
  const exception=commerce.exceptionFor(product),entity=entityStateFor(product);
  return Object.freeze({
    url,
    domain:officialDomain,
    sourceType:exception&&exception.type==='SAFETY_SUPPRESSED'?'manufacturer-safety-source':'manufacturer-first-party-domain-match',
    confidence:'FIRST_PARTY_DOMAIN_MATCH',
    verifiedAt:(exception&&exception.reviewedAt)||(entity&&(entity.reviewedAt||entity.verifiedAt))||product.lastSourceVerification||product.lastSubstantiveReview||null,
    safetySource:Boolean(exception&&exception.type==='SAFETY_SUPPRESSED')
  });
}
function snapshot(product){
  const firstParty=firstPartySource(product),candidates=candidateSources(product),entity=entityStateFor(product);
  return Object.freeze({
    version:VERSION,
    reviewedAt:REVIEWED_AT,
    brand:product&&product.brand||null,
    officialDomain:officialDomainForBrand(product&&product.brand),
    status:firstParty?'VERIFIED_FIRST_PARTY_DOMAIN':'FIRST_PARTY_PRODUCT_SOURCE_NOT_ESTABLISHED',
    firstPartySource:firstParty,
    candidateSourceCount:candidates.length,
    candidateSources:candidates,
    entityAuthoritativeSource:entity&&entity.authoritativeSource||null,
    note:firstParty?'The maintained source resolves to the governed first-party brand domain. This establishes source provenance, not by itself complete claim-level evidence.':'No maintained candidate source currently resolves to the governed first-party brand domain. Do not label retailer/search evidence as official manufacturer information.'
  });
}

module.exports={VERSION,REVIEWED_AT,compactBrand,officialDomainForBrand,hostMatchesDomain,validHttpUrl,entityStateFor,evidenceSourceValues,candidateSources,firstPartySource,snapshot};
