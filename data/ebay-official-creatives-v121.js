'use strict';

// APG official eBay Creative Gallery registry v121.0.
// These are owner-supplied official eBay promotional creatives. They are retailer visual assets,
// not product evidence, not APG editorial imagery and not recommendation inputs.
// All destinations are governed eBay Australia EPN search/collection pathways and contribute
// zero recommendation points. Generic category creatives make no claim about a live sale,
// discount, exact listing, price, stock, seller, condition or warranty.

const CAMPAIGN_ID='5339198634';
const MARKETPLACE_ROTATION_ID='705-53470-19255-0';
const SITE_ID='15';
const TOOL_ID='20014';
const REVIEWED='2026-08-29';
const SOURCE='Owner-supplied official eBay Creative Gallery packs';
const BASE='/assets/ebay/official/';

function searchUrl(term){
  return `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(term)}&mkcid=1&mkrid=${MARKETPLACE_ROTATION_ID}&siteid=${SITE_ID}&campid=${CAMPAIGN_ID}&toolid=${TOOL_ID}&customid=&mkevt=1`;
}

const CREATIVES={
  certifiedRefurbished:{
    key:'certifiedRefurbished',
    title:'Certified Refurbished',
    image:`${BASE}ebay-certified-refurbished.jpg`,
    imageType:'image/jpeg',
    destination:searchUrl('certified refurbished'),
    routeTerms:['refurbished','laptop','tablet'],
    catalogueThemes:['technology','computing'],
    prominence:1,
    alt:'Official eBay Certified Refurbished creative',
    claimScope:'retailer-category-discovery'
  },
  tech:{
    key:'tech',
    title:'Tech',
    image:`${BASE}ebay-tech.jpg`,
    imageType:'image/jpeg',
    destination:searchUrl('electronics'),
    routeTerms:['laptop','tablet','phone','television','headphone','earbud','printer','scanner','gaming','smart','camera','computer','monitor','router','ssd','usb-c'],
    catalogueThemes:['technology','electronics'],
    prominence:2,
    alt:'Official eBay Tech creative',
    claimScope:'retailer-category-discovery'
  },
  homeGarden:{
    key:'homeGarden',
    title:'Home & Garden',
    image:`${BASE}ebay-home-garden.jpg`,
    imageType:'image/jpeg',
    destination:searchUrl('home garden'),
    routeTerms:['coffee','microwave','bread','juicer','fridge','vacuum','air-fryer','kitchen','home','garden','pizza','pet'],
    catalogueThemes:['home','kitchen','garden'],
    prominence:3,
    alt:'Official eBay Home and Garden creative',
    claimScope:'retailer-category-discovery'
  },
  motors:{
    key:'motors',
    title:'Motors',
    image:`${BASE}ebay-motors.jpg`,
    imageType:'image/jpeg',
    destination:searchUrl('car accessories'),
    routeTerms:['car','vehicle','tyre','jump-starter','dash-cam','automotive'],
    catalogueThemes:['automotive'],
    prominence:4,
    alt:'Official eBay Motors creative',
    claimScope:'retailer-category-discovery'
  },
  sportingGoods:{
    key:'sportingGoods',
    title:'Sporting Goods',
    image:`${BASE}ebay-sporting-goods.png`,
    imageType:'image/png',
    destination:searchUrl('sporting goods'),
    routeTerms:['fitness','sport','running','gym','camping','outdoor'],
    catalogueThemes:['sport','fitness','outdoors'],
    prominence:5,
    alt:'Official eBay Sporting Goods creative',
    claimScope:'retailer-category-discovery'
  }
};

function all(){return Object.values(CREATIVES).sort((a,b)=>a.prominence-b.prominence);}
function forPath(path){
  const value=String(path||'').toLowerCase();
  if(value==='/'||value==='/deals/')return all();
  if(/^\/products\//.test(value))return [];
  return all().filter(row=>(row.routeTerms||[]).some(term=>value.includes(term)));
}

module.exports={
  VERSION:'121.0',CAMPAIGN_ID,MARKETPLACE_ROTATION_ID,SITE_ID,TOOL_ID,REVIEWED,SOURCE,BASE,CREATIVES,searchUrl,all,forPath
};
