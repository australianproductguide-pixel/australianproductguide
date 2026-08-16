const app=require('./amazon-associates');

const ASSET_PATH='/assets/mobile-search-layer-fix.css';
const css=`
/* Final v7/v9 visual certification fix: keep mobile search suggestions clear of the page share bar. */
@media(max-width:920px){
  .platform-sharebar{display:none!important}
  .site-header{z-index:240!important}
  .apg-mobile-v8{position:relative!important;z-index:1!important}
  .apg-mobile-v8 .search-suggestions{z-index:1000!important;background:#fff!important}
}
`;

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname;}catch{}
  if(path===ASSET_PATH)return sendCss(req,res);

  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&!body.includes(ASSET_PATH)){
      body=body.includes('</head>')?body.replace('</head>',`<link rel="stylesheet" href="${ASSET_PATH}"></head>`):body;
    }
    return originalEnd(body,...args);
  };
  return app(req,res);
};

module.exports.css=css;
