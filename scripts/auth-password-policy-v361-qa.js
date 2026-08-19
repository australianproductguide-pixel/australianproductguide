const assert=require('assert');
const policy=require('../lib/auth-password-policy-v361');
const {runtimeChainIncludes}=require('./runtime-chain-qa');

assert(runtimeChainIncludes('auth-password-policy-v361'),'active runtime chain must include auth-password-policy-v361');
assert(policy.passwordPolicy('APG-Strong-2026!').ok,'strong password must pass');
for(const weak of ['short1!A','alllowercase123!','ALLUPPERCASE123!','NoNumberPassword!','NoSymbolPassword123']){
  assert(!policy.passwordPolicy(weak).ok,`weak password must fail: ${weak}`);
}
assert.equal(policy.requestHost({headers:{host:'australianproductguide.au'}}),'australianproductguide.au','canonical host must resolve');
assert.equal(policy.requestHost({headers:{host:'australianproductguide.au:443'}}),'australianproductguide.au','canonical host port must be normalised');
assert.equal(policy.originAllowed({headers:{origin:'https://example.invalid',host:'australianproductguide.au'}}),false,'canonical host must reject a foreign Origin without depending on VERCEL_ENV');
assert.equal(policy.originAllowed({headers:{origin:'https://example.invalid','x-forwarded-host':'australianproductguide.au'}}),false,'canonical forwarded host must reject a foreign Origin');
assert.equal(policy.originAllowed({headers:{origin:'https://australianproductguide.au',host:'australianproductguide.au'}}),true,'canonical same-origin mutation must remain allowed');
assert.equal(policy.originAllowed({headers:{host:'australianproductguide.au'}}),true,'requests without Origin remain compatible for server-side and same-site flows');
const fixture='<label>Password<input type="password" name="password" autocomplete="current-password" minlength="8" required></label> <label>New password<input type="password" name="password" autocomplete="new-password" minlength="8" required></label> '+"q('[data-account-form] input[name=password]',root).autocomplete=mode==='signup'?'new-password':'current-password';";
const strengthened=policy.strengthenAccountAsset(fixture);
assert(strengthened.includes('autocomplete="new-password" minlength="12"'),'new-password UI must require 12 characters');
assert(strengthened.includes("passwordInput.minLength=12"),'signup mode must upgrade the minimum to 12');
assert(strengthened.includes("passwordInput.minLength=8"),'login mode must preserve existing-password compatibility');
assert(strengthened.includes(policy.PASSWORD_RULE_MESSAGE),'consumer password guidance must be present');
console.log('APG auth password policy v36.1 QA passed');
