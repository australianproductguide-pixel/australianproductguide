const rumClientJs=`
;(()=>{
// Field RUM is intentionally sparse. Automated browser certification is excluded
// and only ~2% of genuine page loads report web-vitals telemetry.
if(navigator.webdriver||!('PerformanceObserver' in window)||Math.random()>0.02)return;
const metrics={};
const set=(name,value)=>{if(Number.isFinite(value))metrics[name]=Math.round(value*100)/100};
try{new PerformanceObserver(list=>{for(const e of list.getEntries())set('LCP',e.startTime)}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
try{let cls=0;new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)cls+=e.value;set('CLS',cls)}).observe({type:'layout-shift',buffered:true})}catch{}
try{let inp=0;new PerformanceObserver(list=>{for(const e of list.getEntries())inp=Math.max(inp,e.duration||0);set('INP',inp)}).observe({type:'event',buffered:true,durationThreshold:40})}catch{}
try{for(const e of performance.getEntriesByType('paint'))if(e.name==='first-contentful-paint')set('FCP',e.startTime);const n=performance.getEntriesByType('navigation')[0];if(n)set('TTFB',n.responseStart)}catch{}
let sent=false;function send(){if(sent)return;sent=true;const body=JSON.stringify({path:location.pathname,metrics,nav:performance.getEntriesByType('navigation')[0]?.type||'navigate',viewport:innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop'});try{navigator.sendBeacon('/api/rum',new Blob([body],{type:'application/json'}))}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')send()},{once:true});window.addEventListener('pagehide',send,{once:true});
})();
`;
module.exports={rumClientJs};
