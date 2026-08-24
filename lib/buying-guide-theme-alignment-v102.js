'use strict';

// APG Buying Guide Theme Alignment v102.0
//
// Presentation-only reconciliation for every maintained buying-guide detail route.
// The shared guide renderer still uses the legacy .guide-step > .step-number structure;
// later theme layers can therefore leave its numbered decision accents in the old
// gold/tan treatment. Match those decision accents to the current APG blue interaction
// language already used on maintained category decision-factor cards.
//
// No buying-guide content, evidence, recommendation/ranking logic, retailer ordering,
// affiliate behaviour, analytics, account behaviour, SEO metadata or route structure changes.
const downstream=require('./action7-closure-v1016');

const VERSION='102.0';
const CSS_PATH='/assets/buying-guide-theme-alignment-v102.css';
const ORIGIN='https://australianproductguide.au';

const css=`
/* APG Buying Guide Theme Alignment v102.0 */
:root{
  --apg-guide-blue:#2563EB;
  --apg-guide-blue-strong:#1D4ED8;
  --apg-guide-blue-soft:#EFF6FF;
  --apg-guide-blue-border:#BFDBFE;
}

/* Buying-guide decision steps: retire the remaining legacy gold/tan accent and use
   the same calm APG blue treatment as the current category decision-factor surface. */
html body .guide-layout .guide-step > .step-number{
  background:var(--apg-guide-blue-soft)!important;
  color:var(--apg-guide-blue-strong)!important;
  border:1px solid var(--apg-guide-blue-border)!important;
  box-shadow:0 1px 2px rgba(37,99,235,.04)!important;
}
`;

function isBuyingGuide(path){
  return /^\/guides\/[^/]+-buying-guide\/$/.test(String(path||''));
}

function inject(html){
  const out=String(html||'');
  if(out.includes('name="apg-buying-guide-theme-alignment"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-buying-guide-theme-alignment" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`
  );
}

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Buying-Guide-Theme-Alignment','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}

  if(path===CSS_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendCss(req,res);
  if(!isBuyingGuide(path))return downstream(req,res);

  res.setHeader('X-APG-Buying-Guide-Theme-Alignment','v'+VERSION);
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
  BUYING_GUIDE_THEME_ALIGNMENT_VERSION:VERSION,
  BUYING_GUIDE_THEME_ALIGNMENT_CSS_PATH:CSS_PATH,
  buyingGuideThemeAlignmentCss:css,
  isBuyingGuide,
  injectBuyingGuideThemeAlignment:inject
});

module.exports=handler;
