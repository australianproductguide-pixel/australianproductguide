// Emergency runtime restoration — 2026-08-19.
// Scout Concierge v5 source remains in-repo for repair and re-validation, but the
// governing Production runtime is restored to the last known-good Auth Password
// Policy v36.1 chain so the SSR site remains available while Scout v5 is corrected.
module.exports=require('../lib/auth-password-policy-v361');
