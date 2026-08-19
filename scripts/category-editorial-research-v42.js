'use strict';

const fs=require('fs');
const path=require('path');
const {categories}=require('../data');

const OVERRIDES={
  'air-fryers':'air fryer','home-security-cameras':'security camera','stick-vacuums':'vacuum cleaner','mesh-wifi-systems':'wifi router','automatic-pet-feeders':'pet feeder','portable-power-stations':'camping power','external-ssds':'hard drive','power-banks':'phone charging','portable-monitors':'laptop monitor','e-readers':'ebook reader','vacuum-sealers':'food vacuum','water-filters':'water filter','portable-air-conditioners':'air conditioner','smart-plugs':'smart home','usb-c-chargers':'phone charger','wireless-chargers':'wireless charging','bluetooth-trackers':'keys tracker','photo-printers':'photo printer','garment-steamers':'clothes steamer','water-flossers':'dental hygiene','smart-scales':'bathroom scale','streaming-devices':'television streaming','smart-light-bulbs':'smart lighting','smart-displays':'smart home display','usb-c-hubs-docks':'laptop hub','document-scanners':'office scanner','pet-water-fountains':'cat water','automatic-litter-boxes':'cat litter','car-jump-starters':'car battery','tyre-inflators':'car tyre','portable-fridges':'camping fridge'
};
const BAD=/\b(logo|icon|vector|illustration|drawing|diagram|screenshot|mockup|template|poster|advert|advertisement|banner)\b/i;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function slug(s){return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function queryFor(c){return OVERRIDES[c.slug]||String(c.label||c.title||c.slug).replace(/ Australia$/i,'').replace(/-/g,' ');}
function normalise(r,q){
  const keys=Array.isArray(r.keywords)?r.keywords:String(r.tags||r.keywords||'').split(',').map(x=>x.trim()).filter(Boolean);
  const id=String(r.img_id||r.id||'').trim();
  const a=slug(keys[0]||q.split(' ')[0]||'photo'),b=slug(keys[1]||q.split(' ')[1]||'image');
  const prefix=[a,b].filter(Boolean).join('-');
  const landing=id?`https://stocksnap.io/photo/${prefix}-${id}`:'';
  const cdn=id?`https://cdn.stocksnap.io/img-thumbs/960w/${prefix}_${id}.jpg`:'';
  return {id,title:String(r.title||keys.slice(0,3).join(' ')||q),creator:String(r.user_name||r.author_name||r.author||r.username||''),landingUrl:landing,imageUrl:cdn,width:Number(r.width||0),height:Number(r.height||0),keywords:keys.slice(0,20),views:Number(r.page_views||r.views||0),downloads:Number(r.downloads||0),favourites:Number(r.favorites||r.favourites||0),source:'stocksnap',licence:'cc0',query:q};
}
function score(x,q){
  const hay=(x.title+' '+x.keywords.join(' ')).toLowerCase();
  const words=q.toLowerCase().split(/\s+/).filter(w=>w.length>2);
  let s=words.reduce((n,w)=>n+(hay.includes(w)?5:0),0);
  const ratio=x.width&&x.height?x.width/x.height:1.6;
  if(ratio>=1.4&&ratio<=2.2)s+=5;else if(ratio>=1.2)s+=2;else s-=4;
  if(x.width>=1800)s+=3;
  if(BAD.test(hay))s-=20;
  s+=Math.min(4,Math.log10(x.downloads+1));
  return Number(s.toFixed(2));
}
async function search(q){
  const encoded=encodeURIComponent(q);
  const url=`https://stocksnap.io/api/search-photos/${encoded}/relevance/desc/1`;
  const r=await fetch(url,{headers:{'User-Agent':'AustralianProductGuide/1.0 (editorial image research; https://australianproductguide.au/about/)','Accept':'application/json'}});
  if(!r.ok)throw new Error(`StockSnap ${r.status}`);
  const j=await r.json();
  return (j.results||[]).map(x=>normalise(x,q)).filter(x=>x.id&&x.landingUrl&&x.imageUrl&&!BAD.test(x.title+' '+x.keywords.join(' '))).map(x=>({...x,score:score(x,q)})).sort((a,b)=>b.score-a.score||b.downloads-a.downloads).slice(0,8);
}
async function main(){
  const cats=Object.values(categories).sort((a,b)=>a.slug.localeCompare(b.slug));
  if(cats.length!==90)throw new Error(`Expected 90 categories, found ${cats.length}`);
  const results=[];
  for(let i=0;i<cats.length;i++){
    const c=cats[i],q=queryFor(c);let candidates=[],error='';
    try{candidates=await search(q);}catch(e){error=e.message||String(e);}
    results.push({slug:c.slug,label:c.label,title:c.title,query:q,error,candidates});
    console.log(`${String(i+1).padStart(2,'0')}/90 ${c.slug}: ${candidates.length}${error?' '+error:''}`);
    await sleep(150);
  }
  const withCandidates=results.filter(x=>x.candidates.length).length;
  const out={version:'category-editorial-candidates-v42',generatedAt:new Date().toISOString(),policy:{purpose:'Decorative category-level editorial imagery; never evidence of a specific APG product.',source:'StockSnap',licence:'CC0',delivery:'Self-host selected assets before Production where practicable.',verification:'Human relevance review plus upstream landing-page/provenance validation before release.'},summary:{categories:90,withCandidates,withoutCandidates:90-withCandidates},categories:results};
  fs.writeFileSync(path.join(__dirname,'..','data','category-editorial-candidates-v42.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`Candidate coverage ${withCandidates}/90`);
}
main().catch(e=>{console.error(e);process.exit(1);});
