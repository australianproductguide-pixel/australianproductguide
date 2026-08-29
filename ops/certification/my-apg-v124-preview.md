# My APG v124 certification preview

Purpose: trigger one deliberate Vercel Preview for the incident-safe My APG v124 release after the 29 Aug 2026 v123 Production rollback.

This file is non-runtime evidence only. It does not alter application behaviour.

Required Preview checks: repeated `/` requests, `/my-apg/`, `/my-apg/?account=login`, `/my-apg/?account=signup`, `/decision-lab/`, `/deals/`, v124 CSS/JS delivery, server-mediated account ownership, legacy direct-browser account panel absence, and runtime 5xx/error/fatal review.
