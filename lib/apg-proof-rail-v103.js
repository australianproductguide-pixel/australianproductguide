'use strict';

// APG Proof Rail v103.0
// Pure SSR component + homepage transformer. Runtime wrapping is kept separate so this
// module remains easy to certify without booting the full APG request stack.
const platformFacts=require('./platform-facts-v101');
const {brands}=require('./routes');

const VERSION='103.0';
const CSS='/assets/apg-proof-rail-v103.css?v=103';
const JS='/assets/apg-proof-rail-v103.js?v=103';

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
      stat:String(stats.products),
      headline:`Maintained products across ${stats.categories} categories`,
      support:`${stats.brands} brands represented`
    },
    {
      kicker:'INDEPENDENT RECOMMENDATIONS',
      stat:'0',
      headline:'Commercial relationships add zero recommendation points',
      support:'Affiliate commission and retailer participation never improve product suitability or rank.'
    },
    {
      kicker:'AUSTRALIAN-FIRST GUIDANCE',
      stat:'AU',
      headline:'Built for Australian shoppers',
      support:'Local availability, Australian retailer pathways and Australian buying context are prioritised.'
    },
    {
      kicker:'EVIDENCE BEFORE HYPE',
      stat:'SRC',
      headline:'Sources shown, uncertainty disclosed',
      support:'Manufacturer information and credible sources are preferred over generic claims or unsupported marketing.'
    },
    {
      kicker:'FIT OVER UNIVERSAL WINNERS',
      stat:'FIT',
      headline:'No single “best” product for everyone',
      support:'Recommendations follow budget, needs, priorities and deal-breakers.'
    }
  ];
}

function statMark(value){
  const label=esc(value);
  const tiles=String(value).split('').map(char=>`<span aria-hidden="true">${esc(char)}</span>`).join('');
  return `<span class="apg-proof-mark-v103" role="img" aria-label="${label}">${tiles}</span>`;
}

function proofCard(card,index,total){
  const number=index+1;
  return `<article class="apg-proof-card-v103" data-proof-card role="group" aria-label="Proof ${number} of ${total}: ${esc(card.kicker)}"><span class="apg-proof-kicker-v103">${esc(card.kicker)}</span>${statMark(card.stat)}<h3>${esc(card.headline)}</h3><p>${esc(card.support)}</p></article>`;
}

function arrow(direction){
  const previous=direction==='prev';
  const label=previous?'Previous proof':'Next proof';
  const data=previous?'data-proof-prev':'data-proof-next';
  const path=previous?'M15 18l-6-6 6-6':'M9 6l6 6-6 6';
  return `<button class="apg-proof-arrow-v103 is-${direction}" type="button" ${data} aria-label="${label}" aria-controls="apg-proof-track-v103"><svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="${path}"/></svg></button>`;
}

function ApgProofRail(stats=proofStats()){
  const cards=proofCards(stats);
  return `<section class="apg-proof-rail-v103" aria-label="Australian Product Guide proof rail" data-apg-proof-rail data-apg-proof-rail-version="${VERSION}" data-apg-proof-products="${esc(stats.products)}" data-apg-proof-categories="${esc(stats.categories)}" data-apg-proof-brands="${esc(stats.brands)}"><div class="wrap apg-proof-shell-v103"><div class="apg-proof-stage-v103">${arrow('prev')}<div class="apg-proof-track-v103" id="apg-proof-track-v103" data-proof-track tabindex="0" role="group" aria-label="Australian Product Guide proof points">${cards.map((card,index)=>proofCard(card,index,cards.length)).join('')}</div>${arrow('next')}<div class="apg-proof-progress-v103" data-proof-progress aria-live="polite" aria-atomic="true"><span class="sr-only">Proof </span><strong data-proof-current>1</strong><span aria-hidden="true"> / </span><span data-proof-total>${cards.length}</span></div></div></div></section>`;
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
