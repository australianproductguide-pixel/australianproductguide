'use strict';

// APG Earbuds Category Image Refresh v72.
// Replaces the misleading cotton-swab category photograph with a verified photograph
// of true wireless earbuds in their charging case. The source remains editorial
// category context only and is not evidence of APG hands-on testing or recommendation.
const downstream=require('./televisions-category-image-v71');

const EARBUDS_CATEGORY_IMAGE_VERSION='72.0';
const OLD_SRC='/category-editorial/earbuds.jpg';
const OLD_SOURCE='https://commons.wikimedia.org/wiki/File%3AEarbuds.jpg';
const OLD_CREATOR='Gausanchennai';
const IMAGE=Object.freeze({
  src:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Here_One_earbuds_in_white_charging_case.jpg/1280px-Here_One_earbuds_in_white_charging_case.jpg',
  width:1280,
  height:720,
  sourceTitle:'Here One earbuds in white charging case.jpg',
  sourcePage:'https://commons.wikimedia.org/wiki/File%3AHere_One_earbuds_in_white_charging_case.jpg',
  creator:'Doppler Labs',
  license:'CC BY-SA 4.0',
  licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0'
});

function refreshEarbudsImage(html){
  let out=String(html||'');
  if(!out.includes(OLD_SRC))return out;

  out=out.split(OLD_SRC).join(IMAGE.src);
  out=out.replace(
    /(<img[^>]+Here_One_earbuds_in_white_charging_case\.jpg[^>]+height=")960("[^>]*>)/ig,
    `$1${IMAGE.height}$2`
  );
  out=out.replace(
    '<meta property="og:image:width" content="1280"><meta property="og:image:height" content="960">',
    `<meta property="og:image:width" content="${IMAGE.width}"><meta property="og:image:height" content="${IMAGE.height}">`
  );
  out=out.replace(
    `<a href="${OLD_SOURCE}" target="_blank" rel="noopener noreferrer">${OLD_CREATOR}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>`,
    `<a href="${IMAGE.sourcePage}" target="_blank" rel="noopener noreferrer">${IMAGE.creator}</a> · <a href="${IMAGE.licenseUrl}" target="_blank" rel="noopener noreferrer">${IMAGE.license}</a>`
  );
  if(!out.includes('name="apg-earbuds-category-image"')){
    out=out.replace('</head>',`<meta name="apg-earbuds-category-image" content="v${EARBUDS_CATEGORY_IMAGE_VERSION}"></head>`);
  }
  return out;
}

async function handler(req,res){
  res.setHeader('X-APG-Earbuds-Category-Image','v'+EARBUDS_CATEGORY_IMAGE_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=refreshEarbudsImage(original);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{EARBUDS_CATEGORY_IMAGE_VERSION,refreshEarbudsImage,IMAGE});
module.exports=handler;
