'use strict';
const fs=require('fs');
const path=require('path');
const {products}=require('../data');
const {TAG,amazon}=require('../data/retailers-v6');

const OUT=path.join(process.cwd(),'artifacts');
fs.mkdirSync(OUT,{recursive:true});
const csvEscape=v=>`"${String(v??'').replace(/"/g,'""')}"`;
const amazonRetailer=p=>(p.retailers||[]).find(r=>r.retailer==='Amazon Australia')||null;
const asinFromUrl=url=>String(url||'').match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i)?.[1]?.toUpperCase()||null;

const rows=products.map(p=>{
  const r=amazonRetailer(p);
  const url=r?.affiliateUrl||r?.url||'';
  const status=r?.amazonMatchStatus||'UNDOCUMENTED';
  const direct=['EXACT_VERIFIED','VARIANT_VERIFIED'].includes(status);
  let parsed=null;try{parsed=new URL(url);}catch{}
  const tag=parsed?.searchParams.get('tag')||null;
  const query=parsed?.searchParams.get('k')||null;
  const asin=String(r?.amazonAuAsin||r?.asin||'').toUpperCase()||null;
  const urlAsin=asinFromUrl(url);
  const expectedSearch=amazon.searchTerm(p).toLocaleLowerCase('en-AU');
  const actualSearch=String(query||'').toLocaleLowerCase('en-AU');
  return {
    apgProduct:p.slug,
    brand:p.brand||'',
    model:p.name||'',
    category:p.category||'',
    evidenceTier:p.evidenceTier||'',
    amazonAuAsin:asin,
    matchType:status,
    modelMatch:r?.amazonModelMatch||null,
    variant:r?.amazonVariantMatch||r?.variant||null,
    affiliateTag:r?.amazonAffiliateTag||tag||null,
    confidence:direct?'HIGH':'UNVERIFIED',
    verifiedAt:r?.amazonVerifiedAt||r?.verified||null,
    lastChecked:amazon.CHECKED_AT,
    exceptionReason:r?.amazonExceptionReason||null,
    amazonUrl:url,
    note:r?.note||'',
    recommendationWeight:r?.recommendationWeight??null,
    qa:{
      documentedStatus:status!=='UNDOCUMENTED',
      amazonAuDomain:parsed?.hostname==='www.amazon.com.au',
      affiliateTag:tag===TAG,
      singleTag:parsed?.searchParams.getAll('tag').length===1,
      directAsinFormat:!direct||/^[A-Z0-9]{10}$/.test(asin||''),
      directUrlAsinMatch:!direct||asin===urlAsin,
      fallbackHasNoAsin:direct||(!asin&&!urlAsin),
      fallbackIsSpecific:direct||(parsed?.pathname==='/s'&&actualSearch===expectedSearch&&expectedSearch.length>=4),
      highConfidenceDirect:!direct||r?.availabilityConfidence==='high',
      variantDocumented:status!=='VARIANT_VERIFIED'||Boolean(r?.amazonVariantMatch||r?.variant),
      zeroCommercialWeight:(r?.recommendationWeight??0)===0
    }
  };
});

const byAsin=new Map();
for(const row of rows){if(!row.amazonAuAsin)continue;const list=byAsin.get(row.amazonAuAsin)||[];list.push(row.apgProduct);byAsin.set(row.amazonAuAsin,list);}
const duplicateAsins=[...byAsin.entries()].filter(([,slugs])=>slugs.length>1).map(([asin,slugs])=>({asin,slugs}));
const exact=rows.filter(r=>r.matchType==='EXACT_VERIFIED');
const variants=rows.filter(r=>r.matchType==='VARIANT_VERIFIED');
const fallbacks=rows.filter(r=>r.matchType==='SEARCH_FALLBACK');
const failures=rows.filter(r=>Object.values(r.qa).some(v=>v===false));
const exceptionCounts={};
for(const row of fallbacks)exceptionCounts[row.exceptionReason]=(exceptionCounts[row.exceptionReason]||0)+1;
const pct=n=>Number((100*n/rows.length).toFixed(2));
const summary={
  version:'amazon-asin-audit-v33',checkedAt:amazon.CHECKED_AT,amazonAssociatesTag:TAG,
  totalProducts:rows.length,amazonEligibleConservativeDenominator:rows.length,
  exactVerified:exact.length,variantVerified:variants.length,directAsinLinks:exact.length+variants.length,
  searchFallbacks:fallbacks.length,missingAmazonPath:rows.filter(r=>!r.amazonUrl).length,
  strictExactCoveragePct:pct(exact.length),verifiedVariantCoveragePct:pct(variants.length),
  directAsinCoveragePct:pct(exact.length+variants.length),effectiveAmazonCoveragePct:pct(rows.filter(r=>r.amazonUrl).length),
  missingAffiliateTracking:rows.filter(r=>!r.qa.affiliateTag).length,foreignAmazonDomain:rows.filter(r=>!r.qa.amazonAuDomain).length,
  duplicateAsins,qaFailures:failures.map(r=>({slug:r.apgProduct,qa:r.qa,asin:r.amazonAuAsin,url:r.amazonUrl})),
  exceptionCounts,
  policy:'Only HIGH-confidence exact or verified-variant Amazon Australia identities receive direct ASIN links. All other products retain tagged model-specific Amazon Australia searches; ASINs are never guessed.'
};

const json={summary,rows};
fs.writeFileSync(path.join(OUT,'amazon-au-mapping-register-v33.json'),JSON.stringify(json,null,2));
fs.writeFileSync(path.join(OUT,'amazon-asin-summary-v33.json'),JSON.stringify(summary,null,2));
const headers=['APG Product','Brand','Model','Category','Amazon AU ASIN','Match Type','Variant','Affiliate Tag','Confidence','Verification','Last Checked','Exception Reason','Amazon URL','Evidence'];
const csv=[headers.map(csvEscape).join(',')];
for(const r of rows)csv.push([r.apgProduct,r.brand,r.model,r.category,r.amazonAuAsin,r.matchType,r.variant,r.affiliateTag,r.confidence,r.verifiedAt,r.lastChecked,r.exceptionReason,r.amazonUrl,r.note].map(csvEscape).join(','));
fs.writeFileSync(path.join(OUT,'amazon-au-mapping-register-v33.csv'),csv.join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));

if(rows.length!==482)throw new Error(`Expected 482 maintained products, found ${rows.length}`);
if(duplicateAsins.length)throw new Error(`Duplicate Amazon ASIN conflicts: ${JSON.stringify(duplicateAsins)}`);
if(failures.length)throw new Error(`Amazon mapping structural failures: ${failures.length}`);
if(rows.some(r=>r.amazonAuAsin==='B0BF65KYFM'))throw new Error('Suppressed Keychron K2 Pro ASIN B0BF65KYFM must not reappear');
if(rows.some(r=>r.amazonUrl.includes('B0CSZ24PNN')))throw new Error('Superseded Samsung Tab A9+ ASIN B0CSZ24PNN must not reappear');
if(rows.some(r=>r.matchType==='SEARCH_FALLBACK'&&!r.exceptionReason))throw new Error('Every fallback must carry an exception reason');
