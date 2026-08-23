'use strict';

// APG Category Page Polish v86.
// Presentation-only refinement for maintained category landing pages. It separates
// the primary category actions from the priority pills on desktop and mobile, and
// replaces the remaining legacy green/gold step-number treatment in the What Matters
// cards with the current APG blue interaction language. Category content, ranking,
// recommendation logic, retailer ordering, affiliate logic and analytics are unchanged.
const downstream=require('./search-console-depth-v85-runtime');

const CATEGORY_PAGE_POLISH_VERSION='86.0';
const CSS_PATH='/assets/category-page-polish-v86.css';
const ORIGIN='https://australianproductguide.au';

const css=`
/* APG Category Page Polish v86 */
:root{
  --apg-category-blue:#2563EB;
  --apg-category-blue-strong:#1D4ED8;
  --apg-category-blue-soft:#EFF6FF;
  --apg-category-blue-border:#BFDBFE;
}

/* Keep primary category actions visually distinct from priority pills. */
html body .category-hero .actions{
  display:flex!important;
  align-items:center!important;
  flex-wrap:wrap!important;
  gap:10px 12px!important;
  margin:20px 0 0!important;
}
html body .category-hero .actions .button{
  margin:0!important;
  min-height:44px;
}
html body .category-hero .actions + .pills{
  display:flex!important;
  align-items:center!important;
  flex-wrap:wrap!important;
  gap:8px!important;
  row-gap:8px!important;
  margin-top:14px!important;
}
html body .category-hero .actions + .pills .pill{
  margin:0!important;
}

/* What Matters: use APG blue rather than the remaining legacy green/gold accent. */
html body .soft-section.full-bleed .feature-card > .step-number{
  background:var(--apg-category-blue-soft)!important;
  color:var(--apg-category-blue-strong)!important;
  border:1px solid var(--apg-category-blue-border)!important;
  box-shadow:0 1px 2px rgba(37,99,235,.04)!important;
}

@media(max-width:720px){
  html body .category-hero .actions{
    gap:10px!important;
    margin-top:18px!important;
  }
  html body .category-hero .actions .button{
    flex:1 1 145px;
    min-width:0;
  }
  html body .category-hero .actions + .pills{
    margin-top:16px!important;
    gap:8px!important;
    row-gap:8px!important;
  }
}

@media(max-width:480px){
  html body .category-hero .actions{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr));
    width:100%;
  }
  html body .category-hero .actions .button{
    width:100%;
    min-width:0;
    padding-inline:12px!important;
  }
}
`;

function isMaintainedCategoryRoot(path){
  return /^\/categories\/[^/]+\/$/.test(String(path||''));
}

function sendCss(res,req){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

function inject(html){
  const out=String(html||'');
  if(out.includes('name="apg-category-page-polish"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-category-page-polish" content="v${CATEGORY_PAGE_POLISH_VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${CATEGORY_PAGE_POLISH_VERSION}"></head>`
  );
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);
  if(!isMaintainedCategoryRoot(path))return downstream(req,res);

  res.setHeader('X-APG-Category-Page-Polish','v'+CATEGORY_PAGE_POLISH_VERSION);
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

Object.assign(handler,downstream,{
  CATEGORY_PAGE_POLISH_VERSION,
  CATEGORY_PAGE_POLISH_CSS_PATH:CSS_PATH,
  categoryPagePolishCss:css,
  isMaintainedCategoryRoot,
  injectCategoryPagePolish:inject
});

module.exports=handler;
