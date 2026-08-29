'use strict';

// APG official eBay Creative Gallery registry v121.1.
// Owner-supplied official eBay Creative Gallery assets are a retailer-discovery visual layer only.
// They are not APG product evidence, not editorial product imagery and never affect ranking.
const CAMPAIGN_ID='5339198634';
const MARKETPLACE_ROTATION_ID='705-53470-19255-0';
const SITE_ID='15';
const TOOL_ID='20014';
const REVIEWED='2026-08-29';
const SOURCE='Owner-supplied official eBay Creative Gallery packs';
const BASE='/assets/ebay/official/v121/';
function searchUrl(term){return `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(term)}&mkcid=1&mkrid=${MARKETPLACE_ROTATION_ID}&siteid=${SITE_ID}&campid=${CAMPAIGN_ID}&toolid=${TOOL_ID}&customid=&mkevt=1`;}
const CREATIVES={
  certifiedRefurbished:{key:'certifiedRefurbished',title:'Certified Refurbished',image:`${BASE}ebay-certified-refurbished-700x400.webp`,imageType:'image/webp',width:700,height:400,destination:searchUrl('certified refurbished'),routeSlugs:['laptops','tablets','smartphones'],prominence:1,alt:'Official eBay Certified Refurbished creative',claimScope:'retailer-category-discovery'},
  tech:{key:'tech',title:'Tech',image:`${BASE}ebay-tech-700x400.webp`,imageType:'image/webp',width:700,height:400,destination:searchUrl('electronics'),routeSlugs:['action-cameras','bluetooth-speakers','bluetooth-trackers','computer-mice','computer-monitors','document-scanners','e-readers','earbuds','external-ssds','gaming-controllers','gaming-headsets','gaming-monitors','home-printers','home-security-cameras','instant-cameras','laptops','mechanical-keyboards','mesh-wifi-systems','microphones','photo-printers','portable-monitors','power-banks','projectors','smart-displays','smart-doorbells','smart-light-bulbs','smart-plugs','smartphones','smartwatches','soundbars','streaming-devices','tablets','televisions','usb-c-chargers','usb-c-hubs-docks','webcams','wifi-routers','wireless-chargers','wireless-headphones'],prominence:2,alt:'Official eBay Tech creative',claimScope:'retailer-category-discovery'},
  homeGarden:{key:'homeGarden',title:'Home & Garden',image:`${BASE}ebay-home-garden-700x400.webp`,imageType:'image/webp',width:700,height:400,destination:searchUrl('home garden'),routeSlugs:['air-fryers','air-purifiers','automatic-litter-boxes','automatic-pet-feeders','blenders','bread-makers','coffee-grinders','coffee-machines','dehumidifiers','dishwashers','electric-kettles','food-processors','fridges','ice-cream-makers','juicers','kitchen-mixers','microwave-ovens','multicookers','pet-water-fountains','pizza-ovens','portable-air-conditioners','rice-cookers','robot-vacuums','slow-cookers','stick-vacuums','toasters','vacuum-sealers','washing-machines','water-filters'],prominence:3,alt:'Official eBay Home and Garden creative',claimScope:'retailer-category-discovery'},
  motors:{key:'motors',title:'Motors',image:`${BASE}ebay-motors-700x400.webp`,imageType:'image/webp',width:700,height:400,destination:searchUrl('car accessories'),routeSlugs:['car-jump-starters','dash-cameras','tyre-inflators'],prominence:4,alt:'Official eBay Motors creative',claimScope:'retailer-category-discovery'},
  sportingGoods:{key:'sportingGoods',title:'Sporting Goods',image:`${BASE}ebay-sporting-goods-700x400.webp`,imageType:'image/webp',width:700,height:400,destination:searchUrl('sporting goods'),routeSlugs:['home-fitness-equipment','massage-guns'],prominence:5,alt:'Official eBay Sporting Goods creative',claimScope:'retailer-category-discovery'}
};
const PRIMARY_KEYS=['certifiedRefurbished','tech','homeGarden','motors','sportingGoods'];
function all(){return PRIMARY_KEYS.map(key=>CREATIVES[key]);}
function routeSlug(path){const value=String(path||'').toLowerCase();let match=value.match(/^\/categories\/([^/]+)\/?$/);if(match)return match[1];match=value.match(/^\/categories\/([^/]+)\/finder\/?$/);if(match)return match[1];match=value.match(/^\/guides\/([^/]+)-buying-guide\/?$/);return match?match[1]:null;}
function forPath(path){const value=String(path||'').toLowerCase();if(value==='/'||value==='/deals/')return all();if(/^\/products\//.test(value))return [];const slug=routeSlug(value);if(!slug)return [];return all().filter(row=>row.routeSlugs.includes(slug));}
module.exports={VERSION:'121.1',CAMPAIGN_ID,MARKETPLACE_ROTATION_ID,SITE_ID,TOOL_ID,REVIEWED,SOURCE,BASE,CREATIVES,PRIMARY_KEYS,searchUrl,all,routeSlug,forPath};
