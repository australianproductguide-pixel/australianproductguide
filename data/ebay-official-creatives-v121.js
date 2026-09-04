'use strict';

// APG official eBay Creative Gallery registry v121.1.
// Exact first-party Creative Gallery preview assets are hard-mapped by category so the visual
// cannot drift when card order changes. These are eBay retailer promotional assets, not product
// evidence, not APG editorial imagery and not recommendation inputs. Retailer participation and
// commission contribute zero recommendation points.

const CAMPAIGN_ID='5339198634';
const MARKETPLACE_ROTATION_ID='705-53470-19255-0';
const SITE_ID='15';
const TOOL_ID='20014';
const REVIEWED='2026-09-04';
const SOURCE='eBay Partner Network Creative Gallery';
const SOURCE_URL='https://partnernetwork.ebay.com/solutions/creative-gallery';
const BASE='/assets/ebay/official/'; // retained for compatibility with older runtime consumers

function searchUrl(term){
  return `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(term)}&mkcid=1&mkrid=${MARKETPLACE_ROTATION_ID}&siteid=${SITE_ID}&campid=${CAMPAIGN_ID}&toolid=${TOOL_ID}&customid=&mkevt=1`;
}

const CREATIVES={
  certifiedRefurbished:{
    key:'certifiedRefurbished',
    title:'Certified Refurbished',
    image:'https://i.ebayimg.com/images/g/tuIAAOSwZk5e~Ki2/s-l1600.jpg',
    imageType:'image/jpeg',
    creativeName:'Certified Refurb',
    destination:searchUrl('certified refurbished'),
    routeTerms:['refurbished','laptop','tablet'],
    catalogueThemes:['technology','computing'],
    prominence:1,
    alt:'eBay Certified Refurbished creative',
    claimScope:'retailer-category-discovery'
  },
  tech:{
    key:'tech',
    title:'Tech',
    image:'https://i.ebayimg.com/images/g/4lAAAOSwhfNdl9Xn/s-l1600.jpg',
    imageType:'image/jpeg',
    creativeName:'Tech',
    destination:searchUrl('electronics'),
    routeTerms:['laptop','tablet','phone','television','headphone','earbud','printer','scanner','gaming','smart','camera','computer','monitor','router','ssd','usb-c'],
    catalogueThemes:['technology','electronics'],
    prominence:2,
    alt:'eBay Tech creative',
    claimScope:'retailer-category-discovery'
  },
  homeGarden:{
    key:'homeGarden',
    title:'Home & Garden',
    image:'https://i.ebayimg.com/images/g/l7MAAOSwFN9dl9Xn/s-l1600.jpg',
    imageType:'image/jpeg',
    creativeName:'Home & Garden',
    destination:searchUrl('home garden'),
    routeTerms:['coffee','microwave','bread','juicer','fridge','vacuum','air-fryer','kitchen','home','garden','pizza','pet'],
    catalogueThemes:['home','kitchen','garden'],
    prominence:3,
    alt:'eBay Home and Garden creative',
    claimScope:'retailer-category-discovery'
  },
  motors:{
    key:'motors',
    title:'Motors',
    image:'https://i.ebayimg.com/images/g/EmQAAOSwO0Vdl9Xn/s-l1600.jpg',
    imageType:'image/jpeg',
    creativeName:'Motors',
    destination:searchUrl('car accessories'),
    routeTerms:['car','vehicle','tyre','jump-starter','dash-cam','automotive'],
    catalogueThemes:['automotive'],
    prominence:4,
    alt:'eBay Motors creative',
    claimScope:'retailer-category-discovery'
  },
  sportingGoods:{
    key:'sportingGoods',
    title:'Sporting Goods',
    image:'https://i.ebayimg.com/images/g/Hl4AAOSwrD9dl9Xn/s-l1600.jpg',
    imageType:'image/jpeg',
    creativeName:'Sporting Goods',
    destination:searchUrl('sporting goods'),
    routeTerms:['fitness','sport','running','gym','camping','outdoor'],
    catalogueThemes:['sport','fitness','outdoors'],
    prominence:5,
    alt:'eBay Sporting Goods creative',
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
  VERSION:'121.1',CAMPAIGN_ID,MARKETPLACE_ROTATION_ID,SITE_ID,TOOL_ID,REVIEWED,SOURCE,SOURCE_URL,BASE,CREATIVES,searchUrl,all,forPath
};
