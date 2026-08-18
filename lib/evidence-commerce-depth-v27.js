// APG Evidence & Commerce Depth v27.
// Extends the verified v26 platform without replacing its account, research or decision stack.
const app=require('./platform-cohesion-v26');
const observability=require('./intelligence-observability-v27');
const {categories}=require('../data');

const PRIMARY_ORIGIN='https://australianproductguide.au';
const CSS='<link rel="stylesheet" href="/assets/evidence-commerce-depth-v27.css?v=27">';
const JS='<script src="/assets/evidence-commerce-depth-v27.js?v=27" defer></script>';

function urlOf(raw){try{return new URL(raw||'/',PRIMARY_ORIGIN)}catch{return new URL('/',PRIMARY_ORIGIN)}}
function json(res,data,method='GET'){
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Experience','evidence-commerce-depth-v27');
  return res.end(method==='HEAD'?'':JSON.stringify(data));
}
function categoryCoverage(slug){
  const category=categories[slug];
  if(!category)return null;
  const rows=category.products||[];
  const withExact=rows.filter(p=>(p.offers||[]).some(x=>x&&x.exactModel===true&&x.url&&x.retailer)).length;
  const exactOffers=rows.reduce((n,p)=>n+(p.offers||[]).filter(x=>x&&x.exactModel===true&&x.url&&x.retailer).length,0);
  const withFacts=rows.filter(p=>Object.keys(p.factEvidence||{}).length>0).length;
  return {slug,label:category.label,products:rows.length,productsWithExactOffers:withExact,exactOffers,productsWithFactEvidence:withFacts};
}
function injectCoverageNote(html,path){
  if(html.includes('class="apg-v27-coverage-note"'))return html;
  const m=path.match(/^\/categories\/([^/]+)\/$/);
  if(!m)return html;
  const x=categoryCoverage(m[1]);
  if(!x||!x.products)return html;
  const message=x.exactOffers
    ?`${x.exactOffers} verified exact Australian buying destination${x.exactOffers===1?'':'s'} currently sit alongside ${x.products} maintained ${x.label.toLowerCase()} records. Retailer participation never changes recommendation rank.`
    :`This category is decision-ready, but APG has not yet verified an exact retailer destination for every maintained product. Recommendation rank remains independent of retailer coverage.`;
  const note=`<aside class="apg-v27-coverage-note" aria-label="Evidence and retailer coverage"><div><strong>Evidence & retailer coverage</strong><small>${message}</small></div><a href="/retailers/">How retailer evidence works →</a></aside>`;
  const marker='</section><section class="section apg-national-shortcuts"';
  if(html.includes(marker))return html.replace(marker,`</section>${note}<section class="section apg-national-shortcuts"`);
  return html;
}
function privacyDisclosure(html,path){
  if(path!=='/privacy/'||html.includes('data-v27-analytics-disclosure'))return html;
  const p='<p data-v27-analytics-disclosure><strong>Feature-outcome analytics:</strong> when a visitor has opted in to analytics, Australian Product Guide may record coarse feature outcomes such as whether a search returned results, the product category involved, use of comparison or Scout, and whether a verified retailer pathway was opened. APG does not intentionally send free-text shopping queries, finder answers, account identifiers or URL query strings in these v27 feature-outcome events.</p>';
  const marker='<h2 id="search">8. Search, comparison and recent activity</h2>';
  return html.includes(marker)?html.replace(marker,p+marker):html;
}
function enhance(html,pathOrUrl){
  const url=urlOf(pathOrUrl),path=url.pathname;
  let out=String(html||'');
  if(!/^<!doctype html>/i.test(out)&&!/<html[\s>]/i.test(out))return out;
  if(!out.includes('evidence-commerce-depth-v27.css'))out=out.replace('</head>',CSS+'</head>');
  if(!out.includes('evidence-commerce-depth-v27.js'))out=out.replace('</body>',JS+'</body>');
  if(!out.includes('data-evidence-commerce-v27="true"'))out=out.replace(/<body([^>]*)>/i,(m,a)=>`<body${a} data-evidence-commerce-v27="true">`);
  out=injectCoverageNote(out,path);
  out=privacyDisclosure(out,path);
  return out;
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  return enhance(base,pathOrUrl);
}

module.exports=(req,res)=>{
  const url=urlOf(req.url),path=url.pathname;
  if(['/api/intelligence/observability','/api/intelligence/observability/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    return json(res,observability.snapshot(),req.method);
  }
  if(['/api/intelligence/imagery','/api/intelligence/imagery/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    return json(res,{version:observability.VERSION,checkedAt:observability.CHECKED,...observability.imagerySnapshot(),control:'Only verified rights-backed exact/same-model photography is publishable. No scraping or fabricated product photography.'},req.method);
  }
  if(['/api/intelligence/retailers','/api/intelligence/retailers/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    return json(res,{version:observability.VERSION,checkedAt:observability.CHECKED,...observability.retailerSnapshot(),recommendationWeight:0},req.method);
  }
  if(['/api/intelligence/scout-evaluation','/api/intelligence/scout-evaluation/'].includes(path)){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    return json(res,{version:observability.VERSION,checkedAt:observability.CHECKED,...observability.scoutEvaluation()},req.method);
  }
  res.setHeader('X-APG-Experience','evidence-commerce-depth-v27');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=enhance(body,url.href);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.enhance=enhance;
module.exports.categoryCoverage=categoryCoverage;
module.exports.privacyDisclosure=privacyDisclosure;
module.exports.urlOf=urlOf;
