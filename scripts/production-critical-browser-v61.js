#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = (process.env.BASE_URL || 'https://australianproductguide.au').replace(/\/$/, '');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const OUT = process.env.CRITICAL_BROWSER_OUT || 'artifacts/production-critical-browser-v61';
const SHA = (process.env.APG_EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
const report = {
  suite: 'production-critical-browser-v61', baseUrl: BASE, gitSha: SHA || null,
  qaStarted: new Date().toISOString(), journeys: [], pageErrors: [], consoleErrors: [],
  failedRequests: [], navigationAborts: [], expectedAborts: [], failures: []
};
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const sameOrigin = url => { try { return new URL(url).origin === new URL(BASE).origin; } catch { return false; } };

function instrument(page, scope) {
  page.on('pageerror', e => report.pageErrors.push({ scope, message: e.message || String(e) }));
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (!/google-analytics|googletagmanager|doubleclick|favicon/i.test(text)) report.consoleErrors.push({ scope, message: text });
  });
  page.on('requestfailed', req => {
    if (!sameOrigin(req.url())) return;
    const error = req.failure()?.errorText || 'request failed';
    const row = { scope, type: req.resourceType(), url: req.url(), error };
    const resourceType = req.resourceType();
    let pathname = '';
    try { pathname = new URL(req.url()).pathname; } catch {}
    if (['fetch', 'xhr'].includes(resourceType) && /ERR_ABORTED/i.test(error) && pathname === '/api/search-suggest') {
      report.expectedAborts.push(row);
      return;
    }
    if (resourceType === 'script' && /ERR_ABORTED/i.test(error)) report.navigationAborts.push(row);
    else if (['document', 'script', 'fetch', 'xhr'].includes(resourceType)) report.failedRequests.push(row);
  });
}
async function visible(page, selector) {
  for (const h of await page.$$(selector)) {
    if (await h.evaluate(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; })) return h;
  }
  return null;
}
async function dismissConsent(page) {
  const b = await visible(page, '[data-apg-consent] [data-consent-essential]');
  if (b) { await b.click(); await sleep(80); }
}
async function suppressOptionalAccountNudge(page) {
  await page.evaluate(() => {
    try {
      const now = Date.now();
      localStorage.setItem('apg_account_nudge_v1', JSON.stringify({ dismissedUntil: now + 86400000, lastShown: now }));
    } catch {}
  });
  const dismiss = await visible(page, '[data-account-nudge] [data-account-nudge-dismiss]');
  if (dismiss) { await dismiss.click(); await sleep(60); }
}
async function go(page, route) {
  const res = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert(res && res.status() < 500, `${route}: HTTP ${res?.status()}`);
  await page.waitForSelector('main', { timeout: 12000 });
  await dismissConsent(page);
  await suppressOptionalAccountNudge(page);
  await sleep(220);
  return res;
}
async function replace(handle, value) {
  await handle.click({ clickCount: 3 }); await handle.press('Backspace'); if (value) await handle.type(value);
}
async function submit(page, formSelector) {
  const form = await visible(page, formSelector); assert(form, `form missing: ${formSelector}`);
  const button = await form.$('button[type="submit"],input[type="submit"]'); assert(button, `submit missing: ${formSelector}`);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
    button.click()
  ]);
  await page.waitForSelector('main', { timeout: 12000 });
  await dismissConsent(page);
  await suppressOptionalAccountNudge(page);
  await sleep(220);
}
async function decision(page, q, category = '', budget = '') {
  const form = await visible(page, 'form.decision-form'); assert(form, 'Decision Lab form missing');
  const query = await form.$('textarea[name="q"]'); assert(query, 'Decision Lab query missing'); await replace(query, q);
  const cat = await form.$('select[name="category"]'); if (cat) await cat.select(category);
  const price = await form.$('input[name="budget"]'); if (price) await replace(price, budget);
  await submit(page, 'form.decision-form');
  const url = new URL(page.url());
  assert(url.pathname === '/decision-lab/' && url.searchParams.get('q') === q, `Decision submission mismatch: ${url.href}`);
  const state = await page.evaluate(() => {
    const form = document.querySelector('form.decision-form');
    const button = form?.querySelector('button[type="submit"],input[type="submit"]');
    return {
      decisionV4: document.body.dataset.decisionV4 || '',
      runtime: document.body.dataset.apgInteractionRuntime || document.querySelector('meta[name="apg-interaction-mode"]')?.content || '',
      summary: !!document.querySelector('.decision-summary'),
      products: document.querySelectorAll('.decision-results a[href^="/products/"]').length,
      zero: !!document.querySelector('.decision-results .zero-state'),
      busy: form?.getAttribute('aria-busy') === 'true',
      disabled: !!button?.disabled
    };
  });
  assert(state.decisionV4 === 'true', `Decision v4 semantic marker missing: ${JSON.stringify(state)}`);
  assert(/^ssr-native-/i.test(state.runtime), `Decision Lab not SSR-native: ${state.runtime}`);
  assert(state.summary, `Decision Lab summary missing: ${JSON.stringify(state)}`);
  assert(state.products > 0 || state.zero, `Decision Lab returned no controlled outcome: ${JSON.stringify(state)}`);
  assert(!state.busy && !state.disabled, `Decision Lab remained busy/disabled after navigation: ${JSON.stringify(state)}`);
}
async function askScout(page, prompt, validate, label) {
  const input = await visible(page, '.scout-v5-input'); assert(input, 'Scout input missing');
  const before = await page.$$eval('#apgAssistantBody .scout-v5-row.bot', rows => rows.length);
  await replace(input, prompt);
  const send = await visible(page, '.scout-v5-send'); assert(send, 'Scout send control missing'); await send.click();
  await page.waitForFunction(prior => {
    const body = document.getElementById('apgAssistantBody');
    return body && body.getAttribute('aria-busy') !== 'true' && body.querySelectorAll('.scout-v5-row.bot').length > prior;
  }, { timeout: 25000 }, before);
  const state = await page.evaluate(() => {
    const body = document.getElementById('apgAssistantBody');
    const rows = [...(body?.querySelectorAll('.scout-v5-row.bot') || [])], latest = rows.at(-1);
    return {
      text: latest?.innerText || '',
      products: [...(body?.querySelectorAll('.scout-v5-card a[href^="/products/"]') || [])].map(a => a.getAttribute('href')),
      actions: [...(body?.querySelectorAll('.scout-v5-action[href]') || [])].map(a => a.getAttribute('href'))
    };
  });
  assert(validate(state), `Scout ${label} failed; latest=${clean(state.text).slice(0, 400)} products=${state.products.length} actions=${state.actions.length}`);
  return state;
}
async function waitCompareCount(page, expected) {
  try {
    await page.waitForFunction(n => document.querySelector('[data-compare-count]')?.textContent.trim() === String(n), { timeout: 5000 }, expected);
  } catch (error) {
    const state = await page.evaluate(() => ({
      count: document.querySelector('[data-compare-count]')?.textContent.trim() || null,
      selected: (() => { try { return JSON.parse(localStorage.getItem('apgCompare') || '[]'); } catch { return []; } })(),
      trayHidden: document.getElementById('compareTray')?.hidden ?? null,
      visibleDialogs: [...document.querySelectorAll('[role="dialog"]')].filter(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }).map(el => cleanText(el.innerText).slice(0, 160)),
      optionalNudgeVisible: !![...document.querySelectorAll('[data-account-nudge]')].find(el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; }),
      url: location.href
    }));
    throw new Error(`Compare count expected ${expected}; actual=${JSON.stringify(state)}`);
  }
}
function cleanText(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
async function run(browser, name, viewport, fn) {
  const page = await browser.newPage(); await page.setViewport(viewport); instrument(page, name); const started = Date.now();
  try { await fn(page); report.journeys.push({ name, result: 'PASS', durationMs: Date.now() - started }); }
  catch (e) {
    report.failures.push({ name, error: e.message }); report.journeys.push({ name, result: 'FAIL', durationMs: Date.now() - started, error: e.message });
    try { await page.screenshot({ path: path.join(OUT, `${name}-failure.png`), fullPage: true }); } catch {}
  } finally { await page.close(); }
}

(async () => {
  assert(fs.existsSync(CHROME), `Chrome not found: ${CHROME}`);
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const desktop = { width: 1440, height: 950 }, mobile = { width: 390, height: 844, isMobile: true, hasTouch: true };

  await run(browser, 'desktop-search-autocomplete-product', desktop, async page => {
    await go(page, '/');
    const input = await visible(page, '.header-search form[data-search-shell] input[data-site-search]'); assert(input, 'Search input missing');
    await input.type('Sony WH');
    await page.waitForSelector('.header-search [data-apg-header-shared-suggestions]:not([hidden]) a[role="option"]', { timeout: 10000 });
    assert((await page.$$('.header-search [data-apg-header-shared-suggestions] a[role="option"]')).length > 0, 'autocomplete empty');
    await replace(input, 'Sony WH-1000XM6'); await submit(page, '.header-search form[data-search-shell]');
    assert(new URL(page.url()).pathname === '/search/', 'Search did not submit to /search/');
    const product = await visible(page, 'main a[href="/products/sony-wh-1000xm6/"]'); assert(product, 'Sony XM6 result missing');
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }), product.click()]);
    assert(new URL(page.url()).pathname === '/products/sony-wh-1000xm6/', 'product result link failed');
  });

  await run(browser, 'desktop-decision-lab-ssr-refine-no-match-retry', desktop, async page => {
    await go(page, '/decision-lab/');
    await decision(page, 'quiet headphones for long flights');
    let s = await page.evaluate(() => ({ products: document.querySelectorAll('.decision-results a[href^="/products/"]').length, compare: document.querySelectorAll('.decision-results [data-compare-product]').length, zero: !!document.querySelector('.decision-results .zero-state') }));
    assert(s.products > 0 && s.compare > 0 && !s.zero, `shortlist missing: ${JSON.stringify(s)}`);
    await decision(page, 'wireless headphones excluding Sony', 'wireless-headphones', '300');
    const links = await page.$$eval('.decision-results a[href^="/products/"]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
    assert(links.length > 0 && !links.some(x => /sony/i.test(x)), `Sony exclusion failed: ${links.join(',')}`);
    await decision(page, 'qwertyxyznonsense');
    s = await page.evaluate(() => ({ products: document.querySelectorAll('.decision-results a[href^="/products/"]').length, zero: !!document.querySelector('.decision-results .zero-state') }));
    assert(s.zero && s.products === 0, `no-match state failed: ${JSON.stringify(s)}`);
    await decision(page, 'robot vacuum for pet hair and mopping', 'robot-vacuums');
    assert(await page.$('.decision-results a[href^="/products/"]'), 'Decision retry failed');
  });

  await run(browser, 'desktop-product-save-compare-result-remove', desktop, async page => {
    await go(page, '/products/sony-wh-1000xm6/');
    await page.evaluate(() => { localStorage.setItem('apgCompare', '[]'); localStorage.setItem('apgSaved', '[]'); });
    await go(page, '/products/sony-wh-1000xm6/');
    const sony = await visible(page, '[data-compare-product="sony-wh-1000xm6"]'); assert(sony, 'Sony compare missing'); await sony.click();
    await waitCompareCount(page, 1);

    await go(page, '/products/bose-quietcomfort-ultra-headphones/');
    const bose = await visible(page, '[data-compare-product="bose-quietcomfort-ultra-headphones"]'); assert(bose, 'Bose compare missing'); await bose.click();
    await waitCompareCount(page, 2);
    const link = await visible(page, '#compareTray [data-compare-link]'); assert(link, 'Compare result link missing');
    const href = await link.evaluate(el => el.getAttribute('href') || ''); assert(href.includes('sony-wh-1000xm6') && href.includes('bose-quietcomfort-ultra-headphones'), `Compare href wrong: ${href}`);
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }), link.click()]);
    assert(new URL(page.url()).pathname === '/compare/custom/', 'Compare result route failed');
    assert(await page.$('[data-compare-product="sony-wh-1000xm6"]') && await page.$('[data-compare-product="bose-quietcomfort-ultra-headphones"]'), 'Compare result missing product');

    await go(page, '/products/bose-quietcomfort-ultra-headphones/');
    const remove = await visible(page, '[data-compare-product="bose-quietcomfort-ultra-headphones"]'); assert(remove, 'Bose remove control missing'); await remove.click();
    await waitCompareCount(page, 1);
    const selected = await page.evaluate(() => JSON.parse(localStorage.getItem('apgCompare') || '[]'));
    assert(selected.length === 1 && selected[0] === 'sony-wh-1000xm6', `Compare remove state wrong: ${JSON.stringify(selected)}`);

    await go(page, '/products/sony-wh-1000xm6/');
    const save = await visible(page, '[data-save-product="sony-wh-1000xm6"]'); assert(save, 'Sony save missing'); await save.click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('apgSaved') || '[]').includes('sony-wh-1000xm6'), { timeout: 5000 });
  });

  await run(browser, 'desktop-scout-conversation-navigation', desktop, async page => {
    await go(page, '/'); const open = await visible(page, '#apgAssistantLauncher'); assert(open, 'Scout launcher missing'); await open.click();
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input', { timeout: 10000 });
    const first = await askScout(page, 'Recommend quiet headphones for commuting under $500', s => s.products.length > 0, 'product recommendation');
    await askScout(page, 'Compare the top options for long flights', s => clean(s.text).length > 20, 'comparison follow-up');
    await askScout(page, 'How do APG recommendations work?', s => /recommend|methodolog|evidence|maintained/i.test(s.text), 'methodology');
    await askScout(page, 'Does APG earn commission from Amazon Australia?', s => /Amazon|affiliate|commission|retailer/i.test(s.text), 'affiliate answer');
    const href = first.products[0]; const action = await visible(page, `#apgAssistantBody a[href="${href}"]`); assert(action, 'Scout product navigation missing');
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }), action.click()]);
    assert(new URL(page.url()).origin === new URL(BASE).origin && new URL(page.url()).pathname.startsWith('/products/'), 'Scout navigation left APG');
  });

  await run(browser, 'desktop-account-signed-out-boundary', desktop, async page => {
    await go(page, '/my-apg/'); await page.waitForSelector('[data-account-shell]', { timeout: 10000 }); await page.waitForSelector('[data-account-signed-out]:not([hidden])', { timeout: 10000 });
    assert(await visible(page, '[data-account-form]'), 'signed-out form missing');
    assert(await visible(page, '[data-account-tab="login"]'), 'login mode control missing'); assert(await visible(page, '[data-account-tab="signup"]'), 'signup mode control missing');
    assert(!(await page.$eval('[data-account-signed-in]', el => !el.hidden)), 'signed-in panel exposed to signed-out browser');
    const protectedResponse = await fetch(BASE + '/api/account/workspace', { headers: { accept: 'application/json' }, redirect: 'manual' });
    assert(protectedResponse.status === 401, `signed-out workspace endpoint expected 401, received ${protectedResponse.status}`);
  });

  await run(browser, 'mobile-menu-search-decision-scout', mobile, async page => {
    await go(page, '/');
    const toggle = await visible(page, '.masthead [data-apg-drawer-trigger]'); assert(toggle, 'mobile drawer toggle missing'); await toggle.click();
    await page.waitForSelector('#apgAllDrawer:not([hidden])', { timeout: 5000 });
    assert(await toggle.evaluate(el => el.getAttribute('aria-expanded') === 'true'), 'mobile drawer aria state wrong');
    assert(await visible(page, '#apgAllDrawer a[href="/decision-lab/"]'), 'mobile Decision Lab drawer link missing');
    assert(await visible(page, '#apgAllDrawer [data-apg-supermenu-scout]'), 'mobile Scout drawer control missing');
    await toggle.click();
    await page.waitForSelector('#apgAllDrawer[hidden]', { timeout: 5000 });

    const input = await visible(page, '.apg-mobile-header-search-v1226 input[data-site-search]'); assert(input, 'persistent mobile Search missing'); await input.type('robot vacuum');
    await page.waitForSelector('.apg-mobile-header-search-v1226 [data-search-suggestions]:not([hidden]) a[role="option"]', { timeout: 10000 });
    await replace(input, 'robot vacuum for pet hair');
    await submit(page, '.apg-mobile-header-search-v1226'); assert(await page.$('main a[href^="/products/"]'), 'mobile Search products missing');

    await go(page, '/decision-lab/'); await decision(page, 'headphones for long flights', 'wireless-headphones'); assert(await page.$('.decision-results a[href^="/products/"]'), 'mobile Decision shortlist missing');
    await go(page, '/');
    const t2 = await visible(page, '.masthead [data-apg-drawer-trigger]'); assert(t2, 'mobile drawer toggle missing on return'); await t2.click();
    await page.waitForSelector('#apgAllDrawer:not([hidden])', { timeout: 5000 });
    const scout = await visible(page, '#apgAllDrawer [data-apg-supermenu-scout]'); assert(scout, 'mobile Scout missing'); const before = page.url(); await scout.click();
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input', { timeout: 10000 }); assert(page.url() === before, 'opening Scout changed URL');
    await askScout(page, 'What is Australian Product Guide?', s => /Australian Product Guide|APG/i.test(s.text), 'mobile site answer');
  });

  await browser.close();
  report.qaCompleted = new Date().toISOString();
  report.result = (report.failures.length || report.pageErrors.length || report.consoleErrors.length || report.failedRequests.length) ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ suite: report.suite, result: report.result, journeys: report.journeys, pageErrors: report.pageErrors.length, consoleErrors: report.consoleErrors.length, failedRequests: report.failedRequests.length, navigationAborts: report.navigationAborts.length, expectedAborts: report.expectedAborts.length }, null, 2));
  if (report.result !== 'PASS') process.exit(1);
  console.log(`APG_CRITICAL_BROWSER=PASS journeys=${report.journeys.length}`);
})().catch(e => {
  report.failures.push({ name: 'runner', error: e.message }); report.qaCompleted = new Date().toISOString(); report.result = 'ERROR';
  try { fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2)); } catch {}
  console.error(e.stack || e); process.exit(1);
});