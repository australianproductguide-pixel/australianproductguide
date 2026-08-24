const {products}=require('../data');
const {images,imageFor,validationErrors}=require('../data/product-images');
const {imageStatus}=require('../data/image-provenance');
const {TAG}=require('../data/retailers');

const ACTION6_FIRST_TRANCHE=[
  'apple-iphone-17',
  'apple-iphone-17-pro',
  'samsung-galaxy-z-flip7'
];

const productBySlug=new Map(products.map(product=>[product.slug,product]));
const issues=[];
const displayUrlToSlugs=new Map();
const verifiedBySourceType={};
let verifiedImagery=0;
let amazonProgramContent=0;
let exactMatches=0;
let immaterialVariantMatches=0;
let verifiedAmazonAsinMappings=0;
let amazonSearchFallbackProducts=0;
let amazonDirectMappingsWithoutAsin=0;
let completeVerifiedProvenance=0;

for(const slug of Object.keys(images)){
  const product=productBySlug.get(slug);
  if(!product){
    issues.push(`${slug}: image registry record has no maintained catalogue product`);
    continue;
  }
  for(const error of validationErrors(product,images[slug]))issues.push(`${slug}: ${error}`);
}

for(const product of products){
  const amazon=(product.retailers||[]).find(r=>r.retailer==='Amazon Australia');
  if(amazon?.kind==='affiliate-direct'){
    if(amazon.asin)verifiedAmazonAsinMappings+=1;
    else {
      amazonDirectMappingsWithoutAsin+=1;
      issues.push(`${product.slug}: direct Amazon destination has no ASIN`);
    }
  }else if(amazon?.kind==='affiliate-search'){
    amazonSearchFallbackProducts+=1;
  }

  const record=imageFor(product);
  const status=imageStatus(product);

  if(record&&record.imageStatus==='verified'&&record.imageVerified===true){
    const recordErrors=validationErrors(product,record);
    for(const error of recordErrors)issues.push(`${product.slug}: ${error}`);
    if(recordErrors.length===0)completeVerifiedProvenance+=1;
  }

  if(!status.productPhotography)continue;
  verifiedImagery+=1;
  verifiedBySourceType[status.sourceType]=(verifiedBySourceType[status.sourceType]||0)+1;

  if(!status.displayUrl)issues.push(`${product.slug}: displayed photography has no image URL`);
  if(!status.alt||String(status.alt).trim().length<3)issues.push(`${product.slug}: displayed photography has no meaningful alt text`);
  if(!status.rights)issues.push(`${product.slug}: displayed photography has no rights basis`);
  if(!status.sourceType)issues.push(`${product.slug}: displayed photography has no source type`);
  if(status.displayUrl){
    const rows=displayUrlToSlugs.get(status.displayUrl)||[];
    rows.push(product.slug);
    displayUrlToSlugs.set(status.displayUrl,rows);
  }
  if(status.matchStatus==='exact')exactMatches+=1;
  if(status.matchStatus==='same_model_immaterial_variant'){
    immaterialVariantMatches+=1;
    if(!status.note)issues.push(`${product.slug}: immaterial-variant image match has no explanatory note`);
  }

  if(status.amazonProgramContent){
    amazonProgramContent+=1;
    if(!status.asin)issues.push(`${product.slug}: Amazon image has no verified ASIN`);
    if(!status.imageLinkUrl)issues.push(`${product.slug}: Amazon image has no Amazon destination`);
    if(status.imageLinkUrl&&!status.imageLinkUrl.includes(`tag=${TAG}`))issues.push(`${product.slug}: Amazon image destination is missing Associates tag ${TAG}`);
    if(status.imageLinkUrl&&!/^https:\/\/www\.amazon\.com\.au\//i.test(status.imageLinkUrl))issues.push(`${product.slug}: Amazon image destination is not Amazon Australia`);
    const matchingRetailer=(product.retailers||[]).find(r=>r.retailer==='Amazon Australia'&&r.asin===status.asin);
    if(!matchingRetailer)issues.push(`${product.slug}: Amazon image ASIN does not match a verified product retailer record`);
    else {
      const affiliate=matchingRetailer.affiliateUrl||matchingRetailer.url||'';
      if(affiliate!==status.imageLinkUrl)issues.push(`${product.slug}: Amazon image destination does not equal the matching affiliate destination`);
    }
  }
}

for(const [imageUrl,slugs] of displayUrlToSlugs){
  if(slugs.length>1)issues.push(`duplicate verified image URL across products: ${slugs.join(', ')} (${imageUrl})`);
}

const trancheRows=ACTION6_FIRST_TRANCHE.map(slug=>{
  const product=productBySlug.get(slug);
  const status=product?imageStatus(product):null;
  const record=product?imageFor(product):null;
  const errors=product&&record?validationErrors(product,record):['missing product image record'];
  const complete=Boolean(product&&status?.productPhotography&&record?.imageStatus==='verified'&&record?.imageVerified===true&&errors.length===0);
  if(!complete)issues.push(`${slug}: Action 6 first-tranche completion control failed${errors.length?` (${errors.join('; ')})`:''}`);
  return {
    slug,
    category:product?.category||null,
    imageStatus:record?.imageStatus||'missing',
    matchStatus:status?.matchStatus||'unverified',
    sourceType:status?.sourceType||null,
    complete
  };
});
const action6FirstTrancheComplete=trancheRows.every(row=>row.complete);

const totalProducts=products.length;
const withoutVerifiedImagery=totalProducts-verifiedImagery;
const coveragePercent=totalProducts?Number((verifiedImagery/totalProducts*100).toFixed(1)):0;
const report={
  generatedAt:new Date().toISOString(),
  totalProducts,
  verifiedImagery,
  withoutVerifiedImagery,
  coveragePercent,
  completeVerifiedProvenance,
  verifiedBySourceType,
  verifiedAmazonAsinMappings,
  amazonSearchFallbackProducts,
  amazonDirectMappingsWithoutAsin,
  amazonProgramContent,
  exactMatches,
  immaterialVariantMatches,
  registryRecords:Object.keys(images).length,
  invalidRecords:issues.length,
  action6CompletionGate:{
    tranche:'smartphones-first-commercial-tranche',
    expectedProducts:ACTION6_FIRST_TRANCHE.length,
    verifiedProducts:trancheRows.filter(row=>row.complete).length,
    complete:action6FirstTrancheComplete,
    products:trancheRows
  },
  target:'As close to 100% as compliant verified imagery legitimately permits',
  note:'Missing imagery outside the controlled Action 6 first tranche is reported, not treated as a QA failure. Invalid, duplicate, unsafe or regressed first-tranche image mappings fail the release gate.'
};

console.log(JSON.stringify(report,null,2));
if(issues.length){
  console.error('\nProduct image QA failed:');
  for(const issue of issues)console.error(`- ${issue}`);
  process.exitCode=1;
}else{
  console.log(`Product image QA passed: ${verifiedImagery}/${totalProducts} maintained products have verified compliant photography; Action 6 first tranche ${action6FirstTrancheComplete?'GREEN':'NOT GREEN'}; ${withoutVerifiedImagery} products remain explicitly unreconciled.`);
}
