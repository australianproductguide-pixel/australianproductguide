'use strict';

// APG Trust Centre Authoritative Runtime v82.
// Trust Centre body copy is authoritative in lib/content.js. This outer compatibility
// boundary does not rewrite policy substance; it only neutralises legacy technical
// account-status chrome that is injected by an older shared runtime after page render.
// All existing downstream public runtime/API metadata is preserved verbatim.
const downstream=require('./consumer-surface-reconciliation-v81');

const TRUST_CENTRE_VERSION='82.0';
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

function handler(req,res){
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
}

// Preserve every public downstream contract (including Search VERSION=52.0 and
// Decision Lab DECISION_VERSION/DECISION_PATCH) while adding Trust-specific metadata.
Object.assign(handler,downstream,{
  TRUST_CENTRE_VERSION,
  TRUST_PATHS,
  neutraliseLegacyTrustChrome
});

module.exports=handler;
