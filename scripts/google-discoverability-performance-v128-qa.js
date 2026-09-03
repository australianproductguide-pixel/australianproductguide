'use strict';

const assert=require('node:assert/strict');
const layer=require('../lib/google-discoverability-performance-v128-runtime');

function response(resolve){
  const headers=new Map();
  return {
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),String(value));},
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){headers.delete(String(name).toLowerCase());},
    end(body){resolve({statusCode:this.statusCode,headers,body:Buffer.isBuffer(body)?body.toString('utf8'):String(body||'')});}
  };
}
function invoke(handler,url,method='GET'){
  return new Promise((resolve,reject)=>{
    try{handler({url,method},response(resolve));}catch(error){reject(error);}
  });
}

async function main(){
  assert.equal(layer.VERSION,'128.2');
  assert.equal(layer.STYLE_REPLACEMENTS.length,4);

  const html='<!doctype html><html><head>'+
    '<link rel="canonical" href="https://australianproductguide.au/">'+
    '<script type="application/ld+json">{"@type":"WebSite"}</script>'+
    '<link rel="stylesheet" href="/assets/privacy-experience.css">'+
    '<link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2">'+
    '<link rel="stylesheet" href="/assets/desktop-about-trust-contrast-v127.css?v=127.0">'+
    '<link rel="stylesheet" href="/assets/mobile-header-wordmark-v75.css?v=75.0">'+
    '<link rel="stylesheet" href="/assets/mobile-menu-polish-v21.css?v=21">'+
    '</head><body><form role="search" aria-label="Search Australian products"></form>'+
    '<img src="https://i.ebayimg.com/images/g/example/s-l1600.jpg" alt="Governed product" loading="lazy">'+
    '</body></html>';

  const transformed=layer.transformHtml(html);
  assert.match(transformed,/desktop-home-header-v126\.css\?v=126\.2" media="\(min-width:981px\)"/);
  assert.match(transformed,/desktop-about-trust-contrast-v127\.css\?v=127\.0" media="\(min-width:921px\)"/);
  assert.match(transformed,/mobile-header-wordmark-v75\.css\?v=75\.0" media="\(max-width:920px\)"/);
  assert.match(transformed,/mobile-menu-polish-v21\.css\?v=21" media="\(max-width:920px\)"/);
  assert.match(transformed,/privacy-experience\.css">/);
  assert.doesNotMatch(transformed,/privacy-experience\.css" media=/);
  assert.match(transformed,/rel="canonical"/);
  assert.match(transformed,/application\/ld\+json/);
  assert.match(transformed,/role="search" aria-label="Search Australian products"/);
  assert.match(transformed,/s-l1600\.jpg/,'governed image URLs must remain unchanged');
  assert.equal((transformed.match(/apg-google-discoverability-performance/g)||[]).length,1);
  assert.equal(layer.transformHtml(transformed),transformed,'HTML transform must be idempotent');

  assert.equal(layer.redirectTarget(layer.LEGACY_PRODUCT),layer.CANONICAL_PRODUCT);
  assert.equal(layer.redirectTarget(layer.LEGACY_COMPARISON),layer.CANONICAL_COMPARISON);
  assert.equal(layer.redirectTarget('/products/unrelated/'),'');

  let downstreamCalls=0;
  const redirecting=layer.wrap((req,res)=>{downstreamCalls+=1;res.end('downstream');});
  const product=await invoke(redirecting,layer.LEGACY_PRODUCT+'?source=gsc');
  assert.equal(product.statusCode,308);
  assert.equal(product.headers.get('location'),layer.CANONICAL_PRODUCT,'legacy query data must not enter Location');
  assert.equal(product.headers.get('cache-control'),'public, max-age=86400, s-maxage=31536000');
  assert.equal(product.headers.get('content-type'),'text/plain; charset=utf-8');
  assert.equal(product.body,'Permanent redirect','redirect body must not reflect request data');
  assert.equal(downstreamCalls,0);

  const comparison=await invoke(redirecting,layer.LEGACY_COMPARISON+'?q=%3Cscript%3E','HEAD');
  assert.equal(comparison.statusCode,308);
  assert.equal(comparison.headers.get('location'),layer.CANONICAL_COMPARISON);
  assert.equal(comparison.body,'');
  assert.equal(downstreamCalls,0);

  const rendering=layer.wrap((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(html)));
    res.end(html);
  });
  const rendered=await invoke(rendering,'/');
  assert.match(rendered.body,/name="apg-google-discoverability-performance" content="v128\.2"/);
  assert.equal(rendered.headers.get('content-length'),undefined);
  assert.equal(rendered.headers.get('x-apg-google-discoverability-performance'),'v128.2');

  const asset=layer.wrap((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/css; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
    res.end('body{}');
  });
  const versioned=await invoke(asset,'/assets/desktop-about-trust-contrast-v127.css?v=127.0');
  assert.equal(versioned.headers.get('cache-control'),'public, max-age=31536000, immutable');
  const unversioned=await invoke(asset,'/assets/privacy-experience.css');
  assert.equal(unversioned.headers.get('cache-control'),'public, max-age=0, must-revalidate');

  console.log(JSON.stringify({
    status:'PASS',version:layer.VERSION,
    safeBaseline:{viewportScopedStyles:4,versionedAssetCaching:true,legacyAliasRedirects:2},
    protected:{privacyCssBlocking:true,canonical:true,structuredData:true,agenticSearchAffordance:true,governedImageUrlsUnchanged:true},
    security:{redirectQueryDiscarded:true,redirectBodyStatic:true}
  },null,2));
}

main().catch(error=>{console.error(error);process.exitCode=1;});
