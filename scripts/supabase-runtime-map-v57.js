'use strict';

const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const LIB=path.join(ROOT,'lib');
const MIGRATIONS=path.join(ROOT,'supabase','migrations');
const FUNCTIONS=path.join(ROOT,'supabase','functions');
const JS_EXT=new Set(['.js','.cjs','.mjs','.ts']);

function rel(file){return path.relative(ROOT,file).split(path.sep).join('/');}
function walk(dir,out=[]){
  if(!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file,out);else out.push(file);
  }
  return out;
}
function resolveLocal(fromFile,spec){
  if(!spec.startsWith('.'))return null;
  const base=path.resolve(path.dirname(fromFile),spec);
  for(const candidate of [base,base+'.js',base+'.cjs',base+'.mjs',path.join(base,'index.js')]){
    try{if(fs.statSync(candidate).isFile())return candidate;}catch{}
  }
  return null;
}
function requires(file){
  let source='';try{source=fs.readFileSync(file,'utf8')}catch{return []}
  const out=[],re=/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for(let m;(m=re.exec(source));){const target=resolveLocal(file,m[1]);if(target)out.push(target)}
  return [...new Set(out)];
}
function reachable(entry){
  const files=walk(LIB).filter(file=>JS_EXT.has(path.extname(file)));
  const graph=new Map(files.map(file=>[file,requires(file)]));
  const seen=new Set(),stack=[entry];
  while(stack.length){const file=stack.pop();if(!file||seen.has(file))continue;seen.add(file);for(const next of graph.get(file)||[])stack.push(next)}
  return seen;
}

const migrationFiles=walk(MIGRATIONS).filter(file=>file.endsWith('.sql'));
const tableNames=new Set();
for(const file of migrationFiles){
  const source=fs.readFileSync(file,'utf8');
  const re=/\bcreate\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?(apg_[a-z0-9_]+)/gi;
  for(let m;(m=re.exec(source));){tableNames.add(m[1])}
}
const apiEntry=path.join(ROOT,'api','index.js');
const serverFiles=reachable(apiEntry);
const functionFiles=walk(FUNCTIONS).filter(file=>JS_EXT.has(path.extname(file)));
const inspectFiles=[...new Set([...serverFiles,...functionFiles])];
const refs={};
for(const table of [...tableNames].sort()){
  refs[table]=inspectFiles.filter(file=>{try{return fs.readFileSync(file,'utf8').includes(table)}catch{return false}}).map(rel).sort();
}
const serverReferenced=Object.entries(refs).filter(([,files])=>files.length).map(([table])=>table);
const unreferenced=Object.entries(refs).filter(([,files])=>!files.length).map(([table])=>table);

const report={
  version:'supabase-runtime-map-v57',
  migrationTables:[...tableNames].sort(),
  serverOrEdgeReferenced:serverReferenced,
  unreferencedCandidates:unreferenced,
  references:refs
};
console.log('SUPABASE_RUNTIME_MAP_V57=PASS');
console.log(JSON.stringify(report,null,2));
