'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const content=require('../lib/content');

const TRUST_SLUGS=[
  'about','contact','methodology','editorial-standards','sources',
  'corrections-policy','affiliate-disclosure','privacy','terms','coverage','updates'
];
const REVIEW_DATE='23 August 2026';
const CONTACT_EMAIL='contact@australianproductguide.au';
const facts=content.__facts;

assert.ok(facts&&Number.isInteger(facts.products)&&facts.products>0,'data-driven product count required');
assert.ok(Number.isInteger(facts.categories)&&facts.categories>0,'data-driven populated category count required');
assert.ok(Number.isInteger(facts.brands)&&facts.brands>0,'data-driven represented brand count required');

const banned=[
  /37 products/i,
  /37-product/i,
  /257 products/i,
  /48 populated categories/i,
  /four live categories/i,
  /four categories are fully maintained/i,
  /no consumer account/i,
  /no public account system/i,
  /contact channel has not yet been activated/i,
  /dedicated public venture contact channel has not yet been activated/i,
  /dedicated venture privacy contact[^.]*planned/i,
  /privacy contact[^.]*planned/i,
  /professional review flag/i,
  /pre-API/i,
  /Basic Display imagery/i,
  /RLS protected/i,
  /Row Level Security/i,
  /Decision Engine v\d/i,
  /Catalogue Intelligence v\d/i,
  /planned supported product-data route is Amazon Creators API/i
];

function assertNoBanned(text,label){
  for(const pattern of banned)assert.doesNotMatch(text,pattern,`${label} contains superseded/internal wording: ${pattern}`);
}
function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=v;},
      getHeader(k){return headers[String(k).toLowerCase()];},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject);}catch(error){reject(error);}
  });
}

function assertCanonicalSource(){
  assert.equal(Object.keys(content).length,TRUST_SLUGS.length,'Trust Centre must expose exactly eleven enumerable canonical pages');
  for(const slug of TRUST_SLUGS){
    const page=content[slug];
    assert.ok(page&&page.title&&page.heading&&page.description&&page.body,`canonical ${slug} content required`);
    assert.match(page.body,new RegExp(REVIEW_DATE.replace(/ /g,'\\s+'),'i'),`${slug} truthful review date`);
    assertNoBanned(page.body,`canonical ${slug}`);
  }

  for(const slug of ['about','coverage','updates']){
    const body=content[slug].body;
    assert.match(body,new RegExp(`${facts.products} products`),`${slug} product count must come from catalogue facts`);
    assert.match(body,new RegExp(`${facts.categories} populated categories`),`${slug} category count must come from catalogue facts`);
    assert.match(body,new RegExp(`${facts.brands} (?:represented )?brands`),`${slug} brand count must come from catalogue facts`);
  }

  assert.match(content.contact.body,new RegExp(CONTACT_EMAIL.replace('.','\\.')),'current contact email');
  assert.match(content['affiliate-disclosure'].body,/As an Amazon Associate I earn from qualifying purchases\./,'exact Amazon Associates disclosure');
  assert.match(content['affiliate-disclosure'].body,/zero points/i,'affiliate economics excluded from recommendation scoring');
  assert.match(content.coverage.body,/not a claim of whole-of-market coverage/i,'comparison scope disclosure');
  assert.match(content.privacy.body,/Google Analytics is opt-in/i,'analytics consent disclosure');
  assert.match(content.privacy.body,/ad personalisation remain disabled/i,'advertising personalisation disclosure');
  assert.match(content.privacy.body,/browser-local/i,'signed-out local storage disclosure');
  assert.match(content.privacy.body,/Optional My APG accounts/i,'optional account disclosure');
  assert.match(content.privacy.body,/account-deletion|account deletion/i,'deletion disclosure');
  assert.match(content.privacy.body,/Access, correction and privacy complaints/i,'privacy rights/contact disclosure');
  assert.match(content.privacy.body,/Overseas processing/i,'cross-border processing disclosure');
  assert.match(content.terms.body,/Australian Consumer Law/i,'mandatory ACL rights preserved');
}

(async()=>{
  assertCanonicalSource();
  console.log(`TRUST_CANONICAL_SOURCE=PASS pages=${TRUST_SLUGS.length} products=${facts.products} categories=${facts.categories} brands=${facts.brands}`);

  for(const slug of TRUST_SLUGS){
    const path=`/${slug}/`;
    const response=await render(path);
    assert.equal(response.status,200,`${path} status`);
    assert.match(response.headers['content-type']||'',/text\/html/i,`${path} HTML content type`);
    assert.match(response.body,/Australian Product Guide/i,`${path} APG identity`);
    assert.match(response.body,new RegExp(REVIEW_DATE.replace(/ /g,'\\s+'),'i'),`${path} rendered review date`);
    assertNoBanned(response.body,`rendered ${path}`);
    console.log(`TRUST_RENDER=PASS ${path}`);
  }

  const affiliate=await render('/affiliate-disclosure/');
  assert.match(affiliate.body,/As an Amazon Associate I earn from qualifying purchases\./,'rendered exact Amazon disclosure');
  const privacy=await render('/privacy/');
  assert.match(privacy.body,/Google Analytics is opt-in/i,'rendered privacy analytics disclosure');
  assert.match(privacy.body,/Access, correction and privacy complaints/i,'rendered privacy request disclosure');
  const coverage=await render('/coverage/');
  assert.match(coverage.body,new RegExp(`${facts.products} products across ${facts.categories} populated categories, representing ${facts.brands} brands`),'rendered dynamic coverage facts');
  const terms=await render('/terms/');
  assert.match(terms.body,/Australian Consumer Law/i,'rendered ACL preservation');
  assert.equal(privacy.headers['x-apg-trust-centre'],'v82.0','Trust Centre runtime header');

  console.log(`TRUST_CENTRE_REGRESSION_V82=PASS pages=${TRUST_SLUGS.length}`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
