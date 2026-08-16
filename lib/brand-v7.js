const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// APG v7: a guided-choice symbol. Two candidate paths converge through a decision
// aperture into one confident forward route. It is deliberately not a cart, tag,
// magnifier, map or Australian cliché, and remains legible at favicon scale.
const markInner=`<path d="M13 18.5C22.5 18.5 27.7 22.2 31.8 28.4" fill="none" stroke="currentColor" stroke-width="5.6" stroke-linecap="round"/><path d="M13 45.5C22.5 45.5 27.7 41.8 31.8 35.6" fill="none" stroke="currentColor" stroke-width="5.6" stroke-linecap="round"/><path d="M35 32h16" fill="none" stroke="currentColor" stroke-width="5.6" stroke-linecap="round"/><circle cx="33" cy="32" r="5.8" fill="#f4b45f" stroke="#fff" stroke-width="2.4"/><path d="m47 25 7 7-7 7" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>`;
function markSvg({dark=false,label=false}={}){const ink=dark?'#f6fbfa':'#0b3044';return `<svg viewBox="0 0 64 64" role="img"${label?' aria-label="Australian Product Guide"':' aria-hidden="true"'}><rect x="4" y="4" width="56" height="56" rx="17" fill="${dark?'#0b3044':'#eef8f5'}"/><g style="color:${ink}">${markInner}</g></svg>`;}
function lockup({dark=false,compact=false}={}){return `<span class="v7-logo-lockup${dark?' is-dark':''}${compact?' is-compact':''}"><span class="v7-logo-mark">${markSvg({dark,label:false})}</span>${compact?'':`<span class="v7-logo-type"><strong>Australian Product Guide</strong><small>Compare smarter. Choose with confidence.</small></span>`}</span>`;}
const logoSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><rect x="4" y="4" width="56" height="56" rx="17" fill="#eef8f5"/><g style="color:#0b3044">${markInner}</g></svg>`;
const logoDarkSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title"><title id="title">Australian Product Guide</title><rect x="4" y="4" width="56" height="56" rx="17" fill="#0b3044"/><g style="color:#f6fbfa">${markInner}</g></svg>`;
const socialSvg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t d"><title id="t">Australian Product Guide</title><desc id="d">Compare smarter. Choose with confidence.</desc><defs><linearGradient id="bg" x1="70" y1="50" x2="1130" y2="590" gradientUnits="userSpaceOnUse"><stop stop-color="#092b3d"/><stop offset=".62" stop-color="#0b5f63"/><stop offset="1" stop-color="#08786f"/></linearGradient><radialGradient id="glow"><stop stop-color="#f4b45f" stop-opacity=".28"/><stop offset="1" stop-color="#f4b45f" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="630" fill="#f7faf9"/><rect x="42" y="42" width="1116" height="546" rx="48" fill="url(#bg)"/><circle cx="1010" cy="140" r="220" fill="url(#glow)"/><g transform="translate(94 86) scale(1.72)"><rect x="4" y="4" width="56" height="56" rx="17" fill="#eef8f5"/><g style="color:#0b3044">${markInner}</g></g><text x="96" y="300" font-family="Inter,Arial,sans-serif" font-size="68" font-weight="740" letter-spacing="-2.4" fill="#fff">Australian Product Guide</text><text x="96" y="380" font-family="Inter,Arial,sans-serif" font-size="40" font-weight="650" fill="#dff3ed">Compare smarter. Choose with confidence.</text><text x="96" y="455" font-family="Inter,Arial,sans-serif" font-size="25" fill="#c8e3df">Search naturally · understand trade-offs · verify evidence · find where to buy</text><g transform="translate(96 504)"><rect width="180" height="42" rx="21" fill="#fff" fill-opacity=".1"/><text x="24" y="28" font-family="Inter,Arial,sans-serif" font-size="18" fill="#fff">Australian focus</text><rect x="194" width="170" height="42" rx="21" fill="#fff" fill-opacity=".1"/><text x="218" y="28" font-family="Inter,Arial,sans-serif" font-size="18" fill="#fff">Evidence-led</text><rect x="378" width="220" height="42" rx="21" fill="#fff" fill-opacity=".1"/><text x="402" y="28" font-family="Inter,Arial,sans-serif" font-size="18" fill="#fff">Commercially neutral</text></g></svg>`;

const categoryMeta={
'coffee-machines':['coffee','Coffee machines','Kitchen'], 'air-fryers':['fryer','Air fryers','Kitchen'], 'robot-vacuums':['robot','Robot vacuums','Home care'], 'wireless-headphones':['headphones','Wireless headphones','Audio'],
'home-security-cameras':['camera','Home security cameras','Smart home'], 'stick-vacuums':['stickvac','Stick vacuums','Home care'], 'mesh-wifi-systems':['wifi','Mesh Wi-Fi systems','Connected home'], 'earbuds':['earbuds','Earbuds','Audio'],
'dash-cameras':['dashcam','Dash cameras','Travel'], 'luggage':['luggage','Luggage','Travel'], 'portable-power-stations':['powerstation','Portable power stations','Power'], 'computer-monitors':['monitor','Computer monitors','Work'],
'office-chairs':['chair','Office chairs','Work'], 'automatic-pet-feeders':['petfeeder','Automatic pet feeders','Pets'], 'standing-desks':['desk','Standing desks','Work'], 'mechanical-keyboards':['keyboard','Mechanical keyboards','Computing'],
'home-fitness-equipment':['fitness','Home fitness equipment','Fitness'], 'computer-mice':['mouse','Computer mice','Computing'], 'dehumidifiers':['dehumidifier','Dehumidifiers','Home climate'], 'air-purifiers':['purifier','Air purifiers','Home climate'],
'cordless-drills':['drill','Cordless drills','Tools'], 'pressure-washers':['washer','Pressure washers','Outdoor'], 'smart-doorbells':['doorbell','Smart doorbells','Smart home'], 'baby-monitors':['babymonitor','Baby monitors','Baby'],
'smartwatches':['watch','Smartwatches','Wearables'], 'fitness-trackers':['tracker','Fitness trackers','Wearables'], 'bluetooth-speakers':['speaker','Bluetooth speakers','Audio'], 'soundbars':['soundbar','Soundbars','Home entertainment'],
'projectors':['projector','Projectors','Home entertainment'], 'gaming-monitors':['gamingmonitor','Gaming monitors','Gaming'], 'gaming-headsets':['gamingheadset','Gaming headsets','Gaming'], 'webcams':['webcam','Webcams','Work'],
'microphones':['microphone','Microphones','Creator'], 'external-ssds':['ssd','External SSDs','Storage'], 'power-banks':['powerbank','Power banks','Power'], 'portable-monitors':['portablemonitor','Portable monitors','Work'],
'tablets':['tablet','Tablets','Computing'], 'e-readers':['ereader','E-readers','Reading'], 'electric-toothbrushes':['toothbrush','Electric toothbrushes','Personal care'], 'hair-dryers':['hairdryer','Hair dryers','Personal care'],
'electric-shavers':['shaver','Electric shavers','Personal care'], 'kitchen-mixers':['mixer','Kitchen mixers','Kitchen'], 'blenders':['blender','Blenders','Kitchen'], 'rice-cookers':['ricecooker','Rice cookers','Kitchen'],
'multicookers':['multicooker','Multicookers','Kitchen'], 'vacuum-sealers':['sealer','Vacuum sealers','Kitchen'], 'water-filters':['waterfilter','Water filters','Kitchen'], 'portable-air-conditioners':['aircon','Portable air conditioners','Home climate']
};

const glyphs={
coffee:'M20 20h25v19a10 10 0 0 1-10 10h-5a10 10 0 0 1-10-10V20Zm25 5h4a7 7 0 0 1 0 14h-4M27 11v6m10-6v6',
fryer:'M19 16h28l-3 34H22l-3-34Zm5 9h18M27 38h10M24 10h18',
robot:'M32 13a20 20 0 1 1 0 40 20 20 0 0 1 0-40Zm-11 18h22M27 22h10',
headphones:'M14 36a18 18 0 0 1 36 0v13h-9V35m-18 0v14h-9V36',
camera:'M17 22h30a5 5 0 0 1 5 5v21H12V27a5 5 0 0 1 5-5Zm7-6h16l4 6M32 31a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z',
stickvac:'M37 10 27 44m3-1 13 4-3 8-17-6 3-7m11-25 8 3',
wifi:'M12 27a29 29 0 0 1 40 0M19 36a19 19 0 0 1 26 0M26 45a9 9 0 0 1 12 0M32 53h.1',
earbuds:'M22 15c8 0 10 7 7 13l-4 19h-7l2-14c-7-2-8-18 2-18Zm20 0c-8 0-10 7-7 13l4 19h7l-2-14c7-2 8-18-2-18Z',
dashcam:'M14 22h34v25H14V22Zm8-6h18l4 6M25 31h14M32 28v12',
luggage:'M20 19h24v34H20V19Zm7 0v-6h10v6M26 28v16m12-16v16M25 57h.1m14 0h.1',
powerstation:'M14 19h36v32H14V19Zm8 10h10v11H22V29Zm16 2h5m-5 7h5M25 13v6m14-6v6',
monitor:'M10 14h44v30H10V14Zm16 38h12m-6-8v8',
chair:'M22 14h20v22H22V14Zm-5 25h30M21 39l-4 14m26-14 4 14M32 39v14',
petfeeder:'M18 23h28l-4 18H22l-4-18Zm8-9h12l4 9H22l4-9Zm-7 34h26',
desk:'M12 27h40M17 27v26m30-26v26M25 18h14v9',
keyboard:'M10 20h44v26H10V20Zm7 8h4m5 0h4m5 0h4m5 0h4M17 36h4m5 0h4m5 0h12',
fitness:'M12 29h8m24 0h8M20 23v12m24-12v12M25 18v22m14-22v22M25 29h14',
mouse:'M22 12h20a10 10 0 0 1 10 10v20a20 20 0 0 1-40 0V22a10 10 0 0 1 10-10Zm10 0v15m-5 0h10',
dehumidifier:'M20 12h24v40H20V12Zm6 8h12M27 32c0 5 5 8 5 8s5-3 5-8c0-3-5-8-5-8s-5 5-5 8Z',
purifier:'M20 12h24v40H20V12Zm6 11h12m-12 8h12m-12 8h12',
drill:'M13 22h28v16H23l-5-5h-5V22Zm28 4h9v8h-9M26 38v14h10l3-14',
washer:'M14 25h20l7 8-7 8H14V25Zm27 8h11M25 21l3-8m6 10 7-6',
doorbell:'M23 11h18v42H23V11Zm9 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 20h.1',
babymonitor:'M13 17h38v27H13V17Zm14 34h10m-5-7v7M25 29c3-6 11-6 14 0',
watch:'M24 18h16v28H24V18Zm4-8h8l2 8H26l2-8Zm-2 36h12l-2 8h-8l-2-8',
tracker:'M25 14h14l4 11-4 25H25l-4-25 4-11Zm7 10v8l5 3',
speaker:'M20 12h24v40H20V12Zm12 8a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 15a8 8 0 1 1 0 16',
soundbar:'M10 28h44v13H10V28Zm8 6h.1m7 0h.1m7 0h.1m7 0h.1',
projector:'M12 21h40v25H12V21Zm11 8h10v9H23v-9Zm19 4a4 4 0 1 1 0 8',
gamingmonitor:'M10 14h44v30H10V14Zm9 14h12m-6-6v12m15-7h.1m5 5h.1M26 52h12m-6-8v8',
gamingheadset:'M14 34a18 18 0 0 1 36 0v12h-8V33m-20 0v13h-8V34m28 9 7 5',
webcam:'M17 19h30a5 5 0 0 1 5 5v18H12V24a5 5 0 0 1 5-5Zm15 7a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm-8 24h16',
microphone:'M25 12h14v24a7 7 0 0 1-14 0V12Zm-7 20v5a14 14 0 0 0 28 0v-5M32 51v7m-8 0h16',
ssd:'M15 21h34v25H15V21Zm8 8h18M23 37h10m10 0h.1',
powerbank:'M17 17h30v35H17V17Zm10-5h10v5m-7 10h4v8h6l-10 12v-9h-6l6-11Z',
portablemonitor:'M12 17h40v27H12V17Zm8 34h24M27 44l-4 7m14-7 4 7',
tablet:'M18 9h28v46H18V9Zm10 6h8M31 49h2',
ereader:'M18 9h28v46H18V9Zm7 10h14M25 27h14M25 35h10',
toothbrush:'M28 8h8v14h-8V8Zm-2 14h12l-2 34h-8l-2-34Zm3-9h6',
hairdryer:'M13 21h27l10 8v8l-10 7H26l-5 11h-8l7-16h-7V21Zm27 8v8',
shaver:'M22 10h20l-2 13H24l-2-13Zm4 13h12l4 31H22l4-31Zm2 9h8',
mixer:'M17 14h26v10H27l-4 10h24v7a13 13 0 0 1-26 0v-7h-4V14Zm16 10v10',
blender:'M24 11h16l-2 28H26l-2-28Zm2 28h12l4 12H22l4-12Zm3-20h6',
ricecooker:'M16 24h32v25H16V24Zm7-8h18l4 8H19l4-8Zm3 18h12',
multicooker:'M15 21h34v30H15V21Zm7-8h20l4 8H18l4-8Zm4 18h12m-6 0v9',
sealer:'M12 21h40v25H12V21Zm7 8h26M22 37h20',
waterfilter:'M21 12h22v39H21V12Zm7 9h8M26 33c0 5 6 9 6 9s6-4 6-9c0-4-6-10-6-10s-6 6-6 10Z',
aircon:'M17 11h30v42H17V11Zm6 11h18M24 32c6-4 10-4 16 0m-16 8c6-4 10-4 16 0'
};
function categoryGlyph(slug){const [key,label,family]=categoryMeta[slug]||['guide',slug,'Products'];const d=glyphs[key]||'M13 32h38M32 13v38';return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;}
function categoryScene(slug,{compact=false}={}){const [,label,family]=categoryMeta[slug]||['guide',slug,'Products'];return `<div class="v7-category-scene${compact?' compact':''}" data-v7-category="${esc(slug)}"><span class="v7-scene-glow" aria-hidden="true"></span><span class="v7-scene-icon">${categoryGlyph(slug)}</span><span class="v7-scene-copy"><small>${esc(family)}</small><strong>${esc(label)}</strong></span></div>`;}
module.exports={markSvg,lockup,logoSvg,logoDarkSvg,socialSvg,categoryMeta,categoryGlyph,categoryScene};
