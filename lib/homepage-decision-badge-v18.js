// APG homepage decision-panel badge emphasis v18 over Amazon disclosure v17.
const app=require('./amazon-disclosure-brand-voice-v17');

function transform(html,path){
  if(path!=='/'||html.includes('homepage-decision-badge-v18.css'))return html;
  return String(html||'').replace('</head>','<link rel="stylesheet" href="/assets/homepage-decision-badge-v18.css?v=18"></head>');
}

module.exports=(req,res)=>{
  let path='/';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,path);
    return end(body,...args);
  };
  return app(req,res);
};
module.exports.transform=transform;
