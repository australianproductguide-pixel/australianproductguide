const app=require('./account-platform');
const {upgradeNavigation}=require('./navigation-platform');
const {products,categories}=require('../data');
const {brands,indexableRoutes}=require('./routes');

const PRODUCT_COUNT=products.length;
const CATEGORY_COUNT=Object.keys(categories).length;
const BRAND_COUNT=brands.length;
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));
const CONTACT_EMAIL='contact@australianproductguide.au';
const CONTACT_LINK=`<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;

function reconcileStarterEvidence(out,path){
  const match=path.match(/^\/products\/([^/]+)\/$/);
  if(!match)return out;
  const p=PRODUCT_BY_SLUG.get(match[1]);
  if(!p||p.evidenceTier!=='starter')return out;
  const checked=p.lastSourceVerification||p.firstResearched||'2026-08-16';
  out=out.replace(`<strong>${p.brand} official product information</strong><small>Primary evidence source · non-affiliate</small>`,`<strong>Model discovery reference</strong><small>Retailer discovery source · manufacturer evidence pending</small>`);
  out=out.replace(`>${p.brand} product information ↗</a>`,`>Model discovery reference ↗</a>`);
  out=out.replace('<dt>Last reviewed</dt><dd>2026-08-15</dd>',`<dt>Source identity checked</dt><dd>${checked}</dd>`);
  out=out.replace('Material feature claims are anchored to manufacturer evidence.','This starter record does not yet claim manufacturer-verified feature depth. Verify the exact Australian model and specifications before purchase.');
  return out;
}

function reconcileNotFound(out){
  // Error states should retain the current navigation and trust contract while preserving their real 404 status.
  out=upgradeNavigation(out);
  if(!out.includes('/assets/navigation-v8.css'))out=out.replace('</head>','<link rel="stylesheet" href="/assets/navigation-v8.css"></head>');
  if(!out.includes('/assets/navigation-v8.js'))out=out.replace('</body>','<script src="/assets/navigation-v8.js" defer></script></body>');
  out=out.replace('<strong>As an Amazon Associate, Australian Product Guide may earn from qualifying purchases.</strong>','<strong>As an Amazon Associate I earn from qualifying purchases.</strong>');
  return out;
}

function reconcileContactChannels(out,path){
  if(path==='/contact/'){
    out=out.replace('<div class="policy-meta"><span class="pill good">Effective 17 August 2026</span><span class="pill">Last updated 17 August 2026</span></div>','<div class="policy-meta"><span class="pill good">Effective 21 August 2026</span><span class="pill">Last updated 21 August 2026</span></div>');
    out=out.replace('If you identify an incorrect model, feature, source, retailer destination, availability statement, image provenance issue or commercial disclosure, the intended response is evidence-first: verify the issue, correct the structured record and re-check any comparison or finder output affected. See the <a href="/corrections-policy/">Corrections Policy</a>.',`If you identify an incorrect model, feature, source, retailer destination, availability statement, image provenance issue or commercial disclosure, email ${CONTACT_LINK}. Australian Product Guide will verify the issue, correct the structured record where required and re-check any comparison or finder output affected. See the <a href="/corrections-policy/">Corrections Policy</a>.`);
    out=out.replace('A separate public business email address has not yet been activated. A dedicated venture contact address and documented privacy/complaints workflow should be introduced before broader outreach or significant public feedback collection.',`Business, media, retailer and general enquiries can be sent to ${CONTACT_LINK}. This is Australian Product Guide’s dedicated Google Workspace contact address.`);
    out=out.replace('Australian Product Guide uses minimal account data only when a shopper chooses optional My Australian Product Guide sync. Synced records are user-owned under Row Level Security and self-service deletion is available. Performance measurement is privacy-minimised and does not intentionally collect query strings, email addresses or persistent behavioural identifiers. See the <a href="/privacy/">Privacy Policy</a> for current detail.',`Australian Product Guide uses minimal account data only when a shopper chooses optional My Australian Product Guide sync. Synced records are user-owned under Row Level Security and self-service deletion is available. Performance measurement is privacy-minimised and does not intentionally collect query strings, email addresses or persistent behavioural identifiers. Privacy, access, correction and complaint enquiries can be sent to ${CONTACT_LINK}. See the <a href="/privacy/">Privacy Policy</a> for current detail.`);
  }
  if(path==='/about/'){
    out=out.replace('A dedicated public venture contact channel has not yet been activated. APG will not publish a private personal address merely to make the site appear larger. The current <a href="/contact/">Contact page</a> explains the correction and retailer-order boundaries.',`Australian Product Guide’s dedicated public business contact is ${CONTACT_LINK}. See the <a href="/contact/">Contact page</a> for correction, privacy and retailer-order boundaries.`);
  }
  if(path==='/privacy/'){
    out=out.replace('A dedicated venture privacy contact and documented access/correction/complaint process remains a planned governance uplift as identifiable information collection grows.',`Privacy, access, correction and complaint enquiries can be sent to ${CONTACT_LINK}. Australian Product Guide will continue to strengthen the documented privacy workflow as identifiable information collection grows.`);
    out=out.replace('A dedicated venture privacy channel should be activated before material identifiable data collection.',`Privacy, access, correction and complaint enquiries can be sent to ${CONTACT_LINK}.`);
  }
  // Keep the business contact discoverable from every page without replacing the governed Contact route.
  if(!out.includes(`mailto:${CONTACT_EMAIL}`)){
    out=out.replace('<a href="/contact/">Get in touch</a>',`<a href="/contact/">Get in touch</a><a href="mailto:${CONTACT_EMAIL}">Email us</a>`);
  }
  return out;
}

function reconcileHtml(html,path){
  let out=String(html||'');

  // Keep Australian identity explicit for social/answer-engine parsers without duplicating metadata.
  if(!out.includes('property="og:locale"')){
    out=out.replace('<meta property="og:type" content="website">','<meta property="og:type" content="website"><meta property="og:locale" content="en_AU">');
  }

  // Navigation statistics use canonical brand entities/routes rather than raw spelling variants.
  out=out.replace(/<strong>\d+<\/strong><span>brands<\/span>/g,`<strong>${BRAND_COUNT}</strong><span>brands</span>`);
  out=out.replace(/<small>\d+ brands<\/small>/g,`<small>${BRAND_COUNT} brands</small>`);

  if(path==='/my-apg/'){
    out=out.replace('<title>My Australian Product Guide | Private Product Decision Workspace</title>','<title>My Australian Product Guide | Save & Sync Product Research</title>');
    out=out.replace('content="A browser-local workspace for saved products, comparison shortlists and recent Australian Product Guide decisions."','content="Save products, comparisons and decision research locally or sync them across devices with an optional Australian Product Guide account."');
    out=out.replace('content="My Australian Product Guide | Private Product Decision Workspace"','content="My Australian Product Guide | Save & Sync Product Research"');
  }
  if(path==='/sitemap/'){
    // Platform v5 historically emitted this interpolation token from a single-quoted HTML fragment. Reconcile it to the live canonical registry value.
    out=out.replace('<strong>${indexableRoutes.length}</strong>',`<strong>${indexableRoutes.length}</strong>`);
  }
  if(path==='/privacy/'){
    out=out.replace('Australian Product Guide does not operate checkout, payment-card capture, newsletter signup or a public free-text contact form. An account is optional and is not required to browse, search, compare or use Decision Lab.','Australian Product Guide does not operate checkout or payment-card capture. It provides an optional account and a separate optional preference for future Australian Product Guide product-research emails; neither is required to browse, search, compare or use Decision Lab. APG does not currently operate a public free-text contact form.');
    out=out.replace('A dedicated venture privacy contact and documented access/correction/complaint process should be activated as identifiable information collection grows.','Australian Product Guide provides self-service account and update-preference controls. A dedicated venture privacy contact and documented access/correction/complaint process remains a planned governance uplift as identifiable information collection grows.');
  }
  if(path==='/brands/'){
    out=out.replace(/Browse the 16 brands represented in (?:APG|Australian Product Guide)[’']s 37-product evidence set\. Inclusion is editorial, not a partnership signal\./g,`Browse the ${BRAND_COUNT} canonical brands represented across Australian Product Guide’s ${PRODUCT_COUNT}-product maintained catalogue. Inclusion is editorial, not a partnership signal.`);
  }
  if(path==='/categories/'){
    out=out.replace('Four categories are fully maintained today. Wider pathways stay out of search indexes until their evidence and maintenance workflow is ready.',`Browse ${CATEGORY_COUNT} populated Australian product categories. Coverage depth varies by category and is disclosed through each product’s evidence status.`);
    out=out.replace('<p class="kicker">Live now</p><h2>Maintained comparison categories</h2>',`<p class="kicker">Current coverage</p><h2>${CATEGORY_COUNT} populated comparison categories</h2>`);
    out=out.replace('<p class="kicker">Research roadmap</p><h2>48 category pathways</h2><p>Research-queue pages are deliberately noindex until APG can support a credible Australian dataset.</p>',`<p class="kicker">Coverage map</p><h2>${CATEGORY_COUNT} populated category pathways</h2><p>Every listed pathway currently has a maintained product set; evidence depth and retailer coverage still vary by category.</p>`);
  }
  out=reconcileContactChannels(out,path);
  out=reconcileStarterEvidence(out,path);
  return out;
}

function reconcileXml(xml,path){
  let out=String(xml||'');
  if(path==='/sitemap.xml'){
    // A hard-coded build date is not a trustworthy page-modification signal. Omit lastmod until per-URL provenance is maintained.
    out=out.replace(/<lastmod>2026-08-16<\/lastmod>/g,'');
  }
  return out;
}

function reconcileJavascript(js,path){
  let out=String(js||'');
  if(path==='/assets/account-platform.js'){
    // The account asset is generated from a server-side template literal. Keep visible possessive copy syntax-safe in the emitted JavaScript.
    out=out.replace("Australian Product Guide's Sydney-hosted Supabase project",'Australian Product Guide’s Sydney-hosted Supabase project');
  }
  return out;
}

module.exports=(req,res)=>{
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'){
      if(type.startsWith('text/html')&&(res.statusCode===200||res.statusCode===404)){
        if(res.statusCode===404)body=reconcileNotFound(body);
        body=reconcileHtml(body,path);
      }else if(res.statusCode===200&&type.startsWith('application/xml'))body=reconcileXml(body,path);
      else if(res.statusCode===200&&type.startsWith('application/javascript'))body=reconcileJavascript(body,path);
    }
    return originalEnd(body,...args);
  };
  return app(req,res);
};
