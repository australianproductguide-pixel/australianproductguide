const assert=require('node:assert/strict');
const editorial=require('../lib/editorial-compliance');
const {categories,products}=require('../data');

const amazon=editorial.AMAZON_STATEMENT;
assert.equal(amazon,'As an Amazon Associate I earn from qualifying purchases.');

const starter=products.find(p=>p.evidenceTier==='starter');
assert.ok(starter,'Expected at least one starter-evidence product');
const starterHtml='<span>Reviewed 15 Aug 2026</span><dt>Last reviewed</dt><dd>15 August 2026</dd><p class="kicker">Why consider it</p><h2>Who this product is most likely to suit</h2><p>These are documented characteristics, not a claim of hands-on performance testing.</p>';
const starterOut=editorial.transform(starterHtml,`/products/${starter.slug}/`);
assert.match(starterOut,/Source identity checked/);
assert.match(starterOut,/starter-evidence decision signals/);
assert.doesNotMatch(starterOut,/Who this product is most likely to suit/);

const starterCategory=Object.values(categories).find(c=>c.products.length&&c.products.every(p=>(p.evidenceTier||c.evidenceTier)==='starter'));
if(starterCategory){
  const categoryHtml=`<span class="independence-badge">Reviewed 15 Aug 2026</span><p>This category contains ${starterCategory.products.length} maintained records reviewed against primary manufacturer evidence. Commercial relationships contribute zero recommendation points.</p><h3>${starterCategory.products.length} maintained products</h3><p>Reviewed against primary manufacturer evidence.</p>`;
  const categoryOut=editorial.transform(categoryHtml,`/categories/${starterCategory.slug}/`);
  assert.match(categoryOut,/Starter evidence/);
  assert.match(categoryOut,/deeper Australian manufacturer\/specification verification remains in progress/);
  assert.doesNotMatch(categoryOut,/reviewed against primary manufacturer evidence/i);
}

const affiliateOut=editorial.transform('<p><strong>As an Amazon Associate, Australian Product Guide may earn from qualifying purchases.</strong></p>','/affiliate-disclosure/');
assert.match(affiliateOut,/As an Amazon Associate I earn from qualifying purchases\./);
assert.match(affiliateOut,/paid links/i);

const privacyOut=editorial.transform('<main><p class="policy-lead">Privacy summary.</p></main>','/privacy/');
assert.match(privacyOut,/Google Analytics is opt-in/);
assert.match(privacyOut,/advertising storage and personalisation remain off/);

const updatesOut=editorial.transform('<main><p class="policy-lead">Updates.</p><h2 id="phase4">16 August 2026 — Phase 4 premium discovery release</h2></main>','/updates/');
assert.match(updatesOut,/17 August 2026 — editorial, compliance and discovery review/);
assert.match(updatesOut,/Historical · 16 August 2026/);

console.log(`Editorial compliance QA passed for ${products.length} products across ${Object.keys(categories).length} categories.`);
