'use strict';
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const candidatesPath=path.join(root,'data','category-editorial-candidates-v45.json');
const selectedPath=path.join(root,'data','category-editorial-selected-v45.json');
const data=require(candidatesPath);

const VETO={
  'dehumidifiers':/control panel|replacement filter|circuit|pcb/i,
  'electric-toothbrushes':/white background|isolated on white/i,
  'fridges':/spec tag|rating plate|serial|nameplate|data plate|model tag|label/i,
  'gaming-monitors':/main stage|expo|trade show|event stage/i,
  'hair-dryers':/in a bag|hotel bathroom|plug|gfci|wiring/i,
  'luggage':/okoban|baggage tag|luggage tag|barcode|label/i,
  'microwave-ovens':/cr400|train|railway|metro|carriage/i,
  'photo-printers':/xerox printer on desk|office copier/i,
  'portable-air-conditioners':/tube at a school|outdoor unit|compressor unit/i,
  'portable-monitors':/fetal|foetal|heart beat|heartbeat|medical|patient|hospital/i,
  'tablets':/pump and tablets|pill|medicine|medication|pharma|pharmaceutical|capsule|blister pack/i,
  'televisions':/hdmi-connected|windows computer|homepage|controller companion|test pattern/i,
  'washing-machines':/\b200[0-9]\b|\b201[0-3]\b|museum|historic/i
};
const PREMIUM=/\b(modern|home|kitchen|living room|desk|office|interior|lifestyle|using|use|person|woman|man|family|studio|salon|travel|outdoor|workshop|bathroom|laundry|cafe|coffee shop|natural light|bright)\b/i;
const WEAK=/\b(white background|isolated|control panel|manual|spec tag|test pattern|museum|archive|historic|diagram|advertisement|catalogue|catalog|internal components)\b/i;
const PROVENANCE_RISK=/\b(?:EFTA\d*|Jeffrey Epstein|Epstein Files|Little Saint James|DOJ disclosures|FBI raid on Epstein|2019 FBI raid on Epstein|Palm Beach Police[^.]{0,120}Epstein)\b/i;

for(const row of data.categories){
  for(const c of row.candidates){
    const text=`${c.title||''} ${c.description||''} ${c.categories||''} ${c.creator||''} ${c.credit||''}`;
    let adjustment=0;
    if(PREMIUM.test(text))adjustment+=32;
    if(WEAK.test(text))adjustment-=80;
    if(VETO[row.slug]?.test(text))adjustment-=500;
    if(PROVENANCE_RISK.test(text))adjustment-=2000;
    c.premiumAdjustment=adjustment;
    c.score=Number(c.score||0)+adjustment;
  }
  row.candidates.sort((a,b)=>Number(b.score||0)-Number(a.score||0)||Number(b.width||0)-Number(a.width||0));
}

data.generatedAt=new Date().toISOString();
data.policy.selection='Premium-first relevance scoring + APG second-pass curation that demotes ambiguous, dated, technical, non-consumer and provenance-inappropriate hero imagery.';
data.summary.withCandidates=data.categories.filter(r=>r.candidates.length).length;
data.summary.withPremiumCandidates=data.categories.filter(r=>r.candidates.some(c=>Number(c.score)>=90&&!PROVENANCE_RISK.test(`${c.title||''} ${c.description||''} ${c.categories||''} ${c.creator||''} ${c.credit||''}`))).length;
fs.writeFileSync(candidatesPath,JSON.stringify(data,null,2)+'\n');

const rows=data.categories.map(r=>({slug:r.slug,label:r.label,query:r.query,error:r.error,selected:r.candidates.find(c=>!PROVENANCE_RISK.test(`${c.title||''} ${c.description||''} ${c.categories||''} ${c.creator||''} ${c.credit||''}`))||null,candidateCount:r.candidates.length}));
const policy={...data.policy};
fs.writeFileSync(selectedPath,JSON.stringify({version:'category-editorial-selected-v45',generatedAt:new Date().toISOString(),policy,summary:{categories:rows.length,selected:rows.filter(r=>r.selected).length,missing:rows.filter(r=>!r.selected).length},categories:rows},null,2)+'\n');
console.log(`Second-pass curation complete: ${rows.filter(r=>r.selected).length}/${rows.length} categories have candidates; ${data.summary.withPremiumCandidates} have >=90 premium score.`);
for(const r of rows){if(r.selected)console.log(`${r.slug}: ${r.selected.score} ${r.selected.title}`);else console.log(`${r.slug}: MISSING`);}
