'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/pagespeed-static-delivery-v127-runtime');

const bundleFile=layer.HOME_BUNDLE_FILE;
fs.mkdirSync(path.dirname(bundleFile),{recursive:true});
const previous=fs.existsSync(bundleFile)?fs.readFileSync(bundleFile):null;
try{
  fs.writeFileSync(bundleFile,'/* test bundle */\n'+'.x{display:block}\n'.repeat(180),'utf8');

  const source=`<!doctype html><html><head>
  <link rel="stylesheet" href="/assets/site-optimised.css?scope=core&v=test">
  <link rel="preload" as="style" href="/assets/privacy-experience.css">
  <link rel="stylesheet" href="/assets/privacy-experience.css">
  <link rel="stylesheet" href="/assets/premium-theme-v31.css?v=31">
  <link rel="stylesheet" href="/assets/homepage-situation-images-v70.css?v=72.0">
  <noscript><link rel="stylesheet" href="/assets/privacy-experience.css"></noscript>
  <link rel="stylesheet" href="/assets/desktop-home-header-v126.css?v=126.2">
  <link rel="canonical" href="https://australianproductguide.au/">
  <script type="application/ld+json">{"@type":"WebSite","name":"Australian Product Guide"}</script>
  </head><body>
  <h1>Make a better product decision.</h1>
  <img class="apg-v70-situation-image" src="https://i.ebayimg.com/images/g/example/s-l1600.jpg" data-apg-fallback-src="/category-editorial/robot-vacuums.jpg" onerror="this.onerror=null;this.dataset.apgImageKind='editorial-fallback';this.src=this.dataset.apgFallbackSrc" alt="" loading="lazy" decoding="async">
  </body></html>`;

  const out=layer.transformHtml(source,'/');
  assert.match(out,/site-optimised\.css\?scope=core&v=test[^>]*><link rel="stylesheet" href="\/assets\/pagespeed-home-v127\.css\?v=/);
  assert.ok(out.includes('data-apg-static-critical-css="v127.0"'),'critical bundle marker missing');
  assert.ok(!out.includes('rel="preload" as="style" href="/assets/privacy-experience.css"'),'critical preload was not removed');
  assert.ok(!out.includes('<link rel="stylesheet" href="/assets/privacy-experience.css">\n  <link rel="stylesheet" href="/assets/premium-theme-v31.css?v=31">'),'critical links were not removed');
  assert.ok(out.includes('<noscript><link rel="stylesheet" href="/assets/privacy-experience.css"></noscript>'),'noscript fallback must remain');
  assert.ok(out.includes('homepage-situation-images-v70.css?v=72.0" media="print"'),'below-fold homepage imagery CSS must be nonblocking');
  assert.ok(out.includes('desktop-home-header-v126.css?v=126.2" media="(min-width:981px)"'),'desktop CSS must be media scoped');
  assert.ok(out.includes('src="https://i.ebayimg.com/images/g/example/s-l800.jpg"'),'homepage image must use card-sized default');
  assert.ok(out.includes('s-l500.jpg 500w, https://i.ebayimg.com/images/g/example/s-l800.jpg 800w'),'responsive image candidates missing');
  assert.ok(out.includes('fetchpriority="low"'),'below-fold image priority missing');
  assert.ok(out.includes("removeAttribute(&#39;srcset&#39;)"),'fallback must clear responsive candidates');
  assert.ok(out.includes('<link rel="canonical" href="https://australianproductguide.au/">'),'canonical changed');
  assert.ok(out.includes('"@type":"WebSite"'),'structured data changed');
  assert.ok(out.includes('<h1>Make a better product decision.</h1>'),'consumer content changed');
  assert.ok(out.includes('name="apg-pagespeed-static-delivery" content="v127.0"'),'certification meta missing');

  const nonHome=layer.transformHtml(source,'/categories/robot-vacuums/');
  assert.ok(nonHome.includes('href="/assets/privacy-experience.css"'),'non-home critical CSS must remain unchanged');
  assert.ok(!nonHome.includes('pagespeed-home-v127.css'),'non-home route must not receive homepage bundle');
  assert.ok(nonHome.includes('s-l1600.jpg'),'non-home images must not be rewritten by this homepage release');
  assert.ok(nonHome.includes('desktop-home-header-v126.css?v=126.2" media="(min-width:981px)"'),'desktop-only CSS scoping should apply sitewide');

  assert.equal(layer.ebaySizedUrl('https://i.ebayimg.com/images/g/a/s-l1600.jpg',500),'https://i.ebayimg.com/images/g/a/s-l500.jpg');
  assert.equal(layer.ebaySizedUrl('https://example.com/s-l1600.jpg',500),'');
  assert.equal(layer.HOME_CRITICAL_CSS.length,16);
  assert.ok(layer.readHomeBundle().length>=layer.MIN_BUNDLE_BYTES);
  console.log('PAGESPEED_STATIC_DELIVERY_V127_OK');
}finally{
  if(previous===null)fs.rmSync(bundleFile,{force:true});
  else fs.writeFileSync(bundleFile,previous);
}
