// APG mobile menu polish v21 over Research View v43.1.
// Refines mobile navigation/account presentation without changing account, search or decision behaviour.
const app=require('./research-view-v431');

const CSS='/assets/mobile-menu-polish-v21.css?v=21';

function dedupeMobilePower(out){
  const start=out.indexOf('<nav id="mobileNav"');
  if(start<0)return out;
  const close=out.indexOf('</nav></header>',start);
  if(close<0)return out;
  const navEnd=close+6;
  let nav=out.slice(start,navEnd);
  let seen=false;
  nav=nav.replace(/<a class="mobile-power"[\s\S]*?<\/a>/g,m=>{
    if(seen)return '';
    seen=true;
    return m;
  });
  return out.slice(0,start)+nav+out.slice(navEnd);
}

function polishMobileNav(html){
  let out=String(html||'');
  out=out.replace(/placeholder="Search products, categories or comparisons"/g,'placeholder="Search products or categories"');
  out=out.replace(/<span>Your Australian Product Guide account<\/span>/g,'<span>Your APG account</span>');
  out=dedupeMobilePower(out);
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  return out;
}

function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return polishMobileNav(base);
}

module.exports=(req,res)=>{
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=polishMobileNav(body);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.polishMobileNav=polishMobileNav;
module.exports.dedupeMobilePower=dedupeMobilePower;
