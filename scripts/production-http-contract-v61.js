#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.BASE_URL || 'https://australianproductguide.au').replace(/\/$/, '');
const EXPECTED_SHA = (process.env.APG_EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
const EXPECTED_SHORT = EXPECTED_SHA ? EXPECTED_SHA.slice(0, 16) : '';
const SUITE = 'production-http-contract-v61';
const OUT_DIR = process.env.HTTP_CONTRACT_OUT || 'artifacts/production-http-contract-v61';
const startedAt = new Date().toISOString();
const results = [];

fs.mkdirSync(OUT_DIR, { recursive: true });

function excerpt(value, max = 260) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function record(id, route, expected, actual, ok, extra = {}) {
  const row = {
    id,
    route,
    expected,
    actual,
    ok: Boolean(ok),
    failureClass: ok ? null : (extra.failureClass || 'assertion'),
    ...extra,
  };
  results.push(row);
  const prefix = ok ? 'PASS' : 'FAIL';
  console.log(`${prefix} ${id} route=${route} expected=${expected} actual=${excerpt(actual, 180)}`);
}

async function request(route, options = {}) {
  const url = route.startsWith('http') ? route : `${BASE_URL}${route}`;
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(Number(process.env.APG_HTTP_TIMEOUT_MS || 30000)),
      headers: {
        'user-agent': 'APGProductionVerification/61',
        'accept-language': 'en-AU,en;q=0.9',
        ...(options.headers || {}),
      },
      ...options,
    });
    const body = await response.text();
    return {
      ok: true,
      url,
      finalUrl: response.url,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      url,
      finalUrl: null,
      status: null,
      headers: {},
      body: '',
      ms: Date.now() - started,
      error: error?.message || String(error),
    };
  }
}

function assertTransport(id, route, response) {
  if (!response.ok) {
    record(id, route, 'successful network request', response.error, false, {
      failureClass: 'network',
      status: response.status,
      finalUrl: response.finalUrl,
      ms: response.ms,
    });
    return false;
  }
  return true;
}

function assertStatus(id, route, response, expectedStatus = 200) {
  if (!assertTransport(`${id}.transport`, route, response)) return false;
  const ok = response.status === expectedStatus;
  record(`${id}.status`, route, `HTTP ${expectedStatus}`, `HTTP ${response.status}`, ok, {
    failureClass: ok ? null : 'http',
    status: response.status,
    finalUrl: response.finalUrl,
    ms: response.ms,
    excerpt: ok ? undefined : excerpt(response.body),
  });
  return ok;
}

function assertIncludes(id, route, response, needle, description) {
  const ok = response.body.includes(needle);
  record(id, route, description, ok ? 'present' : `missing; body=${excerpt(response.body)}`, ok, {
    status: response.status,
    finalUrl: response.finalUrl,
    ms: response.ms,
  });
  return ok;
}

function parseJson(id, route, response) {
  try {
    return JSON.parse(response.body);
  } catch (error) {
    record(id, route, 'valid JSON', `invalid JSON: ${error.message}; body=${excerpt(response.body)}`, false, {
      failureClass: 'data',
      status: response.status,
      finalUrl: response.finalUrl,
      ms: response.ms,
    });
    return null;
  }
}

async function checkHtmlRoute(route, id) {
  const r = await request(route, { headers: { accept: 'text/html' } });
  if (!assertStatus(id, route, r, 200)) return r;
  const type = r.headers['content-type'] || '';
  record(`${id}.content-type`, route, 'text/html response', type, /text\/html/i.test(type), {
    status: r.status,
    finalUrl: r.finalUrl,
    ms: r.ms,
  });
  assertIncludes(`${id}.document`, route, r, '<!doctype html', 'HTML document shell');
  return r;
}

async function checkSearch(name, query, predicate, expectedDescription) {
  const route = `/search/?q=${encodeURIComponent(query)}`;
  const r = await request(route, { headers: { accept: 'text/html' } });
  if (!assertStatus(`search.${name}`, route, r, 200)) return;
  const productLinks = [...r.body.matchAll(/href=["']\/products\/([^"'?/]+)\/?["'?]/gi)].map(m => m[1]);
  const semantic = {
    zeroState: /class=["'][^"']*zero-state/i.test(r.body),
    productLinks: [...new Set(productLinks)],
    canonicalSearch: /<link rel=["']canonical["'] href=["']https:\/\/australianproductguide\.au\/search\/["']/i.test(r.body),
  };
  let ok = false;
  try { ok = Boolean(predicate(semantic, r.body)); } catch { ok = false; }
  record(`search.${name}.outcome`, route, expectedDescription, JSON.stringify({ zeroState: semantic.zeroState, productLinks: semantic.productLinks.slice(0, 8) }), ok, {
    failureClass: 'data',
    status: r.status,
    finalUrl: r.finalUrl,
    ms: r.ms,
  });
}
async function main() {
  console.log(`APG_HTTP_CONTRACT suite=${SUITE} base=${BASE_URL} expectedSha=${EXPECTED_SHA || 'not-supplied'}`);

  const home = await checkHtmlRoute('/', 'home');
  if (home?.status === 200) {
    const canonical = '<link rel="canonical" href="https://australianproductguide.au/"';
    record('home.canonical', '/', canonical, home.body.includes(canonical) ? 'present' : 'missing', home.body.includes(canonical), {
      status: home.status,
      finalUrl: home.finalUrl,
      ms: home.ms,
    });
    if (EXPECTED_SHORT) {
      record('home.release-marker', '/', `v=${EXPECTED_SHORT}`, home.body.includes(`v=${EXPECTED_SHORT}`) ? 'present' : 'missing', home.body.includes(`v=${EXPECTED_SHORT}`), {
        status: home.status,
        finalUrl: home.finalUrl,
        ms: home.ms,
      });
    }
  }

  for (const [id, route] of [
    ['route.search', '/search/'],
    ['route.decision-lab', '/decision-lab/'],
    ['route.category', '/categories/smartphones/'],
    ['route.product', '/products/oppo-find-x9/'],
    ['route.compare', '/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26'],
    ['route.my-apg', '/my-apg/'],
    ['trust.about', '/about/'],
    ['trust.methodology', '/methodology/'],
    ['trust.sources', '/sources/'],
    ['trust.corrections', '/corrections-policy/'],
    ['trust.affiliate', '/affiliate-disclosure/'],
    ['trust.privacy', '/privacy/'],
    ['trust.terms', '/terms/'],
  ]) await checkHtmlRoute(route, id);

  await checkSearch('exact-product', 'Sony WH-1000XM6', s => s.productLinks.includes('sony-wh-1000xm6'), 'maintained Sony WH-1000XM6 product link');
  await checkSearch('brand', 'Sony', s => s.productLinks.length > 0 && !s.zeroState, 'one or more maintained brand candidates');
  await checkSearch('category', 'wireless headphones', s => s.productLinks.length > 0 && !s.zeroState, 'one or more maintained category candidates');
  await checkSearch('natural-language', 'quiet headphones for commuting', s => s.productLinks.length > 0 && !s.zeroState, 'one or more maintained use-case candidates');
  await checkSearch('typo', 'headphonez', s => s.productLinks.length > 0 && !s.zeroState, 'one or more typo-recovered headphone candidates');
  await checkSearch('budget-use-case', 'headphones under $500 for commuting', s => s.productLinks.length > 0 && !s.zeroState, 'one or more budget/use-case candidates');
  await checkSearch('no-result', 'qwertyxyznonsense', s => s.zeroState && s.productLinks.length === 0, 'semantic zero-state with zero maintained product links');

  const comparison = await request('/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26');
  if (assertStatus('compare', '/compare/custom/', comparison, 200)) {
    assertIncludes('compare.oppo', '/compare/custom/', comparison, 'data-compare-product="oppo-find-x9"', 'semantic OPPO comparison entity');
    assertIncludes('compare.samsung', '/compare/custom/', comparison, 'data-compare-product="samsung-galaxy-s26"', 'semantic Samsung comparison entity');
  }

  const decisionLab = await request('/decision-lab/?q=headphones%20under%20%24500%20for%20commuting');
  if (assertStatus('decision-lab', '/decision-lab/', decisionLab, 200)) {
    assertIncludes('decision-lab.v4', '/decision-lab/', decisionLab, 'data-decision-v4="true"', 'Decision Lab v4 semantic marker');
    assertIncludes('decision-lab.results', '/decision-lab/', decisionLab, 'class="decision-results"', 'server-rendered decision results');
    assertIncludes('decision-lab.action', '/decision-lab/', decisionLab, 'data-affiliate-placement="decision_lab_result"', 'recommendation product action');
  }

  const decision = await request('/api/decision?q=quiet%20headphones%20for%20commuting', { headers: { accept: 'application/json' } });
  if (assertStatus('decision-api', '/api/decision', decision, 200)) {
    const json = parseJson('decision-api.json', '/api/decision', decision);
    if (json) {
      record('decision-api.version', '/api/decision', 'decision-engine-v4', json.version, json.version === 'decision-engine-v4', { failureClass: 'data', status: decision.status, ms: decision.ms });
      record('decision-api.neutrality', '/api/decision', 'commercialRecommendationWeight=0', String(json.commercialRecommendationWeight), Number(json.commercialRecommendationWeight) === 0, { failureClass: 'data', status: decision.status, ms: decision.ms });
      record('decision-api.results', '/api/decision', 'one or more results', Array.isArray(json.results) ? `${json.results.length} results` : 'results missing', Array.isArray(json.results) && json.results.length > 0, { failureClass: 'data', status: decision.status, ms: decision.ms });
    }
  }

  const scoutGet = await request('/api/account/scout', { headers: { accept: 'application/json' } });
  if (assertStatus('scout.capabilities', '/api/account/scout', scoutGet, 200)) {
    const json = parseJson('scout.capabilities.json', '/api/account/scout', scoutGet);
    if (json) {
      record('scout.product-search', '/api/account/scout', 'product-search capability', JSON.stringify(json.capabilities || []), Array.isArray(json.capabilities) && json.capabilities.includes('product-search'), { failureClass: 'data', status: scoutGet.status, ms: scoutGet.ms });
      record('scout.anonymous-boundary', '/api/account/scout', 'account.authenticated=false', String(json.account?.authenticated), json.account?.authenticated === false, { failureClass: 'data', status: scoutGet.status, ms: scoutGet.ms });
    }
  }
  const scoutPost = await request('/api/account/scout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE_URL, accept: 'application/json' },
    body: JSON.stringify({ text: 'Compare quiet headphones for commuting under $500' }),
  });
  if (assertStatus('scout.response', '/api/account/scout', scoutPost, 200)) {
    const json = parseJson('scout.response.json', '/api/account/scout', scoutPost);
    if (json) {
      record('scout.message', '/api/account/scout', 'non-empty Scout message', excerpt(json.message), Boolean(json.message), { failureClass: 'data', status: scoutPost.status, ms: scoutPost.ms });
      record('scout.actions', '/api/account/scout', 'actions array', Array.isArray(json.actions) ? `${json.actions.length} actions` : 'missing', Array.isArray(json.actions), { failureClass: 'data', status: scoutPost.status, ms: scoutPost.ms });
    }
  }

  const profile = await request('/api/account/profile', { headers: { accept: 'application/json' } });
  assertStatus('account.signed-out-profile', '/api/account/profile', profile, 401);
  if (profile.ok && profile.status === 401) {
    const json = parseJson('account.signed-out-profile.json', '/api/account/profile', profile);
    if (json) record('account.signed-out-profile.message', '/api/account/profile', 'non-empty signed-out error', excerpt(json.error), Boolean(json.error), { failureClass: 'data', status: profile.status, ms: profile.ms });
  }

  const catalogue = await request('/api/catalogue.json', { headers: { accept: 'application/json' } });
  if (assertStatus('catalogue', '/api/catalogue.json', catalogue, 200)) {
    const json = parseJson('catalogue.json', '/api/catalogue.json', catalogue);
    if (json) {
      record('catalogue.products', '/api/catalogue.json', 'positive productCount', String(json.productCount), Number(json.productCount) > 0, { failureClass: 'data', status: catalogue.status, ms: catalogue.ms });
      record('catalogue.neutrality', '/api/catalogue.json', 'commercialRecommendationWeight=0', String(json.commercialRecommendationWeight), Number(json.commercialRecommendationWeight) === 0, { failureClass: 'data', status: catalogue.status, ms: catalogue.ms });
    }
  }

  const robots = await request('/robots.txt');
  if (assertStatus('robots', '/robots.txt', robots, 200)) {
    record('robots.sitemap', '/robots.txt', 'apex sitemap reference', excerpt(robots.body), /Sitemap:\s*https:\/\/australianproductguide\.au\/sitemap\.xml/i.test(robots.body), { status: robots.status, ms: robots.ms });
    record('robots.not-sitewide-blocked', '/robots.txt', 'no User-agent:* + Disallow:/ site-wide block', excerpt(robots.body), !/User-agent:\s*\*[\s\S]{0,200}Disallow:\s*\/(?:\s|$)/i.test(robots.body), { status: robots.status, ms: robots.ms });
    record('robots.no-vercel-host', '/robots.txt', 'no vercel.app hostname', /vercel\.app/i.test(robots.body) ? 'vercel.app present' : 'none', !/vercel\.app/i.test(robots.body), { status: robots.status, ms: robots.ms });
  }

  const sitemap = await request('/sitemap.xml');
  if (assertStatus('sitemap', '/sitemap.xml', sitemap, 200)) {
    record('sitemap.xml-shape', '/sitemap.xml', 'XML sitemap root', excerpt(sitemap.body), /<(urlset|sitemapindex)\b/i.test(sitemap.body), { status: sitemap.status, ms: sitemap.ms });
    record('sitemap.apex-only', '/sitemap.xml', 'canonical apex URLs and no vercel.app URLs', /https:\/\/australianproductguide\.au\//i.test(sitemap.body) && !/vercel\.app/i.test(sitemap.body), { status: sitemap.status, ms: sitemap.ms });
    record('sitemap.no-private-routes', '/sitemap.xml', 'no account/API/private routes', /\/(api\/|login\/|account\/)/i.test(sitemap.body) ? 'private-like route present' : 'none', !/\/(api\/|login\/|account\/)/i.test(sitemap.body), { status: sitemap.status, ms: sitemap.ms });
  }

  const product = await request('/products/sony-wh-1000xm6/');
  if (assertStatus('product.representative', '/products/sony-wh-1000xm6/', product, 200)) {
    record('product.structured-data', '/products/sony-wh-1000xm6/', 'Product structured data', /"@type"\s*:\s*"Product"/i.test(product.body) ? 'present' : 'missing', /"@type"\s*:\s*"Product"/i.test(product.body), { status: product.status, ms: product.ms });
    record('product.amazon-tag', '/products/sony-wh-1000xm6/', 'Amazon Australia affiliate tag auproductguid-22', product.body.includes('auproductguid-22') ? 'present' : 'missing', product.body.includes('auproductguid-22'), { status: product.status, ms: product.ms });
  }

  const missingRoute = '/__apg-production-verification-missing-route__';
  const missing = await request(missingRoute);
  if (assertStatus('not-found', missingRoute, missing, 404)) {
    const noStack = !/(Error:\s|at\s+\w+\s*\(|node_modules\/|stack trace)/i.test(missing.body);
    record('not-found.no-stack', missingRoute, 'no stack trace', noStack ? 'clean' : excerpt(missing.body), noStack, { status: missing.status, ms: missing.ms });
    const hasRecovery = /href=["']\/(?:["']|search\/)/i.test(missing.body);
    record('not-found.recovery', missingRoute, 'branded recovery path to home/search', hasRecovery ? 'present' : 'missing', hasRecovery, { status: missing.status, ms: missing.ms });
  }

  const finishedAt = new Date().toISOString();
  const failed = results.filter(r => !r.ok);
  const report = {
    suite: SUITE,
    baseUrl: BASE_URL,
    gitSha: EXPECTED_SHA || null,
    gitShortSha: EXPECTED_SHORT || null,
    githubDeploymentId: process.env.APG_GITHUB_DEPLOYMENT_ID || null,
    qaStarted: startedAt,
    qaCompleted: finishedAt,
    result: failed.length ? 'FAIL' : 'PASS',
    totals: { checks: results.length, passed: results.length - failed.length, failed: failed.length },
    results,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  if (failed.length) {
    console.error(`APG_HTTP_CONTRACT=FAIL failed=${failed.length}/${results.length}`);
    for (const row of failed) console.error(JSON.stringify(row));
    process.exit(1);
  }
  console.log(`APG_HTTP_CONTRACT=PASS checks=${results.length}`);
}

main().catch(error => {
  const report = {
    suite: SUITE,
    baseUrl: BASE_URL,
    gitSha: EXPECTED_SHA || null,
    gitShortSha: EXPECTED_SHORT || null,
    qaStarted: startedAt,
    qaCompleted: new Date().toISOString(),
    result: 'ERROR',
    fatal: error?.stack || String(error),
    results,
  };
  try { fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2)); } catch {}
  console.error(error?.stack || error);
  process.exit(1);
});
