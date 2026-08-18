const fs=require('fs');
const path=require('path');
const {products}=require('../data');
const {TAG}=require('../data/retailers-v6');

const checkedAt='2026-08-18';
function amazonRow(p){
  const r=(p.retailers||[]).find(x=>x.retailer==='Amazon Australia')||null;
  const exact=Boolean(r&&r.kind==='affiliate-direct'&&r.asin);
  const url=r?.affiliateUrl||r?.url||null;
  let urlAsin=null;
  if(url){const m=String(url).match(/\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i);urlAsin=m?m[1].toUpperCase():null;}
  return {
    apg_product:p.slug,
    brand:p.brand||'',
    name:p.name||'',
    category:p.category||'',
    evidence_tier:p.evidenceTier||'',
    amazon_au_asin:exact?String(r.asin).toUpperCase():null,
    amazon_au_url:url,
    amazon_link_type:exact?'EXACT_VERIFIED':'SEARCH_FALLBACK',
    amazon_match_status:exact?'EXACT_VERIFIED':'SEARCH_FALLBACK',
    amazon_model_match:exact?'exact-or-recorded-variant':'unverified-exact-listing',
    amazon_variant_match:exact?(r.variant||null):null,
    amazon_verified_at:exact?(r.verified||null):null,
    amazon_affiliate_tag:TAG,
    amazon_confidence:exact?(r.availabilityConfidence||'high'):'unverified',
    amazon_note:r?.note||null,
    url_asin:urlAsin,
    qa:{
      amazon_au_domain:typeof url==='string'&&/^https:\/\/www\.amazon\.com\.au\//.test(url),
      correct_tag:typeof url==='string'&&new URL(url).searchParams.get('tag')===TAG,
      asin_format:!exact||/^[A-Z0-9]{10}$/.test(String(r.asin||'')),
      asin_matches_url:!exact||urlAsin===String(r.asin||'').toUpperCase(),
      search_is_specific:exact||(/\/s\?k=/.test(String(url||''))&&String(url||'').length>45)
    }
  };
}
const rows=products.map(amazonRow);
const byAsin=new Map();
for(const row of rows){if(!row.amazon_au_asin)continue;const a=byAsin.get(row.amazon_au_asin)||[];a.push(row.apg_product);byAsin.set(row.amazon_au_asin,a);}
const duplicateAsins=[...byAsin.entries()].filter(([,slugs])=>slugs.length>1).map(([asin,slugs])=>({asin,slugs}));
const failures=rows.filter(r=>Object.values(r.qa).some(v=>v===false));
const exact=rows.filter(r=>r.amazon_link_type==='EXACT_VERIFIED').length;
const summary={
  version:'amazon-asin-audit-v33',
  checkedAt,
  totalProducts:rows.length,
  exactVerified:exact,
  searchFallbacks:rows.length-exact,
  exactCoveragePct:Number((exact/rows.length*100).toFixed(2)),
  effectiveAmazonCoveragePct:Number((rows.filter(r=>r.amazon_au_url).length/rows.length*100).toFixed(2)),
  duplicateAsins,
  qaFailures:failures.map(r=>({slug:r.apg_product,qa:r.qa,url:r.amazon_au_url,asin:r.amazon_au_asin}))
};
const outDir=path.join(process.cwd(),'artifacts');fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'amazon-asin-inventory-v33.json'),JSON.stringify({summary,rows},null,2));
fs.writeFileSync(path.join(outDir,'amazon-asin-summary-v33.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
if(rows.length!==482)throw new Error(`Expected 482 maintained products, found ${rows.length}`);
if(failures.length)throw new Error(`Amazon structural QA failures: ${failures.length}`);
