#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE_URL = (process.env.BASE_URL || 'https://australianproductguide.au').replace(/\/$/, '');
const CHROME = process.env.CHROME;
const EXPECTED_SHA = (process.env.APG_EXPECTED_SHA || process.env.GITHUB_SHA || '').trim();
const OUT_DIR = process.env.A11Y_OUT || 'artifacts/production-accessibility-v61';
const SUITE = 'production-accessibility-v61';
const startedAt = new Date().toISOString();
const rows = [];

// Exact rule set used by Lighthouse 13.4.1 agent-accessibility-tree (26 Aug 2026).
// Keeping this explicit means APG's Production gate catches agentic accessibility defects
// that are not necessarily part of the standard WCAG-tagged Lighthouse score.
const AGENTIC_RULE_IDS = [
  'button-name','input-button-name','input-image-alt','label','link-name','select-name','document-title',
  'aria-allowed-attr','aria-allowed-role','aria-command-name','aria-conditional-attr','aria-dialog-name',
  'aria-hidden-body','aria-hidden-focus','aria-input-field-name','aria-prohibited-attr','aria-required-attr',
  'aria-required-children','aria-required-parent','aria-roles','aria-text','aria-toggle-field-name',
  'aria-tooltip-name','aria-treeitem-name','aria-valid-attr','aria-valid-attr-value','duplicate-id-aria',
  'definition-list','table-duplicate-name','tabindex','autocomplete-valid','presentation-role-conflict','svg-img-alt',
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const TARGETS = [
  ['home-desktop', '/', 1440, 950],
  ['search-mobile', '/search/?q=quiet+headphones+for+commuting', 390, 844],
  ['product-desktop', '/products/sony-wh-1000xm6/', 1440, 950],
  ['compare-mobile', '/compare/custom/?products=sony-wh-1000xm6,bose-quietcomfort-ultra-headphones', 390, 844],
  ['decision-mobile', '/decision-lab/?q=headphones+under+%24500+for+commuting', 390, 844],
  ['my-apg-desktop', '/my-apg/', 1440, 950],
];

function compactViolation(v) {
  return {
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target, failureSummary: n.failureSummary })),
  };
}

async function main() {
  if (!CHROME) throw new Error('CHROME executable is required');
  const axePath = require.resolve('axe-core/axe.min.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  const blockers = [];
  const warnings = [];

  async function auditTarget(name, route, width, height, openScout = false) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const runtimeErrors = [];
    const failedRequests = [];
    page.on('pageerror', e => runtimeErrors.push(e.message));
    page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText || 'request failed' }));
    try {
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });
      await new Promise(r => setTimeout(r, 500));
      if (!response || response.status() >= 400) throw new Error(`navigation status ${response?.status() || 'none'}`);

      if (openScout) {
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
        if (!clicked) blockers.push(`${name}: Scout launcher not available for accessibility audit`);
        await new Promise(r => setTimeout(r, 300));
      }

      await page.addScriptTag({ path: axePath });
      const axe = await page.evaluate(async () => window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
        resultTypes: ['violations'],
      }));
      const allAxe = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }));

      const serious = axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      const moderate = axe.violations.filter(v => v.impact === 'moderate');
      const agentic = allAxe.violations.filter(v => AGENTIC_RULE_IDS.includes(v.id));

      const custom = await page.evaluate(() => {
        const visible = el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
        };
        const unlabeledForms = [...document.querySelectorAll('input,select,textarea')]
          .filter(visible)
          .filter(el => {
            const id = el.id;
            return !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) && !el.closest('label');
          })
          .map(el => `${el.tagName.toLowerCase()}#${el.id || ''}.${String(el.className || '').replace(/\s+/g, '.')}`)
          .slice(0, 10);
        const unnamedButtons = [...document.querySelectorAll('button,[role="button"]')]
          .filter(visible)
          .filter(el => !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.textContent || '').trim()))
          .map(el => `${el.tagName.toLowerCase()}#${el.id || ''}.${String(el.className || '').replace(/\s+/g, '.')}`)
          .slice(0, 10);
        const heading1 = document.querySelectorAll('h1').length;
        const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
        return { unlabeledForms, unnamedButtons, heading1, horizontalOverflow };
      });

      const row = {
        name,
        route,
        viewport: { width, height },
        status: response.status(),
        seriousCritical: serious.map(compactViolation),
        moderate: moderate.map(compactViolation),
        lighthouseAgentAccessibility: agentic.map(compactViolation),
        custom,
        runtimeErrors,
        failedRequests: failedRequests.filter(x => !/doubleclick|google-analytics|googletagmanager/i.test(x.url)).slice(0, 20),
      };
      rows.push(row);

      if (serious.length) blockers.push(`${name}: ${serious.length} serious/critical axe violation(s)`);
      if (agentic.length) blockers.push(`${name}: ${agentic.length} Lighthouse agent accessibility-tree violation(s): ${agentic.map(v => v.id).join(', ')}`);
      if (custom.unlabeledForms.length) blockers.push(`${name}: ${custom.unlabeledForms.length} visible form control(s) without accessible label`);
      if (custom.unnamedButtons.length) blockers.push(`${name}: ${custom.unnamedButtons.length} visible unnamed button(s)`);
      if (custom.heading1 < 1) blockers.push(`${name}: no h1`);
      if (custom.horizontalOverflow) blockers.push(`${name}: horizontal viewport overflow`);
      if (runtimeErrors.length) blockers.push(`${name}: ${runtimeErrors.length} uncaught page error(s)`);
      if (moderate.length) warnings.push(`${name}: ${moderate.length} moderate axe violation(s)`);
      if (row.failedRequests.length) warnings.push(`${name}: ${row.failedRequests.length} non-analytics failed request(s)`);

      console.log(`A11Y ${name} serious=${serious.length} moderate=${moderate.length} agentic=${agentic.length} labels=${custom.unlabeledForms.length} buttons=${custom.unnamedButtons.length} overflow=${custom.horizontalOverflow}`);
    } catch (error) {
      blockers.push(`${name}: ${error.message}`);
      rows.push({ name, route, viewport: { width, height }, fatal: error.message, runtimeErrors, failedRequests });
    } finally {
      await page.close().catch(() => {});
    }
  }

  try {
    for (const [name, route, width, height] of TARGETS) await auditTarget(name, route, width, height, false);
    await auditTarget('scout-mobile-open', '/', 390, 844, true);
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
    policy: 'Serious/critical WCAG axe findings, Lighthouse 13.4.1 agent-accessibility-tree rule findings and material custom barriers fail; moderate WCAG findings are reported for triage.',
    agenticRuleIds: AGENTIC_RULE_IDS,
    blockers,
    warnings,
    rows,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));

  if (warnings.length) for (const warning of warnings) console.warn(`A11Y_WARNING ${warning}`);
  if (blockers.length) {
    for (const blocker of blockers) console.error(`A11Y_BLOCKER ${blocker}`);
    console.error(`APG_ACCESSIBILITY=FAIL blockers=${blockers.length}`);
    process.exit(1);
  }
  console.log(`APG_ACCESSIBILITY=PASS targets=${rows.length} lighthouseAgentAccessibility=PASS`);
}

main().catch(error => {
  console.error(error?.stack || error);
  process.exit(1);
});
