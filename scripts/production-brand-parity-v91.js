'use strict';

const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.BRAND_PARITY_OUT||path.join('artifacts','production-brand-parity-v91');
const CHROME=process.env.CHROME;
const DESKTOP_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36';
const MOBILE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');

fs.mkdirSync(OUT,{recursive:true});

async function asset(slug,ua){
  const url=`${BASE}/assets/brand-marks/${slug}?v=91.0`;
  const response=await fetch(url,{headers:{'user-agent':ua,'cache-control':'no-cache'},redirect:'follow'});
  const buffer=Buffer.from(await response.arrayBuffer());
  const headers={};response.headers.forEach((v,k)=>headers[k.toLowerCase()]=v);
  return {url,status:response.status,buffer,hash:hash(buffer),headers};
}
function assertAssetPair(slug,desktop,mobile){
  assert.equal(desktop.status,200,`${slug} desktop endpoint must return 200`);
  assert.equal(mobile.status,200,`${slug} mobile endpoint must return 200`);
  assert(desktop.buffer.length>100,`${slug} desktop asset must not be empty`);
  assert(mobile.buffer.length>100,`${slug} mobile asset must not be empty`);
  assert.equal(desktop.hash,mobile.hash,`${slug} bytes must be identical for desktop/mobile user agents`);
  assert.equal(desktop.headers['x-apg-brand-mark-canonical-parity'],'v91.0',`${slug} desktop response must expose v91`);
  assert.equal(mobile.headers['x-apg-brand-mark-canonical-parity'],'v91.0',`${slug} mobile response must expose v91`);
  assert((desktop.headers['content-type']||'').includes('svg'),`${slug} must be served as a vector identity`);
  assert((mobile.headers['content-type']||'').includes('svg'),`${slug} mobile must be served as a vector identity`);
}

async function render(browser,name,viewport,userAgent){
  const page=await browser.newPage();
  await page.setViewport(viewport);
  await page.setUserAgent(userAgent);
  const errors=[];
  page.on('pageerror',e=>errors.push(`page:${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console:${m.text()}`);});
  const response=await page.goto(`${BASE}/brands/`,{waitUntil:'domcontentloaded',timeout:60000});
  assert(response&&response.status()===200,`${name} /brands/ must return 200`);
  await page.waitForSelector('[data-apg-brand-name="breville"] img',{timeout:20000});
  await page.waitForSelector('[data-apg-brand-name="amazon"] img',{timeout:20000});
  await page.evaluate(()=>{
    const section=document.querySelector('.apg-brand-featured');
    if(section)section.scrollIntoView({block:'start'});
  });
  await page.waitForFunction(()=>['breville','amazon'].every(slug=>{
    const img=document.querySelector(`[data-apg-brand-name="${slug}"] img`);
    return img&&img.complete&&img.naturalWidth>0&&img.naturalHeight>0;
  }),{timeout:30000});
  const result=await page.evaluate(()=>{
    const read=slug=>{
      const tile=document.querySelector(`[data-apg-brand-name="${slug}"]`);
      const img=tile&&tile.querySelector('img');
      const rect=img&&img.getBoundingClientRect();
      return {
        slug,
        src:img&&img.getAttribute('src'),
        currentSrc:img&&img.currentSrc,
        naturalWidth:img&&img.naturalWidth,
        naturalHeight:img&&img.naturalHeight,
        renderedWidth:rect&&Math.round(rect.width*100)/100,
        renderedHeight:rect&&Math.round(rect.height*100)/100,
        hidden:Boolean(img&&img.hidden),
        tileText:tile&&tile.innerText
      };
    };
    return {
      meta:document.querySelector('meta[name="apg-brand-mark-canonical-parity"]')?.content||'',
      amazon:read('amazon'),
      breville:read('breville'),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth
    };
  });
  for(const item of [result.amazon,result.breville]){
    assert(item.src&&item.src.includes(`/${item.slug}?v=91.0`),`${name} ${item.slug} rendered src must use v91 cache key`);
    assert(item.currentSrc&&item.currentSrc.includes(`/${item.slug}?v=91.0`),`${name} ${item.slug} currentSrc must use v91 cache key`);
    assert(item.naturalWidth>0&&item.naturalHeight>0,`${name} ${item.slug} image must render`);
    assert(!item.hidden,`${name} ${item.slug} image must not fall into browser error state`);
  }
  assert.equal(result.meta,'v91.0',`${name} /brands/ must expose v91 parity meta`);
  assert.equal(result.overflow,false,`${name} /brands/ must not introduce horizontal overflow`);
  assert.equal(errors.length,0,`${name} /brands/ must not emit page/console errors: ${errors.join('; ')}`);
  const featured=await page.$('.apg-brand-featured');
  if(featured)await featured.screenshot({path:path.join(OUT,`${name}-featured-brands.png`)});
  await page.close();
  return result;
}

(async()=>{
  assert(CHROME,'CHROME executable must be provided by Production workflow');
  const [amazonDesktop,amazonMobile,brevilleDesktop,brevilleMobile]=await Promise.all([
    asset('amazon',DESKTOP_UA),asset('amazon',MOBILE_UA),asset('breville',DESKTOP_UA),asset('breville',MOBILE_UA)
  ]);
  assertAssetPair('amazon',amazonDesktop,amazonMobile);
  assertAssetPair('breville',brevilleDesktop,brevilleMobile);
  assert.equal(amazonDesktop.headers['x-apg-brand-mark-source'],'amazon-associates-brand-name-fallback','Amazon must never fall through to a product image/favicon resolver');
  assert.equal(amazonDesktop.headers['x-apg-brand-mark-asset-kind'],'canonical-brand-name','Amazon must use the policy-safe canonical brand-name identity');
  assert.equal(brevilleDesktop.headers['x-apg-brand-mark-source'],'curated-reviewed-vector-override','Breville must use the reviewed vector override');
  assert.equal(brevilleDesktop.headers['x-apg-brand-mark-quality'],'premium-vector','Breville must be premium-vector quality');
  assert.notEqual(amazonDesktop.hash,brevilleDesktop.hash,'Amazon and Breville assets must remain distinct identities');

  const browser=await puppeteer.launch({executablePath:CHROME,headless:true,args:['--no-sandbox','--disable-setuid-sandbox']});
  let desktop,mobile;
  try{
    desktop=await render(browser,'desktop',{width:1440,height:1100,deviceScaleFactor:1},DESKTOP_UA);
    mobile=await render(browser,'mobile',{width:390,height:844,deviceScaleFactor:2},MOBILE_UA);
  }finally{await browser.close();}

  assert.equal(desktop.amazon.src,mobile.amazon.src,'Amazon brand tile must use the same URL across desktop/mobile');
  assert.equal(desktop.breville.src,mobile.breville.src,'Breville brand tile must use the same URL across desktop/mobile');

  const evidence={
    suite:'production-brand-parity-v91',result:'PASS',baseUrl:BASE,
    assets:{
      amazon:{hash:amazonDesktop.hash,source:amazonDesktop.headers['x-apg-brand-mark-source'],kind:amazonDesktop.headers['x-apg-brand-mark-asset-kind'],contentType:amazonDesktop.headers['content-type'],bytes:amazonDesktop.buffer.length},
      breville:{hash:brevilleDesktop.hash,source:brevilleDesktop.headers['x-apg-brand-mark-source'],quality:brevilleDesktop.headers['x-apg-brand-mark-quality'],contentType:brevilleDesktop.headers['content-type'],bytes:brevilleDesktop.buffer.length,dimensions:brevilleDesktop.headers['x-apg-brand-mark-dimensions']||null}
    },
    render:{desktop,mobile}
  };
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(evidence,null,2));
  console.log(`BRAND_MARK_CANONICAL_PARITY_V91_PRODUCTION=PASS viewports=2 amazonHash=${amazonDesktop.hash.slice(0,16)} brevilleHash=${brevilleDesktop.hash.slice(0,16)} breville=${brevilleDesktop.headers['x-apg-brand-mark-quality']} cacheVersion=91.0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
