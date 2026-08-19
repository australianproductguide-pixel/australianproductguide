'use strict';

const pass6=require('./catalogue-evidence-depth-v49-pass6');
let installed=false;

const aliases={
  'ninja-foodi-max-xxxl-dual-zone-air-fryer-95l':'ninja-foodi-max-xxxl-dual-zone-95l',
  'tefal-easy-fry-grill-and-steam-xxl-fw2018':'tefal-easy-fry-grill-steam-xxl-fw2018'
};

function install(){
  if(installed)return pass6;
  for(const [researchKey,canonicalSlug] of Object.entries(aliases)){
    if(!pass6.records[researchKey])throw new Error(`Pass6 research key missing: ${researchKey}`);
    if(pass6.records[canonicalSlug])throw new Error(`Pass6 canonical slug already exists: ${canonicalSlug}`);
    pass6.records[canonicalSlug]=pass6.records[researchKey];
    delete pass6.records[researchKey];
  }
  installed=true;
  return pass6;
}

module.exports={aliases,install,pass6};
