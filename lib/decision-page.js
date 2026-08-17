const {categories}=require('../data');
const {brands,slugify}=require('./routes');
const {rankDecision,publicDecision,human}=require('./decision-engine-v4');
const {esc,layout,productVisual,pill,priceContext}=require('./ui');

const homeCrumb={name:'Home',path:'/'};
const selected=(a,b)=>a===b?' selected':'';
const tone=label=>label==='Strong fit'?'strong':label==='Good fit'?'good':label==='Needs verification'?'compromise':label==='Constraint conflict'?'compromise':'explore';
const decisionKeys=['q','category','budget','brand'];

function safeDecisionUrl(u){
  const params=new URLSearchParams();
  for(const key of decisionKeys){const value=u.searchParams.get(key);if(value)params.set(key,value);}
  const query=params.toString();
  return u.pathname+(query?'?'+query:'');
}
function describeIntent(intent){
  const s=intent.decisionState||{},out=[];
  if(intent.category?.label)out.push(intent.category.label);
  if(s.budget?.amount)out.push(`${s.budget.hard?'Maximum':'Around'} A$${Number(s.budget.amount).toLocaleString('en-AU')}`);
  for(const x of s.hardConstraints?.requiredTags||[])out.push(`Must have ${human(x)}`);
  for(const x of s.hardConstraints?.excludedTags||[])out.push(`Without ${human(x)}`);
  for(const x of s.hardConstraints?.excludedBrands||[])out.push(`No ${x}`);
  for(const x of s.numericConstraints||[])out.push(`${x.hard?'Required':'Target'} ${x.value}${x.unit==='in'?' inches':' '+x.unit}`);
  for(const x of s.softPreferences||[])out.push(`${x.priority==='highest'?'Top priority · ':x.priority==='high'?'Priority · ':''}${human(x.tag)}`);
  return [...new Set(out)].slice(0,12);
}
function resultCard(r,i,cleanAvailable){
  const p=r.p,rankLabel=!cleanAvailable?'Closest maintained option':i===0?'Best fit':'Alternative '+(i+1),verify=[...(r.verificationNeeds||[]),...(r.hardFailures||[])];
  return `<article class="decision-result ${i===0&&cleanAvailable?'decision-result-top':''}">
    <div class="decision-rank"><span>${rankLabel}</span><strong class="decision-match ${tone(r.matchLabel)}">${esc(r.matchLabel)}</strong></div>
    <div class="decision-result-grid">${productVisual(p,i===0)}<div class="decision-result-copy">
      <p class="eyebrow">${esc(p.brand)} · ${esc(p.categoryLabel)}</p>
      <h2><a href="/products/${p.slug}/">${esc(p.name)}</a></h2>
      <p>${esc(p.summary)}</p>
      <div class="decision-confidence">${pill(r.confidence?.label||'Limited evidence',r.confidence?.level==='high'?'good':'')}${pill(r.eligibility,r.eligibility==='eligible'?'good':'')}</div>
      ${r.reasons.length?`<div class="decision-reasons"><strong>Why it fits</strong><ul>${r.reasons.slice(0,5).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${r.conflicts.length?`<div class="decision-caution"><strong>Conflict to resolve</strong><ul>${r.conflicts.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${verify.length?`<div class="decision-verification"><strong>${r.eligibility==='ineligible'?'Hard constraint conflict':'Verify before relying on this fit'}</strong><ul>${verify.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      ${r.gaps.length?`<details class="decision-gaps"><summary>What is not confirmed as a match</summary><ul>${r.gaps.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}
      <div class="decision-tradeoff"><strong>Important trade-off</strong><span>${esc(p.watch)}</span></div>
      <div class="decision-price">${priceContext(p)}</div>
      <div class="actions"><a class="button" href="/products/${p.slug}/">Inspect decision guide</a><button class="compare-button" type="button" data-compare-product="${p.slug}" aria-pressed="false">Compare</button><button class="save-button" type="button" data-save-product="${p.slug}" aria-pressed="false" aria-label="Save ${esc(p.name)}">♡</button></div>
    </div></div>
  </article>`;
}

function decisionLab(req,u){
  const path='/decision-lab/';
  const q=u.searchParams.get('q')||'';
  const opts={category:u.searchParams.get('category')||'',budget:u.searchParams.get('budget')||'',brand:u.searchParams.get('brand')||''};
  const hasInput=!!(q.trim()||opts.category||opts.budget||opts.brand);
  const run=hasInput?rankDecision(q,opts):null,pub=hasInput?publicDecision(q,opts):null,intent=run?.intent||null,signals=intent?describeIntent(intent):[];
  const viable=run?run.ranked.filter(r=>r.eligibility!=='ineligible'):[],cleanAvailable=!!(run&&run.counts.eligible>0),top=run?(viable.length?viable:run.ranked).slice(0,5):[];
  const persistedUrl=safeDecisionUrl(u);
  const examples=['Quiet headphones for long flights with strong battery life','Robot vacuum for pet hair and mopping, but avoid premium models','Easy automatic coffee machine under $1,300 for milk drinks and switching beans','75-inch TV for a bright living room, sport and Netflix under $2,500'];
  const body=`<section class="decision-hero"><div class="wrap decision-hero-grid"><div><p class="kicker">APG Decision Lab</p><h1>Describe the purchase. Get the shortlist and the reasoning.</h1><p class="lede">Decision Engine v4 turns your needs, maximum budget, priorities and deal-breakers into an explainable shortlist drawn only from APG's maintained Australian product set. Hard constraints are enforced; missing proof is disclosed rather than guessed.</p><div class="decision-principles"><span>Maintained data only</span><span>Hard constraints before scoring</span><span>0 commercial scoring points</span><span>No mystery performance rating</span></div></div><aside class="decision-engine-card"><span class="engine-status">Decision Engine v4</span><strong>Reasoning you can inspect</strong><p>Match labels describe suitability to your stated needs. They are not laboratory scores or claims of hands-on testing.</p><a href="/methodology/">How recommendations work →</a></aside></div></section>
  <section class="section"><div class="wrap decision-shell"><form class="decision-form" method="get" data-busy-form>
    <div class="decision-query"><label for="decisionQuery">What are you trying to buy?</label><textarea id="decisionQuery" name="q" rows="3" placeholder="e.g. I want quiet headphones for long flights, good battery life, and I don't want a premium-priced model">${esc(q)}</textarea><small>Write naturally. Include priorities, maximum budget, preferred brands and things you want to avoid.</small></div>
    <div class="decision-fields"><div><label for="decisionCategory">Category</label><select id="decisionCategory" name="category"><option value="">Detect from my description</option>${Object.values(categories).map(c=>`<option value="${c.slug}"${selected(opts.category,c.slug)}>${esc(c.label)}</option>`).join('')}</select></div><div><label for="decisionBudget">Maximum budget (A$)</label><input id="decisionBudget" name="budget" inputmode="numeric" pattern="[0-9]*" value="${esc(opts.budget)}" placeholder="e.g. 1000"></div><div><label for="decisionBrand">Brand preference</label><select id="decisionBrand" name="brand"><option value="">No brand preference</option>${brands.map(b=>`<option value="${slugify(b)}"${selected(opts.brand,slugify(b))}>${esc(b)}</option>`).join('')}</select></div></div>
    <div class="decision-form-actions"><button class="button" type="submit">Build my shortlist</button>${hasInput?'<a class="button secondary" href="/decision-lab/">Start again</a>':''}<span>No account required. Inputs remain in the page URL unless you choose to save the decision.</span></div>
  </form>
  <aside class="decision-examples"><p class="eyebrow">Try a real-world need</p>${examples.map(x=>`<a href="/decision-lab/?q=${encodeURIComponent(x)}">${esc(x)}<span aria-hidden="true">→</span></a>`).join('')}</aside></div></section>
  ${hasInput?`<section class="section soft-section full-bleed"><div class="wrap"><div class="decision-summary"><div><p class="kicker">What APG understood</p><h2>Your structured decision profile</h2><p>The engine distinguishes hard constraints from preferences. Missing or conflicting evidence stays visible rather than being silently traded away.</p></div><div class="decision-signals">${signals.length?signals.map(x=>pill(x,'good')).join(''):'<span class="pill">No specific priority signals detected</span>'}</div><div class="decision-share"><button type="button" class="button secondary compact" data-copy-decision>Copy this decision link</button><span data-copy-status aria-live="polite"></span></div></div></div></section>
  <section class="section"><div class="wrap">${run?.hardConstraintFallback?`<div class="v4-alert"><strong>No clean verified hard-constraint match.</strong> APG is keeping conflicts and verification gaps visible rather than presenting a known conflict as a recommendation.</div>`:''}<div class="section-head"><div><p class="kicker">Explainable shortlist</p><h2>${intent?.category?`${cleanAvailable?'Best fits':'Closest maintained options'} in ${esc(intent.category.label)}`:cleanAvailable?'Best fits across the maintained catalogue':'Closest maintained options'}</h2><p>Ordered by fit to your decision state, never by affiliate availability or commission.</p></div><a class="text-link" href="/my-apg/">Open My APG workspace →</a></div><div class="decision-results">${top.length?top.map((r,i)=>resultCard(r,i,cleanAvailable)).join(''):'<div class="zero-state"><h2>No maintained candidate yet</h2><p>APG will not invent an option outside the maintained product set. Try a broader category or relax one requirement.</p></div>'}</div>${pub?.recommendation?`<div class="v4-panel"><p class="kicker">Why the answer leads here</p><div class="v4-explain"><article><h3>Why the leading option won</h3><ul>${pub.recommendation.whyItWon.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article><h3>When the answer could change</h3><ul>${pub.recommendation.whenTheAnswerWouldChange.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article></div></div>`:''}<div class="decision-disclaimer"><strong>Interpretation boundary</strong><p>A strong fit means the product aligns well with needs APG can substantiate. “Needs verification” means a hard requirement cannot yet be proven from maintained evidence. It does not mean APG has hands-on tested the product or that it will be best for every buyer.</p></div></div></section>`:
  `<section class="section soft-section full-bleed"><div class="wrap decision-onboarding"><div><p class="kicker">More powerful than a generic “best” list</p><h2>Decision Lab works from your constraints backwards.</h2><p>Start with your situation. No product is recommended until you provide a decision context.</p></div><div class="grid four"><article class="feature-card"><span class="step-number">01</span><h3>Describe the situation</h3><p>Use natural language instead of translating your life into specification filters.</p></article><article class="feature-card"><span class="step-number">02</span><h3>Set hard constraints</h3><p>Maximum budget, must-have capabilities and explicit exclusions can make a product ineligible.</p></article><article class="feature-card"><span class="step-number">03</span><h3>Inspect the reasoning</h3><p>See why a product fits, what remains unverified and the trade-off you are accepting.</p></article><article class="feature-card"><span class="step-number">04</span><h3>Compare and verify</h3><p>Move shortlisted products into comparison, product evidence and verified retailer pathways.</p></article></div></div></section>`}
  <section class="section"><div class="wrap"><div id="decisionHistory" hidden></div></div></section>`;
  return layout(req,{title:'APG Decision Lab | Explainable Product Matching',description:'Describe what you need and get an explainable shortlist from Australian Product Guide’s maintained product data.',path,body,noindex:hasInput,crumbs:[homeCrumb,{name:'Decision Lab',path}],bodyData:`data-decision-query="${esc(q)}" data-decision-url="${esc(persistedUrl)}"`});
}

function workspace(req){
  const path='/my-apg/';
  const body=`<section class="decision-hero workspace-hero"><div class="wrap decision-hero-grid"><div><p class="kicker">My APG</p><h1>Your private decision workspace on this device.</h1><p class="lede">Bring together saved products, your comparison shortlist, recently viewed products and recent Decision Lab sessions without creating an account.</p><div class="decision-principles"><span>Browser-local storage</span><span>No account required</span><span>Clearable at any time</span></div></div><aside class="decision-engine-card"><strong>Privacy by default</strong><p>This workspace reads information already stored in this browser by APG. Nothing here implies an APG user account or cross-device profile.</p><a href="/privacy/">Read the privacy policy →</a></aside></div></section><section class="section"><div class="wrap" data-apg-workspace><div class="workspace-grid"><section class="workspace-panel" data-workspace-compare><div class="section-head compact-head"><div><p class="kicker">Current shortlist</p><h2>Compare next</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel" data-workspace-saved><div class="section-head compact-head"><div><p class="kicker">Saved</p><h2>Products you kept</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel" data-workspace-decisions><div class="section-head compact-head"><div><p class="kicker">Decision Lab</p><h2>Recent decisions</h2></div></div><div data-workspace-content></div></section><section class="workspace-panel" data-workspace-recent><div class="section-head compact-head"><div><p class="kicker">Browsing</p><h2>Recently viewed</h2></div></div><div data-workspace-content></div></section></div><div class="workspace-controls"><a class="button" href="/decision-lab/">Start a new decision</a><button class="button secondary" type="button" data-clear-workspace>Clear My APG local history</button><span data-workspace-status aria-live="polite"></span></div></div></section>`;
  return layout(req,{title:'My APG | Private Product Decision Workspace',description:'A browser-local workspace for saved products, comparison shortlists and recent Australian Product Guide decisions.',path,body,noindex:true,crumbs:[homeCrumb,{name:'My APG',path}]});
}

module.exports={decisionLab,workspace,safeDecisionUrl};
