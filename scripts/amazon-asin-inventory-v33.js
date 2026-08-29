'use strict';
const fs=require('fs');
const path=require('path');
const {products}=require('../data');
const {TAG,amazon,commerce}=require('../data/retailers-v6');

const OUT=path.join(process.cwd(),'artifacts');
fs.mkdirSync(OUT,{recursive:true});
const csvEscape=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const amazonRetailer=p=>(p.retailers||[]).find(r=>r.retailer==='Amazon Australia')||null;
const asinFromUrl=url=>String(url||'').match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase()||null;

const rows=products.map(p=>{
  const eligible=commerce.isCommerceEligible(p);
  const commerceException=commerce.exceptionFor(p);
  const r=amazonRetailer(p);
  const url=r?.affiliateUrl||r?.url||'';
  const status=r?.amazonMatchStatus||(eligible?'UNDOCUMENTED':'COMMERCE_SUPPRESSED');
  const direct=['EXACT_VERIFIED','VARIANT_VERIFIED'].includes(status);
  let parsed=null;try{parsed=new URL(url);}catch{}
  const tag=parsed?.searchParams.get('tag')||null;
  const query=parsed?.searchParams.get('k')||null;
  const asin=String(r?.amazonAuAsin||r?.asin||'').toUpperCase()||null;
  const urlAsin=asinFromUrl(url);
  const expectedSearch=amazon.searchTerm(p).toLocaleLowerCase('en-AU');
  const actualSearch=String(query||'').toLocaleLowerCase('en-AU');
  return {
    apgProduct:p.slug,brand:p.brand||'',model:p.name||'',category:p.category||'',evidenceTier:p.evidenceTier||'',commerceEligible:eligible,
    commerceException:commerceException?.code||null,amazonAuAsin:asin,matchType:status,modelMatch:r?.amazonModelMatch||null,variant:r?.amazonVariantMatch||r?.variant||null,
    affiliateTag:r?.amazonAffiliateTag||tag||null,confidence:direct?'HIGH':eligible?'UNVERIFIED':'SUPPRESSED',verifiedAt:r?.amazonVerifiedAt||r?.verified||commerceException?.reviewedAt||null,
    lastChecked:amazon.CHECKED_AT,exceptionReason:r?.amazonExceptionReason||commerceException?.code||null,amazonUrl:url,note:r?.note||commerceException?.note||'',recommendationWeight:r?.recommendationWeight??0,
    qa:{
      documentedStatus:status!=='UNDOCUMENTED',
      amazonAuDomain:!eligible||parsed?.hostname==='www.amazon.com.au',
      affiliateTag:!eligible||tag===TAG,
      singleTag:!eligible||parsed?.searchParams.getAll('tag').length===1,
      directAsinFormat:!direct||/^[A-Z0-9]{10}$/.test(asin||''),
      directUrlAsinMatch:!direct||asin===urlAsin,
      fallbackHasNoAsin:direct||(!asin&&!urlAsin),
      fallbackIsSpecific:!eligible||direct||(parsed?.pathname==='/s'&&actualSearch===expectedSearch&&expectedSearch.length>=4),
      highConfidenceDirect:!direct||r?.availabilityConfidence==='high',
      variantDocumented:status!=='VARIANT_VERIFIED'||Boolean(r?.amazonVariantMatch||r?.variant),
      suppressionHasNoRetailerPath:eligible||(!r&&!url&&!asin),
      zeroCommercialWeight:(r?.recommendationWeight??0)===0
    }
  };
});

const eligibleRows=rows.filter(r=>r.commerceEligible),suppressedRows=rows.filter(r=>!r.commerceEligible);
const byAsin=new Map();for(const row of rows){if(!row.amazonAuAsin)continue;const list=byAsin.get(row.amazonAuAsin)||[];list.push(row.apgProduct);byAsin.set(row.amazonAuAsin,list);}
const duplicateAsins=[...byAsin.entries()].filter(([,slugs])=>slugs.length>1).map(([asin,slugs])=>({asin,slugs}));
const exact=eligibleRows.filter(r=>r.matchType==='EXACT_VERIFIED'),variants=eligibleRows.filter(r=>r.matchType==='VARIANT_VERIFIED'),fallbacks=eligibleRows.filter(r=>r.matchType==='SEARCH_FALLBACK');
const failures=rows.filter(r=>Object.values(r.qa).some(v=>v===false));
const exceptionCounts={};for(const row of fallbacks)exceptionCounts[row.exceptionReason]=(exceptionCounts[row.exceptionReason]||0)+1;
const pct=n=>Number((100*n/Math.max(1,eligibleRows.length)).toFixed(2));
const summary={version:'amazon-asin-audit-v33',checkedAt:amazon.CHECKED_AT,amazonAssociatesTag:TAG,totalProducts:rows.length,amazonEligibleConservativeDenominator:eligibleRows.length,commerceSuppressed:suppressedRows.length,exactVerified:exact.length,variantVerified:variants.length,directAsinLinks:exact.length+variants.length,searchFallbacks:fallbacks.length,missingAmazonPath:eligibleRows.filter(r=>!r.amazonUrl).length,strictExactCoveragePct:pct(exact.length),verifiedVariantCoveragePct:pct(variants.length),directAsinCoveragePct:pct(exact.length+variants.length),effectiveAmazonCoveragePct:pct(eligibleRows.filter(r=>r.amazonUrl).length),missingAffiliateTracking:eligibleRows.filter(r=>!r.qa.affiliateTag).length,foreignAmazonDomain:eligibleRows.filter(r=>!r.qa.amazonAuDomain).length,duplicateAsins,qaFailures:failures.map(r=>({slug:r.apgProduct,qa:r.qa,asin:r.amazonAuAsin,url:r.amazonUrl})),exceptionCounts,commerceSuppressionCounts:suppressedRows.reduce((acc,r)=>(acc[r.commerceException]=(acc[r.commerceException]||0)+1,acc),{}),policy:'Only commerce-eligible products enter Amazon coverage. HIGH-confidence exact or verified-variant Australian identities receive direct ASIN links; other eligible products retain tagged model-specific searches. Identity/market/safety-suppressed products must have no retailer pathway. ASINs are never guessed.'};
const json={summary,rows};fs.writeFileSync(path.join(OUT,'amazon-au-mapping-register-v33.json'),JSON.stringify(json,null,2));fs.writeFileSync(path.join(OUT,'amazon-asin-summary-v33.json'),JSON.stringify(summary,null,2));
const headers=['APG Product','Brand','Model','Category','Commerce Eligible','Commerce Exception','Amazon AU ASIN','Match Type','Variant','Affiliate Tag','Confidence','Verification','Last Checked','Exception Reason','Amazon URL','Evidence'];const csv=[headers.map(csvEscape).join(',')];for(const r of rows)csv.push([r.apgProduct,r.brand,r.model,r.category,r.commerceEligible,r.commerceException,r.amazonAuAsin,r.matchType,r.variant,r.affiliateTag,r.confidence,r.verifiedAt,r.lastChecked,r.exceptionReason,r.amazonUrl,r.note].map(csvEscape).join(','));fs.writeFileSync(path.join(OUT,'amazon-au-mapping-register-v33.csv'),csv.join('\n')+'\n');console.log(JSON.stringify(summary,null,2));
if(rows.length!==482)throw new Error(`Expected 482 maintained products, found ${rows.length}`);
if(eligibleRows.length+suppressedRows.length!==rows.length)throw new Error('Commerce eligibility denominator reconciliation failed');
if(duplicateAsins.length)throw new Error(`Duplicate Amazon ASIN conflicts: ${JSON.stringify(duplicateAsins)}`);
if(failures.length)throw new Error(`Amazon mapping structural failures: ${failures.length}`);
if(eligibleRows.some(r=>!r.amazonUrl))throw new Error('Every commerce-eligible product must retain a governed Amazon AU pathway');
if(suppressedRows.some(r=>r.amazonUrl||r.amazonAuAsin))throw new Error('Commerce-suppressed products must not expose Amazon purchase/search pathways');
if(rows.some(r=>r.amazonAuAsin==='B0BF65KYFM'))throw new Error('Suppressed Keychron K2 Pro ASIN B0BF65KYFM must not reappear');
if(rows.some(r=>r.amazonUrl.includes('B0CSZ24PNN')))throw new Error('Superseded Samsung Tab A9+ ASIN B0CSZ24PNN must not reappear');
if(eligibleRows.some(r=>r.matchType==='SEARCH_FALLBACK'&&!r.exceptionReason))throw new Error('Every eligible fallback must carry an exception reason');