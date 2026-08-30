'use strict';

// APG eBay catalogue enrichment v1.0
// Purpose: identify exact/high-confidence eBay AU listing candidates for APG products.
// This module does NOT alter recommendation ranking and does NOT grant image-use rights.
// eBay imagery remains retailer-scoped unless a separate canonical image rights basis is recorded.

const ebay=require('./ebay-browse-api-v1');
const {imageStatus}=require('../data/image-provenance');

const VERSION='1.0';
const AUTO_ACCEPT_SCORE=92;
const REVIEW_SCORE=78;
const MAX_CANDIDATES=12;

const STOP_WORDS=new Set([
  'the','a','an','and','with','for','of','to','in','on','by','new','australia','au','series','model',
  'smart','wireless','portable','professional','premium','automatic','electric','digital','home'
]);
const ACCESSORY_PATTERNS=[
  /\breplacement\b/i,/\bspare\b/i,/\bspares\b/i,/\bparts?\b/i,/\bcompatible\s+with\b/i,/\bfits?\b/i,
  /\bdrip\s*tray\b/i,/\bwater\s*tank\b/i,/\bfilter\s*holder\b/i,/\bgasket\b/i,/\bseal\s*kit\b/i,
  /\bnozzle\b/i,/\badapter\b/i,/\badaptor\b/i,/\bcase\s+for\b/i,/\bcover\s+for\b/i,/\bcharger\s+for\b/i,
  /\bcable\s+for\b/i,/\bremote\s+for\b/i,/\bstand\s+for\b/i,/\bmount\s+for\b/i,/\bbrush\s+for\b/i,
  /\battachment\b/i,/\baccessor(?:y|ies)\b/i,/\bempty\s+box\b/i,/\bbox\s+only\b/i,/\bmanual\s+only\b/i
];
const USED_PATTERNS=[/\brefurb(?:ished)?\b/i,/\brenewed\b/i,/\bused\b/i,/\bopen\s*box\b/i,/\bpre[- ]owned\b/i];

function clean(value){return String(value==null?'':value).trim();}
function norm(value){
  return clean(value).toLowerCase().normalize('NFKD').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function compact(value){return norm(value).replace(/\s+/g,'');}
function tokens(value){return norm(value).split(' ').filter(Boolean);}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function modelTokens(product){
  const source=[product&&product.model,product&&product.name,product&&product.slug].filter(Boolean).join(' ');
  return uniq(tokens(source).filter(token=>{
    if(token.length<3)return false;
    if(STOP_WORDS.has(token))return false;
    // Strong model tokens usually contain a digit, e.g. BES876, WH1000XM5, S90D, 75U6SAU.
    return /\d/.test(token)&&(/[a-z]/.test(token)||token.length>=4);
  }));
}
function identityTokens(product){
  const brandTokens=new Set(tokens(product&&product.brand));
  return uniq(tokens(product&&product.name).filter(token=>token.length>=3&&!STOP_WORDS.has(token)&&!brandTokens.has(token)&&!modelTokens(product).includes(token)));
}
function listingLooksAccessory(title){return ACCESSORY_PATTERNS.some(pattern=>pattern.test(clean(title)));}
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
function scoreCandidate(product,item){
  const title=clean(item&&item.title);
  const reasons=[];
  const flags=[];
  if(!title)return {score:0,status:'reject',reasons:['missing-title'],flags:['missing-title']};
  if(listingLooksAccessory(title))return {score:0,status:'reject',reasons:['accessory-or-part-language'],flags:['accessory']};

  let score=0;
  const brandOk=brandMatch(title,product.brand);
  if(brandOk){score+=20;reasons.push('brand-match');}else flags.push('brand-not-confirmed');

  const models=modelTokens(product);
  const mm=modelMatch(title,models);
  if(models.length){
    if(mm.coverage===1){score+=48;reasons.push(`model-match:${mm.matched.join(',')}`);}
    else if(mm.coverage>=0.5){score+=28;reasons.push(`partial-model-match:${mm.matched.join(',')}`);flags.push('partial-model');}
    else {score-=35;flags.push('model-not-confirmed');}
  }else{
    flags.push('no-strong-model-token');
  }

  const nc=nameCoverage(title,product);
  if(nc.coverage>=0.75){score+=22;reasons.push('strong-name-match');}
  else if(nc.coverage>=0.45){score+=12;reasons.push('moderate-name-match');}
  else if(nc.coverage>0){score+=5;reasons.push('weak-name-match');}

  const condition=clean(item&&item.condition);
  const used=listingLooksUsed(title,condition);
  if(used){score-=18;flags.push('used-or-refurbished');}
  else if(/new/i.test(condition)){score+=8;reasons.push('new-condition');}

  if(item&&item.image&&item.image.imageUrl){score+=4;reasons.push('image-present');}else flags.push('image-missing');
  if(item&&item.itemAffiliateWebUrl){score+=4;reasons.push('affiliate-url-present');}else flags.push('affiliate-url-missing');

  // If there is a strong model identifier, exact model confirmation is mandatory for auto-publish.
  const exactModel=models.length>0&&mm.coverage===1;
  const autoEligible=brandOk&&exactModel&&!used&&Boolean(item&&item.image&&item.image.imageUrl)&&Boolean(item&&item.itemAffiliateWebUrl);
  let status='reject';
  if(score>=AUTO_ACCEPT_SCORE&&autoEligible)status='accept';
  else if(score>=REVIEW_SCORE&&brandOk&&(exactModel||mm.coverage>=0.5))status='review';
  return {score,status,reasons,flags,brandOk,models,modelCoverage:mm.coverage,nameCoverage:nc.coverage,exactModel};
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
    itemWebUrl:clean(item&&item.itemWebUrl)||null,
    itemAffiliateWebUrl:clean(item&&item.itemAffiliateWebUrl)||null,
    score:assessment.score,
    status:assessment.status,
    reasons:assessment.reasons,
    flags:assessment.flags,
    exactModel:assessment.exactModel===true,
    modelCoverage:assessment.modelCoverage,
    nameCoverage:assessment.nameCoverage,
    marketplaceId:'EBAY_AU',
    source:'eBay Buy Browse API',
    recommendationWeight:0
  };
}
async function enrichProduct(product,{limit=MAX_CANDIDATES}={}){
  const image=imageStatus(product);
  const query=queryFor(product);
  if(!query)return {slug:product.slug,status:'no-query',query:null,currentProductPhotography:image.productPhotography===true,candidates:[]};
  const result=await ebay.searchItems({q:query,limit:Math.max(1,Math.min(MAX_CANDIDATES,Number(limit)||MAX_CANDIDATES))},{referenceId:`apg:${product.slug}`});
  const rows=Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[];
  const candidates=rows.map(item=>{
    const assessment=scoreCandidate(product,item);
    return projectCandidate(product,item,assessment);
  }).sort((a,b)=>b.score-a.score);
  const accepted=candidates.find(row=>row.status==='accept')||null;
  const review=candidates.find(row=>row.status==='review')||null;
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
    review:accepted?null:review,
    candidateCount:candidates.length,
    candidates:candidates.slice(0,3),
    recommendationWeight:0
  };
}

module.exports={VERSION,AUTO_ACCEPT_SCORE,REVIEW_SCORE,MAX_CANDIDATES,norm,compact,tokens,modelTokens,identityTokens,listingLooksAccessory,listingLooksUsed,scoreCandidate,queryFor,enrichProduct};
