'use strict';
const {spawnSync}=require('child_process');
const path=require('path');

const files=[
  'lib/scout-concierge-v5-core.js',
  'lib/scout-concierge-v5-client.js',
  'lib/scout-concierge-v5-brand.js',
  'lib/scout-amazon-v5.js',
  'lib/scout-session-guard-v5.js',
  'lib/scout-health-v5.js',
  'lib/scout-concierge-v5.js',
  'lib/scout-concierge-v5-runtime.js',
  'api/index.js',
  'scripts/scout-concierge-v5-qa.js',
  'scripts/scout-amazon-v5-qa.js'
];

for(const relative of files){
  const absolute=path.join(__dirname,'..',relative);
  const result=spawnSync(process.execPath,['--check',absolute],{encoding:'utf8'});
  if(result.status!==0){
    process.stderr.write('Syntax check failed: '+relative+'\n'+(result.stderr||result.stdout||''));
    process.exit(result.status||1);
  }
}

try{
  const runtime=require('../lib/scout-concierge-v5-runtime');
  if(typeof runtime!=='function'||!runtime.core||!runtime.health)throw new Error('Scout v5 runtime exports are incomplete.');
}catch(error){
  console.error('Scout v5 module-load smoke check failed:',error&&error.stack||error);
  process.exit(1);
}

console.log('APG Scout v5 syntax and module-load gate passed for '+files.length+' files');
