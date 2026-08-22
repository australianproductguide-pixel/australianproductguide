'use strict';

// APG reviewed residual brand-mark registry v68.1.
//
// These entries exist only for canonical brands that could not be resolved by the
// first-party quality/declaration/favicon layers or the pinned Simple Icons identity
// layer. Each entry was visually checked against the named brand and is tied to an
// official brand reference plus a provenance/reference page. They are used solely for
// nominative brand identification inside APG's comparison catalogue; no sponsorship,
// endorsement, partnership or ownership is implied. Trademarks remain their owners'.
//
// Do not add product/lifestyle photography here. `assetUrl` must depict the reviewed
// brand mark itself (or a press/trademark reproduction of it), not a product shot.
const residualBrandMarkOverrides={
  'baratza':{
    assetUrl:'https://shop.coffeecentral.ph/cdn/shop/collections/4._Baratza.jpg?v=1751957995&width=3840',
    officialReference:'https://www.baratza.com/en-au',
    provenanceReference:'https://www.baratza.com/en-au',
    provenanceNote:'Reviewed against Baratza official identity and registered stylised BARATZA mark.'
  },
  'brass-monkey':{
    assetUrl:'https://manuals.plus/wp-content/uploads/2023/08/BRASS-MONKEY-LOGO.jpg',
    officialReference:'https://help.brassmonkey.cool/',
    provenanceReference:'https://help.brassmonkey.cool/hc/en-us/articles/23994389716121-Brass-Monkey-Catalogue',
    provenanceNote:'Reviewed Australian Brass Monkey refrigeration monkey-logo/wordmark; not Brass Monkey cold-therapy or other same-name brands.'
  },
  'cloud-nine':{
    assetUrl:'https://www.cloud9hairandbeauty.com.au/wp-content/uploads/2020/05/cloud-9-logo.jpg',
    officialReference:'https://www.cloudninehair.com.au/',
    provenanceReference:'https://www.cloudninehair.com.au/pages/about-us',
    provenanceNote:'Reviewed C9/CLOUD NINE hairstyling identity; exact brand disambiguation from unrelated Cloud9 businesses.'
  },
  'engel':{
    assetUrl:'https://lifestylelivinggriffith.com.au/cdn/shop/collections/MR40F-Bl-FRONT.jpg?v=1750078279',
    officialReference:'https://engelcoolers.com.au/',
    provenanceReference:'https://engelcoolers.com.au/',
    provenanceNote:'Reviewed red ENGEL refrigeration wordmark with A LEGEND IN RELIABILITY strapline.'
  },
  'esr':{
    assetUrl:'https://www.tejar.pk/media/catalog/category/ESR-LOGO_2.png',
    officialReference:'https://www.esrgear.com/',
    provenanceReference:'https://www.prnewswire.com/news-releases/esr-wins-multiple-red-dot-design-awards-in-2026-302765333.html',
    provenanceNote:'Reviewed teal ESR technology-accessories wordmark.'
  },
  'meross':{
    assetUrl:'https://shop.meross.com/cdn/shop/files/HomeKit_Meross_Logo_08aff626-1374-4544-b718-1ee469bf1f13.jpg?v=1632724356&width=1200',
    officialReference:'https://www.meross.com/',
    provenanceReference:'https://shop.meross.com/collections/smart-garage-door-opener',
    provenanceNote:'First-party Meross official-store blue wordmark asset.'
  },
  'nutribullet':{
    assetUrl:'https://mma.prnewswire.com/media/2466796/NB_K_150dpi_Logo.jpg?p=facebook',
    officialReference:'https://www.nutribullet.com/',
    provenanceReference:'https://www.nutribullet.com/press/',
    provenanceNote:'nutribullet press-supplied black logo; official press area expressly provides downloadable logos for web applications and retail listings.'
  },
  'oclean':{
    assetUrl:'https://oclean.co.uk/cdn/shop/articles/Oclean_logo_800x.png?v=1654698429',
    officialReference:'https://www.oclean.com/',
    provenanceReference:'https://www.oclean.com/',
    provenanceNote:'Reviewed red Oclean symbol plus lowercase wordmark.'
  },
  'sunbeam':{
    assetUrl:'https://logowik.com/content/uploads/images/sunbeam-products7972.logowik.com.webp',
    officialReference:'https://www.sunbeam.com.au/',
    provenanceReference:'https://www.sunbeam.com.au/',
    provenanceNote:'Reviewed Sunbeam home-appliance script wordmark used for the Australian appliance brand.'
  },
  'wahl':{
    assetUrl:'https://mma.prnewswire.com/media/2866596/Wahl_Professional__Logo.jpg?p=facebook',
    officialReference:'https://wahl.com.au/',
    provenanceReference:'https://wahl.com.au/',
    provenanceNote:'Reviewed WAHL identity from Wahl Professional press material.'
  },
  'whisker':{
    assetUrl:'https://images.squarespace-cdn.com/content/v1/60a6eb5cc8fc307f1c5b3a91/1029adcf-08dd-46d7-8cb3-5dbb94be6e43/whisker-portolio%2Bcopy.png',
    officialReference:'https://www.whisker.com/',
    provenanceReference:'https://www.businesswire.com/news/home/20250417781144/en/Whisker-and-Tidy-Cats-Partner-Together-to-Create-The-Perfect-Cycle',
    provenanceNote:'Reviewed Whisker pet-technology wordmark; cross-checked against Whisker/Litter-Robot press branding.'
  },
  'xgimi':{
    assetUrl:'https://prcdn.freetls.fastly.net/release_image/75566/70/75566-70-f824242d083101e52242e7800ed864db-800x800.png?auto=webp&bg-color=fff&fit=bounds&format=jpeg&height=1350&quality=85%2C75&width=1950',
    officialReference:'https://www.xgimi.com/',
    provenanceReference:'https://prtimes.jp/main/html/rd/p/000000070.000075566.html',
    provenanceNote:'Reviewed XGIMI corporate wordmark from XGIMI company press-release material.'
  },
  'zerowater':{
    assetUrl:'https://advertising.walmart.com/thunder/assets/media-service/wcnp-prod/images/29b766f9-f950-4afa-8a36-c035f7e504d7/29bc41ae-0d2c-46a9-b1d7-23e9d45ae631.png',
    officialReference:'https://zerowater.com/',
    provenanceReference:'https://zerowater.com/',
    provenanceNote:'Reviewed blue/black ZeroWater wordmark for the water-filtration brand.'
  }
};

module.exports=Object.freeze(Object.fromEntries(Object.entries(residualBrandMarkOverrides).map(([slug,value])=>[slug,Object.freeze({...value,reviewed:true})])));
