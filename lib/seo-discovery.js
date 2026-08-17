const app=require('./national-experience');
const {categories,products}=require('../data');
const {brands,pairPages,indexableRoutes}=require('./routes');

const categoryList=Object.values(categories);
const productCount=products.length;
const categoryCount=categoryList.length;
const brandCount=brands.length;
const comparisonCount=pairPages.length;
const routeCount=indexableRoutes.length;

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function json(v){return JSON.stringify(v).replace(/</g,'\\u003c');}
function origin(req){const h=(req.headers['x-forwarded-host']||req.headers.host||process.env.VERCEL_PROJECT_PRODUCTION_URL||'australianproductguide.au').replace(/^https?:\/\//,'');return 'https://'+h;}
function tokenSet(c){return new Set([...(c.priorities||[]),...(c.products||[]).flatMap(p=>p.tags||[])]);}
function overlap(a,b){let n=0;for(const x of a)if(b.has(x))n++;return n;}
function relatedCategories(c,n=6){const a=tokenSet(c);return categoryList.filter(x=>x.slug!==c.slug).map(x=>({c:x,score:overlap(a,tokenSet(x))})).sort((x,y)=>y.score-x.score||x.c.label.localeCompare(y.c.label)).slice(0,n).map(x=>x.c);}
function categoryForPath(path){const m=path.match(/^\/categories\/([^/]+)\/$/);return m?categories[m[1]]:null;}
function brandForPath(path){const m=path.match(/^\/brands\/([^/]+)\/$/);if(!m)return null;return brands.find(b=>b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')===m[1])||null;}
function schemaTag(schema){return `<script type="application/ld+json">${json(schema)}</script>`;}
function categorySchema(req,c){const o=origin(req),path=`/categories/${c.slug}/`;return {'@context':'https://schema.org','@type':'CollectionPage',name:c.title,url:o+path,description:c.description,isPartOf:{'@type':'WebSite',name:'Australian Product Guide',url:o+'/'},mainEntity:{'@type':'ItemList',numberOfItems:c.products.length,itemListElement:c.products.map((p,i)=>({'@type':'ListItem',position:i+1,name:`${p.brand} ${p.name}`,url:o+`/products/${p.slug}/`}))}};}
function categoriesSchema(req){const o=origin(req);return {'@context':'https://schema.org','@type':'CollectionPage',name:'Product Categories Australia',url:o+'/categories/',description:`Browse ${categoryCount} maintained Australian product comparison categories on Australian Product Guide.`,mainEntity:{'@type':'ItemList',numberOfItems:categoryCount,itemListElement:categoryList.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.label,url:o+`/categories/${c.slug}/`}))}};}
function brandsSchema(req){const o=origin(req);return {'@context':'https://schema.org','@type':'CollectionPage',name:'Product Brands Australia',url:o+'/brands/',description:`Browse ${brandCount} brands represented in Australian Product Guide's maintained catalogue.`,mainEntity:{'@type':'ItemList',numberOfItems:brandCount,itemListElement:brands.map((b,i)=>({'@type':'ListItem',position:i+1,name:b,url:o+`/brands/${b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}/`}))}};}
function brandSchema(req,b){const o=origin(req),items=products.filter(p=>p.brand===b);const slug=b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');return {'@context':'https://schema.org','@type':'CollectionPage',name:`${b} Products Australia`,url:o+`/brands/${slug}/`,mainEntity:{'@type':'ItemList',numberOfItems:items.length,itemListElement:items.map((p,i)=>({'@type':'ListItem',position:i+1,name:`${p.brand} ${p.name}`,url:o+`/products/${p.slug}/`}))}};}
function relatedSection(c){const rel=relatedCategories(c);if(!rel.length)return '';return `<section class="section apg-seo-related" aria-labelledby="apgRelatedCategories"><div class="section-head"><div><p class="kicker">Keep comparing</p><h2 id="apgRelatedCategories">Related Australian buying categories</h2><p>Explore adjacent decisions in Australian Product Guide's maintained catalogue.</p></div></div><div class="category-grid">${rel.map(x=>`<a class="category-card" href="/categories/${x.slug}/"><span class="eyebrow">${esc(x.products.length)} maintained products</span><h3>${esc(x.label)}</h3><p>${esc(x.description)}</p><strong>Compare ${esc(x.label.toLowerCase())} →</strong></a>`).join('')}</div></section>`;}
function fixStaleCopy(html){return String(html||'')
 .replace(/37 maintained products/g,`${productCount} maintained products`)
 .replace(/56 prepared head-to-heads/g,`${comparisonCount} prepared head-to-heads`)
 .replace(/<strong>37<\/strong><span>maintained products<\/span>/g,`<strong>${productCount}</strong><span>maintained products</span>`)
 .replace(/<strong>4<\/strong><span>live decision categories<\/span>/g,`<strong>${categoryCount}</strong><span>maintained categories</span>`)
 .replace(/<strong>139<\/strong><span>canonical research routes<\/span>/g,`<strong>${routeCount}</strong><span>canonical research routes</span>`)
 .replace(/16 brands represented in the maintained catalogue/g,`${brandCount} brands represented in the maintained catalogue`)
 .replace(/Browse the 16 brands represented in APG’s 37-product evidence set\./g,`Browse the ${brandCount} brands represented across APG’s ${productCount}-product maintained catalogue.`)
 .replace(/Four categories are fully maintained today\. Wider pathways stay out of search indexes until their evidence and maintenance workflow is ready\./g,`${categoryCount} product categories are maintained today, each with crawlable product, guide, finder and comparison pathways.`)
 .replace(/<h2>48 category pathways<\/h2><p>Research-queue pages are deliberately noindex until APG can support a credible Australian dataset\.<\/p>/g,`<h2>${categoryCount} maintained category pathways</h2><p>Published pathways are linked into APG’s product, guide, finder and comparison architecture and are included only while they have maintained catalogue records.</p>`)
 .replace(/Live \+ research pathways/g,`${categoryCount} maintained categories`)
 .replace(/16 maintained brands/g,`${brandCount} maintained brands`);
}
function inject(req,html,path){let out=fixStaleCopy(html);let schema=null;const c=categoryForPath(path),b=brandForPath(path);if(c){schema=categorySchema(req,c);const marker='<aside class="evidence-box">';if(out.includes(marker)&&!out.includes('apg-seo-related'))out=out.replace(marker,relatedSection(c)+marker);}else if(path==='/categories/')schema=categoriesSchema(req);else if(path==='/brands/')schema=brandsSchema(req);else if(b)schema=brandSchema(req,b);if(schema&&out.includes('</head>'))out=out.replace('</head>',schemaTag(schema)+'</head>');return out;}
module.exports=(req,res)=>{let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(req,body,path);return end(body,...args);};return app(req,res);};
