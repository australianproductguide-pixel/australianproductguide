'use strict';

const fs=require('fs');
const path=require('path');
const {categories}=require('../data');
const selected=require('../data/category-editorial-selected-v44.json');

const ROOT=path.join(__dirname,'..');
const OUT_DIR=path.join(ROOT,'public','category-editorial');
const REGISTRY=path.join(ROOT,'data','category-editorial-images-v44.js');
const REVIEWED_AT='2026-08-19';

const MANUAL_OVERRIDES={
  'air-fryers':{title:'Air Fryer 5458.jpg',reason:'Replace food/toaster-oven false-positive with a clear air-fryer category image.'},
  'air-purifiers':{title:'Air Purifier (Levoit LV-H133) (49318571012).jpg',reason:'Use an air purifier in a living-room context rather than a filter component.'},
  'automatic-litter-boxes':{title:'A cat using an automated fully-plumbed self cleaning litterbox.jpg',reason:'Replace unrelated seed-catalogue false-positive with exact automatic-litter-box use.'},
  'baby-monitors':{title:'Baby Monitor (51817515261).jpg',reason:'Fill missing category with a verified landscape baby-monitor photograph.'},
  'computer-monitors':{title:'RGB desktop computer setup with keyboard and monitor.jpg',reason:'Use a modern monitor/workstation context rather than a legacy brand-specific display.'},
  'document-scanners':{title:'Fujitsu ScanSnap fi-5100C duplex scanner open.jpeg',reason:'Replace film-scanner false-positive with an actual document scanner.'},
  'e-readers':{title:'EReading devices.JPG',reason:'Use a landscape group of e-reading devices instead of a portrait smartphone e-reader.'},
  'electric-kettles':{title:'Boilingkettle.jpg',reason:'Replace internal controller component with an electric kettle in use.'},
  'fitness-trackers':{title:'Fitbit Alta HR landscape.jpg',reason:'Fill missing category with a clear landscape fitness-tracker photograph.'},
  'hair-straighteners':{title:'Styling hair with straightener (50845412536).jpg',reason:'Replace flat-iron-steak semantic false-positive with hair-straightening context.'},
  'home-fitness-equipment':{title:'EFTA00000269 - Well-equipped home gym with exercise equipment mats and workout tools neatly arranged on wooden floors.jpg',reason:'Use a dedicated home-gym scene without unrelated medical-test context.'},
  'home-printers':{title:'EFTA00002091 - Modern white desk with a computer printer and chair in a minimalist office space.jpg',reason:'Replace 3D-printer false-positive with a consumer/home printer in a desk setting.'},
  'home-security-cameras':{title:'Security Cameras.jpg',reason:'Replace low-relevance bulletin image with clear security-camera hardware.'},
  'multicookers':{title:'Instant Pot Pressure Cooker Vegetables and Quinoa (44383321600).jpg',reason:'Fill missing category with a multicooker/pressure-cooker use scene.'},
  'office-chairs':{title:'Modern office space featuring a desk, chairs, and plants.jpg',reason:'Use a wide contemporary office-chair context rather than a portrait museum prototype.'},
  'pet-water-fountains':{title:'A cat drinking water.jpg',reason:'Fill missing category with high-resolution cat drinking/fountain context.'},
  'portable-fridges':{title:'Ventilated portable refrigerator.jpg',reason:'Fill missing category with an exact portable-refrigerator photograph.'},
  'portable-power-stations':{title:'Anker SOLIX C300X Portable Power Station.jpg',reason:'Replace historical/van-electrics false-positive with an exact portable power station.'},
  'rice-cookers':{title:'Rice-cooker.jpg',reason:'Replace novelty face image with a conventional rice cooker.'},
  'smart-displays':{title:'Google Home Hub on table.jpg',reason:'Replace low-relevance PC touch-screen result with an actual home smart display.'},
  'smart-doorbells':{title:'Ring video doorbell.jpg',reason:'Use a smart video doorbell mounted at a front door rather than captured camera footage.'},
  'smart-light-bulbs':{title:'Zigbee E27 Bulb.jpg',reason:'Replace ordinary CFL false-positive with an actual Zigbee smart bulb.'},
  'smart-plugs':{title:'WLAN-Funk-Stecker in Steckdose.jpg',reason:'Fill missing category with a CC0 smart Wi-Fi plug installed in a socket.'},
  'soundbars':{title:'Samsung TV UE55F9000 with Sonos soundbar.jpg',reason:'Use an in-room television/soundbar context rather than a product-pair studio shot.'},
  'stick-vacuums':{title:'Cleaning with a cordless vacuum in a modern living room during afternoon light.jpg',reason:'Use category lifestyle context rather than a specific isolated vacuum model.'},
  'streaming-devices':{title:'Western Digital TV Live Streaming Media Player - 16008698917.jpg',reason:'Replace router/set-top-box false-positive with a dedicated streaming media player.'},
  'tyre-inflators':{title:'Milton Industries Illinois USA 506 12 single-head air chuck tire inflator gauge serial J787833.jpg',reason:'Fill missing category with a tyre inflator and pressure-gauge photograph.'},
  'usb-c-chargers':{title:'Silicon vs GaN 30W USB-C chargers.jpg',reason:'Replace transit charger image with dedicated USB-C wall chargers.'},
  'usb-c-hubs-docks':{title:'USB C Hub.png',reason:'Fill missing category with an exact USB-C hub image.'},
  'webcams':{title:'Webcam on computer screen.jpg',reason:'Replace webcam-cover result with an actual webcam mounted on a display.'},
  'wireless-chargers':{title:'Phone wireless charge.jpg',reason:'Use a phone actively charging on a wireless pad rather than a train charging surface.'}
};

const MANUAL_ACCEPT_SELECTED=new Set([
  'beard-trimmers','external-ssds','gaming-headsets','instant-cameras','kitchen-mixers','mesh-wifi-systems','portable-monitors'
]);

const BAD_AUTO=new Set(Object.keys(MANUAL_OVERRIDES));
const MIME_EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim();
const meta=(m,k)=>clean(m&&m[k]&&m[k].value);
function licenceOK(short,url){const s=(String(short||'')+' '+String(url||'')).toLowerCase();return !/noncommercial|no derivatives|\bnc\b|\bnd\b/.test(s)&&(/cc0|public domain|creativecommons\.org\/(?:publicdomain|licenses\/by(?:-sa)?)\//.test(s)||/\bcc by(?:-sa)?\s*[234]/.test(s));}
function sourcePage(title){return `https://commons.wikimedia.org/wiki/${encodeURIComponent('File:'+title).replace(/%2F/g,'/')}`;}
function escapeJs(value){return JSON.stringify(value,null,2);}
async function exactFile(title){
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  const params={action:'query',format:'json',formatversion:'2',origin:'*',titles:`File:${title}`,prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'1280'};
  for(const [k,v] of Object.entries(params))u.searchParams.set(k,v);
  const r=await fetch(u,{headers:{'User-Agent':'AustralianProductGuide/1.0 (curated category editorial imagery; https://australianproductguide.au/about/)','Accept':'application/json'}});
  if(!r.ok)throw new Error(`Commons metadata ${r.status} for ${title}`);
  const j=await r.json(),page=j.query&&j.query.pages&&j.query.pages[0];
  if(!page||page.missing)throw new Error(`Commons file missing: ${title}`);
  const ii=page.imageinfo&&page.imageinfo[0];if(!ii)throw new Error(`No image metadata: ${title}`);
  const m=ii.extmetadata||{},license=meta(m,'LicenseShortName'),licenseUrl=meta(m,'LicenseUrl');
  if(!licenceOK(license,licenseUrl))throw new Error(`Rejected licence ${license||'(blank)'}: ${title}`);
  if(!MIME_EXT[ii.mime])throw new Error(`Rejected mime ${ii.mime}: ${title}`);
  const width=Number(ii.width||0),height=Number(ii.height||0),short=Math.min(width,height),long=Math.max(width,height);
  if(long<1200||short<650)throw new Error(`Image too small ${width}x${height}: ${title}`);
  return {title,description:meta(m,'ImageDescription')||meta(m,'ObjectName'),creator:meta(m,'Artist')||meta(m,'Credit')||'Wikimedia Commons contributor',credit:meta(m,'Credit'),license,licenseUrl:licenseUrl||sourcePage(title),sourcePage:sourcePage(title),originalUrl:ii.url,downloadUrl:ii.thumburl||ii.url,width,height,downloadWidth:Number(ii.thumbwidth||width),downloadHeight:Number(ii.thumbheight||height),mime:ii.mime};
}
async function download(item,dest){
  const r=await fetch(item.downloadUrl,{headers:{'User-Agent':'AustralianProductGuide/1.0 (licensed editorial asset mirror; https://australianproductguide.au/about/)'}});
  if(!r.ok)throw new Error(`Image download ${r.status}: ${item.title}`);
  const buf=Buffer.from(await r.arrayBuffer());
  if(buf.length<15000)throw new Error(`Suspiciously small image ${buf.length} bytes: ${item.title}`);
  if(buf.length>3000000)throw new Error(`Hero image exceeds 3 MB budget ${buf.length} bytes: ${item.title}`);
  fs.writeFileSync(dest,buf);return buf.length;
}
function patchPages(){
  const p=path.join(ROOT,'lib','pages.js');let s=fs.readFileSync(p,'utf8');
  if(!s.includes("categoryEditorialImages=require('../data/category-editorial-images-v44')")){
    s=s.replace("const trustContent=require('./content');", "const trustContent=require('./content');\nconst categoryEditorialImages=require('../data/category-editorial-images-v44');");
  }
  if(!s.includes('function categoryHeroMedia(c)')){
    const anchor="const money=n=>n?`A$${Number(n).toLocaleString('en-AU')}`:'Check current retailer';";
    const helper=`\nfunction categoryHeroMedia(c){const image=categoryEditorialImages[c.slug];if(!image)return \`<div class="category-hero-art">\${categoryIcon(c.icon,'large')}<strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div>\`;return \`<figure class="category-hero-media"><img src="\${esc(image.src)}" alt="" width="\${image.width}" height="\${image.height}" loading="eager" fetchpriority="high" decoding="async"><div class="category-hero-media-overlay"><strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div><figcaption><span>Editorial category scene — not a reviewed product.</span> <a href="\${esc(image.sourcePage)}" target="_blank" rel="noopener noreferrer">\${esc(image.creator)}</a> · <a href="\${esc(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">\${esc(image.license)}</a></figcaption></figure>\`;}`;
    if(!s.includes(anchor))throw new Error('pages.js helper anchor not found');
    s=s.replace(anchor,anchor+helper);
  }
  const old=`<div class="category-hero-art">\${categoryIcon(c.icon,'large')}<strong>\${c.products.length} maintained products</strong><span>Evidence + comparison + finder + retailer pathways</span></div>`;
  if(s.includes(old))s=s.replace(old,'${categoryHeroMedia(c)}');
  if(!s.includes('${categoryHeroMedia(c)}'))throw new Error('category hero renderer replacement missing');
  fs.writeFileSync(p,s);
}
function patchCss(){
  const p=path.join(ROOT,'lib','premium-css.js');let s=fs.readFileSync(p,'utf8');if(s.includes('.category-hero-media{'))return;
  const marker='@media(prefers-reduced-motion:reduce)';
  const css=`.category-hero-media{position:relative;min-width:0;margin:0;border-radius:28px;overflow:hidden;background:var(--apg-navy-deep);box-shadow:var(--apg-s2);aspect-ratio:16/10;min-height:245px}.category-hero-media>img{display:block;width:100%;height:100%;position:absolute;inset:0;object-fit:cover;object-position:center}.category-hero-media:after{content:'';position:absolute;inset:30% 0 0;background:linear-gradient(180deg,transparent,rgba(8,29,46,.9));pointer-events:none}.category-hero-media-overlay{position:absolute;z-index:2;left:22px;right:22px;bottom:46px;color:#fff}.category-hero-media-overlay strong{display:block;color:#fff;font-size:20px;text-shadow:0 2px 12px rgba(0,0,0,.35)}.category-hero-media-overlay span{display:block;margin-top:4px;color:#e1efef;font-size:11px}.category-hero-media figcaption{position:absolute;z-index:3;left:0;right:0;bottom:0;min-height:34px;padding:8px 14px;background:rgba(8,29,46,.9);color:#d7e6ea;font-size:9px;line-height:1.35}.category-hero-media figcaption a{color:#fff;text-underline-offset:2px}.category-hero-media figcaption>span{color:#bcd1d7}\n@media(max-width:920px){.category-hero-media{min-height:205px;aspect-ratio:16/8.5}}\n@media(max-width:720px){.category-hero-media{min-height:190px;aspect-ratio:16/9}.category-hero-media-overlay{left:18px;right:18px;bottom:49px}.category-hero-media figcaption{font-size:8.5px}}\n@media(max-width:480px){.category-hero-media{min-height:185px;aspect-ratio:4/3}.category-hero-media-overlay{bottom:54px}}\n`;
  if(!s.includes(marker))throw new Error('premium CSS marker not found');
  s=s.replace(marker,css+marker);fs.writeFileSync(p,s);
}
async function main(){
  const all=Object.values(categories).sort((a,b)=>a.slug.localeCompare(b.slug));if(all.length!==90)throw new Error(`Expected 90 categories, found ${all.length}`);
  const bySlug=new Map(selected.categories.map(x=>[x.slug,x]));fs.rmSync(OUT_DIR,{recursive:true,force:true});fs.mkdirSync(OUT_DIR,{recursive:true});
  const registry={},review=[];let totalBytes=0;
  for(let i=0;i<all.length;i++){
    const c=all[i],saved=bySlug.get(c.slug),override=MANUAL_OVERRIDES[c.slug];let title,mode,reason;
    if(override){title=override.title;mode='MANUAL_OVERRIDE';reason=override.reason;}
    else if(MANUAL_ACCEPT_SELECTED.has(c.slug)){if(!saved?.selected)throw new Error(`Manual selected candidate missing: ${c.slug}`);title=saved.selected.title;mode='MANUAL_APPROVED';reason='Human review accepted the category-relevant selected file despite a format/brand review flag; it is editorial context only.';}
    else {if(BAD_AUTO.has(c.slug)||!saved?.selected)throw new Error(`No approved image path: ${c.slug}`);if(Number(saved.selected.score)<80)throw new Error(`Auto candidate below review threshold: ${c.slug} ${saved.selected.score}`);title=saved.selected.title;mode='AUTO_REVIEWED';reason='Automated shortlist cleared APG relevance, licence, size and semantic review gates.';}
    const item=await exactFile(title),ext=MIME_EXT[item.mime],local=`/category-editorial/${c.slug}.${ext}`,dest=path.join(OUT_DIR,`${c.slug}.${ext}`);const bytes=await download(item,dest);totalBytes+=bytes;
    registry[c.slug]={src:local,width:item.downloadWidth,height:item.downloadHeight,sourceTitle:item.title,sourcePage:item.sourcePage,creator:item.creator,license:item.license,licenseUrl:item.licenseUrl,reviewedAt:REVIEWED_AT,reviewStatus:mode,purpose:'Decorative category-level editorial context only; not evidence of a specific reviewed or recommended APG product.'};
    review.push({slug:c.slug,label:c.label,title:item.title,mode,reason,license:item.license,creator:item.creator,sourcePage:item.sourcePage,bytes});
    console.log(`${String(i+1).padStart(2,'0')}/90 ${c.slug}: ${mode} ${item.title} ${(bytes/1024).toFixed(0)} KB`);await sleep(80);
  }
  const titles=review.map(x=>x.title),dupes=[...new Set(titles.filter((x,i)=>titles.indexOf(x)!==i))];if(dupes.length)throw new Error(`Duplicate source images across categories: ${dupes.join(' | ')}`);
  if(totalBytes>60000000)throw new Error(`Editorial image bundle exceeds 60 MB: ${totalBytes}`);
  fs.writeFileSync(REGISTRY,"'use strict';\n// APG Category Editorial Imagery v44. Self-hosted assets; source/licence provenance retained.\nmodule.exports=Object.freeze("+escapeJs(registry)+");\n");
  fs.writeFileSync(path.join(ROOT,'data','category-editorial-final-review-v44.json'),JSON.stringify({version:'category-editorial-final-review-v44',reviewedAt:REVIEWED_AT,policy:{purpose:'Decorative category-level editorial context only; never product evidence or an APG endorsement.',delivery:'Self-hosted by APG from verified Wikimedia Commons files.',licensing:'CC0, public domain, CC BY or CC BY-SA only; attribution retained on-page.',selection:'Automated shortlist plus explicit human-reviewed overrides for weak, missing or semantically misleading candidates.'},summary:{categories:review.length,manualOverrides:review.filter(x=>x.mode==='MANUAL_OVERRIDE').length,manualApproved:review.filter(x=>x.mode==='MANUAL_APPROVED').length,autoReviewed:review.filter(x=>x.mode==='AUTO_REVIEWED').length,totalBytes},categories:review},null,2)+'\n');
  patchPages();patchCss();
  console.log(`Materialised ${review.length}/90 category hero assets; ${(totalBytes/1024/1024).toFixed(1)} MB total.`);
}
main().catch(e=>{console.error(e);process.exit(1);});
