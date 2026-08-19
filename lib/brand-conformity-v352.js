// Australian Product Guide Brand Conformity v35.2.
// Focused presentation-only closure for the remaining legacy green/teal surfaces:
// homepage national-category depth, universal search autocomplete and Scout UI.
// Product/search/decision logic, catalogue data, retailer neutrality, auth and privacy remain unchanged.
const upstream=require('./brand-conformity-v351');

const VERSION='35.2';
const CSS_PATH='/assets/brand-conformity-v352.css';

function inject(html){
  let out=String(html||'');
  if(!out.includes('data-brand-conformity-v352="true"')){
    out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-conformity-v352="true"$1>');
  }
  if(!out.includes(CSS_PATH)){
    out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

function handler(req,res){
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){
      body=inject(body);
    }
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{VERSION,CSS_PATH,inject});
module.exports=handler;
