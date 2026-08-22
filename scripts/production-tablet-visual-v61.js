#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL = (process.env.BASE_URL || 'https://australianproductguide.au').replace(/\/$/, '');
const CHROME = process.env.CHROME;
const EXPECTED_SHA = (process.env.APG_EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
const OUT_DIR = process.env.TABLET_VISUAL_OUT || 'artifacts/production-tablet-visual-v61';
const SUITE = 'production-tablet-visual-v61';
const startedAt = new Date().toISOString();

const VIEWPORTS = [
  ['tablet-portrait', 834, 1112],
  ['tablet-landscape', 1112, 834],
];
const TARGETS = [
  ['home', '/'],
  ['search', '/search/?q=robot+vacuum+for+pet+hair'],
  ['category', '/categories/wireless-headphones/'],
  ['product', '/products/sony-wh-1000xm6/'],
  ['compare', '/compare/custom/?products=sony-wh-1000xm6,bose-quietcomfort-ultra-headphones'],
  ['decision', '/decision-lab/?q=headphones+under+%24500+for+commuting'],
  ['my-apg', '/my-apg/'],
  ['methodology', '/methodology/'],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  if (!CHROME) throw new Error('CHROME executable is required');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  const rows = [];
  const blockers = [];
  const warnings = [];

  async function inspect(vp, width, height, name, route, { scout = false } = {}) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const pageErrors = [];
    const consoleErrors = [];
    const failedRequests = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText || 'failed' }));
    try {
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 500));
      if (!response || response.status() >= 400) throw new Error(`navigation status ${response?.status() || 'none'}`);

      if (scout) {
        const clicked = await page.evaluate(() => {
          const candidates = [...document.querySelectorAll('[data-v26-scout-open],#apgAssistantLauncher')];
          const el = candidates.find(node => {
            const r = node.getBoundingClientRect();
            const cs = getComputedStyle(node);
            return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
          });
          if (!el) return false;
          el.click();
          return true;
        });
        if (!clicked) throw new Error('visible Scout launcher missing');
        await new Promise(r => setTimeout(r, 300));
      }

      const state = await page.evaluate(isScout => {
        const body = document.body;
        const visible = el => {
          if (!el) return false;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
        };
        const overflow = [...document.querySelectorAll('body *')]
          .map(el => ({ el, r: el.getBoundingClientRect(), cs: getComputedStyle(el) }))
          .filter(x => x.cs.display !== 'none' && x.r.width > 0 && (x.r.left < -3 || x.r.right > innerWidth + 3))
          .slice(0, 10)
          .map(x => ({ tag: x.el.tagName.toLowerCase(), id: x.el.id || '', cls: String(x.el.className || '').slice(0, 100), left: Math.round(x.r.left), right: Math.round(x.r.right) }));
        return {
          title: document.title,
          h1: document.querySelector('h1')?.textContent?.trim() || '',
          bodyTextLength: body?.innerText?.length || 0,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflow,
          headerVisible: visible(document.querySelector('header')),
          footerVisible: visible(document.querySelector('footer')),
          searchVisible: [...document.querySelectorAll('input[type="search"],input[name="q"],[data-search-input]')].some(visible),
          maintainedBannerText: [...document.querySelectorAll('body *')].some(el => visible(el) && /maintained australian research/i.test(el.textContent || '')),
          scoutOpen: isScout ? !document.getElementById('apgAssistantPanel')?.hidden : null,
        };
      }, scout);
      const screenshot = path.join(OUT_DIR, `${vp}-${name}${scout ? '-scout-open' : ''}.png`);
      await page.screenshot({ path: screenshot, fullPage: !scout });

      const materialConsole = consoleErrors.filter(x => !/favicon|analytics/i.test(x));
      const sameOriginRequests = failedRequests.filter(x => {
        try { return new URL(x.url).origin === new URL(BASE_URL).origin; } catch { return false; }
      });
      const externalFailedRequests = failedRequests.filter(x => !sameOriginRequests.includes(x) && !/doubleclick|google-analytics|googletagmanager/i.test(x.url));
      if (state.bodyTextLength < 80) blockers.push(`${vp}/${name}: body unexpectedly empty`);
      if (state.scrollWidth > state.clientWidth + 3) blockers.push(`${vp}/${name}: horizontal overflow ${state.scrollWidth}>${state.clientWidth}`);
      if (!state.headerVisible) blockers.push(`${vp}/${name}: header not visible`);
      if (!state.footerVisible) blockers.push(`${vp}/${name}: footer not visible`);
      if (pageErrors.length) blockers.push(`${vp}/${name}: ${pageErrors.length} uncaught page error(s)`);
      if (sameOriginRequests.length) blockers.push(`${vp}/${name}: ${sameOriginRequests.length} failed same-origin request(s)`);
      if (materialConsole.length) warnings.push(`${vp}/${name}: ${materialConsole.length} console error message(s) recorded for triage`);
      if (externalFailedRequests.length) warnings.push(`${vp}/${name}: ${externalFailedRequests.length} external request failure(s) recorded for triage`);
      if (scout && !state.scoutOpen) blockers.push(`${vp}/${name}: Scout panel did not open`);

      rows.push({ vp, width, height, name, route, status: response.status(), screenshot, state, pageErrors, consoleErrors: materialConsole, failedSameOriginRequests: sameOriginRequests, failedExternalRequests: externalFailedRequests });
      console.log(`TABLET_VISUAL ${vp}/${name} status=${response.status()} overflow=${state.scrollWidth > state.clientWidth + 3} errors=${pageErrors.length + materialConsole.length}`);
    } catch (error) {
      blockers.push(`${vp}/${name}: ${error.message}`);
      rows.push({ vp, width, height, name, route, fatal: error.message, pageErrors, consoleErrors, failedRequests });
      await page.screenshot({ path: path.join(OUT_DIR, `${vp}-${name}-failure.png`), fullPage: false }).catch(() => {});
    } finally {
      await page.close().catch(() => {});
    }
  }

  try {
    for (const [vp, width, height] of VIEWPORTS) {
      for (const [name, route] of TARGETS) await inspect(vp, width, height, name, route);
      await inspect(vp, width, height, 'home', '/', { scout: true });
    }
  } finally {
    await browser.close().catch(() => {});
  }

  const report = {
    suite: SUITE,
    baseUrl: BASE_URL,
    gitSha: EXPECTED_SHA || null,
    githubDeploymentId: process.env.APG_GITHUB_DEPLOYMENT_ID || null,
    qaStarted: startedAt,
    qaCompleted: new Date().toISOString(),
    result: blockers.length ? 'FAIL' : 'PASS',
    blockers,
    warnings,
    rows,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  for (const warning of warnings) console.warn(`TABLET_VISUAL_WARNING ${warning}`);
  if (blockers.length) {
    for (const blocker of blockers) console.error(`TABLET_VISUAL_BLOCKER ${blocker}`);
    console.error(`APG_TABLET_VISUAL=FAIL blockers=${blockers.length}`);
    process.exit(1);
  }
  console.log(`APG_TABLET_VISUAL=PASS states=${rows.length}`);
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exit(1);
});