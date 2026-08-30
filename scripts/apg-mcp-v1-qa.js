'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const auth=read('lib/apg-mcp-auth-v1.js');
const tools=read('lib/apg-mcp-v1.js');
const mcp=read('api/mcp.js');
const consent=read('api/oauth-consent.js');
const metadata=read('api/mcp-oauth-metadata.js');
const vercel=JSON.parse(read('vercel.json'));
const pkg=JSON.parse(read('package.json'));

for(const [name,source] of Object.entries({auth,tools,mcp,consent,metadata})){
  assert.doesNotThrow(()=>new Function(source),`${name} source must parse`);
}
assert.equal(pkg.dependencies['@modelcontextprotocol/server'],'2.0.0');
assert.equal(pkg.dependencies['@modelcontextprotocol/node'],'2.0.0');
assert(pkg.dependencies.zod,'zod must be installed for MCP schemas');
assert(mcp.includes("registerTool('google_connection_status'"));
assert(mcp.includes("registerTool('search_console_performance'"));
assert(mcp.includes("registerTool('ga4_report'"));
assert(mcp.includes("registerTool('growth_opportunities'"));
assert(mcp.includes('readOnlyHint:true'));
assert(auth.includes('apg_mcp_operators'),'operator allowlist must gate MCP access');
assert(auth.includes('oauth_client_token_required'),'MCP must reject ordinary APG browser sessions');
assert(auth.includes('resource_metadata'),'OAuth challenge must advertise protected-resource metadata');
assert(consent.includes('/oauth/authorizations/'),'consent UI must delegate OAuth decisions to Supabase Auth');
assert(!/service_role|sb_secret_|BEGIN PRIVATE KEY|private_key/i.test(auth+mcp+consent),'MCP layer must not contain privileged Supabase or Google secrets');
const routes=vercel.routes||[];
assert(routes.some(r=>r.src==='/mcp'&&r.dest==='/api/mcp'));
assert(routes.some(r=>r.src==='/oauth/consent'&&r.dest==='/api/oauth-consent'));
assert(routes.some(r=>r.src==='/\.well-known/oauth-protected-resource/mcp'.replace('\\','')||r.src==='/.well-known/oauth-protected-resource/mcp'));
console.log('APG MCP OAuth v1 source QA passed');

// Feature-branch Preview validation only. This makes the Vercel build prove that the
// newly configured eBay Sandbox Client ID / Cert ID can mint an OAuth application token
// and call the Browse API, without ever printing credentials or tokens.
if(process.env.VERCEL_ENV==='preview'&&String(process.env.EBAY_BROWSE_ENVIRONMENT||'').trim().toLowerCase()==='sandbox'){
  require('./ebay-browse-sandbox-validation');
}
