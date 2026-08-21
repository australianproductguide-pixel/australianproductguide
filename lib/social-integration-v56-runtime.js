'use strict';

const downstream=require('./interaction-runtime-v55');
const socials=require('./social-profiles-v56');

const VERSION='56.2';
const CSS_PATH='/assets/social-integration-v56.css';
const API_PATH='/api/social-profiles.json';
const ORIGIN='https://australianproductguide.au';

const icons={
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-7.3h2.5l.4-3h-2.9V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.2H8v3h2.5V21h3.2Z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
  threads:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 2.8c-5.3 0-9 3.7-9 9.1 0 5.3 3.7 9.3 9.2 9.3 4.5 0 7.8-2.5 8.4-6.1.6-3.6-1.5-6.2-5.1-6.8-2.4-.4-4.5.4-5.8 2.1-1.5 2-.8 4.8 1.3 5.7 2.4 1 5.4-.4 5.9-3 .6-3.4-1.4-6.4-4.4-7.2-2.4-.6-4.8.1-6.4 1.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.2l3.7 5.1L17.3 4H20l-5.8 6.8L20.5 20h-4.2l-4-5.6L7.5 20H4.8l6.1-7.3L5 4Zm3 1.8 9.2 12.4h1.3L9.3 5.8H8Z"/></svg>',
  pinterest:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.1 3.1c-4.8 0-8.1 3.4-8.1 7.6 0 3 1.7 5.3 4.1 6.2-.1-.5-.1-1.4 0-2l1-4.4s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.7 1.5 1.7 0 1-.6 2.5-1 3.8-.3 1.1.6 2.1 1.7 2.1 2 0 3.4-2.1 3.4-5 0-2.6-1.9-4.5-4.6-4.5-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.4l-.3 1.1c-.1.4-.4.5-.7.3-1.5-.7-2.4-2.7-2.4-4.3 0-3.5 2.6-6.8 7.4-6.8 3.9 0 6.9 2.8 6.9 6.5 0 3.9-2.5 7-5.9 7-1.1 0-2.2-.6-2.6-1.3l-.7 2.7c-.3 1-1 2.2-1.4 3 .9.3 2 .4 3 .4 4.9 0 8.2-3.5 8.2-8.1 0-4.4-3.7-8-8.2-8Z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5A2.5 2.5 0 1 1 5 8.5 2.5 2.5 0 0 1 5 3.5ZM3 10h4v11H3V10Zm6.5 0h3.8v1.5h.1c.5-1 1.9-2 3.9-2 4.2 0 4.9 2.7 4.9 6.3V21h-4v-4.6c0-2.2 0-3.7-2.3-3.7-2.3 0-2.6 1.8-2.6 3.6V21h-4V10Z"/></svg>'
};

function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function glyphClass(key){return `apg-social-v56-glyph is-${key}`;}
function linkHtml(item,compact=false){
  const label=`Australian Product Guide on ${item.platform}`;
  return `<a class="${compact?'apg-mobile-social-v56-link':'apg-social-v56-link'} is-${esc(item.key)}" href="${esc(item.url)}" target="_blank" rel="me noopener noreferrer" aria-label="${esc(label)}"><span class="${glyphClass(item.key)}" aria-hidden="true">${icons[item.key]||esc(item.platform.slice(0,2))}</span><span>${esc(item.platform)}</span></a>`;
}
function verifiedLinks(compact=false){return socials.verifiedEntries().map(item=>linkHtml(item,compact)).join('');}
function footerBlock(){return `<section class="apg-social-v56" aria-labelledby="apgSocialHeading"><h3 id="apgSocialHeading">Follow Australian Product Guide</h3><p>Official APG profiles for product guidance, platform updates and Australian shopping intelligence.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div></section>`;}
function mobileBlock(){return `<section class="apg-mobile-social-v56" aria-labelledby="apgMobileSocialHeading"><strong id="apgMobileSocialHeading">Follow Australian Product Guide</strong><span>Official APG profiles</span><div class="apg-mobile-social-v56-list">${verifiedLinks(true)}</div></section>`;}
function aboutBlock(){return `<section class="apg-social-about-v56" id="follow-apg" aria-labelledby="apgAboutSocialHeading"><h2 id="apgAboutSocialHeading">Follow Australian Product Guide</h2><p>APG uses its official channels for platform developments, buying guidance, product-comparison insights and Australian shopping intelligence. LinkedIn also supports APG's company identity, research authority and professional credibility.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div></section>`;}
function entityScript(){
  const entity={'@context':'https://schema.org','@type':'Organization','@id':ORIGIN+'/#organization',name:'Australian Product Guide',url:ORIGIN+'/',sameAs:socials.sameAs()};
  return `<script type="application/ld+json" data-apg-social-entity-v56>${JSON.stringify(entity)}</script>`;
}
function hasOrganizationType(value){
  const type=value&&value['@type'];
  return type==='Organization'||(Array.isArray(type)&&type.includes('Organization'));
}
function patchOrganizationEntity(html){
  let patched=false;
  const sameAs=socials.sameAs();
  const out=String(html||'').replace(/<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(whole,attrs,raw)=>{
    if(patched)return whole;
    let data;try{data=JSON.parse(raw);}catch{return whole;}
    let target=null;
    if(data&&typeof data==='object'&&!Array.isArray(data)&&hasOrganizationType(data))target=data;
    else if(data&&typeof data==='object'&&Array.isArray(data['@graph']))target=data['@graph'].find(node=>node&&typeof node==='object'&&hasOrganizationType(node))||null;
    if(!target)return whole;
    const id=String(target['@id']||'');
    const name=String(target.name||'');
    if(id&&id!==ORIGIN+'/#organization'&&name!=='Australian Product Guide')return whole;
    if(!id&&name!=='Australian Product Guide')return whole;
    target.sameAs=sameAs;
    patched=true;
    const marked=/data-apg-social-entity-v56/i.test(attrs)?attrs:`${attrs} data-apg-social-entity-v56`;
    return `<script${marked}>${JSON.stringify(data)}</script>`;
  });
  return {html:out,patched};
}
function injectEntity(html){
  if(String(html||'').includes('data-apg-social-entity-v56'))return String(html||'');
  const result=patchOrganizationEntity(html);
  if(result.patched)return result.html;
  return result.html.includes('</head>')?result.html.replace('</head>',entityScript()+'</head>'):entityScript()+result.html;
}
function inject(html,path){
  let out=String(html||'');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  out=injectEntity(out);
  if(!out.includes('class="apg-social-v56"'))out=out.replace('<div class="footer-v11-rulebar">',footerBlock()+'<div class="footer-v11-rulebar">');
  if(!out.includes('class="apg-mobile-social-v56"'))out=out.replace('</div></nav></header>',mobileBlock()+'</div></nav></header>');
  if(path==='/about/'&&!out.includes('class="apg-social-about-v56"'))out=out.replace('<aside class="related-policies">',aboutBlock()+'<aside class="related-policies">');
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

Object.assign(handler,downstream,{SOCIAL_VERSION:VERSION,SOCIAL_API_PATH:API_PATH,CSS_PATH,socials,inject,injectEntity,patchOrganizationEntity,footerBlock,mobileBlock,aboutBlock,entityScript});
module.exports=handler;
