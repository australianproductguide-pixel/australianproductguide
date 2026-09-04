'use strict';

// APG eBay EPN Surface v1.2 + Category Shopping v133 integration boundary.
// Preserve the complete governed eBay EPN v1.2 implementation byte-for-byte in the base module,
// then install the stable category-shopping presentation at the same merchandising boundary.
// The historical creative-wrapper filename remains an implementation compatibility detail only.
// No recommendation, evidence, identity, retailer ordering or commerce-eligibility logic is
// duplicated or reweighted here.
const base=require('./ebay-epn-surface-v12-base');
const categoryShopping=require('./ebay-official-creatives-v121-runtime');

function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('eBay EPN surface install requires the v112 wrapper module');
  base.install(target);
  if(target.__APG_EBAY_CATEGORY_SHOPPING_V133_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return categoryShopping.wrap(original(downstream));};
  target.__APG_EBAY_CATEGORY_SHOPPING_V133_INSTALLED=true;
  // Retain the historical flag so older diagnostics cannot install a duplicate wrapper.
  target.__APG_EBAY_OFFICIAL_CREATIVES_V121_INSTALLED=true;
  return target;
}

module.exports={
  ...base,
  install,
  CATEGORY_SHOPPING_VERSION:categoryShopping.VERSION,
  OFFICIAL_CREATIVES_VERSION:categoryShopping.VERSION
};
