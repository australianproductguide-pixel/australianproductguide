# Australian Product Guide

Authoritative source repository for **Australian Product Guide (APG)** — an Australian product-search, comparison, decision-support and shopping-discovery platform.

**Production:** https://australianproductguide.au

## Source of truth and deployment

`APG operating work -> GitHub main -> Vercel project au-product-guide -> Production`

`main` is the Production code source of truth. GitHub pushes deploy automatically to the dedicated Vercel project. Google Drive is the durable operating record for catalogue, evidence, governance, commercial controls, QA/release evidence and roadmap decisions. Supabase is the optional account/sync backend; it is not a competing catalogue source.

## Current architecture

APG deliberately remains lightweight, readable and SSR-first:

- one Vercel Node Function through `api/index.js`;
- Platform Cohesion v26 over My APG account governance v25 and the established institutional/semantic/decision stack;
- governed integration of Priority Commerce Depth v42 and Research View v43 without replacing the current account/authentication chain;
- server-rendered crawlable HTML with progressive enhancement for search, comparison, sharing, Decision Lab, Scout, My APG and optional account sync;
- structured catalogue, evidence, retailer and imagery-provenance registries in `data/`;
- no required client framework and no opaque compressed deployment bundle.

## Maintained consumer scope

Current maintained scope at 18 August 2026:

- **482 maintained products**;
- **90 populated categories**;
- **178 represented brands**;
- **23 independently verified exact Amazon Australia product destinations** remain in the maintained exact-link set;
- other Amazon pathways use transparent model-specific search/further-verification fallbacks rather than guessed ASINs;
- commercial relationships contribute **zero recommendation points**.

High-intent depth includes televisions, laptops, robot vacuums, washing machines, coffee machines, wireless headphones, smartphones and earbuds. Catalogue expansion is subordinate to evidence quality, exact model identity and useful decision coverage.

## Search, Research View and decision intelligence

The canonical search contract is `search-ranking-v4`: maintained lexical/model discovery is combined with the governed Decision Intelligence state for category interpretation, budget handling, hard constraints, exclusions and explainable reranking.

Platform Cohesion v26 activates the maintained **Research View v43** inside the current Production account/governance chain. Natural-language shopping questions can therefore surface:

- the interpreted buying brief;
- current best fit and alternatives from maintained APG data;
- reasons, compromises and verification needs;
- source/freshness context;
- follow-up refinements that preserve the original question;
- a direct comparison path when suitable.

The Research View is deterministic and evidence-grounded; it does not call an external LLM. Missing proof is not invented. Affiliate status, retailer participation and commission contribute zero organic-search or recommendation weight.

Decision Lab and Scout use the same maintained product and Decision Intelligence foundations. Scout remains a conversational interface to APG decision data rather than a generic chatbot, and Platform Cohesion v26 makes Scout a first-class navigation action on both desktop and mobile.

## Comparison and mobile experience

Prepared comparisons remain server rendered. Desktop retains the full evidence table; Platform Cohesion v26 progressively labels the same table and presents it as decision-point cards on narrow screens rather than forcing a desktop table into a mobile viewport. The original table semantics remain available for accessibility and no-JavaScript fallback behaviour.

## Retailer architecture

Retailer data remains separate from suitability logic. Platform Cohesion v26 reconciles the exact-model retailer rendering from Priority Commerce Depth v42 into the current account-governance chain.

Structured non-affiliate Australian retailer offers may be shown only when the product record carries an exact-model destination and verification metadata. Observed price or stock is date-stamped context, not a live feed or a claim of whole-of-market lowest price.

Amazon Australia records retain explicit exact-versus-search states. The Amazon Associates tag is `auproductguid-22`. Never invent an ASIN or construct an unverified exact product destination.

## Product imagery

APG maintains a governed photography registry. Genuine photography is publishable only where exact model identity, source, rights basis and verification are documented. Amazon Program Content additionally requires a verified matching Amazon pathway. Where authorised exact-model photography is unavailable, APG uses honest category-correct decision visuals rather than fabricated product photography.

The catalogue-wide genuine-photography rollout remains **PARTIAL** and must not be described as complete.

## Evidence and trust

APG guidance is primarily **desk-researched / specification-based** unless a page explicitly documents another testing status. Consequential claims should prefer:

1. exact Australian manufacturer product pages, manuals, support and warranty material;
2. exact Australian retailer evidence for local model/availability checks;
3. attributed independent professional evidence where appropriate;
4. consumer-feedback signals only where methodology and limitations are clear.

APG must not claim hands-on testing that did not occur. Product family, size and configuration differences must be disclosed where material.

## My APG, privacy and authentication

My APG remains **local-first** and usable without an account. Optional cross-device sync uses the APG Supabase project in Sydney with Row Level Security over user-owned tables and self-service export/deletion controls. Account status and communication preferences contribute zero product-recommendation points.

Google Analytics remains opt-in: analytics storage defaults to denied and the Google Analytics script loads only after the visitor allows analytics. Advertising storage and personalisation remain denied.

## Performance, accessibility and QA

Visual richness should come from efficient CSS, lawful imagery and progressive enhancement rather than unnecessary framework bundles or third-party scripts. Maintain keyboard-operable navigation/search, labelled forms, strong focus states, adequate touch targets, readable contrast, reduced-motion handling and no unintended horizontal overflow.

Platform Cohesion v26 adds dedicated regression QA for catalogue truth, integrated Research View, decision-aware search, exact retailer rendering, mobile comparison enhancement and non-fabrication controls. Existing catalogue, freshness, Decision Intelligence, account, platform-integrity and governance suites remain part of release discipline.

A release is not closed merely because code merged: reconcile GitHub `main`, Vercel Production, the canonical public site and APG Google Drive records.

## Governance

Australian Product Guide remains operationally separate from unrelated ventures, especially Australian Tradie Software Matcher. Product, retailer, price, imagery, freshness and authority claims must be truthful, sourceable and dated where material. Never invent testing, reviews, awards, partnerships, customers, rankings or commercial performance.
