'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const decision=require('../lib/decision-engine-v4');
const verification=require('../lib/hard-constraint-verification-v1');

function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=v;},
      getHeader(k){return headers[String(k).toLowerCase()];},
      removeHeader(k){delete headers[String(k).toLowerCase()];},
      write(){return true;},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject);}catch(error){reject(error);}
  });
}

(async()=>{
  assert.equal(verification.VERSION,'1.0');
  assert.deepEqual(Object.values(verification.STATES),['RECOGNISED','VERIFIED','UNVERIFIED','FAILED']);

  const absent=verification.explicitNegativeTagEvidence({specs:[['ANC','No']]},'anc');
  assert(absent,'explicit structured negative evidence must be detectable');
  assert.equal(absent.state,'EXPLICIT_ABSENCE');
  assert.equal(verification.explicitNegativeTagEvidence({specs:[['Battery','30 hours']]},'anc'),null,'unrelated specs must not prove absence');

  const requiredBase={p:{brand:'Example',specs:[['ANC','No']]},eligibility:'unverified',reasons:[],gaps:[],conflicts:[],hardFailures:[],verificationNeeds:['Required anc is not verified in the maintained evidence']};
  const requiredChecked=verification.applyConstraintEvidence(requiredBase,{requiredTags:['anc'],hardExcludedTags:[]});
  assert.equal(requiredChecked.eligibility,'ineligible','explicit negative evidence must fail a required capability');
  assert(requiredChecked.hardFailures.some(x=>/required anc is not supported/i.test(x)),'required negative evidence must remain explainable');

  const excludedUnknownBase={p:{brand:'Example',specs:[['Battery','30 hours']]},eligibility:'eligible',reasons:[],gaps:[],conflicts:[],hardFailures:[],verificationNeeds:[]};
  const excludedUnknown=verification.applyConstraintEvidence(excludedUnknownBase,{requiredTags:[],hardExcludedTags:['gaming']});
  assert.equal(excludedUnknown.eligibility,'unverified','absence of positive evidence must not verify an exclusion');
  assert(excludedUnknown.verificationNeeds.some(x=>/excluded gaming is absent/i.test(x)),'unverified exclusion must state the evidence gap');

  const excludedVerifiedBase={p:{brand:'Example',specs:[['Gaming','No']]},eligibility:'eligible',reasons:[],gaps:[],conflicts:[],hardFailures:[],verificationNeeds:[]};
  const excludedVerified=verification.applyConstraintEvidence(excludedVerifiedBase,{requiredTags:[],hardExcludedTags:['gaming']});
  assert.equal(excludedVerified.eligibility,'eligible','explicit maintained absence may verify an exclusion');
  const excludedTrace=verification.constraintVerification(excludedVerified,{requiredTags:[],hardExcludedTags:['gaming']});
  assert.equal(excludedTrace[0]?.state,'VERIFIED');

  const recognised=verification.recognisedConstraints({budgetHard:true,budget:400,requiredTags:['anc'],hardExcludedTags:['gaming'],excludedBrands:['Brand X'],numericConstraints:[{key:'screen-size-inches',label:'screen size',value:75,unit:'in',mode:'exact',hard:true}]});
  assert.equal(recognised.length,5);
  assert(recognised.every(x=>x.state==='RECOGNISED'));

  assert.equal(decision.HARD_CONSTRAINT_VERIFICATION_VERSION,'1.0','shared Decision Engine must expose the verification version after current runtime installation');

  const requiredAnc=await render('/api/decision?q=wireless+headphones+must+have+anc&category=wireless-headphones');
  assert.equal(requiredAnc.status,200);
  const anc=JSON.parse(requiredAnc.body);
  assert.equal(anc.commercialRecommendationWeight,0);
  assert.equal(anc.constraintVerification?.version,'1.0');
  assert((anc.constraintVerification?.recognised||[]).some(x=>x.key==='required:anc'&&x.state==='RECOGNISED'),'required ANC must be explicitly recognised');
  assert.equal(anc.results[0]?.constraintVerification?.find(x=>x.key==='required:anc')?.state,'VERIFIED','known ANC evidence must verify the must-have');
  assert.equal(anc.results[0]?.hardConstraintStatus,'eligible');

  const excludedUnknown=await render('/api/decision?q=wireless+headphones+must+not+have+gaming&category=wireless-headphones');
  assert.equal(excludedUnknown.status,200);
  const noGaming=JSON.parse(excludedUnknown.body);
  assert.equal(noGaming.audit?.eligibleCount,0,'an exclusion with no absence proof must not leave products fully eligible');
  assert(noGaming.audit?.unverifiedCount>0,'unknown absence must produce unverified candidates');
  assert.equal(noGaming.audit?.hardConstraintFallback,true,'zero verified eligible candidates under a hard exclusion must enter fallback');
  assert(noGaming.results.length>0);
  assert(noGaming.results.every(row=>row.hardConstraintStatus==='unverified'),'fallback candidates must remain explicitly unverified');
  assert(noGaming.results.every(row=>row.constraintVerification?.find(x=>x.key==='excluded:gaming')?.state==='UNVERIFIED'),'each candidate must expose the unverified exclusion state');

  const exact75=await render('/api/decision?q=TV+must+be+exactly+75+inches&category=televisions');
  const exact=JSON.parse(exact75.body);
  assert.equal(exact.audit?.hardConstraintFallback,false);
  assert(exact.audit?.eligibleCount>0);
  assert.equal(exact.results[0]?.constraintVerification?.find(x=>x.key==='numeric:screen-size-inches')?.state,'VERIFIED','known exact 75-inch evidence must verify the constraint');

  const impossible=await render('/api/decision?q=TV+must+be+exactly+999+inches&category=televisions');
  const noMatch=JSON.parse(impossible.body);
  assert.equal(noMatch.audit?.eligibleCount,0);
  assert.equal(noMatch.audit?.hardConstraintFallback,true);
  assert(noMatch.results.every(row=>row.hardConstraintStatus==='ineligible'));
  assert(noMatch.results.every(row=>row.constraintVerification?.find(x=>x.key==='numeric:screen-size-inches')?.state==='FAILED'),'verified numeric conflicts must be explicit FAILED states');

  console.log('HARD_CONSTRAINT_VERIFICATION_V1=PASS states=RECOGNISED|VERIFIED|UNVERIFIED|FAILED no-evidence-is-not-absence commercialWeight=0');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
