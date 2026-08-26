#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {products,categories}=require('../data');
const {imageStatus}=require('../data/image-provenance');
const searchDepth=require('../data/search-opportunity-depth-v104');
const runtime=require('../lib/premium-mobile-decision-commerce-v112-runtime');

const OUT=process.env.APG_V112_DEPTH_AUDIT_OUT||path.join('artifacts','release-gate','premium-mobile-v112-depth-audit.json');
const prioritySlugs=Object.keys(searchDepth.categoryDepth||{}).filter(slug=>categories[slug]);
assert(prioritySlugs.length>0,'No v112 priority decision areas are configured');

function uniqueRetailers(product){return [...new Set(runtime.retailerRows(product).map(row=>String(row.retailer||'').trim()).filter(Boolean))];}
function strongestKey(product){return runtime.strongestRetailer(product).state.key;}
function rowFor(slug){
  const category=categories[slug],rows=products.filter(product=>product.category===slug);
  const imagery=rows.map(product=>({product,image:imageStatus(product)}));
  const photography=imagery.filter(({image})=>image.productPhotography);
  for(const {product,image} of photography){
    assert(image.displayUrl,`${product.slug}: verified product photography missing display URL`);
    assert(image.source,`${product.slug}: verified product photography missing source`);
    assert(image.rights,`${product.slug}: verified product photography missing rights basis`);
    assert(image.matchStatus&&image.matchStatus!=='unverified',`${product.slug}: verified product photography missing verified product match`);
  }
  const strongest=rows.map(product=>strongestKey(product));
  return {
    slug,
    label:searchDepth.categoryDepth[slug].label,
    products:rows.length,
    verifiedProductPhotography:photography.length,
    transparentImageFallbacks:rows.length-photography.length,
    verifiedPhotographyCoverage:rows.length?Number((photography.length/rows.length*100).toFixed(1)):0,
    exactRetailerIdentity:strongest.filter(key=>key==='exact').length,
    verifiedVariantIdentity:strongest.filter(key=>key==='variant').length,
    modelSearchFallbackStrongest:strongest.filter(key=>key==='fallback').length,
    otherOrUnknownRetailerIdentity:strongest.filter(key=>!['exact','variant','fallback'].includes(key)).length,
    productsWithTwoOrMoreRetailers:rows.filter(product=>uniqueRetailers(product).length>=2).length,
    productsWithMaintainedPriceCheck:rows.filter(product=>Number(product.price)>0&&product.lastPriceCheck).length,
    productsWithReviewDate:rows.filter(product=>product.lastSubstantiveReview||product.lastReviewed||product.lastSourceVerification).length
  };
}

const priority=prioritySlugs.map(rowFor);
const totals=priority.reduce((out,row)=>{
  for(const key of ['products','verifiedProductPhotography','transparentImageFallbacks','exactRetailerIdentity','verifiedVariantIdentity','modelSearchFallbackStrongest','otherOrUnknownRetailerIdentity','productsWithTwoOrMoreRetailers','productsWithMaintainedPriceCheck','productsWithReviewDate'])out[key]=(out[key]||0)+row[key];
  return out;
},{});
totals.verifiedPhotographyCoverage=totals.products?Number((totals.verifiedProductPhotography/totals.products*100).toFixed(1)):0;
totals.multiRetailerCoverage=totals.products?Number((totals.productsWithTwoOrMoreRetailers/totals.products*100).toFixed(1)):0;

const report={
  version:runtime.VERSION,
  reviewed:searchDepth.REVIEWED,
  status:'INTEGRITY_PASS_COVERAGE_NOT_IMPLIED',
  priorityDecisionAreas:priority,
  totals,
  controls:{
    genuinePhotographyOnlyWhenVerified:true,
    transparentFallbackPermitted:true,
    exactVariantFallbackRetailerStatesSeparated:true,
    commissionRecommendationWeight:0,
    noCoverageThresholdFabricated:true
  },
  interpretation:[
    'A low photography percentage is a coverage backlog, not permission to display unverified product imagery.',
    'A low multi-retailer percentage is a retailer-research backlog, not permission to guess destinations.',
    'Priority decision area does not mean formally Decision Grade; Category Completion Gate remains authoritative.'
  ]
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log(`APG_V112_DEPTH_AUDIT=PASS priorityAreas=${priority.length} products=${totals.products} verifiedPhotography=${totals.verifiedProductPhotography} multiRetailer=${totals.productsWithTwoOrMoreRetailers}`);
