// Australian Product Guide Brand Conformity v35.
// Governing presentation layer over v34.1. Closes the post-v34 Research View palette
// regression and aligns favicon/app/share metadata with the approved APG brand board.
const upstream=require('./brand-conformity-v34');
const zlib=require('zlib');

const VERSION='35';
const CSS_PATH='/assets/brand-conformity-v35.css';
const SOCIAL_PATH='/assets/apg-social-card.png';
const APPLE_PATH='/assets/apple-touch-icon.png';
const ICON192_PATH='/assets/apg-icon-192.png';
const ICON512_PATH='/assets/apg-icon-512.png';
const MANIFEST_PATH='/site.webmanifest';

const C={navy:[15,23,42,255],blue:[37,99,235,255],blueLight:[56,164,243,255],blueDeep:[49,95,216,255],blueDeep2:[30,86,200,255],teal:[6,182,212,255],green:[16,185,129,255],white:[255,255,255,255],light:[248,250,252,255],line:[226,232,240,255],slate:[100,116,139,255]};
const markPolys={
  top:[[54,81],[86,83],[105,51],[123,83],[154,83],[125,32],[83,33]],
  left:[[81,96],[48,96],[26,135],[59,137]],
  right:[[128,97],[151,137],[182,136],[159,95]],
  centre:[[104,87],[76,136],[106,126],[132,137]]
};

const css=`
/* APG Brand Conformity v35 — final search/share/browser identity reconciliation. */
:root{--apg35-blue:#2563EB;--apg35-blue-dark:#1D4ED8;--apg35-navy:#0F172A;--apg35-teal:#06B6D4;--apg35-green:#10B981;--apg35-light:#F1F5F9;--apg35-surface:#F8FAFC;--apg35-slate:#64748B;--apg35-line:#E2E8F0;--apg35-line-strong:#CBD5E1;--apg35-blue-soft:#EFF6FF;--apg35-blue-line:#BFDBFE}
body[data-brand-conformity-v35="true"]{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .search-suggestions{background:#fff!important;border-color:var(--apg35-line-strong)!important;box-shadow:0 18px 42px rgba(15,23,42,.14)!important}
body[data-brand-conformity-v35="true"] .search-suggestions [role="option"],body[data-brand-conformity-v35="true"] .search-suggestions a{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .search-suggestions [role="option"]:hover,body[data-brand-conformity-v35="true"] .search-suggestions [aria-selected="true"],body[data-brand-conformity-v35="true"] .search-suggestions a:hover{background:var(--apg35-blue-soft)!important;color:var(--apg35-blue-dark)!important}

/* Research View v43 landed after the earlier conformity pass and carried its own historical teal/mint system.
   v35 deliberately makes the approved APG palette authoritative without changing search or recommendation logic. */
body[data-brand-conformity-v35="true"] .apg-rv-v43,body[data-brand-conformity-v35="true"] .apg-rv-intro-v43{--rv-navy:#0F172A!important;--rv-teal:#2563EB!important;--rv-teal-dark:#1D4ED8!important;--rv-gold:#06B6D4!important;--rv-ink:#1E293B!important;--rv-muted:#64748B!important;--rv-line:#E2E8F0!important;--rv-soft:#F8FAFC!important;--rv-cream:#FFFFFF!important;color:#1E293B!important}
body[data-brand-conformity-v35="true"] .apg-rv-v43{background:linear-gradient(180deg,#F8FAFC 0,#FFFFFF 100%)!important;border-bottom-color:var(--apg35-line)!important}
body[data-brand-conformity-v35="true"] .apg-rv-intro-v43{background:#F8FAFC!important;border-bottom-color:var(--apg35-line)!important}
body[data-brand-conformity-v35="true"] .apg-rv-head-v43 h2,body[data-brand-conformity-v35="true"] .apg-rv-intro-v43 h2{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-kicker-v43{color:var(--apg35-blue)!important}
body[data-brand-conformity-v35="true"] .apg-rv-kicker-v43 i{background:var(--apg35-blue-soft)!important;color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-engine-v43{border-color:var(--apg35-line)!important;background:#fff!important;box-shadow:0 9px 28px rgba(15,23,42,.06)!important}
body[data-brand-conformity-v35="true"] .apg-rv-engine-v43 strong{color:var(--apg35-navy)!important}body[data-brand-conformity-v35="true"] .apg-rv-engine-v43 small{color:var(--apg35-slate)!important}
body[data-brand-conformity-v35="true"] .apg-rv-answer-v43,body[data-brand-conformity-v35="true"] .apg-rv-brief-v43{border-color:var(--apg35-line)!important;background:#fff!important;box-shadow:0 15px 42px rgba(15,23,42,.07)!important}
body[data-brand-conformity-v35="true"] .apg-rv-confidence-v43 span{background:var(--apg35-blue-soft)!important;color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-confidence-v43 a{color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-answer-copy-v43{color:#334155!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-v43{border-color:var(--apg35-line)!important;background:#fff!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-v43.is-lead{border-color:#93C5FD!important;background:linear-gradient(180deg,#EFF6FF,#FFFFFF)!important;box-shadow:inset 0 3px var(--apg35-blue)!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-top-v43 span,body[data-brand-conformity-v35="true"] .apg-rv-open-v43{color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-top-v43 b,body[data-brand-conformity-v35="true"] .apg-rv-brand-v43,body[data-brand-conformity-v35="true"] .apg-rv-price-v43.is-check{color:var(--apg35-slate)!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-v43 h3 a,body[data-brand-conformity-v35="true"] .apg-rv-price-v43{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-card-v43 ul{color:#475569!important}
body[data-brand-conformity-v35="true"] .apg-rv-verify-v43{background:#F8FAFC!important;color:#475569!important;border-left:3px solid var(--apg35-teal)!important}
body[data-brand-conformity-v35="true"] .apg-rv-compare-v43,body[data-brand-conformity-v35="true"] .apg-rv-comparison-v43{border-color:var(--apg35-blue-line)!important;background:var(--apg35-blue-soft)!important;color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-compare-v43:hover,body[data-brand-conformity-v35="true"] .apg-rv-comparison-v43:hover{background:#DBEAFE!important;border-color:#93C5FD!important}
body[data-brand-conformity-v35="true"] .apg-rv-compare-v43:focus-visible{outline-color:rgba(37,99,235,.28)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43,body[data-brand-conformity-v35="true"] .apg-rv-change-v43,body[data-brand-conformity-v35="true"] .apg-rv-sources-v43{border-color:var(--apg35-line)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43>div:first-child strong,body[data-brand-conformity-v35="true"] .apg-rv-change-v43 strong,body[data-brand-conformity-v35="true"] .apg-rv-sources-v43 summary{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43>div:first-child span,body[data-brand-conformity-v35="true"] .apg-rv-side-label-v43,body[data-brand-conformity-v35="true"] .apg-rv-sources-v43 li small,body[data-brand-conformity-v35="true"] .apg-rv-sources-v43>p{color:var(--apg35-slate)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-chips-v43 a,body[data-brand-conformity-v35="true"] .apg-rv-follow-chips-v43 button{border-color:var(--apg35-line-strong)!important;background:#fff!important;color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-chips-v43 a:hover,body[data-brand-conformity-v35="true"] .apg-rv-follow-chips-v43 button:hover{border-color:#93C5FD!important;background:var(--apg35-blue-soft)!important;color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43 form{border-color:var(--apg35-line-strong)!important;background:#fff!important;box-shadow:0 5px 18px rgba(15,23,42,.05)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43 input{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-follow-v43 button[type=submit]{background:var(--apg35-blue)!important;color:#fff!important}
body[data-brand-conformity-v35="true"] .apg-rv-signals-v43 span{background:var(--apg35-light)!important;color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-change-v43 ul{color:#475569!important}
body[data-brand-conformity-v35="true"] .apg-rv-sources-v43 li{border-color:var(--apg35-line)!important}
body[data-brand-conformity-v35="true"] .apg-rv-source-num-v43{background:var(--apg35-blue-soft)!important;color:var(--apg35-blue)!important}
body[data-brand-conformity-v35="true"] .apg-rv-sources-v43 li strong{color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-sources-v43 a{color:var(--apg35-blue-dark)!important}
body[data-brand-conformity-v35="true"] .apg-rv-all-v43{background:var(--apg35-light)!important;color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .apg-rv-intro-v43 p{color:#475569!important}
body[data-brand-conformity-v35="true"] .apg-rv-example-grid-v43 a{border-color:var(--apg35-line)!important;background:#fff!important;color:var(--apg35-navy)!important;box-shadow:0 6px 20px rgba(15,23,42,.04)!important}
body[data-brand-conformity-v35="true"] .apg-rv-example-grid-v43 a:hover{border-color:#93C5FD!important;background:var(--apg35-blue-soft)!important}

/* Normal search results, states and controls */
body[data-brand-conformity-v35="true"] .search-interpretation{border-color:var(--apg35-line)!important;background:#F8FAFC!important;color:#475569!important}
body[data-brand-conformity-v35="true"] .search-interpretation .pill.good{background:var(--apg35-blue-soft)!important;color:var(--apg35-navy)!important;border-color:var(--apg35-blue-line)!important;box-shadow:inset 3px 0 0 var(--apg35-green)!important}
body[data-brand-conformity-v35="true"] .search-groups .section-head .kicker{color:var(--apg35-blue)!important}
body[data-brand-conformity-v35="true"] .freshness>span:first-child{color:var(--apg35-green)!important}
body[data-brand-conformity-v35="true"] .suggested-queries a,body[data-brand-conformity-v35="true"] .v6-search-prompts a{border-color:var(--apg35-line-strong)!important;background:#fff!important;color:var(--apg35-navy)!important}
body[data-brand-conformity-v35="true"] .suggested-queries a:hover,body[data-brand-conformity-v35="true"] .v6-search-prompts a:hover{background:var(--apg35-blue-soft)!important;border-color:#93C5FD!important;color:var(--apg35-blue-dark)!important}

/* Keep Green as semantic verification/success only, never as the decorative search palette. */
body[data-brand-conformity-v35="true"] .evidence-deep,body[data-brand-conformity-v35="true"] .pill.good,body[data-brand-conformity-v35="true"] .decision-match.strong,body[data-brand-conformity-v35="true"] .decision-match.good{box-shadow:inset 3px 0 0 var(--apg35-green)!important}
`;

function crcTable(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;}const CRC=crcTable();
function crc32(buf){let c=0xFFFFFFFF;for(const b of buf)c=CRC[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function pngChunk(type,data){const t=Buffer.from(type);const len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function makeCanvas(w,h,bg){const p=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){p[i*4]=bg[0];p[i*4+1]=bg[1];p[i*4+2]=bg[2];p[i*4+3]=bg[3];}return {w,h,p};}
function setPixel(c,x,y,col){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=c.w||y>=c.h)return;const i=(y*c.w+x)*4;c.p[i]=col[0];c.p[i+1]=col[1];c.p[i+2]=col[2];c.p[i+3]=col[3];}
function fillRect(c,x0,y0,x1,y1,col){x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(c.w,Math.ceil(x1));y1=Math.min(c.h,Math.ceil(y1));for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)setPixel(c,x,y,col);}
function fillCircle(c,cx,cy,r,col){const rr=r*r;for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(c.h,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(c.w,Math.ceil(cx+r));x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=rr)setPixel(c,x,y,col);}}
function fillRounded(c,x0,y0,x1,y1,r,col){fillRect(c,x0+r,y0,x1-r,y1,col);fillRect(c,x0,y0+r,x1,y1-r,col);fillCircle(c,x0+r,y0+r,r,col);fillCircle(c,x1-r,y0+r,r,col);fillCircle(c,x0+r,y1-r,r,col);fillCircle(c,x1-r,y1-r,r,col);}
function pointInPoly(x,y,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];const hit=((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi||1e-9)+xi);if(hit)inside=!inside;}return inside;}
function fillPoly(c,poly,col){const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);const minX=Math.floor(Math.min(...xs)),maxX=Math.ceil(Math.max(...xs)),minY=Math.floor(Math.min(...ys)),maxY=Math.ceil(Math.max(...ys));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(pointInPoly(x+.5,y+.5,poly))setPixel(c,x,y,col);}
function mapPoly(points,x,y,w,h){return points.map(([px,py])=>[x+(px-20)/170*w,y+(py-25)/120*h]);}
function drawMark(c,x,y,w,h,{white=false}={}){const parts=white?[[markPolys.top,C.white],[markPolys.left,C.white],[markPolys.right,C.white],[markPolys.centre,C.white]]:[[markPolys.top,C.blueLight],[markPolys.left,C.blueDeep],[markPolys.right,C.blueDeep2],[markPolys.centre,C.white]];for(const [p,col] of parts)fillPoly(c,mapPoly(p,x,y,w,h),col);}
function encodePng(c){const raw=Buffer.alloc((c.w*4+1)*c.h);for(let y=0;y<c.h;y++){const o=y*(c.w*4+1);raw[o]=0;c.p.copy(raw,o+1,y*c.w*4,(y+1)*c.w*4);}const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(c.w,0);ihdr.writeUInt32BE(c.h,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),pngChunk('IDAT',zlib.deflateSync(raw,{level:7})),pngChunk('IEND',Buffer.alloc(0))]);}
const pngCache=new Map();
function makeSocialPng(){if(pngCache.has('social'))return pngCache.get('social');const c=makeCanvas(1200,630,C.light);fillRounded(c,42,42,1158,588,40,C.navy);fillCircle(c,1060,85,190,[23,37,84,255]);fillCircle(c,1135,530,170,[13,65,90,255]);drawMark(c,170,145,520,366);fillRounded(c,710,215,1060,235,10,C.blue);fillRounded(c,710,255,950,275,10,C.blueLight);fillRounded(c,710,295,870,315,10,C.white);fillRounded(c,710,455,1010,465,5,C.blue);fillRounded(c,1010,455,1080,465,5,C.teal);fillRounded(c,1080,455,1130,465,5,C.green);const out=encodePng(c);pngCache.set('social',out);return out;}
function makeIconPng(size){const key='i'+size;if(pngCache.has(key))return pngCache.get(key);const c=makeCanvas(size,size,C.blue);drawMark(c,size*.13,size*.2,size*.74,size*.56,{white:true});const out=encodePng(c);pngCache.set(key,out);return out;}

const manifest=JSON.stringify({name:'Australian Product Guide',short_name:'APG',description:'Independent Australian product discovery, comparison and decision guidance.',start_url:'/',scope:'/',display:'standalone',background_color:'#F8FAFC',theme_color:'#0F172A',icons:[{src:ICON192_PATH,sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:ICON512_PATH,sizes:'512x512',type:'image/png',purpose:'any maskable'}]},null,2);

function scoutCharacter(){return typeof upstream.scoutCharacterMarkup==='function'?upstream.scoutCharacterMarkup():'';}
function serverScout(html){const ch=scoutCharacter();if(!ch)return html;let out=String(html||'');out=out.replace(/<span class="apg-assistant-launcher-icon"[^>]*>[\s\S]*?(?=<span class="apg-assistant-launcher-copy")/,`<span class="apg-assistant-launcher-icon" aria-hidden="true">${ch}</span>`);out=out.replace(/<span class="apg-assistant-avatar"[^>]*>[\s\S]*?(?=<span><strong>Scout<\/strong>)/,`<span class="apg-assistant-avatar" aria-hidden="true">${ch}</span>`);return out;}
function ensureHead(out){
  const social=`https://australianproductguide.au${SOCIAL_PATH}?v=${VERSION}`;
  out=out.replace(/<link rel="icon"[^>]*>/i,`<link rel="icon" href="/assets/favicon.svg?v=${VERSION}" type="image/svg+xml">`);
  out=out.replace(/<meta property="og:image" content="[^"]*">/i,`<meta property="og:image" content="${social}">`);
  out=out.replace(/<meta property="og:image:type"[^>]*>/gi,'').replace(/<meta property="og:image:width"[^>]*>/gi,'').replace(/<meta property="og:image:height"[^>]*>/gi,'').replace(/<meta property="og:image:secure_url"[^>]*>/gi,'');
  out=out.replace(/<meta name="twitter:image"[^>]*>/gi,'').replace(/<meta name="twitter:image:alt"[^>]*>/gi,'');
  const extras=`<meta property="og:image:secure_url" content="${social}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image" content="${social}"><meta name="twitter:image:alt" content="Australian Product Guide"><link rel="apple-touch-icon" sizes="180x180" href="${APPLE_PATH}?v=${VERSION}"><link rel="manifest" href="${MANIFEST_PATH}?v=${VERSION}"><meta name="application-name" content="Australian Product Guide"><meta name="apple-mobile-web-app-title" content="APG">`;
  return out.replace('</head>',extras+`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
}
function inject(html){let out=String(html||'');if(out.includes('data-brand-conformity-v35="true"'))return out;out=serverScout(out);out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-conformity-v35="true"$1>');out=ensureHead(out);return out;}
function send(res,req,body,type,cache='public, max-age=86400, stale-while-revalidate=604800'){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control',cache);res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);}
function transform(html,pathOrUrl){let out=upstream.transform?upstream.transform(String(html||''),pathOrUrl):String(html||'');return inject(out);}
function handler(req,res){let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path===SOCIAL_PATH)return send(res,req,makeSocialPng(),'image/png');
  if(path===APPLE_PATH)return send(res,req,makeIconPng(180),'image/png');
  if(path===ICON192_PATH)return send(res,req,makeIconPng(192),'image/png');
  if(path===ICON512_PATH)return send(res,req,makeIconPng(512),'image/png');
  if(path===MANIFEST_PATH)return send(res,req,manifest,'application/manifest+json; charset=utf-8');
  const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);return end(body,...args);};return upstream(req,res);
}
Object.assign(handler,upstream,{VERSION,CSS_PATH,SOCIAL_PATH,APPLE_PATH,ICON192_PATH,ICON512_PATH,MANIFEST_PATH,css,manifest,inject,transform,makeSocialPng,makeIconPng,serverScout});
module.exports=handler;
