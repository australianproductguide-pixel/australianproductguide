'use strict';

// APG canonical runtime platform state v1.
//
// This is deliberately derived from the same maintained catalogue, Action 4 evidence
// census and Action 5 retailer-certification objects that drive Production. It does not
// attempt to self-certify GitHub Actions or Vercel after deployment; those remain
// post-deploy controls and must be reconciled into the Operating Backend only after the
// exact Production SHA is verified.
const {products,categories}=require('../data');

const VERSION='1.0';
const ENDPOINT='/api/platform-state';
const CANONICAL_DOMAIN='australianproductguide.au';

function brandCount(){
  return new Set(products.map(p=>String(p.brand||'').trim()).filter(Boolean)).size;
}

function runtimeCommit(env=process.env){
  return env.VERCEL_GIT_COMMIT_SHA||env.GITHUB_SHA||null;
}

function deploymentHost(env=process.env){
  return env.VERCEL_URL||null;
}

function snapshot({downstream,retailerSnapshot,env=process.env}={}){
  const action4=downstream&&typeof downstream.action4FinalSnapshot==='function'
    ? downstream.action4FinalSnapshot()
    : null;
  const evidence=action4&&action4.evidenceDepth?action4.evidenceDepth:null;
  const retailer=retailerSnapshot||null;
  const retailerAmazon=retailer&&retailer.amazon?retailer.amazon:{};
  const investigation=retailer&&retailer.investigation?retailer.investigation:{};
  const retailerGate=retailer&&retailer.gate?retailer.gate:{};

  return {
    schemaVersion:`platform-state-v${VERSION}`,
    stateType:'RUNTIME_DERIVED',
    authority:{
      rule:'GitHub main -> Vercel Production -> public runtime -> post-deploy verification -> Operating Backend.',
      canonicalDomain:CANONICAL_DOMAIN,
      selfCertification:false,
      postDeployCertificationRequired:true,
      note:'This endpoint reports runtime-derived technical facts. Release certification status and certification time are reconciled only after the exact Production SHA passes post-deploy controls.'
    },
    release:{
      gitSha:runtimeCommit(env),
      gitRef:env.VERCEL_GIT_COMMIT_REF||env.GITHUB_REF_NAME||null,
      environment:env.VERCEL_ENV||env.NODE_ENV||null,
      deploymentHost:deploymentHost(env),
      outerRuntimeControl:retailer?`amazon-catalogue-certification-v${retailer.version}`:null
    },
    catalogue:{
      products:products.length,
      categories:Object.keys(categories).length,
      brands:brandCount()
    },
    evidence:evidence?{
      categoryDecisionSchemaVersion:action4.categoryDecisionSchemaVersion||action4.schemaVersion||evidence.schemaVersion||null,
      evidenceDepthStandardVersion:action4.evidenceDepthStandardVersion||evidence.standard||null,
      categories:evidence.categoryCount,
      schemaDefinedCategories:evidence.schemaDefinedCategories,
      products:evidence.products,
      strong:evidence.strong,
      belowStrong:evidence.below,
      strongPct:evidence.strongPct,
      backlogStatus:action4.action4Gate?.evidenceBacklogStatus||'ONGOING_MAINTENANCE'
    }:null,
    retailer:retailer?{
      catalogueCertificationVersion:retailer.version,
      checkedAt:retailer.checkedAt,
      catalogueStatus:retailer.status,
      exactVerified:retailerAmazon.exactVerified,
      verifiedVariation:retailerAmazon.verifiedVariation,
      totalVerifiedDirect:retailerAmazon.totalVerifiedDirect,
      searchFallback:retailerAmazon.searchFallback,
      noSuitableAmazonDestination:retailerAmazon.noSuitableAmazonDestination,
      brokenOrUncontrolled:retailerAmazon.brokenOrUncontrolled,
      affiliateTagIntegrityPct:retailerAmazon.affiliateTagIntegrityPct,
      documentedFallbackExceptions:investigation.documentedFallbackExceptions,
      investigationRequired:investigation.investigationRequired
    }:null,
    controls:{
      hardConstraintFallbackVersion:downstream?.DECISION_HARD_CONSTRAINT_FALLBACK_VERSION||null,
      categorySchemaGate:action4?.action4Gate?.status||null,
      retailerCatalogueGate:retailerGate.status||retailer?.status||null,
      retailerStructuralErrorsZero:retailerGate.checks?.structuralErrorsZero??null,
      retailerRecommendationCommercialNeutrality:retailerGate.checks?.recommendationCommercialNeutrality??null,
      shallowCatalogueExpansion:'PAUSED_UNTIL_EVIDENCE_DEPTH_IMPROVES',
      complexityGuardrail:'ACTIVE'
    }
  };
}

module.exports={VERSION,ENDPOINT,CANONICAL_DOMAIN,brandCount,runtimeCommit,deploymentHost,snapshot};
