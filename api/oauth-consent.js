'use strict';

const auth=require('../lib/apg-mcp-auth-v1');

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(res,status,body){res.statusCode=status;res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.end(`<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorise APG connection</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7f8;color:#0f172a;margin:0}.shell{max-width:640px;margin:8vh auto;padding:24px}.card{background:#fff;border:1px solid #dbe3e8;border-radius:18px;padding:28px;box-shadow:0 14px 36px rgba(15,23,42,.08)}h1{margin:.25rem 0 1rem;font-size:1.8rem}.k{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#2563eb}.muted{color:#52606d}.box{background:#f8fafc;border-radius:12px;padding:14px;margin:18px 0}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn,button{border:0;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;text-decoration:none}.primary{background:#2563eb;color:white}.secondary{background:#e8eef4;color:#0f172a}.danger{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}.login label{display:block;font-weight:700;margin-top:12px}.login input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-top:5px}.error{color:#b42318;margin-top:12px}</style></head><body><main class="shell"><section class="card">${body}</section></main></body></html>`);}
function readBody(req,limit=20000){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>limit){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>resolve(new URLSearchParams(raw)));req.on('error',reject);});}
async function oauthDetails(id,token){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/oauth/authorizations/${encodeURIComponent(id)}`,{headers:{apikey:auth.SUPABASE_KEY,authorization:`Bearer ${token}`}});}
async function consentDecision(id,decision,token){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/oauth/authorizations/${encodeURIComponent(id)}/consent`,{method:'POST',headers:{apikey:auth.SUPABASE_KEY,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({action:decision})});}
function signInPage(id,message=''){
  const returnPath=`/oauth/consent?authorization_id=${encodeURIComponent(id)}`;
  return `<span class="k">Private APG integration</span><h1>Sign in to authorise ChatGPT</h1><p class="muted">Use the Australian Product Guide account that has been approved as an APG MCP operator. Your Google Analytics and Search Console credentials are never shared with ChatGPT.</p><form class="login" id="apgOauthLogin"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><div class="actions" style="margin-top:18px"><button class="primary" type="submit">Sign in and continue</button><a class="btn secondary" href="/my-apg/">Open My APG</a></div><p class="error" id="loginError">${esc(message)}</p></form><script>document.getElementById('apgOauthLogin').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),err=document.getElementById('loginError');err.textContent='';try{const r=await fetch('/api/account/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.get('email'),password:f.get('password')})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Sign in failed');location.href=${JSON.stringify(returnPath)}}catch(x){err.textContent=x.message||'Sign in failed'}});</script>`;
}

module.exports=async function handler(req,res){
  try{
    const url=new URL(req.url,'https://australianproductguide.au');
    let authorizationId=String(url.searchParams.get('authorization_id')||'').trim();
    let decision='';
    if(req.method==='POST'){
      const body=await readBody(req);authorizationId=String(body.get('authorization_id')||authorizationId).trim();decision=String(body.get('decision')||'').trim();
    }
    if(!authorizationId)return html(res,400,'<span class="k">Private APG integration</span><h1>Invalid authorisation request</h1><p class="muted">The OAuth authorisation identifier is missing. Start the connection again from ChatGPT.</p>');
    const token=auth.accountAccessToken(req);
    const operator=await auth.validateUserOperator(token);
    if(!operator.ok){
      if(operator.status===401)return html(res,401,signInPage(authorizationId));
      return html(res,403,'<span class="k">Private APG integration</span><h1>Access not authorised</h1><p class="muted">This APG account is not approved to connect the private Growth Intelligence MCP app.</p>');
    }
    if(req.method==='POST'){
      if(decision!=='approve'&&decision!=='deny')return html(res,400,'<h1>Invalid decision</h1>');
      const result=await consentDecision(authorizationId,decision,token);
      if(!result.ok||!result.data?.redirect_url)return html(res,400,`<span class="k">Private APG integration</span><h1>Authorisation could not be completed</h1><p class="muted">${esc(result.data?.msg||result.data?.message||result.data?.error_description||'Please restart the connection from ChatGPT.')}</p>`);
      res.statusCode=303;res.setHeader('Location',result.data.redirect_url);return res.end();
    }
    const details=await oauthDetails(authorizationId,token);
    if(!details.ok)return html(res,400,`<span class="k">Private APG integration</span><h1>Authorisation request unavailable</h1><p class="muted">${esc(details.data?.msg||details.data?.message||details.data?.error_description||'OAuth 2.1 may not yet be enabled for this APG Supabase project.')}</p>`);
    if(details.data?.redirect_url&&!details.data?.authorization_id){res.statusCode=303;res.setHeader('Location',details.data.redirect_url);return res.end();}
    const client=details.data?.client||{};const scopes=String(details.data?.scope||'').split(/\s+/).filter(Boolean);
    return html(res,200,`<span class="k">Private APG integration</span><h1>Authorise ${esc(client.name||'ChatGPT')}?</h1><p class="muted">This connection allows the approved APG operator to use ChatGPT to read Australian Product Guide growth intelligence from Google Search Console and Google Analytics 4. It does not expose Google credentials or grant access to unrelated Supabase data.</p><div class="box"><strong>Application</strong><div>${esc(client.name||'OAuth client')}</div>${details.data?.redirect_uri?`<p><strong>Return address</strong><br><small>${esc(details.data.redirect_uri)}</small></p>`:''}${scopes.length?`<p><strong>Requested identity scopes</strong><br>${scopes.map(esc).join(' · ')}</p>`:''}</div><form method="post" action="/oauth/consent"><input type="hidden" name="authorization_id" value="${esc(authorizationId)}"><div class="actions"><button class="primary" name="decision" value="approve" type="submit">Authorise APG Growth Intelligence</button><button class="danger" name="decision" value="deny" type="submit">Deny</button></div></form>`);
  }catch(error){console.error('[APG OAuth consent]',error&&error.message||error);return html(res,500,'<h1>Authorisation service unavailable</h1><p class="muted">Please try again.</p>');}
};
