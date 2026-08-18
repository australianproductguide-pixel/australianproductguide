'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const ENTRY=path.join(ROOT,'api','index.js');
const REQUIRE_RE=/require\((['"])(\.\.?\/[^'"]+)\1\)/g;

function resolveRelative(fromFile,spec){
  const base=path.resolve(path.dirname(fromFile),spec);
  const candidates=[base,`${base}.js`,path.join(base,'index.js')];
  return candidates.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile())||null;
}

function reachableFiles(entry=ENTRY){
  const seen=new Set();
  const queue=[entry];
  while(queue.length){
    const file=queue.shift();
    if(!file||seen.has(file)||!fs.existsSync(file))continue;
    seen.add(file);
    const src=fs.readFileSync(file,'utf8');
    REQUIRE_RE.lastIndex=0;
    let m;
    while((m=REQUIRE_RE.exec(src))){
      const next=resolveRelative(file,m[2]);
      if(next&&!seen.has(next))queue.push(next);
    }
  }
  return seen;
}

function runtimeChainIncludes(target,{entry=ENTRY}={}){
  const wanted=target.endsWith('.js')?target:`${target}.js`;
  return [...reachableFiles(entry)].some(file=>path.basename(file)===wanted||file.endsWith(path.normalize(target)));
}

function runtimeChainList({entry=ENTRY}={}){
  return [...reachableFiles(entry)].map(file=>path.relative(ROOT,file).replaceAll(path.sep,'/')).sort();
}

if(require.main===module){
  const targets=process.argv.slice(2);
  if(!targets.length){console.log(runtimeChainList().join('\n'));process.exit(0)}
  const missing=targets.filter(t=>!runtimeChainIncludes(t));
  if(missing.length){console.error(`RUNTIME_CHAIN_MISSING=${missing.join(',')}`);process.exit(1)}
  console.log(`RUNTIME_CHAIN_PASS=${targets.join(',')}`);
}

module.exports={runtimeChainIncludes,runtimeChainList,reachableFiles};
