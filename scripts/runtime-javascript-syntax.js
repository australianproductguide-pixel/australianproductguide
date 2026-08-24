const http=require('http');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
require('./apg-proof-rail-v103-qa');
const app=require('../lib/account-release-reconcile');

const runtimeAssets=[
  '/assets/app.js',
  '/assets/assistant.js',
  '/assets/brand-polish.js',
  '/assets/navigation-v8.js',
  '/assets/amazon-associates.js',
  '/assets/account-platform.js'
];
const publicAssets=[
  path.join(__dirname,'..','public','assets','brand-missing-logo-loader-v73.js'),
  path.join(__dirname,'..','public','assets','apg-proof-rail-v103.js')
];

const server=http.createServer((req,res)=>app(req,res));
server.listen(0,'127.0.0.1',async()=>{
  const {port}=server.address();
  try{
    for(const assetPath of runtimeAssets){
      const response=await fetch(`http://127.0.0.1:${port}${assetPath}`);
      if(!response.ok)throw new Error(`${assetPath} returned HTTP ${response.status}`);
      const source=await response.text();
      new vm.Script(source,{filename:assetPath});
      console.log(`RUNTIME_JS_PARSE=PASS ${assetPath}`);
    }
    for(const filePath of publicAssets){
      const source=fs.readFileSync(filePath,'utf8');
      new vm.Script(source,{filename:filePath});
      console.log(`RUNTIME_JS_PARSE=PASS /assets/${path.basename(filePath)}`);
    }
    console.log(`RUNTIME_JS_SYNTAX=PASS assets=${runtimeAssets.length+publicAssets.length}`);
  }catch(error){
    console.error(error.stack||error.message||String(error));
    process.exitCode=1;
  }finally{
    server.close();
  }
});