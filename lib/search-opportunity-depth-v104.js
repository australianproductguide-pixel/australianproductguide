'use strict';

const {VERSION,REVIEWED,categoryDepth}=require('../data/search-opportunity-depth-v104');
const {pairPages}=require('./routes');

const REVIEW_LABEL='25 August 2026';

function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function human(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
function dateLabel(value){
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return String(value||'not separately dated');
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${Number(m[3])} ${months[Number(m[2])-1]} ${m[1]}`;
}
function marker(){return `<meta name="apg-search-opportunity-depth" content="v${VERSION}">`;}
function addMarker(html){return html.includes('name="apg-search-opportunity-depth"')?html:html.replace('</head>',marker()+'</head>');}
function insertBefore(html,anchor,section){return html.includes(anchor)?html.replace(anchor,section+anchor):html.replace('</main>',section+'</main>');}
function depthForPath(path){
  let m=String(path||'').match(/^\/categories\/([^/]+)\/$/);if(m)return {type:'category',slug:m[1],depth:categoryDepth[m[1]]||null};
  m=String(path||'').match(/^\/guides\/([^/]+)-buying-guide\/$/);if(m)return {type:'guide',slug:m[1],depth:categoryDepth[m[1]]||null};
  m=String(path||'').match(/^\/compare\/([^/]+)\/$/);if(m)return {type:'compare-index',slug:m[1],depth:categoryDepth[m[1]]||null};
  m=String(path||'').match(/^\/compare\/([^/]+)\/[^/]+\/$/);if(m)return {type:'pair',slug:m[1],depth:categoryDepth[m[1]]||null};
  return null;
}
function numberedCards(items){return items.map((text,i)=>`<article class="feature-card"><span class="step-number">0${i+1}</span><h3>${esc(text)}</h3><p>Use this as a decision gate before secondary features or retailer promotions.</p></article>`).join('');}
function categorySection(slug,d){
  return `<section class="section soft-section full-bleed" data-apg-search-depth="category"><div class="wrap"><div class="section-head"><div><p class="kicker">High-intent decision brief</p><h2>Decide these four things before comparing ${esc(d.label.toLowerCase())}</h2><p>${esc(d.intent)}</p></div><span class="independence-badge">Decision guide updated ${REVIEW_LABEL}</span></div><div class="grid four">${numberedCards(d.decisions)}</div><div class="grid two"><article class="feature-card"><p class="eyebrow">Avoid this shortcut</p><h3>One headline feature is not the decision</h3><p>${esc(d.avoid)}</p></article><article class="feature-card"><p class="eyebrow">Verify before purchase</p><h3>Four checks that can still change the answer</h3><ul>${d.verify.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div><div class="actions"><a class="button" href="/categories/${esc(slug)}/finder/">Help me choose</a><a class="button secondary" href="/guides/${esc(slug)}-buying-guide/">Read the buying guide</a><a class="button secondary" href="/compare/${esc(slug)}/">Compare models</a></div></div></section>`;
}
function guideSection(slug,d){
  return `<section data-apg-search-depth="guide"><div class="notice"><strong>Decision-first rule:</strong> ${esc(d.intent)}</div><h2>What to verify before you commit</h2><div class="grid two">${d.verify.map((x,i)=>`<article class="feature-card"><span class="step-number">0${i+1}</span><h3>${esc(x)}</h3><p>Confirm this on the exact Australian model or current retailer/manufacturer information before purchase.</p></article>`).join('')}</div><h2>Common comparison trap</h2><p>${esc(d.avoid)}</p><p><a class="text-link" href="/compare/${esc(slug)}/">Open the maintained ${esc(d.label.toLowerCase())} comparison →</a></p></section>`;
}
function compareIndexSection(slug,d){
  return `<section class="section soft-section full-bleed" data-apg-search-depth="compare-index"><div class="wrap"><div class="section-head"><div><p class="kicker">Comparison framework</p><h2>Use the same five questions for every shortlist</h2><p>${esc(d.intent)}</p></div><span class="independence-badge">Framework reviewed ${REVIEW_LABEL}</span></div><div class="grid">${d.comparisonQuestions.map((q,i)=>`<article class="feature-card"><span class="step-number">0${i+1}</span><h3>${esc(q)}</h3><p>Compare the two candidates on this question, then record the compromise you are accepting.</p></article>`).join('')}</div><div class="notice"><strong>Still tied?</strong> Use <a href="/categories/${esc(slug)}/finder/">Help Me Choose</a> to test the shortlist against your priorities rather than defaulting to the product with more features.</div></div></section>`;
}
function uniqueSignals(product,other){
  const otherTags=new Set(other.tags||[]);
  const unique=(product.tags||[]).filter(tag=>!otherTags.has(tag)).slice(0,5);
  return unique.length?unique:(product.tags||[]).slice(0,5);
}
function pairSection(path,slug,d){
  const pair=pairPages.find(x=>x.path===path);
  if(!pair)return `<section class="section soft-section full-bleed" data-apg-search-depth="pair"><div class="wrap"><p class="kicker">Decision-first head-to-head</p><h2>Five questions that should decide this comparison</h2><div class="grid">${d.comparisonQuestions.map((q,i)=>`<article class="feature-card"><span class="step-number">0${i+1}</span><h3>${esc(q)}</h3></article>`).join('')}</div></div></section>`;
  const aSignals=uniqueSignals(pair.a,pair.b),bSignals=uniqueSignals(pair.b,pair.a);
  const aVerified=pair.a.lastSourceVerification||pair.a.lastSubstantiveReview||pair.a.lastReviewed;
  const bVerified=pair.b.lastSourceVerification||pair.b.lastSubstantiveReview||pair.b.lastReviewed;
  return `<section class="section soft-section full-bleed" data-apg-search-depth="pair"><div class="wrap"><div class="section-head"><div><p class="kicker">Decision-first head-to-head</p><h2>Five questions that should decide this comparison</h2><p>APG does not award a generic winner. The stronger choice is the product whose fit signals match your situation and whose compromise you can accept.</p></div><span class="independence-badge">Comparison framework updated ${REVIEW_LABEL}</span></div><div class="grid">${d.comparisonQuestions.map((q,i)=>`<article class="feature-card"><span class="step-number">0${i+1}</span><h3>${esc(q)}</h3><p>Use the product evidence above and below to answer this for your situation.</p></article>`).join('')}</div><div class="grid two"><article class="feature-card"><p class="eyebrow">Signals favouring ${esc(pair.a.name)}</p><h3>Choose it when these differences matter</h3><div class="pills">${aSignals.map(t=>`<span class="pill good">${esc(human(t))}</span>`).join('')}</div><p><strong>Evidence date:</strong> ${esc(dateLabel(aVerified))}. Recheck volatile retailer information before buying.</p></article><article class="feature-card"><p class="eyebrow">Signals favouring ${esc(pair.b.name)}</p><h3>Choose it when these differences matter</h3><div class="pills">${bSignals.map(t=>`<span class="pill good">${esc(human(t))}</span>`).join('')}</div><p><strong>Evidence date:</strong> ${esc(dateLabel(bVerified))}. Recheck volatile retailer information before buying.</p></article></div><div class="notice"><strong>Do not decide on a single headline:</strong> ${esc(d.avoid)}</div><div class="actions"><a class="button secondary" href="/categories/${esc(slug)}/finder/">Test my priorities</a><a class="button secondary" href="/guides/${esc(slug)}-buying-guide/">Read the category guide</a></div></div></section>`;
}
function transformHtml(html,path){
  let out=String(html||'');
  if(!out||!out.includes('<html'))return out;
  const info=depthForPath(path);
  if(!info||!info.depth)return out;
  if(info.type==='category')out=insertBefore(out,'<section class="section"><div class="section-head"><div><p class="kicker">Product catalogue</p>',categorySection(info.slug,info.depth));
  else if(info.type==='guide'){
    out=insertBefore(out,'<h2>Build a shortlist in three steps</h2>',guideSection(info.slug,info.depth));
    out=out.replace('"dateModified":"2026-08-16"',`"dateModified":"${REVIEWED}"`);
  }
  else if(info.type==='compare-index')out=insertBefore(out,'<section class="section"><div class="notice"><strong>Build your comparison:</strong>',compareIndexSection(info.slug,info.depth));
  else if(info.type==='pair')out=insertBefore(out,'<section class="section soft-panel"><p class="kicker">Which should you buy?</p>',pairSection(path,info.slug,info.depth));
  if(!out.includes('name="apg-search-opportunity-depth"'))out=addMarker(out);
  return out;
}

module.exports={VERSION,REVIEWED,REVIEW_LABEL,categoryDepth,depthForPath,categorySection,guideSection,compareIndexSection,pairSection,transformHtml};
