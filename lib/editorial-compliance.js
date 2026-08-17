const app=require('./canonical-domain');
const {categories,products}=require('../data');
const {brands,pairPages,indexableRoutes}=require('./routes');

const REVIEW_DATE='17 August 2026';
const AMAZON_STATEMENT='As an Amazon Associate I earn from qualifying purchases.';
const PRODUCT_COUNT=products.length;
const CATEGORY_COUNT=Object.keys(categories).length;
const BRAND_COUNT=brands.length;
const COMPARISON_COUNT=pairPages.length;
const ROUTE_COUNT=indexableRoutes.length;
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));

function formatDate(value){
  if(!value)return '';
  const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return String(value);
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${Number(m[3])} ${months[Number(m[2])-1]} ${m[1]}`;
}
function categoryForPath(path){const m=path.match(/^\/categories\/([^/]+)\/$/);return m?categories[m[1]]:null;}
function guideCategory(path){const m=path.match(/^\/guides\/([^/]+)-buying-guide\/$/);return m?categories[m[1]]:null;}
function finderCategory(path){const m=path.match(/^\/categories\/([^/]+)\/finder\/$/);return m?categories[m[1]]:null;}
function productForPath(path){const m=path.match(/^\/products\/([^/]+)\/$/);return m?PRODUCT_BY_SLUG.get(m[1]):null;}
function evidenceLabel(c){
  if(!c)return 'Evidence depth varies by product';
  const tiers=new Set((c.products||[]).map(p=>p.evidenceTier||c.evidenceTier||'starter'));
  if(tiers.size>1)return 'Evidence depth varies by product';
  const tier=[...tiers][0];
  if(tier==='deep')return 'Deep desk research';
  if(tier==='manufacturer-verified')return 'Manufacturer-verified model evidence';
  return 'Starter evidence';
}
function evidenceCopy(c){
  if(!c)return 'Evidence depth, source type and freshness are disclosed on individual product pages.';
  const starter=(c.products||[]).filter(p=>(p.evidenceTier||c.evidenceTier)==='starter').length;
  if(starter===c.products.length)return `This category currently contains ${c.products.length} maintained starter-evidence records. Product identity and discovery sources are disclosed, while deeper Australian manufacturer/specification verification remains in progress. Verify the exact model, specifications, warranty, seller, price and availability before purchase.`;
  if(starter>0)return `This category contains ${c.products.length} maintained records with mixed evidence depth. ${starter} currently use starter evidence; each product page discloses its source and verification status. Commercial relationships contribute zero recommendation points.`;
  return `This category contains ${c.products.length} maintained records with source and testing status disclosed on each product page. Commercial relationships contribute zero recommendation points.`;
}
function productEvidenceDate(p){return formatDate(p?.lastSourceVerification||p?.lastSubstantiveReview||p?.firstResearched||p?.lastReviewed)||REVIEW_DATE;}
function productEvidenceLabel(p){return p?.evidenceTier==='starter'?'Source identity checked':'Evidence checked';}

function globalEditorial(out){
  return String(out||'')
    .replace(/As an Amazon Associate,?\s*Australian Product Guide may earn from qualifying purchases\./g,AMAZON_STATEMENT)
    .replace(/As an Amazon Associate,?\s*APG may earn from qualifying purchases\./g,AMAZON_STATEMENT)
    .replace(/<span class="pill good">Effective 16 August 2026<\/span><span class="pill">Last updated 16 August 2026<\/span>/g,`<span class="pill good">Effective 17 August 2026</span><span class="pill">Last updated 17 August 2026</span>`)
    .replace(/37 products across four categories/g,`${PRODUCT_COUNT} maintained products across ${CATEGORY_COUNT} populated categories`)
    .replace(/37-product/g,`${PRODUCT_COUNT}-product`)
    .replace(/four live categories/g,`${CATEGORY_COUNT} populated categories`)
    .replace(/16 maintained brands/g,`${BRAND_COUNT} maintained brands`)
    .replace(/16 brands represented/g,`${BRAND_COUNT} brands represented`)
    .replace(/139 canonical research routes/g,`${ROUTE_COUNT} canonical research routes`)
    .replace(/56 prepared head-to-heads/g,`${COMPARISON_COUNT} prepared head-to-heads`)
    .replace(/Best-value alternative/g,'Value-focused alternative')
    .replace(/<p class="eyebrow">Best match for your answers<\/p>/g,'<p class="eyebrow">Closest match in APG’s maintained set</p>')
    .replace(/Fit score is a shortlist signal, not a performance rating\./g,'Fit score is a shortlist signal within APG’s maintained set, not a performance rating or a whole-of-market claim.');
}

function reviewCategory(out,c){
  if(!c)return out;
  const label=evidenceLabel(c),copy=evidenceCopy(c);
  out=out.replace(/<span class="independence-badge">Reviewed 15 Aug 2026<\/span>/g,`<span class="independence-badge">${label}</span>`);
  out=out.replace(/<p>This category contains \d+ maintained records reviewed against primary manufacturer evidence\. Commercial relationships contribute zero recommendation points\.<\/p>/g,`<p>${copy}</p>`);
  out=out.replace(/<h3>\d+ maintained products<\/h3><p>Reviewed against primary manufacturer evidence\.<\/p>/g,`<h3>${c.products.length} maintained products</h3><p>${copy}</p>`);
  out=out.replace(/<strong>\d+ maintained products<\/strong><span>Evidence \+ comparison \+ finder \+ retailer pathways<\/span>/g,`<strong>${c.products.length} maintained products</strong><span>${label} · comparison · finder · retailer pathways</span>`);
  return out;
}

function reviewProduct(out,p){
  if(!p)return out;
  const date=productEvidenceDate(p),label=productEvidenceLabel(p);
  out=out.replace(/<span>Reviewed 15 Aug 2026<\/span>/g,`<span>${label} ${date}</span>`);
  out=out.replace(/<dt>Last reviewed<\/dt><dd>15 August 2026<\/dd>/g,`<dt>${label}</dt><dd>${date}</dd>`);
  if(p.evidenceTier==='starter'){
    out=out.replace(/These are documented characteristics, not a claim of hands-on performance testing\./g,'These are starter-evidence decision signals, not hands-on performance findings. Confirm the exact Australian model and current specifications before purchase.');
    out=out.replace(/<p class="kicker">Why consider it<\/p><h2>Who this product is most likely to suit<\/h2>/g,'<p class="kicker">Research starting point</p><h2>Who this product may be worth investigating</h2>');
  }
  return out;
}

function reviewPrivacy(out){
  const current=`<div class="notice apg-current-practice"><strong>Current data practices · ${REVIEW_DATE}.</strong> Core browsing, search, comparison and recommendation tools work without an account. My APG accounts are optional and can sync selected workspace data. Google Analytics is opt-in and is not loaded until a visitor allows analytics; advertising storage and personalisation remain off. APG also uses privacy-minimised first-party performance measurement. No account or analytics choice changes product suitability or retailer ranking.</div>`;
  if(!out.includes('apg-current-practice')){
    const marker='<p class="policy-lead">';
    const at=out.indexOf(marker);
    if(at>=0){const end=out.indexOf('</p>',at);if(end>=0)out=out.slice(0,end+4)+current+out.slice(end+4);}
  }
  out=out.replace(/The current APG application code does not include a first-party behavioural analytics or advertising-pixel implementation\.[^<]*If APG later introduces analytics or advertising technology, this policy and any consent\/notice controls will need to be reviewed before activation\./g,'APG does not use advertising pixels or cross-site tracking. Google Analytics is optional: analytics storage is denied by default and the analytics library is loaded only after the visitor allows analytics. Visitors can choose Necessary only and can reopen Cookie preferences from the footer.');
  out=out.replace(/APG does not operate checkout, payment-card capture, newsletter signup or a public free-text contact form\./g,'APG does not operate checkout, payment-card capture or a public free-text contact form. Any product-research email preference is separate, optional and must be based on a valid consent process.');
  return out;
}

function reviewAffiliate(out){
  out=out.replace(/<p><strong>As an Amazon Associate I earn from qualifying purchases\.<\/strong><\/p>/g,`<div class="notice"><strong>${AMAZON_STATEMENT}</strong> Amazon affiliate links are paid links and are labelled near the relevant action. Affiliate status, commission opportunity and retailer participation contribute zero points to suitability or recommendation scoring.</div>`);
  return out;
}

function reviewCoverage(out){
  return out
    .replace(/APG maintains \d+ products across [^.]+\. Maintained categories have structured product records, comparison routes, buying guidance and recommendation journeys\./g,`APG currently maintains ${PRODUCT_COUNT} products across ${CATEGORY_COUNT} populated categories. Coverage depth varies by category and product; evidence tier, source type and retailer verification are disclosed rather than presented as equivalent.`)
    .replace(/A wider set of category pathways exists for future evaluation\. These remain noindex until APG can define the decision factors, establish an Australian evidence set and maintain changes responsibly\./g,'Published category pathways currently contain maintained catalogue records. New categories should only become indexable after APG can define the buying decision, maintain an Australian evidence set and support responsible freshness controls.');
}

function reviewUpdates(out){
  if(out.includes('17 August 2026 — editorial, compliance and discovery review'))return out;
  const marker='<p class="policy-lead">';
  const at=out.indexOf(marker);if(at<0)return out;const end=out.indexOf('</p>',at);if(end<0)return out;
  const section=`<h2 id="aug17-review">17 August 2026 — editorial, compliance and discovery review</h2><p>APG’s current catalogue, discovery architecture and trust content were reviewed against the live operating model. Site-wide copy now distinguishes starter evidence from deeper manufacturer-backed research, uses current evidence dates where available, strengthens Amazon paid-link disclosures, clarifies optional account and analytics practices, and avoids presenting the maintained catalogue as whole-of-market coverage.</p><p><strong>Current scope:</strong> ${PRODUCT_COUNT} maintained products, ${CATEGORY_COUNT} populated categories, ${BRAND_COUNT} represented brands and ${COMPARISON_COUNT} prepared head-to-head comparison routes. These figures are derived from the current structured catalogue rather than manually maintained marketing claims.</p>`;
  return out.slice(0,end+4)+section+out.slice(end+4).replace('<h2 id="phase4">16 August 2026 — Phase 4 premium discovery release</h2>','<h2 id="phase4">Historical · 16 August 2026 — Phase 4 premium discovery release</h2>');
}

function reviewContact(out){
  return out
    .replace(/Australian Product Guide currently keeps its public data footprint deliberately small\. There is no public account system, newsletter form or general-purpose contact form\./g,'Australian Product Guide keeps its public data footprint deliberately small. My APG accounts are optional; APG does not currently operate a general-purpose public free-text contact form.')
    .replace(/APG currently collects very little identifiable user information in its own application\. If identifiable data collection is introduced, the public contact process will be updated alongside the <a href="\/privacy\/">Privacy Policy<\/a>\./g,'APG collects limited identifiable information when a shopper chooses to create an account or opts into a feature that requires contact details. The <a href="/privacy/">Privacy Policy</a> explains current collection, storage, analytics choices and account controls.');
}

function reviewAbout(out){
  return out.replace(/APG currently maintains \d+ products across [^.]+\. It does not invent scale:/g,`APG currently maintains ${PRODUCT_COUNT} products across ${CATEGORY_COUNT} populated categories, with evidence depth disclosed rather than treated as uniform. It does not invent scale:`);
}

function transform(html,path){
  let out=globalEditorial(html);
  out=reviewCategory(out,categoryForPath(path)||guideCategory(path)||finderCategory(path));
  out=reviewProduct(out,productForPath(path));
  if(path==='/privacy/')out=reviewPrivacy(out);
  if(path==='/affiliate-disclosure/')out=reviewAffiliate(out);
  if(path==='/coverage/')out=reviewCoverage(out);
  if(path==='/updates/')out=reviewUpdates(out);
  if(path==='/contact/')out=reviewContact(out);
  if(path==='/about/')out=reviewAbout(out);
  return out;
}

module.exports=(req,res)=>{
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=transform(body,path);
    return end(body,...args);
  };
  return app(req,res);
};
module.exports.transform=transform;
module.exports.AMAZON_STATEMENT=AMAZON_STATEMENT;
