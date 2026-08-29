'use strict';

// APG Trustpilot Footer v117.0.
// Presentation-only trust-surface layer. Adds APG's claimed Trustpilot profile to the
// existing footer Support navigation without changing recommendation, retailer or shopper state.
const VERSION='117.0';
const TRUSTPILOT_URL='https://au.trustpilot.com/review/australianproductguide.au';

function trustpilotLink(){
  return `<a href="${TRUSTPILOT_URL}" target="_blank" rel="noopener noreferrer" aria-label="Australian Product Guide on Trustpilot (opens in a new tab)">Trustpilot</a>`;
}

function addToFooter(footer){
  if(!footer||footer.includes(TRUSTPILOT_URL))return footer;
  const link=trustpilotLink();

  // Preferred placement: first item in the existing Support group.
  const supportHeading=/(<h[2-6]\b[^>]*>\s*Support\s*<\/h[2-6]>)/i;
  if(supportHeading.test(footer))return footer.replace(supportHeading,`$1${link}`);

  // Compatibility fallback for older footer markup: place beside the Contact destination.
  const contact=/(<a\b[^>]*href=["']\/contact\/?["'][^>]*>[\s\S]*?<\/a>)/i;
  if(contact.test(footer))return footer.replace(contact,`$1${link}`);

  // Fail visibly but safely if the footer structure changes unexpectedly.
  return footer.replace(/<\/footer>\s*$/i,`<div class="apg-trustpilot-footer-link">${link}</div></footer>`);
}

function transformHtml(html){
  const source=String(html||'');
  if(!source||source.includes(TRUSTPILOT_URL))return source;
  return source.replace(/<footer\b[\s\S]*?<\/footer>/i,addToFooter);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Trustpilot footer requires downstream handler');
  function handler(req,res){
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformHtml(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Trustpilot-Footer','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{TRUSTPILOT_FOOTER_VERSION:VERSION,TRUSTPILOT_URL});
  return handler;
}

function install(wholeSiteExperience){
  if(!wholeSiteExperience||typeof wholeSiteExperience.wrap!=='function')throw new TypeError('v117 requires Whole-Site v109 wrapper factory');
  if(wholeSiteExperience.TRUSTPILOT_FOOTER_V117_INSTALLED)return wholeSiteExperience;
  const wholeSiteWrap=wholeSiteExperience.wrap.bind(wholeSiteExperience);
  wholeSiteExperience.wrap=function trustpilotAwareWholeSiteWrap(downstream){return wholeSiteWrap(wrap(downstream));};
  wholeSiteExperience.TRUSTPILOT_FOOTER_V117_INSTALLED=true;
  wholeSiteExperience.TRUSTPILOT_FOOTER_VERSION=VERSION;
  return wholeSiteExperience;
}

module.exports={VERSION,TRUSTPILOT_URL,trustpilotLink,addToFooter,transformHtml,wrap,install};
