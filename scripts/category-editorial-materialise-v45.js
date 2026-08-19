'use strict';

const fs=require('fs');
const path=require('path');
const {categories}=require('../data');
const research=require('../data/category-editorial-selected-v45.json');
const candidates=require('../data/category-editorial-candidates-v45.json');

const ROOT=path.join(__dirname,'..');
const OUT_DIR=path.join(ROOT,'public','category-editorial');
const REGISTRY=path.join(ROOT,'data','category-editorial-images-v45.js');
const FINAL_REVIEW=path.join(ROOT,'data','category-editorial-final-review-v45.json');
const REVIEWED_AT='2026-08-19';

// Explicit curation is used where the automated search previously produced a weak,
// misleading, dated or non-editorial result. These are category-scene assets only.
const MANUAL_OVERRIDES={
  'air-fryers':{title:'Air Fryer 5458.jpg',reason:'Exact air-fryer category image; replaces toaster-oven/food false positives.'},
  'air-purifiers':{title:'Air Purifier (Levoit LV-H133) (49318571012).jpg',reason:'Air purifier in a domestic context rather than a filter component.'},
  'automatic-litter-boxes':{title:'A cat using an automated fully-plumbed self cleaning litterbox.jpg',reason:'Exact automatic-litter-box use scene; replaces unrelated catalogue material.'},
  'baby-monitors':{title:'Baby Monitor (51817515261).jpg',reason:'Clear baby-monitor photograph for a previously missing category.'},
  'coffee-grinders':{title:'Coffee grinder with freshly roasted beans in an artisan cafe setting.jpg',reason:'High-quality contextual coffee-grinder scene.'},
  'coffee-machines':{title:'A couple stands by a window in a kitchen, preparing coffee with an espresso machine.jpg',reason:'Premium lifestyle espresso-machine scene suited to the collection hero.'},
  'computer-monitors':{title:'RGB desktop computer setup with keyboard and monitor.jpg',reason:'Modern workstation context rather than a dated branded display.'},
  'dishwashers':{title:'Child loading glasses into a dishwasher in a kitchen.jpg',reason:'Natural domestic dishwasher-use scene.'},
  'document-scanners':{title:'Fujitsu ScanSnap fi-5100C duplex scanner open.jpeg',reason:'Actual document scanner rather than a film-scanner false positive.'},
  'e-readers':{title:'EReading devices.JPG',reason:'Landscape e-reading-device context rather than a portrait result.'},
  'electric-kettles':{title:'Boilingkettle.jpg',reason:'Electric kettle in use rather than an internal controller component.'},
  'fitness-trackers':{title:'Fitbit Alta HR landscape.jpg',reason:'Clear landscape fitness-tracker photograph for a previously missing category.'},
  'hair-straighteners':{title:'Styling hair with straightener (50845412536).jpg',reason:'Hair-styling context; explicitly replaces the flat-iron steak false positive.'},
  'home-fitness-equipment':{title:'EFTA00000269 - Well-equipped home gym with exercise equipment mats and workout tools neatly arranged on wooden floors.jpg',reason:'Dedicated premium home-gym scene without unrelated medical context.'},
  'home-printers':{title:'EFTA00002091 - Modern white desk with a computer printer and chair in a minimalist office space.jpg',reason:'Modern home-office printer scene rather than a 3D printer.'},
  'home-security-cameras':{title:'Security Cameras.jpg',reason:'Clear security-camera hardware rather than an unrelated exterior.'},
  'laptops':{title:'Laptop on a neat desk (Unsplash).jpg',reason:'Clean modern desk scene suitable for a premium laptop category hero.'},
  'multicookers':{title:'Instant Pot Pressure Cooker Vegetables and Quinoa (44383321600).jpg',reason:'Multicooker/pressure-cooker use scene for a previously missing category.'},
  'office-chairs':{title:'Modern office space featuring a desk, chairs, and plants.jpg',reason:'Wide contemporary office-chair context rather than a museum prototype.'},
  'pet-water-fountains':{title:'A cat drinking water.jpg',reason:'Relevant high-resolution pet hydration scene for a previously missing category.'},
  'portable-fridges':{title:'Ventilated portable refrigerator.jpg',reason:'Exact portable-refrigerator photograph for a previously missing category.'},
  'portable-power-stations':{title:'Anker SOLIX C300X Portable Power Station.jpg',reason:'Exact portable power station; replaces a historical illustration false positive.'},
  'rice-cookers':{title:'Rice-cooker.jpg',reason:'Conventional rice cooker rather than novelty artwork.'},
  'smart-displays':{title:'Google Home Hub on table.jpg',reason:'Actual home smart display rather than a heating-control false positive.'},
  'smart-doorbells':{title:'Ring video doorbell.jpg',reason:'Smart video doorbell hardware at the category level rather than captured footage.'},
  'smart-light-bulbs':{title:'Zigbee E27 Bulb.jpg',reason:'Actual connected smart bulb rather than an ordinary CFL.'},
  'smart-plugs':{title:'WLAN-Funk-Stecker in Steckdose.jpg',reason:'Smart Wi-Fi plug installed in a socket for a previously missing category.'},
  'smart-scales':{title:'Girl stands and weighs himself on white modern electronic smart scale - 51258015258.jpg',reason:'Modern smart-scale use scene.'},
  'smartwatches':{title:'A child wears a smartwatch on her wrist while picking grass.jpg',reason:'Natural wearable-use lifestyle scene.'},
  'soundbars':{title:'Samsung TV UE55F9000 with Sonos soundbar.jpg',reason:'In-room television and soundbar context.'},
  'standing-desks':{title:'Office, Standing Desk (5155525455).jpg',reason:'Clear standing-desk office context.'},
  'stick-vacuums':{title:'Cleaning with a cordless vacuum in a modern living room during afternoon light.jpg',reason:'Premium domestic cleaning scene rather than an isolated branded vacuum.'},
  'streaming-devices':{title:'Western Digital TV Live Streaming Media Player - 16008698917.jpg',reason:'Dedicated streaming-media-player hardware rather than a chart.'},
  'tyre-inflators':{title:'Milton Industries Illinois USA 506 12 single-head air chuck tire inflator gauge serial J787833.jpg',reason:'Tyre inflator and pressure-gauge photograph for a previously missing category.'},
  'usb-c-chargers':{title:'Silicon vs GaN 30W USB-C chargers.jpg',reason:'Dedicated USB-C wall chargers rather than a public-transport charging point.'},
  'usb-c-hubs-docks':{title:'USB C Hub.png',reason:'Exact USB-C hub image for a previously missing category.'},
  'vacuum-sealers':{title:'Vacuum sealer with food sealed on wooden table and rolls of plastic for sealing.jpg',reason:'Clear kitchen use scene with the category function visible.'},
  'water-filters':{title:'Under-sink Water Filter System.jpg',reason:'Clear installed water-filtration context.'},
  'webcams':{title:'Webcam on computer screen.jpg',reason:'Actual webcam mounted on a display rather than webcam covers.'},
  'wireless-chargers':{title:'Phone wireless charge.jpg',reason:'Phone actively charging on a wireless pad rather than a train charging surface.'},
  'wireless-headphones':{title:'Earfun wireless black headphones, September 2024 01.jpg',reason:'Contemporary wireless-headphone photograph.'}
};

const MIME_EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const meta=(m,k)=>clean(m&&m[k]&&m[k].value);
function licenceOK(short,url){const s=(String(short||'')+' '+String(url||'')).toLowerCase();return !/noncommercial|no derivatives|\bnc\b|\bnd\b/.test(s)&&(/cc0|public domain|creativecommons\.org\/(?:publicdomain|licenses\/by(?:-sa)?)\//.test(s)||/\bcc by(?:-sa)?\s*[234]/.test(s));}
function sourcePage(title){return `https://commons.wikimedia.org/wiki/${encodeURIComponent('File:'+title).replace(/%2F/g,'/')}`;}
async function exactFile(title){
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  const params={action:'query',format:'json',formatversion:'2',origin:'*',titles:`File:${title}`,prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'1280'};
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
  const r=await fetch(u,{headers:{'User-Agent':'AustralianProductGuide/1.0 (licensed category editorial imagery; https://australianproductguide.au/about/)','Accept':'application/json'}});
  if(!r.ok)throw new Error(`Commons metadata ${r.status} for ${title}`);const j=await r.json(),page=j.query&&j.query.pages&&j.query.pages[0];
  if(!page||page.missing)throw new Error(`Commons file missing: ${title}`);const ii=page.imageinfo&&page.imageinfo[0];if(!ii)throw new Error(`No image metadata: ${title}`);
  const m=ii.extmetadata||{},license=meta(m,'LicenseShortName'),licenseUrl=meta(m,'LicenseUrl');if(!licenceOK(license,licenseUrl))throw new Error(`Rejected licence ${license||'(blank)'}: ${title}`);if(!MIME_EXT[ii.mime])throw new Error(`Rejected mime ${ii.mime}: ${title}`);
  const width=Number(ii.width||0),height=Number(ii.height||0),short=Math.min(width,height),long=Math.max(width,height);if(long<1200||short<650)throw new Error(`Image too small ${width}x${height}: ${title}`);
  return {title,description:meta(m,'ImageDescription')||meta(m,'ObjectName'),creator:meta(m,'Artist')||meta(m,'Credit')||'Wikimedia Commons contributor',credit:meta(m,'Credit'),license,licenseUrl:licenseUrl||sourcePage(title),sourcePage:sourcePage(title),downloadUrl:ii.thumburl||ii.url,width,height,downloadWidth:Number(ii.thumbwidth||width),downloadHeight:Number(ii.thumbheight||height),mime:ii.mime};
}
async function download(item,dest){
  const r=await fetch(item.downloadUrl,{headers:{'User-Agent':'AustralianProductGuide/1.0 (licensed editorial asset mirror; https://australianproductguide.au/about/)'}});if(!r.ok)throw new Error(`Image download ${r.status}: ${item.title}`);
  const buf=Buffer.from(await r.arrayBuffer());if(buf.length<15000)throw new Error(`Suspiciously small image ${buf.length} bytes: ${item.title}`);if(buf.length>3000000)throw new Error(`Hero image exceeds 3 MB budget ${buf.length} bytes: ${item.title}`);fs.writeFileSync(dest,buf);return buf.length;
}
function pickAuto(slug){
  const row=candidates.categories.find(x=>x.slug===slug);if(!row)return null;
  return row.candidates.find(x=>Number(x.score)>=90&&Number(x.thumbWidth||x.width)/Number(x.thumbHeight||x.height)>=1.08)||null;
}
function patchPages(){
  const p=path.join(ROOT,'lib','pages.js');let s=fs.readFileSync(p,'utf8');
  if(!s.includes("categoryEditorialImages=require('../data/category-editorial-images-v45')"))s=s.replace("const trustContent=require('./content');","const trustContent=require('./content');\nconst categoryEditorialImages=require('../data/category-editorial-images-v45');");
  if(!s.includes('function categoryHeroMedia(c)')){
    const anchor="const money=n=>n?`A$${Number(n).toLocaleString('en-AU')}`:'Check current retailer';";
    const helper=`\nfunction categoryHeroMedia(c){const image=categoryEditorialImages[c.slug];if(!image)return \`<div class="category-hero-art">\${categoryIcon(c.icon,'large')}<strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div>\`;return \`<figure class="category-hero-media"><img src="\${esc(image.src)}" alt="" width="\${image.width}" height="\${image.height}" loading="eager" fetchpriority="high" decoding="async"><div class="category-hero-media-shade"></div><div class="category-hero-media-overlay"><span class="category-hero-photo-label">Category guide</span><strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div><figcaption><span>Editorial category image — not a reviewed product.</span> <a href="\${esc(image.sourcePage)}" target="_blank" rel="noopener noreferrer">\${esc(image.creator)}</a> · <a href="\${esc(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">\${esc(image.license)}</a></figcaption></figure>\`;}`;
    if(!s.includes(anchor))throw new Error('pages.js helper anchor not found');s=s.replace(anchor,anchor+helper);
  }
  const old=`<div class="category-hero-art">\${categoryIcon(c.icon,'large')}<strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div>`;
  if(s.includes(old))s=s.replace(old,'${categoryHeroMedia(c)}');if(!s.includes('${categoryHeroMedia(c)}'))throw new Error('category hero renderer replacement missing');fs.writeFileSync(p,s);
}
function patchCss(){
  const p=path.join(ROOT,'lib','premium-css.js');let s=fs.readFileSync(p,'utf8');if(s.includes('.category-hero-media{'))return;
  const marker='@media(prefers-reduced-motion:reduce)';
  const css=`.category-hero-media{position:relative;min-width:0;margin:0;border-radius:30px;overflow:hidden;background:var(--apg-navy-deep);box-shadow:var(--apg-s3);aspect-ratio:16/10;min-height:260px;isolation:isolate}.category-hero-media>img{display:block;width:100%;height:100%;position:absolute;inset:0;object-fit:cover;object-position:center;transform:scale(1.01)}.category-hero-media-shade{position:absolute;z-index:1;inset:0;background:linear-gradient(180deg,rgba(8,29,46,.04) 18%,rgba(8,29,46,.16) 48%,rgba(8,29,46,.92) 100%)}.category-hero-media-overlay{position:absolute;z-index:2;left:24px;right:24px;bottom:48px;color:#fff}.category-hero-photo-label{display:inline-flex!important;width:max-content;margin:0 0 8px!important;padding:5px 8px;border:1px solid rgba(255,255,255,.35);border-radius:999px;background:rgba(8,29,46,.35);backdrop-filter:blur(8px);color:#fff!important;font-size:9px!important;font-weight:850;letter-spacing:.07em;text-transform:uppercase}.category-hero-media-overlay strong{display:block;color:#fff;font-size:21px;letter-spacing:-.02em;text-shadow:0 2px 14px rgba(0,0,0,.35)}.category-hero-media-overlay>span:last-child{display:block;margin-top:4px;color:#e8f2f4;font-size:11px}.category-hero-media figcaption{position:absolute;z-index:3;left:0;right:0;bottom:0;min-height:36px;padding:9px 14px;background:rgba(8,29,46,.91);color:#d7e6ea;font-size:9px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.category-hero-media figcaption a{color:#fff;text-underline-offset:2px}.category-hero-media figcaption>span{color:#bcd1d7}\n@media(max-width:920px){.category-hero-media{min-height:220px;aspect-ratio:16/9}}\n@media(max-width:720px){.category-hero-media{min-height:205px;aspect-ratio:16/9;border-radius:24px}.category-hero-media-overlay{left:19px;right:19px;bottom:49px}.category-hero-media figcaption{font-size:8.5px}}\n@media(max-width:480px){.category-hero-media{min-height:210px;aspect-ratio:4/3}.category-hero-media-overlay{bottom:53px}.category-hero-media-overlay strong{font-size:19px}}\n`;
  if(!s.includes(marker))throw new Error('premium CSS marker not found');s=s.replace(marker,css+marker);fs.writeFileSync(p,s);
}
async function main(){
  const all=Object.values(categories).sort((a,b)=>a.slug.localeCompare(b.slug));if(all.length!==90)throw new Error(`Expected 90 categories, found ${all.length}`);
  const selectedBySlug=new Map(research.categories.map(x=>[x.slug,x]));fs.rmSync(OUT_DIR,{recursive:true,force:true});fs.mkdirSync(OUT_DIR,{recursive:true});
  const registry={},review=[];let totalBytes=0;
  for(let i=0;i<all.length;i++){
    const c=all[i],manual=MANUAL_OVERRIDES[c.slug],auto=manual?null:pickAuto(c.slug),saved=selectedBySlug.get(c.slug);let title,mode,reason,score=null;
    if(manual){title=manual.title;mode='MANUAL_CURATED';reason=manual.reason;}
    else if(auto){title=auto.title;mode='PREMIUM_AUTO';score=auto.score;reason='Highest-quality licensed candidate cleared APG relevance, landscape, false-positive and visual-context gates.';}
    else if(saved?.selected&&Number(saved.selected.score)>=70){title=saved.selected.title;mode='MANUAL_REVIEW_REQUIRED';score=saved.selected.score;reason='Fallback candidate filled coverage but must remain visible in final review before merge.';}
    else throw new Error(`No credible licensed hero candidate for ${c.slug}`);
    const item=await exactFile(title),ratio=item.downloadWidth/item.downloadHeight;if(mode==='PREMIUM_AUTO'&&ratio<1.08)throw new Error(`Auto hero is not landscape-ready ${c.slug}: ${ratio.toFixed(2)}`);
    const ext=MIME_EXT[item.mime],local=`/category-editorial/${c.slug}.${ext}`,dest=path.join(OUT_DIR,`${c.slug}.${ext}`),bytes=await download(item,dest);totalBytes+=bytes;
    registry[c.slug]={src:local,width:item.downloadWidth,height:item.downloadHeight,sourceTitle:item.title,sourcePage:item.sourcePage,creator:item.creator,license:item.license,licenseUrl:item.licenseUrl,reviewedAt:REVIEWED_AT,reviewStatus:mode,purpose:'Decorative category-level editorial context only; not evidence of a specific reviewed or recommended APG product.'};
    review.push({slug:c.slug,label:c.label,title:item.title,mode,score,reason,license:item.license,creator:item.creator,sourcePage:item.sourcePage,width:item.downloadWidth,height:item.downloadHeight,bytes});
    console.log(`${String(i+1).padStart(2,'0')}/90 ${c.slug}: ${mode} ${item.title} ${(bytes/1024).toFixed(0)} KB`);await sleep(70);
  }
  const sourcePages=review.map(x=>x.sourcePage),dupes=[...new Set(sourcePages.filter((x,i)=>sourcePages.indexOf(x)!==i))];if(dupes.length)throw new Error(`Duplicate source images across categories: ${dupes.join(' | ')}`);if(totalBytes>60000000)throw new Error(`Editorial image bundle exceeds 60 MB: ${totalBytes}`);
  fs.writeFileSync(REGISTRY,"'use strict';\n// APG Category Editorial Imagery v45. Self-hosted assets; source/licence provenance retained.\nmodule.exports=Object.freeze("+JSON.stringify(registry,null,2)+");\n");
  const summary={categories:review.length,manualCurated:review.filter(x=>x.mode==='MANUAL_CURATED').length,premiumAuto:review.filter(x=>x.mode==='PREMIUM_AUTO').length,reviewRequired:review.filter(x=>x.mode==='MANUAL_REVIEW_REQUIRED').length,totalBytes};
  fs.writeFileSync(FINAL_REVIEW,JSON.stringify({version:'category-editorial-final-review-v45',reviewedAt:REVIEWED_AT,policy:{purpose:'Decorative category-level editorial context only; never product evidence or an APG endorsement.',delivery:'Self-hosted by APG from verified Wikimedia Commons files.',licensing:'CC0, public domain, CC BY or CC BY-SA only; attribution retained on-page.',selection:'Premium-first research plus explicit manual curation for missing, weak, dated or semantically misleading categories.',releaseGate:'No Production merge while reviewRequired is non-zero.'},summary,categories:review},null,2)+'\n');
  patchPages();patchCss();console.log(`Materialised ${review.length}/90 category hero assets; ${(totalBytes/1024/1024).toFixed(1)} MB total; reviewRequired=${summary.reviewRequired}.`);
}
main().catch(e=>{console.error(e);process.exit(1);});
