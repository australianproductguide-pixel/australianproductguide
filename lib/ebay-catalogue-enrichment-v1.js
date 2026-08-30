'use strict';

// APG eBay catalogue enrichment v1.3
// Purpose: identify exact/high-confidence eBay AU whole-product listing candidates for APG products.
// This module does NOT alter recommendation ranking and does NOT grant image-use rights.
// eBay imagery remains retailer-scoped unless a separate canonical image rights basis is recorded.

const ebay=require('./ebay-browse-api-v1');
const {imageStatus}=require('../data/image-provenance');

const VERSION='1.3';
const AUTO_ACCEPT_SCORE=92;
const REVIEW_SCORE=78;
const MAX_CANDIDATES=12;
const MAX_DETAIL_CHECKS=4;

const STOP_WORDS=new Set([
  'the','a','an','and','with','for','of','to','in','on','by','new','australia','au','series','model',
  'smart','wireless','portable','professional','premium','automatic','electric','digital','home'
]);
const MATERIAL_MODEL_SUFFIXES=['dsl','pro','plus','max','ultra','mini','lite','se','xl'];

const UNIVERSAL_ACCESSORY_PATTERNS=[
  /\breplacement\b/i,/\bspare\b/i,/\bspares\b/i,/\bparts?\b/i,/\bcompatible\s+with\b/i,/\bfits?\b/i,
  /\bdrip\s*tray\b/i,/\bwater\s*tank\b/i,/\bfilter\s*holder\b/i,/\bgasket\b/i,/\bseal\s*kit\b/i,
  /\bportafilter\b/i,/\bsensor\s*kit\b/i,/\bntc\s*sensor\b/i,/\bthermostat\b/i,/\bvalve\s+kit\b/i,
  /\bnozzle\b/i,/\battachment\b/i,/\baccessor(?:y|ies)\b/i,/\bempty\s+box\b/i,/\bbox\s+only\b/i,
  /\bmanual\s+only\b/i,/\bpack\s+of\s+\d+\b/i,/\bset\s+of\s+\d+\b/i,/\bkit\s+for\b/i,
  /\broller\s*brush\b/i,/\bside\s*brush\b/i,/\bmop\s*pads?\b/i,/\bdust\s*bags?\b/i,/\bdustbin\b/i,
  /\bcharging\s*dock\s+for\b/i,/\bdocking\s*station\s+for\b/i,/\bwall\s*mount\s+for\b/i,
  /\b(?:main|power|control)\s*board\b/i,/\bpcb\b/i,/\bhousing\s+for\b/i,/\bassembly\s+for\b/i,
  /\bmotor\s+for\b/i,/\bpump\s+for\b/i,/\blid\s+for\b/i,/\bbasket\s+for\b/i,/\btray\s+for\b/i
];
const ACCESSORY_FAMILY_PATTERNS={
  filter:[/\bfilters?\s+(?:for|of)\b/i,/\bwater\s+filters?\b/i,/\bcharcoal\s+filters?\b/i,/\bhepa\s+filters?\b/i,/\bfilter\s+cartridges?\b/i],
  case:[/\bcase\s+for\b/i,/\bcover\s+for\b/i,/\bsleeve\s+for\b/i],
  power:[/\bcharger\s+for\b/i,/\bcable\s+for\b/i,/\bpower\s+adapter\s+for\b/i,/\bpower\s+adaptor\s+for\b/i,/\bbattery\s+for\b/i],
  stand:[/\bstand\s+for\b/i,/\bmount\s+for\b/i,/\bbracket\s+for\b/i],
  consumable:[/\bbrush\s+heads?\s+for\b/i,/\bblades?\s+for\b/i,/\bbags?\s+for\b/i,/\bpads?\s+for\b/i]
};
const USED_PATTERNS=[/\brefurb(?:ished)?\b/i,/\brenewed\b/i,/\bused\b/i,/\bopen\s*box\b/i,/\bpre[- ]owned\b/i];
const PART_CATEGORY_PATTERNS=[
  /coffee[^>]*parts?/i,/espresso[^>]*parts?/i,/vacuum[^>]*parts?/i,/appliance[^>]*parts?/i,
  /replacement\s+parts?/i,/spare\s+parts?/i,/coffee[^>]*accessories/i,/vacuum[^>]*accessories/i
];

function clean(value){return String(value==null?'':value).trim();}
function norm(value){
  return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function compact(value){return norm(value).replace(/\s+/g,'');}
function tokens(value){return norm(value).split(' ').filter(Boolean);}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function numericPrice(value){
  if(value==null||value==='')return null;
  const n=Number(String(value).replace(/[^0-9.]/g,''));
  return Number.isFinite(n)&&n>0?n:null;
}
function productModelSource(product){
  return [product&&product.model,product&&product.name].filter(Boolean).join(' ');
}
function productIdentitySource(product){
  return [product&&product.model,product&&product.name,product&&product.slug].filter(Boolean).join(' ');
}
function isUnitLikeModel(value){
  const token=compact(value).toUpperCase();
  return /^\d+(?:\d+)?(?:ML|L|W|KW|WH|MAH|GB|TB|HZ|IN|INCH|MP|CM|MM|KG|G)$/.test(token);
}
function compoundModelTokens(product){
  const source=productModelSource(product).toUpperCase();
  const matches=source.match(/[A-Z0-9]+(?:[-./][A-Z0-9]+)+|[A-Z0-9]*[A-Z][A-Z0-9]*\d[A-Z0-9]*|[A-Z0-9]*\d[A-Z0-9]*[A-Z][A-Z0-9]*/g)||[];
  return uniq(matches.map(clean).filter(value=>{
    if(value.length<3||isUnitLikeModel(value))return false;
    const flat=compact(value);
    if(/^\d+(?:PACK|PK|CAMERA|CAMERAS)$/.test(flat.toUpperCase()))return false;
    return /[A-Z]/i.test(value)&&/\d/.test(value);
  }));
}
function modelTokens(product){
  const compound=compoundModelTokens(product);
  if(compound.length)return compound;
  const source=productModelSource(product);
  return uniq(tokens(source).filter(token=>{
    if(token.length<3||STOP_WORDS.has(token))return false;
    return /\d/.test(token)&&(/[a-z]/.test(token)||token.length>=4)&&!isUnitLikeModel(token);
  }));
}
function identityTokens(product){
  const brandTokens=new Set(tokens(product&&product.brand));
  const modelParts=new Set(tokens(modelTokens(product).join(' ')));
  return uniq(tokens(product&&product.name).filter(token=>token.length>=3&&!STOP_WORDS.has(token)&&!brandTokens.has(token)&&!modelParts.has(token)));
}
function accessoryFamilyExempt(product,family){
  const category=clean(product&&product.category);
  if(family==='filter')return category==='water-filters';
  if(family==='power')return category==='usb-c-chargers'||category==='wireless-chargers';
  return false;
}
function listingLooksAccessory(title,product){
  const text=clean(title);
  if(UNIVERSAL_ACCESSORY_PATTERNS.some(pattern=>pattern.test(text)))return true;
  for(const [family,patterns] of Object.entries(ACCESSORY_FAMILY_PATTERNS)){
    if(accessoryFamilyExempt(product,family))continue;
    if(patterns.some(pattern=>pattern.test(text)))return true;
  }
  return false;
}
function listingLooksUsed(title,condition){
  const text=`${clean(title)} ${clean(condition)}`;
  return USED_PATTERNS.some(pattern=>pattern.test(text));
}
function containsToken(haystack,token){
  const h=` ${norm(haystack)} `;
  const t=norm(token);
  return Boolean(t)&&h.includes(` ${t} `);
}
function modelMatch(title,models){
  if(!models.length)return {matched:[],coverage:0};
  const titleCompact=compact(title);
  const matched=models.filter(model=>titleCompact.includes(compact(model)));
  return {matched,coverage:matched.length/models.length};
}
function nameCoverage(title,product){
  const ids=identityTokens(product);
  if(!ids.length)return {matched:[],coverage:0};
  const matched=ids.filter(token=>containsToken(title,token));
  return {matched,coverage:matched.length/ids.length};
}
function brandMatch(title,brand){
  const b=norm(brand);
  if(!b)return false;
  const t=norm(title);
  return t.includes(b)||compact(t).includes(compact(b));
}
function pricePlausibility(product,item){
  const maintained=numericPrice(product&&product.price);
  const listing=numericPrice(item&&item.price&&item.price.value);
  if(!maintained||!listing||maintained<80)return {maintained,listing,ratio:null,hardReject:false,review:false};
  const ratio=listing/maintained;
  return {maintained,listing,ratio,hardReject:ratio<0.20,review:ratio>=0.20&&ratio<0.40};
}
function collectNumbers(text,regex,convert=value=>Number(value)){
  const out=[];
  const re=new RegExp(regex.source,regex.flags.includes('g')?regex.flags:`${regex.flags}g`);
  let match;
  while((match=re.exec(clean(text)))!==null){
    const value=convert(match[1],match[2]);
    if(Number.isFinite(value))out.push(value);
    if(match.index===re.lastIndex)re.lastIndex+=1;
  }
  return uniq(out);
}
function variantFacts(text){
  return {
    screenInches:collectNumbers(text,/(\d{2,3}(?:\.\d+)?)[\s-]*(?:["”]|inches?\b)/ig),
    litres:collectNumbers(text,/(\d+(?:\.\d+)?)[\s-]*(?:l|litres?|liters?)\b/ig),
    storageGb:collectNumbers(text,/(\d+(?:\.\d+)?)[\s-]*(gb|tb)\b/ig,(value,unit)=>Number(value)*(String(unit).toLowerCase()==='tb'?1024:1)),
    energyWh:collectNumbers(text,/(\d+(?:\.\d+)?)[\s-]*wh\b/ig),
    batteryMah:collectNumbers(text,/(\d+(?:\.\d+)?)[\s-]*mah\b/ig),
    wattage:collectNumbers(text,/(\d+(?:\.\d+)?)[\s-]*w\b/ig),
    packCount:collectNumbers(text,/(\d+)[\s-]*(?:pack|pk)\b/ig),
    cameraCount:collectNumbers(text,/(\d+)[\s-]*(?:camera|cameras|cam)\b/ig)
  };
}
function approximatelyEqual(a,b){
  const x=Number(a),y=Number(b);
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  return Math.abs(x-y)<=Math.max(0.01,Math.min(Math.abs(x),Math.abs(y))*0.005);
}
function materialVariantConflict(product,listingText){
  const expected=variantFacts(productIdentitySource(product));
  const observed=variantFacts(listingText);
  for(const key of Object.keys(expected)){
    if(!expected[key].length||!observed[key].length)continue;
    const compatible=expected[key].some(a=>observed[key].some(b=>approximatelyEqual(a,b)));
    if(!compatible)return {conflict:true,kind:key,expected:expected[key],observed:observed[key]};
  }
  return {conflict:false};
}
function materialSuffixConflict(product,title){
  const productFlat=compact(productIdentitySource(product));
  const titleFlat=compact(title);
  for(const model of modelTokens(product)){
    const base=compact(model);
    if(!base)continue;
    for(const suffix of MATERIAL_MODEL_SUFFIXES){
      const expanded=`${base}${suffix}`;
      if(titleFlat.includes(expanded)&&!productFlat.includes(expanded))return {conflict:true,model,suffix};
    }
  }
  return {conflict:false};
}
function materialIdentityConflict(product,title){
  const variant=materialVariantConflict(product,title);
  if(variant.conflict)return {conflict:true,reason:`material-variant-mismatch:${variant.kind}`,detail:variant};
  const suffix=materialSuffixConflict(product,title);
  if(suffix.conflict)return {conflict:true,reason:`material-model-suffix-mismatch:${suffix.suffix}`,detail:suffix};
  return {conflict:false};
}
function aspectValues(detail,namePattern){
  const rows=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[];
  return rows.filter(row=>namePattern.test(clean(row&&row.name))).map(row=>clean(row&&row.value)).filter(Boolean);
}
function detailedBrandEvidence(detail){
  return uniq([clean(detail&&detail.brand),...aspectValues(detail,/^brand$/i)]);
}
function detailedModelEvidence(detail){
  return uniq([
    clean(detail&&detail.mpn),
    clean(detail&&detail.product&&detail.product.mpn),
    ...aspectValues(detail,/^(model|mpn|manufacturer\s+part\s+number)$/i)
  ]);
}
function detailedModelMatches(product,detail){
  const expected=modelTokens(product);
  const evidence=detailedModelEvidence(detail);
  if(!expected.length||!evidence.length)return {hasEvidence:Boolean(evidence.length),matches:false,evidence};
  const matches=evidence.some(value=>expected.some(model=>{
    const a=compact(value);const b=compact(model);
    return a===b||a.includes(b)||b.includes(a);
  }));
  return {hasEvidence:true,matches,evidence};
}
function detailedCategoryRisk(detail){
  const path=clean(detail&&detail.categoryPath);
  return PART_CATEGORY_PATTERNS.some(pattern=>pattern.test(path));
}
function detailedVariantText(detail){
  const aspects=(Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects:[])
    .map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' ');
  return `${clean(detail&&detail.title)} ${aspects}`.trim();
}
function scoreCandidate(product,item){
  const title=clean(item&&item.title);
  const reasons=[];
  const flags=[];
  if(!title)return {score:0,status:'reject',reasons:['missing-title'],flags:['missing-title']};
  if(listingLooksAccessory(title,product))return {score:0,status:'reject',reasons:['accessory-or-part-language'],flags:['accessory']};
  const identityConflict=materialIdentityConflict(product,title);
  if(identityConflict.conflict)return {score:0,status:'reject',reasons:[identityConflict.reason],flags:['material-identity-mismatch'],identityConflict};

  const priceCheck=pricePlausibility(product,item);
  if(priceCheck.hardReject)return {score:0,status:'reject',reasons:['implausibly-low-whole-product-price'],flags:['price-accessory-risk'],priceRatio:priceCheck.ratio};

  let score=0;
  const brandOk=brandMatch(title,product.brand);
  if(brandOk){score+=20;reasons.push('brand-match');}else flags.push('brand-not-confirmed');

  const models=modelTokens(product);
  const mm=modelMatch(title,models);
  if(models.length){
    if(mm.coverage===1){score+=48;reasons.push(`model-match:${mm.matched.join(',')}`);}
    else if(mm.coverage>=0.5){score+=28;reasons.push(`partial-model-match:${mm.matched.join(',')}`);flags.push('partial-model');}
    else {score-=35;flags.push('model-not-confirmed');}
  }else flags.push('no-strong-model-token');

  const nc=nameCoverage(title,product);
  if(nc.coverage>=0.75){score+=22;reasons.push('strong-name-match');}
  else if(nc.coverage>=0.45){score+=12;reasons.push('moderate-name-match');}
  else if(nc.coverage>0){score+=5;reasons.push('weak-name-match');}

  const condition=clean(item&&item.condition);
  const used=listingLooksUsed(title,condition);
  if(used){score-=18;flags.push('used-or-refurbished');}
  else if(/new/i.test(condition)){score+=8;reasons.push('new-condition');}

  if(priceCheck.review){score-=12;flags.push('low-price-review');}
  else if(priceCheck.ratio!=null)reasons.push('price-plausible');

  if(item&&item.image&&item.image.imageUrl){score+=4;reasons.push('image-present');}else flags.push('image-missing');
  if(item&&item.itemAffiliateWebUrl){score+=4;reasons.push('affiliate-url-present');}else flags.push('affiliate-url-missing');

  const exactModel=models.length>0&&mm.coverage===1;
  const autoEligible=brandOk&&exactModel&&!used&&!priceCheck.review&&Boolean(item&&item.image&&item.image.imageUrl)&&Boolean(item&&item.itemAffiliateWebUrl);
  let status='reject';
  if(score>=AUTO_ACCEPT_SCORE&&autoEligible)status='accept';
  else if(score>=REVIEW_SCORE&&brandOk&&(exactModel||mm.coverage>=0.5))status='review';
  return {score,status,reasons,flags,brandOk,models,modelCoverage:mm.coverage,nameCoverage:nc.coverage,exactModel,priceRatio:priceCheck.ratio};
}
function queryFor(product){
  const brand=clean(product&&product.brand);
  const name=clean(product&&product.name);
  const models=modelTokens(product);
  const model=models.join(' ');
  const base=uniq([brand,model||name]).join(' ');
  return clean(base)||clean(name)||clean(product&&product.slug);
}
function projectCandidate(product,item,assessment){
  const imageUrl=item&&item.image&&item.image.imageUrl?clean(item.image.imageUrl):null;
  return {
    itemId:clean(item&&item.itemId)||null,
    legacyItemId:clean(item&&item.legacyItemId)||null,
    title:clean(item&&item.title)||null,
    condition:clean(item&&item.condition)||null,
    price:item&&item.price&&typeof item.price==='object'?{value:clean(item.price.value)||null,currency:clean(item.price.currency)||null}:null,
    imageUrl,
    imageSource:imageUrl?'ebay-listing':null,
    itemWebUrl:clean(item&&item.itemWebUrl)||null,
    itemAffiliateWebUrl:clean(item&&item.itemAffiliateWebUrl)||null,
    score:assessment.score,
    status:assessment.status,
    reasons:assessment.reasons,
    flags:assessment.flags,
    exactModel:assessment.exactModel===true,
    modelCoverage:assessment.modelCoverage,
    nameCoverage:assessment.nameCoverage,
    priceRatio:assessment.priceRatio==null?null:assessment.priceRatio,
    detailVerified:false,
    verificationLevel:null,
    marketplaceId:'EBAY_AU',
    source:'eBay Buy Browse API',
    recommendationWeight:0
  };
}
async function verifyDetailedCandidate(product,candidate){
  let detail;
  try{detail=await ebay.getItem(candidate.itemId,{referenceId:`apg:${product.slug}:verify`});}
  catch(error){return {ok:false,review:true,reason:'detail-verification-error',code:error&&error.code?String(error.code):'EBAY_DETAIL_ERROR'};}
  const title=clean(detail&&detail.title)||candidate.title;
  const condition=clean(detail&&detail.condition)||candidate.condition;
  if(listingLooksAccessory(title,product))return {ok:false,reason:'detail-accessory-or-part-language'};
  if(listingLooksUsed(title,condition))return {ok:false,reason:'detail-used-or-refurbished'};
  if(detailedCategoryRisk(detail))return {ok:false,reason:'detail-parts-category'};
  const identityConflict=materialIdentityConflict(product,detailedVariantText(detail));
  if(identityConflict.conflict)return {ok:false,reason:`detail-${identityConflict.reason}`,identityConflict};

  const brands=detailedBrandEvidence(detail);
  if(brands.length&&!brands.some(value=>brandMatch(value,product.brand)))return {ok:false,reason:'detail-brand-mismatch'};

  const model=detailedModelMatches(product,detail);
  if(model.hasEvidence&&!model.matches)return {ok:false,reason:'detail-model-mismatch',modelEvidence:model.evidence};

  const detailedImage=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl)||candidate.imageUrl;
  const detailedAffiliate=clean(detail&&detail.itemAffiliateWebUrl)||candidate.itemAffiliateWebUrl;
  if(!detailedImage||!detailedAffiliate)return {ok:false,review:true,reason:'detail-image-or-affiliate-url-missing'};

  return {
    ok:true,
    verificationLevel:model.hasEvidence?'detail-model-evidence':'detail-title-model',
    modelEvidence:model.evidence,
    categoryPath:clean(detail&&detail.categoryPath)||null,
    brands,
    candidate:{
      ...candidate,
      title,
      condition,
      imageUrl:detailedImage,
      imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
      itemWebUrl:clean(detail&&detail.itemWebUrl)||candidate.itemWebUrl,
      itemAffiliateWebUrl:detailedAffiliate,
      detailVerified:true,
      verificationLevel:model.hasEvidence?'detail-model-evidence':'detail-title-model',
      verificationEvidence:{brands,model:model.evidence,categoryPath:clean(detail&&detail.categoryPath)||null}
    }
  };
}
async function enrichProduct(product,{limit=MAX_CANDIDATES}={}){
  const image=imageStatus(product);
  const query=queryFor(product);
  if(!query)return {slug:product.slug,status:'no-query',query:null,currentProductPhotography:image.productPhotography===true,candidates:[]};
  const result=await ebay.searchItems({q:query,limit:Math.max(1,Math.min(MAX_CANDIDATES,Number(limit)||MAX_CANDIDATES))},{referenceId:`apg:${product.slug}`});
  const rows=Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[];
  const candidates=rows.map(item=>projectCandidate(product,item,scoreCandidate(product,item))).sort((a,b)=>b.score-a.score);

  let accepted=null;
  let detailChecks=0;
  for(const candidate of candidates){
    if(candidate.status!=='accept')continue;
    if(detailChecks>=MAX_DETAIL_CHECKS)break;
    detailChecks+=1;
    const verified=await verifyDetailedCandidate(product,candidate);
    if(verified.ok){accepted=verified.candidate;break;}
    candidate.status=verified.review?'review':'reject';
    candidate.flags=uniq([...(candidate.flags||[]),verified.reason]);
    candidate.detailVerified=false;
  }

  const review=accepted?null:(candidates.find(row=>row.status==='review')||null);
  return {
    slug:product.slug,
    id:product.id||null,
    brand:product.brand||null,
    name:product.name||null,
    category:product.category||null,
    query,
    currentProductPhotography:image.productPhotography===true,
    priority:image.productPhotography===true?'refresh':'missing-genuine-photography',
    status:accepted?'accept':review?'review':'no-match',
    accepted,
    review,
    detailChecks,
    candidateCount:candidates.length,
    candidates:candidates.slice(0,3),
    recommendationWeight:0
  };
}

module.exports={
  VERSION,AUTO_ACCEPT_SCORE,REVIEW_SCORE,MAX_CANDIDATES,MAX_DETAIL_CHECKS,norm,compact,tokens,compoundModelTokens,modelTokens,identityTokens,
  variantFacts,materialVariantConflict,materialSuffixConflict,materialIdentityConflict,listingLooksAccessory,listingLooksUsed,pricePlausibility,
  detailedBrandEvidence,detailedModelEvidence,detailedCategoryRisk,scoreCandidate,queryFor,verifyDetailedCandidate,enrichProduct
};
