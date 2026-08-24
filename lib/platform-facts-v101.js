'use strict';

const content=require('./content');
const routes=require('./routes');
const socials=require('./social-profiles-v56');
const {products,categories}=require('../data');

const VERSION='101.0';
const CORE_PAGES=Object.freeze([
  {key:'home',label:'Australian Product Guide home',url:'/',aliases:['home','homepage']},
  {key:'categories',label:'Browse categories',url:'/categories/',aliases:['categories','browse products']},
  {key:'search',label:'Search APG',url:'/search/',aliases:['search','product search']},
  {key:'compare',label:'Compare products',url:'/compare/',aliases:['compare','comparison']},
  {key:'decision_lab',label:'Decision Lab',url:'/decision-lab/',aliases:['decision lab','structured recommendation']},
  {key:'my_apg',label:'My APG',url:'/my-apg/',aliases:['my apg','saved products','account']},
  {key:'guides',label:'Buying guides',url:'/guides/',aliases:['guides','buying guides']},
  {key:'brands',label:'Brands',url:'/brands/',aliases:['brands']},
  {key:'retailers',label:'Retailer approach',url:'/retailers/',aliases:['retailers','stores']},
  {key:'deals',label:'Shopping discovery',url:'/deals/',aliases:['deals','shopping discovery']}
]);
const TRUST_LABELS=Object.freeze({about:'About Australian Product Guide',contact:'Contact APG',methodology:'Methodology','editorial-standards':'Editorial standards',sources:'Sources','corrections-policy':'Corrections policy','affiliate-disclosure':'Affiliate disclosure',privacy:'Privacy policy',terms:'Terms of use',coverage:'Coverage',updates:'Updates'});
const TRUST_ALIASES=Object.freeze({about:['about','what is apg'],contact:['contact'],methodology:['methodology','how recommendations work','how you compare'],sources:['sources','evidence','provenance'],'corrections-policy':['corrections','report a correction'],'affiliate-disclosure':['affiliate','commission','how do you make money'],privacy:['privacy','personal information','data'],terms:['terms'],coverage:['coverage','what do you cover'],updates:['updates','recent changes'],'editorial-standards':['editorial standards','independence']});

function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function strip(html){return String(html||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();}
function firstSentences(text,count=2){const parts=String(text||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[];return parts.map(x=>x.trim()).filter(Boolean).slice(0,count).join(' ');}
function section(pageKey,id){const page=content[pageKey];if(!page)return '';const body=String(page.body||'');const re=new RegExp(`<h2 id="${id}">[\\s\\S]*?<\\/h2>([\\s\\S]*?)(?=<h2|<aside|$)`,'i');const m=body.match(re);return firstSentences(strip(m?m[1]:''),3);}
function lead(pageKey){const page=content[pageKey];if(!page)return '';const m=String(page.body||'').match(/<p class="policy-lead">([\s\S]*?)<\/p>/i);return firstSentences(strip(m?m[1]:page.description||''),3);}
function pageRegistry(){
  const trust=routes.trust.map(key=>({key,label:TRUST_LABELS[key]||key,url:`/${key}/`,aliases:TRUST_ALIASES[key]||[key]}));
  return [...CORE_PAGES,...trust];
}
function routeAllowed(url){try{const u=new URL(url,'https://australianproductguide.au');return u.origin==='https://australianproductguide.au'&&[...routes.indexableRoutes,...routes.noindexRoutes].includes(u.pathname);}catch{return false;}}
function findSitePage(text){const q=norm(text);let best=null;for(const p of pageRegistry()){const score=(p.aliases||[]).reduce((n,a)=>q.includes(norm(a))?Math.max(n,norm(a).length):n,0);if(score&&(!best||score>best.score))best={...p,score};}return best&&routeAllowed(best.url)?{key:best.key,label:best.label,url:best.url}:null;}
function platformFact(key){
  if(key==='about')return {source:'/about/',text:lead('about')};
  if(key==='methodology')return {source:'/methodology/',text:lead('methodology')};
  if(key==='testing')return {source:'/methodology/#testing',text:section('methodology','testing')};
  if(key==='affiliate')return {source:'/affiliate-disclosure/',text:lead('affiliate-disclosure')};
  if(key==='privacy')return {source:'/privacy/',text:lead('privacy')};
  if(key==='accounts')return {source:'/about/#accounts',text:section('about','accounts')};
  if(key==='coverage')return {source:'/coverage/',text:lead('coverage')};
  return null;
}
function accountCapabilities(){return Object.freeze({optional:true,browseWithoutAccount:true,saveCanonicalProducts:true,syncWhenSignedIn:true,authenticatedAccessServerAuthorised:true,displayNameOptional:true});}
function publicSnapshot(){return {version:VERSION,catalogue:{products:products.length,categories:Object.keys(categories).length},pages:pageRegistry().map(({key,label,url})=>({key,label,url})),socials:socials.publicPayload(),account:accountCapabilities(),reviewDate:content.__reviewDate||null};}

module.exports={VERSION,pageRegistry,findSitePage,routeAllowed,platformFact,accountCapabilities,publicSnapshot,socials,content};