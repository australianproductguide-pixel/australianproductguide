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

function record(key,{title,description,destinationUrl,destinationType='amazon-list',status='CURRENT',lifecycle='PERMANENT',active=true,seasonal=false,expiresAt=null,consumerNote='',verificationBasis=''}){
  return Object.freeze({
    key,title,description,
    destination_url:destinationUrl,
    affiliate_url:active?buildAmazonAuAffiliateUrl(destinationUrl):null,
    destination_type:destinationType,
    status,lifecycle,active,seasonal,
    expires_at:expiresAt,
    verified_at:VERIFIED_AT,
    verification_basis:verificationBasis,
    disclosure:'Paid Amazon Australia link. APG may earn from qualifying purchases.',
    consumer_note:consumerNote,
    recommendation_weight:0
  });
}

const destinations=Object.freeze({
  todayDeals:record('todayDeals',{
    title:"Today's Deals",
    description:'Browse Amazon Australia’s deals destination. Prices, eligibility and expiry are controlled by Amazon and can change quickly.',
    destinationUrl:'https://www.amazon.com.au/deals',
    destinationType:'amazon-deals',
    verificationBasis:'Amazon Australia currently exposes Today’s Deals throughout its shopping filters and merchandising surfaces.',
    consumerNote:'Deal status is Amazon merchandising, not an APG recommendation.'
  }),
  bestSellers:record('bestSellers',{
    title:'Best Sellers',
    description:'See products presented through Amazon Australia’s Best Sellers destination, then compare suitability on APG.',
    destinationUrl:'https://www.amazon.com.au/gp/bestsellers',
    destinationType:'amazon-list',
    verificationBasis:'Amazon Australia Best Sellers pages are currently indexed and live across departments.',
    consumerNote:'Popular does not mean best for your situation.'
  }),
  under25:record('under25',{
    title:'Under $25',
    description:'Browse an Amazon Australia search route using the marketplace price filter for items up to $25. Availability, delivery and promotions can vary.',
    destinationUrl:'https://www.amazon.com.au/s?rh=p_36%3A-2500',
    destinationType:'amazon-search',
    verificationBasis:'Amazon Australia currently exposes price-band filtering, including an Up to $25 band on category pages.',
    consumerNote:'This is a price-filtered shopping route, not a claim that every item is discounted.'
  }),
  subscribeSave:record('subscribeSave',{
    title:'Subscribe & Save discovery',
    description:'Search Amazon Australia for Subscribe & Save and check the product page for current eligibility, delivery settings and any applicable saving.',
    destinationUrl:'https://www.amazon.com.au/s?k=subscribe+and+save',
    destinationType:'amazon-search',
    verificationBasis:'Amazon Australia currently displays Subscribe & Save eligibility and pricing on eligible product/search surfaces.',
    consumerNote:'APG does not state a fixed saving because eligibility and terms can vary by product.'
  }),
  everydayEssentials:record('everydayEssentials',{
    title:'Everyday essentials',
    description:'Search Amazon Australia for household and repeat-purchase essentials without APG implying a particular deal or saving.',
    destinationUrl:'https://www.amazon.com.au/s?k=everyday+essentials',
    destinationType:'amazon-search',
    verificationBasis:'Search-led route; no volatile promotion claim is made.'
  }),
  globalStore:record('globalStore',{
    title:'Amazon Global Store discovery',
    description:'Search Amazon Australia for Global Store products, then check the listing for international-product, delivery, returns and warranty information.',
    destinationUrl:'https://www.amazon.com.au/s?k=Amazon+Global+Store',
    destinationType:'amazon-search',
    verificationBasis:'Amazon Australia currently exposes Amazon Global Store filtering and international-product notices.',
    consumerNote:'International product, warranty, delivery and return considerations may differ.'
  }),
  newReleases:record('newReleases',{
    title:'New Releases',
    description:'Explore Amazon Australia’s New Releases destination. Newness is a discovery signal, not a quality or suitability score.',
    destinationUrl:'https://www.amazon.com.au/gp/new-releases',
    destinationType:'amazon-list',
    verificationBasis:'Amazon Australia New Releases pages are currently indexed across departments.'
  })
});

const watchlist=Object.freeze({
  amazonHaul:Object.freeze({key:'amazonHaul',title:'Amazon Haul',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'The current Amazon AU merchandising experience is evidenced by the supplied screenshots, but APG has not verified a stable general-purpose browser destination suitable for a durable Associates link.'}),
  vouchers:Object.freeze({key:'vouchers',title:'Vouchers & promotions',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'Promotions are volatile and APG has not verified an evergreen Amazon AU destination that can be safely kept live.'}),
  resale:Object.freeze({key:'resale',title:'Resale / open-box promotions',status:'UNVERIFIED',lifecycle:'TEMPORARY',active:false,verified_at:VERIFIED_AT,reason:'A current promotional treatment is visible in the supplied Amazon AU screenshots, but its campaign destination and expiry controls are not verified for permanent APG navigation.'}),
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
    affiliate_url:amazonSearch({keywords:term}),
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
  for(const slug of Object.keys(categoryTerms)){
    const item=categorySearch(slug),u=new URL(item.affiliate_url);
    if(u.hostname!==AMAZON_HOST||u.searchParams.get('tag')!==TAG)throw new Error(`Invalid category Amazon link: ${slug}`);
    if(item.recommendation_weight!==0)throw new Error(`Category commercial weighting must be zero: ${slug}`);
  }
  return true;
}
assertRegistry();

module.exports={TAG,VERIFIED_AT,AMAZON_HOST,destinations,watchlist,categoryTerms,buildAmazonAuAffiliateUrl,amazonSearch,categorySearch,activeDestinations,assertRegistry};
