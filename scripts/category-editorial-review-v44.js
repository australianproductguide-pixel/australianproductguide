'use strict';
const fs=require('fs');
const path=require('path');
const input=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','category-editorial-selected-v44.json'),'utf8'));
const BRAND=/\b(apple|samsung|sony|dyson|philips|breville|delonghi|de'longhi|ninja|anker|bose|logitech|keychron|tp-link|tapo|reolink|eufy|jbl|sennheiser|insta360|dji|amazon|kindle|google|microsoft|lenovo|asus|acer|hp|dell|lg|panasonic|xiaomi|huawei|roborock|ecovacs|kitchenaid|gopro|huachang)\b/i;
const BAD=/\b(catalog|catalogue|seed|poster|advertisement|manual|diagram|logo|icon|screenshot|packaging|brochure)\b/i;
const rows=input.categories.map(r=>{
  const s=r.selected;if(!s)return {status:'MISSING',slug:r.slug,score:'',title:'',license:'',reason:'no licensed candidate'};
  const flags=[];if(Number(s.score)<70)flags.push('low-score');if(Number(s.thumbWidth||s.width)/Number(s.thumbHeight||s.height)<1.15)flags.push('portrait');if(BRAND.test(s.title))flags.push('brand-specific');if(BAD.test(`${s.title} ${s.description}`))flags.push('catalogue/non-editorial');if(String(s.description||'').length>700)flags.push('long-description');
  return {status:flags.length?'REVIEW':'PASS',slug:r.slug,score:s.score,title:s.title,license:s.license,reason:flags.join(', '),source:s.sourcePage};
});
const counts=rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
const lines=['# APG Category Editorial Image v44 Review','',`Generated: ${new Date().toISOString()}`,`Summary: PASS ${counts.PASS||0} | REVIEW ${counts.REVIEW||0} | MISSING ${counts.MISSING||0}`,'','| Status | Category | Score | Selected file | Licence | Reason |','|---|---|---:|---|---|---|',...rows.map(r=>`| ${r.status} | ${r.slug} | ${r.score} | ${String(r.title).replace(/\|/g,'/')} | ${r.license} | ${r.reason} |`)];
fs.writeFileSync(path.join(__dirname,'..','data','category-editorial-review-v44.md'),lines.join('\n')+'\n');
console.log(lines.slice(0,6).join('\n'));
if((counts.MISSING||0)||(counts.REVIEW||0))process.exitCode=2;
