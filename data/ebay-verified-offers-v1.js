'use strict';

// APG eBay verified-offer pilot v1.
// Presentation-only allowlist for the explicitly approved five-product Production pilot.
// Data comes from the APG eBay AU Buy Browse API enrichment evaluator after detail verification.
// These retailer records contribute zero recommendation points and must never alter eligibility,
// suitability, ranking, canonical product identity or Product.image structured data.

const VERSION='1.0';
const MARKETPLACE='EBAY_AU';
const SOURCE='eBay Buy Browse API';

const offers={
  'breville-barista-express-impress-bes876':{
    slug:'breville-barista-express-impress-bes876',
    productName:'Breville Barista Express Impress BES876',
    status:'verified',
    detailVerified:true,
    exactModel:true,
    verificationLevel:'detail-model-evidence',
    itemId:'v1|155056210057|0',
    legacyItemId:'155056210057',
    title:'Breville the Barista Express Impress Stainless Steel BES876BSS',
    condition:'Brand New',
    price:'798.00',
    currency:'AUD',
    image:'https://i.ebayimg.com/images/g/US4AAeSwXeFqiOk6/s-l1600.jpg',
    url:'https://www.ebay.com.au/itm/155056210057?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339198634&customid=apg%253Abreville-barista-express-impress-bes876%253Averify&toolid=10050',
    itemWebUrl:'https://www.ebay.com.au/itm/155056210057',
    marketplaceId:MARKETPLACE,
    source:SOURCE,
    observedAt:'2026-08-30T20:35:15.800Z',
    recommendationWeight:0
  },
  'sunbeam-barista-max-em5300s':{
    slug:'sunbeam-barista-max-em5300s',
    productName:'Sunbeam Barista Max EM5300S',
    status:'verified',
    detailVerified:true,
    exactModel:true,
    verificationLevel:'detail-model-evidence',
    itemId:'v1|275445678490|0',
    legacyItemId:'275445678490',
    title:'Sunbeam Barista Max Espresso Coffee Machine Silver EM5300S',
    condition:'Brand New',
    price:'532.00',
    currency:'AUD',
    image:'https://i.ebayimg.com/images/g/36cAAeSwIf9qlHwm/s-l1600.jpg',
    url:'https://www.ebay.com.au/itm/275445678490?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339198634&customid=apg%253Asunbeam-barista-max-em5300s%253Averify&toolid=10050',
    itemWebUrl:'https://www.ebay.com.au/itm/275445678490',
    marketplaceId:MARKETPLACE,
    source:SOURCE,
    observedAt:'2026-08-30T20:35:21.040Z',
    recommendationWeight:0
  },
  'tp-link-tapo-c500':{
    slug:'tp-link-tapo-c500',
    productName:'TP-Link Tapo C500',
    status:'verified',
    detailVerified:true,
    exactModel:true,
    verificationLevel:'detail-model-evidence',
    itemId:'v1|166283966287|0',
    legacyItemId:'166283966287',
    title:'tp-link Tapo Outdoor Pan/Tilt Security Wi-Fi Camera TAPO-C500',
    condition:'Brand New',
    price:'74.00',
    currency:'AUD',
    image:'https://i.ebayimg.com/images/g/GyIAAeSwJm1qhkbq/s-l1600.jpg',
    url:'https://www.ebay.com.au/itm/166283966287?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339198634&customid=apg%253Atp-link-tapo-c500%253Averify&toolid=10050',
    itemWebUrl:'https://www.ebay.com.au/itm/166283966287',
    marketplaceId:MARKETPLACE,
    source:SOURCE,
    observedAt:'2026-08-30T20:35:26.113Z',
    recommendationWeight:0
  },
  'tp-link-deco-be65':{
    slug:'tp-link-deco-be65',
    productName:'TP-Link Deco BE65',
    status:'verified',
    detailVerified:true,
    exactModel:true,
    verificationLevel:'detail-model-evidence',
    itemId:'v1|297432385126|0',
    legacyItemId:'297432385126',
    title:'TP-Link Deco BE65 3 Pack BE11000 Whole Home Mesh WiFi 7 System Tri-Band 2.5G',
    condition:'Brand New',
    price:'898.90',
    currency:'AUD',
    image:'https://i.ebayimg.com/images/g/I7AAAOSw6~Rlo02y/s-l1600.jpg',
    url:'https://www.ebay.com.au/itm/297432385126?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339198634&customid=apg%253Atp-link-deco-be65%253Averify&toolid=10050',
    itemWebUrl:'https://www.ebay.com.au/itm/297432385126',
    marketplaceId:MARKETPLACE,
    source:SOURCE,
    observedAt:'2026-08-30T20:35:30.490Z',
    recommendationWeight:0
  },
  'asus-proart-display-pa279crv':{
    slug:'asus-proart-display-pa279crv',
    productName:'ASUS ProArt Display PA279CRV',
    status:'verified',
    detailVerified:true,
    exactModel:true,
    verificationLevel:'detail-model-evidence',
    itemId:'v1|177136061096|0',
    legacyItemId:'177136061096',
    title:'ASUS ProArt PA279CRV 27" 4K UHD Professional IPS Monitor',
    condition:'Brand New',
    price:'848.00',
    currency:'AUD',
    image:'https://i.ebayimg.com/images/g/aPQAAeSwh3NqkRWu/s-l1600.jpg',
    url:'https://www.ebay.com.au/itm/177136061096?mkevt=1&mkcid=1&mkrid=705-53470-19255-0&campid=5339198634&customid=apg%253Aasus-proart-display-pa279crv%253Averify&toolid=10050&amdata=enc%3AAQALAAAAoCHNgUiiE%2FjQhlDTaMiAde82YogBm4EUUOOnamyTK4loGm%2BUqLd4g2xFPWpc%2B7TC6P%2FA4s4%2BP2rb0cckp18dI0DwXZI4HlSzV%2FkwMikUpIbBbte8GOeAoLXbzx6A9avzQ4JmzF05gjj%2Bl6NGIKeh9U%2F4ilWdWy7px5CrFS7M2IpmI5CTQ%2FLhNw%2B5I1zi%2FUAY1xmwwWShuWwbA62OGcyPeeU%3D',
    itemWebUrl:'https://www.ebay.com.au/itm/177136061096',
    marketplaceId:MARKETPLACE,
    source:SOURCE,
    observedAt:'2026-08-30T20:35:34.841Z',
    recommendationWeight:0
  }
};

function complete(row){
  if(!row||row.status!=='verified'||row.detailVerified!==true||row.exactModel!==true)return false;
  if(row.marketplaceId!==MARKETPLACE||row.source!==SOURCE||row.recommendationWeight!==0)return false;
  if(!row.slug||!row.productName||!row.itemId||!row.legacyItemId||!row.title||!row.condition||!row.price||row.currency!=='AUD'||!row.image||!row.url||!row.observedAt)return false;
  if(!/^https:\/\/www\.ebay\.com\.au\/itm\//i.test(row.url))return false;
  if(!/^https:\/\/i\.ebayimg\.com\//i.test(row.image))return false;
  return true;
}

function forSlug(slug){
  const row=offers[String(slug||'')]||null;
  return complete(row)?row:null;
}

module.exports={VERSION,MARKETPLACE,SOURCE,offers,complete,forSlug};
