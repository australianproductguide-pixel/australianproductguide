'use strict';

const fs=require('fs');
const path=require('path');
const {categories}=require('../data');

// These are deliberately editorial-scene searches, not exact product-image searches.
// A category hero should communicate the shopping context without implying that a
// photographed item is the exact APG-reviewed model.
const SCENES={
  'action-cameras':'outdoor adventure camera travel',
  'air-fryers':'kitchen cooking food appliance',
  'air-purifiers':'modern living room wellness clean home',
  'automatic-litter-boxes':'cat pet home interior',
  'automatic-pet-feeders':'cat dog pet home feeding',
  'baby-monitors':'nursery baby room home',
  'beard-trimmers':'grooming beard bathroom',
  'blenders':'smoothie fruit kitchen cooking',
  'bluetooth-speakers':'music speaker home lifestyle',
  'bluetooth-trackers':'keys luggage travel technology',
  'bread-makers':'fresh bread baking kitchen',
  'car-jump-starters':'car roadside garage battery',
  'coffee-grinders':'coffee beans kitchen barista',
  'coffee-machines':'espresso coffee cafe kitchen',
  'computer-mice':'desk computer workspace technology',
  'computer-monitors':'monitor desk workspace computer',
  'cordless-drills':'workshop diy tools construction',
  'dash-cameras':'car driving road dashboard',
  'dehumidifiers':'home interior bedroom comfort',
  'dishwashers':'modern kitchen dishes interior',
  'document-scanners':'office paper desk documents',
  'earbuds':'music audio headphones lifestyle',
  'e-readers':'reading book tablet lifestyle',
  'electric-kettles':'tea kettle kitchen morning',
  'electric-shavers':'grooming shaving bathroom',
  'electric-toothbrushes':'toothbrush bathroom dental hygiene',
  'external-ssds':'laptop desk technology storage',
  'fitness-trackers':'running fitness wrist exercise',
  'food-processors':'food cooking kitchen preparation',
  'fridges':'modern kitchen refrigerator interior',
  'gaming-controllers':'gaming controller console desk',
  'gaming-headsets':'gaming headset setup desk',
  'gaming-monitors':'gaming monitor desk setup',
  'garment-steamers':'clothing fashion wardrobe ironing',
  'hair-dryers':'hair styling bathroom salon',
  'hair-straighteners':'hair styling beauty salon',
  'home-fitness-equipment':'home gym exercise workout',
  'home-printers':'printer desk office paper',
  'home-security-cameras':'house exterior entrance security',
  'ice-cream-makers':'ice cream dessert kitchen summer',
  'instant-cameras':'instant photography camera lifestyle',
  'juicers':'fresh juice fruit kitchen healthy',
  'kitchen-mixers':'baking mixer kitchen cake',
  'laptops':'laptop desk workspace technology',
  'luggage':'suitcase travel airport hotel',
  'massage-guns':'fitness recovery massage gym',
  'mechanical-keyboards':'keyboard desk gaming workspace',
  'mesh-wifi-systems':'router internet modern home technology',
  'microphones':'podcast microphone studio desk',
  'microwave-ovens':'modern kitchen food cooking',
  'multicookers':'kitchen cooking meal appliance',
  'office-chairs':'office chair workspace home',
  'pet-water-fountains':'cat pet water home',
  'photo-printers':'photography photos printing desk',
  'pizza-ovens':'pizza outdoor backyard cooking',
  'portable-air-conditioners':'summer home living room cooling',
  'portable-fridges':'camping roadtrip outdoors food',
  'portable-monitors':'laptop travel workspace desk',
  'portable-power-stations':'camping outdoors power adventure',
  'power-banks':'phone travel charging technology',
  'pressure-washers':'outdoor patio cleaning house',
  'projectors':'home cinema movie projector dark',
  'rice-cookers':'rice kitchen cooking meal',
  'robot-vacuums':'modern living room clean floor',
  'slow-cookers':'kitchen cooking dinner meal',
  'smart-displays':'smart home kitchen display technology',
  'smart-doorbells':'front door house entrance security',
  'smart-light-bulbs':'modern home lighting interior',
  'smart-plugs':'smart home electronics interior',
  'smart-scales':'fitness bathroom wellness',
  'smartphones':'smartphone technology lifestyle hands',
  'smartwatches':'smartwatch fitness wrist technology',
  'soundbars':'television living room home cinema',
  'standing-desks':'standing desk office workspace',
  'stick-vacuums':'clean home living room vacuum',
  'streaming-devices':'television living room entertainment',
  'tablets':'tablet desk reading technology',
  'televisions':'television living room entertainment',
  'toasters':'breakfast toast kitchen morning',
  'tyre-inflators':'car tyre garage roadtrip',
  'usb-c-chargers':'phone laptop charging desk',
  'usb-c-hubs-docks':'laptop desk workspace cables',
  'vacuum-sealers':'food storage kitchen meal prep',
  'washing-machines':'modern laundry room washing',
  'water-filters':'water glass kitchen clean',
  'water-flossers':'dental bathroom hygiene',
  'webcams':'video call desk computer camera',
  'wifi-routers':'router internet home technology',
  'wireless-chargers':'phone charging modern desk',
  'wireless-headphones':'headphones music audio lifestyle'
};

const BAD=/\b(logo|icon|vector|illustration|drawing|diagram|screenshot|mockup|template|poster|advert|advertisement|banner|text)\b/i;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function slug(s){return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function queryFor(c){return SCENES[c.slug]||'';}
function normalise(r,q){
  const keys=Array.isArray(r.keywords)?r.keywords:String(r.tags||r.keywords||'').split(',').map(x=>x.trim()).filter(Boolean);
  const id=String(r.img_id||r.id||'').trim();
  const a=slug(keys[0]||q.split(' ')[0]||'photo'),b=slug(keys[1]||q.split(' ')[1]||'image');
  const prefix=[a,b].filter(Boolean).join('-');
  const creator=String(r.user_name||r.author_name||r.author||r.username||'').trim();
  return {id,title:String(r.title||keys.slice(0,3).join(' ')||q),creator:creator&&creator!=='undefined'?creator:'StockSnap contributor',landingUrl:id?`https://stocksnap.io/photo/${prefix}-${id}`:'',imageUrl:id?`https://cdn.stocksnap.io/img-thumbs/960w/${prefix}_${id}.jpg`:'',width:Number(r.width||0),height:Number(r.height||0),keywords:keys.slice(0,20),views:Number(r.page_views||r.views||0),downloads:Number(r.downloads||0),favourites:Number(r.favorites||r.favourites||0),source:'StockSnap',licence:'CC0',query:q};
}
function score(x,q){
  const hay=(x.title+' '+x.keywords.join(' ')).toLowerCase();
  const words=q.toLowerCase().split(/\s+/).filter(w=>w.length>2);
  let s=words.reduce((n,w)=>n+(hay.includes(w)?4:0),0);
  const matches=words.filter(w=>hay.includes(w)).length;
  if(matches>=2)s+=8;
  if(matches>=3)s+=6;
  const ratio=x.width&&x.height?x.width/x.height:1.6;
  if(ratio>=1.35&&ratio<=2.25)s+=5;else if(ratio>=1.15)s+=2;else s-=5;
  if(x.width>=1800)s+=3;
  if(BAD.test(hay))s-=30;
  s+=Math.min(4,Math.log10((x.downloads||0)+1));
  return Number(s.toFixed(2));
}
async function fetchSearch(q,attempt=1){
  const url=`https://stocksnap.io/api/search-photos/${encodeURIComponent(q)}/relevance/desc/1`;
  const r=await fetch(url,{headers:{'User-Agent':'AustralianProductGuide/1.0 (editorial-image research; https://australianproductguide.au/about/)','Accept':'application/json'}});
  if(!r.ok){
    if((r.status===403||r.status===429||r.status>=500)&&attempt<4){await sleep(700*attempt);return fetchSearch(q,attempt+1);}
    throw new Error(`StockSnap ${r.status}`);
  }
  return r.json();
}
async function search(q){
  const j=await fetchSearch(q);
  return (j.results||[]).map(x=>normalise(x,q)).filter(x=>x.id&&x.landingUrl&&x.imageUrl&&!BAD.test(x.title+' '+x.keywords.join(' '))).map(x=>({...x,score:score(x,q)})).sort((a,b)=>b.score-a.score||b.downloads-a.downloads).slice(0,12);
}
async function main(){
  const cats=Object.values(categories).sort((a,b)=>a.slug.localeCompare(b.slug));
  if(cats.length!==90)throw new Error(`Expected 90 categories, found ${cats.length}`);
  const missingQueries=cats.filter(c=>!queryFor(c));
  if(missingQueries.length)throw new Error(`Missing editorial-scene queries: ${missingQueries.map(c=>c.slug).join(', ')}`);
  const results=[];
  for(let i=0;i<cats.length;i++){
    const c=cats[i],q=queryFor(c);let candidates=[],error='';
    try{candidates=await search(q);}catch(e){error=e.message||String(e);}
    results.push({slug:c.slug,label:c.label,title:c.title,query:q,error,candidates});
    console.log(`${String(i+1).padStart(2,'0')}/90 ${c.slug}: ${candidates.length}${error?' '+error:''}`);
    await sleep(260);
  }
  const used=new Set(),selection={};
  for(const row of results){
    const chosen=row.candidates.find(x=>!used.has(x.id))||row.candidates[0]||null;
    if(chosen){used.add(chosen.id);selection[row.slug]={...chosen,editorialPurpose:'Category-level illustrative backdrop; not a photograph of a specific APG-reviewed product.',checkedAt:'2026-08-19'};}
  }
  const withCandidates=results.filter(x=>x.candidates.length).length;
  const out={version:'category-editorial-candidates-v42.1',generatedAt:new Date().toISOString(),policy:{purpose:'Premium category-level editorial backdrops; never evidence of a specific APG product.',source:'StockSnap',licence:'CC0',delivery:'Self-host selected assets before Production where practicable.',verification:'Editorial scene query + relevance scoring + representative human visual review + upstream provenance checks.'},summary:{categories:90,withCandidates,withoutCandidates:90-withCandidates,selected:Object.keys(selection).length,uniqueSelected:new Set(Object.values(selection).map(x=>x.id)).size},selection,categories:results};
  fs.writeFileSync(path.join(__dirname,'..','data','category-editorial-candidates-v42.json'),JSON.stringify(out,null,2)+'\n');
  console.log(`Candidate coverage ${withCandidates}/90; selected ${Object.keys(selection).length}; unique ${out.summary.uniqueSelected}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
