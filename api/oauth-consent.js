'use strict';

const auth=require('../lib/apg-mcp-auth-v1');

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function appendCookie(res,value){const current=res.getHeader('Set-Cookie');if(!current)res.setHeader('Set-Cookie',[value]);else res.setHeader('Set-Cookie',Array.isArray(current)?[...current,value]:[current,value]);}
function setOperatorCookie(res,token,expiresIn){const maxAge=Math.max(300,Math.min(Number(expiresIn)||3600,3600));appendCookie(res,`${auth.OPERATOR_ACCESS_COOKIE}=${encodeURIComponent(token)}; Path=/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);}
function clearOperatorCookie(res){appendCookie(res,`${auth.OPERATOR_ACCESS_COOKIE}=; Path=/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);}
function html(res,status,body){res.statusCode=status;res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('Pragma','no-cache');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');res.end(`<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorise APG Growth Intelligence</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7f8;color:#0f172a;margin:0}.shell{max-width:640px;margin:8vh auto;padding:24px}.card{background:#fff;border:1px solid #dbe3e8;border-radius:18px;padding:28px;box-shadow:0 14px 36px rgba(15,23,42,.08)}h1{margin:.25rem 0 1rem;font-size:1.8rem}.k{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#2563eb}.muted{color:#52606d}.box{background:#f8fafc;border-radius:12px;padding:14px;margin:18px 0}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn,button{border:0;border-radius:10px;padding:11px 16px;font-weight:700;cursor:pointer;text-decoration:none}.primary{background:#2563eb;color:white}.secondary{background:#e8eef4;color:#0f172a}.danger{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}.login label{display:block;font-weight:700;margin-top:12px}.login input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin-top:5px}.error{color:#b42318;margin-top:12px}.success{color:#166534;margin-top:12px}.note{font-size:.9rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-top:16px}</style></head><body><main class="shell"><section class="card">${body}</section></main></body></html>`);}
function readBody(req,limit=20000){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>limit){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>resolve(new URLSearchParams(raw)));req.on('error',reject);});}
async function oauthDetails(id,token){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/oauth/authorizations/${encodeURIComponent(id)}`,{headers:{apikey:auth.SUPABASE_KEY,authorization:`Bearer ${token}`}});}
async function consentDecision(id,decision,token){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/oauth/authorizations/${encodeURIComponent(id)}/consent`,{method:'POST',headers:{apikey:auth.SUPABASE_KEY,authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({action:decision})});}
async function signInOperator(email,password){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:auth.SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({email,password})});}
async function requestPasswordReset(email){return auth.jsonFetch(`${auth.SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent('https://australianproductguide.au/my-apg/')}`,{method:'POST',headers:{apikey:auth.SUPABASE_KEY,'content-type':'application/json'},body:JSON.stringify({email})});}
function signInPage(id,message='',notice=''){
  return `<span class="k">APG private authorisation</span><h1>Verify the approved APG account</h1><p class="muted">This check protects the private Growth Intelligence connection before ChatGPT receives access.</p><div class="note"><strong>There is no separate “operator password”.</strong><br>Use the password already set on the approved APG account. This does not create another profile or another password.</div><form class="login" method="post" action="/oauth/consent"><input type="hidden" name="authorization_id" value="${esc(id)}"><label>Email address<input name="email" type="email" autocomplete="username" required></label><label>APG account password<input name="password" type="password" autocomplete="current-password"></label><div class="actions" style="margin-top:18px"><button class="primary" name="action" value="operator_login" type="submit">Continue to authorisation</button><button class="secondary" name="action" value="operator_recover" type="submit" formnovalidate>Send password reset email</button></div>${message?`<p class="error">${esc(message)}</p>`:''}${notice?`<p class="success">${esc(notice)}</p>`:''}</form>`;
}

module.exports=async function handler(req,res){
  try{
    const url=new URL(req.url,'https://australianproductguide.au');
    let authorizationId=String(url.searchParams.get('authorization_id')||'').trim();
    let decision='';let action='';let body=null;
    if(req.method==='POST'){
      body=await readBody(req);authorizationId=String(body.get('authorization_id')||authorizationId).trim();decision=String(body.get('decision')||'').trim();action=String(body.get('action')||'').trim();
    }
    if(!authorizationId)return html(res,400,'<span class="k">APG private authorisation</span><h1>Invalid authorisation request</h1><p class="muted">The OAuth authorisation identifier is missing. Start the connection again from ChatGPT.</p>');

    if(req.method==='POST'&&action==='operator_recover'){
      const email=String(body.get('email')||'').trim().toLowerCase();
      if(email)await requestPasswordReset(email);
      return html(res,200,signInPage(authorizationId,'','If that email is the approved APG account, a secure password-reset email has been requested. You can leave this authorisation tab open and return after resetting the password.'));
    }

    if(req.method==='POST'&&action==='operator_login'){
      const email=String(body.get('email')||'').trim().toLowerCase();const password=String(body.get('password')||'');
      if(!email||!password)return html(res,401,signInPage(authorizationId,'Enter the approved APG email and its existing account password.'));
      const login=await signInOperator(email,password);
      if(!login.ok||!login.data?.access_token)return html(res,401,signInPage(authorizationId,'That email/password did not authenticate. This is the existing APG account password — there is no separate operator password. Use “Send password reset email” if needed.'));
      const operator=await auth.validateUserOperator(login.data.access_token);
      if(!operator.ok)return html(res,403,'<span class="k">APG private authorisation</span><h1>Access not authorised</h1><p class="muted">This identity is not approved to operate the private APG Growth Intelligence connector.</p>');
      setOperatorCookie(res,login.data.access_token,login.data.expires_in);
      res.statusCode=303;res.setHeader('Location',`/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`);return res.end();
    }

    const token=auth.operatorAccessToken(req);
    const operator=await auth.validateUserOperator(token);
    if(!operator.ok){
      clearOperatorCookie(res);
      if(operator.status===401)return html(res,401,signInPage(authorizationId));
      return html(res,403,'<span class="k">APG private authorisation</span><h1>Access not authorised</h1><p class="muted">This identity is not approved to operate the private APG Growth Intelligence connector.</p>');
    }
    if(req.method==='POST'){
      if(decision!=='approve'&&decision!=='deny')return html(res,400,'<h1>Invalid decision</h1>');
      const result=await consentDecision(authorizationId,decision,token);
      clearOperatorCookie(res);
      if(!result.ok||!result.data?.redirect_url)return html(res,400,`<span class="k">APG private authorisation</span><h1>Authorisation could not be completed</h1><p class="muted">${esc(result.data?.msg||result.data?.message||result.data?.error_description||'Please restart the connection from ChatGPT.')}</p>`);
      res.statusCode=303;res.setHeader('Location',result.data.redirect_url);return res.end();
    }
    const details=await oauthDetails(authorizationId,token);
    if(!details.ok)return html(res,400,`<span class="k">APG private authorisation</span><h1>Authorisation request unavailable</h1><p class="muted">${esc(details.data?.msg||details.data?.message||details.data?.error_description||'Please restart the connection from ChatGPT.')}</p>`);
    if(details.data?.redirect_url&&!details.data?.authorization_id){clearOperatorCookie(res);res.statusCode=303;res.setHeader('Location',details.data.redirect_url);return res.end();}
    const client=details.data?.client||{};const scopes=String(details.data?.scope||'').split(/\s+/).filter(Boolean);
    return html(res,200,`<span class="k">APG private authorisation</span><h1>Authorise ${esc(client.name||'ChatGPT')}?</h1><p class="muted">Allow this private ChatGPT app to read APG growth intelligence from Google Search Console and Google Analytics 4. Google credentials are never shared with ChatGPT.</p><div class="box"><strong>Approved account</strong><div>${esc(operator.user?.email||'APG operator')}</div><p><strong>Application</strong><br>${esc(client.name||'OAuth client')}</p>${details.data?.redirect_uri?`<p><strong>Return address</strong><br><small>${esc(details.data.redirect_uri)}</small></p>`:''}${scopes.length?`<p><strong>Requested scopes</strong><br>${scopes.map(esc).join(' · ')}</p>`:''}</div><form method="post" action="/oauth/consent"><input type="hidden" name="authorization_id" value="${esc(authorizationId)}"><div class="actions"><button class="primary" name="decision" value="approve" type="submit">Authorise APG Growth Intelligence</button><button class="danger" name="decision" value="deny" type="submit">Deny</button></div></form>`);
  }catch(error){console.error('[APG OAuth consent]',error&&error.message||error);return html(res,500,'<h1>Authorisation service unavailable</h1><p class="muted">Please try again.</p>');}
};
