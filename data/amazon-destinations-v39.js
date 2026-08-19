'use strict';

const TAG='auproductguid-22';
const VERIFIED_AT='2026-08-19';
const AMAZON_HOST='www.amazon.com.au';

function buildAmazonAuAffiliateUrl(destination){
  const u=destination instanceof URL?new URL(destination.toString()):new URL(String(destination));
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  if(u.protocol!=='https:'||host!=='amazon.com.au')throw new Error('Amazon Australia affiliate destinations must use https://www.amazon.com.au');
  u.hostname=AMAZON_HOST;
  u.searchParams.set('tag',TAG);
  return u.toString();
}

function amazonSearch({keywords='',refinements=''}){
  const u=new URL(`https://${AMAZON_HOST}/s`);
  if(keywords)u.searchParams.set('k',keywords);
  if(refinements)u.searchParams.set('rh',refinements);
  return buildAmazonAuAffiliateUrl(u);
}

function record(key,{title,description,destinationUrl,destinationType='amazon-list',status='CURRENT',lifecycle='PERMANENT',active=true,seasonal=false,expiresAt=null,consumerNote=''}){
  return Object.freeze({
    key,title,description,
    destination_url:destinationUrl,
    affiliate_url:active?buildAmazonAuAffiliateUrl(destinationUrl):null,
    destination_type:destinationType,
    status,lifecycle,active,seasonal,
    expires_at:expiresAt,
    verified_at:VERIFIED_AT,
    disclosure:'Paid Amazon Australia link. APG may earn from qualifying purchases.',
    consumer_note:consumerNote,
    recommendation_weight:0
  });
}

const destinations=Object.freeze({
  todayDeals:record('todayDeals',{
    title:"Today's Deals",
    description:'Browse Amazon Australia’s current deals destination. Prices, eligibility and expiry are controlled by Amazon and can change quickly.',
    destinationUrl:'https://www.amazon.com.au/deals',
    destinationType:'amazon-deals',
    consumerNote:'Deal status is Amazon merchandising, not an APG recommendation.'
  }),
  bestSellers:record('bestSellers',{
    title:'Best Sellers',
    description:'See products currently presented through Amazon Australia’s Best Sellers destination, then compare suitability on APG.',
    destinationUrl:'https://www.amazon.com.au/gp/bestsellers',
    destinationType:'amazon-list',
    consumerNote:'Popular does not mean best for your situation.'
  }),
  under25:record('under25',{
    title:'Under $25',
    description:'Browse Amazon Australia search results filtered to a maximum item price of $25. Availability, delivery and promotions can vary.',
    destinationUrl:'https://www.amazon.com.au/s?rh=p_36%3A-2500',
    destinationType:'amazon-search',
    consumerNote:'This is a price-filtered shopping route, not a claim that every item is discounted.'
  }),
  subscribeSave:record('subscribeSave',{
    title:'Subscribe & Save eligible',
    description:'Explore Amazon Australia search results filtered to products marked as Subscribe & Save eligible.',
    destinationUrl:'https://www.amazon.com.au/s?rh=p_n_is_sns_available%3A2617006011',
    destinationType:'amazon-search',
    consumerNote:'Eligibility and any saving depend on the product and Amazon’s current programme terms.'
  }),
  everydayEssentials:record('everydayEssentials',{
    title:'Everyday essentials',
    description:'Search Amazon Australia for household and repeat-purchase essentials without APG implying a particular deal or saving.',
    destinationUrl:'https://www.amazon.com.au/s?k=everyday+essentials',
    destinationType:'amazon-search'
  }),
  globalStore:record('globalStore',{
    title:'Amazon Global Store',
    description:'Browse Amazon Australia search results filtered to Amazon Global Store items where currently available.',
    destinationUrl:'https://www.amazon.com.au/s?rh=p_n_is-global-store-asin%3A16354393011',
    destinationType:'amazon-search',
    consumerNote:'International product, warranty, delivery and return considerations may differ.'
  }),
  newReleases:record('newReleases',{
    title:'New Releases',
    description:'Explore Amazon Australia’s New Releases destination. Newness is a discovery signal, not a quality or suitability score.',
    destinationUrl:'https://www.amazon.com.au/gp/new-releases',
    destinationType:'amazon-list'
  })
});

const watchlist=Object.freeze({
  amazonHaul:Object.freeze({key:'amazonHaul',title:'Amazon Haul',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'The current Amazon AU merchandising experience is evidenced, but APG has not verified a stable general-purpose browser destination suitable for a durable Associates link.'}),
  vouchers:Object.freeze({key:'vouchers',title:'Vouchers & promotions',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'Promotions are volatile and APG has not verified an evergreen Amazon AU destination that can be safely kept live.'}),
  resale:Object.freeze({key:'resale',title:'Resale / open-box promotions',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'A current promotional treatment was observed, but the campaign-specific destination and expiry controls were not verified for durable APG navigation.'}),
  prime:Object.freeze({key:'prime',title:'Prime membership',status:'NOT SUITABLE',lifecycle:'PERMANENT',active:false,verified_at:VERIFIED_AT,reason:'APG does not assume Prime membership or trial referrals qualify for commission and does not use them as conversion CTAs without explicit programme support.'})
});

const categoryTerms=Object.freeze({
  'wireless-headphones':'wireless headphones',
  earbuds:'earbuds',
  'coffee-machines':'coffee machines',
  'robot-vacuums':'robot vacuums',
  'air-fryers':'air fryers',
  laptops:'laptops',
  tablets:'tablets',
  'computer-monitors':'computer monitors',
  'gaming-monitors':'gaming monitors',
  'gaming-headsets':'gaming headsets',
  'mechanical-keyboards':'mechanical keyboards',
  'computer-mice':'computer mice',
  soundbars:'soundbars',
  projectors:'projectors',
  'smartwatches':'smartwatches',
  'fitness-trackers':'fitness trackers',
  'home-security-cameras':'home security cameras',
  'smart-doorbells':'smart doorbells',
  'air-purifiers':'air purifiers',
  blenders:'blenders',
  'stick-vacuums':'stick vacuums',
  'portable-air-conditioners':'portable air conditioners',
  'office-chairs':'office chairs',
  'standing-desks':'standing desks',
  webcams:'webcams',
  luggage:'luggage',
  'portable-power-stations':'portable power stations',
  'home-fitness-equipment':'home fitness equipment'
});

function categorySearch(slug){
  const term=categoryTerms[String(slug||'')];
  if(!term)return null;
  return {
    key:`category-${slug}`,
    title:`${term.replace(/\b\w/g,c=>c.toUpperCase())} on Amazon Australia`,
    affiliate_url:amazonSearch({keywords:`${term} deals`}),
    destination_type:'amazon-search',
    active:true,
    verified_at:VERIFIED_AT,
    recommendation_weight:0
  };
}

function activeDestinations(at=new Date()){
  const now=at instanceof Date?at:new Date(at);
  return Object.values(destinations).filter(x=>{
    if(!x.active)return false;
    if(!x.expires_at)return true;
    return Number.isFinite(now.getTime())&&now<=new Date(x.expires_at);
  });
}

function assertRegistry(){
  for(const item of activeDestinations()){
    if(!item.affiliate_url.includes(`tag=${TAG}`))throw new Error(`Missing Amazon Associates tag: ${item.key}`);
    const u=new URL(item.affiliate_url);
    if(u.hostname!==AMAZON_HOST)throw new Error(`Wrong Amazon marketplace: ${item.key}`);
    if(u.searchParams.getAll('tag').length!==1)throw new Error(`Duplicate Amazon tag: ${item.key}`);
    if(item.recommendation_weight!==0)throw new Error(`Commercial weighting must be zero: ${item.key}`);
  }
  return true;
}
assertRegistry();

module.exports={TAG,VERIFIED_AT,AMAZON_HOST,destinations,watchlist,categoryTerms,buildAmazonAuAffiliateUrl,amazonSearch,categorySearch,activeDestinations,assertRegistry};
