// APG Platform Cohesion v26.
// Reconciles the current account-governance chain with the separately shipped
// retailer-depth and Research View capabilities, then applies a lightweight
// cross-platform consumer UX layer. The underlying SSR architecture remains
// authoritative; this wrapper only progressively enhances rendered HTML.
const app=require('./account-governance-v25');
const commerce=require('./priority-commerce-depth-v42');
const research=require('./research-view-v43');
const researchPolish=require('./research-view-v431');

const CSS='/assets/platform-cohesion-v26.css?v=26';
const JS='/assets/platform-cohesion-v26.js?v=26';
const PRIMARY_ORIGIN='https://australianproductguide.au';

function urlOf(value){
  if(value instanceof URL)return value;
  if(value&&typeof value==='object'&&typeof value.href==='string'){
    try{return new URL(value.href);}catch{}
  }
  const raw=String(value||'/');
  try{return new URL(raw,PRIMARY_ORIGIN);}catch{return new URL(PRIMARY_ORIGIN);}
}
function pageKind(pathname){
  const path=String(pathname||'/');
  if(path==='/')return 'home';
  if(path==='/search/')return 'search';
  if(path==='/decision-lab/')return 'decision';
  if(path==='/my-apg/')return 'account';
  if(path.startsWith('/products/'))return 'product';
  if(path.startsWith('/categories/'))return path.endsWith('/finder/')?'finder':'category';
  if(path.startsWith('/compare/'))return 'compare';
  if(path.startsWith('/guides/'))return 'guide';
  return 'content';
}
function addBodyState(out,url){
  if(out.includes('data-cohesion-v26="true"'))return out;
  return out.replace(/<body(\s[^>]*)?>/i,m=>m.replace(/>$/,` data-cohesion-v26="true" data-v26-page="${pageKind(url.pathname)}">`));
}
function addScoutNavigation(out){
  if(!out.includes('data-v26-scout-open')){
    out=out.replace(
      '<a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a>',
      '<a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a><button type="button" class="apg-v26-scout-nav" data-v26-scout-open aria-controls="apgAssistantPanel">Ask Scout</button>'
    );
  }
  if(!out.includes('data-v26-scout-mobile')){
    out=out.replace(
      '<a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a>',
      '<a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a><button type="button" class="mobile-power apg-v26-scout-mobile" data-v26-scout-open data-v26-scout-mobile aria-controls="apgAssistantPanel">Ask Scout <span aria-hidden="true">→</span></button>'
    );
  }
  return out;
}
function cohesionTransform(html,pathOrUrl){
  const url=urlOf(pathOrUrl);
  let out=String(html||'');
  if(!/^<!doctype html>/i.test(out)&&!/<html[\s>]/i.test(out))return out;
  out=addBodyState(out,url);
  out=addScoutNavigation(out);
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  if(!out.includes(JS))out=out.replace('</body>',`<script src="${JS}" defer></script></body>`);
  return out;
}
function applyIntegratedTransforms(html,url){
  let out=String(html||'');
  out=commerce.commerceTransform(out,url);
  out=research.searchTransform(out,url);
  out=researchPolish.polishHtml(out);
  out=cohesionTransform(out,url);
  return out;
}
function transform(html,pathOrUrl){
  const url=urlOf(pathOrUrl);
  const base=app.transform?app.transform(String(html||''),url):String(html||'');
  return applyIntegratedTransforms(base,url);
}
function sendJson(req,res,status,data){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Experience','platform-cohesion-v26');
  return res.end(req.method==='HEAD'?'':JSON.stringify(data));
}

module.exports=(req,res)=>{
  const url=urlOf(req.url);
  const path=url.pathname;
  if(path==='/api/search/research'||path==='/api/search/research/'){
    if(!['GET','HEAD'].includes(req.method)){
      res.setHeader('Allow','GET, HEAD');
      return sendJson(req,res,405,{error:'Method not allowed'});
    }
    const payload=research.researchPayload(url.searchParams.get('q')||'');
    if(payload&&typeof payload==='object'&&payload.answer)payload.answer=researchPolish.polishAnswer(payload.answer);
    return sendJson(req,res,200,payload);
  }
  res.setHeader('X-APG-Experience','platform-cohesion-v26');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=applyIntegratedTransforms(body,url);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.cohesionTransform=cohesionTransform;
module.exports.applyIntegratedTransforms=applyIntegratedTransforms;
module.exports.pageKind=pageKind;
module.exports.urlOf=urlOf;
