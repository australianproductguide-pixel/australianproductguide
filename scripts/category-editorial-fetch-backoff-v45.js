'use strict';

// Preload for the v45 research/materialisation jobs. Wikimedia may return 429
// during a 90-category pass; pace requests and honour Retry-After rather than
// dropping licence/provenance checks or switching to an unverified source.
const originalFetch=global.fetch;
let nextAllowedAt=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function retryDelay(response,attempt){
  const raw=response.headers&&response.headers.get&&response.headers.get('retry-after');
  if(raw){
    const seconds=Number(raw);
    if(Number.isFinite(seconds)&&seconds>=0)return Math.min(60000,Math.max(1500,seconds*1000));
    const when=Date.parse(raw);if(Number.isFinite(when))return Math.min(60000,Math.max(1500,when-Date.now()));
  }
  return Math.min(30000,3000*Math.pow(2,attempt));
}

global.fetch=async function pacedFetch(...args){
  const wait=Math.max(0,nextAllowedAt-Date.now());if(wait)await sleep(wait);
  nextAllowedAt=Date.now()+325;
  let last;
  for(let attempt=0;attempt<6;attempt++){
    const response=await originalFetch(...args);last=response;
    if(response.status!==429&&response.status!==502&&response.status!==503&&response.status!==504)return response;
    try{await response.arrayBuffer();}catch{}
    const delay=retryDelay(response,attempt);
    console.warn(`Upstream ${response.status}; retry ${attempt+1}/6 after ${delay}ms`);
    await sleep(delay);
    nextAllowedAt=Date.now()+325;
  }
  return last;
};
