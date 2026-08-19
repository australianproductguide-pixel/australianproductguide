'use strict';

const assert=require('assert');
const analytics=require('../lib/vercel-analytics-v38');

const original=process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
try{
  delete process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  assert.deepStrictEqual(analytics.observabilityConfig(),{});

  const sample='<!doctype html><html><head><title>APG</title></head><body>OK</body></html>';
  const injected=analytics.inject(sample);
  assert(injected.includes('/_vercel/insights/script.js'),'default Vercel Analytics script path missing');
  assert(injected.includes("url.search='';url.hash=''"),'query/hash redaction missing');
  assert(injected.includes("url.pathname==='/my-apg/'"),'private My APG exclusion missing');
  assert.strictEqual((injected.match(/data-sdkn="@vercel\/analytics\/apg-ssr"/g)||[]).length,1,'analytics injected more than once');
  assert.strictEqual(analytics.inject(injected),injected,'analytics injection is not idempotent');

  process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=JSON.stringify({analytics:{
    scriptSrc:'/_vercel/insights/script-abc.js',
    viewEndpoint:'/_vercel/insights/view-abc',
    eventEndpoint:'/_vercel/insights/event-abc'
  }});
  assert.deepStrictEqual(analytics.observabilityConfig(),{
    scriptSrc:'/_vercel/insights/script-abc.js',
    viewEndpoint:'/_vercel/insights/view-abc',
    eventEndpoint:'/_vercel/insights/event-abc'
  });
  const resilient=analytics.analyticsTag();
  assert(resilient.includes('data-view-endpoint="/_vercel/insights/view-abc"'));
  assert(resilient.includes('data-event-endpoint="/_vercel/insights/event-abc"'));

  process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=JSON.stringify({analytics:{scriptSrc:'https://evil.example/script.js'}});
  assert.strictEqual(analytics.observabilityConfig().scriptSrc,'/_vercel/insights/script.js','external script source must be rejected');

  console.log('Vercel Analytics v38 QA passed');
}finally{
  if(original===undefined)delete process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  else process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=original;
}
