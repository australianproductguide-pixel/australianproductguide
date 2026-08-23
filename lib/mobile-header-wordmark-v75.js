'use strict';

// APG Mobile Header Full Wordmark v75.
// Keeps the existing Australian Product Guide brand lock-up visible in the mobile
// header instead of switching to the APG monogram. Desktop remains unchanged.
const downstream=require('./image-seo-phase1-v74');

const VERSION='75';
const CSS_PATH='/assets/mobile-header-wordmark-v75.css';

const css=`
/* APG Mobile Header Full Wordmark v75. */
@media(max-width:920px){
  .site-header .brand{
    min-width:0!important;
    max-width:132px!important;
    flex:0 1 132px!important;
  }
  .site-header .apg-brand-v32-lockup{
    width:100%!important;
    gap:.38rem!important;
    min-width:0!important;
  }
  .site-header .apg-brand-v32-type{
    display:flex!important;
    min-width:0!important;
  }
  .site-header .apg-brand-v32-monogram{display:none!important}
  .site-header .apg-brand-v32-mark{
    width:34px!important;
    height:28px!important;
  }
  .site-header .apg-brand-v32-name{
    font-size:.84rem!important;
    line-height:.92!important;
  }
  .site-header .apg-brand-v32-product{
    margin-top:.17rem!important;
    font-size:.77rem!important;
    line-height:.92!important;
  }
}

@media(max-width:430px){
  .site-header .brand{
    max-width:116px!important;
    flex-basis:116px!important;
  }
  .site-header .apg-brand-v32-lockup{gap:.32rem!important}
  .site-header .apg-brand-v32-mark{
    width:31px!important;
    height:26px!important;
  }
  .site-header .apg-brand-v32-name{font-size:.78rem!important}
  .site-header .apg-brand-v32-product{
    margin-top:.14rem!important;
    font-size:.71rem!important;
  }
}

@media(max-width:370px){
  .site-header .brand{
    max-width:99px!important;
    flex-basis:99px!important;
  }
  .site-header .apg-brand-v32-lockup{gap:.26rem!important}
  .site-header .apg-brand-v32-mark{
    width:27px!important;
    height:23px!important;
  }
  .site-header .apg-brand-v32-name{font-size:.68rem!important}
  .site-header .apg-brand-v32-product{
    margin-top:.12rem!important;
    font-size:.63rem!important;
  }
}
`;

function sendCss(res,req){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

function inject(html){
  let out=String(html||'');
  if(out.includes('name="apg-mobile-header-wordmark"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-mobile-header-wordmark" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`
  );
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);

  res.setHeader('X-APG-Mobile-Header-Wordmark','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=inject(original);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{VERSION,CSS_PATH,css,inject});
module.exports=handler;
