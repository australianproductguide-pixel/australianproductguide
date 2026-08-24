'use strict';

const VERSION='98.0';
const SCHEMA_VERSION='category-decision-schema-v2.2';
const DEPTH_STANDARD_VERSION='evidence-depth-standard-v2.2';
const VERIFIED_AT='2026-08-24';

// Final lifecycle resolutions close the register without pretending either record is a
// current exact Australian offer. Historical/excluded records remain fail-closed for
// current recommendation and commerce purposes.
const finalEntityOverrides=[
  {
    slug:'russell-hobbs-steam-genie-handheld-garment-steamer',
    status:'HISTORICAL',
    eligibility:'HISTORICAL',
    correctedName:'Russell Hobbs Steam Genie Handheld Steamer',
    correctedModel:'25600-56',
    region:'HISTORICAL_AU_RETAIL_CONTEXT',
    issueType:'currentness',
    resolution:'RESOLVED_HISTORICAL_EXACT_MODEL',
    authoritativeSource:'https://cdn-img.russellhobbs.com/manager/russellhobbs_com/files/25600-56_steam_genie_handheld_steamer.pdf',
    sourceType:'manufacturer-manual',
    note:'The Steam Genie Handheld Steamer is identifiable as model 25600-56 from manufacturer documentation and historical Australian retail references. APG retains the page for transparent history/search value but does not treat it as a current Australian primary recommendation.'
  },
  {
    slug:'wahl-stainless-steel-lithium-ion-beard-trimmer',
    status:'HISTORICAL',
    eligibility:'HISTORICAL',
    correctedName:'Wahl Stainless Steel Lithium Ion+ Beard Trimmer',
    correctedModel:'Stainless Steel Lithium Ion+ family - exact AU SKU unresolved',
    region:'HISTORICAL_VARIANT_FAMILY',
    issueType:'variant-ambiguous',
    resolution:'RESOLVED_HISTORICAL_VARIANT_FAMILY',
    authoritativeSource:'https://wahlusa.com/shop/stainless-steel-lithium-ion-20-trimmer-09864-ss',
    sourceType:'manufacturer-family-reference',
    note:'Multiple materially similar Wahl Stainless Steel Lithium Ion variants exist. No defensible exact current Australian SKU binding was established. The record is therefore resolved as a historical variant-family page and remains ineligible for a current primary recommendation or exact commerce restoration.'
  }
];

// A completed revalidation can legitimately conclude that no safe current exact AU
// purchase destination is established. That is preferable to guessing a sibling SKU,
// imported electrical variant or marketplace ASIN.
const commerceRevalidations={
  'meross-mini-smart-wi-fi-plug':{
    status:'REVALIDATED_NO_EXACT_CURRENT_AU_RETAIL_DESTINATION',
    exactIdentity:'MSS315 AU',
    destination:null,
    source:'https://www.meross.com/Detail/',
    sourceType:'manufacturer-product-index',
    action:'KEEP_MODEL_SPECIFIC_FALLBACK',
    note:'Current Australian MSS315 AU identity is established, but Action 4 final verification did not establish a sufficiently reliable exact current Australian retailer/marketplace destination. Do not guess a US-version four-pack or another plug variant.'
  },
  'therabody-theragun-mini':{
    status:'REVALIDATED_EXACT_PRODUCT_DESTINATION',
    exactIdentity:'Theragun Mini 3rd Gen',
    destination:'https://www.therabody.com/products/theragun-mini-gen-3',
    source:'https://www.therabody.com/products/theragun-mini-gen-3',
    sourceType:'manufacturer-primary',
    action:'ALLOW_EXACT_MANUFACTURER_PRODUCT_PATH',
    note:'Generation-specific manufacturer product destination matches the corrected 3rd Gen identity. No marketplace ASIN is inferred.'
  },
  'therabody-theragun-prime':{
    status:'REVALIDATED_EXACT_PRODUCT_DESTINATION',
    exactIdentity:'Theragun Prime 6th Gen',
    destination:'https://www.therabody.com/products/theragun-prime-gen-6',
    source:'https://www.therabody.com/products/theragun-prime-gen-6',
    sourceType:'manufacturer-primary',
    action:'ALLOW_EXACT_MANUFACTURER_PRODUCT_PATH',
    note:'Generation-specific manufacturer product destination matches the corrected 6th Gen identity. No marketplace ASIN is inferred.'
  },
  'braun-beard-trimmer-series-7-bt7420':{
    status:'REVALIDATED_NO_EXACT_CURRENT_AU_RETAIL_DESTINATION',
    exactIdentity:'BT7420',
    destination:null,
    source:'https://au.braun.com/en-au/service/products/parts/5806/80761296',
    sourceType:'manufacturer-au-service',
    action:'KEEP_MODEL_SPECIFIC_FALLBACK',
    note:'Exact Australian service binding remains valid, but an exact current Australian retail destination was not established strongly enough to restore a direct purchase path.'
  },
  'remington-style-series-b5-beard-trimmer':{
    status:'REVALIDATED_EXACT_AU_MODEL_REFERENCE',
    exactIdentity:'MB6000AU',
    destination:'https://cdn-img.remington-europe.com/manager/remington/files/mb6000au_ifu.pdf',
    source:'https://cdn-img.remington-europe.com/manager/remington/files/mb6000au_ifu.pdf',
    sourceType:'manufacturer-au-manual',
    action:'KEEP_MODEL_SPECIFIC_FALLBACK_UNTIL_CURRENT_RETAIL_OFFER_VERIFIED',
    note:'Exact Australian model is verified, but the authoritative reference is not itself a current retailer offer. Preserve model-specific fallback rather than promote an unverified store listing.'
  },
  'waterpik-cordless-advanced-water-flosser':{
    status:'REVALIDATED_NO_EXACT_CURRENT_AU_RETAIL_DESTINATION',
    exactIdentity:'Cordless Advanced 2.0 / WP-580 series',
    destination:null,
    source:'https://www.waterpik.com/pdfs/wp-580-instruction-manual.pdf',
    sourceType:'manufacturer-manual',
    action:'KEEP_MODEL_SPECIFIC_FALLBACK',
    note:'The WP-580 series identity is established, but current Australian retail discovery is dominated by newer Waterpik cordless models. APG does not substitute a newer sibling for this entity.'
  },
  'oral-b-aquacare-4-water-flosser':{
    status:'REVALIDATED_EXACT_AU_RETAIL_DESTINATION',
    exactIdentity:'80340868',
    destination:'https://www.bigw.com.au/product/oral-b-aquacare-4-water-flosser/p/80340868',
    source:'https://www.bigw.com.au/product/oral-b-aquacare-4-water-flosser/p/80340868',
    sourceType:'exact-au-retailer',
    action:'ALLOW_EXACT_AU_RETAIL_PRODUCT_PATH',
    note:'Exact Australian product code and retailer path are aligned. Retailer status contributes zero recommendation points.'
  },
  'anker-solix-c300':{
    status:'REVALIDATED_EXACT_AU_PRODUCT_DESTINATION',
    exactIdentity:'SOLIX C300 / A1722',
    destination:'https://www.anker.com/au/products/a1722',
    source:'https://www.anker.com/au/products/a1722',
    sourceType:'manufacturer-au',
    action:'ALLOW_EXACT_AU_MANUFACTURER_PRODUCT_PATH',
    note:'Exact Australian C300 AC/DC product path is distinct from C300 DC. No sibling substitution or guessed marketplace identifier is used.'
  },
  'audio-technica-atr2100x-usb':{
    status:'REVALIDATED_EXACT_MODEL_AU_DISTRIBUTION',
    exactIdentity:'ATR2100x-USB',
    destination:null,
    source:'https://docs.audio-technica.com/us/p52830_atr2100x_usb_um.pdf',
    sourceType:'manufacturer-manual-plus-au-distribution',
    action:'KEEP_MODEL_SPECIFIC_FALLBACK_UNTIL_CURRENT_RETAIL_OFFER_VERIFIED',
    note:'Exact model and Australian distribution are established, but Action 4 does not promote a retailer path unless a current exact offer is independently verified. No ASIN is guessed.'
  }
};

module.exports={VERSION,SCHEMA_VERSION,DEPTH_STANDARD_VERSION,VERIFIED_AT,finalEntityOverrides,commerceRevalidations};
