'use strict';

// APG Consumer Surface Reconciliation v81.
// Final SSR boundary for consumer-facing wording only. Internal engine versions,
// API contracts and QA identifiers remain intact underneath this layer.
const downstream=require('./search-platform-verification-v80');

const CONSUMER_SURFACE_VERSION='81.0';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const REVIEWED_AT='23 August 2026';
const TRUST_PATHS=new Set([
  '/about/','/methodology/','/editorial-standards/','/sources/',
  '/corrections-policy/','/affiliate-disclosure/','/privacy/','/terms/',
  '/contact/','/coverage/','/updates/'
]);

function urlOf(raw){
  try{return raw instanceof URL?raw:new URL(raw||'/',PRIMARY_ORIGIN)}
  catch{return new URL('/',PRIMARY_ORIGIN)}
}
function swap(out,from,to){return out.includes(from)?out.replace(from,to):out}
function swaps(out,pairs){for(const [from,to] of pairs)out=swap(out,from,to);return out}

function reconcileDecisionLab(html,path){
  if(path!=='/decision-lab/')return html;
  return swaps(html,[
    [`Decision Engine v4 turns your needs, maximum budget, priorities and deal-breakers into an explainable shortlist drawn only from APG's maintained Australian product set. Hard constraints are enforced; missing proof is disclosed rather than guessed.`,`Decision Lab turns your needs, maximum budget, priorities and deal-breakers into an explainable shortlist drawn only from products APG currently maintains. Must-have requirements are respected; missing proof stays visible rather than being guessed.`],
    ['<span class="engine-status">Decision Engine v4</span>','<span class="engine-status">Explainable matching</span>'],
    ['<span>Maintained data only</span>','<span>Current APG product data</span>'],
    ['<span>Hard constraints before scoring</span>','<span>Must-haves checked first</span>'],
    ['<span>0 commercial scoring points</span>','<span>Affiliate commission never affects ranking</span>'],
    ['<span>No mystery performance rating</span>','<span>No invented performance scores</span>'],
    ['<h2>Your structured decision profile</h2>','<h2>What matters in your decision</h2>'],
    ['The engine distinguishes hard constraints from preferences. Missing or conflicting evidence stays visible rather than being silently traded away.','APG separates must-have requirements from preferences. Missing or conflicting evidence stays visible rather than being silently traded away.'],
    ['No clean verified hard-constraint match.','No fully verified match for every must-have requirement.'],
    ['Hard constraint conflict','Must-have requirement conflict'],
    ['Constraint conflict','Must-have conflict'],
    ['Ordered by fit to your decision state, never by affiliate availability or commission.','Ordered by fit to your needs and priorities, never by affiliate availability or commission.'],
    ['<strong>Interpretation boundary</strong>','<strong>How to read this result</strong>'],
    ['“Needs verification” means a hard requirement cannot yet be proven from maintained evidence.','“Needs verification” means a must-have requirement cannot yet be proven from APG’s maintained evidence.']
  ]);
}

function reconcileProductAssessment(html,path){
  if(!/^\/products\/[a-z0-9-]+\/$/.test(path))return html;
  let out=swaps(html,[
    ['aria-label="APG product intelligence profile"','aria-label="APG product assessment"'],
    ['<p class="kicker">Catalogue Intelligence v48</p>','<p class="kicker">How APG assesses this product</p>'],
    ['<h2>One intelligence contract across all maintained products</h2>','<h2>Evidence, suitability and retailer context in one place</h2>'],
    ['This product is evaluated through the same APG identity, decision, evidence, retailer, imagery and alternative framework used across the full maintained catalogue. Evidence depth remains explicit: a maintained classification is not presented as a manufacturer-verified fact.','APG applies the same evidence, suitability, retailer and imagery checks across its maintained product catalogue. Where APG has a useful classification but not a manufacturer-verified fact, that distinction stays visible.'],
    ['Maintained classification signals','APG suitability signals'],
    ['Fact-verified maintained evidence','Verified product evidence'],
    ['Structured maintained evidence','Structured product evidence'],
    ['Maintained classification evidence','APG classification evidence'],
    ['Australian retailer intelligence','Australian retailer links'],
    ['Verified authorised product photography','Verified product photography'],
    ['Exact identity ready; authorised image delivery pending','Exact product verified; approved product image not yet available'],
    ['Authorised exact-product image source still needed','Approved exact-product image not yet available'],
    ['<strong>Category decision factors:</strong>','<strong>What matters in this category:</strong>'],
    ['All 482 maintained products participate in the same catalogue-intelligence contract. Classification signals can improve soft relevance; hard requirements still require the existing verified hard-constraint path. Retailer coverage, affiliate status and imagery contribute zero recommendation points.','APG applies the same maintained evidence and suitability checks across its product catalogue. Unverified requirements stay visible, and retailer coverage, affiliate status and imagery never increase a product’s recommendation score.']
  ]);
  out=out.replace(/(\d+) current exact-model destination(s?)/g,(m,n,s)=>`${n} verified exact-model retailer link${s}`);
  return out;
}

const professionalReviewNotice='<div class="notice"><strong>Professional review flag.</strong> This is an operating baseline informed by authoritative Australian guidance, not legal advice or a representation that every legal requirement has been independently certified. Professional Australian legal/privacy review is recommended before APG materially expands data collection, paid marketing, commercial arrangements, user-generated content or higher-risk product claims.</div>';

function reconcileTrust(html,path){
  if(!TRUST_PATHS.has(path))return html;
  let out=swap(html,'Last updated 16 August 2026',`Last updated ${REVIEWED_AT}`);

  if(path==='/about/'){
    out=swaps(out,[
      ['APG is being developed as an Australian product-decision layer: search in ordinary language, narrow the market around your priorities, compare meaningful trade-offs, inspect the evidence and then move to a retailer without restarting the research process.','APG is an Australian product-decision service: search in ordinary language, narrow the market around your priorities, compare meaningful trade-offs, inspect the evidence and then move to a retailer without restarting the research process.'],
      ['Recommendation tools use explicit category signals or deterministic rules. The coffee-machine finder has the deepest structured model; other maintained finders are intentionally simpler. “Best match” means the strongest fit to the answers supplied within the maintained dataset, not a claim that the product is universally superior.','Recommendation tools use clear category factors and repeatable matching rules. Decision Lab and guided finders use the needs you provide to surface the strongest fit within products APG currently maintains. “Best match” is contextual, not a claim that one product is universally superior.'],
      ['Material errors should be corrected in the structured product or retailer record first, then propagated through affected comparisons and finder outputs.','Material errors should be corrected at their source, then rechecked across affected product pages, comparisons and recommendation tools.'],
      ['APG currently maintains 37 products across four categories. It does not invent scale: there is no claimed review community, testing laboratory, award history or national market leadership. The priority is to improve evidence quality, imagery, retailer precision, product freshness and decision utility before expanding superficially.','APG currently maintains 482 products across 90 categories. Coverage is curated rather than exhaustive, and APG does not claim a testing laboratory, review community, awards or market leadership it has not earned. The priority remains stronger evidence, exact retailer coverage, lawful imagery, freshness and better decision support rather than superficial scale.'],
      ['A dedicated public venture contact channel has not yet been activated. APG will not publish a private personal address merely to make the site appear larger. The current <a href="/contact/">Contact page</a> explains the correction and retailer-order boundaries.','Consumers can contact APG at <a href="mailto:contact@australianproductguide.au">contact@australianproductguide.au</a>. The <a href="/contact/">Contact page</a> explains correction, privacy, general-enquiry and retailer-order boundaries.']
    ]);
  }

  if(path==='/contact/'){
    out=swaps(out,[
      ['Australian Product Guide currently keeps its public data footprint deliberately small. There is no public account system, newsletter form or general-purpose contact form.','Australian Product Guide keeps contact and account collection proportionate. Browsing does not require an account; My APG accounts are optional, and APG does not operate a retailer checkout.'],
      ['A separate public business email address has not yet been activated. A dedicated venture contact address and documented privacy/complaints workflow should be introduced before broader outreach or significant public feedback collection.','For general, business or website enquiries, email <a href="mailto:contact@australianproductguide.au">contact@australianproductguide.au</a>. APG does not require consumers to publish personal information in order to ask a question or report an issue.'],
      ['APG currently collects very little identifiable user information in its own application. If identifiable data collection is introduced, the public contact process will be updated alongside the <a href="/privacy/">Privacy Policy</a>.','For privacy, access, correction or account-data enquiries, email <a href="mailto:contact@australianproductguide.au">contact@australianproductguide.au</a>. See the <a href="/privacy/">Privacy Policy</a> for the current account, analytics and browser-storage practices.']
    ]);
  }

  if(path==='/methodology/'){
    out=swaps(out,[
      ['Finders use deterministic rules or explicit fit signals. Commercial relationships do not change the result.','Finders use clear, repeatable rules or explicit fit signals. Commercial relationships do not change the result.'],
      ['Structured product, retailer, imagery and QA controls are maintained in the operating backend so consequential changes can be traced and regression-tested.','APG keeps source, retailer, imagery and quality-assurance records so material changes can be traced and affected pages or recommendations can be rechecked.']
    ]);
  }

  if(path==='/editorial-standards/'){
    out=swaps(out,[
      ['Amazon imagery may be displayed only through a supported authorised mechanism such as Amazon Creators API and only for the matching product identifier. Until that integration is authorised, APG-owned visuals remain the fallback.','Amazon-hosted product imagery is displayed only through an authorised Amazon Associates delivery method and only when it matches the verified product. If that cannot be established, APG uses a non-deceptive fallback rather than inventing product photography.'],
      ['Material errors should be fixed at the structured-record level and affected recommendations, comparisons, links and image controls rechecked.','Material errors should be corrected at their source and affected recommendations, comparisons, links and imagery rechecked.']
    ]);
  }

  if(path==='/sources/'){
    out=swaps(out,[
      ['The central imagery register records the source, product identifier, rights/delivery basis, verification date and current display status. APG does not scrape Amazon HTML or permanently copy Amazon-hosted product photography merely because it is accessible in a browser.','APG records the source, product identity, permitted delivery basis, verification date and display status for third-party product imagery. Public visibility alone is not treated as permission to copy a product photograph.'],
      ["Amazon's supported Associates product-data route is now Creators API. APG has prepared its retailer/media data model for exact product identifiers and authorised image URLs, but no Amazon product photograph is displayed until the account has eligible access, credentials are configured securely and the returned product identifier matches the verified APG product.",'APG displays Amazon product content only through methods permitted by the Amazon Associates programme and only when the returned product identity matches the verified APG product. If an exact lawful image source is not available, APG uses a non-deceptive fallback.']
    ]);
  }

  if(path==='/corrections-policy/'){
    out=swaps(out,[
      ['Corrections therefore need to flow through the structured source of truth rather than being patched on one visible page.','Corrections therefore need to start with the underlying product, retailer or source information and then flow through every affected page.'],
      ['Correct the structured product, retailer or media record.','Correct the underlying product, retailer or imagery record.'],
      ['Re-run relevant comparison, finder, link, accessibility and route QA where output could change.','Recheck affected comparisons, finders, links, accessibility and page behaviour where the output could change.'],
      ['APG maintains operational decision and QA records. Public update summaries may be published where they help shoppers understand coverage or material methodology changes.','APG keeps change and quality-assurance records. Public update summaries are published where they help shoppers understand material coverage, evidence or methodology changes.']
    ]);
  }

  if(path==='/affiliate-disclosure/'){
    out=swaps(out,[
      ["APG's current Amazon Associates tracking tag is <code>auproductguid-22</code>. Exact individual Amazon Australia product links are used only after product/model identity is independently verified. Otherwise APG retains a model-specific Amazon search fallback rather than guessing an ASIN.",'Exact Amazon Australia product links are used only after product and model identity are verified. Otherwise APG uses a clearly labelled model-specific Amazon Australia search fallback rather than guessing a product identifier.'],
      ["Amazon Product Advertising Content can be made available through supported Associates tools subject to programme terms. PA-API has been deprecated; APG's planned supported product-data route is Amazon Creators API. No Amazon product photograph is displayed until eligible API access and secure credentials are available and the image is returned for the exact matching product identifier.",'Amazon product content is used only through methods permitted by the Amazon Associates programme and only when the product identity matches. If authorised exact-product imagery is not available, APG uses a non-deceptive fallback instead of fabricating or scraping product photography.'],
      ['The data model supports multiple retailers. Technical readiness does not mean APG has applied to, been approved by or activated another commercial programme. New commercial relationships remain approval-gated.','APG may add other retailers over time. A retailer is not described as a partner or active commercial relationship unless that relationship actually exists, and retailer participation never increases recommendation scores.']
    ]);
  }

  if(path==='/privacy/'){
    out=swap(out,'What Australian Product Guide currently stores, how device-local features work and how privacy will be reassessed as the service changes.','How Australian Product Guide handles optional accounts, browser storage, analytics, shopping links and contact data.');
    out=swap(out,professionalReviewNotice,'<div class="notice"><strong>Current-practice policy.</strong> This page describes APG’s current data practices. It will be updated when those practices materially change.</div>');
    out=swaps(out,[
      ['Australian Product Guide is designed to minimise personal information collection. The current public site does not require an account, payment profile, newsletter signup or contact form to search, compare or use recommendation tools.','Australian Product Guide is designed to minimise personal information collection. You can search, compare and use recommendation tools without an account. Creating a My APG account is optional and is used only when you want signed-in features such as cross-device workspace sync.'],
      ['You can enter search terms and finder preferences such as product category, use case, budget or feature priorities. These inputs are used to deliver the requested result. APG does not currently present them as a registered customer profile.','You can enter search terms, Decision Lab descriptions, Scout questions and finder preferences such as category, use case, budget or feature priorities. These inputs are used to provide the requested experience. APG does not use affiliate economics to alter the result.'],
      ['The application currently has no consumer account registration, checkout, payment card capture, newsletter signup or public free-text contact form.','APG does not operate a product checkout or capture payment-card details. My APG accounts are optional; when you create one, APG and its authentication provider process the account information needed to sign you in and the workspace information you choose to sync.'],
      ['Optional convenience data stored on the device can include products selected for comparison, recently viewed products, saved products and recent APG search terms. These records remain in that browser unless cleared by the user/browser or changed by a future release. They are not an APG cloud account.','When you are signed out, convenience data such as comparison selections, recently viewed products, saved products and recent research can remain in your browser. If you sign in, selected My APG workspace data can be synced to your account across devices. You can clear local history, remove synced items or use the available account-deletion controls.'],
      ['The current APG application code does not include a first-party behavioural analytics or advertising-pixel implementation. Hosting, security infrastructure and third-party services may process technical data required to operate their services. If APG later introduces analytics or advertising technology, this policy and any consent/notice controls will need to be reviewed before activation.','APG uses consent-controlled Google Analytics for aggregate website measurement. Analytics storage is denied by default until you choose to allow it; advertising storage, ad personalisation and Google Signals remain disabled. APG also uses privacy-minimised hosting analytics. You can change your analytics choice through Cookie preferences.'],
      ["Recent searches, comparison selections and recent/saved products are currently implemented through browser local storage. APG's application does not currently sync these into a user account.",'Signed-out recent searches, comparison selections and saved/recent products can be stored locally in your browser. Signed-in users can choose to sync selected My APG workspace items. Search and Decision Lab inputs can appear in the page URL so a requested state can be restored or shared; APG analytics is configured not to send URL query strings, typed search terms, Decision Lab descriptions, Scout messages or account identifiers to Google Analytics.'],
      ['APG uses infrastructure required to host and deliver the website and may link to manufacturers and retailers. APG should not disclose identifiable user data for unrelated purposes without an appropriate basis and notice.','Current service providers include Vercel for hosting and technical website measurement, Supabase for optional account authentication and synced workspace data, and Google Analytics for consented aggregate usage measurement. APG also links to external manufacturers and retailers, including Amazon Australia. Those third parties operate under their own privacy practices.'],
      ['Device-local APG convenience data remains until it is cleared or overwritten in the browser. Infrastructure logs are governed by the relevant provider configuration and operational need. APG should adopt explicit retention rules before collecting material identifiable user data.','Device-local convenience data remains until it is cleared or overwritten in the browser. Signed-in workspace and account data remains until removed, deleted or otherwise handled in accordance with APG’s account controls and provider settings. Technical logs and analytics data follow the relevant service configuration and operational need.'],
      ['APG uses HTTPS through its hosting platform, security headers, data minimisation and a deliberately small application surface. No website can promise absolute security. Secrets and API credentials must not be embedded in public source code or browser-delivered content.','APG uses HTTPS, security headers, data minimisation and account-access controls designed to keep signed-in workspace data scoped to the relevant user. No website can promise absolute security.'],
      ['Because APG does not currently operate user accounts or a public personal-data submission form, it holds limited user-provided information in its own application. A dedicated business privacy contact and documented access/correction/complaint process should be activated before identifiable personal information is collected at material scale.','For access, correction, privacy or account-data questions, email <a href="mailto:contact@australianproductguide.au">contact@australianproductguide.au</a>. APG will verify requests where necessary before acting on account or personal information.'],
      ['The current <a href="/contact/">Contact page</a> explains the present contact limitation. A dedicated venture privacy channel should be activated before material identifiable data collection.','For privacy questions or complaints, use the <a href="/contact/">Contact page</a> or email <a href="mailto:contact@australianproductguide.au">contact@australianproductguide.au</a>.']
    ]);
  }

  if(path==='/terms/'){
    out=swap(out,professionalReviewNotice,'<div class="notice"><strong>Consumer rights.</strong> Nothing in these terms is intended to exclude, restrict or modify a right or remedy that cannot lawfully be excluded, including applicable rights under the Australian Consumer Law.</div>');
    out=swaps(out,[
      ['Material methodology changes should be reflected in governance records and relevant public pages.','Material methodology changes should be reflected in APG’s public methodology or update information where relevant.'],
      ['These terms are intended for an Australian-facing service and should be interpreted subject to applicable Australian law. Professional legal review is recommended before material commercial scale.','These terms are for an Australian-facing service and are subject to applicable Australian law.']
    ]);
  }

  if(path==='/coverage/'){
    out=swaps(out,[
      ['APG prefers a smaller maintained catalogue over hundreds of superficial pages. Coverage is therefore separated into active maintained categories and research pathways.','APG prioritises useful maintained coverage over superficial catalogue scale. Coverage reflects products and categories APG can currently support with structured decision context, evidence controls and functioning consumer journeys.'],
      ['APG maintains 37 products across four live categories: coffee machines, air fryers, robot vacuums and wireless headphones. Maintained categories have structured product records, comparison routes, buying guidance and recommendation journeys.','APG currently maintains 482 products across 90 populated categories. Maintained categories connect product records with search, comparison, buying guidance and recommendation pathways, while evidence depth and retailer coverage can still vary by product.'],
      ['A wider set of category pathways exists for future evaluation. These remain noindex until APG can define the decision factors, establish an Australian evidence set and maintain changes responsibly.','New categories are added only when APG can define useful decision factors, establish a credible Australian evidence set and maintain the resulting pages responsibly. Coverage is curated rather than an exhaustive list of everything sold in Australia.']
    ]);
  }

  if(path==='/updates/'){
    out=swaps(out,[
      ['<p class="policy-lead">This page summarises material public product changes rather than creating a fictional newsroom or daily publishing cadence.</p>','<p class="policy-lead">This page summarises material changes to APG’s consumer experience, coverage, evidence and shopping controls. Dates reflect real review or release events rather than automated freshness.</p><h2 id="consumer-reconciliation">23 August 2026 — Consumer experience and trust reconciliation</h2><p>APG reconciled consumer-facing Decision Lab and product-assessment wording, brought About, Contact, Privacy and Coverage into line with the current 482-product, 90-category and optional-account platform, and removed internal implementation language from key trust surfaces.</p>'],
      ['16 August 2026 — Phase 4 premium discovery release','16 August 2026 — Product discovery and trust release'],
      ['The site-wide visual system, header, navigation, search presentation, comparison experience, trust pages and footer are being upgraded while retaining the lightweight server-rendered architecture. Retailer data has also been expanded to record exact product identifiers, variants, image provenance and availability confidence.','APG upgraded its visual system, navigation, search presentation, comparison experience, trust pages and footer while retaining the lightweight server-rendered architecture. Retailer records were also expanded to improve exact product identity, variant, imagery-provenance and availability controls.'],
      ['<h2 id="amazon">Amazon product-data status</h2>','<h2 id="amazon">Amazon product links and imagery</h2>'],
      ['Amazon PA-API is deprecated. APG has prepared its media architecture for Amazon Creators API but will not use scraped Amazon photography or expose API credentials. Exact direct product links continue to be added only when individual listing identity is verified.','APG uses exact Amazon Australia product links only when the individual listing identity is verified; otherwise it uses a clearly labelled search fallback. Amazon-hosted product imagery is used only through a permitted Associates delivery method for the matching product.'],
      ['<h2 id="roadmap">Next evidence priorities</h2>','<h2 id="roadmap">Ongoing evidence priorities</h2>'],
      ['High-value priorities are lawful genuine product imagery, broader exact retailer coverage, price/freshness architecture and deeper non-coffee finder attributes before large-scale catalogue expansion.','Ongoing priorities are lawful genuine product imagery, broader exact Australian retailer coverage, stronger price and freshness controls, and deeper decision attributes in categories where evidence is still thin.']
    ]);
  }

  return out;
}

function reconcile(html,pathOrUrl){
  let out=String(html||'');
  if(!/<html[\s>]/i.test(out))return out;
  const path=urlOf(pathOrUrl).pathname;
  out=reconcileDecisionLab(out,path);
  out=reconcileProductAssessment(out,path);
  out=reconcileTrust(out,path);
  if(!out.includes('data-apg-consumer-surface-v81="true"'))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-consumer-surface-v81="true"$1>`);
  return out;
}

function handler(req,res){
  const url=urlOf(req.url);
  res.setHeader('X-APG-Consumer-Surface','v'+CONSUMER_SURFACE_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){
      const next=reconcile(body,url);
      if(next!==body){body=next;try{res.removeHeader('Content-Length')}catch{}}
    }
    res.setHeader('X-APG-Consumer-Surface','v'+CONSUMER_SURFACE_VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{CONSUMER_SURFACE_VERSION,PRIMARY_ORIGIN,REVIEWED_AT,TRUST_PATHS,urlOf,reconcile,reconcileDecisionLab,reconcileProductAssessment,reconcileTrust});
module.exports=handler;
