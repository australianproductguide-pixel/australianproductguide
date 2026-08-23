'use strict';

// APG Trust Centre Authoritative Runtime v82.
// Trust Centre body copy is authoritative in lib/content.js. This outer compatibility
// boundary does not rewrite policy substance; it only neutralises legacy technical
// account-status chrome that is injected by an older shared runtime after page render.
// The protected outer API VERSION remains Search v52; Trust Centre has its own version.
const downstream=require('./consumer-surface-reconciliation-v81');

const TRUST_CENTRE_VERSION='82.0';
const SEARCH_API_VERSION='52.0';
const PRIMARY_ORIGIN='https://australianproductguide.au';
const TRUST_PATHS=new Set([
  '/about/','/contact/','/methodology/','/editorial-standards/','/sources/',
  '/corrections-policy/','/affiliate-disclosure/','/privacy/','/terms/',
  '/coverage/','/updates/'
]);

function pathOf(raw){
  try{return new URL(raw||'/',PRIMARY_ORIGIN).pathname}
  catch{return '/'}
}

function neutraliseLegacyTrustChrome(html,path){
  if(!TRUST_PATHS.has(path))return html;
  let out=String(html||'');
  out=out.replace('Stay local-first when signed out, or sign in to sync selected saved research through APG’s Sydney-hosted Supabase project. Product recommendations and retailer ranking do not change based on account status.','Stay local-first when signed out, or sign in to sync selected saved research across devices. Product recommendations and retailer ranking do not change based on account status.');
  out=out.replace('RLS protected · deletion available','Optional sync · deletion available');
  return out;
}

module.exports=(req,res)=>{
  const path=pathOf(req.url);
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      body=neutraliseLegacyTrustChrome(body,path);
    }
    res.setHeader('X-APG-Trust-Centre',`v${TRUST_CENTRE_VERSION}`);
    return originalEnd(body,...args);
  };
  return downstream(req,res);
};

// Do not replace the protected Search v52 public contract with the Trust Centre
// presentation version. Existing P0 source QA depends on this invariant.
module.exports.VERSION=SEARCH_API_VERSION;
module.exports.TRUST_CENTRE_VERSION=TRUST_CENTRE_VERSION;
module.exports.TRUST_PATHS=TRUST_PATHS;
module.exports.neutraliseLegacyTrustChrome=neutraliseLegacyTrustChrome;
