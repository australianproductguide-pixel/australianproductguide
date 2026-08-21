'use strict';

const downstream=require('./interaction-runtime-v55');
const socials=require('./social-profiles-v56');

const VERSION='56.0';
const CSS_PATH='/assets/social-integration-v56.css';
const API_PATH='/api/social-profiles.json';
const ORIGIN='https://australianproductguide.au';

const glyphs={instagram:'IG',threads:'@',x:'𝕏',pinterest:'P',linkedin:'in',facebook:'f'};

function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function glyphClass(key){return `apg-social-v56-glyph is-${key}`;}
function linkHtml(item,compact=false){
  const label=`Australian Product Guide on ${item.platform}`;
  return `<a class="${compact?'apg-mobile-social-v56-link':'apg-social-v56-link'}" href="${esc(item.url)}" target="_blank" rel="me noopener noreferrer" aria-label="${esc(label)}"><span class="${glyphClass(item.key)}" aria-hidden="true">${esc(glyphs[item.key]||item.platform.slice(0,2))}</span><span>${esc(item.platform)}</span></a>`;
}
function verifiedLinks(compact=false){return socials.verifiedEntries().map(item=>linkHtml(item,compact)).join('');}
function footerBlock(){return `<section class="apg-social-v56" aria-labelledby="apgSocialHeading"><h3 id="apgSocialHeading">Follow Australian Product Guide</h3><p>Official APG profiles for product guidance, platform updates and Australian shopping intelligence.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div><span class="apg-social-v56-note">Facebook is also active; its public Page URL is being independently verified before APG publishes an outbound link.</span></section>`;}
function mobileBlock(){return `<section class="apg-mobile-social-v56" aria-labelledby="apgMobileSocialHeading"><strong id="apgMobileSocialHeading">Follow Australian Product Guide</strong><span>Official APG profiles</span><div class="apg-mobile-social-v56-list">${verifiedLinks(true)}</div></section>`;}
function aboutBlock(){return `<section class="apg-social-about-v56" id="follow-apg" aria-labelledby="apgAboutSocialHeading"><h2 id="apgAboutSocialHeading">Follow Australian Product Guide</h2><p>APG uses its official channels for platform developments, buying guidance, product-comparison insights and Australian shopping intelligence. LinkedIn also supports APG's company identity, research authority and professional credibility.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div><p class="apg-social-v56-note">Facebook is active but its exact public Page URL remains verification-pending and is therefore not published here yet.</p></section>`;}
function entityScript(){
  const entity={
    '@context':'https://schema.org','@type':'Organization','@id':ORIGIN+'/#organization',
    name:'Australian Product Guide',url:ORIGIN+'/',sameAs:socials.sameAs()
  };
  return `<script type="application/ld+json" data-apg-social-entity-v56>${JSON.stringify(entity)}</script>`;
}
function inject(html,path){
  let out=String(html||'');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}">${entityScript()}</head>`);
  else if(!out.includes('data-apg-social-entity-v56'))out=out.replace('</head>',entityScript()+'</head>');
  if(!out.includes('class="apg-social-v56"'))out=out.replace('<div class="footer-v11-rulebar">',footerBlock()+'<div class="footer-v11-rulebar">');
  if(!out.includes('class="apg-mobile-social-v56"'))out=out.replace('</div></nav></header>',mobileBlock()+'</div></nav></header>');
  if(path==='/about/'&&!out.includes('class="apg-social-about-v56"')){
    out=out.replace('<aside class="related-policies">',aboutBlock()+'<aside class="related-policies">');
  }
  return out;
}
function sendJson(req,res){
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public, max-age=300, stale-while-revalidate=1800');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex');res.setHeader('X-APG-Social-Profiles','v'+VERSION);return res.end(req.method==='HEAD'?'':JSON.stringify(socials.publicPayload(),null,2));
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===API_PATH)return sendJson(req,res);
  res.setHeader('X-APG-Social-Profiles','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=inject(body,path);if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{SOCIAL_VERSION:VERSION,SOCIAL_API_PATH:API_PATH,CSS_PATH,socials,inject,footerBlock,mobileBlock,aboutBlock,entityScript});
module.exports=handler;
