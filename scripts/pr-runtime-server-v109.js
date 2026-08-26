'use strict';

const http=require('node:http');
const app=require('../api/index');

const host=process.env.HOST||'127.0.0.1';
const port=Number(process.env.PORT||4173);

const server=http.createServer((req,res)=>{
  // This harness serves the exact application runtime over loopback HTTP. Production's
  // `upgrade-insecure-requests` CSP directive is correct for the public HTTPS site, but on
  // loopback it would rewrite relative assets to https://127.0.0.1 and manufacture SSL
  // failures unrelated to application behaviour. Remove only transport-enforcement headers
  // in this CI-only harness; all other application CSP directives and runtime output remain.
  const setHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>{
    const key=String(name||'').toLowerCase();
    if(key==='content-security-policy'){
      const safe=String(value||'')
        .replace(/\s*upgrade-insecure-requests\s*;?/gi,'')
        .replace(/;\s*;/g,';')
        .trim();
      return setHeader(name,safe);
    }
    if(key==='strict-transport-security')return res;
    return setHeader(name,value);
  };

  try{
    const result=app(req,res);
    if(result&&typeof result.then==='function'){
      result.catch(error=>{
        console.error('APG_PR_RUNTIME_ASYNC_ERROR',error&&error.stack||error);
        if(!res.headersSent)res.statusCode=500;
        if(!res.writableEnded)res.end('Internal Server Error');
      });
    }
  }catch(error){
    console.error('APG_PR_RUNTIME_ERROR',error&&error.stack||error);
    if(!res.headersSent)res.statusCode=500;
    if(!res.writableEnded)res.end('Internal Server Error');
  }
});

server.listen(port,host,()=>{
  console.log(`APG_PR_RUNTIME_READY http://${host}:${port}`);
});

function shutdown(signal){
  console.log(`APG_PR_RUNTIME_SHUTDOWN ${signal}`);
  server.close(()=>process.exit(0));
  setTimeout(()=>process.exit(1),5000).unref();
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));
