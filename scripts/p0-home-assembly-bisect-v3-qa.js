'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const app=require('../api/index');
const diagnostic=require('../api/home-assembly-diagnostic');
const apiSource=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const diagnosticSource=fs.readFileSync(path.join(root,'api','home-assembly-diagnostic.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));

// These are the already-built diagnostic boundaries retained beneath the later desktop and
// v128 delivery wrappers. The diagnostic is deliberately not a second production entry point.
const EXPECTED=['runtime','transport','premium','journey','stable','mobile','whole','audit','presentation','searchImages','categoryImages','pagespeed','reviewProfiles','final'];
assert.equal(typeof app,'function');
assert(apiSource.includes('const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(desktopAboutTrustContrastHandler);'),'public export must retain the narrow v128 final delivery wrapper');
assert(apiSource.trim().endsWith('module.exports=googleDiscoverabilityPerformanceHandler;'),'governed public export must remain the completed v128-wrapped handler');
assert.equal(app.GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION,'128.2','public export must expose the current v128 delivery generation');
assert.deepEqual(Array.from(app.APG_P0_HOME_ASSEMBLY_STAGE_NAMES||[]),EXPECTED,'assembly stage order must be explicit');
assert.deepEqual(Object.keys(app.APG_P0_HOME_ASSEMBLY_HANDLERS||{}),EXPECTED,'only intended diagnostic assembly boundaries may be exposed');
for(const stage of EXPECTED)assert.equal(typeof app.APG_P0_HOME_ASSEMBLY_HANDLERS[stage],'function',`${stage}: stage must be a function`);
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.final,app,'diagnostic final checkpoint must remain below desktop and v128 public delivery wrappers');
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.runtime,app,'runtime checkpoint must remain below outer assembly');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.final.BRAND_LOGO_STABILITY_VERSION,'125.0','diagnostic final checkpoint must retain governed brand stability');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.pagespeed.PAGESPEED_AGENTIC_CERTIFICATION_VERSION,'113.5','diagnostic PageSpeed checkpoint must retain P0-safe transport certification');
assert.equal(diagnostic.VERSION,'3.0');
assert.equal(diagnostic.NATIVE_HOME_URL,'/?__apg_home_diag=1');

assert(diagnosticSource.includes("req.url=`${NATIVE_HOME_URL}&__apg_home_assembly_stage=${encodeURIComponent(stage)}`"),'diagnostic must enter native Home behind the diagnostic bypass marker');
assert(diagnosticSource.includes("res.setHeader('Cache-Control','no-store, max-age=0')"),'diagnostic must remain no-store');
assert(diagnosticSource.includes("res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive')"),'diagnostic must remain noindex');
assert(diagnosticSource.includes('throw error'),'diagnostic must preserve real failure semantics');
assert(!diagnosticSource.includes('ebay-browse-api'),'diagnostic must not import eBay Browse');
assert(!diagnosticSource.includes('EBAY_BROWSE'),'diagnostic must not touch eBay Browse configuration');
assert(!diagnosticSource.includes('fetch('),'diagnostic must create zero outbound network calls');
assert(!diagnosticSource.includes('recommendationWeight'),'diagnostic must not alter recommendation scoring');
assert.equal(config.functions?.['api/home-assembly-diagnostic.js']?.includeFiles,'public/assets/**/*.css','diagnostic must package the same governed CSS assets needed by outer Home wrappers');
assert.equal((config.routes||[]).length,6,'post-recovery Vercel routing must contain only the four protected routes, filesystem handling and API fallback');
assert(!(config.routes||[]).some(route=>route&&route.src==='/'&&('status' in route||route.headers?.Location)),'native Home must not be hidden behind the retired P0 Search redirect');
assert.equal((config.routes||[])[0]?.src,'/mcp','protected MCP routing must remain first after native Home restoration');
assert.equal((config.routes||[])[4]?.handle,'filesystem','filesystem routing must remain before the general API fallback');
assert.equal((config.routes||[])[5]?.src,'/(.*)','general API fallback must remain last');
assert.equal((config.routes||[])[5]?.dest,'/api','general API fallback destination must remain unchanged');

function invokeUnknown(){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url:'/api/home-assembly-diagnostic?target=not-a-stage',method:'GET',headers:{host:'australianproductguide.au'}};
    const res={
      statusCode:200,
      setHeader(name,value){headers[String(name).toLowerCase()]=String(value);return this},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')})}
    };
    try{const result=diagnostic(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}

(async()=>{
  const unknown=await invokeUnknown();
  assert.equal(unknown.status,404,'unknown stages must fail closed');
  assert.equal(unknown.body,'Not found','unknown stages must not disclose valid stage names');
  assert.match(String(unknown.headers['cache-control']||''),/no-store/);
  assert.match(String(unknown.headers['x-robots-tag']||''),/noindex/);
  console.log(`P0_HOME_ASSEMBLY_BISECT_V3=PASS stages=${EXPECTED.length} publicExport=v128.2 diagnosticFinal=brand-stability-v125 publicHome=native-restored diagnostic=post-recovery-watch publicEbayNetwork=0 commercialWeight=unchanged`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
