'use strict';

const assert=require('assert');
const layer=require('../lib/image-seo-phase1-v74');
const registry=require('../data/image-seo-registry-v74');

const restrictions=layer.IMAGE_SEO_RESTRICTIONS||{};
const categories=registry.allCategoryRecords();
const brands=registry.allBrandRecords({restrictions});
const productVisuals=registry.allProductVisualRecords({restrictions});
const verifiedProducts=registry.allVerifiedProductRecords();
const errors=[];
const warnings=[];
const fail=(condition,message)=>{if(!condition)errors.push(message);};

function genericAlt(value){return /^(image|photo|picture|logo)$/i.test(String(value||'').trim());}
function duplicateValues(records,key){
  const map=new Map();
  for(const record of records){const value=record&&record[key];if(!value)continue;if(!map.has(value))map.set(value,[]);map.get(value).push(record);}
  return [...map.entries()].filter(([,rows])=>rows.length>1);
}
function scripts(html){
  const out=[];for(const match of String(html||'').matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{out.push(JSON.parse(match[1]));}catch{}}
  return out;
}
function flatten(value,out=[]){
  if(!value||typeof value!=='object')return out;
  if(Array.isArray(value)){for(const item of value)flatten(item,out);return out;}
  out.push(value);if(Array.isArray(value['@graph']))flatten(value['@graph'],out);return out;
}
function urlBlock(xml,url){
  return (String(xml).match(new RegExp(`<url>(?:(?!<\\/url>)[\\s\\S])*?<loc>${url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}<\\/loc>(?:(?!<\\/url>)[\\s\\S])*?<\\/url>`,'i'))||[])[0]||'';
}

fail(layer.IMAGE_SEO_PHASE1_VERSION==='74.0','Image SEO runtime version must be 74.0');
fail(registry.VERSION==='74.0','Image SEO registry version must be 74.0');

// Category completeness, crawlability and provenance.
fail(categories.length===90,`Expected 90 category image records; found ${categories.length}`);
for(const record of categories){
  fail(record.imageType==='category',`${record.categorySlug}: imageType must be category`);
  fail(/^https:\/\//.test(record.imageUrl||''),`${record.categorySlug}: absolute HTTPS imageUrl required`);
  fail(Boolean(record.alt)&&!genericAlt(record.alt),`${record.categorySlug}: descriptive alt required`);
  fail(Number(record.width)>0&&Number(record.height)>0,`${record.categorySlug}: explicit image dimensions required`);
  fail(Number(record.width)<=5000&&Number(record.height)<=5000,`${record.categorySlug}: implausibly oversized declared dimensions`);
  fail(Boolean(record.sourceUrl)&&Boolean(record.sourceDomain),`${record.categorySlug}: source provenance required`);
  fail(Boolean(record.provenanceStatus),`${record.categorySlug}: provenance status required`);
  fail(Boolean(record.licenceOrUsageBasis),`${record.categorySlug}: licence/usage basis required`);
  fail(/^\d{4}-\d{2}-\d{2}$/.test(record.lastVerifiedAt||''),`${record.categorySlug}: verification date required`);
  fail(record.eligibleProductImage===false,`${record.categorySlug}: category imagery must never be Product.image eligible`);
  fail(record.eligibleImageSitemap===true,`${record.categorySlug}: category image should be sitemap eligible`);
}
const categoryDuplicates=duplicateValues(categories,'imageUrl');
fail(categoryDuplicates.length===0,`Duplicate category image URLs detected: ${categoryDuplicates.map(([url,rows])=>`${url} (${rows.map(r=>r.categorySlug).join(',')})`).join('; ')}`);

// Brand identity metadata. Restricted-policy brands intentionally remain name fallbacks.
fail(brands.length===178,`Expected 178 governed brand image records; found ${brands.length}`);
for(const record of brands){
  fail(record.imageType==='brand_logo',`${record.brandSlug}: imageType must be brand_logo`);
  fail(record.imageUrl===`https://australianproductguide.au/assets/brand-marks/${encodeURIComponent(record.brandSlug)}`,`${record.brandSlug}: brand URL must be stable same-origin resolver path`);
  fail(Boolean(record.alt)&&/brand logo$/i.test(record.alt),`${record.brandSlug}: truthful brand-logo alt required`);
  fail(record.eligibleProductImage===false,`${record.brandSlug}: brand identity must never be Product.image eligible`);
  fail(Boolean(record.provenanceStatus)&&Boolean(record.licenceOrUsageBasis),`${record.brandSlug}: brand provenance governance required`);
  if(restrictions[record.brandSlug]){
    fail(record.eligibleBrandLogo===false&&record.eligibleImageSitemap===false,`${record.brandSlug}: policy-restricted graphical logo must be excluded from structured logo/sitemap eligibility`);
  }
}
fail(duplicateValues(brands,'imageUrl').length===0,'Brand resolver URLs must be unique by canonical brand slug');

// Every product has a truthful visual state; placeholders do not become product photography.
fail(productVisuals.length===482,`Expected 482 product visual records; found ${productVisuals.length}`);
for(const record of productVisuals){
  fail(['product','brand_logo'].includes(record.imageType),`${record.productSlug}: product visual must be product or brand_logo`);
  fail(Boolean(record.alt)&&!genericAlt(record.alt),`${record.productSlug}: descriptive visual alt required`);
  fail(Boolean(record.provenanceStatus)&&Boolean(record.licenceOrUsageBasis),`${record.productSlug}: product visual provenance required`);
  if(record.imageType==='brand_logo'){
    fail(record.eligibleProductImage===false,`${record.productSlug}: brand placeholder cannot be Product.image eligible`);
    fail(record.eligibleImageSitemap===false,`${record.productSlug}: brand placeholder cannot be submitted as product sitemap image`);
    fail(/not photography|placeholder/i.test(record.purpose||record.caption||''),`${record.productSlug}: placeholder semantics must be explicit`);
  } else {
    fail(record.eligibleProductImage===true&&record.eligibleImageSitemap===true,`${record.productSlug}: verified product image should be product/sitemap eligible`);
  }
}
for(const record of verifiedProducts){
  fail(record.imageType==='product','Verified product registry returned a non-product image');
  fail(['exact','same_model_immaterial_variant'].includes(record.productMatch),`${record.productSlug}: verified product match must be exact or materially identical`);
  fail(Boolean(record.sourceUrl)&&Boolean(record.sourceDomain)&&Boolean(record.lastVerifiedAt),`${record.productSlug}: verified product provenance incomplete`);
}
const verifiedDuplicates=duplicateValues(verifiedProducts,'imageUrl');
if(verifiedDuplicates.length)warnings.push(`${verifiedDuplicates.length} verified product image URL(s) are shared across product records; review if those products are not the same physical model/immaterial variant.`);
const missingIntrinsic=verifiedProducts.filter(record=>!record.width||!record.height).length;
if(missingIntrinsic)warnings.push(`${missingIntrinsic} verified product image(s) do not yet carry intrinsic width/height in the source registry; v74 does not invent dimensions.`);

// Structured-data fail-closed test: a brand mark presented as Product.image must be removed.
const unverifiedProduct=registry.products.find(product=>!registry.verifiedProductRecord(product));
fail(Boolean(unverifiedProduct),'Expected at least one product without verified product photography for placeholder QA');
if(unverifiedProduct){
  const path=`/products/${unverifiedProduct.slug}/`;
  const dirty=`<!doctype html><html><head><title>${unverifiedProduct.name}</title><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Product',name:unverifiedProduct.name,image:[`https://australianproductguide.au/assets/brand-marks/${unverifiedProduct.brand}`]})}</script></head><body><img src="/assets/brand-marks/${encodeURIComponent(require('../lib/routes').slugify(unverifiedProduct.brand))}" alt=""></body></html>`;
  const patched=layer.patchHtml(dirty,path),nodes=flatten(scripts(patched)).filter(node=>(Array.isArray(node['@type'])?node['@type']:[node['@type']]).includes('Product'));
  const productNode=nodes[0];
  fail(Boolean(productNode),`${unverifiedProduct.slug}: Product JSON-LD must survive patching`);
  fail(!productNode||!productNode.image,`${unverifiedProduct.slug}: unverified Product.image must be removed`);
  fail(patched.includes(`${unverifiedProduct.brand} brand logo`),`${unverifiedProduct.slug}: visible brand placeholder should receive truthful alt text`);
}

// Image sitemap semantics: category/brand rich; product placeholders excluded.
const categorySample=categories[0];
const brandSample=brands.find(record=>record.eligibleImageSitemap);
const restrictedSample=brands.find(record=>restrictions[record.brandSlug]);
const verifiedSample=verifiedProducts[0]||null;
const sampleUrls=[
  `<url><loc>https://australianproductguide.au/categories/${categorySample.categorySlug}/</loc></url>`,
  brandSample?`<url><loc>https://australianproductguide.au/brands/${brandSample.brandSlug}/</loc></url>`:'',
  restrictedSample?`<url><loc>https://australianproductguide.au/brands/${restrictedSample.brandSlug}/</loc></url>`:'',
  unverifiedProduct?`<url><loc>https://australianproductguide.au/products/${unverifiedProduct.slug}/</loc></url>`:'',
  verifiedSample?`<url><loc>https://australianproductguide.au/products/${verifiedSample.productSlug}/</loc></url>`:''
].filter(Boolean).join('');
const xml=layer.patchImageSitemap(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sampleUrls}</urlset>`);
fail(xml.includes(`xmlns:image="${layer.IMAGE_SITEMAP_NS}"`),'Image sitemap namespace missing');
fail(urlBlock(xml,`https://australianproductguide.au/categories/${categorySample.categorySlug}/`).includes(categorySample.imageUrl),'Category sitemap entry must include governed category image');
if(brandSample)fail(urlBlock(xml,`https://australianproductguide.au/brands/${brandSample.brandSlug}/`).includes(brandSample.imageUrl),'Eligible brand page must include brand image sitemap entry');
if(restrictedSample)fail(!urlBlock(xml,`https://australianproductguide.au/brands/${restrictedSample.brandSlug}/`).includes('<image:image>'),'Rights-policy brand fallback must not be submitted as graphical logo image');
if(unverifiedProduct)fail(!urlBlock(xml,`https://australianproductguide.au/products/${unverifiedProduct.slug}/`).includes('<image:image>'),'Product with only brand placeholder must not get product sitemap image');
if(verifiedSample)fail(urlBlock(xml,`https://australianproductguide.au/products/${verifiedSample.productSlug}/`).includes(verifiedSample.imageUrl),'Verified product image must appear in product sitemap entry');

// Category on-page alt/dimension/performance test.
const categoryPath=`/categories/${categorySample.categorySlug}/`;
const categoryTag=layer.patchImageTags(`<img src="${categorySample.imageUrl}" alt="">`,categoryPath);
fail(categoryTag.includes(`alt="${categorySample.alt.replace(/&/g,'&amp;')}"`),`${categorySample.categorySlug}: category alt patch missing`);
fail(categoryTag.includes(`width="${categorySample.width}"`)&&categoryTag.includes(`height="${categorySample.height}"`),`${categorySample.categorySlug}: category dimensions patch missing`);
fail(categoryTag.includes('loading="eager"')&&categoryTag.includes('fetchpriority="high"'),`${categorySample.categorySlug}: primary category image should be eager/high priority`);

if(errors.length){
  console.error(`Image SEO Phase 1 v74 QA FAILED (${errors.length})`);
  for(const error of errors)console.error(' - '+error);
  if(warnings.length){console.error('Warnings:');for(const warning of warnings)console.error(' - '+warning);}
  process.exit(1);
}
console.log(`Image SEO Phase 1 v74 QA PASS: ${categories.length}/90 category images, ${brands.length}/178 brand identities, ${productVisuals.length}/482 product visual states; ${verifiedProducts.length} verified product photo(s) eligible for Product.image.`);
console.log(`Image sitemap + JSON-LD + alt/provenance/duplicate/dimension guards PASS; ${Object.keys(restrictions).length} rights-policy brand fallback(s) excluded from graphical-logo SEO.`);
for(const warning of warnings)console.log('WARN: '+warning);
