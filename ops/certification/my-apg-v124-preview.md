# My APG v124 certification preview

Purpose: trigger the final exact-SHA Vercel Preview for the incident-safe My APG v124 release after the 29 Aug 2026 v123 Production rollback.

This file is non-runtime evidence only. It does not alter application behaviour.

Final certification additionally requires the build-time P0 server smoke gate to pass: eight repeated `/` requests plus `/my-apg/`, login/signup deep links, Decision Lab, Deals and all v124 account assets.

Required Preview/release checks: server-mediated account ownership, legacy direct-browser account panel retired, no new response wrapper, v124 CSS/JS delivery, repeated cross-route runtime health and no new 5xx/error/fatal condition. Existing Issue #348 Amazon/Deals assurance failures remain separate and must not be weakened.
