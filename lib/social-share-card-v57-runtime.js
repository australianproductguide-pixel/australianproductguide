'use strict';

// APG Social Share Card v57.2 is a focused outer response layer.
// It changes only Open Graph / social-preview image metadata and serves the
// owner-approved APG campaign artwork from verified in-repo image bytes.
// Product, recommendation, auth, analytics, shopping and social-profile logic remain unchanged.
// `og:image` is the canonical Open Graph image property; the redundant
// `og:image:url` alias is intentionally omitted so outer SEO layers can replace
// page-specific imagery without leaving a conflicting stale image declaration.
const downstream=require('./social-integration-v56-runtime');
const SHARE_IMAGE_BUFFER=require('./social-share-image-v57');

const VERSION='57.2';
const ORIGIN='https://australianproductguide.au';
const SHARE_IMAGE_PATH='/social/apg-share-20260822.jpg';
const SHARE_IMAGE_URL=ORIGIN+SHARE_IMAGE_PATH;
const SHARE_IMAGE_WIDTH='600';
const SHARE_IMAGE_HEIGHT='240';
const SHARE_IMAGE_ALT='Australian Product Guide — Make a better product decision.';

function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function setMeta(html,attribute,key,content){
  let out=String(html||'');
  const re=new RegExp(`<meta\\s+${attribute}=["']${escapeRegex(key)}["'][^>]*>`, 'gi');
  out=out.replace(re,'');
  const tag=`<meta ${attribute}="${key}" content="${String(content).replace(/"/g,'&quot;')}">`;
  return out.includes('</head>')?out.replace('</head>',tag+'</head>'):tag+out;
}
function removeMeta(html,attribute,key){
  const re=new RegExp(`<meta\\s+${attribute}=["']${escapeRegex(key)}["'][^>]*>`, 'gi');
  return String(html||'').replace(re,'');
}
function patchShareMetadata(html){
  let out=String(html||'');
  // Remove any legacy alias first so page-specific outer layers cannot inherit a
  // second, contradictory Open Graph image URL.
  out=removeMeta(out,'property','og:image:url');
  out=setMeta(out,'property','og:image',SHARE_IMAGE_URL);
  out=setMeta(out,'property','og:image:secure_url',SHARE_IMAGE_URL);
  out=setMeta(out,'property','og:image:type','image/jpeg');
  out=setMeta(out,'property','og:image:width',SHARE_IMAGE_WIDTH);
  out=setMeta(out,'property','og:image:height',SHARE_IMAGE_HEIGHT);
  out=setMeta(out,'property','og:image:alt',SHARE_IMAGE_ALT);
  out=setMeta(out,'name','twitter:card','summary_large_image');
  out=setMeta(out,'name','twitter:image',SHARE_IMAGE_URL);
  out=setMeta(out,'name','twitter:image:alt',SHARE_IMAGE_ALT);
  return out;
}
function handler(req,res){
  let path='';
  try{path=new URL(req.url,ORIGIN).pathname;}catch{}

  if(path===SHARE_IMAGE_PATH){
    res.setHeader('X-APG-Social-Share-Card','v'+VERSION);
    res.setHeader('Content-Type','image/jpeg');
    res.setHeader('Content-Length',String(SHARE_IMAGE_BUFFER.length));
    res.setHeader('Cache-Control','public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition','inline; filename="apg-social-share-20260822.jpg"');
    if(req.method==='HEAD')return res.end();
    if(req.method==='GET')return res.end(SHARE_IMAGE_BUFFER);
    res.statusCode=405;
    res.setHeader('Allow','GET, HEAD');
    return res.end();
  }

  res.setHeader('X-APG-Social-Share-Card','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){
      const next=patchShareMetadata(body);
      if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{SHARE_CARD_VERSION:VERSION,SHARE_IMAGE_PATH,SHARE_IMAGE_URL,SHARE_IMAGE_WIDTH,SHARE_IMAGE_HEIGHT,SHARE_IMAGE_ALT,patchShareMetadata});
module.exports=handler;
