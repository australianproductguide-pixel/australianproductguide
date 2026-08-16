const fs=require('fs');
const {products,categories}=require('../data');
const {direct}=require('../data/retailers');

const today=new Date(`${process.env.APG_FRESHNESS_DATE||new Date().toISOString().slice(0,10)}T00:00:00Z`);
const days=(a,b)=>Math.floor((a-b)/86400000);
const age=d=>d?days(today,new Date(`${d}T00:00:00Z`)):null;
const queue=[];
function add(p,type,severity,detail){queue.push({type,severity,slug:p.slug,category:p.category,brand:p.brand,name:p.name,detail});}
for(const p of products){
  if(!p.lastSourceVerification)add(p,'source-missing','critical','No source verification date');
  else if(age(p.lastSourceVerification)>45)add(p,'source-stale','high',`${age(p.lastSourceVerification)} days since source verification`);
  if(!p.lastRetailerCheck)add(p,'retailer-missing','critical','No retailer-link check date');
  else if(age(p.lastRetailerCheck)>30)add(p,'retailer-stale','high',`${age(p.lastRetailerCheck)} days since retailer-link check`);
  if(!p.lastImageVerification)add(p,'image-missing','high','No image-rights verification date');
  else if(age(p.lastImageVerification)>90)add(p,'image-stale','medium',`${age(p.lastImageVerification)} days since image-rights verification`);
  if(!p.lastPriceCheck)add(p,'price-unmaintained','info','No maintained price check; retailer price must be verified at click-through');
  else if(age(p.lastPriceCheck)>7)add(p,'price-stale','medium',`${age(p.lastPriceCheck)} days since price check`);
  if(!p.nextReviewDue)add(p,'review-due-missing','high','No next-review date');
  else if(new Date(`${p.nextReviewDue}T00:00:00Z`)<today)add(p,'review-overdue','high',`Review due ${p.nextReviewDue}`);
  if(p.evidenceTier==='starter'&&!p.lastSubstantiveReview)add(p,'deep-research-pending','info','Starter evidence: substantive manufacturer/specification review pending');
  if(!direct[p.slug])add(p,'exact-amazon-link-pending','info','Model-search fallback is used; exact Amazon Australia product listing is not independently verified');
  const retailer=(p.retailers||[])[0];
  if(!retailer?.imageVerified)add(p,'genuine-image-pending','info','No approved third-party product image is active; APG-owned visual remains in use');
}
const byType=Object.fromEntries([...new Set(queue.map(x=>x.type))].sort().map(t=>[t,queue.filter(x=>x.type===t).length]));
const actionable=queue.filter(x=>x.severity!=='info');
const report={generatedAt:new Date().toISOString(),asOf:today.toISOString().slice(0,10),products:products.length,categories:Object.keys(categories).length,actionable:actionable.length,informational:queue.length-actionable.length,byType,queue};
const out=process.argv[2]||'freshness-report.json';fs.writeFileSync(out,JSON.stringify(report,null,2));
const lines=[
  '# APG Catalogue Freshness Queue','',
  `As of **${report.asOf}**: ${report.products} products across ${report.categories} populated categories.`,
  `Actionable stale/missing controls: **${report.actionable}**. Informational maturity queues: **${report.informational}**.`,'',
  '| Queue | Count |','|---|---:|',...Object.entries(byType).map(([k,v])=>`| ${k} | ${v} |`),'',
  '## Actionable records','',
  ...(actionable.length?actionable.map(x=>`- **${x.severity.toUpperCase()} · ${x.type}** — ${x.brand} ${x.name} (${x.category}): ${x.detail}`):['- None.'])
];
fs.writeFileSync(out.replace(/\.json$/,'')+'.md',lines.join('\n')+'\n');
console.log(`FRESHNESS_PRODUCTS=${report.products}`);console.log(`FRESHNESS_CATEGORIES=${report.categories}`);console.log(`FRESHNESS_ACTIONABLE=${report.actionable}`);for(const [k,v] of Object.entries(byType))console.log(`QUEUE_${k.toUpperCase().replace(/-/g,'_')}=${v}`);
if(process.env.APG_FAIL_ON_STALE==='1'&&actionable.length)process.exitCode=1;
