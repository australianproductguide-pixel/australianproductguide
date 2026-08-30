'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const client=require('../lib/ebay-impact-api-v1');

const sourcePath=path.join(__dirname,'..','lib','ebay-impact-api-v1.js');
const source=fs.readFileSync(sourcePath,'utf8');

function check(name,fn){
  try{fn();console.log(`PASS ${name}`);}
  catch(error){console.error(`FAIL ${name}: ${error.message}`);process.exitCode=1;}
}
async function checkAsync(name,fn){
  try{await fn();console.log(`PASS ${name}`);}
  catch(error){console.error(`FAIL ${name}: ${error.message}`);process.exitCode=1;}
}

check('credentials are environment-only',()=>{
  assert(source.includes("authToken:'EBAY_EPN_AUTH_TOKEN'"));
  assert(source.includes("accountSid:'EBAY_EPN_ACCOUNT_SID'"));
  assert(!/EBAY_EPN_AUTH_TOKEN\s*=\s*['\"][^'\"]+/.test(source));
  assert(!/EBAY_EPN_ACCOUNT_SID\s*=\s*['\"][^'\"]+/.test(source));
});

check('diagnostics never expose credential values',()=>{
  const fakeEnv={EBAY_EPN_ACCOUNT_SID:'IR_TEST_ACCOUNT_123',EBAY_EPN_AUTH_TOKEN:'fake-secret-token-for-qa',EBAY_EPN_API_VERSION:'16'};
  const output=JSON.stringify(client.diagnostics(fakeEnv));
  assert(!output.includes(fakeEnv.EBAY_EPN_ACCOUNT_SID));
  assert(!output.includes(fakeEnv.EBAY_EPN_AUTH_TOKEN));
  assert.strictEqual(client.diagnostics(fakeEnv).configured,true);
});

check('affiliate data is non-ranking by contract',()=>{
  assert(source.includes('recommendationWeight:0'));
  const row=client.safeProductProjection({Id:'p1',Name:'Example',ImageUrl:'https://example.invalid/p.jpg'});
  assert.strictEqual(row.recommendationWeight,0);
  assert.strictEqual(row.exactModel,false);
});

check('catalog product projection preserves evidence fields',()=>{
  const row=client.safeProductProjection({
    Id:'product_1',CatalogId:'10',CampaignId:'20',CatalogItemId:'30',Name:'Example product',
    Manufacturer:'Example',ImageUrl:'https://example.invalid/main.jpg',
    AdditionalImageUrls:['https://example.invalid/2.jpg'],CurrentPrice:'199.00',Currency:'AUD',
    StockAvailability:'InStock',Gtin:'0123456789012',GtinType:'EAN',Mpn:'MODEL-1',Condition:'New'
  });
  assert.strictEqual(row.imageUrl,'https://example.invalid/main.jpg');
  assert.deepStrictEqual(row.additionalImageUrls,['https://example.invalid/2.jpg']);
  assert.strictEqual(row.gtin,'0123456789012');
  assert.strictEqual(row.mpn,'MODEL-1');
  assert.strictEqual(row.currency,'AUD');
});

check('tracking deep links are restricted to HTTPS eBay Australia',()=>{
  assert.strictEqual(new URL(client.ebayAuDeepLink('https://www.ebay.com.au/itm/123')).hostname,'www.ebay.com.au');
  assert.throws(()=>client.ebayAuDeepLink('http://www.ebay.com.au/itm/123'));
  assert.throws(()=>client.ebayAuDeepLink('https://ebay.com.au.example.com/itm/123'));
  assert.throws(()=>client.ebayAuDeepLink('https://example.com/'));
});

check('server client blocks broad write operations',()=>{
  assert(source.includes("Only GET and governed tracking-link POST requests are supported"));
  assert(source.includes("POST is restricted to impact.com tracking-link creation"));
  assert(!/method\s*:\s*['\"](?:PUT|PATCH|DELETE)['\"]/i.test(source));
});

check('network controls are explicit',()=>{
  assert(source.includes("const API_ORIGIN='https://api.impact.com'"));
  assert(source.includes("redirect:'error'"));
  assert(source.includes('AbortController'));
});

(async()=>{
  const originalFetch=global.fetch;
  try{
    await checkAsync('catalog request uses Basic auth without leaking secret into URL',async()=>{
      const fakeEnv={EBAY_EPN_ACCOUNT_SID:'IR_TEST_ACCOUNT_123',EBAY_EPN_AUTH_TOKEN:'fake-secret-token-for-qa',EBAY_EPN_API_VERSION:'16'};
      let captured=null;
      global.fetch=async(url,init)=>{
        captured={url:String(url),init};
        return {ok:true,status:200,text:async()=>JSON.stringify({Catalogs:[]})};
      };
      await client.listCatalogs({PageSize:10},{env:fakeEnv});
      assert(captured);
      assert(captured.url.startsWith('https://api.impact.com/Mediapartners/IR_TEST_ACCOUNT_123/Catalogs'));
      assert(captured.url.includes('PageSize=10'));
      assert(!captured.url.includes(fakeEnv.EBAY_EPN_AUTH_TOKEN));
      assert(captured.init.headers.Authorization.startsWith('Basic '));
      assert(!captured.init.headers.Authorization.includes(fakeEnv.EBAY_EPN_AUTH_TOKEN));
    });

    await checkAsync('tracking-link creation is eBay-AU-bound and POST-only',async()=>{
      const fakeEnv={EBAY_EPN_ACCOUNT_SID:'IR_TEST_ACCOUNT_123',EBAY_EPN_AUTH_TOKEN:'fake-secret-token-for-qa'};
      let captured=null;
      global.fetch=async(url,init)=>{
        captured={url:String(url),init};
        return {ok:true,status:200,text:async()=>JSON.stringify({TrackingURL:'https://example.sjv.io/c/test'})};
      };
      const result=await client.createTrackingLink('12345',{deepLink:'https://www.ebay.com.au/itm/123',subId1:'apg-product-1'},{env:fakeEnv});
      assert.strictEqual(captured.init.method,'POST');
      assert(captured.url.includes('/Programs/12345/TrackingLinks'));
      assert(captured.url.includes('DeepLink=https%3A%2F%2Fwww.ebay.com.au%2Fitm%2F123'));
      assert.strictEqual(result.TrackingURL,'https://example.sjv.io/c/test');
    });
  }finally{
    global.fetch=originalFetch;
  }

  if(process.exitCode)process.exit(process.exitCode);
  console.log('eBay Impact API v1 QA complete');
})();
