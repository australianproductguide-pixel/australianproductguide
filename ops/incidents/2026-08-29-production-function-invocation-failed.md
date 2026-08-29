# APG Production Incident — 29 Aug 2026

Status: P0 rollback initiated

At approximately 20:10 AEST, the Production deployment for My APG v123.0 began returning Vercel FUNCTION_INVOCATION_FAILED 500 responses on the homepage. Production runtime logs confirmed repeated GET / 500 responses on deployment dpl_DRkJGksDPoquwAnybvC8LcGR9zTU.

Immediate action: restore the last known-good source state at d7428f8baf3d7735a2cfcd80f822fb71af3ee8f0 and redeploy it to Production before further diagnosis.

This incident record is intentionally non-runtime and exists to trigger a clean Production deployment from the restored source while preserving an audit trail.
