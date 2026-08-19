// APG Auth Password Policy v36.1 is the current governing runtime wrapper.
// It adds stronger no-cost signup/password-change validation while preserving login
// compatibility for existing accounts and all current presentation, decision, commerce,
// privacy and SSR-first behaviour underneath.
// Runtime chain: auth-password-policy-v361 -> brand-conformity-v352 -> brand-conformity-v351 -> brand-conformity-v35 -> brand-conformity-v34.1 -> brand-fidelity-v325 -> brand-fidelity-v324 -> brand-fidelity-v323 -> brand-fidelity-v322 -> brand-fidelity-v321 -> brand-fidelity-v32 -> premium-theme-v311 -> premium-theme-v31 -> premium-brand-v30 -> amazon-conversion-v29.
module.exports=require('../lib/auth-password-policy-v361');
