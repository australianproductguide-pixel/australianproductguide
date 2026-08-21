'use strict';

const VERSION='56.2';
const VERIFIED_AT='2026-08-22';

const socialProfiles=Object.freeze({
  facebook:Object.freeze({platform:'Facebook',displayName:'Australian Product Guide',handle:null,url:'https://www.facebook.com/share/1CdD3Vdfrm/?mibextid=wwXIfr',active:true,verified:true,status:'active',purpose:'Consumer social presence, video and community distribution'}),
  instagram:Object.freeze({platform:'Instagram',displayName:'Australian Product Guide',handle:'@australianproductguide',url:'https://www.instagram.com/australianproductguide/',active:true,verified:true,status:'active',purpose:'Visual comparison carousels, Reels and consumer discovery'}),
  threads:Object.freeze({platform:'Threads',displayName:'Australian Product Guide',handle:'@australianproductguide',url:'https://www.threads.net/@australianproductguide',active:true,verified:true,status:'active',purpose:'Shopping conversations, quick comparisons and APG updates'}),
  x:Object.freeze({platform:'X',displayName:'Australian Product Guide',handle:'@AusProductGuide',url:'https://x.com/AusProductGuide',active:true,verified:true,status:'active',purpose:'Brand presence, platform updates and product-intelligence commentary'}),
  pinterest:Object.freeze({platform:'Pinterest',displayName:'Australian Product Guide',handle:'AustralianProductGuide',url:'https://www.pinterest.com/AustralianProductGuide/',active:true,verified:true,status:'active',purpose:'Evergreen visual shopping discovery and buying-guide distribution'}),
  linkedin:Object.freeze({platform:'LinkedIn',displayName:'Australian Product Guide',handle:'australian-product-guide',url:'https://www.linkedin.com/company/australian-product-guide/',active:true,verified:true,status:'active',purpose:'Company identity, research authority, partnerships and professional credibility'})
});

function entries(){return Object.entries(socialProfiles).map(([key,value])=>({key,...value}));}
function verifiedEntries(){return entries().filter(item=>item.active&&item.verified&&item.url);}
function sameAs(){return verifiedEntries().map(item=>item.url);}
function byPlatform(value){const q=String(value||'').toLowerCase().trim().replace(/^@/,'');return entries().find(item=>item.key===q||item.platform.toLowerCase()===q||String(item.handle||'').toLowerCase().replace(/^@/,'')===q)||null;}
function publicPayload(){return {version:VERSION,verifiedAt:VERIFIED_AT,profiles:entries().map(item=>({key:item.key,platform:item.platform,displayName:item.displayName,handle:item.handle,url:item.url,active:item.active,verified:item.verified,status:item.status,purpose:item.purpose}))};}

module.exports={VERSION,VERIFIED_AT,socialProfiles,entries,verifiedEntries,sameAs,byPlatform,publicPayload};
