'use strict';

const {categories,products}=require('../data');

const REVIEW_DATE='23 August 2026';
const CONTACT_EMAIL='contact@australianproductguide.au';
const populatedCategories=Object.values(categories).filter(category=>Array.isArray(category.products)&&category.products.length>0);
const representedBrands=new Set(products.map(product=>String(product.brand||'').trim()).filter(Boolean));
const facts=Object.freeze({products:products.length,categories:populatedCategories.length,brands:representedBrands.size});

const mail=(label=CONTACT_EMAIL)=>`<a href="mailto:${CONTACT_EMAIL}">${label}</a>`;
const reviewed=`<div class="policy-meta"><span class="pill good">Reviewed ${REVIEW_DATE}</span><span class="pill">Current operating state</span></div>`;
const effective=`<div class="policy-meta"><span class="pill good">Effective ${REVIEW_DATE}</span><span class="pill">Last reviewed ${REVIEW_DATE}</span></div>`;
const related=`<aside class="related-policies"><strong>Keep exploring Australian Product Guide governance</strong><div><a href="/methodology/">How we compare</a><a href="/editorial-standards/">Editorial standards</a><a href="/sources/">Sources</a><a href="/corrections-policy/">Corrections</a><a href="/affiliate-disclosure/">Affiliate disclosure</a></div></aside>`;

const content={
  about:{
    title:'About Australian Product Guide | Independent Australian Product Research',
    heading:'About Australian Product Guide',
    description:'What Australian Product Guide is, how it helps Australian shoppers and the principles behind its independent product research.',
    body:`${reviewed}
<p class="policy-lead">Australian Product Guide (APG) is an Australian product-research and shopping-discovery service built around one practical question: <strong>What should I actually buy for my situation, and why?</strong></p>
<h2 id="purpose">What APG is here to do</h2>
<p>APG helps Australian consumers move from a need, budget and set of priorities to a smaller, explainable shortlist. It combines maintained product information with search, comparison, buying guides, Decision Lab and Scout so the reasoning behind a recommendation stays visible.</p>
<h2 id="current">Current maintained coverage</h2>
<p>APG currently maintains <strong>${facts.products} products across ${facts.categories} populated categories, representing ${facts.brands} brands</strong>. Those figures are generated from the same structured catalogue that powers the public website rather than being separately typed marketing claims.</p>
<p>APG is not a whole-of-market catalogue. It does not claim to include every product, brand or retailer available in Australia. Coverage is deliberately curated so APG can favour evidence quality and decision usefulness over superficial scale.</p>
<h2 id="research">How the research is produced</h2>
<p>Unless a page explicitly says otherwise, APG guidance is desk-researched rather than based on hands-on laboratory or long-term product testing. APG prefers manufacturer information, manuals and support material for product facts, exact Australian retailer information for offer context, and credible independent sources where they add useful evidence or perspective.</p>
<h2 id="independence">Independence and commercial relationships</h2>
<p>Affiliate relationships, retailer participation, commission opportunity and the availability of a retailer link contribute <strong>zero points</strong> to product suitability, ranking or recommendation scoring. A product is not ranked more highly because APG may earn a commission from a purchase.</p>
<h2 id="accounts">Accounts are optional</h2>
<p>Core browsing, search, comparison and recommendation tools do not require an account. My APG can be used locally while signed out, or a shopper can choose to create an account and sync selected research across devices. Account status does not change product recommendations or retailer ranking.</p>
<h2 id="contact">Contact APG</h2>
<p>General enquiries, corrections, privacy enquiries and feedback can be sent to ${mail()}. Retailer order, delivery, return and warranty matters should be taken to the retailer or manufacturer that handled the transaction.</p>
${related}`
  },
  contact:{
    title:'Contact Australian Product Guide',
    heading:'Contact Australian Product Guide',
    description:'How to contact Australian Product Guide about corrections, privacy, business enquiries and product-research feedback.',
    body:`${reviewed}
<p class="policy-lead">The dedicated Australian Product Guide contact address is ${mail()}. Use it for general enquiries, corrections, privacy matters, business enquiries or feedback about APG's product research and tools.</p>
<h2 id="corrections">Report a correction</h2>
<p>If you believe a product fact, model, source, image, retailer destination, availability statement or disclosure is wrong, email ${mail('the APG contact address')}. It helps to include the relevant APG page URL, the statement you believe is incorrect, and a manufacturer, retailer or other credible source that supports the correction where available.</p>
<p>APG verifies correction requests before changing a record. Where a correction affects a comparison, recommendation or related page, those outputs are reviewed as part of the change.</p>
<h2 id="privacy">Privacy, access and correction enquiries</h2>
<p>Privacy questions, requests to access or correct personal information APG holds, and privacy complaints can be sent to ${mail()}. My APG also provides self-service controls for account data, including account deletion and available workspace download functions.</p>
<h2 id="orders">Retailer orders and product support</h2>
<p>APG is an information and comparison service, not the seller of products linked from the site. APG cannot access retailer accounts, payments, orders, deliveries, returns or warranties. Contact the retailer or manufacturer directly for transaction or product-support issues.</p>
<h2 id="security">Please do not send sensitive credentials</h2>
<p>Do not email passwords, payment-card details, retailer login credentials or other secrets. APG will never need those details to investigate a correction or answer a general enquiry.</p>
<h2 id="response">What happens after you contact APG</h2>
<p>Enquiries are assessed according to their subject matter. Product and editorial corrections are checked against evidence; privacy requests are handled against APG's current information-holding practices; and retailer transaction matters are redirected to the relevant retailer or manufacturer.</p>
${related}`
  },
  methodology:{
    title:'How We Compare and Recommend Products | Australian Product Guide',
    heading:'How we compare and recommend products',
    description:'Australian Product Guide methodology for evidence-led product comparison, recommendations and explainable buying decisions.',
    body:`${reviewed}
<div class="notice"><strong>Core principle.</strong> APG starts with the shopper's situation and the evidence available. Affiliate commission, retailer participation and commercial opportunity do not increase a product's recommendation score.</div>
<p class="policy-lead">APG is designed to answer a decision, not simply rank a catalogue. The useful question is usually not “what is the best product?” but “which maintained option best fits this shopper's budget, needs, priorities and deal-breakers, and what trade-offs come with it?”</p>
<h2 id="scope">1. Define the decision and its scope</h2>
<p>APG identifies the product category, intended use, budget and decision factors that materially change the purchase. Recommendations are always limited to APG's maintained dataset and the evidence available for the relevant products. They are not claims of universal or whole-of-market superiority.</p>
<h2 id="needs">2. Separate must-haves from preferences</h2>
<p>Must-have requirements and deal-breakers are checked before softer preferences. Where APG cannot verify a requirement from maintained evidence, the missing proof stays visible rather than being guessed.</p>
<h2 id="evidence">3. Build from evidence</h2>
<p>Product claims are grounded in published sources. APG prefers manufacturer specifications, manuals and support material for product facts, then exact Australian retailer information for offer context, with credible independent sources used where they materially improve the decision.</p>
<h2 id="compare">4. Compare meaningful differences</h2>
<p>APG focuses on differences likely to change the decision: suitability for the stated use, important specifications, compatibility, constraints, trade-offs, evidence depth and current retailer context. It avoids inventing opaque performance scores where published evidence does not support them.</p>
<h2 id="rank">5. Explain the shortlist</h2>
<p>A recommendation should show why an option fits, where it is weaker, and what alternative may suit a different priority. “Best match” means best fit within the maintained APG set for the stated inputs; it does not mean the product is objectively best for every shopper.</p>
<h2 id="commercial">6. Keep commerce outside product fit</h2>
<p>Affiliate status, commission opportunity, retailer participation, image availability and whether APG has an exact retailer link contribute zero product-fit points. Retailer links are a shopping pathway after the recommendation, not an input that improves the recommendation.</p>
<h2 id="freshness">7. Treat volatile information as volatile</h2>
<p>Prices, sellers, stock, promotions, model generations and some specifications can change. APG does not present a reference price as a guaranteed live quote. Consequential details should be rechecked with the manufacturer or retailer before purchase.</p>
<h2 id="testing">8. Be clear about what APG has and has not tested</h2>
<p>Unless explicitly documented otherwise, APG's current guidance is desk-researched. APG does not describe published-source research as hands-on testing and does not invent review scores, owner communities, awards or laboratory results.</p>
${related}`
  },
  'editorial-standards':{
    title:'Editorial Standards and Independence | Australian Product Guide',
    heading:'Editorial standards and independence',
    description:'The accuracy, independence, evidence, disclosure and correction standards used by Australian Product Guide.',
    body:`${reviewed}
<p class="policy-lead">APG's editorial standard is evidence before marketing: explain the basis for a product claim, disclose uncertainty, separate commercial relationships from suitability, and correct material errors when better evidence becomes available.</p>
<h2 id="accuracy">Accuracy and attribution</h2>
<p>Material product facts should be traceable to an appropriate source. Where sources conflict, APG favours the most authoritative source for the exact model and Australian context, and avoids presenting uncertain information as settled fact.</p>
<h2 id="independence">Editorial independence</h2>
<p>Affiliate commission, retailer participation, commercial opportunity, free exposure or the presence of an image do not increase a product's ranking or suitability. APG does not sell favourable placement inside its recommendation logic.</p>
<h2 id="scope">Honest coverage claims</h2>
<p>APG does not imply that its maintained catalogue represents every product or retailer in Australia. “Best”, “best match” and similar language must be scoped to the maintained comparison set and the shopper's stated decision factors.</p>
<h2 id="testing">Testing and review claims</h2>
<p>Desk research is described as desk research. APG will only claim hands-on use, testing, a survey, an award or another form of first-hand evidence where that activity actually occurred and can be documented.</p>
<h2 id="imagery">Product imagery and third-party content</h2>
<p>Genuine third-party product imagery is used only where APG has an appropriate source and usage basis and can match the image to the product or variant being described. For Amazon, Program Content is used only through mechanisms permitted by the applicable Amazon Associates programme terms and policies and only where APG can verify the product match and record the usage basis. APG does not scrape Amazon product pages or fabricate imagery of real products.</p>
<h2 id="freshness">Freshness and change</h2>
<p>Dates on APG pages should reflect genuine research, review or release events rather than automated freshness. Volatile information such as price, stock, retailer availability and model status is treated separately from more stable product facts.</p>
<h2 id="corrections">Corrections</h2>
<p>Material errors are corrected through the structured record or authoritative content source first so the change can flow consistently to affected pages. Consumers can report issues through the <a href="/corrections-policy/">Corrections Policy</a> or by emailing ${mail()}.</p>
${related}`
  },
  sources:{
    title:'Sources, Provenance and Evidence Freshness | Australian Product Guide',
    heading:'Sources, provenance and evidence freshness',
    description:'How Australian Product Guide selects sources, records provenance and handles evidence freshness and uncertainty.',
    body:`${reviewed}
<p class="policy-lead">APG uses a source hierarchy because not every source is equally useful for every claim. Exact product identity, Australian relevance and the authority of the source matter more than the number of links collected.</p>
<h2 id="hierarchy">Source hierarchy</h2>
<ol><li><strong>Manufacturer, manual and support material</strong> for stable product specifications, compatibility, dimensions, features and official model information.</li><li><strong>Exact Australian retailer or manufacturer-direct listings</strong> for seller-specific availability, offer context and exact local product identity.</li><li><strong>Credible independent evidence</strong> where it adds useful performance context, comparative insight or verification that primary sources do not provide.</li><li><strong>Secondary sources</strong> for discovery or context, with consequential claims verified against stronger evidence where possible.</li></ol>
<h2 id="identity">Exact model and variant identity</h2>
<p>APG avoids assuming that a similarly named overseas model, generation or retailer listing is the same Australian product. Where exact identity is uncertain, the uncertainty is disclosed or the claim is withheld.</p>
<h2 id="retailers">Retailer information</h2>
<p>Retailer links can be exact product destinations or transparent model-specific search fallbacks. An exact direct link is used only when APG has sufficient confidence in the product or variant match. Seller, stock, delivery and price remain controlled by the retailer and can change.</p>
<h2 id="amazon">Amazon Australia content</h2>
<p>Amazon Program Content is used only through mechanisms permitted by the applicable Amazon Associates programme terms and policies. APG requires a verified product or variant match and a recorded usage basis before Amazon product content is published. APG does not guess Amazon product identifiers or scrape Amazon product pages.</p>
<h2 id="freshness">Evidence freshness</h2>
<p>Stable specifications and volatile commerce facts are treated differently. Product generations, compatibility, retailers, prices, promotions and availability can change faster than dimensions or basic features, so consequential purchase details should be confirmed with the current manufacturer or retailer source.</p>
<h2 id="missing">When evidence is missing</h2>
<p>Missing evidence is not filled with an invented score or assumption. APG may retain a product as a research starting point while clearly limiting the claims made about it until stronger evidence is available.</p>
${related}`
  },
  'corrections-policy':{
    title:'Corrections and Change Control | Australian Product Guide',
    heading:'Corrections and change control',
    description:'How to report an error to Australian Product Guide and how product, editorial and disclosure corrections are verified and published.',
    body:`${reviewed}
<p class="policy-lead">APG aims to correct material errors quickly without turning an unverified report into a new error. Corrections are evidence-led and are made at the authoritative record or content source wherever possible.</p>
<h2 id="report">How to report a correction</h2>
<p>Email ${mail()} and include the relevant APG page URL, the product or statement involved, what you believe is incorrect, and any manufacturer, retailer or other credible supporting source you have. You do not need to provide sensitive personal information.</p>
<h2 id="verify">How APG verifies a report</h2>
<p>APG checks the exact product or page, the source supporting the existing statement and the evidence supplied with the correction. Where evidence conflicts, APG favours the strongest source for the exact Australian model and context.</p>
<h2 id="change">How a correction is made</h2>
<p>Where the issue is confirmed, APG updates the structured product record or authoritative page content first. Related comparisons, recommendations, guides, retailer links or imagery are then checked where the correction could affect them.</p>
<h2 id="material">Material corrections</h2>
<p>When an error materially changes the meaning of a recommendation, disclosure or policy position, APG may note the change in its public update information rather than silently changing the visible outcome.</p>
<h2 id="freshness">Review dates and freshness</h2>
<p>A review or update date should change only when a substantive research, policy or release event has occurred. APG does not advance dates merely to make content appear fresh.</p>
<h2 id="contact">Other enquiries</h2>
<p>Privacy matters, general feedback and business enquiries can also be sent to ${mail()}. Retailer order, return and warranty matters must be handled by the retailer or manufacturer that controls the transaction.</p>
${related}`
  },
  'affiliate-disclosure':{
    title:'Affiliate Disclosure | Australian Product Guide',
    heading:'Affiliate disclosure and retailer transparency',
    description:'How affiliate links work on Australian Product Guide and how commercial relationships are kept outside product recommendations.',
    body:`${effective}
<div class="notice"><strong>As an Amazon Associate I earn from qualifying purchases.</strong> Amazon affiliate links are paid links. Affiliate status, commission opportunity and retailer participation contribute zero points to product suitability, ranking or recommendation scoring.</div>
<p class="policy-lead">Some retailer links on APG are affiliate links. If you follow an eligible link and make a qualifying purchase, APG may receive a commission without increasing a product's recommendation score because of that commercial relationship.</p>
<h2 id="ranking">How commercial relationships affect recommendations</h2>
<p>They do not add suitability points. Affiliate status, commission opportunity, retailer participation, exact-link availability and imagery availability are excluded from product-fit scoring. APG's recommendation should be explainable without reference to the commission available from a retailer.</p>
<h2 id="amazon">Amazon Australia</h2>
<p>For Amazon Australia, APG uses an exact individual product destination only where the product or variant identity has been verified. Where exact identity has not been verified, APG may use a clearly presented model-specific Amazon search fallback rather than guessing a product identifier or sending shoppers to a potentially incorrect listing.</p>
<h2 id="tracking">Affiliate click-outs</h2>
<p>Affiliate destinations contain attribution information so the retailer can recognise an eligible referral. Once a shopper leaves APG, the third party controls its website or app, account information, cookies, checkout, seller relationship, fulfilment and privacy practices. APG does not receive a copy of a shopper's retailer checkout details merely because an affiliate link was used.</p>
<h2 id="imagery">Amazon product content</h2>
<p>Amazon Program Content is used only through mechanisms permitted by the applicable Amazon Associates programme terms and policies and only where APG can verify the relevant product or variant match and record the usage basis. APG does not scrape Amazon product pages, guess product identifiers or fabricate access to Amazon systems.</p>
<h2 id="retailers">Other and future retailers</h2>
<p>APG is designed to support more than one retailer. A technical ability to link to a retailer does not imply a partnership, approval or affiliate relationship. Any active commercial relationship should be disclosed where relevant and remains outside product-fit scoring.</p>
${related}`
  },
  privacy:{
    title:'Privacy Policy | Australian Product Guide',
    heading:'Privacy Policy',
    description:'How Australian Product Guide handles My APG account data, local research, analytics consent, service providers, privacy requests and deletion.',
    body:`${effective}
<p class="policy-lead">APG is designed to minimise the personal information needed to use the service. Core browsing, search, comparison and recommendation tools work without an account. This policy describes the information APG currently handles and the choices available to users.</p>
<h2 id="local">1. Signed-out and browser-local research</h2>
<p>When you use APG while signed out, saved products, recent research, comparison selections and other supported workspace information can be stored in your browser. Browser-local information stays on that browser unless you clear it, the browser removes it, or you choose to sign in and sync supported workspace records.</p>
<h2 id="account">2. Optional My APG accounts</h2>
<p>If you create a My APG account, APG processes the information needed to authenticate and operate that account, such as your email address, authentication records, communication preferences you choose to set, and supported workspace records you choose to sync. APG does not need your retailer passwords or payment-card details to provide a My APG account.</p>
<p>My APG authentication and synced workspace data are provided through APG's Supabase project, which is currently hosted in the Sydney, Australia region. Synced workspace records are associated with the authenticated account so one user's records are not intentionally made available to another user.</p>
<h2 id="sync">3. Local storage and cloud sync are separate</h2>
<p>Signing in does not automatically erase browser-local research. Supported records may exist both locally and in the signed-in workspace. Deleting the cloud account removes the authenticated account and synced APG workspace through the available account-deletion process, while browser-local research remains until separately cleared from that browser.</p>
<h2 id="analytics">4. Analytics and consent</h2>
<p>Google Analytics is opt-in on APG. Analytics storage remains denied until a user grants analytics consent through APG's cookie controls. Advertising storage, ad-user-data signals and ad personalisation remain disabled in APG's Google Analytics configuration.</p>
<p>APG's analytics implementation removes query strings and URL fragments from the page location it sends and is designed not to send typed search queries, Decision Lab free-text descriptions, Scout messages, email addresses or account identifiers as APG analytics event data. APG may also use privacy-minimised technical measurements and hosting logs to diagnose reliability and performance.</p>
<h2 id="providers">5. Service providers and third parties</h2>
<p>APG currently relies on service providers including Vercel for website hosting and technical operation, Supabase for optional account authentication and synced workspace storage, and Google Analytics when analytics consent is granted. When you choose to follow a retailer or manufacturer link, that external service handles information under its own privacy practices.</p>
<h2 id="affiliate">6. Affiliate referrals</h2>
<p>Some outbound retailer links contain affiliate attribution. APG does not receive a copy of the retailer's checkout details merely because an affiliate link is used. The retailer or marketplace controls its own cookies, account information, seller relationship, transaction and fulfilment once you leave APG.</p>
<h2 id="overseas">7. Overseas processing</h2>
<p>APG's current Supabase project is hosted in the Sydney, Australia region. Other providers, their support functions or parts of their infrastructure may process technical or service information outside Australia, and provider locations can change. APG therefore does not promise that every technical processing activity occurs only in Australia.</p>
<h2 id="retention">8. Retention and deletion</h2>
<p>Browser-local APG information remains until it is cleared, overwritten or removed by the browser. Synced My APG workspace data remains while the account or relevant record exists, subject to operational, security, legal and provider retention requirements. My APG provides a self-service account-deletion process for the authenticated account and synced APG workspace. Technical logs are retained according to operational need and applicable provider settings.</p>
<h2 id="access">9. Access, correction and privacy complaints</h2>
<p>Privacy questions, requests to access or correct personal information APG holds, and privacy complaints can be sent to ${mail()}. Signed-in users can also inspect and manage supported My APG account and workspace information through the account experience.</p>
<h2 id="security">10. Security</h2>
<p>APG uses measures appropriate to the current service, including encrypted web connections, authenticated access controls and account-level separation for synced workspace data. No internet service can promise absolute security. Users should keep account credentials private and should not send passwords or payment-card details to APG by email.</p>
<h2 id="law">11. Australian privacy position</h2>
<p>APG monitors its privacy obligations as the service, data practices and business change. Nothing in this policy is intended to remove any privacy right or remedy that applies under Australian law. APG does not rely on this page to claim a permanent exemption from privacy obligations.</p>
<h2 id="updates">12. Changes to this policy</h2>
<p>APG will update this policy when its material information-handling practices change. The effective and review dates above are advanced only when a substantive review or change has occurred.</p>
<h2 id="contact">13. Contact</h2>
<p>For privacy enquiries, access or correction requests, or a privacy complaint, email ${mail()}.</p>
${related}`
  },
  terms:{
    title:'Terms of Use | Australian Product Guide',
    heading:'Terms of Use',
    description:'Terms governing informational comparisons, recommendations, retailer links, optional accounts and use of Australian Product Guide.',
    body:`${effective}
<p class="policy-lead">These terms describe the current APG website and its product-research, comparison, recommendation, account and retailer-link services. Nothing in them is intended to exclude a right or remedy that cannot lawfully be excluded under Australian law.</p>
<h2 id="acceptance">1. Acceptance</h2>
<p>By using APG you agree to use the service consistently with these terms and applicable law. If you do not agree, you should not rely on the service.</p>
<h2 id="purpose">2. Purpose of APG</h2>
<p>APG provides product research, comparison and recommendation tools and links to third-party information or retailers. APG is not the seller of products displayed on the site unless explicitly stated otherwise.</p>
<h2 id="information">3. Informational nature</h2>
<p>APG information supports consumer research and does not replace judgement about your own circumstances. APG cannot guarantee that a maintained product is suitable for every person, home, device ecosystem or use case.</p>
<h2 id="comparisons">4. Comparisons and recommendations</h2>
<p>Recommendations operate within APG's maintained dataset, the evidence available and the decision factors supplied. “Best match” is scoped to that set and those inputs; it is not a claim that APG has compared every product on the Australian market or that one product is universally superior.</p>
<h2 id="changes">5. Product information changes</h2>
<p>Specifications, model generations, compatibility, availability and manufacturer information can change. Verify any requirement that is consequential to your purchase with the current manufacturer or other authoritative source.</p>
<h2 id="pricing">6. Prices and availability</h2>
<p>APG does not promise a comprehensive live price feed. Reference price context can become stale. Retailer price, seller, stock, delivery and promotion terms should be checked at the point of purchase.</p>
<h2 id="retailers">7. Retailer information</h2>
<p>Retailer links may be exact product destinations or clearly presented search fallbacks. The retailer controls its transaction, seller relationship, fulfilment, returns, warranties and support processes.</p>
<h2 id="affiliate">8. Affiliate relationships</h2>
<p>APG may earn commission from qualifying purchases after eligible retailer referrals. Commercial relationships contribute zero points to product suitability or ranking. See the <a href="/affiliate-disclosure/">Affiliate Disclosure</a>.</p>
<h2 id="third-party">9. Third-party sites</h2>
<p>External sites are not controlled by APG. Their content, availability, terms, privacy practices, seller identity and transaction processes can change independently.</p>
<h2 id="ip">10. Intellectual property</h2>
<p>APG's original branding, code, structured editorial presentation and original visual assets are protected to the extent provided by law. Third-party names and trademarks remain the property of their respective owners. Third-party product content is used only where APG has an appropriate usage basis.</p>
<h2 id="accounts">11. Optional accounts</h2>
<p>My APG accounts are optional and are not required for core browsing, search, comparison or recommendation tools. Account holders are responsible for keeping sign-in credentials secure. APG may restrict or discontinue account functionality where reasonably necessary for security, abuse prevention or service operation.</p>
<p>Signed-in users can use the account controls available in My APG to manage supported account and workspace information, including permanent account deletion. Account deletion removes the authenticated account and synced APG workspace through the available deletion process. Browser-local research is separate and remains until the user clears it from that browser.</p>
<h2 id="acceptable">12. Acceptable use</h2>
<p>Do not misuse the site, interfere with its operation, attempt unauthorised access, submit malicious requests or use APG in a way that infringes rights or applicable law.</p>
<h2 id="reliance">13. Reliance and risk</h2>
<p>APG aims to be accurate but cannot guarantee that every external source or volatile retailer fact remains current. Before a consequential purchase, verify important dimensions, compatibility, safety requirements, warranty terms, exact model identity and current retailer information.</p>
<h2 id="liability">14. Liability and mandatory rights</h2>
<p>Nothing in these terms is intended to exclude, restrict or modify any guarantee, right or remedy that cannot lawfully be excluded, including applicable rights under the Australian Consumer Law. Any limitation concept in these terms must be read subject to those mandatory protections.</p>
<h2 id="service">15. Changes to the service</h2>
<p>APG may change coverage, features, recommendation logic, retailer pathways or service availability as the product develops. Material changes to methodology, privacy or commercial disclosure should be reflected in the relevant public page.</p>
<h2 id="updates">16. Changes to these terms</h2>
<p>The effective and review dates appear above. Continued use after a published update is subject to the current terms, while mandatory rights remain unaffected.</p>
<h2 id="law">17. Governing law</h2>
<p>These terms are for an Australian-facing service and are subject to applicable Australian law.</p>
<h2 id="contact">18. Contact</h2>
<p>Questions about these terms can be sent to ${mail()} or through the <a href="/contact/">Contact page</a>.</p>
${related}`
  },
  coverage:{
    title:'Coverage | Australian Product Guide',
    heading:'Coverage and catalogue scope',
    description:'What Australian Product Guide currently maintains, what its comparisons cover and what inclusion or absence does not mean.',
    body:`${reviewed}
<div class="notice"><strong>Coverage principle.</strong> APG does not compare every product, brand or retailer available in Australia. Its maintained catalogue is a curated decision set, not a claim of whole-of-market coverage.</div>
<p class="policy-lead">APG prefers a maintained, explainable catalogue over a larger collection of thin pages. Coverage expands when APG can support useful decision factors, credible Australian evidence and ongoing maintenance.</p>
<h2 id="current">Current maintained coverage</h2>
<p>APG currently maintains <strong>${facts.products} products across ${facts.categories} populated categories, representing ${facts.brands} brands</strong>. These figures are calculated from the same structured catalogue that powers the live site and update automatically when that catalogue changes.</p>
<h2 id="market">What APG does not cover</h2>
<p>APG does not claim to include every product, every model generation, every retailer or every Australian offer. Products outside APG's maintained catalogue may be excellent choices. A product or brand being absent from APG is not a negative judgement about its quality.</p>
<h2 id="inclusion">How products and categories enter coverage</h2>
<p>Coverage is expanded where APG can define the shopper decision, maintain a useful product set, verify important Australian product or model evidence, and support meaningful comparison or recommendation behaviour. Evidence depth can vary and is disclosed rather than hidden.</p>
<h2 id="commercial">Commercial relationships do not define coverage</h2>
<p>Affiliate status, commission opportunity, retailer participation and the availability of an exact retailer link do not make a product a better fit and do not add recommendation points. APG may maintain products without an affiliate destination and may omit products despite an available commercial link.</p>
<h2 id="research">Unpublished and developing coverage</h2>
<p>APG may research additional categories or products before publishing them as maintained coverage. A research idea is not presented as active consumer coverage until APG can support it responsibly.</p>
<h2 id="verify">What shoppers should still verify</h2>
<p>Because model ranges, sellers, prices, availability and specifications can change, shoppers should verify consequential requirements with the manufacturer or retailer before buying.</p>
${related}`
  },
  updates:{
    title:'Updates | Australian Product Guide',
    heading:'Updates and release status',
    description:'Material Australian Product Guide updates to consumer experience, coverage, evidence, privacy and shopping controls.',
    body:`${reviewed}
<p class="policy-lead">This page records material consumer-facing changes to APG's experience, coverage, evidence and governance. Dates reflect real review or release events rather than automated freshness.</p>
<h2 id="trust-centre">23 August 2026 — Trust Centre and company-information reconciliation</h2>
<p>APG consolidated its eleven Trust Centre and company-information pages into a single authoritative content source. Catalogue scope on these pages now comes from the live structured catalogue rather than separately typed totals. Privacy, Amazon affiliate, comparison-scope, contact, corrections and Terms wording were reconciled to the current operating model, and a dedicated release gate now checks all eleven pages for superseded statements.</p>
<p><strong>Current maintained scope:</strong> ${facts.products} products, ${facts.categories} populated categories and ${facts.brands} represented brands. This is curated APG coverage and is not a claim of whole-of-market comparison.</p>
<h2 id="consumer-experience">23 August 2026 — Consumer-language reconciliation</h2>
<p>Decision and product-research surfaces were reviewed to reduce implementation language in consumer-facing copy while preserving explainable recommendations, evidence visibility and affiliate independence.</p>
<h2 id="aug17">17 August 2026 — Editorial, compliance and discovery review</h2>
<p>APG reviewed catalogue, discovery and trust content against the operating model, strengthened disclosure of evidence depth and retailer-link types, clarified account and analytics practices, and reinforced that the maintained catalogue is not whole-of-market coverage.</p>
<h2 id="aug16">16 August 2026 — Site-wide navigation and product-research update</h2>
<p>APG upgraded navigation, search presentation, comparison journeys, trust navigation and retailer-record controls while retaining its lightweight server-rendered architecture.</p>
<h2 id="amazon">Amazon product links and content</h2>
<p>APG uses exact Amazon Australia product destinations only when the relevant product or variant identity is verified; otherwise it may use a transparent model-specific search fallback. Amazon Program Content is used only through mechanisms permitted by the applicable Amazon Associates programme terms and policies, with product identity and usage basis checked before publication.</p>
<h2 id="maintenance">Ongoing maintenance principles</h2>
<ul><li>Material product changes are made in the structured product record first.</li><li>Recommendations and comparisons are checked after relevant data or logic changes.</li><li>Pricing, seller and availability information are treated as volatile.</li><li>Third-party imagery requires an appropriate source, product match and usage basis.</li><li>Commercial relationships remain outside product-fit scoring.</li><li>Trust Centre review dates advance only after substantive review or change.</li></ul>
<h2 id="priorities">Current evidence priorities</h2>
<p>Current priorities remain deeper evidence in thinner categories, lawful genuine product imagery, stronger exact Australian retailer coverage, better freshness controls and clearer decision attributes where they materially improve shopper outcomes.</p>
${related}`
  }
};

Object.defineProperty(content,'__facts',{value:facts,enumerable:false});
Object.defineProperty(content,'__reviewDate',{value:REVIEW_DATE,enumerable:false});
Object.defineProperty(content,'__contactEmail',{value:CONTACT_EMAIL,enumerable:false});

module.exports=content;
