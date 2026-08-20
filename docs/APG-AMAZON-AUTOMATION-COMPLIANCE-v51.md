# APG Amazon Automation Compliance v51

**Status:** CURRENT  
**Control introduced:** 21 August 2026  
**Scope:** Amazon Australia Associates links, APG automated QA, browser certification and destination-health checks

## Control objective

APG must not use automated QA, crawlers, browser tests, health checks or scheduled jobs to request, click, follow, prefetch or prerender Amazon Australia affiliate destinations. Automated testing must not create Amazon shopping sessions or activity that could be confused with genuine consumer referrals.

This control is deliberately conservative. Consumer-facing Amazon links remain available to genuine users, but APG automation validates them without navigating to Amazon.

## Permitted automated checks

Automation may validate, without requesting Amazon:

- `https://www.amazon.com.au` marketplace identity;
- APG Associates tracking tag presence and uniqueness;
- direct-ASIN URL structure and recorded ASIN identity;
- transparent model-specific search fallback structure;
- affiliate disclosure and sponsored-link attributes;
- APG placement/context analytics markers;
- commercial recommendation weight fixed at zero;
- rendered APG pages and same-origin APG routes;
- absence of Amazon prefetch/prerender directives;
- outbound Amazon href values by DOM inspection only.

## Prohibited automated behaviour

APG automation must not:

- request a tagged Amazon affiliate URL;
- follow an Amazon redirect chain;
- use `fetch`, HTTP clients, `curl`, `wget` or equivalent tools against Amazon affiliate destinations;
- use Puppeteer/Chromium to navigate to an Amazon affiliate URL;
- click or tap an Amazon affiliate CTA during browser QA;
- prefetch or prerender Amazon destinations;
- reintroduce automated external destination probing under another job or script name.

## Enforcement

`node scripts/amazon-automation-compliance-v51-qa.js` is a release gate in both `qa:deploy` and `qa:full`.

The gate also runs at the start of the Amazon Shopping Assurance workflow. The link-integrity job uses an APG-origin-only network allowlist and records external Amazon checks as `NOT_REQUESTED`.

The existing browser visual certification is inspection-only: it may confirm that an Amazon CTA has the expected href, tracking tag, relationship attributes and target behaviour, but it must not activate that CTA.

## Live retailer verification

If a destination needs live retailer verification, use a controlled human review process that is clearly separated from automated affiliate QA. Do not manufacture clicks or sales for testing. Future Amazon-supported product-data/API capability may be used where authorised and appropriate, subject to the then-current programme terms and APG governance.

## Affiliate-performance baseline

Pre-control affiliate click reporting must not be treated as a clean consumer-conversion baseline where automated QA may have contributed activity.

As at **21 August 2026**, the owner reports that the Amazon Associates dashboard is approximately **two days behind**. Accordingly:

- same-day dashboard figures cannot be used to verify this control immediately;
- post-control referral activity should be assessed by referral date once the reporting lag has elapsed;
- use daily/date-filtered increments where possible rather than relying on a rolling 30-day cumulative total that still contains pre-control activity;
- label historical pre-control affiliate-click data as potentially contaminated rather than deleting or rewriting it.

## Recommendation independence

Affiliate availability, commission and retailer merchandising continue to contribute **zero recommendation points**. APG recommendation logic remains based on consumer fit, maintained product evidence, needs, priorities, budget and deal-breakers.
