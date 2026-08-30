'use strict';

const client=require('../lib/ebay-browse-api-v1');

(async()=>{
  if(process.env.VERCEL_ENV!=='preview'){
    console.log('EBAY_BROWSE_SANDBOX_VALIDATION=SKIP_NON_PREVIEW');
    return;
  }
  if(String(process.env.EBAY_BROWSE_ENVIRONMENT||'').trim().toLowerCase()!=='sandbox'){
    console.log('EBAY_BROWSE_SANDBOX_VALIDATION=SKIP_NON_SANDBOX');
    return;
  }

  const d=client.diagnostics();
  if(!d.clientIdConfigured||!d.clientSecretConfigured){
    throw new Error('EBAY_BROWSE_SANDBOX_VALIDATION_FAILED missing server-side credentials');
  }

  const token=await client.getApplicationToken();
  if(!token)throw new Error('EBAY_BROWSE_SANDBOX_VALIDATION_FAILED OAuth token absent');
  console.log(`EBAY_BROWSE_OAUTH_SANDBOX=PASS marketplace=${d.marketplaceId} secretOutput=REDACTED recommendationWeight=0`);

  const result=await client.searchItems({q:'drone',limit:1});
  const items=Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[];
  const first=items[0]||null;
  console.log(`EBAY_BROWSE_SEARCH_SANDBOX=PASS total=${Number.isFinite(Number(result&&result.total))?Number(result.total):'unknown'} sample=${first?'present':'none'} image=${Boolean(first&&first.image&&first.image.imageUrl)} price=${Boolean(first&&first.price&&first.price.value)} recommendationWeight=0`);
})().catch(error=>{
  const code=error&&error.code?String(error.code):'ERROR';
  const status=error&&Number.isFinite(Number(error.status))?Number(error.status):'none';
  console.error(`EBAY_BROWSE_SANDBOX_VALIDATION=FAIL code=${code} status=${status}`);
  process.exit(1);
});
