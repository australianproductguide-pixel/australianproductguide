#!/usr/bin/env node
// APG freshness/model audit. Flags defects and review debt; never auto-publishes product facts.
require('../lib/consumer-readability-v13');
const {products,categories}=require('../data');
const now=new Date(process.env.APG_AUDIT_DATE||Date.now());
const parse=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?null:x};
const hard=[],warnings=[],seen=new Set();
for(const p of products){
  if(!p.slug||seen.has(p.slug))hard.push(`${p.slug||'(missing slug)'}: duplicate or missing slug`);else seen.add(p.slug);
  for(const key of ['brand','name','category','source','testingStatus','lastSourceVerification','nextReviewDue'])if(!p[key])hard.push(`${p.slug}: missing ${key}`);
  if(p.source&&!/^https:\/\//.test(p.source))hard.push(`${p.slug}: primary source is not HTTPS`);
  const sd=parse(p.lastSourceVerification),rd=parse(p.nextReviewDue),ret=parse(p.lastRetailerCheck);
  if(!sd)hard.push(`${p.slug}: invalid lastSourceVerification`);
  if(!rd)hard.push(`${p.slug}: invalid nextReviewDue`);else if(rd<now)warnings.push(`${p.slug}: review overdue since ${p.nextReviewDue}`);
  if(!ret)hard.push(`${p.slug}: invalid lastRetailerCheck`);
  for(const r of p.retailers||[]){
    if(r.kind==='affiliate-direct'&&(!r.asin||!/^B[A-Z0-9]{9}$/.test(r.asin)))hard.push(`${p.slug}: exact Amazon row has invalid ASIN`);
    if(r.kind==='affiliate-direct'&&(r.affiliateUrl||r.url)&&!(r.affiliateUrl||r.url).includes('tag=auproductguid-22'))hard.push(`${p.slug}: exact Amazon row missing APG Associates tag`);
  }
}
for(const [slug,c] of Object.entries(categories)){
  if(!Array.isArray(c.products)||!c.products.length)hard.push(`${slug}: empty maintained category`);
  if((c.products||[]).some(p=>p.category!==slug))hard.push(`${slug}: product/category identity mismatch`);
}
const report={generatedAt:now.toISOString(),products:products.length,categories:Object.keys(categories).length,brands:new Set(products.map(p=>p.brand)).size,exactAmazonProducts:products.filter(p=>(p.retailers||[]).some(r=>r.kind==='affiliate-direct')).length,hardErrors:hard,warnings};
console.log(JSON.stringify(report,null,2));
if(hard.length){console.error(`APG freshness audit FAILED with ${hard.length} hard error(s).`);process.exit(1);}
console.log(`APG freshness audit passed. ${warnings.length} review warning(s) require human follow-up.`);
