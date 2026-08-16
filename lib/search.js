const {products,categories}=require('../data');
const {pairPages}=require('./routes');
const {rankDecision,describeIntent}=require('./decision-engine');
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9$]+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(Boolean);
function distance(a,b){if(a===b)return 0;if(!a.length)return b.length;if(!b.length)return a.length;let prev=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}return prev[b.length];}
const aliases={
  'coffee-machines':['coffee','espresso','barista','coffee machine'],
  'air-fryers':['air fryer','airfryer','fryer'],
  'robot-vacuums':['robot vacuum','robot vac','robo vac','vacuum robot'],
  'wireless-headphones':['headphones','headphone','over ear','noise cancelling','noise canceling']
};
const tagAliases={
  pets:['pet','pets','pet hair','dog hair','cat hair'],family:['family','family of 4','family of four','large household'],anc:['anc','noise cancellation','noise cancelling','noise canceling'],value:['value','budget','affordable','cheap'],premium:['premium','flagship','top tier'],compact:['compact','small','small kitchen','small space'],quiet:['quiet','silent'],battery:['battery','long battery'],travel:['travel','flight','flying'],milk:['milk','flat white','latte','cappuccino'],cold:['cold','iced','cold brew'],beginner:['beginner','easy','simple'],mopping:['mop','mopping'],obstacle:['obstacle','avoidance'],'dual-zone':['dual','dual zone','two basket','2 basket'],versatile:['versatile','multi function','multifunction'],bass:['bass']
};
function categoryFromQuery(q){const n=norm(q);return Object.entries(aliases).map(([slug,list])=>({slug,score:list.reduce((m,a)=>Math.max(m,n.includes(norm(a))?norm(a).length:0),0)})).sort((a,b)=>b.score-a.score)[0];}
function extractTags(q){const n=norm(q);return Object.entries(tagAliases).filter(([,list])=>list.some(a=>n.includes(norm(a)))).map(([tag])=>tag);}
function extractBudget(q){const n=norm(q).replace(/,/g,'');const m=n.match(/(?:under|below|less than|up to|max(?:imum)?|\$)\s*\$?\s*(\d{3,5})/);return m?Number(m[1]):null;}
function tokenScore(q,p){const tokens=words(q).filter(t=>t.length>1&&!['best','for','the','with','and','under','below','versus','vs'].includes(t));const hay=words([p.brand,p.name,p.summary,p.categoryLabel,(p.tags||[]).join(' '),(p.highlights||[]).join(' ')].join(' '));let score=0;for(const t of tokens){if(hay.includes(t))score+=8;else if(hay.some(h=>h.startsWith(t)||t.startsWith(h)))score+=4;else if(t.length>=4&&hay.some(h=>Math.abs(h.length-t.length)<=1&&distance(t,h)<=1))score+=2;}const nn=norm(q),name=norm(p.name),brand=norm(p.brand);if(nn.includes(name))score+=40;if(nn.includes(brand))score+=14;return score;}
function matchProduct(text){const raw=norm(text),compact=raw.replace(/\s+/g,'');const exactBrand=products.find(p=>norm(p.brand).replace(/\s+/g,'')===compact);if(exactBrand)return exactBrand;const exactName=products.find(p=>norm(p.name).replace(/\s+/g,'')===compact);if(exactName)return exactName;const ranked=products.map(p=>({p,score:tokenScore(text,p)})).sort((a,b)=>b.score-a.score);return ranked[0]?.score>=8?ranked[0].p:null;}
function searchSite(query){
  const q=String(query||'').trim(),n=norm(q),decision=rankDecision(q),intent=decision.intent;
  const category=intent.category||null,tags=intent.positiveTags,budget=intent.budget;
  const decisionRank=new Map(decision.ranked.map((r,i)=>[r.p.slug,{r,i}]));
  const useDecision=!!(intent.categorySlug||intent.signalCount>=1);
  const productResults=products.map(p=>{let score=tokenScore(q,p);if(category&&p.category===category.slug)score+=18;for(const tag of tags)if(p.tags.includes(tag))score+=13;for(const tag of intent.excludedTags)if(p.tags.includes(tag))score-=35;if(budget&&p.price){if(p.price<=budget)score+=18;else score-=30;}if(useDecision){const d=decisionRank.get(p.slug);if(d)score+=Math.max(-20,34-d.i*3)+Math.max(-12,Math.min(16,d.r.score/8));}score+=(p.tags||[]).length*.2;return {p,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>x.p);
  const categoryResults=Object.values(categories).map(c=>{let score=0;if(category?.slug===c.slug)score+=30;for(const t of words(q))if(norm(c.label+' '+c.description).includes(t))score+=3;return {c,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.c);
  const comparisonResults=pairPages.map(x=>{const hay=norm(`${x.a.brand} ${x.a.name} ${x.b.brand} ${x.b.name}`);let score=0;for(const t of words(q))if(hay.includes(t))score+=4;if(n.includes(' vs ')||n.includes(' versus '))score+=2;return {x,score};}).filter(x=>x.score>=6).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.x);
  let directCompare=null;const split=q.split(/\s+(?:vs\.?|versus)\s+/i);if(split.length===2){const a=matchProduct(split[0]),b=matchProduct(split[1]);if(a&&b&&a.slug!==b.slug)directCompare={a,b,url:`/compare/custom/?products=${a.slug},${b.slug}`};}
  const guideResults=(categoryResults.length?categoryResults:Object.values(categories).filter(c=>n.includes(norm(c.label.split(' ')[0])))).slice(0,4);
  const interpretation=describeIntent(intent);
  return {q,products:productResults,categories:categoryResults.slice(0,4),comparisons:comparisonResults,guides:guideResults,directCompare,interpretation,budget,tags,excludedTags:intent.excludedTags,decisionIntent:intent};
}
function searchIndex(){return [
  {type:'decision',label:'APG Decision Lab',meta:'Explainable matching from your needs and deal-breakers',url:'/decision-lab/',slug:'decision-lab'},
  {type:'workspace',label:'My APG',meta:'Saved products, shortlist and recent decisions on this device',url:'/my-apg/',slug:'my-apg'},
  ...products.map(p=>({type:'product',label:`${p.brand} ${p.name}`,meta:p.categoryLabel,url:`/products/${p.slug}/`,slug:p.slug})),
  ...Object.values(categories).map(c=>({type:'category',label:c.label,meta:'Category',url:`/categories/${c.slug}/`,slug:c.slug})),
  ...Object.values(categories).map(c=>({type:'guide',label:`${c.label} buying guide`,meta:'Guide',url:`/guides/${c.slug}-buying-guide/`,slug:`${c.slug}-guide`})),
  {type:'search',label:'best coffee machine under $800',meta:'Suggested search',url:'/search/?q=best+coffee+machine+under+%24800'},
  {type:'search',label:'robot vacuum for pet hair',meta:'Suggested search',url:'/search/?q=robot+vacuum+for+pet+hair'},
  {type:'search',label:'air fryer for family of 4',meta:'Suggested search',url:'/search/?q=air+fryer+for+family+of+4'},
  {type:'search',label:'best value headphones',meta:'Suggested search',url:'/search/?q=best+value+headphones'}
];}
module.exports={searchSite,searchIndex,matchProduct,norm,extractTags,extractBudget,categoryFromQuery};
