const {products,categories}=require('../data');
const {pairPages}=require('./routes');
const {rankDecision,describeIntent,interpretQuery}=require('./decision-engine');
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$]+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(Boolean);
const COVERAGE_GAPS=[
  {label:'laptops',terms:['laptop','laptops','notebook','notebooks','macbook','macbooks','chromebook','chromebooks']},
  {label:'televisions',terms:['tv','tvs','television','televisions','oled tv','qled tv','mini led tv']},
  {label:'washing machines',terms:['washing machine','washing machines','washer','washers']},
  {label:'fridges',terms:['fridge','fridges','refrigerator','refrigerators']},
  {label:'dishwashers',terms:['dishwasher','dishwashers']},
  {label:'smartphones',terms:['smartphone','smartphones','mobile phone','mobile phones','iphone','iphones']},
  {label:'desktop computers',terms:['desktop computer','desktop computers','desktop pc','desktop pcs']},
  {label:'printers',terms:['printer','printers']},
  {label:'microwaves',terms:['microwave','microwaves']},
  {label:'kettles',terms:['kettle','kettles']},
  {label:'toasters',terms:['toaster','toasters']}
];
function distance(a,b){if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;let prev=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}return prev[b.length];}
function aliasesFor(c){return [...new Set([c.label,c.label.replace(/s$/,''),c.slug.replace(/-/g,' '),...(c.aliases||[])].map(norm).filter(Boolean))];}
function categoryFromQuery(q){const n=norm(q);let best=null;for(const c of Object.values(categories)){let score=0;for(const alias of aliasesFor(c))if(n.includes(alias))score=Math.max(score,alias.length);if(score&&(!best||score>best.score))best={slug:c.slug,score,category:c};}return best;}
function unsupportedCategoryFromQuery(q){const n=norm(q),tokens=new Set(words(q));for(const item of COVERAGE_GAPS){for(const term of item.terms){const t=norm(term);if(t.includes(' ')?n.includes(t):tokens.has(t))return item.label;}}return null;}
function extractTags(q){return interpretQuery(q).positiveTags;}
function extractBudget(q){return interpretQuery(q).budget;}
function tokenScore(q,p){const tokens=words(q).filter(t=>t.length>1&&!['best','for','the','with','and','under','below','versus','vs','buy','good'].includes(t));const hay=words([p.brand,p.name,p.summary,p.categoryLabel,(p.tags||[]).join(' '),(p.highlights||[]).join(' ')].join(' '));let score=0;for(const t of tokens){if(hay.includes(t))score+=8;else if(hay.some(h=>h.startsWith(t)||t.startsWith(h)))score+=4;else if(t.length>=4&&hay.some(h=>Math.abs(h.length-t.length)<=1&&distance(t,h)<=1))score+=2;}const nn=norm(q),name=norm(p.name),brand=norm(p.brand);if(name&&nn.includes(name))score+=40;if(brand&&nn.includes(brand))score+=14;return score;}
function matchProduct(text){const raw=norm(text),compact=raw.replace(/\s+/g,'');const exactName=products.find(p=>norm(`${p.brand} ${p.name}`).replace(/\s+/g,'')===compact)||products.find(p=>norm(p.name).replace(/\s+/g,'')===compact);if(exactName)return exactName;const ranked=products.map(p=>({p,score:tokenScore(text,p)})).sort((a,b)=>b.score-a.score);return ranked[0]?.score>=8?ranked[0].p:null;}
function searchSite(query){
  const q=String(query||'').trim(),n=norm(q),decision=rankDecision(q),intent=decision.intent;
  const category=intent.category||categoryFromQuery(q)?.category||null,tags=intent.positiveTags,budget=intent.budget;
  const coverageGap=!category?unsupportedCategoryFromQuery(q):null;
  if(coverageGap){
    return {q,products:[],categories:[],comparisons:[],guides:[],directCompare:null,interpretation:[`Coverage gap · ${coverageGap} are not yet a maintained category`],budget,tags,excludedTags:intent.excludedTags,decisionIntent:intent,coverageGap};
  }
  const decisionRank=new Map(decision.ranked.map((r,i)=>[r.p.slug,{r,i}]));
  const useDecision=!!(category||intent.signalCount>=1);
  const productResults=products.map(p=>{let score=tokenScore(q,p);if(category&&p.category===category.slug)score+=24;for(const tag of tags)if((p.tags||[]).includes(tag))score+=13;for(const tag of intent.excludedTags)if((p.tags||[]).includes(tag))score-=35;if(budget&&p.price){if(p.price<=budget)score+=18;else score-=30;}if(useDecision){const d=decisionRank.get(p.slug);if(d)score+=Math.max(-20,34-d.i*3)+Math.max(-12,Math.min(16,d.r.score/8));}if(p.evidenceTier==='deep')score+=1.5;return {p,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,18).map(x=>x.p);
  const categoryResults=Object.values(categories).map(c=>{let score=0;if(category?.slug===c.slug)score+=40;const hay=norm(`${c.label} ${c.description} ${(c.aliases||[]).join(' ')} ${(c.factors||[]).join(' ')}`);for(const t of words(q))if(hay.includes(t))score+=3;return {c,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.c);
  const comparisonResults=pairPages.map(x=>{const hay=norm(`${x.a.brand} ${x.a.name} ${x.b.brand} ${x.b.name}`);let score=0;for(const t of words(q))if(hay.includes(t))score+=4;if(n.includes(' vs ')||n.includes(' versus '))score+=2;return {x,score};}).filter(x=>x.score>=6).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.x);
  let directCompare=null;const split=q.split(/\s+(?:vs\.?|versus)\s+/i);if(split.length===2){const a=matchProduct(split[0]),b=matchProduct(split[1]);if(a&&b&&a.slug!==b.slug)directCompare={a,b,url:`/compare/custom/?products=${a.slug},${b.slug}`};}
  const guideResults=(categoryResults.length?categoryResults:(category?[category]:[])).slice(0,4);
  return {q,products:productResults,categories:categoryResults,comparisons:comparisonResults,guides:guideResults,directCompare,interpretation:describeIntent({...intent,category:category||intent.category,categorySlug:category?.slug||intent.categorySlug}),budget,tags,excludedTags:intent.excludedTags,decisionIntent:intent,coverageGap:null};
}
function searchIndex(){return [
  {type:'decision',label:'APG Decision Lab',meta:'Explainable matching from your needs and deal-breakers',url:'/decision-lab/',slug:'decision-lab'},
  {type:'workspace',label:'My APG',meta:'Saved products, comparisons and recent research on this device',url:'/my-apg/',slug:'my-apg'},
  ...products.map(p=>({type:'product',label:`${p.brand} ${p.name}`,meta:`${p.categoryLabel} · ${p.evidenceTier==='deep'?'Deep evidence':'Starter evidence'}`,url:`/products/${p.slug}/`,slug:p.slug})),
  ...Object.values(categories).map(c=>({type:'category',label:c.label,meta:`Category · ${c.products.length} maintained products`,url:`/categories/${c.slug}/`,slug:c.slug})),
  ...Object.values(categories).map(c=>({type:'guide',label:`${c.label} buying guide`,meta:'Buying guide',url:`/guides/${c.slug}-buying-guide/`,slug:`${c.slug}-guide`})),
  {type:'search',label:'robot vacuum for pet hair and mopping',meta:'Popular search',url:'/search/?q=robot+vacuum+for+pet+hair+and+mopping'},
  {type:'search',label:'quiet portable air conditioner for a bedroom',meta:'Popular search',url:'/search/?q=quiet+portable+air+conditioner+for+a+bedroom'},
  {type:'search',label:'mesh Wi-Fi for a large home',meta:'Popular search',url:'/search/?q=mesh+wifi+for+a+large+home'},
  {type:'search',label:'ergonomic office chair for long work days',meta:'Popular search',url:'/search/?q=ergonomic+office+chair+for+long+work+days'},
  {type:'search',label:'power bank for a laptop and travel',meta:'Popular search',url:'/search/?q=power+bank+for+a+laptop+and+travel'}
];}
module.exports={searchSite,searchIndex,matchProduct,norm,extractTags,extractBudget,categoryFromQuery,unsupportedCategoryFromQuery};
