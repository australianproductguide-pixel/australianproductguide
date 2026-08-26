'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=require('../api/index');
const guard=require('../lib/decision-transport-parity-v1-runtime');

function render(url,headers={}){
  return new Promise((resolve,reject)=>{
    const outHeaders={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au',...headers},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){outHeaders[String(k).toLowerCase()]=String(v)},
      getHeader(k){return outHeaders[String(k).toLowerCase()]},
      removeHeader(k){delete outHeaders[String(k).toLowerCase()]},
      write(){return true},
      end(body=''){resolve({status:this.statusCode,headers:outHeaders,body:String(body||'')})}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}

(async()=>{
  assert.equal(app.DECISION_TRANSPORT_PARITY_VERSION,guard.VERSION,'outer runtime must expose decision transport parity');
  assert.equal(app.HARD_CONSTRAINT_RESULT_PARITY_VERSION,'hard-constraint-result-parity-v1.1','hard-constraint result parity must remain installed first');

  const exclusion=await render('/api/decision?q=wireless%20headphones%20must%20not%20have%20gaming&category=wireless-headphones');
  assert.equal(exclusion.status,200,'exclusion API status');
  assert.equal(exclusion.headers['x-apg-decision-transport-parity'],guard.VERSION,'API decision must pass through request-time transport guard');
  assert.equal(exclusion.headers['x-apg-decision-hard-constraint-fallback'],guard.HARD_CONSTRAINT_FALLBACK_VERSION,'request-time transport must preserve v103.6 remediation provenance');
  const payload=JSON.parse(exclusion.body);
  assert.equal(payload.commercialRecommendationWeight,0,'commercial recommendation weight must remain zero');
  assert.equal(payload.audit?.eligibleCount,0,'missing evidence for a hard exclusion must not be promoted to eligible');
  assert(payload.audit?.unverifiedCount>0,'hard exclusion with missing evidence must retain unverified candidates');
  assert.equal(payload.audit?.hardConstraintFallback,true,'zero verified eligible candidates under a recognised hard constraint must enter fallback');
  assert(payload.results.length>0,'fallback must expose maintained alternatives');
  assert(payload.results.every(row=>row.hardConstraintStatus==='unverified'),'all exposed candidates must remain unverified, not silently eligible');
  assert(payload.results.every(row=>(row.constraintVerification||[]).some(proof=>String(proof?.constraint||'').includes('excluded:gaming')&&proof.state==='UNVERIFIED')),'each candidate must expose UNVERIFIED proof for excluded:gaming');

  const decisionLab=await render('/decision-lab/?q=wireless%20headphones%20must%20not%20have%20gaming&category=wireless-headphones',{'x-apg-decision-json':'1'});
  assert.equal(decisionLab.status,200,'Decision Lab JSON status');
  assert.equal(decisionLab.headers['x-apg-decision-transport-parity'],guard.VERSION,'Decision Lab JSON must use the same request-time transport guard');
  assert.equal(decisionLab.headers['x-apg-decision-hard-constraint-fallback'],guard.HARD_CONSTRAINT_FALLBACK_VERSION,'Decision Lab JSON must preserve v103.6 remediation provenance');
  const labPayload=JSON.parse(decisionLab.body);
  assert.equal(labPayload.audit?.eligibleCount,0,'Decision Lab must agree with /api/decision eligibility');
  assert.equal(labPayload.audit?.unverifiedCount,payload.audit?.unverifiedCount,'Decision Lab and API must share candidate verification semantics');
  assert.equal(labPayload.audit?.hardConstraintFallback,true,'Decision Lab must retain hard-constraint fallback');

  const exact75Response=await render('/api/decision?q=TV+must+be+exactly+75+inches&category=televisions');
  assert.equal(exact75Response.headers['x-apg-decision-hard-constraint-fallback'],guard.HARD_CONSTRAINT_FALLBACK_VERSION,'exact 75-inch benchmark must retain v103.6 provenance');
  const exact75=JSON.parse(exact75Response.body);
  assert(exact75.audit?.eligibleCount>0,'known exact 75-inch benchmark must remain eligible');
  assert.equal(exact75.audit?.hardConstraintFallback,false,'valid exact 75-inch benchmark must not fall back');

  const impossible999Response=await render('/api/decision?q=TV+must+be+exactly+999+inches&category=televisions');
  assert.equal(impossible999Response.headers['x-apg-decision-hard-constraint-fallback'],guard.HARD_CONSTRAINT_FALLBACK_VERSION,'impossible 999-inch benchmark must retain v103.6 provenance');
  const impossible999=JSON.parse(impossible999Response.body);
  assert.equal(impossible999.audit?.eligibleCount,0,'impossible 999-inch benchmark must have zero eligible products');
  assert.equal(impossible999.audit?.hardConstraintFallback,true,'impossible 999-inch benchmark must retain fallback');

  const appSource=fs.readFileSync(require.resolve('../lib/app'),'utf8');
  assert(appSource.includes("const decision=require('./decision-engine-v4')"),'base app must retain an object reference to Decision Engine v4');
  assert(!appSource.includes("const {publicDecision}=require('./decision-engine')"),'base app must not capture the legacy publicDecision function');
  assert(appSource.includes('decision.publicDecision('),'base app must resolve publicDecision dynamically at request time');

  console.log(JSON.stringify({version:guard.VERSION,status:'PASS',checks:{apiDynamicBinding:true,decisionLabDynamicBinding:true,legacyRemediationProvenance:true,hardExclusionFailClosed:true,exact75:true,impossible999:true,commercialWeightZero:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
