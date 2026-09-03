'use strict';

const fs=require('node:fs');
const path=require('node:path');

const OUT=path.resolve(process.argv[2]||process.env.OUTPUT_DIR||'artifacts/google-discoverability-v128-lighthouse');
const EXPECTED_RUNS=5;
const EXPECTED_BASE=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const DEVICES=['mobile','desktop'];
const THRESHOLDS=Object.freeze({
  mobile:Object.freeze({performanceMedian:90,lcpMedianMs:2500,tbtMedianMs:200,clsMedian:0.1,accessibilityMinimum:100,bestPracticesMinimum:100,seoMinimum:100}),
  desktop:Object.freeze({performanceMedian:95,lcpMedianMs:2500,tbtMedianMs:200,clsMedian:0.1,accessibilityMinimum:100,bestPracticesMinimum:100,seoMinimum:100})
});

function assert(ok,message){if(!ok)throw new Error(message)}
function finite(value,label){const number=Number(value);assert(Number.isFinite(number),`${label} must be finite`);return number}
function score(lhr,key){
  const raw=lhr.categories&&lhr.categories[key]&&lhr.categories[key].score;
  return Number((finite(raw,`category ${key}`)*100).toFixed(1));
}
function auditNumber(lhr,key){
  const audit=lhr.audits&&lhr.audits[key];
  assert(audit,`audit ${key} missing`);
  return finite(audit.numericValue,`audit ${key}.numericValue`);
}
function median(values){
  assert(values.length>0,'median requires values');
  const sorted=[...values].sort((a,b)=>a-b);
  const middle=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}
function rounded(value,digits=1){return Number(Number(value).toFixed(digits))}
function stats(values,digits=1){return {minimum:rounded(Math.min(...values),digits),median:rounded(median(values),digits),maximum:rounded(Math.max(...values),digits)};}
function readLhr(filename){
  const raw=JSON.parse(fs.readFileSync(filename,'utf8'));
  const lhr=raw.lighthouseResult||raw;
  assert(lhr&&lhr.categories&&lhr.audits,`${path.basename(filename)} is not a Lighthouse result`);
  return lhr;
}
function resultFiles(device){
  const expression=new RegExp(`^${device}-(\\d+)\\.json$`);
  return fs.readdirSync(OUT)
    .map(name=>({name,match:name.match(expression)}))
    .filter(row=>row.match)
    .sort((a,b)=>Number(a.match[1])-Number(b.match[1]));
}
function analyseDevice(device){
  const files=resultFiles(device);
  assert(files.length===EXPECTED_RUNS,`${device}: expected ${EXPECTED_RUNS} Lighthouse results, found ${files.length}`);
  assert(files.every((row,index)=>Number(row.match[1])===index+1),`${device}: run numbering must be 1-${EXPECTED_RUNS}`);

  const runs=files.map((row,index)=>{
    const lhr=readLhr(path.join(OUT,row.name));
    const requested=String(lhr.requestedUrl||'');
    const finalUrl=String(lhr.finalUrl||'');
    assert(requested.startsWith(EXPECTED_BASE),`${device}-${index+1}: requested URL ${requested} does not match exact candidate ${EXPECTED_BASE}`);
    assert(finalUrl.startsWith(EXPECTED_BASE),`${device}-${index+1}: final URL ${finalUrl} does not match exact candidate ${EXPECTED_BASE}`);
    return {
      run:index+1,
      filename:row.name,
      lighthouseVersion:lhr.lighthouseVersion||null,
      fetchTime:lhr.fetchTime||null,
      requestedUrl:requested,
      finalUrl,
      scores:{
        performance:score(lhr,'performance'),
        accessibility:score(lhr,'accessibility'),
        bestPractices:score(lhr,'best-practices'),
        seo:score(lhr,'seo')
      },
      metrics:{
        firstContentfulPaintMs:rounded(auditNumber(lhr,'first-contentful-paint')),
        largestContentfulPaintMs:rounded(auditNumber(lhr,'largest-contentful-paint')),
        totalBlockingTimeMs:rounded(auditNumber(lhr,'total-blocking-time')),
        cumulativeLayoutShift:rounded(auditNumber(lhr,'cumulative-layout-shift'),3),
        speedIndexMs:rounded(auditNumber(lhr,'speed-index'))
      }
    };
  });

  const values={
    performance:runs.map(run=>run.scores.performance),
    accessibility:runs.map(run=>run.scores.accessibility),
    bestPractices:runs.map(run=>run.scores.bestPractices),
    seo:runs.map(run=>run.scores.seo),
    firstContentfulPaintMs:runs.map(run=>run.metrics.firstContentfulPaintMs),
    largestContentfulPaintMs:runs.map(run=>run.metrics.largestContentfulPaintMs),
    totalBlockingTimeMs:runs.map(run=>run.metrics.totalBlockingTimeMs),
    cumulativeLayoutShift:runs.map(run=>run.metrics.cumulativeLayoutShift),
    speedIndexMs:runs.map(run=>run.metrics.speedIndexMs)
  };
  const summary={
    scores:{
      performance:stats(values.performance),
      accessibility:stats(values.accessibility),
      bestPractices:stats(values.bestPractices),
      seo:stats(values.seo)
    },
    metrics:{
      firstContentfulPaintMs:stats(values.firstContentfulPaintMs),
      largestContentfulPaintMs:stats(values.largestContentfulPaintMs),
      totalBlockingTimeMs:stats(values.totalBlockingTimeMs),
      cumulativeLayoutShift:stats(values.cumulativeLayoutShift,3),
      speedIndexMs:stats(values.speedIndexMs)
    }
  };

  const threshold=THRESHOLDS[device];
  const checks={
    fiveComparableRuns:runs.length===EXPECTED_RUNS&&runs.every(run=>run.finalUrl.startsWith(EXPECTED_BASE)),
    performanceMedian:summary.scores.performance.median>=threshold.performanceMedian,
    accessibilityEveryRun:summary.scores.accessibility.minimum>=threshold.accessibilityMinimum,
    bestPracticesEveryRun:summary.scores.bestPractices.minimum>=threshold.bestPracticesMinimum,
    seoEveryRun:summary.scores.seo.minimum>=threshold.seoMinimum,
    largestContentfulPaintMedian:summary.metrics.largestContentfulPaintMs.median<=threshold.lcpMedianMs,
    totalBlockingTimeMedian:summary.metrics.totalBlockingTimeMs.median<=threshold.tbtMedianMs,
    cumulativeLayoutShiftMedian:summary.metrics.cumulativeLayoutShift.median<=threshold.clsMedian
  };
  const failures=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  return {device,thresholds:threshold,runs,summary,checks,failures,status:failures.length?'FAIL':'PASS'};
}
function markdown(report){
  const lines=[
    '# APG Google Discoverability v128.2 — Lighthouse certification',
    '',
    `**Status:** ${report.status}`,
    '',
    `**Exact candidate base:** \`${report.base}\``,
    '',
    `**Runs:** ${EXPECTED_RUNS} mobile + ${EXPECTED_RUNS} desktop`,
    '',
    '| Device | Performance median | Accessibility minimum | Best Practices minimum | SEO minimum | LCP median | TBT median | CLS median | Result |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---|'
  ];
  for(const device of report.devices){
    lines.push(`| ${device.device} | ${device.summary.scores.performance.median} | ${device.summary.scores.accessibility.minimum} | ${device.summary.scores.bestPractices.minimum} | ${device.summary.scores.seo.minimum} | ${device.summary.metrics.largestContentfulPaintMs.median} ms | ${device.summary.metrics.totalBlockingTimeMs.median} ms | ${device.summary.metrics.cumulativeLayoutShift.median} | ${device.status} |`);
  }
  lines.push('','## Thresholds','');
  lines.push('- Mobile Performance median ≥ 90.');
  lines.push('- Desktop Performance median ≥ 95.');
  lines.push('- Accessibility, Best Practices and SEO = 100 on every run.');
  lines.push('- Median LCP ≤ 2,500 ms, TBT ≤ 200 ms and CLS ≤ 0.1 on each device class.');
  lines.push('','## Interpretation','');
  lines.push('This is an exact-candidate, loopback Lighthouse release gate. It verifies repeatable code and rendering behaviour before Production; it is not represented as public PageSpeed field evidence or a guarantee of permanent 100 scores.');
  if(report.failures.length){
    lines.push('','## Failures','');
    for(const failure of report.failures)lines.push(`- ${failure}`);
  }
  return lines.join('\n')+'\n';
}

(function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const devices=DEVICES.map(analyseDevice);
  const failures=devices.flatMap(device=>device.failures.map(failure=>`${device.device}:${failure}`));
  const report={
    version:'128.2',
    environment:'exact-candidate-loopback-lighthouse',
    base:EXPECTED_BASE,
    expectedRunsPerDevice:EXPECTED_RUNS,
    generatedAt:new Date().toISOString(),
    devices,
    failures,
    status:failures.length?'FAIL':'PASS'
  };
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  fs.writeFileSync(path.join(OUT,'summary.md'),markdown(report));
  console.log(`APG_GOOGLE_DISCOVERABILITY_V128_LIGHTHOUSE=${report.status}`);
  for(const device of devices){
    console.log(`${device.device.toUpperCase()} performance=${device.summary.scores.performance.median} accessibilityMin=${device.summary.scores.accessibility.minimum} bestPracticesMin=${device.summary.scores.bestPractices.minimum} seoMin=${device.summary.scores.seo.minimum} lcp=${device.summary.metrics.largestContentfulPaintMs.median}ms tbt=${device.summary.metrics.totalBlockingTimeMs.median}ms cls=${device.summary.metrics.cumulativeLayoutShift.median}`);
  }
  if(report.status!=='PASS')process.exit(1);
})();
