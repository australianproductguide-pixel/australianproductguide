const {products,categories}=require('../data');
const search=require('./search-base');
const decision=require('./decision-engine-v4');
const intelligence=require('./product-intelligence-v41');
const {indexableRoutes,noindexRoutes,pairPages}=require('./routes');

const VERSION='scout-concierge-v5';
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));
const CATEGORY_BY_SLUG=new Map(Object.values(categories).map(c=>[c.slug,c]));
const ROUTE_PATHS=new Set([...indexableRoutes,...noindexRoutes].map(x=>new URL(x,'https://australianproductguide.au').pathname));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.-]+/g,' ').replace(/\s+/g,' ').trim();
const human=s=>String(s||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const money=n=>Number(n)>0?'A$'+Number(n).toLocaleString('en-AU'):null;
const clamp=(v,n)=>String(v||'').trim().slice(0,n);
const uniq=a=>[...new Set((a||[]).filter(Boolean))];

const SITE_PAGES=[
  {key:'home',label:'Australian Product Guide home',url:'/',aliases:['home','homepage','main page']},
  {key:'categories',label:'Browse categories',url:'/categories/',aliases:['categories','products','browse products','product categories']},
  {key:'search',label:'Search APG',url:'/search/',aliases:['search','search products','product search']},
  {key:'compare',label:'Compare products',url:'/compare/',aliases:['compare','comparison','compare products','comparison tool']},
  {key:'decision_lab',label:'Decision Lab',url:'/decision-lab/',aliases:['decision lab','decisionlab','structured recommendation','recommendation tool']},
  {key:'my_apg',label:'My APG',url:'/my-apg/',aliases:['my apg','saved products','my saved','my account','account']},
  {key:'login',label:'Log in to My APG',url:'/my-apg/?account=login',aliases:['login','log in','sign in']},
  {key:'register',label:'Join APG',url:'/my-apg/?account=signup',aliases:['register','sign up','signup','join','create account']},
  {key:'guides',label:'Buying guides',url:'/guides/',aliases:['guides','buying guides','buying guide']},
  {key:'brands',label:'Brands',url:'/brands/',aliases:['brands','brand pages']},
  {key:'retailers',label:'Retailer approach',url:'/retailers/',aliases:['retailers','retailer approach','stores','shops']},
  {key:'methodology',label:'Methodology',url:'/methodology/',aliases:['methodology','how you compare','how recommendations work','how you decide','recommendation method']},
  {key:'sources',label:'Sources',url:'/sources/',aliases:['sources','evidence','source standards','provenance']},
  {key:'corrections',label:'Corrections policy',url:'/corrections-policy/',aliases:['corrections','correction policy','report a correction']},
  {key:'affiliate',label:'Affiliate disclosure',url:'/affiliate-disclosure/',aliases:['affiliate disclosure','affiliate','commission','commercial transparency']},
  {key:'about',label:'About Australian Product Guide',url:'/about/',aliases:['about','about apg','who are you']},
  {key:'privacy',label:'Privacy policy',url:'/privacy/',aliases:['privacy','privacy policy']},
  {key:'terms',label:'Terms of use',url:'/terms/',aliases:['terms','terms of use','terms of service']},
  {key:'coverage',label:'Coverage',url:'/coverage/',aliases:['coverage','what you cover','catalogue coverage']},
  {key:'updates',label:'Recently updated',url:'/updates/',aliases:['updates','recently updated','freshness']},
  {key:'contact',label:'Contact APG',url:'/contact/',aliases:['contact','contact us','get in touch']}
];

function routeAllowed(url){
  if(!url||typeof url!=='string')return false;
  if(url.startsWith('#')||url.startsWith('javascript:'))return false;
  let u;try{u=new URL(url,'https://australianproductguide.au');}catch{return false;}
  if(u.origin!=='https://australianproductguide.au')return /^https?:/.test(url);
  if(ROUTE_PATHS.has(u.pathname))return true;
  if(/^\/categories\/[a-z0-9-]+\/finder\/$/.test(u.pathname)){
    const slug=u.pathname.split('/')[2];return CATEGORY_BY_SLUG.has(slug);
  }
  return false;
}

function sitePage(keyOrText,pageContext={}){
  const text=norm(keyOrText),category=pageContext.categorySlug&&CATEGORY_BY_SLUG.get(pageContext.categorySlug);
  if(/help me choose|finder/.test(text)){
    return category?{key:'help_me_choose',label:`Help me choose ${category.label}`,url:`/categories/${category.slug}/finder/`}:{key:'categories',label:'Browse categories',url:'/categories/'};
  }
  if(/scout/.test(text))return {key:'scout',label:'Scout',url:null,action:'open-scout'};
  let best=null;
  for(const page of SITE_PAGES){
    const score=page.aliases.reduce((m,a)=>text.includes(norm(a))?Math.max(m,norm(a).length):m,0);
    if(score&&(!best||score>best.score))best={...page,score};
  }
  if(!best)return null;
  const {score,...page}=best;
  return routeAllowed(page.url)?page:null;
}

function validatePageContext(raw={}){
  const suppliedPath=clamp(raw.path||'/',300);let u;
  try{u=new URL(suppliedPath,'https://australianproductguide.au');}catch{u=new URL('/','https://australianproductguide.au');}
  const path=u.pathname;
  let productSlug=null,categorySlug=null,pageType='other',comparisonProductSlugs=[];
  const pm=path.match(/^\/products\/([a-z0-9-]+)\/$/);if(pm&&PRODUCT_BY_SLUG.has(pm[1])){productSlug=pm[1];categorySlug=PRODUCT_BY_SLUG.get(pm[1]).category;pageType='product';}
  const cm=path.match(/^\/categories\/([a-z0-9-]+)(?:\/finder)?\/$/);if(cm&&CATEGORY_BY_SLUG.has(cm[1])){categorySlug=cm[1];pageType=path.endsWith('/finder/')?'finder':'category';}
  const gm=path.match(/^\/guides\/([a-z0-9-]+)-buying-guide\/$/);if(gm&&CATEGORY_BY_SLUG.has(gm[1])){categorySlug=gm[1];pageType='guide';}
  if(path==='/decision-lab/')pageType='decision-lab';
  if(path==='/search/')pageType='search';
  if(path==='/my-apg/')pageType='my-apg';
  if(path==='/compare/'||path==='/compare/custom/'||path.startsWith('/compare/'))pageType='comparison';
  if(path==='/')pageType='home';
  const pair=pairPages.find(x=>x.path===path);if(pair){categorySlug=pair.category;comparisonProductSlugs=[pair.a.slug,pair.b.slug];}
  const suppliedProducts=Array.isArray(raw.comparisonProductSlugs)?raw.comparisonProductSlugs:[];
  const queryProducts=(u.searchParams.get('products')||'').split(',');
  comparisonProductSlugs=uniq([...comparisonProductSlugs,...suppliedProducts,...queryProducts].map(x=>clamp(x,180)).filter(x=>PRODUCT_BY_SLUG.has(x))).slice(0,4);
  const rawProduct=clamp(raw.productSlug,180);if(!productSlug&&PRODUCT_BY_SLUG.has(rawProduct)){productSlug=rawProduct;categorySlug=PRODUCT_BY_SLUG.get(rawProduct).category;}
  const rawCategory=clamp(raw.categorySlug,180);if(!categorySlug&&CATEGORY_BY_SLUG.has(rawCategory))categorySlug=rawCategory;
  return {path,pageType,productSlug,categorySlug,comparisonProductSlugs,currentSearchQuery:clamp(raw.currentSearchQuery||u.searchParams.get('q')||'',300),currentFilters:raw.currentFilters&&typeof raw.currentFilters==='object'?Object.fromEntries(Object.entries(raw.currentFilters).slice(0,12).map(([k,v])=>[clamp(k,60),clamp(v,120)])):{} };
}

function displayName(user){
  const metadata=user&&user.user_metadata&&typeof user.user_metadata==='object'?user.user_metadata:{};
  for(const key of ['display_name','first_name','preferred_name']){
    const value=clamp(metadata[key],60).replace(/[<>]/g,'').trim();
    if(value&&value.length>=1&&!value.includes('@'))return value;
  }
  return null;
}

function securityBoundary(text){
  const n=norm(text);
  return /(system prompt|hidden prompt|hidden instruction|developer message|database credential|database password|api key|secret key|access token|refresh token|show.*token|reveal.*secret|environment variable)/.test(n)||/(another user|other user|someone else).*(saved|account|shortlist|history)/.test(n)||/(saved|account|shortlist|history).*(user\s*\d+|another user|other user)/.test(n);
}

function classifyIntent(text,pageContext={}){
  const n=norm(text);
  if(securityBoundary(text))return 'security_boundary';
  if(/^(hi|hello|hey|gday|good morning|good afternoon|good evening)( scout)?[.! ]*$/.test(n)||/^how are you/.test(n))return 'general_conversation';
  if(/^(thanks|thank you|cheers|that s all|all good|bye|goodbye)[.! ]*$/.test(n))return 'general_conversation';
  if(/what is scout|who are you|what can you do/.test(n))return 'apg_information';
  if(/what is (this (site|website)|australian product guide|apg)|who is (apg|australian product guide)|what does (apg|australian product guide) do/.test(n))return 'apg_information';
  if(/affiliate|commission|sponsor|paid to recommend|amazon pay|earn money|make money/.test(n))return 'affiliate_question';
  if(/methodology|how do you (choose|decide|recommend|compare)|how are recommendations|physically test|hands.on test|desk research|why should i trust|are you independent/.test(n))return 'methodology_question';
  if(/verify (my )?email|confirmation email|reset (my )?password|forgot (my )?password|log ?in|sign ?in|log ?out|sign ?out|create (an )?account|register|join apg/.test(n))return 'account_help';
  if(/what (have|do) i (have )?saved|show (me )?my saved|my saved products|saved shortlist/.test(n))return 'saved_products';
  if(/^(remove|unsave|delete)\b/.test(n)&&/(saved|shortlist|that|this|one|product)/.test(n))return 'remove_saved_product';
  if(/^save\b/.test(n)||/save (this|that|the|it|for me)/.test(n))return 'save_product';
  if(/where (is|can i|do i|are)|how do i find|take me to|open (the )?/.test(n)&&sitePage(n,pageContext))return 'site_navigation';
  if(/what categories|which categories|do you cover|category do you have|buying guide/.test(n))return /guide/.test(n)?'guide_discovery':'category_question';
  if(/where can i buy|which retailer|retailer|amazon australia|on amazon|price|availability|in stock|cheapest/.test(n))return 'price_or_retailer_question';
  if(/\b(vs|versus)\b|compare|difference between|which (one )?(is )?better|which would you pick|which suits/.test(n)||pageContext.pageType==='comparison'&&/which|better|pick|difference/.test(n))return 'product_comparison';
  if(/anything cheaper|cheaper option|too expensive|more premium|premium option|alternative|instead|don t like|dont like|no [a-z0-9]+ products|too big|too small/.test(n))return 'alternative_request';
  if(/why do you say|why did you say|what makes you say|source for that/.test(n))return 'product_question';
  if(pageContext.productSlug&&/(this|it|product|worth|good|support|have|does|is)/.test(n))return 'product_question';
  const matched=search.matchProduct(text),interpreted=decision.interpretQuery(text);
  if(matched&&(/tell me|what about|spec|feature|battery|size|weight|good|worth|support|does|is/.test(n)||n.includes(norm(matched.name))))return 'product_question';
  if(/recommend|what should i buy|what should i get|help me choose|i need|i want|looking for|shopping for|best .* for/.test(n))return 'product_recommendation';
  if(interpreted.categorySlug)return 'product_search';
  return 'general_conversation';
}

function safeState(state={}){
  if(!state||typeof state!=='object')return null;
  const category=CATEGORY_BY_SLUG.has(state.category)?state.category:null;
  const budget=Number(state.budget&&state.budget.amount);const amount=budget>0&&budget<=100000?budget:null;
  const cleanArray=(a,max=16)=>uniq((Array.isArray(a)?a:[]).map(x=>clamp(x,80)).filter(Boolean)).slice(0,max);
  const hard=state.hardConstraints&&typeof state.hardConstraints==='object'?state.hardConstraints:{};
  const soft=Array.isArray(state.softPreferences)?state.softPreferences.slice(0,16).map(x=>({tag:clamp(x&&x.tag,80),priority:['highest','high','normal','low'].includes(x&&x.priority)?x.priority:'normal'})).filter(x=>x.tag):[];
  const numeric=Array.isArray(state.numericConstraints)?state.numericConstraints.slice(0,8).map(x=>({key:clamp(x&&x.key,60),value:Number(x&&x.value),unit:clamp(x&&x.unit,20),mode:['min','max','exact','target'].includes(x&&x.mode)?x.mode:'target',hard:!!(x&&x.hard)})).filter(x=>Number.isFinite(x.value)):[];
  return {category,budget:amount?{amount,currency:'AUD',mode:state.budget&&state.budget.mode==='target'?'target':'ceiling',hard:state.budget&&state.budget.hard!==false}:null,hardConstraints:{budgetCeiling:Number(hard.budgetCeiling)>0?Number(hard.budgetCeiling):null,requiredTags:cleanArray(hard.requiredTags),excludedTags:cleanArray(hard.excludedTags),excludedBrands:cleanArray(hard.excludedBrands)},softPreferences:soft,softExclusions:cleanArray(state.softExclusions),numericConstraints:numeric,categoryIntent:state.categoryIntent&&typeof state.categoryIntent==='object'?state.categoryIntent:{},brandPreference:clamp(state.brandPreference,80)||null};
}

function stateToQuery(state){
  const s=safeState(state);if(!s)return '';
  const parts=[];
  if(s.category){const c=CATEGORY_BY_SLUG.get(s.category);if(c)parts.push(c.label);}
  if(s.budget&&s.budget.amount)parts.push((s.budget.hard?'maximum budget ':'budget around ')+money(s.budget.amount));
  s.hardConstraints.requiredTags.forEach(x=>parts.push('must have '+human(x)));
  s.hardConstraints.excludedTags.forEach(x=>parts.push('must not have '+human(x)));
  s.hardConstraints.excludedBrands.forEach(x=>parts.push('no '+x));
  s.softPreferences.forEach(x=>parts.push((x.priority==='highest'?'top priority ':x.priority==='high'?'priority ':'')+human(x.tag)));
  s.softExclusions.forEach(x=>parts.push('avoid '+human(x)));
  s.numericConstraints.forEach(x=>parts.push((x.mode==='min'?'at least ':x.mode==='max'?'at most ':x.mode==='exact'?'exactly ':'around ')+x.value+(x.unit==='in'?' inches':' '+x.unit)));
  if(s.brandPreference)parts.push('prefer '+s.brandPreference);
  return uniq(parts).join(' ');
}

function resolveReference(text,references=[],pageContext={}){
  const n=norm(text),refs=uniq((references||[]).map(x=>clamp(x,180)).filter(x=>PRODUCT_BY_SLUG.has(x))).slice(0,5);
  if(pageContext.productSlug&&(/\b(this|it|this product|this one)\b/.test(n)||!refs.length))return PRODUCT_BY_SLUG.get(pageContext.productSlug);
  if(refs.length){
    if(/\b(second|2nd|number 2)\b/.test(n)&&refs[1])return PRODUCT_BY_SLUG.get(refs[1]);
    if(/\b(third|3rd|number 3)\b/.test(n)&&refs[2])return PRODUCT_BY_SLUG.get(refs[2]);
    if(/\b(first|1st|top one|one you recommended|that one|it)\b/.test(n))return PRODUCT_BY_SLUG.get(refs[0]);
    for(const slug of refs){const p=PRODUCT_BY_SLUG.get(slug);if(p&&n.includes(norm(p.brand)))return p;if(p&&n.includes(norm(p.name)))return p;}
  }
  const matched=search.matchProduct(text);return matched||null;
}

function card(p,extra={}){
  if(!p)return null;
  return {slug:p.slug,brand:p.brand,name:p.name,category:p.categoryLabel||CATEGORY_BY_SLUG.get(p.category)?.label||human(p.category),url:`/products/${p.slug}/`,referencePrice:Number(p.price)>0?Number(p.price):null,evidence:p.evidenceLabel||(p.evidenceTier==='deep'?'Deeper APG evidence':'APG research'),reason:clamp(extra.reason||'',300)||null,tradeoff:clamp(extra.tradeoff||p.watch||'',300)||null};
}

function action(label,url,options={}){
  if(url&&!routeAllowed(url)&&!/^https:\/\//.test(url))return null;
  return {label,url:url||null,kind:options.kind||'link',primary:!!options.primary,slug:options.slug||null,external:!!options.external,affiliate:!!options.affiliate};
}

function productQuestion(text,pageContext,references){
  const p=resolveReference(text,references,pageContext);
  if(!p)return {intent:'product_question',message:'Tell me which product you mean and I’ll check APG’s maintained product record rather than guessing.',actions:[action('Search products','/search/',{primary:true})]};
  const n=norm(text),specs=(p.specs||[]).filter(x=>Array.isArray(x)&&x.length>=2).map(([k,v])=>({label:String(k),value:String(v)}));
  const queryWords=n.split(' ').filter(x=>x.length>3&&!['this','that','does','have','what','with','good','worth','product'].includes(x));
  let relevant=specs.filter(s=>queryWords.some(w=>norm(s.label).includes(w)||norm(s.value).includes(w))).slice(0,5);
  if(/sport|sports|motion|refresh/.test(n))relevant=uniq([...relevant,...specs.filter(s=>/refresh|hz|motion/.test(norm(s.label+' '+s.value)))]).slice(0,5);
  if(/battery/.test(n))relevant=specs.filter(s=>/battery|runtime|playback|charge/.test(norm(s.label+' '+s.value))).slice(0,5);
  if(/size|dimension|fit/.test(n))relevant=specs.filter(s=>/size|dimension|width|height|depth|screen|capacity/.test(norm(s.label))).slice(0,5);
  const bullets=[];
  if(relevant.length)relevant.forEach(s=>bullets.push(`${s.label}: ${s.value}`));
  else (p.highlights||[]).slice(0,3).forEach(x=>bullets.push(String(x)));
  if(p.watch)bullets.push(`Trade-off to check: ${p.watch}`);
  let message=`APG’s maintained record for ${p.brand} ${p.name}`;
  if(/why do you say|why did you say|source for that|what makes you say/.test(n)){
    const sourceType=p.sourceType?human(p.sourceType):'maintained APG source evidence';
    message=`That comes from APG’s maintained record for ${p.brand} ${p.name}, using ${sourceType}${p.lastSourceVerification?` last verified ${p.lastSourceVerification}`:''}. I won’t claim hands-on testing unless APG has explicitly documented it.`;
  }else if(/worth|good|what do you think/.test(n))message+=`. I can explain what the record supports, but I won’t turn incomplete evidence into a universal “best” claim.`;
  else message+=' shows the following relevant details.';
  return {intent:'product_question',message,bullets,products:[card(p)],references:[p.slug],actions:[action('View product research',`/products/${p.slug}/`,{primary:true}),action('Compare alternatives',`/compare/${p.category}/`)]};
}

function currentOffers(p){
  const node=intelligence.knowledgeNode(p.slug),offers=node&&node.commerce&&Array.isArray(node.commerce.offers)?node.commerce.offers:[];
  return offers.filter(o=>o&&o.exactModel&&o.url).map(o=>({...o,isCurrent:o.freshness==='current-check'}));
}

function retailerResponse(text,pageContext,references){
  const p=resolveReference(text,references,pageContext);
  if(!p)return {intent:'price_or_retailer_question',message:'Tell me the exact product and I’ll use APG’s verified retailer records. I won’t invent a price, seller or Amazon listing.',actions:[action('Search products','/search/',{primary:true})]};
  const offers=currentOffers(p),current=offers.filter(x=>x.isCurrent),historical=offers.filter(x=>!x.isCurrent);
  const bullets=[];const actions=[action('View APG product page',`/products/${p.slug}/`,{primary:true})];
  if(current.length){
    current.slice(0,4).forEach(o=>{
      const price=o.price?money(o.price):'price not stored';
      bullets.push(`${o.retailer}: ${price}${o.checkedAt?` · checked ${o.checkedAt}`:''}`);
      actions.push(action(`View at ${o.retailer}`,o.url,{kind:'retailer',external:true,affiliate:!!o.affiliate}));
    });
    return {intent:'price_or_retailer_question',message:`APG currently has ${current.length} exact-model retailer record${current.length===1?'':'s'} for ${p.brand} ${p.name}. Prices and availability can change, so the retailer remains the final source at purchase time.`,bullets,products:[card(p)],references:[p.slug],actions:actions.filter(Boolean)};
  }
  if(historical.length){
    historical.slice(0,3).forEach(o=>bullets.push(`${o.retailer}: last checked ${o.checkedAt||'previously'}; APG does not treat this as a current price or availability check.`));
    return {intent:'price_or_retailer_question',message:`I can’t verify a current exact-model retailer price for ${p.brand} ${p.name} from APG’s present data, so I don’t want to quote stale availability as live.`,bullets,products:[card(p)],references:[p.slug],actions:actions.filter(Boolean)};
  }
  return {intent:'price_or_retailer_question',message:`APG does not currently hold a verified exact-model retailer record for ${p.brand} ${p.name}. I won’t invent an Amazon URL, ASIN, price or seller.`,products:[card(p)],references:[p.slug],actions:actions.filter(Boolean)};
}

function comparisonProducts(text,pageContext,references){
  const s=search.searchSite(text);if(s.directCompare)return [s.directCompare.a,s.directCompare.b];
  const context=(pageContext.comparisonProductSlugs||[]).map(x=>PRODUCT_BY_SLUG.get(x)).filter(Boolean);if(context.length>=2)return context.slice(0,4);
  const refs=uniq((references||[]).filter(x=>PRODUCT_BY_SLUG.has(x))).map(x=>PRODUCT_BY_SLUG.get(x));if(refs.length>=2)return refs.slice(0,4);
  return [];
}

function comparisonResponse(text,pageContext,references,priorState){
  const ps=comparisonProducts(text,pageContext,references);
  if(ps.length<2)return {intent:'product_comparison',message:'Name the two products you want to compare, or open Scout from an APG comparison page and ask “which one suits me?”.',actions:[action('Open Compare','/compare/',{primary:true})]};
  const [a,b]=ps,bullets=[];
  if(Number(a.price)>0||Number(b.price)>0)bullets.push(`APG reference price: ${a.brand} ${a.name} ${money(a.price)||'not maintained'} · ${b.brand} ${b.name} ${money(b.price)||'not maintained'}`);
  const map=p=>new Map((p.specs||[]).filter(x=>Array.isArray(x)&&x.length>=2).map(([k,v])=>[norm(k),{label:String(k),value:String(v)}]));
  const A=map(a),B=map(b);for(const key of [...A.keys()]){if(B.has(key)&&A.get(key).value!==B.get(key).value)bullets.push(`${A.get(key).label}: ${a.name} — ${A.get(key).value}; ${b.name} — ${B.get(key).value}`);if(bullets.length>=5)break;}
  const q=[stateToQuery(priorState),text,a.category===b.category?(CATEGORY_BY_SLUG.get(a.category)?.label||''):''].filter(Boolean).join(' ');
  const parsed=decision.interpretQuery(q),hasPriorities=!!(parsed.budget||parsed.requiredTags?.length||parsed.positiveTags?.length||parsed.excludedTags?.length||parsed.excludedBrands?.length||parsed.numericConstraints?.length);
  let message=`${a.brand} ${a.name} and ${b.brand} ${b.name} have different trade-offs; neither is automatically better for everyone.`;
  if(a.category===b.category&&hasPriorities){
    const ranked=decision.rankDecision(q,{category:a.category}).ranked||[],ra=ranked.findIndex(x=>x.p.slug===a.slug),rb=ranked.findIndex(x=>x.p.slug===b.slug);
    if(ra>=0&&rb>=0&&ra!==rb){const winner=ra<rb?a:b;message=`For the priorities you’ve given me, I’d lean ${winner.brand} ${winner.name}. That is a fit judgement from APG’s maintained decision signals, not a universal review score.`;}
  }
  const tagsA=new Set(a.tags||[]),tagsB=new Set(b.tags||[]),onlyA=[...tagsA].filter(x=>!tagsB.has(x)).slice(0,2),onlyB=[...tagsB].filter(x=>!tagsA.has(x)).slice(0,2);
  if(onlyA.length)bullets.push(`${a.name} stands out in APG’s current tagging for ${onlyA.map(human).join(' and ')}.`);
  if(onlyB.length)bullets.push(`${b.name} stands out in APG’s current tagging for ${onlyB.map(human).join(' and ')}.`);
  const slugs=ps.slice(0,4).map(p=>p.slug);
  return {intent:'product_comparison',message,bullets:bullets.slice(0,7),products:ps.slice(0,4).map(p=>card(p)),references:slugs,actions:[action('Open side-by-side comparison','/compare/custom/?products='+slugs.join(','),{primary:true}),action('Refine in Decision Lab','/decision-lab/')].filter(Boolean)};
}

function mergedDecisionQuery(text,pageContext,priorState,references){
  const parsed=decision.interpretQuery(text),prior=safeState(priorState),explicitNew=!!parsed.categorySlug&&(prior&&prior.category&&parsed.categorySlug!==prior.category||/forget|instead|something else|now i need/.test(norm(text)));
  const parts=[text];if(prior&&!explicitNew)parts.push(stateToQuery(prior));
  if(!parsed.categorySlug&&(!prior||!prior.category)&&pageContext.categorySlug){const c=CATEGORY_BY_SLUG.get(pageContext.categorySlug);if(c)parts.push(c.label);}
  if(/anything cheaper|cheaper option|too expensive|spend less|lower the price/.test(norm(text))){
    const p=resolveReference('first',references,pageContext),priorBudget=prior&&prior.budget&&prior.budget.amount,ceiling=p&&Number(p.price)>0?Math.max(1,Math.floor(Number(p.price)-1)):priorBudget;
    if(ceiling)parts.push(`maximum budget ${money(ceiling)} value is a high priority`);
  }
  return uniq(parts.filter(Boolean)).join(' ');
}

function recommendationResponse(text,pageContext,references,priorState){
  const q=mergedDecisionQuery(text,pageContext,priorState,references),parsed=decision.interpretQuery(q);
  if(!parsed.categorySlug){
    const found=search.searchSite(text);if(found.coverageGap)return {intent:'product_recommendation',message:`APG does not yet maintain a ${found.coverageGap} category, so I can’t give you a grounded shortlist from the catalogue.`,actions:[action('Browse current categories','/categories/',{primary:true}),action('Search APG','/search/')]};
    if(found.categories&&found.categories.length){const cs=found.categories.slice(0,4);return {intent:'product_search',message:'I found a few APG categories that may match. Pick the closest one and I can narrow the decision from there.',actions:cs.map((c,i)=>action(c.label,`/categories/${c.slug}/`,{primary:i===0})).filter(Boolean)};
    return {intent:'product_recommendation',message:'Tell me what kind of product you’re shopping for. A rough budget and the one thing that matters most are enough to get started.',actions:[action('Browse categories','/categories/'),action('Open Decision Lab','/decision-lab/',{primary:true})]};
  }
  const c=CATEGORY_BY_SLUG.get(parsed.categorySlug),signalCount=(parsed.positiveTags||[]).length+(parsed.requiredTags||[]).length+(parsed.excludedTags||[]).length+(parsed.numericConstraints||[]).length+(parsed.budget?1:0)+(parsed.brand?1:0);
  if(c&&signalCount===0){const factors=(c.factors||[]).slice(0,3).map(String);return {intent:'product_recommendation',message:`Absolutely. For ${c.label.toLowerCase()}, the biggest things that usually change APG’s recommendation are ${factors.length?factors.join(', '):'budget, use case and your main deal-breaker'}. What’s your rough budget, and which of those matters most?`,decisionState:parsed.decisionState,actions:[action(`Browse ${c.label}`,`/categories/${c.slug}/`),action('Use structured Decision Lab','/decision-lab/')]};
  }
  const d=decision.publicDecision(q,{category:parsed.categorySlug}),results=(d.results||[]).slice(0,3),cards=results.map(r=>card(PRODUCT_BY_SLUG.get(r.slug),{reason:(r.reasons||[])[0],tradeoff:(r.verificationNeeds||[])[0]||r.tradeoff||(r.gaps||[])[0]})).filter(Boolean);
  if(!cards.length)return {intent:'product_recommendation',message:'I can’t verify a reliable match from APG’s current maintained coverage for that brief. I’d rather say that than fabricate a recommendation.',decisionState:d.decisionState,actions:[action('Adjust the brief in Decision Lab','/decision-lab/',{primary:true}),action(`Browse ${c?c.label:'categories'}`,c?`/categories/${c.slug}/`:'/categories/')].filter(Boolean)};
  const top=cards[0],lead=(d.recommendation&&d.recommendation.whyItWon&&d.recommendation.whyItWon[0])||'it best matches the maintained signals in your brief';
  let message=`My leading fit is ${top.brand} ${top.name} because ${String(lead).replace(/^./,m=>m.toLowerCase())}.`;
  if(d.audit&&d.audit.hardConstraintFallback)message='I can’t verify a clean match for every must-have, so I’m showing the closest APG options and marking uncertainty rather than silently trading away a hard constraint.';
  const slugs=cards.map(x=>x.slug);
  return {intent:'product_recommendation',message,products:cards,references:slugs,decisionState:d.decisionState,actions:[slugs.length>1?action('Compare these options','/compare/custom/?products='+slugs.join(','),{primary:true}):null,action('Open full Decision Lab','/decision-lab/'),action(`Browse ${c.label}`,`/categories/${c.slug}/`)].filter(Boolean),meta:{commercialRecommendationWeight:0,hardConstraintFallback:!!(d.audit&&d.audit.hardConstraintFallback)}};
}

function categoryResponse(text){
  const n=norm(text),parsed=decision.interpretQuery(text),c=parsed.categorySlug&&CATEGORY_BY_SLUG.get(parsed.categorySlug);
  if(/what categories|which categories|what do you cover/.test(n))return {intent:'category_question',message:`APG currently maintains ${products.length} products across ${Object.keys(categories).length} populated categories. You can browse the full current catalogue rather than relying on a stale list in chat.`,actions:[action('Browse all categories','/categories/',{primary:true}),action('Search APG','/search/')]};
  if(c)return {intent:'category_question',message:`Yes — APG currently maintains a ${c.label} category with ${c.products.length} product record${c.products.length===1?'':'s'}.`,actions:[action(`Browse ${c.label}`,`/categories/${c.slug}/`,{primary:true}),action(`${c.label} buying guide`,`/guides/${c.slug}-buying-guide/`),action('Help me choose',`/categories/${c.slug}/finder/`)].filter(Boolean)};
  const found=search.searchSite(text);if(found.categories&&found.categories.length){const match=found.categories[0];return {intent:'category_question',message:`The closest maintained category I found is ${match.label}.`,actions:[action(`Browse ${match.label}`,`/categories/${match.slug}/`,{primary:true}),action('Browse all categories','/categories/')].filter(Boolean)};
  return {intent:'category_question',message:'I can’t find a maintained APG category matching that request right now. I don’t want to pretend the catalogue covers something it does not.',actions:[action('Browse current categories','/categories/',{primary:true})]};
}

function guideResponse(text,pageContext){
  const parsed=decision.interpretQuery(text),slug=parsed.categorySlug||pageContext.categorySlug,c=slug&&CATEGORY_BY_SLUG.get(slug);
  if(c)return {intent:'guide_discovery',message:`APG has a buying guide for ${c.label.toLowerCase()} that explains the category factors and what to verify before buying.`,actions:[action(`Open ${c.label} buying guide`,`/guides/${c.slug}-buying-guide/`,{primary:true}),action(`Browse ${c.label}`,`/categories/${c.slug}/`)].filter(Boolean)};
  return {intent:'guide_discovery',message:'APG’s buying guides are organised by maintained category. Browse the guide library or tell me the product type you’re researching.',actions:[action('Browse buying guides','/guides/',{primary:true})]};
}

function siteNavigationResponse(text,pageContext){
  const page=sitePage(text,pageContext);if(!page)return {intent:'site_navigation',message:'I couldn’t match that to a current APG route, so I won’t invent a link.',actions:[action('Open sitemap','/sitemap/',{primary:true})]};
  if(page.action==='open-scout')return {intent:'site_navigation',message:'You’re already in Scout — APG does not currently maintain a separate Scout page.',actions:[action('Open Decision Lab','/decision-lab/'),action('Browse categories','/categories/')]};
  return {intent:'site_navigation',message:`You can find that at ${page.label}.`,actions:[action(`Open ${page.label}`,page.url,{primary:true})]};
}

function apgInfoResponse(text){
  const n=norm(text);
  if(/what is scout|who are you|what can you do/.test(n))return {intent:'apg_information',message:'I’m Scout, Australian Product Guide’s shopping and site assistant. I can help you find products, compare options, explain APG research and trade-offs, navigate the site, and work with your own saved products when you’re signed in.',actions:[action('Browse products','/categories/'),action('Open Decision Lab','/decision-lab/'),action('About APG','/about/')]};
  if(/decision lab/.test(n))return {intent:'apg_information',message:'Decision Lab is APG’s structured recommendation experience: you describe your budget, priorities and deal-breakers, and APG ranks maintained products while keeping hard constraints and uncertainty visible.',actions:[action('Open Decision Lab','/decision-lab/',{primary:true}),action('How recommendations work','/methodology/')]};
  return {intent:'apg_information',message:'Australian Product Guide helps Australians work out which products suit their situation, compare meaningful trade-offs and find retailer pathways. APG uses maintained product research and keeps affiliate commission out of recommendation scoring.',actions:[action('About APG','/about/',{primary:true}),action('How recommendations work','/methodology/'),action('Browse products','/categories/')].filter(Boolean)};
}

function methodologyResponse(text){
  const n=norm(text);
  if(/test|hands.on|physically/.test(n))return {intent:'methodology_question',message:'Unless a page explicitly says otherwise, APG guidance is desk-researched rather than hands-on testing. Scout will not say APG tested a product unless that testing is actually documented.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('See Sources','/sources/')]};
  if(/independent|trust/.test(n))return {intent:'methodology_question',message:'APG is designed so affiliate availability, retailer participation and commission contribute zero recommendation points. Product fit is based on the shopper’s needs and maintained evidence; uncertainty is surfaced rather than filled with guesses.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('Editorial standards','/editorial-standards/'),action('Sources','/sources/')].filter(Boolean)};
  return {intent:'methodology_question',message:'APG recommendations use maintained product evidence, explicit hard constraints, user priorities and category decision signals. Missing proof is marked as unverified rather than guessed, and commercial relationships do not improve a product’s ranking.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('See Sources','/sources/')].filter(Boolean)};
}

function affiliateResponse(){return {intent:'affiliate_question',message:'APG may earn affiliate commission from eligible retailer links, including qualifying Amazon Australia purchases. That commercial relationship does not increase a product’s suitability, ranking or recommendation score — recommendation first, retailer link second.',actions:[action('Read Affiliate Disclosure','/affiliate-disclosure/',{primary:true}),action('See Methodology','/methodology/')].filter(Boolean)};}

function accountHelpResponse(text,account={}){
  const n=norm(text);
  if(/verify|confirmation email/.test(n))return {intent:'account_help',message:'If you’ve just created an APG account, use the verification link sent to your email. My APG can also request another confirmation message if the first one did not arrive. Scout cannot read your inbox or bypass email verification.',actions:[action('Open My APG','/my-apg/?account=login',{primary:true})]};
  if(/forgot|reset.*password/.test(n))return {intent:'account_help',message:'Open My APG and use the password recovery option. Scout cannot retrieve or display your password, authentication token or recovery secret.',actions:[action('Open My APG','/my-apg/?account=login',{primary:true})]};
  if(/log ?out|sign ?out/.test(n))return {intent:'account_help',message:'You can sign out from My APG. Scout does not expose or manipulate authentication secrets.',actions:[action('Open My APG','/my-apg/',{primary:true})]};
  if(/create|register|join|sign ?up/.test(n))return {intent:'account_help',message:'You can create a free APG account in My APG. The core shopping and Scout experience remains useful without an account.',actions:[action('Join APG','/my-apg/?account=signup',{primary:true})]};
  if(/log ?in|sign ?in/.test(n))return {intent:'account_help',message:account.authenticated?'You’re already signed in to this APG session.':'You can sign in through My APG.',actions:[action('Open My APG',account.authenticated?'/my-apg/':'/my-apg/?account=login',{primary:true})]};
  return {intent:'account_help',message:'My APG is where you manage your account, saved products, comparisons and account settings. Scout only uses account information from the securely authenticated APG session.',actions:[action('Open My APG','/my-apg/',{primary:true})]};
}

function savedResponse(account={}){
  if(!account.authenticated)return {intent:'saved_products',message:'You’ll need to sign in to see account-level saved products. You can still keep comparing products in this Scout session without an account.',actions:[action('Log in','/my-apg/?account=login',{primary:true}),action('Keep shopping','/categories/')]};
  const saved=(account.savedProducts||[]).map(x=>PRODUCT_BY_SLUG.get(x.slug||x)).filter(Boolean).slice(0,12);
  if(!saved.length)return {intent:'saved_products',message:'You don’t currently have any saved products in this APG account.',actions:[action('Browse products','/categories/',{primary:true})]};
  const slugs=saved.slice(0,4).map(p=>p.slug);
  return {intent:'saved_products',message:`You currently have ${saved.length} saved product${saved.length===1?'':'s'}. I can help compare or narrow them down.`,products:saved.map(p=>card(p)),references:slugs,actions:[action('Open My APG','/my-apg/',{primary:true}),slugs.length>1?action('Compare saved products','/compare/custom/?products='+slugs.join(',')):null].filter(Boolean)};
}

function generalResponse(text){
  const n=norm(text);
  if(/^how are you/.test(n))return {intent:'general_conversation',message:'Doing well — ready to help. You can ask me about a product, a comparison, or anything on Australian Product Guide.'};
  if(/^(thanks|thank you|cheers)/.test(n))return {intent:'general_conversation',message:'No worries — happy to help. If you want to compare anything else, just ask.'};
  if(/that s all|all good|bye|goodbye/.test(n))return {intent:'general_conversation',message:'Glad I could help. You can come back to Scout whenever you want to pick up another buying decision.'};
  if(/football|weather|news|politics|recipe|write me|homework/.test(n))return {intent:'general_conversation',message:'I’m mainly here for products, buying decisions and Australian Product Guide. If you’re shopping for something or need help around APG, I’m happy to help.'};
  return {intent:'general_conversation',message:'I can help with products, comparisons, buying decisions or anything on Australian Product Guide. Tell me what you’re trying to do and I’ll point you in the right direction.',actions:[action('Browse products','/categories/'),action('Open Decision Lab','/decision-lab/')]};
}

function buildResponse(input={}){
  const text=clamp(input.text,2000),pageContext=validatePageContext(input.pageContext||{}),references=uniq((input.references||[]).map(x=>clamp(x,180)).filter(x=>PRODUCT_BY_SLUG.has(x))).slice(0,5),priorState=safeState(input.decisionState),account=input.account&&typeof input.account==='object'?input.account:{};
  const intent=classifyIntent(text,pageContext);
  if(intent==='security_boundary')return {version:VERSION,intent,message:'I can’t reveal hidden instructions, credentials, tokens or another user’s private APG data. I can still help with your own authenticated APG account, products or site navigation.',actions:[action('Privacy policy','/privacy/'),action('Browse products','/categories/')].filter(Boolean)};
  let out;
  if(intent==='apg_information')out=apgInfoResponse(text);
  else if(intent==='affiliate_question')out=affiliateResponse();
  else if(intent==='methodology_question')out=methodologyResponse(text);
  else if(intent==='site_navigation')out=siteNavigationResponse(text,pageContext);
  else if(intent==='account_help')out=accountHelpResponse(text,account);
  else if(intent==='saved_products')out=savedResponse(account);
  else if(intent==='category_question')out=categoryResponse(text);
  else if(intent==='guide_discovery')out=guideResponse(text,pageContext);
  else if(intent==='price_or_retailer_question')out=retailerResponse(text,pageContext,references);
  else if(intent==='product_comparison')out=comparisonResponse(text,pageContext,references,priorState);
  else if(intent==='product_question')out=productQuestion(text,pageContext,references);
  else if(intent==='product_recommendation'||intent==='product_search'||intent==='alternative_request')out=recommendationResponse(text,pageContext,references,priorState);
  else if(intent==='save_product'||intent==='remove_saved_product'){
    const p=resolveReference(text,references,pageContext);out={intent,message:p?`${intent==='save_product'?'Save':'Remove'} ${p.brand} ${p.name}.`:'Tell me which product you mean.',accountAction:p?{action:intent==='save_product'?'save':'remove',slug:p.slug}:null,references:p?[p.slug]:references};
  }else out=generalResponse(text);
  return {version:VERSION,pageContext,intent,...out,actions:(out.actions||[]).filter(Boolean).filter(a=>!a.url||routeAllowed(a.url)||/^https:\/\//.test(a.url))};
}

module.exports={VERSION,SITE_PAGES,routeAllowed,sitePage,validatePageContext,displayName,securityBoundary,classifyIntent,safeState,stateToQuery,resolveReference,card,currentOffers,buildResponse,PRODUCT_BY_SLUG,CATEGORY_BY_SLUG};
