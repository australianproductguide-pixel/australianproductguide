'use strict';

const downstream=require('./brand-mark-completion-v68');
const {categories}=require('../data');
const {categoryCard}=require('./ui');

const RELATED_DECISIONS_UI_VERSION='69.0.0';
const LEGACY_RELATED_CARD_RE=/<a class="category-card" href="\/categories\/([a-z0-9-]+)\/">[\s\S]*?<\/a>/gi;

function upgradeRelatedDecisionCards(html){
  const text=String(html||'');
  if(!text.includes('apg-seo-related')||!text.includes('<a class="category-card"'))return text;
  return text.replace(LEGACY_RELATED_CARD_RE,(legacy,slug)=>{
    const category=categories[String(slug||'').toLowerCase()];
    return category?categoryCard(category):legacy;
  });
}
function injectRelatedDecisionsMeta(html){
  const text=String(html||'');
  if(!text.includes('apg-seo-related')||text.includes('name="apg-related-decisions-ui"'))return text;
  return text.replace('</head>',`<meta name="apg-related-decisions-ui" content="v${RELATED_DECISIONS_UI_VERSION}"></head>`);
}
function polishRelatedDecisionsHtml(html){
  const original=String(html||'');
  const upgraded=upgradeRelatedDecisionCards(original);
  return upgraded===original?original:injectRelatedDecisionsMeta(upgraded);
}

async function handler(req,res){
  res.setHeader('X-APG-Related-Decisions-UI','v'+RELATED_DECISIONS_UI_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body),original=wasBuffer?body.toString('utf8'):body;
      const next=polishRelatedDecisionsHtml(original);
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
  RELATED_DECISIONS_UI_VERSION,LEGACY_RELATED_CARD_RE,
  upgradeRelatedDecisionCards,injectRelatedDecisionsMeta,polishRelatedDecisionsHtml
});
module.exports=handler;
