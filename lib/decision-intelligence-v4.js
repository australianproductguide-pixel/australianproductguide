const app=require('./platform-integrity-v15');
const engine=require('./decision-engine-v4');
const graph=require('./product-intelligence-v41');
const quality=require('./intelligence-quality-v41');
const scout=require('./scout-v41');
const {esc}=require('./ui');

const CSS=`[data-decision-v4=true] .v4-panel{border:1px solid #cfe0dc;border-radius:18px;background:#f7fbfa;padding:18px;margin:18px 0}[data-decision-v4=true] .v4-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}[data-decision-v4=true] .v4-card{border:1px solid #d6e3e1;border-radius:16px;background:#fff;padding:16px}[data-decision-v4=true] .v4-card h3{margin:.25rem 0 .6rem}[data-decision-v4=true] .v4-meta{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}[data-decision-v4=true] .v4-alert{border-left:4px solid #a86700;background:#fff8e8;padding:12px 14px;border-radius:0 12px 12px 0}[data-decision-v4=true] .v4-explain{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}[data-decision-v4=true] .decision-verification{border-left:3px solid #a86700;padding-left:12px}[data-decision-v4=true] .decision-confidence{display:flex;gap:8px;flex-wrap:wrap;margin:.7rem 0}.apg-assistant-launcher-icon,.apg-assistant-avatar,.scout-mini{overflow:hidden!important;background:transparent!important;padding:0!important}.apg-assistant-launcher-icon svg{width:44px;height:44px;display:block}.apg-assistant-avatar svg{width:44px;height:44px;display:block}.scout-row{display:flex;align-items:flex-end;gap:7px}.scout-mini{width:28px;height:28px;border-radius:50%;display:block;flex:0 0 28px}.scout-mini svg{width:28px;height:28px;display:block}.scout-thread{display:flex;flex-direction:column;gap:9px}.scout-bubble{max-width:86%;border-radius:15px 15px 15px 5px;background:#e4f2ef;color:#143541;padding:10px 12px;font-size:13.5px;line-height:1.48}.scout-row.user{justify-content:flex-end}.scout-row.user .scout-bubble{background:#082f40;color:#fff;border-radius:15px 15px 5px 15px}@media(max-width:800px){[data-decision-v4=true] .v4-grid,[data-decision-v4=true] .v4-explain{grid-template-columns:1fr}}`;
const urlOf=req=>new URL(req.url||'/',`https://${req.headers?.host||'australianproductguide.au'}`);
function send(res,status,type,body,head=false){res.statusCode=status;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','no-store');if(type.includes('json'))res.setHeader('X-Robots-Tag','noindex, nofollow');res.end(head?'':body);}
function sendJson(res,obj,head){send(res,200,'application/json; charset=utf-8',JSON.stringify(obj),head);}
function displayProductName(x){
  const brand=String(x?.brand||'').trim(),name=String(x?.name||'').trim();
  if(!brand)return name;
  if(!name)return brand;
  return name.toLowerCase().startsWith(brand.toLowerCase())?name:`${brand} ${name}`;
}
function restoreScout(out){
  const mascot=scout.mascot||'';
  if(mascot){
    out=out.replace(/(<span class="apg-assistant-launcher-icon"[^>]*>)(?:AU|APG)(<\/span>)/g,`$1${mascot}$2`);
    out=out.replace(/(<span class="apg-assistant-avatar"[^>]*>)(?:AU|APG)(<\/span>)/g,`$1${mascot}$2`);
  }
  out=out.replace('<strong>Ask Australian Product Guide</strong><small>Find a better fit</small>','<strong>Ask Scout</strong><small>Your APG decision guide</small>');
  out=out.replace('<strong>Ask APG</strong><small>Find a better fit</small>','<strong>Ask Scout</strong><small>Your APG decision guide</small>');
  return out;
}
function v4Transform(html,url){
  let out=String(html||'').replace(/Decision Engine v2/g,'Decision Engine v4').replace(/Decision Engine v3/g,'Decision Engine v4').replace('<body ','<body data-decision-v4="true" ');
  out=restoreScout(out);
  if(!out.includes('decision-intelligence-v4.css'))out=out.replace('</head>','<link rel="stylesheet" href="/assets/decision-intelligence-v4.css?v=4.1"></head>');
  if(/^\/products\//.test(url.pathname)){
    const slug=url.pathname.split('/').filter(Boolean)[1],node=graph.knowledgeNode(slug);
    if(node?.relationships?.comparable?.length&&!out.includes('Closest maintained alternatives')){
      const cards=node.relationships.comparable.slice(0,3).map(x=>`<a class="v4-card" href="/products/${esc(x.slug)}/"><strong>${esc(displayProductName(x))}</strong><span style="display:block;margin-top:6px">${x.similarity>=.7?'Very close structured alternative':x.similarity>=.45?'Close structured alternative':'Related maintained alternative'}</span></a>`).join('');
      out=out.replace('</main>',`<section class="section"><div class="wrap"><div class="v4-panel"><p class="kicker">Decision intelligence</p><h2>Closest maintained alternatives</h2><p>Structured similarity uses maintained category, feature, brand and price context where available. It is not a review score.</p><div class="v4-grid">${cards}</div></div></div></section></main>`);
    }
  }
  return out;
}
function intercept(req,res,url){
  const head=req.method==='HEAD';
  if(!['GET','HEAD'].includes(req.method||'GET'))return false;
  if(url.pathname==='/assets/decision-intelligence-v4.css'){send(res,200,'text/css; charset=utf-8',CSS,head);return true;}
  if(url.pathname==='/assets/assistant.js'){send(res,200,'application/javascript; charset=utf-8',scout.js,head);return true;}
  if(url.pathname==='/api/decision'){sendJson(res,engine.publicDecision(url.searchParams.get('q')||'',{category:url.searchParams.get('category')||'',budget:url.searchParams.get('budget')||'',brand:url.searchParams.get('brand')||''}),head);return true;}
  if(url.pathname==='/api/intelligence/quality'){sendJson(res,quality.qualitySnapshot(),head);return true;}
  if(url.pathname==='/api/intelligence/graph'){sendJson(res,graph.graphSummary(),head);return true;}
  if(url.pathname==='/api/intelligence/product'){
    const x=graph.knowledgeNode(url.searchParams.get('slug')||'');
    if(!x)send(res,404,'application/json; charset=utf-8',JSON.stringify({error:'Product not found'}),head);else sendJson(res,x,head);
    return true;
  }
  if(url.pathname==='/api/intelligence/category'){
    const x=graph.categoryNode(url.searchParams.get('slug')||'');
    if(!x)send(res,404,'application/json; charset=utf-8',JSON.stringify({error:'Category not found'}),head);else sendJson(res,x,head);
    return true;
  }
  return false;
}
function handler(req,res){
  const url=urlOf(req);
  if(intercept(req,res,url))return;
  const end=res.end.bind(res);
  res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html'))body=v4Transform(body,url);return end(body,...args);};
  return app(req,res);
}
handler.transform=(html,url)=>v4Transform(typeof app.transform==='function'?app.transform(html,url):html,url);
handler.ENGINE_VERSION=engine.ENGINE_VERSION;
handler.POLICY_VERSION=engine.POLICY_VERSION;
handler.DEPTH_VERSION='decision-intelligence-v4.1';
module.exports=handler;