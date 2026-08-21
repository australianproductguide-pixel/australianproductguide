'use strict';

const downstream=require('./interaction-runtime-v55');
const socials=require('./social-profiles-v56');

const VERSION='56.4';
const CSS_VERSION='56.4';
const CSS_PATH='/assets/social-integration-v56.css';
const API_PATH='/api/social-profiles.json';
const ORIGIN='https://australianproductguide.au';

// Brand marks are kept recognisable and unembellished. Threads uses the current
// fill-based Threads mark; Pinterest uses the circular Pinterest badge rather
// than a hand-drawn approximation.
const icons={
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 21v-7.3h2.5l.4-3h-2.9V8.8c0-.9.3-1.5 1.6-1.5h1.5V4.6c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.2H8v3h2.5V21h3.2Z"/></svg>',
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.7" r="1.2" fill="currentColor" stroke="none"/></svg>',
  threads:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.2l3.7 5.1L17.3 4H20l-5.8 6.8L20.5 20h-4.2l-4-5.6L7.5 20H4.8l6.1-7.3L5 4Zm3 1.8 9.2 12.4h1.3L9.3 5.8H8Z"/></svg>',
  pinterest:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>',
  linkedin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5A2.5 2.5 0 1 1 5 8.5 2.5 2.5 0 0 1 5 3.5ZM3 10h4v11H3V10Zm6.5 0h3.8v1.5h.1c.5-1 1.9-2 3.9-2 4.2 0 4.9 2.7 4.9 6.3V21h-4v-4.6c0-2.2 0-3.7-2.3-3.7-2.3 0-2.6 1.8-2.6 3.6V21h-4V10Z"/></svg>'
};

function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function glyphClass(key){return `apg-social-v56-glyph is-${key}`;}
function linkHtml(item,compact=false){
  const label=`Australian Product Guide on ${item.platform}`;
  return `<a class="${compact?'apg-mobile-social-v56-link':'apg-social-v56-link'} is-${esc(item.key)}" href="${esc(item.url)}" target="_blank" rel="me noopener noreferrer" aria-label="${esc(label)}"><span class="${glyphClass(item.key)}" aria-hidden="true">${icons[item.key]||esc(item.platform.slice(0,2))}</span><span>${esc(item.platform)}</span></a>`;
}
function verifiedLinks(compact=false){return socials.verifiedEntries().map(item=>linkHtml(item,compact)).join('');}
function footerBlock(){return `<section class="apg-social-v56" aria-labelledby="apgSocialHeading"><h3 id="apgSocialHeading">Follow us on social</h3><p>Comparisons, buying tips and fresh product research — wherever you scroll.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div></section>`;}
function mobileBlock(){return `<section class="apg-mobile-social-v56" aria-labelledby="apgMobileSocialHeading"><strong id="apgMobileSocialHeading">Follow us on social</strong><span>Comparisons, buying tips &amp; APG updates</span><div class="apg-mobile-social-v56-list">${verifiedLinks(true)}</div></section>`;}
function aboutBlock(){return `<section class="apg-social-about-v56" id="follow-apg" aria-labelledby="apgAboutSocialHeading"><h2 id="apgAboutSocialHeading">Follow APG on social</h2><p>Follow along for useful comparisons, buying tips, product research and new Australian guides.</p><div class="apg-social-v56-list">${verifiedLinks(false)}</div></section>`;}
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
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${CSS_VERSION}"></head>`);
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

Object.assign(handler,downstream,{SOCIAL_VERSION:VERSION,SOCIAL_CSS_VERSION:CSS_VERSION,SOCIAL_API_PATH:API_PATH,CSS_PATH,socials,inject,injectEntity,patchOrganizationEntity,footerBlock,mobileBlock,aboutBlock,entityScript});
module.exports=handler;
