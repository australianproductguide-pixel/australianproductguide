'use strict';

const {products,categories}=require('../data');
const evidence=require('../data/catalogue-evidence-depth-v49');
const enrichment=evidence.apply({categoryMaps:[categories]});
const downstream=require('./catalogue-intelligence-v48-final');
const v48Catalogue=require('./catalogue-intelligence-v48');
const graph=require('./product-intelligence-v48');

const VERSION='catalogue-intelligence-v49';
const API_PATH='/api/intelligence/catalogue-v49';
const PRODUCT_API_PREFIX='/api/intelligence/product-v49/';
const BENCHMARK={
  version:'strong-product-evidence-benchmark-v1',
  minimumPrimaryFacts:5,
  minimumStructuredSpecifications:3,
  requiresPrimaryNonAmazonEvidence:true,
  requiresSourceVerificationDate:true,
  requiresDeskResearchTruth:true,
  commercialRecommendationWeight:0,
  policy:'A product only meets the strong-depth benchmark when APG maintains multiple primary-source facts and structured specifications with dated provenance. A single fact, classification tag, retailer link or affiliate listing is insufficient.'
};

const bySlug=new Map(products.map(p=>[p.slug,p]));
const clean=v=>String(v||'').toLowerCase();
const nonAmazon=url=>/^https:\/\//i.test(String(url||''))&&!/amazon\.com\.au/i.test(String(url||''));
function primaryFactEntries(p){
  return Object.entries(p.factEvidence||{}).filter(([,row])=>{
    const type=clean(row?.sourceType),source=row?.source||p.source;
    return nonAmazon(source)&&(/manufacturer/.test(type)||/apg-normalised-from-maintained-manufacturer-evidence/.test(type));
  });
}
function depthFor(input){
  const p=typeof input==='string'?bySlug.get(input):input;
  if(!p)return null;
  const facts=Object.entries(p.factEvidence||{}),primary=primaryFactEntries(p),specs=(p.specs||[]).filter(row=>Array.isArray(row)&&row.length>=2&&String(row[1]??'').trim()),sourceVerified=!!p.lastSourceVerification,deskTruth=/desk-research|specification/i.test(String(p.testingStatus||'')),primarySource=nonAmazon(p.source)&&(evidence.explicitPrimarySource(p)||primary.length>=BENCHMARK.minimumPrimaryFacts),pass=primarySource&&primary.length>=BENCHMARK.minimumPrimaryFacts&&specs.length>=BENCHMARK.minimumStructuredSpecifications&&sourceVerified&&deskTruth;
  const gaps=[];
  if(!primarySource)gaps.push('Exact non-Amazon primary/manufacturer evidence is not yet established to the benchmark standard');
  if(primary.length<BENCHMARK.minimumPrimaryFacts)gaps.push(`Needs ${BENCHMARK.minimumPrimaryFacts-primary.length} more primary-source verified fact${BENCHMARK.minimumPrimaryFacts-primary.length===1?'':'s'}`);
  if(specs.length<BENCHMARK.minimumStructuredSpecifications)gaps.push(`Needs ${BENCHMARK.minimumStructuredSpecifications-specs.length} more structured specification${BENCHMARK.minimumStructuredSpecifications-specs.length===1?'':'s'}`);
  if(!sourceVerified)gaps.push('Needs a dated source-verification record');
  if(!deskTruth)gaps.push('Needs explicit desk-research/testing-status truth');
  return{
    benchmarkVersion:BENCHMARK.version,status:pass?'strong-depth-verified':primary.length||specs.length?'partial-primary-evidence':'starter-or-classification-only',meetsStrongDepthBenchmark:pass,
    verifiedFactCount:facts.length,primaryVerifiedFactCount:primary.length,structuredSpecificationCount:specs.length,
    exactPrimaryEvidenceEstablished:primarySource,lastSourceVerification:p.lastSourceVerification||null,lastSubstantiveReview:p.lastSubstantiveReview||p.lastReviewed||null,
    evidenceDepthVersion:p.evidenceDepthVersion||null,evidenceDepthStatus:p.evidenceDepthStatus||null,independentlyResearchedInV49:p.evidenceDepthStatus==='new-primary-research-v49',
    commercialRecommendationWeight:0,gaps
  };
}
function categoryDepth(slug){
  const rows=categories[slug]?.products||[],depths=rows.map(depthFor).filter(Boolean),strong=depths.filter(x=>x.meetsStrongDepthBenchmark).length;
  return{slug,label:categories[slug]?.label||slug,products:rows.length,strongDepthVerified:strong,belowStrongDepth:rows.length-strong,coveragePct:rows.length?Math.round(strong/rows.length*1000)/10:100};
}
function snapshot(){
  const depths=products.map(depthFor),strong=depths.filter(x=>x.meetsStrongDepthBenchmark).length,primary=depths.filter(x=>x.exactPrimaryEvidenceEstablished).length,researched=depths.filter(x=>x.independentlyResearchedInV49).length,structuredThisPass=products.filter(p=>p.evidenceDepthStructuredAt===evidence.VERIFIED).length,v48=v48Catalogue.summary();
  return{
    version:VERSION,generatedAt:new Date().toISOString(),catalogue:{products:products.length,categories:Object.keys(categories).length},benchmark:BENCHMARK,
    evidenceDepth:{strongDepthVerified:strong,belowStrongDepth:products.length-strong,strongDepthCoveragePct:Math.round(strong/products.length*1000)/10,exactPrimaryEvidenceEstablished:primary,independentlyResearchedInThisPass:researched,primarySourceRecordsStructuredInThisPass:structuredThisPass},
    enrichment:{version:enrichment.version,verifiedAt:enrichment.verifiedAt,newPrimaryResearch:enrichment.newPrimaryResearch,existingPrimaryStructured:enrichment.existingPrimaryStructured},
    v48EvidenceCompatibility:v48.evidence,
    researchBacklog:{needsStrongDepthVerification:products.length-strong,policy:'This is the remaining source-by-source evidence programme. Products are not upgraded to strong-depth merely because they are maintained, commercially available or classification-relevant.'},
    categories:Object.keys(categories).map(categoryDepth),
    governance:{equalEvidenceClaim:strong===products.length,commercialRecommendationWeight:0,productionSelfModification:false,deskResearchOnly:true}
  };
}
function urlOf(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,body,head=false){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':JSON.stringify(body));}
function handler(req,res){
  const url=urlOf(req),head=req.method==='HEAD';
  if(url.pathname===API_PATH)return send(res,200,snapshot(),head);
  if(url.pathname.startsWith(PRODUCT_API_PREFIX)){
    const slug=url.pathname.slice(PRODUCT_API_PREFIX.length).replace(/\/$/,'');const p=bySlug.get(slug);if(!p)return send(res,404,{error:'maintained-product-not-found'},head);
    return send(res,200,{version:VERSION,product:{slug:p.slug,brand:p.brand,name:p.name,model:p.model||null,category:p.category,source:p.source||null,testingStatus:p.testingStatus||null},evidenceDepth:depthFor(p),v48:graph.knowledgeNode(slug)?.catalogueIntelligence||null},head);
  }
  return downstream(req,res);
}
Object.assign(handler,{VERSION,API_PATH,PRODUCT_API_PREFIX,BENCHMARK,enrichment,depthFor,categoryDepth,snapshot,downstream});
module.exports=handler;
