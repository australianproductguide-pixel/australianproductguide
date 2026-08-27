'use strict';

// Final Consumer Intelligence v47 layer. This remains lightweight SSR/progressive
// enhancement: no framework, no opaque client model and no commercial scoring.
const downstream=require('./brand-system-v46');
const decisionLayer=require('./consumer-decision-v47');
const engine=decisionLayer.install();
const graph=require('./product-intelligence-v41');
const observability=require('./intelligence-observability-v27');
const images=require('../data/product-images');
const categoryImages=require('../data/category-editorial-images-v45');
const categoryReview=require('../data/category-editorial-final-review-v45.json');
const amazon=require('../data/amazon-au-mappings-v33');
const {products,categories}=require('../data');

const VERSION='47';
const CSS_PATH='/assets/consumer-intelligence-v47.css';
const API_PATH='/api/intelligence/consumer-v47';
const MARKER='data-consumer-intelligence-v47="true"';
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));

// Consumer Intelligence v47 follows the same current APG visual contract as v46:
// blue/navy standard UI, teal only as a controlled accent, green only for genuine
// positive/success state, and the homepage maintained-research proof strip as the
// sole approved yellow/gold heritage surface.
const CSS=`
[data-consumer-intelligence-v47=true] .ci47-panel{margin:28px 0;border:1px solid #E2E8F0;border-radius:20px;background:linear-gradient(145deg,#EFF6FF,#FFFFFF);padding:22px;box-shadow:0 10px 30px rgba(15,23,42,.06);color:#1E293B}
[data-consumer-intelligence-v47=true] .ci47-panel h2{margin:.2rem 0 .55rem;font-size:clamp(1.35rem,2vw,1.75rem);color:#0F172A}
[data-consumer-intelligence-v47=true] .ci47-panel p{max-width:76ch;color:#475569}
[data-consumer-intelligence-v47=true] .ci47-proof{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
[data-consumer-intelligence-v47=true] .ci47-proof span{display:inline-flex;align-items:center;min-height:32px;padding:6px 10px;border:1px solid #E2E8F0;border-radius:999px;background:#FFFFFF;font-size:.84rem;line-height:1.2;color:#475569}
[data-consumer-intelligence-v47=true] .ci47-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:15px}
[data-consumer-intelligence-v47=true] .ci47-actions :where(a,button){display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 14px;border-radius:12px;border:1px solid #2563EB;background:#FFFFFF;color:#1D4ED8;text-decoration:none;font:inherit;font-weight:700;cursor:pointer}
[data-consumer-intelligence-v47=true] .ci47-actions a:first-child{background:#2563EB;color:#FFFFFF}
[data-consumer-intelligence-v47=true] .ci47-actions :where(a,button):hover{background:#DBEAFE;color:#0F172A;border-color:#93C5FD}
[data-consumer-intelligence-v47=true] .ci47-actions a:first-child:hover{background:#1D4ED8;color:#FFFFFF;border-color:#1D4ED8}
[data-consumer-intelligence-v47=true] .ci47-actions :where(a,button):focus-visible{outline:3px solid rgba(37,99,235,.24);outline-offset:3px}
[data-consumer-intelligence-v47=true] .ci47-note{display:block;margin-top:12px;color:#64748B;font-size:.82rem;line-height:1.45}
[data-consumer-intelligence-v47=true] .ci47-handoff{margin:20px 0;padding:14px 16px;border:1px solid #BFDBFE;border-radius:15px;background:#EFF6FF;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;color:#1E293B}
[data-consumer-intelligence-v47=true] .ci47-handoff strong{display:block;margin-bottom:3px;color:#0F172A}
[data-consumer-intelligence-v47=true] .ci47-handoff a{font-weight:800;color:#1D4ED8}
@media(max-width:700px){[data-consumer-intelligence-v47=true] .ci47-panel{padding:18px;border-radius:16px}[data-consumer-intelligence-v47=true] .ci47-actions{display:grid;grid-template-columns:1fr}[data-consumer-intelligence-v47=true] .ci47-actions :where(a,button){width:100%}}
`;

function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function requestUrl(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,type,body,head=false){res.statusCode=status;res.setHeader('Content-Type',type);res.setHeader('Cache-Control',type.includes('json')?'no-store':'public, max-age=3600');if(type.includes('json'))res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':body);}

function consumerSnapshot(){
  const obs=observability.snapshot(),imagery=observability.imagerySnapshot(),retailers=observability.retailerSnapshot();
  const maintainedCategories=Object.keys(categories).length,mappedCategoryImages=Object.keys(categoryImages).length;
  const categoryImagery={
    maintainedCategories,
    mappedCategoryImages,
    coveragePct:maintainedCategories?Math.round(mappedCategoryImages/maintainedCategories*1000)/10:0,
    finalReviewRequired:Number(categoryReview.summary?.reviewRequired)||0,
    manuallyCurated:Number(categoryReview.summary?.manualCurated)||0,
    premiumAuto:Number(categoryReview.summary?.premiumAuto)||0,
    policy:'Decorative editorial category imagery only; never product evidence or endorsement.'
  };
  const releaseGate={
    pass:maintainedCategories===mappedCategoryImages&&categoryImagery.finalReviewRequired===0&&imagery.invalid===0&&retailers.exactOfferCount>=57&&retailers.productsWithExactOffers>=51&&retailers.verifiedRetailers>=23&&obs.recommendation?.affiliateRecommendationWeight===0,
    requirements:['Every maintained category has reviewed editorial imagery','No invalid verified product-image record','At least 57 exact Australian retailer/manufacturer destinations across at least 51 products','At least 23 verified retailer/manufacturer sources','Retailer and affiliate participation remain zero recommendation weight']
  };
  return {
    version:'consumer-intelligence-v47',
    catalogue:{products:products.length,categories:maintainedCategories},
    categoryImagery,
    productImagery:imagery,
    retailers,
    recommendation:{engineVersion:engine.ENGINE_VERSION,consumerDecisionVersion:decisionLayer.VERSION,commercialRecommendationWeight:0},
    continuousImprovement:{...obs.governance,learningMode:'aggregate-outcome-observation',rawSearchTextTelemetry:false,rawScoutTranscriptPersistence:false},
    releaseGate
  };
}

function retailerProof(product,node){
  const offers=(node.commerce?.offers||[]),exactChecks=offers.filter(x=>x.freshness==='current-check'&&x.exactModel&&x.url).length;
  const amazonRecord=amazon.getAmazonAuRecord(product);
  // Preserve verified-variant semantics before a broader exact-listing count. A current
  // exact Australian retailer listing may still be for one colour/configuration of a
  // family-level APG product and must not silently become a generic exact-product claim.
  if(amazonRecord?.matchStatus==='VARIANT_VERIFIED')return exactChecks>0?`Verified retailer variant pathway · ${exactChecks} current exact retailer listing${exactChecks===1?'':'s'} for a specific variant`:'Verified retailer variant pathway';
  if(exactChecks>0)return `${exactChecks} current exact-model retailer check${exactChecks===1?'':'s'}`;
  if(amazonRecord?.matchStatus==='EXACT_VERIFIED')return 'Verified exact Amazon Australia pathway';
  return 'Retailer destination requires exact-model confirmation';
}

function productPanel(url){
  const m=url.pathname.match(/^\/products\/([a-z0-9-]+)\/$/);if(!m)return '';
  const product=PRODUCT_BY_SLUG.get(m[1]),node=graph.knowledgeNode(m[1]);if(!product||!node)return '';
  const category=categories[product.category],facts=Object.keys(node.factEvidence||{}).length;
  const evidenceTier=String(node.evidence?.tier||'').toLowerCase();
  const evidenceProof=facts>0?`${facts} maintained fact-level evidence point${facts===1?'':'s'}`:evidenceTier==='deep'?'Deep maintained evidence':evidenceTier==='starter'?'Starter maintained evidence':'Maintained evidence';
  const retailerState=retailerProof(product,node);
  const image=images.imageFor(product),imageErrors=image?images.validationErrors(product,image):[];
  const imageReady=!!image&&image.imageStatus==='verified'&&image.imageVerified&&imageErrors.length===0;
  const closest=node.relationships?.comparable?.[0]||null;
  const brief=[category?.label||product.categoryLabel,`considering ${product.brand} ${product.name}`].filter(Boolean).join(' ');
  const decisionUrl=`/decision-lab/?q=${encodeURIComponent(brief)}&category=${encodeURIComponent(product.category)}`;
  const searchUrl=`/search/?q=${encodeURIComponent(category?.label||product.categoryLabel||product.name)}`;
  const compare=closest?`<a href="/compare/custom/?products=${encodeURIComponent(product.slug)},${encodeURIComponent(closest.slug)}">Compare closest alternative</a>`:'<a href="/compare/">Open Compare</a>';
  return `<section class="section ci47-section" aria-label="Continue this product decision"><div class="wrap"><div class="ci47-panel"><p class="kicker">Connected decision intelligence</p><h2>Keep this decision moving</h2><p>Carry this maintained product context into APG’s other decision tools instead of starting again. Decision Lab can apply your budget, must-haves and priorities; Compare can expose the trade-offs against a close maintained alternative; Scout can explain this exact product in the context of the page you are viewing.</p><div class="ci47-proof"><span>${esc(evidenceProof)}</span><span>${esc(retailerState)}</span><span>Product photography: ${imageReady?'verified authorised image':'awaiting an authorised exact-product source'}</span></div><div class="ci47-actions"><a href="${esc(decisionUrl)}">Refine in Decision Lab</a>${compare}<button type="button" data-v26-scout-open>Ask Scout about this product</button><a href="${esc(searchUrl)}">Search ${esc(category?.label||product.categoryLabel||'this category')}</a></div><small class="ci47-note">Retailer coverage, affiliate status and image availability contribute zero recommendation points. Exact and verified-variant retailer states are kept distinct; missing evidence stays visible rather than being guessed.</small></div></div></section>`;
}

// Retained only as a compatibility helper for older tests/consumers. Search and Decision Lab
// handoff presentation is now owned by Decision Journey Continuity v108 so customers see one
// clear next-step surface rather than duplicate guidance blocks.
function handoffPanel(url){
  const q=String(url.searchParams.get('q')||'').trim();if(!q)return '';
  if(url.pathname==='/search/')return `<section class="section"><div class="wrap"><div class="ci47-handoff"><div><strong>Want a more explicit decision?</strong><span>Carry this exact search brief into Decision Lab for hard constraints, priorities, alternatives and criterion-level reasoning.</span></div><a href="/decision-lab/?q=${encodeURIComponent(q)}">Open this brief in Decision Lab →</a></div></div></section>`;
  if(url.pathname==='/decision-lab/')return `<section class="section"><div class="wrap"><div class="ci47-handoff"><div><strong>Want to widen the discovery set?</strong><span>Carry this exact decision brief into APG Search while keeping the same maintained catalogue context.</span></div><a href="/search/?q=${encodeURIComponent(q)}">Search this same brief →</a></div></div></section>`;
  return '';
}

function transform(html,url){
  let out=String(html||'');if(!/<html[\s>]/i.test(out))return out;
  if(!out.includes(MARKER))out=out.replace(/<body\b([^>]*)>/i,`<body ${MARKER}$1>`);
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  const product=productPanel(url);
  if(product&&!out.includes('Connected decision intelligence'))out=out.replace('</main>',`${product}</main>`);
  return out;
}

function handler(req,res){
  const url=requestUrl(req),head=req.method==='HEAD';
  if(url.pathname===CSS_PATH)return send(res,200,'text/css; charset=utf-8',CSS,head);
  if(url.pathname===API_PATH)return send(res,200,'application/json; charset=utf-8',JSON.stringify(consumerSnapshot()),head);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){const next=transform(body,url);if(next!==body){body=next;try{res.removeHeader('Content-Length');}catch{}}}
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,{VERSION,CSS_PATH,API_PATH,MARKER,CSS,consumerSnapshot,retailerProof,productPanel,handoffPanel,transform,downstream});
module.exports=handler;
