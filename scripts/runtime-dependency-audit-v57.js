'use strict';

const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'..');
const SKIP_DIRS=new Set(['.git','node_modules','.vercel']);
const TEXT_EXTENSIONS=new Set(['.js','.cjs','.mjs','.json','.yml','.yaml','.md']);

function rel(file){return path.relative(ROOT,file).split(path.sep).join('/');}
function walk(dir,out=[]){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(SKIP_DIRS.has(entry.name))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file,out);
    else out.push(file);
  }
  return out;
}
function resolveLocal(fromFile,spec){
  if(!spec.startsWith('.'))return null;
  const base=path.resolve(path.dirname(fromFile),spec);
  const candidates=[base,base+'.js',base+'.cjs',base+'.mjs',path.join(base,'index.js')];
  for(const candidate of candidates){
    try{if(fs.statSync(candidate).isFile())return candidate;}catch{}
  }
  return null;
}
function localRequires(file){
  let source='';try{source=fs.readFileSync(file,'utf8')}catch{return []}
  const found=[];
  const re=/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for(let m;(m=re.exec(source));){const target=resolveLocal(file,m[1]);if(target)found.push(target)}
  return [...new Set(found)];
}
function reachable(entries,graph){
  const seen=new Set(),stack=[...entries];
  while(stack.length){const file=stack.pop();if(!file||seen.has(file))continue;seen.add(file);for(const next of graph.get(file)||[])stack.push(next)}
  return seen;
}
function countByPrefix(files){
  const counts={};
  for(const file of files){const first=rel(file).split('/')[0]||'(root)';counts[first]=(counts[first]||0)+1}
  return counts;
}

const files=walk(ROOT);
const jsFiles=files.filter(file=>['.js','.cjs','.mjs'].includes(path.extname(file)));
const graph=new Map(jsFiles.map(file=>[file,localRequires(file)]));
const apiEntry=path.join(ROOT,'api','index.js');
if(!fs.existsSync(apiEntry))throw new Error('RUNTIME_DEPENDENCY_AUDIT_V57 missing api/index.js');

const serverReach=reachable([apiEntry],graph);
const scriptEntries=jsFiles.filter(file=>rel(file).startsWith('scripts/'));
const toolReach=reachable(scriptEntries,graph);
const libFiles=jsFiles.filter(file=>rel(file).startsWith('lib/'));
const serverLib=libFiles.filter(file=>serverReach.has(file));
const toolOnlyLib=libFiles.filter(file=>!serverReach.has(file)&&toolReach.has(file));
const unreferencedLib=libFiles.filter(file=>!serverReach.has(file)&&!toolReach.has(file));

// Static textual references are a second safety signal. A module that is not in
// the static require graph can still be intentionally named by a workflow,
// manifest or generated-asset contract, so it must not be auto-deleted merely
// because it is unreachable from api/index.js.
const textFiles=files.filter(file=>TEXT_EXTENSIONS.has(path.extname(file)));
const textCache=new Map();
for(const file of textFiles){try{textCache.set(file,fs.readFileSync(file,'utf8'))}catch{}}
function externalRefs(target){
  const targetRel=rel(target),base=path.basename(target),stem=base.replace(/\.(?:js|cjs|mjs)$/,'');
  const hits=[];
  for(const [file,source] of textCache){
    if(file===target)continue;
    if(source.includes(targetRel)||source.includes(base)||source.includes(stem))hits.push(rel(file));
  }
  return hits;
}
const unreferencedCandidates=unreferencedLib.map(file=>({file:rel(file),textReferences:externalRefs(file)}));
const zeroReferenceCandidates=unreferencedCandidates.filter(row=>row.textReferences.length===0);

const report={
  version:'runtime-dependency-audit-v57',
  entry:'api/index.js',
  totals:{allFiles:files.length,javascriptFiles:jsFiles.length,libJavascriptFiles:libFiles.length,serverReachableLibFiles:serverLib.length,qaOrDevelopmentOnlyLibFiles:toolOnlyLib.length,unreferencedLibCandidates:unreferencedLib.length,zeroTextReferenceLibCandidates:zeroReferenceCandidates.length},
  serverReachableByTopLevel:countByPrefix([...serverReach]),
  qaOrDevelopmentOnlyLibFiles:toolOnlyLib.map(rel).sort(),
  unreferencedLibCandidates:unreferencedCandidates.sort((a,b)=>a.file.localeCompare(b.file)),
  zeroTextReferenceLibCandidates:zeroReferenceCandidates.map(row=>row.file).sort()
};

console.log('RUNTIME_DEPENDENCY_AUDIT_V57=PASS');
console.log(JSON.stringify(report,null,2));
