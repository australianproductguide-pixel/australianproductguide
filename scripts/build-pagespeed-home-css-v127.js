'use strict';

const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/pagespeed-static-delivery-v127-runtime');
const assetHandler=require('../lib/pagespeed-performance-v88');

const PUBLIC_ROOT=path.resolve(process.cwd(),'public');

function staticAssetPath(assetPath){
  const relative=String(assetPath||'').replace(/^\/+/, '');
  const filename=path.resolve(PUBLIC_ROOT,relative);
  if(filename!==PUBLIC_ROOT&&!filename.startsWith(PUBLIC_ROOT+path.sep))throw new Error(`Unsafe asset path: ${assetPath}`);
  return filename;
}
function readStaticAsset(assetPath){
  const filename=staticAssetPath(assetPath);
  try{
    const body=fs.readFileSync(filename,'utf8');
    return body.trim()?body:'';
  }catch{return ''}
}
function captureRuntimeAsset(assetPath){
  return new Promise((resolve,reject)=>{
    let body='',settled=false;
    const headers=new Map();
    const finish=(error)=>{
      if(settled)return;
      settled=true;
      if(error)return reject(error);
      if(res.statusCode!==200)return reject(new Error(`Unable to capture ${assetPath}: HTTP ${res.statusCode}`));
      if(!body.trim())return reject(new Error(`Unable to capture ${assetPath}: empty stylesheet`));
      resolve(body);
    };
    const req={
      url:assetPath,
      method:'GET',
      headers:{host:'australianproductguide.au','x-forwarded-host':'australianproductguide.au'},
      socket:null,
      httpVersion:''
    };
    const res={
      statusCode:200,
      setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this;},
      getHeader(name){return headers.get(String(name).toLowerCase());},
      removeHeader(name){headers.delete(String(name).toLowerCase());},
      end(chunk){
        if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);
        finish();
        return body;
      }
    };
    try{
      const result=assetHandler(req,res);
      if(result&&typeof result.then==='function')Promise.resolve(result).then(()=>{if(!settled)setImmediate(()=>finish(new Error(`Handler did not end ${assetPath}`)));}).catch(finish);
      else if(!settled)setImmediate(()=>finish(new Error(`Handler did not end ${assetPath}`)));
    }catch(error){finish(error);}
  });
}
function absoluteCssUrls(css,assetPath){
  const base=new URL(assetPath,layer.ORIGIN);
  return String(css||'').replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(full,quote,value)=>{
    const raw=String(value||'').trim();
    if(!raw||raw.startsWith('/')||raw.startsWith('#')||/^(?:data:|https?:|blob:|var\()/i.test(raw))return full;
    try{
      const next=new URL(raw,base);
      if(next.origin!==layer.ORIGIN)return full;
      const resolved=next.pathname+next.search+next.hash;
      return `url(${quote||''}${resolved}${quote||''})`;
    }catch{return full;}
  });
}
async function loadAsset(assetPath){
  const staticBody=readStaticAsset(assetPath);
  if(staticBody)return {body:staticBody,source:'public'};
  return {body:await captureRuntimeAsset(assetPath),source:'runtime'};
}
async function build(){
  const chunks=[],manifest=[];
  for(const assetPath of layer.HOME_CRITICAL_CSS){
    const asset=await loadAsset(assetPath);
    const body=absoluteCssUrls(asset.body,assetPath);
    if(!body.trim())throw new Error(`Generated empty CSS for ${assetPath}`);
    chunks.push(`/* APG v${layer.VERSION}: ${assetPath} (${asset.source}) */\n${body.trim()}\n`);
    manifest.push({path:assetPath,source:asset.source,bytes:Buffer.byteLength(body,'utf8')});
  }
  const output=`/* Australian Product Guide homepage critical CSS. Generated at build time by scripts/build-pagespeed-home-css-v127.js. Do not edit manually. */\n${chunks.join('\n')}`;
  const bytes=Buffer.byteLength(output,'utf8');
  if(bytes<layer.MIN_BUNDLE_BYTES)throw new Error(`Generated bundle unexpectedly small: ${bytes} bytes`);
  fs.mkdirSync(path.dirname(layer.HOME_BUNDLE_FILE),{recursive:true});
  fs.writeFileSync(layer.HOME_BUNDLE_FILE,output,'utf8');
  const result={version:layer.VERSION,path:layer.HOME_BUNDLE_PATH,bytes,assets:manifest};
  console.log('PAGESPEED_HOME_CSS_V127_BUILT '+JSON.stringify(result));
  return result;
}

if(require.main===module){
  build().catch(error=>{console.error(error&&error.stack?error.stack:error);process.exitCode=1;});
}

module.exports={PUBLIC_ROOT,staticAssetPath,readStaticAsset,captureRuntimeAsset,absoluteCssUrls,loadAsset,build};
