const {products}=require('../data');
const {retailerFor}=require('../data/retailers');
const counts={products:products.length,deep:0,starter:0,exactAmazon:0,amazonFallback:0,withPrice:0};
const queues={deepResearch:[],exactAmazon:[],price:[],image:[]};
for(const p of products){
  if(p.evidenceTier==='deep')counts.deep++;else counts.starter++;
  const r=retailerFor(p);
  if(r?.type==='direct')counts.exactAmazon++;else counts.amazonFallback++;
  if(Number.isFinite(p.price)&&p.price>0)counts.withPrice++;
  if(p.evidenceTier!=='deep')queues.deepResearch.push(p.slug);
  if(r?.type!=='direct')queues.exactAmazon.push(p.slug);
  if(!(Number.isFinite(p.price)&&p.price>0))queues.price.push(p.slug);
  if(!p.imageVerified||!p.imageSource||p.imageSource==='APG-owned decision illustration')queues.image.push(p.slug);
}
const report={generatedAt:new Date().toISOString(),counts,queues};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
