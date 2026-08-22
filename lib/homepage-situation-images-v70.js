'use strict';

// APG Homepage Situation Images v70.
// Reuses the governed category editorial imagery already used by the category directory.
// The existing homepage situation cards, icons, labels, copy, filters and links remain
// authoritative; this layer changes only the visual backdrop of each card's upper panel.
const downstream=require('./related-decisions-ui-v69');
const categoryImages=require('../data/category-editorial-images-v45');

const HOMEPAGE_SITUATION_IMAGES_VERSION='70.0';
const CSS_PATH='/assets/homepage-situation-images-v70.css';
const CARD_RE=/<article class="apg-v12-card"[^>]*>[\s\S]*?<\/article>/gi;
const CATEGORY_HREF_RE=/href="\/categories\/([a-z0-9-]+)\/"/i;
const ART_OPEN='<span class="apg-v12-art">';

const CSS=`
/* APG Homepage Situation Images v70
 * Presentation-only enhancement for the homepage situation cards.
 * The governed category editorial image replaces the legacy abstract backdrop while
 * the existing APG icon and situation label remain legible overlays.
 */
body[data-platform-page="/"] .apg-v12-card .apg-v12-art{
  position:relative!important;
  overflow:hidden!important;
  isolation:isolate!important;
  background:#E2E8F0!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v70-situation-image{
  position:absolute!important;
  inset:0!important;
  z-index:0!important;
  display:block!important;
  width:100%!important;
  height:100%!important;
  max-width:none!important;
  object-fit:cover!important;
  object-position:center!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v12-art::after{
  content:""!important;
  position:absolute!important;
  inset:0!important;
  z-index:1!important;
  pointer-events:none!important;
  background:linear-gradient(180deg,rgba(15,23,42,.05) 0%,rgba(15,23,42,.13) 100%)!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v12-icon,
body[data-platform-page="/"] .apg-v12-card .apg-v12-art>small{
  position:relative!important;
  z-index:2!important;
}
`;

function escAttr(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function enhanceSituationCards(html){
  const text=String(html||'');
  if(!text.includes('apg-v12-situations')||!text.includes(ART_OPEN))return text;
  return text.replace(CARD_RE,card=>{
    if(card.includes('data-apg-situation-image='))return card;
    const match=card.match(CATEGORY_HREF_RE);
    if(!match)return card;
    const slug=String(match[1]||'').toLowerCase();
    const image=categoryImages[slug];
    if(!image||!image.src)return card;
    const img=`<img class="apg-v70-situation-image" data-apg-situation-image="${escAttr(slug)}" src="${escAttr(image.src)}" alt="" loading="lazy" decoding="async">`;
    return card.replace(ART_OPEN,`${ART_OPEN}${img}`);
  });
}

function injectHomepageSituationAssets(html){
  let out=String(html||'');
  if(!out.includes('apg-v12-situations'))return out;
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${HOMEPAGE_SITUATION_IMAGES_VERSION}"><meta name="apg-homepage-situation-images" content="v${HOMEPAGE_SITUATION_IMAGES_VERSION}"></head>`);
  return out;
}

function transformHomepage(html,url){
  const original=String(html||'');
  if(url.pathname!=='/'||!original.includes('apg-v12-situations'))return original;
  return injectHomepageSituationAssets(enhanceSituationCards(original));
}

async function handler(req,res){
  const url=requestUrl(req);
  res.setHeader('X-APG-Homepage-Situation-Images','v'+HOMEPAGE_SITUATION_IMAGES_VERSION);
  if(url.pathname===CSS_PATH){
    res.statusCode=200;
    res.setHeader('Content-Type','text/css; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600');
    return res.end(req.method==='HEAD'?'':CSS);
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=transformHomepage(original,url);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  HOMEPAGE_SITUATION_IMAGES_VERSION,CSS_PATH,CSS,CARD_RE,CATEGORY_HREF_RE,
  enhanceSituationCards,injectHomepageSituationAssets,transformHomepage
});
module.exports=handler;
