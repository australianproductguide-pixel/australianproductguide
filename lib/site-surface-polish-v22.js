// APG site surface polish v22 over Mobile Menu Polish v21.
// Extends the clean APG surface language across comparable site components
// without changing account, search, decision, retailer or recommendation behaviour.
const app=require('./mobile-menu-polish-v21');

const CSS='/assets/site-surface-polish-v22.css?v=22';

function polishSiteSurfaces(html){
  let out=String(html||'');
  if(!out.includes('data-surface-v22="true"')){
    out=out.replace(/<body(\s[^>]*)?>/i,m=>{
      if(/data-surface-v22=/i.test(m))return m;
      return m.replace(/>$/,' data-surface-v22="true">');
    });
  }
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  return out;
}

function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return polishSiteSurfaces(base);
}

module.exports=(req,res)=>{
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=polishSiteSurfaces(body);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.polishSiteSurfaces=polishSiteSurfaces;
