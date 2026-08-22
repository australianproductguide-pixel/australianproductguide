'use strict';

// APG reviewed residual brand-mark registry v68.1.
//
// This registry is intentionally narrow. It is only for canonical brands that could
// not be resolved reliably through the first-party quality/declaration/favicon layers
// or the pinned exact-match vector layer AND where APG has a defensible first-party or
// explicitly publication/retail-authorised brand asset.
//
// Do not add a logo merely because a third-party page visually matches the brand.
// Do not add product/lifestyle photography. Do not add marks where the brand's current
// published terms require prior logo-use permission unless that permission is recorded.
// Trademarks remain their respective owners; inclusion is nominative identification only.
const residualBrandMarkOverrides={
  'meross':{
    assetUrl:'https://shop.meross.com/cdn/shop/files/HomeKit_Meross_Logo_08aff626-1374-4544-b718-1ee469bf1f13.jpg?v=1632724356&width=1200',
    officialReference:'https://www.meross.com/',
    provenanceReference:'https://shop.meross.com/collections/smart-garage-door-opener',
    provenanceNote:'First-party Meross official-store brand asset.'
  },
  'nutribullet':{
    assetUrl:'https://mma.prnewswire.com/media/2466796/NB_K_150dpi_Logo.jpg?p=facebook',
    officialReference:'https://www.nutribullet.com/',
    provenanceReference:'https://www.nutribullet.com/press/',
    provenanceNote:'Press-supplied NutriBullet logo. NutriBullet’s official press/brand-assets page expressly provides downloadable logos for publications, web applications and retail listings.'
  }
};

module.exports=Object.freeze(Object.fromEntries(Object.entries(residualBrandMarkOverrides).map(([slug,value])=>[slug,Object.freeze({...value,reviewed:true,rightsBasis:'first-party-or-explicitly-authorised-publication-asset'})])));
