'use strict';

const fs=require('node:fs');
const [,,strategy,file,source='page-speed-api']=process.argv;
if(!strategy||!file)throw new Error('Usage: node pagespeed-postrelease-measure.js <strategy> <file> [source]');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(data.error){console.error(JSON.stringify(data.error));process.exit(1)}
const lhr=data.lighthouseResult||data;
const categories=lhr.categories||{};
const scores=Object.fromEntries(Object.entries(categories).map(([key,value])=>[key,Math.round(Number(value.score||0)*100)]));
const audits=lhr.audits||{};
const metricIds=[
  'first-contentful-paint','largest-contentful-paint','speed-index','total-blocking-time','cumulative-layout-shift','server-response-time',
  'render-blocking-resources','render-blocking-insight','image-delivery-insight','uses-optimized-images','uses-responsive-images','modern-image-formats',
  'unused-css-rules','unused-javascript','uses-text-compression','third-party-summary','mainthread-work-breakdown'
];
const metrics={};
for(const id of metricIds){
  const audit=audits[id];
  if(!audit)continue;
  metrics[id]={
    score:audit.score,
    displayValue:audit.displayValue||null,
    numericValue:Number.isFinite(audit.numericValue)?audit.numericValue:null,
    savingsMs:Number(audit.details&&audit.details.overallSavingsMs||0),
    savingsBytes:Number(audit.details&&audit.details.overallSavingsBytes||0)
  };
}
const opportunities=Object.values(audits)
  .filter(a=>a&&a.details&&(Number(a.details.overallSavingsMs||0)>0||Number(a.details.overallSavingsBytes||0)>0))
  .map(a=>({id:a.id,title:a.title,score:a.score,displayValue:a.displayValue||null,savingsMs:Math.round(Number(a.details.overallSavingsMs||0)),savingsBytes:Math.round(Number(a.details.overallSavingsBytes||0))}))
  .sort((a,b)=>(b.savingsMs-a.savingsMs)||(b.savingsBytes-a.savingsBytes))
  .slice(0,15);
const result={
  source,
  strategy,
  analysisUTCTimestamp:data.analysisUTCTimestamp||lhr.fetchTime||null,
  lighthouseVersion:lhr.lighthouseVersion||null,
  requestedUrl:lhr.requestedUrl||null,
  finalUrl:lhr.finalUrl||null,
  scores,
  metrics,
  opportunities
};
console.log(`APG_LIGHTHOUSE_RESULT=${JSON.stringify(result)}`);
