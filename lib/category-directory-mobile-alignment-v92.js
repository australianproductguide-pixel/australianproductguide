'use strict';

// APG Category Directory Mobile Alignment v92.0
//
// Narrow presentation-only correction for /categories/ on mobile. The category
// directory inherits a legacy responsive flex rule that can make "Browse category"
// expand or drift toward the centre when "Help me choose" wraps. This layer resets
// those action controls to intrinsic widths and pins both controls to the left edge
// of the category-card copy at every mobile line break.
//
// No category data, ordering, imagery, recommendation logic, affiliate behaviour,
// analytics, SEO metadata or destination URLs are changed.
const downstream=require('./brand-mark-canonical-parity-v91');

const VERSION='92.0';
const CSS_PATH='/assets/category-directory-mobile-alignment-v92.css';
const ORIGIN='https://australianproductguide.au';

const css=`
/* APG Category Directory Mobile Alignment v92 */
@media (max-width:720px){
  html body[data-apg-category-index-images="v61"] .category-grid .category-card .card-actions{
    display:flex!important;
    flex-direction:row!important;
    flex-wrap:wrap!important;
    align-items:center!important;
    align-content:flex-start!important;
    justify-content:flex-start!important;
    width:100%!important;
    max-width:none!important;
    margin:10px 0 0!important;
    padding:0!important;
    gap:8px 12px!important;
    text-align:left!important;
  }

  html body[data-apg-category-index-images="v61"] .category-grid .category-card .card-actions .button.secondary{
    flex:0 0 auto!important;
    width:auto!important;
    min-width:0!important;
    max-width:100%!important;
    margin:0!important;
    margin-inline:0!important;
    align-self:flex-start!important;
  }

  html body[data-apg-category-index-images="v61"] .category-grid .category-card .card-actions .text-link{
    flex:0 0 auto!important;
    width:auto!important;
    min-width:0!important;
    max-width:100%!important;
    margin:0!important;
    margin-inline:0!important;
    align-self:flex-start!important;
    justify-content:flex-start!important;
    text-align:left!important;
  }
}

/* Very narrow phones: allow wrapping naturally, but never centre either action. */
@media (max-width:390px){
  html body[data-apg-category-index-images="v61"] .category-grid .category-card .card-actions{
    align-items:flex-start!important;
    justify-content:flex-start!important;
  }
}
`;

function isCategoryDirectory(path){return String(path||'')==='/categories/';}

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Category-Directory-Mobile-Alignment','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function inject(html){
  const out=String(html||'');
  if(out.includes('name="apg-category-directory-mobile-alignment"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-category-directory-mobile-alignment" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`
  );
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===CSS_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendCss(req,res);
  if(!isCategoryDirectory(path))return downstream(req,res);

  res.setHeader('X-APG-Category-Directory-Mobile-Alignment','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=inject(original);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    res.setHeader('X-APG-Category-Directory-Mobile-Alignment','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  CATEGORY_DIRECTORY_MOBILE_ALIGNMENT_VERSION:VERSION,
  CATEGORY_DIRECTORY_MOBILE_ALIGNMENT_CSS_PATH:CSS_PATH,
  categoryDirectoryMobileAlignmentCss:css,
  isCategoryDirectory,
  injectCategoryDirectoryMobileAlignment:inject
});

module.exports=handler;
