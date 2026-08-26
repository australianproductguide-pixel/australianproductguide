'use strict';

// APG Premium Mobile Decision-Commerce v112.0
// Presentation, evidence-surfacing and shopping-continuity layer only.
// This module MUST NOT change recommendation scoring, retailer weighting,
// product identity, privacy/authentication policy, or canonical decision state.
const {categories,products}=require('../data');
const {pairPages}=require('./routes');
const {esc,productVisual}=require('./ui');
const {imageStatus}=require('../data/image-provenance');
const searchDepth=require('../data/search-opportunity-depth-v104');

const VERSION='112.0';
const CSS_PATH='/assets/premium-mobile-decision-commerce-v112.css';
const JS_PATH='/assets/premium-mobile-decision-commerce-v112.js';
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));
const PRIORITY_DEPTH=new Set(Object.keys(searchDepth.categoryDepth||{}));

const arr=value=>Array.isArray(value)?value.filter(Boolean):[];
const human=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const money=value=>Number(value)>0?`A$${Number(value).toLocaleString('en-AU')}`:null;
const normalise=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function dateLabel(value){
  if(!value)return null;
  const raw=String(value).slice(0,10),d=new Date(`${raw}T00:00:00+10:00`);
  return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Sydney'});
}
function productFromPath(path){const m=String(path||'').match(/^\/products\/([^/]+)\/$/);return m?PRODUCT_BY_SLUG.get(m[1])||null:null;}
function categorySlugFromPath(path){
  const value=String(path||'');
  let m=value.match(/^\/categories\/([^/]+)(?:\/finder)?\/$/);if(m)return categories[m[1]]?m[1]:null;
  m=value.match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m)return categories[m[1]]?m[1]:null;
  m=value.match(/^\/compare\/([^/]+)\/$/);if(m)return categories[m[1]]?m[1]:null;
  const pair=pairPages.find(row=>row.path===value);return pair?pair.category:null;
}
function comparisonProducts(path,u){
  if(path==='/compare/custom/')return (u.searchParams.get('products')||'').split(',').map(x=>x.trim()).filter(x=>PRODUCT_BY_SLUG.has(x)).slice(0,4).map(x=>PRODUCT_BY_SLUG.get(x));
  const pair=pairPages.find(row=>row.path===path);return pair?[pair.a,pair.b]:[];
}
function pageContext(path,u){
  const product=productFromPath(path),categorySlug=product?product.category:categorySlugFromPath(path),compared=comparisonProducts(path,u);
  return {product,categorySlug,compared,isSearch:path==='/search/',isHome:path==='/',isCompare:path.startsWith('/compare/')};
}

function retailerState(row){
  if(!row)return {rank:0,key:'unknown',label:'Retailer pathway',detail:'Current destination needs rechecking'};
  const status=String(row.amazonMatchStatus||'').toUpperCase(),model=String(row.amazonModelMatch||'').toLowerCase();
  if(status==='EXACT_VERIFIED'||model==='exact')return {rank:5,key:'exact',label:'Exact verified destination',detail:'Exact Amazon Australia product identity verified'};
  if(status==='VARIANT_VERIFIED'||model==='verified-variant')return {rank:4,key:'variant',label:'Verified variant',detail:'Product family verified; the linked variant is explicitly identified'};
  if(row.kind==='affiliate-search'||status==='SEARCH_FALLBACK')return {rank:1,key:'fallback',label:'Model-search fallback',detail:'No exact Amazon Australia detail-page identity is being claimed'};
  if(row.exactModel===true)return {rank:5,key:'exact',label:'Exact AU retailer listing',detail:'Exact Australian retailer model or configuration verified'};
  if(row.availability==='listing-verified')return {rank:3,key:'listing',label:'Verified retailer listing',detail:'Retailer listing identity verified; current stock is not claimed'};
  if(row.url||row.affiliateUrl)return {rank:2,key:'listing',label:'Retailer pathway',detail:'Retailer destination recorded; recheck product identity and availability'};
  return {rank:0,key:'unknown',label:'Retailer pathway',detail:'Current destination needs rechecking'};
}
function retailerRows(product){
  const rows=[...arr(product.retailers),...arr(product.offers)];
  const seen=new Set();
  return rows.filter(row=>{
    if(!row)return false;
    const href=row.affiliateUrl||row.url;if(!href)return false;
    const key=`${row.retailer||''}|${href}`;if(seen.has(key))return false;seen.add(key);return true;
  });
}
function strongestRetailer(product){return retailerRows(product).map(row=>({row,state:retailerState(row)})).sort((a,b)=>b.state.rank-a.state.rank)[0]||{row:null,state:retailerState(null)};}
function priceState(product){
  const value=money(product.price),checked=dateLabel(product.lastPriceCheck);
  if(value&&checked)return {value,label:`${value} maintained price basis`,detail:`Price checked ${checked} · recheck before purchase`,live:false};
  if(value)return {value,label:`${value} maintained price basis`,detail:'APG does not claim this is a live price · recheck before purchase',live:false};
  return {value:null,label:'Live price not maintained',detail:'Open a verified retailer pathway to check the current price',live:false};
}
function matchSignals(product,query){
  const tokens=normalise(query).split(/\s+/).filter(x=>x.length>=3);if(!tokens.length)return [];
  const fields=[{value:`${product.brand} ${product.name}`},...arr(product.tags).map(value=>({value:human(value)})),{value:product.categoryLabel||product.category}];
  const out=[];
  for(const field of fields){const hay=normalise(field.value);if(tokens.some(token=>hay.includes(token)))out.push(field.value);if(out.length===2)break;}
  return [...new Set(out)];
}
function depthLabel(product){return PRIORITY_DEPTH.has(product.category)?'Priority decision area':'Maintained catalogue';}
function reviewLabel(product){
  const reviewed=dateLabel(product.lastSubstantiveReview||product.lastReviewed||product.lastSourceVerification);
  return reviewed?`Reviewed ${reviewed}`:'Review date unavailable';
}

function productCardV2(product,{query=''}={}){
  const best=arr(product.tags)[0]||'maintained fit',reasons=arr(product.highlights).slice(0,3),tradeoff=String(product.watch||'').trim();
  const retailer=strongestRetailer(product),price=priceState(product),image=imageStatus(product),matches=matchSignals(product,query);
  const retailerChecked=retailer.row&&(retailer.row.checkedAt||retailer.row.amazonVerifiedAt||retailer.row.verified)||product.lastRetailerCheck||null;
  const retailerCheckedLabel=dateLabel(retailerChecked);
  return `<article class="product-card apg112-product-card" data-apg112-product-card="${esc(product.slug)}">
    <div class="apg112-card-visual">${productVisual(product)}<span class="apg112-image-state ${image.productPhotography?'is-photo':'is-pending'}">${image.productPhotography?'Verified product photo':'Verified-photo pending'}</span></div>
    <div class="apg112-card-body">
      <div class="apg112-card-heading"><div><p class="eyebrow">${esc(product.brand)} · ${esc(depthLabel(product))}</p><h3><a href="/products/${esc(product.slug)}/">${esc(product.name)}</a></h3></div><span class="apg112-freshness">${esc(reviewLabel(product))}</span></div>
      <div class="apg112-best-for"><span>Best for when</span><strong>${esc(human(best))} matters</strong></div>
      ${reasons.length?`<ul class="apg112-reasons" aria-label="Decision reasons">${reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
      ${tradeoff?`<p class="apg112-tradeoff"><strong>Main trade-off</strong><span>${esc(tradeoff)}</span></p>`:''}
      ${matches.length?`<p class="apg112-match"><strong>Why this matched:</strong> ${matches.map(esc).join(' · ')}</p>`:''}
      <div class="apg112-commerce-line">
        <span class="apg112-offer-state is-${esc(retailer.state.key)}"><strong>${esc(retailer.state.label)}</strong><small>${esc(retailerCheckedLabel?`Identity checked ${retailerCheckedLabel}`:'Retailer check date unavailable')}</small></span>
        <span class="apg112-price-state"><strong>${esc(price.label)}</strong><small>${esc(price.detail)}</small></span>
      </div>
      <div class="apg112-card-actions">
        <a class="button primary" href="/products/${esc(product.slug)}/#where-to-buy">View offers</a>
        <button class="button secondary" type="button" data-compare-product="${esc(product.slug)}" aria-pressed="false">Compare</button>
        <button class="apg112-save" type="button" data-save-product="${esc(product.slug)}" aria-pressed="false" aria-label="Save ${esc(product.brand)} ${esc(product.name)}">♡</button>
      </div>
    </div>
  </article>`;
}

function renderOfferRow(product,row){
  const state=retailerState(row),href=row.affiliateUrl||row.url,affiliate=Boolean(row.affiliate||String(row.kind||'').startsWith('affiliate'));
  const checked=dateLabel(row.checkedAt||row.amazonVerifiedAt||row.verified||product.lastRetailerCheck),rowPrice=money(row.price),variant=row.variant||row.amazonVariantMatch||null;
  const availability=row.availability==='listing-verified'?'Listing identity verified · live stock not maintained':'Current stock not maintained by APG';
  const action=state.key==='fallback'?'Search retailer':'Open retailer';
  return `<a class="retailer-row apg112-retailer-row" href="${esc(href)}" ${affiliate?'rel="sponsored nofollow noopener"':'rel="noopener"'} target="_blank" data-apg112-retailer-state="${esc(state.key)}">
    <span class="retailer-logo">${esc((row.retailer||'R')[0])}</span>
    <span class="apg112-retailer-copy"><strong>${esc(row.retailer||'Retailer')}</strong><small class="apg112-retailer-status">${esc(state.label)}${affiliate?' · paid link':''}</small>${variant?`<small>Variant: ${esc(variant)}</small>`:''}<small>${esc(rowPrice?`${rowPrice} recorded offer · recheck before purchase`:availability)}</small><small>${esc(checked?`Identity checked ${checked}`:'Identity check date unavailable')}</small></span>
    <span class="retailer-action">${esc(action)} ↗</span>
  </a>`;
}
function retailerPanelV2(product){
  const rows=retailerRows(product),best=strongestRetailer(product),price=priceState(product);
  return `<section class="retailer-panel apg112-offer-panel" data-apg112-offer-layer="true">
    <div class="section-head compact-head"><div><p class="kicker">Where to buy</p><h2>Verified Australian retailer pathways</h2><p>Product identity first; current price and stock stay explicitly separate.</p></div><span class="independence-badge">Retailers contribute 0 recommendation points</span></div>
    <div class="apg112-offer-summary" aria-label="Retailer confidence summary">
      <div><span>Strongest identity</span><strong>${esc(best.state.label)}</strong><small>${esc(best.state.detail)}</small></div>
      <div><span>Price status</span><strong>${esc(price.label)}</strong><small>${esc(price.detail)}</small></div>
      <div><span>Availability</span><strong>Recheck at retailer</strong><small>APG does not imply live stock unless it is explicitly maintained.</small></div>
    </div>
    ${rows.length?rows.map(row=>renderOfferRow(product,row)).join(''):`<div class="notice">No verified retailer destination is currently maintained for this exact product. APG will not manufacture one.</div>`}
    <a class="retailer-row apg112-retailer-row official-source" href="${esc(product.source)}" rel="noopener" target="_blank"><span class="retailer-logo official-logo">✓</span><span class="apg112-retailer-copy"><strong>${esc(product.brand)} official product information</strong><small>Primary evidence source · non-affiliate</small><small>Use this source to verify decision-critical specifications.</small></span><span class="retailer-action">Verify specs ↗</span></a>
    <p class="fine-inline">Paid retailer links are labelled. Exact, verified-variant and model-search states are kept distinct. Prices, sellers, variants and availability can change after you leave APG.</p>
  </section>`;
}

function comparisonToolbar(compared){
  if(compared.length<2)return '';
  const identities=compared.map(product=>{const image=imageStatus(product);const visual=image.productPhotography&&image.displayUrl?`<img src="${esc(image.displayUrl)}" alt="" loading="lazy" decoding="async">`:`<span aria-hidden="true">${esc((product.brand||'P')[0])}</span>`;return `<a href="/products/${esc(product.slug)}/" class="apg112-compare-identity">${visual}<b>${esc(product.brand)} ${esc(product.name)}</b></a>`;}).join('');
  return `<aside class="apg112-compare-toolbar" data-apg112-compare-toolbar="true" aria-label="Comparison controls"><div class="apg112-compare-identities">${identities}</div><button type="button" class="apg112-differences-toggle" data-apg112-differences aria-pressed="true"><span aria-hidden="true">≠</span> Only differences</button></aside>`;
}
function productNav(product){return `<nav class="apg112-product-nav" aria-label="Product guide sections" data-apg112-product-nav="true"><span>${esc(product.brand)} ${esc(product.name)}</span><a href="#apg112-summary">Summary</a><a href="#apg112-fit">Why it fits</a><a href="#where-to-buy">Offers</a><a href="#apg112-facts">Facts</a><a href="#apg112-evidence">Evidence</a></nav>`;}
function priorityDepthRail(){
  const entries=Object.entries(searchDepth.categoryDepth||{}).filter(([slug])=>categories[slug]).slice(0,6);if(!entries.length)return '';
  return `<section class="apg112-depth-rail section" data-apg112-depth-rail="true"><div class="wrap"><div class="section-head"><div><p class="kicker">Priority decision areas</p><h2>Start where APG has deliberately deeper decision guidance</h2><p>These areas have additional curated decision questions. This is a depth-priority signal, not a claim that every completion gate is decision-grade.</p></div></div><div class="apg112-depth-grid">${entries.map(([slug,row])=>`<a href="/categories/${esc(slug)}/"><span>${esc(row.label)}</span><strong>${esc(row.intent)}</strong><small>Depth programme reviewed ${esc(dateLabel(searchDepth.REVIEWED)||'date unavailable')}</small></a>`).join('')}</div></div></section>`;
}
function categoryDepthBanner(slug){
  const row=searchDepth.categoryDepth&&searchDepth.categoryDepth[slug];if(!row)return '';
  return `<aside class="apg112-depth-banner" data-apg112-depth="priority"><div><span>Priority decision area</span><strong>Additional decision guidance maintained</strong></div><p>${esc(row.intent)} This does not imply every category-completion gate has passed or that the category is formally Decision Grade.</p></aside>`;
}
function bodyContextAttributes(html,context){
  const attrs=[`data-apg-premium-mobile-commerce="v${VERSION}"`];
  if(context.product)attrs.push(`data-apg112-product="${esc(context.product.slug)}"`);
  if(context.categorySlug)attrs.push(`data-apg112-category="${esc(context.categorySlug)}"`);
  if(context.compared.length)attrs.push(`data-apg112-compare-products="${esc(context.compared.map(x=>x.slug).join(','))}"`);
  return html.replace(/<body\b([^>]*)>/i,`<body ${attrs.join(' ')}$1>`);
}
function replaceProductCards(html,query){return html.replace(/<article class="product-card">[\s\S]*?<\/article>/g,block=>{const m=block.match(/href="\/products\/([^/]+)\//);const product=m&&PRODUCT_BY_SLUG.get(m[1]);return product?productCardV2(product,{query}):block;});}
function replaceRetailerPanel(html,product){if(!product)return html;return html.replace(/<section class="retailer-panel">[\s\S]*?<\/section>/,retailerPanelV2(product));}
function productEnhance(html,product){
  let out=html;
  out=out.replace('<section class="product-hero">','<section class="product-hero" id="apg112-summary">');
  out=out.replace(/(<section class="product-hero" id="apg112-summary">[\s\S]*?<\/section>)/,`$1${productNav(product)}`);
  out=out.replace('<div class="wrap decision-layout">','<div class="wrap decision-layout" id="apg112-fit">');
  out=out.replace('<section class="section soft-section full-bleed">','<section class="section soft-section full-bleed" id="apg112-facts">');
  out=out.replace('<aside class="evidence-box">','<aside class="evidence-box" id="apg112-evidence">');
  return out;
}
function homeEnhance(html){
  let out=html.replace(/<div class="hero-links">[\s\S]*?<\/div>/,`<div class="hero-links apg112-home-primary" data-apg112-home-primary="true"><a class="button secondary" href="/search/">Search products</a><a class="button primary" href="/decision-lab/">Describe what I need</a><a class="button secondary" href="/categories/">Browse categories</a></div>`);
  out=out.replace('<div class="category-grid premium-category-grid">','<div class="category-grid premium-category-grid" data-apg112-home-categories="true">');
  const rail=priorityDepthRail();
  if(rail&&!out.includes('data-apg112-depth-rail')){
    const marker='<section class="trust-strip',pos=out.indexOf(marker);
    out=pos>=0?out.slice(0,pos)+rail+out.slice(pos):out+rail;
  }
  return out;
}
function categoryEnhance(html,slug){const banner=categoryDepthBanner(slug);if(!banner)return html;return html.replace(/(<section class="category-hero[\s\S]*?<\/section>)/,`$1${banner}`);}
function compareEnhance(html,compared){
  const toolbar=comparisonToolbar(compared);if(!toolbar)return html;
  let out=html;
  if(out.includes('comparison-summary'))out=out.replace(/(<section class="[^"]*comparison-summary[^"]*">[\s\S]*?<\/section>)/,`<div class="apg112-decision-first"><span>Decision first</span><strong>Start with who should choose each product, then inspect only the differences that can change the decision.</strong></div>$1${toolbar}`);
  else out=out.replace(/(<div class="compare-wrap">)/,`${toolbar}$1`);
  return out;
}
function injectAssets(html){let out=html;if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);return out;}
function transform(html,path,u){
  let out=String(html||'');if(!out||out.includes(`data-apg-premium-mobile-commerce="v${VERSION}"`))return out;
  const context=pageContext(path,u);
  out=replaceProductCards(out,context.isSearch?u.searchParams.get('q')||'':'');
  if(context.product){out=replaceRetailerPanel(out,context.product);out=productEnhance(out,context.product);}
  if(context.isHome)out=homeEnhance(out);
  if(context.categorySlug&&path.startsWith('/categories/')&&!path.endsWith('/finder/'))out=categoryEnhance(out,context.categorySlug);
  if(context.isCompare&&context.compared.length>=2)out=compareEnhance(out,context.compared);
  out=bodyContextAttributes(out,context);
  out=injectAssets(out);
  return out;
}
function wrap(downstream){
  return function premiumMobileCommerceV112(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader('Content-Type')||'').toLowerCase();
      if(req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')&&(typeof body==='string'||Buffer.isBuffer(body))){
        const original=Buffer.isBuffer(body)?body.toString('utf8'):body;let u;
        try{u=new URL(req.url,'https://australianproductguide.au');}catch{u=new URL('https://australianproductguide.au/');}
        const next=transform(original,u.pathname,u);if(next!==original){body=next;res.removeHeader('Content-Length');}res.setHeader('X-APG-Premium-Mobile-Commerce',`v${VERSION}`);
      }
      return end(body,...args);
    };
    return downstream(req,res);
  };
}

module.exports={VERSION,CSS_PATH,JS_PATH,PRODUCT_BY_SLUG,PRIORITY_DEPTH,pageContext,retailerState,retailerRows,strongestRetailer,priceState,matchSignals,productCardV2,retailerPanelV2,comparisonToolbar,productNav,priorityDepthRail,categoryDepthBanner,transform,wrap};
