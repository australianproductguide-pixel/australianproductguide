'use strict';
const pass10=require('./catalogue-evidence-depth-v49-pass10');
const aliases={
  'crucial-x9-pro-portable-ssd-1tb':'crucial-x9-pro-1tb',
  'samsung-t7-shield-portable-ssd':'samsung-t7-shield-1tb',
  'sandisk-extreme-portable-ssd':'sandisk-extreme-portable-ssd-1tb',
  'samsung-t9-portable-ssd':'samsung-t9-portable-ssd-1tb',
  'crucial-x10-pro-portable-ssd':'crucial-x10-pro-1tb',
  'logitech-c920s-hd-pro-webcam':'logitech-c920s-hd-pro',
  'logitech-brio-4k-webcam':'logitech-brio-4k',
  'elgato-facecam-mk-2':'elgato-facecam-mk2',
  'logitech-mx-brio-4k-webcam':'logitech-mx-brio',
  'r-de-podmic-usb':'rode-podmic-usb',
  'r-de-nt-usb':'rode-nt-usb'
};
let installed=false;
function install(){
  if(installed)return{installed:true,aliases};
  for(const [canonical,researchKey] of Object.entries(aliases)){
    if(!pass10.records[canonical]&&pass10.records[researchKey])pass10.records[canonical]=pass10.records[researchKey];
    if(canonical!==researchKey)delete pass10.records[researchKey];
  }
  installed=true;
  return{installed:true,aliases};
}
module.exports={aliases,install};
