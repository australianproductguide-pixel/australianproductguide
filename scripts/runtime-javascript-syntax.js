const http=require('http');
const vm=require('vm');
const app=require('../lib/account-release-reconcile');

const assets=[
  '/assets/app.js',
  '/assets/assistant.js',
  '/assets/brand-polish.js',
  '/assets/navigation-v8.js',
  '/assets/amazon-associates.js',
  '/assets/account-platform.js'
];

const server=http.createServer((req,res)=>app(req,res));
server.listen(0,'127.0.0.1',async()=>{
  const {port}=server.address();
  try{
    for(const path of assets){
      const response=await fetch(`http://127.0.0.1:${port}${path}`);
      if(!response.ok)throw new Error(`${path} returned HTTP ${response.status}`);
      const source=await response.text();
      new vm.Script(source,{filename:path});
      console.log(`RUNTIME_JS_PARSE=PASS ${path}`);
    }
    console.log(`RUNTIME_JS_SYNTAX=PASS assets=${assets.length}`);
  }catch(error){
    console.error(error.stack||error.message||String(error));
    process.exitCode=1;
  }finally{
    server.close();
  }
});
