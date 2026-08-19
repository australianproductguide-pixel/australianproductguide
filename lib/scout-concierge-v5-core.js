'use strict';

const {products,categories}=require('../data');
const search=require('./search-base');
const decision=require('./decision-engine-v4');
const intelligence=require('./product-intelligence-v41');
const {indexableRoutes,noindexRoutes,pairPages}=require('./routes');

const VERSION='scout-concierge-v5';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));
const CATEGORY_BY_SLUG=new Map(Object.values(categories).map(category=>[category.slug,category]));
const ROUTE_PATHS=new Set([...indexableRoutes,...noindexRoutes].map(route=>new URL(route,'https://australianproductguide.au').pathname));

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

function norm(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$.-]+/g,' ').replace(/\s+/g,' ').trim();
}
function human(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());}
function money(value){return Number(value)>0?'A$'+Number(value).toLocaleString('en-AU'):null;}
function clamp(value,max){return String(value||'').trim().slice(0,max);}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}

function routeAllowed(url){
  if(!url||typeof url!=='string'||url.startsWith('#')||url.startsWith('javascript:'))return false;
  let parsed;
  try{parsed=new URL(url,'https://australianproductguide.au');}catch{return false;}
  if(parsed.origin!=='https://australianproductguide.au')return /^https:\/\//.test(url);
  if(ROUTE_PATHS.has(parsed.pathname))return true;
  if(/^\/categories\/[a-z0-9-]+\/finder\/$/.test(parsed.pathname)){
    return CATEGORY_BY_SLUG.has(parsed.pathname.split('/')[2]);
  }
  return false;
}

function sitePage(keyOrText,pageContext={}){
  const text=norm(keyOrText);
  const category=pageContext.categorySlug&&CATEGORY_BY_SLUG.get(pageContext.categorySlug);
  if(/help me choose|finder/.test(text)){
    return category?{key:'help_me_choose',label:'Help me choose '+category.label,url:'/categories/'+category.slug+'/finder/'}:{key:'categories',label:'Browse categories',url:'/categories/'};
  }
  if(/scout/.test(text))return {key:'scout',label:'Scout',url:null,action:'open-scout'};
  let best=null;
  for(const page of SITE_PAGES){
    const score=page.aliases.reduce((current,alias)=>text.includes(norm(alias))?Math.max(current,norm(alias).length):current,0);
    if(score&&(!best||score>best.score))best={...page,score};
  }
  if(!best)return null;
  const page={key:best.key,label:best.label,url:best.url};
  return routeAllowed(page.url)?page:null;
}

function validatePageContext(raw={}){
  let parsed;
  try{parsed=new URL(clamp(raw.path||'/',300),'https://australianproductguide.au');}catch{parsed=new URL('/','https://australianproductguide.au');}
  const path=parsed.pathname;
  let pageType='other',productSlug=null,categorySlug=null,comparisonProductSlugs=[];
  const productMatch=path.match(/^\/products\/([a-z0-9-]+)\/$/);
  if(productMatch&&PRODUCT_BY_SLUG.has(productMatch[1])){
    productSlug=productMatch[1];
    categorySlug=PRODUCT_BY_SLUG.get(productSlug).category;
    pageType='product';
  }
  const categoryMatch=path.match(/^\/categories\/([a-z0-9-]+)(?:\/finder)?\/$/);
  if(categoryMatch&&CATEGORY_BY_SLUG.has(categoryMatch[1])){
    categorySlug=categoryMatch[1];
    pageType=path.endsWith('/finder/')?'finder':'category';
  }
  const guideMatch=path.match(/^\/guides\/([a-z0-9-]+)-buying-guide\/$/);
  if(guideMatch&&CATEGORY_BY_SLUG.has(guideMatch[1])){categorySlug=guideMatch[1];pageType='guide';}
  if(path==='/decision-lab/')pageType='decision-lab';
  else if(path==='/search/')pageType='search';
  else if(path==='/my-apg/')pageType='my-apg';
  else if(path==='/compare/'||path==='/compare/custom/'||path.startsWith('/compare/'))pageType='comparison';
  else if(path==='/')pageType='home';
  const pair=pairPages.find(item=>item.path===path);
  if(pair){categorySlug=pair.category;comparisonProductSlugs=[pair.a.slug,pair.b.slug];}
  const supplied=Array.isArray(raw.comparisonProductSlugs)?raw.comparisonProductSlugs:[];
  const queryProducts=(parsed.searchParams.get('products')||'').split(',');
  comparisonProductSlugs=uniq([...comparisonProductSlugs,...supplied,...queryProducts].map(slug=>clamp(slug,180)).filter(slug=>PRODUCT_BY_SLUG.has(slug))).slice(0,4);
  const suppliedProduct=clamp(raw.productSlug,180);
  if(!productSlug&&PRODUCT_BY_SLUG.has(suppliedProduct)){productSlug=suppliedProduct;categorySlug=PRODUCT_BY_SLUG.get(suppliedProduct).category;}
  const suppliedCategory=clamp(raw.categorySlug,180);
  if(!categorySlug&&CATEGORY_BY_SLUG.has(suppliedCategory))categorySlug=suppliedCategory;
  const filters=raw.currentFilters&&typeof raw.currentFilters==='object'?Object.fromEntries(Object.entries(raw.currentFilters).slice(0,12).map(([key,value])=>[clamp(key,60),clamp(value,120)])):{};
  return {path,pageType,productSlug,categorySlug,comparisonProductSlugs,currentSearchQuery:clamp(raw.currentSearchQuery||parsed.searchParams.get('q')||'',300),currentFilters:filters};
}

function displayName(user){
  const metadata=user&&user.user_metadata&&typeof user.user_metadata==='object'?user.user_metadata:{};
  for(const key of ['display_name','first_name','preferred_name']){
    const value=clamp(metadata[key],60).replace(/[<>]/g,'').trim();
    if(value&&!value.includes('@'))return value;
  }
  return null;
}

function securityBoundary(text){
  const value=norm(text);
  return /(system prompt|hidden prompt|hidden instruction|developer message|database credential|database password|api key|secret key|access token|refresh token|show.*token|reveal.*secret|environment variable)/.test(value)||/(another user|other user|someone else).*(saved|account|shortlist|history)/.test(value)||/(saved|account|shortlist|history).*(user\s*\d+|another user|other user)/.test(value);
}

function classifyIntent(text,pageContext={}){
  const value=norm(text);
  if(securityBoundary(text))return 'security_boundary';
  if(/^(hi|hello|hey|gday|good morning|good afternoon|good evening)( scout)?[.! ]*$/.test(value)||/^how are you/.test(value)||/^(thanks|thank you|cheers|that s all|all good|bye|goodbye)[.! ]*$/.test(value))return 'general_conversation';
  if(/what is scout|who are you|what can you do|what is (this (site|website)|australian product guide|apg)|who is (apg|australian product guide)|what does (apg|australian product guide) do/.test(value))return 'apg_information';
  if(/affiliate|commission|sponsor|paid to recommend|amazon pay|earn money|make money/.test(value))return 'affiliate_question';
  if(/methodology|how do you (choose|decide|recommend|compare)|how are recommendations|physically test|hands.on test|desk research|why should i trust|are you independent/.test(value))return 'methodology_question';
  if(/verify (my )?email|confirmation email|reset (my )?password|forgot (my )?password|log ?in|sign ?in|log ?out|sign ?out|create (an )?account|register|join apg/.test(value))return 'account_help';
  if(/what (have|do) i (have )?saved|show (me )?my saved|my saved products|saved shortlist/.test(value))return 'saved_products';
  if(/^(remove|unsave|delete)\b/.test(value)&&/(saved|shortlist|that|this|one|product)/.test(value))return 'remove_saved_product';
  if(/^save\b/.test(value)||/save (this|that|the|it|for me)/.test(value))return 'save_product';
  if(/where (is|can i|do i|are)|how do i find|take me to|open (the )?/.test(value)&&sitePage(value,pageContext))return 'site_navigation';
  if(/what categories|which categories|do you cover|category do you have|buying guide/.test(value))return /guide/.test(value)?'guide_discovery':'category_question';
  if(/where can i buy|which retailer|retailer|amazon australia|on amazon|price|availability|in stock|cheapest/.test(value))return 'price_or_retailer_question';
  if(/\b(vs|versus)\b|compare|difference between|which (one )?(is )?better|which would you pick|which suits/.test(value)||(pageContext.pageType==='comparison'&&/which|better|pick|difference/.test(value)))return 'product_comparison';
  if(/anything cheaper|cheaper option|too expensive|more premium|premium option|alternative|instead|don t like|dont like|no [a-z0-9]+ products|too big|too small/.test(value))return 'alternative_request';
  if(/why do you say|why did you say|what makes you say|source for that/.test(value))return 'product_question';
  if(pageContext.productSlug&&/(this|it|product|worth|good|support|have|does|is)/.test(value))return 'product_question';
  const matched=search.matchProduct(text);
  const interpreted=decision.interpretQuery(text);
  if(matched&&(/tell me|what about|spec|feature|battery|size|weight|good|worth|support|does|is/.test(value)||value.includes(norm(matched.name))))return 'product_question';
  if(/recommend|what should i buy|what should i get|help me choose|i need|i want|looking for|shopping for|best .* for/.test(value))return 'product_recommendation';
  if(interpreted.categorySlug)return 'product_search';
  return 'general_conversation';
}

function safeState(state={}){
  if(!state||typeof state!=='object')return null;
  const cleanArray=(items,max=16)=>uniq((Array.isArray(items)?items:[]).map(item=>clamp(item,80)).filter(Boolean)).slice(0,max);
  const hard=state.hardConstraints&&typeof state.hardConstraints==='object'?state.hardConstraints:{};
  const budget=Number(state.budget&&state.budget.amount);
  return {
    category:CATEGORY_BY_SLUG.has(state.category)?state.category:null,
    budget:budget>0&&budget<=100000?{amount:budget,currency:'AUD',mode:state.budget&&state.budget.mode==='target'?'target':'ceiling',hard:state.budget&&state.budget.hard!==false}:null,
    hardConstraints:{budgetCeiling:Number(hard.budgetCeiling)>0?Number(hard.budgetCeiling):null,requiredTags:cleanArray(hard.requiredTags),excludedTags:cleanArray(hard.excludedTags),excludedBrands:cleanArray(hard.excludedBrands)},
    softPreferences:(Array.isArray(state.softPreferences)?state.softPreferences:[]).slice(0,16).map(item=>({tag:clamp(item&&item.tag,80),priority:['highest','high','normal','low'].includes(item&&item.priority)?item.priority:'normal'})).filter(item=>item.tag),
    softExclusions:cleanArray(state.softExclusions),
    numericConstraints:(Array.isArray(state.numericConstraints)?state.numericConstraints:[]).slice(0,8).map(item=>({key:clamp(item&&item.key,60),value:Number(item&&item.value),unit:clamp(item&&item.unit,20),mode:['min','max','exact','target'].includes(item&&item.mode)?item.mode:'target',hard:!!(item&&item.hard)})).filter(item=>Number.isFinite(item.value)),
    categoryIntent:state.categoryIntent&&typeof state.categoryIntent==='object'?state.categoryIntent:{},
    brandPreference:clamp(state.brandPreference,80)||null
  };
}

function stateToQuery(state){
  const safe=safeState(state);if(!safe)return '';
  const parts=[];
  if(safe.category){const category=CATEGORY_BY_SLUG.get(safe.category);if(category)parts.push(category.label);}
  if(safe.budget)parts.push((safe.budget.hard?'maximum budget ':'budget around ')+money(safe.budget.amount));
  safe.hardConstraints.requiredTags.forEach(tag=>parts.push('must have '+human(tag)));
  safe.hardConstraints.excludedTags.forEach(tag=>parts.push('must not have '+human(tag)));
  safe.hardConstraints.excludedBrands.forEach(brand=>parts.push('no '+brand));
  safe.softPreferences.forEach(item=>parts.push((item.priority==='highest'?'top priority ':item.priority==='high'?'priority ':'')+human(item.tag)));
  safe.softExclusions.forEach(tag=>parts.push('avoid '+human(tag)));
  safe.numericConstraints.forEach(item=>parts.push((item.mode==='min'?'at least ':item.mode==='max'?'at most ':item.mode==='exact'?'exactly ':'around ')+item.value+(item.unit==='in'?' inches':' '+item.unit)));
  if(safe.brandPreference)parts.push('prefer '+safe.brandPreference);
  return uniq(parts).join(' ');
}

function resolveReference(text,references=[],pageContext={}){
  const value=norm(text);
  const refs=uniq((references||[]).map(slug=>clamp(slug,180)).filter(slug=>PRODUCT_BY_SLUG.has(slug))).slice(0,5);
  if(pageContext.productSlug&&(/\b(this|it|this product|this one)\b/.test(value)||!refs.length))return PRODUCT_BY_SLUG.get(pageContext.productSlug);
  if(refs.length){
    if(/\b(second|2nd|number 2)\b/.test(value)&&refs[1])return PRODUCT_BY_SLUG.get(refs[1]);
    if(/\b(third|3rd|number 3)\b/.test(value)&&refs[2])return PRODUCT_BY_SLUG.get(refs[2]);
    if(/\b(first|1st|top one|one you recommended|that one|it)\b/.test(value))return PRODUCT_BY_SLUG.get(refs[0]);
    for(const slug of refs){const product=PRODUCT_BY_SLUG.get(slug);if(product&&(value.includes(norm(product.brand))||value.includes(norm(product.name))))return product;}
  }
  return search.matchProduct(text)||null;
}

function card(product,extra={}){
  if(!product)return null;
  const category=CATEGORY_BY_SLUG.get(product.category);
  return {slug:product.slug,brand:product.brand,name:product.name,category:product.categoryLabel||(category&&category.label)||human(product.category),url:'/products/'+product.slug+'/',referencePrice:Number(product.price)>0?Number(product.price):null,evidence:product.evidenceLabel||(product.evidenceTier==='deep'?'Deeper APG evidence':'APG research'),reason:clamp(extra.reason||'',300)||null,tradeoff:clamp(extra.tradeoff||product.watch||'',300)||null};
}

function action(label,url,options={}){
  if(url&&!routeAllowed(url)&&!/^https:\/\//.test(url))return null;
  return {label,url:url||null,kind:options.kind||'link',primary:!!options.primary,slug:options.slug||null,external:!!options.external,affiliate:!!options.affiliate};
}

function productQuestion(text,pageContext,references){
  const product=resolveReference(text,references,pageContext);
  if(!product)return {intent:'product_question',message:'Tell me which product you mean and I’ll check APG’s maintained product record rather than guessing.',actions:[action('Search products','/search/',{primary:true})]};
  const value=norm(text);
  const specs=(product.specs||[]).filter(item=>Array.isArray(item)&&item.length>=2).map(([label,specValue])=>({label:String(label),value:String(specValue)}));
  const queryWords=value.split(' ').filter(word=>word.length>3&&!['this','that','does','have','what','with','good','worth','product'].includes(word));
  let relevant=specs.filter(spec=>queryWords.some(word=>norm(spec.label).includes(word)||norm(spec.value).includes(word))).slice(0,5);
  if(/sport|sports|motion|refresh/.test(value))relevant=uniq([...relevant,...specs.filter(spec=>/refresh|hz|motion/.test(norm(spec.label+' '+spec.value)))]).slice(0,5);
  if(/battery/.test(value))relevant=specs.filter(spec=>/battery|runtime|playback|charge/.test(norm(spec.label+' '+spec.value))).slice(0,5);
  if(/size|dimension|fit/.test(value))relevant=specs.filter(spec=>/size|dimension|width|height|depth|screen|capacity/.test(norm(spec.label))).slice(0,5);
  const bullets=[];
  if(relevant.length)relevant.forEach(spec=>bullets.push(spec.label+': '+spec.value));
  else (product.highlights||[]).slice(0,3).forEach(highlight=>bullets.push(String(highlight)));
  if(product.watch)bullets.push('Trade-off to check: '+product.watch);
  let message='APG’s maintained record for '+product.brand+' '+product.name+' shows the following relevant details.';
  if(/why do you say|why did you say|source for that|what makes you say/.test(value)){
    const sourceType=product.sourceType?human(product.sourceType):'maintained APG source evidence';
    const verified=product.lastSourceVerification?' last verified '+product.lastSourceVerification:'';
    message='That comes from APG’s maintained record for '+product.brand+' '+product.name+', using '+sourceType+verified+'. I won’t claim hands-on testing unless APG has explicitly documented it.';
  }else if(/worth|good|what do you think/.test(value)){
    message='APG’s maintained record for '+product.brand+' '+product.name+' supports the points below. I can explain the trade-offs, but I won’t turn incomplete evidence into a universal “best” claim.';
  }
  return {intent:'product_question',message,bullets,products:[card(product)],references:[product.slug],actions:[action('View product research','/products/'+product.slug+'/',{primary:true}),action('Open Compare','/compare/')].filter(Boolean)};
}

function currentOffers(product){
  const node=intelligence.knowledgeNode(product.slug);
  const offers=node&&node.commerce&&Array.isArray(node.commerce.offers)?node.commerce.offers:[];
  return offers.filter(offer=>offer&&offer.exactModel&&offer.url).map(offer=>({...offer,isCurrent:offer.freshness==='current-check'}));
}

function retailerResponse(text,pageContext,references){
  const product=resolveReference(text,references,pageContext);
  if(!product)return {intent:'price_or_retailer_question',message:'Tell me the exact product and I’ll use APG’s verified retailer records. I won’t invent a price, seller or Amazon listing.',actions:[action('Search products','/search/',{primary:true})]};
  const offers=currentOffers(product),current=offers.filter(offer=>offer.isCurrent),historical=offers.filter(offer=>!offer.isCurrent);
  const bullets=[],actions=[action('View APG product page','/products/'+product.slug+'/',{primary:true})];
  if(current.length){
    current.slice(0,4).forEach(offer=>{bullets.push(offer.retailer+': '+(offer.price?money(offer.price):'price not stored')+(offer.checkedAt?' · checked '+offer.checkedAt:''));actions.push(action('View at '+offer.retailer,offer.url,{kind:'retailer',external:true,affiliate:!!offer.affiliate}));});
    return {intent:'price_or_retailer_question',message:'APG currently has '+current.length+' exact-model retailer record'+(current.length===1?'':'s')+' for '+product.brand+' '+product.name+'. Prices and availability can change, so the retailer remains the final source at purchase time.',bullets,products:[card(product)],references:[product.slug],actions:actions.filter(Boolean)};
  }
  if(historical.length){
    historical.slice(0,3).forEach(offer=>bullets.push(offer.retailer+': last checked '+(offer.checkedAt||'previously')+'; APG does not treat this as a current price or availability check.'));
    return {intent:'price_or_retailer_question',message:'I can’t verify a current exact-model retailer price for '+product.brand+' '+product.name+' from APG’s present data, so I don’t want to quote stale availability as live.',bullets,products:[card(product)],references:[product.slug],actions:actions.filter(Boolean)};
  }
  return {intent:'price_or_retailer_question',message:'APG does not currently hold a verified exact-model retailer record for '+product.brand+' '+product.name+'. I won’t invent an Amazon URL, ASIN, price or seller.',products:[card(product)],references:[product.slug],actions:actions.filter(Boolean)};
}

function comparisonProducts(text,pageContext,references){
  const result=search.searchSite(text);
  if(result.directCompare)return [result.directCompare.a,result.directCompare.b];
  const contextual=(pageContext.comparisonProductSlugs||[]).map(slug=>PRODUCT_BY_SLUG.get(slug)).filter(Boolean);
  if(contextual.length>=2)return contextual.slice(0,4);
  const referenced=uniq((references||[]).filter(slug=>PRODUCT_BY_SLUG.has(slug))).map(slug=>PRODUCT_BY_SLUG.get(slug));
  return referenced.length>=2?referenced.slice(0,4):[];
}

function comparisonResponse(text,pageContext,references,priorState){
  const candidates=comparisonProducts(text,pageContext,references);
  if(candidates.length<2)return {intent:'product_comparison',message:'Name the two products you want to compare, or open Scout from an APG comparison page and ask “which one suits me?”.',actions:[action('Open Compare','/compare/',{primary:true})]};
  const [a,b]=candidates,bullets=[];
  if(Number(a.price)>0||Number(b.price)>0)bullets.push('APG reference price: '+a.brand+' '+a.name+' '+(money(a.price)||'not maintained')+' · '+b.brand+' '+b.name+' '+(money(b.price)||'not maintained'));
  const specMap=product=>new Map((product.specs||[]).filter(item=>Array.isArray(item)&&item.length>=2).map(([label,value])=>[norm(label),{label:String(label),value:String(value)}]));
  const mapA=specMap(a),mapB=specMap(b);
  for(const key of mapA.keys()){
    if(mapB.has(key)&&mapA.get(key).value!==mapB.get(key).value)bullets.push(mapA.get(key).label+': '+a.name+' — '+mapA.get(key).value+'; '+b.name+' — '+mapB.get(key).value);
    if(bullets.length>=5)break;
  }
  const query=[stateToQuery(priorState),text,a.category===b.category?((CATEGORY_BY_SLUG.get(a.category)||{}).label||''):''].filter(Boolean).join(' ');
  const parsed=decision.interpretQuery(query);
  const hasPriorities=!!(parsed.budget||(parsed.requiredTags||[]).length||(parsed.positiveTags||[]).length||(parsed.excludedTags||[]).length||(parsed.excludedBrands||[]).length||(parsed.numericConstraints||[]).length);
  let message=a.brand+' '+a.name+' and '+b.brand+' '+b.name+' have different trade-offs; neither is automatically better for everyone.';
  if(a.category===b.category&&hasPriorities){
    const ranked=(decision.rankDecision(query,{category:a.category}).ranked||[]),rankA=ranked.findIndex(item=>item.p.slug===a.slug),rankB=ranked.findIndex(item=>item.p.slug===b.slug);
    if(rankA>=0&&rankB>=0&&rankA!==rankB){const winner=rankA<rankB?a:b;message='For the priorities you’ve given me, I’d lean '+winner.brand+' '+winner.name+'. That is a fit judgement from APG’s maintained decision signals, not a universal review score.';}
  }
  const tagsA=new Set(a.tags||[]),tagsB=new Set(b.tags||[]);
  const onlyA=[...tagsA].filter(tag=>!tagsB.has(tag)).slice(0,2),onlyB=[...tagsB].filter(tag=>!tagsA.has(tag)).slice(0,2);
  if(onlyA.length)bullets.push(a.name+' stands out in APG’s current tagging for '+onlyA.map(human).join(' and ')+'.');
  if(onlyB.length)bullets.push(b.name+' stands out in APG’s current tagging for '+onlyB.map(human).join(' and ')+'.');
  const slugs=candidates.slice(0,4).map(product=>product.slug);
  return {intent:'product_comparison',message,bullets:bullets.slice(0,7),products:candidates.slice(0,4).map(product=>card(product)),references:slugs,actions:[action('Open side-by-side comparison','/compare/custom/?products='+slugs.join(','),{primary:true}),action('Refine in Decision Lab','/decision-lab/')].filter(Boolean)};
}

function mergedDecisionQuery(text,pageContext,priorState,references){
  const parsed=decision.interpretQuery(text),prior=safeState(priorState);
  const explicitNew=!!parsed.categorySlug&&((prior&&prior.category&&parsed.categorySlug!==prior.category)||/forget|instead|something else|now i need/.test(norm(text)));
  const parts=[text];
  if(prior&&!explicitNew)parts.push(stateToQuery(prior));
  if(!parsed.categorySlug&&(!prior||!prior.category)&&pageContext.categorySlug){const category=CATEGORY_BY_SLUG.get(pageContext.categorySlug);if(category)parts.push(category.label);}
  if(/anything cheaper|cheaper option|too expensive|spend less|lower the price/.test(norm(text))){
    const product=resolveReference('first',references,pageContext),priorBudget=prior&&prior.budget&&prior.budget.amount;
    const ceiling=product&&Number(product.price)>0?Math.max(1,Math.floor(Number(product.price)-1)):priorBudget;
    if(ceiling)parts.push('maximum budget '+money(ceiling)+' value is a high priority');
  }
  return uniq(parts.filter(Boolean)).join(' ');
}

function recommendationResponse(text,pageContext,references,priorState){
  const query=mergedDecisionQuery(text,pageContext,priorState,references),parsed=decision.interpretQuery(query);
  if(!parsed.categorySlug){
    const found=search.searchSite(text);
    if(found.coverageGap)return {intent:'product_recommendation',message:'APG does not yet maintain a '+found.coverageGap+' category, so I can’t give you a grounded shortlist from the catalogue.',actions:[action('Browse current categories','/categories/',{primary:true}),action('Search APG','/search/')].filter(Boolean)};
    if(found.categories&&found.categories.length)return {intent:'product_search',message:'I found a few APG categories that may match. Pick the closest one and I can narrow the decision from there.',actions:found.categories.slice(0,4).map((category,index)=>action(category.label,'/categories/'+category.slug+'/',{primary:index===0})).filter(Boolean)};
    return {intent:'product_recommendation',message:'Tell me what kind of product you’re shopping for. A rough budget and the one thing that matters most are enough to get started.',actions:[action('Browse categories','/categories/'),action('Open Decision Lab','/decision-lab/',{primary:true})].filter(Boolean)};
  }
  const category=CATEGORY_BY_SLUG.get(parsed.categorySlug);
  const signalCount=(parsed.positiveTags||[]).length+(parsed.requiredTags||[]).length+(parsed.excludedTags||[]).length+(parsed.numericConstraints||[]).length+(parsed.budget?1:0)+(parsed.brand?1:0);
  if(category&&signalCount===0){
    const factors=(category.factors||[]).slice(0,3).map(String);
    return {intent:'product_recommendation',message:'Absolutely. For '+category.label.toLowerCase()+', the biggest things that usually change APG’s recommendation are '+(factors.length?factors.join(', '):'budget, use case and your main deal-breaker')+'. What’s your rough budget, and which of those matters most?',decisionState:parsed.decisionState,actions:[action('Browse '+category.label,'/categories/'+category.slug+'/'),action('Use structured Decision Lab','/decision-lab/')].filter(Boolean)};
  }
  const result=decision.publicDecision(query,{category:parsed.categorySlug});
  const cards=(result.results||[]).slice(0,3).map(item=>card(PRODUCT_BY_SLUG.get(item.slug),{reason:(item.reasons||[])[0],tradeoff:(item.verificationNeeds||[])[0]||item.tradeoff||(item.gaps||[])[0]})).filter(Boolean);
  if(!cards.length)return {intent:'product_recommendation',message:'I can’t verify a reliable match from APG’s current maintained coverage for that brief. I’d rather say that than fabricate a recommendation.',decisionState:result.decisionState,actions:[action('Adjust the brief in Decision Lab','/decision-lab/',{primary:true}),category?action('Browse '+category.label,'/categories/'+category.slug+'/'):action('Browse categories','/categories/')].filter(Boolean)};
  const top=cards[0],lead=result.recommendation&&result.recommendation.whyItWon&&result.recommendation.whyItWon[0]?result.recommendation.whyItWon[0]:'it best matches the maintained signals in your brief';
  let message='My leading fit is '+top.brand+' '+top.name+' because '+String(lead).replace(/^./,char=>char.toLowerCase())+'.';
  if(result.audit&&result.audit.hardConstraintFallback)message='I can’t verify a clean match for every must-have, so I’m showing the closest APG options and marking uncertainty rather than silently trading away a hard constraint.';
  const slugs=cards.map(item=>item.slug),actions=[];
  if(slugs.length>1)actions.push(action('Compare these options','/compare/custom/?products='+slugs.join(','),{primary:true}));
  actions.push(action('Open full Decision Lab','/decision-lab/'));
  if(category)actions.push(action('Browse '+category.label,'/categories/'+category.slug+'/'));
  return {intent:'product_recommendation',message,products:cards,references:slugs,decisionState:result.decisionState,actions:actions.filter(Boolean),meta:{commercialRecommendationWeight:0,hardConstraintFallback:!!(result.audit&&result.audit.hardConstraintFallback)}};
}

function categoryResponse(text){
  const value=norm(text),parsed=decision.interpretQuery(text),category=parsed.categorySlug&&CATEGORY_BY_SLUG.get(parsed.categorySlug);
  if(/what categories|which categories|what do you cover/.test(value))return {intent:'category_question',message:'APG currently maintains '+products.length+' products across '+Object.keys(categories).length+' populated categories. You can browse the full current catalogue rather than relying on a stale list in chat.',actions:[action('Browse all categories','/categories/',{primary:true}),action('Search APG','/search/')].filter(Boolean)};
  if(category)return {intent:'category_question',message:'Yes — APG currently maintains a '+category.label+' category with '+category.products.length+' product record'+(category.products.length===1?'':'s')+'.',actions:[action('Browse '+category.label,'/categories/'+category.slug+'/',{primary:true}),action(category.label+' buying guide','/guides/'+category.slug+'-buying-guide/'),action('Help me choose','/categories/'+category.slug+'/finder/')].filter(Boolean)};
  const found=search.searchSite(text);
  if(found.categories&&found.categories.length){const match=found.categories[0];return {intent:'category_question',message:'The closest maintained category I found is '+match.label+'.',actions:[action('Browse '+match.label,'/categories/'+match.slug+'/',{primary:true}),action('Browse all categories','/categories/')].filter(Boolean)};}
  return {intent:'category_question',message:'I can’t find a maintained APG category matching that request right now. I don’t want to pretend the catalogue covers something it does not.',actions:[action('Browse current categories','/categories/',{primary:true})]};
}

function guideResponse(text,pageContext){
  const parsed=decision.interpretQuery(text),slug=parsed.categorySlug||pageContext.categorySlug,category=slug&&CATEGORY_BY_SLUG.get(slug);
  if(category)return {intent:'guide_discovery',message:'APG has a buying guide for '+category.label.toLowerCase()+' that explains the category factors and what to verify before buying.',actions:[action('Open '+category.label+' buying guide','/guides/'+category.slug+'-buying-guide/',{primary:true}),action('Browse '+category.label,'/categories/'+category.slug+'/')].filter(Boolean)};
  return {intent:'guide_discovery',message:'APG’s buying guides are organised by maintained category. Browse the guide library or tell me the product type you’re researching.',actions:[action('Browse buying guides','/guides/',{primary:true})]};
}

function siteNavigationResponse(text,pageContext){
  const page=sitePage(text,pageContext);
  if(!page)return {intent:'site_navigation',message:'I couldn’t match that to a current APG route, so I won’t invent a link.',actions:[action('Open sitemap','/sitemap/',{primary:true})].filter(Boolean)};
  if(page.action==='open-scout')return {intent:'site_navigation',message:'You’re already in Scout — APG does not currently maintain a separate Scout page.',actions:[action('Open Decision Lab','/decision-lab/'),action('Browse categories','/categories/')].filter(Boolean)};
  return {intent:'site_navigation',message:'You can find that at '+page.label+'.',actions:[action('Open '+page.label,page.url,{primary:true})].filter(Boolean)};
}

function apgInfoResponse(text){
  const value=norm(text);
  if(/what is scout|who are you|what can you do/.test(value))return {intent:'apg_information',message:'I’m Scout, Australian Product Guide’s shopping and site assistant. I can help you find products, compare options, explain APG research and trade-offs, navigate the site, and work with your own saved products when you’re signed in.',actions:[action('Browse products','/categories/'),action('Open Decision Lab','/decision-lab/'),action('About APG','/about/')].filter(Boolean)};
  if(/decision lab/.test(value))return {intent:'apg_information',message:'Decision Lab is APG’s structured recommendation experience: you describe your budget, priorities and deal-breakers, and APG ranks maintained products while keeping hard constraints and uncertainty visible.',actions:[action('Open Decision Lab','/decision-lab/',{primary:true}),action('How recommendations work','/methodology/')].filter(Boolean)};
  return {intent:'apg_information',message:'Australian Product Guide helps Australians work out which products suit their situation, compare meaningful trade-offs and find retailer pathways. APG uses maintained product research and keeps affiliate commission out of recommendation scoring.',actions:[action('About APG','/about/',{primary:true}),action('How recommendations work','/methodology/'),action('Browse products','/categories/')].filter(Boolean)};
}

function methodologyResponse(text){
  const value=norm(text);
  if(/test|hands.on|physically/.test(value))return {intent:'methodology_question',message:'Unless a page explicitly says otherwise, APG guidance is desk-researched rather than hands-on testing. Scout will not say APG tested a product unless that testing is actually documented.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('See Sources','/sources/')].filter(Boolean)};
  if(/independent|trust/.test(value))return {intent:'methodology_question',message:'APG is designed so affiliate availability, retailer participation and commission contribute zero recommendation points. Product fit is based on the shopper’s needs and maintained evidence; uncertainty is surfaced rather than filled with guesses.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('Editorial standards','/editorial-standards/'),action('Sources','/sources/')].filter(Boolean)};
  return {intent:'methodology_question',message:'APG recommendations use maintained product evidence, explicit hard constraints, user priorities and category decision signals. Missing proof is marked as unverified rather than guessed, and commercial relationships do not improve a product’s ranking.',actions:[action('Read Methodology','/methodology/',{primary:true}),action('See Sources','/sources/')].filter(Boolean)};
}

function affiliateResponse(){
  return {intent:'affiliate_question',message:'APG may earn affiliate commission from eligible retailer links, including qualifying Amazon Australia purchases. That commercial relationship does not increase a product’s suitability, ranking or recommendation score — recommendation first, retailer link second.',actions:[action('Read Affiliate Disclosure','/affiliate-disclosure/',{primary:true}),action('See Methodology','/methodology/')].filter(Boolean)};
}

function accountHelpResponse(text,account={}){
  const value=norm(text);
  if(/verify|confirmation email/.test(value))return {intent:'account_help',message:'If you’ve just created an APG account, use the verification link sent to your email. My APG can also request another confirmation message if the first one did not arrive. Scout cannot read your inbox or bypass email verification.',actions:[action('Open My APG','/my-apg/?account=login',{primary:true})].filter(Boolean)};
  if(/forgot|reset.*password/.test(value))return {intent:'account_help',message:'Open My APG and use the password recovery option. Scout cannot retrieve or display your password, authentication token or recovery secret.',actions:[action('Open My APG','/my-apg/?account=login',{primary:true})].filter(Boolean)};
  if(/log ?out|sign ?out/.test(value))return {intent:'account_help',message:'You can sign out from My APG. Scout does not expose or manipulate authentication secrets.',actions:[action('Open My APG','/my-apg/',{primary:true})]};
  if(/create|register|join|sign ?up/.test(value))return {intent:'account_help',message:'You can create a free APG account in My APG. The core shopping and Scout experience remains useful without an account.',actions:[action('Join APG','/my-apg/?account=signup',{primary:true})].filter(Boolean)};
  if(/log ?in|sign ?in/.test(value))return {intent:'account_help',message:account.authenticated?'You’re already signed in to this APG session.':'You can sign in through My APG.',actions:[action('Open My APG',account.authenticated?'/my-apg/':'/my-apg/?account=login',{primary:true})].filter(Boolean)};
  return {intent:'account_help',message:'My APG is where you manage your account, saved products, comparisons and account settings. Scout only uses account information from the securely authenticated APG session.',actions:[action('Open My APG','/my-apg/',{primary:true})]};
}

function savedResponse(account={}){
  if(!account.authenticated)return {intent:'saved_products',message:'You’ll need to sign in to see account-level saved products. You can still keep comparing products in this Scout session without an account.',actions:[action('Log in','/my-apg/?account=login',{primary:true}),action('Keep shopping','/categories/')].filter(Boolean)};
  const saved=(account.savedProducts||[]).map(item=>PRODUCT_BY_SLUG.get(item.slug||item)).filter(Boolean).slice(0,12);
  if(!saved.length)return {intent:'saved_products',message:'You don’t currently have any saved products in this APG account.',actions:[action('Browse products','/categories/',{primary:true})]};
  const slugs=saved.slice(0,4).map(product=>product.slug),actions=[action('Open My APG','/my-apg/',{primary:true})];
  if(slugs.length>1)actions.push(action('Compare saved products','/compare/custom/?products='+slugs.join(',')));
  return {intent:'saved_products',message:'You currently have '+saved.length+' saved product'+(saved.length===1?'':'s')+'. I can help compare or narrow them down.',products:saved.map(product=>card(product)),references:slugs,actions:actions.filter(Boolean)};
}

function generalResponse(text){
  const value=norm(text);
  if(/^how are you/.test(value))return {intent:'general_conversation',message:'Doing well — ready to help. You can ask me about a product, a comparison, or anything on Australian Product Guide.'};
  if(/^(thanks|thank you|cheers)/.test(value))return {intent:'general_conversation',message:'No worries — happy to help. If you want to compare anything else, just ask.'};
  if(/that s all|all good|bye|goodbye/.test(value))return {intent:'general_conversation',message:'Glad I could help. You can come back to Scout whenever you want to pick up another buying decision.'};
  if(/football|weather|news|politics|recipe|write me|homework/.test(value))return {intent:'general_conversation',message:'I’m mainly here for products, buying decisions and Australian Product Guide. If you’re shopping for something or need help around APG, I’m happy to help.'};
  return {intent:'general_conversation',message:'I can help with products, comparisons, buying decisions or anything on Australian Product Guide. Tell me what you’re trying to do and I’ll point you in the right direction.',actions:[action('Browse products','/categories/'),action('Open Decision Lab','/decision-lab/')].filter(Boolean)};
}

function buildResponse(input={}){
  const text=clamp(input.text,2000),pageContext=validatePageContext(input.pageContext||{}),references=uniq((input.references||[]).map(slug=>clamp(slug,180)).filter(slug=>PRODUCT_BY_SLUG.has(slug))).slice(0,5),priorState=safeState(input.decisionState),account=input.account&&typeof input.account==='object'?input.account:{};
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
    const product=resolveReference(text,references,pageContext);
    out={intent,message:product?(intent==='save_product'?'Save ':'Remove ')+product.brand+' '+product.name+'.':'Tell me which product you mean.',accountAction:product?{action:intent==='save_product'?'save':'remove',slug:product.slug}:null,references:product?[product.slug]:references};
  }else out=generalResponse(text);
  return {version:VERSION,pageContext,intent,...out,actions:(out.actions||[]).filter(Boolean).filter(item=>!item.url||routeAllowed(item.url)||/^https:\/\//.test(item.url))};
}

module.exports={VERSION,SITE_PAGES,routeAllowed,sitePage,validatePageContext,displayName,securityBoundary,classifyIntent,safeState,stateToQuery,resolveReference,card,currentOffers,buildResponse,PRODUCT_BY_SLUG,CATEGORY_BY_SLUG};
