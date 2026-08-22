'use strict';

// APG Image SEO Phase 1 v74 — governed image metadata registry.
//
// This module does not create new imagery and does not upgrade a placeholder into
// product photography. It normalises the imagery APG already has into three explicit
// classes so rendering, structured data, social metadata, sitemaps and QA can make the
// same provenance-safe decision everywhere:
//   product     = exact/same-model verified lawful product photography only
//   brand_logo  = governed brand identity; may be a visual product placeholder
//   category    = editorial category context; never evidence of a specific product
const {products,categories}=require('./index');
const categoryImages=require('./category-editorial-images-v45');
const televisionImage=require('./category-editorial-televisions-v71');
const {imageFor,validationErrors}=require('./product-images');
const officialDomains=require('./brand-official-domains-v62');
const {brands,slugify}=require('../lib/routes');

const VERSION='74.0';
const ORIGIN='https://australianproductguide.au';
const RELEASE_REVIEWED_AT='2026-08-22';

const earbudsImage=Object.freeze({
  src:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Here_One_earbuds_in_white_charging_case.jpg/1280px-Here_One_earbuds_in_white_charging_case.jpg',
  width:1280,
  height:720,
  sourceTitle:'Here One earbuds in white charging case.jpg',
  sourcePage:'https://commons.wikimedia.org/wiki/File%3AHere_One_earbuds_in_white_charging_case.jpg',
  creator:'Doppler Labs',
  license:'CC BY-SA 4.0',
  licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',
  reviewedAt:'2026-08-22',
  reviewStatus:'MANUAL_CURATED',
  purpose:'Decorative category-level editorial context only; not evidence of a specific reviewed or recommended APG product.'
});

const brandNameBySlug=new Map(brands.map(name=>[slugify(name),name]));
const productBySlug=new Map(products.map(product=>[product.slug,product]));

function absolute(value){
  if(!value)return null;
  try{return new URL(String(value),ORIGIN).href;}catch{return null;}
}
function sourceDomain(value){
  if(!value)return null;
  try{return new URL(String(value),ORIGIN).hostname.toLowerCase();}catch{return null;}
}
function formatFor(value){
  const path=String(value||'').split('?')[0].toLowerCase();
  if(path.endsWith('.svg'))return 'image/svg+xml';
  if(path.endsWith('.png'))return 'image/png';
  if(path.endsWith('.webp'))return 'image/webp';
  if(path.endsWith('.avif'))return 'image/avif';
  if(path.endsWith('.gif'))return 'image/gif';
  return 'image/jpeg';
}
function productDisplayName(product){
  if(!product)return '';
  const brand=String(product.brand||'').trim(),name=String(product.name||'').trim();
  if(!brand)return name;
  return name.toLowerCase().startsWith(brand.toLowerCase())?name:`${brand} ${name}`.trim();
}
function effectiveCategoryImage(slug){
  if(slug==='televisions')return televisionImage;
  if(slug==='earbuds')return earbudsImage;
  return categoryImages[slug]||null;
}
function categoryRecord(slug){
  const category=categories[slug],image=effectiveCategoryImage(slug);
  if(!category||!image||!image.src)return null;
  const imageUrl=absolute(image.src);
  return Object.freeze({
    imageUrl,
    imageType:'category',
    alt:`${category.label} shopping category`,
    title:`${category.label} — Australian Product Guide`,
    caption:`Editorial image representing the ${category.label} shopping category.`,
    width:Number(image.width)||null,
    height:Number(image.height)||null,
    format:formatFor(image.src),
    sourceUrl:image.sourcePage||null,
    sourceDomain:sourceDomain(image.sourcePage),
    provenanceStatus:image.reviewStatus||'GOVERNED_EDITORIAL',
    licenceOrUsageBasis:image.license||null,
    licenceUrl:image.licenseUrl||null,
    creator:image.creator||null,
    sourceTitle:image.sourceTitle||null,
    brandSlug:null,
    categorySlug:slug,
    productSlug:null,
    lastVerifiedAt:image.reviewedAt||null,
    purpose:image.purpose||'Editorial category context only.',
    eligibleProductImage:false,
    eligibleBrandLogo:false,
    eligiblePreferredPageImage:true,
    eligibleImageSitemap:true
  });
}
function verifiedProductRecord(product){
  if(!product)return null;
  const image=imageFor(product);
  if(!image||image.imageStatus!=='verified'||!image.imageVerified||!image.imageUrl)return null;
  if(!['exact','same_model_immaterial_variant'].includes(image.imageProductMatch))return null;
  if(validationErrors(product,image).length)return null;
  const imageUrl=absolute(image.imageUrl);
  if(!imageUrl)return null;
  return Object.freeze({
    imageUrl,
    imageType:'product',
    alt:String(image.imageAlt||`${productDisplayName(product)} product image`).trim(),
    title:`${productDisplayName(product)} product image`,
    caption:'Verified product image with provenance retained by Australian Product Guide.',
    width:null,
    height:null,
    format:formatFor(image.imageUrl),
    sourceUrl:image.imageSource||image.imageUrl||null,
    sourceDomain:sourceDomain(image.imageSource||image.imageUrl),
    provenanceStatus:'VERIFIED_PRODUCT_IMAGE',
    licenceOrUsageBasis:image.imageRightsBasis||null,
    licenceUrl:null,
    creator:null,
    sourceTitle:null,
    brandSlug:slugify(product.brand),
    categorySlug:product.category||null,
    productSlug:product.slug,
    lastVerifiedAt:image.imageVerifiedAt||null,
    purpose:'Exact or materially identical verified product photography.',
    productMatch:image.imageProductMatch,
    sourceType:image.imageSourceType,
    eligibleProductImage:true,
    eligibleBrandLogo:false,
    eligiblePreferredPageImage:true,
    eligibleImageSitemap:true
  });
}
function brandRecord(brand,options={}){
  const name=String(brand||'').trim(),slug=slugify(name);
  if(!slug)return null;
  const restriction=options.restrictions&&options.restrictions[slug]||null;
  const officialDomain=officialDomains[slug]||null;
  const imageUrl=`${ORIGIN}/assets/brand-marks/${encodeURIComponent(slug)}`;
  return Object.freeze({
    imageUrl,
    imageType:'brand_logo',
    alt:`${name} brand logo`,
    title:`${name} brand identity`,
    caption:restriction?`${name} brand-name identity used under APG logo-use governance.`:`${name} brand identity used for brand navigation and interim product placeholders.`,
    width:null,
    height:null,
    format:'image/svg+xml',
    sourceUrl:officialDomain?`https://${officialDomain}/`:imageUrl,
    sourceDomain:officialDomain||'australianproductguide.au',
    provenanceStatus:restriction?'GOVERNED_POLICY_FALLBACK':'GOVERNED_BRAND_RESOLVER',
    licenceOrUsageBasis:restriction?`Published brand terms require permission; APG uses a neutral brand-name fallback (${restriction.reason||'policy restriction'}).`:'Governed nominative brand identification; resolver retains the accepted source and rights decision.',
    licenceUrl:restriction&&restriction.termsUrl||null,
    creator:null,
    sourceTitle:null,
    brandSlug:slug,
    categorySlug:null,
    productSlug:null,
    lastVerifiedAt:RELEASE_REVIEWED_AT,
    purpose:'Brand identity only; not product photography.',
    eligibleProductImage:false,
    eligibleBrandLogo:!restriction,
    eligiblePreferredPageImage:!restriction,
    eligibleImageSitemap:!restriction
  });
}
function productVisualRecord(product,options={}){
  const verified=verifiedProductRecord(product);
  if(verified)return verified;
  const brand=brandRecord(product&&product.brand,options);
  if(!brand)return null;
  return Object.freeze({...brand,
    productSlug:product.slug,
    categorySlug:product.category||null,
    caption:`${productDisplayName(product)} currently uses ${product.brand} brand identity as an interim visual placeholder; genuine product photography remains pending provenance approval.`,
    provenanceStatus:brand.provenanceStatus==='GOVERNED_POLICY_FALLBACK'?'GOVERNED_POLICY_FALLBACK':'BRAND_IDENTITY_PLACEHOLDER',
    purpose:'Interim brand identity placeholder on a product surface; not photography of the product.',
    eligibleProductImage:false,
    eligiblePreferredPageImage:false,
    eligibleImageSitemap:false
  });
}
function categoryForProduct(product){return product&&categories[product.category]||null;}
function categoryContextForProduct(product){
  const category=categoryForProduct(product);
  if(!category)return null;
  const record=categoryRecord(category.slug);
  if(!record)return null;
  return Object.freeze({...record,
    alt:`${category.label} editorial context for ${productDisplayName(product)}`,
    caption:`Representative ${category.label} editorial context for ${productDisplayName(product)}; not photography of the exact product.`,
    productSlug:product.slug,
    purpose:'Representative category context for the product research page; not product photography.'
  });
}
function allCategoryRecords(){return Object.keys(categories).map(categoryRecord).filter(Boolean);}
function allBrandRecords(options={}){return brands.map(brand=>brandRecord(brand,options)).filter(Boolean);}
function allProductVisualRecords(options={}){return products.map(product=>productVisualRecord(product,options)).filter(Boolean);}
function allVerifiedProductRecords(){return products.map(verifiedProductRecord).filter(Boolean);}

module.exports={
  VERSION,ORIGIN,RELEASE_REVIEWED_AT,products,categories,brands,brandNameBySlug,productBySlug,
  absolute,sourceDomain,formatFor,productDisplayName,effectiveCategoryImage,categoryRecord,
  verifiedProductRecord,brandRecord,productVisualRecord,categoryForProduct,categoryContextForProduct,
  allCategoryRecords,allBrandRecords,allProductVisualRecords,allVerifiedProductRecords
};
