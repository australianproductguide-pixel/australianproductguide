'use strict';

// APG Search Opportunity Growth v104.0
// Creates a deterministic, approval-gated distribution plan for the six v104
// decision-depth categories and one curated head-to-head per category. It does
// not publish to any external platform and never substitutes retailer links for
// the canonical APG research destination.

const {categoryDepth}=require('../data/search-opportunity-depth-v104');
const {categories}=require('../data');
const {pairPages}=require('./routes');
const social=require('./social-profiles-v56');
const categoryImages=require('../data/category-editorial-images-v45');

const VERSION='104.0';
const ORIGIN='https://australianproductguide.au';
const CAMPAIGN='search-opportunity-depth-v104';
const SOCIAL_KEYS=['facebook','instagram','threads','x','pinterest','linkedin'];
const TARGETS=Object.freeze(Object.keys(categoryDepth));
const GENERIC_SHARE_IMAGE=ORIGIN+'/social/apg-share-20260822.jpg';

function canonical(path){return ORIGIN+path;}
function clean(value){return String(value||'').replace(/\s+/g,' ').trim();}
function productName(product){return clean(`${product.brand||''} ${product.name||''}`).replace(new RegExp(`^${String(product.brand||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+${String(product.brand||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s+`,'i'),`${product.brand} `);}
function pairScore(pair){
  let score=0;
  if(pair.decisionSignals?.crossBrand)score+=8;
  score+=(pair.decisionSignals?.differentTags||[]).length*2;
  score+=(pair.decisionSignals?.sharedTags||[]).length;
  for(const p of [pair.a,pair.b]){
    if(String(p.evidenceTier||'').toLowerCase()==='deep')score+=5;
    if(p.lastSourceVerification||p.lastSubstantiveReview)score+=2;
    if(Array.isArray(p.offers)&&p.offers.length)score+=1;
  }
  return score;
}
function featuredPair(slug){
  const candidates=pairPages.filter(pair=>pair.category===slug);
  return candidates.sort((a,b)=>pairScore(b)-pairScore(a)||a.path.localeCompare(b.path))[0]||null;
}
function socialProfiles(){
  const map=social.socialProfiles;
  return SOCIAL_KEYS.map(key=>({key,...map[key]})).filter(item=>item.active&&item.verified&&item.url);
}
function categoryCreative(slug){
  const image=categoryImages[slug];
  if(!image)return {type:'generic-apg-card',url:GENERIC_SHARE_IMAGE,usage:'Generic APG campaign artwork; safe fallback when no verified category editorial image is available.'};
  return {
    type:'category-editorial-context',
    url:canonical(image.src),
    sourcePage:image.sourcePage,
    creator:image.creator,
    license:image.license,
    licenseUrl:image.licenseUrl,
    reviewedAt:image.reviewedAt,
    usage:'Decorative category context only; do not imply this depicts a reviewed, compared or recommended product.'
  };
}
function platformDrafts({label,intent,destination,kind,pair}){
  const lower=label.toLowerCase();
  const headline=kind==='head-to-head'&&pair?`${productName(pair.a)} vs ${productName(pair.b)}`:`Choosing ${lower}`;
  const question=kind==='head-to-head'?'Which differences actually change the choice?':'Which four decisions should you make before comparing models?';
  return Object.freeze({
    facebook:Object.freeze({destination,copy:`${headline}: ${question} APG breaks the decision into the trade-offs and checks that matter before you buy. ${intent} ${destination}`}),
    instagram:Object.freeze({destination,copy:`${headline}. ${question}\n\n${intent}\n\nAPG keeps retailer commission outside recommendation scoring. Full decision guide: ${destination}`}),
    threads:Object.freeze({destination,copy:`${headline}: ${question} ${intent} ${destination}`}),
    x:Object.freeze({destination,copy:`${headline}: ${question} ${intent} ${destination}`}),
    linkedin:Object.freeze({destination,copy:`A better product comparison starts with the decision, not the feature count. ${headline}: ${question} ${intent} APG's guidance is desk-researched and affiliate economics contribute zero recommendation points. ${destination}`}),
    pinterest:Object.freeze({destination,title:`${headline} | Australian buying decision guide`,description:`${question} ${intent} Compare the decision factors, trade-offs and purchase checks on Australian Product Guide.`})
  });
}
function buildItems(){
  const items=[];
  for(const slug of TARGETS){
    const d=categoryDepth[slug],category=categories[slug];
    if(!category)continue;
    const categoryPath=`/categories/${slug}/`;
    const pair=featuredPair(slug);
    items.push(Object.freeze({
      id:`${slug}-category`,kind:'category-depth',slug,label:d.label,status:'READY_FOR_HUMAN_APPROVAL_NOT_PUBLISHED',
      destinationPath:categoryPath,destination:canonical(categoryPath),
      supportingPaths:Object.freeze([`/guides/${slug}-buying-guide/`,`/compare/${slug}/`,`/categories/${slug}/finder/`]),
      creative:categoryCreative(slug),
      angle:d.intent,
      drafts:platformDrafts({label:d.label,intent:d.intent,destination:canonical(categoryPath),kind:'category-depth'})
    }));
    if(pair){
      items.push(Object.freeze({
        id:`${slug}-head-to-head`,kind:'head-to-head',slug,label:d.label,status:'READY_FOR_HUMAN_APPROVAL_NOT_PUBLISHED',
        destinationPath:pair.path,destination:canonical(pair.path),
        pair:Object.freeze({a:productName(pair.a),b:productName(pair.b),score:pairScore(pair)}),
        creative:Object.freeze({type:'generic-apg-card',url:GENERIC_SHARE_IMAGE,usage:'Use the generic APG card unless a product-specific comparison creative independently passes exact-identity and rights/provenance checks.'}),
        angle:d.comparisonQuestions[0],
        drafts:platformDrafts({label:d.label,intent:d.intent,destination:canonical(pair.path),kind:'head-to-head',pair})
      }));
    }
  }
  return Object.freeze(items);
}

const authorityQueue=Object.freeze([
  Object.freeze({channel:'SourceBottle',mode:'earned-expert-response',priority:'P1',status:'PREPARED_NOT_SENT',use:'Respond only to tightly relevant journalist call-outs on Australian shopping, product comparison, consumer decision-making or AI-assisted shopping.',linkRule:'A citation or APG link must be editorially relevant; never ask for a ranking link or imply hands-on testing.'}),
  Object.freeze({channel:'Qwoted',mode:'earned-expert-response',priority:'P1',status:'PREPARED_NOT_SENT',use:'Use limited pitches only when APG can add evidence-backed product/consumer insight to a live journalist request.',linkRule:'Expert value first; no generic site pitches or fabricated data.'}),
  Object.freeze({channel:'Startup Daily',mode:'editorial-story-tip',priority:'P1',status:'PREPARED_NOT_SENT',use:'Pitch only a genuine Australian consumer-tech or AI-shopping milestone, original dataset or material product launch.',linkRule:'Pitch a newsworthy story, not a backlink request.'}),
  Object.freeze({channel:'SmartCompany',mode:'editorial-contribution',priority:'P1',status:'PREPARED_NOT_SENT',use:'Contribute only original, useful Australian small-business/product-intelligence material that stands independently of APG promotion.',linkRule:'No promotional guest-post framing; publication remains an editorial decision.'}),
  Object.freeze({channel:'techAU',mode:'technology-story-tip',priority:'P2',status:'PREPARED_NOT_SENT',use:'Use for a substantive Decision Lab, Scout, explainable-recommendation or consumer-tech milestone with an Australian angle.',linkRule:'Evidence-backed tip only; no placement or link guarantee.'})
]);

const expansionGate=Object.freeze({
  rule:'Observed search demand + decision usefulness + evidence readiness before new route expansion.',
  signals:Object.freeze([
    'Search Console shows recurring or rising impressions for a clearly matched Australian buying decision.',
    'The query/page relationship indicates a real decision gap rather than a wording variation of an existing page.',
    'APG has enough exact Australian evidence to add materially useful guidance without guessing.',
    'The new or expanded page can be differentiated from existing canonical pages without cannibalisation.',
    'Indexability, internal linking, structured data and mobile/desktop quality can be verified before release.'
  ]),
  prohibitions:Object.freeze([
    'No automatic page creation from query strings.',
    'No mass A-vs-B Cartesian comparison generation.',
    'No page expansion for affiliate availability, commission or retailer participation.',
    'No fake freshness or unsupported best/winner claims.'
  ])
});

function plan(){return Object.freeze({version:VERSION,campaign:CAMPAIGN,targets:TARGETS,profiles:socialProfiles(),items:buildItems(),authorityQueue,expansionGate,published:false});}

module.exports={VERSION,ORIGIN,CAMPAIGN,SOCIAL_KEYS,TARGETS,GENERIC_SHARE_IMAGE,pairScore,featuredPair,socialProfiles,categoryCreative,platformDrafts,buildItems,authorityQueue,expansionGate,plan};
