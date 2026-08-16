const css=`
/* APG Footer v8.1 — compact Finder-inspired information architecture */
footer.apg-footer-v8{margin-top:56px!important;padding:0!important;background:#242223!important;color:#d7d5d3!important;border-top:0!important}
.apg-footer-v8 .footer-v8-inner{padding-top:30px;padding-bottom:24px}
.apg-footer-v8 .footer-v8-top{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}
.apg-footer-v8 .footer-v8-brand-main{display:inline-flex;align-items:center;gap:9px;text-decoration:none!important;color:#fff!important}
.apg-footer-v8 .footer-v8-brand-main img{width:30px;height:30px;display:block;flex:0 0 auto}
.apg-footer-v8 .footer-v8-brand-copy{display:block;color:#fff;font-size:16px;font-weight:760;letter-spacing:-.02em;line-height:1.2}
.apg-footer-v8 .footer-v8-country{display:inline-flex;align-items:center;gap:8px;min-width:136px;justify-content:space-between;border:1px solid rgba(255,255,255,.22);background:#fff;border-radius:8px;padding:9px 11px;color:#171717;font-size:12px;font-weight:700}
.apg-footer-v8 .footer-v8-country b{font-size:15px;line-height:1}
.apg-footer-v8 .footer-v8-nav{display:grid;grid-template-columns:1.15fr 1fr 1fr 1fr;gap:34px;padding:4px 0 30px}
.apg-footer-v8 .footer-v8-group{display:grid;align-content:start;gap:8px}
.apg-footer-v8 .footer-v8-group h3{margin:0 0 5px;color:#fff!important;font-size:12px!important;font-weight:760;text-transform:none;letter-spacing:0}
.apg-footer-v8 .footer-v8-group a{color:#f3f2f1!important;text-decoration:none;font-size:12px;line-height:1.45}
.apg-footer-v8 .footer-v8-group a:hover{text-decoration:underline;color:#fff!important}
.apg-footer-v8 .footer-v8-legalbar{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:15px 0;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16);font-size:11px;color:#ece9e7}
.apg-footer-v8 .footer-v8-legal{display:flex;gap:16px;flex-wrap:wrap}
.apg-footer-v8 .footer-v8-legal a{color:#fff!important;text-decoration:none}
.apg-footer-v8 .footer-v8-legal a:hover{text-decoration:underline}
.apg-footer-v8 .footer-v8-details{padding-top:22px;color:#b9b6b4;font-size:10.5px;line-height:1.55}
.apg-footer-v8 .footer-v8-details p{margin:0 0 10px;max-width:1160px}
.apg-footer-v8 .footer-v8-details strong{color:#dedbd9}
@media(max-width:900px){.apg-footer-v8 .footer-v8-nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 28px}}
@media(max-width:640px){.apg-footer-v8 .footer-v8-top{align-items:flex-start}.apg-footer-v8 .footer-v8-country{min-width:auto}.apg-footer-v8 .footer-v8-nav{grid-template-columns:1fr 1fr;gap:24px 20px}.apg-footer-v8 .footer-v8-legalbar{align-items:flex-start;flex-direction:column}.apg-footer-v8 .footer-v8-inner{padding-top:24px}}
@media(max-width:440px){.apg-footer-v8 .footer-v8-nav{grid-template-columns:1fr}.apg-footer-v8 .footer-v8-brand-main img{width:28px;height:28px}.apg-footer-v8 .footer-v8-brand-copy{font-size:15px}}
`;

function footer(){
  return `<footer class="apg-footer-v8" aria-label="Australian Product Guide footer"><div class="wrap footer-v8-inner"><div class="footer-v8-top"><a class="footer-v8-brand-main" href="/" aria-label="Australian Product Guide home"><img src="/assets/logo-dark.svg" alt=""><span class="footer-v8-brand-copy">Australian Product Guide</span></a><span class="footer-v8-country" aria-label="Australia"><span><b aria-hidden="true">🇦🇺</b>&nbsp;&nbsp;Australia</span><span aria-hidden="true">⌄</span></span></div><nav class="footer-v8-nav" aria-label="Footer navigation"><div class="footer-v8-group"><h3>Compare</h3><a href="/categories/">Browse categories</a><a href="/compare/">Compare products</a><a href="/categories/coffee-machines/finder/">Help Me Choose</a><a href="/brands/">Brands</a></div><div class="footer-v8-group"><h3>Discover</h3><a href="/guides/">Buying guides</a><a href="/search/">Search</a><a href="/decision-lab/">Decision Lab</a><a href="/my-apg/">My APG</a></div><div class="footer-v8-group"><h3>About us</h3><a href="/about/">About APG</a><a href="/methodology/">How we compare</a><a href="/editorial-standards/">Editorial standards</a><a href="/sources/">Sources</a></div><div class="footer-v8-group"><h3>Help &amp; transparency</h3><a href="/contact/">Contact</a><a href="/coverage/">Retailer &amp; catalogue coverage</a><a href="/affiliate-disclosure/">Affiliate disclosure</a><a href="/corrections-policy/">Corrections</a></div></nav><div class="footer-v8-legalbar"><span>© 2026 Australian Product Guide</span><div class="footer-v8-legal"><a href="/terms/">Terms</a><a href="/privacy/">Privacy</a><a href="/affiliate-disclosure/">Affiliate disclosure</a><a href="/sitemap/">Sitemap</a></div></div><div class="footer-v8-details"><p>Australian Product Guide is an Australian-focused product comparison and buying guidance service. We compare products using published specifications, manufacturer information, retailer data and other credible sources. Unless explicitly stated otherwise, our guidance is desk-researched and does not represent hands-on laboratory or long-term product testing.</p><p><strong>As an Amazon Associate, Australian Product Guide may earn from qualifying purchases.</strong> Affiliate relationships, retailer participation and commission do not increase a product's suitability, ranking or recommendation score. Product specifications, prices, sellers and availability can change; confirm current information with the manufacturer or retailer before buying.</p><p>All rights reserved.</p></div></div></footer>`;
}

function enhance(html){
  if(!html||!html.includes('<footer>'))return html;
  return html.replace(/<footer>[\s\S]*?<\/footer>/,footer());
}

module.exports={enhance,footer,footerV8Css:css};
