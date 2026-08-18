const fs=require('fs');
const path=require('path');
const graph=require('../lib/product-intelligence-v41');

const README=path.join(__dirname,'..','README.md');
const START='<!-- APG_CATALOGUE_SNAPSHOT_START -->';
const END='<!-- APG_CATALOGUE_SNAPSHOT_END -->';

function snapshot(){
  const x=graph.graphSummary();
  return {products:Number(x.products),categories:Number(x.categories),brands:Number(x.brands)};
}
function block(x){
  return `${START}\n- **${x.products} maintained products**;\n- **${x.categories} populated categories**;\n- **${x.brands} represented brands**;\n${END}`;
}
function read(){return fs.readFileSync(README,'utf8');}
function expected(){return block(snapshot());}
function check(){
  const text=read(),want=expected();
  if(!text.includes(START)||!text.includes(END))throw new Error('README catalogue snapshot markers are missing');
  const from=text.indexOf(START),to=text.indexOf(END,from)+END.length;
  const actual=text.slice(from,to);
  if(actual!==want)throw new Error(`README catalogue snapshot drifted. Expected:\n${want}\nActual:\n${actual}`);
  return snapshot();
}
function write(){
  let text=read(),want=expected();
  if(text.includes(START)&&text.includes(END)){
    const from=text.indexOf(START),to=text.indexOf(END,from)+END.length;
    text=text.slice(0,from)+want+text.slice(to);
  }else{
    throw new Error('README catalogue snapshot markers are missing; add them deliberately before using --write');
  }
  fs.writeFileSync(README,text);
  return snapshot();
}

try{
  const result=process.argv.includes('--write')?write():check();
  console.log(`CATALOGUE_DOCS_RECONCILIATION=PASS products=${result.products} categories=${result.categories} brands=${result.brands}`);
}catch(err){console.error(err.message);process.exit(1)}
