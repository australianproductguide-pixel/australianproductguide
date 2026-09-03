'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const app=require('../api/index');
const diagnostic=require('../api/home-assembly-diagnostic');
const apiSource=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const diagnosticSource=fs.readFileSync(path.join(root,'api','home-assembly-diagnostic.js'),'utf8');
const budgetSource=fs.readFileSync(path.join(root,'lib','home-response-header-budget-v132-runtime.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));

// Each already-built boundary is exposed for private noindex diagnostics. The final four stages
// make the exact Home-only presentation, delivery and response-header budget independently
// observable without bypassing the governed public export.
const EXPECTED=['runtime','transport','premium','journey','stable','mobile','whole','audit','presentation','searchImages','categoryImages','pagespeed','reviewProfiles','final','desktopHome','desktopTrust','googleDelivery','homeBudget'];
assert.equal(typeof app,'function');
assert(apiSource.includes('const desktopHomeHeaderHandler=finalPresentationStability.wrapDesktopHome(finalHandler);'),'public export must route the desktop Home layer through v131 streaming safety');
assert(apiSource.includes('const desktopAboutTrustContrastHandler=finalPresentationStability.wrapDesktopTrust(desktopHomeHeaderHandler);'),'public export must route the desktop trust layer through v131 streaming safety');
assert(apiSource.includes('const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(desktopAboutTrustContrastHandler);'),'public export must retain the narrow v128 delivery wrapper');
assert(apiSource.includes('const homeResponseHeaderBudgetHandler=homeResponseHeaderBudget.wrap(googleDiscoverabilityPerformanceHandler);'),'public export must retain the Home-only v132 response-header budget outside v128');
assert(apiSource.trim().endsWith('module.exports=homeResponseHeaderBudgetHandler;'),'governed public export must be the completed v132-wrapped handler');
assert.equal(app.GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION,'128.2','public export must expose the current v128 delivery generation');
assert.equal(app.FINAL_PRESENTATION_STABILITY_VERSION,'131.0','public export must expose the streaming-safe final presentation generation');
assert.equal(app.HOME_RESPONSE_HEADER_BUDGET_VERSION,'132.0','public export must expose the current Home response-header budget');
assert.deepEqual(Array.from(app.APG_P0_HOME_ASSEMBLY_STAGE_NAMES||[]),EXPECTED,'assembly stage order must be explicit');
assert.deepEqual(Object.keys(app.APG_P0_HOME_ASSEMBLY_HANDLERS||{}),EXPECTED,'only intended diagnostic assembly boundaries may be exposed');
for(const stage of EXPECTED)assert.equal(typeof app.APG_P0_HOME_ASSEMBLY_HANDLERS[stage],'function',`${stage}: stage must be a function`);
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.final,app,'diagnostic final checkpoint must remain below final presentation, v128 delivery and v132 budgeting');
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.desktopHome,app,'desktop Home checkpoint must remain below trust, Google delivery and Home budgeting');
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.desktopTrust,app,'desktop trust checkpoint must remain below Google delivery and Home budgeting');
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.googleDelivery,app,'Google delivery checkpoint must remain below the Home-only budget');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.homeBudget,app,'final diagnostic checkpoint must be the exact public export');
assert.notEqual(app.APG_P0_HOME_ASSEMBLY_HANDLERS.runtime,app,'runtime checkpoint must remain below outer assembly');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.final.BRAND_LOGO_STABILITY_VERSION,'125.0','diagnostic final checkpoint must retain governed brand stability');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.desktopHome.DESKTOP_HOME_HEADER_VERSION,'126.2','desktop Home checkpoint must preserve its certified visual generation');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.desktopTrust.DESKTOP_ABOUT_TRUST_CONTRAST_VERSION,'127.0','desktop trust checkpoint must preserve its certified contrast generation');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.pagespeed.PAGESPEED_AGENTIC_CERTIFICATION_VERSION,'113.5','diagnostic PageSpeed checkpoint must retain P0-safe transport certification');
assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.homeBudget.HOME_RESPONSE_HEADER_BUDGET_VERSION,'132.0','diagnostic Home budget stage must retain v132');
assert.equal(diagnostic.VERSION,'3.2');
assert.equal(diagnostic.NATIVE_HOME_URL,'/?__apg_home_diag=1');

assert(diagnosticSource.includes("req.url=`${NATIVE_HOME_URL}&__apg_home_assembly_stage=${encodeURIComponent(stage)}`"),'diagnostic must enter native Home behind the diagnostic bypass marker');
assert(diagnosticSource.includes("safeSetHeader(res,'Cache-Control','no-store, max-age=0')"),'diagnostic must remain no-store');
assert(diagnosticSource.includes("safeSetHeader(res,'X-Robots-Tag','noindex, nofollow, noarchive')"),'diagnostic must remain noindex');
assert(diagnosticSource.includes("const headerBudget=require('../lib/home-response-header-budget-v132-runtime')"),'diagnostic transport must reuse the governed v132 header budget');
assert(diagnosticSource.includes('function compactDiagnosticHeaders(res,stage)'),'diagnostic transport must compact historical X-APG headers before commit');
assert(diagnosticSource.includes("if(stage==='homeBudget')"),'the exact public budget stage must not be double-compacted');
assert(diagnosticSource.includes("const nativeWrite=typeof res.write==='function'?res.write.bind(res):null"),'diagnostic must compact before streamed writes');
assert(diagnosticSource.includes("const nativeFlushHeaders=typeof res.flushHeaders==='function'?res.flushHeaders.bind(res):null"),'diagnostic must compact before explicit flush');
assert(budgetSource.includes("'x-apg-p0-home-assembly-bisect'"),'v132 must preserve the private diagnostic identity marker');
assert(budgetSource.includes("'x-apg-p0-home-assembly-stage'"),'v132 must preserve the exact requested stage marker');
assert(diagnosticSource.includes('throw error'),'diagnostic must preserve real failure semantics');
assert(diagnosticSource.includes('function resolveStage'),'diagnostic stage resolution must remain explicit');
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
      headersSent:false,
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
  console.log(`P0_HOME_ASSEMBLY_BISECT_V32=PASS stages=${EXPECTED.length} publicExport=v128.2+v131.0+v132.0 diagnosticFinal=homeBudget transportBudget=all-stages publicHome=native-restored diagnostic=post-recovery-watch publicEbayNetwork=0 commercialWeight=unchanged`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
