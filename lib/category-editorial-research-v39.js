'use strict';

// APG v39 preview-only editorial-image research helper.
// This endpoint exists only to support source/licence discovery during the
// category-hero imagery rollout. It is disabled in Production and is removed
// before the final release.
const app=require('./vercel-analytics-v38');
const {categories}=require('../data');

const QUERY_OVERRIDES={
  'coffee-machines':'espresso machine coffee kitchen',
  'coffee-grinders':'coffee grinder kitchen',
  'air-fryers':'air fryer kitchen appliance',
  'robot-vacuums':'robot vacuum living room',
  'stick-vacuums':'cordless vacuum cleaner home',
  'wireless-headphones':'over ear headphones lifestyle',
  'earbuds':'wireless earbuds lifestyle',
  'home-security-cameras':'home security camera exterior',
  'smart-doorbells':'video doorbell front door',
  'mesh-wifi-systems':'wifi router modern home',
  'computer-monitors':'computer monitor desk workspace',
  'gaming-monitors':'gaming monitor desk',
  'office-chairs':'office chair workspace',
  'standing-desks':'standing desk office',
  'mechanical-keyboards':'mechanical keyboard desk',
  'computer-mice':'computer mouse desk',
  'webcams':'webcam desk computer',
  'microphones':'podcast microphone studio',
  'external-ssds':'portable external drive desk',
  'power-banks':'portable power bank travel',
  'portable-monitors':'portable monitor laptop desk',
  'tablets':'tablet computer lifestyle',
  'e-readers':'e reader reading lifestyle',
  'smartwatches':'smartwatch fitness lifestyle',
  'fitness-trackers':'fitness tracker running',
  'bluetooth-speakers':'bluetooth speaker lifestyle',
  'soundbars':'soundbar living room television',
  'projectors':'home projector cinema',
  'gaming-headsets':'gaming headset computer',
  'luggage':'travel luggage suitcase',
  'portable-power-stations':'portable power station camping',
  'home-fitness-equipment':'home gym fitness equipment',
  'automatic-pet-feeders':'automatic pet feeder cat',
  'baby-monitors':'baby monitor nursery',
  'electric-toothbrushes':'electric toothbrush bathroom',
  'hair-dryers':'hair dryer bathroom',
  'electric-shavers':'electric shaver bathroom',
  'kitchen-mixers':'stand mixer kitchen',
  'blenders':'blender kitchen smoothie',
  'rice-cookers':'rice cooker kitchen',
  'multicookers':'multicooker kitchen appliance',
  'vacuum-sealers':'vacuum sealer kitchen food',
  'water-filters':'water filter kitchen',
  'portable-air-conditioners':'portable air conditioner home',
  'air-purifiers':'air purifier living room',
  'dehumidifiers':'dehumidifier home',
  'cordless-drills':'cordless drill workshop',
  'pressure-washers':'pressure washer outdoor cleaning',
  'dash-cameras':'dash camera car',
  'pizza-ovens':'pizza oven outdoor',
  'home-printers':'home printer office'
};

function stripHtml(value){return String(value||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();}
function licenceAllowed(value){const s=String(value||'').toLowerCase();return s.includes('cc0')||s.includes('public domain')||s.includes('cc by')||s.includes('cc-by');}
function queryFor(c){return QUERY_OVERRIDES[c.slug]||`${c.label} product lifestyle`;} 

async function commonsSearch(c){
  const q=queryFor(c);
  const params=new URLSearchParams({
    action:'query',format:'json',origin:'*',generator:'search',gsrsearch:q,
    gsrnamespace:'6',gsrlimit:'12',prop:'imageinfo',
    iiprop:'url|extmetadata|size',iiurlwidth:'1600'
  });
  const response=await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`,{
    headers:{'User-Agent':'AustralianProductGuide/1.0 (editorial image research; https://australianproductguide.au/about/)'}
  });
  if(!response.ok)throw new Error(`Commons ${response.status}`);
  const json=await response.json();
  const pages=Object.values(json?.query?.pages||{});
  const candidates=[];
  for(const page of pages){
    const info=page?.imageinfo?.[0];
    const meta=info?.extmetadata||{};
    const licence=stripHtml(meta.LicenseShortName?.value||meta.UsageTerms?.value);
    if(!info?.thumburl||!info?.descriptionurl||!licenceAllowed(licence))continue;
    const width=Number(info.thumbwidth||info.width||0),height=Number(info.thumbheight||info.height||0);
    if(!width||!height||width/height<1.25)continue;
    candidates.push({
      file:page.title,
      query:q,
      thumbnail:info.thumburl,
      original:info.url,
      sourcePage:info.descriptionurl,
      width:Number(info.width||0),height:Number(info.height||0),
      licence,
      licenceUrl:meta.LicenseUrl?.value||'',
      artist:stripHtml(meta.Artist?.value||meta.Credit?.value||''),
      description:stripHtml(meta.ImageDescription?.value||meta.ObjectName?.value||'').slice(0,240)
    });
  }
  return {slug:c.slug,label:c.label,title:c.title,query:q,candidates:candidates.slice(0,5)};
}

async function research(req,res,u){
  if(process.env.VERCEL_ENV==='production'){
    res.statusCode=404;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Robots-Tag','noindex');return res.end(JSON.stringify({error:'Not found'}));
  }
  if(!['GET','HEAD'].includes(req.method)){
    res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.setHeader('Content-Type','application/json; charset=utf-8');return res.end(JSON.stringify({error:'Method not allowed'}));
  }
  const all=Object.values(categories).sort((a,b)=>a.label.localeCompare(b.label));
  const offset=Math.max(0,Math.min(all.length,Number.parseInt(u.searchParams.get('offset')||'0',10)||0));
  const limit=Math.max(1,Math.min(10,Number.parseInt(u.searchParams.get('limit')||'6',10)||6));
  const slice=all.slice(offset,offset+limit);
  const settled=await Promise.allSettled(slice.map(commonsSearch));
  const results=settled.map((x,i)=>x.status==='fulfilled'?x.value:{slug:slice[i].slug,label:slice[i].label,error:String(x.reason?.message||x.reason||'Research failed')});
  const body=JSON.stringify({version:'category-editorial-research-v39',total:all.length,offset,limit,results});
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, max-age=300');res.setHeader('X-Robots-Tag','noindex, nofollow');
  return res.end(req.method==='HEAD'?'':body);
}

async function handler(req,res){
  let u;try{u=new URL(req.url,'https://apg.invalid')}catch{return app(req,res);}
  if(u.pathname==='/api/editorial-image-research'||u.pathname==='/api/editorial-image-research/')return research(req,res,u);
  return app(req,res);
}

Object.assign(handler,app,{queryFor,commonsSearch});
module.exports=handler;
