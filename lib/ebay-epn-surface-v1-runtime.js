'use strict';

// APG eBay EPN Surface v1.2 + Official Creative Gallery v121 integration boundary.
// Preserve the complete governed eBay EPN v1.2 implementation byte-for-byte in the base module,
// then install the official Creative Gallery as an additional presentation-only wrapper at the
// same merchandising boundary. No recommendation, evidence, identity or commerce-eligibility
// logic is duplicated or reweighted here.
const base=require('./ebay-epn-surface-v12-base');
const officialCreatives=require('./ebay-official-creatives-v121-runtime');

function install(target){
  if(!target||typeof target.wrap!=='function')throw new TypeError('eBay EPN surface install requires the v112 wrapper module');
  base.install(target);
  if(target.__APG_EBAY_OFFICIAL_CREATIVES_V121_INSTALLED)return target;
  const original=target.wrap.bind(target);
  target.wrap=function(downstream){return officialCreatives.wrap(original(downstream));};
  target.__APG_EBAY_OFFICIAL_CREATIVES_V121_INSTALLED=true;
  return target;
}

module.exports={
  ...base,
  install,
  OFFICIAL_CREATIVES_VERSION:officialCreatives.VERSION
};
