const assert=require('node:assert/strict');
const editorial=require('../lib/editorial-compliance');
const {categories,products}=require('../data');
assert.equal(editorial.AMAZON_STATEMENT,'As an Amazon Associate I earn from qualifying purchases.');
const starter=products.find(p=>p.evidenceTier==='starter');assert.ok(starter,'Expected starter-evidence product');
let out=editorial.transform('<span>Reviewed 15 Aug 2026</span><dt>Last reviewed</dt><dd>15 August 2026</dd><p class="kicker">Why consider it</p><h2>Who this product is most likely to suit</h2><p>These are documented characteristics, not a claim of hands-on performance testing.</p>',`/products/${starter.slug}/`);
assert.match(out,/Source identity checked/);assert.match(out,/starter-evidence decision signals/);assert.doesNotMatch(out,/Who this product is most likely to suit/);
const c=Object.values(categories).find(x=>x.products.length&&x.products.every(p=>(p.evidenceTier||x.evidenceTier)==='starter'));
if(c){out=editorial.transform(`<span class="independence-badge">Reviewed 15 Aug 2026</span><p>This category contains ${c.products.length} maintained records reviewed against primary manufacturer evidence. Commercial relationships contribute zero recommendation points.</p><h3>${c.products.length} maintained products</h3><p>Reviewed against primary manufacturer evidence.</p>`,`/categories/${c.slug}/`);assert.match(out,/Starter evidence/);assert.match(out,/verification remains in progress/);assert.doesNotMatch(out,/reviewed against primary manufacturer evidence/i);}
out=editorial.transform('<p><strong>As an Amazon Associate, Australian Product Guide may earn from qualifying purchases.</strong></p>','/affiliate-disclosure/');assert.match(out,/As an Amazon Associate I earn from qualifying purchases\./);assert.match(out,/paid links/i);
out=editorial.transform('<main><p class="policy-lead">Privacy summary.</p></main>','/privacy/');assert.match(out,/Google Analytics is opt-in/);assert.match(out,/advertising storage and personalisation remain off/);
out=editorial.transform('<main><p class="policy-lead">Updates.</p><h2 id="phase4">16 August 2026 — Phase 4 premium discovery release</h2></main>','/updates/');assert.match(out,/17 August 2026 — editorial, compliance and discovery review/);assert.match(out,/Historical · 16 August 2026/);
console.log(`Editorial compliance QA passed for ${products.length} products across ${Object.keys(categories).length} categories.`);
