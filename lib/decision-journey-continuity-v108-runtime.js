'use strict';

// APG Decision Journey Continuity v108.
// A small SSR continuity layer that makes the existing Search, Scout, Decision Lab,
// Compare, product and category tools feel like one decision journey. It stores no new
// customer data, adds no browser router and does not score/re-rank products.
const {categories,products}=require('../data');
const {pairPages}=require('./routes');

const VERSION='108.0';
const CSS_PATH='/assets/decision-journey-v108.css';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));
const PAIR_BY_PATH=new Map(pairPages.map(pair=>[pair.path,pair]));

const css=String.raw`
/* APG Decision Journey Continuity v108 */
.apg-journey-rail{margin:26px 0 8px;border:1px solid #dbe5ef;border-radius:20px;background:linear-gradient(135deg,#f7faff 0%,#fff 56%,#fff8e8 100%);padding:20px 22px;box-shadow:0 6px 24px rgba(15,47,74,.05)}
.apg-journey-rail-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:20px}
.apg-journey-rail .apg-journey-kicker{display:block;margin:0 0 6px;color:#1d4ed8;font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
.apg-journey-rail h2{margin:0;color:#102f4a;font-size:clamp(20px,2.2vw,28px);line-height:1.14}
.apg-journey-rail p{max-width:720px;margin:7px 0 0;color:#526274;font-size:14px;line-height:1.55}
.apg-journey-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px}
.apg-journey-actions :where(a,button){display:inline-flex;align-items:center;justify-content:center;min-height:44px;border:1px solid #cbd9e7;border-radius:12px;padding:10px 13px;background:#fff;color:#174a74;font:inherit;font-size:12.5px;font-weight:850;text-decoration:none;cursor:pointer;white-space:nowrap}
.apg-journey-actions :where(a,button).primary{border-color:#2563eb;background:#2563eb;color:#fff}
.apg-journey-actions :where(a,button):hover{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
.apg-journey-actions :where(a,button).primary:hover{background:#1d4ed8;color:#fff}
.apg-journey-actions :where(a,button):focus-visible{outline:3px solid rgba(37,99,235,.24);outline-offset:3px}
@media(max-width:760px){.apg-journey-rail{margin:20px 0 4px;padding:18px;border-radius:17px}.apg-journey-rail-grid{grid-template-columns:1fr;gap:15px}.apg-journey-rail p{font-size:14px}.apg-journey-actions{justify-content:flex-start}.apg-journey-actions :where(a,button){flex:1 1 150px;white-space:normal;text-align:center}}
@media(max-width:380px){.apg-journey-rail{padding:16px}.apg-journey-actions :where(a,button){flex-basis:100%}}
`;

function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function link(label,url,primary=false){return `<a${primary?' class="primary"':''} href="${esc(url)}">${esc(label)}</a>`;}
function scout(label='Ask Scout'){return `<button type="button" data-v26-scout-open>${esc(label)}</button>`;}
function categoryFromUrl(url){
  const path=url.pathname,parts=path.split('/').filter(Boolean);
  if(parts[0]==='categories'&&categories[parts[1]])return parts[1];
  if(parts[0]==='guides'){
    const slug=String(parts[1]||'').replace(/-buying-guide$/,'');if(categories[slug])return slug;
  }
  if(parts[0]==='products'&&PRODUCT_BY_SLUG.has(parts[1]))return PRODUCT_BY_SLUG.get(parts[1]).category;
  if(parts[0]==='compare'){
    if(categories[parts[1]])return parts[1];
    const pair=PAIR_BY_PATH.get(path);if(pair)return pair.category;
    const slugs=(url.searchParams.get('products')||'').split(',').map(x=>x.trim()).filter(Boolean);
    const found=slugs.map(slug=>PRODUCT_BY_SLUG.get(slug)).filter(Boolean);if(found.length&&found.every(product=>product.category===found[0].category))return found[0].category;
  }
  return null;
}
function rail(title,copy,actions){return `<section class="apg-journey-rail" data-apg-journey-continuity="v${VERSION}" aria-label="Continue this product decision"><div class="apg-journey-rail-grid"><div><span class="apg-journey-kicker">Continue your decision</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div><div class="apg-journey-actions">${actions.join('')}</div></div></section>`;}
function experience(url){
  const path=url.pathname,q=(url.searchParams.get('q')||'').trim(),category=categoryFromUrl(url),categoryLabel=category&&categories[category]?categories[category].label:null;
  if(path==='/search/'&&q){
    const lab='/decision-lab/?q='+encodeURIComponent(q);
    return rail('Turn this search into an explainable shortlist','Keep the same search intent, then make budget, must-haves and deal-breakers explicit in Decision Lab—or ask Scout to reason through what you are seeing.',[link('Continue in Decision Lab',lab,true),scout('Ask Scout about this search'),link('Open Compare','/compare/')]);
  }
  if(path==='/decision-lab/'&&(q||url.searchParams.get('category'))){
    return rail('Keep the shortlist moving','Use Compare when you have two to four real candidates, My APG when you want to keep the decision, or Scout when you want the reasoning explained conversationally.',[scout('Ask Scout to explain this',true),link('Open Compare','/compare/'),link('Open My APG','/my-apg/')]);
  }
  if(path.startsWith('/compare/')){
    const lab=category?'/decision-lab/?category='+encodeURIComponent(category):'/decision-lab/';
    return rail('Refine the trade-offs around your situation',categoryLabel?`You are comparing within ${categoryLabel}. Carry the category into Decision Lab to add budget and deal-breakers, or ask Scout to explain what actually changes the choice on this page.`:'Carry the comparison into Decision Lab or ask Scout to explain the meaningful differences before you choose.',[scout('Ask Scout about this comparison'),link('Refine in Decision Lab',lab,true),link('Open My APG','/my-apg/')]);
  }
  const productMatch=path.match(/^\/products\/([^/]+)\/$/);
  if(productMatch&&PRODUCT_BY_SLUG.has(productMatch[1])){
    const product=PRODUCT_BY_SLUG.get(productMatch[1]),lab='/decision-lab/?category='+encodeURIComponent(product.category);
    return rail(`Check ${product.name} against your situation`,'A product page explains the maintained evidence. Scout can discuss this exact model in context; Decision Lab can test the wider category against your budget and hard constraints; Compare can hold this model beside alternatives.',[scout('Ask Scout about this product'),`<button type="button" data-compare-product="${esc(product.slug)}" aria-pressed="false">Add to Compare</button>`,link('Use Decision Lab',lab,true)]);
  }
  if(category&&(/^(\/categories\/|\/guides\/)/.test(path))){
    const lab='/decision-lab/?category='+encodeURIComponent(category),compare='/compare/'+encodeURIComponent(category)+'/';
    return rail(`Turn ${categoryLabel||'this category'} research into your shortlist`,'Move from general category guidance to your own constraints without starting over. Decision Lab structures the brief, Compare shows the trade-offs, and Scout stays available for questions on this page.',[link('Build my shortlist',lab,true),link('Compare '+(categoryLabel||'products'),compare),scout('Ask Scout what matters here')]);
  }
  return '';
}
function inject(html,url){
  let out=String(html||'');if(!out||out.includes('data-apg-journey-continuity='))return out;
  const block=experience(url);if(!block)return out;
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  const mainEnd=out.lastIndexOf('</main>');
  if(mainEnd>=0)return out.slice(0,mainEnd)+`<div class="wrap">${block}</div>`+out.slice(mainEnd);
  return out.replace('</body>',`<div class="wrap">${block}</div></body>`);
}
function sendCss(req,res){res.statusCode=200;res.setHeader('Content-Type','text/css; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Decision-Journey','v'+VERSION);return res.end(req.method==='HEAD'?'':css);}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('decision journey continuity requires downstream handler');
  function handler(req,res){
    let url;try{url=new URL(req.url||'/','https://australianproductguide.au')}catch{url=new URL('/','https://australianproductguide.au')}
    if(url.pathname===CSS_PATH)return sendCss(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body,url);if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}res.setHeader('X-APG-Decision-Journey','v'+VERSION)}return end(body,...args)};
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{DECISION_JOURNEY_CONTINUITY_VERSION:VERSION,DECISION_JOURNEY_CSS_PATH:CSS_PATH,decisionJourneyCss:css,decisionJourneyExperience:experience,injectDecisionJourney:inject});
  return handler;
}

module.exports={VERSION,CSS_PATH,css,experience,inject,wrap};
