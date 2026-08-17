// APG account governance v25 over the v24.1 profile/account journey.
// Final-response policy hygiene: removes legacy duplicate account sections,
// reconciles TOC numbering and updates account/privacy disclosures to current behaviour.
const app=require('./account-profile-v24');

const PRIMARY_ORIGIN='https://australianproductguide.au';

const PRIVACY_TOC='<nav class="policy-toc" aria-label="On this page"><strong>On this page</strong><a href="#scope">1. Scope</a><a href="#collected">2. Information you actively enter</a><a href="#account">3. Optional My Australian Product Guide accounts</a><a href="#not-collected">4. Information Australian Product Guide does not currently ask you to provide</a><a href="#local">5. Browser local storage and sync</a><a href="#cookies">6. Cookies and analytics</a><a href="#technical">7. Technical and usage information</a><a href="#search">8. Search, comparison and recent activity</a><a href="#affiliate">9. Affiliate click-outs and retailer relationships</a><a href="#third-party">10. Third-party services and disclosure</a><a href="#overseas">11. Overseas processing</a><a href="#retention">12. Retention and deletion</a><a href="#security">13. Security</a><a href="#rights">14. Access, correction and complaints</a><a href="#act">15. Australian Privacy Act position</a><a href="#updates">16. Policy updates</a><a href="#contact">17. Contact</a></nav>';
const TERMS_TOC='<nav class="policy-toc" aria-label="On this page"><strong>On this page</strong><a href="#acceptance">1. Acceptance</a><a href="#purpose">2. Purpose of Australian Product Guide</a><a href="#information">3. Informational nature</a><a href="#comparisons">4. Comparisons and recommendations</a><a href="#changes">5. Product information changes</a><a href="#pricing">6. Prices and availability</a><a href="#retailers">7. Retailer information</a><a href="#affiliate">8. Affiliate relationships</a><a href="#third-party">9. Third-party sites</a><a href="#ip">10. Intellectual property</a><a href="#accounts">11. Optional accounts</a><a href="#acceptable">12. Acceptable use</a><a href="#reliance">13. Reliance and risk</a><a href="#liability">14. Liability and mandatory rights</a><a href="#service">15. Changes to the service</a><a href="#updates">16. Changes to these terms</a><a href="#law">17. Governing law</a><a href="#contact">18. Contact</a></nav>';

const PRIVACY_ACCOUNT='<h2 id="account">3. Optional My Australian Product Guide accounts</h2><p>If you choose to create a My Australian Product Guide account, Australian Product Guide processes your email address, authentication records and the workspace items you choose to sync. Authentication and synced workspace data are provided through Australian Product Guide\'s Supabase project hosted in the Sydney region. Account data, account status and communication preferences do not change product suitability scores, retailer ranking or affiliate weighting.</p><p>Signed-in users can inspect their account status, manage the separate product-research email preference, change their password, download a JSON copy of account metadata and My APG workspace information available to the signed-in browser, and permanently delete the account. Permanent deletion removes the authenticated account and cascades deletion of synced Australian Product Guide workspace and communication-preference records. The deletion flow re-confirms the current password and requires an explicit DELETE confirmation. Browser-local research is separate and is only cleared when the user chooses that option.</p>';
const TERMS_ACCOUNT='<h2 id="accounts">11. Optional accounts</h2><p>My Australian Product Guide accounts are optional and are not required for core browsing, search, comparison or recommendation tools. Account holders are responsible for keeping sign-in credentials secure. Australian Product Guide may restrict or discontinue account functionality where reasonably necessary for security, abuse prevention or service operation.</p><p>Signed-in account holders can manage password and communication settings, download a copy of My APG account/workspace information available to the signed-in browser and permanently delete the account. Permanent deletion removes the authenticated account and synced Australian Product Guide cloud workspace. Browser-local research is independent and remains unless the user separately chooses to clear it. Product-research email preferences are optional and separate from account creation.</p>';

function replaceInnerToc(html,toc){
  return html.replace(/<nav class="policy-toc" aria-label="On this page">[\s\S]*?<\/nav>/,toc);
}
function currentDates(html){
  return html
    .replace(/Effective 17 August 2026/g,'Effective 18 August 2026')
    .replace(/Last updated 17 August 2026/g,'Last updated 18 August 2026')
    .replace(/Current data practices · 17 August 2026\./g,'Current data practices · 18 August 2026.');
}
function cleanPrivacy(html){
  let out=String(html||'');
  // Remove the later account-platform duplicate while retaining the canonical local-storage heading.
  out=out.replace(/<h2 id="accounts-and-updates">[\s\S]*?(?=<h2 id="local">)/g,'');
  out=out.replace(/<h2 id="account">[\s\S]*?(?=<h2 id="not-collected">)/,PRIVACY_ACCOUNT);
  out=replaceInnerToc(out,PRIVACY_TOC);
  out=currentDates(out);
  out=out.replace(/<h2 id="rights">14\. Access, correction and complaints<\/h2><p>[\s\S]*?<\/p>/,'<h2 id="rights">14. Access, correction and complaints</h2><p>Signed-in users can inspect and manage their My Australian Product Guide account, export the account/workspace information available to the signed-in browser, change the optional product-research email preference and permanently delete the account. Australian Product Guide provides self-service account controls. A dedicated venture privacy contact and documented access/correction/complaint process remains a planned governance uplift as identifiable information collection grows.</p>');
  return out;
}
function cleanTerms(html){
  let out=String(html||'');
  // Remove the later account-platform duplicate while retaining the canonical Acceptable use heading.
  out=out.replace(/<h2 id="optional-accounts">[\s\S]*?(?=<h2 id="acceptable">)/g,'');
  out=out.replace(/<h2 id="accounts">[\s\S]*?(?=<h2 id="acceptable">)/,TERMS_ACCOUNT);
  out=replaceInnerToc(out,TERMS_TOC);
  out=currentDates(out);
  return out;
}
function cleanPolicy(html,path){
  if(path==='/privacy/')return cleanPrivacy(html);
  if(path==='/terms/')return cleanTerms(html);
  return String(html||'');
}
function transform(html,pathOrUrl){
  const base=app.transform?app.transform(String(html||''),pathOrUrl):String(html||'');
  let path='/';try{path=new URL(pathOrUrl||'/',PRIMARY_ORIGIN).pathname}catch{}
  return cleanPolicy(base,path);
}

module.exports=async(req,res)=>{
  let path='/';try{path=new URL(req.url,PRIMARY_ORIGIN).pathname}catch{}
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=cleanPolicy(body,path);
    return end(body,...args);
  };
  return app(req,res);
};

module.exports.transform=transform;
module.exports.cleanPolicy=cleanPolicy;
module.exports.cleanPrivacy=cleanPrivacy;
module.exports.cleanTerms=cleanTerms;
