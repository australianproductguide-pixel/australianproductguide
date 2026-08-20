'use strict';
const assert=require('assert');
const vm=require('vm');
const {EventEmitter}=require('events');
const {clientJs}=require('../lib/client');
const {decisionClientJs}=require('../lib/decision-client');
const api=require('../api/index');

function executeCoreClient(initialCompare){
  const store=new Map([['apgCompare',JSON.stringify(initialCompare)]]);
  const windowListeners={};
  const count={textContent:''};
  const link={
    href:'',
    attrs:{},
    classes:{},
    classList:{toggle(name,on){link.classes[name]=!!on;}},
    setAttribute(name,value){link.attrs[name]=String(value);}
  };
  const clear={onclick:null};
  const tray={
    hidden:true,
    querySelector(selector){
      if(selector==='[data-compare-count]')return count;
      if(selector==='[data-compare-link]')return link;
      if(selector==='[data-compare-clear]')return clear;
      return null;
    }
  };
  const document={
    body:{dataset:{}},
    documentElement:{classList:{toggle(){}}},
    querySelector(selector){return selector==='#compareTray'?tray:null;},
    querySelectorAll(){return [];},
    addEventListener(){},
    createElement(){return {classList:{toggle(){}},setAttribute(){},appendChild(){},dataset:{}};}
  };
  const localStorage={
    getItem(key){return store.has(key)?store.get(key):null;},
    setItem(key,value){store.set(key,String(value));},
    removeItem(key){store.delete(key);}
  };
  const context={
    document,
    localStorage,
    window:{addEventListener(type,fn){windowListeners[type]=fn;}},
    location:{pathname:'/',search:'',origin:'https://australianproductguide.au',href:'https://australianproductguide.au/'},
    navigator:{},
    fetch:()=>Promise.resolve({ok:true,json:async()=>[]}),
    matchMedia:()=>({matches:false}),
    addEventListener(){},
    setTimeout(){return 0;},
    clearTimeout(){},
    encodeURIComponent,
    decodeURIComponent,
    URL,
    URLSearchParams,
    Map,
    Set,
    console
  };
  vm.runInNewContext(clientJs,context,{filename:'apg-client.js'});
  return {
    stored:()=>JSON.parse(store.get('apgCompare')||'[]'),
    setCompare(value){store.set('apgCompare',JSON.stringify(value));},
    sync(){assert(windowListeners['apg-workspace-synced'],'workspace sync listener must be installed');windowListeners['apg-workspace-synced']();},
    tray,
    count,
    link
  };
}

function request(url){
  return new Promise((resolve,reject)=>{
    const req=new EventEmitter();
    req.method='GET';
    req.url=url;
    req.headers={host:'australianproductguide.au','x-forwarded-proto':'https'};
    const headers=new Map(),chunks=[];
    const res={
      statusCode:200,
      setHeader(k,v){headers.set(String(k).toLowerCase(),v);},
      getHeader(k){return headers.get(String(k).toLowerCase());},
      removeHeader(k){headers.delete(String(k).toLowerCase());},
      end(body=''){if(body!==undefined&&body!==null)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));resolve({status:this.statusCode,headers:Object.fromEntries(headers),body:Buffer.concat(chunks).toString('utf8')});},
      write(body){if(body!==undefined&&body!==null)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));return true;}
    };
    try{const returned=api(req,res);if(returned&&typeof returned.then==='function')returned.catch(reject);}catch(error){reject(error);}
  });
}

(async()=>{
  const client=executeCoreClient([
    'OPPO-FIND-X9',
    {slug:'samsung-galaxy-s26'},
    '/products/google-pixel-10/',
    {url:'/products/apple-iphone-17/?from=legacy'},
    '[object Object]',
    {broken:true}
  ]);
  assert.deepStrictEqual(client.stored(),['oppo-find-x9','samsung-galaxy-s26','google-pixel-10','apple-iphone-17'],'legacy compare state must migrate to four canonical slugs');
  assert.equal(client.count.textContent,4,'tray count must reflect canonical shortlist');
  assert.equal(client.tray.hidden,false,'tray must remain visible for a migrated shortlist');
  assert.equal(client.link.href,'/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26,google-pixel-10,apple-iphone-17','tray must hand canonical slugs to the SSR compare route');

  const deduped=executeCoreClient(['oppo-find-x9','oppo-find-x9',{path:'/products/samsung-galaxy-s26/'},'',null,'bad value with spaces']);
  assert.deepStrictEqual(deduped.stored(),['oppo-find-x9','samsung-galaxy-s26'],'compare migration must remove duplicates and invalid values');
  assert.equal(deduped.link.href,'/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26');
  assert.equal(deduped.link.attrs['aria-disabled'],'false','two canonical products must enable the shortlist link');

  deduped.setCompare([{productSlug:'honor-magic8-pro'},'/products/google-pixel-10-pro/','[object Object]']);
  deduped.sync();
  assert.deepStrictEqual(deduped.stored(),['honor-magic8-pro','google-pixel-10-pro'],'workspace sync must be re-read and canonicalised');
  assert.equal(deduped.link.href,'/compare/custom/?products=honor-magic8-pro,google-pixel-10-pro','workspace sync must refresh the native compare destination');

  assert(decisionClientJs.includes('function compareState()'),'My APG client must canonicalise comparison state');
  assert(decisionClientJs.includes("compare.map(encodeURIComponent).join(',')"),'My APG comparison link must use canonical encoded slugs');
  assert(decisionClientJs.includes("window.addEventListener('apg-workspace-synced'"),'My APG must refresh after workspace sync');

  const compare=await request('/compare/custom/?products=honor-magic8-pro,google-pixel-10-pro');
  assert.equal(compare.status,200,'SSR custom comparison must render successfully');
  assert(compare.body.includes('Magic8 Pro'),'SSR comparison must render the first handed-off product');
  assert(compare.body.includes('Pixel 10 Pro'),'SSR comparison must render the second handed-off product');
  assert(compare.body.includes('There is no universal winner'),'SSR comparison framing must remain intact');

  console.log('COMPARE_STATE_HANDOFF_V56=PASS migration=canonical sync=refreshed ssr=2-products');
})().catch(error=>{console.error(error);process.exitCode=1;});
