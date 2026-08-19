// Australian Product Guide Brand Conformity v35.1.
// Final edge-surface closure over v35: applies the full approved brand pipeline to
// noindex/dynamic/error HTML, adds a conventional favicon.ico fallback and explicitly
// governs My APG/account surfaces. Product, decision, affiliate, auth and privacy logic
// remain unchanged.
const upstream=require('./brand-conformity-v35');

const VERSION='35.1';
const CSS_PATH='/assets/brand-conformity-v351.css';
const UX_CSS_PATH='/assets/ux-remediation-v36.css';
const UX_VERSION='36';
const ICO_PATH='/favicon.ico';

const css=`
/* APG Brand Conformity v35.1 — dynamic/noindex/error surface closure. */
:root{--apg351-blue:#2563EB;--apg351-blue-dark:#1D4ED8;--apg351-navy:#0F172A;--apg351-teal:#06B6D4;--apg351-green:#10B981;--apg351-light:#F1F5F9;--apg351-surface:#F8FAFC;--apg351-slate:#64748B;--apg351-line:#E2E8F0;--apg351-line-strong:#CBD5E1;--apg351-blue-soft:#EFF6FF;--apg351-blue-line:#BFDBFE}
body[data-brand-conformity-v351="true"]{color:var(--apg351-navy)!important}

/* My APG / account: retire the historical dark-teal/amber account skin in favour of the master system. */
body[data-brand-conformity-v351="true"] .v5-account-status,
body[data-brand-conformity-v351="true"] .apg-account-shell,
body[data-brand-conformity-v351="true"] .workspace-panel,
body[data-brand-conformity-v351="true"] .future-panel{background:#FFFFFF!important;border-color:var(--apg351-line)!important;color:var(--apg351-navy)!important;box-shadow:0 10px 30px rgba(15,23,42,.06)!important}
body[data-brand-conformity-v351="true"] .v5-account-status strong,
body[data-brand-conformity-v351="true"] .workspace-panel h2,
body[data-brand-conformity-v351="true"] .future-panel h2{color:var(--apg351-navy)!important}
body[data-brand-conformity-v351="true"] .v5-account-status p,
body[data-brand-conformity-v351="true"] .workspace-panel p,
body[data-brand-conformity-v351="true"] .future-panel p{color:#475569!important}
body[data-brand-conformity-v351="true"] .v5-account-badge,
body[data-brand-conformity-v351="true"] .apg-account-status-badge{background:var(--apg351-blue-soft)!important;border:1px solid var(--apg351-blue-line)!important;color:var(--apg351-blue-dark)!important}
body[data-brand-conformity-v351="true"] .apg-account-head{background:linear-gradient(135deg,var(--apg351-navy),#172554)!important;color:#FFFFFF!important}
body[data-brand-conformity-v351="true"] .apg-account-head h2,
body[data-brand-conformity-v351="true"] .apg-account-head strong{color:#FFFFFF!important}
body[data-brand-conformity-v351="true"] .apg-account-head p{color:#CBD5E1!important}
body[data-brand-conformity-v351="true"] .apg-account-head .kicker{color:#93C5FD!important}
body[data-brand-conformity-v351="true"] .apg-account-tabs button{border-color:var(--apg351-line-strong)!important;background:#FFFFFF!important;color:var(--apg351-navy)!important}
body[data-brand-conformity-v351="true"] .apg-account-tabs button[aria-selected="true"],
body[data-brand-conformity-v351="true"] .apg-account-tabs button.is-active{background:var(--apg351-blue)!important;border-color:var(--apg351-blue)!important;color:#FFFFFF!important}
body[data-brand-conformity-v351="true"] .workspace-controls{border-color:var(--apg351-line)!important}
body[data-brand-conformity-v351="true"] .apg-account-link{background:#FFFFFF!important;color:var(--apg351-blue-dark)!important;border-color:var(--apg351-blue-line)!important;outline-color:rgba(37,99,235,.35)!important}
body[data-brand-conformity-v351="true"] .apg-account-link:hover,
body[data-brand-conformity-v351="true"] .apg-account-link:focus-visible{background:var(--apg351-blue-soft)!important;color:var(--apg351-blue-dark)!important;border-color:#93C5FD!important}

/* Error/zero-state surfaces use the same master treatment once the full transform pipeline is applied. */
body[data-brand-conformity-v351="true"] .zero-state{background:#FFFFFF!important;border-color:var(--apg351-line)!important;color:var(--apg351-navy)!important}
body[data-brand-conformity-v351="true"] .zero-art{color:var(--apg351-blue)!important}
body[data-brand-conformity-v351="true"] .zero-art .category-icon{background:var(--apg351-blue-soft)!important;border-color:var(--apg351-blue-line)!important;color:var(--apg351-blue)!important}
`;

function makeIco(){
  const png=upstream.makeIconPng(32);
  const header=Buffer.alloc(6);header.writeUInt16LE(0,0);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);
  const entry=Buffer.alloc(16);entry[0]=32;entry[1]=32;entry[2]=0;entry[3]=0;entry.writeUInt16LE(1,4);entry.writeUInt16LE(32,6);entry.writeUInt32LE(png.length,8);entry.writeUInt32LE(22,12);
  return Buffer.concat([header,entry,png]);
}

function ensureHead(out){
  const social=`https://australianproductguide.au${upstream.SOCIAL_PATH}?v=${VERSION}`;
  out=String(out||'')
    .replace(/<meta name="theme-color" content="[^"]*">/i,'<meta name="theme-color" content="#0F172A">')
    .replace(/\/assets\/favicon\.svg\?v=35(?:\.1)?/g,`/assets/favicon.svg?v=${VERSION}`)
    .replace(/\/assets\/apg-social-card\.png\?v=35(?:\.1)?/g,`${upstream.SOCIAL_PATH}?v=${VERSION}`)
    .replace(/\/assets\/apple-touch-icon\.png\?v=35(?:\.1)?/g,`${upstream.APPLE_PATH}?v=${VERSION}`)
    .replace(/\/site\.webmanifest\?v=35(?:\.1)?/g,`${upstream.MANIFEST_PATH}?v=${VERSION}`);
  out=out.replace(/<link rel="alternate icon"[^>]*>/gi,'');
  if(!out.includes(`href="${ICO_PATH}?v=${VERSION}"`))out=out.replace('</head>',`<link rel="alternate icon" href="${ICO_PATH}?v=${VERSION}" type="image/x-icon"></head>`);
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(UX_CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${UX_CSS_PATH}?v=${UX_VERSION}"></head>`);
  // Ensure image metadata exists even on legacy error shells before the v35 transform had a chance to add it.
  if(!/property="og:image" content=/i.test(out))out=out.replace('</head>',`<meta property="og:image" content="${social}"></head>`);
  out=out.replace(/<meta property="og:image" content="[^"]*">/i,`<meta property="og:image" content="${social}">`);
  if(!/property="og:image:secure_url"/i.test(out))out=out.replace('</head>',`<meta property="og:image:secure_url" content="${social}"></head>`);
  if(!/property="og:image:type"/i.test(out))out=out.replace('</head>','<meta property="og:image:type" content="image/png"></head>');
  if(!/property="og:image:width"/i.test(out))out=out.replace('</head>','<meta property="og:image:width" content="1200"></head>');
  if(!/property="og:image:height"/i.test(out))out=out.replace('</head>','<meta property="og:image:height" content="630"></head>');
  if(!/name="twitter:image"/i.test(out))out=out.replace('</head>',`<meta name="twitter:image" content="${social}"><meta name="twitter:image:alt" content="Australian Product Guide"></head>`);
  if(!/rel="apple-touch-icon"/i.test(out))out=out.replace('</head>',`<link rel="apple-touch-icon" sizes="180x180" href="${upstream.APPLE_PATH}?v=${VERSION}"></head>`);
  if(!/rel="manifest"/i.test(out))out=out.replace('</head>',`<link rel="manifest" href="${upstream.MANIFEST_PATH}?v=${VERSION}"></head>`);
  return out;
}
function inject(html){let out=String(html||'');if(out.includes('data-brand-conformity-v351="true"'))return out;out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-conformity-v351="true"$1>');return ensureHead(out);}
function transform(html,pathOrUrl){let out=upstream.transform?upstream.transform(String(html||''),pathOrUrl):String(html||'');return inject(out);}
function send(res,req,body,type,cache='public, max-age=86400, stale-while-revalidate=604800'){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control',cache);res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':body);}
function handler(req,res){let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path===ICO_PATH)return send(res,req,makeIco(),'image/x-icon');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&typeof body==='string'&&type.startsWith('text/html')&&res.statusCode>=200&&res.statusCode<500){
      // Successful HTML has already travelled through v35. Non-200 HTML historically bypassed
      // presentation wrappers, so run the complete transform chain while preserving status.
      body=res.statusCode===200?inject(body):transform(body,path);
    }
    return end(body,...args);
  };
  return upstream(req,res);
}
Object.assign(handler,upstream,{VERSION,CSS_PATH,UX_CSS_PATH,UX_VERSION,ICO_PATH,css,inject,transform,makeIco});
module.exports=handler;
