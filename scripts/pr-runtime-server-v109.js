'use strict';

const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const homeBundle=path.join(root,'public','assets','home-v128-bundle.css');
const homeBundleSidecars=[homeBundle,homeBundle+'.br',homeBundle+'.gz'];
// The exact PR runtime mirrors Vercel's build output. Generate the static Home bundle and its
// deterministic precompressed sidecars before the application is imported, unless this process
// is itself the unbundled source runtime used by the build script. The build remains outside every
// public response and fails closed on any error.
if(process.env.APG_HOME_CSS_BUILD!=='1'&&homeBundleSidecars.some(filename=>!fs.existsSync(filename))){
  execFileSync(process.execPath,[path.join(root,'scripts','build-home-css-v128.js')],{
    cwd:root,
    env:{...process.env,APG_HOME_CSS_BUILD:'1'},
    stdio:'inherit'
  });
}

const app=require('../api/index');

const host=process.env.HOST||'127.0.0.1';
const port=Number(process.env.PORT||4173);
const publicRoot=path.resolve(root,'public');
const DYNAMIC_COMPRESSION_MIN_BYTES=1024;
const mime={
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.mjs':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.gif':'image/gif',
  '.ico':'image/x-icon',
  '.txt':'text/plain; charset=utf-8',
  '.xml':'application/xml; charset=utf-8'
};

function requestPath(req){
  let pathname='/';
  try{pathname=decodeURIComponent(new URL(req.url||'/','http://127.0.0.1').pathname);}catch{}
  // Some legacy APG asset references contain a slash after a filename, e.g. foo.css/?v=1.
  // Vercel filesystem routing resolves the file; normalise only that file-shaped suffix.
  pathname=pathname.replace(/(\.[a-z0-9]{1,12})\/$/i,'$1');
  return pathname;
}
function explicitlyVersionedAsset(req){
  try{
    const url=new URL(req&&req.url||'/','http://127.0.0.1');
    return requestPath(req).startsWith('/assets/')&&Boolean(url.searchParams.get('v'));
  }catch{return false;}
}
function normalisePublicRequest(req){
  // The loopback transport is only a test harness. Canonical, Open Graph and JSON-LD URLs must
  // be rendered exactly as they are on public Production, otherwise the certification would
  // validate localhost artefacts rather than APG's real search identity.
  req.headers={
    ...(req.headers||{}),
    host:'australianproductguide.au',
    'x-forwarded-host':'australianproductguide.au',
    'x-forwarded-proto':'https'
  };
  return req;
}

function staticFileFor(pathname){
  if(!pathname.startsWith('/'))return null;
  const candidate=path.resolve(publicRoot,'.'+pathname);
  if(candidate!==publicRoot&&!candidate.startsWith(publicRoot+path.sep))return null;
  try{
    const stat=fs.statSync(candidate);
    return stat.isFile()?candidate:null;
  }catch{return null;}
}
function compressible(type){
  return /^(?:text\/|application\/(?:javascript|json|xml|manifest\+json))/i.test(String(type||''));
}
function acceptedCompression(req,type){
  if(!compressible(type))return null;
  const accepted=String(req&&req.headers&&req.headers['accept-encoding']||'').toLowerCase();
  if(/(?:^|[,\s])br(?:[,\s]|$)/.test(accepted))return 'br';
  if(/(?:^|[,\s])gzip(?:[,\s]|$)/.test(accepted))return 'gzip';
  return null;
}
const staticCompression=acceptedCompression;
function precompressedStaticFile(filename,encoding){
  const suffix=encoding==='br'?'.br':encoding==='gzip'?'.gz':'';
  if(!suffix)return null;
  const candidate=filename+suffix;
  try{
    const stat=fs.statSync(candidate);
    return stat.isFile()?candidate:null;
  }catch{return null;}
}
function staticStream(filename,encoding){
  const input=fs.createReadStream(filename);
  if(encoding==='br')return input.pipe(zlib.createBrotliCompress({params:{[zlib.constants.BROTLI_PARAM_QUALITY]:6}}));
  if(encoding==='gzip')return input.pipe(zlib.createGzip({level:9}));
  return input;
}
function mergeVary(current,token){
  const values=(Array.isArray(current)?current:[current]).flatMap(value=>String(value||'').split(',')).map(value=>value.trim()).filter(Boolean);
  if(values.includes('*'))return '*';
  if(!values.some(value=>value.toLowerCase()===String(token).toLowerCase()))values.push(token);
  return values.join(', ');
}
function toBuffer(chunk,encoding){
  if(chunk==null)return null;
  if(Buffer.isBuffer(chunk))return chunk;
  if(ArrayBuffer.isView(chunk))return Buffer.from(chunk.buffer,chunk.byteOffset,chunk.byteLength);
  return Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8');
}
function dynamicCompression(req,res){
  const originalWrite=res.write.bind(res);
  const originalEnd=res.end.bind(res);
  const chunks=[];
  let ended=false;

  function collect(chunk,encoding){
    const buffer=toBuffer(chunk,encoding);
    if(buffer&&buffer.length)chunks.push(buffer);
  }
  res.write=(chunk,encoding,callback)=>{
    collect(chunk,encoding);
    if(typeof encoding==='function')encoding();
    else if(typeof callback==='function')callback();
    return true;
  };
  res.end=(chunk,encoding,callback)=>{
    if(ended)return res;
    ended=true;
    collect(chunk,encoding);
    const done=typeof encoding==='function'?encoding:callback;
    const body=chunks.length?Buffer.concat(chunks):Buffer.alloc(0);
    const status=Number(res.statusCode||200);
    const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
    const existingEncoding=String(res.getHeader&&res.getHeader('Content-Encoding')||'').trim();
    const selected=acceptedCompression(req,type);
    const eligible=(req.method||'GET')!=='HEAD'&&status>=200&&status<300&&status!==204&&body.length>=DYNAMIC_COMPRESSION_MIN_BYTES&&!existingEncoding&&!res.headersSent&&selected;

    if(!eligible){
      if((req.method||'GET')==='HEAD'||status===204||status===304)return originalEnd(undefined,done);
      return originalEnd(body.length?body:undefined,done);
    }

    try{
      const compressed=selected==='br'
        ?zlib.brotliCompressSync(body,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:6}})
        :zlib.gzipSync(body,{level:9});
      res.setHeader('Content-Encoding',selected);
      res.setHeader('Vary',mergeVary(res.getHeader&&res.getHeader('Vary'),'Accept-Encoding'));
      try{res.removeHeader('Content-Length');}catch{}
      res.setHeader('Content-Length',String(compressed.length));
      res.setHeader('X-APG-PR-Dynamic-Compression',selected);
      return originalEnd(compressed,done);
    }catch(error){
      console.error('APG_PR_DYNAMIC_COMPRESSION_ERROR',error&&error.stack||error);
      return originalEnd(body.length?body:undefined,done);
    }
  };
  return {originalWrite,originalEnd};
}

function serveStatic(req,res,filename){
  const type=mime[path.extname(filename).toLowerCase()]||'application/octet-stream';
  const encoding=acceptedCompression(req,type);
  const sidecar=precompressedStaticFile(filename,encoding);
  const representation=sidecar||filename;
  const representationBytes=fs.statSync(representation).size;
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  // Mirror the Vercel edge rule used by the exact candidate: only an asset request carrying
  // a non-empty explicit `v` query is immutable. Unversioned repository assets remain
  // revalidated so ordinary source updates cannot be trapped behind a year-long browser cache.
  res.setHeader('Cache-Control',explicitlyVersionedAsset(req)
    ?'public, max-age=31536000, immutable'
    :'public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(encoding){
    res.setHeader('Content-Encoding',encoding);
    res.setHeader('Vary',mergeVary(res.getHeader&&res.getHeader('Vary'),'Accept-Encoding'));
  }
  if(sidecar){
    res.setHeader('Content-Length',String(representationBytes));
    res.setHeader('X-APG-PR-Static-Compression','precompressed-'+encoding);
  }else if(!encoding){
    res.setHeader('Content-Length',String(representationBytes));
  }
  if(req.method==='HEAD')return res.end();

  // Precompressed sidecars exist only for the generated Home bundle in this exact CI harness.
  // Serving them directly mirrors CDN delivery and avoids spending the critical rendering path
  // recompressing a static 500+ KiB stylesheet. Vercel still owns public Production compression.
  const stream=sidecar?fs.createReadStream(sidecar):staticStream(filename,encoding);
  return stream
    .on('error',error=>{
      console.error('APG_PR_STATIC_ERROR',representation,error&&error.stack||error);
      if(!res.headersSent)res.statusCode=500;
      if(!res.writableEnded)res.end('Static asset error');
    })
    .pipe(res);
}

const server=http.createServer((req,res)=>{
  const pathname=requestPath(req);

  // Vercel injects this platform asset in Production. It is not part of the repository and
  // has no bearing on APG interaction behaviour, so the local PR harness provides an explicit
  // inert JavaScript response instead of manufacturing a 404/MIME error.
  if(pathname==='/_vercel/insights/script.js'){
    res.statusCode=200;
    res.setHeader('Content-Type','application/javascript; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.end(req.method==='HEAD'?'':'/* PR harness: Vercel Insights unavailable on loopback. */');
  }

  // Mirror Vercel `{handle:"filesystem"}`: real repository assets are served before the
  // catch-all API runtime. Dynamic assets such as Premium v107/v109 are absent from public/
  // and therefore continue into the real application handler below.
  const staticFile=staticFileFor(pathname);
  if(staticFile&&['GET','HEAD'].includes(req.method||'GET'))return serveStatic(req,res,staticFile);

  normalisePublicRequest(req);

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

  // Vercel serves Production HTML with Brotli/gzip when the client advertises support. Mirror
  // that transport in this CI-only exact-runtime harness so Lighthouse measures the candidate
  // application rather than an artificial uncompressed loopback response. Static assets have
  // already returned above and are never compressed twice.
  dynamicCompression(req,res);

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

module.exports={
  DYNAMIC_COMPRESSION_MIN_BYTES,requestPath,explicitlyVersionedAsset,staticFileFor,compressible,
  acceptedCompression,staticCompression,precompressedStaticFile,staticStream,mergeVary,toBuffer,
  dynamicCompression,serveStatic
};
