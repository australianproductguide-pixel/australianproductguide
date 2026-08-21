'use strict';

const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const MIGRATIONS=path.join(ROOT,'supabase','migrations');
const FUNCTIONS=path.join(ROOT,'supabase','functions');
const JS_EXT=new Set(['.js','.cjs','.mjs','.ts']);
const SKIP_DIRS=new Set(['.git','node_modules','.vercel','artifacts']);

function rel(file){return path.relative(ROOT,file).split(path.sep).join('/');}
function walk(dir,out=[]){
  if(!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP_DIRS.has(entry.name))continue;
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
  const files=walk(ROOT).filter(file=>['.js','.cjs','.mjs'].includes(path.extname(file)));
  const graph=new Map(files.map(file=>[file,requires(file)]));
  const seen=new Set(),stack=[entry];
  while(stack.length){const file=stack.pop();if(!file||seen.has(file))continue;seen.add(file);for(const next of graph.get(file)||[])stack.push(next)}
  return seen;
}

// Reconcile historical create/drop migrations into the current intended schema.
// Migration history is preserved; only the final active table set is treated as current.
const migrationFiles=walk(MIGRATIONS).filter(file=>file.endsWith('.sql')).sort((a,b)=>path.basename(a).localeCompare(path.basename(b)));
const historicalTables=new Set(),currentTables=new Set(),retiredTables=new Set();
for(const file of migrationFiles){
  const source=fs.readFileSync(file,'utf8'),events=[];
  const create=/\bcreate\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?(apg_[a-z0-9_]+)/gi;
  const drop=/\bdrop\s+table(?:\s+if\s+exists)?\s+(?:public\.)?(apg_[a-z0-9_]+)/gi;
  for(let m;(m=create.exec(source));)events.push({index:m.index,type:'create',table:m[1]});
  for(let m;(m=drop.exec(source));)events.push({index:m.index,type:'drop',table:m[1]});
  events.sort((a,b)=>a.index-b.index);
  for(const event of events){
    if(event.type==='create'){
      historicalTables.add(event.table);currentTables.add(event.table);retiredTables.delete(event.table);
    }else{
      currentTables.delete(event.table);retiredTables.add(event.table);
    }
  }
}

const apiEntry=path.join(ROOT,'api','index.js');
if(!fs.existsSync(apiEntry))throw new Error('SUPABASE_RUNTIME_MAP_V57 missing api/index.js');
const serverFiles=reachable(apiEntry);
const functionFiles=walk(FUNCTIONS).filter(file=>JS_EXT.has(path.extname(file)));
const inspectFiles=[...new Set([...serverFiles,...functionFiles])];
const refs={};
for(const table of [...historicalTables].sort()){
  refs[table]=inspectFiles.filter(file=>{try{return fs.readFileSync(file,'utf8').includes(table)}catch{return false}}).map(rel).sort();
}
const active=[...currentTables].sort();
const serverReferenced=active.filter(table=>(refs[table]||[]).length);
const unreferenced=active.filter(table=>!(refs[table]||[]).length);
const retiredReferenced=[...retiredTables].sort().filter(table=>(refs[table]||[]).length);
if(retiredReferenced.length)throw new Error('SUPABASE_RUNTIME_MAP_V57 retired tables still referenced: '+retiredReferenced.join(', '));

const report={
  version:'supabase-runtime-map-v57',
  serverGraphFiles:serverFiles.size,
  historicalMigrationTables:[...historicalTables].sort(),
  currentMigrationTables:active,
  retiredByForwardMigration:[...retiredTables].sort(),
  serverOrEdgeReferenced:serverReferenced,
  currentUnreferencedCandidates:unreferenced,
  references:refs
};
console.log('SUPABASE_RUNTIME_MAP_V57=PASS');
console.log(JSON.stringify(report,null,2));
