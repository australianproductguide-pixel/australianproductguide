'use strict';

// APG Review Profiles v118.1.
// Presentation-only trust layer. Makes APG's external consumer-review profiles easy to
// inspect from the global About & trust navigation, the active marketplace drawer and
// the footer. These destinations do not influence product eligibility, recommendation
// scoring, retailer ranking or evidence.
const VERSION='118.1';
const TRUSTPILOT_URL='https://au.trustpilot.com/review/australianproductguide.au';
const PRODUCTREVIEW_URL='https://www.productreview.com.au/listings/australian-product-guide';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function externalTrustLink(label,href){
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} for Australian Product Guide (opens in a new tab)"><span>${esc(label)}</span><span aria-hidden="true">↗</span></a>`;
}

function footerLink(label,href){
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="Australian Product Guide on ${esc(label)} (opens in a new tab)">${esc(label)}</a>`;
}

function drawerExternalLink(label,href){
  return `<a class="apg-drawer-link apg-drawer-link-v1225" data-apg-review-profile-drawer="true" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} for Australian Product Guide (opens in a new tab)"><span>${esc(label)}</span><span aria-hidden="true">↗</span></a>`;
}

function addDesktopReviewProfiles(html){
  return String(html||'').replace(/(<details\b[^>]*data-apg-about-trust[^>]*>[\s\S]*?<div\b[^>]*class=["'][^"']*\bapg-about-trust-popover\b[^"']*["'][^>]*>)([\s\S]*?)(<\/details>)/i,(match,open,inside,close)=>{
    if(inside.includes(PRODUCTREVIEW_URL)&&inside.includes(TRUSTPILOT_URL))return match;
    const section=`<section class="apg-about-trust-reviews"><h3>Review profiles</h3>${externalTrustLink('ProductReview.com.au',PRODUCTREVIEW_URL)}${externalTrustLink('Trustpilot',TRUSTPILOT_URL)}</section>`;
    const contact=/<section\b[^>]*class=["'][^"']*\bapg-about-trust-contact\b[^"']*["'][^>]*>/i;
    if(contact.test(inside))inside=inside.replace(contact,`${section}$&`);
    else inside=inside.replace(/<\/div>\s*<\/div>\s*$/i,`${section}$&`);
    return `${open}${inside}${close}`;
  });
}

function mobileExternalLink(label,href){
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} for Australian Product Guide (opens in a new tab)"><span>${esc(label)}</span><span aria-hidden="true">↗</span></a>`;
}

function addMobileReviewProfiles(html){
  return String(html||'').replace(/(<nav\b[^>]*id=["']mobileNav["'][^>]*>)([\s\S]*?)(<\/nav>)/i,(match,open,inside,close)=>{
    if(inside.includes(PRODUCTREVIEW_URL)&&inside.includes(TRUSTPILOT_URL))return match;
    const links=`${mobileExternalLink('ProductReview.com.au',PRODUCTREVIEW_URL)}${mobileExternalLink('Trustpilot',TRUSTPILOT_URL)}`;
    const corrections=/(<a\b[^>]*href=["']\/corrections-policy\/["'][^>]*>[\s\S]*?<\/a>)/i;
    if(corrections.test(inside))inside=inside.replace(corrections,`$1${links}`);
    else {
      const aboutSection=/(<details\b[^>]*class=["'][^"']*\bmobile-section\b[^"']*["'][^>]*>\s*<summary>\s*About\s*&(?:amp;)?\s*trust\s*<\/summary>\s*<div>)([\s\S]*?)(<\/div>\s*<\/details>)/i;
      if(aboutSection.test(inside))inside=inside.replace(aboutSection,`$1$2${links}$3`);
    }
    return `${open}${inside}${close}`;
  });
}

// Header Marketplace v122.5+ uses apgAllDrawer as the real hamburger/supermenu surface.
// Keep the older mobileNav integration above for compatibility, but also place the same
// review destinations inside the canonical About & trust drawer section so real-device
// mobile navigation exposes them instead of only carrying them in the legacy nav markup.
function addDrawerReviewProfiles(html){
  return String(html||'').replace(/(<aside\b[^>]*id=["']apgAllDrawer["'][^>]*>)([\s\S]*?)(<\/aside>)/i,(match,open,inside,close)=>{
    const trustSection=/(<section\b[^>]*data-apg-supermenu-section=["']trust["'][^>]*>)([\s\S]*?)(<\/section>)/i;
    if(!trustSection.test(inside))return match;
    inside=inside.replace(trustSection,(sectionMatch,sectionOpen,sectionInside,sectionClose)=>{
      const links=[];
      if(!sectionInside.includes(PRODUCTREVIEW_URL))links.push(drawerExternalLink('ProductReview.com.au',PRODUCTREVIEW_URL));
      if(!sectionInside.includes(TRUSTPILOT_URL))links.push(drawerExternalLink('Trustpilot',TRUSTPILOT_URL));
      if(!links.length)return sectionMatch;
      return `${sectionOpen}${sectionInside}${links.join('')}${sectionClose}`;
    });
    return `${open}${inside}${close}`;
  });
}

function addFooterReviewProfiles(html){
  return String(html||'').replace(/<footer\b[\s\S]*?<\/footer>/i,footer=>{
    if(footer.includes(PRODUCTREVIEW_URL))return footer;
    const productReview=footerLink('ProductReview.com.au',PRODUCTREVIEW_URL);
    const trustpilotPattern=new RegExp(`(<a\\b[^>]*href=["']${TRUSTPILOT_URL.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*>[\\s\\S]*?<\\/a>)`,'i');
    if(trustpilotPattern.test(footer))return footer.replace(trustpilotPattern,`$1${productReview}`);
    const supportHeading=/(<h[2-6]\b[^>]*>\s*Support\s*<\/h[2-6]>)/i;
    if(supportHeading.test(footer))return footer.replace(supportHeading,`$1${footerLink('Trustpilot',TRUSTPILOT_URL)}${productReview}`);
    return footer.replace(/<\/footer>\s*$/i,`<div class="apg-review-profile-footer-links">${footerLink('Trustpilot',TRUSTPILOT_URL)}${productReview}</div></footer>`);
  });
}

function transformHtml(html){
  let out=String(html||'');
  if(!out)return out;
  out=addDesktopReviewProfiles(out);
  out=addMobileReviewProfiles(out);
  out=addDrawerReviewProfiles(out);
  out=addFooterReviewProfiles(out);
  return out;
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Review profiles require downstream handler');
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformHtml(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Review-Profiles','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{REVIEW_PROFILES_VERSION:VERSION,TRUSTPILOT_URL,PRODUCTREVIEW_URL});
  return handler;
}

module.exports={VERSION,TRUSTPILOT_URL,PRODUCTREVIEW_URL,externalTrustLink,footerLink,drawerExternalLink,addDesktopReviewProfiles,addMobileReviewProfiles,addDrawerReviewProfiles,addFooterReviewProfiles,transformHtml,wrap};
