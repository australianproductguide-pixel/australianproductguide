'use strict';

function enhancePrimary(html){
  if(!html||html.includes('data-shopping-primary'))return html;
  return html.replace('<a href="/retailers/">Retailers</a><a class="nav-trust" href="/methodology/">How we compare</a>','<a href="/retailers/">Retailers</a><a data-shopping-primary href="/deals/">Deals</a><a class="nav-trust" href="/methodology/">How we compare</a>');
}

function enhanceMega(html){
  if(!html||html.includes('data-shopping-mega'))return html;
  return html.replace('<nav aria-label="More product research"><a href="/compare/">Compare products</a>','<nav aria-label="More product research"><a data-shopping-mega href="/deals/">Deals &amp; shopping</a><a href="/deals/#today-deals">Today’s Deals</a><a href="/deals/#best-sellers">Best Sellers</a><a href="/compare/">Compare products</a>');
}

function enhanceMobile(html){
  if(!html||html.includes('data-mobile-shopping'))return html;
  const marker='<details class="mobile-section"><summary>Popular products</summary>';
  const deals='<details class="mobile-section apg-mobile-shopping" data-mobile-shopping><summary>Deals &amp; offers</summary><div><a href="/deals/">All deals &amp; shopping<span aria-hidden="true">→</span></a><a href="/deals/#today-deals">Today’s Deals<span aria-hidden="true">→</span></a><a href="/deals/#best-sellers">Best Sellers<span aria-hidden="true">→</span></a><a href="/deals/#under-25">Under $25<span aria-hidden="true">→</span></a><a href="/deals/#subscribe-save">Subscribe &amp; Save<span aria-hidden="true">→</span></a></div></details>';
  return html.includes(marker)?html.replace(marker,deals+marker):html;
}

function enhanceFooter(html){
  if(!html||html.includes('data-footer-shopping'))return html;
  const marker='<div class="footer-v11-group"><h3>Connect</h3><a href="/search/">Search APG</a>';
  const replacement='<div class="footer-v11-group" data-footer-shopping><h3>Explore &amp; shop</h3><a href="/deals/">Deals &amp; shopping</a><a href="/deals/#today-deals">Today’s Deals</a><a href="/deals/#best-sellers">Best Sellers</a><a href="/search/">Search APG</a>';
  return html.includes(marker)?html.replace(marker,replacement):html;
}

function enhance(html){
  let out=String(html||'');
  out=enhancePrimary(out);
  out=enhanceMega(out);
  out=enhanceMobile(out);
  out=enhanceFooter(out);
  return out;
}

const css=`
/* APG shopping shell v39 */
.apg-mega-footer nav a[data-shopping-mega]{background:#fff5dd;color:#7a5015;font-weight:820}.apg-mobile-shopping summary{color:#7a5015!important}.apg-mobile-shopping a:first-child{font-weight:800!important}
`;

module.exports={enhance,css};
