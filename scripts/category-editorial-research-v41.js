'use strict';

const fs=require('fs');
const path=require('path');
const {categories}=require('../data');

const QUERIES={
  'coffee-machines':'espresso machine coffee kitchen',
  'air-fryers':'air fryer kitchen cooking',
  'robot-vacuums':'robot vacuum modern living room floor',
  'wireless-headphones':'headphones music lifestyle desk',
  'home-security-cameras':'home security camera house exterior',
  'stick-vacuums':'cordless vacuum modern home cleaning',
  'mesh-wifi-systems':'wifi router modern home technology',
  'earbuds':'wireless earbuds music lifestyle',
  'dash-cameras':'dashboard car road camera',
  'luggage':'suitcase luggage travel airport',
  'portable-power-stations':'portable power camping outdoors',
  'computer-monitors':'computer monitor modern desk workspace',
  'office-chairs':'ergonomic office chair modern workspace',
  'automatic-pet-feeders':'cat pet feeder home',
  'standing-desks':'standing desk modern home office',
  'mechanical-keyboards':'mechanical keyboard modern desk',
  'home-fitness-equipment':'home gym fitness equipment workout',
  'computer-mice':'computer mouse modern desk workspace',
  'dehumidifiers':'modern home humidity room appliance',
  'air-purifiers':'air purifier modern living room clean air',
  'cordless-drills':'cordless drill workshop DIY',
  'pressure-washers':'pressure washing outdoor cleaning patio',
  'smart-doorbells':'video doorbell front door modern home',
  'baby-monitors':'baby monitor nursery room',
  'smartwatches':'smartwatch wrist fitness lifestyle',
  'fitness-trackers':'fitness tracker running wrist',
  'bluetooth-speakers':'portable speaker music lifestyle',
  'soundbars':'soundbar television modern living room',
  'projectors':'home projector cinema living room',
  'gaming-monitors':'gaming monitor desk setup',
  'gaming-headsets':'gaming headset desk computer',
  'webcams':'webcam computer desk video call',
  'microphones':'podcast microphone studio desk',
  'external-ssds':'portable hard drive SSD desk laptop',
  'power-banks':'power bank phone travel charging',
  'portable-monitors':'portable monitor laptop workspace',
  'tablets':'tablet computer lifestyle desk',
  'e-readers':'ebook reader reading lifestyle',
  'electric-toothbrushes':'electric toothbrush modern bathroom',
  'hair-dryers':'hair dryer modern bathroom',
  'electric-shavers':'electric shaver grooming bathroom',
  'kitchen-mixers':'stand mixer modern kitchen baking',
  'blenders':'blender modern kitchen smoothie',
  'rice-cookers':'rice cooker modern kitchen',
  'multicookers':'pressure cooker multicooker modern kitchen',
  'vacuum-sealers':'vacuum sealer food kitchen',
  'water-filters':'filtered water jug modern kitchen',
  'portable-air-conditioners':'air conditioner modern living room summer',
  'smart-plugs':'smart home power plug outlet',
  'wifi-routers':'wifi router modern home desk',
  'usb-c-chargers':'phone charger USB C desk travel',
  'wireless-chargers':'wireless charging phone modern desk',
  'bluetooth-trackers':'key tracker luggage travel technology',
  'action-cameras':'action camera outdoor adventure travel',
  'instant-cameras':'instant camera photography lifestyle',
  'photo-printers':'photo printing desk photography',
  'electric-kettles':'electric kettle modern kitchen tea',
  'toasters':'toaster modern kitchen breakfast',
  'food-processors':'food processor modern kitchen cooking',
  'slow-cookers':'slow cooker kitchen cooking dinner',
  'ice-cream-makers':'ice cream kitchen dessert making',
  'garment-steamers':'clothing steamer wardrobe fashion',
  'hair-straighteners':'hair straightener styling bathroom',
  'beard-trimmers':'beard grooming trimmer bathroom',
  'water-flossers':'water flosser dental bathroom',
  'massage-guns':'massage gun fitness recovery',
  'smart-scales':'bathroom scale modern bathroom fitness',
  'streaming-devices':'streaming television modern living room',
  'coffee-grinders':'coffee grinder beans modern kitchen',
  'microwave-ovens':'microwave modern kitchen appliance',
  'bread-makers':'bread maker fresh bread kitchen',
  'juicers':'juicer fresh juice modern kitchen',
  'smart-light-bulbs':'smart lighting modern home interior',
  'smart-displays':'smart display modern kitchen home',
  'usb-c-hubs-docks':'USB hub laptop modern desk',
  'home-printers':'home printer modern office desk',
  'document-scanners':'document scanner modern office desk',
  'gaming-controllers':'game controller gaming setup',
  'pet-water-fountains':'cat water fountain pet home',
  'automatic-litter-boxes':'cat litter box modern home',
  'car-jump-starters':'car engine roadside emergency battery',
  'tyre-inflators':'car tyre inflation garage',
  'portable-fridges':'camping fridge outdoors road trip',
  'pizza-ovens':'outdoor pizza oven backyard',
  'televisions':'television modern living room interior',
  'laptops':'laptop modern workspace lifestyle',
  'washing-machines':'washing machine modern laundry room',
  'fridges':'refrigerator modern kitchen interior',
  'dishwashers':'dishwasher modern kitchen interior',
  'smartphones':'smartphone modern lifestyle technology'
};

const STOP=new Set(['and','the','for','with','modern','home','lifestyle','australia','australian','product','products','portable']);
const BAD=/\b(logo|icon|vector|illustration|drawing|diagram|screenshot|mockup|template|poster|advert|advertisement|banner|text)\b/i;
const HUMAN=/\b(man|woman|boy|girl|child|person|people|portrait|face|model)\b/i;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function clean(s){return String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}
function terms(q){return clean(q).split(' ').filter(x=>x.length>2&&!STOP.has(x));}
function score(item,q){
  const hay=clean([item.title,item.description,(item.tags||[]).map(t=>t.name||t).join(' ')].join(' '));
  let n=0;
  for(const t of terms(q)) if(hay.includes(t)) n+=3;
  if(Number(item.width)>=1800)n+=2; else if(Number(item.width)>=1400)n+=1;
  const ratio=Number(item.width||0)/Number(item.height||1);
  if(ratio>=1.45&&ratio<=2.3)n+=3; else if(ratio>=1.25)n+=1;
  if(HUMAN.test(hay))n-=3;
  if(BAD.test(hay))n-=8;
  return n;
}
function normalise(x,q){return {
  id:x.id,
  title:x.title||'',
  creator:x.creator||'',
  creatorUrl:x.creator_url||'',
  source:x.source||'',
  provider:x.provider||'',
  licence:String(x.license||'').toLowerCase(),
  licenceUrl:x.license_url||'',
  landingUrl:x.foreign_landing_url||'',
  imageUrl:x.url||'',
  thumbnail:x.thumbnail||'',
  width:Number(x.width||0),
  height:Number(x.height||0),
  mature:Boolean(x.mature),
  tags:(x.tags||[]).slice(0,18).map(t=>typeof t==='string'?t:(t.name||'' )).filter(Boolean),
  query:q,
  score:score(x,q)
};}
async function searchOpenverse(q){
  const u=new URL('https://api.openverse.org/v1/images/');
  u.searchParams.set('q',q);
  u.searchParams.set('source','stocksnap');
  u.searchParams.set('license','cc0');
  u.searchParams.set('category','photograph');
  u.searchParams.set('page_size','20');
  const r=await fetch(u,{headers:{'User-Agent':'AustralianProductGuide/1.0 (editorial imagery research; https://australianproductguide.au/about/)'}});
  if(!r.ok)throw new Error(`Openverse ${r.status} ${await r.text()}`);
  const j=await r.json();
  return (j.results||[]).map(x=>normalise(x,q)).filter(x=>!x.mature&&x.licence==='cc0'&&x.source==='stocksnap'&&x.imageUrl&&x.landingUrl&&x.width>=1200&&x.width/x.height>=1.2&&!BAD.test(clean(x.title+' '+x.tags.join(' ')))).sort((a,b)=>b.score-a.score||b.width-a.width).slice(0,8);
}
async function main(){
  const cats=Object.values(categories).sort((a,b)=>a.slug.localeCompare(b.slug));
  const unknown=cats.filter(c=>!QUERIES[c.slug]);
  if(unknown.length)throw new Error(`Missing search query: ${unknown.map(x=>x.slug).join(', ')}`);
  if(cats.length!==90)throw new Error(`Expected 90 categories, found ${cats.length}`);
  const results=[];
  for(let i=0;i<cats.length;i++){
    const c=cats[i],q=QUERIES[c.slug];
    let candidates=[],error='';
    try{candidates=await searchOpenverse(q);}catch(e){error=e.message||String(e);}
    results.push({slug:c.slug,label:c.label,title:c.title,query:q,error,candidates});
    console.log(`${String(i+1).padStart(2,'0')}/90 ${c.slug}: ${candidates.length}${error?' ERROR '+error:''}`);
    await sleep(250);
  }
  const covered=results.filter(x=>x.candidates.length).length;
  const out={version:'category-editorial-candidates-v41',generatedAt:new Date().toISOString(),policy:{purpose:'Category-level editorial imagery only; never evidence of a specific reviewed product.',source:'StockSnap via Openverse',requiredLicence:'CC0',selection:'Human-reviewed before Production; self-host final selected assets.',upstreamVerification:'Verify landing page and licence before release.'},summary:{categories:results.length,withCandidates:covered,withoutCandidates:results.length-covered},categories:results};
  const dest=path.join(__dirname,'..','data','category-editorial-candidates-v41.json');
  fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
  console.log(`Wrote ${dest}: ${covered}/90 categories with candidates.`);
  if(covered<70)process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exit(1);});
