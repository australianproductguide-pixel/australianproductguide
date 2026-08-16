const app=require('./account-platform');

function reconcile(html,path){
  let out=String(html||'');
  if(path==='/my-apg/'){
    out=out.replace('<title>My Australian Product Guide | Private Product Decision Workspace</title>','<title>My Australian Product Guide | Save & Sync Product Research</title>');
    out=out.replace('content="A browser-local workspace for saved products, comparison shortlists and recent Australian Product Guide decisions."','content="Save products, comparisons and decision research locally or sync them across devices with an optional Australian Product Guide account."');
    out=out.replace('content="My Australian Product Guide | Private Product Decision Workspace"','content="My Australian Product Guide | Save & Sync Product Research"');
  }
  if(path==='/privacy/'){
    out=out.replace('Australian Product Guide does not operate checkout, payment-card capture, newsletter signup or a public free-text contact form. An account is optional and is not required to browse, search, compare or use Decision Lab.','Australian Product Guide does not operate checkout or payment-card capture. It provides an optional account and a separate optional preference for future Australian Product Guide product-research emails; neither is required to browse, search, compare or use Decision Lab. APG does not currently operate a public free-text contact form.');
    out=out.replace('A dedicated venture privacy contact and documented access/correction/complaint process should be activated as identifiable information collection grows.','Australian Product Guide provides self-service account and update-preference controls. A dedicated venture privacy contact and documented access/correction/complaint process remains a planned governance uplift as identifiable information collection grows.');
  }
  return out;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=reconcile(body,path);
    return originalEnd(body,...args);
  };
  return app(req,res);
};
