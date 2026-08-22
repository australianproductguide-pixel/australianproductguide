'use strict';

// APG Televisions Category Image Refresh v71.
// Replaces the weaker televisions editorial image at the existing canonical asset path,
// while correcting television-specific visible attribution and image dimensions.
// The shared path means category hero, category directory, homepage situation card and
// social/SEO image consumers remain synchronized without parallel image URLs.
const downstream=require('./homepage-situation-images-v70');
const image=require('../data/category-editorial-televisions-v71');

const TELEVISIONS_CATEGORY_IMAGE_VERSION='71.0';
const OLD_SOURCE='https://commons.wikimedia.org/wiki/File%3AModern%20Living%20Room.jpg';
const OLD_CREATOR='Fatma005';

function requestUrl(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au');}
  catch{return new URL('https://australianproductguide.au/');}
}

function refreshTelevisionsMetadata(html,url){
  let out=String(html||'');
  if(url.pathname!=='/categories/televisions/'||!out.includes('/category-editorial/televisions.jpg'))return out;

  out=out.replace(
    /(<img\s+src="\/category-editorial\/televisions\.jpg"[^>]*\swidth=")1280("\s+height=")848("[^>]*>)/i,
    `$1${image.width}$2${image.height}$3`
  );
  out=out.replace(
    '<meta property="og:image:width" content="1280"><meta property="og:image:height" content="848">',
    `<meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}">`
  );
  out=out.replace(
    `<a href="${OLD_SOURCE}" target="_blank" rel="noopener noreferrer">${OLD_CREATOR}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>`,
    `<a href="${image.sourcePage}" target="_blank" rel="noopener noreferrer">${image.creator}</a> · <a href="${image.licenseUrl}" target="_blank" rel="noopener noreferrer">${image.license}</a>`
  );
  if(!out.includes('name="apg-televisions-category-image"')){
    out=out.replace('</head>',`<meta name="apg-televisions-category-image" content="v${TELEVISIONS_CATEGORY_IMAGE_VERSION}"></head>`);
  }
  return out;
}

async function handler(req,res){
  const url=requestUrl(req);
  res.setHeader('X-APG-Televisions-Category-Image','v'+TELEVISIONS_CATEGORY_IMAGE_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=refreshTelevisionsMetadata(original,url);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{TELEVISIONS_CATEGORY_IMAGE_VERSION,refreshTelevisionsMetadata,image});
module.exports=handler;
