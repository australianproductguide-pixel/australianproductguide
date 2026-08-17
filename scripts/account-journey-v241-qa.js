const assert=require('assert');
const fs=require('fs');
const path=require('path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

const wrapper=read('lib/account-profile-v24.js');
const journey=read('public/assets/account-journey-v241.js');
const account=read('lib/account-platform.js');

assert(wrapper.includes("JOURNEY_JS='/assets/account-journey-v241.js?v=24.1'"),'v24 wrapper must version and inject the v24.1 journey asset');
assert(wrapper.includes('if(!out.includes(JOURNEY_JS))'),'journey asset must be injected idempotently');
assert(wrapper.includes("resend.status===429"),'confirmation resend should provide a rate-limit-safe customer message');
assert(wrapper.includes('Deliberately generic to avoid account enumeration'),'confirmation resend must remain enumeration-resistant');

assert(journey.includes("new URLSearchParams(location.search).get('account')"),'customer journey must honour account=signup/login links');
assert(journey.includes("[data-account-tab=\"${mode}\"]"),'requested account mode must activate the matching existing tab');
assert(journey.includes('clearAccountParam()'),'account mode query should be cleaned after it is applied');
assert(journey.includes('Confirm password'),'signup should include a confirmation-password field');
assert(journey.includes("name=\"confirm_password\""),'confirmation-password field must have a distinct name');
assert(journey.includes("password!==confirm"),'signup must block mismatched passwords before the base signup request');
assert(journey.includes("event.stopPropagation()"),'invalid signup must not fall through to the existing submit handler');
assert(journey.includes('Terms of use')&&journey.includes('Privacy Policy'),'signup must clearly link account terms and privacy information');
assert(journey.includes('Australian Consumer Law rights are not limited'),'signup legal note must preserve mandatory consumer rights');
assert(!journey.includes('access_token')&&!journey.includes('refresh_token'),'journey enhancement must not handle authentication tokens');

assert(account.includes('href="/my-apg/?account=signup"')||read('public/assets/account-profile-v24.js').includes('data-account-tab="signup"'),'signup journey must retain an explicit create-account route/tab');
console.log('My APG account journey v24.1 QA passed');
