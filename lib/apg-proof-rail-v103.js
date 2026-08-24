'use strict';

// APG Proof Rail v103.1
// Pure SSR component + homepage transformer. Runtime wrapping is kept separate so this
// module remains easy to certify without booting the full APG request stack.
const platformFacts=require('./platform-facts-v101');
const {brands}=require('./routes');

const VERSION='103.1';
const CSS='/assets/apg-proof-rail-v103.css?v=103.1';
const JS='/assets/apg-proof-rail-v103.js?v=103.1';

function esc(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function proofStats(){
  const snapshot=platformFacts.publicSnapshot();
  return Object.freeze({
    products:Number(snapshot?.catalogue?.products||0),
    categories:Number(snapshot?.catalogue?.categories||0),
    brands:Array.isArray(brands)?brands.length:0
  });
}

function proofCards(stats=proofStats()){
  return [
    {
      kicker:'MAINTAINED AUSTRALIAN RESEARCH',
      value:String(stats.products),
      valueKind:'metric',
      headline:`Maintained products across ${stats.categories} categories`,
      support:`${stats.brands} brands represented`
    },
    {
      kicker:'INDEPENDENT RECOMMENDATIONS',
      value:'0',
      valueKind:'metric',
      headline:'Commercial relationships add zero recommendation points',
      support:'Affiliate commission and retailer participation never improve product suitability or rank.'
    },
    {
      kicker:'AUSTRALIAN-FIRST GUIDANCE',
      value:'Australian-first',
      valueKind:'phrase',
      headline:'Built for Australian shoppers',
      support:'Local availability, Australian retailer pathways and Australian buying context are prioritised.'
    },
    {
      kicker:'EVIDENCE BEFORE HYPE',
      value:'Sources shown',
      valueKind:'phrase',
      headline:'Uncertainty disclosed',
      support:'Manufacturer information and credible sources are preferred over generic claims or unsupported marketing.'
    },
    {
      kicker:'FIT OVER UNIVERSAL WINNERS',
      value:'Best fit',
      valueKind:'phrase',
      headline:'No single “best” product for everyone',
      support:'Recommendations follow budget, needs, priorities and deal-breakers.'
    }
  ];
}

function proofValue(card){
  const kind=card.valueKind==='phrase'?'phrase':'metric';
  return `<div class="apg-proof-value-v103 is-${kind}">${esc(card.value)}</div>`;
}

function proofCard(card,index,total){
  const number=index+1;
  return `<article class="apg-proof-card-v103" data-proof-card role="group" aria-label="Proof ${number} of ${total}: ${esc(card.kicker)}"><span class="apg-proof-kicker-v103">${esc(card.kicker)}</span>${proofValue(card)}<h3>${esc(card.headline)}</h3><p>${esc(card.support)}</p></article>`;
}

function arrow(direction){
  const previous=direction==='prev';
  const label=previous?'Previous proof':'Next proof';
  const data=previous?'data-proof-prev':'data-proof-next';
  const path=previous?'M15 18l-6-6 6-6':'M9 6l6 6-6 6';
  return `<button class="apg-proof-arrow-v103 is-${direction}" type="button" ${data} aria-label="${label}" aria-controls="apg-proof-track-v103"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="${path}"/></svg></button>`;
}

function proofDots(total){
  return `<span class="apg-proof-dots-v103" data-proof-dots aria-hidden="true">${Array.from({length:total},(_,index)=>`<span class="apg-proof-dot-v103${index===0?' is-active':''}" data-proof-dot></span>`).join('')}</span>`;
}

function ApgProofRail(stats=proofStats()){
  const cards=proofCards(stats);
  return `<section class="apg-proof-rail-v103" aria-label="Australian Product Guide proof rail" data-apg-proof-rail data-apg-proof-rail-version="${VERSION}" data-apg-proof-products="${esc(stats.products)}" data-apg-proof-categories="${esc(stats.categories)}" data-apg-proof-brands="${esc(stats.brands)}"><div class="wrap apg-proof-shell-v103"><div class="apg-proof-stage-v103">${arrow('prev')}<div class="apg-proof-track-v103" id="apg-proof-track-v103" data-proof-track tabindex="0" role="group" aria-label="Australian Product Guide proof points">${cards.map((card,index)=>proofCard(card,index,cards.length)).join('')}</div>${arrow('next')}<div class="apg-proof-progress-v103" data-proof-progress aria-live="polite" aria-atomic="true"><span class="sr-only">Proof <strong data-proof-current>1</strong> of <span data-proof-total>${cards.length}</span></span>${proofDots(cards.length)}</div></div></div></section>`;
}

const LEGACY_PROOF=/<section\b(?=[^>]*(?:apg-proof-band-v20|apg-proof-band-v19|apg-home-proof-v9))[^>]*>[\s\S]*?<\/section>/i;

function transformHomepage(html,path='/'){
  if(path!=='/')return String(html||'');
  let out=String(html||'');
  if(!LEGACY_PROOF.test(out))return out;
  out=out.replace(LEGACY_PROOF,ApgProofRail());
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  if(!out.includes(JS))out=out.replace('</body>',`<script src="${JS}" defer></script></body>`);
  return out;
}

module.exports={VERSION,CSS,JS,proofStats,proofCards,ApgProofRail,transformHomepage};
