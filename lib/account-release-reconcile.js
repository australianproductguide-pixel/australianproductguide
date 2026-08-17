const app=require('./account-platform');
const {upgradeNavigation}=require('./navigation-platform');
const {products,categories}=require('../data');
const {brands,indexableRoutes}=require('./routes');

const PRODUCT_COUNT=products.length;
const CATEGORY_COUNT=Object.keys(categories).length;
const BRAND_COUNT=brands.length;
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));

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
