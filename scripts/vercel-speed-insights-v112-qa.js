'use strict';

const assert=require('assert');
const speedInsights=require('../lib/vercel-speed-insights-v112-runtime');

const originalConfig=process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;

try{
  delete process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  const tag=speedInsights.speedInsightsTag();
  assert(tag.includes('window.si=window.si||function()'),'Speed Insights queue bootstrap missing');
  assert(tag.includes('/_vercel/speed-insights/script.js'),'Default Speed Insights script missing');
  assert(tag.includes('data-sdkn="@vercel/speed-insights/apg-ssr"'),'SDK marker missing');

  const html='<!doctype html><html><head><title>APG</title></head><body>OK</body></html>';
  const injected=speedInsights.inject(html);
  assert(injected.includes('/_vercel/speed-insights/script.js'),'Speed Insights not injected into HTML');
  assert.strictEqual(speedInsights.inject(injected),injected,'Injection must be idempotent');
  assert.strictEqual(speedInsights.inject('<html><body>no head</body></html>'),'<html><body>no head</body></html>','Malformed/non-head HTML must remain unchanged');

  process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=JSON.stringify({
    speedInsights:{
      scriptSrc:'/abc123/script.js',
      endpoint:'/abc123/vitals'
    }
  });
  const configured=speedInsights.speedInsightsTag();
  assert(configured.includes('src="/abc123/script.js"'),'Dynamic Vercel scriptSrc not honoured');
  assert(configured.includes('data-endpoint="/abc123/vitals"'),'Dynamic Vercel endpoint not honoured');

  process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=JSON.stringify({speedInsights:{scriptSrc:'javascript:alert(1)'}});
  assert(speedInsights.speedInsightsTag().includes('/_vercel/speed-insights/script.js'),'Unsafe scriptSrc must fail closed');

  console.log('Vercel Speed Insights v112 QA passed');
} finally {
  if(originalConfig===undefined)delete process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG;
  else process.env.VERCEL_OBSERVABILITY_CLIENT_CONFIG=originalConfig;
}
